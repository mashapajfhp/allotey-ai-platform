# Knowledge Graph Comparison

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Purpose

Evaluate approaches for storing and querying structured knowledge — entities, relationships, facts with temporal validity, and provenance.

## Approaches

| Approach | Example | Temporal | Provenance | Reasoning | Multi-tenancy | License |
|----------|---------|----------|------------|-----------|---------------|---------|
| Temporal knowledge graph | Graphiti | Yes (core) | Yes | Limited | Limited | MIT |
| Context graph | Semantica | Some | Yes | Yes (causal) | Unknown | NEEDS VERIFICATION |
| Holonic context | TrustGraph | Some | Yes | Limited | Yes | NEEDS VERIFICATION |
| Typed graph database | TypeDB | No (manual) | No | Yes (inference) | Limited | MPL-2.0 |
| Versioned graph | TerminusDB | Yes (version) | Yes (diffs) | No | Limited | Apache 2.0 |
| Property graph | Neo4j | No (manual) | No | Limited | Enterprise only | GPL/Commercial |
| PostgreSQL + extensions | ltree, jsonb | Manual | Manual | No | Yes | PostgreSQL License |

## Key Distinctions

### Graphiti (Temporal Knowledge Graph)
- Facts have explicit time validity (valid_from, valid_until)
- Supports fact invalidation and supersession
- Hybrid search (graph traversal + vector similarity)
- Designed for LLM agent memory
- **Key insight:** Temporal facts are fundamentally different from vector embeddings — they have explicit validity periods and provenance

### TypeDB (Typed Ontology Database)
- Strong type system with inheritance
- Logical reasoning over typed relationships
- Constraint enforcement at the database level
- **Key insight:** Could serve as the ontology definition layer (type system), while Graphiti handles temporal instances

### TerminusDB (Versioned Data)
- Git-like versioning for data (branches, merges, diffs)
- Could enable ontology version control
- Document + graph hybrid model
- **Key insight:** Interesting for ontology evolution — track how the domain model changes over time

## Architecture Consideration

The platform may need multiple complementary approaches:
1. **Ontology definition** — typed schema (TypeDB-inspired or custom)
2. **Instance storage** — temporal facts with provenance (Graphiti-inspired)
3. **Version control** — ontology evolution tracking (TerminusDB-inspired)
4. **Operational queries** — PostgreSQL for transactional access

Whether these should be separate systems or layers on a single database requires further investigation.
