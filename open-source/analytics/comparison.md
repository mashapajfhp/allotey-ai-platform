# Analytics Database Comparison

**STATUS: NOT STARTED**

---

## Overview

Comparison of four analytical databases for the AI platform's analytics needs.
Each serves a different workload profile.

---

## Comparison Matrix

| Dimension | ClickHouse | DuckDB | Apache Pinot | Apache Druid |
|-----------|------------|--------|--------------|--------------|
| **Architecture** | Distributed columnar OLAP | Embedded analytical (like SQLite for analytics) | Distributed, real-time OLAP | Distributed, time-series OLAP |
| **Deployment** | Server cluster | In-process library | Server cluster (6 service types) | Server cluster (6 service types) |
| **Scaling** | Horizontal (sharding + replication) | Single node only | Horizontal | Horizontal |
| **Best Workload** | General analytical queries, event analytics | Local analysis, data science, small-to-medium datasets | High-concurrency point lookups on denormalized tables | Time-series at scale |
| **Query Latency** | Sub-second for most queries | Fast on single node | Sub-100ms for point lookups at high concurrency | Fast for time-series aggregations |
| **Operational Complexity** | Moderate (ZooKeeper/Keeper + replication) | Zero (embedded library) | High (6 service types) | High (6 service types) |
| **Concurrency** | Good | Low (single user) | Excellent (designed for user-facing analytics) | Good |
| **Storage Efficiency** | Best (5x smaller than QuestDB, 3x smaller than Druid) | Good | Moderate | Moderate |
| **Real-Time Ingestion** | Yes | Batch-oriented | Yes (Kafka-native) | Yes (Kafka-native) |
| **License** | Apache 2.0 | MIT | Apache 2.0 | Apache 2.0 |

---

## Which Workload Each Is Suited For

### ClickHouse

Best for: general-purpose analytical queries across large datasets, event
analytics, time-series with materialized views, log analytics. The default
choice for teams that need a single analytical database.

### DuckDB

Best for: local data analysis, embedded analytics within applications, data
science notebooks, small-to-medium datasets that fit on a single machine.
Not a server database -- it is a library. Cannot replace ClickHouse for
multi-user, multi-tenant production analytics.

### Apache Pinot

Best for: user-facing analytics with very high concurrency (thousands of
concurrent queries). Designed for fully denormalized tables with sub-100ms
point lookups. Overkill for internal analytics; ideal for customer-facing
dashboards.

### Apache Druid

Best for: time-series analytics at massive scale with streaming ingestion
(Kafka-native). Operationally heavy (6 service types). Typically 3-8x slower
than ClickHouse on complex analytical workloads per ClickBench benchmarks.

---

## Recommendation for AI Platform

For an AI platform's analytics needs (agent usage, cost tracking, latency
monitoring, tenant-level reporting):

1. **ClickHouse** is the most likely choice -- it covers the widest range of
   workloads, has the best storage efficiency, and is already in the stack
   (Langfuse runs on it).

2. **DuckDB** may be useful as a local analysis tool for data exploration
   but is not a production analytics backend.

3. **Pinot/Druid** are over-engineered for this use case unless the platform
   serves thousands of concurrent dashboard users.

---

## Key Questions

- [ ] Can we share Langfuse's ClickHouse instance for platform analytics?
- [ ] What is our expected query concurrency for analytics?
- [ ] Do we need real-time analytics, or are near-real-time (seconds) ok?
- [ ] Is DuckDB useful as a query layer on top of object storage (Parquet)?

---

## References

- ClickBench Comparison: https://benchmark.clickhouse.com
- ClickHouse: https://clickhouse.com
- DuckDB: https://duckdb.org
- Apache Pinot: https://pinot.apache.org
- Apache Druid: https://druid.apache.org
