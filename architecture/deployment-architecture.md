# Deployment Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Principles

1. **Start monolithic, extract when justified** — begin with a minimal number of deployable units
2. **Cloud-portable** — no hard dependency on a specific cloud provider
3. **Self-hostable** — customers should be able to run the platform on their infrastructure
4. **Observable** — every component emits telemetry
5. **Secure by default** — least-privilege, network isolation, encrypted at rest and in transit

## Initial Deployment Topology (Suggested)

```
┌─────────────────────────────┐
│     API / Gateway Service   │  ← Single entry point
├─────────────────────────────┤
│     Agent Runtime Service   │  ← Agent execution
├─────────────────────────────┤
│     Workflow Service        │  ← Temporal/Inngest workers
├─────────────────────────────┤
│     Model Gateway (LiteLLM) │  ← LLM provider abstraction
└─────────────────────────────┘

Data stores (managed or self-hosted):
├── PostgreSQL (transactional)
├── ClickHouse (analytical)
├── Vector DB (embeddings)
├── Redis (caching, sessions)
└── Object Storage (documents)
```

This is NOT a microservices architecture. It is a small number of focused services that can be split further when scaling demands it.

## Research Questions

- Kubernetes vs. simpler container orchestration?
- How should multi-tenant deployment work? Shared infrastructure with logical isolation? Or physical isolation for enterprise customers?
- Where does the authorization service run? Sidecar? Centralized?
- How are model gateway instances scaled (GPU considerations)?

## Anti-Patterns to Avoid

- Premature microservices — don't split until there's a concrete scaling or deployment reason
- Cloud-native lock-in — don't use cloud-specific services when portable alternatives exist
- Infrastructure-as-code gaps — everything should be reproducible from code
