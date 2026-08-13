# Deep Research: Cube as Semantic Layer for Open-Source AI Platform

**Research Date:** 2026-08-13
**Researcher:** Claude Opus 4.6 (automated deep research)
**Repository:** https://github.com/cube-js/cube
**Documentation:** https://docs.cube.dev
**Latest Version:** v1.7.19 (released August 12, 2026)

---

## Table of Contents

1. [Repository Overview](#1-repository-overview)
2. [Architecture Deep-Dive](#2-architecture-deep-dive)
3. [API Surface Documentation](#3-api-surface-documentation)
4. [Security and Multi-Tenancy Analysis](#4-security-and-multi-tenancy-analysis)
5. [Agent Integration Patterns](#5-agent-integration-patterns)
6. [Open-Source Purity Assessment](#6-open-source-purity-assessment)
7. [Self-Hosting Guide](#7-self-hosting-guide)
8. [Code Examples](#8-code-examples)
9. [Comparison with Alternatives](#9-comparison-with-alternatives)
10. [Recommendation](#10-recommendation)

---

## 1. Repository Overview

### Basic Facts

| Attribute | Value |
|-----------|-------|
| **GitHub** | https://github.com/cube-js/cube |
| **Stars** | 20,600+ |
| **Forks** | 2,100+ |
| **Watchers** | 154 |
| **Total Commits** | 11,093 (on master) |
| **Open Issues** | ~697 (205 marked "help wanted") |
| **License** | Apache 2.0 (backend) / MIT (client packages) |
| **Primary Languages** | TypeScript, Rust, JavaScript |
| **Latest Version** | v1.7.19 (August 12, 2026) |
| **Release Cadence** | Every 1-3 days |
| **LTS Versions** | v1.6.70, v1.4.4 |

### Repository Structure

```
cube/
  packages/                    # Core Node.js/TypeScript packages
    cubejs-server/             # Main server, CLI commands
    cubejs-server-core/        # Orchestrates API Gateway, Query Orchestrator, Schema Compiler
    cubejs-api-gateway/        # REST, GraphQL, WebSocket protocols
    cubejs-query-orchestrator/ # Execution, caching, pre-aggregations
    cubejs-schema-compiler/    # Query compiler (semantic -> SQL)
    cubejs-postgres-driver/    # Postgres driver
    cubejs-bigquery-driver/    # BigQuery driver
    cubejs-snowflake-driver/   # Snowflake driver
    cubejs-*-driver/           # 20+ database-specific drivers
    cubejs-client-core/        # Client SDK (MIT licensed)
    cubejs-client-react/       # React bindings (MIT licensed)
  rust/                        # Rust-based components
    cubestore/                 # Cube Store (caching engine, Apache 2.0)
    cubesql/                   # SQL API wire protocol
  docs/                        # Documentation source
  examples/                    # Sample projects
```

### License Verification

- **Backend packages** (`cubejs-server`, `cubejs-schema-compiler`, etc.): **Apache 2.0**
- **Client packages** (`cubejs-client-core`, `cubejs-client-react`, etc.): **MIT**
- **Cube Store** (Rust caching engine): **Apache 2.0**
- **CubeSQL** (SQL wire protocol): **Apache 2.0** (part of the main repo under `rust/`)

**Verdict: The entire core is genuinely open source under Apache 2.0 / MIT.**

### Recent Activity

- Releases every 1-3 days (v1.7.17 on Aug 7, v1.7.18 on Aug 9, v1.7.19 on Aug 12)
- Active bug fixes across CubeSQL, Tesseract, and database drivers
- Maintains LTS branches for stability
- Over 11,000 total commits; healthy, active project

---

## 2. Architecture Deep-Dive

### High-Level Architecture

```
                    +------------------+
                    |   Applications   |
                    | (BI, Apps, AI)   |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
         REST API     GraphQL API     SQL API
         /v1/load     /graphql       (Postgres wire)
              |              |              |
              +--------------+--------------+
                             |
                    +--------+---------+
                    |   API Gateway    |
                    | (cubejs-api-gw)  |
                    +--------+---------+
                             |
                    +--------+---------+
                    | Schema Compiler  |
                    | (semantic->SQL)  |
                    +--------+---------+
                             |
                    +--------+---------+
                    |Query Orchestrator|
                    | (cache, queue)   |
                    +--------+---------+
                        |          |
               +--------+    +----+------+
               |              |           |
          Cube Store     Source DB(s)  Refresh
          (cache)        (Postgres,   Worker
                          BigQuery,
                          etc.)
```

### Query Compiler

The `@cubejs-backend/schema-compiler` package is the brain of Cube. It transforms semantic queries (expressed in terms of measures, dimensions, and filters) into executable SQL.

**Key compilation stages:**

1. **Model Parsing**: Cube definitions (YAML/JS/Python) are parsed into abstract representations
2. **Member Resolution**: `evaluateSymbolSql()` resolves dimension, measure, and segment expressions into SQL fragments
3. **Join Resolution**: Dijkstra's algorithm finds optimal join paths between cubes; all joins are LEFT JOINs
4. **Security Policy Application**: Row-level and member-level security filters are injected
5. **Pre-aggregation Matching**: The `PreAggregations` class checks if any pre-aggregated rollup can serve the query
6. **SQL Generation**: Database-specific SQL is generated via `BaseQuery` and its dialect subclasses

**Core classes:**
- `BaseQuery` (`packages/cubejs-schema-compiler/src/adapter/BaseQuery.js`): Main compilation engine
- `BaseMeasure`, `BaseDimension`, `BaseTimeDimension`: Handle aggregation and attribute definitions
- `buildSqlAndParams()`: Main orchestrator for SQL construction
- `fullKeyQueryAggregate()`: Handles aggregation queries with dimension grouping
- `filterToWhere()`: Converts semantic filters to WHERE clauses
- `maskFilterToSql()`: Handles access control masking

### Pre-Aggregation System

Pre-aggregations are materialized query results that reduce source data by orders of magnitude. They are the primary mechanism for achieving sub-second latency.

**Types:**

| Type | Description |
|------|-------------|
| `rollup` | Most common; aggregates measures by dimensions and time granularity |
| `original_sql` | Materializes the entire SQL of a cube |
| `rollup_join` | Joins two rollup pre-aggregations together |
| `rollup_lambda` | Combines streaming and batch data sources |

**Refresh Strategy:**
- Default: Every 2 minutes, Cube checks freshness using `refresh_key`
- Custom: Define SQL-based refresh checks or time-based schedules
- Incremental: `incremental: true` flag only refreshes partitions within `update_window`
- Partitioning: `partition_granularity` (hour/day/week/month/quarter/year) for time-based partitioning

**Pre-aggregation matching:**
When a query arrives, Cube's aggregate awareness engine:
1. Analyzes the query's measures, dimensions, time dimensions, and filters
2. Searches for a pre-aggregation whose definition covers all requested members
3. If found, routes the query to Cube Store instead of the source database
4. If not found, queries the source database directly

### Cube Store

Cube Store is a purpose-built columnar caching engine written in Rust.

**Key technologies:**
- **RocksDB**: Metadata storage (MetaStore)
- **Apache Parquet**: Columnar data file format
- **Apache Arrow**: In-memory data structures
- **DataFusion**: Query execution framework
- **HyperLogLog**: Approximate distinct count aggregations

**Architecture:**
- **Router Node**: Receives queries from Cube API, distributes to workers, manages metadata
- **Worker Nodes**: Execute SQL queries against Parquet data
- Workers do not interact directly; the Router coordinates everything

**Storage backends for pre-aggregated data:**
- AWS S3
- Google Cloud Storage (GCS)
- Azure Blob Storage
- Local filesystem (single machine only)

**Replaced Redis:** Cube Store now serves as both the pre-aggregation storage AND the cache/queue coordination layer (previously Redis was required). This simplifies the deployment stack significantly.

### Caching Architecture

Cube implements a multi-layer caching strategy:

| Layer | Implementation | Purpose |
|-------|---------------|---------|
| **In-Memory Cache** | `CompilerCache` | Compiled schema API instances |
| **Query Result Cache** | `QueryCache` in Cube Store | Cached query results with LRU/LFU eviction |
| **Pre-aggregation Cache** | Cube Store (Parquet) | Materialized rollup tables |
| **Queue Coordination** | `QueueItem` in Cube Store | Distributed job queue for pre-aggregation builds |

The `QueryOrchestrator` checks each cache layer before falling back to source databases.

---

## 3. API Surface Documentation

### REST API

**Base URL:** `http://localhost:4000/cubejs-api`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/load` | GET/POST | Execute semantic queries, return data |
| `/v1/meta` | GET | Introspect data model (cubes, views, measures, dimensions) |
| `/v1/sql` | POST | Get generated SQL for a query without executing |
| `/v1/pre-aggregations/jobs` | GET | Manage pre-aggregation build jobs |
| `/livez` | GET | Health check (liveness) |
| `/readyz` | GET | Health check (readiness) |

**Authentication:** JWT passed via `Authorization: Bearer <token>` header.

**Query Format (JSON):**
```json
{
  "measures": ["orders.count", "orders.total_amount"],
  "dimensions": ["orders.status", "products.category"],
  "filters": [
    {
      "member": "orders.status",
      "operator": "equals",
      "values": ["shipped"]
    }
  ],
  "timeDimensions": [
    {
      "dimension": "orders.created_at",
      "dateRange": ["2024-01-01", "2024-12-31"],
      "granularity": "month"
    }
  ],
  "limit": 100
}
```

**Transport:** HTTP with long polling (default) or WebSocket (`ws://localhost:4000/cubejs-api/v1/ws`).

### GraphQL API

**Endpoint:** `/cubejs-api/graphql`

The GraphQL schema is auto-generated from the data model. Each cube/view becomes a type with its measures and dimensions as fields.

**Example Query:**
```graphql
query {
  cube {
    orders {
      count
      total_amount
      status
      created_at {
        month
      }
    }
  }
}
```

**Current Limitations:**
- No WebSocket transport support
- No subscriptions to changes
- No referencing segments in queries
- No compare date range queries

### SQL API

**Protocol:** PostgreSQL wire protocol (connect with any Postgres client)

**Connection:** `psql -h localhost -p 15432`

**Semantic SQL:** Extends standard SQL with the `MEASURE()` function:

```sql
SELECT
  users.state,
  MEASURE(orders.count),
  MEASURE(orders.total_amount)
FROM orders
CROSS JOIN users
WHERE orders.status = 'shipped'
GROUP BY 1;
```

The `MEASURE()` function signals to the Cube compiler that this is a semantic measure reference, not a raw column. The compiler traces `MEASURE()` calls through nested subqueries and expands them at the correct aggregation boundary.

**Key capability:** Any tool that speaks Postgres can connect to Cube's SQL API. This includes Tableau, Power BI, Metabase, Superset, DBeaver, Python's psycopg2, etc.

### Meta API (`/v1/meta`)

Returns the complete data model structure programmatically:

```json
{
  "cubes": [
    {
      "name": "orders",
      "title": "Orders",
      "measures": [
        {
          "name": "orders.count",
          "title": "Orders Count",
          "type": "count",
          "description": "Total number of orders"
        }
      ],
      "dimensions": [
        {
          "name": "orders.status",
          "title": "Orders Status",
          "type": "string"
        }
      ],
      "segments": [],
      "connectedComponent": 0
    }
  ]
}
```

This is critical for AI agent integration -- agents can discover available metrics and dimensions programmatically.

---

## 4. Security and Multi-Tenancy Analysis

### JWT-Based Security Context

Cube uses JWTs for authentication and authorization. The decoded JWT payload becomes the `securityContext` object, accessible throughout the system.

**Flow:**
1. Application authenticates user and issues a signed JWT
2. JWT carries claims: tenant ID, user ID, roles, groups, etc.
3. Cube verifies the JWT (via JWKS endpoint or shared secret)
4. The `securityContext` is available to `query_rewrite`, `access_policy`, `COMPILE_CONTEXT`, etc.

**Configuration:**
```bash
CUBEJS_JWK_URL=https://your-auth-provider/.well-known/jwks.json
CUBEJS_JWT_AUDIENCE=your-api-audience
CUBEJS_JWT_ISSUER=https://your-auth-provider/
CUBEJS_JWT_ALGS=RS256
```

### Row-Level Security

**Method 1: `query_rewrite`**
```python
@config('query_rewrite')
def query_rewrite(query: dict, ctx: dict) -> dict:
    if 'tenant_id' in ctx['securityContext']:
        query['filters'].append({
            'member': 'orders.tenant_id',
            'operator': 'equals',
            'values': [ctx['securityContext']['tenant_id']]
        })
    return query
```

**Method 2: `access_policy` (declarative, recommended)**
```yaml
cubes:
  - name: orders
    access_policy:
      - group: tenant_user
        row_level:
          filters:
            - member: tenant_id
              operator: equals
              values: ["{ securityContext.tenantId }"]
```

### Member-Level Security (Column-Level)

```yaml
views:
  - name: orders_view
    cubes:
      - join_path: orders
        includes:
          - status
          - created_at
          - count
          - total_amount
          - profit_margin
        access_policy:
          - group: manager
            member_level:
              excludes:
                - profit_margin
          - group: viewer
            member_level:
              includes:
                - status
                - count
```

### Member Masking

Returns masked values instead of denying access entirely:
```yaml
access_policy:
  - group: external_partner
    member_level:
      includes:
        - order_count
    member_masking:
      - member: customer_name
        mask: "'***'"
      - member: email
        mask: "CONCAT(LEFT({CUBE}.email, 2), '***@***.com')"
```

### Multi-Tenancy

Cube provides eight configuration functions for multi-tenancy:

| Function | Purpose |
|----------|---------|
| `context_to_app_id` | Unique ID per tenant for data model compilation and caching |
| `schema_version` | Schema versioning across tenants |
| `repository_factory` | Tenant-specific data model files |
| `driver_factory` | Dynamic database connection selection per tenant |
| `context_to_orchestrator_id` | Isolated query orchestrators per tenant |
| `pre_aggregations_schema` | Partitioned pre-aggregation tables by tenant |
| `query_rewrite` | Row-level security filters per tenant |
| `scheduled_refresh_contexts` | Refresh schedules for multi-tenant environments |

**Multi-database support:** Different tenants can connect to separate Postgres instances, MongoDB, Athena, or BigQuery simultaneously within a single Cube deployment.

### Integration with External Auth (OpenFGA)

Cube does not natively integrate with OpenFGA or other fine-grained authorization systems. However, the `query_rewrite` function and `extend_context` configuration option provide hooks where you can:

1. Call an external authorization service (e.g., OpenFGA) during request processing
2. Enrich the security context with authorization decisions
3. Apply those decisions as filters or member-level restrictions

**NEEDS VERIFICATION:** Whether `extend_context` supports async calls to external services in Cube Core (it does in Cube Cloud via "authentication integration").

---

## 5. Agent Integration Patterns

### How AI Agents Use Cube

An AI agent interacts with Cube through three patterns:

**Pattern 1: REST API + Meta API (Most Common for Self-Hosted)**
1. Agent calls `/v1/meta` to discover available cubes, measures, dimensions
2. Agent constructs a query JSON based on the user's natural language question
3. Agent calls `/v1/load` with the query
4. Agent interprets and presents the results

**Pattern 2: SQL API**
1. Agent connects to Cube via Postgres wire protocol
2. Agent writes Semantic SQL using `MEASURE()` function
3. Results returned as standard SQL result sets
4. Best for agents that already know SQL

**Pattern 3: MCP Server**
1. Agent discovers Cube tools via MCP protocol
2. Agent calls `list_cubes` to understand available data
3. Agent calls `query_cube` with structured parameters
4. Results returned in structured format

### Official MCP Server (@cube-dev/mcp-server)

**Status: CLOUD-ONLY (Premium and Enterprise plans)**

The official Cube MCP server (`@cube-dev/mcp-server` on npm) is designed for Cube Cloud:
- Endpoint: `https://cubecloud.dev/mcp`
- Authentication: OAuth (Authorization Code + PKCE)
- 20 tools exposed including `chat`, `searchDataModel`, `runQuery`, `createWorkbook`, etc.
- Requires Cube Cloud subscription

**This is NOT suitable for our open-source-only mandate.**

### Community MCP Servers (Open Source)

**Option A: zsembek/Cube.js-MCP-server** (MIT License)
- Python-based, uses FastMCP framework
- Two tools: `list_cubes()` and `query_cube()`
- Connects to self-hosted Cube via REST API
- Configuration: `CUBEJS_API_BASE_URL` and `CUBEJS_API_TOKEN`
- Simple but functional

**Option B: isaacwasserman/mcp_cube_server** (GPL-3.0)
- Python-based
- Two tools: `read_data` and `describe_data`
- Connects via REST API
- GPL-3.0 license may be problematic for commercial use

**Option C: Build our own** (Recommended)
- Use Cube's REST API (`/v1/meta` + `/v1/load`) as the backend
- Expose MCP tools: `discover_metrics`, `query_data`, `get_sql`, `list_cubes`
- Full control over tool signatures and response formats
- Can integrate with our platform's auth system

### Programmatic Metric Discovery

The `/v1/meta` endpoint is the key enabler for agent integration:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/cubejs-api/v1/meta
```

Response includes:
- All cube names, titles, descriptions
- All measures with types (count, sum, avg, etc.)
- All dimensions with types (string, number, time, etc.)
- All segments
- Relationships between cubes (connected components)
- Primary keys

This allows an agent to build a complete understanding of the available data model without any prior knowledge.

---

## 6. Open-Source Purity Assessment

### What is Truly Open Source (Apache 2.0 / MIT)

| Component | License | Self-Hosted? |
|-----------|---------|-------------|
| Cube Server (API) | Apache 2.0 | YES |
| Schema Compiler (query compilation) | Apache 2.0 | YES |
| Query Orchestrator (caching, queuing) | Apache 2.0 | YES |
| API Gateway (REST, GraphQL, WebSocket) | Apache 2.0 | YES |
| SQL API (Postgres wire protocol) | Apache 2.0 | YES |
| Cube Store (caching engine, Rust) | Apache 2.0 | YES |
| All 20+ database drivers | Apache 2.0 | YES |
| Pre-aggregation system | Apache 2.0 | YES |
| Security context / JWT auth | Apache 2.0 | YES |
| Multi-tenancy (all 8 functions) | Apache 2.0 | YES |
| Row-level security (query_rewrite) | Apache 2.0 | YES |
| Access policies (access_policy) | Apache 2.0 | YES |
| Member-level security | Apache 2.0 | YES |
| Client SDKs (React, Vue, Angular) | MIT | YES |
| Data model definitions (YAML/JS) | Apache 2.0 | YES |

### What Requires Cube Cloud (PAID)

| Feature | Why Cloud-Only |
|---------|---------------|
| Official MCP Server (@cube-dev/mcp-server) | OAuth endpoint hosted by Cube Cloud |
| Cube Store High Availability / Replication | No node replication in OSS; any node down = cluster outage |
| APM (Application Performance Monitoring) | Custom-built, not available in OSS |
| Auto-scaling | Cloud infrastructure feature |
| SSO (SAML 2.0, LDAP) | Enterprise plan only |
| Audit Logs | Cloud feature |
| SOC 2 / HIPAA compliance | Cloud infrastructure |
| VPC Peering / PrivateLink | Cloud networking |
| Cube D3 AI Agents | Commercial product built on top of Cube Core |
| Dev branches / CI-CD via UI | Cloud workflow feature |
| Data-at-rest encryption (Parquet) | Enterprise plan |

### "Open Core" Traps Assessment

**CRITICAL FINDING: Cube Store HA is cloud-only.**

The open-source version of Cube Store does NOT support replication of any nodes. If any cluster node goes down, it leads to a complete cluster outage. The documentation explicitly states: "If Cube Store replication and high availability are required, please consider using Cube Cloud."

This is the single most significant "open core" concern. For production workloads, this means:
- You must architect around the lack of HA (e.g., fast restart, external monitoring)
- Pre-aggregation data can be rebuilt from source databases if Cube Store fails
- The source database remains accessible even if Cube Store is down
- But queries will be slow during Cube Store recovery

**Mitigation:** Since Cube Store is a cache layer, not a source of truth, the impact of downtime is performance degradation (slower queries), not data loss. Pre-aggregations can always be rebuilt.

**VERDICT: The core semantic layer functionality is genuinely open source. The cloud-only features are operational (HA, monitoring, CI/CD) rather than functional. You can run a full-featured semantic layer with Cube Core alone.**

---

## 7. Self-Hosting Guide

### Deployment Architecture

**Minimum Production Stack:**
```
1x Cube API Instance
1x Cube Refresh Worker
1x Cube Store Router
2x Cube Store Workers
```

### Docker Compose Example

```yaml
version: '3.8'

services:
  cube_api:
    image: cubejs/cube:v1.7.19
    ports:
      - "4000:4000"    # REST/GraphQL API
      - "15432:15432"  # SQL API (Postgres wire)
    environment:
      - CUBEJS_DB_TYPE=postgres
      - CUBEJS_DB_HOST=your-database-host
      - CUBEJS_DB_PORT=5432
      - CUBEJS_DB_NAME=your_database
      - CUBEJS_DB_USER=your_user
      - CUBEJS_DB_PASS=your_password
      - CUBEJS_API_SECRET=your-api-secret-at-least-32-chars
      - CUBEJS_CUBESTORE_HOST=cubestore_router
      - CUBEJS_DEV_MODE=false
      - CUBEJS_TELEMETRY=false
    volumes:
      - ./model:/cube/conf/model
      - ./cube.py:/cube/conf/cube.py
    depends_on:
      - cubestore_router

  cube_refresh:
    image: cubejs/cube:v1.7.19
    environment:
      - CUBEJS_DB_TYPE=postgres
      - CUBEJS_DB_HOST=your-database-host
      - CUBEJS_DB_PORT=5432
      - CUBEJS_DB_NAME=your_database
      - CUBEJS_DB_USER=your_user
      - CUBEJS_DB_PASS=your_password
      - CUBEJS_API_SECRET=your-api-secret-at-least-32-chars
      - CUBEJS_CUBESTORE_HOST=cubestore_router
      - CUBEJS_REFRESH_WORKER=true
      - CUBEJS_DEV_MODE=false
    volumes:
      - ./model:/cube/conf/model
      - ./cube.py:/cube/conf/cube.py
    depends_on:
      - cubestore_router

  cubestore_router:
    image: cubejs/cubestore:v1.7.19
    environment:
      - CUBESTORE_SERVER_NAME=cubestore_router:9999
      - CUBESTORE_META_PORT=9999
      - CUBESTORE_WORKERS=cubestore_worker_1:9001,cubestore_worker_2:9002
      - CUBESTORE_REMOTE_DIR=/cube/data
    volumes:
      - cubestore_data:/cube/data

  cubestore_worker_1:
    image: cubejs/cubestore:v1.7.19
    environment:
      - CUBESTORE_SERVER_NAME=cubestore_worker_1:9001
      - CUBESTORE_WORKER_PORT=9001
      - CUBESTORE_META_ADDR=cubestore_router:9999
      - CUBESTORE_WORKERS=cubestore_worker_1:9001,cubestore_worker_2:9002
      - CUBESTORE_REMOTE_DIR=/cube/data
    volumes:
      - cubestore_data:/cube/data

  cubestore_worker_2:
    image: cubejs/cubestore:v1.7.19
    environment:
      - CUBESTORE_SERVER_NAME=cubestore_worker_2:9002
      - CUBESTORE_WORKER_PORT=9002
      - CUBESTORE_META_ADDR=cubestore_router:9999
      - CUBESTORE_WORKERS=cubestore_worker_1:9001,cubestore_worker_2:9002
      - CUBESTORE_REMOTE_DIR=/cube/data
    volumes:
      - cubestore_data:/cube/data

volumes:
  cubestore_data:
```

### Resource Requirements

| Component | Min RAM | Min CPU | Notes |
|-----------|---------|---------|-------|
| Cube API Instance | 3 GB | 2 cores | Can serve 1-10 req/s depending on model size |
| Cube Refresh Worker | 3 GB | 2 cores | Same image, different mode |
| Cube Store Router | 6 GB | 4 cores | Handles metadata and query distribution |
| Cube Store Worker | 8 GB | 4 cores | At least 2 workers recommended |

**Total minimum for production:** ~28 GB RAM, 14 CPU cores

### Scaling

**Horizontal scaling options:**
- Multiple Cube API instances behind a load balancer
- Multiple Cube Refresh Workers (for parallel pre-aggregation builds)
- Multiple Cube Store Workers (for query parallelism)
- Cube Store Router is a single point (no replication in OSS)

**Pre-aggregation storage:**
- For multi-machine: Use S3/GCS/Azure Blob as `CUBESTORE_REMOTE_DIR`
- Workers use local SSD as scratch storage for query performance
- Set `CUBESTORE_DATA_DIR` for local scratch path

### Production Checklist

- [ ] Disable `CUBEJS_DEV_MODE` (set to `false`)
- [ ] Set a strong `CUBEJS_API_SECRET` (32+ characters)
- [ ] Deploy dedicated Refresh Worker instance
- [ ] Configure Cube Store with at least 2 workers
- [ ] Set up health checks (`/readyz`, `/livez`)
- [ ] Put NGINX/Traefik reverse proxy in front
- [ ] Configure JWT authentication (JWKS preferred)
- [ ] Network-isolate Cube Store (no external port exposure)
- [ ] Set `CUBEJS_TELEMETRY=false` if desired
- [ ] Use specific version tags, not `:latest`
- [ ] Monitor Cube Store disk usage (pre-aggregations grow)
- [ ] Set up external monitoring (Prometheus + Grafana recommended)

---

## 8. Code Examples

### Semantic Model Definition

**File: `model/cubes/orders.yml`**
```yaml
cubes:
  - name: orders
    sql_table: public.orders

    measures:
      - name: count
        type: count

      - name: total_amount
        sql: amount
        type: sum

      - name: average_order_value
        sql: amount
        type: avg

      - name: unique_customers
        sql: customer_id
        type: count_distinct

      - name: total_amount_shipped
        sql: amount
        type: sum
        filters:
          - sql: "{CUBE}.status = 'shipped'"

      - name: completion_rate
        sql: "1.0 * {total_amount_shipped} / NULLIF({total_amount}, 0)"
        type: number

    dimensions:
      - name: id
        sql: id
        type: number
        primary_key: true

      - name: status
        sql: status
        type: string

      - name: created_at
        sql: created_at
        type: time

      - name: amount
        sql: amount
        type: number

    segments:
      - name: shipped_orders
        sql: "{CUBE}.status = 'shipped'"

    joins:
      - name: customers
        relationship: many_to_one
        sql: "{CUBE}.customer_id = {customers.id}"

      - name: line_items
        relationship: one_to_many
        sql: "{CUBE}.id = {line_items.order_id}"

    pre_aggregations:
      - name: orders_by_status_daily
        type: rollup
        measures:
          - count
          - total_amount
        dimensions:
          - status
        time_dimension: created_at
        granularity: day
        partition_granularity: month
        refresh_key:
          every: 1 hour
        build_range_start:
          sql: "SELECT DATE_SUB(NOW(), INTERVAL 1 YEAR)"
        build_range_end:
          sql: "SELECT NOW()"
```

**File: `model/cubes/customers.yml`**
```yaml
cubes:
  - name: customers
    sql_table: public.customers

    measures:
      - name: count
        type: count

    dimensions:
      - name: id
        sql: id
        type: number
        primary_key: true

      - name: name
        sql: name
        type: string

      - name: email
        sql: email
        type: string

      - name: city
        sql: city
        type: string

      - name: state
        sql: state
        type: string

      - name: tenant_id
        sql: tenant_id
        type: string
```

### Views (Consumer-Facing Facade)

**File: `model/views/orders_view.yml`**
```yaml
views:
  - name: orders_overview
    description: "Consolidated view of orders with customer information"

    cubes:
      - join_path: orders
        includes:
          - count
          - total_amount
          - average_order_value
          - status
          - created_at

      - join_path: orders.customers
        prefix: true
        includes:
          - name
          - city
          - state
        excludes:
          - email
```

### Security Context Configuration

**File: `cube.py`**
```python
from cube import config

@config('query_rewrite')
def query_rewrite(query: dict, ctx: dict) -> dict:
    # Enforce tenant isolation
    tenant_id = ctx['securityContext'].get('tenantId')
    if tenant_id:
        query.setdefault('filters', []).append({
            'member': 'orders.tenant_id',
            'operator': 'equals',
            'values': [tenant_id]
        })
    return query

@config('context_to_app_id')
def context_to_app_id(ctx: dict) -> str:
    # Separate compiled models per tenant
    return f"CUBEJS_APP_{ctx['securityContext'].get('tenantId', 'default')}"

@config('scheduled_refresh_contexts')
def scheduled_refresh_contexts() -> list:
    # Return list of tenant contexts for background refresh
    return [
        {'securityContext': {'tenantId': 'tenant_1'}},
        {'securityContext': {'tenantId': 'tenant_2'}},
    ]
```

### Declarative Access Policies

**File: `model/cubes/orders_with_policies.yml`**
```yaml
cubes:
  - name: orders
    sql_table: public.orders

    access_policy:
      # Admins see everything
      - group: admin
        member_level:
          includes: "*"

      # Managers see all columns but rows filtered by region
      - group: manager
        row_level:
          filters:
            - member: region
              operator: equals
              values: ["{ securityContext.region }"]

      # Viewers see limited columns and filtered rows
      - group: viewer
        member_level:
          includes:
            - count
            - status
            - created_at
          excludes:
            - profit_margin
            - internal_notes
        row_level:
          filters:
            - member: tenant_id
              operator: equals
              values: ["{ securityContext.tenantId }"]

    measures:
      - name: count
        type: count
      - name: profit_margin
        sql: profit_margin
        type: avg

    dimensions:
      - name: id
        sql: id
        type: number
        primary_key: true
      - name: status
        sql: status
        type: string
      - name: region
        sql: region
        type: string
      - name: tenant_id
        sql: tenant_id
        type: string
      - name: internal_notes
        sql: internal_notes
        type: string
      - name: created_at
        sql: created_at
        type: time
```

### Generating a JWT for API Access

```javascript
const jwt = require('jsonwebtoken');

const CUBEJS_API_SECRET = 'your-api-secret-at-least-32-chars';

const token = jwt.sign(
  {
    tenantId: 'tenant_123',
    userId: 'user_456',
    role: 'manager',
    region: 'us-west',
    // Cube reads these from securityContext
  },
  CUBEJS_API_SECRET,
  { expiresIn: '1h' }
);

// Use: Authorization: Bearer <token>
```

### Agent Integration Example (Python)

```python
import requests
import json

CUBE_API_URL = "http://localhost:4000/cubejs-api"
CUBE_API_TOKEN = "your-jwt-token"

headers = {
    "Authorization": f"Bearer {CUBE_API_TOKEN}",
    "Content-Type": "application/json"
}

# Step 1: Discover available metrics
meta = requests.get(f"{CUBE_API_URL}/v1/meta", headers=headers).json()

for cube in meta.get("cubes", []):
    print(f"Cube: {cube['name']}")
    for measure in cube.get("measures", []):
        print(f"  Measure: {measure['name']} ({measure['type']})")
    for dimension in cube.get("dimensions", []):
        print(f"  Dimension: {dimension['name']} ({dimension['type']})")

# Step 2: Execute a query
query = {
    "measures": ["orders.count", "orders.total_amount"],
    "dimensions": ["orders.status"],
    "timeDimensions": [{
        "dimension": "orders.created_at",
        "dateRange": "Last 30 days",
        "granularity": "week"
    }]
}

response = requests.post(
    f"{CUBE_API_URL}/v1/load",
    headers=headers,
    json={"query": query}
)

data = response.json()
print(json.dumps(data, indent=2))
```

---

## 9. Comparison with Alternatives

### Cube vs dbt Semantic Layer

| Aspect | Cube Core | dbt Semantic Layer |
|--------|-----------|-------------------|
| **License** | Apache 2.0 (fully OSS) | MetricFlow: Apache 2.0; Semantic Layer API: requires dbt Cloud |
| **Self-hosted API** | YES - REST, GraphQL, SQL | MetricFlow local only; API gateway requires dbt Cloud |
| **Pre-aggregations** | Built-in (Cube Store) | No caching layer; relies on warehouse |
| **Multi-tenancy** | Built-in (8 config functions) | Not built-in |
| **Security** | Row-level, member-level, masking | Basic; relies on warehouse RLS |
| **Databases** | 30+ drivers | dbt-supported adapters |
| **AI/Agent integration** | REST + Meta API + SQL API | Semantic Layer API (Cloud) or MetricFlow CLI |
| **Model definition** | YAML / JavaScript / Python | YAML (MetricFlow syntax) |
| **Real-time** | WebSocket subscriptions | No |
| **Architecture** | Standalone service | Part of dbt project |

**Verdict:** For an open-source AI platform, Cube wins decisively. dbt's Semantic Layer API is cloud-only, while Cube provides full API access self-hosted.

### Cube vs Rill

| Aspect | Cube Core | Rill |
|--------|-----------|------|
| **License** | Apache 2.0 | Apache 2.0 |
| **Focus** | Headless semantic layer | BI dashboard + semantic layer |
| **API-first** | YES (core design) | Dashboard-first, API secondary |
| **Pre-aggregations** | Built-in (Cube Store) | Uses DuckDB for local OLAP |
| **Multi-tenancy** | Built-in | Limited |
| **MCP Server** | Community options | Not available (NEEDS VERIFICATION) |
| **Maturity** | 20K+ stars, 5+ years | ~5K stars, newer |

**Verdict:** Cube is better for headless/API-first use. Rill is better if you want built-in dashboards.

### Cube vs MetriQL

| Aspect | Cube Core | MetriQL |
|--------|-----------|---------|
| **License** | Apache 2.0 | Apache 2.0 |
| **Status** | Active, well-funded | Largely inactive / archived |
| **Features** | Full semantic layer | Lightweight metric definitions |
| **Caching** | Cube Store | None built-in |
| **Community** | 20K+ stars | Small |

**Verdict:** MetriQL is essentially defunct. Not a viable alternative.

### Cube vs Lightdash

| Aspect | Cube Core | Lightdash |
|--------|-----------|-----------|
| **License** | Apache 2.0 | MIT |
| **Focus** | Headless semantic layer | dbt-native BI tool |
| **API-first** | YES | Dashboard-first |
| **dbt integration** | Can import dbt models | Core design principle |
| **Pre-aggregations** | Built-in | None |

**Verdict:** Lightdash is a BI tool, not a semantic layer. Different category.

---

## 10. RECOMMENDATION

### Verdict: ADOPT (as core semantic layer component)

### Reasoning

**Why ADOPT (not just "wrap" or "inspire-only"):**

1. **Genuinely Open Source:** The entire core is Apache 2.0. No "open core" traps for functional features. Cloud-only features are operational (HA, monitoring, SSO) not functional.

2. **API-First Design:** Cube is headless by design. REST, GraphQL, and SQL APIs are first-class citizens, not afterthoughts. This aligns perfectly with an AI platform architecture.

3. **Agent-Ready:** The `/v1/meta` endpoint enables programmatic metric discovery. Agents can understand the entire data model without prior knowledge. The SQL API (Postgres wire protocol) means any tool that speaks Postgres works out of the box.

4. **Multi-Tenancy Built-In:** Eight configuration functions for multi-tenancy, row-level security via `access_policy` and `query_rewrite`, member-level security, masking -- all available in the open-source version.

5. **Performance:** Cube Store (Apache 2.0, Rust-based) provides sub-second query latency via pre-aggregations. This is critical for agent-driven analytics where latency matters.

6. **Database Breadth:** 30+ supported databases including Postgres, BigQuery, Snowflake, ClickHouse, DuckDB, and many more.

7. **Active Project:** v1.7.19 released August 12, 2026. Releases every 1-3 days. 20K+ stars. Funded company maintaining it.

8. **No Redis Required:** Cube Store replaced Redis for cache/queue coordination, simplifying the deployment stack.

### Specific Integration Plan

```
Platform Architecture with Cube:

  User / AI Agent
       |
  Platform API Layer
       |
  +----+----+
  |         |
  |    Cube MCP Server (custom, open source)
  |         |
  |    Cube Core (self-hosted)
  |    - Semantic model definitions (YAML, git-managed)
  |    - REST API for queries
  |    - SQL API for advanced agent queries
  |    - Meta API for metric discovery
  |    - Security context from platform JWT
  |         |
  |    Cube Store (pre-aggregation cache)
  |         |
  +----+----+
       |
  Source Databases (Postgres, BigQuery, etc.)
```

### What to Build on Top

1. **Custom MCP Server:** Build a lightweight MCP server that wraps Cube's REST API. The community options (zsembek, isaacwasserman) are too simple. Our MCP server should:
   - Expose `discover_metrics` (wraps `/v1/meta`)
   - Expose `query_data` (wraps `/v1/load`)
   - Expose `explain_query` (wraps `/v1/sql` to show generated SQL)
   - Pass platform JWT through to Cube for security context
   - Handle error formatting for agent consumption

2. **Semantic Model CI/CD:** Cube models are YAML files in git. Build a CI pipeline that:
   - Validates model changes
   - Tests pre-aggregation definitions
   - Deploys to Cube instances on merge

3. **Tenant Provisioning:** Automate the `context_to_app_id` and `driver_factory` configuration for dynamic tenant onboarding.

### Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cube Store HA is cloud-only | Medium | Cube Store is a cache; source DB remains accessible. Implement fast-restart monitoring. Pre-aggregations can be rebuilt. |
| Official MCP server is cloud-only | Low | Build custom MCP server wrapping REST API. Community examples exist. |
| Cube company pivots to more closed model | Low | Current Apache 2.0 license is irrevocable. Fork is always possible. Active community provides insurance. |
| Resource requirements (~28GB RAM minimum) | Medium | Start with single-machine Docker Compose. Scale Cube Store workers as needed. |
| Query compiler complexity | Low | Well-documented, actively maintained. Large community for support. |

### Final Assessment

Cube Core is the strongest open-source semantic layer available in 2026. It is the only option that provides:
- Full API surface (REST + GraphQL + SQL) self-hosted
- Built-in caching engine (Cube Store) under Apache 2.0
- Multi-tenancy and fine-grained security out of the box
- Active development with releases every 1-3 days
- No functional features gated behind a paid tier

**For the Allotey AI Platform, Cube Core should be adopted as the semantic layer. Build a custom MCP server on top of it, manage semantic models as code in git, and deploy via Docker Compose or Kubernetes.**

---

## Sources

- [Cube GitHub Repository](https://github.com/cube-js/cube)
- [Cube Documentation](https://docs.cube.dev/docs/introduction)
- [Cube Core Product Page](https://cube.dev/product/cube-core)
- [Cube Blog: Cube Cloud or Cube Core](https://cube.dev/blog/building-your-data-stack-cube-cloud-or-oss)
- [Cube MCP Server Documentation](https://docs.cube.dev/docs/integrations/mcp-server)
- [Cube Data Sources](https://docs.cube.dev/admin/connect-to-data/data-sources)
- [Cube Multitenancy Documentation](https://docs.cube.dev/embedding/multitenancy)
- [Cube Security Context](https://docs.cube.dev/docs/data-modeling/access-control/context)
- [Cube Row-Level Security](https://docs.cube.dev/docs/data-modeling/access-control/row-level-security)
- [Cube Access Policies Reference](https://docs.cube.dev/reference/data-modeling/data-access-policies)
- [Cube Pre-aggregations Reference](https://cube.dev/docs/product/data-modeling/reference/pre-aggregations)
- [Cube Joins Reference](https://docs.cube.dev/reference/data-modeling/joins)
- [Cube Views Reference](https://docs.cube.dev/reference/data-modeling/view)
- [Cube REST API Reference](https://docs.cube.dev/reference/core-data-apis/rest-api)
- [Cube GraphQL API](https://docs.cube.dev/reference/core-data-apis/graphql-api)
- [Cube SQL API](https://cube.dev/docs/product/apis-integrations/core-data-apis/sql-api)
- [Cube Docker Deployment](https://docs.cube.dev/admin/deployment/core)
- [Cube Store Running in Production](https://docs.cube.dev/cube-core/running-in-production)
- [Replacing Redis with Cube Store](https://cube.dev/blog/replacing-redis-with-cube-store)
- [Cube Blog: MCP for AI Data Access](https://cube.dev/blog/unlocking-universal-data-access-for-ai-with-anthropics-model-context)
- [zsembek Cube.js MCP Server](https://github.com/zsembek/Cube.js-MCP-server)
- [isaacwasserman MCP Cube Server](https://github.com/isaacwasserman/mcp_cube_server)
- [CubeStore Architecture - DeepWiki](https://deepwiki.com/cube-js/cube/3.1-cubestore-architecture)
- [Cube.dev Review: Semantic Layer in 2026](https://dataresearchanalysiscollection.com/cube-dev-review-semantic-layer/)
- [dbt Semantic Layer vs Cube Comparison](https://unwinddata.com/dbt-semantic-layer-vs-cube)
- [Best Semantic Layer Tools 2026](https://www.knowi.com/blog/semantic-layer-tools/)
- [Semantic Layer Tools Comparison 2026](https://www.stackfyi.com/guides/semantic-layer-tools-dbt-cube-metricflow-lightdash-2026)
- [Cube Pricing Analysis](https://colrows.com/blogs/cube-pricing/)
- [Cube Changelog](https://cube.dev/changelog)
- [@cube-dev/mcp-server on npm](https://socket.dev/npm/package/@cube-dev/mcp-server)
