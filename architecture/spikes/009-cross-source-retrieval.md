# Spike 009: Cross-Source Retrieval Orchestration

**Status:** NOT STARTED
**Time-box:** 1.5 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

Can retrieval across vector search (pgvector), graph traversal (Apache AGE), and structured queries (PostgreSQL relational) be orchestrated with acceptable latency for agent reasoning? Can hybrid retrieval with reranking produce higher-quality results than any single source? How does this compare with Graphiti's integrated retrieval approach?

## Hypothesis

We believe cross-source retrieval can be orchestrated within 200-500ms total latency by executing vector search, graph traversal, and structured queries in parallel, then applying a reranking step to merge and score results. We expect that hybrid retrieval (combining semantic similarity from vectors, relationship context from graphs, and exact matches from structured queries) will produce meaningfully better results than any single source alone. We anticipate that Graphiti's integrated approach (which combines vector + graph + temporal in a single query path) may achieve lower latency but at the cost of tighter coupling to a specific graph backend.

## Prototype Plan

### Data Setup

1. **Vector data (pgvector):**
   - 100K document embeddings (1536 dimensions, OpenAI text-embedding-3-small)
   - HNSW index with default parameters
   - Documents represent: knowledge base articles, conversation history, entity descriptions

2. **Graph data (Apache AGE):**
   - 50K entity nodes with properties
   - 200K relationship edges (typed: owns, manages, depends_on, related_to)
   - Temporal annotations (valid_from, valid_to) on 30% of edges
   - 3-4 levels of relationship depth

3. **Structured data (PostgreSQL relational):**
   - 100K records across 10 entity tables
   - Standard indexes on query columns
   - Tenant-scoped with RLS policies

### Retrieval Strategies

#### Strategy 1: Parallel Independent Retrieval
```
Query -> [Vector Search]  -> top-k candidates (by similarity)
      -> [Graph Traversal] -> related entities (by relationship)
      -> [Structured Query] -> exact matches (by filters)
      -> Merge -> Rerank -> Final Results
```

#### Strategy 2: Sequential Enrichment
```
Query -> Vector Search -> top-k candidates
      -> For each candidate: Graph Traversal (expand context)
      -> Structured Query (add metadata)
      -> Rerank with full context -> Final Results
```

#### Strategy 3: Graph-First Retrieval
```
Query -> Entity extraction -> Graph Traversal (find related subgraph)
      -> Vector Search (within subgraph scope)
      -> Structured Query (add details)
      -> Rerank -> Final Results
```

#### Strategy 4: Graphiti-Style Integrated Retrieval
```
Query -> Graphiti search() API
      -> Internal: vector similarity + graph neighbors + temporal filtering
      -> Results with relationship context
```

### Reranking Approaches

1. **Reciprocal Rank Fusion (RRF)** — Combine rankings from each source
2. **Cross-encoder reranking** — Use a reranking model (e.g., Cohere Rerank, BGE Reranker)
3. **LLM-based reranking** — Use LLM to score relevance of merged candidates
4. **Weighted score combination** — Tunable weights per source type

### Test Queries

Design 20 test queries across categories:

1. **Semantic similarity** — "Find documents about employee onboarding" (vector-favored)
2. **Relationship-based** — "What tools does team X use?" (graph-favored)
3. **Exact match** — "Show order #12345 details" (structured-favored)
4. **Hybrid** — "Find similar customers to Acme Corp who also use product Y" (all sources)
5. **Temporal** — "What was the team structure in Q1 2025?" (graph + temporal)

### Evaluation Dataset

- For each test query, create a human-judged relevance set (relevant / partially relevant / not relevant)
- Use NDCG@10 and Recall@20 as primary retrieval quality metrics

## Test Methodology

### Retrieval Quality Metrics
- **NDCG@10** — Normalized Discounted Cumulative Gain at rank 10
- **Recall@20** — Fraction of relevant documents found in top 20 results
- **MRR** — Mean Reciprocal Rank of first relevant result
- **Per-source contribution** — How often does each source contribute to final top-10

### Latency Metrics
- **End-to-end retrieval latency** — Query to final ranked results (p50, p95, p99)
- **Per-source latency** — Vector search, graph traversal, structured query individually
- **Reranking latency** — Time spent in merge and rerank step
- **Parallel execution benefit** — Latency reduction from parallel vs sequential execution

### Scalability Metrics
- Latency at 100K, 500K, 1M vector documents
- Latency at 50K, 250K, 1M graph nodes
- Concurrent retrieval requests (10, 50, 100 simultaneous)

### Comparison with Graphiti
- Same test queries executed via Graphiti's search() API
- Compare: retrieval quality (NDCG, Recall), latency, and result context richness
- Document features available in Graphiti but not in custom orchestration (and vice versa)

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- Parallel query execution may cause PostgreSQL connection pool exhaustion (3 connections per retrieval request)
- Graph traversal may have unbounded latency for highly connected subgraphs
- Reranking step may dominate total latency if using LLM-based reranker
- Cross-source result merging may produce poor results if score distributions are incomparable
- Temporal queries on AGE may be slow without proper index support
- RLS policies may add significant overhead to already-complex cross-source queries
- Graphiti comparison may be unfair if Graphiti's data model is not optimally populated

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

PENDING — Confidence level will be assessed based on the representativeness of test data, the diversity of test queries, and the statistical significance of quality and latency measurements.
