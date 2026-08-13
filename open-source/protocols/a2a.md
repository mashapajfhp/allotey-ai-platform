# Agent-to-Agent Protocol (A2A)

**STATUS: NOT STARTED**
**Introduced by:** Google (2025)
**Current Version:** v1.0.0 (January 2026) -- production-ready
**Governance:** Linux Foundation (transferred June 2025)

---

## Overview

The Agent-to-Agent (A2A) Protocol is an open standard for direct communication
between autonomous agents across organizations and systems. It enables agents
built with different models, frameworks, or APIs to communicate, collaborate,
and delegate tasks securely.

The distinction from MCP: **A2A = agent to agent** (horizontal). MCP = agent
to tools (vertical). They are complementary layers, not competitors.

---

## The MCP vs A2A Distinction

```
Agent A  ----A2A---->  Agent B  ----A2A---->  Agent C
  |                      |                      |
  MCP                    MCP                    MCP
  |                      |                      |
Tool 1                 Tool 2                 Tool 3
Tool 4                 Tool 5                 Tool 6
```

- **MCP** is "USB-C for tool connectivity" -- vertical, agent to tool
- **A2A** is "HTTP for agent collaboration" -- horizontal, agent to agent
- An agent uses A2A to delegate work to a specialist agent, which then uses
  MCP to call the tools it needs
- Neither protocol replaces the other
- Production multi-agent systems will use both

---

## Core Concepts

### Agent Cards

Machine-readable descriptions published by each agent:
- Capabilities and skills
- Input and output modalities
- Authentication requirements
- Capability negotiation metadata

Agent Cards serve as the discovery mechanism -- how one agent finds and
understands what another agent can do.

### Task Management

A2A defines how agents:
- Discover each other via Agent Cards
- Negotiate permissions and capabilities
- Exchange structured messages
- Manage long-running tasks with status updates
- Handle streaming results

### Communication Patterns

- Request-response for simple delegation
- Streaming for long-running tasks
- Status updates for progress tracking
- Error handling and retry semantics

---

## Timeline

- **2025 (initial):** Google introduces A2A
- **June 2025:** Transferred to Linux Foundation for vendor-neutral governance
- **July 2025 (v0.3.0):** Streaming-first transport, enhanced Agent Cards
- **January 2026 (v1.0.0):** Production-ready, stable API

---

## Key Questions

- [ ] Is A2A relevant for our platform today, or is it a future consideration
      for multi-agent collaboration?
- [ ] How does A2A handle authorization -- does each agent need its own
      identity and permissions?
- [ ] What is the interaction between A2A delegation and OpenFGA authorization
      (delegated permissions across agent boundaries)?
- [ ] How mature is the ecosystem? How many agents actually implement A2A?
- [ ] Should our platform agents expose Agent Cards for external consumption?

---

## References

- A2A Protocol: https://github.com/google/a2a-protocol
- A2A Wikipedia: https://en.wikipedia.org/wiki/Agent2Agent
- A2A Security Analysis: https://arxiv.org/pdf/2602.11327
- Linux Foundation A2A Project: https://lfaidata.foundation/projects/agent2agent/
