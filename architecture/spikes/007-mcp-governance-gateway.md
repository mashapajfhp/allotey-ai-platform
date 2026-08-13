# Spike 007: MCP Governance Gateway

**Status:** NOT STARTED
**Time-box:** 2 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

Can we build an MCP governance gateway that mediates all tool access between agents and MCP servers? The gateway must enforce authorization checks before tool invocation, apply rate limiting, produce audit logs, validate request/response schemas, support tool discovery, and maintain tenant isolation — all without significantly degrading tool invocation latency.

## Hypothesis

We believe an MCP governance gateway is feasible as a proxy layer between the agent runtime and downstream MCP servers. The gateway intercepts MCP protocol messages (JSON-RPC), applies governance policies, and forwards authorized requests. We expect the authorization check (via OpenFGA) and audit logging to add 10-50ms of latency per tool invocation, which is acceptable given that most tool invocations take 100ms+ for actual execution. We believe this is architecturally preferable to embedding governance logic in each agent or each MCP server.

## Prototype Plan

### Gateway Architecture

```
Agent Runtime (Agno/LangGraph)
        |
        v
  MCP Governance Gateway
   |  |  |  |  |  |
   v  v  v  v  v  v
  MCP Server 1  MCP Server 2  MCP Server N
```

### Core Capabilities

#### 1. Authorization Check
- Intercept `tools/call` requests before forwarding to MCP server
- Extract: agent identity, user identity (delegation), tool name, tool arguments
- Query OpenFGA: "Can this agent, acting on behalf of this user, invoke this tool with these arguments?"
- Deny with structured error if unauthorized
- Support argument-level authorization (e.g., agent can query database but only for their tenant)

#### 2. Rate Limiting
- Per-agent rate limits (requests/minute, requests/hour)
- Per-user rate limits (aggregate across all their agents)
- Per-tenant rate limits (aggregate across all tenant users)
- Per-tool rate limits (protect expensive or sensitive tools)
- Token bucket or sliding window algorithm
- Rate limit state stored in PostgreSQL or Redis

#### 3. Audit Logging
- Log every tool invocation (request and response)
- Fields: timestamp, agent_id, user_id, tenant_id, tool_name, arguments (sanitized), result_status, latency_ms, authorization_decision
- Structured logging to PostgreSQL audit table
- Async logging to avoid blocking tool invocation
- Retention policy and archival strategy

#### 4. Schema Validation
- Validate tool invocation arguments against tool's input schema
- Validate tool response against tool's output schema
- Reject malformed requests before forwarding
- Schema registry for all registered MCP tools

#### 5. Tool Discovery
- Aggregate `tools/list` responses from all downstream MCP servers
- Apply authorization filtering — only show tools the agent is allowed to invoke
- Cache tool schemas with TTL-based invalidation
- Support tool versioning and deprecation

#### 6. Tenant Isolation
- Route requests to tenant-specific MCP server instances (if applicable)
- Inject tenant context into tool invocations
- Prevent cross-tenant data leakage through tool responses
- Tenant-scoped rate limits and audit logs

### Implementation Approach

1. **MCP Protocol Proxy** — Implement as an MCP server that proxies to downstream MCP servers
2. **Transport support** — stdio (for local MCP servers), SSE/HTTP (for remote MCP servers)
3. **Configuration** — YAML/JSON policy definition for rate limits, authorization rules, schema overrides
4. **Pluggable middleware** — Pipeline architecture for governance checks (auth -> rate limit -> schema validate -> forward -> audit log)

### Test Scenarios

1. **Single MCP server** — Gateway proxying to one MCP server with all governance checks enabled
2. **Multiple MCP servers** — Gateway aggregating tools from 5 MCP servers
3. **Authorization denial** — Agent attempts tool invocation without permission
4. **Rate limit enforcement** — Agent exceeds rate limit, receives 429-equivalent error
5. **Audit completeness** — Verify every invocation (success and failure) is logged
6. **Schema violation** — Agent sends malformed tool arguments
7. **Tool discovery filtering** — Agent sees only tools they are authorized to use
8. **Multi-tenant** — Two tenants' agents interact with same gateway, verify isolation

## Test Methodology

### Functional Correctness
- Authorization decisions match OpenFGA model expectations
- Rate limits enforce correctly under concurrent load
- Audit logs capture all invocations with correct metadata
- Schema validation catches all invalid inputs
- Tool discovery correctly filters by authorization
- Tenant isolation prevents cross-tenant access

### Performance Metrics
- **Gateway overhead latency:** Time added by gateway per tool invocation (target: <50ms)
- **Authorization check latency:** OpenFGA round-trip time (target: <20ms)
- **Throughput:** Tool invocations per second through gateway
- **Audit logging overhead:** Latency impact of synchronous vs asynchronous logging
- **Tool discovery latency:** Time to aggregate and filter tool lists

### Reliability Testing
- Gateway crash recovery — verify in-flight requests are handled
- Downstream MCP server unavailable — verify graceful degradation
- OpenFGA unavailable — fail-open vs fail-closed policy
- Rate limit state persistence — verify limits survive gateway restart

### Security Testing
- Authorization bypass attempts (manipulated headers, spoofed identity)
- Argument injection through tool parameters
- Audit log tampering resistance
- Tenant isolation boundary testing

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- Gateway becomes a single point of failure for all tool access
- OpenFGA dependency creates cascading failure risk (if OpenFGA is down, all tool access fails)
- Audit logging under high throughput may overwhelm PostgreSQL
- MCP protocol's stdio transport may not support the proxy pattern well (designed for 1:1 process communication)
- Tool schema aggregation may cause inconsistencies if MCP servers update schemas independently
- Rate limiting across multiple gateway instances requires shared state (Redis or distributed counter)

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

PENDING — Confidence level will be assessed based on the feasibility of the proxy pattern with MCP protocol and the latency characteristics of the governance pipeline.
