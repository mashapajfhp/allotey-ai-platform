# Agent Framework -- Building, Evaluating, and Deploying AI Agents

STATUS: RESEARCH COMPLETE -- August 2026

## Overview

The **Mosaic AI Agent Framework** is Databricks' system for building, evaluating, deploying, and monitoring AI agents. It is tightly integrated with MLflow 3, Unity Catalog, and Model Serving. The framework supports single agents, multi-agent systems, and a managed **Supervisor Agent** for orchestrating complex multi-agent workflows.

## Agent Types and Building Approaches

### Custom Agents
Build agents using any Python framework, then deploy on Databricks:

- **LangChain / LangGraph agents**: Supported as a first-class pattern
- **OpenAI Agents SDK**: Supported for building multi-agent systems on Databricks
- **Raw Python agents**: Any Python code that follows the MLflow model signature can be deployed
- **Databricks Agent API**: Native API for defining agents with model, tools, and instructions

### Agent Bricks (Pre-built Agents)
Databricks provides pre-built agent components:

- **Genie Agent**: Natural language data querying (backed by Genie Spaces)
- **Supervisor Agent**: Multi-agent orchestration (see below)
- **Retrieval Agent**: RAG-based question answering using AI Search

### Supervisor API (Beta)
A simplified API for building agents without managing the agent loop:

```python
# Conceptual -- define agent with model, tools, and instructions
response = supervisor.run(
    model="databricks-claude-sonnet-4",
    tools=[uc_function_tool, genie_tool, search_tool],
    instructions="You are a financial analyst assistant...",
    messages=[{"role": "user", "content": "Analyze Q2 revenue trends"}]
)
```

Key properties:
- You define the model, tools, and instructions in one request
- Databricks runs the **agent loop**: repeatedly calling the model, selecting and executing tools, synthesizing a final response
- Supports **background mode** for long-running tasks
- Built-in access controls -- end users only access subagents and data they have permission for

## Tool Calling and UC Functions

### Unity Catalog Functions as Tools

Any function registered in Unity Catalog can be used as an agent tool:

- SQL UDFs, Python UDFs, and AI functions are all valid tool types
- When deployed as MCP servers, UC functions are **automatically exposed as MCP tools** with no additional configuration
- Tool execution respects the **caller's Unity Catalog permissions** -- an agent cannot escalate privileges through tool calls
- The **Unity Catalog AI Integrations Function Client** provides a unified interface for agent frameworks to discover and invoke UC functions

### Tool Categories Available to Agents
1. **UC Functions**: Custom business logic, data transformations, API calls
2. **Genie**: Natural language data querying
3. **AI Search**: Vector/hybrid search over knowledge bases
4. **SQL execution**: Direct SQL against Databricks SQL warehouses
5. **External MCP servers**: Third-party tools connected via MCP protocol
6. **Custom agent endpoints**: Other deployed agents as tools

## Supervisor Agents and Multi-Agent Patterns

### Supervisor Agent (GA as of February 2026)

The Supervisor Agent orchestrates multiple sub-agents from a single entry point:

- **Sub-agent types**: Genie Agents, agent endpoints, UC functions, MCP servers, custom agents
- **Orchestration patterns**: The supervisor uses AI to determine which sub-agent(s) to invoke based on the user's request
- **Task delegation**: Complex requests are decomposed and routed to appropriate specialist agents
- **Result synthesis**: The supervisor combines outputs from multiple sub-agents into a coherent response
- **Natural language feedback**: Subject matter experts can adjust agent behavior by providing natural language instructions (not code changes)

### Multi-Agent Architecture Patterns

Databricks supports several multi-agent patterns:

1. **Supervisor pattern**: A central supervisor routes requests to specialist agents
2. **Pipeline pattern**: Agents chain sequentially (output of one feeds input of next)
3. **Collaborative pattern**: Agents interact with each other, sharing context
4. **Databricks Apps multi-agent**: Build multi-agent systems as Databricks Apps with custom UI

### Access Control in Multi-Agent Systems
- The supervisor enforces that end users can **only access sub-agents and data they are authorized for**
- Each sub-agent's permissions are scoped by Unity Catalog
- This is critical: a user asking a supervisor about HR data will be blocked if they lack HR table permissions, even if the HR sub-agent exists

## MLflow Integration

### MLflow 3 for Agents

MLflow 3.x is the recommended version and provides:

- **Experiment tracking**: Log agent configurations, prompts, and evaluation results
- **Model logging**: Log agents as MLflow models for reproducible deployment
- **Model registry**: Register agent versions in Unity Catalog with aliases ("production", "staging")
- **Tracing**: OpenTelemetry-compatible tracing captures the full agent execution path

### MLflow Tracing

Tracing captures detailed execution information through **spans**:

- Each span encapsulates a code segment with inputs, outputs, and timing data
- Automatic instrumentation for popular GenAI libraries (LangChain, OpenAI, etc.)
- Captures: LLM calls, tool calls, retrieval operations, prompt construction
- Traces are visible in the MLflow UI and queryable via API
- Production traces feed into monitoring dashboards

## Agent Evaluation

### Built-in Evaluation Framework

Agent Evaluation (integrated with MLflow 3) measures agent quality:

- **LLM Judges**: Built-in AI judges that score agent responses on dimensions like correctness, groundedness, relevance, and safety
- **Custom scorers**: Define custom evaluation functions for domain-specific quality metrics
- **Evaluation datasets**: Curate test sets with expected inputs and (optionally) expected outputs
- **Retrieval evaluation**: Measures retrieval precision and recall for RAG agents
- **Comparison**: Compare agent versions side-by-side

### Evaluation Workflow
1. Define evaluation dataset (questions + optional expected answers)
2. Run agent against evaluation dataset
3. Built-in judges score each response
4. Results logged to MLflow experiment
5. Compare versions to identify regressions

### Review App
- A built-in UI for **human stakeholder review** of agent responses
- Deployed agents automatically integrate with the Review App
- Domain experts rate responses, flag errors, and provide corrections
- Feedback feeds back into evaluation datasets

## Deployment

### Model Serving for Agents

Agents are deployed as **Model Serving endpoints**:

```python
from databricks.agents import deploy

deploy(
    model_name="catalog.schema.my_agent",
    model_version=3,
    endpoint_name="my-agent-endpoint"
)
```

Properties:
- **Serverless scaling**: Auto-scales based on traffic
- **Built-in monitoring**: Latency, error rates, token usage tracked automatically
- **MLflow 3 integration**: Deployed agents emit traces to MLflow
- **Review App**: Automatically available for deployed agents
- **Unity AI Gateway**: Agent endpoints can be governed by AI Gateway (rate limits, guardrails, audit)

### Databricks Apps
For agents that need a custom UI:
- Build a full application (Streamlit, Gradio, or custom frontend)
- Application runs on Databricks-managed infrastructure
- Connects to agent endpoints and other Databricks services

NEEDS VERIFICATION: Whether the Supervisor API has moved beyond Beta to GA as of August 2026. The Supervisor Agent (pre-built) is GA, but the lower-level Supervisor API was still listed as Beta in the most recent documentation reviewed.

## Key Architectural Insight

The most distinctive aspect of Databricks' agent architecture is that **tools, data, models, and governance share a single platform**. An agent built on Databricks does not need separate systems for:
- Tool definitions (UC functions)
- Data access (Unity Catalog tables)
- Model hosting (Model Serving)
- Retrieval (AI Search)
- Governance (Unity Catalog + AI Gateway)
- Evaluation (MLflow)
- Monitoring (MLflow tracing + Lakehouse Monitoring)

This integration eliminates many of the "glue" problems that plague agent systems built on separate components.
