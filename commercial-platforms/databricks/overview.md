# Databricks Platform Overview

STATUS: RESEARCH COMPLETE -- August 2026

## What Databricks Is

Databricks is the **Data Intelligence Platform** -- a unified environment for data engineering, data warehousing, business intelligence, machine learning, and generative AI. The core thesis is that data and AI should share a single platform with a single governance layer, rather than existing as separate stacks that must be integrated.

The platform runs on all three major clouds (AWS, Azure, GCP) and is built on open-source foundations: Apache Spark, Delta Lake, MLflow, and Unity Catalog (open-sourced in 2024).

## Lakehouse Architecture

The foundational architectural concept is the **Lakehouse** -- a combination of data lake flexibility with data warehouse reliability:

- **Open storage layer**: Data lives in customer-owned cloud object storage (S3, ADLS, GCS) in open formats (Delta Lake, Apache Iceberg). Databricks does not lock data into proprietary formats.
- **Compute layer**: Serverless and classic compute clusters process data. Compute is separated from storage, enabling independent scaling.
- **Control plane vs. data plane**: Databricks manages a **control plane** (workspace management, job orchestration, access control, notebook UI, API layer) while the **data plane** (actual data processing, storage) runs in the customer's cloud account. This separation is critical for security and compliance.
- **Delta Lake**: The storage format layer providing ACID transactions, schema enforcement, time travel, and Z-ordering on top of Parquet files in object storage.
- **Photon engine**: C++-based vectorized query engine for high-performance SQL analytics, replacing portions of the Spark SQL engine for warehouse workloads.

## The Data Intelligence Engine

Databricks describes a "Data Intelligence Engine" that adds AI understanding to the platform itself:

- Understands the **semantics** of customer data (column meanings, business terminology, usage patterns)
- Powers features like Genie (natural language analytics), AI-assisted code generation in notebooks, and auto-tuning of queries
- Draws on metadata, lineage, and usage signals captured by Unity Catalog
- This is not a single service but a cross-cutting capability woven into multiple products

## Major Platform Components

### Data Engineering
- **Delta Live Tables (DLT)**: Declarative ETL pipelines with automatic dependency management, data quality constraints, and incremental processing
- **Workflows / Jobs**: Orchestration for notebooks, JARs, Python scripts, dbt, and SQL queries
- **Serverless compute**: Auto-provisioned infrastructure for notebooks and jobs

### Data Warehousing & SQL
- **Databricks SQL (DBSQL)**: SQL-native warehouse experience with serverless SQL warehouses, query history, query profiling
- **Photon-accelerated queries**: Automatic acceleration of SQL workloads
- **Delta Lake and Iceberg support**: Query tables in either format through the same SQL interface

### AI/BI (Business Intelligence)
- **AI/BI Dashboards**: Native dashboard product replacing legacy DBSQL dashboards
- **Genie**: Natural language interface for business users to query data conversationally
- See `genie.md` for deep dive

### Machine Learning & AI
- **Mosaic AI**: The umbrella brand for Databricks' AI products
- **Model Serving**: Serverless endpoints for hosting models (foundation models, custom models, agents)
- **MLflow (Managed)**: Experiment tracking, model registry, evaluation, tracing -- now at MLflow 3.x
- **Agent Framework**: Tools for building, evaluating, and deploying AI agents
- **AI Search (Vector Search)**: Managed vector database for retrieval-augmented generation
- **Unity AI Gateway**: Governance and routing layer for all model and agent traffic
- See dedicated files for each

### Governance
- **Unity Catalog**: Centralized metastore governing all data and AI assets
- **Lineage**: Automatic tracking of how data flows through transformations
- **Access Control**: Fine-grained permissions (row-level security, column masking, attribute-based access)
- See `unity-catalog.md` for deep dive

## How AI and Data Unify

The key insight in Databricks' architecture is that **the same governance layer (Unity Catalog) governs both data assets and AI assets**:

| Data Assets | AI Assets |
|---|---|
| Tables, views | ML models (registered) |
| Volumes (files) | Model serving endpoints |
| Schemas, catalogs | Functions (UDFs, AI functions) |
| External locations | Agents, MCP servers |
| Connections | Feature tables |

This means:
1. An AI agent calling a Unity Catalog function inherits the **caller's permissions** on the underlying tables
2. Lineage tracks not just table-to-table flows but also model-to-table and agent-to-function dependencies
3. Rate limits, guardrails, and audit logs for AI endpoints are managed in the same system as data access policies
4. A single metastore spans multiple workspaces in a region, giving a consistent governance view

## Control Plane Concept

Databricks effectively operates as a **shared control plane for data and AI**:

- Unity Catalog is the metadata and permissions backbone
- Unity AI Gateway is the runtime governance layer for model/agent traffic
- MLflow is the lifecycle management layer for AI artifacts
- All three share identity, permissions, and audit infrastructure
- The customer's data never leaves their cloud account (data plane), but governance policies are centrally managed

This "shared control plane" pattern -- where data governance, AI governance, model lifecycle, and runtime policy enforcement are unified under one system -- is the most distinctive architectural choice Databricks has made. It avoids the common enterprise pattern of separate governance stacks for data vs. ML vs. AI.

## What Is NOT Open Source

While Delta Lake, MLflow, and Unity Catalog (catalog layer) are open source, significant components remain proprietary:

- Photon query engine
- Serverless compute infrastructure
- Genie / AI/BI
- AI Gateway runtime
- Agent Framework (some parts)
- The "Data Intelligence Engine" AI layer
- Managed MCP server infrastructure

NEEDS VERIFICATION: The exact boundary of what is open-source in Unity Catalog vs. proprietary extensions continues to evolve. The open-source Unity Catalog project covers the catalog/metastore layer but not all governance features available in Databricks-hosted Unity Catalog.
