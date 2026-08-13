# Runtime Dependency Matrix

**Status:** IN RESEARCH
**Last Updated:** 2026-08-13
**Owner:** Platform Architecture Team

> **WARNING:** The previous claim of "only 2 new services" was misleading. This matrix documents the true operational footprint of the candidate V1 architecture. Every adoption decision has infrastructure cost. The statement "Total new services for V1: 2 (PostgreSQL + Temporal)" omitted the transitive infrastructure dependencies of Temporal itself (which requires its own persistence store, optionally Elasticsearch, and runs four internal service roles), Langfuse (which requires PostgreSQL, ClickHouse, Redis/Valkey, and S3-compatible blob storage), LiteLLM (which requires PostgreSQL and optionally Redis), OpenFGA (which requires PostgreSQL), and Cube (which runs its own internal store). The actual minimum container count for a development environment exceeds 15 distinct processes.

---

## Table of Contents

1. [Component Dependency Matrix](#component-dependency-matrix)
2. [Deployment Topology Estimates](#deployment-topology-estimates)
3. [Dependency Graph Summary](#dependency-graph-summary)
4. [Cost and Complexity Assessment](#cost-and-complexity-assessment)
5. [Sources](#sources)

---

## Component Dependency Matrix

### 1. Platform API (Custom)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (monolithic) or 2-3 (API + background workers + scheduler) |
| **Database Dependencies** | PostgreSQL (primary data store, shared instance) |
| **Cache Dependencies** | Redis/Valkey (session cache, rate limiting, pub/sub) |
| **Blob/Object Storage** | S3-compatible (uploaded assets, generated reports) |
| **Minimum CPU/RAM (Dev)** | 0.5 vCPU / 512 MB RAM |
| **Minimum CPU/RAM (Prod)** | 2 vCPU / 2 GB RAM per replica |
| **Ports** | 8000 (HTTP API), 8001 (internal/admin) |
| **Persistent Volumes** | None (stateless; state in PostgreSQL + object storage) |
| **HA Requirements** | 2+ replicas behind load balancer; health check endpoints |
| **Backup Requirements** | N/A (stateless; depends on PostgreSQL and object storage backups) |
| **Upgrade/Migration Complexity** | LOW -- standard rolling deployment; database migrations via versioned scripts |
| **Monitoring Requirements** | HTTP request latency/error rate, connection pool utilization, queue depth |
| **Operator Burden** | LOW -- team-owned code, well-understood deployment patterns |

---

### 2. Agno (Agent Runtime)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (embedded in Platform API) or 1-2 (standalone agent service + optional tool executor) |
| **Database Dependencies** | PostgreSQL (agent state persistence, session storage via `agno` storage backends) |
| **Cache Dependencies** | Redis/Valkey (optional: session caching, memory caching) |
| **Blob/Object Storage** | S3-compatible (agent artifacts, knowledge base documents) |
| **Minimum CPU/RAM (Dev)** | 0.5 vCPU / 512 MB RAM |
| **Minimum CPU/RAM (Prod)** | 2 vCPU / 4 GB RAM (CPU-bound during tool execution; memory scales with concurrent agents) |
| **Ports** | Embedded: shares Platform API port; Standalone: 8100 (gRPC/HTTP) |
| **Persistent Volumes** | None (stateless runtime; persistence delegated to PostgreSQL) |
| **HA Requirements** | Horizontal scaling; agent sessions are stateless if using external storage |
| **Backup Requirements** | N/A (state in PostgreSQL) |
| **Upgrade/Migration Complexity** | LOW-MEDIUM -- Python library updates; agent definition changes may require migration scripts |
| **Monitoring Requirements** | Agent execution latency, tool call success/failure rates, token consumption per agent, concurrent session count |
| **Operator Burden** | LOW-MEDIUM -- library dependency; version pinning required; breaking API changes between major versions possible |

---

### 3. LangGraph (Secondary Agent Runtime, if retained)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (embedded in Platform API or agent service) |
| **Database Dependencies** | PostgreSQL (checkpoint persistence via `langgraph-checkpoint-postgres`) |
| **Cache Dependencies** | None required (optional Redis for checkpoint caching) |
| **Blob/Object Storage** | None required |
| **Minimum CPU/RAM (Dev)** | 0.25 vCPU / 256 MB RAM (library, not standalone service) |
| **Minimum CPU/RAM (Prod)** | Included in host process resources |
| **Ports** | None (embedded library) |
| **Persistent Volumes** | None |
| **HA Requirements** | Inherited from host process |
| **Backup Requirements** | N/A (checkpoint data in PostgreSQL) |
| **Upgrade/Migration Complexity** | LOW -- Python library; checkpoint schema migrations may be needed |
| **Monitoring Requirements** | Graph execution traces, node transition latencies, error rates per node |
| **Operator Burden** | LOW -- library dependency only; no separate process to manage |

**Decision Note:** If retained only as a secondary runtime, LangGraph adds minimal infrastructure cost (it is a library, not a service). The complexity cost is in maintaining two agent runtime abstractions, not in infrastructure.

---

### 4. Temporal (Workflow Orchestration Server + Workers)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | **Minimum 3 containers:** Temporal Server (runs 4 internal roles: Frontend, History, Matching, Worker), Temporal Web UI, Temporal Admin Tools. **Production: 6+ containers** (each role as separate container + UI + admin). **Plus:** application-specific worker containers (1+ per workflow type). |
| **Database Dependencies** | PostgreSQL 12+ **dedicated instance or schema** (workflow state, history, visibility). Temporal maintains its own schema -- this is NOT the application PostgreSQL. Alternatively: MySQL 8.0+ or Apache Cassandra 3.11+. |
| **Cache Dependencies** | None built-in (Temporal manages its own internal caching) |
| **Blob/Object Storage** | None required |
| **Minimum CPU/RAM (Dev)** | Temporal Server (all-in-one): 2 vCPU / 4 GB RAM; PostgreSQL for Temporal: 1 vCPU / 2 GB RAM; UI: 0.25 vCPU / 256 MB RAM |
| **Minimum CPU/RAM (Prod)** | Frontend: 2 vCPU / 4 GB RAM per replica; History: 2 vCPU / 4 GB RAM per replica; Matching: 1 vCPU / 2 GB RAM per replica; Worker (internal): 1 vCPU / 2 GB RAM; PostgreSQL: 4 vCPU / 8 GB RAM; Application workers: 1-2 vCPU / 2-4 GB RAM each |
| **Ports** | 7233 (gRPC Frontend), 7234 (History), 7235 (Matching), 7239 (Worker), 8080 (Web UI), 7236 (Admin) |
| **Persistent Volumes** | PostgreSQL data volume (workflow history grows unbounded without archival configuration) |
| **HA Requirements** | 3+ Frontend replicas, 3+ History replicas, 2+ Matching replicas; PostgreSQL with replication; membership ring via database |
| **Backup Requirements** | **CRITICAL:** PostgreSQL backing Temporal must be backed up; workflow history is the system of record for all in-flight and completed workflows. Archival to S3 recommended for completed workflows. |
| **Upgrade/Migration Complexity** | **HIGH** -- Temporal schema migrations must be run with `temporal-sql-tool`; version upgrades require careful sequencing (database schema first, then server binaries); rolling upgrades supported but require operational expertise |
| **Monitoring Requirements** | Workflow completion rate, schedule-to-start latency, workflow task queue depth, history service shard utilization, persistence latency, dead letter queue monitoring |
| **Operator Burden** | **HIGH** -- Temporal is effectively a distributed database system. Requires understanding of: namespace management, task queue routing, retention policies, archival configuration, schema versioning, cluster membership, and capacity planning. The Temporal team recommends dedicated operational expertise for production deployments. |

**Critical Note:** Temporal is NOT "1 new service." At minimum it is 3 containers (server + PostgreSQL + UI) in development and 8-12 containers in production HA. It also requires its own PostgreSQL instance or at minimum a dedicated database/schema with its own migration lifecycle.

---

### 5. LiteLLM (Proxy Mode)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (monolithic proxy) or 3 (gateway + backend + UI in microservice mode) |
| **Database Dependencies** | PostgreSQL (virtual keys, cost tracking, team/org management, usage logs) |
| **Cache Dependencies** | Redis/Valkey (optional but recommended: response caching, rate limiting, routing cache) |
| **Blob/Object Storage** | None required (logs stored in PostgreSQL) |
| **Minimum CPU/RAM (Dev)** | 0.5 vCPU / 512 MB RAM |
| **Minimum CPU/RAM (Prod)** | 1 vCPU / 1 GB RAM per replica (CPU-light; mostly I/O bound proxying to upstream LLM APIs) |
| **Ports** | 4000 (HTTP proxy API), 4001 (Admin UI, if enabled) |
| **Persistent Volumes** | None (stateless; config via YAML or environment variables) |
| **HA Requirements** | 2+ replicas behind load balancer; PostgreSQL for state consistency; Redis for distributed rate limiting |
| **Backup Requirements** | PostgreSQL tables (usage data, virtual keys, budgets); config YAML in version control |
| **Upgrade/Migration Complexity** | LOW-MEDIUM -- Docker image update; database migrations run automatically on startup; config format occasionally changes between versions |
| **Monitoring Requirements** | Proxy request latency, upstream LLM error rates, token usage per model/key/team, budget consumption alerts, rate limit hit rates |
| **Operator Burden** | LOW-MEDIUM -- straightforward proxy; main burden is model routing configuration and key rotation |

---

### 6. OpenFGA (Authorization Engine)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (single Go binary) |
| **Database Dependencies** | PostgreSQL 14+ (authorization tuples, authorization model definitions). Can share PostgreSQL instance with dedicated schema. |
| **Cache Dependencies** | None required (OpenFGA has built-in in-process caching; optional external cache for check resolution) |
| **Blob/Object Storage** | None required |
| **Minimum CPU/RAM (Dev)** | 0.25 vCPU / 256 MB RAM |
| **Minimum CPU/RAM (Prod)** | 1 vCPU / 1 GB RAM per replica |
| **Ports** | 8080 (HTTP API), 8081 (gRPC API), 3000 (Playground UI, dev only) |
| **Persistent Volumes** | None (stateless; state in PostgreSQL) |
| **HA Requirements** | 2+ replicas; stateless so horizontal scaling is straightforward; PostgreSQL must be HA |
| **Backup Requirements** | PostgreSQL tables (authorization models and relationship tuples are critical security data) |
| **Upgrade/Migration Complexity** | LOW -- single binary; database schema migrations included in release; model DSL versioning is well-defined |
| **Monitoring Requirements** | Check request latency (p50/p95/p99), tuple write throughput, authorization model version, database connection pool utilization |
| **Operator Burden** | LOW -- lightweight single binary; main complexity is in authorization model design (which is application logic, not infrastructure) |

---

### 7. Cube (Semantic Layer)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 2 (Cube API + Cube Store) |
| **Database Dependencies** | Connects to upstream data sources (PostgreSQL, BigQuery, etc.) as a query engine; does NOT require its own persistence database |
| **Cache Dependencies** | Cube Store (built-in distributed pre-aggregation storage -- this IS a separate process/container) |
| **Blob/Object Storage** | None required (Cube Store handles pre-aggregation persistence locally) |
| **Minimum CPU/RAM (Dev)** | Cube API: 0.5 vCPU / 512 MB RAM; Cube Store: 0.5 vCPU / 512 MB RAM |
| **Minimum CPU/RAM (Prod)** | Cube API: 2 vCPU / 2 GB RAM per replica; Cube Store: 2 vCPU / 4 GB RAM (scales with pre-aggregation size) |
| **Ports** | 4000 (HTTP/REST API), 15432 (SQL/PostgreSQL-compatible endpoint), 3030 (Cube Store) |
| **Persistent Volumes** | Cube Store data directory (pre-aggregated data; can be rebuilt but rebuilds are expensive) |
| **HA Requirements** | Cube API: 2+ replicas (stateless); Cube Store: single instance or clustered (router + workers) for HA |
| **Backup Requirements** | Low priority -- pre-aggregations can be rebuilt from upstream sources; data model files should be in version control |
| **Upgrade/Migration Complexity** | LOW-MEDIUM -- data model schema changes may require pre-aggregation rebuilds; Docker image updates are straightforward |
| **Monitoring Requirements** | Query execution time, pre-aggregation build status/duration, cache hit ratio, Cube Store disk usage, upstream query volume |
| **Operator Burden** | MEDIUM -- data modeling requires semantic layer expertise; pre-aggregation tuning is iterative; Cube Store capacity planning needed |

---

### 8. Langfuse (LLM Observability Platform)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | **Minimum 6 containers:** Langfuse Web (UI + API), Langfuse Async Worker, PostgreSQL, ClickHouse, Redis/Valkey, MinIO/S3 (blob storage). In production: each can have multiple replicas. |
| **Database Dependencies** | **PostgreSQL** (transactional data: users, organizations, projects, datasets, API keys); **ClickHouse** (OLAP: traces, observations, scores, spans -- see Component 9) |
| **Cache Dependencies** | **Redis/Valkey** (REQUIRED: job queue for async ingestion, caching, pub/sub) |
| **Blob/Object Storage** | **REQUIRED:** S3-compatible storage (MinIO for self-hosted) -- persists all incoming events, multi-modal trace data (images, audio), large exports |
| **Minimum CPU/RAM (Dev)** | Total stack: 4 vCPU / 8 GB RAM (Web: 0.5 vCPU / 1 GB; Worker: 0.5 vCPU / 1 GB; ClickHouse: 1 vCPU / 2 GB; PostgreSQL: 0.5 vCPU / 1 GB; Redis: 0.25 vCPU / 512 MB; MinIO: 0.25 vCPU / 512 MB) |
| **Minimum CPU/RAM (Prod)** | Web: 2 vCPU / 4 GB RAM; Worker: 2 vCPU / 4 GB RAM; ClickHouse: 4 vCPU / 16 GB RAM; PostgreSQL: 2 vCPU / 4 GB RAM; Redis: 1 vCPU / 2 GB RAM; MinIO/S3: managed service recommended |
| **Ports** | 3000 (Web UI + API), 8123 (ClickHouse HTTP), 9000 (ClickHouse native), 6379 (Redis), 9000/9001 (MinIO API/Console) |
| **Persistent Volumes** | ClickHouse data (traces -- grows continuously and can become very large), PostgreSQL data, MinIO/S3 data (event payloads, multi-modal data), Redis (optional AOF/RDB for queue durability) |
| **HA Requirements** | Web: 2+ replicas; Worker: 2+ replicas; ClickHouse: clustered with replication (ZooKeeper/ClickHouse Keeper); PostgreSQL: primary + replica; Redis: Sentinel or cluster mode |
| **Backup Requirements** | **CRITICAL:** PostgreSQL (user/org data, API keys); ClickHouse (trace data -- large volume, consider tiered retention); S3/MinIO (event payloads); Redis (ephemeral, but queue loss means dropped traces during recovery) |
| **Upgrade/Migration Complexity** | **HIGH** -- Langfuse v2 to v3 was a major architecture change (added ClickHouse, Redis, S3 requirements). Future major versions may similarly restructure. ClickHouse schema migrations, PostgreSQL schema migrations, and application migrations must all be coordinated. All infrastructure components must run with timezone set to UTC. |
| **Monitoring Requirements** | Ingestion throughput, async worker queue depth, ClickHouse query latency, ClickHouse disk usage growth rate, PostgreSQL connection pool, Redis memory usage, S3 storage consumption, trace processing latency |
| **Operator Burden** | **HIGH** -- Langfuse self-hosted is effectively a **5-component distributed system**. ClickHouse operational expertise is required (merges, partitioning, replication). Redis queue monitoring is essential to prevent trace loss. Storage growth must be actively managed. Version upgrades require coordinated multi-component migrations. |

**Critical Note:** Langfuse alone accounts for 6 containers in development. It is NOT "just an observability tool you add" -- it is a platform with its own substantial infrastructure footprint.

---

### 9. ClickHouse (Required by Langfuse)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (single node dev) or 3+ (clustered production with ClickHouse Keeper/ZooKeeper) |
| **Database Dependencies** | None (ClickHouse IS the database) |
| **Cache Dependencies** | None (built-in page cache and mark cache) |
| **Blob/Object Storage** | Optional (S3-backed MergeTree for cold storage tiering) |
| **Minimum CPU/RAM (Dev)** | 1 vCPU / 2 GB RAM |
| **Minimum CPU/RAM (Prod)** | 4 vCPU / 16 GB RAM per node (ClickHouse is memory-intensive for analytical queries; Langfuse recommends ClickHouse >= 25.12 for required features) |
| **Ports** | 8123 (HTTP interface), 9000 (native TCP), 9009 (inter-server replication) |
| **Persistent Volumes** | **REQUIRED:** Data directory (trace/observation data grows continuously; plan for 50-500 GB+ depending on trace volume) |
| **HA Requirements** | 3-node cluster with ClickHouse Keeper (3 Keeper nodes); ReplicatedMergeTree engine for data redundancy |
| **Backup Requirements** | **IMPORTANT:** Contains all trace and observation data. Backup via `clickhouse-backup` tool or filesystem snapshots. Consider TTL-based data retention to manage growth. |
| **Upgrade/Migration Complexity** | **MEDIUM-HIGH** -- ClickHouse version upgrades are generally backward-compatible but require testing; Langfuse mandates specific minimum versions (currently >= 25.12); schema changes require ALTER TABLE on potentially large tables |
| **Monitoring Requirements** | Merge status, parts count per partition, query execution time, memory usage, disk I/O, replication lag (if clustered), insert throughput |
| **Operator Burden** | **HIGH** -- ClickHouse is a specialized OLAP database requiring domain expertise for: partition design, TTL policies, merge management, memory tuning (max_memory_usage, max_bytes_before_external_sort), and monitoring of MergeTree part proliferation |

**Note:** This component exists solely because Langfuse v3+ requires it. If Langfuse were replaced with a simpler observability solution, ClickHouse would be eliminated.

---

### 10. PostgreSQL (Unified Data Store + Extensions)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (single instance, multiple databases/schemas) or 2-3 (primary + read replicas in production) |
| **Database Dependencies** | N/A (PostgreSQL IS the database) |
| **Cache Dependencies** | Built-in shared_buffers; external connection pooler (PgBouncer) recommended for production |
| **Blob/Object Storage** | None (but pg_dump backups should go to object storage) |
| **Minimum CPU/RAM (Dev)** | 1 vCPU / 1 GB RAM |
| **Minimum CPU/RAM (Prod)** | 4 vCPU / 16 GB RAM (serving multiple tenants: Platform API, Temporal, LiteLLM, OpenFGA, Langfuse, Agno) |
| **Ports** | 5432 (PostgreSQL wire protocol) |
| **Persistent Volumes** | **REQUIRED:** Data directory; WAL archive directory (for PITR). Size depends on all tenant schemas combined. |
| **HA Requirements** | Primary + synchronous standby (minimum); Patroni or similar for automated failover; PgBouncer for connection pooling |
| **Backup Requirements** | **CRITICAL:** Single most important backup target. Contains application data, authorization tuples, LLM proxy configuration, agent state, and (optionally) Temporal workflow state. Continuous WAL archiving + periodic base backups. RTO/RPO must be defined. |
| **Upgrade/Migration Complexity** | **MEDIUM** -- Major version upgrades require `pg_upgrade` or logical replication cutover; must coordinate with ALL tenant schemas (Platform API, Temporal, OpenFGA, LiteLLM, Langfuse, Agno) |
| **Monitoring Requirements** | Connection count vs. max_connections, replication lag, transaction rate, slow query log, table bloat, vacuum status, disk usage per schema, lock contention |
| **Operator Burden** | **MEDIUM-HIGH** -- PostgreSQL itself is well-understood, but serving as the unified data store for 6+ components means: connection pool contention, coordinated backup windows, complex major version upgrades, and noisy-neighbor risks between tenants |

**Tenant Databases/Schemas Hosted:**

| Tenant | Can Share Instance? | Dedicated DB Required? |
|--------|-------------------|----------------------|
| Platform API | Yes | No (dedicated schema) |
| Agno (agent state) | Yes | No (dedicated schema) |
| Temporal | **Recommended dedicated** | Yes (own migration lifecycle) |
| LiteLLM | Yes | No (dedicated schema) |
| OpenFGA | Yes | No (dedicated schema) |
| Langfuse | Yes | No (dedicated schema) |
| LangGraph checkpoints | Yes | No (dedicated schema) |

**Decision Point:** Temporal's PostgreSQL can share the physical instance in development but should have a dedicated instance in production due to its independent schema migration tooling and high write volume.

---

### 11. Redis / Valkey (Caching + Queuing)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (single instance) or 3-6 (Sentinel or Cluster mode in production) |
| **Database Dependencies** | None |
| **Cache Dependencies** | N/A (Redis IS the cache) |
| **Blob/Object Storage** | None |
| **Minimum CPU/RAM (Dev)** | 0.25 vCPU / 256 MB RAM |
| **Minimum CPU/RAM (Prod)** | 1 vCPU / 2-4 GB RAM (depends on cache size + queue depth) |
| **Ports** | 6379 (Redis protocol), 26379 (Sentinel, if used) |
| **Persistent Volumes** | Optional: RDB snapshots or AOF for queue durability (recommended if Langfuse queue data must survive restarts) |
| **HA Requirements** | Redis Sentinel (3 Sentinel + 1 primary + 1 replica minimum) or Redis Cluster (6 nodes minimum) |
| **Backup Requirements** | LOW priority for cache data; MEDIUM priority if used as Langfuse ingestion queue (queue loss = dropped traces) |
| **Upgrade/Migration Complexity** | LOW -- in-place upgrades; data format is stable across versions |
| **Monitoring Requirements** | Memory usage vs. maxmemory, eviction rate, connected clients, queue length (Langfuse worker queues), keyspace hit/miss ratio |
| **Operator Burden** | LOW -- well-understood technology; main concern is memory sizing and eviction policy configuration |

**Consumers:**

| Consumer | Usage | Required? |
|----------|-------|-----------|
| Platform API | Session cache, rate limiting | Optional but recommended |
| Langfuse | Async ingestion queue, caching | **REQUIRED** |
| LiteLLM | Response caching, rate limiting | Optional but recommended |

---

### 12. Object Storage (S3-Compatible)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (MinIO single-node dev) or managed service (AWS S3, GCS, Azure Blob) |
| **Database Dependencies** | None |
| **Cache Dependencies** | None |
| **Blob/Object Storage** | N/A (this IS blob storage) |
| **Minimum CPU/RAM (Dev)** | MinIO: 0.5 vCPU / 512 MB RAM |
| **Minimum CPU/RAM (Prod)** | Managed service recommended; self-hosted MinIO: 2 vCPU / 4 GB RAM per node |
| **Ports** | 9000 (S3 API), 9001 (MinIO Console) |
| **Persistent Volumes** | **REQUIRED:** Stores trace payloads (Langfuse), uploaded documents, generated artifacts. Size grows continuously. |
| **HA Requirements** | MinIO: distributed mode (4+ nodes); or use managed cloud service |
| **Backup Requirements** | MEDIUM -- data can partially be regenerated but trace payloads and user uploads cannot. Cross-region replication recommended. |
| **Upgrade/Migration Complexity** | LOW -- S3 API is stable; MinIO upgrades are straightforward |
| **Monitoring Requirements** | Storage utilization, request rate, error rate, bucket size growth |
| **Operator Burden** | LOW if using managed service; MEDIUM if self-hosting MinIO (disk management, erasure coding configuration) |

**Consumers:**

| Consumer | Usage | Required? |
|----------|-------|-----------|
| Langfuse | Event payloads, multi-modal trace data, exports | **REQUIRED** |
| Platform API | User uploads, generated artifacts | Required |
| Temporal | Workflow archival (completed workflow histories) | Optional but recommended |

---

### 13. MCP Gateway (Custom)

| Dimension | Detail |
|-----------|--------|
| **Process/Container Count** | 1 (gateway process) + N (MCP server sidecar processes, depending on tool count) |
| **Database Dependencies** | PostgreSQL (tool registry, connection configuration, audit log) |
| **Cache Dependencies** | Redis/Valkey (optional: tool response caching, rate limiting) |
| **Blob/Object Storage** | None required |
| **Minimum CPU/RAM (Dev)** | 0.5 vCPU / 512 MB RAM |
| **Minimum CPU/RAM (Prod)** | 1 vCPU / 1 GB RAM (gateway); each MCP server sidecar: 0.25-1 vCPU / 256 MB-1 GB RAM depending on tool complexity |
| **Ports** | 8200 (HTTP/SSE gateway), dynamic ports for stdio-based MCP servers |
| **Persistent Volumes** | None (stateless gateway; configuration in PostgreSQL or config files) |
| **HA Requirements** | 2+ gateway replicas; MCP server processes can be scaled per tool |
| **Backup Requirements** | N/A (stateless; tool registry in PostgreSQL) |
| **Upgrade/Migration Complexity** | LOW -- custom code, team-controlled release cycle |
| **Monitoring Requirements** | Tool invocation latency, tool error rates, concurrent MCP sessions, gateway request throughput |
| **Operator Burden** | MEDIUM -- custom code requires ongoing maintenance; MCP server lifecycle management adds operational surface area |

---

## Deployment Topology Estimates

### Topology 1: MINIMAL DEVELOPMENT (Single Machine, Docker Compose)

**Target:** Local developer workstation or single CI server.
**Goal:** All components running for integration testing and development.

| Container | Image | CPU | RAM | Ports | Persistent Volume |
|-----------|-------|-----|-----|-------|-------------------|
| platform-api | custom | 0.5 | 512 MB | 8000 | -- |
| agno-runtime | custom (or embedded in platform-api) | 0.5 | 512 MB | 8100 | -- |
| temporal-server (all-in-one) | temporalio/auto-setup | 2.0 | 4 GB | 7233 | -- |
| temporal-ui | temporalio/ui | 0.25 | 256 MB | 8080 | -- |
| temporal-worker (app) | custom | 0.5 | 512 MB | -- | -- |
| litellm-proxy | ghcr.io/berriai/litellm | 0.5 | 512 MB | 4000 | -- |
| openfga | openfga/openfga | 0.25 | 256 MB | 8080, 8081 | -- |
| cube-api | cubejs/cube | 0.5 | 512 MB | 4000, 15432 | -- |
| cube-store | cubejs/cubestore | 0.5 | 512 MB | 3030 | vol: cubestore-data |
| langfuse-web | langfuse/langfuse | 0.5 | 1 GB | 3000 | -- |
| langfuse-worker | langfuse/langfuse-worker | 0.5 | 1 GB | -- | -- |
| clickhouse | clickhouse/clickhouse-server | 1.0 | 2 GB | 8123, 9000 | vol: clickhouse-data |
| postgresql | postgres:16 | 1.0 | 2 GB | 5432 | vol: pgdata |
| redis | redis:7 / valkey | 0.25 | 256 MB | 6379 | -- |
| minio | minio/minio | 0.5 | 512 MB | 9000, 9001 | vol: minio-data |
| mcp-gateway | custom | 0.5 | 512 MB | 8200 | -- |

**Totals:**

| Metric | Value |
|--------|-------|
| **Total Containers** | **16** |
| **Total vCPU** | **~9.75 vCPU** |
| **Total RAM** | **~15.25 GB** |
| **Persistent Volumes** | 4 (pgdata, clickhouse-data, cubestore-data, minio-data) |
| **Minimum Machine Spec** | 16 GB RAM, 8-core CPU, 100 GB SSD |
| **Docker Compose Complexity** | ~300-400 lines of YAML; health checks, dependency ordering, shared networks |

**Assessment:** A developer laptop with 16 GB RAM will be under significant memory pressure. 32 GB RAM recommended. This is a far cry from "2 new services."

---

### Topology 2: MINIMAL PRODUCTION (Basic Reliability)

**Target:** Single-region deployment with basic fault tolerance. Suitable for internal/pilot usage with <100 concurrent users.

| Component | Replicas | CPU (total) | RAM (total) | Notes |
|-----------|----------|-------------|-------------|-------|
| Platform API | 2 | 4 vCPU | 4 GB | Behind load balancer |
| Agno Runtime | 2 (embedded or standalone) | 4 vCPU | 8 GB | Scales with agent concurrency |
| Temporal Frontend | 2 | 4 vCPU | 8 GB | gRPC load balanced |
| Temporal History | 2 | 4 vCPU | 8 GB | Shard-aware routing |
| Temporal Matching | 2 | 2 vCPU | 4 GB | |
| Temporal Worker (internal) | 1 | 1 vCPU | 2 GB | System workflows |
| Temporal UI | 1 | 0.5 vCPU | 512 MB | |
| Temporal Workers (app) | 2 | 4 vCPU | 8 GB | Per workflow type |
| LiteLLM Proxy | 2 | 2 vCPU | 2 GB | |
| OpenFGA | 2 | 2 vCPU | 2 GB | |
| Cube API | 2 | 4 vCPU | 4 GB | |
| Cube Store | 1 | 2 vCPU | 4 GB | Single-node acceptable |
| Langfuse Web | 2 | 4 vCPU | 8 GB | |
| Langfuse Worker | 2 | 4 vCPU | 8 GB | |
| ClickHouse | 1 | 4 vCPU | 16 GB | Single-node with backups |
| PostgreSQL (primary) | 1 | 4 vCPU | 16 GB | Shared across tenants |
| PostgreSQL (Temporal, dedicated) | 1 | 2 vCPU | 4 GB | Temporal-only |
| PostgreSQL (standby) | 1 | 4 vCPU | 16 GB | Streaming replication |
| PgBouncer | 1 | 0.5 vCPU | 256 MB | Connection pooling |
| Redis (primary) | 1 | 1 vCPU | 4 GB | |
| Redis (replica) | 1 | 1 vCPU | 2 GB | |
| Redis Sentinel | 3 | 0.75 vCPU | 768 MB | |
| Object Storage | Managed (S3/GCS) | -- | -- | Managed service |
| MCP Gateway | 2 | 2 vCPU | 2 GB | |
| Load Balancer | 1 | -- | -- | Managed or HAProxy |
| Monitoring Stack (Prometheus + Grafana) | 2 | 2 vCPU | 4 GB | Non-optional at this scale |

**Totals:**

| Metric | Value |
|--------|-------|
| **Total Process Instances** | **~38** |
| **Total vCPU** | **~56 vCPU** |
| **Total RAM** | **~125 GB** |
| **Managed Services** | Object Storage, Load Balancer (optional) |
| **Estimated Cloud Cost** | $2,000-4,000/month (varies by provider and region) |
| **Operational Staff** | 1-2 platform engineers (part-time) |

---

### Topology 3: HIGH AVAILABILITY PRODUCTION (Full Redundancy)

**Target:** Multi-AZ deployment with full redundancy. Suitable for enterprise production with >100 concurrent users and SLA requirements.

| Component | Replicas | CPU (total) | RAM (total) | Notes |
|-----------|----------|-------------|-------------|-------|
| Platform API | 3 (multi-AZ) | 6 vCPU | 6 GB | Auto-scaling group |
| Agno Runtime | 3 (multi-AZ) | 6 vCPU | 12 GB | Auto-scaling group |
| Temporal Frontend | 3 (multi-AZ) | 6 vCPU | 12 GB | |
| Temporal History | 3 (multi-AZ) | 6 vCPU | 12 GB | |
| Temporal Matching | 3 (multi-AZ) | 3 vCPU | 6 GB | |
| Temporal Worker (internal) | 2 | 2 vCPU | 4 GB | |
| Temporal UI | 2 | 1 vCPU | 1 GB | |
| Temporal Workers (app) | 3 (multi-AZ) | 6 vCPU | 12 GB | Auto-scaling |
| LiteLLM Proxy | 3 (multi-AZ) | 3 vCPU | 3 GB | |
| OpenFGA | 3 (multi-AZ) | 3 vCPU | 3 GB | |
| Cube API | 3 (multi-AZ) | 6 vCPU | 6 GB | |
| Cube Store (router + workers) | 3 | 6 vCPU | 12 GB | Distributed mode |
| Langfuse Web | 3 (multi-AZ) | 6 vCPU | 12 GB | |
| Langfuse Worker | 3 (multi-AZ) | 6 vCPU | 12 GB | |
| ClickHouse Cluster | 3 (multi-AZ) | 12 vCPU | 48 GB | ReplicatedMergeTree |
| ClickHouse Keeper | 3 | 3 vCPU | 6 GB | Consensus (replaces ZooKeeper) |
| PostgreSQL (primary) | 1 | 8 vCPU | 32 GB | Patroni-managed |
| PostgreSQL (sync standby) | 1 | 8 vCPU | 32 GB | Same AZ or cross-AZ |
| PostgreSQL (async standby) | 1 | 8 vCPU | 32 GB | Different AZ |
| PostgreSQL (Temporal, primary) | 1 | 4 vCPU | 8 GB | Dedicated |
| PostgreSQL (Temporal, standby) | 1 | 4 vCPU | 8 GB | |
| PgBouncer | 2 | 1 vCPU | 512 MB | |
| Redis Cluster | 6 | 6 vCPU | 24 GB | 3 primary + 3 replica |
| Object Storage | Managed (S3/GCS) | -- | -- | Cross-region replication |
| MCP Gateway | 3 (multi-AZ) | 3 vCPU | 3 GB | |
| Load Balancer | Managed (ALB/NLB) | -- | -- | Multi-AZ |
| Monitoring (Prometheus HA) | 2 | 4 vCPU | 8 GB | Thanos or Prometheus HA |
| Grafana | 2 | 2 vCPU | 4 GB | |
| Log Aggregation (Loki/ELK) | 3 | 6 vCPU | 12 GB | |

**Totals:**

| Metric | Value |
|--------|-------|
| **Total Process Instances** | **~68** |
| **Total vCPU** | **~145 vCPU** |
| **Total RAM** | **~341 GB** |
| **Managed Services** | Object Storage, Load Balancer, DNS, TLS certificates |
| **Estimated Cloud Cost** | $8,000-15,000/month (varies by provider, region, reservations) |
| **Operational Staff** | 2-3 dedicated platform/SRE engineers |
| **Backup Infrastructure** | WAL archiving, ClickHouse backup jobs, S3 cross-region replication |

---

## Dependency Graph Summary

```
Platform API ──────────┬──> PostgreSQL (shared) ──> Persistent Volume
                       ├──> Redis/Valkey
                       ├──> Object Storage (S3)
                       ├──> LiteLLM Proxy ────────> PostgreSQL (shared)
                       │                    ├─────> Redis/Valkey (optional)
                       ├──> Agno Runtime ─────────> PostgreSQL (shared)
                       ├──> OpenFGA ──────────────> PostgreSQL (shared)
                       ├──> Temporal Server ──────> PostgreSQL (dedicated recommended)
                       │    ├── Frontend
                       │    ├── History
                       │    ├── Matching
                       │    └── Worker (internal)
                       ├──> Temporal Workers (app) ──> Temporal Server (gRPC)
                       ├──> MCP Gateway ──────────> PostgreSQL (shared)
                       ├──> Cube ─────────────────> PostgreSQL (as data source)
                       │    └── Cube Store ───────> Persistent Volume
                       └──> Langfuse ─────────────> PostgreSQL (shared)
                            ├── Web
                            ├── Worker
                            ├──────────────────────> ClickHouse ──> Persistent Volume
                            ├──────────────────────> Redis/Valkey (shared)
                            └──────────────────────> Object Storage (S3)
```

### PostgreSQL Tenant Count (Shared Instance)

| Schema/Database | Owner | Write Volume | Sensitivity |
|-----------------|-------|-------------|-------------|
| platform_api | Platform API | Medium | High (user data) |
| agno | Agno Runtime | Medium | Medium |
| litellm | LiteLLM | Medium | High (API keys) |
| openfga | OpenFGA | Low-Medium | **Critical** (authorization) |
| langfuse | Langfuse | Medium | Medium |
| langgraph_checkpoints | LangGraph | Low | Low |
| **temporal** (dedicated) | Temporal | **High** | High (workflow state) |

---

## Cost and Complexity Assessment

### True Infrastructure Delta from "Bare Application"

Starting from a baseline of "just the custom Platform API + PostgreSQL," here is what each candidate component actually adds to the infrastructure:

| Component | New Containers (Dev) | New Containers (Prod HA) | Additional Databases | Additional Persistent Volumes | Operator Expertise Required |
|-----------|---------------------|-------------------------|---------------------|-------------------------------|---------------------------|
| Temporal | +3 (server, UI, app worker) | +14 (4 roles x3 + UI + workers) | +1 PostgreSQL (dedicated) | +1 | Workflow orchestration, schema migrations |
| Langfuse | +5 (web, worker, ClickHouse, Redis, MinIO) | +12 (replicated web, worker, ClickHouse cluster, Keeper) | +1 ClickHouse | +3 (CH data, MinIO data, Redis) | ClickHouse operations, distributed systems |
| LiteLLM | +1 | +3 | 0 (shared PG) | 0 | LLM proxy configuration |
| OpenFGA | +1 | +3 | 0 (shared PG) | 0 | Authorization model design |
| Cube | +2 (API + Store) | +6 (API replicas + Store cluster) | 0 | +1 (Cube Store) | Semantic layer modeling |
| MCP Gateway | +1 | +3 | 0 (shared PG) | 0 | MCP protocol, tool lifecycle |
| Redis | +1 | +6 (cluster) | 0 | +1 (optional) | Redis operations |
| Object Storage | +1 (MinIO) | Managed service | 0 | +1 | Minimal (if managed) |
| **TOTAL DELTA** | **+15** | **+47** | **+2** | **+7** | **Multiple specialized domains** |

### Honest Summary

| Claim | Reality |
|-------|---------|
| "2 new services" | **16 containers minimum** in development, **38+ in minimal production, 68+ in HA production** |
| "Just add PostgreSQL" | PostgreSQL serves **7 tenants** with different migration lifecycles, write patterns, and sensitivity levels. Temporal should have its own instance. |
| "Temporal is 1 service" | Temporal is **4 internal roles + PostgreSQL + UI + application workers** = 7 processes minimum |
| "Langfuse for observability" | Langfuse self-hosted is a **6-container platform** requiring PostgreSQL, ClickHouse, Redis, and S3-compatible storage |
| Infrastructure cost is low | Minimum production cloud spend is **$2,000-4,000/month** before any LLM API costs; HA production is **$8,000-15,000/month** |

---

## Sources

- [Langfuse Self-Hosting Overview](https://langfuse.com/self-hosting)
- [Langfuse Architecture Changes for v3 (Discussion #1902)](https://github.com/orgs/langfuse/discussions/1902)
- [Langfuse ClickHouse Requirements](https://langfuse.com/self-hosting/deployment/infrastructure/clickhouse)
- [Langfuse PostgreSQL Requirements](https://langfuse.com/self-hosting/deployment/infrastructure/postgres)
- [Langfuse Docker Compose Deployment](https://langfuse.com/self-hosting/deployment/docker-compose)
- [Langfuse Application Containers](https://langfuse.com/self-hosting/deployment/infrastructure/containers)
- [Langfuse Scaling Deployments](https://langfuse.com/self-hosting/configuration/scaling)
- [Temporal Persistence Documentation](https://docs.temporal.io/temporal-service/persistence)
- [Temporal Self-Hosted Guide](https://docs.temporal.io/self-hosted-guide)
- [Temporal Deployment Documentation](https://docs.temporal.io/self-hosted-guide/deployment)
- [Temporal Self-Hosted Visibility Setup](https://docs.temporal.io/self-hosted-guide/visibility)
- [Temporal Architecture (DeepWiki)](https://deepwiki.com/temporalio/temporal/1.1-architecture)
- [Temporal Docker Compose Repository](https://github.com/temporalio/docker-compose)
- [LiteLLM Cloud Deployment Guide](https://docs.litellm.ai/docs/proxy/deploy_cloud)
- [OpenFGA Running in Production](https://openfga.dev/docs/best-practices/running-in-production)
- [OpenFGA Docker Setup](https://openfga.dev/docs/getting-started/setup-openfga/docker)
- [Cube Core Deployment with Docker](https://cube.dev/docs/product/deployment/core)
- [Langfuse Self-Hosting Infrastructure (DeepWiki)](https://deepwiki.com/langfuse/langfuse-docs/9-self-hosting-infrastructure)
