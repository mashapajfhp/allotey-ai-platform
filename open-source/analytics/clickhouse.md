# ClickHouse

**STATUS: NOT STARTED**
**License:** Apache 2.0
**Repository:** https://github.com/ClickHouse/ClickHouse

---

## Overview

ClickHouse is an open-source columnar OLAP database designed for real-time
analytical queries on large datasets. It is the fastest analytical database
for most workloads, with the smallest on-disk footprint among competitors
(roughly 5x smaller than QuestDB, 3x smaller than Druid on the same dataset
in ClickBench benchmarks).

Notable: Langfuse runs entirely on ClickHouse, and ClickHouse acquired
Langfuse in January 2026.

---

## Core Architecture

### MergeTree Engine Family

The foundational table engine. Data is stored in sorted column chunks (parts)
that are periodically merged in the background. Variants include:
- **MergeTree:** Base engine with primary key sorting
- **ReplacingMergeTree:** Deduplicates rows by a version column during merges
- **AggregatingMergeTree:** Incrementally aggregates data during merges
- **SummingMergeTree:** Sums numeric columns during merges
- **CollapsingMergeTree:** Handles row updates via insert+cancel pairs

### Projections

Embedded alternate data layouts within a MergeTree table:
- Store a secondary copy of data sorted by a different key
- Maintained automatically during inserts (no separate pipeline)
- Enable fast queries on different access patterns without separate tables
- Trade-off: increased storage and insert overhead

Use projections when: different sort orders are needed for the same data,
simple aggregations (count, sum, uniq) are required, automatic maintenance
is preferred.

### Materialized Views

Act as insert triggers (not traditional database views):
- When data arrives in the source table, the view transforms and inserts it
  into a target table
- Pre-compute aggregations at insert time so dashboard queries return instantly
- Can use different table engines (e.g., AggregatingMergeTree for incremental
  aggregates)
- Support independent TTL policies from the source table

Use materialized views when: complex transformations needed, different table
engines required, aggregations stored separately, independent TTL policies.

### JSON Support

ClickHouse supports JSON extraction functions (JSONExtractUInt64,
JSONExtractString, etc.) for processing semi-structured event data.
Materialized views can transform JSON at insert time into typed columns.

---

## Use Cases for AI Platform

### Event Analytics

- Agent invocation events (who, when, what tool, result, latency, cost)
- User interaction events (sessions, queries, feedback)
- System events (errors, retries, timeouts)

### Time-Series

- Token usage over time per tenant/agent
- Latency percentiles across model versions
- Cost tracking with time-based rollups via materialized views

### Distributed Architecture

- Horizontal scaling via sharding and replication
- ZooKeeper or ClickHouse Keeper for coordination
- Multi-datacenter replication for high availability

---

## Key Questions

- [ ] Is ClickHouse the right analytics store, or do we already get analytics
      through Langfuse (which runs on ClickHouse)?
- [ ] Should we run a separate ClickHouse for platform analytics, or share
      Langfuse's ClickHouse instance?
- [ ] What is the operational complexity of running ClickHouse in production?
- [ ] Do we need real-time analytics (ClickHouse) or is batch analytics
      (DuckDB) sufficient for our scale?
- [ ] How does ClickHouse handle multi-tenant data isolation?

---

## References

- ClickHouse Documentation: https://clickhouse.com/docs
- MergeTree Engine: https://clickhouse.com/docs/en/engines/table-engines/mergetree-family
- Projections: https://clickhouse.com/docs/en/sql-reference/statements/alter/projection
- Materialized Views: https://clickhouse.com/docs/en/guides/developer/cascading-materialized-views
