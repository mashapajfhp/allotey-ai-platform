# Spike 004: Can OpenFGA Model User-to-Agent-to-Tool Permission Delegation?

**Status:** NOT STARTED
**Time-box:** 1.5 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

Can OpenFGA model the permission delegation chain from User to Agent to Tool? When an agent acts on behalf of a user, can OpenFGA enforce that the agent's permissions are bounded by both the user's permissions AND the agent's declared capabilities? Can contextual tuples provide runtime permission scoping without excessive tuple storage? Can this model perform at expected query volumes?

## Hypothesis

We believe OpenFGA can model user-to-agent-to-tool delegation using a combination of stored relationships and contextual tuples. The delegation model should express: "Agent X can perform action Y on resource Z because User A granted delegation to Agent X, User A has permission Y on resource Z, and Agent X's capability set includes action Y." We expect contextual tuples will be essential for runtime scoping (e.g., session-level or conversation-level permissions) without creating permanent tuple bloat.

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

1. **Basic delegation** — User grants agent permission; agent invokes tool; verify access
2. **Bounded delegation** — User has broad permissions; agent has narrow capabilities; verify agent is limited to intersection
3. **Revocation** — User revokes delegation; verify agent immediately loses access
4. **Escalation prevention** — Agent attempts action beyond user's permissions; verify denial
5. **Multi-agent** — User delegates to multiple agents with different capability sets
6. **Transitive delegation** — Agent A delegates to Agent B (should this be allowed? Test both)
7. **Contextual scoping** — Same agent has different permissions in different sessions via contextual tuples
8. **Cross-tenant isolation** — Agent delegated by Tenant A user cannot access Tenant B resources

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
