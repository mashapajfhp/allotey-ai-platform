# Authorization Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## The Three-Layer Authorization Problem

AI platforms require authorization at three levels that interact:

### 1. Application Permissions
Traditional RBAC/ReBAC — what can this user do in the application?
- "Jane can view orders in Region A"
- "Managers can approve expenses up to $5,000"

### 2. Agent Permissions
What is this agent allowed to do?
- "The analytics agent can query but not modify data"
- "The operations agent can create tasks but not delete them"
- "The summarization agent has no tool access, only model access"

### 3. Delegated User Permissions
When an agent acts on behalf of a user, it inherits the user's permissions:
- "Agent acting as Jane can only see Region A orders"
- "Agent acting as a Manager can approve up to $5,000"

Every applicable governance layer must independently permit the operation:

```
For an agent action to proceed:
    ✓ User/principal permissions allow it
    ✓ Agent's declared capability scope allows it
    ✓ Action-specific policy constraints allow it
    ✓ Domain constraints are satisfied
```

An agent never exceeds the permissions of the delegating principal (in delegated modes) or its own explicit permission ceiling (in autonomous mode).

## Zanzibar Model (ReBAC)

OpenFGA and SpiceDB implement Google's Zanzibar model — Relationship-Based Access Control:

```
user:jane  is  viewer  of  document:report-q4
user:jane  is  member  of  team:sales
team:sales  is  viewer  of  folder:sales-docs
```

Authorization checks traverse the relationship graph:
- "Can Jane view report-q4?" → Yes (direct relationship)
- "Can Jane view doc-in-sales-docs?" → Yes (via team membership → folder viewing)

### Why ReBAC Matters for AI

Traditional RBAC assigns roles statically. ReBAC models arbitrary relationships, which is essential for:
- Data-level access control ("Jane can see orders she owns")
- Hierarchical permissions ("VPs can see everything their reports can see")
- Cross-tenant isolation ("Tenant A's agents cannot access Tenant B's data")
- Contextual access ("Jane can approve this order because she's the PO owner AND a manager")

## Research Questions

- OpenFGA vs. SpiceDB — which better fits the platform?
- How does contextual tuple injection work for agent delegation?
- How does authorization interact with the semantic layer? (Row-level security)
- How are authorization checks performed at query time without performance degradation?
- How does the authorization model handle MCP tool access?

## References

- `open-source/authorization/openfga.md` — OpenFGA research
- `commercial-platforms/microsoft/agent-framework.md` — identity delegation
- `commercial-platforms/palantir/governance.md` — ontology security
