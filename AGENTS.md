# AGENTS.md — Guidelines for Coding Agents and Contributors

This document governs how both human developers and AI coding agents interact with this repository and any future implementation repositories derived from it.

## Mandatory Rules

### 1. Research Before Architecture

Read the relevant research files in this repository before making architecture changes. Do not propose foundational changes that contradict conclusions documented here without first updating the research and creating an ADR.

### 2. No Unvetted Dependencies

Never introduce a major dependency without checking:
- `comparisons/` — for alternatives analysis
- `licensing/` — for license compatibility
- `github/priority-repositories.md` — for maturity assessment

A "major dependency" is anything that touches data flow, agent execution, authorization, storage, or observability.

### 3. No Commercial Code Copying

Never copy source code from commercial platforms (Palantir, Databricks, Snowflake, Microsoft, AWS, Google, Salesforce). Architectural concepts and published API patterns may be studied. Implementation must be original or derived from properly-licensed open source.

### 4. Respect Open-Source Licenses

- Read actual LICENSE files — do not infer compatibility
- AGPL, SSPL, BSL, and custom licenses require explicit review before any use beyond study
- "Architecture research" does not create a license obligation; code copying does
- When in doubt, treat as restrictive

### 5. Interfaces Over Vendor Coupling

Prefer interfaces and abstractions over tight coupling to any specific vendor, framework, or model provider. Every infrastructure component should be replaceable.

### 6. Product Agnosticism Is Non-Negotiable

Treat product agnosticism as a non-negotiable architecture constraint. The core platform must not contain assumptions about any specific application domain, workflow, entity type, industry, or product. Domain-specific concepts must enter only through explicit extension mechanisms such as domain packs, ontology definitions, semantic models, tools, policies, agents, workflows, and connectors.

The platform should be capable of supporting radically different domains without modifying core infrastructure. If adding a new domain requires changing the core platform, treat that as an architectural smell and investigate whether an abstraction is missing.

The long-term objective is not a reusable AI library. It is an enterprise-grade AI platform with its own defensible IP, capable of powering multiple independent products through stable APIs, SDKs, protocols, schemas, governance, and extension points.

**Enterprise-grade does not mean "lots of microservices."** It means predictable contracts, isolation, governance, security, lifecycle management, observability, upgradeability, extensibility, reliability, and evidence that the platform behaves correctly. Keep the implementation simple initially while making the abstractions enterprise-grade from the beginning.

### 7. Validate Architecture Against Product Agnosticism

Every major architecture choice must be validated against five questions:

1. **Domain independence** — can this work without knowing the business domain?
2. **Multi-product isolation** — can different products use the same platform without leaking data, policies, models, agents, or configuration into one another?
3. **Extensibility** — can a new domain be added through configuration/packages rather than core changes?
4. **Enterprise governance** — does the abstraction preserve identity, authorization, audit, provenance, tenancy, cost controls, versioning, and lifecycle management?
5. **Platform substitutability** — can applications consume the capability through stable interfaces without caring whether the underlying implementation changes?

If any answer is "no," the design needs revision before proceeding.

### 8. Separate Domain From Infrastructure

Domain concepts (ontology, business rules, metrics) must not be embedded in infrastructure code. Infrastructure (databases, queues, runtimes) must not leak domain semantics.

### 9. Tenant Isolation Is Non-Negotiable

Every data path, every query, every agent execution, every tool invocation must respect tenant boundaries. Cross-tenant data leakage is a critical security failure.

### 10. Every AI Action Must Be Auditable

All agent actions, tool invocations, recommendations, and decisions must produce audit records that include:
- Who initiated the action (user identity)
- What agent performed it
- What tools were called
- What data was accessed
- What model produced the output
- What the outcome was
- Timestamp and correlation ID

### 11. LLMs Are Replaceable Infrastructure

Treat language models as interchangeable compute resources behind a gateway. Never architect the system around a specific model's capabilities. Never store critical state inside model context alone.

### 12. LLMs Are Not Sources of Truth

An LLM must never be the authoritative source for:
- Permissions or access control decisions
- Business metric definitions
- Policy enforcement
- Financial calculations
- Compliance determinations

These must come from deterministic, versioned, governed systems.

### 13. Authorization Before Tool Execution

No tool may execute without verifying that:
- The requesting user has permission for the action
- The requesting agent has permission to use the tool
- The tool's scope is within the user's authorized data boundary
- The action has been approved (if approval is required)

### 14. Provenance for Recommendations and Decisions

Every recommendation or decision the platform produces must carry provenance:
- What evidence was used
- What model produced it
- What semantic definitions were active
- What tools were called
- Who authorized the action
- What confidence level applies

### 15. Reasoning Workflows vs. Durable Workflows

Distinguish between:
- **Reasoning workflows**: Agent thought chains, tool selection, multi-step reasoning (ephemeral, restartable)
- **Durable workflows**: Business processes with long-running state, human approvals, deterministic replay (persistent, at-least-once Activity execution — Activities must be idempotent)

These require different runtime infrastructure. Do not conflate them.

### 16. No Premature Microservices

Start with well-separated modules in a minimal number of deployable units. Extract into separate services only when:
- Independent scaling is required
- Independent deployment is required
- Team boundaries demand it
- A clear, stable interface exists

### 17. Document Decisions With ADRs

Every significant architectural decision must be recorded as an Architecture Decision Record in `decisions/`. Use the template at `decisions/ADR-000-template.md`.

## Research-Specific Rules

When conducting research in this repository:

- Record the date, source, and version of everything examined
- Distinguish between stable features and experimental features
- Note deprecated projects and their successors
- Use `STATUS:` markers consistently (NOT STARTED, IN RESEARCH, INITIAL REVIEW COMPLETE, DEEP REVIEW COMPLETE, NEEDS VERIFICATION)
- Do not present research as complete when it is not
- Update `RESEARCH_STATUS.md` after every research session
- Log every session in `research-log/`

## Scoring Framework

When evaluating technologies, use the standardized scoring framework (1-5 scale) defined in `comparisons/`. Important scores must include written justification. Do not select technologies based on arithmetic alone.
