# Palantir Foundry and AIP Platform: Deep Overview

**STATUS: RESEARCHED -- Based on official Palantir documentation and verified public sources (August 2026)**

---

## 1. What Palantir Is

Palantir Technologies builds software platforms that transform how organizations operate by integrating data, decisions, and actions into a single system. The two core platforms are:

- **Palantir Foundry** -- An enterprise data operations platform that unifies data integration, transformation, analysis, and operational decision-making. Originally launched in 2016 as a cloud-native SaaS with microservice architecture.
- **Palantir AIP (Artificial Intelligence Platform)** -- An AI layer launched on top of Foundry that connects large language models and AI agents to live enterprise data, workflows, and operational systems via the Ontology.

Both platforms are underpinned by:

- **The Ontology** -- A living operational layer that models an organization's data, logic, processes, and security into a unified semantic and kinetic representation.
- **Apollo** -- A cloud-agnostic continuous delivery system that coordinates ongoing delivery of features, security updates, and platform configurations across any deployment environment.

## 2. Who Palantir Serves

Palantir serves two broad market segments:

| Segment | Examples | Key Characteristics |
|---------|----------|---------------------|
| **Government** | US DoD, intelligence agencies, allied government bodies | Classified environments, air-gapped networks, FedRAMP High, IL-5/IL-6 |
| **Commercial** | Healthcare systems, energy companies, manufacturing, supply chain, financial services | Operational decision-making, digital twins, AI-powered automation |

Notable: Palantir received FedRAMP High Baseline Authorization in December 2024 for its full product suite (AIP, Apollo, Foundry, Gotham, FedStart, Mission Manager).

## 3. Core Architecture

### 3.1 Platform Stack

```
+------------------------------------------------------+
|                    Applications                       |
|  (Workshop, Quiver, Vertex, Slate, OSDK Apps)        |
+------------------------------------------------------+
|                    AIP Layer                          |
|  (AIP Logic, Agent Studio, Evals, Observability)     |
+------------------------------------------------------+
|                    Ontology                           |
|  (Objects, Links, Actions, Functions, Security)      |
+------------------------------------------------------+
|                    Data Layer                         |
|  (Datasets, Pipelines, Transforms, Models)           |
+------------------------------------------------------+
|                    Rubix / Apollo                     |
|  (Kubernetes, Autoscaling, Delivery, Monitoring)     |
+------------------------------------------------------+
```

### 3.2 The Ontology System (Three Conceptual Layers)

The Ontology is architecturally decomposed into three layers:

1. **Language** -- Defines semantic elements (object types, properties, link types) and kinetic elements (action types, functions, logic). This is the schema and vocabulary of the organization.

2. **Engine** -- Substantiates every Language component through dual architectures:
   - **Read side**: High-scale SQL queries, real-time subscription to state changes, materializations for mixed human-AI teams.
   - **Write side**: Atomic transactional updates, batch mutations, streaming, Change Data Capture for low-latency operational mirroring.

3. **Toolchain** -- The full expressivity of Language + Engine power exposed to developers through the Ontology SDK (OSDK), application frameworks, and DevOps tooling for production governance.

### 3.3 Rubix Infrastructure

All Palantir services run on **Rubix**, a hardened Kubernetes implementation with:

- Ephemeral compute nodes with enforced 48-hour maximum lifecycle
- Secure-by-default networking
- Dynamic and intelligent autoscaling
- Compliance certifications: FedRAMP High, DOD DISA IL-5/IL-6, CMMC
- Hundreds of thousands of Spark jobs across thousands of nodes per day

### 3.4 Apollo Delivery

Apollo is the single control layer that coordinates:

- Continuous delivery of new features and security updates
- Platform configuration management
- Cross-environment deployment (cloud, on-premise, air-gapped, edge)
- FedRAMP-compliant operations in government clouds

## 4. Major Capabilities

### 4.1 Data Integration and Pipeline

- All modalities of data integration: batch, streaming, real-time replication via CDC
- Extensible compute frameworks: multi-node (Spark, Flink) and single-node (DuckDB, Polars)
- Automatic data lineage tracking for all back-end pipelines
- Support for structured, semi-structured, and unstructured data

### 4.2 Ontology-Mediated Operations

The Ontology is the central abstraction through which all operations flow. It is NOT a traditional data model or semantic layer. It is an operational layer containing:

- **Semantic elements**: Objects, properties, links (the "nouns" of the organization)
- **Kinetic elements**: Actions, functions, automations, dynamic security (the "verbs")
- Both human users and AI agents interact with the same Ontology, using the same objects, logic, and action primitives

### 4.3 AI and Agent Capabilities (AIP)

- Secure access to commercial LLMs (GPT, Gemini, Claude, Grok) with guarantees: no data retention, no retraining by third-party providers
- Open-source model hosting on Palantir-managed infrastructure
- AIP Logic: No-code environment for building LLM-powered functions
- AIP Agent Studio (Chatbot Studio): Interactive assistants with enterprise-specific tools
- AIP Evals: Systematic testing for non-deterministic LLM outputs
- AIP Observability: Execution traces, performance metrics, debugging across AI workflows

### 4.4 Application Development

- **Workshop**: Drag-and-drop operational application builder
- **OSDK (Ontology SDK)**: TypeScript, Python, and Java client code generation for external applications
- **Ontology MCP**: Expose Ontology resources as MCP tools for external AI agents
- **Palantir MCP**: Development tools for building and modifying Ontology types from IDEs

### 4.5 Security and Governance

- Marking-based mandatory access controls (PII, financial data, classified)
- Organization-level tenant isolation with strict silos
- Row-level, column-level, and cell-level security policies on Ontology objects
- Classification-based access controls with attribute-based rules
- Comprehensive audit logging for every API call, attributed to identity
- Data lineage tracking across all transformations

## 5. Deployment Model

Palantir supports multiple deployment models:

| Model | Description |
|-------|-------------|
| **Palantir Cloud (SaaS)** | Palantir-managed cloud infrastructure |
| **Customer Cloud** | Deployed in customer's AWS, Azure, or GCP environment |
| **On-Premise** | Deployed in customer's own data centers |
| **Air-Gapped** | Fully disconnected environments for classified workloads |
| **Edge** | Deployed at edge locations with limited connectivity |
| **FedStart** | Palantir-operated FedRAMP-accredited environment for government agencies |

Apollo manages delivery across all these environments through a single control plane.

## 6. Pricing and Licensing

- Palantir does not publish list prices
- Commercial engagements typically range from approximately $250,000/year (single use case) to several million (enterprise program)
- Most first contracts at mid-market and large enterprises land between $500,000 and $2 million annually
- Licensing terms prohibit reverse engineering, sublicensing, modification, or incorporation into other software without written authorization
- The platform is entirely proprietary; there is no open-source version of Foundry or the Ontology
- Palantir has offered free and low-cost developer tiers for learning the platform

## 7. What Problems It Solves

1. **Data fragmentation** -- Unifies disparate data sources (ERPs, CRMs, industrial databases, sensors, document stores) into coherent semantic concepts
2. **Semantic gap** -- Bridges the gap between raw data and business meaning through the Ontology
3. **Decision-action disconnect** -- Connects analytical insights directly to operational actions and automations
4. **AI grounding** -- Gives LLMs structured, governed, enterprise-specific context instead of arbitrary database access
5. **Security complexity** -- Provides mandatory, propagating security controls that follow data regardless of how it is derived or consumed
6. **Deployment flexibility** -- Supports classified, regulated, and commercial environments from a single platform

## 8. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Ontology as central abstraction | All users (human and AI) interact through a single governed layer |
| Read/write Ontology (not read-only) | Enables operational use cases, not just analytics |
| Mandatory access controls | Security propagates through all derivations automatically |
| Model-agnostic AI layer | Swap LLMs without changing applications |
| Apollo for delivery | Single control plane across every deployment topology |
| Rubix ephemeral nodes | Forces resilience and prevents configuration drift |

---

**Sources:**
- [Palantir Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview)
- [AIP Architecture Overview](https://www.palantir.com/docs/foundry/architecture-center/aip-architecture)
- [The Ontology System](https://www.palantir.com/docs/foundry/architecture-center/ontology-system)
- [Palantir Foundry Platform](https://www.palantir.com/platforms/foundry/)
- [Platform Overview Architecture](https://www.palantir.com/docs/foundry/platform-overview/architecture/index.html)
- [The Rubix Substrate](https://www.palantir.com/docs/foundry/architecture-center/rubix)
