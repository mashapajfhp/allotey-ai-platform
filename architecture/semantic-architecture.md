# Semantic Layer Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Purpose

The semantic layer provides a single source of truth for business metric definitions — how metrics are calculated, what dimensions they can be broken down by, what time grains are valid, and what joins are allowed. It ensures that every consumer (agent, dashboard, API, ad-hoc query) computes metrics consistently.

## Semantic Layer vs. Ontology

| Concern | Semantic Layer | Ontology |
|---------|---------------|----------|
| Scope | Analytical metrics | All domain concepts |
| Focus | How to measure | What exists and what can be done |
| Actions | Read-only queries | Read + write operations |
| Security | Query-level access | Entity-level + action-level access |
| Example | "Revenue = SUM(amount) WHERE status='completed'" | "Order has amount, status, customer; can be approved/rejected" |

The semantic layer is a **subset** of the ontology's concerns. In the platform architecture, the semantic layer defines the analytical view of ontology entities.

## Core Concepts

### Cubes / Semantic Models
A cube defines a business concept with its measures, dimensions, and relationships. Borrowed from Cube.js terminology:

```yaml
cube:
  name: Orders
  sql_table: public.orders
  measures:
    revenue:
      type: sum
      sql: amount
    count:
      type: count
  dimensions:
    status:
      type: string
      sql: status
    created_at:
      type: time
      sql: created_at
  joins:
    customers:
      relationship: many_to_one
      sql: "{CUBE}.customer_id = {customers}.id"
```

### Views
Curated projections of cubes for specific audiences. A view selects which measures and dimensions are relevant for a use case.

### Pre-aggregations
Materialized rollups for performance. The semantic layer knows when a pre-aggregation can answer a query, avoiding expensive full scans.

### Security Context
Row-level and column-level access control applied at query time based on the requesting user's identity.

## Key Evaluation: Cube

Cube is the most mature open-source semantic layer. Key questions:
- Can Cube serve as the semantic layer for the platform?
- Should it be adopted directly, wrapped, or used as inspiration?
- How does Cube's security context integrate with our authorization model (OpenFGA)?
- How does Cube's multi-tenancy model map to our tenant isolation requirements?
- Can Cube's API be the interface for agent-generated analytics queries?

See `open-source/semantic-layer/cube.md` for detailed research.

## Architecture Integration Points

```
Ontology defines entity types
    │
    ▼
Semantic Layer defines analytical measures/dimensions on those entities
    │
    ▼
Agents query through semantic layer for analytics
    │
    ▼
Query engine translates to SQL against analytical database
    │
    ▼
Results returned with provenance (which definitions were used)
```

## Research Questions

- How does the semantic layer handle metric evolution? Versioning?
- How do agents discover available metrics and dimensions?
- Can the semantic model be generated from the ontology automatically?
- How does the semantic layer handle derived/computed metrics?
- What happens when a metric definition changes? How are historical values handled?
