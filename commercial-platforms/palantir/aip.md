# Palantir AIP (Artificial Intelligence Platform): Deep Study

**STATUS: RESEARCHED -- Based on official Palantir documentation and verified public sources (August 2026)**

---

## 1. What AIP Is

Palantir AIP (Artificial Intelligence Platform) is an AI layer that connects large language models and AI agents to live enterprise data, workflows, and operational systems via the Ontology. It is not a standalone product -- it is built directly on top of Foundry and the Ontology, extending them with AI capabilities.

AIP's core proposition: **LLMs understand your business because the Ontology already contains the business vocabulary, data relationships, actions, and security policies that ground AI in operational reality.**

## 2. AIP Architecture: 12 Capability Categories

Per Palantir's official architecture documentation, AIP comprises 12 capability categories:

### 2.1 LLM Integration and Security
- Secure access to the full range of commercial LLMs: GPT, Gemini, Claude, Grok models
- Open-source model hosting on Palantir-managed infrastructure
- Critical guarantee: **no transmitted data is retained by third-party providers, and no transmitted data is used for retraining**
- Model-agnostic: applications and agents can swap between models without code changes

### 2.2 Ontology System (Foundation)
- The Ontology serves as AIP's foundational context layer
- Models organizational operations into machine-readable and human-readable representations
- Enables querying billions of objects and orchestrating thousands of actions
- Incorporates feedback-based learning into the Ontology itself

### 2.3 Context Engineering
Context engineering is the pipeline that transforms raw enterprise data into usable agent context:

- **Contextual data** -- Raw enterprise data becomes structured Ontology objects
- **Contextual logic** -- Business rules, functions, and derived values provide reasoning primitives
- **Systems of action** -- Ontology actions and automations provide execution capabilities

This is where Palantir's approach fundamentally differs from typical RAG pipelines. Instead of just vectorizing documents and retrieving chunks, AIP agents navigate a typed, governed, relational data model.

### 2.4 Vector and Compute Services
- Integrated vectorization for embeddings (used in RAG and semantic search)
- Extensible compute frameworks: multi-node (Spark, Flink) and single-node (DuckDB, Polars)
- Integrated tool services that work with the Ontology as an "ever-evolving tool factory"

### 2.5 Operational Automation
Three modes of automation:

| Mode | Trigger | Example |
|------|---------|---------|
| **Schedule-based** | Cron/interval | Daily report generation |
| **Event-driven** | Streaming data, state changes | Alert when equipment sensor crosses threshold |
| **API-driven** | External calls, webhooks | Customer order triggers fulfillment workflow |

### 2.6 Agent Lifecycle
See `agents.md` for full detail. Summary: agents are built using no-code, low-code, or pro-code workbenches, with durable orchestrations and integrated evaluation.

### 2.7 Security and Governance
- Role-, marking-, and purpose-based controls
- Rigorous access policies across operational, engineering, and developer activities
- Comprehensive audit logging
- LLMs receive access only to what is necessary to complete a task

### 2.8 Developer Environments
- Integrated IDEs: VS Code, JupyterLab connected to Ontology applications
- Testing frameworks within the platform
- Platform SDK and Ontology SDK for external development
- Palantir MCP for AI-assisted development in external IDEs

### 2.9 Observability
- Fine-grained monitoring of all data flows, user/agent actions, execution cascades
- Token consumption tracking across workflows
- Distributed tracing across functions, actions, LLMs, automations
- See Section 7 for details

### 2.10 Enterprise Automation Agents
- Specialized AI agents: AI FDE (data engineering), AIP Analyst (analysis)
- Operate on the same foundation as human users
- Enable autonomous data pipeline construction, model training, application development
- Integrated change management and approval workflows

### 2.11 Data Integration
All modalities: batch, streaming, real-time replication via CDC, maintaining security, governance, and provenance across all integration paths.

### 2.12 Application Development
Workshop, OSDK, and external application frameworks all consume the same Ontology, ensuring consistent behavior across interfaces.

## 3. AIP Logic

### What It Is
AIP Logic is a **no-code development environment** for building, testing, and releasing functions powered by LLMs. It removes the complexity of development environments and API calls, making LLM function development accessible to non-technical application builders.

### How It Works

1. **Build blocks** -- Visual blocks that compose into functions. Blocks can include LLM-powered steps, Ontology queries, conditional logic, and output formatting.
2. **Engineer prompts** -- Configure natural language prompts directly within the visual interface. Prompts can reference Ontology objects and properties as context.
3. **Test** -- Run the function against test inputs within the Logic interface.
4. **Evaluate** -- Use AIP Evals to systematically test against expected outputs.
5. **Monitor** -- Track execution metrics, token usage, and error rates.
6. **Automate** -- Deploy as part of operational workflows.

### Function Structure
- **Inputs**: Ontology objects (typed references to real objects) or text strings
- **Outputs**: Objects, strings, or Ontology edits (staged writes)
- **Security**: Same rigorous security model as the rest of Foundry. User and function-level permissions control what data the LLM can access.

### Prompt Engineering on Ontology
The key insight: prompts in AIP Logic are not just text templates. They can reference:
- Specific Ontology object properties (e.g., "This customer's order history: {{order.items}}")
- Related objects via link traversal
- Function outputs from other blocks
- Application state variables

This means the LLM receives **structured, typed, business-meaningful context** rather than unstructured text dumps.

### Staged Writes
AIP Logic supports staged writes -- LLM-generated edits that can be:
- **Automatically applied** to the Ontology (for low-risk, high-confidence operations)
- **Surfaced for human review** before application (human-in-the-loop pattern)

## 4. How AIP Uses Ontology Context

### The Five Layers of Agent-Ontology Interaction

Based on Palantir's architecture, AIP agents interact with the Ontology through five layers:

1. **Retrieval Context** -- Documents, embeddings, and unstructured data vectorized and retrievable via semantic search. Provides background knowledge.

2. **Object Query** -- Structured queries against typed Ontology objects. Agents can filter, aggregate, inspect properties, and traverse links to find specific data.

3. **AIP Logic** -- LLM-powered functions that process context and produce reasoned outputs. This is where prompt engineering meets Ontology context.

4. **Action Tools** -- Ontology actions exposed as tools that agents can invoke (with parameters, validation, side effects). This is how agents make changes to the world.

5. **Governance** -- Security policies, markings, audit logging, and human approval workflows that constrain what agents can see and do at every layer.

### Why This Matters
Agents do NOT access underlying database tables directly. They do NOT freely scan the complete Ontology schema. They operate within a configured and authorized boundary, interacting through Ontology-exposed objects, relationships, contexts, functions, and actions.

This architectural constraint is what makes enterprise AI agents safe for production deployment.

## 5. Model Integration

### Model Abstraction
AIP abstracts the model layer:
- Applications and agents are built against the Ontology and AIP Logic, not against a specific model
- The underlying LLM can be swapped (GPT-4 to Claude to Gemini) without changing application code
- Model selection can be made per-function, per-agent, or per-organization

### Supported Model Classes
- **Commercial LLMs**: GPT family, Gemini, Claude, Grok (via Palantir-managed secure proxy)
- **Open-source models**: Hosted on Palantir infrastructure within the customer's security boundary
- **Custom fine-tuned models**: Trained and deployed within Foundry's ML infrastructure

### Data Guarantees
- No data transmitted to third-party LLM providers is retained
- No data is used for retraining external models
- All model calls go through Palantir's security and audit layer

## 6. Guardrails

### Content Filtering
Safety guardrails apply content filtering, PII handling, and policy controls to every model call within AIP.

### Access Control Guardrails
- LLMs receive access only to the data necessary to complete a task
- Ontology security policies (markings, row/column/cell level) apply to LLM access
- Action permissions are enforced even when agents invoke actions

### Submission Criteria
Actions invoked by AI agents must still pass all submission criteria (business logic validation) before execution. The Ontology does not have a separate, lower-security path for AI-triggered actions.

### Human-in-the-Loop
For high-stakes operations:
- AI agents create proposals rather than directly executing
- Proposals are surfaced to human operators via Workshop or other interfaces
- Operators can refine, approve, or reject
- This pattern is explicitly supported in AIP Logic through staged writes

### Audit Trail
- Every model call is logged with full provenance
- Every action taken by an agent is audited identically to human actions
- Token consumption is tracked per function, per agent, per workflow

## 7. AIP Observability

### Metrics
Near real-time success/failure counts and P95 execution duration for functions, actions, and AIP Logic components.

### Execution History
Monitor functions, actions, automations, and AIP Logic executions spanning the previous 30 days.

### Distributed Tracing
Visualize the complete execution flow across functions, actions, language models, automations, and Ontology loads. This enables debugging of complex multi-step agent workflows.

### Logging
Access service logs, custom function messages, token usage data, prompts, and detailed error information. Log search allows searching across all service logs for a source executor to find specific patterns across multiple executions.

### Performance Monitoring
Identify bottlenecks and receive optimization recommendations for execution times.

### Workflow Lineage Integration
AIP observability integrates into Workflow Lineage, enabling cross-functional teams to monitor and optimize performance at every level of applications, workflows, and products built with AIP and the Ontology.

## 8. AIP Evals

### Purpose
AIP Evals is a testing environment specifically designed to address the non-deterministic nature of LLMs. It enables systematic evaluation of:
- AIP Logic functions
- AIP Chatbot functions
- Code-authored functions

### Components

| Component | Description |
|-----------|-------------|
| **Test cases** | Defined sets of inputs and expected outputs |
| **Evaluation functions** | Methods that compare actual output against expected output |
| **Metrics** | Results of evaluation functions, produced per test case |
| **Evaluation suite** | Bundle of test cases + target functions + evaluation functions |

### Capabilities
- Compare performance of different LLMs on the same functions
- Examine variance across multiple runs (critical for non-deterministic outputs)
- Debug and iterate on function definitions and prompts
- Test multiple target functions simultaneously within a single suite
- Compare aggregate and per-test-case metrics between runs

---

**Sources:**
- [AIP Overview](https://www.palantir.com/docs/foundry/aip/overview)
- [AIP Architecture Overview](https://www.palantir.com/docs/foundry/architecture-center/aip-architecture)
- [AIP Features](https://www.palantir.com/docs/foundry/aip/aip-features)
- [AIP Logic Overview](https://www.palantir.com/docs/foundry/logic/overview)
- [AIP Evals Overview](https://www.palantir.com/docs/foundry/aip-evals/overview)
- [AIP Observability Overview](https://www.palantir.com/docs/foundry/aip-observability/overview)
- [AI Ethics and Governance](https://www.palantir.com/docs/foundry/aip/ethics-governance)
