# Microsoft Foundry IQ

**STATUS: RESEARCHED -- Based on official Microsoft documentation, Build 2026, and Microsoft Learn**

## What Is Foundry IQ

Foundry IQ is the **knowledge layer** for Microsoft Foundry agents. It provides a unified, reusable knowledge retrieval service that replaces per-project RAG pipelines with a centralized, topic-centric knowledge base that any number of agents can consume.

- Announced in public preview at Microsoft Ignite, November 2025
- Reached **general availability at Build 2026** (June 2026)
- Billing expected to begin late 2026

## The Problem It Solves

Grounding agents in enterprise knowledge traditionally requires:
1. Building a custom RAG pipeline for each project
2. Managing document ingestion, chunking, embedding, and vector storage
3. Handling permission-aware retrieval manually
4. Duplicating effort across multiple agents that need the same knowledge

Foundry IQ replaces this with a **single, SLA-backed retrieval endpoint** that multiple agents share.

## Core Capabilities

### Unified Knowledge Sources
Foundry IQ aggregates data from multiple source types behind one retrieval endpoint:

| Source Type | Examples |
|-------------|----------|
| **Internal file stores** | Azure Blob Storage, SharePoint, OneLake |
| **Microsoft 365 content** | Work IQ (emails, documents, calendar, Teams) |
| **Structured data** | Azure SQL, Fabric IQ semantic models |
| **External** | Public web data, custom connectors |
| **Tool protocols** | MCP (Model Context Protocol) sources |

The key insight: agents don't need to know which backend stores the data. They query Foundry IQ, and it handles source routing, retrieval, and assembly.

### Knowledge Bases (Topic-Centric)
- Organize knowledge into **reusable knowledge bases** by topic or domain
- Each knowledge base can draw from multiple sources
- Multiple agents can connect to the same knowledge base
- Knowledge bases are managed independently of the agents that consume them

### Agentic Retrieval
Beyond simple vector search, Foundry IQ supports **agentic retrieval** -- a multi-step retrieval process where the system:
1. Analyzes the query to determine retrieval strategy
2. May decompose complex queries into sub-queries
3. Retrieves from multiple sources in parallel
4. Ranks and assembles results
5. Returns source-backed information with citations

This is more sophisticated than single-shot RAG retrieval and handles complex, multi-faceted questions better.

### Permission-Aware Retrieval
- Retrieval respects the calling user's permissions
- SharePoint documents are only returned if the user has access
- Azure AD / Entra ID permissions are enforced at retrieval time
- No need to build custom permission filtering -- it is built into the service

### Grounding with Citations
- Responses include source references for traceability
- Agents can present citations to users for verification
- Supports trust and auditability requirements

## How Agents Connect to Foundry IQ

Agents built on Microsoft Foundry Agent Service connect to Foundry IQ knowledge bases through a configuration step:

1. Create a knowledge base in Foundry IQ
2. Connect data sources to the knowledge base
3. Configure the agent to use the knowledge base
4. At runtime, the agent queries Foundry IQ as part of its reasoning loop

The agent does not manage retrieval logic -- Foundry IQ handles chunking, embedding, indexing, and retrieval behind the scenes.

## Skills and Grounding

Foundry IQ knowledge bases can be exposed as **skills** that agents invoke:
- A knowledge base becomes a callable skill in the agent's toolbox
- The agent decides when to retrieve knowledge based on the conversation context
- Multiple knowledge base skills can be available to a single agent
- The agent's reasoning loop determines which knowledge base(s) to query

## Architecture

```
Agent (Foundry Agent Service)
    |
    +---> Foundry IQ Retrieval Endpoint
              |
              +---> Knowledge Base: "HR Policies"
              |       +-- SharePoint (policy docs)
              |       +-- Azure SQL (employee data)
              |
              +---> Knowledge Base: "Product Docs"
              |       +-- Azure Blob (manuals)
              |       +-- Web (public docs)
              |
              +---> Knowledge Base: "Financial Data"
                      +-- Fabric IQ (semantic models)
                      +-- OneLake (reports)
```

## Relationship to Other Components

### Foundry IQ vs. Fabric IQ
- **Foundry IQ**: Retrieves from documents and unstructured data (RAG-style)
- **Fabric IQ**: Queries structured data through semantic models (analytics-style)
- Both can feed the same agent through different skills

### Foundry IQ vs. Azure AI Search
- Azure AI Search is the underlying search infrastructure
- Foundry IQ is the higher-level abstraction that manages knowledge bases, permissions, and agentic retrieval
- Developers interact with Foundry IQ; it uses Azure AI Search internally

### Foundry IQ vs. Custom RAG
- Custom RAG gives full control but requires building and maintaining the pipeline
- Foundry IQ is managed: ingestion, chunking, embedding, indexing, retrieval, and permissions are handled
- Trade-off: less customization for less operational burden

## Security and Governance

- **Permission-aware by default** -- retrieval respects source-level permissions
- **Data residency** -- knowledge bases are regional, data stays in the configured region
- **Audit logging** -- all retrieval operations are logged
- **Encryption** -- data at rest and in transit
- **SLA-backed** -- GA service with enterprise SLA

## Current Limitations

- Billing has not yet started (expected late 2026)
- Source connector ecosystem is growing but may not cover all enterprise systems yet
- Agentic retrieval quality depends on source data quality and indexing configuration
- NEEDS VERIFICATION: Maximum knowledge base size and document limits

## NEEDS VERIFICATION
- Exact billing model and pricing tiers when billing begins
- Full list of supported MCP source connectors
- Performance benchmarks for agentic retrieval vs. standard vector search
- Whether Foundry IQ supports custom embedding models or only Microsoft-provided ones
- Maximum concurrent agent connections per knowledge base
