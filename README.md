# Allotey AI Platform — Research & Architecture Repository

> **STATUS: ACTIVE RESEARCH — NOT AN IMPLEMENTATION REPOSITORY**

This repository is the architectural source of truth for a future cross-domain enterprise AI and operational intelligence platform. It contains deep research into commercial platforms, open-source projects, architectural patterns, licensing, and reusable design concepts.

**No platform code exists here.** This is research-first, architecture-second, implementation-later.

## Purpose

Enable the team to answer:

- What should this platform actually be?
- What are the correct abstractions?
- Which existing systems solve each layer?
- What should be adopted, wrapped, extended, or built?
- Where does defensible IP exist?
- What architectural mistakes must be avoided?

## Repository Structure

```
allotey-ai-platform/
├── commercial-platforms/    # Deep studies of enterprise AI platforms
│   ├── palantir/            # Foundry, AIP, Ontology, agents
│   ├── databricks/          # Unity Catalog, Genie, Mosaic AI
│   ├── snowflake/           # Cortex, Semantic Views, Intelligence
│   ├── microsoft/           # Foundry, Agent Framework, Fabric IQ
│   ├── aws/                 # AgentCore, Bedrock, Knowledge Bases
│   ├── google/              # Gemini Enterprise, ADK, A2A
│   └── salesforce/          # Agentforce, Data Cloud
│
├── open-source/             # OSS project research by category
│   ├── ontology-context/    # Semantica, TrustGraph, Graphiti, TypeDB
│   ├── semantic-layer/      # Cube, Rill
│   ├── agent-runtime/       # LangGraph, ADK, Strands, Agno
│   ├── model-gateway/       # LiteLLM
│   ├── knowledge-retrieval/ # LanceDB, vector DB comparisons
│   ├── analytics/           # ClickHouse, DuckDB, Pinot, Druid
│   ├── authorization/       # OpenFGA, SpiceDB, OPA
│   ├── observability/       # Langfuse, Arize Phoenix, OpenTelemetry
│   ├── workflows/           # Temporal, Inngest, Restate
│   ├── metadata-governance/ # DataHub, OpenMetadata
│   ├── protocols/           # MCP, A2A
│   └── emerging-platforms/  # Xpert, Dify, Wanwu, OpenFang, Agnt, Compozy
│
├── architecture/            # Capability models, reference architecture, threat models
├── comparisons/             # Side-by-side matrices and build-vs-adopt analysis
├── licensing/               # License compatibility research
├── github/                  # Priority repositories and source index
├── decisions/               # Architecture Decision Records (ADRs)
└── research-log/            # Chronological research session notes
```

## Research Principles

1. **No shallow README summarization** — every project is studied through its architecture, interfaces, schemas, tests, security, and deployment
2. **Primary sources first** — official docs, GitHub repos, architecture papers, maintainer blogs
3. **Current state** — verify freshness against recent releases and commits
4. **Distinguish clearly** between architectural inspiration, code reuse, dependency adoption, interface compatibility, and concepts requiring independent implementation
5. **Product-agnostic** — no references to existing products or businesses

## Key Concepts Under Research

This platform distinguishes between concepts that are often conflated:

| Concept | What It Represents |
|---------|-------------------|
| **Ontology** | Domain entities, relationships, actions, rules |
| **Semantic Layer** | Business metrics, dimensions, analytical relationships |
| **Context Graph** | Current/historical entities, facts, relationships |
| **Knowledge Store** | Documents, text, images, unstructured information |
| **Event Store** | Immutable record of things that happened |
| **Operational Database** | Current transactional state |
| **Analytical Database** | Aggregated/historical analytical data |
| **Metadata Graph** | Ownership, lineage, quality, schema, domain, policies |
| **Agent Memory** | Information relevant to agent/session/user over time |
| **Workflow State** | Durable state of a business process |

These concepts may integrate but are **not interchangeable**.

## How to Use This Repository

1. **Before making architecture decisions** — read the relevant research files
2. **Before adopting a dependency** — check `licensing/` and `comparisons/`
3. **Before implementing a capability** — check `architecture/capability-model.md` and `comparisons/build-vs-adopt.md`
4. **When making significant decisions** — create an ADR in `decisions/`

## Status

See [RESEARCH_STATUS.md](RESEARCH_STATUS.md) for current progress across all research areas.

## Contributing

See [AGENTS.md](AGENTS.md) for guidelines that apply to both human contributors and coding agents working in this repository.
