# Microsoft Agent Framework

**STATUS: RESEARCHED -- Based on official Microsoft documentation, Build 2026, and Microsoft Learn**

## What Is the Microsoft Agent Framework

The Microsoft Agent Framework (MAF) is an **open-source SDK and runtime** for building AI agents and multi-agent workflows, available for both .NET and Python. It is the result of merging **AutoGen** (Microsoft Research's multi-agent framework) and **Semantic Kernel** (Microsoft's enterprise AI SDK) into a single, supported platform.

- **Version 1.0 GA**: April 2, 2026
- **Build 2026 updates**: Agent Harness with skills/memory/middleware (stable), GitHub Copilot SDK and Claude Agent SDK integrations (stable), Magentic-One multi-agent pattern (stable)

## Core Architecture

### Agent Harness
The Agent Harness is the execution layer where model reasoning meets real execution:

- **Shell and filesystem access** -- agents can execute commands and interact with the file system
- **Human-in-the-loop approval flows** -- configurable gates for sensitive operations
- **Context management** -- handles long-running sessions with state preservation
- **Middleware pipeline** -- extensible processing pipeline for requests and responses

Key providers in the harness:
| Provider | Purpose |
|----------|---------|
| `FileMemoryProvider` | Session-scoped, file-based memory |
| `FileAccessProvider` | General file access for agents |
| `TodoProvider` | Tracking work items across sessions |
| `AgentModeProvider` | "Plan" vs "execute" modes |
| `AgentSkillsProvider` | Skill discovery and execution |
| `BackgroundAgentsProvider` | Delegate subtasks to child agents running in parallel |

### Agent Abstractions
MAF combines AutoGen's simple agent abstractions with Semantic Kernel's enterprise features:
- **Type-safe agent definitions** -- strongly typed inputs/outputs
- **Session-based state management** -- state persists across conversation turns
- **Middleware** -- cross-cutting concerns (logging, auth, validation) as pipeline stages
- **Telemetry** -- built-in OpenTelemetry support for tracing and metrics

## Multi-Agent Orchestration Patterns

MAF provides stable support for multiple orchestration patterns:

### Sequential
Agents execute one after another in a defined order. Output of one agent becomes input to the next.
```
Agent A --> Agent B --> Agent C --> Result
```

### Concurrent (Parallel)
Multiple agents execute simultaneously on independent tasks. Results are aggregated.
```
Agent A --|
Agent B --+--> Aggregated Result
Agent C --|
```

### Handoff
An agent can transfer control to another agent when it determines the task requires different expertise.
```
Agent A --[handoff]--> Agent B --[handoff]--> Agent C
```

### Group Chat
Multiple agents collaborate in a shared conversation, each contributing based on their expertise.

### Magentic-One
A research-originated pattern for complex, multi-step tasks. A lead agent (Orchestrator) coordinates specialist agents (WebSurfer, FileSurfer, Coder, ComputerTerminal) to accomplish goals.

### Graph-Based Workflows
Explicit graph definitions for complex multi-agent orchestration where the flow depends on runtime conditions.

## Tool Use

Agents interact with external systems through tools:

- **Function calling** -- agents invoke typed functions with validated parameters
- **Foundry Toolboxes** -- managed tool endpoints aggregating multiple tools, MCP clients, and data integrations
- **MCP support** -- agents can consume Model Context Protocol servers as tool sources
- **Custom tool definitions** -- developers define tools with schemas, and the framework handles invocation

## State Management

- **Session state** -- persisted across conversation turns within a session
- **Agent memory** -- `FileMemoryProvider` for file-based memory; extensible for other backends
- **Shared state in multi-agent** -- agents in an orchestration can read/write shared state
- **Checkpointing** -- NEEDS VERIFICATION on explicit checkpoint/resume support

## Identity Delegation: On-Behalf-Of (OBO)

This is a critical pattern for enterprise agents. The OBO flow ensures that when an agent acts for a user, downstream systems see the **user's identity and permissions**, not the agent's.

### How It Works

1. **User authenticates** to the application (e.g., via Entra ID / Azure AD)
2. **Application obtains a token** for the user
3. **Agent authenticates** using its own workload identity (Entra Agent ID)
4. **Agent requests an OBO token** -- exchanges the user's token for a new token that represents "this agent acting on behalf of this user"
5. **Downstream systems** (SharePoint, Graph API, Dynamics, SQL) see the user's identity and enforce the user's permissions
6. **Agent cannot exceed** the user's authorization -- if the user can't access a document, the agent can't either

### Three Identity Questions
Every agent identity must answer:
1. **Who deployed it?** -- the organization/team responsible
2. **What is it authorized to do?** -- the agent's own permissions (scope)
3. **On whose behalf is it currently acting?** -- the delegating user (OBO context)

### Entra Agent ID
- Agents get unique object IDs and app IDs in Entra ID
- Agents do not hold credentials of their own -- the platform acquires tokens on their behalf
- Managed identity eliminates credential management
- Supports certificate-based and federated identity credentials

### Why This Matters
Without OBO, agents would need their own broad permissions to access all resources any user might need -- a massive security risk. OBO ensures the agent operates within the delegating user's authorization boundary.

## Production Deployment

### Foundry Agent Service
- Agents built with MAF can be deployed to Foundry Agent Service for managed hosting
- Autoscaling, monitoring, and lifecycle management handled by the platform
- Integration with Foundry IQ for knowledge grounding

### Self-Hosted
- Agents can also be self-hosted on any compute (VMs, containers, Kubernetes)
- Framework is open-source and does not require Azure

### Hosted Agents (Build 2026)
- New capability for running agents as managed cloud services
- CodeAct support for code-generating agents
- NEEDS VERIFICATION: Exact GA status and pricing

## Observability

- **OpenTelemetry integration** -- traces, metrics, and logs
- **Azure Monitor** -- dashboards, alerts, and diagnostics when deployed on Azure
- **Agent-level tracing** -- individual agent reasoning steps, tool calls, and handoffs are traceable
- **Multi-agent trace correlation** -- traces across orchestrated agents can be correlated

## Framework Integrations

MAF integrates with external agent frameworks:
- **GitHub Copilot SDK** -- build agents that extend GitHub Copilot (stable)
- **Claude Agent SDK** -- integrate with Anthropic's agent infrastructure (stable)
- **A2A protocol** -- NEEDS VERIFICATION on current A2A support status

## Key Design Decisions

1. **Open-source** -- MIT licensed, not locked to Azure
2. **Multi-language** -- same concepts in .NET and Python
3. **Enterprise-first** -- type safety, middleware, telemetry, identity built in from the start
4. **Protocol support** -- MCP for tools, working toward A2A for agent-to-agent
5. **Pattern library** -- pre-built orchestration patterns reduce boilerplate

## NEEDS VERIFICATION
- A2A protocol support status in MAF
- Exact capabilities of Hosted Agents at GA
- Whether graph-based workflows are GA or preview
- Performance characteristics of BackgroundAgentsProvider for large fan-out
- Checkpoint/resume semantics for long-running agents
