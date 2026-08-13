# Palantir Agent Architecture: Deep Study

**STATUS: RESEARCHED -- Based on official Palantir documentation and verified public sources (August 2026)**

---

## 1. How Agents Interact with the Ontology

Palantir's agent architecture is defined by a foundational constraint: **agents do not access underlying database tables directly, nor do they freely scan the complete Ontology schema.** They operate within a configured and authorized boundary, interacting through Ontology-exposed objects, relationships, contexts, functions, and actions.

Within AIP, agents navigate the Ontology using the same objects, logic assets, and action primitives that human operators use. This means:

- Agents see the same business-meaningful abstractions humans see
- Agents are governed by the same security policies as humans
- Agents invoke the same actions (with the same validation and audit) as humans
- The only difference: agents compose these operations through multi-step reasoning rather than manual interaction

## 2. Agent Construction Environments

Palantir provides three tiers of agent construction:

### 2.1 No-Code: AIP Chatbot Studio (formerly AIP Agent Studio)

AIP Chatbot Studio builds **interactive assistants** equipped with enterprise-specific information and tools. Core concepts:

- **Chatbots** -- Interactive assistants that combine LLM reasoning with enterprise context and tools
- **Application State** -- Variables within prompts that customize and control LLM behavior (formerly called "parameters")
- **Retrieval-Augmented Generation (RAG)** -- Leverage external data sources to provide the LLM with relevant information dynamically
- **Retrieval Context** -- Specific information retrieved in response to user messages
- **Vector Embeddings** -- Numerical representations of text for semantic search
- **Context Window** -- The combined token budget: system prompts + conversation history + retrieval context + application state + tools

### 2.2 Low-Code: AIP Logic

AIP Logic serves as the decision-making engine for agents. Engineers build no-code or low-code functions that execute logic across disparate systems. Functions can be chained into multi-step workflows.

### 2.3 Pro-Code: Code Workspaces

Full programmatic control using TypeScript or Python, with access to the Ontology SDK, Functions API, and all platform services. Used for complex orchestration logic that exceeds the capabilities of visual builders.

## 3. Tool Calling

### Types of Tools Available to Agents

Palantir agents have access to six categories of tools:

| Tool Type | What It Does | How Agent Uses It |
|-----------|-------------|-------------------|
| **Action Tools** | Execute Ontology edits | Modify objects, create links, trigger side effects |
| **Object Query Tools** | Query Ontology objects | Filter, aggregate, inspect properties, traverse links |
| **Function Tools** | Call Foundry functions (including AIP Logic functions) | Execute business logic, derive values, run LLM sub-functions |
| **Update Application Variable Tools** | Modify application state | Change chatbot parameters during conversation |
| **Command Tools** | Trigger operations in other Palantir applications | Cross-application orchestration |
| **Request Clarification Tools** | Pause and ask the user for more information | Handle ambiguous requests |

### Tool Calling Modes

**Prompted Tool Calling**
- Instructions are inserted into the prompt to describe available tools
- The LLM decides which tool to invoke based on the prompt
- Only one tool can be invoked per interaction step
- Compatible with all tool types and all available models
- May require longer response times for complex queries needing multiple sequential tool calls

**Native Tool Calling**
- Uses the model's built-in function-calling capabilities (e.g., OpenAI function calling, Claude tool use)
- Greater token efficiency and faster responses
- Supports **parallel tool invocation** -- multiple tools called simultaneously
- Currently limited to: action, object query, function, and update application variable tools
- Only available with a subset of Palantir-provided models

### Agent Tool Descriptions
Developers configure the **Agent tool description** field in the Ontology Manager to control how agents understand each tool. This description guides the LLM on when and how to invoke each action, including required parameters and business logic constraints.

## 4. Multi-Step Reasoning

### Reasoning Chains
AIP agents perform multi-step reasoning by composing tool calls into chains:

1. Agent receives a user request
2. Agent reasons about which tools are needed
3. Agent calls first tool (e.g., object query to find relevant data)
4. Agent processes the result and determines next step
5. Agent calls second tool (e.g., function to compute a recommendation)
6. Agent calls third tool (e.g., action to execute the recommendation)
7. Agent synthesizes results into a response

### Viewing Reasoning
When deployed in edit mode, view mode, Workshop, or AIP Threads, users can select "View reasoning" below a response to investigate the LLM reasoning process -- seeing each tool call, its inputs, outputs, and the LLM's rationale for each step.

### Durable Orchestrations
For complex workflows that span multiple agents or require error handling:

- **Durable orchestrations** can be configured through AIP Logic (low-code) or Code Workspaces (pro-code)
- Handle the choreography of multi-step, multi-agent workflows
- One agent retrieves information, another analyzes it, a third executes tasks, while a coordinator agent tracks overall progress
- Individual orchestrations can be configured with **fallback effects**: error packaging and retry policies (constant backoff, exponential backoff)

## 5. Human-in-the-Loop

Palantir explicitly supports human-in-the-loop patterns at multiple levels:

### 5.1 Proposal-Based Workflow
Rather than directly making changes, AI agents create **proposals**:

- **Synchronous**: Direct integration with AIP Logic functions in Workshop -- proposals appear inline for operator review
- **Asynchronous**: Proposals generated through Automate or Pipeline Builder, surfaced later for operator review

The resulting proposal can then be surfaced to an operator for **refinement, feedback, and a resulting decision.**

### 5.2 Action Confirmation
Action tools can be configured for:
- **Automatic execution** -- Agent applies the action immediately (for low-risk operations)
- **User confirmation** -- Agent proposes the action, waits for user to confirm before execution

### 5.3 Request Clarification
Agents can explicitly pause execution and ask the user for more information using the Request Clarification tool type. This prevents agents from making assumptions when requirements are ambiguous.

### 5.4 Staged Writes
AIP Logic supports staged writes where:
- The LLM generates proposed Ontology edits
- Edits are staged (not yet applied) for human review
- A human operator reviews, modifies if needed, and approves or rejects
- Only approved edits are committed to the Ontology

### 5.5 Safety Principle
The system maintains human-in-the-loop oversight for every critical action, ensuring that while AI suggests the most efficient path, a human operator must validate any decision that impacts physical safety or financial integrity.

## 6. Agent Deployment

### Deployment Surfaces

| Surface | Description |
|---------|-------------|
| **Workshop** | Embedded agent widget within operational applications |
| **AIP Threads** | Standalone conversational interface |
| **View Mode** | Read-only agent interaction |
| **Edit Mode** | Agent with write capabilities |
| **Automate** | Background automation with agent logic |
| **Pipeline Builder** | Agent logic embedded in data pipelines |
| **Published Functions** | Agent logic exposed as callable functions (for use in Evals, other agents) |

### Agent Types

**AIP Chatbots** -- Interactive conversational agents for human users
**AI FDE (Foundation Data Engineering)** -- Autonomous agents for building data pipelines, with integrated change management
**AIP Analyst** -- Autonomous agents for data analysis tasks

### Scaling
The automation runtimes, Ontology backend services, and all other services run on Rubix's ephemeral, autoscaling infrastructure, designed for **tens of thousands of simultaneous agent orchestrations.**

## 7. Agent State and Persistence

### Application State
Agents maintain conversational state through Application State variables:
- Persist across a conversation session
- Can be modified by the agent itself (via Update Application Variable tools)
- Can be set by the application embedding the agent
- Used to customize LLM behavior based on context

### Ontology as State Store
The Ontology itself serves as the persistent state store for agent-mediated operations:
- Changes agents make (via actions) are durably written to the Ontology
- Subsequent agent invocations can query the Ontology to see the current state
- This means agent "memory" of operational decisions is inherently persistent, audited, and governed

### Durable Orchestration State
Long-running workflows managed through durable orchestrations persist their execution state, enabling:
- Resume after failure
- Error recovery with configurable retry policies
- Progress tracking across multi-step, multi-agent workflows

## 8. Agent Security

### Principle of Least Privilege
Agents receive access only to what is necessary to complete a task. Security controls include:

- **Object-level**: Which Ontology objects the agent can see
- **Property-level**: Which properties on those objects are visible
- **Action-level**: Which actions the agent can invoke
- **Function-level**: Which functions the agent can call
- **Marking-based**: Mandatory access controls propagate to agent access

### Audit
Every action taken by an agent is audited identically to human actions:
- Every API call carries identity attribution
- Every tool invocation is logged with inputs, outputs, and reasoning
- Every Ontology modification records the agent identity and context
- Token consumption is tracked per function, per agent, per workflow

---

**Sources:**
- [AIP Agent Studio Tools](https://www.palantir.com/docs/foundry/agent-studio/tools)
- [AIP Agent Studio Core Concepts](https://www.palantir.com/docs/foundry/agent-studio/core-concepts)
- [AIP Architecture Overview](https://www.palantir.com/docs/foundry/architecture-center/aip-architecture)
- [Workshop AIP Agent Widget](https://www.palantir.com/docs/foundry/workshop/widgets-aip-agent)
- [AIP Features](https://www.palantir.com/docs/foundry/aip/aip-features)
- [Securing Agents in Production (Palantir Blog)](https://blog.palantir.com/securing-agents-in-production-agentic-runtime-1-5191a0715240)
