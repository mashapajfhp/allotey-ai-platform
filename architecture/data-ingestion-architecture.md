# Data Ingestion Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Purpose

Defines how data enters the platform. An intelligence platform cannot only define what happens AFTER data arrives — it must define how data gets there in the first place.

The reference architecture defines the Intelligence Data Plane (transactional, analytical, events, documents, vectors, graphs) but does not yet address HOW data flows into those stores. This document fills that gap.

---

## The Gap in the Current Architecture

```
CURRENT ARCHITECTURE:
                                     ??? HOW DOES DATA GET HERE ???
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  INTELLIGENCE DATA PLANE                            │
│  Transactional │ Analytical │ Events │ Documents │ Vectors │ Graphs │
└─────────────────────────────────────────────────────────────────────┘

THIS DOCUMENT ADDRESSES:
┌─────────────────────────────────────────────────────────────────────┐
│                   DATA INGESTION LAYER                              │
│                                                                     │
│  Databases │ APIs │ SaaS │ Files │ Streams │ CDC │ IoT │ MCP       │
│                                                                     │
│  Schema Discovery │ Normalization │ Quality │ Lineage │ Dedup      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  INTELLIGENCE DATA PLANE                            │
│  Transactional │ Analytical │ Events │ Documents │ Vectors │ Graphs │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Source Categories

### 1. Database Connectors

**What:** Direct connections to relational databases (PostgreSQL, MySQL, SQL Server, Oracle), NoSQL databases (MongoDB, DynamoDB), and data warehouses (BigQuery, Redshift, Snowflake).

**Patterns:**
- Full table extraction (initial load)
- Incremental extraction (timestamp-based, cursor-based)
- Change data capture (log-based CDC)

### 2. Change Data Capture (CDC)

**What:** Real-time capture of database changes (inserts, updates, deletes) from transaction logs. Enables near-real-time data synchronization without polling.

**Why it matters:** CDC is the only way to get real-time database changes without impacting the source database's performance. Critical for keeping the context graph and analytical stores current.

### 3. API Ingestion

**What:** Pulling data from REST APIs, GraphQL endpoints, and SOAP services. Handles pagination, rate limiting, authentication, and schema mapping.

**Patterns:**
- Scheduled polling (pull new records on interval)
- Cursor-based incremental sync
- Full refresh with deduplication

### 4. Webhooks (Push-Based)

**What:** Receiving real-time events pushed from external systems. Requires an ingestion endpoint that validates, authenticates, and routes incoming payloads.

**Why it matters:** Many SaaS systems and internal applications support webhooks as the primary integration pattern. The platform must be a reliable webhook receiver.

### 5. Batch Ingestion

**What:** Processing large volumes of data in scheduled batches — CSV files, database dumps, data warehouse exports, partner data feeds.

**Patterns:**
- Scheduled batch jobs (daily, hourly)
- File-based ingestion (CSV, Parquet, JSON)
- Database dump ingestion

### 6. Stream Ingestion

**What:** Continuous ingestion of streaming data from message queues and event streams — Kafka, Redpanda, RabbitMQ, cloud event services.

**Why it matters:** Real-time intelligence requires real-time data. Stream ingestion is the backbone for event-driven architecture.

### 7. Document and File Ingestion

**What:** Processing unstructured and semi-structured content — PDFs, Word documents, spreadsheets, images, audio, video. Includes OCR, transcription, and content extraction.

**Integration:** Feeds the Knowledge Engine (embedding + indexing) and Document store.

### 8. Object Storage

**What:** Ingesting from cloud object stores (S3, GCS, Azure Blob) and local file systems. Supports file watching, event-triggered ingestion, and large file handling.

### 9. SaaS Connectors

**What:** Pre-built connectors for common SaaS applications — Salesforce, HubSpot, Zendesk, Jira, Slack, Google Workspace, Microsoft 365, etc.

**Why it matters:** Enterprise data lives in SaaS applications. Pre-built connectors dramatically reduce integration time.

### 10. IoT / Event Feeds

**What:** High-volume, low-latency data from IoT devices, sensors, telemetry systems, and operational equipment.

**Patterns:**
- MQTT ingestion
- Time-series data handling
- Edge processing and aggregation

### 11. Email / Messages

**What:** Ingesting email content, chat messages, and communication data for analysis, knowledge extraction, and process automation.

### 12. External MCP Sources

**What:** Data and context provided by external MCP servers — the platform as an MCP client consuming data from third-party MCP-enabled systems.

**Integration:** Connects through the MCP Gateway (see `architecture/mcp-architecture.md`).

---

## Processing Capabilities

### Schema Discovery and Evolution

**What it does:** Automatically discovers the schema of incoming data, detects schema changes over time, and handles schema evolution (new columns, type changes, removed fields) without breaking downstream consumers.

**Why it matters:** Source schemas change without warning. The ingestion layer must detect and adapt to changes, not silently break.

### Schema Mapping and Normalization

**What it does:** Maps source schemas to the platform's internal data models. Normalizes naming conventions, data types, units, and formats. Applies domain-specific transformations.

**Integration:** Maps incoming data to Domain Ontology entity types when applicable.

### Data Lineage

**What it does:** Tracks the complete path of every piece of data — from source system, through transformations, to destination store. Records what was ingested, when, from where, and how it was transformed.

**Integration:** Feeds the Metadata/Governance capability and provenance system.

### Data Quality

**What it does:** Validates incoming data against quality rules — completeness, accuracy, consistency, timeliness, uniqueness. Flags or quarantines data that fails quality checks.

**Patterns:**
- Schema validation (type checking, required fields)
- Business rule validation (range checks, referential integrity)
- Statistical quality checks (outlier detection, distribution drift)
- Quality scoring and dashboarding

### Deduplication

**What it does:** Detects and resolves duplicate records — exact matches and fuzzy matches. Handles merge strategies (keep first, keep last, merge fields).

### Identity Resolution

**What it does:** Links records representing the same real-world entity across different source systems. Resolves "John Smith in Salesforce" and "J. Smith in Zendesk" as the same customer.

**Why it matters:** Enterprise data is fragmented across systems. Identity resolution is the foundation for a unified view of entities in the Context Graph.

### Change Data Capture Processing

**What it does:** Processes CDC events (insert, update, delete) and applies them to destination stores. Handles ordering, deduplication, and conflict resolution.

### Incremental Sync

**What it does:** Tracks sync state (cursors, timestamps, sequence numbers) to only process new or changed data. Avoids full re-extraction on every sync.

### Backfill and Reconciliation

**What it does:** Supports historical backfill (loading past data for a new source) and reconciliation (verifying that destination data matches source data).

---

## Technology Landscape

> All technologies below require individual deep research. License verification is CRITICAL — some projects have recently changed licenses.

| Technology | License | Category | Status |
|-----------|---------|----------|--------|
| Airbyte | MIT / ELv2 — VERIFY | ELT platform, 300+ connectors | NOT STARTED |
| Debezium | Apache 2.0 | CDC from database transaction logs | NOT STARTED |
| dlt (data load tool) | Apache 2.0 | Python-first data loading library | NOT STARTED |
| Meltano | MIT | Singer-based ELT, CLI-driven | NOT STARTED |
| Kafka Connect | Apache 2.0 | Connector framework for Kafka | NOT STARTED |
| Dagster | Apache 2.0 | Data orchestration with lineage | NOT STARTED |
| Apache NiFi | Apache 2.0 | Data flow automation, visual design | NOT STARTED |
| Estuary Flow | VERIFY LICENSE | Real-time CDC + ELT | NOT STARTED |

### License Warnings

- **Airbyte:** The core platform recently moved from MIT to ELv2 (Elastic License v2). The protocol and some connectors remain open. License implications for self-hosted deployment need careful review.
- **Estuary Flow:** License needs verification. Some components may be source-available rather than open-source.
- **Kafka Connect:** Apache 2.0, but many connectors (especially Confluent-provided) have separate licenses.

---

## Integration with Reference Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                            │
│  Databases │ SaaS │ APIs │ Files │ Streams │ IoT │ MCP Servers     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   DATA INGESTION LAYER                              │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐             │
│  │Connectors│ │ CDC      │ │ Schema    │ │ Quality  │             │
│  │          │ │          │ │ Discovery │ │          │             │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐             │
│  │Normalize │ │ Dedup    │ │ Identity  │ │ Lineage  │             │
│  │          │ │          │ │ Resolution│ │          │             │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                   ┌────────────┼────────────┐
                   │            │            │
                   ▼            ▼            ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │Context   │ │Knowledge │ │Analytical│
            │Graph     │ │Engine    │ │Engine    │
            └──────────┘ └──────────┘ └──────────┘
```

### Connections to Existing Architecture Components

| Component | Relationship |
|-----------|-------------|
| Domain Ontology | Ingested data maps to ontology entity types |
| Context Graph | Ingested entities and relationships populate the graph |
| Knowledge Engine | Ingested documents feed embedding and retrieval |
| Analytical Engine | Ingested data feeds analytical queries |
| Event Intelligence | Ingested events feed pattern detection |
| Metadata/Governance | Ingestion lineage and quality feed governance |
| Observability | Ingestion pipelines are traced and monitored |
| Security | Ingestion respects data classification and tenant isolation |

---

## Research Questions

1. **V1 scope:** What ingestion capabilities are needed for V1? Can V1 start with manual data loading and a small set of connectors?
2. **Airbyte vs. dlt vs. Meltano:** Which is the best fit for the platform's connector needs, licensing constraints, and operational complexity?
3. **CDC strategy:** Is Debezium the right CDC solution, or is CDC a V2 concern?
4. **Orchestration:** Should ingestion be orchestrated by Dagster (already researched) or a separate scheduler?
5. **Schema-to-ontology mapping:** How does ingested data schema map to Domain Ontology types? Is this manual or automated?
6. **Tenant isolation:** How are multi-tenant ingestion pipelines isolated?
7. **Scale boundaries:** At what data volume does the ingestion layer need its own dedicated infrastructure?

---

## References

- `architecture/reference-architecture.md` — Intelligence Data Plane
- `architecture/ontology-architecture.md` — Domain Ontology (target for mapping)
- `architecture/knowledge-architecture.md` — Knowledge Engine (document ingestion target)
- `architecture/event-architecture.md` — Event Intelligence (event ingestion target)
- `open-source/ingestion/README.md` — individual technology research
- `open-source/workflows/dagster.md` — Dagster for orchestration
