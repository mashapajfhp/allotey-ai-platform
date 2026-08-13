# Repository Notes

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

Quick reference notes for repository evaluation. Detailed research is in the category-specific directories.

## Research Protocol

For each repository, follow this order:
1. Read README
2. Read AGENTS.md (if present)
3. Read architecture documentation
4. Inspect repository/package structure
5. Inspect public interfaces
6. Inspect schema definitions
7. Inspect tests
8. Inspect security documentation
9. Inspect deployment architecture
10. Inspect LICENSE
11. Only then inspect implementation details

## Notes

### cube-js/cube
- Monorepo with packages for different database drivers
- `packages/cubejs-schema-compiler` — the core semantic model compiler
- `packages/cubejs-api-gateway` — REST/GraphQL API
- `packages/cubejs-server-core` — server runtime
- Security context is passed per-request for multi-tenancy
- Pre-aggregation system is a major differentiator

### openfga/openfga
- Go implementation of Zanzibar
- `pkg/server` — core authorization engine
- `pkg/storage` — pluggable storage backends
- Authorization model defined in DSL or JSON
- Contextual tuples enable dynamic authorization
- CNCF sandbox project

### BerriAI/litellm
- Python library + proxy server
- `litellm/` — core provider abstraction
- `litellm/proxy/` — proxy server with virtual keys, budgets
- 100+ provider support
- Verify which proxy features require enterprise license

### langfuse/langfuse
- TypeScript/Python SDKs + self-hostable web app
- `packages/shared` — core data model
- `web/` — Next.js web application
- `python/` — Python SDK
- Traces, generations, prompts, datasets, evaluations

### temporalio/temporal
- Go server + SDKs in multiple languages
- `service/` — core services (frontend, matching, history, worker)
- `temporal-server` — main runtime
- Workflows are deterministic replay functions
- Activities are non-deterministic side effects

### getzep/graphiti
- Python library
- Episodes, entities, relationships as core concepts
- Temporal facts with valid_from/valid_until
- Neo4j as backing store
- MCP server available

### datahub-project/datahub
- Java/Python monorepo
- `metadata-models/` — metadata schema definitions (PDL)
- `datahub-graphql-core/` — GraphQL API
- `metadata-ingestion/` — source connectors
- MCP server for AI context

NEEDS EXPANSION: Add notes for all Tier 1 and Tier 2 repositories.
