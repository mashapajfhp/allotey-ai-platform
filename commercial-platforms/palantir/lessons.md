# Palantir: Lessons Learned for the Allotey AI Platform

**STATUS: RESEARCHED -- Based on official Palantir documentation and verified public sources (August 2026)**

---

## 1. What to Learn from Palantir

### 1.1 The Ontology as Central Abstraction

**Lesson:** The single most important idea in Palantir's architecture is that all users (human and AI) interact with organizational data through a single, governed, semantically rich abstraction layer -- the Ontology -- rather than directly accessing databases, APIs, or data lakes.

**Why it matters:** This eliminates the "semantic gap" where AI agents must guess what data means. The Ontology already contains the business vocabulary, relationships, and governance rules. Agents reason over business concepts ("Customer," "Order," "Approve"), not database tables ("tbl_cust_ord_2023_v3").

**Pattern to study:** Data + Logic + Actions + Security = Operational Ontology. A read-only semantic layer is insufficient for operational AI. The Ontology must support governed writes (actions), computed values (functions), and mandatory security (markings) -- not just queries.

### 1.2 Actions as First-Class Citizens

**Lesson:** Making mutations (actions) a first-class, schema-defined, validated, audited primitive is critical for production AI. Without this, agents either cannot change anything (useless for operations) or can change anything without guardrails (dangerous).

**What to study:**
- Typed parameters with validation
- Submission criteria (pre-conditions that encode business rules)
- Transactional atomicity (all-or-nothing)
- Side effects (webhooks, notifications) as declared parts of the action definition
- Writeback vs. side-effect webhook modes for external system consistency

### 1.3 Security That Propagates

**Lesson:** Palantir's marking system -- where a security classification applied to a dataset automatically propagates to all derived data -- is a profound architectural choice. It means you never have to manually track which downstream assets contain sensitive data.

**What to study:**
- Mandatory access controls that cannot be overridden by data custodians
- Propagation through all transformations and derivations
- Cell-level security (combination of row-level and column-level policies)
- The distinction between discretionary permissions (RBAC) and mandatory controls (markings)

### 1.4 Model Abstraction

**Lesson:** AIP's model-agnostic design (swap GPT for Claude for Gemini without changing application code) is the correct architecture for an AI platform. Models will change; the abstraction layer should not.

**What to study:**
- Data guarantee: no retention, no retraining by third-party providers
- Per-function/per-agent model selection
- Native tool calling vs. prompted tool calling as a model-capability-dependent choice
- AIP Evals for comparing model performance on the same functions

### 1.5 Durable Orchestrations

**Lesson:** Real enterprise workflows are long-running, multi-step, multi-agent, and failure-prone. Palantir's durable orchestrations with configurable retry policies (constant backoff, exponential backoff) and fallback effects address this reality.

**What to study:**
- Coordinator agent pattern (one agent tracks overall progress while specialists handle sub-tasks)
- Error packaging and recovery strategies
- Scaling to tens of thousands of simultaneous orchestrations

### 1.6 Evaluation as Core Feature

**Lesson:** AIP Evals is not an afterthought -- it is a core platform feature. The non-deterministic nature of LLMs requires systematic, repeatable evaluation before deployment and after any change.

**What to study:**
- Test cases with defined inputs and expected outputs
- Custom evaluation functions (not just string matching)
- Variance analysis across multiple runs
- Cross-model comparison on identical test suites

## 2. What to Copy Conceptually

### 2.1 The Four-Fold Integration Model

Copy the conceptual model: **Data + Logic + Actions + Security** integrated into a single operational layer. Do not build a data layer, a separate logic layer, a separate action system, and a separate security system. They must be unified.

### 2.2 Agent-Ontology Boundary

Copy the principle that agents interact through the Ontology, never through raw data access. This boundary is what makes enterprise AI agents safe, auditable, and governable.

### 2.3 Tool Typing and Description

Copy the pattern of strongly-typed, well-described tools with semantic descriptions that guide LLM tool selection. Palantir's Agent tool description field is a simple but powerful mechanism.

### 2.4 Human-in-the-Loop Patterns

Copy the multiple levels of human oversight:
- Staged writes (propose, review, approve)
- Action confirmation (agent proposes, user confirms)
- Request clarification (agent pauses to ask)

### 2.5 Immutable Edit History

Copy the immutable audit trail design: edit history records that cannot be deleted or modified by end users. This is non-negotiable for enterprise compliance.

### 2.6 MCP as External Agent Interface

Copy the pattern of exposing Ontology resources as MCP tools for external AI agents. The distinction between "builder MCP" (modify schema) and "consumer MCP" (read/write data) is worth adopting.

### 2.7 Observability at Every Layer

Copy the integration of observability into every layer: distributed tracing across functions, actions, LLMs, automations, and Ontology loads. Include token consumption tracking.

## 3. What NOT to Copy

### 3.1 Monolithic Platform Lock-In

**Do not copy** Palantir's strategy of making the Ontology inseparable from the proprietary platform. The Ontology concept is powerful, but it should be implementable on open infrastructure.

**Why:** Palantir's Ontology lives inside Foundry. You cannot adopt the Ontology without adopting Foundry, and you cannot export an Ontology model to run elsewhere. This creates vendor lock-in that costs $500K-$2M+ per year with no exit path.

**Alternative:** Build an open Ontology layer that can be backed by multiple data stores and deployed independently.

### 3.2 Proprietary Everything

**Do not copy** the approach of making every component proprietary:
- Rubix (proprietary Kubernetes wrapper) -- use standard Kubernetes
- Apollo (proprietary delivery system) -- use standard CI/CD (ArgoCD, Flux)
- Workshop (proprietary application builder) -- use open application frameworks

### 3.3 Price-Based Exclusivity

**Do not copy** the pricing model that makes the platform accessible only to large enterprises and government agencies. The architecture patterns are valid at any scale.

### 3.4 70+ MCP Tools

**Do not copy** the approach of exposing 70+ tools to a single MCP client. This creates an overwhelming context window for LLMs. Prefer focused, task-specific tool sets.

### 3.5 Nomenclature Churn

**Do not copy** the pattern of renaming core concepts (AIP Agent Studio became AIP Chatbot Studio, parameters became Application State, validations became Submission Criteria). Pick names and commit to them.

## 4. What Could Be Adopted

### 4.1 Open Standards and Protocols

| Standard | Palantir's Approach | What to Adopt |
|----------|--------------------|----|
| **MCP** | Full support (two implementations) | Adopt MCP for external agent access to platform resources |
| **A2A** | No confirmed support (NEEDS VERIFICATION) | Evaluate A2A for cross-platform agent coordination |
| **OpenAPI** | Used internally | Adopt OpenAPI for all platform APIs |

### 4.2 Evaluation Framework

Adopt the AIP Evals pattern:
- Evaluation suites with test cases, evaluation functions, and metrics
- Model comparison on identical test suites
- Variance analysis for non-deterministic outputs

This could be implemented using open-source evaluation frameworks (e.g., LangSmith, Braintrust, or custom) rather than a proprietary solution.

### 4.3 Durable Orchestration Pattern

Adopt durable orchestrations for long-running agent workflows. This could be implemented using:
- Temporal.io (open-source workflow engine)
- Inngest (serverless workflow engine)
- Custom implementation with state persistence and retry policies

### 4.4 Object Security Policy Pattern

Adopt the pattern of row-level and column-level security policies defined at the Ontology layer, independent of the backing data store. This could be implemented using:
- PostgreSQL Row-Level Security (RLS) as a backing mechanism
- Application-layer policy evaluation
- Attribute-based access control (ABAC) libraries

### 4.5 Marking Propagation Pattern

Adopt the concept of security markings that propagate through data derivations. This is architecturally challenging but critical for handling sensitive data.

Implementation approach: Track data lineage metadata and propagate marking tags through all transform operations.

## 5. What Must Be Built Independently

### 5.1 Open Ontology Layer

Build an open-source or open-standard Ontology layer that:
- Defines object types, properties, links, actions, and functions as schema
- Can be backed by PostgreSQL, Supabase, or other data stores
- Generates TypeScript/Python SDKs from the schema
- Enforces security policies at the Ontology layer
- Is deployable independently of any proprietary platform

### 5.2 Action Engine

Build an action execution engine that:
- Validates submission criteria before execution
- Executes rules atomically
- Triggers side effects (webhooks, notifications)
- Maintains immutable edit history
- Works with the Ontology layer for type safety

### 5.3 Agent Runtime

Build an agent runtime that:
- Connects to the Ontology layer for tool discovery
- Supports multiple LLM backends (model abstraction)
- Implements human-in-the-loop patterns
- Provides durable orchestration for multi-step workflows
- Integrates with evaluation and observability systems

### 5.4 Security Infrastructure

Build security infrastructure that:
- Implements RBAC at the application layer
- Implements row/column/cell-level policies at the data layer
- Supports mandatory access controls with propagation
- Provides comprehensive audit logging
- Supports multi-tenant isolation

### 5.5 Observability Stack

Build or integrate an observability stack that:
- Traces execution across functions, actions, LLMs, and automations
- Tracks token consumption per function and agent
- Provides performance metrics and bottleneck identification
- Integrates with the Ontology layer for workflow lineage

## 6. Architecture Patterns Worth Studying

### 6.1 Read/Write Duality in the Ontology Engine
The Ontology Engine has separate read and write architectures optimized for different workloads:
- **Read side**: High-scale queries, real-time subscriptions, materializations
- **Write side**: Atomic transactions, batch mutations, streaming, CDC

This separation allows scaling reads and writes independently.

### 6.2 Language-Engine-Toolchain Decomposition
Separating the Ontology into Language (schema), Engine (execution), and Toolchain (developer experience) is a clean architectural decomposition that could guide platform design.

### 6.3 Context Engineering Pipeline
Palantir's context engineering is more sophisticated than typical RAG:
- Contextual data (structured Ontology objects, not just text chunks)
- Contextual logic (functions and business rules as agent context)
- Systems of action (tools for the agent to use, not just information to consume)

### 6.4 Ephemeral Infrastructure
Rubix's 48-hour maximum node lifecycle forces all services to be designed for disruption and resilient failover. This is an extreme but effective approach to operational resilience.

### 6.5 Two-Tier MCP Pattern
Separating "builder tools" (modify schema) from "consumer tools" (read/write data) into two distinct MCP servers is a clean pattern for managing different levels of access and trust.

## 7. Anti-Patterns to Avoid

### 7.1 The "Semantic Layer Trap"
Building a read-only semantic layer and calling it an Ontology. If it cannot handle governed writes (actions), it is a BI tool, not an operational platform.

### 7.2 The "Agent Bypass"
Creating a separate, lower-security path for AI agents. Agents must be subject to the same validation, authorization, and audit as human users.

### 7.3 The "Everything Model"
Trying to model the entire organization into the Ontology at once. Palantir implementations typically take 6-18 months. Start with a narrow domain and expand.

### 7.4 The "Free-Form Agent"
Giving agents access to raw SQL or arbitrary database operations. This is what the Ontology boundary is designed to prevent.

### 7.5 The "Audit Afterthought"
Adding audit logging after the system is built. Audit must be integral to every operation from the start.

### 7.6 The "Proprietary Trap"
Building every component from scratch. Use open-source infrastructure (Kubernetes, PostgreSQL, Temporal, standard LLM APIs) and build proprietary value at the Ontology and agent orchestration layers.

## 8. License Restrictions

### What You Cannot Do with Palantir
- Reverse engineer the platform
- Sublicense or distribute the platform
- Modify the platform or incorporate it into other software without written authorization
- Use Palantir products except in connection with the Palantir Foundry platform

### What This Means for Our Platform
- We cannot embed or wrap any Palantir software
- We cannot use Palantir's proprietary data formats or protocols
- We can study and learn from Palantir's published architecture documentation
- We can implement similar architectural patterns independently
- We should use open standards (MCP, OpenAPI, SQL) rather than Palantir-specific interfaces

### Open-Source Components from Palantir
Palantir has open-sourced some adjacent tools:
- `palantir/palantir-mcp` -- The MCP installer/wrapper (open-source)
- Various build tools and libraries on GitHub
- However, the core platform (Foundry, Ontology, AIP) is entirely proprietary

## 9. Summary: Build vs. Learn vs. Avoid

| Category | Items |
|----------|-------|
| **Learn (study the concept)** | Ontology as central abstraction, Data+Logic+Actions+Security model, agent-Ontology boundary, marking propagation, durable orchestrations |
| **Adopt (use the pattern)** | MCP for tool exposure, evaluation frameworks, human-in-the-loop patterns, immutable edit history, model abstraction |
| **Build independently** | Open Ontology layer, action engine, agent runtime, security infrastructure, observability stack |
| **Avoid (anti-patterns)** | Monolithic lock-in, proprietary everything, agent bypass paths, semantic layer trap, free-form agent SQL access |

---

**Sources:**
- [Palantir Foundry Platform](https://www.palantir.com/platforms/foundry/)
- [Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview)
- [AIP Architecture Overview](https://www.palantir.com/docs/foundry/architecture-center/aip-architecture)
- [The Ontology System](https://www.palantir.com/docs/foundry/architecture-center/ontology-system)
- [Security Overview](https://www.palantir.com/docs/foundry/security/overview)
- [Palantir Connector Terms](https://www.palantir.com/assets/xrfr7uokpv1b/3MWySPWdUTfClioIasXFqU/fa3297a0a6cbc87e206caa7f2e5e293a/Palantir_Connector_Terms_of_Service.pdf)
- [Palantir AIP Negotiation (Redress)](https://redresscompliance.com/palantir-aip-foundry-negotiation)
- [What Palantir Costs (BD Emerson)](https://www.bdemerson.com/article/palantir-cost)
- [Ontology vs Semantic Layer (Atlan)](https://atlan.com/know/ontology-vs-semantic-layer/)
