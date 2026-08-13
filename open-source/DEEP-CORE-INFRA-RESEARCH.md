# Deep Core Infrastructure Research: Graphiti, Temporal, DataHub

**Research Date:** 2026-08-13
**Mandate:** NO PAID DEPENDENCIES. Only truly open-source components.
**Status:** Deep research complete. Recommendations included.

---

## Table of Contents

1. [Graphiti Deep Analysis](#1-graphiti---temporal-context-graph-engine)
2. [Temporal Deep Analysis](#2-temporal---durable-execution-platform)
3. [DataHub Deep Analysis](#3-datahub---metadata-platform)
4. [Open-Source Purity Verdicts](#4-open-source-purity-verdicts)
5. [Integration Architecture](#5-integration-architecture)
6. [V1 vs V2 Recommendation](#6-v1-vs-v2-recommendation)
7. [Final Recommendations](#7-final-recommendations)

---

## 1. Graphiti - Temporal Context Graph Engine

**Repository:** https://github.com/getzep/graphiti
**License:** Apache 2.0
**Stars:** ~29,900
**Commits:** 942+
**Latest Version:** v0.28.0
**Maintained by:** Zep AI (commercial entity behind the open-source project)

### 1.1 Core Data Model

Graphiti's context graph contains four primary components:

| Component | Description | Purpose |
|-----------|-------------|---------|
| **Entities (Nodes)** | People, products, policies, concepts | Core objects with summaries that evolve over time |
| **Facts/Relationships (Edges)** | Triplets with temporal validity windows | When facts became true and when they were superseded |
| **Episodes (Provenance)** | Raw ingested data | Ground truth; every derived fact traces back here |
| **Custom Types (Ontology)** | Developer-defined entity and edge types via Pydantic | Domain-specific schema enforcement |

### 1.2 Temporal Facts - How They Work

This is Graphiti's differentiating architecture. Unlike vector memory (which stores embeddings of text chunks with no temporal semantics), Graphiti stores **facts as first-class citizens with validity windows**.

**Bi-temporal Tracking:**
- `valid_from` - When a fact became true in the real world
- `valid_until` - When a fact was superseded or invalidated
- Facts are **never deleted** - they are invalidated when contradicted by new information
- Enables querying the graph at any point in time ("What did we know about X on date Y?")

**Invalidation/Supersession:**
- When new information contradicts an existing fact, Graphiti automatically marks the old fact's `valid_until` timestamp
- New fact is created with a new `valid_from`
- This preserves complete historical context
- Example: "User lives in Dubai" (valid_from: 2024-01) gets superseded by "User lives in London" (valid_from: 2025-06), automatically setting valid_until on the Dubai fact

**Why This Is Different from Vector Memory:**
- Vector memory (e.g., Chroma, Pinecone) stores text chunks as embeddings - no structure, no relationships, no temporal semantics
- Vector memory has no concept of "this fact replaced that fact"
- Vector memory cannot answer "What was true at time T?"
- Graphiti maintains structured relationships between entities with temporal validity
- Retrieval is sub-second with no LLM calls at query time (P95: 300ms per Zep benchmarks)

### 1.3 Ontology: Prescribed vs Learned

**Prescribed Ontology (Recommended for Production):**
```python
from pydantic import BaseModel
from graphiti_core.nodes import EntityNode

class Customer(BaseModel):
    name: str
    tier: str
    region: str

class OwnsProduct(BaseModel):
    product_name: str
    purchase_date: str
```
- Developer defines entity types and edge types as Pydantic models
- `edge_type_map` defines which edge types can exist between specific entity type pairs
- If an entity pair doesn't have a defined edge type mapping, a generic `RELATES_TO` type is used
- Graphiti validates extracted entities against the Pydantic models
- Custom attributes are extracted and stored

**Learned Ontology (Automatic):**
- Graphiti automatically builds ontology based on incoming data
- De-duplicates nodes and labels edge relationships consistently
- Suitable for exploratory/prototyping phases
- Less precise than prescribed ontology

### 1.4 Hybrid Search Architecture

Graphiti combines three search modalities, with no LLM calls at retrieval time:

1. **Semantic Embeddings** - Vector similarity search on node/edge summaries
2. **BM25 Keyword Search** - Traditional full-text search for exact term matching
3. **Graph Traversal** - Walking the graph structure to find connected entities
4. **Result Reranking** - Uses graph distance to rerank combined results

This is production-validated: Zep's retrieval stack achieves P95 latency of 300ms. On LongMemEval using GPT-4o, Zep (powered by Graphiti) scores 63.8% vs Mem0's 49.0%.

### 1.5 Graph Storage Backends

| Backend | License | Status | Notes |
|---------|---------|--------|-------|
| **Neo4j 5.26+** | GPLv3 (Community) | Primary, fully supported | **LICENSE CONCERN** - see section 1.7 |
| **FalkorDB 1.1.2+** | **SSPLv1** | Fully supported | **NOT OPEN SOURCE** - SSPL is rejected by OSI |
| **Amazon Neptune** | Proprietary AWS | Supported | Cloud-only, vendor lock-in |
| **Kuzu 0.11.2** | MIT | **Deprecated** | Upstream unmaintained |
| **PostgreSQL (community)** | PostgreSQL License | Alpha/Experimental | Via graphiti-postgres (2 stars, 14 commits) |

### 1.6 Python API - Public Interface

```bash
pip install graphiti-core
# With extras:
pip install graphiti-core[falkordb,anthropic,google-genai]
```

**Requirements:** Python 3.10+, LLM API key (OpenAI default, also Anthropic, Gemini, Groq), Graph database instance

**Key Methods:**
- `add_episode()` - Ingest text, messages, or JSON; extracts entities and relationships
- `add_episode_bulk()` - Batch ingestion for large datasets
- `search()` - Basic search returning EntityEdge objects
- `_search()` - Advanced search returning SearchResults (edges, nodes, episodes, communities)
- `retrieve_episodes()` - Fetch previous episodes for context

**Concurrency Control:**
- `SEMAPHORE_LIMIT` env var (default: 10) manages concurrent LLM operations
- Prevents 429 rate-limit errors during ingestion

### 1.7 The Neo4j License Problem - CRITICAL

**Neo4j Community Edition is GPLv3.** This is a significant concern for an open-source-first platform:

- GPLv3 is **copyleft** - any derivative work must also be GPLv3
- If the platform embeds Neo4j and is distributed/offered as SaaS, the entire application's source code may need to be open-sourced under GPLv3
- There are ongoing legal disputes (as of 2025) about Neo4j's licensing practices
- Neo4j Enterprise is proprietary (commercial license required)

**Impact Assessment:**
- For a platform that will be deployed as self-hosted or SaaS, GPLv3 creates viral licensing obligations
- This is not a blocker for a fully open-source platform (if the platform itself is open source)
- BUT it constrains licensing choices - the platform cannot use MIT/Apache if Neo4j Community is embedded
- **If the platform is Apache 2.0 licensed, embedding GPLv3 Neo4j is license-incompatible**

**FalkorDB is NOT a solution** - SSPLv1 is not OSI-approved open source.

### 1.8 Apache AGE as Alternative Backend

**Apache AGE** (Apache License 2.0) is a PostgreSQL extension for graph queries:
- Apache Software Foundation Top-Level Project since May 2022
- Supports PostgreSQL 11-18
- Cypher query language support via `cypher()` SQL function wrapper
- Inherits PostgreSQL's transactional guarantees (ACID)
- **License: Apache 2.0** - fully compatible with open-source-first mandate

**Community PostgreSQL Driver for Graphiti:**
- Repository: https://github.com/uahic/graphiti-postgres
- Status: **ALPHA** - "EXPERIMENTAL IMPLEMENTATION IN ALPHA VERSION"
- 2 stars, 14 commits, 0 forks
- Implements full GraphDriver interface for both pure PostgreSQL and Apache AGE
- Multi-tenancy support, bi-temporal tracking, hybrid search
- Maintainers recommended keeping AGE as a separate driver

**Assessment:** Apache AGE is the right long-term backend for this platform, but the Graphiti driver is not production-ready. This would require investment to stabilize.

### 1.9 MCP Server

The Graphiti MCP server exposes knowledge graph operations via Model Context Protocol:

**Tools Available:**
- `add_episode` - Add text/messages/JSON to the graph
- `search_facts` - Semantic search for facts (edges)
- `search_nodes` - Search entity nodes
- `get_episodes` - Retrieve episodes
- Episode deletion, group management, graph maintenance (clear, rebuild indices)

**Transport:** HTTP at `/mcp/` endpoint (port 8000)
**Built-in Entity Types:** Preference, Requirement, Procedure, Location, Event, Person, Organization, Document, Topic, Object

### 1.10 Multi-Tenancy

- All nodes and edges contain a `group_id` field for data partitioning
- Logical isolation within a single database instance
- `@handle_multiple_group_ids` decorator routes queries to correct graph instance
- FalkorDB supports dedicated graph instances per agent sharing compute resources
- Neo4j multi-tenancy via database names (since v0.17.0)

### 1.11 Scaling and Performance

- Incremental processing - no batch recomputation required
- Sub-second retrieval with no LLM calls at query time
- P95 retrieval latency: ~300ms (Zep production benchmarks)
- LLM calls happen only during ingestion (entity extraction, relationship building)
- Neo4j scaling: works well up to ~10M edges; performance degrades beyond that without Infinigraph architecture (Enterprise only)
- **NEEDS VERIFICATION:** Maximum graph size tested with Graphiti specifically

### 1.12 Production Readiness

- Powers Zep's managed infrastructure (millions of context graphs)
- No public case studies of companies self-hosting Graphiti in production (outside of Zep)
- Zep is the primary production validator
- 29.9k GitHub stars indicates strong community interest
- Active development with 942+ commits
- **NEEDS VERIFICATION:** Other companies using Graphiti in production at scale

### 1.13 Concurrent Writes from Multiple Agents

- Semaphore-based concurrency limiting (default: 10 concurrent LLM operations)
- group_id isolation prevents cross-agent data contamination
- FalkorDB integration provides dedicated graph instances per agent
- **NEEDS VERIFICATION:** Behavior under heavy concurrent write load from many agents writing to the same group_id
- Graph databases generally handle concurrent reads well but concurrent writes need careful management

---

## 2. Temporal - Durable Execution Platform

**Repository:** https://github.com/temporalio/temporal
**License:** MIT
**Stars:** ~22,300
**Commits:** 9,629+
**Maintained by:** Temporal Technologies (VC-backed, $1.5B+ valuation)

### 2.1 Core Architecture

Temporal provides **durable execution** - workflows that survive process crashes, server restarts, and infrastructure failures.

**Core Concepts:**

| Concept | Description |
|---------|-------------|
| **Workflow** | Deterministic function that orchestrates a sequence of steps. Must be replay-safe (no random, no system time, no I/O). |
| **Activity** | Non-deterministic side-effect function (API calls, LLM invocations, database writes). Automatically retried on failure. |
| **Worker** | Process that polls Task Queues and executes Workflows/Activities. Stateless - can be scaled horizontally. |
| **Signal** | External input to a running workflow. Used for human-in-the-loop approvals. |
| **Query** | Read-only access to workflow state without affecting execution. |
| **Update** | Validated mutation of workflow state (newer API, replaces some Signal patterns). |
| **Timer** | Durable timer that survives restarts. Can wait seconds or months. |

**Server Architecture (4 services):**

| Service | Role | Scaling |
|---------|------|---------|
| **Frontend** | Rate limiting, routing, authorization | Stateless, horizontal |
| **History** | Maintains mutable state, queues, timers | Sharded, horizontal |
| **Matching** | Hosts Task Queues for dispatching | Sharded, horizontal |
| **Worker** | Internal background workflows | Horizontal |

### 2.2 Storage Backends

**Persistence Store (Primary):**

| Database | Versions | Notes |
|----------|----------|-------|
| PostgreSQL | 13.18, 14.15, 15.10, 16.6 | **Recommended for this platform** |
| MySQL | 5.7, 8.0 (8.0.19+) | Alternative SQL backend |
| Cassandra | 3.11, 4.0, 5.0.4+ | For massive scale |
| SQLite | 3.x | **Development/testing only** |

**Visibility Store (for listing/searching workflows):**
- Since Server v1.20: PostgreSQL 12+, MySQL 8.0.17+, SQLite 3.31.0+ all support advanced Visibility
- Elasticsearch/OpenSearch: Optional, for very large scale
- **Key finding: Elasticsearch is NO LONGER REQUIRED** - PostgreSQL alone is sufficient for both stores

**Minimal Production Stack:** Temporal Server + PostgreSQL (2 databases: default + visibility). No Kafka, no Elasticsearch required.

### 2.3 SDK Languages and Feature Parity

| Language | Status | Notes |
|----------|--------|-------|
| Go | GA, most mature | Reference implementation |
| Python | GA | OpenAI Agents SDK integration in Public Preview |
| TypeScript | GA | Full feature parity |
| Java | GA | Full feature parity |
| .NET | GA | Full feature parity |
| Ruby | Pre-release | Full feature parity claimed |

All SDKs now support: Resource-based auto-tuning (GA), workflow streams (experimental cross-language interop).

### 2.4 Human-in-the-Loop - How It Works

This is a critical capability for the platform. Temporal's pattern:

```python
# 1. Define signal handler
@workflow.signal
async def approval_decision(self, decision: ApprovalDecision):
    if decision.request_id == self.pending_request_id:
        self.approval_decision = decision

# 2. Wait for human input (can wait indefinitely)
await workflow.wait_condition(
    lambda: self.approval_decision is not None,
    timeout=timedelta(seconds=timeout_seconds),
)

# 3. External system sends signal (from UI, API, etc.)
# client.get_workflow_handle(workflow_id).signal("approval_decision", decision)
```

**How it works under the hood:**
1. `workflow.wait_condition()` causes the Worker to return the task to the Temporal Server
2. Worker becomes idle - **zero compute while waiting**
3. Workflow state is persisted and suspended on the Server
4. When a Signal arrives (or timeout fires), Server schedules a new Workflow Task
5. Worker replays Event History to reconstruct state
6. Execution resumes from the `wait_condition` call

**This works identically whether the wait is 5 seconds or 5 months.** Durable timers are persisted to the database and survive worker restarts, deployments, and infrastructure migrations.

**Event capacity:** A single approval with reminders and escalation generates ~40-80 events, well within Temporal's Event History limits.

### 2.5 Calling Agent Reasoning from Temporal Workflows

**The Critical Architecture Question:** The platform needs BOTH agent reasoning (ephemeral, non-deterministic) AND durable business workflows. How do they connect?

**Answer: LLM calls go inside Activities, not Workflows.**

```python
# WORKFLOW (deterministic orchestration)
@workflow.defn
class AgentWorkflow:
    @workflow.run
    async def run(self, request: AgentRequest):
        # Step 1: Agent reasons about the request (Activity)
        plan = await workflow.execute_activity(
            agent_reason,  # Non-deterministic LLM call
            request,
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        # Step 2: If high risk, wait for human approval (Signal)
        if plan.risk_level == "high":
            self.pending_approval = True
            await workflow.wait_condition(
                lambda: self.approval_decision is not None
            )

        # Step 3: Execute the plan (Activity)
        result = await workflow.execute_activity(
            execute_plan, plan,
            start_to_close_timeout=timedelta(minutes=10),
        )
        return result

# ACTIVITY (non-deterministic, side-effectful)
@activity.defn
async def agent_reason(request: AgentRequest) -> AgentPlan:
    response = await openai.chat.completions.create(...)
    return AgentPlan(...)
```

**Key rules:**
- Workflows MUST be deterministic (no LLM calls, no random, no I/O)
- Activities are where non-deterministic work happens (LLM calls, API calls, tool execution)
- Temporal automatically retries failed Activities
- Workflow orchestrates the sequence; Activities do the work

### 2.6 Self-Hosting: What It Actually Takes

**Minimal Stack (V1-appropriate):**
- 1 Temporal Server process (all 4 services in one binary for low-volume)
- 1 PostgreSQL instance (2 databases: temporal + temporal_visibility)
- Docker Compose or single VM deployment
- A single Hetzner CCX13 (4 vCPU, 16 GB RAM, ~EUR15/month) handles low-volume production

**Production Stack (V2+):**
- Separate processes for Frontend, History, Matching, Worker services
- PostgreSQL cluster with replication
- Kubernetes deployment via Helm charts
- Monitoring: Prometheus + Grafana (Temporal exposes metrics)
- Web UI at port 8233 for workflow monitoring

**Operational Overhead:**
- Sequential version updates every ~2 weeks (but you can skip versions)
- PostgreSQL maintenance (standard DBA work)
- Worker scaling based on throughput needs
- No Kafka, no Elasticsearch required (since v1.20)

**Cost comparison:**
- Self-hosted: ~EUR15-100/month infrastructure + operational time
- Temporal Cloud: Starting at $200/month minimum
- At small scale, self-hosting is significantly cheaper
- At high scale, operational overhead may outweigh savings

### 2.7 Production Users

| Company | Use Case |
|---------|----------|
| **Netflix** | CI/CD orchestration; reduced deployment failures from 4% to 0.0001% |
| **Stripe** | Payment workflow orchestration |
| **Coinbase** | Transaction workflows; migrated from homegrown SAGA |
| **Snap** | Infrastructure workflows |
| **Datadog** | Internal orchestration |
| **NVIDIA** | Infrastructure workflows |
| **ADP** | HR/payroll workflows |

Temporal has **3,000+ paying customers** and many thousands more open-source users. Companies report 10x development speed improvements.

### 2.8 Alternatives Assessment

| Tool | License | Verdict |
|------|---------|---------|
| **Inngest** | SSPLv1 (server), Apache 2.0 (SDKs) | **OUT** - SSPL server is not open source |
| **Restate** | BSL (server), MIT (SDKs) | **OUT** - BSL server is not open source |
| **Hatchet** | MIT (full) | **VIABLE** - MIT licensed, simpler than Temporal, younger project |
| **Kestra** | Apache 2.0 | Different focus (data orchestration vs durable execution) |
| **PostgreSQL + polling** | PostgreSQL License | **VIABLE for V1** - simplest approach, limited durability guarantees |

**Hatchet** is worth noting:
- MIT licensed, fully open-source
- Supports Python, TypeScript, Go, Ruby
- Child workflows, retries, real-time monitoring
- Simpler than Temporal (explicit design goal)
- Younger project, smaller community
- **NEEDS VERIFICATION:** Production maturity and scale limits

### 2.9 Temporal vs Simple PostgreSQL Queue for V1

For V1, the question is whether Temporal's complexity is justified:

**PostgreSQL + Polling (simpler):**
- Implement job queue with `pg_notify` or polling
- No additional infrastructure
- Limited durability: no automatic replay, no timer persistence, no workflow state management
- Sufficient for simple async tasks
- Breaks down when you need: long-running workflows, human approval loops, complex retry logic

**Temporal (more capable):**
- Full durability: workflows survive crashes, restarts, deployments
- Built-in human-in-the-loop with Signals
- Automatic retry with configurable policies
- Workflow versioning for safe deployments
- Additional process to run (Temporal Server)
- PostgreSQL-only deployment is now possible (no Elasticsearch)

**Recommendation:** If the platform needs human-in-the-loop approval workflows from Day 1, Temporal is justified even for V1. If not, start with PostgreSQL queues and migrate to Temporal when needed.

---

## 3. DataHub - Metadata Platform

**Repository:** https://github.com/datahub-project/datahub
**License:** Apache 2.0
**Stars:** ~12,500
**Commits:** 15,736+
**Originally developed at:** LinkedIn
**Maintained by:** Acryl Data (commercial entity)

### 3.1 Metadata Graph Structure

DataHub models the entire data ecosystem as a metadata graph:

**Entity Types:**
- Datasets (tables, views, topics)
- Dashboards and Charts
- Data Pipelines/Jobs
- ML Models and Features
- Schemas and Fields
- Data Products and Domains
- Users and Groups

**Relationships:**
- Lineage (upstream/downstream)
- Ownership
- Contains/ContainedBy
- Produces/Consumes
- Tagged/Labeled

**Metadata Aspects:**
Each entity has multiple "aspects" - modular metadata containers that can be independently updated:
- Schema metadata
- Ownership
- Tags and glossary terms
- Statistics and usage
- Lineage information
- Documentation

### 3.2 Column-Level Lineage

DataHub's proprietary SQL parser achieves 99.5% accuracy for column-level lineage:

- Traces individual fields from source columns through transformations to destinations
- Handles JOINs, CTEs, subqueries, window functions
- Automatic extraction from 140+ connectors (Snowflake, BigQuery, Databricks, dbt, etc.)
- Column matching strategies: `auto_fuzzy` (similar names) and `auto_strict` (exact match)
- Hierarchical lineage views: data job, container, domain, data product, platform levels

### 3.3 Domains and Data Products

- **Domains:** Organizational groupings (e.g., "Finance", "Marketing")
- **Data Products:** Curated, documented, quality-assured data assets within domains
- Business Glossary: Shared vocabulary with term definitions, ownership, and relationships
- Tags: Flexible labeling system

### 3.4 Access Control

- Role-based access control (RBAC)
- Fine-grained policies on metadata operations
- Authentication via OIDC
- Audit trails for compliance
- **Note:** Advanced RBAC features are cloud-only

### 3.5 MCP Server

DataHub provides an MCP server for AI agent integration:

**Tools:**
- **Search:** Structured keyword search with boolean logic, filters, pagination, sorting
- **Lineage:** Upstream/downstream lineage traversal with hop control
- **SQL Generation:** Generate SQL queries with context from documentation, lineage, popular queries
- **Metadata Inspection:** Fetch detailed metadata by URN, batch retrieval
- **Schema Exploration:** List schema fields with keyword filtering

**Availability:** Both DataHub Cloud (v0.3.12+) and self-hosted DataHub Core

### 3.6 Operational Footprint - CRITICAL

**Required Infrastructure:**

| Component | Purpose | Operational Burden |
|-----------|---------|-------------------|
| **Kafka** | Real-time metadata streaming | Significant - cluster management, topic management, consumer lag monitoring |
| **Elasticsearch** | Search and graph indexing | Significant - index management, cluster scaling, JVM tuning |
| **MySQL/PostgreSQL** | Relational metadata store | Moderate - standard database operations |
| **Zookeeper** | Coordination (if using Kafka with ZK) | Moderate - cluster management |
| **GMS (Metadata Service)** | Core metadata service | Low - application deployment |
| **Frontend** | Web UI | Low - application deployment |

**Production Recommendations:**
- 16 GB+ RAM, 4+ CPU cores, 50 GB+ storage
- Elasticsearch, Kafka, and database on dedicated infrastructure
- Kubernetes recommended for production

**Setup Time:**
- 6-12 weeks for self-hosted production deployment
- Requires 2+ dedicated platform engineers comfortable with Kafka + Elasticsearch + Kubernetes
- 3-6 months for full setup and connector configuration

### 3.7 Open-Source vs Cloud-Only Features

**Cloud-Only (NOT in OSS):**
- AI-powered discovery agent ("Ask DataHub")
- AI anomaly detection for assertions
- Data observability (freshness, volume, schema monitoring)
- Compliance forms and workflow engine
- Approval workflows for documentation/glossary/tags
- Access request workflows
- Bi-directional metadata sync
- 99.5% uptime SLA
- Fine-grained access control
- AWS PrivateLink, IP restrictions

**Available in OSS:**
- 140+ connectors
- Column-level lineage
- Data ownership management
- Business glossary
- Data contracts
- Basic RBAC
- GraphQL and REST APIs
- Python/Java SDKs
- MCP server

### 3.8 API Layer

| Interface | Use Case |
|-----------|----------|
| **GraphQL API** | Complex metadata queries and relationships |
| **REST API** | CRUD operations on entities |
| **Python SDK** | Programmatic ingestion and retrieval |
| **Java SDK** | JVM-based integrations |
| **MCP Server** | AI agent integration |

### 3.9 Production Users

Netflix, Visa, Slack, Pinterest, and thousands of other organizations. Handles 10M+ assets and billions of relationships at LinkedIn-scale production.

### 3.10 Simpler Alternatives

If DataHub's operational footprint is too heavy for V1:

| Alternative | License | Infrastructure | Notes |
|-------------|---------|---------------|-------|
| **OpenMetadata** | Apache 2.0 | MySQL/PostgreSQL + Elasticsearch | Simpler than DataHub, no Kafka, good UI |
| **Marquez** | Apache 2.0 | PostgreSQL only | Leanest option, lineage-focused |
| **Amundsen** | Apache 2.0 | Elasticsearch + Neo4j | Lighter than DataHub, search-focused |
| **Custom PostgreSQL tables** | N/A | PostgreSQL only | Simplest possible, build as needed |

**OpenMetadata** deserves special attention:
- No Kafka requirement (simplified architecture)
- Can get a working instance running in a single afternoon
- Good connector coverage
- Data contracts support (as of v1.8)
- Active community

---

## 4. Open-Source Purity Verdicts

### 4.1 Graphiti

| Aspect | Verdict | Details |
|--------|---------|---------|
| **Graphiti Core** | PASS (Apache 2.0) | Fully open source, permissive license |
| **Neo4j Community** | CAUTION (GPLv3) | Copyleft - viral licensing obligations. Not license-compatible with Apache 2.0 platform |
| **FalkorDB** | FAIL (SSPLv1) | Not OSI-approved open source |
| **Apache AGE** | PASS (Apache 2.0) | Fully compatible, but Graphiti driver is alpha |
| **Amazon Neptune** | FAIL (Proprietary) | Cloud vendor lock-in |
| **Kuzu** | DEPRECATED | Upstream unmaintained |

**Overall Verdict:** Graphiti itself is clean Apache 2.0. The problem is that its two production-ready backends (Neo4j, FalkorDB) have licensing issues. Apache AGE is the correct backend for this platform but requires investment in the driver.

### 4.2 Temporal

| Aspect | Verdict | Details |
|--------|---------|---------|
| **Temporal Server** | PASS (MIT) | Fully open source, most permissive license |
| **All SDKs** | PASS (MIT) | Fully open source |
| **Web UI** | PASS (MIT) | Fully open source |
| **PostgreSQL backend** | PASS | No proprietary dependencies required |

**Overall Verdict:** CLEANEST of the three. MIT licensed across the board. Can run on PostgreSQL only. No proprietary dependencies. Zero licensing concerns.

### 4.3 DataHub

| Aspect | Verdict | Details |
|--------|---------|---------|
| **DataHub Core** | PASS (Apache 2.0) | Fully open source |
| **Cloud-only features** | N/A | Not available in OSS, but core is complete |
| **Kafka dependency** | PASS (Apache 2.0) | Open source, but operationally heavy |
| **Elasticsearch dependency** | CAUTION (SSPL since v7.11) | Elasticsearch changed to SSPL in 2021. Use OpenSearch (Apache 2.0) instead |

**Overall Verdict:** DataHub Core is Apache 2.0. However, Elasticsearch (a required dependency) switched to SSPL. **Must use OpenSearch** (Apache 2.0 fork) instead. With OpenSearch, the stack is fully open source. Operationally heavy regardless.

**IMPORTANT NOTE on Elasticsearch/OpenSearch:** Elasticsearch versions 7.11+ are SSPL (not open source). DataHub supports OpenSearch as an alternative, which is Apache 2.0. For open-source purity, **always use OpenSearch instead of Elasticsearch** with DataHub.

---

## 5. Integration Architecture

### 5.1 How These Three Connect in the Platform

```
                    +------------------+
                    |  Agent Runtime   |
                    |  (LLM Reasoning) |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v-------+ +---v----+ +-------v--------+
     | Graphiti        | |Temporal| | DataHub         |
     | Context Graph   | |Workflow| | Metadata Catalog|
     | (Agent Memory)  | |Engine  | | (Governance)    |
     +--------+--------+ +---+----+ +-------+--------+
              |              |              |
              v              v              v
     +--------+--------+ +---+----+ +------+--------+
     | Neo4j/AGE       | |PostgreSQL| | Kafka+OpenSearch|
     | (Graph Storage) | |(Workflow)| | (Metadata)    |
     +-----------------+ +----------+ +---------------+
```

### 5.2 Integration Patterns

**Graphiti + Agent Runtime:**
- Agents read from Graphiti before reasoning (context retrieval)
- Agents write to Graphiti after reasoning (memory persistence)
- MCP server enables standardized tool access
- group_id enables per-user/per-conversation isolation

**Temporal + Agent Runtime:**
- Temporal Workflows orchestrate multi-step agent tasks
- LLM calls happen inside Temporal Activities (non-deterministic)
- Human approval loops use Temporal Signals
- Workflow state persists through any failure

**Graphiti + Temporal:**
- Temporal Activity reads from Graphiti context before agent reasoning
- Temporal Activity writes to Graphiti after successful task completion
- Workflow ensures context updates are durable and retried on failure

**DataHub + Everything:**
- Catalogs all platform data assets (datasets, models, pipelines)
- Lineage tracking across the entire platform
- Governance policies on data access
- MCP server enables agents to discover data assets

### 5.3 Shared Infrastructure Optimization

All three can share PostgreSQL:
- **Graphiti:** Via Apache AGE extension (same PostgreSQL instance)
- **Temporal:** Native PostgreSQL support (2 databases)
- **DataHub:** MySQL/PostgreSQL for metadata store (but still needs Kafka + OpenSearch)

**Optimal V1 infrastructure:** Single PostgreSQL instance with Apache AGE extension serves both Graphiti and Temporal. DataHub deferred.

---

## 6. V1 vs V2 Recommendation

### 6.1 V1 - Minimum Viable Platform

**Timeline:** Months 1-6
**Infrastructure:** PostgreSQL (with Apache AGE) + Temporal Server

| Component | V1 Action | Rationale |
|-----------|-----------|-----------|
| **Graphiti** | ADOPT (with Apache AGE backend) | Agent memory is core to the platform's value proposition. Invest in stabilizing the PostgreSQL/AGE driver. |
| **Temporal** | ADOPT | Human-in-the-loop workflows are a Day 1 requirement. PostgreSQL-only deployment is lightweight. |
| **DataHub** | DEFER | Operational footprint (Kafka + OpenSearch + PostgreSQL) is too heavy for V1. Use simple metadata tables in PostgreSQL. |

**V1 Infrastructure (total):**
- 1x PostgreSQL instance (with Apache AGE extension)
  - Graphiti context graph storage
  - Temporal persistence (2 databases)
  - Platform metadata tables (simple, custom)
- 1x Temporal Server (single process, all services)
- Application servers (agent runtime, API)

**V1 Metadata Approach (instead of DataHub):**
- Simple PostgreSQL tables for dataset registry, ownership, tags
- Manual lineage tracking via application code
- Basic search via PostgreSQL full-text search
- Sufficient for <100 data assets

### 6.2 V2 - Scale and Governance

**Timeline:** Months 6-18

| Component | V2 Action | Rationale |
|-----------|-----------|-----------|
| **Graphiti** | SCALE | Move to dedicated Neo4j or contribute to Apache AGE driver maturity |
| **Temporal** | SCALE | Separate services, Kubernetes deployment, horizontal scaling |
| **DataHub** | EVALUATE | If metadata volume exceeds PostgreSQL tables, introduce DataHub or OpenMetadata |
| **OpenMetadata** | CONSIDER | Simpler alternative to DataHub if full DataHub is not needed |

### 6.3 V3 - Enterprise Ready

**Timeline:** Months 18+

| Component | V3 Action |
|-----------|-----------|
| **Graphiti** | Production-hardened, multi-tenant, high-throughput |
| **Temporal** | Multi-cluster, cross-region, advanced monitoring |
| **DataHub/OpenMetadata** | Full catalog with lineage, governance, compliance |

---

## 7. Final Recommendations

### 7.1 Graphiti

**Recommendation: ADOPT with WRAPPING**

- **Adopt** Graphiti as the platform's temporal context graph engine
- **Wrap** with an abstraction layer that hides the backend choice
- **Invest** in the Apache AGE backend driver (fork graphiti-postgres, stabilize it)
- **Avoid** Neo4j (GPLv3 licensing concern) and FalkorDB (SSPL) for the open-source distribution
- **Accept** that for V1, the AGE driver may have limitations; plan for contributor investment
- **Rationale:** No other open-source project provides temporal fact management with agent-oriented APIs. Building this from scratch would be 6-12 months of work. Graphiti's architecture (episodes, entities, temporal facts, hybrid search) is exactly what the platform needs.

**Risk:** Apache AGE driver is alpha (2 stars, 14 commits). Mitigation: Fork it, assign a contributor, and treat it as a core platform dependency.

### 7.2 Temporal

**Recommendation: ADOPT**

- **Adopt** Temporal as the platform's durable workflow engine
- **Deploy** with PostgreSQL-only backend (no Elasticsearch needed since v1.20)
- **Use** Python SDK for agent workflow integration
- **Implement** human-in-the-loop patterns using Signals from Day 1
- **Self-host** initially on minimal infrastructure; evaluate Temporal Cloud if operational burden grows
- **Rationale:** MIT license, PostgreSQL-only deployment, proven at Netflix/Stripe/Coinbase scale, native human-in-the-loop support, and first-class AI agent patterns. No better open-source alternative exists.

**Note on Hatchet:** Monitor as a potential simpler alternative, but Temporal's maturity, ecosystem, and production track record make it the safer bet.

### 7.3 DataHub

**Recommendation: DEFER to V2**

- **Defer** DataHub adoption until the platform has >100 data assets requiring governance
- **Build** simple PostgreSQL-based metadata tables for V1 (dataset registry, ownership, tags, basic lineage)
- **Evaluate** at V2 whether DataHub or OpenMetadata better fits the platform's needs
- **If adopting DataHub:** Use OpenSearch (not Elasticsearch) for open-source purity
- **Consider OpenMetadata** as a lighter alternative (no Kafka, simpler architecture)
- **Rationale:** DataHub's operational footprint (Kafka + OpenSearch + PostgreSQL + Kubernetes) requires 2+ dedicated engineers and 6-12 weeks setup. This is not justified for V1.

**Alternative for V2:** If DataHub proves too heavy, OpenMetadata (Apache 2.0, no Kafka, simpler architecture) or Marquez (Apache 2.0, PostgreSQL only, lineage-focused) are viable alternatives.

### 7.4 Summary Decision Matrix

| Project | License | V1 | V2 | Backend | Open-Source Pure? |
|---------|---------|----|----|---------|-------------------|
| **Graphiti** | Apache 2.0 | ADOPT | SCALE | Apache AGE (invest in driver) | YES (with AGE) |
| **Temporal** | MIT | ADOPT | SCALE | PostgreSQL | YES |
| **DataHub** | Apache 2.0 | DEFER | EVALUATE | OpenSearch (not ES) | YES (with OpenSearch) |

### 7.5 V1 Total Infrastructure Cost

| Resource | Specification | Estimated Cost |
|----------|--------------|----------------|
| PostgreSQL (with AGE) | 4 vCPU, 16 GB RAM, 100 GB SSD | ~$50-100/month |
| Temporal Server | Runs on same or separate VM | ~$15-50/month |
| Application Servers | 2-4 vCPU, 8 GB RAM each | ~$30-60/month each |
| **Total** | | **~$100-300/month** |

This is dramatically cheaper than any commercial alternative and runs entirely on open-source software with permissive licenses.

---

## Appendix A: License Compatibility Matrix

| Component | License | Compatible with Apache 2.0 Platform? | Compatible with MIT Platform? |
|-----------|---------|---------------------------------------|-------------------------------|
| Graphiti Core | Apache 2.0 | YES | YES |
| Neo4j Community | GPLv3 | NO (copyleft viral) | NO (copyleft viral) |
| FalkorDB | SSPLv1 | NO (not OSI-approved) | NO (not OSI-approved) |
| Apache AGE | Apache 2.0 | YES | YES |
| Temporal Server | MIT | YES | YES |
| Temporal SDKs | MIT | YES | YES |
| DataHub Core | Apache 2.0 | YES | YES |
| Elasticsearch 7.11+ | SSPL | NO (not OSI-approved) | NO (not OSI-approved) |
| OpenSearch | Apache 2.0 | YES | YES |
| Kafka | Apache 2.0 | YES | YES |
| PostgreSQL | PostgreSQL License | YES | YES |

## Appendix B: Items Needing Verification

1. **Graphiti maximum graph size** tested specifically with Graphiti (not just Neo4j general benchmarks)
2. **Graphiti concurrent write behavior** under heavy load from multiple agents to the same group_id
3. **Graphiti production deployments** outside of Zep's own infrastructure
4. **Apache AGE driver for Graphiti** - current test coverage and failure modes
5. **Hatchet production maturity** - scale limits and production case studies
6. **Temporal PostgreSQL-only visibility** - performance at scale compared to Elasticsearch visibility
7. **DataHub OpenSearch compatibility** - any feature gaps vs Elasticsearch
8. **OpenMetadata vs DataHub** - detailed feature comparison for platform governance needs
