# Amazon Bedrock Knowledge Bases

**STATUS: RESEARCHED -- Based on official AWS documentation and announcements through mid-2026**

## What Are Bedrock Knowledge Bases

Amazon Bedrock Knowledge Bases is the **managed RAG (Retrieval-Augmented Generation) service** within AWS. It automates the end-to-end pipeline of document ingestion, chunking, embedding, indexing, and retrieval so that agents and applications can answer questions grounded in enterprise data.

The newer **Fully Managed Knowledge Bases** variant simplifies further by providing native data connectors, Smart Parsing, and an Agentic Retriever -- reducing the pipeline from multiple services to a single managed resource.

## Document Ingestion

### Supported Data Sources

| Source | Type |
|--------|------|
| **Amazon S3** | File storage (primary source) |
| **Confluence** | Wiki / documentation |
| **SharePoint** | Enterprise documents |
| **Salesforce** | CRM data |
| **Web crawling** | Public web content |

Documents are ingested from these sources and processed through the Knowledge Base pipeline automatically.

### Supported Document Formats
- PDF, DOCX, TXT, HTML, Markdown
- CSV (for structured data)
- Smart Parsing handles mixed-format documents (tables + text + images within a single document)

### Smart Parsing
A newer capability that leverages foundation models to understand document structure:

- Automatically identifies document structure (headers, tables, lists, paragraphs)
- Extracts meaningful content from complex layouts
- Handles multi-format documents without manual configuration
- Applies intelligent defaults based on document type and content structure
- Preserves semantic meaning during extraction (e.g., keeps table relationships intact)

## Chunking Strategies

Chunking is the process of splitting documents into smaller segments for embedding and retrieval. Bedrock Knowledge Bases supports four strategies:

### 1. Fixed-Size Chunking
- Splits documents into chunks of a configured token/character count
- Overlap parameter controls how much adjacent chunks share
- Simplest strategy; works well for uniform content
- Risk: may split semantic units (sentences, paragraphs) mid-thought

### 2. Semantic Chunking
- Splits based on semantic boundaries (topic shifts, paragraph breaks)
- Uses embedding similarity to determine where to split
- Better preserves meaning within chunks
- Higher compute cost than fixed-size

### 3. Hierarchical Chunking
- Creates chunks at multiple granularity levels (e.g., paragraph-level and section-level)
- Enables retrieval at the right level of detail for different queries
- Parent-child relationships between chunk levels
- More complex but handles both broad and narrow queries

### 4. Custom Chunking
- Developer-defined chunking logic
- Full control over chunk boundaries, metadata, and processing
- Use when document structure requires domain-specific splitting rules

## Embeddings

### Embedding Generation
Each chunk is converted into a numerical vector (embedding) that captures semantic meaning:

- **Bedrock embedding models** -- Amazon Titan Embeddings, Cohere Embed
- **Configurable dimensions** -- select embedding dimensions based on accuracy vs. cost trade-off
- **Domain-specific fine-tuning** -- NEEDS VERIFICATION on whether custom embedding models can be used
- **Batch processing** -- embeddings generated during ingestion, not at query time

### Vector Storage Options

| Storage | Characteristics |
|---------|----------------|
| **S3 Vectors** | New; up to 90% lower cost than alternatives; elastic; durable; integrated with S3 ecosystem |
| **Amazon OpenSearch Serverless** | Full-text + vector search; auto-scaling; existing OpenSearch features |
| **Amazon Aurora PostgreSQL (pgvector)** | Relational + vector; good for existing PostgreSQL users |
| **Pinecone** | Third-party managed vector DB |
| **Redis Enterprise** | Third-party; in-memory vector search |
| **MongoDB Atlas** | Third-party; document + vector |

**S3 Vectors** is the notable new option -- it provides cost-effective, elastic, durable vector storage within the S3 ecosystem at dramatically lower cost, making it viable for very large knowledge bases.

## Retrieval

### Standard Retrieval
- Query embedding is compared against indexed chunk embeddings
- Top-k most similar chunks are returned
- Metadata filtering narrows results (e.g., by source, date, document type)
- Reranking improves result quality after initial retrieval

### Agentic Retriever
The newer Agentic Retriever goes beyond simple similarity search:

1. **Query analysis** -- understands the intent behind the query
2. **Query decomposition** -- breaks complex queries into sub-queries
3. **Multi-step retrieval** -- iteratively retrieves and refines results
4. **Cross-source retrieval** -- queries multiple data sources in parallel
5. **Result assembly** -- combines results from multiple retrieval steps

This is particularly useful for complex, multi-faceted questions that cannot be answered by a single similarity search.

### Graph-Enhanced Retrieval (Neptune Analytics)
By combining Knowledge Bases with Amazon Neptune Analytics:
- Build knowledge graphs that connect related concepts across document chunks
- Enable graph traversal during retrieval for more comprehensive answers
- Understand structural relationships between entities in documents
- Produce more accurate, comprehensive, and explainable responses

## RAG Architecture

```
User Query
    |
    v
Agentic Retriever / Standard Retrieval
    |
    +---> Query Analysis & Decomposition
    |
    +---> Embedding Generation (query -> vector)
    |
    +---> Vector Search (against indexed chunks)
    |       |
    |       +---> S3 Vectors / OpenSearch / Aurora / etc.
    |
    +---> Metadata Filtering
    |
    +---> Reranking
    |
    +---> [Optional] Neptune Graph Traversal
    |
    v
Retrieved Context (relevant chunks + citations)
    |
    v
Foundation Model (Bedrock)
    |
    v
Grounded Response with Source Citations
```

## Ingestion Pipeline

```
Data Sources (S3, Confluence, SharePoint, Salesforce, Web)
    |
    v
Smart Parsing (structure extraction, format handling)
    |
    v
Chunking (fixed-size / semantic / hierarchical / custom)
    |
    v
Embedding Generation (Titan Embeddings, Cohere Embed)
    |
    v
Vector Storage (S3 Vectors, OpenSearch, Aurora, etc.)
    |
    v
Indexing (searchable vector index)
```

## Configuration and Management

- **Sync jobs** -- schedule or trigger re-ingestion when source data changes
- **Incremental sync** -- only process new or changed documents
- **Metadata management** -- attach custom metadata to chunks for filtering
- **Access control** -- IAM policies control who can query which knowledge bases
- **Monitoring** -- CloudWatch metrics for ingestion, query latency, and retrieval quality

## Integration with AgentCore

Knowledge Bases integrate with AgentCore as a tool through the Gateway:
- Agents query Knowledge Bases as part of their reasoning loop
- The Gateway handles routing and authentication
- Cedar policies can control which agents access which knowledge bases
- Results are returned with source citations for traceability

## Key Design Decisions

1. **Multiple vector storage options** -- customers choose based on cost, performance, and existing infrastructure
2. **S3 Vectors as a cost disruptor** -- 90% lower cost makes large-scale RAG economically viable
3. **Smart Parsing as a managed capability** -- reduces the "data preparation" burden that plagues RAG projects
4. **Agentic Retriever** -- acknowledges that simple similarity search is insufficient for complex queries
5. **Source-agnostic ingestion** -- same pipeline for S3, Confluence, SharePoint, Salesforce, web

## NEEDS VERIFICATION
- Whether custom embedding models (not just Bedrock-provided) can be used
- S3 Vectors performance characteristics at very large scale (billions of vectors)
- Agentic Retriever accuracy benchmarks vs. standard retrieval
- Incremental sync behavior for each data source type
- Maximum document size and knowledge base limits
- Whether Smart Parsing is available for all data source types or only S3
