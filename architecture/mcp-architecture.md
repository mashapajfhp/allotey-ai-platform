# MCP / A2A Architecture

> STATUS: NOT STARTED — NEEDS DEEP PROTOCOL REVIEW
> Last updated: 2026-08-13

## Model Context Protocol (MCP)

MCP standardizes how agents access tools and context:

```
Agent ←→ MCP ←→ Tools / Resources / Prompts
```

### Core Primitives

- **Tools** — executable functions the agent can invoke (with schemas)
- **Resources** — data the agent can read (files, database records, API responses)
- **Prompts** — reusable prompt templates with parameters

### Transports
- stdio (local process communication)
- HTTP/SSE (remote, streamable)

### Security Concerns
- MCP servers have access to local resources — a malicious MCP server is a security risk
- Tool schemas must be validated and authorized
- Resource access must respect the user's authorization context
- The platform must NOT expose arbitrary database access merely because MCP makes it technically possible

## Agent-to-Agent Protocol (A2A)

A2A (originated by Google) standardizes agent-to-agent communication:

```
Agent ←→ A2A ←→ Agent
```

### Distinction From MCP

| | MCP | A2A |
|---|-----|-----|
| **Purpose** | Agent accesses tools/context | Agent communicates with agent |
| **Relationship** | Client/server | Peer or hierarchical |
| **State** | Stateless tool calls | Potentially stateful conversations |
| **Discovery** | Tool/resource schemas | Agent capability cards |

Both may be appropriate for the platform — MCP for tool integration, A2A for multi-agent orchestration across service boundaries.

## Platform Integration Questions

- How does the MCP gateway govern tool access? (Authorization per tool)
- Should the platform expose its ontology objects as MCP resources?
- Should agents be discoverable via A2A capability cards?
- How does A2A interact with the agent registry?
- What is the security model for cross-organization A2A communication?

## References

- `open-source/protocols/mcp.md` — MCP specification research
- `open-source/protocols/a2a.md` — A2A protocol research
- `commercial-platforms/*/mcp.md` — commercial MCP implementations
