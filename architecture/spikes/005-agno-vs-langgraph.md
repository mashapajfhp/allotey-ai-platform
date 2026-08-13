# Spike 005: Agno vs LangGraph — Agent Runtime Comparison

**Status:** NOT STARTED
**Time-box:** 2 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

Which agent runtime — Agno or LangGraph — is better suited as the platform's agent execution framework? How do they compare across developer experience, state management, multi-agent orchestration, database integration, MCP compatibility, observability, multi-tenancy, and performance when building identical agent implementations?

## Hypothesis

We believe Agno's lightweight, model-agnostic approach will provide better developer experience and simpler multi-tenancy patterns, while LangGraph's graph-based state machine will offer more sophisticated multi-agent orchestration and human-in-the-loop workflows. We expect both frameworks can integrate with PostgreSQL for state persistence and MCP for tool access, but with different ergonomics. The right choice depends on whether the platform prioritizes orchestration complexity (favoring LangGraph) or operational simplicity (favoring Agno).

## Prototype Plan

### Reference Agent Specification

Build an identical agent in both frameworks with these capabilities:

1. **Tool use** — Agent can invoke 3+ tools (database query, API call, file operation)
2. **Multi-step reasoning** — Agent plans and executes a 5+ step task with intermediate state
3. **Human-in-the-loop** — Agent pauses for human approval before executing sensitive actions
4. **Error recovery** — Agent handles tool failures and retries with alternative strategies
5. **Context management** — Agent maintains conversation history and working memory
6. **Multi-agent handoff** — Primary agent delegates subtasks to specialist agents

### Comparison Dimensions

#### 1. Developer Experience
- Lines of code for equivalent functionality
- Learning curve (time to implement reference agent)
- Debugging experience (error messages, stack traces, logging)
- Documentation quality and community support
- Type safety and IDE support

#### 2. State Management
- Conversation state persistence to PostgreSQL
- Working memory (agent scratch pad) patterns
- State serialization/deserialization
- State recovery after crash/restart
- State migration between versions

#### 3. Multi-Agent Orchestration
- Agent-to-agent communication patterns
- Supervisor/worker patterns
- Parallel agent execution
- Agent team composition and routing
- Shared context between agents

#### 4. PostgreSQL Integration
- Native PostgreSQL state storage support
- Connection management and pooling
- Transaction handling during agent execution
- Session-level configuration (for RLS, AGE graph path)

#### 5. MCP Tool Integration
- MCP client support (connecting to MCP tool servers)
- Tool discovery and schema handling
- Streaming tool results
- MCP server hosting (exposing agent as MCP tool)

#### 6. Observability
- Built-in tracing and logging
- OpenTelemetry integration
- Token usage tracking
- Latency breakdown (reasoning vs tool execution)
- Cost tracking per agent run

#### 7. Multi-Tenancy Patterns
- Tenant isolation in agent state
- Per-tenant configuration (model, tools, system prompt)
- Tenant-scoped tool access
- Resource limits per tenant

#### 8. Performance
- Agent startup/initialization time
- Per-step latency overhead (framework overhead, not LLM latency)
- Memory usage per active agent
- Concurrent agent capacity per process
- Streaming response support

## Test Methodology

### Functional Parity
- Both implementations must pass the same functional test suite
- Test suite covers: tool use, multi-step reasoning, human-in-the-loop, error recovery, multi-agent handoff
- Same LLM (e.g., Claude Sonnet) used for both implementations

### Quantitative Comparison

| Metric | Measurement Method |
|--------|-------------------|
| Lines of code | `wc -l` on implementation files |
| Framework overhead latency | Measure total time minus LLM API time |
| Memory per agent | Process memory with 1, 10, 50 concurrent agents |
| State persistence latency | Time to save/restore agent state to PostgreSQL |
| Startup time | Cold start to first tool invocation |

### Qualitative Comparison

| Dimension | Evaluation Criteria |
|-----------|-------------------|
| Developer experience | Subjective assessment by 2+ developers |
| Debugging | Time to diagnose intentionally injected bugs |
| Documentation | Completeness, accuracy, examples |
| Extensibility | Effort to add custom components |
| Community | GitHub stars, issues response time, ecosystem |

### Scoring Framework
Each dimension scored 1-5 by each evaluator. Weighted average based on platform priorities:
- Multi-tenancy: 2x weight (critical for platform)
- PostgreSQL integration: 2x weight (unified data layer strategy)
- MCP integration: 1.5x weight (tool ecosystem)
- All others: 1x weight

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- Agno may lack mature multi-agent orchestration patterns for complex workflows
- LangGraph's graph definition may be overly complex for simple agent tasks
- Neither framework may support PostgreSQL-native state storage without custom adapters
- MCP integration may be experimental or incomplete in one or both frameworks
- Multi-tenancy may require significant custom code in both frameworks
- Framework lock-in risk — how portable is agent logic between frameworks?

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

PENDING — Confidence level will be assessed based on the breadth of the comparison and the degree to which the reference agent exercises platform-relevant patterns.
