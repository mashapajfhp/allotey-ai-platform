# Spike 002: Can Graphiti Work with Apache AGE?

**Status:** NOT STARTED
**Time-box:** 2 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

Can Graphiti, a temporal knowledge graph library for AI agents, work with Apache AGE as its graph backend? Graphiti officially supports Neo4j, FalkorDB, and Amazon Neptune — Apache AGE is NOT an officially supported backend. Is it feasible to build a custom AGE driver, or should we pursue an alternative approach to temporal fact management?

## Hypothesis

We believe building a custom AGE driver for Graphiti is technically feasible but will require significant effort due to differences between AGE's openCypher dialect and Neo4j's full Cypher implementation. Key risks include incomplete Cypher coverage in AGE, missing full-text search capabilities, and the need to handle AGE's unique SQL-wrapping of Cypher queries. An alternative approach — building temporal fact management directly on AGE without Graphiti — may be more practical.

## Prototype Plan

### Option A: Graphiti + Custom AGE Driver

1. **Query translation layer** — Map Graphiti's Cypher queries to AGE's openCypher syntax wrapped in `SELECT * FROM cypher('graph_name', $$ ... $$) AS (result agtype)`
2. **Index creation** — Implement AGE-compatible index creation (AGE uses PostgreSQL btree indexes on graph properties, not native graph indexes)
3. **Full-text search** — AGE lacks native full-text search; implement via PostgreSQL tsvector/tsquery on AGE's underlying tables
4. **Vector search** — Integrate pgvector for embedding storage alongside AGE graph nodes (cross-extension query)
5. **Temporal queries** — Test Graphiti's temporal fact versioning (valid_from, valid_to) with AGE property storage
6. **Migrations** — Schema evolution for graph data (new properties, relationship types)
7. **Namespace support** — Multi-tenant graph isolation using AGE's graph name or schema separation

### Option B: Independent Temporal Fact Management on AGE

1. **Design temporal entity/relationship schema** directly using AGE's openCypher
2. **Implement fact versioning** — valid_from/valid_to timestamps, supersedure tracking
3. **Build extraction pipeline** — Entity and relationship extraction from agent conversations
4. **Point-in-time queries** — "What did we know about X at time T?"
5. **Conflict resolution** — Handle contradictory facts from different sources

### Option C: Graphiti + FalkorDB (Development Only)

1. **Use FalkorDB** (Redis-compatible graph DB with Cypher support) as Graphiti's backend
2. **Assess SSPL licensing risk** — FalkorDB uses Server Side Public License; evaluate implications for production deployment
3. **Evaluate as dev-only option** — Use FalkorDB in development, plan migration path for production

### Graphiti Capabilities to Test

- `graphiti_core.Graphiti` client initialization with custom driver
- `add_episode()` — Ingest text and extract entities/relationships
- `search()` — Hybrid search (vector + graph + temporal)
- `get_entity_edge_history()` — Temporal fact retrieval
- `build_communities()` — Community detection algorithms
- Node and edge CRUD operations
- Batch ingestion performance

## Test Methodology

### Compatibility Assessment
- Enumerate all Cypher queries Graphiti generates and test each against AGE
- Document unsupported Cypher features (MERGE behavior, APOC procedures, list comprehensions, pattern comprehensions)
- Measure query translation complexity (lines of adapter code needed)

### Functional Testing
- Ingest 1,000 conversational episodes and verify entity/relationship extraction
- Execute temporal queries and verify point-in-time accuracy
- Test search across vector, graph, and temporal dimensions
- Verify community detection algorithms work with AGE's graph storage

### Quantitative Metrics
- Driver development effort estimate (person-days)
- Query latency comparison: AGE driver vs Neo4j driver vs FalkorDB driver
- Ingestion throughput (episodes/minute)
- Search latency (hybrid search p50, p95)

### Qualitative Metrics
- Maintainability burden of custom driver (tracking Graphiti API changes)
- Feature coverage gap (what Graphiti features cannot work with AGE)
- Development experience comparison across options

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- AGE's openCypher may not support MERGE semantics that Graphiti relies on for upsert operations
- APOC procedures used by Graphiti have no AGE equivalent
- Full-text search via PostgreSQL tsvector may not integrate cleanly with AGE graph queries
- AGE's agtype system may cause serialization issues with Graphiti's expected Neo4j bolt types
- Community detection algorithms may depend on Neo4j-specific graph algorithms library
- FalkorDB SSPL license may block production deployment in enterprise contexts

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

PENDING — Confidence level will be assessed based on the completeness of driver implementation and functional test coverage.
