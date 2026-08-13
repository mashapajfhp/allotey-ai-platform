# Cube (cube-js/cube)

**Category:** Semantic Layer
**Repository:** https://github.com/cube-js/cube
**License:** Cube Client: MIT, Cube Backend: Apache 2.0
**Language:** Rust (query engine), TypeScript/JavaScript (SDK, API)
**Status:** RESEARCH COMPLETE
**Last Verified:** 2026-08-13

---

## What Problem Does It Solve?

Cube solves the problem of inconsistent metrics across BI tools, embedded analytics, and AI agents. Without a semantic layer, every consumer of data (dashboards, reports, agent queries) writes its own SQL, leading to conflicting numbers, duplicated business logic, and ungoverned access. Cube provides a single definition layer where metrics, dimensions, joins, and access rules are defined once in code, then exposed through SQL, REST, GraphQL, and MCP APIs.

The core thesis: data teams define business logic once (metrics-as-code), and every downstream consumer -- BI tool, embedded app, or AI agent -- gets the same governed numbers.

---

## Architectural Abstractions

### Cubes
The primary data modeling construct. Each cube represents a business entity (Orders, Users, Products) and encapsulates:
- SQL source table/view definition
- Measures (quantitative metrics: count, sum, avg, min, max, number)
- Dimensions (categorical attributes for grouping and filtering)
- Segments (reusable filter definitions for consistent business logic)
- Join relationships to other cubes
- Pre-aggregation strategies
- Security rules

### Views (Multi-Fact Views)
Composite datasets joining data from multiple cubes. Views allow complex analytical queries across related entities without exposing the underlying cube structure to consumers.

### Measures
Aggregations over columns. Each measure has a type (count, sum, avg, min, max, number) and SQL definition. Calculated measures can be derived from other measures. The `BaseMeasure` class handles SQL generation and patched measure computation.

### Dimensions
Attributes used for grouping and filtering. `BaseTimeDimension` specializes in time-series analysis, supporting granularities from seconds to years with both standard and custom time bucketing.

### Segments
Reusable filter definitions encapsulating business logic for consistent application across queries. Avoid repeated WHERE clause patterns.

### Joins
Define relationships between cubes. The schema compiler handles join resolution and security policy application. Multi-fact joins support combining data from several cubes based on dimensional relationships.

---

## Query Compiler and Execution

The `@cubejs-backend/schema-compiler` transforms data model definitions into executable SQL queries. The flow:

1. **Model Definition** -- YAML, JavaScript, or Python files defining cubes, measures, dimensions, joins
2. **Schema Compilation** -- compiler parses definitions and resolves joins, segments, security
3. **Query Planning** -- `OrchestratorApi` coordinates between compilation and orchestration
4. **Pre-aggregation Matching** -- finds the most suitable pre-aggregation for the query
5. **SQL Generation** -- produces optimized SQL for the target database
6. **Execution** -- `QueryOrchestrator` manages caching layers and database driver execution

Security context is injected at compile time, not runtime. This means "an agent cannot construct a query that returns forbidden rows, because the layer never compiles one."

---

## Pre-Aggregation System

One of Cube's most mature capabilities. Pre-aggregations are materialized views providing sub-second latency:

### Lifecycle Management
1. **Matching** -- finding the most suitable pre-aggregation for incoming queries
2. **Metadata Generation** -- producing keyQueries, previewSql, loadSql descriptions
3. **Rollup Joins** -- combining multiple pre-aggregations when necessary

### Partitioning Strategy
- Time-based partitioning (daily, monthly)
- Incremental refresh (only recent data updates)
- `RefreshScheduler` coordinates updates using `refreshKey` definitions
- Custom SQL for detecting data changes

### Roll-Up Anytime (2025+)
No longer need to pre-define every possible query combination in advance. WASM-powered query engine pushes P95 query latency to under one second on Snowflake for pre-aggregated queries.

### Cache Security
Cache keys must include tenant context. A pre-aggregation keyed without tenant scope will serve one tenant's rollup to another.

---

## Multi-Tenancy and Security

### Security Context
Multi-tenancy through `securityContext` extracted from JWTs:
1. **JWT Verification** -- `checkAuthFn` validates tokens and returns security context
2. **Row-Level Security** -- context injected into cube SQL using `FILTER_PARAMS` or `SECURITY_CONTEXT`
3. **Column-Level Security** -- per-tenant column visibility
4. **Isolation Configuration** -- `context_to_app_id` isolates compiled models per tenant
5. **Pre-aggregation Isolation** -- `pre_aggregations_schema` isolates rollup tables per tenant

Access policies live in the semantic layer and are evaluated at query compile time, not runtime. This is compile-time governance: the query SQL itself embeds the access rules.

---

## Data Sources Supported

All SQL data sources:
- **Cloud Warehouses:** Snowflake, Databricks, BigQuery
- **Query Engines:** Presto, Amazon Athena
- **Application Databases:** Postgres, MySQL, and others
- Compatible with any SQL-speaking data source

---

## APIs and Access Patterns

### SQL API (Postgres-compatible)
BI tools connect via standard Postgres wire protocol. They see governed metrics, not raw tables.

### REST API
Structured JSON queries and responses for embedded analytics.

### GraphQL API
Flexible querying for frontend applications.

### MCP Server (Model Context Protocol)
AI agents can:
1. **Discover** -- list available measures and dimensions with descriptions
2. **Select** -- form structured requests for specific metrics with filters
3. **Execute** -- semantic layer compiles to SQL with user's access rules applied

The agent never writes SQL. It requests metrics by name, and the semantic layer handles compilation, optimization, caching, and security.

---

## AI Agent Integration Pattern

The 2026 integration model uses MCP as the common interface:

```
AI Agent (Claude, ChatGPT, etc.)
    |
    MCP Server (introspect model, request metrics)
    |
    Cube Semantic Layer
    |-- Compile-time governance (row-level, role-based access)
    |-- Pre-aggregation caching (fast responses for agent follow-ups)
    |-- SQL generation (optimized for target warehouse)
    |
    Data Warehouse (Snowflake, BigQuery, etc.)
```

Key insight: agents generate many follow-up questions, so pre-aggregation caching is essential to manage warehouse costs and latency.

---

## Metrics-as-Code

Data model definitions are code (YAML, JavaScript, or Python):
- Version controlled in Git
- Reviewed through standard PR processes
- Deployed through CI/CD pipelines
- Testable and validatable before production

This means metric definitions have the same governance, review, and deployment rigor as application code.

---

## Observability and Evaluation

NEEDS VERIFICATION: Built-in observability features (query logging, latency tracking, cache hit rates). The `QueryOrchestrator` manages execution flow, suggesting internal metrics exist, but external observability integrations (Prometheus, OpenTelemetry) are not documented in the core repo.

---

## Scaling Considerations

- Pre-aggregation system provides sub-second latency for cached queries
- WASM query engine (2025+) for improved performance
- Horizontal scaling through multiple Cube instances
- Cache isolation per tenant prevents cross-tenant data leakage
- Query compiler handles join optimization and aggregation pushdown
- NEEDS VERIFICATION: published benchmarks on concurrent query throughput and maximum pre-aggregation sizes

---

## Trade-offs

**Strengths:**
- Most mature semantic layer for analytics (production-proven at scale)
- Compile-time security eliminates entire class of data leakage bugs
- Pre-aggregation system is genuinely sophisticated (partitioning, incremental refresh, rollup joins)
- MCP server for AI agent integration
- Multi-protocol access (SQL, REST, GraphQL, MCP)
- Metrics-as-code with Git governance

**Weaknesses:**
- Semantic layer only -- does not store data, requires underlying warehouse
- Pre-aggregation complexity (cache key management, refresh strategies, tenant isolation)
- Schema compilation can be slow for very large models
- No built-in knowledge graph or ontology features
- Commercial features (Cube Cloud) needed for full multi-tenancy management

---

## Should Cube Be Adopted, Wrapped, Inspired From, or Partially Integrated?

### Adopt Directly (if analytics/BI is a platform concern)
Cube is the right choice if the intelligence platform needs to expose governed metrics to BI tools, embedded analytics, and AI agents simultaneously. The semantic model definition, pre-aggregation caching, compile-time security, and MCP server are production-proven and would take significant effort to replicate.

### Wrap (if you need additional layers)
Wrap Cube if you need to add ontology/context graph capabilities on top. Cube provides the "business meaning of data" layer; the intelligence platform may need "meaning of entities, relationships, and decisions" on top of that. A wrapper could unify Cube's metric definitions with a broader ontology.

### Use as Inspiration (for the semantic model pattern)
The metrics-as-code pattern, compile-time security context, and pre-aggregation architecture are strong patterns even if Cube is not directly adopted. The idea that access rules are evaluated when the query is generated (not at runtime) is a powerful security model.

### Partial Integration (recommended for many cases)
Use Cube for the analytics/metrics semantic layer while building custom ontology, context graph, and decision intelligence layers. Connect them through the MCP server or SQL API. This avoids reinventing the pre-aggregation wheel while keeping the broader intelligence platform independent.

---

## Key Questions Answered

1. **What is compile-time governance?** Access rules are injected into the SQL query during compilation. The generated SQL itself enforces row-level and column-level security, so no unauthorized query can be constructed.
2. **How do pre-aggregations work?** Materialized views computed in advance at specific dimensional granularities. The query engine matches incoming queries to the coarsest-grain pre-aggregation that satisfies the request.
3. **Should Cube be the primary semantic layer?** For analytics metrics, yes. For broader ontology/knowledge graph concerns, Cube is one component alongside context graph tools like Semantica or Graphiti.
