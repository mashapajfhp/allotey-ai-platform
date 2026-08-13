# Microsoft Fabric IQ

**STATUS: RESEARCHED -- Based on official Microsoft documentation and Ignite 2025 / Build 2026 announcements**

## What Is Fabric IQ

Fabric IQ is a **semantic intelligence layer** within Microsoft Fabric. Announced at Microsoft Ignite 2025, it organizes data according to the language of your business -- not just tables and columns, but entities, relationships, rules, and objectives.

The core thesis: enterprises already have rich semantic models built for Power BI and analytics. Fabric IQ extends those models beyond reporting into AI and operations, so that AI agents understand the business language that already exists in the organization.

## Five Integrated Capabilities

Fabric IQ delivers five capabilities that work together:

### 1. Ontology
- A shared model of business entities, relationships, rules, and objectives
- Can be generated directly from existing semantic models already in production
- Keeps business language consistent across analytics, AI, and operations
- Represents the "what things mean" layer on top of raw data

### 2. Semantic Model Extension
- Extends existing Power BI / Analysis Services semantic models beyond analytics
- Measures, dimensions, hierarchies, and business rules become accessible to AI agents
- Same model used for dashboards now also used for AI grounding and operational decisions
- No duplication -- one definition serves both BI and AI

### 3. Native Graph Engine
- Built directly on OneLake with scale-out, sharded processing
- Supports billions of relationships
- GQL standard support (ISO/IEC 39075)
- Natural-language-to-GQL translation for non-technical users
- Enables multi-hop reasoning across data -- e.g., "find all customers connected to suppliers in region X who have overdue invoices"
- Inherits Fabric's unified security and governance

### 4. Data Agents (Virtual Analysts)
- AI-powered agents that can answer business questions using the semantic layer
- Translate natural-language questions into DAX queries
- Use the semantic model's metadata to select appropriate measures and dimensions
- Return answers grounded in the governed semantic model, not raw data guessing
- Can be surfaced through Copilot experiences or custom applications

### 5. Operations Agents
- Autonomous agents that reason, learn, and act in real time
- Go beyond answering questions to taking operational actions
- Use the ontology and semantic model to understand business context
- NEEDS VERIFICATION: Exact capabilities and GA status of operations agents

## How Fabric IQ Differs from Foundry IQ

These are distinct but complementary layers:

| Aspect | Fabric IQ | Foundry IQ |
|--------|-----------|------------|
| **Focus** | Semantic intelligence on structured data | Knowledge retrieval from documents and unstructured data |
| **Data type** | Tabular data, semantic models, ontologies, graphs | Documents, SharePoint, web content, file stores |
| **Query method** | DAX, GQL, natural language to structured query | Vector search, agentic retrieval, keyword/semantic search |
| **Primary use** | Business analytics, BI, operational intelligence | RAG, document Q&A, knowledge grounding |
| **Underlying platform** | Microsoft Fabric (OneLake) | Microsoft Foundry (Agent Service) |
| **Existing investment** | Extends Power BI semantic models | Replaces custom RAG pipelines |

Both can feed into agents built on Microsoft Foundry / Agent Framework. An agent might use Foundry IQ for document retrieval and Fabric IQ for business analytics in the same conversation.

## Copilot Integration

Fabric IQ is a core enabler for Copilot's data capabilities:

- **Copilot in Power BI** uses the semantic model layer to generate accurate DAX queries
- **Copilot in Microsoft 365** can access business data through Fabric IQ's data agents
- **Custom Copilot extensions** can leverage Fabric IQ for domain-specific data grounding

The semantic model acts as a trust boundary: Copilot can only access data through governed measures and dimensions, not raw tables.

## Architecture and Data Flow

```
Natural Language Question
    |
    v
Data Agent / Copilot
    |
    v
Semantic Model Layer (Fabric IQ)
    |-- Ontology (entities, relationships, rules)
    |-- Measures & Dimensions (from Power BI)
    |-- Graph Engine (multi-hop reasoning)
    |
    v
DAX / GQL Query Generation
    |
    v
OneLake (unified data storage)
    |
    v
Governed, Source-Backed Answer
```

## Security and Governance

- Inherits Fabric's unified security model
- Row-level security (RLS) from semantic models carries through to AI access
- Object-level security (OLS) for sensitive measures
- Unified audit trail across analytics and AI usage
- Data never leaves the governance boundary -- agents query through the semantic layer, not raw data

## Why This Matters for Platform Design

The Fabric IQ approach solves a common enterprise problem: organizations have years of investment in BI semantic models that encode business logic, naming conventions, and access rules. Rather than rebuilding this knowledge for AI, Fabric IQ reuses it.

Key design insight: **semantic models are a form of enterprise knowledge that is already curated, governed, and trusted.** Making them AI-accessible is higher-value and lower-risk than building new RAG pipelines over raw data.

## Current Status

- Ontology: NEEDS VERIFICATION on GA status
- Semantic Model Extension: Available through existing Power BI semantic models
- Graph Engine: Public preview (NEEDS VERIFICATION on GA timeline)
- Data Agents: Available through Copilot integration
- Operations Agents: NEEDS VERIFICATION on availability

## NEEDS VERIFICATION
- Exact GA dates for Graph Engine, Ontology, and Operations Agents
- Pricing model for Fabric IQ capabilities (likely bundled with Fabric SKUs)
- Performance characteristics of natural-language-to-GQL translation at scale
- Whether third-party semantic model formats (dbt, Looker) can be imported
