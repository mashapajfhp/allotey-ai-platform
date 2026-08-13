# Agent Runtime Frameworks -- Deep Comparison

**Date:** 2026-08-13
**Mandate:** Open-source-first, NO paid dependencies. Only MIT, Apache 2.0, or MPL-2.0 (with discipline) are acceptable. SSPL, AGPL, and custom licenses are OUT.

---

## 1. Summary Comparison Table

| Dimension | LangGraph | Agno | Google ADK | Strands Agents |
|-----------|-----------|------|------------|----------------|
| **License** | MIT | Apache 2.0 (was MPL-2.0 under Phidata) | Apache 2.0 | Apache 2.0 |
| **Latest Version** | 1.2.11 (Aug 11, 2026) | 2.8.7 (2026) | 2.6.3 (Aug 7, 2026) | 1.51.0 (Aug 7, 2026) |
| **GitHub Stars** | ~39.6k | ~41.7k | ~21.1k | ~6.9k |
| **Contributors** | ~600+ (LangChain ecosystem) | ~400+ | NEEDS VERIFICATION (~200+) | NEEDS VERIFICATION (~100+) |
| **Language Support** | Python, TypeScript (JS) | Python only | Python, TypeScript, Go, Java, Kotlin | Python, TypeScript |
| **Core Abstraction** | StateGraph (nodes + edges + state) | Agent -> Team -> Workflow hierarchy | Agent class hierarchy + Workflow agents | Agent (model-driven loop) |
| **Graph-Based Workflows** | Native (core abstraction) | Via Workflow class (code-driven) | Yes (ADK 2.0 Workflow class) | Yes (Graph orchestrator) |
| **Checkpointing / Durability** | First-class (checkpoint-postgres, checkpoint-sqlite) | Session storage (PostgreSQL, SQLite, MongoDB, Redis) | DatabaseSessionService (PostgreSQL, MySQL, SQLite) | SessionManager (S3, custom backends) |
| **Human-in-the-Loop** | interrupt_before, interrupt_after, interrupt() function | requires_confirmation, HITL on tools/workflows | Tool confirmation flow | Interrupt/resume, HumanInTheLoop handler |
| **MCP Support** | Via langchain-mcp-adapters (client) | First-class (client) | Bidirectional (client + server) | Built-in MCPClient (client) |
| **A2A Protocol** | Not native (custom implementation needed) | First-class support | First-class (RemoteA2aAgent) | Server + Client + Tool integration |
| **Multi-Agent Patterns** | Supervisor, Swarm, Subgraphs, Handoffs | Team delegation, parallel/sequential | Sequential, Parallel, Loop, Graph, Hierarchical | Agents-as-Tools, Swarm, Graph, Workflow |
| **Memory System** | Short-term (state), Long-term (Store) | Automatic + Agentic memory, per-user | Session state + Memory service | Session persistence + MemoryManager |
| **Knowledge/RAG** | Via LangChain retrievers | Built-in Knowledge class, 25+ vector DBs | Via tools and extensions | Via tools |
| **RBAC / Multi-Tenancy** | Not built-in (DIY) | JWT-based RBAC, multi-tenant isolation | Not built-in (via Vertex AI) | Not built-in (via AWS IAM/AgentCore) |
| **Observability** | LangSmith (paid), OpenTelemetry via integrations | Native OpenTelemetry, audit logs | Built-in eval system, Cloud Trace | OpenTelemetry, X-Ray (optional) |
| **Streaming** | SSE, astream_events, token-level streaming | SSE, WebSockets | Streaming support | Bidirectional streaming (Python) |
| **Cloud Dependency** | None (LangGraph Cloud is optional paid) | None (AgentOS Control Plane is optional $150/mo) | None required (Vertex AI optional) | None required (Bedrock AgentCore optional) |
| **Model Agnostic** | Yes (any LLM via LangChain or direct) | Yes (23+ providers) | Yes (optimized for Gemini, others supported) | Yes (Bedrock, Anthropic, OpenAI, Gemini, Ollama, LiteLLM) |
| **Maturity** | Production (v1.0 Oct 2025, now 1.2.x) | Production (v2.x, fast iteration) | Production (v2.x, ADK 2.0 introduced graph workflows) | Production/Stable (v1.0 Jul 2025) |
| **Monthly Downloads** | ~47M+ (PyPI) | NEEDS VERIFICATION | NEEDS VERIFICATION | ~14M+ (first year) |
| **Eval Framework** | Via LangSmith / custom | NEEDS VERIFICATION | Built-in `adk eval` with evalsets + LLM-as-judge | strands-agents-evals package |

---

## 2. Architecture Analysis

### 2.1 LangGraph

**Core Model: Graph-as-Runtime**

LangGraph treats agent logic as a directed graph. The `StateGraph` is the central abstraction:

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

class AgentState(TypedDict):
    messages: list
    next_step: str

graph = StateGraph(AgentState)
graph.add_node("research", research_node)
graph.add_node("write", write_node)
graph.add_edge(START, "research")
graph.add_conditional_edges("research", route_fn, {"write": "write", "done": END})
graph.add_edge("write", END)

app = graph.compile(checkpointer=postgres_checkpointer)
```

**Package Structure (Monorepo):**
- `langgraph` -- Core graph engine
- `langgraph-checkpoint` -- Base checkpoint abstraction
- `langgraph-checkpoint-postgres` -- PostgreSQL persistence (v3.0.2)
- `langgraph-checkpoint-sqlite` -- SQLite persistence
- `langgraph-prebuilt` -- Pre-built agent patterns (ReAct, etc.)
- `langgraph-sdk-py` -- Python SDK for LangGraph Platform
- `langgraph-sdk-js` -- JavaScript SDK
- `langgraph-cli` -- CLI tools

**Strengths:**
- Most mature graph-based agent framework
- Excellent checkpointing with PostgreSQL support
- Strong interrupt/resume mechanism for human-in-the-loop
- Can be used without LangChain (standalone)
- Large ecosystem and community (39.6k stars, 47M+ monthly downloads)

**Weaknesses:**
- State management is the #1 source of production incidents (~60% per reports)
- Cross-graph state sharing is awkward, race conditions reported
- Debugging story is worse than custom loops for complex graphs
- Testing full graphs requires extensive mocking
- Security vulnerabilities found in checkpointer (CVE-2025-67644, CVE-2026-28277, CVE-2026-27022)
- No built-in RBAC or multi-tenancy

### 2.2 Agno

**Core Model: Agent-Team-Workflow Hierarchy**

Agno uses a three-layer architecture with increasing levels of orchestration:

```python
from agno.agent import Agent
from agno.team import Team
from agno.workflow import Workflow
from agno.models.openai import OpenAIChat
from agno.tools.web import WebTools
from agno.storage.postgres import PostgresStorage
from agno.memory.postgres import PostgresMemoryDb

# Layer 1: Agent
researcher = Agent(
    name="Researcher",
    model=OpenAIChat(id="gpt-4o"),
    tools=[WebTools()],
    memory=AgentMemory(db=PostgresMemoryDb(db_url="...")),
    storage=PostgresStorage(db_url="..."),
)

# Layer 2: Team
team = Team(
    name="Research Team",
    members=[researcher, writer, reviewer],
    mode="coordinate",  # or "route", "collaborate"
)

# Layer 3: Workflow
workflow = Workflow(
    name="Content Pipeline",
    steps=[research_step, write_step, review_step],
)
```

**Three-Layer Runtime:**
1. **SDK Layer** -- Agent, Team, Workflow, Model, Tool classes
2. **AgentOS Runtime** -- Stateless FastAPI server with REST/WebSocket endpoints, auth, lifecycle
3. **Control Plane** -- Web UI (os.agno.com) for monitoring (optional, paid $150/mo)

**Strengths:**
- Most complete out-of-the-box feature set (RBAC, multi-tenancy, memory, knowledge)
- JWT-based RBAC and multi-tenant isolation built in
- 25+ vector database adapters for knowledge/RAG
- 100+ pre-built tool integrations
- Native MCP and A2A protocol support
- OpenTelemetry tracing built in
- AgentOS runs on your infrastructure, data stays in your database
- Apache 2.0 license (changed from MPL-2.0 in Jan 2025)
- Active community (41.7k stars, 400+ contributors)

**Weaknesses:**
- Python only (no TypeScript SDK)
- Fast iteration pace means API surface can change between minor versions
- AgentOS control plane UI is proprietary (not needed but adds value)
- Relatively new compared to LangGraph
- Less graph-level control than LangGraph for complex state machines

### 2.3 Google ADK

**Core Model: Agent Class Hierarchy + Workflow Agents**

ADK uses a class-based agent model with built-in workflow orchestration:

```python
from google.adk.agents import Agent, SequentialAgent, ParallelAgent, LoopAgent
from google.adk.workflows import Workflow
from google.adk.tools import FunctionTool
from google.adk.sessions import DatabaseSessionService

# Simple Agent
researcher = Agent(
    name="researcher",
    model="gemini-2.0-flash",
    instruction="Research the given topic thoroughly.",
    tools=[search_tool, web_tool],
)

# Workflow Agents
pipeline = SequentialAgent(
    name="pipeline",
    sub_agents=[researcher, writer, reviewer],
)

# Graph-Based Workflow (ADK 2.0+)
workflow = Workflow(
    name="routing_workflow",
    edges=[
        ("START", process_message, router),
        (router, {
            "output-1": response_1,
            "output-2": response_2,
        }),
    ],
)

# Session Persistence
session_service = DatabaseSessionService(db_url="postgresql://...")
```

**Key Components:**
- `Agent` -- LLM-based agent with tools and instructions
- `SequentialAgent` -- Runs sub-agents in order
- `ParallelAgent` -- Runs sub-agents concurrently
- `LoopAgent` -- Repeats until stop condition
- `Workflow` -- Graph-based directed execution (ADK 2.0)
- `RemoteA2aAgent` -- A2A protocol integration

**Strengths:**
- Multi-language support (Python, TypeScript, Go, Java, Kotlin)
- Bidirectional MCP support (both client and server)
- Deep A2A protocol support with Agent Cards
- Built-in evaluation framework (`adk eval`)
- Graph-based workflows in ADK 2.0
- Session persistence via SQLAlchemy (PostgreSQL, MySQL, SQLite)
- Interactive dev tools (`adk run`, `adk web`)
- Active development backed by Google
- Apache 2.0 license

**Weaknesses:**
- Optimized for Gemini models (others work but not primary focus)
- Memory persistence requires community extensions (DatabaseMemoryService)
- No built-in RBAC or multi-tenancy (relies on Vertex AI or custom)
- Google Cloud integration path is strongly suggested
- Relatively newer ecosystem (21.1k stars)
- ADK 2.0 breaking changes from 1.x
- Security incident: malicious GitHub issue exploiting AI workflows (Aug 2026)

### 2.4 Strands Agents

**Core Model: Model-Driven Agent Loop**

Strands takes a fundamentally different approach -- instead of developers defining explicit graphs, the LLM decides at runtime which tools to call:

```python
from strands import Agent
from strands.models import AnthropicModel
from strands_agents.multiagent import GraphAgent, SwarmAgent

# Simple Agent (3 lines)
agent = Agent(
    model=AnthropicModel(model_id="claude-sonnet-4-20250514"),
    tools=[search_tool, calculator_tool],
)
result = agent("What is the population of Tokyo?")

# Multi-Agent Graph
graph = GraphAgent(
    agents={"researcher": researcher, "writer": writer},
    edges=[("researcher", "writer")],
)

# Swarm (model-driven handoffs)
swarm = SwarmAgent(
    agents=[researcher, writer, reviewer],
)
```

**Key Components:**
- `Agent` -- Model-driven execution loop
- `MCPClient` -- Built-in MCP tool provider
- `GraphAgent` -- Deterministic graph orchestration
- `SwarmAgent` -- Dynamic model-driven handoffs
- `SessionManager` -- Persistent sessions (S3, custom)
- `MemoryManager` -- Cross-session durable memory
- `HumanInTheLoop` -- Interrupt/resume handler

**Strengths:**
- Simplest API surface (agent in 3 lines of code)
- Model-driven approach reduces orchestration boilerplate
- Strong MCP support (built-in, default dependency)
- A2A support (server, client, tool integration)
- AWS backing with significant production usage (Amazon Q, Kiro, AWS Glue)
- Both Python and TypeScript SDKs
- Apache 2.0 license with no AWS coupling required
- 14M+ downloads in first year

**Weaknesses:**
- Smallest community (6.9k stars)
- Session persistence backends limited (S3, custom -- no native PostgreSQL)
- No built-in RBAC or multi-tenancy
- Memory system less mature than Agno
- Default to Bedrock may confuse users about AWS coupling
- Knowledge/RAG not built in (via tools only)
- Durability concerns raised (no durable execution guarantee like LangGraph)
- A2A not supported in Swarm patterns yet

---

## 3. API Surface Comparison

### Concepts a Developer Must Learn

| Concept | LangGraph | Agno | Google ADK | Strands |
|---------|-----------|------|------------|---------|
| Core class | StateGraph | Agent | Agent | Agent |
| State schema | TypedDict/Pydantic | Built-in session | Session state | Agent context |
| Nodes | Functions | Agents in Team | Sub-agents | Tools |
| Edges | add_edge, add_conditional_edges | Team mode (route/coordinate) | edges parameter in Workflow | Graph edges |
| Compilation | .compile() | N/A | N/A | N/A |
| Checkpointer | Separate class | PostgresStorage | DatabaseSessionService | SessionManager |
| Memory | Store (separate) | AgentMemory + MemoryDb | MemoryService (community) | MemoryManager + MemoryStore |
| Tools | ToolNode, @tool | @tool, Toolkit classes | FunctionTool, MCPTool | @tool, MCPClient |
| Interrupts | interrupt(), interrupt_before/after | requires_confirmation | Tool confirmation | HumanInTheLoop handler |
| Multi-agent | Subgraphs, Supervisor, Swarm | Team class | SequentialAgent, ParallelAgent | GraphAgent, SwarmAgent |

**API Complexity Ranking (simplest to most complex):**
1. **Strands** -- Minimal concepts, model decides execution path
2. **Agno** -- Clear hierarchy (Agent -> Team -> Workflow) with batteries included
3. **Google ADK** -- Agent class hierarchy with workflow agents
4. **LangGraph** -- Most concepts to learn (StateGraph, nodes, edges, channels, reducers, checkpointers, compilation)

---

## 4. Open-Source Purity Assessment

### What is Truly OSS vs Cloud-Only

| Component | LangGraph | Agno | Google ADK | Strands |
|-----------|-----------|------|------------|---------|
| **Core SDK** | MIT -- fully OSS | Apache 2.0 -- fully OSS | Apache 2.0 -- fully OSS | Apache 2.0 -- fully OSS |
| **Graph/Workflow Engine** | OSS | OSS | OSS | OSS |
| **Checkpointing/Persistence** | OSS (PostgreSQL, SQLite) | OSS (PostgreSQL, SQLite, MongoDB, Redis) | OSS (SQLAlchemy backends) | OSS (S3, custom) |
| **Human-in-the-Loop** | OSS | OSS | OSS | OSS |
| **MCP Integration** | OSS (langchain-mcp-adapters) | OSS | OSS | OSS |
| **A2A Integration** | N/A | OSS | OSS | OSS |
| **RBAC / Multi-Tenancy** | N/A (DIY) | OSS (JWT RBAC in AgentOS) | Cloud-only (Vertex AI) | Cloud-only (AWS IAM) |
| **Observability** | LangSmith (PAID), or OSS alternatives | OSS (OpenTelemetry) | Cloud Trace or OSS alternatives | OSS (OpenTelemetry) + X-Ray (optional) |
| **Web UI / Dashboard** | LangGraph Platform (PAID) | AgentOS Control Plane (PAID $150/mo) | `adk web` (OSS) | N/A |
| **Managed Deployment** | LangGraph Cloud (PAID) | Multi-cloud templates (OSS) | Vertex AI Agent Engine (PAID) | Bedrock AgentCore (PAID) |
| **Eval Framework** | LangSmith (PAID) | NEEDS VERIFICATION | `adk eval` (OSS) | strands-agents-evals (OSS) |

### Verdict on Open-Source Purity

1. **LangGraph** -- Core is fully MIT OSS. But the observability story (LangSmith) and platform features (Cloud) push toward paid. You CAN self-host everything but lose monitoring/eval convenience.

2. **Agno** -- Most complete OSS offering. RBAC, multi-tenancy, persistence, observability all in the open-source layer. Only the control plane UI is paid ($150/mo), and it is optional. **Best OSS purity for enterprise features.**

3. **Google ADK** -- Core is Apache 2.0, but the strong pull toward Vertex AI for production deployment is real. RBAC and multi-tenancy only via GCP services. Dev tools (`adk web`, `adk eval`) are genuinely OSS.

4. **Strands** -- Core is Apache 2.0 and truly model-agnostic. But production deployment patterns lean heavily toward AWS Bedrock AgentCore. Session persistence defaults to S3. RBAC via AWS IAM only. Most self-hostable of the cloud-backed options.

---

## 5. Multi-Tenancy and Authorization Readiness

| Capability | LangGraph | Agno | Google ADK | Strands |
|------------|-----------|------|------------|---------|
| **Built-in RBAC** | No | Yes (JWT-based) | No | No |
| **Multi-tenant isolation** | No (DIY via thread_id scoping) | Yes (per-user, per-session) | No (via Vertex AI) | No (via AWS IAM) |
| **Per-agent permissions** | No | Yes | No | No |
| **User context propagation** | Via state/config | Via user_id on Agent/Session | Via session user context | Via agent context |
| **Audit trail** | Via LangSmith (paid) or custom | Built-in via OpenTelemetry | Via Cloud Trace or custom | Via OpenTelemetry / X-Ray |
| **Data isolation** | Via separate checkpointer threads | Via database-level isolation | Via separate sessions | Via separate S3 prefixes |
| **Production readiness** | Requires significant custom work | Production-ready out of box | Requires GCP services or custom work | Requires AWS services or custom work |

**Assessment:** Agno is the ONLY framework with built-in, OSS multi-tenancy and RBAC. All others require custom implementation or cloud service integration. For an enterprise platform, this is a significant differentiator.

---

## 6. MCP/A2A Support Depth

### Model Context Protocol (MCP)

| Feature | LangGraph | Agno | Google ADK | Strands |
|---------|-----------|------|------------|---------|
| **MCP Client** | Via langchain-mcp-adapters | First-class | First-class | Built-in (MCPClient) |
| **MCP Server** | Not native | NEEDS VERIFICATION | First-class | Via strands-agents-mcp-server |
| **Transport: stdio** | Yes (via adapter) | Yes | Yes | Yes |
| **Transport: SSE** | Yes (via adapter) | Yes | Yes | Yes |
| **Dynamic tool discovery** | Yes | Yes | Yes | Yes |
| **Integration depth** | Adapter layer (indirect) | Native | Native + bidirectional | Native (default dependency) |

**MCP Verdict:** Google ADK has the deepest MCP integration (bidirectional -- both client and server). Strands and Agno have strong native support. LangGraph requires an adapter library.

### Agent-to-Agent Protocol (A2A)

| Feature | LangGraph | Agno | Google ADK | Strands |
|---------|-----------|------|------------|---------|
| **A2A Support** | Not native | First-class | First-class (RemoteA2aAgent) | Server + Client + Tool |
| **Agent Cards** | No | NEEDS VERIFICATION | Yes (/.well-known/agent.json) | Yes |
| **Cross-framework interop** | No | Yes | Yes | Yes |
| **JSON-RPC 2.0** | No | NEEDS VERIFICATION | Yes | Yes |
| **Task management** | No | NEEDS VERIFICATION | Yes (multi-turn, single-turn) | Yes |

**A2A Verdict:** Google ADK and Strands have the most complete A2A implementations. Agno has declared first-class support. LangGraph lacks native A2A, requiring custom implementation.

---

## 7. Human-in-the-Loop Patterns

### LangGraph

```python
# Method 1: Compile-time interrupt points
app = graph.compile(
    checkpointer=checkpointer,
    interrupt_before=["sensitive_action"],
    interrupt_after=["review_step"],
)

# Method 2: Dynamic interrupt (recommended)
from langgraph.types import interrupt, Command

def sensitive_node(state):
    approval = interrupt("Please approve this action")
    if approval == "approved":
        return {"result": execute_action()}
    return {"result": "cancelled"}

# Resume with Command
app.invoke(Command(resume="approved"), config={"thread_id": "123"})
```

**Key properties:** Requires checkpointer. Node re-executes from beginning on resume (must be idempotent). State persists across interrupt boundary.

### Agno

```python
# Tool-level confirmation
@tool(requires_confirmation=True)
def delete_record(record_id: str):
    """Delete a database record."""
    db.delete(record_id)

# Workflow-level confirmation
workflow = Workflow(steps=[
    Step(name="review", requires_confirmation=True, agent=reviewer),
    Step(name="publish", agent=publisher),
])

# Resume via continue_run method
agent.continue_run(run_id="...", approval=True)
```

**Key properties:** First-class design primitive. Works at tool level and workflow step level. Pause/resume via run continuation.

### Google ADK

```python
# Tool confirmation flow
def sensitive_tool(context):
    if not context.user_confirmed:
        return context.request_confirmation(
            "Are you sure you want to proceed?"
        )
    return execute_action()
```

**Key properties:** Confirmation flow built into tool execution context. Integrated with session state.

### Strands

```python
from strands.agent.conversation_manager import HumanInTheLoop

# Handler-based approach
agent = Agent(
    model=model,
    tools=[sensitive_tool],
    conversation_manager=HumanInTheLoop(
        ask=lambda prompt: input(prompt)  # or async callback
    ),
)

# Interrupt/resume pattern
# Agent pauses, caller collects approval, resumes with context
```

**Key properties:** HumanInTheLoop as intervention handler. Interrupt/resume with correlation IDs for complex flows.

**HITL Verdict:** LangGraph has the most flexible and battle-tested interrupt mechanism (arbitrary pause points with full state persistence). Agno has the most ergonomic API (declarative `requires_confirmation`). ADK is straightforward but less flexible. Strands is capable but less documented.

---

## 8. Production Readiness Assessment

| Factor | LangGraph | Agno | Google ADK | Strands |
|--------|-----------|------|------------|---------|
| **v1.0+ Milestone** | v1.0 Oct 2025 | v2.x (mature, fast iteration) | v2.0 2026 (breaking from 1.x) | v1.0 Jul 2025 |
| **Known Production Users** | Klarna, Replit, Elastic | NEEDS VERIFICATION | Google internal, Vertex AI customers | Amazon Q, Kiro, AWS Glue |
| **Durable Execution** | Yes (checkpoint-based) | Yes (session storage) | Yes (session persistence) | Concerns raised (not fully durable) |
| **Horizontal Scaling** | Via checkpointer + stateless workers | AgentOS is stateless by design | Via Cloud Run / containerization | Via Bedrock AgentCore |
| **Error Recovery** | Retry policies, error handlers on nodes | NEEDS VERIFICATION | NEEDS VERIFICATION | Guardrails, steering handlers |
| **Rate Limiting** | DIY | NEEDS VERIFICATION | NEEDS VERIFICATION | DIY |
| **Security Track Record** | 3 CVEs found in checkpointer (2025-2026) | No major CVEs reported | Malicious GH issue exploit (2026) | No major CVEs reported |
| **Backwards Compatibility** | Good (1.x stable) | Fast-moving (potential breaks) | ADK 2.0 broke 1.x compatibility | Good (1.x stable) |

**Production Verdict:**
- **LangGraph** is the most battle-tested in production across diverse enterprises, but has the most reported production incidents related to state management.
- **Agno** has the most complete production feature set out of the box (RBAC, multi-tenancy, observability) but is newer.
- **Google ADK** is production-ready for Gemini-centric workloads and benefits from Google's internal usage.
- **Strands** is production-proven inside AWS products but durability concerns have been raised externally.

---

## 9. Community Health Metrics

| Metric | LangGraph | Agno | Google ADK | Strands |
|--------|-----------|------|------------|---------|
| **GitHub Stars** | ~39.6k | ~41.7k | ~21.1k | ~6.9k |
| **Forks** | ~6.7k | ~5.8k | ~3.8k | ~1.0k |
| **Contributors** | 600+ (ecosystem) | 400+ | ~200+ (NEEDS VERIFICATION) | ~100+ (NEEDS VERIFICATION) |
| **Total Commits** | ~7,041 | ~5,952 | NEEDS VERIFICATION | ~2,440 |
| **Monthly Downloads** | ~47M+ | NEEDS VERIFICATION | NEEDS VERIFICATION | ~14M+ (first year) |
| **Release Cadence** | Weekly | Multiple per month (13 in Jan 2026) | Bi-weekly | Regular |
| **Backed By** | LangChain Inc (VC-funded) | Agno Inc (VC-funded) | Google | AWS/Amazon |
| **Discord/Community** | Large | Growing (200+ new members Jan 2026) | Google Groups / GH Discussions | Discord |
| **Documentation Quality** | Excellent (docs.langchain.com) | Good (docs.agno.com) | Good (adk.dev, google.github.io) | Good (strandsagents.com) |

**Community Verdict:** LangGraph has the largest established community and most production deployments. Agno has the fastest-growing community and highest star count. ADK benefits from Google's reach. Strands is smallest but backed by AWS's distribution (14M downloads in year one).

---

## 10. Recommendation for the Platform

### Context

The Allotey AI Platform requires:
- Open-source-first with MIT/Apache 2.0 licenses only
- Multi-tenancy and RBAC as first-class concerns
- MCP and A2A protocol support for interoperability
- PostgreSQL as the primary persistence backend
- Human-in-the-loop for enterprise approval workflows
- Model-agnostic (not coupled to any single LLM provider)
- Self-hostable without cloud vendor lock-in

### Recommendation: Agno as Primary, LangGraph for Complex State Machines

#### Primary Framework: Agno

**Why Agno wins for this platform:**

1. **License:** Apache 2.0 -- fully compatible with our mandate. The MPL-2.0 concern is moot; the license changed to Apache 2.0 in January 2025.

2. **Multi-Tenancy and RBAC:** The ONLY framework with built-in, OSS JWT-based RBAC and multi-tenant isolation. Every other framework requires custom implementation or cloud service integration. For an enterprise platform, building RBAC from scratch on top of LangGraph or Strands adds months of engineering effort that Agno provides out of the box.

3. **PostgreSQL Native:** PostgresStorage for sessions, PostgresMemoryDb for user memory, PgVector for knowledge/RAG -- all built in. This aligns perfectly with our PostgreSQL-first infrastructure.

4. **Complete Feature Set:** Agent -> Team -> Workflow hierarchy covers simple to complex orchestration patterns. 25+ vector database adapters, 100+ tool integrations, MCP and A2A support -- all OSS.

5. **AgentOS Runtime:** The stateless FastAPI runtime is production-grade, horizontally scalable, and stores ALL data in the operator's database. The $150/mo control plane UI is optional and not required for any functionality.

6. **Human-in-the-Loop:** Declarative `requires_confirmation` on tools and workflow steps is the most ergonomic HITL API of the four frameworks.

7. **Open-Source Purity:** Core SDK, runtime, RBAC, persistence, observability -- all Apache 2.0. Only the dashboard UI is proprietary, and we can build our own or use Grafana/custom dashboards.

#### Secondary Framework: LangGraph (for complex graph workflows)

**When to use LangGraph alongside Agno:**

- Complex state machines with cycles, conditional branching, and sophisticated routing logic
- Workflows requiring fine-grained checkpoint/replay semantics
- Use cases where graph-level debugging and time-travel are critical
- Integration points where the LangChain ecosystem provides unique value

LangGraph's MIT license is the most permissive option, and its checkpoint-postgres backend is production-grade. The StateGraph abstraction is unmatched for complex agent workflows that need explicit control flow.

#### Why Not Google ADK or Strands as Primary?

**Google ADK:**
- Strong framework but no built-in RBAC/multi-tenancy (requires Vertex AI or custom)
- Memory persistence needs community extensions
- Gemini optimization bias (works with others but not primary focus)
- Would be a strong choice for a Google Cloud-centric platform

**Strands Agents:**
- Simplest API but least mature ecosystem
- No native PostgreSQL session persistence (S3-oriented)
- No built-in RBAC/multi-tenancy (requires AWS IAM)
- Durability concerns raised in external analysis
- Best for teams already deep in the AWS ecosystem

### Architecture Strategy

```
Platform Layer
+--------------------------------------------+
|          Allotey AI Platform                |
|  +--------------------------------------+  |
|  |  Authorization & Multi-Tenancy       |  |
|  |  (Agno JWT RBAC + Custom RLS)        |  |
|  +--------------------------------------+  |
|                                            |
|  +------------------+ +------------------+ |
|  | Simple Agents    | | Complex Graphs   | |
|  | Teams/Workflows  | | State Machines   | |
|  | (Agno SDK)       | | (LangGraph)      | |
|  +------------------+ +------------------+ |
|                                            |
|  +--------------------------------------+  |
|  |  Shared Infrastructure               |  |
|  |  PostgreSQL + pgvector               |  |
|  |  MCP/A2A Protocol Layer              |  |
|  |  OpenTelemetry Observability         |  |
|  +--------------------------------------+  |
+--------------------------------------------+
```

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Agno API instability (fast iteration) | Pin versions, wrap in platform abstraction layer |
| Agno Python-only (no TypeScript) | Use A2A/MCP for polyglot agent interop; consider ADK for TypeScript agents |
| LangGraph security vulnerabilities | Pin versions, enable LANGGRAPH_STRICT_MSGPACK, audit checkpointer config |
| Vendor dependency on Agno Inc | Apache 2.0 allows full fork; community is 400+ contributors |
| Framework lock-in | MCP/A2A protocol layer enables framework-agnostic agent communication |

### Final Score Card

| Framework | License Score | Feature Completeness | OSS Purity | Enterprise Readiness | Community Health | **Overall** |
|-----------|--------------|---------------------|------------|---------------------|-----------------|-------------|
| **Agno** | 10/10 (Apache 2.0) | 9/10 | 9/10 | 9/10 (RBAC, multi-tenant) | 8/10 | **9.0** |
| **LangGraph** | 10/10 (MIT) | 8/10 | 7/10 (LangSmith push) | 6/10 (no RBAC) | 9/10 | **8.0** |
| **Google ADK** | 10/10 (Apache 2.0) | 8/10 | 7/10 (GCP pull) | 5/10 (no RBAC) | 7/10 | **7.4** |
| **Strands** | 10/10 (Apache 2.0) | 7/10 | 7/10 (AWS pull) | 5/10 (no RBAC) | 6/10 | **7.0** |

---

*This comparison was compiled on 2026-08-13 from primary sources including GitHub repositories, PyPI release data, official documentation, and community reports. Items marked NEEDS VERIFICATION should be confirmed via direct repository inspection or maintainer contact.*
