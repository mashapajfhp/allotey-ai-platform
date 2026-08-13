# Lessons from Databricks -- What to Learn, What to Copy, What to Skip

STATUS: RESEARCH COMPLETE -- August 2026

## The Central Thesis: Shared Control Plane for Data and AI

The single most important architectural idea from Databricks is the **shared control plane** -- the decision to govern data assets and AI assets through the same system (Unity Catalog), route all AI traffic through a single gateway (Unity AI Gateway), and track all artifacts through a single lifecycle system (MLflow).

This is not just a product integration story. It is an architectural philosophy: **data governance and AI governance are the same problem**, and solving them separately creates drift, duplication, and security gaps.

### What "Shared Control Plane" Means Concretely

In Databricks' implementation, the shared control plane provides:

1. **Single identity model**: The same user/group/service principal identity is used for table access, model access, function execution, agent invocation, and MCP tool calls
2. **Single permission system**: GRANT/REVOKE on tables, models, functions, endpoints, and MCP servers all use the same syntax and the same permission store
3. **Single lineage graph**: Data lineage, model lineage, and (increasingly) agent tool-call lineage are tracked in one system
4. **Single audit log**: All data access, model calls, agent actions, and MCP invocations are logged to the same system tables
5. **Single namespace**: `catalog.schema.object` addresses tables, functions, models, and other assets uniformly

## What to Copy Conceptually

### 1. Unified Object Model for Data and AI Assets

**Pattern**: Treat ML models, functions, agents, and tools as the same kind of governed object as tables and views.

**Why it matters**: Most organizations have separate systems for data governance (data catalogs) and ML governance (model registries, experiment trackers). This creates:
- Duplicate permission management
- Gaps where AI assets are ungoverned
- Inability to track lineage from data through models to agent actions

**What to implement**: A single catalog that can register and govern tables, functions/tools, model endpoints, and agent configurations. Even if the underlying storage differs, the governance metadata should be unified.

### 2. Identity Pass-Through for AI Tool Calls

**Pattern**: When an agent calls a tool (function, database query, API), execute with the **end user's identity**, not a service account.

**Why it matters**: Service account-based tool execution is the most common pattern, and it is the most dangerous. It means every agent has the permissions of the service account, regardless of who is using the agent. This is privilege escalation by design.

**What to implement**: An execution model where the calling user's identity is propagated through the entire tool-call chain. This requires the tool execution layer to support identity delegation, not just API key auth.

### 3. Functions as Governed, Discoverable Tools

**Pattern**: Register business logic as governed functions in the catalog. These functions are automatically available as agent tools (via MCP or other protocols) without separate tool definition.

**Why it matters**: In most agent frameworks, tool definitions are baked into agent code. This creates:
- Tool sprawl (same logic defined in multiple agents)
- Ungoverned tool access (no permission checks on who can call what)
- No discoverability (agents cannot discover new tools without code changes)

**What to implement**: A function registry where business logic is defined once, governed by the permission system, and automatically exposed as callable tools for agents.

### 4. LLM-Based Guardrails (Not Rule-Based)

**Pattern**: Use AI models to evaluate AI model outputs for safety, PII, injection, and policy compliance -- not rigid keyword lists or regex rules.

**Why it matters**: Rule-based guardrails are brittle and easy to circumvent. LLM-based guardrails can reason about context (distinguishing a medical discussion of symptoms from harmful content, for example).

**What to implement**: A guardrail evaluation pipeline where configurable prompts and models evaluate requests and responses. The key insight from Databricks is making guardrails **editable prompts backed by configurable models**, not hard-coded logic.

### 5. Auto-Syncing Search Indexes

**Pattern**: Vector search indexes automatically update when the underlying source table changes.

**Why it matters**: In most RAG architectures, keeping the vector index in sync with the source data is a manual ETL problem. Auto-sync eliminates a major source of stale retrieval results.

**What to implement**: A mechanism where the search index layer subscribes to changes in the source data store and updates incrementally. This is easier when the source is a change-tracking format (like Delta Lake) but the concept applies broadly.

### 6. Cost Attribution at the AI Gateway Level

**Pattern**: Track token consumption, request counts, and costs per user/group/project at the gateway layer, not in individual applications.

**Why it matters**: Without centralized cost tracking, AI spend becomes invisible and unattributable. This leads to surprise bills, inability to do chargeback, and no mechanism to enforce budgets.

**What to implement**: A gateway or proxy layer that meters all AI API calls and attributes them to authenticated callers. Even a simple token-counting proxy with user attribution provides enormous value.

## What NOT to Copy

### 1. Tight Platform Coupling

Databricks' approach works because everything runs on Databricks. Unity Catalog governs Databricks tables, AI Gateway routes to Databricks endpoints, MLflow runs on Databricks compute. This level of integration is a **vendor lock-in trade-off**.

**For an independent platform**: Design governance, routing, and lifecycle as **separable layers** that can work with multiple data stores, model hosts, and compute environments. Do not require all components to be on a single vendor.

### 2. The Metastore-Per-Region Limitation

Unity Catalog metastores are regional. Cross-region and cross-cloud governance was only recently introduced and is still evolving. For a global platform, this single-region anchor can be a constraint.

**For an independent platform**: Design the governance metadata layer to be multi-region from the start, not retrofitted.

### 3. Proprietary Semantic Layer

Genie's intelligence depends on the proprietary Data Intelligence Engine. The semantic understanding is not portable -- it only works within Databricks.

**For an independent platform**: If building a natural language query layer, use open semantic model standards (e.g., dbt semantic layer, MetricFlow, or custom semantic metadata) that are not coupled to a single platform.

### 4. Monolithic Embedding in One Platform

Databricks bundles data engineering, warehousing, ML, and AI into a single platform. This is powerful but assumes all workloads live on Databricks. Many organizations have heterogeneous environments.

**For an independent platform**: Design for the reality that data may live in multiple systems (Snowflake, BigQuery, Postgres, S3) and models may be hosted on multiple providers. The governance layer must work across boundaries, not just within one platform.

### 5. Enterprise-Only Pricing Model

Many of Databricks' best governance features (Unity Catalog advanced features, AI Gateway, Supervisor Agent) are only available on Enterprise tier. This creates a gap between what is architecturally possible and what is financially accessible.

**For an independent platform**: Consider making core governance features available broadly, not just to enterprise customers.

## Governance Patterns Worth Studying

### Pattern: Governance by Default, Not by Opt-In
Unity Catalog is automatically enabled for all workspaces. You do not opt into governance -- you are governed by default and must explicitly grant access. This is the right security posture.

### Pattern: Three-Level Namespace
`catalog.schema.object` provides a natural organizational hierarchy (environment/domain/asset) that maps well to enterprise structures. It is simple enough to understand but flexible enough for complex organizations.

### Pattern: Declarative Permissions with SQL Syntax
Using ANSI SQL GRANT/REVOKE for permissions is brilliant for adoption. Data engineers and analysts already know this syntax. No new permission DSL to learn.

### Pattern: Lineage as Automatic Side Effect
Lineage should be captured automatically from query execution plans, not manually annotated. Databricks' approach of extracting lineage from Spark query plans means lineage is always up to date without developer effort.

### Pattern: MCP as Governed Interface
Using MCP as the protocol for exposing Lakehouse capabilities to external AI clients, with governance enforced at the MCP server layer, is a pattern worth studying. It decouples the AI client from the data platform while maintaining security.

## Summary Assessment

| Aspect | Verdict |
|---|---|
| Unified governance for data + AI | Copy this concept -- it is the right architecture |
| Identity pass-through for tools | Copy this -- service accounts for agents are dangerous |
| UC functions as automatic MCP tools | Copy this pattern -- functions should be governed and discoverable |
| LLM-based guardrails | Copy the approach -- configurable prompts, not rigid rules |
| Auto-syncing vector indexes | Copy if possible -- eliminates major ops burden |
| Tight single-vendor coupling | Do NOT copy -- design for heterogeneous environments |
| Proprietary semantic engine | Do NOT copy -- use open semantic standards |
| Regional metastore constraint | Do NOT copy -- design multi-region from day one |
| Enterprise-only governance | Do NOT copy -- governance should be accessible broadly |
| Cost attribution at gateway | Copy this -- essential for sustainable AI operations |

## The Deeper Lesson

Databricks' most important contribution is not any single feature but the **proof that a shared control plane for data and AI is viable and valuable**. Before Databricks demonstrated this at scale, the industry assumption was that data governance and ML/AI governance were fundamentally different problems requiring different systems. Unity Catalog proves they are the same problem, and solving them together produces better security, better lineage, and less operational overhead than solving them separately.

Any platform that governs data and AI through separate systems should study Databricks' approach and ask: what would it take to unify these?
