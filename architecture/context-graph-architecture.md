# Context Graph Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Definition

The context graph stores the current and historical state of entities, facts, and relationships. It is the "working memory" of the business — not a schema (that's the ontology) and not a metric definition (that's the semantic layer), but the actual instances and their connections.

## Distinction From Related Concepts

| Concept | Contains | Example |
|---------|----------|---------|
| Ontology | Type definitions | "Customer has name, industry, risk_score" |
| Context Graph | Instances | "Acme Corp is a Customer with risk_score=7.2" |
| Semantic Layer | Metric formulas | "Revenue = SUM(orders.amount)" |
| Knowledge Store | Documents | "Policy document for handling complaints" |
| Agent Memory | Session context | "User asked about Acme Corp 3 messages ago" |

## Temporal Facts

A key insight from Graphiti: facts have temporal validity.

```
Fact: "Acme Corp has 500 employees"
Valid from: 2025-01-15
Valid until: 2025-07-01 (when it changed to 520)
Source: Annual report filing
Confidence: HIGH
```

This enables:
- "What did we know about Acme Corp as of March 2025?"
- "When did this fact change?"
- "What was the source of this information?"

This is fundamentally different from vector memory, which stores embeddings without temporal semantics or provenance.

## Architecture Questions

- Should the context graph use a dedicated graph database (Neo4j, TypeDB) or an augmented relational model (PostgreSQL with ltree/adjacency)?
- How does the context graph relate to the event store? Events create/modify facts in the graph.
- How does multi-tenancy work? Separate graph instances? Filtered views?
- How does the context graph integrate with vector search? Hybrid retrieval across graph + vectors.
- What is the update model? Real-time? Batch? Event-driven?

## References

- `open-source/ontology-context/graphiti.md` — temporal knowledge graphs
- `open-source/ontology-context/semantica.md` — context graph concepts
- `open-source/ontology-context/trustgraph.md` — holonic context
