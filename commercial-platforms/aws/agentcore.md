# Amazon Bedrock AgentCore

**STATUS: RESEARCHED -- Based on official AWS documentation and announcements through mid-2026**

## What Is AgentCore

Amazon Bedrock AgentCore is an **agentic platform to build, deploy, and operate AI agents securely at scale** using any framework, model, or protocol. It is the successor to the earlier "Bedrock Agents" service and represents AWS's current architecture for production agent systems.

- **GA announcement**: October 2025
- **Harness GA**: June 17, 2026
- **All services support**: VPC, PrivateLink, CloudFormation, and resource tagging as of GA

## Design Philosophy

AgentCore's key architectural decision is **framework agnosticism**. Unlike Microsoft's Agent Framework (which is a specific SDK) or Google's ADK (which is a specific framework), AgentCore provides infrastructure services that any agent framework can consume. You bring your agent code (LangChain, CrewAI, AutoGen, custom), and AgentCore provides the runtime, memory, tools, identity, and policy.

## Core Components

### 1. Runtime
The Runtime executes agent code in a **sandboxed Firecracker microVM** environment on EC2 bare metal in AWS.

Key characteristics:
- **Firecracker isolation** -- the same microVM technology that powers AWS Lambda
- **Strong security boundaries** -- each agent execution runs in its own microVM
- **Extended execution** -- supports long-running agent sessions (not limited to Lambda's 15-minute timeout)
- **Any framework** -- run LangChain, CrewAI, AutoGen, or custom agent code
- **Container-compatible** -- package agent code as containers for deployment to Runtime

### 2. Harness (GA June 2026)
The Harness is a **managed, config-driven agent loop** that sits on top of Runtime:

- **Declarative agent definition** -- define agent behavior through configuration rather than custom orchestration code
- **Built on the same platform** as Runtime, Memory, Gateway, and Identity
- **Managed reasoning loop** -- the Harness handles the think-act-observe cycle
- **Tool integration** -- automatic tool discovery and invocation through Gateway
- **Memory integration** -- automatic session and long-term memory management

The Harness is for teams that want a managed agent loop without writing their own orchestration. Runtime is for teams that want full control.

### 3. Memory
AgentCore Memory provides **three types of memory** for agents:

| Type | Purpose | Scope |
|------|---------|-------|
| **Session memory** | Conversation history within a session | Single session |
| **Long-term memory** | Facts and preferences learned across sessions | Per user/agent |
| **Semantic memory** | NEEDS VERIFICATION on exact distinction from long-term | Cross-session |

Memory is retrieved automatically by the Runtime/Harness and injected into the agent's context. The agent does not need to manage memory retrieval logic.

### 4. Gateway
The Gateway is the **tool integration layer** that converts external capabilities into agent-callable tools:

- **API transformation** -- converts REST APIs into agent-compatible tool schemas
- **Lambda integration** -- wraps Lambda functions as agent tools
- **MCP support** -- connects to Model Context Protocol servers
- **Authentication** -- handles auth to downstream services (API keys, OAuth, IAM roles)
- **Protocol translation** -- translates between agent tool-call format and downstream API formats
- **Routing** -- routes tool calls to the correct backend

The Gateway sits between the agent and all external tools, providing a single integration point.

### 5. Identity
AgentCore Identity manages authentication for agents:

- **Inbound authentication** -- validates JWT tokens from callers to establish who is invoking the agent
- **Outbound authentication** -- manages credentials when agents call downstream services
- **Organization-defined mechanisms** -- supports the organization's existing auth infrastructure
- **Token management** -- handles token refresh and lifecycle

### 6. Policy (Cedar-Based Authorization)
AgentCore Policy is the **deterministic authorization engine** for agent actions:

- **Cedar policy language** -- the same language used by Amazon Verified Permissions
- **Default-deny model** -- if no permit policy exists for a tool, it is blocked
- **Per-tool evaluation** -- every tool call is evaluated against policies independently
- **Gateway integration** -- Policy sits inside the Gateway and intercepts every agent-to-tool request
- **Immune to prompt injection** -- policies are evaluated outside the model's reasoning, so prompt injection cannot bypass authorization
- **Forbid-wins semantics** -- if any policy explicitly denies, the action is denied regardless of permits

Cedar policy example structure:
```
permit(
    principal == Agent::"my-agent",
    action == Action::"invoke-tool",
    resource == Tool::"read-database"
) when {
    context.user_role == "analyst"
};

forbid(
    principal == Agent::"my-agent",
    action == Action::"invoke-tool",
    resource == Tool::"delete-records"
);
```

**GA date**: March 3, 2026

### 7. Code Interpreter
- Sandboxed code execution environment for agents
- Agents can write and execute code (Python, etc.) as part of their reasoning
- Isolated execution -- code runs in a sandbox, not in the agent's main environment

### 8. Browser
- Web browsing capability for agents
- Agents can navigate web pages, extract information, and interact with web applications
- NEEDS VERIFICATION: Exact capabilities and limitations

### 9. Observability
Built-in monitoring across all AgentCore components:

- **Metrics** -- performance metrics for Runtime, Memory, Gateway, Identity, tools
- **Logging** -- structured logging for all operations
- **Tracing** -- distributed tracing across agent execution
- **CloudWatch integration** -- standard AWS monitoring and alerting
- **Per-component dashboards** -- visibility into each AgentCore service

### 10. Evaluations
- Evaluate agent behavior and quality
- NEEDS VERIFICATION: Specific evaluation metrics and methodology

### 11. Registry
- Register agents and tools for discovery
- NEEDS VERIFICATION: Whether this supports agent-to-agent discovery

### 12. Payments
- NEEDS VERIFICATION: Exact purpose -- may be for agents that process financial transactions

## Architecture Flow

```
Caller (app, user, another agent)
    |
    +---> AgentCore Identity (validate JWT)
    |
    v
AgentCore Runtime / Harness
    |
    +---> AgentCore Memory (retrieve context)
    |
    +---> Agent Code (your framework: LangChain, CrewAI, custom)
    |       |
    |       +---> Bedrock Model Inference (LLM reasoning)
    |       |
    |       +---> AgentCore Gateway (tool calls)
    |               |
    |               +---> AgentCore Policy (Cedar authorization check)
    |               |       |
    |               |       +---> PERMIT --> Route to tool
    |               |       +---> DENY --> Block and return error
    |               |
    |               +---> External APIs
    |               +---> Lambda Functions
    |               +---> MCP Servers
    |               +---> Knowledge Bases
    |
    +---> AgentCore Observability (metrics, logs, traces)
```

## VPC and Network Security

As of GA, all AgentCore services support:
- **VPC deployment** -- run agents within your VPC
- **PrivateLink** -- private connectivity to AgentCore services without traversing the internet
- **Security groups and NACLs** -- standard AWS network security controls
- **CloudFormation** -- infrastructure-as-code for AgentCore resources

## Key Design Decisions

1. **Framework-agnostic** -- infrastructure, not a framework
2. **Cedar for authorization** -- deterministic, auditable, not AI-dependent
3. **Firecracker for isolation** -- battle-tested microVM technology
4. **Gateway as single integration point** -- all tools go through one managed layer
5. **Memory as a managed service** -- agents don't build their own memory systems

## NEEDS VERIFICATION
- Exact capabilities of Payments and Registry components
- Memory type distinctions (session vs. long-term vs. semantic)
- Whether Harness replaces or complements the older Bedrock Agents service
- Browser component limitations and sandboxing details
- Maximum session duration for Runtime
- Cross-region agent deployment patterns
