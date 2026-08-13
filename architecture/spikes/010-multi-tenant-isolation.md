# Spike 010: Multi-Tenant Isolation Testing Across All Components

**Status:** NOT STARTED
**Time-box:** 2 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

Can multi-tenant isolation be achieved consistently across all candidate platform components — PostgreSQL RLS, OpenFGA store-per-tenant, Agno team/session isolation, Temporal namespace isolation, Cube security context, and LiteLLM virtual keys? What are the isolation boundaries, enforcement mechanisms, and failure modes for each component? Where are the gaps?

## Hypothesis

We believe each component offers tenant isolation mechanisms, but they vary significantly in enforcement strength, configuration complexity, and failure characteristics. We expect PostgreSQL RLS and OpenFGA to provide the strongest isolation guarantees, while application-level isolation (Agno, Cube, LiteLLM) will depend on correct configuration and may have bypass vectors. We anticipate that the primary risk is not any single component failing but rather inconsistency between components — a request that is properly isolated in the database layer but leaks data through the analytics layer, or an agent that is scoped correctly but invokes a tool that lacks tenant context.

## Prototype Plan

### Component-by-Component Isolation Testing

#### 1. PostgreSQL Row-Level Security (RLS)

**Mechanism:** RLS policies filter rows based on `current_setting('app.tenant_id')`

**Tests:**
- Create 3 tenants with overlapping data patterns (same names, similar content)
- Verify: Tenant A query returns only Tenant A data
- Verify: Superuser query (bypassing RLS) returns all data
- Verify: Missing tenant context returns zero rows (fail-closed)
- Verify: RLS on AGE graph queries (custom schema challenge)
- Verify: RLS on pgvector similarity search results
- Verify: RLS on cross-table joins
- Verify: RLS on aggregate queries (no count leakage)
- Test: SQL injection attempts to bypass RLS
- Test: Connection pooler (PgBouncer/Supavisor) tenant context propagation

#### 2. OpenFGA Store-per-Tenant

**Mechanism:** Each tenant has a separate OpenFGA store with its own authorization model and tuples

**Tests:**
- Create 3 tenant stores with different authorization models
- Verify: Authorization check against wrong store returns denial
- Verify: Tuple enumeration is scoped to store
- Verify: Store ID mismatch handling (what happens with wrong store?)
- Test: Store creation and deletion lifecycle
- Test: Cross-store tuple reference (should be impossible)
- Test: Performance impact of many stores (100, 1000 stores)
- Test: Store-level backup and restore

#### 3. Agno Team/Session Isolation

**Mechanism:** Agno Teams scope agent execution; Sessions scope conversation state

**Tests:**
- Create agents for 3 tenants with tenant-specific tools and context
- Verify: Agent for Tenant A cannot access Tenant B tools
- Verify: Session state for Tenant A is not visible to Tenant B
- Verify: Agent memory (if shared storage) is tenant-scoped
- Test: Multi-tenant agent registry (same agent definition, per-tenant configuration)
- Test: Agent-to-agent communication across tenants (should be blocked)
- Test: Resource limits per tenant (concurrent agents, token usage)

#### 4. Temporal Namespace Isolation

**Mechanism:** Temporal namespaces provide execution isolation; workflows in different namespaces cannot interact

**Tests:**
- Create 3 tenant namespaces
- Verify: Workflow in Namespace A cannot signal workflow in Namespace B
- Verify: Activity in Namespace A cannot access Namespace B task queue
- Verify: Temporal UI shows only authorized namespace data
- Test: Namespace creation and deletion lifecycle
- Test: Worker registration scoped to namespace
- Test: Search attributes scoped to namespace
- Test: Resource quotas per namespace

#### 5. Cube Security Context

**Mechanism:** Cube's `securityContext` (from JWT) is injected into data model queries for row/column filtering

**Tests:**
- Configure Cube with tenant-aware security context
- Verify: Tenant A queries return only Tenant A data
- Verify: Column-level security (Tenant A cannot see sensitive fields of other tenants)
- Verify: Pre-aggregation isolation (cached results are tenant-scoped)
- Test: Security context propagation through Cube's caching layer
- Test: API key scoping (can an API key be restricted to a tenant?)
- Test: Dashboard/query sharing does not leak cross-tenant data

#### 6. LiteLLM Virtual Keys

**Mechanism:** LiteLLM virtual keys map to team/user budgets and model access controls

**Tests:**
- Create virtual keys for 3 tenants with different budgets and model access
- Verify: Tenant A key cannot use Tenant B's budget
- Verify: Tenant A key cannot access models not in their tier
- Verify: Rate limits are per-tenant
- Verify: Usage tracking is per-tenant
- Test: Key rotation and revocation
- Test: Budget exhaustion handling
- Test: Fallback model configuration per tenant

### Cross-Component Integration Testing

#### Scenario 1: End-to-End Tenant Isolation
1. User authenticates (receives JWT with tenant_id)
2. Agent is instantiated with tenant context (Agno)
3. Agent invokes tool (MCP gateway checks OpenFGA with tenant store)
4. Tool queries database (PostgreSQL RLS filters by tenant)
5. Agent requests analytics (Cube security context filters by tenant)
6. LLM call is routed through LiteLLM (virtual key scopes to tenant budget)
7. Workflow is created in Temporal (tenant namespace)

**Verify:** At every step, only Tenant A data is accessible.

#### Scenario 2: Tenant Context Loss
1. Simulate dropped tenant context at each component boundary
2. Verify: Every component fails closed (denies access, not allows)
3. Document: Which components fail open (allow access without tenant context)

#### Scenario 3: Tenant Context Manipulation
1. Attempt to change tenant_id mid-request
2. Attempt to forge tenant context in headers/JWT
3. Attempt to access admin/superuser operations from tenant context

#### Scenario 4: Cross-Tenant Data Leakage Paths
1. Full-text search results (do they leak across tenants?)
2. Vector similarity search (do embeddings from other tenants appear?)
3. Graph traversal (can a graph walk cross tenant boundaries?)
4. Aggregation queries (do counts/sums include other tenants?)
5. Error messages (do they leak other tenant information?)
6. Logs and traces (do they expose cross-tenant data?)

## Test Methodology

### Isolation Verification Matrix

| Component | Mechanism | Enforcement | Fail Mode | Bypass Risk |
|-----------|-----------|-------------|-----------|-------------|
| PostgreSQL RLS | Policy-based row filtering | Database kernel | Fail-closed | Low |
| OpenFGA | Store separation | Application | TBD | TBD |
| Agno | Team/Session scoping | Application | TBD | TBD |
| Temporal | Namespace isolation | Server-enforced | TBD | TBD |
| Cube | Security context | Application | TBD | TBD |
| LiteLLM | Virtual key scoping | Application | TBD | TBD |

### Test Execution
- Automated test suite for each component (unit-level isolation tests)
- Integration test suite for cross-component scenarios
- Manual penetration testing for bypass attempts
- Code review of isolation implementation in each component

### Metrics
- Number of isolation boundaries tested
- Number of bypass vectors discovered
- Fail-closed vs fail-open behavior per component
- Latency overhead of tenant isolation per component
- Operational complexity score per component (1-5)

### Documentation Deliverables
- Isolation boundary map (visual diagram)
- Per-component isolation configuration guide
- Known gaps and mitigations
- Monitoring recommendations for isolation failures

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- Connection pooler may not reliably propagate tenant context (PgBouncer transaction mode resets session variables)
- AGE graph queries may bypass RLS if they access the underlying `ag_catalog` schema directly
- OpenFGA store-per-tenant may not scale to thousands of tenants (store creation overhead, memory usage)
- Agno team isolation may be convention-based rather than enforced (agent code could bypass)
- Temporal namespace isolation depends on correct worker registration (misconfigured worker could process wrong namespace)
- Cube pre-aggregation cache may serve stale data from wrong tenant if cache key is misconfigured
- LiteLLM virtual key validation adds latency to every LLM call
- Cross-component tenant context propagation requires consistent JWT/header handling across all services

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

PENDING — Confidence level will be assessed based on the completeness of cross-component testing and the number of unmitigated isolation gaps discovered.
