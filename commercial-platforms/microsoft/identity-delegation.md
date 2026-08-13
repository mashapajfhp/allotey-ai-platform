# Microsoft Identity Delegation

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## On-Behalf-Of (OBO) Pattern

Microsoft's identity delegation model is the best reference for how agent authorization should work in an enterprise AI platform.

### The Core Pattern

```
User authenticates (via Azure AD / Entra ID)
    → Receives access token with user's identity and permissions
        → Agent receives the user's token
            → Agent requests an OBO token for downstream service
                → Downstream service receives a token that:
                    - Identifies the original user
                    - Identifies the agent as the caller
                    - Carries the user's permission scope
                    - Is time-bounded
```

### Why This Matters

Without identity delegation, agents face a binary choice:
1. **Agent's own identity** — agent has its own permissions, which may be too broad or too narrow
2. **User's direct token** — agent forwards user's token, but loses auditability of agent's involvement

OBO solves this by creating a chain:
- The downstream system knows WHO initiated the action (user)
- The downstream system knows WHAT is acting (the agent)
- The downstream system can enforce BOTH sets of permissions
- The resulting action is auditable with full identity chain

### Application to Platform Architecture

```
User (authenticated) → AI Gateway
    ├── Gateway validates user token
    ├── Gateway checks user's permissions for requested action
    ├── Gateway creates delegated context for agent
    │
    Agent Runtime (with delegated context)
    ├── Agent queries semantic layer → filtered to user's data access
    ├── Agent calls tool → tool verifies user has permission for this action
    ├── Agent proposes action → action checked against user's authorization
    │
    Tool/Action (with delegated context)
    └── Executes within user's permission boundary
```

### Key Principle

**An agent should never have MORE permissions than the user it represents.**

The effective permissions are always the intersection:
```
Effective = User permissions ∩ Agent permissions ∩ Action constraints
```

## Research Questions

- How to implement OBO without Azure AD? (Platform must be cloud-portable)
- How do delegated permissions work with OpenFGA's ReBAC model?
- How do contextual tuples enable dynamic permission delegation?
- How does delegation work in multi-agent chains? (Agent A delegates to Agent B?)
- How are delegated permissions represented in audit logs?

## References

- `architecture/authorization-architecture.md` — three-layer authorization model
- `open-source/authorization/openfga.md` — ReBAC as the authorization substrate
