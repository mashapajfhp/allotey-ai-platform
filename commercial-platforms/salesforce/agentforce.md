# Salesforce Agentforce

**STATUS: RESEARCHED -- Based on official Salesforce documentation, Dreamforce 2024/2025, and engineering blog posts**

## What Is Agentforce

Agentforce is Salesforce's **autonomous agent platform** that enables businesses to deploy AI agents that work independently across the CRM lifecycle. Unveiled at Dreamforce 2024 and expanded with Agentforce 360 after Dreamforce 2025, it represents Salesforce's shift from assistive AI (Einstein Copilot) to autonomous AI that can handle tasks without human intervention.

Agents built on Agentforce can: qualify leads, resolve support cases, route tickets, manage opportunities, and serve customers -- autonomously, within governed guardrails.

## Agent Definition Model

Agentforce agents are defined through three declarative constructs:

### Topics
- A **Topic maps to a user intent** or "job to be done"
- Topics define the scope of what an agent knows about and can handle
- Each topic has a natural language description that the agent uses to determine if an incoming request matches
- Examples: "Handle password reset requests", "Qualify inbound leads", "Process return requests"
- Topics act as the **routing layer** -- the agent matches the user's intent to the appropriate topic

### Actions
- Actions define **what the agent can do** within a topic
- Each action is backed by an executable capability:

| Action Type | Description |
|------------|-------------|
| **Apex classes** | Custom Salesforce server-side code |
| **Flows** | Salesforce Flow automations (declarative) |
| **Prompt Templates** | Pre-built LLM prompt patterns |
| **API calls** | External system integrations |
| **MuleSoft integrations** | Enterprise integration flows |

- Actions have defined inputs and outputs that the agent can reason about
- The agent selects which actions to invoke based on the topic and conversation context

### Instructions
- Natural language guidance for **how the agent should behave**
- Define tone, escalation rules, boundaries, and interaction patterns
- Examples: "Always verify the customer's identity before making changes", "If the issue involves billing, escalate to a human agent", "Use a professional but friendly tone"
- Instructions constrain the agent's behavior without rigid programming

## Atlas Reasoning Engine

Atlas is the **reasoning core** of Agentforce -- the "brain" that enables agents to think, plan, and act.

### Architecture
Atlas is a **modular, pluggable reasoning orchestrator** that implements **ReAct (Reasoning and Acting)** style prompting:

```
User Input
    |
    v
Atlas Reasoning Engine
    |
    +---> REASON: Analyze the input, determine intent, match to topic
    |
    +---> ACT: Select and invoke appropriate action(s)
    |
    +---> OBSERVE: Evaluate the result of the action
    |
    +---> [Loop until goal is fulfilled or escalation needed]
    |
    v
Response to User (or escalation to human)
```

### How ReAct Works in Atlas
1. **Reason**: The engine analyzes the user's request, considers conversation history, and determines what needs to happen next
2. **Act**: Based on reasoning, it selects a tool/action (Apex, Flow, API call) and invokes it
3. **Observe**: It evaluates the result -- did the action succeed? Is more information needed? Is the goal fulfilled?
4. **Loop**: If the goal is not yet fulfilled, it reasons again with the new information and takes another action
5. **Exit**: When the goal is fulfilled, it generates a response. If it cannot resolve, it escalates to a human

### System 2 Reasoning
Atlas implements inference-time "System 2" reasoning, which:
- Significantly improves accuracy compared to single-shot prompting
- Lowers hallucination rates through iterative verification
- Brings state-of-the-art agentic knowledge retrieval techniques
- Can ask clarifying questions or request confirmations when uncertain

## Domain Grounding

This is Agentforce's most distinctive capability: agents are **grounded against CRM objects**.

### What Domain Grounding Means
Unlike general-purpose AI agents that work with generic data, Agentforce agents natively understand:

| CRM Object | Agent Understanding |
|------------|-------------------|
| **Accounts** | Company information, relationships, history |
| **Contacts** | People, roles, communication preferences |
| **Cases** | Support tickets, status, resolution history |
| **Opportunities** | Sales pipeline, stages, amounts, probabilities |
| **Leads** | Prospect qualification, scoring, conversion |
| **Knowledge Articles** | Product documentation, troubleshooting guides |
| **Custom Objects** | Organization-specific data models |

### RAG Grounding
Atlas uses **Agentforce RAG Grounding** to pull live data:
- Queries Salesforce objects and Data 360 in real time
- Retrieves relevant records based on the conversation context
- Grounds responses in actual CRM data, not model training data
- Can query external systems through MuleSoft connectors

### Why Domain Grounding Matters
The agent doesn't just "search for data" -- it understands the **semantics of CRM objects**. It knows that an Account has Contacts, Contacts have Cases, Cases have resolution histories, and Opportunities have pipeline stages. This structural understanding enables more accurate reasoning than generic RAG over flat documents.

## Trust and Governance

Agentforce inherits the **Einstein Trust Layer** and adds agent-specific governance:

### Guardrails
- **Topic boundaries** -- agents only operate within defined topics; off-topic requests are declined or escalated
- **Action restrictions** -- agents can only invoke actions explicitly configured for their topics
- **Escalation rules** -- configurable triggers for human handoff (sentiment, complexity, topic mismatch)
- **Confirmation gates** -- require user confirmation before executing sensitive actions

### Trust Layer Integration
- **Data masking** -- PII is tokenized before being sent to LLMs and un-tokenized in the response
- **Zero data retention** -- LLM providers contractually do not retain Salesforce data
- **Toxicity detection** -- prompts and responses scanned for inappropriate content
- **Audit trail** -- every agent interaction logged in Data Cloud with full traceability

### Testing and Deployment
- **Agent testing tools** -- test agent behavior in sandbox environments before deployment
- **Conversation monitoring** -- review agent conversations for quality and compliance
- **Gradual rollout** -- deploy agents to subsets of users before full rollout
- NEEDS VERIFICATION: Specific testing framework capabilities

## Deployment Model

Agentforce agents deploy across Salesforce surfaces:

| Surface | Description |
|---------|-------------|
| **Web chat** | Customer-facing chat on websites |
| **Salesforce Service Console** | Agent-assisted customer service |
| **Slack** | Agent interactions within Slack channels |
| **Mobile** | Salesforce mobile app |
| **Email** | NEEDS VERIFICATION on email channel support |
| **API** | Programmatic agent invocation |

## Key Design Decisions

1. **Declarative agent definition** -- Topics + Actions + Instructions is simpler than writing orchestration code
2. **ReAct reasoning loop** -- iterative think-act-observe produces better results than single-shot
3. **Domain grounding as default** -- agents always have CRM context, not just generic knowledge
4. **Trust Layer as non-negotiable** -- masking, zero-retention, and audit trail cannot be bypassed
5. **Low-code first** -- agents are configurable by Salesforce admins, not just developers
6. **Human escalation built in** -- agents know when to hand off to humans

## Limitations

- **Salesforce ecosystem dependency** -- agents work best within the Salesforce data model
- **Atlas is not fully customizable** -- the reasoning engine is managed, not open-source
- **Action types are Salesforce-specific** -- Apex, Flows, and Prompt Templates are Salesforce constructs
- **Pricing is per-conversation** -- cost can scale significantly with volume

## NEEDS VERIFICATION
- Exact per-conversation pricing for Agentforce
- Whether Atlas supports custom reasoning strategies beyond ReAct
- Maximum number of topics per agent
- Maximum number of actions per topic
- Whether agents can invoke other agents (multi-agent patterns within Agentforce)
- Email channel support status
- A2A protocol support or roadmap
