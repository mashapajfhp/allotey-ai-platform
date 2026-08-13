# Lessons from Google's AI Platform

**STATUS: RESEARCHED -- Analysis based on Google's platform architecture, ADK, A2A, and enterprise patterns**

## A2A Protocol Significance

### What Google Got Right

The Agent-to-Agent (A2A) protocol is arguably Google's most important contribution to the AI platform landscape -- more important than any specific product. Key design decisions worth studying:

#### 1. Open Standard from Day One
- Released in April 2025 under Apache-2.0
- Donated to the Linux Foundation for vendor-neutral governance
- 150+ organizations supporting by April 2026 (Google, Microsoft, AWS, Salesforce, SAP, ServiceNow, Workday, IBM)
- Version 1.0.1 (May 2026) added extension mechanisms

**Why this matters**: Multi-agent systems will inevitably span organizational and vendor boundaries. Without an open standard, every agent-to-agent integration becomes a custom point-to-point connection. A2A is to agents what HTTP is to web services.

#### 2. Three-Layer Architecture
A2A defines three foundational things:

| Layer | Purpose | Implementation |
|-------|---------|---------------|
| **Agent Cards** | How agents advertise capabilities | JSON descriptors |
| **Tasks** | Structure for work exchange | Typed task definitions with status |
| **Transport** | Wire protocol | HTTP, SSE, JSON-RPC 2.0 |

This separation is clean: discovery (Agent Cards), work (Tasks), and communication (Transport) are independent concerns.

#### 3. Complementary to MCP
A2A and MCP serve different purposes:
- **MCP** = agent-to-tool communication (agent calls a tool)
- **A2A** = agent-to-agent communication (agent delegates to another agent)

Both are needed. An agent uses MCP to access tools and A2A to communicate with peer agents. Google supporting both in ADK is the right design.

### What to Learn
- **Adopt A2A for inter-agent communication.** It is becoming the standard, with broad industry support
- **Agent Cards are a useful pattern** even outside A2A -- having agents publish machine-readable capability descriptions enables dynamic composition
- **Separate tool access (MCP) from agent communication (A2A).** They solve different problems
- **Extension mechanisms matter.** A2A 1.0.1's extension support ensures the protocol can evolve without breaking existing implementations

### What NOT to Copy
- **Don't assume A2A solves governance.** Research papers (2026) point out that A2A, MCP, and ACP "cannot express" certain governance requirements. Authorization, trust boundaries, and data policies need additional layers on top of A2A
- **Don't wait for A2A to be "complete."** Adopt it now for what it provides (discovery, task exchange, transport) and layer governance on top

## ADK Patterns

### What Google Got Right

#### 1. Workflow Agents as First-Class Primitives
ADK's workflow agents (Sequential, Parallel, Loop) are not utilities or afterthoughts -- they are core agent types with the same status as LLM agents.

**Why this matters**: Most production multi-agent systems are not pure LLM reasoning. They are structured workflows with deterministic control flow (do A then B then C), where individual steps may use LLM reasoning. ADK acknowledges this reality.

**What to learn**: Build workflow patterns into the framework, not as extensions. Developers should reach for `SequentialAgent` as naturally as they reach for an LLM agent.

#### 2. Graph Workflows (ADK 2.0)
The graph workflow model in ADK 2.0 is the most sophisticated orchestration primitive in any major agent framework:
- Directed graph composition of agents and deterministic nodes
- Runtime routing conditions (not compile-time)
- State-based recovery after failure
- Resumable human-in-the-loop execution

**What to learn**: For complex orchestration, a graph model with runtime routing is more expressive and maintainable than nested sequential/parallel compositions. The ability to resume from checkpoints is critical for long-running, multi-step agent workflows.

#### 3. Shared Session State
ADK's approach to inter-agent data flow through shared session state is simple and effective:
- No complex message passing or event bus
- Each agent reads from and writes to a shared key-value state
- The state flows through the workflow naturally

**What to learn**: Start simple. Shared state is sufficient for most multi-agent patterns. Only add more complex coordination (message queues, event streaming) when shared state is demonstrably insufficient.

#### 4. Multi-Language Support
Python, Go, Java, and TypeScript support from early on means enterprises can build agents in their existing language ecosystems.

**What to learn**: Multi-language support matters for enterprise adoption. Not every team writes Python.

### What NOT to Copy
- **ADK's coupling to Gemini for best performance.** While LiteLLM enables other models, the best experience is with Gemini. A more model-agnostic design would be preferable for a platform-neutral effort
- **Rapid feature addition without stabilization.** ADK 2.0 added graph workflows, skill registries, A2A support, state-based recovery, and more -- the surface area is growing fast. Stability and documentation may lag features

## Multi-Agent Orchestration Approaches

### Patterns from Google's Ecosystem

#### Pattern 1: Pipeline (Sequential Agent)
Best for: multi-step processing where each step depends on the previous
```
Fetch -> Parse -> Analyze -> Summarize -> Present
```
Google's implementation: `SequentialAgent` with shared state passing

#### Pattern 2: Fan-Out/Fan-In (Parallel Agent)
Best for: gathering information from multiple independent sources
```
API 1 --|
API 2 --+--> Aggregate
API 3 --|
```
Google's implementation: `ParallelAgent` with shared state aggregation

#### Pattern 3: Iterative Refinement (Loop Agent)
Best for: quality improvement through repeated evaluation
```
Draft -> Review -> [Pass?] -> Done
  ^                  |
  +--- [Fail] -------+
```
Google's implementation: `LoopAgent` with exit conditions

#### Pattern 4: Router (Graph Workflow)
Best for: complex flows with conditional branching
```
Classify --> [Type A?] --> Specialist A --> Merge
                |
             [Type B?] --> Specialist B --> Merge
```
Google's implementation: ADK 2.0 graph workflow with routing conditions

#### Pattern 5: Delegation (LLM Agent with Sub-Agents)
Best for: dynamic task decomposition by an intelligent orchestrator
```
Manager Agent --> [Reasoning] --> Delegate to appropriate sub-agent
```
Google's implementation: LLM agent with `sub_agents` list; model decides delegation

### What to Learn
- **Most orchestration patterns are combinations** of these five primitives. Having all five as first-class framework constructs covers the vast majority of use cases
- **Deterministic workflow agents complement LLM reasoning.** Not every decision should be made by a model. Use workflow agents for predictable control flow and LLM agents for decisions requiring reasoning
- **Shared state is the simplest coordination mechanism.** Use it first. Add more complex patterns (events, queues) only when needed

## Grounding Patterns

### Google Search Grounding
The ability to ground model responses in real-time Google Search results is a unique capability:
- **No enterprise has this data.** Web search grounding provides information that internal knowledge bases cannot
- **Freshness.** Search results are always current, unlike static knowledge bases
- **Verifiability.** Cited search results can be checked by users

**What to learn**: Consider web search grounding as a complement to enterprise knowledge bases, not a replacement. Some questions are best answered by enterprise data; others by current web information.

## Summary: What to Take Forward

| Pattern | Adopt? | Notes |
|---------|--------|-------|
| A2A protocol for inter-agent communication | YES | Industry standard; broad adoption |
| Agent Cards for capability discovery | YES | Useful even without full A2A |
| Workflow agents as first-class primitives | YES | Pipeline, fan-out, loop, graph, delegation |
| Graph workflows with runtime routing | YES | Most expressive orchestration model |
| Shared session state for inter-agent data | YES | Simple and effective |
| MCP + A2A together (tools vs. agents) | YES | Complementary protocols |
| Multi-language framework support | YES | Enterprise reality |
| State-based recovery / checkpointing | YES | Critical for production reliability |
| Human-in-the-loop as a workflow primitive | YES | Essential for enterprise trust |
| Web search grounding (concept) | PARTIAL | Valuable but may not be replicable with Google Search specifically |
| Tight coupling to one model provider | NO | Framework should be truly model-agnostic |
| Rapid feature surface expansion | NO | Stability and documentation matter |
