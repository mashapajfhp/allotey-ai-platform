# Langfuse (langfuse/langfuse)

**STATUS: RESEARCH COMPLETE**
**License:** MIT (core), self-hosting supported at production scale
**Acquisition:** Acquired by ClickHouse on January 16, 2026; remains open-source and self-hostable
**Repository:** https://github.com/langfuse/langfuse

---

## Overview

Langfuse is the most widely deployed open-source LLM observability and evaluation
platform. It provides tracing, prompt management, scoring, datasets, experiments,
and cost tracking for LLM applications. Since January 2026, Langfuse is part of
ClickHouse, with no planned licensing changes.

---

## Core Architecture

### Storage Layer

Langfuse runs entirely on ClickHouse for its analytical query engine -- both in the
cloud offering and self-hosted deployments. This architecture handles analytical
queries on billions of traces in milliseconds. The ClickHouse acquisition was a
natural progression: Langfuse was already built on ClickHouse before being acquired.

### OpenTelemetry Foundation

Langfuse functions as a generic OpenTelemetry (OTel) backend. Any framework or
hand-rolled agent that emits OTel spans gets traced without a dedicated SDK. This
is critical for vendor neutrality -- it means Langfuse is not a proprietary
tracing format but an OTel-compatible collector with LLM-specific UI and analytics.

Native integrations exist for: OpenAI SDK, LangChain, LangGraph, LiteLLM,
Vercel AI SDK, and custom Python/TypeScript.

---

## Tracing Model

### Traces

A trace represents one end-to-end request -- typically one user interaction or
agent invocation. Traces are the top-level unit. Everything else nests inside.

### Observations (Spans and Generations)

Inside a trace, you record observations in three flavors:

1. **Span:** A unit of work with a start time and duration. Examples: a retrieval
   step, a tool call, a preprocessing function, an embedding lookup.

2. **Generation:** A special span type representing a single LLM call. Carries:
   - Model name and provider
   - Input prompt / messages
   - Output completion
   - Token usage (input, output, total)
   - Cost (calculated from token counts and model pricing)
   - Latency (time to first token, total duration)
   - Finish reason

3. **Event:** A point-in-time occurrence within a span (e.g., "retrieved 5
   documents", "tool returned error").

### Session Tracking

Traces can be grouped into sessions (e.g., a multi-turn conversation). Sessions
enable analyzing user journeys across multiple interactions.

---

## Prompt Management

### Versioning

Prompts are centrally managed, version-controlled, and collaboratively iterable.
Each prompt version is immutable once published. Key features:
- Server-side and client-side caching (no added latency from prompt fetching)
- Named prompt references in code (decouple prompt text from application code)
- A/B testing across prompt versions
- Rollback to previous versions
- Labels (production, staging, development) for deployment control

### Playground

Interactive prompt playground for testing prompt versions against real data
before deploying to production. Supports comparing outputs across models and
prompt versions side by side.

---

## Scoring and Evaluation

All evaluation methods share the same scoring infrastructure -- scores flow into
the same dashboards regardless of source.

### Score Types

1. **User Feedback:** Thumbs up/down, star ratings, or custom signals from end
   users. Captured via SDK and attached to traces.

2. **Human Annotation:** Internal reviewers score traces for quality, correctness,
   or other criteria. Annotation queues help teams systematically review outputs.

3. **LLM-as-Judge:** Automated evaluation using LLMs to score outputs on criteria
   like faithfulness, relevance, helpfulness, toxicity. Configurable judge prompts
   and models.

4. **Programmatic Scoring:** Custom scoring functions (e.g., regex match, JSON
   schema validation, exact match) that run automatically on traces.

### Cost and Latency Tracking

- Token costs calculated per generation using model pricing tables
- Latency tracked at every span and generation level
- Dashboard views for cost per user, per feature, per model, over time
- Alerts for cost anomalies or latency spikes (NEEDS VERIFICATION: alerting
  may be cloud-only)

---

## Datasets and Experiments

### Datasets

A dataset is a named collection of input/output example pairs. Sources:
- Curated from production traces (select interesting/failing cases)
- Manually created test cases
- Imported from external sources

### Experiments

As of April 2026, experiments are a first-class concept:
- A named execution of a model/pipeline over a dataset
- Each item produces a trace recorded as a DatasetRunItem
- Multiple runs over the same dataset can be compared on latency, cost, and
  score dimensions using the compare view
- Experiments work with or without datasets
- Track progress over time across model/prompt iterations

### Experiment Workflow

1. Curate a dataset from production failures
2. Run experiment with current prompt/model
3. Score results (LLM-as-judge + human review)
4. Iterate on prompt/model
5. Run experiment again
6. Compare runs on all dimensions

---

## Licensing

### Directory-Level Licensing

NEEDS VERIFICATION: The exact directory-level licensing structure. The core
platform is MIT-licensed. Some enterprise features (SSO, advanced RBAC, audit
logs) may have different licensing in the cloud offering. Self-hosting of the
core platform is fully supported under MIT.

### Post-Acquisition Status

ClickHouse confirmed on acquisition (January 2026):
- Langfuse core stays open source under MIT
- Self-hosting remains supported at production scale
- No planned licensing changes

---

## Comparison: Langfuse vs Arize Phoenix vs OpenTelemetry

| Dimension | Langfuse | Arize Phoenix | Raw OpenTelemetry |
|-----------|----------|---------------|-------------------|
| **Primary Focus** | LLM engineering platform | LLM observability + eval | Universal observability standard |
| **Tracing** | OTel-compatible, LLM-specific UI | OpenInference conventions | Generic spans and attributes |
| **Prompt Management** | Built-in versioning, caching | No | No |
| **Experiments** | First-class, dataset-driven | Dataset management, evals | No |
| **Evaluations** | LLM-as-judge, human, programmatic | Built-in evaluators (faithfulness, etc.) | No |
| **Cost Tracking** | Per-generation, per-user, dashboards | Token counting | Manual implementation |
| **Deployment** | Self-host or cloud | Single-command self-host | Requires backend (Jaeger, etc.) |
| **Backend** | ClickHouse | SQLite/PostgreSQL | Varies by backend |
| **License** | MIT | BSD-3-Clause (NEEDS VERIFICATION) | Apache 2.0 |
| **Maturity** | Most widely deployed | Growing, strong eval focus | Industry standard |
| **Vendor Lock-in** | Low (OTel-based) | Low (open source) | None (it IS the standard) |

### When to Choose Langfuse

- Need a complete LLM engineering platform (not just tracing)
- Prompt management and versioning are important
- Want experiment workflows for systematic iteration
- Production-grade self-hosting required
- Team wants a UI-first experience with programmatic access

### When to Consider Arize Phoenix

- Stronger focus on evaluation and embedding analysis
- Single-command local setup for development
- RAG-specific metrics (context relevance, hallucination detection)
- Lighter operational footprint needed

### Role of OpenTelemetry

OpenTelemetry is the foundation layer, not a competing product:
- Langfuse already consumes OTel spans natively
- The GenAI semantic conventions (gen_ai.*) standardize what LLM-specific
  attributes look like in OTel
- Any OTel-compatible backend can receive LLM traces
- The question is not "OTel OR Langfuse" but "how much of Langfuse's value-add
  (prompts, experiments, scoring) do we need beyond raw OTel tracing?"

---

## Integration Points for the Platform

- **Agent tracing:** Every agent invocation = one trace, tool calls = spans,
  LLM calls = generations
- **Cost attribution:** Per-tenant, per-agent, per-user cost tracking
- **Quality monitoring:** Automated scoring on production traces for regression
  detection
- **Prompt iteration:** Version and A/B test system prompts for agents
- **Feedback loops:** User feedback flows into datasets for experiment-driven
  improvement

---

## Key Questions

- [ ] Self-host vs cloud? What is the operational burden of self-hosting
      ClickHouse at scale?
- [ ] How does Langfuse handle multi-tenancy for a platform serving multiple
      customers?
- [ ] Can Langfuse scores feed back into authorization decisions (e.g., disable
      an agent that consistently scores below threshold)?
- [ ] What is the data retention and archival story for high-volume tracing?
- [ ] How does the ClickHouse acquisition affect the open-source roadmap?

---

## References

- Langfuse Documentation: https://langfuse.com/docs
- GitHub Repository: https://github.com/langfuse/langfuse
- ClickHouse Acquisition: https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability
- Experiments Feature: https://langfuse.com/changelog/2026-04-13-experiments-rebuild
- OpenTelemetry Integration: https://langfuse.com/docs/integrations/opentelemetry
