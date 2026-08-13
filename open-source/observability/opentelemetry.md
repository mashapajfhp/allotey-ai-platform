# OpenTelemetry for AI Observability

**STATUS: NOT STARTED**
**License:** Apache 2.0
**Specification:** https://opentelemetry.io/docs/specs/

---

## Overview

OpenTelemetry (OTel) is the industry-standard, vendor-neutral framework for
collecting traces, metrics, and logs. It is not an AI observability tool itself
but the lowest-level foundation on which AI observability tools are built.

The key question: how much of the AI observability stack should build on OTel
vs using proprietary tracing formats?

---

## GenAI Semantic Conventions

### What They Standardize

The OpenTelemetry Generative AI Observability SIG (started April 2024) defines
standardized `gen_ai.*` attributes for:

- **LLM client spans:** Model name, token counts (input/output), finish reason
- **Agent spans:** Agent reasoning steps, tool selection, planning
- **Events:** Full content of prompts, completions, tool calls, tool results
  (opt-in for privacy)
- **Metrics:** Token usage, latency, error rates

### Maturity Status (as of mid-2026)

Most GenAI semantic conventions are in **experimental** status -- the API is not
fully stabilized. However, major vendors have started supporting them:
- Datadog: native support since OTel v1.37
- Grafana: collecting LLM traces in Loki
- Langfuse: functions as a generic OTel backend

### MCP Semantic Conventions

OTel MCP semantic conventions (introduced in v1.39) fix trace disconnection
issues between agents and MCP servers. This means tool calls via MCP can be
properly traced end-to-end.

---

## How Much Should Build on OTel?

### The Layered View

1. **OTel is the transport and format layer** -- all traces should emit OTel
   spans with gen_ai.* attributes. This is non-negotiable for interoperability.

2. **LLM-specific platforms (Langfuse, Phoenix) add the application layer** --
   prompt management, scoring, experiments, cost dashboards. These consume OTel
   spans but add significant value beyond raw tracing.

3. **Generic OTel backends (Jaeger, Grafana Tempo) can store and query traces**
   but lack LLM-specific features (no prompt versioning, no evaluation, no cost
   tracking).

### Recommendation

Emit OTel spans everywhere. Use an LLM-specific platform (Langfuse) for the
application-layer features. This keeps the option to switch platforms without
re-instrumenting code.

---

## Key Questions

- [ ] When will GenAI semantic conventions reach stable status?
- [ ] Should we instrument at the OTel level and let Langfuse consume, or use
      Langfuse's native SDK directly?
- [ ] How do we handle the OTel MCP conventions for agent-to-tool tracing?
- [ ] What is the performance overhead of OTel instrumentation in latency-
      sensitive agent workloads?

---

## References

- OpenTelemetry GenAI Conventions: https://opentelemetry.io/blog/2026/genai-observability/
- OTel Specification: https://opentelemetry.io/docs/specs/
- GenAI Semantic Conventions SIG: https://github.com/open-telemetry/semantic-conventions
