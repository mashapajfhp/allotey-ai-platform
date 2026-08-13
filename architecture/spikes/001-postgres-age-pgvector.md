# Spike 001: Can PostgreSQL + Apache AGE + pgvector Serve as a Unified Data Layer?

**Status:** NOT STARTED
**Time-box:** 2 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

Can a single PostgreSQL instance, extended with Apache AGE (graph) and pgvector (vector search), serve as the unified data layer for the platform — handling OLTP writes, vector search, graph traversal, tenant isolation, event ingestion, and analytical queries simultaneously without unacceptable trade-offs?

## Hypothesis

We believe PostgreSQL + AGE + pgvector can serve as a unified data layer for the initial platform scale, reducing operational complexity by avoiding separate graph and vector databases. We expect trade-offs in advanced graph query performance and vector index maintenance under concurrent write load, but believe these are acceptable at early scale.

## Prototype Plan

Build a representative workload simulator that exercises all required capabilities simultaneously:

1. **OLTP writes** — Simulated tenant CRUD operations (entities, relationships, documents) at expected transaction rates
2. **Vector search** — Embedding storage and similarity search using pgvector with both HNSW and IVFFlat index types
3. **HNSW/IVFFlat index maintenance** — Measure index build time, memory usage, and query latency degradation during concurrent inserts
4. **Graph traversal** — Multi-hop relationship queries using AGE's openCypher implementation
5. **Tenant RLS** — Row-Level Security policies across all table types (relational, vector, graph)
6. **Event ingestion** — High-throughput append-only event writes simulating agent activity logs
7. **Analytical queries** — Aggregation queries across tenant data (reporting use cases)
8. **Backup/restore** — Full and incremental backup with AGE and pgvector data integrity verification
9. **Replication** — Streaming replication with AGE and pgvector extension compatibility
10. **Schema migrations** — Migration tooling compatibility with both extensions
11. **Connection pooling** — PgBouncer/Supavisor behavior with AGE session state and pgvector queries

### Comparison Architectures

| Option | Architecture | Operational Complexity |
|--------|-------------|----------------------|
| **A** | PostgreSQL unified (AGE + pgvector) | Low |
| **B** | PostgreSQL + dedicated graph DB (Neo4j/FalkorDB) | Medium |
| **C** | PostgreSQL + dedicated vector DB (Qdrant/Weaviate) | Medium |
| **D** | PostgreSQL + separate graph DB + separate vector DB | High |

## Test Methodology

### Quantitative Metrics
- **OLTP latency:** p50, p95, p99 for read/write operations under concurrent load
- **Vector search latency:** Query time for top-k similarity search (k=10, k=100) across 100K, 1M, 10M vectors
- **Graph traversal latency:** 1-hop, 2-hop, 3-hop traversals with varying fan-out
- **Index build time:** HNSW and IVFFlat build duration at various dataset sizes
- **Write throughput:** Sustained writes/sec before latency degradation
- **Memory usage:** Per-extension memory overhead and total working set
- **Backup/restore time:** Duration and data integrity for full backup cycle
- **Replication lag:** Streaming replication delay under mixed workload

### Qualitative Metrics
- Extension compatibility and conflict assessment
- Migration tooling support
- Connection pooler compatibility
- Monitoring and observability gaps
- Failure and recovery characteristics

### Load Profile
- 10 concurrent tenants
- 100 concurrent connections
- Mixed read/write ratio (70/30)
- Sustained for minimum 1 hour

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- AGE and pgvector extension conflicts during vacuum or index operations
- HNSW index memory pressure causing OOM under concurrent inserts
- RLS policy overhead on graph queries (AGE stores data in custom schemas)
- Connection pooler incompatibility with AGE's session-level graph path settings
- Replication issues with AGE's custom catalog entries
- Backup tool compatibility with AGE graph data storage format

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

PENDING — Confidence level will be assessed based on the completeness and representativeness of the prototype testing.
