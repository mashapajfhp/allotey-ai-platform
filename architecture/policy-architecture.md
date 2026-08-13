# Policy Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Purpose

Defines the architecture for policy evaluation in the platform — the rules and constraints that govern system behavior beyond relationship-based authorization. This is SEPARATE from authorization (OpenFGA) and SEPARATE from the Domain Ontology's business rules.

---

## The Problem: Not Every Policy Is a Relationship

OpenFGA (see `architecture/authorization-architecture.md`) solves relationship-based authorization:

```
RELATIONSHIP-BASED (OpenFGA handles this):
    "Alice can view Object X because Alice belongs to Group Y"
    "Jane can approve this PO because Jane is a manager AND is the PO owner"
    "Agent can use tool T because Agent is registered for capability C"
```

But not every policy is a relationship. Consider:

```
ATTRIBUTE-BASED (OpenFGA does NOT handle this):
    "amount > 10000 AND country = AE AND risk_score > 70 → require second approval"
    "If the user has made > 5 requests in the last minute → rate limit"
    "If data classification = PII AND destination = external → block transfer"
    "If agent confidence < 0.6 → require human review before action"
```

```
DOMAIN CONSTRAINTS (OpenFGA does NOT handle this):
    "An employee cannot approve their own expense report"
    "Leave balance cannot go negative for leave type = annual"
    "A purchase order requires at least two quotes above $50,000"
```

These are three distinct types of governance, and the platform needs all three.

---

## The Four-Layer Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: IDENTITY (Authentication)                                │
│                                                                     │
│  WHO is making this request?                                        │
│  - User identity (SSO, OAuth, API key)                              │
│  - Agent identity (registered agent with capabilities)              │
│  - Service identity (SPIFFE/SPIRE workload identity)                │
│                                                                     │
│  Technologies: OIDC providers, SPIFFE/SPIRE                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ identity established
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: RELATIONSHIP AUTHORIZATION (ReBAC — OpenFGA)             │
│                                                                     │
│  CAN this identity perform this action on this resource?            │
│  - Relationship traversal: user → group → role → permission         │
│  - Agent delegation: agent inherits user permissions                │
│  - Tenant isolation: identity scoped to tenant                      │
│  - Resource-level access: "can user view this specific document?"   │
│                                                                     │
│  Technologies: OpenFGA (adopted)                                    │
│  See: architecture/authorization-architecture.md                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ authorized
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: POLICY EVALUATION (ABAC / Rule-Based — OPA or Cedar)     │
│                                                                     │
│  SHOULD this action proceed given the current context?              │
│  - Attribute-based rules: amount, risk, classification, confidence  │
│  - Rate limiting policies                                           │
│  - Data governance policies (PII handling, data residency)          │
│  - AI safety policies (confidence thresholds, human review triggers)│
│  - Compliance policies (regulatory constraints)                     │
│  - Cost policies (budget thresholds, approval escalation)           │
│                                                                     │
│  Technologies: OPA (Apache 2.0), Cedar (Apache 2.0)                │
│  THIS DOCUMENT focuses on this layer.                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ policy allows
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 4: DOMAIN CONSTRAINTS (Ontology Rules)                      │
│                                                                     │
│  IS this action valid according to business rules?                  │
│  - Entity validation: "leave balance cannot go negative"            │
│  - Process rules: "cannot self-approve expense reports"             │
│  - Business constraints: "orders > $50K need two quotes"            │
│  - State machine rules: "cannot ship before payment received"       │
│                                                                     │
│  Technologies: Custom ontology rules (built into Domain Ontology)   │
│  See: architecture/ontology-architecture.md                         │
└─────────────────────────────────────────────────────────────────────┘
```

### How the Layers Interact

Every action flows through all four layers. If any layer rejects, the action does not proceed.

```
Request arrives
    │
    ▼
LAYER 1: Who is this? → Identity resolved (or rejected: 401)
    │
    ▼
LAYER 2: Can they do this? → Authorization checked (or rejected: 403)
    │
    ▼
LAYER 3: Should this proceed? → Policies evaluated (or rejected: 403 with reason)
    │
    ▼
LAYER 4: Is this valid? → Domain rules checked (or rejected: 422 with violations)
    │
    ▼
ACTION EXECUTES
```

---

## Layer 3: Policy Evaluation (Detailed)

### Policy Categories

#### 1. Data Governance Policies
```
POLICY: data_classification_transfer
WHEN: data.classification = "PII" AND action.destination = "external"
THEN: DENY
REASON: "PII data cannot be transferred to external systems"

POLICY: data_residency
WHEN: data.origin_region = "EU" AND action.target_region != "EU"
THEN: DENY
REASON: "EU-origin data must remain in EU region (GDPR)"
```

#### 2. AI Safety Policies
```
POLICY: low_confidence_review
WHEN: agent.confidence_score < 0.6 AND action.type = "modify"
THEN: REQUIRE_HUMAN_REVIEW
REASON: "Low-confidence modifications require human approval"

POLICY: high_stakes_action
WHEN: action.financial_impact > 10000 AND action.type = "approve"
THEN: REQUIRE_SECOND_APPROVAL
REASON: "High-value approvals require dual authorization"
```

#### 3. Rate Limiting Policies
```
POLICY: user_rate_limit
WHEN: user.requests_last_minute > 60
THEN: THROTTLE
REASON: "User rate limit exceeded"

POLICY: agent_cost_limit
WHEN: agent.daily_token_spend > budget.daily_limit
THEN: DENY
REASON: "Agent daily token budget exceeded"
```

#### 4. Compliance Policies
```
POLICY: financial_approval_threshold
WHEN: amount > 10000 AND country = "AE" AND risk_score > 70
THEN: REQUIRE_COMPLIANCE_REVIEW
REASON: "High-risk high-value transactions require compliance review"

POLICY: audit_trail_requirement
WHEN: action.type IN ("delete", "modify") AND resource.type = "financial_record"
THEN: REQUIRE_AUDIT_LOG_ENRICHMENT
REASON: "Financial record modifications require enhanced audit trail"
```

#### 5. Operational Policies
```
POLICY: maintenance_window
WHEN: current_time IN maintenance_schedule AND action.type = "deploy"
THEN: DENY
REASON: "Deployments blocked during maintenance window"

POLICY: circuit_breaker
WHEN: service.error_rate_5m > 0.5
THEN: DENY_NEW_REQUESTS
REASON: "Service error rate too high — circuit breaker open"
```

---

## Boundaries Between Layers

Understanding what belongs WHERE is critical to avoid confusion:

| Question | Layer | Technology |
|----------|-------|-----------|
| Is this user who they claim to be? | Identity | OIDC, SPIFFE |
| Can this user access this resource? | Authorization | OpenFGA |
| Can this agent use this tool? | Authorization | OpenFGA |
| Is this request within rate limits? | Policy | OPA/Cedar |
| Does this data transfer comply with GDPR? | Policy | OPA/Cedar |
| Should low-confidence results be auto-approved? | Policy | OPA/Cedar |
| Can an employee approve their own expense? | Domain Constraint | Ontology Rules |
| Is this leave request valid given the balance? | Domain Constraint | Ontology Rules |
| Does this order meet the two-quote requirement? | Domain Constraint | Ontology Rules |

### Anti-Patterns to Avoid

1. **Encoding business rules in OPA/Cedar** — "leave balance cannot go negative" belongs in the Domain Ontology, not the policy engine. Policy engines evaluate contextual conditions; domain rules enforce business invariants.

2. **Encoding policy rules in OpenFGA** — "amount > 10000 → second approval" is not a relationship. Do not try to model attribute-based rules as relationships. OpenFGA is for "who can access what," not "under what conditions."

3. **Encoding authorization in the application** — if the application is checking "can user X do Y," that check belongs in OpenFGA, not in application code or policy rules.

4. **Duplicating rules across layers** — each rule should live in exactly one layer. If a rule appears in both OpenFGA and OPA, there is a design error.

---

## Technology Comparison: OPA vs. Cedar

### OPA (Open Policy Agent)

**License:** Apache 2.0
**Language:** Rego (custom policy language)
**CNCF status:** Graduated
**Strengths:**
- Extremely mature and battle-tested
- Huge community and ecosystem
- Works with any data format
- Flexible — can express almost any policy
- Well-integrated with Kubernetes, Envoy, and cloud infrastructure

**Weaknesses:**
- Rego is a custom language with a learning curve
- Policies can become complex and hard to audit
- No built-in concept of "principal" and "resource" — everything is data

### Cedar

**License:** Apache 2.0
**Language:** Cedar (purpose-built policy language by AWS)
**Origin:** Amazon Verified Permissions
**Strengths:**
- Designed specifically for authorization and policy
- Built-in concepts of principal, action, resource
- Formal verification — policies can be mathematically proven correct
- Cleaner syntax than Rego for access control policies
- Designed to complement relationship-based systems (like OpenFGA)

**Weaknesses:**
- Newer and less mature than OPA
- Smaller community
- Tighter scope — less general-purpose than OPA
- AWS origin may affect community dynamics

### Research Decision Needed

Both OPA and Cedar are Apache 2.0 and viable. The choice depends on:
- Whether formal verification of policies is important
- Whether the Rego vs. Cedar language is a better fit for policy authors
- Whether the OPA ecosystem (Kubernetes, Envoy, etc.) provides value
- Whether Cedar's authorization-native design complements OpenFGA better

---

## Integration with Platform Architecture

### Policy Decision Points

Policies must be evaluated at multiple points in the platform:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI GATEWAY                                    │
│  Policy checks:                                                  │
│  - Rate limiting                                                 │
│  - Cost budget enforcement                                       │
│  - Request classification policies                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AGENT RUNTIME                                    │
│  Policy checks:                                                  │
│  - AI safety policies (confidence thresholds)                    │
│  - Tool invocation policies                                      │
│  - Human review triggers                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                ACTION ENGINE                                     │
│  Policy checks:                                                  │
│  - Data governance (PII, classification, residency)              │
│  - Compliance policies                                           │
│  - Financial threshold policies                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATA INGESTION / EGRESS                             │
│  Policy checks:                                                  │
│  - Data transfer policies                                        │
│  - Data residency enforcement                                    │
│  - Classification-based access                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Policy as Code

All policies should be:
- **Version-controlled** — policies are code, stored in git
- **Testable** — every policy has test cases
- **Auditable** — policy changes are tracked and reviewed
- **Deployable** — policies are deployed through CI/CD, not edited in production

---

## Research Questions

1. **OPA vs. Cedar:** Which is the better fit for the platform's policy needs? Can they coexist?
2. **Policy authoring:** Who writes policies? Security team? Platform team? Domain experts? What tooling supports non-technical policy authors?
3. **Performance:** What is the latency of policy evaluation per request? Can policies be evaluated in < 1ms?
4. **Policy testing:** How are policies tested before deployment? What test frameworks exist?
5. **Interaction with OpenFGA:** How do policy evaluation results interact with authorization decisions? Is there a combined decision point?
6. **V1 scope:** Can V1 start with hardcoded policy rules and introduce OPA/Cedar in V2?
7. **Ontology integration:** How do Layer 4 domain constraints relate to the Domain Ontology's rule system?

---

## References

- `architecture/authorization-architecture.md` — Layer 2 (OpenFGA, ReBAC)
- `architecture/ontology-architecture.md` — Layer 4 (domain constraints)
- `architecture/security-threat-model.md` — threats addressed by policies
- `architecture/reference-architecture.md` — AI Gateway, governance
- `open-source/authorization/opa.md` — OPA research
- `open-source/authorization/openfga.md` — OpenFGA research (Layer 2)
