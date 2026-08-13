# Snowflake AI Data Cloud -- Platform Overview

> STATUS: RESEARCH COMPLETE | Last updated: 2026-08-13

## Purpose of This Document

Snowflake is studied here as a reference architecture for the pattern:
**structured data --> semantic business model --> natural language analytics**.
This overview covers the platform's foundational architecture and how its AI
capabilities layer on top of the data platform.

---

## Core Architecture: Three Separated Layers

Snowflake's architecture is built on a strict separation of three layers. Each
layer scales independently, which is the key insight behind zero-copy cloning,
instant scale-up, and per-second billing.

### 1. Storage Layer

- Data is stored in a centralized cloud object store (S3, Azure Blob, or GCS)
  in a proprietary compressed, columnar format called **micro-partitions**.
- Micro-partitions are immutable -- updates create new partitions, enabling
  time travel and fail-safe recovery.
- Storage is billed independently from compute. You pay only for what you store.

### 2. Compute Layer (Virtual Warehouses)

- **Virtual warehouses** are named clusters of compute nodes that execute queries.
- Each warehouse operates independently -- no shared state between warehouses.
- Warehouses can be started, stopped, resized (T-shirt sizes: XS to 6XL), and
  auto-suspended without affecting other workloads.
- Multi-cluster warehouses auto-scale horizontally for concurrency.
- Compute is billed per-second with a 60-second minimum.

### 3. Cloud Services Layer

- The "brain" of Snowflake: handles authentication, access control, metadata
  management, query parsing, optimization, and transaction coordination.
- Runs continuously and is shared across the account (billed only when usage
  exceeds 10% of daily compute).
- This layer is where role-based access control (RBAC), query history, and
  result caching live.

---

## Security and Governance Model

Snowflake's security is relevant because its AI features inherit the same
governance automatically.

| Capability | Description |
|---|---|
| **RBAC** | Hierarchical roles control access to databases, schemas, tables, views. |
| **Row-level security** | Row access policies filter data per role/user. |
| **Column-level security** | Dynamic data masking policies redact sensitive columns. |
| **Network policies** | IP allowlists and private connectivity (AWS PrivateLink, Azure Private Link). |
| **Encryption** | End-to-end encryption (AES-256) at rest and in transit. Always on. |
| **Time Travel** | Query or restore data as it existed up to 90 days ago. |
| **Access History** | Full audit trail of who accessed what data and when. |

---

## How AI Capabilities Layer on the Platform

Snowflake's AI stack is marketed under **Cortex AI**. It is not a separate
product -- it runs inside the same governed environment, using the same RBAC,
masking policies, and audit controls.

### AI Stack Components

```
+------------------------------------------------------------------+
|                     Snowflake Intelligence                        |
|          (End-user agent: NL questions --> insights)              |
+------------------------------------------------------------------+
|                       Cortex Agents                               |
|     (Orchestration: multi-step reasoning, tool selection)         |
+------------------------------------------------------------------+
|  Cortex Analyst          |  Cortex Search          | AI Functions |
|  (Structured data:       |  (Unstructured data:    | (COMPLETE,   |
|   NL --> SQL via          |   hybrid vector +       |  SUMMARIZE,  |
|   semantic model)         |   keyword search)       |  TRANSLATE,  |
+------------------------------------------------------------------+
|                 Semantic Views / Semantic Models                   |
|           (Business meaning encoded in YAML / DDL)                |
+------------------------------------------------------------------+
|               Snowflake Data Cloud (tables, stages, shares)       |
+------------------------------------------------------------------+
```

### Key Principle: AI Sits on Governed Data

- Cortex Analyst queries your tables through the same RBAC that governs
  direct SQL access. If a user's role cannot see a column, the AI cannot
  surface it either.
- Cortex Search indexes are scoped to specific tables/columns and inherit
  access controls.
- No data leaves the Snowflake account boundary for Cortex AI processing
  (Snowflake states that Cortex does not train on or store customer data).

---

## Built-in AI Functions (SQL-Callable)

These are invoked as standard SQL functions on any column:

| Function | Purpose |
|---|---|
| `COMPLETE` (aka `AI_COMPLETE`) | Prompt any supported LLM (Llama, Mistral, etc.) and get a text response. |
| `SUMMARIZE` | Summarize a text column or value. |
| `TRANSLATE` | Translate text between languages. |
| `SENTIMENT` | Return sentiment score for text. |
| `EXTRACT_ANSWER` | Extract a specific answer from unstructured text given a question. |
| `EMBED_TEXT_768` | Generate 768-dimensional vector embeddings for semantic similarity. |

Billing: input + output tokens for generative functions (COMPLETE, SUMMARIZE,
TRANSLATE); input tokens only for extractive functions (EXTRACT_ANSWER,
SENTIMENT).

---

## Performance Benchmarks (2026)

Snowflake reports the following improvements in their current generation:

- 1.6x faster analytics queries
- 2.2x more queries per hour
- 3.5x faster DML operations

These benchmarks apply to the core compute engine, which indirectly benefits
AI workloads that generate and execute SQL (Cortex Analyst).

---

## Relevance to Allotey AI Platform

Snowflake demonstrates that:

1. **Semantic models on top of existing data** are the unlock for NL analytics
   -- the AI does not need raw schema access, it needs business meaning.
2. **Governance inheritance** means AI features do not require a separate
   security model -- they inherit what already exists.
3. **Separation of compute and storage** enables AI workloads to run without
   competing with operational queries.
4. **The platform-native approach** (AI as SQL functions, not external APIs)
   reduces integration friction but creates vendor lock-in.

---

## Sources

- [Snowflake Architecture Documentation](https://docs.snowflake.com/en/user-guide/intro-key-concepts)
- [Snowflake Cortex AI Functions](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql)
- [Snowflake AI Product Page](https://www.snowflake.com/en/product/ai/)
