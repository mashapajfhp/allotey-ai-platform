# Commercial Platform Comparison Matrix

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

## Platform Overview

| Capability | Palantir | Databricks | Snowflake | Microsoft | AWS | Google | Salesforce |
|------------|----------|------------|-----------|-----------|-----|--------|------------|
| **Core Strength** | Operational ontology | Unified AI/data | NL analytics | Enterprise ecosystem | Managed infra | AI research + cloud | CRM domain agents |
| **Ontology/Domain Model** | Deep (primary innovation) | Moderate (Unity Catalog) | Moderate (Semantic Views) | Moderate (Fabric semantic) | Minimal | Minimal | Deep (CRM objects) |
| **Semantic Layer** | Part of ontology | AI/BI semantic model | Semantic Views/Models | Fabric semantic models | None native | None native | Data Cloud |
| **Agent Framework** | AIP agents | Mosaic AI agents | Cortex Agents | Agent Framework/Service | AgentCore | ADK | Agentforce |
| **Multi-Agent** | Yes | Supervisor agents | Limited | Yes | Yes | Yes (ADK) | Limited |
| **Actions/Tools** | Ontology Actions | UC Functions | Cortex functions | Agent tools | Tools | ADK tools | Actions |
| **Human-in-the-Loop** | Built-in | Limited | Limited | Built-in | Limited | Limited | Built-in |
| **MCP Support** | Yes | Yes (Unity Catalog) | Yes | NEEDS VERIFICATION | NEEDS VERIFICATION | Yes | NEEDS VERIFICATION |
| **A2A Support** | Unknown | Unknown | Unknown | Unknown | Unknown | Yes (originator) | Unknown |
| **Authorization Model** | Ontology security + markings | Unity Catalog ACLs | Role-based | On-Behalf-Of delegation | IAM | IAM | Profile-based |
| **Identity Delegation** | Ontology-mediated | Limited | Limited | Deep (OBO) | IAM roles | Service accounts | Limited |
| **Tenant Isolation** | Strong | Workspace-based | Account/role-based | Azure AD tenancy | Account-based | Project-based | Org-based |
| **Observability** | Built-in | MLflow tracing | Limited | Tracing + monitoring | CloudWatch | Cloud Logging | Einstein analytics |
| **Evaluation** | Limited public info | Mosaic AI evaluation | NEEDS VERIFICATION | Foundry evaluation | Bedrock evaluation | ADK eval | NEEDS VERIFICATION |
| **Provenance** | Strong (ontology actions) | Lineage (Unity Catalog) | Limited | NEEDS VERIFICATION | Limited | Limited | Einstein Trust Layer |
| **Knowledge/RAG** | Built-in | Vector Search + AI Search | Cortex Search | Knowledge retrieval | Knowledge Bases | Vertex Search | Data Cloud |
| **Durable Workflows** | Operational workflows | Jobs/Workflows | Tasks/Streams | Logic Apps/Durable Functions | Step Functions | Cloud Workflows | Flow |
| **Deployment** | On-prem + cloud | Multi-cloud (managed) | Cloud-only (managed) | Azure (+ multi-cloud) | AWS-only | GCP (+ multi-cloud) | Cloud-only (managed) |

## Architectural Lessons by Platform

### Palantir — Primary Conceptual Reference

**Key lesson:** The Ontology concept (Data + Logic + Actions + Security) is the most architecturally complete approach to enterprise AI operations. Agents interact with the ontology, not raw databases.

**What to learn:**
- Ontology as the operational abstraction layer
- Actions as governed operations on domain objects
- Security baked into the domain model, not bolted on
- Operational workflows grounded in domain entities

**What NOT to copy:**
- Closed-source proprietary platform (cannot use their implementation)
- Deep coupling to their specific data infrastructure
- Complex deployment model

### Databricks — Shared Control Plane Reference

**Key lesson:** Unity Catalog demonstrates the value of a shared governance control plane across data and AI. One catalog for tables, models, functions, volumes.

**What to learn:**
- Unified governance across heterogeneous assets
- Lineage tracking from data to model to deployment
- AI Gateway for model abstraction
- MLflow for experiment tracking

**What NOT to copy:**
- Spark-centric compute model (not needed for this platform)
- Heavy cloud-managed infrastructure dependency

### Snowflake — Semantic Analytics Reference

**Key lesson:** The structured data → semantic model → natural language analytics pipeline is the best reference for how agents should query business data.

**What to learn:**
- Semantic Views as declarative business meaning
- Verified queries for trustworthy analytics
- Cortex Analyst's approach to NL→SQL with semantic grounding

**What NOT to copy:**
- Snowflake-only compute model
- Limited agent capabilities (early stage)

### Microsoft — Identity Delegation Reference

**Key lesson:** On-Behalf-Of identity delegation (user → agent → downstream service while preserving user's authorization context) is the best reference for how agent authorization should work.

**What to learn:**
- OBO token delegation pattern
- Agent Framework orchestration
- Enterprise integration breadth
- Fabric IQ semantic model integration

**What NOT to copy:**
- Azure-specific coupling
- Microsoft ecosystem assumptions

### AWS — Managed Infrastructure Reference

**Key lesson:** AgentCore shows how to decompose agent infrastructure into composable services (runtime, gateway, identity, memory, tools).

**What to learn:**
- Clean separation of agent infrastructure concerns
- Managed knowledge base architecture
- Gateway pattern for model access

**What NOT to copy:**
- AWS-only deployment model
- Service coupling to AWS primitives

### Google — Protocol & Multi-Agent Reference

**Key lesson:** Google originated A2A and strongly supports MCP. ADK provides the best reference for multi-agent workflow patterns (sequential, parallel, loop, routing).

**What to learn:**
- A2A protocol for agent-to-agent communication
- ADK workflow agent patterns
- Multi-agent orchestration

**What NOT to copy:**
- GCP-centric deployment
- ADK is relatively new — evaluate maturity

### Salesforce — Domain Grounding Reference

**Key lesson:** Agentforce demonstrates agents operating directly on business-domain objects (CRM records, cases, opportunities). Domain grounding ensures agents reason about real business entities.

**What to learn:**
- Domain-grounded agent actions
- Trust/governance layer for agent operations
- Business-object-centric agent design

**What NOT to copy:**
- CRM-specific patterns that don't generalize
- Salesforce ecosystem coupling
