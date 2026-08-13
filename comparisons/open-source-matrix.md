# Open-Source Technology Matrix

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

## Scoring Framework

Each technology is scored 1-5 on key dimensions. Scores must be justified — do not select based on arithmetic alone.

| Score | Meaning |
|-------|---------|
| 1 | Poor / Not applicable |
| 2 | Below average / Significant gaps |
| 3 | Adequate / Meets basic needs |
| 4 | Good / Meets most needs well |
| 5 | Excellent / Best-in-class |

---

## Ontology / Context Category

| Dimension | Semantica | TrustGraph | Graphiti | TypeDB | TerminusDB |
|-----------|-----------|------------|---------|--------|------------|
| Architecture fit | 4 | 3 | 4 | 4 | 3 |
| Maturity | 2 | 2 | 3 | 4 | 3 |
| Community | 2 | 2 | 3 | 3 | 2 |
| Documentation | 2 | 2 | 3 | 4 | 3 |
| Enterprise readiness | 1 | 1 | 2 | 3 | 2 |
| Multi-tenancy | 1 | 2 | 2 | 2 | 2 |
| MCP support | 3 | 2 | 3 | 1 | 1 |
| License friendliness | NEEDS VERIFICATION | NEEDS VERIFICATION | MIT | MPL-2.0 | Apache 2.0 |

**Key observations:**
- **Graphiti** has the best temporal knowledge graph model — temporal facts with provenance are architecturally important
- **TypeDB** has the most rigorous type system — useful for ontology definition if operational complexity is acceptable
- **Semantica** has interesting decision intelligence concepts but is early-stage
- None of these are production-ready for enterprise use — expect to build on concepts, not adopt directly

---

## Semantic Layer Category

| Dimension | Cube | Rill |
|-----------|------|------|
| Architecture fit | 5 | 3 |
| Maturity | 5 | 3 |
| Community | 5 | 3 |
| Documentation | 5 | 3 |
| Enterprise readiness | 4 | 3 |
| Multi-tenancy | 4 | 2 |
| Security context | 4 | 2 |
| API quality | 5 | 3 |
| License friendliness | Apache 2.0 (mostly) | Apache 2.0 |

**Key observations:**
- **Cube** is the clear leader — production-ready, well-documented, strong semantic model
- Cube's multi-tenancy via security context is a good fit
- Cube should likely be **wrapped** (adopted with platform-specific integration) rather than used as-is
- Rill is interesting for embedded analytics but not a semantic layer replacement

---

## Agent Runtime Category

| Dimension | LangGraph | Google ADK | Agno | Strands | MS Agent Framework |
|-----------|-----------|------------|------|---------|-------------------|
| Architecture fit | 4 | 4 | 5 | 3 | 4 |
| Maturity | 4 | 3 | 3 | 2 | 2 |
| Community | 5 | 3 | 4 | 2 | 2 |
| Documentation | 4 | 3 | 4 | 2 | 2 |
| Enterprise readiness | 3 | 3 | 3 | 2 | 2 |
| Multi-tenancy | 2 | 2 | 3 | 2 | 2 |
| Human-in-the-loop | 4 | 3 | 4 | 2 | 3 |
| MCP support | 3 | 4 | 4 | 3 | 3 |
| A2A support | 2 | 4 | 3 | 2 | 2 |
| TypeScript support | 3 | 3 | 2 (Python-first) | 3 | 3 |
| License friendliness | MIT | Apache 2.0 | Apache 2.0 | Apache 2.0 | MIT |

**Key observations:**
- **LangGraph** has the largest community and most production use
- **Agno** has the richest feature set (teams, workflows, memory, knowledge, RBAC)
- **Google ADK** has the best multi-agent workflow patterns and A2A/MCP support
- No single runtime is ideal — likely need to wrap one with platform integrations
- NEEDS VERIFICATION: Latest status of all runtimes — this space moves fast

---

## Model Gateway Category

| Dimension | LiteLLM |
|-----------|---------|
| Architecture fit | 5 |
| Maturity | 4 |
| Community | 5 |
| Documentation | 4 |
| Enterprise readiness | 3 |
| Multi-tenancy | 3 (virtual keys) |
| Provider coverage | 5 (100+ providers) |
| Cost tracking | 4 |
| License friendliness | MIT (core) — VERIFY enterprise features |

**Key observations:**
- LiteLLM is the clear choice for model abstraction
- Core is MIT; some enterprise features may have different licensing — NEEDS VERIFICATION
- Should be **wrapped** with platform-specific routing, budgeting, and tenant logic

---

## Authorization Category

| Dimension | OpenFGA | SpiceDB | OPA |
|-----------|---------|---------|-----|
| Architecture fit | 5 | 5 | 3 |
| Maturity | 4 | 4 | 5 |
| Community | 4 | 3 | 5 |
| Documentation | 4 | 3 | 4 |
| Model type | ReBAC (Zanzibar) | ReBAC (Zanzibar) | ABAC (Rego) |
| Multi-tenancy | 4 | 3 | 3 |
| Performance | 4 | 4 | 4 |
| Contextual tuples | Yes | Yes | N/A (different model) |
| License friendliness | Apache 2.0 | Apache 2.0 | Apache 2.0 |

**Key observations:**
- **OpenFGA** and **SpiceDB** are both strong Zanzibar implementations
- ReBAC is a better fit than ABAC for the platform's authorization needs (relationship-based data access)
- OPA is complementary — useful for policy enforcement, not a replacement for ReBAC
- OpenFGA has slightly better documentation and CNCF backing

---

## Observability Category

| Dimension | Langfuse | Arize Phoenix | OpenTelemetry |
|-----------|---------|---------------|---------------|
| Architecture fit | 4 | 3 | 5 (foundational) |
| Maturity | 3 | 3 | 5 |
| AI-specific features | 5 | 4 | 1 (needs extension) |
| Prompt management | 4 | 2 | 0 |
| Evaluation | 4 | 3 | 0 |
| Cost tracking | 4 | 2 | 0 |
| Self-hostable | Yes | Yes | Yes |
| License friendliness | MIT (core), EE separate | Apache 2.0 | Apache 2.0 |

**Key observations:**
- **OpenTelemetry** should be the foundation — all components emit OTel telemetry
- **Langfuse** adds AI-specific observability on top (traces, evals, prompts, cost)
- Architecture: OTel for infrastructure, Langfuse for AI-specific concerns
- NEEDS VERIFICATION: Langfuse EE vs. core feature split

---

## Workflow Category

| Dimension | Temporal | Inngest | Restate |
|-----------|----------|---------|---------|
| Architecture fit | 5 | 4 | 4 |
| Maturity | 5 | 3 | 2 |
| Community | 5 | 3 | 2 |
| Operational complexity | 2 (complex) | 4 (simpler) | 3 |
| Human-in-the-loop | 4 | 3 | 3 |
| Self-hostable | Yes (complex) | Yes | Yes |
| License friendliness | MIT | 1 (SSPL) — EXCLUDED | 1 (BSL 1.1) — EXCLUDED |

**Key observations:**
- **Temporal** (MIT) is the only viable open-source durable workflow engine. ADOPT.
- **Inngest** (SSPL) — EXCLUDED. Cannot use in SaaS without full source disclosure of entire service stack.
- **Restate** (BSL 1.1) — EXCLUDED. NOT open source until conversion date (typically 4 years after release).
- V1 decision: Temporal is the sole workflow engine despite operational complexity.

---

## Emerging Platforms Category

| Dimension | Xpert | Dify | Wanwu | OpenFang | Agnt | Compozy |
|-----------|-------|------|-------|----------|------|---------|
| Architecture fit | 4 | 3 | 3 | 2 | 2 | 3 |
| Maturity | 3 | 4 | 2 | 1 | 1 | 1 |
| License friendliness | 1 (AGPL) | 2 (custom) | NEEDS VERIFICATION | NEEDS VERIFICATION | NEEDS VERIFICATION | NEEDS VERIFICATION |

**Key observations:**
- **Xpert** is architecturally interesting (Agentic BI) but AGPL-3.0 makes it study-only
- **Dify** has broad adoption but custom license requires careful review
- Most emerging platforms are too immature for critical dependencies
- Study all of them for concepts; adopt none without thorough maturity evaluation
