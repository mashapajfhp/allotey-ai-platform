# Event Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Purpose

Defines how business events are captured, stored, and used for intelligence — pattern detection, causal analysis, and decision support.

## Core Concepts

**Events are immutable facts** — "Order #123 was approved by Jane at 2025-03-15T14:30:00Z." Once recorded, events cannot be changed.

**Events drive intelligence:**
- Pattern detection: "3 consecutive weeks of declining inventory in Region A"
- Causal analysis: "After we changed pricing, conversion rates dropped 15%"
- Trigger actions: "When inventory drops below threshold, alert procurement"

## Event Schema

```
Event:
  id: uuid
  type: string (e.g., "order.approved")
  entity_type: string (e.g., "Order")
  entity_id: string
  actor: string (user or agent identity)
  timestamp: datetime
  data: json (event-specific payload)
  provenance:
    source: string
    correlation_id: uuid
    causation_id: uuid (what event caused this)
  tenant_id: string
```

## Integration Points

- Events update the context graph (new facts, changed relationships)
- Events feed the analytical engine (aggregated event analytics)
- Events trigger workflow automation (event-driven workflows)
- Events provide provenance for decision intelligence

## Research Questions

- Should the event store be a dedicated system or part of the analytical engine (ClickHouse)?
- How does event streaming (Kafka/Redpanda) relate to event storage?
- What is the retention policy? Events are immutable but storage is finite.
- How do events interact with the temporal knowledge graph?
