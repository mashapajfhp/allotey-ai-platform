# Arize Phoenix (Arize-ai/phoenix)

**STATUS: NOT STARTED**
**License:** BSD-3-Clause (NEEDS VERIFICATION)
**Repository:** https://github.com/Arize-ai/phoenix

---

## Overview

Arize Phoenix is an open-source AI observability and evaluation platform for
tracing, debugging, and measuring LLM applications. It self-hosts in a single
command with no API keys, cloud accounts, or vendor lock-in required. Developed
by Arize AI, the same team behind the commercial Arize observability platform.

---

## Core Capabilities

### Tracing (OpenInference)

Phoenix uses OpenInference semantic conventions -- LLM-specific span attributes
that embed input messages, output messages, retrieved documents, embedding vectors,
and token counts directly into span attributes. This makes traces queryable and
evaluatable in LLM-specific ways beyond generic OpenTelemetry spans.

### Evaluations

Built-in evaluators cover:
- **Faithfulness:** Does the output faithfully represent the source material?
- **Relevance:** Is the retrieved context relevant to the query?
- **Hallucination detection:** Does the output contain unsupported claims?
- **Toxicity:** Content safety scoring
- **Custom criteria:** Define your own evaluation rubrics

RAG-specific metrics: context relevance, hallucination detection, response
faithfulness.

### Embeddings Analysis

Surfaces clusters and outliers in input distributions. Useful for:
- Detecting distribution drift in production
- Identifying underperforming input categories
- Visualizing embedding spaces for debugging retrieval

### Dataset Management and Playground

- Curate datasets from production traces
- Prompt playground for iterating before deployment
- Batch evaluation across datasets

---

## Deployment

Single-command local setup: `phoenix launch` or `import phoenix as px; px.launch_app()`.
No external dependencies for local development. For production, supports PostgreSQL
or SQLite as storage backends.

---

## Comparison to Langfuse

Phoenix is stronger on evaluation and embedding analysis but lacks Langfuse's
prompt management, versioning, and experiment workflow features. Phoenix is a
better fit for teams that prioritize local-first development and RAG debugging.
Langfuse is better for production-grade platform observability with prompt
lifecycle management.

---

## Key Questions

- [ ] How does Phoenix scale for production workloads vs development use?
- [ ] Can Phoenix and Langfuse coexist, or are they mutually exclusive?
- [ ] OpenInference vs OpenTelemetry GenAI conventions -- which wins?
- [ ] What is the roadmap after the OTel GenAI conventions stabilize?

---

## References

- Phoenix GitHub: https://github.com/Arize-ai/phoenix
- Arize Phoenix Documentation: https://docs.arize.com/phoenix
