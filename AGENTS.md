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

### 6. Separate Domain From Infrastructure

Domain concepts (ontology, business rules, metrics) must not be embedded in infrastructure code. Infrastructure (databases, queues, runtimes) must not leak domain semantics.

### 7. Tenant Isolation Is Non-Negotiable

Every data path, every query, every agent execution, every tool invocation must respect tenant boundaries. Cross-tenant data leakage is a critical security failure.

### 8. Every AI Action Must Be Auditable

All agent actions, tool invocations, recommendations, and decisions must produce audit records that include:
- Who initiated the action (user identity)
- What agent performed it
- What tools were called
- What data was accessed
- What model produced the output
- What the outcome was
- Timestamp and correlation ID

### 9. LLMs Are Replaceable Infrastructure

Treat language models as interchangeable compute resources behind a gateway. Never architect the system around a specific model's capabilities. Never store critical state inside model context alone.

### 10. LLMs Are Not Sources of Truth

An LLM must never be the authoritative source for:
- Permissions or access control decisions
- Business metric definitions
- Policy enforcement
- Financial calculations
- Compliance determinations

These must come from deterministic, versioned, governed systems.

### 11. Authorization Before Tool Execution

No tool may execute without verifying that:
- The requesting user has permission for the action
- The requesting agent has permission to use the tool
- The tool's scope is within the user's authorized data boundary
- The action has been approved (if approval is required)

### 12. Provenance for Recommendations and Decisions

Every recommendation or decision the platform produces must carry provenance:
- What evidence was used
- What model produced it
- What semantic definitions were active
- What tools were called
- Who authorized the action
- What confidence level applies

### 13. Reasoning Workflows vs. Durable Workflows

Distinguish between:
- **Reasoning workflows**: Agent thought chains, tool selection, multi-step reasoning (ephemeral, restartable)
- **Durable workflows**: Business processes with long-running state, human approvals, guaranteed completion (persistent, exactly-once)

These require different runtime infrastructure. Do not conflate them.

### 14. No Premature Microservices

Start with well-separated modules in a minimal number of deployable units. Extract into separate services only when:
- Independent scaling is required
- Independent deployment is required
- Team boundaries demand it
- A clear, stable interface exists

### 15. Document Decisions With ADRs

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
