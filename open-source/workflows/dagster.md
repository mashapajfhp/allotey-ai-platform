# Dagster (dagster-io/dagster)

**STATUS: NOT STARTED**
**License:** Apache 2.0
**Repository:** https://github.com/dagster-io/dagster

---

## Overview

Dagster is an asset-centric data orchestration platform. Unlike task-centric
orchestrators (Airflow) that focus on "what to run and when," Dagster focuses
on "what data to produce" -- assets are the primary abstraction, and the
computation to produce them is secondary.

---

## Core Concepts

### Assets

The fundamental unit. An asset is a piece of data (a table, a file, a model)
that Dagster knows how to produce. Assets declare:
- What upstream assets they depend on
- How to compute/refresh the data
- What schema/metadata the output has

### Jobs

A collection of operations (assets or ops) to execute together. Jobs define
what runs as a unit.

### Schedules

Cron-like triggers for jobs. Run a job at a specific time interval.

### Sensors

Event-driven triggers. Watch for external events (new file in S3, database
change, API webhook) and trigger jobs in response.

### Lineage

Automatic dependency tracking across assets. Dagster knows the full graph
of how data flows from source to consumption. Lineage is derived from asset
declarations, not inferred at runtime.

### Partitions

Divide an asset into logical chunks (by date, by customer, by region).
Partitions enable:
- Incremental processing (only recompute changed partitions)
- Backfilling (reprocess historical partitions)
- Parallel execution across partitions

### Observability

Built-in UI (Dagit) for:
- Asset lineage visualization
- Job execution history
- Partition status and freshness
- Resource utilization
- Alerting on staleness (FreshnessPolicy)

---

## Comparison: Dagster vs Prefect vs Airflow

| Dimension | Dagster | Prefect | Airflow |
|-----------|---------|---------|---------|
| **Mental Model** | Asset-centric ("what data to produce") | Task-centric with Python-native DX | Task-centric with DAG definition |
| **Primary Abstraction** | Assets (data-first) | Tasks/flows (code-first) | DAGs/tasks (graph-first) |
| **Lineage** | First-class, automatic | Limited | Limited (via datasets in Airflow 3.x) |
| **Partitions** | First-class | Manual | Added in Airflow 3.2 (April 2026) |
| **Type System** | Strong (IO managers, type checks) | Lightweight | Minimal |
| **Testing** | Built-in test framework | Good Python testing | Harder to unit test |
| **UI** | Dagit (asset-focused) | Prefect UI (run-focused) | Airflow UI (DAG-focused) |
| **Ecosystem** | Growing, modern data stack focus | Growing, Python-native | Largest (thousands of providers) |
| **Operational Complexity** | Moderate | Low | High (scheduler, webserver, workers, DB) |
| **License** | Apache 2.0 | Apache 2.0 | Apache 2.0 |
| **Maturity** | Maturing rapidly | Mature | Most mature |

### When to Choose Dagster

- Greenfield data pipeline project
- Asset-centric mental model (focus on data, not tasks)
- Heavy use of dbt and modern data stack tools
- Lineage and data observability are important
- Team prefers strong typing and testability

### When to Choose Prefect

- Python-first orchestration is the priority
- Simpler task-based workflows
- Quick setup and low operational overhead
- Team wants minimal framework overhead

### When to Choose Airflow

- Existing Airflow investment or team expertise
- Need the widest ecosystem of integrations (providers)
- Dedicated platform team available for operations
- Complex scheduling requirements

---

## Relevance to AI Platform

Dagster is a **data pipeline orchestrator**, not a workflow engine for
business processes (Temporal) or agent reasoning. Its relevance to the AI
platform is for:

- ETL/ELT pipelines that feed data into the platform
- Model training and evaluation pipelines
- Data quality monitoring and freshness tracking
- Knowledge base ingestion and processing pipelines

It does NOT replace Temporal/Inngest/Restate for durable business process
execution or agent orchestration.

---

## Key Questions

- [ ] Do we have data pipeline needs that justify Dagster, or can simpler
      tools handle our ETL?
- [ ] Is Dagster relevant for knowledge base ingestion pipelines?
- [ ] How does Dagster integrate with the rest of the stack (ClickHouse,
      LanceDB, etc.)?
- [ ] Is the asset-centric model a better fit than Airflow/Prefect for
      our data workflows?

---

## References

- Dagster Documentation: https://docs.dagster.io
- Dagster GitHub: https://github.com/dagster-io/dagster
- Dagster vs Prefect vs Airflow: https://www.zenml.io/blog/orchestration-showdown-dagster-vs-prefect-vs-airflow
