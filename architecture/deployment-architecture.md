# Deployment Architecture

> STATUS: IN RESEARCH — infrastructure footprint corrected 2026-08-13
> Last updated: 2026-08-13

## Principles

1. **Start monolithic, extract when justified** — begin with a minimal number of deployable units
2. **Cloud-portable** — no hard dependency on a specific cloud provider
3. **Self-hostable** — customers should be able to run the platform on their infrastructure
4. **Observable** — every component emits telemetry
5. **Secure by default** — least-privilege, network isolation, encrypted at rest and in transit
6. **Honest about operational cost** — every adoption decision has infrastructure cost

## Previous Claim Corrected

> The earlier documentation stated "Total new services for V1: 2 (PostgreSQL + Temporal)." This was misleading. The actual operational footprint is significantly larger. See `architecture/runtime-dependency-matrix.md` for the complete analysis.

## Candidate Deployment Topology

```
Application Services:
├── Platform API / AI Gateway        ← Single entry point
├── Agent Runtime (Agno)             ← Agent execution
├── Temporal Workers                 ← Workflow activities
├── LiteLLM Proxy                    ← LLM provider abstraction
├── OpenFGA                          ← Authorization service
├── Cube API                         ← Semantic layer
├── Langfuse (web + worker)          ← AI observability
└── MCP Gateway                      ← Tool governance

Data Stores:
├── PostgreSQL                       ← Transactional + AGE (graph) + pgvector (vectors)
│                                       Also used by: Temporal, OpenFGA, Langfuse
├── ClickHouse                       ← Required by Langfuse for observability data
├── Redis / Valkey                   ← Caching, sessions (used by Langfuse, potentially others)
├── Object Storage (S3-compatible)   ← Documents, artifacts, Langfuse blob storage
└── DuckDB                           ← Embedded analytical querying (in-process, not a server)

Temporal Infrastructure:
├── Temporal Server (frontend, matching, history)
├── Temporal Visibility Store (Elasticsearch or PostgreSQL)
└── Temporal Database (PostgreSQL)
```

**This is NOT a microservices architecture.** It is a small number of focused services. But it is also NOT "2 services" — honest accounting shows 8+ application containers and 4+ data stores.

## Key Architectural Questions

### PostgreSQL Unification (spike 001)
The hypothesis is that PostgreSQL can serve transactional, graph (AGE), and vector (pgvector) workloads from a single instance. This needs validation:
- Can OLTP writes + vector indexing + graph traversal coexist without degradation?
- What are the backup/restore implications?
- What is the blast radius of a single PostgreSQL failure?
- At what scale does each workload need its own instance?

### Shared vs. Dedicated PostgreSQL
Multiple components need PostgreSQL: platform data, Temporal, OpenFGA, Langfuse. Options:
- **Shared**: One PostgreSQL instance with multiple databases (simpler, higher blast radius)
- **Dedicated**: Separate instances per component (more resilient, more operational burden)
- V1 can likely share; production may need separation

### DuckDB Role Clarified
DuckDB is an **embedded analytical query engine**, not a server. It runs in-process for analytical workloads:
- OLAP queries over PostgreSQL data
- Parquet file analysis
- Analytical transformations
- Local data science workloads

It is NOT an event store or a multi-user database service.

## Anti-Patterns to Avoid

- Premature microservices — don't split until there's a concrete scaling or deployment reason
- Cloud-native lock-in — don't use cloud-specific services when portable alternatives exist
- Infrastructure-as-code gaps — everything should be reproducible from code
- Undercounting operational cost — every component has monitoring, backup, upgrade, and scaling requirements
- Single-database everything — PostgreSQL with extensions is a strong hypothesis but needs validation before becoming doctrine

## Research Questions

- Kubernetes vs. simpler container orchestration for V1?
- How should multi-tenant deployment work? Shared infrastructure with logical isolation? Physical isolation for enterprise customers?
- Where does the authorization service run? Sidecar? Centralized?
- How are model gateway instances scaled (GPU considerations)?
- What is the minimum viable Temporal deployment? (Single binary vs. full cluster)
- Can ClickHouse be deferred if Langfuse is not adopted immediately?

## References

- `architecture/runtime-dependency-matrix.md` — True infrastructure footprint
- `architecture/spikes/001-postgres-age-pgvector.md` — PostgreSQL unification validation
- `architecture/spikes/010-multi-tenant-isolation.md` — Multi-tenant deployment validation
