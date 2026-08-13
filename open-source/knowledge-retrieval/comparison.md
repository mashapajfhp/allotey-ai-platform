# Vector Database Comparison

**STATUS: NOT STARTED**

---

## Overview

Comparison of five vector storage options for AI platform knowledge retrieval:
LanceDB, Qdrant, Weaviate, Milvus, and pgvector.

---

## Comparison Matrix

| Dimension | LanceDB | Qdrant | Weaviate | Milvus | pgvector |
|-----------|---------|--------|----------|--------|----------|
| **Architecture** | Embedded or cloud | Standalone server (Rust) | Standalone server (Go) | Distributed cluster | PostgreSQL extension |
| **Language** | Rust + Python/TS | Rust | Go | Go + C++ | C |
| **License** | Apache 2.0 | Apache 2.0 | BSD-3-Clause | Apache 2.0 | PostgreSQL License |
| **Deployment** | Embedded, S3-backed, or cloud | Self-host or Qdrant Cloud | Self-host or Weaviate Cloud | Self-host (complex) | Any PostgreSQL |
| **Operational Complexity** | Low (embedded) to moderate | Moderate | Moderate | High (etcd, MinIO, Pulsar) | Lowest (just PostgreSQL) |

---

## Feature Comparison

### Filtering

| Database | Approach |
|----------|----------|
| **LanceDB** | SQL-like filters pushed into index scan |
| **Qdrant** | Payload filters run inside HNSW traversal (fast) |
| **Weaviate** | Hybrid BM25 + vector + metadata filters |
| **Milvus** | Attribute filtering with boolean expressions |
| **pgvector** | Standard SQL WHERE clauses (most familiar) |

Qdrant has the strongest reputation for filter performance -- filters execute
during the HNSW graph traversal rather than as a post-filter step.

### Multi-Tenancy

| Database | Approach |
|----------|----------|
| **LanceDB** | Table-per-tenant or filter-based (NEEDS VERIFICATION) |
| **Qdrant** | Indexed payload field (filter on tenant keyword) |
| **Weaviate** | Native multi-tenancy (explicit tenant creation before ingestion) |
| **Milvus** | Partition-based isolation |
| **pgvector** | Row-level security or schema-per-tenant (standard PostgreSQL) |

Weaviate has the strongest native multi-tenancy story. pgvector leverages
PostgreSQL's mature row-level security for the simplest implementation.

### Hybrid Retrieval

| Database | Vector + Keyword |
|----------|-----------------|
| **LanceDB** | Vector + BM25 FTS + reranking |
| **Qdrant** | Vector + sparse vectors (BM25 via external) |
| **Weaviate** | Vector + BM25 + metadata (strongest built-in) |
| **Milvus** | Vector + sparse vectors |
| **pgvector** | Vector + pg_trgm or ParadeDB for FTS |

Weaviate and LanceDB have the most complete built-in hybrid search.

### Multimodal Support

| Database | Support |
|----------|---------|
| **LanceDB** | Native (images, audio, video in Lance format) |
| **Qdrant** | Vectors only (store references to multimodal data externally) |
| **Weaviate** | Multi-modal modules (CLIP, etc.) |
| **Milvus** | Vectors only |
| **pgvector** | Vectors only (store binary data in PostgreSQL) |

LanceDB is the strongest for true multimodal storage.

### Scaling

| Database | Scale Characteristics |
|----------|---------------------|
| **LanceDB** | Scales via cloud storage (S3); limited server mode maturity |
| **Qdrant** | Good for typical workloads (millions to low billions of vectors) |
| **Weaviate** | Good horizontal scaling |
| **Milvus** | Best for very large scale (100M+ vectors), but operationally complex |
| **pgvector** | Limited by PostgreSQL single-node (pgvector 0.9 improved significantly) |

---

## Recommendation by Use Case

| Use Case | Recommended |
|----------|-------------|
| Already using PostgreSQL, moderate scale | **pgvector** -- zero additional infrastructure |
| Performance-critical filtering, strong API | **Qdrant** -- best filter performance and developer experience |
| Hybrid search with native multi-tenancy | **Weaviate** -- strongest built-in hybrid + tenancy |
| Multimodal data, embedded/edge deployment | **LanceDB** -- native multimodal, embedded mode |
| Billion-scale vectors, ops team available | **Milvus** -- distributed at scale, high complexity |
| Prototyping, local development | **LanceDB** (embedded) or **Chroma** |

---

## Key Questions for Platform

- [ ] What is our expected vector count? (Millions vs billions changes the answer)
- [ ] Is multi-tenancy at the vector DB level, or do we isolate at a higher layer?
- [ ] Do we need multimodal storage, or just text embeddings?
- [ ] Are we already running PostgreSQL? pgvector eliminates additional infra.
- [ ] How critical is hybrid search (vector + keyword) for our retrieval quality?
- [ ] What is the acceptable operational complexity budget?

---

## References

- LanceDB: https://lancedb.github.io/lancedb/
- Qdrant: https://qdrant.tech/documentation/
- Weaviate: https://weaviate.io/developers/weaviate
- Milvus: https://milvus.io/docs
- pgvector: https://github.com/pgvector/pgvector
