# Semantic Layer Comparison

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Overview

A semantic layer provides a single source of truth for business metric definitions. This comparison evaluates open-source options.

## Candidates

| Feature | Cube | Rill | dbt Semantic Layer |
|---------|------|------|--------------------|
| License | Apache 2.0 (core) | Apache 2.0 | Apache 2.0 (core) |
| Definition format | JavaScript/YAML | YAML | YAML |
| Metrics-as-code | Yes | Yes | Yes |
| Pre-aggregations | Yes (built-in) | No | Limited |
| Caching | Yes (multi-level) | DuckDB-based | No |
| API | REST, GraphQL, SQL | REST | GraphQL (cloud) |
| Multi-tenancy | Yes (security context) | Limited | Limited |
| Database support | 20+ connectors | DuckDB, ClickHouse | 5+ warehouses |
| MCP support | NEEDS VERIFICATION | Yes | NEEDS VERIFICATION |
| Maturity | Production (7+ years) | Production (newer) | Production |
| Self-hostable | Yes | Yes | Limited (cloud-first) |

## Assessment

**Cube** is the strongest candidate:
- Most mature and feature-complete
- Pre-aggregations provide significant performance benefits
- Security context enables row-level multi-tenancy
- Strong API layer (REST, GraphQL, SQL interface)
- Can sit between agents and databases

**Rill** is complementary:
- Better for embedded BI-as-code experiences
- DuckDB integration for fast local analytics
- Conversational analytics feature (agent-friendly)
- Not a replacement for Cube as a semantic layer

**Recommendation:** Wrap Cube as the platform's semantic metrics layer. Evaluate Rill for embedded analytics use cases.
