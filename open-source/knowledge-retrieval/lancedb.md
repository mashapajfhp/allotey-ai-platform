# LanceDB (lancedb/lancedb)

**STATUS: NOT STARTED**
**License:** Apache 2.0
**Repository:** https://github.com/lancedb/lancedb
**Funding:** $30M Series A (June 2025)

---

## Overview

LanceDB is an open-source multimodal vector database built on the Lance columnar
format. It is designed for AI workloads requiring vector search, full-text search,
hybrid retrieval, and multimodal data storage. Unlike traditional vector databases,
LanceDB can run embedded (no server) or as a managed service.

---

## Core Capabilities

### Vector Storage

Built on the Lance columnar format -- an Arrow-native format optimized for
machine learning workloads. Stores vectors alongside structured metadata in
the same table. Supports IVF-PQ indexing for approximate nearest neighbor
search.

### Full-Text Search (FTS)

Native full-text search using BM25 scoring. Enables keyword-based retrieval
alongside vector search without a separate search engine.

### Hybrid Retrieval

Combines vector search and FTS in a single query. Results can be fused using
reciprocal rank fusion (RRF) or other combination strategies.

### Reranking

Pluggable rerankers for hybrid search results:
- Cohere Rerank
- ColBERT reranking
- Custom reranking functions
- Rerankers work across vector, FTS, and hybrid search results

### Filtering

SQL-like filtering on metadata columns during vector search. Filters are
pushed down into the index scan for efficiency.

### Multimodal Data

Store and retrieve images, audio, video, and text in the same table alongside
their embeddings. The Lance format handles multi-type columns natively.

### Schema Evolution

NEEDS VERIFICATION: Specific schema evolution capabilities. The Lance format
supports adding columns and evolving schemas, but the exact migration path
for production deployments needs investigation.

### Storage

- **Embedded mode:** No server, runs in-process (like SQLite for vectors)
- **Cloud storage:** Native support for S3, GCS, Azure Blob
- **Managed service:** LanceDB Cloud for production deployments
- 1.5M IOPS benchmarks reported in 2026
- Multi-bucket storage support at Uber scale

---

## Recent Developments (2025-2026)

- Lance-native SQL retrieval via DuckDB integration
- Git-style branching and shallow clone for AI data
- Arrow-native geospatial with R-Tree indexing
- Native Lance support on Hugging Face Hub
- Multi-bucket storage for large-scale deployments

---

## Key Questions

- [ ] Is LanceDB mature enough for production multi-tenant workloads?
- [ ] How does embedded mode scale vs server mode for a platform?
- [ ] What is the operational story for self-hosting at scale?
- [ ] How does LanceDB compare to Qdrant/Weaviate for production RAG?
- [ ] Can LanceDB serve as the sole retrieval layer, or do we need a
      dedicated search engine alongside it?

---

## References

- LanceDB Documentation: https://lancedb.github.io/lancedb/
- LanceDB Website: https://www.lancedb.com
- Lance Format: https://github.com/lancedb/lance
- LanceDB GitHub: https://github.com/lancedb/lancedb
