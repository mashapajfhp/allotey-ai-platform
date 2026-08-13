# Rill (rilldata/rill)

**Category:** Semantic Layer
**Repository:** https://github.com/rilldata/rill
**License:** Apache 2.0
**Language:** Go (backend), TypeScript/Svelte (frontend)
**Status:** NOT STARTED -- Key Questions Listed Below
**Last Verified:** 2026-08-13

---

## Preliminary Overview

Rill is a BI-as-code platform that combines a semantic metrics layer with interactive dashboards, powered by OLAP engines (DuckDB for small datasets, ClickHouse for billions of rows). The defining characteristic is that all BI assets -- models, metrics, dashboards, security policies -- are defined as SQL + YAML files in a Git-backed project, enabling coding agents (Claude Code, Cursor) to author and maintain analytics end-to-end.

Rill positions itself as "the fastest BI tool for humans and agents" with sub-second query performance at any scale.

---

## What Is Known

### Architecture (Three Components)
1. **Rill Developer (Local)** -- development environment for building and previewing analytics
2. **Rill Cloud** -- production deployment, sharing, and collaboration platform
3. **MCP Server** -- AI agent connectivity layer for direct semantic layer access

### BI-as-Code
All analytics defined in code:
- **SQL models** -- transform raw data with SQL transformations, incremental ingestion
- **Metrics views** -- YAML definitions with `type: metrics_view`, model reference, timeseries, dimensions, measures
- **Dashboards** -- Explore dashboards (interactive) and Canvas dashboards (custom layouts)
- **Security policies** -- row access policies per user/group, defined in YAML

Git-backed: version controlled, reviewed through PRs, deployed through CI/CD. Coding agents can author complete projects.

### Semantic Layer
- **Dimensions** -- categorical attributes (country, device_type)
- **Measures** -- quantitative expressions (`count(*)`, `sum(price * quantity)`)
- **Time grains** -- temporal aggregation levels
- Single source of truth generating SQL at query time against the OLAP engine

### Metrics SQL
SQL-based semantic layer designed so that when OLAP engines adopt richer metrics semantics natively, the interface stays identical and only the compilation target changes. Available in both Rill Developer and Rill Cloud.

### Conversational Analytics
Natural language querying against metrics. GenBI for one-click dashboard generation with generative AI.

### OLAP Engine Options
- **DuckDB** -- managed, optimized for smaller datasets and fast iteration
- **ClickHouse** -- managed or cloud-connected for billions of rows
- External engines: ClickHouse Cloud, Druid, Pinot, MotherDuck

### Data Sources
S3, GCS, 20+ connectors, incremental ingestion, materialization options.

---

## Comparison to Cube

| Dimension | Rill | Cube |
|-----------|------|------|
| Primary focus | BI tool with semantic layer | Semantic layer with API exposure |
| Query engine | DuckDB/ClickHouse (OLAP) | Delegates to any SQL warehouse |
| UI | Built-in dashboards (Explore, Canvas) | No built-in UI (API-only) |
| Definition format | YAML + SQL | YAML, JavaScript, or Python |
| Pre-aggregations | Materializations via OLAP engine | Built-in pre-aggregation system |
| MCP support | Yes | Yes |
| Multi-tenancy | Row access policies in YAML | Compile-time JWT security context |
| AI integration | GenBI, conversational BI, MCP | MCP server, SQL API for agents |
| Embedded analytics | Embeddable components | REST/GraphQL/SQL APIs |
| License | Apache 2.0 | MIT (client) / Apache 2.0 (backend) |

**Key Difference:** Rill is a BI tool with a semantic layer; Cube is a semantic layer that BI tools connect to. Rill owns the visualization; Cube is headless.

---

## Key Questions to Investigate

### Architecture and Abstractions
- [ ] How does Rill's metrics compilation compare to Cube's schema compiler?
- [ ] What is the internal architecture of the Metrics SQL engine?
- [ ] How does Rill handle complex joins across multiple models/metrics views?
- [ ] What are the limitations of the DuckDB-based local development experience?

### Semantic Layer Depth
- [ ] Can Rill serve as a standalone semantic layer (without its UI)?
- [ ] How sophisticated are the row access policies compared to Cube's compile-time security?
- [ ] Does Rill support column-level security?
- [ ] Can metrics be consumed programmatically via REST API without dashboards?

### Agent Integration
- [ ] How mature is the MCP server implementation?
- [ ] What operations can agents perform beyond querying metrics?
- [ ] Can agents create and modify YAML definitions (true BI-as-code)?
- [ ] How does GenBI compare to using Cube's MCP server with an LLM?

### Multi-Tenancy and Security
- [ ] How does tenant isolation work beyond row access policies?
- [ ] Can different tenants have different metrics definitions?
- [ ] How are API keys and authentication handled for embedded use cases?

### Scaling and Performance
- [ ] What are the practical limits of DuckDB for production workloads?
- [ ] How does ClickHouse integration handle schema changes and metric evolution?
- [ ] Published benchmarks on concurrent query throughput?

### Relevance to Intelligence Platform
- [ ] Is Rill better suited as an embedded analytics component or a semantic layer?
- [ ] Could Rill's YAML metric definitions inform our own metric modeling approach?
- [ ] Is the BI-as-code approach more practical than Cube's programmatic model?
- [ ] Would Rill or Cube be more appropriate if the platform needs headless metrics?

---

## Potential Relevance

Rill's strongest contribution is the **BI-as-code philosophy with agent authoring**. The idea that coding agents can author complete analytics projects (models, metrics, dashboards, security) from YAML + SQL is directly relevant to an intelligence platform where AI agents manage analytical workflows.

However, if the platform needs a headless semantic layer (metrics consumed by many tools without a built-in UI), Cube is likely the better fit. Rill is more appropriate if the platform needs embedded, interactive dashboards with sub-second OLAP performance.

The Metrics SQL approach (SQL-based semantic layer that adapts its compilation target) is an interesting portability pattern worth studying regardless of adoption decision.

---

## License Consideration

Apache 2.0 is fully permissive. Commercial features are in Rill Cloud, but the core engine, semantic layer, and MCP server are open source.
