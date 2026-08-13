# Safe to Use as Dependencies

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

## Permissive Licenses (Safe for Commercial Use)

These repositories can be used as dependencies, modified, and distributed with minimal obligations (typically: include the license file):

### MIT Licensed
- langchain-ai/langgraph
- microsoft/agent-framework
- getzep/graphiti
- BerriAI/litellm (core)
- langfuse/langfuse (core)
- temporalio/temporal
- modelcontextprotocol/* (all MCP repos)

### Apache 2.0 Licensed
- google/adk-python, google/adk-js
- strands-agents/sdk-python, sdk-typescript
- cube-js/cube (core)
- rilldata/rill
- lancedb/lancedb
- ClickHouse/ClickHouse
- openfga/openfga
- datahub-project/datahub
- open-metadata/OpenMetadata
- terminusdb/terminusdb
- dagster-io/dagster

## Caution Required

### MPL-2.0 (File-Level Copyleft)
- agno-agi/agno — can use as dependency; if you modify Agno's source files, those files must stay MPL-2.0
- typedb/typedb — same MPL-2.0 rules

### Verify Before Use
- BerriAI/litellm — verify enterprise features licensing
- langfuse/langfuse — verify EE feature boundaries
- semantica-agi/semantica — license not yet verified
- trustgraph-ai/trustgraph — license not yet verified

## NOT Safe to Use

### AGPL-3.0
- xpert-ai/xpert — DO NOT use as dependency in commercial product

### Custom License
- langgenius/dify — DO NOT use without reading and approving custom license terms
