# Priority Repositories

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

## Priority Tiers

### Tier 1 — Deep Study Required (Architecture-Critical)

These repositories contain concepts or implementations directly relevant to core platform decisions.

| Repository | Category | License | Why Priority |
|------------|----------|---------|-------------|
| cube-js/cube | Semantic Layer | Apache 2.0 | Best semantic layer implementation; likely adoption candidate |
| openfga/openfga | Authorization | Apache 2.0 | Zanzibar-model ReBAC; likely adoption candidate |
| BerriAI/litellm | Model Gateway | MIT | Best model abstraction; likely wrap candidate |
| langfuse/langfuse | Observability | MIT (core) | Best AI-specific observability; likely wrap candidate |
| temporalio/temporal | Workflows | MIT | Best durable workflow engine; likely adoption candidate |
| getzep/graphiti | Context Graph | MIT | Best temporal knowledge graph; concepts for context graph |
| datahub-project/datahub | Metadata | Apache 2.0 | Best metadata graph; likely wrap candidate |
| langchain-ai/langgraph | Agent Runtime | MIT | Most proven agent runtime |
| agno-agi/agno | Agent Runtime | MPL-2.0 | Most feature-complete agent platform |
| google/adk-python | Agent Runtime | Apache 2.0 | Best multi-agent patterns + A2A |
| xpert-ai/xpert | Emerging Platform | AGPL-3.0 | Most relevant agentic BI architecture (study only) |
| semantica-agi/semantica | Ontology | VERIFY | Decision intelligence concepts |

### Tier 2 — Review Required (Important Context)

| Repository | Category | License | Why Important |
|------------|----------|---------|--------------|
| trustgraph-ai/trustgraph | Context Graph | VERIFY | Holonic context graph concepts |
| typedb/typedb | Ontology | MPL-2.0 | Typed ontology with reasoning |
| terminusdb/terminusdb | Ontology | Apache 2.0 | Data versioning concepts |
| lancedb/lancedb | Knowledge | Apache 2.0 | Vector storage + hybrid retrieval |
| ClickHouse/ClickHouse | Analytics | Apache 2.0 | Analytical engine candidate |
| strands-agents/sdk-python | Agent Runtime | Apache 2.0 | AWS agent SDK patterns |
| microsoft/agent-framework | Agent Runtime | MIT | Microsoft orchestration patterns |
| open-metadata/OpenMetadata | Metadata | Apache 2.0 | Alternative to DataHub |
| langgenius/dify | Emerging Platform | Custom | Workflow engine + agent patterns |
| modelcontextprotocol/* | Protocols | MIT | MCP specification and SDKs |
| dagster-io/dagster | Workflows | Apache 2.0 | Data pipeline patterns |

### Tier 3 — Monitor (Emerging / Lower Priority)

| Repository | Category | License | Why Monitor |
|------------|----------|---------|------------|
| rilldata/rill | Semantic Layer | Apache 2.0 | BI-as-code patterns |
| UnicomAI/wanwu | Emerging Platform | VERIFY | Enterprise agent platform |
| RightNow-AI/openfang | Emerging Platform | VERIFY | Agent OS concepts |
| agnt-gg/agnt | Emerging Platform | VERIFY | Self-improving agents |
| compozy/compozy | Emerging Platform | VERIFY | Control plane patterns |
| agno-agi/agent-platform-railway | Agent Runtime | VERIFY | Meta-platform patterns |
| google/adk-samples | Agent Runtime | Apache 2.0 | ADK usage patterns |
| strands-agents/tools | Agent Runtime | Apache 2.0 | Tool implementation patterns |
| strands-agents/evals | Agent Runtime | Apache 2.0 | Evaluation patterns |

## Repository Health Indicators to Track

For each priority repository, periodically check:
- Last commit date (is it actively maintained?)
- Open issues / PRs (is maintenance responsive?)
- Release cadence (stable or experimental?)
- Breaking changes (is the API stable?)
- Contributor count (bus factor)
- Stars/forks trend (growing or stagnating?)
