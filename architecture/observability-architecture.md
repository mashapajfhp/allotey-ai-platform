# Observability Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Purpose

Every operation in the platform must be traceable — from user request through agent reasoning, tool execution, data access, and response generation. Observability is not optional; it is foundational for debugging, performance optimization, cost management, audit, and trust.

## Observability Stack

### Layer 1: OpenTelemetry (Infrastructure)
The lowest-level standard for distributed tracing, metrics, and logs. All platform components emit OTel-compatible telemetry.

### Layer 2: AI-Specific Observability (Langfuse or equivalent)
Enriches OTel traces with AI-specific data:
- Token counts (input/output per model call)
- Model latency and throughput
- Tool call success/failure rates
- Agent reasoning traces (step-by-step)
- Prompt versions and parameters
- Cost per request

### Layer 3: Business Observability (Custom)
Platform-specific metrics:
- Decision quality scores
- Agent accuracy over time
- Tenant usage patterns
- Budget consumption rates
- Action success/failure by type

## Trace Structure

```
Trace: user-request-12345
├── Span: gateway.authenticate (2ms)
├── Span: gateway.authorize (5ms)
├── Span: agent.reasoning (3200ms)
│   ├── Span: model.generate (800ms) [tokens: 1500/500, model: gpt-4o, cost: $0.04]
│   ├── Span: tool.semantic_query (200ms) [query: "revenue by region"]
│   ├── Span: model.generate (600ms) [tokens: 2000/800, model: gpt-4o, cost: $0.06]
│   └── Span: tool.action.approve (150ms) [action: "approve_order", entity: "PO-123"]
├── Span: workflow.approval (pending - human wait)
└── Span: response.render (50ms)
```

## Research Questions

- How much should build on OpenTelemetry vs. AI-specific tools?
- Langfuse vs. Arize Phoenix — which better fits?
- How is observability data stored? Same analytical engine or separate?
- How long should traces be retained?
- How does observability interact with provenance? (They overlap)

## References

- `open-source/observability/langfuse.md` — Langfuse research
- `open-source/observability/opentelemetry.md` — OTel as foundation
