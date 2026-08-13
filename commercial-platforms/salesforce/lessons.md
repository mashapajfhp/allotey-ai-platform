# Lessons from Salesforce's AI Platform

**STATUS: RESEARCHED -- Analysis based on Salesforce's platform architecture and patterns**

## Agents Operating on Domain Objects

### What Salesforce Got Right

Salesforce's most transferable insight is that **AI agents are most effective when they operate on strongly-typed domain objects, not generic data**. This is the concept of "domain grounding."

#### 1. Structural Understanding vs. Flat Retrieval
General-purpose RAG retrieves text chunks from documents. Agentforce agents understand that:
- An **Account** has **Contacts**
- Contacts have **Cases**
- Cases have resolution histories and SLA timelines
- Accounts have **Opportunities** with pipeline stages
- Opportunities have associated **Products** and **Quotes**

This structural understanding means the agent can traverse relationships: "Show me all open cases for contacts at accounts with opportunities closing this quarter" is a natural query that leverages the domain model, not a keyword search.

**What to learn**: If your domain has structured entities with relationships (and most enterprise domains do), expose those relationships to agents as first-class concepts. Don't flatten everything into documents for RAG.

#### 2. Actions Tied to Domain Objects
Agentforce actions operate directly on CRM objects:
- Create a Case (not "insert a record")
- Update an Opportunity stage (not "modify a field")
- Escalate a Case to a human (not "trigger a workflow")

The agent understands the **business semantics** of what it's doing, not just the technical operation.

**What to learn**: Define agent actions in domain language, not database operations. "Approve expense report" is better than "update status field on record."

#### 3. Data Unification as a Prerequisite
Data 360's identity resolution and harmonization happen **before** agents reason, not during. By the time an agent queries for customer context, the data is already unified and reconciled.

**What to learn**: Data unification is a prerequisite for effective AI agents, not something agents should do ad-hoc. Invest in data quality and unification before deploying agents.

### What NOT to Copy

- **CRM-specific object model.** Accounts, Contacts, Cases, Opportunities are Salesforce constructs. Your domain has its own entities. Learn the pattern (domain grounding on typed objects), not the specific objects
- **Closed ecosystem.** Agentforce agents work best within Salesforce. Domain grounding should work with any data system, not just one vendor's

## Domain Grounding Concept

### The Generalizable Pattern

Domain grounding means: **agents reason and act using the semantics of your business domain, not generic text retrieval.**

Components of effective domain grounding:

| Component | Salesforce Implementation | Generalizable Pattern |
|-----------|--------------------------|----------------------|
| **Domain model** | CRM objects (Account, Contact, Case) | Typed entities with defined relationships |
| **Relationship traversal** | Object relationships (Account -> Contact -> Case) | Graph-like navigation across entity relationships |
| **Domain vocabulary** | Field labels, picklist values, record types | Shared terminology that agents and humans use |
| **Domain actions** | Apex actions on CRM objects | Operations defined in business language |
| **Domain constraints** | Validation rules, field-level security | Business rules that constrain what agents can do |

### How to Apply Domain Grounding Outside CRM

1. **Define your domain model** -- what are the core entities, their attributes, and relationships?
2. **Expose relationships** -- agents should be able to traverse entity relationships (e.g., Order -> Line Items -> Products -> Supplier)
3. **Use domain vocabulary** -- agent actions and responses should use the same language as domain experts
4. **Enforce domain constraints** -- business rules should constrain agent behavior automatically
5. **Ground retrieval in the domain model** -- don't just search documents; query structured domain data

## CRM-Specific Patterns That Generalize

### 1. Topics as Intent Routing
Agentforce's Topics pattern -- mapping user intents to agent capabilities -- generalizes beyond CRM:

```
User intent --> Topic matching --> Appropriate agent/action set
```

**Generalizable as**: Any agent system benefits from explicit intent routing. Don't have one monolithic agent try to handle everything. Route intents to specialized handlers.

### 2. Declarative Agent Definition (Topics + Actions + Instructions)
The three-part definition model is simple and powerful:
- **What the agent understands** (Topics) -- scope and intent
- **What the agent can do** (Actions) -- capabilities
- **How the agent should behave** (Instructions) -- behavioral constraints

**Generalizable as**: Separate scope, capabilities, and behavioral constraints in agent definitions. This makes agents auditable, testable, and governable.

### 3. Trust Layer as a Composable Middleware
The Einstein Trust Layer sits between the agent and the LLM, applying masking/unmasking, toxicity detection, and audit logging transparently:

```
Agent --> [Mask PII] --> [Check toxicity] --> LLM --> [Check response] --> [Unmask PII] --> [Log audit] --> User
```

**Generalizable as**: AI governance should be a composable middleware layer, not baked into each agent. Apply masking, safety checks, and audit logging as pipeline stages that any agent inherits.

### 4. Identity Resolution as a Data Foundation
Data 360's identity resolution -- matching records across sources into unified profiles -- is not CRM-specific. Any domain with entities that appear in multiple systems benefits from identity resolution.

**Generalizable as**: Before deploying AI agents, resolve entity identities across your data sources. Agents reasoning over fragmented data produce fragmented results.

### 5. ReAct Reasoning with Domain Actions
Atlas's ReAct loop (Reason -> Act -> Observe -> Loop) is a well-established pattern, but Salesforce's implementation ties it to domain-specific actions rather than generic tool use:

**Generalizable as**: The ReAct pattern works well when actions have clear domain semantics and observable outcomes. Define actions with typed inputs/outputs and observable state changes.

## What NOT to Copy

### 1. Vendor Lock-In as a Feature
Agentforce's deep integration with Salesforce objects is a strength for Salesforce customers but creates complete vendor lock-in. Agents, data models, actions (Apex, Flows), and the reasoning engine are all Salesforce-proprietary.

**Lesson**: Domain grounding should be achievable with any data system. Don't tie AI capabilities to a single vendor's data model.

### 2. Black-Box Reasoning Engine
Atlas is managed and not customizable beyond Topics/Actions/Instructions. Organizations cannot modify the reasoning strategy, swap in a different LLM orchestration approach, or inspect the full reasoning chain.

**Lesson**: The reasoning engine should be observable and extensible. Even if you provide a default reasoning strategy (like ReAct), allow advanced users to customize or replace it.

### 3. Pricing Per Conversation
Agentforce's per-conversation pricing model can create unpredictable costs at scale. Organizations may avoid deploying agents for high-volume, low-value interactions due to cost concerns.

**Lesson**: Consider consumption-based pricing that scales more predictably (per-token, per-action) rather than per-conversation.

### 4. Low-Code-Only Agent Creation
While low-code agent creation is accessible, it limits what agents can do. Complex reasoning chains, custom integrations, and advanced orchestration patterns require more than Topics + Actions + Instructions.

**Lesson**: Provide both low-code (for simple agents) and pro-code (for complex agents) paths. Don't force all agents through a low-code interface.

## Summary: What to Take Forward

| Pattern | Adopt? | Notes |
|---------|--------|-------|
| Domain grounding on typed objects | YES | Most transferable Salesforce pattern |
| Structural relationship traversal | YES | Agents should navigate entity graphs, not just search text |
| Data unification before agent deployment | YES | Agents need complete, reconciled data |
| Intent routing (Topics pattern) | YES | Route to specialized handlers, not monolithic agents |
| Declarative agent definition (scope/capabilities/constraints) | YES | Auditable, testable, governable |
| Trust layer as composable middleware | YES | Masking, safety, audit as pipeline stages |
| Identity resolution as data foundation | YES | Resolve entities before deploying agents |
| ReAct reasoning with domain actions | YES | Well-established, proven pattern |
| Vendor lock-in to one ecosystem | NO | Domain grounding should be system-agnostic |
| Black-box reasoning engine | NO | Observable and extensible reasoning |
| Per-conversation pricing | NO | Unpredictable at scale |
| Low-code only agent creation | NO | Provide both low-code and pro-code paths |
| CRM-specific object model | NO | Learn the pattern, use your own domain objects |
