# Google Agent Development Kit (ADK)

**STATUS: RESEARCHED -- Based on official Google documentation, Google Cloud Next 2025/2026, and ADK open-source repository**

## What Is ADK

The Agent Development Kit (ADK) is an **open-source agent development framework** from Google that lets you build, debug, and deploy reliable AI agents at enterprise scale. Introduced at Google Cloud Next 2025, it is now at **version 2.0** with support for **Python, Go, Java, and TypeScript**.

ADK is Apache-2.0 licensed and is not locked to Google Cloud -- it works with any model provider through LiteLLM integration, though it has first-class integration with Gemini models.

## Core Agent Model

### Agent Types

ADK distinguishes between two categories of agents:

#### LLM Agents
Agents powered by a language model that can reason, plan, and decide which tools to invoke:
- Take natural language input
- Use model reasoning to determine next steps
- Can invoke tools, delegate to sub-agents, or respond directly
- Configurable with instructions, tools, and sub-agents

#### Workflow Agents
Deterministic agents that orchestrate other agents in predefined patterns:
- **No LLM reasoning** -- follow a fixed execution pattern
- Control flow is explicit and predictable
- Used to compose LLM agents into reliable pipelines

## Workflow Agent Types

### Sequential Agent
Executes sub-agents **one by one, in order**, without user input between steps:

```python
SequentialAgent(
    name="pipeline",
    sub_agents=[fetch_agent, clean_agent, analyze_agent, summarize_agent]
)
```

- Output of one agent is passed as input to the next through shared session state
- Perfect for multi-step pipelines: fetch data -> clean data -> analyze data -> summarize
- If any step fails, the pipeline stops (configurable error handling)

### Parallel Agent
Runs all sub-agents **concurrently**:

```python
ParallelAgent(
    name="gather",
    sub_agents=[api_agent_1, api_agent_2, api_agent_3]
)
```

- Ideal for independent tasks that can be performed simultaneously
- All agents share session state, but operate in separate execution threads
- Results are available after all agents complete
- Use case: calling three different APIs to gather information

### Loop Agent
Repeatedly executes sub-agents **until a condition is met** or max iterations reached:

```python
LoopAgent(
    name="refiner",
    sub_agents=[draft_agent, review_agent],
    max_iterations=5
)
```

- Works like a while loop in programming
- Each iteration can read results from the previous iteration
- Exit conditions: max iterations, explicit completion signal from a sub-agent, or external condition
- Use case: iterative refinement (write draft -> review -> revise -> review -> approve)

### Graph Workflow (ADK 2.0)
ADK 2.0 introduced **directed graph workflows** for complex agent orchestration:

```
Entry Node --> Agent A --> [Routing Condition]
                              |
                    +---------|----------+
                    |                    |
                    v                    v
                Agent B              Agent C
                    |                    |
                    v                    v
              [Merge Node] <-------------+
                    |
                    v
                Agent D --> Exit
```

Key features of graph workflows:
- **Directed graph composition** -- agents and deterministic execution nodes form a directed graph
- **Runtime routing** -- conditions at each node decide which agent executes next based on the output of the previous step
- **Not scripted automation** -- routing decisions happen at runtime, not at design time
- **State-based recovery** -- workflows can be resumed from a checkpoint after failure
- **Resumable human-in-the-loop** -- workflows can pause for human approval and resume
- **Visual graph and trace views** -- Web UI for visualizing graph execution

## Tools

### Function Calling
The simplest tool type -- define Python/Java/Go/TypeScript functions that agents can invoke:
- Functions are automatically converted into tool schemas
- The model decides when to call which function
- Input validation and output typing are automatic

### MCP Server Support
ADK supports the **Model Context Protocol** (MCP) for tool integration:
- Connect to any MCP server and expose its tools to agents
- ADK agents can also **be exposed as MCP servers** (new in 2.0)
- Enables interoperability with the broader MCP ecosystem

### Built-in Tools
- Google Search (for grounding)
- Code execution
- Agent Search (enterprise data retrieval)
- NEEDS VERIFICATION: Full list of built-in tools

## Multi-Agent Orchestration

### Delegation
An LLM agent can **delegate tasks to sub-agents** based on its reasoning:
- Parent agent decides which sub-agent to invoke
- Sub-agent executes and returns results to the parent
- Supports recursive delegation (sub-agents can have their own sub-agents)

### Shared Session State
Agents in an orchestration share a **session state**:
- Each agent writes its output to shared state
- The next agent reads from shared state
- State is a key-value store accessible to all agents in the session
- Enables data flow between agents without explicit parameter passing

### Agent-to-Agent Communication (A2A Protocol)
ADK supports the **A2A protocol** for communication between agents that may be running as separate services:

- **Agent Cards** -- agents advertise their capabilities via JSON descriptors
- **Tasks** -- structured work items exchanged between agents
- **Transport** -- HTTP, SSE, JSON-RPC 2.0

ADK 2.0 includes A2A 1.x support, enabling agents to:
- Discover other agents and their capabilities
- Send task requests to remote agents
- Receive results asynchronously
- Operate across organizational and vendor boundaries

### Skill Registries
ADK 2.0 added **skill registries** for agent and skill discovery:
- Agents register their skills in a registry
- Other agents discover skills through the registry
- Enables dynamic composition of agent capabilities

## Evaluation

ADK includes built-in evaluation capabilities:
- Evaluate agent behavior against test cases
- Measure quality metrics (accuracy, relevance, etc.)
- Compare agent versions
- NEEDS VERIFICATION: Specific evaluation metrics and methodology

## Deployment

### Vertex AI Agent Engine
- Managed runtime for ADK agents on Google Cloud
- Autoscaling, monitoring, and lifecycle management
- Integration with Vertex AI models and grounding services

### Google Kubernetes Engine (GKE)
- Deploy ADK agents as containerized workloads on GKE
- Full control over infrastructure and scaling
- Official tutorial available for GKE deployment

### Self-Hosted
- ADK is open-source -- agents can run anywhere
- Docker containers, VMs, or bare metal
- Not locked to Google Cloud

## Development Experience

### Web UI
- Graph and trace views for visualizing agent execution
- Debugging tools for inspecting agent reasoning
- Session replay for understanding agent behavior

### Testing
- Local development and testing without cloud deployment
- Unit testing support for individual agents
- Integration testing for multi-agent workflows

## Key Design Decisions

1. **Open-source and multi-language** -- Python, Go, Java, TypeScript under Apache-2.0
2. **Workflow agents as first-class primitives** -- Sequential, Parallel, Loop, Graph are built-in, not afterthoughts
3. **A2A protocol support** -- first-class support for the open inter-agent communication standard
4. **MCP bidirectional support** -- consume MCP servers AND expose agents as MCP servers
5. **Graph workflows in 2.0** -- directed graph composition with runtime routing, recovery, and human-in-the-loop
6. **Model-agnostic through LiteLLM** -- works with Gemini, Claude, Llama, Mistral, and others

## NEEDS VERIFICATION
- Exact performance characteristics of graph workflows at scale
- Full list of built-in tools beyond Google Search and Code Execution
- Evaluation framework specifics (metrics, methodology)
- Agent Engine pricing and GA status
- Whether skill registries support cross-organization discovery
- LiteLLM integration completeness -- which providers and models are fully supported
