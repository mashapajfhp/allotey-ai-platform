# Unity Catalog -- Centralized Governance for Data and AI

STATUS: RESEARCH COMPLETE -- August 2026

## What Unity Catalog Is

Unity Catalog is Databricks' **unified governance layer** for all data and AI assets. When enabled for a workspace, it operates beneath every interaction automatically: enforcing access control on queries, tracking lineage as assets are used, and logging activity for audit. It is the single system of record for metadata, permissions, and lineage across the entire Databricks platform.

Unity Catalog was partially open-sourced in 2024 (the catalog/metastore layer), but the full governance feature set (row-level security, column masking, attribute-based access control, AI asset governance) remains a Databricks-managed capability.

## Hierarchy and Object Model

Unity Catalog uses a **three-level namespace**:

```
Account
  |-- Metastore (one per region, links to multiple workspaces)
        |-- Catalog (logical grouping, e.g., "production", "staging", "finance")
              |-- Schema (namespace within a catalog)
                    |-- Tables (managed or external, Delta or Iceberg)
                    |-- Views
                    |-- Volumes (managed or external file storage)
                    |-- Functions (SQL UDFs, Python UDFs, AI functions)
                    |-- Models (registered ML models)
                    |-- Feature tables
                    |-- Connections (to external data sources)
```

### Metastore
- One metastore per cloud region, managed at the Databricks account level
- A single metastore can be linked to **multiple workspaces** in the same region
- Provides a consistent governance view across all linked workspaces
- Cross-region and cross-cloud metastore federation was announced at DAIS 2026

### Catalogs and Schemas
- Catalogs are the top-level organizational unit (analogous to databases in traditional RDBMS)
- Schemas are sub-namespaces within catalogs
- All assets are referenced as `catalog.schema.object` (three-part naming, ANSI SQL compliant)

### Securable Objects

Every governed asset is modeled as a **securable object**. Key securable object types:

| Object Type | Description |
|---|---|
| TABLE | Managed or external Delta/Iceberg tables |
| VIEW | SQL views, including dynamic views for row-level security |
| VOLUME | Managed or external file/blob storage |
| FUNCTION | SQL UDFs, Python UDFs, AI functions |
| MODEL | Registered ML models (MLflow model registry) |
| CONNECTION | Connections to external databases (Lakehouse Federation) |
| SHARE | Delta Sharing objects for cross-org data sharing |
| EXTERNAL LOCATION | Cloud storage paths registered for governance |
| STORAGE CREDENTIAL | Cloud provider credentials for accessing storage |

## Access Control

Unity Catalog uses **ANSI SQL GRANT/REVOKE** syntax for permissions:

```sql
GRANT SELECT ON TABLE catalog.schema.my_table TO `user@company.com`;
GRANT EXECUTE ON FUNCTION catalog.schema.my_func TO `data-scientists`;
```

### Permission Model
- **Privilege inheritance**: Permissions cascade from catalog to schema to object
- **Owner privileges**: Every securable has an owner with full control
- **Groups**: Databricks account groups and workspace groups; SCIM sync from IdP
- **Row-level security**: Dynamic views or row filters on tables
- **Column masking**: Column-level data masking functions applied at query time
- **Attribute-based access control (ABAC)**: Tag-based policies (e.g., "PII" tag triggers masking)

### Identity Federation
- Integrates with SCIM for user/group sync from identity providers (Okta, Azure AD, etc.)
- Service principals for automated workloads
- On-behalf-of-user authentication for MCP servers and agents (caller's identity passes through)

## Lineage

Unity Catalog tracks **automatic lineage** across the platform:

- **Table-level lineage**: Which tables feed into which downstream tables
- **Column-level lineage**: Which specific columns flow through transformations
- **Cross-language**: Tracks lineage from SQL, Python, Scala, and R notebooks
- **Model lineage**: Which tables/features were used to train a model
- **Dashboard lineage**: Which tables power which dashboards/reports
- **External assets**: Assets outside Unity Catalog can be registered as external metadata objects and linked into the lineage graph

Lineage is captured automatically from Spark query plans and notebook execution -- no manual annotation required. Lineage data is queryable through the Unity Catalog REST API and visible in the Databricks UI (Catalog Explorer).

NEEDS VERIFICATION: Whether lineage now extends to agent tool calls and MCP server invocations (tracking which agent called which function on which data). This was announced as a direction at DAIS 2026 but unclear if fully shipped.

## Functions as Governed Assets

Functions in Unity Catalog are first-class governed objects:

- **SQL UDFs**: Standard SQL functions stored in UC
- **Python UDFs**: Python functions registered in UC, executable in SQL or Python
- **AI Functions**: Built-in functions like `ai_query()`, `ai_generate()`, `ai_search()` that call model endpoints
- **Tool functions**: UC functions that agents can invoke as tools (automatically exposed via MCP)

When an agent calls a UC function, the function executes with the **caller's permissions**, not a service account. This is the key security property -- agents cannot escalate privileges through tool calls.

## Models in Unity Catalog

ML models are registered as UC securable objects:

- Models are logged via MLflow and registered in the UC model registry
- Model versions are tracked with lineage back to training data and code
- Access control (who can deploy, who can query) follows UC permission model
- Model serving endpoints reference UC-registered models
- Model aliases (e.g., "production", "staging") provide stable references

## Data Sharing

Unity Catalog integrates with **Delta Sharing** (open protocol):

- **Shares**: Named collections of tables/views shared with external recipients
- **Recipients**: External organizations that receive shared data
- **Open protocol**: Recipients can be on any platform (not just Databricks)
- **Databricks-to-Databricks sharing**: Tighter integration with cross-account UC access
- **Clean Rooms**: Secure collaborative computation without exposing raw data (based on Delta Sharing)

## Lakehouse Federation

Connections to external databases allow Unity Catalog to govern access to data that lives outside the lakehouse:

- PostgreSQL, MySQL, SQL Server, Oracle, Snowflake, BigQuery, Redshift, etc.
- External tables appear in UC namespace and are subject to UC access control
- Queries are pushed down to the source system where possible
- Lineage is tracked across federated queries

## Key Architectural Properties

1. **Single governance plane**: One system governs tables, files, models, functions, agents, and dashboards
2. **Identity pass-through**: The end user's identity is preserved through all layers (including agent tool calls and MCP)
3. **Open format foundation**: Governed assets sit on open formats (Delta, Iceberg, Parquet) in customer-owned storage
4. **Cross-workspace consistency**: A metastore spans workspaces, ensuring consistent policies
5. **Audit logging**: All access is logged and queryable through system tables

## What This Means for Platform Design

Unity Catalog's most important contribution to platform architecture thinking is the proof that **data governance and AI governance can share a single system**. Rather than bolting ML model governance onto a separate system, Databricks treats models, functions, agents, and MCP servers as the same kind of object as tables and views -- with the same permission model, the same lineage tracking, and the same audit infrastructure.
