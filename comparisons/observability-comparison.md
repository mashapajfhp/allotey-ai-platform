# Observability Comparison

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Observability Stack Options

| Feature | OpenTelemetry | Langfuse | Arize Phoenix | MLflow |
|---------|---------------|---------|---------------|--------|
| Level | Infrastructure | AI-specific | AI-specific | ML lifecycle |
| Traces/spans | Yes | Yes | Yes | Yes |
| LLM-specific | No (needs ext) | Yes | Yes | Partial |
| Prompt management | No | Yes | No | No |
| Evaluation | No | Yes | Yes | Yes |
| Cost tracking | No | Yes | Partial | No |
| Datasets | No | Yes | Yes | Yes |
| User feedback | No | Yes | Partial | No |
| Self-hostable | Yes | Yes | Yes | Yes |
| License | Apache 2.0 | MIT (core) | Apache 2.0 | Apache 2.0 |

## Recommended Architecture

```
Layer 1: OpenTelemetry
├── All platform components emit OTel traces/metrics/logs
├── Standard instrumentation for HTTP, gRPC, database
└── Foundation that everything else builds on

Layer 2: Langfuse (or equivalent)
├── AI-specific trace enrichment (tokens, costs, models)
├── Prompt versioning and management
├── Evaluation datasets and experiments
└── Consumes OTel traces and adds AI context

Layer 3: Platform Observability (Custom)
├── Business-level metrics (decision quality, agent accuracy)
├── Tenant-level dashboards
├── Budget/cost alerting
└── Built on data from layers 1 and 2
```

## Decision: Langfuse vs. Arize Phoenix

Both are viable. Langfuse has advantages for this platform:
- Prompt management is a useful feature
- Evaluation/datasets are well-integrated
- Token cost tracking is built in
- MIT core license

NEEDS VERIFICATION: Langfuse EE feature boundaries and Phoenix's latest capabilities.
