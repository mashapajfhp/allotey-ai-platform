# Analytics Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Purpose

Defines how analytical queries are executed — the engine that powers both agent-generated SQL and direct analytics workloads.

## Workload Categories

| Workload | Characteristics | Candidate Engines |
|----------|----------------|-------------------|
| Event analytics | High-volume append, time-series queries | ClickHouse, Apache Pinot |
| Ad-hoc exploration | Complex joins, aggregations, variable queries | ClickHouse, DuckDB |
| Embedded analytics | In-process, small-medium datasets | DuckDB |
| Real-time dashboards | Sub-second aggregations on live data | ClickHouse, Apache Pinot |
| Historical analysis | Large-scale scans, batch aggregations | ClickHouse, Apache Druid |

## Integration With Semantic Layer

```
Agent/User Query (natural language)
    → Semantic Layer (resolve metrics/dimensions)
        → SQL Generation (from semantic model)
            → Analytical Engine (execute)
                → Results (with provenance)
```

## Research Questions

- ClickHouse vs. DuckDB — can both serve different roles in the same platform?
- How does the analytical engine interact with pre-aggregations from the semantic layer?
- What is the operational cost of running ClickHouse vs. managed alternatives?

## References

- `open-source/analytics/` — analytical engine research
- `open-source/semantic-layer/cube.md` — Cube's query compilation
