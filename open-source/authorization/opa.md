# Open Policy Agent (open-policy-agent/opa)

**STATUS: NOT STARTED**
**License:** Apache 2.0
**CNCF Status:** Graduated
**Repository:** https://github.com/open-policy-agent/opa

---

## Overview

OPA is a general-purpose policy engine that decouples authorization decisions from
application code. Unlike Zanzibar-based systems (OpenFGA, SpiceDB) which model
authorization as a relationship graph, OPA evaluates policies written in Rego --
a declarative language designed for structured data evaluation.

---

## Key Characteristics

### Rego Policy Language

Rego is a declarative query language designed for evaluating structured data (JSON).
Policies are rules that take input (request context), combine it with external data,
and return a structured decision. Policies are testable, version-controllable, and
auditable.

### Authorization Model: ABAC / Data-Driven

OPA is fundamentally attribute-based:
- Evaluates user attributes, resource attributes, action type, and environment
- Can implement RBAC by treating roles as attributes
- Can approximate ReBAC but does not natively store a relationship graph
- Policies are stateless functions -- OPA does not maintain authorization state

### Different Model Than Zanzibar

This is the critical distinction:
- **Zanzibar (OpenFGA/SpiceDB):** "Does a path exist in the relationship graph
  from user to resource?" -- stores relationships, traverses graphs
- **OPA:** "Do the attributes of this request satisfy the policy rules?" --
  evaluates rules against input data, stateless

### Primary Use Cases

- Kubernetes admission control (most common deployment)
- API gateway authorization
- Infrastructure policy (Terraform, CI/CD)
- Microservice authorization
- Data filtering policies

---

## When OPA Makes Sense vs Zanzibar

| Scenario | Better Fit |
|----------|------------|
| Per-resource sharing (Google Drive style) | Zanzibar (OpenFGA/SpiceDB) |
| Infrastructure policy enforcement | OPA |
| Kubernetes admission control | OPA |
| Agent delegation chains | Zanzibar (OpenFGA) |
| Attribute-based rules (time, IP, department) | OPA (or OpenFGA conditions) |
| Multi-tenant SaaS with deep hierarchy | Zanzibar |

For an AI platform with agent delegation, Zanzibar is the stronger fit for core
authorization. OPA could complement it for infrastructure-level policy enforcement
(e.g., "which models can be deployed to production").

---

## Key Questions

- [ ] Is OPA needed alongside OpenFGA, or can OpenFGA conditions handle all ABAC
      scenarios?
- [ ] Should infrastructure policies (deployment, model access) use OPA while
      application authorization uses OpenFGA?
- [ ] What is the operational overhead of running both systems?

---

## References

- OPA GitHub: https://github.com/open-policy-agent/opa
- OPA Documentation: https://www.openpolicyagent.org/docs/latest/
- Rego Language: https://www.openpolicyagent.org/docs/latest/policy-language/
