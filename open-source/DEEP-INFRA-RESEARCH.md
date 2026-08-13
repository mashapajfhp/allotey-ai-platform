# Deep Infrastructure Research: OpenFGA, LiteLLM, Langfuse

**Research Date:** 2026-08-13
**Mandate:** No paid dependencies. Only truly open-source components.
**Method:** Primary research via GitHub repositories, official documentation, and community sources.

---

## Table of Contents

1. [OpenFGA -- Fine-Grained Authorization Engine](#1-openfga--fine-grained-authorization-engine)
2. [LiteLLM -- AI Model Gateway & Proxy](#2-litellm--ai-model-gateway--proxy)
3. [Langfuse -- LLM Observability & Evaluation](#3-langfuse--llm-observability--evaluation)
4. [Open-Source Purity Verdicts](#4-open-source-purity-verdicts)
5. [Integration Architecture](#5-integration-architecture)
6. [Recommendations](#6-recommendations)

---

## 1. OpenFGA -- Fine-Grained Authorization Engine

### 1.1 Overview

| Attribute | Value |
|-----------|-------|
| Repository | https://github.com/openfga/openfga |
| License | Apache License 2.0 (pure, no exceptions) |
| Language | Go |
| CNCF Status | **Incubating** (promoted from Sandbox on October 28, 2025; accepted September 14, 2022) |
| Inspiration | Google Zanzibar |
| Maintainer | Originally Auth0/Okta, now CNCF-governed |
| Production Users | Auth0, Grafana Labs, Docker, Canonical, 37+ companies publicly acknowledged |

### 1.2 Authorization Model DSL

OpenFGA uses a declarative DSL (schema version 1.1) that compiles to JSON. The core building blocks are **types**, **relations**, and **conditions**.

#### Type and Relation Definitions

```dsl
model schema 1.1

type user

type document
  relations
    define owner: [user]
    define editor: [user, team#member]
    define viewer: [user] or editor or owner
```

#### Relationship Type Restrictions (bracket notation)

- `[user]` -- individual objects of type user
- `[user:*]` -- all objects of type user (public access)
- `[team#member]` -- users who have the "member" relation on a team object

#### Operators

| Operator | Syntax | Meaning |
|----------|--------|---------|
| Union | `or` | User qualifies if ANY condition matches |
| Intersection | `and` | User qualifies only if ALL conditions match |
| Exclusion | `but not` | Removes users from a set (blocklists) |
| Indirection | `from` | Follow relationship through related objects |

#### Complex Example with Inheritance

```dsl
model schema 1.1

type user

type domain
  relations
    define member: [user]

type folder
  relations
    define owner: [user, domain#member]
    define viewer: [user] or viewer from parent
    define parent: [folder]

type document
  relations
    define parent_folder: [folder]
    define owner: [user, domain#member] or owner from parent_folder
    define writer: [user, domain#member] or owner or writer from parent_folder
    define viewer: [user, domain#member] or writer or viewer from parent_folder
    define can_share: writer
```

### 1.3 Conditions (ABAC Support)

Conditions use CEL (Common Expression Language) to add attribute-based checks on top of relationship-based access control.

```dsl
condition non_expired_grant(current_time: timestamp, grant_time: timestamp, grant_duration: duration) {
  current_time < grant_time + grant_duration
}
```

**Supported parameter types:** int, uint, double, bool, bytes, string, duration, timestamp, list<T>, map<T>, ipaddress, any

**Limits:**
- Condition context capped at 32KB per relationship tuple
- CEL expression evaluation cost limited to 100 by default
- Overall request size limit: 512KB

### 1.4 Relationship Tuples

Tuples are the core data primitive: `(user, relation, object)`.

```
// Writing tuples
user:anne   editor   document:budget-2024
team:engineering#member   viewer   folder:shared-docs
user:bob   owner   document:roadmap  with non_expired_grant {grant_time: "2024-01-01T00:00:00Z", grant_duration: "720h"}
```

Tuples are stored in the configured backend (PostgreSQL, MySQL, SQLite) and queried via the Check, ListObjects, ListUsers, and Expand APIs.

### 1.5 Contextual Tuples

Contextual tuples are **ephemeral tuples provided at query time** that are not persisted. They enable dynamic, context-dependent authorization.

**Key characteristics:**
- Valid only for the duration of a single request
- Maximum 100 contextual tuples per request
- Supported on Check, BatchCheck, ListObjects, ListUsers, Expand endpoints
- When a contextual tuple matches a stored tuple, the contextual version takes precedence

**Use cases:**
- Hybrid data models (avoid syncing all data to OpenFGA)
- Session-specific context (e.g., which organization a user is operating under)
- Runtime-dependent decisions (e.g., VPN check, current IP)

### 1.6 AI Agent Authorization Model

The following model demonstrates how to implement User -> Agent -> Tool delegation in OpenFGA:

```dsl
model schema 1.1

type user

type agent
  relations
    define owner: [user]
    define delegated_user: [user]
    define can_execute: owner or delegated_user

type tool
  relations
    define can_invoke: [agent, user]
    define owner_tool: [user]

type data_scope
  relations
    define can_access: [user]
    define agent_can_access: can_access from delegated_user_scope
    define delegated_user_scope: [user]

condition active_session(current_time: timestamp, session_start: timestamp, session_duration: duration) {
  current_time < session_start + session_duration
}
```

#### Example Tuples

```
// User alice owns agent-alpha
user:alice   owner   agent:agent-alpha

// Agent-alpha can invoke the web-search tool
agent:agent-alpha   can_invoke   tool:web-search

// User alice has delegated access to agent-alpha
user:alice   delegated_user   agent:agent-alpha

// User alice can access customer-data scope
user:alice   can_access   data_scope:customer-records

// Delegation with time-limited condition
user:bob   delegated_user   agent:agent-alpha   with active_session {session_start: "2024-06-01T09:00:00Z", session_duration: "8h"}
```

#### Example Check Queries

```
// Can agent-alpha invoke web-search?
Check(agent:agent-alpha, can_invoke, tool:web-search) -> ALLOWED

// Can user:alice execute agent-alpha?
Check(user:alice, can_execute, agent:agent-alpha) -> ALLOWED

// Can user:bob execute agent-alpha? (depends on session time)
Check(user:bob, can_execute, agent:agent-alpha, context: {current_time: "2024-06-01T10:00:00Z"}) -> ALLOWED

// Chain check: Does user:alice have the right scopes for what the agent is doing?
// This requires application-level orchestration:
// 1. Check user:alice can_execute agent:agent-alpha
// 2. Check agent:agent-alpha can_invoke tool:web-search
// 3. Check user:alice can_access data_scope:customer-records
// All three must pass for the agent action to proceed
```

**Verdict:** This model is fully achievable in OpenFGA. The combination of direct relations, conditions (for time-limited delegation), and contextual tuples (for session-based context) covers the agent delegation pattern comprehensively. Application-level orchestration is needed to chain multiple check calls for end-to-end authorization.

### 1.7 Performance

- **Sub-millisecond authorization checks** at scale, demonstrated in production with millions of relationships
- **P99 latency reduced by 98%** via Thompson Sampling-based self-tuning strategy planner
- **90% latency reduction** achieved across multiple optimization passes in 2024
- Auth0 FGA (production deployment of OpenFGA) serves at massive scale since December 2021
- Optimizations include: fast path resolution, caching, batching, concurrency controls

### 1.8 Storage Backends

| Backend | Status | Notes |
|---------|--------|-------|
| PostgreSQL | Production-ready | Recommended for production |
| MySQL | Production-ready | Requires `parseTime=true` |
| SQLite | Beta | File-based, requires volume mounting |
| In-memory | Development only | Not for production |

### 1.9 Multi-Tenancy

OpenFGA provides **stores** as the isolation unit for multi-tenancy:

- Each store is a dedicated namespace with its own authorization model and tuples
- Prevents cross-tenant data leakage
- Middleware maps incoming requests to the correct tenant store
- Noisy neighbors can be isolated by moving their store to a separate instance
- Recommendation: one OpenFGA instance per cluster/region to minimize latency

### 1.10 SDK Availability

| SDK | Package | Status |
|-----|---------|--------|
| Go | `github.com/openfga/go-sdk` | Active, v0.7.3+ |
| Python | `openfga-sdk` (PyPI) | Active, v0.9.7+ |
| Node.js/TypeScript | `@openfga/sdk` (npm) | Active |
| Java | `dev.openfga:openfga-sdk` (Maven) | Active, v0.9.2+ |
| .NET | `OpenFga.Sdk` (NuGet) | Active, v0.8.0+ |

Community SDKs also exist for additional languages.

### 1.11 Deployment

- **Docker:** `docker pull openfga/openfga` -- exposes HTTP (8080), gRPC (8081), Playground (3000)
- **Kubernetes:** Helm chart available
- **Terraform:** Provider available for infrastructure-as-code
- **Authentication:** Pre-shared keys or OIDC
- **TLS:** Native support with certificate/key files
- **Profiling:** Built-in Go profiler on configurable port

### 1.12 OpenFGA vs SpiceDB

| Aspect | OpenFGA | SpiceDB |
|--------|---------|---------|
| License | Apache 2.0 | Apache 2.0 (SpiceDB), proprietary (AuthZed managed) |
| CNCF | Incubating | Not CNCF |
| Consistency | Relaxed by default, HIGHER_CONSISTENCY opt-in | Full Zanzibar consistency via ZedTokens |
| API | REST-first + gRPC | gRPC-first |
| Schema | DSL with conditions, contextual tuples | Zanzibar-faithful schema language |
| Ecosystem | Auth0/Okta backing, broad SDKs | AuthZed commercial backing |
| Best For | Broad language support, ecosystem integration | Zanzibar-purist architectures, strong consistency |

**For this platform:** OpenFGA is the better choice due to CNCF governance (vendor-neutral), Apache 2.0 license with zero proprietary carve-outs, broader SDK support, and the contextual tuples feature which is essential for dynamic agent authorization.

---

## 2. LiteLLM -- AI Model Gateway & Proxy

### 2.1 Overview

| Attribute | Value |
|-----------|-------|
| Repository | https://github.com/BerriAI/litellm |
| License | **MIT with enterprise directory exception** (dual-license) |
| Language | Python (core), Rust (performance-critical paths) |
| Stars | 56,300+ |
| Backing | Y Combinator W23 |
| Production Users | Stripe, Netflix, Greptile, OpenHands, Google ADK, NVIDIA |

### 2.2 Provider Abstraction

LiteLLM provides a **unified OpenAI-compatible API** for 140+ providers and 2,600+ models:

```python
from litellm import completion

# All use the same interface
response = completion(model="gpt-4o", messages=[{"role": "user", "content": "Hello"}])
response = completion(model="claude-3-opus-20240229", messages=[{"role": "user", "content": "Hello"}])
response = completion(model="bedrock/anthropic.claude-v2", messages=[{"role": "user", "content": "Hello"}])
```

Major providers include: OpenAI, Anthropic, Google (Gemini/Vertex), AWS Bedrock, Azure OpenAI, Cohere, Hugging Face, Ollama, vLLM, Together AI, Groq, Mistral, and 130+ more.

### 2.3 Proxy Server Architecture

The proxy server sits between applications and LLM providers:

```
Application -> LiteLLM Proxy (port 4000) -> LLM Providers
                    |
                    +-- PostgreSQL (keys, budgets, spend)
                    +-- Redis (caching, rate limiting)
```

**Performance:** 8ms P95 latency at 1,000 RPS.

**Installation:**
```bash
uv tool install 'litellm[proxy]'
litellm --config config.yaml
```

### 2.4 Configuration (YAML)

```yaml
model_list:
  - model_name: gpt-4o                    # User-facing name
    litellm_params:
      model: azure/gpt-4o-eu             # Actual backend model
      api_base: https://endpoint.openai.azure.com/
      api_key: "os.environ/AZURE_API_KEY" # env var reference
      rpm: 6                              # Rate limit
      tpm: 100000                         # Token limit

  - model_name: gpt-4o                    # Second deployment (load balancing)
    litellm_params:
      model: openai/gpt-4o
      api_key: "os.environ/OPENAI_API_KEY"
      rpm: 10

router_settings:
  routing_strategy: latency-based-routing  # or: simple-shuffle, least-busy, usage-based-routing, cost-based-routing

litellm_settings:
  num_retries: 3
  fallbacks: [{"gpt-4o": ["claude-3-sonnet"]}]
  context_window_fallbacks: [{"gpt-4o": ["gpt-4o-mini"]}]
  allowed_fails: 3

general_settings:
  master_key: sk-your-master-key
  database_url: "os.environ/DATABASE_URL"
```

### 2.5 Virtual Keys (MIT Open Source)

Virtual keys enable per-user/team API access control and spend tracking:

```bash
# Generate a virtual key
curl 'http://localhost:4000/key/generate' \
  --header 'Authorization: Bearer sk-master-key' \
  --data-raw '{
    "models": ["gpt-4o", "claude-3-sonnet"],
    "max_budget": 100.0,
    "tpm_limit": 50000,
    "rpm_limit": 100,
    "duration": "30d",
    "metadata": {"user": "engineer@company.com"}
  }'
```

**Spend tracking endpoints (MIT):**
- `/key/info` -- individual key spending
- `/user/info` -- user-level aggregation
- `/team/info` -- team-level aggregation

### 2.6 Budget Management

**MIT open-source budget features:**
- Per-key `max_budget` in USD
- Per-key `tpm_limit` and `rpm_limit`
- Key expiration via `duration`
- Spend tracking via `completion_cost()` function
- Basic user and team budget aggregation

**Enterprise-only budget features:**
- Tag-based budget controls
- Model-specific budget limits per virtual key
- Temporary budget increases (time-boxed spend bumps)
- Soft budget email alerts
- Programmatic spend reports generation
- Organization-level budget hierarchies

### 2.7 Routing Strategies

| Strategy | Description | Performance Impact |
|----------|-------------|-------------------|
| `simple-shuffle` | Default, weighted by RPM/TPM | Lowest overhead, no Redis needed |
| `latency-based-routing` | Routes to fastest endpoint | **38% lower P95** vs round-robin |
| `cost-based-routing` | Picks cheapest deployment | 22% cost reduction, 15% latency penalty |
| `least-busy` | Routes to least loaded endpoint | Good for mixed workloads |
| `usage-based-routing` | Routes based on usage quotas | Requires tracking |

**Fallback types:**
- `fallbacks` -- general model failures
- `content_policy_fallbacks` -- content policy violations
- `context_window_fallbacks` -- context window exceeded

Circuit breaker: ~5 failures to trip, 60-second cooldown.

### 2.8 Guardrails

**MIT open-source guardrails:**
- Custom callback-based guardrails (full Python control)
- Custom code guardrails (sandboxed Python functions)
- OpenAI moderation API integration
- Pre-call, during-call, and post-call modes
- Model-level guardrail overrides
- Community guardrail registry (github.com/BerriAI/litellm-guardrails)

**Enterprise-only guardrails:**
- Lakera AI integration
- Advanced PII detection
- Key/team-scoped guardrail assignment
- Secret redaction
- Built-in guardrail callbacks (llmguard, llamaguard)

**IMPORTANT NOTE:** There is a known issue (GitHub #34241) where the boundary between MIT and enterprise features is blurred in the codebase. Several features documented as "enterprise" have their entire implementation in MIT-licensed files with zero imports from the enterprise/ directory. This includes: SCIM v2 endpoints, budget-based guardrails, fine-tuning endpoints, organization management, audit log creation, secret manager integrations, tag-based budgets, and cloud storage integrations.

### 2.9 Caching

| Cache Type | Backend | Notes |
|------------|---------|-------|
| In-Memory | Local | Default, single-process |
| Redis | Redis | Distributed, multi-server |
| Semantic Cache | Redis + embeddings | Cosine similarity matching |
| Disk | Local filesystem | Persistent local cache |
| S3 | AWS S3 | Cloud-based persistence |
| GCS | Google Cloud Storage | Cloud-based persistence |
| Qdrant | Qdrant vector DB | Vector similarity cache |

**DualCache:** L1 (in-memory) + L2 (Redis) for optimal performance.

All caching features are MIT open-source.

### 2.10 Observability

**MIT open-source integrations:**
- Langfuse (native callback + OpenTelemetry v2)
- OpenTelemetry (OTEL v2 with GenAI semantic conventions)
- LangSmith
- Custom callback handlers
- Request/response logging

**OpenTelemetry v2 (opt-in):**
```bash
LITELLM_OTEL_V2=true  # Enable
# Standard OTEL_* env vars for configuration
```

Produces one trace per request: HTTP -> auth -> guardrails -> LLM call -> DB writes.

**Enterprise-only observability:**
- Team-based logging routing (different teams to different Langfuse projects)
- Per-team logging disable (GDPR compliance)
- Log export to GCS/Azure Blob storage

### 2.11 Open-Source Purity Analysis (CRITICAL)

**License structure:** Root LICENSE is MIT with carve-out: "All content that resides under the 'enterprise/' directory is licensed under the license defined in 'enterprise/LICENSE'."

**The enterprise/LICENSE.md** is a proprietary commercial license requiring a paid subscription for production use. Development/testing is permitted without subscription.

#### What is definitively MIT (FREE):

- Core SDK (`litellm` Python package)
- Proxy server (gateway)
- Virtual key generation and management
- Basic budget and rate limiting per key
- Spend tracking (per-key, per-user, per-team)
- Model routing (all strategies: latency, cost, weighted, shuffle)
- Fallback and retry logic
- All caching backends (in-memory, Redis, semantic, disk, S3, GCS)
- Custom callback-based guardrails
- Custom code guardrails
- OpenAI moderation integration
- Model aliases and configuration
- OpenTelemetry integration
- Langfuse callback integration
- Docker deployment
- Kubernetes deployment

#### What is ENTERPRISE (PAID, $30,000/year):

- SSO (Okta, Google, OIDC/JWT)
- SCIM v2 provisioning (NEEDS VERIFICATION -- code may be MIT)
- Audit logs with retention (NEEDS VERIFICATION -- code may be MIT)
- Organization/team admin hierarchy
- Multi-tenant architecture (Org -> Team -> Project -> Key)
- Project management with isolated budgets
- Tag-based budget controls (NEEDS VERIFICATION -- code may be MIT)
- Temporary budget increases
- Soft budget email alerts
- Secret manager integrations (Vault, KMS, etc.) (NEEDS VERIFICATION -- code may be MIT)
- Team-based logging routing
- Per-team logging disable (GDPR)
- Log export to GCS/Azure Blob
- Key/team-scoped guardrail assignment
- Lakera AI guardrail integration
- Key rotation automation
- IP-based access control
- Multi-region deployment under single license
- Custom branding (Swagger docs, emails)
- Dedicated support (Slack/Teams, SLA)

#### License Boundary Ambiguity (NEEDS VERIFICATION)

GitHub issue #34241 documents that **19 features** labeled as "enterprise" in documentation have their **entire implementation in MIT-licensed files** with zero imports from the `enterprise/` directory. This means they are technically MIT-licensed code with only a UI-level gate (a `premium_user` boolean) preventing access. Features in this category include:

- SCIM v2 endpoints
- Budget-based guardrails
- Fine-tuning endpoints
- Organization management CRUD
- Audit log creation
- Secret manager integrations (HashiCorp Vault, CyberArk, Google)
- Tag-based budgets
- Cloud storage integrations (GCS, Azure Blob)
- Pass-through endpoint authentication

**Practical implication:** For an open-source-first platform, the core gateway functionality (routing, virtual keys, basic budgets, caching, custom guardrails, OTEL) is fully MIT and runs self-hosted without paying. The enterprise features that truly require the enterprise/ directory code are limited to a subset of SSO, RBAC controls, and some UI components.

### 2.12 Deployment

**Docker:**
```bash
docker run -d \
  -p 4000:4000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_HOST=redis \
  -v /path/to/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:main-latest \
  --config /app/config.yaml
```

**Infrastructure requirements:**
- PostgreSQL (for virtual keys, spend tracking)
- Redis (for caching, rate limiting -- optional but recommended)
- Typical production cost: $200-$500/month infrastructure

**Kubernetes:** Helm chart available, horizontal scaling supported.

---

## 3. Langfuse -- LLM Observability & Evaluation

### 3.1 Overview

| Attribute | Value |
|-----------|-------|
| Repository | https://github.com/langfuse/langfuse |
| License | **MIT with /ee/ directory exception** (dual-license) |
| Language | TypeScript/Node.js |
| Backing | Y Combinator W23, **acquired by ClickHouse (January 2026)** |
| Architecture | Web container + Worker container |
| Database | ClickHouse (traces) + PostgreSQL (transactional) + Redis + S3 |

### 3.2 Tracing Model

Langfuse uses a hierarchical tracing model:

```
Trace (top-level container -- one per user interaction)
 +-- Observations (nested hierarchy)
      +-- Span (time-bounded unit of work)
      +-- Generation (LLM call with model, prompt, completion, tokens, cost)
      +-- Event (discrete point-in-time event)
      +-- Agent (orchestrator that decides flow)
      +-- Tool (function/API call)
      +-- Chain (connects application steps)
      +-- Retriever (data lookup without state change)
      +-- Evaluator (assesses quality of outputs)
      +-- Embedding (embedding generation with usage)
      +-- Guardrail (content protection check)
```

**Ten observation types** capture different aspects of application behavior. Observations nest arbitrarily deep, mirroring the application call stack.

**Key data captured per generation:**
- Model name
- Prompt/completion text
- Token usage (input, output, cached, audio, image tokens)
- Cost (auto-calculated or custom)
- Latency
- Metadata

### 3.3 Prompt Management

- **Versioned prompts** with commit history
- **Runtime fetch** with caching (minimizes latency)
- **A/B testing** across prompt versions
- **Labels** for deployment stages (production, staging, development)
- **Experiments** to compare prompt versions against datasets
- Available via API and SDKs

### 3.4 Evaluation System

#### Datasets
- Collections of input/expected-output pairs
- Created manually, imported from CSV/JSON, or curated from production traces
- Versioned for reproducibility
- Run batch experiments to compare model/prompt/retrieval strategies

#### Scoring Types
- **Numeric** -- continuous quality scores
- **Categorical** -- discrete categories (good/bad/neutral)
- **Boolean** -- pass/fail

#### Evaluation Methods
| Method | Description |
|--------|-------------|
| LLM-as-Judge | Automated evaluation using an LLM to score outputs |
| Code Evaluators | Programmatic scoring functions |
| User Feedback | End-user ratings and annotations |
| Human Annotation | Manual expert review |
| Custom Pipelines | User-defined evaluation workflows |

#### LLM-as-Judge
- Can run on individual observations or entire experiments
- Returns numeric or categorical scores
- Each evaluation creates its own trace (inspectable for debugging)
- Configurable prompts for evaluation criteria

### 3.5 Cost Tracking

- **Automatic calculation** based on model and token counts
- **Predefined pricing** for OpenAI, Anthropic, Google models
- **Custom model definitions** for self-hosted or proprietary models
- **Granular token types:** input, output, cached, audio, image
- **Dashboards** for cost monitoring by model, tag, user, or team
- **Alerts** for spend threshold notifications
- **Metrics API** for programmatic cost queries

### 3.6 Integration Ecosystem

| Integration | Type | Notes |
|-------------|------|-------|
| Python SDK | Native | `langfuse` package |
| JS/TS SDK | Native | `langfuse` package |
| OpenTelemetry | Protocol | OTLP endpoint at `/api/public/otel` |
| LiteLLM | Gateway | Native callback + OTEL |
| LangChain | Framework | Native integration |
| LlamaIndex | Framework | Native integration |
| OpenAI SDK | Wrapper | Drop-in replacement |
| Vercel AI SDK | Framework | Native integration |

### 3.7 Self-Hosting Architecture

```
                     +------------------+
                     |   Load Balancer  |
                     +--------+---------+
                              |
              +---------------+---------------+
              |                               |
    +---------+----------+         +----------+---------+
    | Langfuse Web       |         | Langfuse Worker    |
    | (UI, API, ingest)  |         | (background tasks) |
    | Port 3000          |         |                    |
    +----+----+----+-----+         +----+----+----+-----+
         |    |    |                    |    |    |
    +----+  +-+--+ +----+         +----+  +-+--+ +----+
    | PG |  | CH | | S3 |         | PG |  | CH | |Redis|
    +----+  +----+ +----+         +----+  +----+ +----+
```

**Infrastructure Components:**

| Component | Purpose | Minimum Specs |
|-----------|---------|---------------|
| PostgreSQL | Transactional data (users, orgs, projects, API keys, prompts, datasets) | Standard PostgreSQL |
| ClickHouse | Trace storage and analytics (traces, observations, scores) | 2 CPU, 8 GiB RAM minimum |
| Redis/Valkey | Event queue (BullMQ), caching (API keys, prompts) | Standard Redis |
| S3/Blob Storage | Raw ingestion events, multi-modal attachments | Any S3-compatible |

**All timezones must be set to UTC.**

**Deployment Options:**

| Method | Use Case |
|--------|----------|
| Docker Compose | Development, testing, low-scale |
| Kubernetes (Helm) | Production (recommended) |
| AWS Terraform | Cloud production |
| Azure Terraform | Cloud production |
| GCP Terraform | Cloud production |
| Railway | Quick deployment |

**Langfuse v4 requires ClickHouse >= 25.12 (26.4 recommended).**

**Production cost estimate:** $200-$800/month depending on trace volume and retention.

### 3.8 Open-Source Purity Analysis (CRITICAL)

**License structure:** Root LICENSE is MIT with carve-out: "All content that resides under the 'ee/', 'web/src/ee/', and/or 'worker/src/ee/' directories is licensed under the license defined in 'ee/LICENSE'."

**The ee/LICENSE** is a proprietary enterprise license that allows development/testing without subscription but requires a valid Langfuse Enterprise License for production use. Modifications remain Langfuse's intellectual property.

**Critical context:** In June 2025, Langfuse moved **all core product features** to MIT. Only thin enterprise compliance features remain commercial.

**ClickHouse acquisition (January 2026):** Langfuse confirmed that the project **stays open source and self-hostable** with no planned license changes.

#### What is definitively MIT (FREE):

- **All core platform features:**
  - Tracing (traces, spans, generations, events, all observation types)
  - Sessions and user tracking
  - Token and cost monitoring
  - Prompt management and versioning
  - Evaluation (LLM-as-judge, code evaluators, datasets, experiments)
  - Scoring (numeric, categorical, boolean)
  - Custom dashboards and alerts
  - LLM Playground
  - Annotation queues
- **Infrastructure:**
  - Unlimited usage/units (no caps)
  - No seat limits
  - No retention limits
  - SSO (including Okta and AzureAD) -- **MIT, not enterprise**
  - Organization-level RBAC
  - Client-side data masking
  - All SDK and OpenTelemetry integrations
  - Public API access
  - Multiple deployment options

#### What is ENTERPRISE (PAID, $2,499/month):

- Project-level RBAC (finer than org-level)
- Server-side data masking
- Data retention management
- SCIM API (automated user provisioning)
- Organization creators
- UI customization
- Audit logs
- Admin API for project management
- Instance management API
- SOC 2 Type II and ISO 27001 compliance reports
- Support SLA
- Bundled with ClickHouse Cloud/BYOC/Private

#### Purity Assessment

Langfuse has the **cleanest open-source story** of the three projects. The enterprise features are genuinely thin compliance/governance features that do not affect core observability, evaluation, or prompt management functionality. A self-hosted MIT deployment is fully functional for production workloads.

---

## 4. Open-Source Purity Verdicts

### OpenFGA: GREEN

| Criteria | Assessment |
|----------|-----------|
| License | Apache 2.0, pure, no exceptions |
| Enterprise carve-outs | NONE |
| Feature restrictions | NONE -- all features available |
| Governance | CNCF Incubating (vendor-neutral) |
| Self-hosted | Fully functional |
| Vendor lock-in risk | NONE |

**Verdict:** OpenFGA is the gold standard for open-source purity. Apache 2.0 with zero proprietary code, zero feature gates, and CNCF governance ensuring vendor neutrality. Every feature, API, and optimization is available to all users equally.

### LiteLLM: YELLOW

| Criteria | Assessment |
|----------|-----------|
| License | MIT core with proprietary enterprise/ directory |
| Enterprise carve-outs | YES -- SSO, advanced RBAC, audit logs, some guardrails |
| Feature restrictions | Some features gated by `premium_user` boolean |
| Governance | BerriAI (single company) |
| Self-hosted | Core gateway fully functional without payment |
| Vendor lock-in risk | LOW for core, MEDIUM for governance features |

**Verdict:** The core model gateway (routing, virtual keys, basic budgets, caching, custom guardrails, OTEL) is genuinely MIT and production-ready. The YELLOW rating comes from: (1) blurred licensing boundaries where MIT-coded features are UI-gated as enterprise, (2) single-company governance without foundation backing, and (3) SSO/RBAC requiring enterprise license. For a pure gateway use case, this is effectively GREEN. For full governance, it requires enterprise license or building custom SSO/RBAC.

### Langfuse: GREEN

| Criteria | Assessment |
|----------|-----------|
| License | MIT core with thin proprietary ee/ directory |
| Enterprise carve-outs | YES but minimal (SCIM, audit logs, project-RBAC, UI customization) |
| Feature restrictions | Only compliance features gated |
| Governance | ClickHouse (post-acquisition), committed to open source |
| Self-hosted | Fully functional -- no seat/usage/retention caps |
| Vendor lock-in risk | LOW |

**Verdict:** Langfuse earns GREEN because all core product functionality (tracing, evaluation, prompts, datasets, scoring, dashboards, SSO, org-level RBAC) is MIT with zero restrictions. The enterprise-only features are genuinely thin compliance layers (SCIM, audit logs, project-level RBAC) that most organizations do not need for production workloads. The ClickHouse acquisition comes with explicit commitments to maintain open-source status.

---

## 5. Integration Architecture

### How the Three Components Work Together

```
+------------------------------------------------------------------+
|                    AI Platform Architecture                       |
+------------------------------------------------------------------+

  User Request
       |
       v
  +-----------+     Check: can user invoke this agent?
  | OpenFGA   |<--------------------------------------------+
  | (AuthZ)   |     Check: can agent invoke this tool?      |
  +-----------+     Check: does user have data scope?       |
       |                                                     |
       | ALLOWED                                             |
       v                                                     |
  +-----------+     Route to optimal provider               |
  | LiteLLM   |     Track spend per virtual key             |
  | (Gateway) |     Apply guardrails                        |
  +-----------+     Retry/fallback on failure               |
       |                                                     |
       | LLM Response                                        |
       v                                                     |
  +-----------+     Trace the full request chain            |
  | Langfuse  |     Score quality (LLM-as-judge)            |
  | (Observe) |     Track costs per model/user/team         |
  +-----------+     Evaluate prompt versions                |
       |                                                     |
       v                                                     |
  Application <----------------------------------------------+
  Response
```

### Integration Points

#### 1. OpenFGA <-> Application Layer
- Application checks OpenFGA **before** routing to LiteLLM
- Three-step authorization for agent actions:
  1. `Check(user, can_execute, agent)` -- can user use this agent?
  2. `Check(agent, can_invoke, tool)` -- can agent use this tool?
  3. `Check(user, can_access, data_scope)` -- does user have data scope?
- Contextual tuples inject session info (IP, time, org context)
- Sub-millisecond latency means negligible authorization overhead

#### 2. LiteLLM <-> Langfuse
- **Native integration** -- LiteLLM has built-in Langfuse callback
- **OpenTelemetry v2** -- LiteLLM sends OTEL traces to Langfuse OTLP endpoint
- **Automatic cost tracking** -- Langfuse captures cost data from LiteLLM responses
- **Configuration:**
  ```yaml
  # In LiteLLM config.yaml
  litellm_settings:
    success_callback: ["langfuse"]

  # Environment variables
  LANGFUSE_PUBLIC_KEY: pk-lf-...
  LANGFUSE_SECRET_KEY: sk-lf-...
  LANGFUSE_HOST: http://langfuse:3000
  ```

#### 3. OpenFGA <-> LiteLLM (Custom Middleware)
- LiteLLM custom guardrails can call OpenFGA before routing
- Pre-call guardrail checks authorization for the requested model
- Example: user with virtual key X can only access models Y and Z

#### 4. Langfuse <-> OpenFGA (Audit Trail)
- Langfuse traces include authorization decisions as metadata
- Enables post-hoc analysis of access patterns
- Scoring can flag unauthorized access attempts

### Data Flow for Agent Authorization

```
1. User sends request to invoke Agent-Alpha with Tool:web-search on Scope:customer-data

2. Application middleware:
   a. OpenFGA Check: user:alice can_execute agent:agent-alpha       -> ALLOWED
   b. OpenFGA Check: agent:agent-alpha can_invoke tool:web-search   -> ALLOWED
   c. OpenFGA Check: user:alice can_access data_scope:customer-data -> ALLOWED

3. LiteLLM routes the LLM call:
   - Virtual key: sk-alice-key (budget: $100/month)
   - Model: gpt-4o (routed via latency-based strategy)
   - Guardrails: PII detection (pre-call), content moderation (post-call)
   - Fallback: claude-3-sonnet if gpt-4o fails

4. Langfuse traces the entire chain:
   - Trace: agent-alpha-invocation-12345
     - Span: authorization-check (0.5ms)
     - Span: agent-orchestration
       - Generation: gpt-4o (model, tokens, cost, latency)
       - Tool: web-search (input, output, duration)
     - Event: response-delivered
   - Score: quality=0.92 (LLM-as-judge)
   - Cost: $0.003 (auto-calculated)
```

### Infrastructure Deployment (Docker Compose)

```yaml
# Simplified production-like deployment
version: '3.8'
services:
  # Authorization Engine
  openfga:
    image: openfga/openfga:latest
    command: run
    environment:
      OPENFGA_DATASTORE_ENGINE: postgres
      OPENFGA_DATASTORE_URI: postgres://user:pass@postgres:5432/openfga
    ports:
      - "8080:8080"   # HTTP API
      - "8081:8081"   # gRPC API
      - "3001:3000"   # Playground
    depends_on:
      - postgres

  # Model Gateway
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    command: --config /app/config.yaml
    environment:
      DATABASE_URL: postgres://user:pass@postgres:5432/litellm
      REDIS_HOST: redis
      LANGFUSE_PUBLIC_KEY: pk-lf-...
      LANGFUSE_SECRET_KEY: sk-lf-...
      LANGFUSE_HOST: http://langfuse-web:3000
    ports:
      - "4000:4000"
    volumes:
      - ./litellm-config.yaml:/app/config.yaml
    depends_on:
      - postgres
      - redis

  # Observability Platform
  langfuse-web:
    image: langfuse/langfuse:latest
    environment:
      DATABASE_URL: postgres://user:pass@postgres:5432/langfuse
      CLICKHOUSE_MIGRATION_URL: clickhouse://clickhouse:9000
      CLICKHOUSE_URL: http://clickhouse:8123
      REDIS_HOST: redis
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: your-secret
      SALT: your-salt
      LANGFUSE_S3_EVENT_UPLOAD_BUCKET: langfuse-events
      LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT: http://minio:9000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - clickhouse
      - redis

  langfuse-worker:
    image: langfuse/langfuse:latest
    command: node worker/dist/index.js
    environment:
      # Same as langfuse-web
    depends_on:
      - postgres
      - clickhouse
      - redis

  # Shared Infrastructure
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: pass
      POSTGRES_USER: user
    volumes:
      - postgres_data:/var/lib/postgresql/data

  clickhouse:
    image: clickhouse/clickhouse-server:latest
    volumes:
      - clickhouse_data:/var/lib/clickhouse

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio
    command: server /data
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  clickhouse_data:
  redis_data:
  minio_data:
```

**Note:** PostgreSQL serves all three components (OpenFGA, LiteLLM, Langfuse) but should use separate databases for isolation.

---

## 6. Recommendations

### OpenFGA: ADOPT

| Decision | Rationale |
|----------|-----------|
| **Action** | Adopt directly. No wrapping needed. |
| **Confidence** | HIGH |
| **Risk** | VERY LOW |

**Why adopt directly:**
- Apache 2.0 with zero proprietary code -- purest open-source of the three
- CNCF Incubating -- vendor-neutral governance, will not be rug-pulled
- Sub-millisecond performance -- negligible latency overhead for authorization
- The DSL is expressive enough for User -> Agent -> Tool -> DataScope delegation
- Conditions + contextual tuples cover dynamic/temporal authorization needs
- Official SDKs in all languages the platform will use (Go, Python, TypeScript)
- PostgreSQL storage backend aligns with shared infrastructure
- No alternative offers a better combination of purity, performance, and features

**Integration approach:**
- Deploy OpenFGA alongside the platform's PostgreSQL instance
- Build a thin authorization middleware layer that performs multi-step checks
- Use contextual tuples for session-based context injection
- Use conditions for time-limited delegation and IP-based restrictions

### LiteLLM: ADOPT (with awareness)

| Decision | Rationale |
|----------|-----------|
| **Action** | Adopt the MIT core. Plan to build or replace enterprise governance features. |
| **Confidence** | MEDIUM-HIGH |
| **Risk** | LOW for core gateway, MEDIUM for governance layer |

**Why adopt:**
- 140+ provider support with unified API -- building this from scratch would take years
- Proxy server is genuinely MIT and production-proven (Stripe, Netflix, NVIDIA)
- Virtual keys, routing, caching, custom guardrails are all MIT
- LiteLLM-to-Langfuse integration is native and well-tested
- 8ms P95 at 1K RPS -- production-grade performance
- Rust core for performance-critical paths shows long-term engineering investment

**Caveats (YELLOW items):**
- SSO/OIDC is enterprise-only -- the platform will need to build this or use an external identity provider with pre-shared keys
- Advanced RBAC (org/team hierarchy) is enterprise-only -- the platform can use OpenFGA for authorization instead of LiteLLM's built-in RBAC
- Single-company governance (BerriAI) -- no foundation backing, license could theoretically change (MIT is irrevocable for existing code, but future versions could change)
- Some "enterprise" features may actually be MIT-coded (issue #34241) -- verify before building alternatives

**Integration approach:**
- Deploy LiteLLM proxy as the single LLM egress point
- Use virtual keys for per-agent/per-user cost tracking
- Use OpenFGA (not LiteLLM enterprise RBAC) for authorization
- Use custom guardrails for pre-call authorization checks
- Configure Langfuse callback for observability
- Build custom SSO integration if needed, or use API key authentication

### Langfuse: ADOPT

| Decision | Rationale |
|----------|-----------|
| **Action** | Adopt directly. Enterprise features are not needed. |
| **Confidence** | HIGH |
| **Risk** | LOW |

**Why adopt directly:**
- All core features (tracing, evaluation, prompts, scoring, dashboards) are MIT
- No seat caps, no usage limits, no retention limits on self-hosted
- SSO is MIT (unlike LiteLLM)
- Native LiteLLM integration (callback + OTEL)
- Rich evaluation framework (LLM-as-judge, datasets, experiments) -- critical for platform quality
- Prompt management with versioning -- essential for production prompt ops
- 10 observation types cover all AI application patterns (agents, tools, retrievers, etc.)
- ClickHouse acquisition came with explicit open-source commitment

**Infrastructure consideration:**
- Requires ClickHouse (additional component vs PostgreSQL-only)
- ClickHouse open-source is Apache 2.0 -- no licensing concern
- Minimum 2 CPU / 8 GiB RAM for ClickHouse -- reasonable overhead
- Single ClickHouse shard handles multiple terabytes before horizontal scaling

**Integration approach:**
- Deploy Langfuse with ClickHouse, PostgreSQL, Redis, and S3-compatible storage
- Configure LiteLLM to send traces via callback or OTEL v2
- Use scoring for automated quality evaluation of agent outputs
- Use datasets and experiments for prompt/model version comparison
- Build custom dashboards for platform-wide cost and quality metrics

### Summary Matrix

| Component | Verdict | License Purity | Governance | Production Ready | Alternative Considered |
|-----------|---------|---------------|------------|-----------------|----------------------|
| **OpenFGA** | ADOPT | GREEN (Apache 2.0, pure) | CNCF Incubating | YES | SpiceDB (Apache 2.0, but no CNCF, less SDK breadth) |
| **LiteLLM** | ADOPT (with awareness) | YELLOW (MIT core, proprietary enterprise/) | BerriAI (single company) | YES | No comparable open-source alternative at this scale |
| **Langfuse** | ADOPT | GREEN (MIT core, thin EE) | ClickHouse (committed to OSS) | YES | Arize Phoenix (Apache 2.0, but less mature eval/prompt features) |

### Total Infrastructure Cost Estimate (Self-Hosted)

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| PostgreSQL (shared) | $50-150 | Managed or self-hosted, serves all three |
| ClickHouse | $100-400 | For Langfuse trace storage |
| Redis | $30-80 | Shared cache and queue |
| S3-compatible storage | $20-50 | Langfuse events and attachments |
| Compute (3 services) | $100-300 | OpenFGA, LiteLLM, Langfuse containers |
| **Total** | **$300-980/month** | Before LLM API costs |

LLM API costs are separate and depend entirely on usage volume and model selection.

---

## Appendix: Items Marked NEEDS VERIFICATION

1. **LiteLLM SCIM v2** -- Issue #34241 claims entire implementation is in MIT files. Verify by inspecting `litellm/proxy/` for SCIM endpoints and checking for enterprise/ imports.

2. **LiteLLM tag-based budgets** -- Same issue claims MIT implementation. Verify `litellm/proxy/tag_budgets.py` for enterprise/ dependencies.

3. **LiteLLM secret manager integrations** -- Claimed to be MIT-coded. Verify HashiCorp Vault, AWS KMS, Azure Key Vault integrations for enterprise/ imports.

4. **LiteLLM audit log creation** -- Claimed MIT. Verify `litellm/proxy/` audit log code for enterprise/ dependencies.

5. **LiteLLM organization management** -- Claimed MIT (frontend-only gate). Verify backend CRUD operations for enterprise/ imports.

6. **Langfuse ClickHouse acquisition impact** -- Monitor for any license changes in future Langfuse versions. The v4 requirement for ClickHouse >= 25.12 should be tracked for any commercial ClickHouse features.

7. **OpenFGA performance benchmarks** -- The sub-millisecond claims come from blog posts and marketing. Run independent benchmarks with the platform's expected authorization model complexity and tuple volume before committing to production.

---

*Research conducted 2026-08-13 via primary source analysis of GitHub repositories, official documentation, license files, and community discussions.*
