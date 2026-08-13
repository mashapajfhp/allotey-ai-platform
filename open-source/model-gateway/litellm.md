# LiteLLM — Deep Research Note

**Repository:** [BerriAI/litellm](https://github.com/BerriAI/litellm)
**License:** MIT (core SDK and proxy), proprietary add-ons (Enterprise tier)
**Language:** Rust (core gateway), Python (SDK and configuration)
**GitHub Stars:** 45,000+
**Docker Pulls:** 240 million+
**Status:** DEEP RESEARCH — substantive findings documented

---

## Overview

LiteLLM, built by BerriAI (Y Combinator W23), is an open-source AI gateway and
Python SDK that provides a unified, OpenAI-compatible interface for calling
100+ LLM providers. The proxy server sits between your application and LLM
providers, translating requests and responses while adding routing, cost
tracking, access control, and observability.

As of mid-2026, LiteLLM has been rewritten with a Rust core for performance,
while retaining the Python SDK for configuration and extensibility.

---

## Provider Abstraction

LiteLLM normalizes the API surface across 100+ providers:
- OpenAI, Azure OpenAI, Anthropic, Google Vertex AI, AWS Bedrock
- Mistral, Cohere, AI21, Replicate, Together AI, Groq
- Self-hosted: vLLM, Ollama, llama.cpp, Nvidia NIM
- And many more

Clients speak the OpenAI Chat Completions or Responses API format. LiteLLM
parses the call, looks up the routing rule, picks a provider, translates the
request to that provider's native shape, dispatches it, and translates the
response back to the OpenAI shape.

---

## Routing

LiteLLM supports multiple routing strategies for distributing requests across
model deployments:

- **Latency-based** — route to the fastest responding deployment.
- **Cost-based** — route to the cheapest available option.
- **Random** — uniform random distribution.
- **Round-robin** — sequential cycling through deployments.
- **Weighted** — proportional distribution based on configured weights.

Routing rules are configured in a YAML config file and can reference model
aliases for abstraction.

---

## Fallbacks

Fallbacks are declarative: if the primary model fails (rate limit, timeout,
error), LiteLLM automatically retries the next provider in the fallback list.
No application code changes required. Fallback chains can be configured per
model alias or globally.

---

## Load Balancing

Multiple deployments of the same model (e.g., three Azure OpenAI endpoints for
GPT-4) can be load-balanced using any of the routing strategies above. This
provides both redundancy and throughput scaling.

---

## Virtual Keys

Virtual keys (also called "verification tokens") are the access control
primitive. They:
- Control access to the proxy's LLM endpoints.
- Enforce per-key budget caps (USD).
- Track usage and spend independently of provider API keys.
- Support rate limiting (requests per minute, tokens per minute).
- Require PostgreSQL for persistence.

Virtual keys abstract away the underlying provider API keys, so end users never
see or manage provider credentials directly.

---

## Budget Management

Budgets can be set at four nested levels:

| Level        | Description                                           |
|-------------|-------------------------------------------------------|
| Organization | Top-level entity, contains teams                     |
| Team         | Group of users within an organization                |
| User         | Individual person                                     |
| Key          | Specific API key (most granular)                     |

Each level can have:
- Maximum budget (USD).
- Budget reset period (daily, weekly, monthly).
- Automatic spend tracking.
- Alerts when thresholds are crossed.

---

## Cost Tracking

LiteLLM tracks cost per request using provider pricing tables. Cost is
attributed to the key, user, team, and organization that made the request.
This provides full spend visibility across the organization without requiring
each team to manage their own provider accounts.

---

## Model Aliases

A model alias maps a logical name to one or more physical model deployments:

```yaml
model_list:
  - model_name: "fast-chat"        # alias your app uses
    litellm_params:
      model: "gpt-4o-mini"         # actual provider model
      api_key: "sk-..."
  - model_name: "fast-chat"        # same alias, different provider
    litellm_params:
      model: "claude-3-haiku"
      api_key: "sk-ant-..."
```

This decouples application code from specific models and providers, enabling
A/B testing, migration, and fallback without code changes.

---

## Guardrails

The guardrail framework operates at the gateway level, applying to every model
and every team without application code changes:

- **Presidio integration** — PII masking (detect and redact personal
  information before it reaches the LLM).
- **Custom guardrails** — user-defined pre-request and post-response
  validators.
- **Prompt injection detection** — NEEDS VERIFICATION on which detection
  backends are supported in the OSS version.
- **Content filtering** — block or flag specific content types.

In 2026, LiteLLM added OpenTelemetry span emission on guardrail violations for
observability integration.

---

## Multi-Tenancy

LiteLLM models tenancy as four nested levels: **Organizations > Teams >
Users > Keys**. Each level is a boundary for:
- **Access isolation** — which models a tenant can use.
- **Spend attribution** — costs roll up through the hierarchy.
- **Budget enforcement** — limits at any level.
- **Rate limiting** — request and token quotas.

One gateway serves many tenants with full isolation.

---

## Observability

LiteLLM logs full request/response pairs, token counts, latencies, and errors
for every LLM call. Integration options:

- **OpenTelemetry** — spans and traces exported to any OTel-compatible backend.
- **Pluggable callbacks** — stream data to Langfuse, Helicone, Weights &
  Biases, or custom destinations.
- **Built-in logging** — request logs stored in the proxy database.

---

## Caching

### Exact Match Caching
Cache responses keyed on the exact prompt. Uses Redis as the cache backend.

### Semantic Caching
Uses vector similarity to identify prompts that mean the same thing and returns
cached responses. Reported to cut token costs by 30-60% in repetitive workloads
(customer support, RAG pipelines, code generation). NEEDS VERIFICATION on which
embedding model is used for semantic similarity.

---

## Proxy Architecture

The production deployment consists of:

| Component  | Purpose                                    | Required? |
|-----------|---------------------------------------------|-----------|
| LiteLLM Proxy | The gateway server (Rust core)          | Yes       |
| PostgreSQL    | Virtual keys, budgets, spend tracking   | Yes (for keys/budgets) |
| Redis         | Caching (exact and semantic)            | Optional  |
| OTel Exporter | Observability data export               | Optional  |

The proxy is configured via a YAML file (`litellm_config.yaml`) and can run as
a Docker container, on Kubernetes, or as a standalone binary.

---

## Licensing — What is MIT and What is Not

### MIT Licensed (Open Source)
- Python SDK (`litellm` package).
- Proxy server (core gateway functionality).
- Virtual keys, budgets, cost tracking.
- Routing, fallbacks, load balancing.
- Model aliases.
- Guardrail framework (Presidio, custom guardrails).
- Caching (exact and semantic).
- Observability callbacks.
- SSO for up to 5 users.

### Enterprise Tier (Proprietary, Paid)
- **Okta/Google SSO** for unlimited users.
- **Granular RBAC** — fine-grained role-based access control.
- **Audit logs** — compliance-grade logging.
- **Enterprise support** — SLA-backed support.
- **Priority features** — custom development.

### Enterprise Pricing
- Basic: ~$250/month.
- Premium: ~$30,000/year (~$2,500/month) — adds priority SLA, dedicated
  account management, custom feature development, compliance certification
  assistance (SOC2, HIPAA).
- Pricing is based on annual gateway request capacity, not per-token.

---

## Adoption

Used by Netflix, Adobe, Stripe, Lemonade, and many others. Over 1 billion
requests served through the platform.

---

## Key Findings

1. **MIT core is genuinely comprehensive** — virtual keys, budgets, routing,
   fallbacks, caching, guardrails, and observability are all in the open-source
   version.
2. **Enterprise upsell is governance-focused** — SSO, RBAC, audit logs. These
   are important for regulated enterprises but not blocking for initial
   adoption.
3. **Rust rewrite** — the 2026 Rust core suggests strong investment in
   performance and throughput.
4. **PostgreSQL required** — for any meaningful deployment beyond basic
   proxying.
5. **Semantic caching is a differentiator** — 30-60% cost reduction claims are
   significant if validated.

---

## Open Questions

- [ ] What is the actual performance overhead of the proxy (latency added per
      request)?
- [ ] How does the Rust core interact with the Python SDK? Is the Python layer
      still in the request path?
- [ ] What is the upgrade path from OSS to Enterprise? Is it a license key
      change or a different binary?
- [ ] How does semantic caching handle cache invalidation when the underlying
      model changes?
- [ ] What is the HA/clustering story — can multiple proxy instances share a
      PostgreSQL backend for horizontal scaling?
- [ ] How does LiteLLM compare to alternatives like Portkey, Helicone, or
      TrueFoundry for the gateway role?

---

*Last updated: 2026-08-13*
*STATUS: DEEP RESEARCH — substantive findings from web research, deployment testing pending*
