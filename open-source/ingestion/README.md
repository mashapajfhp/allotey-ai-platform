# Data Ingestion Research

> STATUS: NOT STARTED
> Last updated: 2026-08-13

Research into open-source data ingestion, ELT, and CDC tools for bringing data into the platform. The reference architecture defines the Intelligence Data Plane but does not yet address how data arrives there. This research fills that gap.

See `architecture/data-ingestion-architecture.md` for the architectural context.

---

## Research Queue

| Project | License | Category | Status | Notes |
|---------|---------|----------|--------|-------|
| Airbyte | MIT / ELv2 — VERIFY | ELT platform with 300+ connectors | NOT STARTED | License recently changed; verify core vs. connector licensing |
| Debezium | Apache 2.0 | CDC from database transaction logs | NOT STARTED | Log-based change data capture for PostgreSQL, MySQL, MongoDB, etc. |
| dlt (data load tool) | Apache 2.0 | Python-first data loading library | NOT STARTED | Lightweight, code-first approach to data ingestion |
| Meltano | MIT | Singer-based ELT, CLI-driven | NOT STARTED | GitLab-originated; Singer tap/target ecosystem |
| Kafka Connect | Apache 2.0 | Connector framework for Apache Kafka | NOT STARTED | Many connectors; verify individual connector licenses |
| Apache NiFi | Apache 2.0 | Data flow automation, visual design | NOT STARTED | Heavyweight; strong for complex data routing |
| Estuary Flow | VERIFY LICENSE | Real-time CDC + ELT | NOT STARTED | License needs verification before evaluation |

---

## License Warnings

- **Airbyte:** Core platform moved from MIT to ELv2 (Elastic License v2). The Airbyte Protocol and some connectors remain open. ELv2 restricts providing Airbyte as a managed service. Self-hosted use may be acceptable but needs careful review.
- **Kafka Connect:** Framework is Apache 2.0, but many Confluent-provided connectors have separate (often commercial) licenses. Community connectors vary.
- **Estuary Flow:** License status unclear. Some components may be source-available rather than open-source. Must verify before evaluation.

---

## Research Template

Each project research file should cover:
1. **License verification** — confirm license, identify any dual-licensing, ELv2/BSL concerns
2. **Connector coverage** — what sources and destinations are supported?
3. **CDC capability** — does it support log-based CDC? Which databases?
4. **Schema evolution** — how does it handle schema changes in source systems?
5. **Operational complexity** — what infrastructure does it require? Can it run on a single node?
6. **Self-hosted viability** — can this run entirely self-hosted without vendor dependencies?
7. **Integration fit** — how does this integrate with the platform's data plane and ontology?
8. **Community and maturity** — activity, governance, release cadence
9. **Adopt/Wrap/Study decision** — recommendation for the platform
