# Agent Framework Comparison

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Frameworks Under Evaluation

| Framework | Maintainer | Language | License | MCP | A2A | Multi-Agent |
|-----------|-----------|----------|---------|-----|-----|-------------|
| LangGraph | LangChain | Python, JS | MIT | Yes | No | Yes |
| Google ADK | Google | Python, JS | Apache 2.0 | Yes | Yes | Yes |
| Agno | Agno AGI | Python | Apache 2.0 | Yes | Yes | Yes |
| Strands | AWS | Python, TS | Apache 2.0 | Yes | No | Yes |
| MS Agent Framework | Microsoft | Python, .NET | MIT | Yes | No | Yes |

## Architecture Comparison

### LangGraph
- **Model:** Graph-based state machine (StateGraph with nodes and edges)
- **State:** Externalized via checkpointers (memory, PostgreSQL, Redis)
- **Strengths:** Largest community, most production deployments, excellent streaming
- **Weaknesses:** LangChain ecosystem coupling, Python-first, limited built-in multi-tenancy
- **Human-in-the-loop:** Interrupt mechanism — graph execution pauses at defined points

### Google ADK
- **Model:** Agent class hierarchy with workflow agents (Sequential, Parallel, Loop, Custom)
- **State:** Session-based with memory services
- **Strengths:** A2A support (originator), clean workflow patterns, strong MCP integration
- **Weaknesses:** Newer, smaller community, Google Cloud bias
- **Human-in-the-loop:** Callback-based

### Agno
- **Model:** Agent → Team → Workflow hierarchy with rich built-in capabilities
- **State:** Built-in memory (user, session, summary), knowledge stores
- **Strengths:** Most batteries-included (memory, knowledge, tools, teams, RBAC, tracing)
- **Weaknesses:** Python-only, newer project (license changed to Apache 2.0 in Jan 2025)
- **Human-in-the-loop:** Built-in human approval in workflows

### Strands
- **Model:** Model-agnostic agent with tool use, graphs, and swarms
- **State:** External state management
- **Strengths:** AWS backing, clean model abstraction, tools package
- **Weaknesses:** New, small community, limited documentation
- **Human-in-the-loop:** Limited

### Microsoft Agent Framework
- **Model:** Graph-based orchestration with multi-agent patterns
- **State:** External state management
- **Strengths:** Microsoft backing, enterprise focus
- **Weaknesses:** Very new, limited adoption data
- **Human-in-the-loop:** NEEDS VERIFICATION

## Decision Factors

For the platform, the agent runtime must support:
1. Multi-agent orchestration with supervisor patterns
2. Human-in-the-loop approval at arbitrary points
3. MCP tool integration
4. Externalized state (for durability)
5. Authorization context propagation
6. Observability integration (traces, spans)
7. Multi-tenancy (or at least no architectural barriers to it)
8. TypeScript AND Python support (or at least Python with TS client)

## Current Assessment

- **LangGraph** has the most proven production track record
- **Agno** has the richest feature set and closest alignment to platform needs
- **Google ADK** has the best protocol support (MCP + A2A)
- No framework perfectly fits all requirements — wrapping will be necessary

NEEDS DEEPER INVESTIGATION before making a recommendation.
