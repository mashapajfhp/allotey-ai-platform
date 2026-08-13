# Capability Model

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

This document defines the platform's capability taxonomy — the complete set of capabilities an enterprise AI / operational intelligence platform requires. Each capability is described independently of specific technology choices.

---

## 1. Experience Layer

**What it does:** Provides the interfaces through which users, applications, and external systems interact with the platform — chat, dashboards, APIs, embeddable widgets, programmatic SDKs.

**Why it exists:** The intelligence platform must be consumable through multiple modalities. Not all users interact via chat; some need dashboards, API integrations, or embedded analytics.

**Commercial reference:** Palantir (Workshop, Slate), Databricks (AI/BI Dashboards, Genie Spaces), Snowflake (Streamlit), Salesforce (Lightning)
**Open-source reference:** Dify (app publishing), Xpert (analytics UI), Cube (APIs, playground)
**Build/adopt/wrap:** Build — experience layer is product-defining
**Maturity:** Well-understood patterns
**Dependencies:** AI Gateway, Agent Runtime, Semantic Metrics Layer, Analytics Engine

---

## 2. AI Gateway

**What it does:** Single entry point for all AI requests. Handles authentication, authorization, rate limiting, cost/budget enforcement, routing, and governance policies before requests reach the agent runtime or model gateway.

**Why it exists:** Every AI interaction must pass through a governed checkpoint that enforces identity, permissions, budgets, and audit. Without this, AI capabilities become ungoverned.

**Commercial reference:** Databricks (AI Gateway), AWS (AgentCore Gateway), Microsoft (Azure API Management + AI)
**Open-source reference:** LiteLLM (partial — model-level), Kong (API gateway patterns)
**Build/adopt/wrap:** Build — wrapping a model gateway is not sufficient; this must handle agent-level governance
**Maturity:** Emerging pattern — most platforms have partial implementations
**Dependencies:** Identity & Authorization, Model Gateway, Observability

---

## 3. Identity & Authorization

**What it does:** Authenticates users, authenticates agents, enforces permissions at every layer (data, tool, action, agent), supports delegated authorization (user → agent → tool), enforces tenant isolation.

**Why it exists:** AI agents act on behalf of users. The system must ensure that an agent never exceeds the permissions of the user it represents, and that agents themselves have bounded capabilities.

**Commercial reference:** Palantir (Ontology security, marking categories), Microsoft (On-Behalf-Of delegation), Databricks (Unity Catalog ACLs)
**Open-source reference:** OpenFGA (ReBAC/Zanzibar), SpiceDB, OPA
**Build/adopt/wrap:** Adopt OpenFGA or SpiceDB for relationship-based authorization; Build the agent delegation layer
**Maturity:** OpenFGA is production-ready; AI agent authorization patterns are emerging
**Dependencies:** None (foundational)

---

## 4. Model Gateway

**What it does:** Abstracts LLM providers behind a unified interface. Handles routing, fallbacks, load balancing, retries, model aliasing, cost tracking, caching, and guardrails.

**Why it exists:** LLMs are replaceable infrastructure. The platform must not be coupled to any single provider. Cost tracking and fallback routing are operational necessities.

**Commercial reference:** Databricks (AI Gateway), AWS (Bedrock), Azure (AI Foundry model catalog)
**Open-source reference:** LiteLLM (primary), vLLM (self-hosted inference)
**Build/adopt/wrap:** Wrap LiteLLM — adopt its provider abstraction, wrap with platform-specific routing/budget/tenant logic
**Maturity:** LiteLLM is production-ready for model abstraction
**Dependencies:** Observability, Cost/Metering

---

## 5. Agent Runtime

**What it does:** Executes agent reasoning — tool selection, multi-step planning, LLM interaction loops, context management, state transitions. Handles both single-agent and multi-agent orchestration.

**Why it exists:** Agents are the core execution unit of the platform. The runtime determines how agents reason, use tools, maintain state, and coordinate with other agents.

**Commercial reference:** Palantir (AIP agents), Databricks (Mosaic AI Agent Framework), Salesforce (Agentforce Atlas engine), Google (ADK)
**Open-source reference:** LangGraph, Google ADK, Agno, Strands, Microsoft Agent Framework
**Build/adopt/wrap:** Wrap — adopt a runtime (likely LangGraph or Agno) and wrap with platform-specific tool/auth/observability integration
**Maturity:** LangGraph and Agno are production-capable; multi-agent patterns are still maturing
**Dependencies:** Model Gateway, Tool Registry, Memory, Identity & Authorization

---

## 6. Agent Registry

**What it does:** Catalogs available agents — their capabilities, required tools, required permissions, version history, deployment status, ownership. Enables discovery and composition.

**Why it exists:** As the number of agents grows, the platform needs a governed registry to manage what exists, what each agent can do, and who owns it.

**Commercial reference:** Palantir (AIP agent catalog), Salesforce (Agentforce agent builder)
**Open-source reference:** No strong standalone OSS reference — typically embedded in platforms (Dify, Agno)
**Build/adopt/wrap:** Build — this is platform-specific governance infrastructure
**Maturity:** Emerging concept
**Dependencies:** Identity & Authorization, Metadata/Governance

---

## 7. Tool Registry

**What it does:** Catalogs all tools available to agents — their schemas, required permissions, rate limits, side effects, data access patterns. Supports dynamic tool discovery and MCP tool exposure.

**Why it exists:** Agents must discover and invoke tools safely. Every tool invocation must be authorized and auditable. The registry is the governance boundary for tool access.

**Commercial reference:** Palantir (Ontology actions/functions), Databricks (UC functions), AWS (AgentCore tools)
**Open-source reference:** MCP (tool specification), Agno (tool registry), LangGraph (tool nodes)
**Build/adopt/wrap:** Build the registry; Adopt MCP as the tool interface standard
**Maturity:** MCP is rapidly maturing; tool governance is an emerging pattern
**Dependencies:** MCP/A2A Gateway, Identity & Authorization

---

## 8. MCP / A2A Gateway

**What it does:** Manages Model Context Protocol connections (agent ↔ tools/context) and Agent-to-Agent Protocol connections (agent ↔ agent). Handles discovery, authentication, capability negotiation, security.

**Why it exists:** MCP standardizes how agents access tools and context. A2A standardizes how agents communicate with other agents. The gateway governs these interactions.

**Commercial reference:** Palantir (MCP support), Databricks (MCP on Unity Catalog), Snowflake (MCP)
**Open-source reference:** MCP SDKs (TypeScript, Python), Google A2A
**Build/adopt/wrap:** Adopt MCP and A2A protocols; Build the gateway governance layer
**Maturity:** MCP is production-ready; A2A is early-stage
**Dependencies:** Tool Registry, Agent Registry, Identity & Authorization

---

## 9. Domain Ontology

**What it does:** Defines what exists in the business domain — entity types, relationship types, properties, actions, rules, constraints. The authoritative model of business meaning.

**Why it exists:** Agents must operate on business-meaningful abstractions, not raw database tables. The ontology is the bridge between data and business operations. This is what makes Palantir's approach more powerful than a traditional BI semantic layer — it includes actions and security, not just metrics.

**Commercial reference:** Palantir (Ontology — primary reference), Salesforce (CRM objects), Databricks (Unity Catalog metadata)
**Open-source reference:** Semantica (context graphs), TypeDB (typed ontology), TrustGraph (holonic context)
**Build/adopt/wrap:** Build — this is core IP. The ontology compiler and domain model are strategically important
**Maturity:** Palantir has demonstrated the concept at scale; open-source equivalents are immature
**Dependencies:** Metadata/Governance, Context Graph

---

## 10. Semantic Metrics Layer

**What it does:** Defines business metrics, dimensions, analytical relationships, and calculation logic declaratively. Enables consistent metric computation across all consumers (dashboards, agents, APIs).

**Why it exists:** Business metrics must have a single authoritative definition. Without a semantic layer, different tools compute the same metric differently, causing inconsistency and mistrust.

**Commercial reference:** Snowflake (Semantic Views), Databricks (AI/BI semantic model), Salesforce (Data Cloud)
**Open-source reference:** Cube (primary reference), Rill, dbt Semantic Layer
**Build/adopt/wrap:** Wrap Cube — adopt its semantic model definition and query engine; wrap with platform ontology integration
**Maturity:** Cube is production-ready
**Dependencies:** Domain Ontology, Analytical Engine

---

## 11. Context Graph

**What it does:** Stores and queries the current and historical state of entities, facts, and relationships. Supports temporal queries ("what was true at time T?"), provenance, and relationship traversal.

**Why it exists:** Agents need rich, structured context beyond raw documents. The context graph provides the "working memory" of the business — what entities exist, how they relate, what happened, and when.

**Commercial reference:** Palantir (Ontology object instances), Databricks (Unity Catalog lineage graph)
**Open-source reference:** Graphiti (temporal knowledge graph), Semantica (context graphs), TrustGraph (holonic context)
**Build/adopt/wrap:** Evaluate Graphiti for temporal fact management; Build domain-specific graph integration
**Maturity:** Graphiti is usable; temporal knowledge graphs are an emerging pattern
**Dependencies:** Domain Ontology, Knowledge Engine

---

## 12. Knowledge Engine

**What it does:** Ingests, processes, indexes, and serves unstructured knowledge — documents, text, images, audio. Supports chunking, embedding, hybrid retrieval (semantic + keyword + structured filters).

**Why it exists:** Much organizational knowledge is unstructured. Agents need to find and use relevant documents, policies, procedures, and historical information.

**Commercial reference:** AWS (Bedrock Knowledge Bases), Databricks (Mosaic AI), Snowflake (Cortex Search)
**Open-source reference:** LanceDB, Qdrant, Weaviate, pgvector
**Build/adopt/wrap:** Adopt a vector database (evaluate LanceDB vs alternatives); Build the ingestion and retrieval pipeline
**Maturity:** Vector databases are production-ready; RAG patterns are well-established
**Dependencies:** Retrieval Engine

---

## 13. Retrieval Engine

**What it does:** Orchestrates retrieval across multiple sources — vector search, knowledge graph traversal, structured data queries, full-text search. Combines and reranks results.

**Why it exists:** No single retrieval method is sufficient. Agents need to combine results from documents, graphs, and databases with intelligent reranking.

**Commercial reference:** Databricks (AI Search), Snowflake (Cortex Search), AWS (Knowledge Bases)
**Open-source reference:** LanceDB (hybrid retrieval), Graphiti (graph + vector), DataHub (metadata search)
**Build/adopt/wrap:** Build — retrieval orchestration across heterogeneous sources is platform-specific
**Maturity:** Individual retrieval engines are mature; cross-source orchestration is custom
**Dependencies:** Knowledge Engine, Context Graph, Analytical Engine

---

## 14. Analytical Engine

**What it does:** Executes analytical queries at speed — aggregations, time-series analysis, event analytics, ad-hoc exploration. Serves both agent-generated queries and direct analytics.

**Why it exists:** Intelligence requires fast analytical computation. Agents generating SQL need a performant execution engine. Dashboards and real-time analytics need sub-second response.

**Commercial reference:** Snowflake (analytical compute), Databricks (Spark SQL, Photon)
**Open-source reference:** ClickHouse (event/time-series analytics), DuckDB (embedded analytical querying), Apache Pinot (real-time)
**Build/adopt/wrap:** Adopt — DuckDB for embedded analytical query execution (NOT as event store); ClickHouse for event analytics at scale and observability (required by Langfuse)
**Maturity:** ClickHouse is production-ready at scale
**Dependencies:** Semantic Metrics Layer

---

## 15. Event Intelligence

**What it does:** Captures, stores, and reasons over business events. Supports event sourcing, event-driven triggers, temporal pattern detection, and causal analysis.

**Why it exists:** Many intelligence use cases require understanding sequences of events — what happened, in what order, and what patterns emerge. Events are the raw material for decision intelligence.

**Commercial reference:** Palantir (operational event streams), Databricks (Delta Lake streaming)
**Open-source reference:** PostgreSQL (append-only event records V1), ClickHouse (event analytics at scale), Kafka/Redpanda (event streaming)
**Build/adopt/wrap:** V1: PostgreSQL append-only events + DuckDB analytical queries. Scale: ClickHouse for high-volume event analytics. Build event reasoning capabilities.
**Maturity:** Event infrastructure is mature; event intelligence is custom
**Dependencies:** Analytical Engine, Context Graph

---

## 16. Decision Intelligence

**What it does:** Represents decisions as first-class objects with full provenance — observation, evidence, hypothesis, recommendation, action, outcome. Enables reasoning about past decisions and learning from outcomes.

**Why it exists:** The platform must answer: "Why did the system make this recommendation? What evidence did it use? What outcome followed?" Decision objects make intelligence auditable and improvable.

**Commercial reference:** Palantir (operational decision workflows)
**Open-source reference:** Semantica (decision objects, causal reasoning — early stage)
**Build/adopt/wrap:** Build — this is core IP and a key differentiator
**Maturity:** Conceptual — no mature open-source implementation exists
**Dependencies:** Context Graph, Event Intelligence, Observability, Action Engine

---

## 17. Action Engine

**What it does:** Executes governed actions against business systems — creating records, updating states, triggering workflows, calling APIs. Every action is authorized, validated, and audited.

**Why it exists:** Intelligence without action is just reporting. The platform must be able to act on its insights — but every action must be governed, reversible where possible, and auditable.

**Commercial reference:** Palantir (Ontology Actions), Salesforce (Agentforce actions), Databricks (UC functions)
**Open-source reference:** Agno (tools), LangGraph (tool execution)
**Build/adopt/wrap:** Build — action governance is platform-specific and security-critical
**Maturity:** Individual action execution is understood; governed action orchestration is custom
**Dependencies:** Identity & Authorization, Human Approval, Tool Registry, Domain Ontology

---

## 18. Human Approval

**What it does:** Pauses agent workflows for human review and approval. Supports approval chains, escalation, time-bounded approvals, partial approvals, and delegation.

**Why it exists:** High-stakes actions (financial transactions, system changes, customer communications) must not execute autonomously without human oversight. The system must support configurable approval policies.

**Commercial reference:** Palantir (human-in-the-loop), Microsoft (approval flows)
**Open-source reference:** LangGraph (interrupts), Temporal (signals), Agno (human approval)
**Build/adopt/wrap:** Build on top of the durable workflow engine
**Maturity:** Basic interrupt patterns exist; enterprise approval workflows are custom
**Dependencies:** Durable Workflow Engine, Identity & Authorization, Agent Runtime

---

## 19. Durable Workflow Engine

**What it does:** Executes long-running business processes with guaranteed completion — durable timers, retries, compensation, human waits, deterministic replay, and persisted workflow state. Activities execute at-least-once and must be designed for idempotency. Distinct from agent reasoning workflows.

**Why it exists:** Business processes (approval chains, data pipelines, multi-step operations) can take hours, days, or weeks. They must survive failures and restarts. Agent reasoning is ephemeral; business workflows are durable.

**Commercial reference:** Palantir (operational workflows), Salesforce (Flow)
**Open-source reference:** Temporal (primary reference). Inngest (SSPL — EXCLUDED) and Restate (BSL — EXCLUDED) are not viable for SaaS.
**Build/adopt/wrap:** Adopt Temporal — operationally complex but architecturally sound and MIT-licensed
**Maturity:** Temporal is production-ready at scale
**Dependencies:** Human Approval, Action Engine

---

## 20. Memory

**What it does:** Stores and retrieves information relevant to agents, sessions, users, and conversations over time. Supports short-term (session), medium-term (conversation history), and long-term (user preferences, learned facts) memory.

**Why it exists:** Agents must remember context across interactions. Without memory, every interaction starts from zero. Memory also enables personalization and learning.

**Commercial reference:** AWS (AgentCore Memory), Microsoft (Foundry IQ knowledge)
**Open-source reference:** Graphiti (temporal facts), Agno (memory), LangGraph (checkpointing)
**Build/adopt/wrap:** Build on top of context graph — agent memory is a view over the context graph, not a separate system
**Maturity:** Basic memory patterns exist; sophisticated temporal memory is emerging
**Dependencies:** Context Graph, Agent Runtime

---

## 21. Metadata / Governance

**What it does:** Manages information about data itself — ownership, lineage, quality, schema, domain classification, policies, tags, business glossary. The control plane for data governance.

**Why it exists:** As the platform integrates diverse data sources, metadata governance becomes essential for trust, compliance, and discoverability. Agents need to know what data exists, who owns it, and whether it's trustworthy.

**Commercial reference:** Databricks (Unity Catalog), Palantir (data lineage), Snowflake (governance)
**Open-source reference:** DataHub (primary reference), OpenMetadata
**Build/adopt/wrap:** DEFERRED to V2 — DataHub is too operationally heavy for V1 (requires Kafka, Elasticsearch, Neo4j, MySQL, Zookeeper). V1: build lightweight metadata tracking within the platform. V2: evaluate DataHub or OpenMetadata.
**Maturity:** DataHub is production-ready but operationally demanding
**Dependencies:** Domain Ontology, Identity & Authorization

---

## 22. Observability

**What it does:** Captures traces, spans, metrics, and logs across all platform operations — agent executions, tool calls, model invocations, data access, actions, workflows. Supports debugging, performance analysis, and audit.

**Why it exists:** Without observability, the platform is a black box. Operators must be able to trace any request through the entire system, understand latency, identify failures, and audit agent behavior.

**Commercial reference:** Databricks (MLflow tracing), AWS (AgentCore observability), Microsoft (tracing)
**Open-source reference:** Langfuse (AI-specific), OpenTelemetry (infrastructure), Arize Phoenix
**Build/adopt/wrap:** Adopt OpenTelemetry as the base standard; Wrap Langfuse for AI-specific observability
**Maturity:** OpenTelemetry is production-ready; Langfuse is production-capable
**Dependencies:** None (cross-cutting concern)

---

## 23. Evaluation

**What it does:** Systematically measures agent quality — correctness, relevance, safety, latency, cost. Supports automated evaluation, human evaluation, regression testing, and experiment tracking.

**Why it exists:** Agent quality must be measured, not assumed. Without evaluation, degradation goes unnoticed. Evaluation enables continuous improvement and safe deployment.

**Commercial reference:** Databricks (Mosaic AI evaluation), Microsoft (Foundry evaluation), AWS (Bedrock evaluation)
**Open-source reference:** Langfuse (experiments/datasets), MLflow, Arize Phoenix
**Build/adopt/wrap:** Adopt evaluation frameworks from Langfuse/MLflow; Build domain-specific evaluation criteria
**Maturity:** Basic evaluation exists; comprehensive agent evaluation is an active research area
**Dependencies:** Observability, Agent Runtime

---

## 24. Cost / Metering

**What it does:** Tracks and controls costs across all platform operations — model inference costs, compute usage, storage, API calls. Supports budgets, quotas, cost allocation by tenant/team/agent, and alerting.

**Why it exists:** AI operations are expensive. Without metering, costs spiral. Budgets enforce governance. Cost allocation enables chargeback and prioritization.

**Commercial reference:** Databricks (AI Gateway cost tracking), LiteLLM (cost tracking)
**Open-source reference:** LiteLLM (token cost tracking, virtual key budgets)
**Build/adopt/wrap:** Wrap LiteLLM cost tracking; Build platform-level budget/allocation logic
**Maturity:** Token-level cost tracking exists; platform-level metering is custom
**Dependencies:** Model Gateway, Observability

---

## 25. Deployment / Runtime

**What it does:** Packages, deploys, scales, and manages platform components — containerization, orchestration, auto-scaling, health checks, blue-green deployment, configuration management.

**Why it exists:** The platform must be deployable, operable, and scalable. Deployment architecture determines operational complexity, scaling characteristics, and reliability.

**Commercial reference:** All commercial platforms handle this internally
**Open-source reference:** Kubernetes, Docker, Helm; Agno (deployment helpers)
**Build/adopt/wrap:** Adopt standard infrastructure tooling (Kubernetes, containers)
**Maturity:** Well-established
**Dependencies:** All components

---

## 26. Developer Platform

**What it does:** Provides the tools, SDKs, APIs, documentation, and development workflows for building on the platform — agent development, tool development, ontology authoring, testing, debugging.

**Why it exists:** A platform is only as valuable as what can be built on it. Developer experience determines adoption and velocity.

**Commercial reference:** Palantir (OSDK, Workshop), Databricks (notebooks, SDK), Snowflake (Snowpark)
**Open-source reference:** Agno (SDK), LangGraph (SDK), MCP (SDKs)
**Build/adopt/wrap:** Build — this is the product surface
**Maturity:** Depends on platform maturity
**Dependencies:** All components

---

## 27. ML Platform / Model Development

**What it does:** Supports the full lifecycle of custom and specialist model development — dataset management, feature engineering, training, fine-tuning, experiment tracking, model evaluation, model registry, artifact management, model serving, and model monitoring.

**Why it exists:** The current architecture covers model **consumption** (via the Model Gateway / LiteLLM) but not model **development**. An AI platform that can only call external APIs is not a comprehensive AI platform. Custom models for domain-specific tasks, fine-tuned foundation models, and specialist classifiers all require development infrastructure.

**Commercial reference:** Databricks (MLflow, Mosaic AI), AWS (SageMaker), Google (Vertex AI), Microsoft (Azure ML)
**Open-source reference:** PyTorch (BSD), fastai (Apache 2.0), Hugging Face Transformers (Apache 2.0), MLflow (Apache 2.0), Ray (Apache 2.0), vLLM (Apache 2.0), BentoML (Apache 2.0), KServe (Apache 2.0)
**Build/adopt/wrap:** ADOPT ML tooling (all permissively licensed) + BUILD platform integration
**Maturity:** Individual tools are production-ready; integrated ML platforms are complex
**Dependencies:** Model Gateway, Observability, Cost/Metering
**IMPORTANT:** Library licenses are separate from model licenses. Every model needs individual licensing review.

---

## 28. Data / Context Ingestion

**What it does:** Ingests data from diverse sources into the platform — databases, APIs, CDC streams, webhooks, files, documents, object storage, SaaS connectors, IoT feeds. Handles schema discovery, schema evolution, mapping, normalization, lineage, quality assessment, deduplication, identity resolution, incremental sync, and backfill.

**Why it exists:** An intelligence platform cannot only define what happens after data arrives. Ingestion is where the data foundation is built. No architecture like Palantir or Databricks becomes useful without excellent ingestion capabilities.

**Commercial reference:** Palantir (Foundry data connections), Databricks (Delta Live Tables, Auto Loader), Snowflake (Snowpipe)
**Open-source reference:** Airbyte (verify license — MIT/ELv2), Debezium (Apache 2.0), dlt (Apache 2.0), Meltano (MIT), Kafka Connect (Apache 2.0), Dagster (Apache 2.0), Apache NiFi (Apache 2.0)
**Build/adopt/wrap:** ADOPT ingestion framework + BUILD platform-specific integration
**Maturity:** Batch ingestion is mature; real-time CDC and schema evolution are more complex
**Dependencies:** Domain Ontology (schema mapping), Metadata/Governance (lineage), Knowledge Engine (document ingestion)

---

## 29. Secure Agent Compute / Sandboxing

**What it does:** Provides isolated execution environments for agent-generated code — Python scripts, SQL queries, data transformations, chart generation, document processing, browser automation. Enforces network isolation, filesystem isolation, CPU/memory limits, execution timeouts, and tenant isolation.

**Why it exists:** Agents eventually need to execute code. This CANNOT happen inside an unrestricted application process. Generated code may be malicious, buggy, or resource-intensive. Sandboxing is a security-critical capability.

**Commercial reference:** Databricks (notebooks with cluster isolation), Palantir (Code Sandbox), AWS (Lambda isolation)
**Open-source reference:** Firecracker (Apache 2.0), gVisor (Apache 2.0), WASM/WASI, E2B (verify license)
**Build/adopt/wrap:** ADOPT isolation technology + BUILD agent-specific sandbox orchestration
**Maturity:** Sandbox technologies are mature; agent-specific sandboxing is an emerging pattern
**Dependencies:** Identity & Authorization, Agent Runtime
**Threat model:** Agents must never execute arbitrary generated code inside the core platform process.

---

## 30. Secrets / Credential Broker

**What it does:** Manages secrets (API keys, database credentials, OAuth tokens, encryption keys) and provides short-lived, scoped credentials to agents and tools. Ensures long-lived credentials are never exposed directly to LLMs or agent code.

**Why it exists:** Agents call external systems that require authentication. If agents have direct access to long-lived credentials, a compromised agent or prompt injection attack could exfiltrate secrets. A credential broker issues time-limited, scope-limited credentials that minimize blast radius.

**Architecture:** Agent → Authorized Tool Request → Credential Broker → Short-lived scoped credential → External System

**Commercial reference:** HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
**Open-source reference:** OpenBao (MPL-2.0 — Vault fork), SPIFFE/SPIRE (Apache 2.0)
**Build/adopt/wrap:** ADOPT secrets engine + BUILD credential broker with agent integration
**Maturity:** Secrets management is mature; agent-specific credential brokering is emerging
**Dependencies:** Identity & Authorization, Agent Runtime, Tool Registry

---

## 31. Policy Evaluation

**What it does:** Evaluates attribute-based and rule-based policies that go beyond relationship-based authorization. Handles conditions like "amount > $10,000 AND country = AE AND risk_score > 70 → require second approval" that are not relationship queries.

**Why it exists:** OpenFGA solves relationship-based authorization (who can access what). But not every governance decision is a relationship. Business rules, conditional approval logic, compliance checks, and rate-based policies require a separate policy evaluation engine.

**Three-layer authorization model:**
1. **Identity** — authentication (who is this?)
2. **Relationship Authorization (OpenFGA)** — who can access what, based on relationships
3. **Policy Evaluation (OPA/Cedar)** — attribute-based rules, conditional logic, compliance checks
4. **Domain Constraints (Ontology)** — business rules embedded in the domain model

**Commercial reference:** AWS (Cedar), Google (Policy Engine)
**Open-source reference:** OPA (Apache 2.0), Cedar (Apache 2.0)
**Build/adopt/wrap:** ADOPT OPA or Cedar + BUILD integration with ontology rules
**Maturity:** OPA is production-proven at scale; Cedar is newer but well-designed
**Dependencies:** Identity & Authorization, Domain Ontology

---

## Capability Dependencies Map

```
Experience Layer
    └── AI Gateway
            ├── Identity & Authorization (foundational)
            │       └── Policy Evaluation (OPA/Cedar)
            ├── Secrets / Credential Broker
            ├── Model Gateway
            │       ├── Cost/Metering
            │       └── ML Platform (model development)
            ├── Agent Runtime
            │       ├── Tool Registry
            │       │       └── MCP/A2A Gateway
            │       ├── Agent Registry
            │       ├── Secure Compute / Sandboxing
            │       ├── Memory
            │       │       └── Context Graph
            │       └── Human Approval
            │               └── Durable Workflow Engine
            ├── Domain Ontology
            │       ├── Semantic Metrics Layer
            │       │       └── Analytical Engine
            │       ├── Context Graph
            │       │       └── Knowledge Engine
            │       │               └── Retrieval Engine
            │       └── Policy Evaluation (ontology rules)
            ├── Data / Context Ingestion
            │       └── Domain Ontology (schema mapping)
            ├── Action Engine
            │       └── Tool Registry
            ├── Decision Intelligence
            │       ├── Event Intelligence
            │       └── Context Graph
            └── Metadata/Governance

Cross-cutting: Observability, Evaluation, Security, Provenance
```

**NOTE:** This capability model now includes 31 capabilities (up from 26). The additions (ML Platform, Data Ingestion, Secure Compute, Secrets Management, Policy Evaluation) were identified during the architecture correction pass as significant gaps.
