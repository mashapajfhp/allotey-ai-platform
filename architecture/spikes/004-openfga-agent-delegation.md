# Spike 004: OpenFGA Authorization — Delegation, ScopeContext, and Three Agent Modes

> STATUS: NOT STARTED
> Last updated: 2026-08-14
> References: `architecture/authorization-architecture.md`, `architecture/identity-federation-architecture.md`, `architecture/platform-api-architecture.md`, `architecture/platform-tenancy-model.md`

## Question

Can OpenFGA model: (1) the three agent execution modes (user-delegated, service-delegated, autonomous) with correct governance at each layer, (2) the ScopeContext hierarchy with server-side resolution, and (3) workspace-level logical authorization within tenants? Can this model perform at expected query volumes?

## Hypothesis

We believe OpenFGA can model all three agent modes and the full scope hierarchy using a combination of stored relationships and contextual tuples. The key tests: user-delegated agents are bounded by every applicable governance layer independently permitting; autonomous agents operate under explicitly configured permissions with an accountable owner; ScopeContext resolution prevents confused-deputy attacks by verifying the resource ancestry server-side.

## Prototype Plan

### Authorization Model Design

1. **Core types and relations:**
   ```
   type user
   type agent
     relations
       define owner: [user]
       define delegated_by: [user]
       define can_act_as: delegated_by
   type tool
     relations
       define can_invoke: [agent, user]
       define requires_capability: [capability]
   type resource
     relations
       define owner: [tenant]
       define viewer: [user, agent]
       define editor: [user, agent]
   type capability
     relations
       define granted_to: [agent]
   ```

2. **Delegation chain validation:**
   - User has `editor` on Resource
   - User `delegated_by` Agent
   - Agent has `capability` for the required action
   - Therefore: Agent `can_invoke` Tool on Resource (computed)

3. **Contextual tuples for runtime scoping:**
   - Session-scoped: "For this conversation, Agent can access these specific resources"
   - Time-scoped: "Agent delegation expires at timestamp T"
   - Action-scoped: "Agent can only read, not write, during this interaction"

### Test Scenarios

**Delegation Modes:**
1. **User-delegated** — User delegates to agent; every governance layer independently permits; agent invokes tool; verify access
2. **Service-delegated** — Service account delegates to agent; same governance model; verify access
3. **Autonomous agent** — Agent operates under own permissions, no delegating session; verify permissions are explicitly configured, not inherited
4. **Autonomous accountability** — Verify autonomous agent's owner is recorded in audit but owner's permissions do not apply at runtime

**Governance:**
5. **Layered governance** — User has permission, but agent's capability scope does not include the action; verify denial (not intersection — each layer independently evaluated)
6. **Revocation** — User revokes delegation; verify agent immediately loses access
7. **Escalation prevention** — Agent attempts action beyond delegating principal's permissions; verify denial
8. **Multi-agent chain** — User → Agent A → Agent B; every layer independently permits at every step

**ScopeContext:**
9. **Server-side scope resolution** — Verify OpenFGA can resolve tenant → organization → product → platform ancestry from stored relationships
10. **Confused-deputy prevention** — Agent supplies scope_id from one resource tree but the resource belongs to another; verify denial
11. **Workspace authorization** — Within a tenant, verify workspace-level access control (Engineering contributor cannot read Finance workspace resources)

**Isolation:**
12. **Cross-tenant isolation** — Agent delegated by Tenant A user cannot access Tenant B resources
13. **Cross-workspace authorization** — Within same tenant, workspace-scoped agent cannot access another workspace's resources (when product enforces workspace authorization)

### Performance Testing

1. **Check latency** — Single authorization check at p50, p95, p99
2. **Batch checks** — 10, 50, 100 concurrent authorization checks
3. **Contextual tuple overhead** — Check latency with 0, 10, 100, 1000 contextual tuples
4. **Model complexity impact** — Check latency as authorization model grows (10, 50, 100 type definitions)
5. **Sustained load** — Authorization checks/sec at target throughput (1000 checks/sec)
6. **Tuple storage scale** — Query performance with 100K, 1M, 10M stored tuples

## Test Methodology

### Functional Correctness
- Define expected allow/deny for each test scenario
- Automated test suite verifying all scenarios
- Edge case testing: circular delegation, self-delegation, empty capability sets

### Performance Metrics
- Authorization check latency (p50, p95, p99) under various conditions
- Throughput (checks/second) at sustained load
- Memory and CPU usage of OpenFGA server
- Contextual tuple processing overhead

### Model Expressiveness
- Can the model express all required delegation patterns?
- Are there delegation patterns that require workarounds?
- How complex is the model to understand and maintain?

### Operational Assessment
- OpenFGA deployment complexity (single node, HA)
- Monitoring and debugging authorization decisions
- Model migration and versioning strategy
- Integration with platform authentication flow

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- Contextual tuples may add significant latency if the set is large
- Delegation chain depth may cause slow authorization checks (recursive evaluation)
- OpenFGA's eventual consistency may cause brief windows where revoked permissions still work
- Model complexity may make authorization debugging difficult
- Transitive delegation (agent-to-agent) may create unintended permission escalation paths
- Contextual tuple lifetime management (who cleans them up?) may cause tuple leaks

## Operational Findings

PENDING — Operational findings will be documented during investigation.

## Security Findings

PENDING — Security findings will be documented during investigation.

## Performance Findings

PENDING — Performance findings will be documented during investigation.

## Conclusion

PENDING — Conclusion will be documented when the spike is completed.

## Recommendation

PENDING — Recommendation will be made when results are available.

## Confidence Level

PENDING — Confidence level will be assessed based on functional correctness of the delegation model and performance characteristics at expected scale.
