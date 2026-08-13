# OpenFGA (openfga/openfga)

**STATUS: RESEARCH COMPLETE**
**License:** Apache 2.0
**CNCF Status:** Sandbox project (graduated from Auth0/Okta)
**Repository:** https://github.com/openfga/openfga

---

## Overview

OpenFGA is a high-performance authorization engine implementing Google's Zanzibar
relationship-based access control model. It stores authorization data as relationship
tuples and evaluates permission checks by traversing the resulting relationship graph.
Originally developed at Auth0 (now Okta), it was donated to the CNCF as a sandbox
project and has become one of the most widely adopted open-source fine-grained
authorization systems.

---

## Core Concepts

### The Zanzibar Model

Google's Zanzibar paper (2019) describes a global authorization system used internally
by Drive, YouTube, Calendar, and Cloud. The core idea: store all authorization facts
as `(object, relation, user)` tuples and answer "does user U have relation R on
object O?" by graph traversal.

OpenFGA faithfully implements this model with some extensions (conditions, contextual
tuples) that add ABAC-like capabilities on top of the pure relationship graph.

### Relationship Tuples

The fundamental unit of authorization data. Examples:
- `user:carla` is `owner` of `document:q3_budget`
- `team:engineering` is `member` of `organization:acme`
- `user:bob` is `viewer` of `folder:shared`

Tuples are stored persistently and form the graph that OpenFGA traverses during
permission checks. They are the "facts" of the authorization system.

### Authorization Model (Type System)

The model defines types, relations, and permissions using the OpenFGA DSL:

```
model
  schema 1.1

type user

type document
  relations
    define owner: [user]
    define editor: [user, team#member] or owner
    define viewer: [user, team#member] or editor
```

This is a typed schema where relations can compose (viewer includes editor, which
includes owner). The model is versioned -- you can update it without losing tuples.

### Object Hierarchy

Relations can reference other objects' relations, enabling hierarchy:
- A folder's viewer relation can include all viewers of its parent folder
- An organization's admin can inherit permissions across all its projects
- Nested groups and teams compose naturally through relation chaining

This eliminates the "role explosion" problem of traditional RBAC while keeping
per-resource granularity like ACLs.

---

## Advanced Features

### Contextual Tuples

Tuples that exist only for the duration of a single API request. They are not
persisted but are evaluated as if they exist during that specific check. Use cases:
- Temporary elevated access ("user has admin for this request because they hold
  a valid MFA token")
- Request-scoped context ("user is accessing from a trusted IP range")
- Testing authorization scenarios without writing persistent data

### Conditional Tuples (Conditions)

Conditions add ABAC-like context-aware rules to relationships:
- Grant access only during business hours
- Allow access only from specific IP ranges
- Time-bound permissions (access expires after a date)

Conditions are defined in the authorization model and evaluated at check time
against context provided in the request. This bridges ReBAC and ABAC without
requiring a separate policy engine.

### Tenant Isolation

For multi-tenant SaaS, OpenFGA supports:
- **Stores:** Isolated authorization data per tenant (separate tuple spaces)
- **Organization context:** Users belonging to multiple orgs only see resources
  when they set a specific org in their current context
- **Hierarchical isolation:** Parent org admins can access child org resources
  through relation chaining

### Stores

A store is a logically isolated authorization data container. Each store has its
own authorization model and tuples. Multi-tenant platforms typically use one store
per tenant or a shared store with organization-scoped relations.

---

## AI Agent Authorization

**STATUS: ACTIVELY DEVELOPED (2025-2026)**

OpenFGA has first-class documentation for AI agent authorization patterns. Key
design principles:

### Agents as First-Class Principals

Agents appear on the left side of tuples just like users:
- `agent:summarizer` is `can_read` of `document:report`
- `agent:code_assistant` is `can_execute` of `tool:run_tests`

All standard APIs (Check, ListObjects, ListUsers) work on agent identities.

### Delegated Authorization

Relations like `can_act_on_behalf_of` make delegation explicit and revocable:
- `agent:assistant` is `can_act_on_behalf_of` `user:alice`
- The agent inherits Alice's permissions but only those explicitly delegated
- Delegation can be scoped (agent can read but not write on Alice's behalf)
- Revocation is instant -- delete the delegation tuple

### Three-Layer Authorization Model

For an AI platform, authorization should be structured as:

1. **Application Permissions:** What resources exist, who owns them, standard
   RBAC/ReBAC for the platform itself (users, orgs, projects, documents)
2. **Agent Permissions:** What each agent can do -- which tools it can call,
   which data it can access, which actions it can perform
3. **Delegated User Permissions:** When an agent acts on behalf of a user,
   the effective permission is the intersection of the agent's own permissions
   AND the delegating user's permissions

The interaction: an agent can only do something if (a) the agent has permission
to do that type of action AND (b) the user who delegated has permission on the
specific resource. This prevents privilege escalation through agents.

### Contextual Tuples for Agent Sessions

Agent sessions can inject contextual tuples for request-scoped authorization:
- Session-specific tool access
- Temporary elevated permissions with audit trails
- MFA-gated agent actions

---

## Comparison: OpenFGA vs SpiceDB vs OPA

| Dimension | OpenFGA | SpiceDB | OPA |
|-----------|---------|---------|-----|
| **Model** | Zanzibar (ReBAC) | Zanzibar (ReBAC) | Policy-based (ABAC) |
| **Schema Language** | OpenFGA DSL | SpiceDB Schema | Rego |
| **Primary Pattern** | Relationship tuples | Relationship tuples | Attribute evaluation |
| **Consistency** | Flag-based (HIGHER_CONSISTENCY opt-in) | ZedToken-based (Zanzibar zookies) | N/A (stateless evaluator) |
| **Performance at Depth** | No Leopard index (deep nesting slower) | Full Leopard implementation | N/A |
| **CNCF Status** | Sandbox | Not CNCF | Graduated |
| **License** | Apache 2.0 | Apache 2.0 (OSS), commercial | Apache 2.0 |
| **AI Agent Support** | First-class docs and patterns | Possible but not documented | Policy-based guardrails |
| **Best For** | SaaS, multi-tenant, agent delegation | Consistency-critical, Zanzibar purist | Infrastructure policy, ABAC |

### When to Choose OpenFGA

- Multi-tenant SaaS with per-resource sharing (Google Drive-style)
- AI agent authorization with delegation patterns
- Teams already in the Auth0/Okta ecosystem
- Broad language SDK support needed
- ABAC requirements can be handled via conditions + contextual tuples

### When NOT to Choose OpenFGA

- Deeply nested group hierarchies at scale (SpiceDB's Leopard index is faster)
- Need for strong consistency guarantees (SpiceDB's ZedTokens are more precise)
- Authorization is purely attribute-based with no relationship graph (OPA/Cedar)

---

## API Surface

- **Check:** Can user U do action A on object O?
- **ListObjects:** Which objects of type T can user U access with relation R?
- **ListUsers:** Which users have relation R on object O?
- **Write:** Add or remove relationship tuples
- **Read:** Query existing tuples
- **Expand:** Visualize the permission tree for debugging

All APIs support contextual tuples for request-scoped evaluation.

---

## Deployment and Operations

- Single binary, stateless query engine
- Backed by PostgreSQL or MySQL for tuple storage
- Horizontal scaling by adding query nodes
- Model versioning for safe schema evolution
- Playground UI for model development and testing

---

## Key Questions for Platform Design

- [ ] Single store vs multi-store for tenant isolation?
- [ ] How to model agent-to-agent delegation chains (agent A delegates to agent B)?
- [ ] Performance characteristics for ListObjects at scale (100K+ tuples)?
- [ ] Integration pattern with MCP -- should tool access be an OpenFGA check?
- [ ] How to handle permission caching without stale reads?
- [ ] Condition evaluation performance for high-throughput agent workloads?

---

## References

- OpenFGA Documentation: https://openfga.dev/docs
- AI Agent Authorization: https://openfga.dev/docs/use-cases/ai-agent-authorization
- Contextual Tuples: https://openfga.dev/docs/interacting/contextual-tuples
- Conditions: https://openfga.dev/docs/modeling/conditions
- Google Zanzibar Paper: https://research.google/pubs/pub48190/
