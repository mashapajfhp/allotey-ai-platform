# Model Gateway Comparison

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Purpose

Evaluate approaches for abstracting LLM providers behind a unified interface with routing, fallbacks, cost tracking, and governance.

## Options

| Feature | LiteLLM | Portkey | Custom Gateway |
|---------|---------|---------|----------------|
| License | MIT (core) | Proprietary | N/A |
| Provider coverage | 100+ | 100+ | As built |
| Routing/fallbacks | Yes | Yes | As built |
| Load balancing | Yes | Yes | As built |
| Cost tracking | Yes | Yes | As built |
| Virtual keys | Yes | Yes | As built |
| Budgets/limits | Yes | Yes | As built |
| Caching | Yes | Yes | As built |
| Guardrails | Yes | Yes | As built |
| Multi-tenancy | Via virtual keys | Yes | As built |
| Self-hostable | Yes (proxy) | Limited | Yes |
| Maturity | Production (3+ years) | Production | N/A |

## Assessment

**LiteLLM** is the clear choice:
- MIT license for core functionality
- Broadest provider coverage
- Active development and large community
- Self-hostable proxy mode
- Virtual keys enable per-tenant cost tracking

**Concerns to investigate:**
- What features are MIT vs. enterprise-licensed?
- How does LiteLLM's proxy architecture handle high-throughput multi-tenant workloads?
- What is the operational overhead of running LiteLLM as a proxy?

**Recommendation:** Wrap LiteLLM — use its provider abstraction, wrap with platform-specific routing, budget, and tenant isolation logic.
