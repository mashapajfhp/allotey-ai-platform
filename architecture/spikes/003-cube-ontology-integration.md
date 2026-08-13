# Spike 003: How Does Cube's Semantic Model Integrate with a Platform Ontology?

**Status:** NOT STARTED
**Time-box:** 1.5 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

How does Cube's semantic layer integrate with the platform's ontology? Specifically: Can ontology entity definitions generate Cube data models? Can Cube's security context propagate authorization decisions from OpenFGA? Can a custom MCP server expose self-hosted Cube's capabilities (given that the official Cube MCP server is cloud-only)?

## Hypothesis

We believe that ontology entity definitions can drive Cube data model generation, creating a single source of truth for both application logic and analytics. We expect that Cube's security context can be extended to query OpenFGA for row-level and dimension-level access decisions. We believe a custom MCP server wrapping Cube's REST/GraphQL API is feasible for self-hosted deployments, though it will lack the deep integration of the cloud-only official MCP server.

## Prototype Plan

### Sub-investigation 1: Ontology-to-Cube Model Generation

1. **Define sample ontology entities** — Customer, Order, Product, Subscription with relationships and properties
2. **Map ontology types to Cube concepts:**
   - Entity -> Cube (data model)
   - Property -> Dimension or Measure
   - Relationship -> Join
   - Computed property -> Calculated measure
3. **Build a code generator** that reads ontology IR and produces Cube data model files (JavaScript or YAML)
4. **Test generated models** — Verify they load correctly in Cube and produce valid SQL
5. **Test incremental updates** — When ontology changes, regenerate and validate Cube models

### Sub-investigation 2: OpenFGA Security Context Integration

1. **Cube security context mechanism** — Cube passes `securityContext` from JWT to data models for row-level filtering
2. **OpenFGA query integration** — At query time, call OpenFGA to determine:
   - Which tenants the user can access (tenant isolation)
   - Which dimensions/measures the user can see (column-level security)
   - Which rows the user can access (row-level security)
3. **Implementation options:**
   - A) Pre-compute permissions into JWT claims (simple but stale)
   - B) Cube `queryRewrite` hook calls OpenFGA at query time (accurate but adds latency)
   - C) Cube `checkAuth` middleware calls OpenFGA, caches results in security context
4. **Test authorization propagation** — Verify that Cube enforces OpenFGA decisions correctly
5. **Measure latency impact** of OpenFGA calls on Cube query performance

### Sub-investigation 3: Custom MCP Server for Self-Hosted Cube

1. **Survey Cube's APIs** — REST API, GraphQL API, SQL API capabilities
2. **Define MCP tool surface:**
   - `query_cube` — Execute a Cube query (measures, dimensions, filters, time dimensions)
   - `list_cubes` — Discover available data models
   - `describe_cube` — Get schema for a specific cube (dimensions, measures, segments)
   - `meta` — Get Cube metadata and available operations
3. **Build MCP server** wrapping self-hosted Cube's REST API
4. **Test with AI agent** — Agent discovers available analytics, formulates queries, interprets results
5. **Compare with official cloud MCP** — Document feature gaps

## Test Methodology

### Ontology-to-Cube Metrics
- Percentage of ontology concepts that map cleanly to Cube primitives
- Generated model correctness (valid SQL, correct joins)
- Round-trip time: ontology change -> model regeneration -> Cube reload
- Edge cases: many-to-many relationships, polymorphic entities, temporal properties

### Security Integration Metrics
- Authorization decision latency (p50, p95) added to Cube queries
- Correctness: verify unauthorized data is never returned
- Cache invalidation: how quickly do permission changes take effect
- Scalability: performance with 100, 1000, 10000 authorization rules

### Custom MCP Server Metrics
- Tool discovery: can an agent find and understand available analytics
- Query formulation: can an agent construct valid Cube queries from natural language
- Response quality: are Cube results usable by the agent for reasoning
- Feature coverage vs official cloud MCP server

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- Ontology concepts that do not map to Cube primitives (e.g., graph relationships, temporal validity)
- Cube security context limitations — may not support dynamic, per-query authorization calls
- OpenFGA query latency making Cube queries unacceptably slow
- Self-hosted Cube API limitations compared to cloud offering
- Cube model hot-reload issues when models are regenerated from ontology changes
- Complex joins generated from ontology relationships producing inefficient SQL

## Operational Findings

PENDING — Operational findings will be documented during investigation.

## Security Findings

PENDING — Security findings will be documented during investigation.

## Performance Findings

PENDING — Performance findings will be documented during investigation.

## Conclusion

PENDING — Conclusion will be documented when the spike is completed.

## Recommendation

PENDING — Recommendation will be made when results are available.

## Confidence Level

PENDING — Confidence level will be assessed based on the depth of integration testing across all three sub-investigations.
