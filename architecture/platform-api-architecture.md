# Platform API Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## The Most Important Boundary in the System

The Stable Platform API is the contract between the Product/Domain layer and the Enterprise AI Platform core. It is the single most important API boundary in the system because it enforces the foundational architectural principle: **the platform stays generic; intelligence enters through packages.**

Every domain package, every product team, every integration partner, and every SDK interacts with the platform exclusively through this API surface. If this API is wrong, the entire architecture collapses. If it is right, the platform can evolve independently from every product built on it.

```
┌─────────────────────────────────────────────────┐
│              PRODUCT / DOMAIN LAYER             │
│                                                 │
│ Ontologies   Semantics   Agents   Tools         │
│ Policies     Workflows   Connectors             │
└────────────────────┬────────────────────────────┘
                     │
          ╔══════════╧══════════╗
          ║  STABLE PLATFORM   ║
          ║       API          ║   <── This document defines this boundary
          ╚══════════╤══════════╝
                     │
┌────────────────────▼────────────────────────────┐
│            ENTERPRISE AI PLATFORM               │
│                                                 │
│ Intelligence Gateway    Model Gateway           │
│ Agent Runtime           Tool / MCP Gateway      │
│ Ontology Runtime        Context / Knowledge     │
│ Decision & Action       Authorization / Policy  │
│ Workflow Runtime        Evaluation / Observability│
│ Provenance / Audit      Cost / Metering         │
│ Secure Compute          Developer Platform      │
└─────────────────────────────────────────────────┘
```

---

## Design Principles for the Platform API

1. **Domain-blind** -- the API surface must contain zero domain-specific types, entity names, or business logic. Domain concepts are values passed through generic structures, never hardcoded in API signatures.
2. **Capability-oriented** -- each API surface corresponds to a platform capability. APIs are grouped by what the platform does, not by how it is implemented.
3. **Contract-first** -- API contracts are defined before implementation. SDKs, documentation, and validation are generated from contracts.
4. **Versioned independently** -- each API surface has its own version. A breaking change to the Ontology API does not force a version bump on the Workflow API.
5. **Least-privilege by default** -- every API call carries an authorization context. No anonymous or unscoped operations.
6. **Observable by default** -- every API call produces a trace span. No call is invisible to the observability system.
7. **Tenant-scoped** -- every API call is scoped to a tenant. Cross-tenant access is architecturally impossible through the API surface.

---

## Capability Contracts

### 1. Ontology API

**Purpose:** Define, query, and manage domain entities, relationships, and actions.

The Ontology API is the gateway to the domain model. Through it, packages register entity types, define relationships, declare actions, and establish constraints. At runtime, the Ontology API serves the compiled domain model to agents, tools, and applications.

**Write Operations (Package Authoring Time):**

| Operation | Description |
|-----------|-------------|
| `registerEntityType(definition)` | Register a new entity type with properties, constraints, and security rules |
| `registerRelationshipType(definition)` | Register a typed relationship between entity types |
| `registerAction(definition)` | Register an action that can be performed on entities |
| `registerFunction(definition)` | Register a computed function over entities |
| `registerConstraint(definition)` | Register a business rule or validation constraint |
| `compileOntology(source)` | Submit ontology source for IR compilation |
| `validateOntology(ir)` | Validate an ontology IR for consistency and compatibility |

**Read Operations (Runtime):**

| Operation | Description |
|-----------|-------------|
| `getEntityType(type_id)` | Retrieve an entity type definition |
| `listEntityTypes(filter)` | List available entity types with filtering |
| `getRelationshipTypes(entity_type_id)` | Get valid relationships for an entity type |
| `getActions(entity_type_id)` | Get available actions for an entity type |
| `getOntologySchema(package_id)` | Get the compiled ontology schema for a package |
| `describeOntology()` | Get a human-readable (and agent-readable) description of the full domain model |

**Instance Operations (Runtime):**

| Operation | Description |
|-----------|-------------|
| `getEntity(entity_type, entity_id)` | Retrieve an entity instance |
| `queryEntities(entity_type, filter, projection)` | Query entity instances with filtering and projection |
| `traverseRelationships(entity_id, relationship_type, depth)` | Navigate the entity graph |
| `executeAction(entity_type, entity_id, action, params)` | Execute an ontology-defined action (subject to governance) |
| `evaluateFunction(entity_type, entity_id, function, params)` | Compute a function over an entity |

**Key design decisions under research:**
- Should the Ontology API expose a GraphQL interface for entity queries? GraphQL's type system maps naturally to entity types and relationships.
- How does ontology versioning interact with the API version? If entity types change, does the API version change?
- How are ontology-derived MCP tools exposed? Does the Ontology API generate MCP tool definitions, or does the Package API handle this?

---

### 2. Agent API

**Purpose:** Define, invoke, and manage agents.

The Agent API governs the full agent lifecycle -- from definition and registration through invocation and monitoring.

| Operation | Description |
|-----------|-------------|
| `registerAgent(definition)` | Register an agent with capabilities, tools, permissions, instructions |
| `invokeAgent(agent_id, input, context)` | Invoke an agent with input and authorization context |
| `invokeAgentStreaming(agent_id, input, context)` | Invoke an agent with streaming response |
| `getAgentStatus(invocation_id)` | Get the status of an in-flight agent invocation |
| `cancelAgent(invocation_id)` | Cancel a running agent invocation |
| `listAgents(filter)` | List available agents with filtering |
| `getAgent(agent_id)` | Get agent definition, including capabilities and required permissions |
| `getAgentHistory(agent_id, filter)` | Query past invocations of an agent |
| `evaluateAgent(agent_id, dataset_id)` | Run an evaluation dataset against an agent |
| `setAgentVersion(agent_id, version)` | Activate a specific agent version |
| `describeAgent(agent_id)` | Get agent capability description (for A2A discovery or agent-to-agent routing) |

**Multi-agent operations:**

| Operation | Description |
|-----------|-------------|
| `registerSupervisor(definition)` | Register a supervisor agent that routes to specialists |
| `invokeOrchestration(orchestration_id, input, context)` | Start a multi-agent orchestration |
| `getOrchestrationGraph(orchestration_id)` | Get the execution graph of a multi-agent run |

**Human-in-the-loop:**

| Operation | Description |
|-----------|-------------|
| `getCheckpoint(invocation_id)` | Get the current agent checkpoint awaiting human review |
| `resumeAgent(invocation_id, decision)` | Resume an agent after human decision (approve, reject, modify) |

**Authorization model:** Every `invokeAgent` call carries the user's authorization context. The agent's effective permissions are the intersection of the agent's declared permissions and the invoking user's permissions. See `architecture/authorization-architecture.md`.

---

### 3. Knowledge API

**Purpose:** Ingest, query, and manage knowledge (documents, context, facts).

The Knowledge API handles all unstructured and semi-structured knowledge management -- document ingestion, embedding, retrieval, and lifecycle.

**Ingestion:**

| Operation | Description |
|-----------|-------------|
| `ingestDocument(source, metadata, options)` | Ingest a document (PDF, text, HTML, etc.) with chunking, embedding, and indexing |
| `ingestBatch(sources, metadata, options)` | Batch ingestion of multiple documents |
| `getIngestionStatus(job_id)` | Check the status of an ingestion job |
| `reindexDocument(document_id, options)` | Re-chunk and re-embed a document (e.g., after embedding model change) |
| `deleteDocument(document_id)` | Remove a document and all its chunks/embeddings |

**Retrieval:**

| Operation | Description |
|-----------|-------------|
| `search(query, options)` | Hybrid search across knowledge (semantic + keyword + structured filters) |
| `searchWithContext(query, entity_context, options)` | Search scoped to an entity's context |
| `getDocument(document_id)` | Retrieve a document and its metadata |
| `getChunks(document_id)` | Retrieve the chunks of a document |
| `listDocuments(filter)` | List documents with filtering (source, type, ingestion date, tags) |

**Knowledge management:**

| Operation | Description |
|-----------|-------------|
| `tagDocument(document_id, tags)` | Apply metadata tags to a document |
| `classifyDocument(document_id)` | Auto-classify a document using the ontology |
| `getDocumentLineage(document_id)` | Get the provenance chain of a document |

---

### 4. Analytics API

**Purpose:** Query metrics, dimensions, and analytical data through semantic definitions.

The Analytics API ensures every analytical question is answered through the semantic layer, guaranteeing metric consistency. Agents and applications never write raw SQL against analytical databases; they query through semantic definitions.

| Operation | Description |
|-----------|-------------|
| `query(measures, dimensions, filters, time_range)` | Execute a semantic query using defined measures and dimensions |
| `queryNaturalLanguage(question, context)` | Translate a natural language question into a semantic query and execute it |
| `listMeasures(filter)` | List available measures |
| `listDimensions(filter)` | List available dimensions |
| `getMeasureDefinition(measure_id)` | Get the canonical definition of a measure |
| `getDimensionDefinition(dimension_id)` | Get the canonical definition of a dimension |
| `validateQuery(measures, dimensions, filters)` | Validate a query before execution (check compatibility of measures and dimensions) |
| `explainQuery(measures, dimensions, filters)` | Show the generated SQL and semantic resolution for a query |
| `getQueryCost(measures, dimensions, filters)` | Estimate the cost of a query before execution |

**Key design decisions under research:**
- Should the Analytics API be a thin wrapper around Cube's REST API, or should it be an abstraction that could support other semantic engines?
- How does the Analytics API handle data access control? Row-level security must be enforced through the semantic layer based on the caller's authorization context.
- Should the Analytics API support subscriptions/streaming for real-time dashboards?

---

### 5. Decision API

**Purpose:** Request, review, and record decisions with provenance.

Decisions are first-class objects in the platform. The Decision API captures the full decision lifecycle: observation, evidence gathering, hypothesis formation, recommendation, action, and outcome tracking.

| Operation | Description |
|-----------|-------------|
| `requestDecision(context, question, evidence_sources)` | Request the platform to formulate a decision with evidence |
| `getDecision(decision_id)` | Retrieve a decision with its full provenance chain |
| `listDecisions(filter)` | List decisions with filtering (status, entity, time range, agent) |
| `reviewDecision(decision_id)` | Get the decision's evidence, confidence, and recommendation for human review |
| `approveDecision(decision_id, rationale)` | Approve a pending decision |
| `rejectDecision(decision_id, rationale)` | Reject a pending decision |
| `recordOutcome(decision_id, outcome)` | Record the actual outcome of a decision (for learning) |
| `getDecisionHistory(entity_id)` | Get all decisions made about a specific entity |
| `compareDecisions(decision_ids)` | Compare multiple decisions side-by-side (evidence, confidence, outcome) |

**Decision provenance structure:**

```
Decision:
  id: uuid
  question: string
  status: pending | approved | rejected | executed | measured
  observation: { what was noticed, when, by whom/what }
  evidence: [{ source, content, relevance_score, retrieval_method }]
  hypothesis: { explanation, confidence, alternatives }
  recommendation: { action, rationale, risks }
  approval: { approver, timestamp, rationale }
  action: { what was done, when, by whom/what }
  outcome: { result, measured_at, success_criteria }
  provenance:
    model_id: string (which model was used)
    semantic_definitions: [string] (which metric definitions were active)
    ontology_version: string
    agent_id: string
    agent_version: string
```

---

### 6. Action API

**Purpose:** Propose, approve, and execute governed actions.

The Action API separates action proposal from action execution. Every action that modifies state goes through a governance pipeline: validation, authorization, optional human approval, execution, and audit.

| Operation | Description |
|-----------|-------------|
| `proposeAction(action_type, target, params, context)` | Propose an action for governance review |
| `getActionProposal(proposal_id)` | Get the details and status of an action proposal |
| `approveAction(proposal_id, approver_context)` | Approve a proposed action |
| `rejectAction(proposal_id, reason)` | Reject a proposed action |
| `executeAction(proposal_id)` | Execute an approved action |
| `getActionResult(execution_id)` | Get the result of an executed action |
| `listActions(filter)` | List actions with filtering (status, type, entity, time range) |
| `getActionAuditTrail(execution_id)` | Get the full audit trail of an action execution |
| `rollbackAction(execution_id, reason)` | Initiate rollback/compensation for an executed action |
| `listActionTypes(filter)` | List available action types (from ontology) |
| `getActionSchema(action_type)` | Get the parameter schema and constraints for an action type |

**Governance pipeline:**

```
proposeAction() → validate against ontology constraints
               → check authorization (user + agent + action-specific)
               → evaluate policy rules (OPA/Cedar)
               → if auto-approvable: executeAction()
               → if requires approval: pause, notify approver
               → on approval: executeAction()
               → on execution: record in event store with provenance
               → on failure: trigger compensation if defined
```

---

### 7. Workflow API

**Purpose:** Define, start, query, signal, and manage durable workflows.

The Workflow API governs durable business workflows (not agent reasoning workflows). This maps to the Temporal-backed workflow runtime.

| Operation | Description |
|-----------|-------------|
| `registerWorkflow(definition)` | Register a durable workflow definition |
| `startWorkflow(workflow_type, input, options)` | Start a new workflow instance |
| `getWorkflow(workflow_id)` | Get the status and state of a workflow instance |
| `queryWorkflow(workflow_id, query_type)` | Run a custom query against a running workflow |
| `signalWorkflow(workflow_id, signal_name, payload)` | Send a signal to a running workflow (e.g., human approval) |
| `cancelWorkflow(workflow_id, reason)` | Request cancellation of a running workflow |
| `terminateWorkflow(workflow_id, reason)` | Force-terminate a workflow (last resort) |
| `listWorkflows(filter)` | List workflow instances with filtering (status, type, start time) |
| `getWorkflowHistory(workflow_id)` | Get the event history of a workflow instance |
| `listWorkflowTypes(filter)` | List registered workflow types |
| `scheduleWorkflow(workflow_type, schedule, input)` | Create a scheduled workflow |

**Key design decisions under research:**
- How much of Temporal's API do we expose vs. abstract? Temporal has a rich query language and advanced features (child workflows, continue-as-new, etc.) -- do we pass these through or provide a simplified interface?
- Should workflow definitions be submitted as code (Temporal SDK style) or as declarative definitions (YAML/JSON)?
- How does the Workflow API interact with the Agent API? (Agent invocations as workflow activities.)

---

### 8. Evaluation API

**Purpose:** Define evaluation criteria, run evaluations, query results.

The Evaluation API enables systematic quality measurement of agents, tools, and workflows. It supports automated evaluation, human evaluation, regression testing, and experiment tracking.

| Operation | Description |
|-----------|-------------|
| `createDataset(name, schema, items)` | Create an evaluation dataset with expected inputs/outputs |
| `updateDataset(dataset_id, items)` | Add or modify items in an evaluation dataset |
| `getDataset(dataset_id)` | Retrieve an evaluation dataset |
| `listDatasets(filter)` | List evaluation datasets |
| `runEvaluation(agent_id, dataset_id, criteria)` | Run an agent against an evaluation dataset |
| `getEvaluationRun(run_id)` | Get the results of an evaluation run |
| `listEvaluationRuns(filter)` | List evaluation runs with filtering |
| `compareRuns(run_ids)` | Compare multiple evaluation runs (regression detection, A/B comparison) |
| `createCriteria(definition)` | Define custom evaluation criteria (LLM-as-judge prompts, automated checks) |
| `listCriteria(filter)` | List available evaluation criteria |
| `getEvaluationSummary(agent_id, time_range)` | Get aggregated evaluation metrics for an agent over time |
| `createExperiment(name, variants)` | Create an A/B experiment with agent variants |
| `getExperimentResults(experiment_id)` | Get experiment results |

**Evaluation dimensions:**

| Dimension | Method | Automated? |
|-----------|--------|-----------|
| Correctness | Ground truth comparison | Yes |
| Relevance | LLM-as-judge | Yes |
| Safety | Guardrail checks + red-teaming | Partially |
| Groundedness | Citation verification | Yes |
| Latency | Automated timing | Yes |
| Cost | Token/API cost tracking | Yes |
| Tool accuracy | Ground truth tool sequences | Yes |
| Action safety | Constraint validation | Yes |

---

### 9. Package API

**Purpose:** Install, activate, version, query, and manage domain packages.

The Package API is the lifecycle management interface for domain packages. It governs how domain intelligence enters and leaves the platform.

| Operation | Description |
|-----------|-------------|
| `validatePackage(package_source)` | Validate a package against the platform's schema and compatibility rules |
| `registerPackage(package_source, metadata)` | Register a validated package in the registry |
| `activatePackage(package_id, tenant_id, options)` | Activate a package for a specific tenant |
| `deactivatePackage(package_id, tenant_id)` | Deactivate a package for a tenant |
| `upgradePackage(package_id, tenant_id, target_version)` | Upgrade a package to a new version |
| `rollbackPackage(package_id, tenant_id, target_version)` | Roll back a package to a previous version |
| `getPackage(package_id)` | Get package metadata and status |
| `listPackages(filter)` | List packages with filtering (status, tenant, version) |
| `getPackageHealth(package_id, tenant_id)` | Get health metrics for an active package (agent quality, tool success rates, error rates) |
| `getPackageCompatibility(package_id, platform_version)` | Check if a package is compatible with a platform version |
| `getPackageDependencies(package_id)` | Get the dependency tree of a package |
| `deprecatePackage(package_id, reason, sunset_date)` | Mark a package for deprecation |
| `getPackageChangelog(package_id)` | Get the version history and changelog of a package |

**Package lifecycle through the API:**

```
AUTHOR (external)
    → validatePackage()
        → registerPackage()
            → activatePackage(tenant_id)
                → getPackageHealth(tenant_id) [monitoring]
                    → upgradePackage(target_version)
                        → deprecatePackage(sunset_date)
```

**Capability declaration (see Capability Negotiation section below):**

```yaml
# In package manifest
requires:
  platform_api_version: ">=1.0.0"
  capabilities:
    - ontology_runtime: ">=1.0.0"
    - agent_runtime: ">=1.0.0"
    - workflow_runtime: ">=1.0.0"   # Optional -- not all packages need workflows
    - analytics_engine: ">=1.0.0"   # Optional -- not all packages need analytics
```

---

### 10. Model API

**Purpose:** Invoke models, manage model routing, query costs.

The Model API abstracts all LLM interaction behind a provider-agnostic interface. This maps to the Model Gateway (LiteLLM-backed).

| Operation | Description |
|-----------|-------------|
| `complete(model_alias, messages, options)` | Run a chat completion (provider-agnostic) |
| `completeStreaming(model_alias, messages, options)` | Run a streaming chat completion |
| `embed(model_alias, input, options)` | Generate embeddings |
| `listModels(filter)` | List available model aliases and their routing configurations |
| `getModelInfo(model_alias)` | Get model capabilities, cost per token, latency characteristics |
| `setModelRoute(model_alias, routing_config)` | Configure model routing (primary, fallback, load balancing) |
| `getModelUsage(filter)` | Query model usage metrics (tokens, cost, latency) by tenant/agent/time |
| `setBudget(scope, budget_config)` | Set cost budgets (per tenant, per agent, per team) |
| `getBudgetStatus(scope)` | Get current budget utilization |

**Model aliases vs. model IDs:**
The Model API uses model aliases (e.g., `"default"`, `"fast"`, `"reasoning"`, `"embedding"`) that map to concrete model IDs (e.g., `"claude-opus-4-6"`, `"gpt-4o"`, `"claude-sonnet-4-5-20250514"`). Routing configuration determines which concrete model an alias resolves to, with fallback chains, A/B splits, and cost-based routing.

---

### 11. Event API

**Purpose:** Publish and subscribe to domain events.

The Event API handles business event lifecycle -- publishing, subscribing, querying, and replay.

**Publishing:**

| Operation | Description |
|-----------|-------------|
| `publish(event_type, entity_ref, data, provenance)` | Publish a business event |
| `publishBatch(events)` | Publish multiple events atomically |

**Subscribing:**

| Operation | Description |
|-----------|-------------|
| `subscribe(event_types, handler, options)` | Subscribe to event types with a handler |
| `unsubscribe(subscription_id)` | Remove a subscription |
| `listSubscriptions(filter)` | List active subscriptions |

**Querying:**

| Operation | Description |
|-----------|-------------|
| `queryEvents(filter, time_range, options)` | Query historical events |
| `getEvent(event_id)` | Retrieve a specific event |
| `getEventsByEntity(entity_ref, time_range)` | Get all events for an entity |
| `getEventsByCorrelation(correlation_id)` | Get all events in a correlation chain |
| `replayEvents(filter, target)` | Replay events to a subscriber (for reprocessing) |

**Event schema (from `architecture/event-architecture.md`):**

```
Event:
  id: uuid
  type: string            # e.g., "order.approved"
  entity_type: string     # e.g., "Order"
  entity_id: string
  actor: string           # user or agent identity
  timestamp: datetime
  data: json              # event-specific payload
  provenance:
    source: string
    correlation_id: uuid
    causation_id: uuid    # what event caused this
  tenant_id: string
```

---

### 12. Context API

**Purpose:** Query and manage entity context, relationships, temporal facts.

The Context API provides access to the context graph -- the live state of entities, facts, and relationships with temporal awareness.

| Operation | Description |
|-----------|-------------|
| `getFact(entity_ref, fact_type)` | Get the current value of a fact about an entity |
| `getFactAtTime(entity_ref, fact_type, timestamp)` | Get the value of a fact at a specific point in time |
| `getFactHistory(entity_ref, fact_type, time_range)` | Get the history of a fact over time |
| `setFact(entity_ref, fact_type, value, source, valid_from)` | Record a fact with temporal validity and provenance |
| `invalidateFact(entity_ref, fact_type, reason, valid_until)` | Mark a fact as no longer valid |
| `getRelationships(entity_ref, relationship_type, direction)` | Get related entities |
| `getRelationshipsAtTime(entity_ref, relationship_type, timestamp)` | Get relationships as they existed at a point in time |
| `assembleContext(entity_ref, depth, options)` | Assemble a rich context object for an entity (for agent consumption) |
| `searchContext(query, entity_scope, options)` | Search across context graph with scoping |
| `getEntityTimeline(entity_ref, time_range)` | Get a timeline of all facts and events for an entity |

**Temporal awareness:**
The Context API distinguishes between:
- **Transaction time** -- when a fact was recorded in the system
- **Valid time** -- when a fact was true in the real world

This enables queries like "What did we know about this customer as of last Tuesday?" (transaction time) and "What was this customer's status during Q3?" (valid time).

---

### 13. Identity API

**Purpose:** Authenticate, authorize, manage identities.

The Identity API handles all identity and authorization operations across users, agents, and service identities.

**Authentication:**

| Operation | Description |
|-----------|-------------|
| `authenticate(credentials)` | Authenticate a user and return a token |
| `validateToken(token)` | Validate and decode an access token |
| `refreshToken(refresh_token)` | Refresh an expired token |
| `getIdentity(token)` | Get the identity associated with a token |

**Authorization:**

| Operation | Description |
|-----------|-------------|
| `check(subject, action, object)` | Check if a subject is authorized to perform an action on an object |
| `checkBatch(checks)` | Batch authorization check |
| `listPermissions(subject, object)` | List what a subject can do with an object |
| `expand(object, relation)` | Expand to find all subjects with a relation to an object |

**Identity management:**

| Operation | Description |
|-----------|-------------|
| `createServiceIdentity(name, permissions)` | Create a service/agent identity |
| `grantRelation(subject, relation, object)` | Grant a relationship (e.g., "user:jane is viewer of folder:sales") |
| `revokeRelation(subject, relation, object)` | Revoke a relationship |
| `getDelegationContext(user_token, agent_id)` | Create a delegated authorization context for agent-on-behalf-of-user |

**Three-layer authorization model:**

```
Layer 1: Authentication      -- Who is this? (Identity API)
Layer 2: Relationship AuthZ  -- Can they access this? (OpenFGA via Identity API)
Layer 3: Policy Evaluation   -- Under what conditions? (OPA/Cedar via Identity API)
Layer 4: Domain Constraints  -- Business rules? (Ontology via Ontology API)
```

---

### 14. Observability API

**Purpose:** Query traces, metrics, logs.

The Observability API provides read access to the platform's operational telemetry -- traces, metrics, logs, and AI-specific observability data.

| Operation | Description |
|-----------|-------------|
| `getTrace(trace_id)` | Get a complete trace with all spans |
| `queryTraces(filter, time_range)` | Query traces with filtering (agent, tool, latency, status) |
| `getSpan(span_id)` | Get a specific span within a trace |
| `queryMetrics(metric_name, dimensions, time_range, aggregation)` | Query operational metrics |
| `queryLogs(filter, time_range)` | Query structured logs |
| `getAgentTelemetry(agent_id, time_range)` | Get agent-specific telemetry (token usage, tool call success, latency distribution) |
| `getToolTelemetry(tool_id, time_range)` | Get tool-specific telemetry |
| `getModelTelemetry(model_alias, time_range)` | Get model-specific telemetry (latency, cost, error rate) |
| `getCostReport(scope, time_range)` | Get cost breakdown by scope (tenant, team, agent, model) |
| `createAlert(condition, notification)` | Create an alert rule on metrics or trace patterns |
| `listAlerts(filter)` | List alert rules |

---

## API Surface Research

### Surface Type Suitability Matrix

Not every API should use the same protocol. The right surface depends on the nature of the operations.

| API Surface | Primary Protocol | Rationale | Secondary Protocol |
|-------------|-----------------|-----------|-------------------|
| **Ontology API** | REST + GraphQL | REST for CRUD on definitions; GraphQL for entity querying (natural fit for typed entities and relationship traversal) | gRPC for internal runtime queries |
| **Agent API** | REST + WebSocket | REST for lifecycle management; WebSocket/SSE for streaming agent responses | gRPC for internal agent-to-platform calls |
| **Knowledge API** | REST | Standard CRUD + search operations; ingestion is batch-oriented | gRPC for high-throughput internal retrieval |
| **Analytics API** | REST | Semantic query interface; aligns with Cube's REST API pattern | GraphQL for exploratory analytics |
| **Decision API** | REST | CRUD + governance workflow operations | -- |
| **Action API** | REST | Governance-heavy operations benefit from explicit resource modeling | gRPC for internal action execution |
| **Workflow API** | REST | Lifecycle management; Temporal has its own gRPC API internally | gRPC for internal workflow-agent interaction |
| **Evaluation API** | REST | Dataset management, run management -- standard CRUD | -- |
| **Package API** | REST | Package lifecycle is inherently CRUD | CLI integration via SDK |
| **Model API** | REST | Aligns with LiteLLM/OpenAI-compatible API patterns | gRPC for internal high-throughput inference |
| **Event API** | AsyncAPI (WebSocket/SSE) | Events are inherently asynchronous; pub/sub requires streaming | REST for historical event queries |
| **Context API** | GraphQL + REST | GraphQL for relationship traversal and context assembly; REST for fact CRUD | gRPC for internal context resolution |
| **Identity API** | REST | Standard authentication/authorization patterns | gRPC for high-frequency internal auth checks |
| **Observability API** | REST | Query-oriented; aligns with Langfuse/OTEL query patterns | -- |

### When to Use Each Surface Type

**REST (primary for most APIs):**
- CRUD operations on platform resources
- Request/response interactions
- External API consumers
- Browser/mobile clients
- OpenAPI specification for documentation and code generation

**GraphQL (Ontology + Context APIs):**
- Entity and relationship querying where the client needs to specify the shape of the response
- Traversal queries ("give me this entity, its relationships, and the related entities' properties")
- Reduces over-fetching for complex, nested data structures
- Schema introspection enables dynamic UI generation

**gRPC (internal services):**
- High-throughput internal service-to-service communication
- Agent runtime calling platform services (context resolution, authorization checks)
- Where latency matters (model routing, auth checks in the hot path)
- Strong typing with Protocol Buffers

**AsyncAPI / WebSocket / SSE (Event API, streaming):**
- Event publishing and subscribing
- Agent response streaming
- Real-time dashboard updates
- Change notifications

**MCP (agent-to-tool interface):**
- Exposing platform capabilities as tools for agents
- Dynamic tool discovery
- Agent-to-tool interaction within the agent runtime
- NOT for human-facing APIs or service-to-service communication

### When MCP Is the Right Interface

MCP is the right interface when:

1. **An agent needs to discover and invoke platform capabilities as tools.** The Ontology API's actions, the Analytics API's query capability, and the Knowledge API's search capability should all be exposable as MCP tools.

2. **Tool schemas need to be dynamic.** When a domain package registers new entity types with new actions, those actions should automatically become MCP tools without code changes.

3. **The consumer is an LLM-based agent, not a human or application.** MCP tool schemas are designed to be interpretable by language models.

MCP is NOT the right interface when:
- The consumer is a human using a UI (use REST/GraphQL)
- The interaction is service-to-service at infrastructure level (use gRPC)
- The operation is event-driven (use AsyncAPI/WebSocket)
- The operation is package lifecycle management (use REST)

**Key insight:** The platform should expose the same capabilities through multiple surfaces. The Ontology API's `executeAction()` is callable via REST by an application, via GraphQL by a dashboard, and via MCP by an agent. The underlying implementation is the same; only the interface adaptor changes.

---

## Versioning Architecture

### Version Types

The platform maintains multiple independent version numbers, each governing a different contract surface.

```
platform_api_version      ── "1.2.0"   ── The overall API version (aggregate)
  ├── ontology_api_version      ── "1.1.0"   ── Ontology API contract version
  ├── agent_api_version         ── "1.0.0"   ── Agent API contract version
  ├── knowledge_api_version     ── "1.0.0"   ── Knowledge API contract version
  ├── analytics_api_version     ── "1.0.0"   ── Analytics API contract version
  ├── decision_api_version      ── "1.0.0"   ── Decision API contract version
  ├── action_api_version        ── "1.0.0"   ── Action API contract version
  ├── workflow_api_version      ── "1.1.0"   ── Workflow API contract version
  ├── evaluation_api_version    ── "1.0.0"   ── Evaluation API contract version
  ├── package_api_version       ── "1.0.0"   ── Package API contract version
  ├── model_api_version         ── "1.0.0"   ── Model API contract version
  ├── event_api_version         ── "1.0.0"   ── Event API contract version
  ├── context_api_version       ── "1.0.0"   ── Context API contract version
  ├── identity_api_version      ── "1.0.0"   ── Identity API contract version
  └── observability_api_version ── "1.0.0"   ── Observability API contract version

package_schema_version    ── "1.0.0"   ── Package manifest format version
ontology_ir_version       ── "1.0.0"   ── Ontology IR format the compiler accepts
agent_contract_version    ── "1.0.0"   ── Agent interface contract version
tool_contract_version     ── "1.0.0"   ── Tool interface contract version
```

### Semantic Versioning Rules

All versions follow SemVer 2.0.0:

- **MAJOR** -- breaking changes that require consumer migration
- **MINOR** -- backward-compatible additions (new endpoints, new optional fields)
- **PATCH** -- backward-compatible fixes (bug fixes, documentation corrections)

### Backward Compatibility Guarantees

**Within a MAJOR version:**

1. **Additive changes are always safe.** New endpoints, new optional fields on requests, new fields on responses (that consumers should ignore if unrecognized).
2. **No removal of existing endpoints.** Endpoints may be deprecated but remain functional within the same major version.
3. **No removal of existing response fields.** Response fields may be deprecated but continue to be populated.
4. **No change in semantics of existing operations.** An operation that returns 200 today does not start returning 404 tomorrow for the same input.
5. **No change in error code semantics.** Error codes are stable within a major version.

### Deprecation Policy

```
Step 1: Mark as deprecated (MINOR version bump)
        ── Deprecated endpoints/fields carry a `deprecated` marker in the API spec
        ── Responses include a `Deprecation` header with sunset date
        ── SDK wrappers emit compile-time warnings

Step 2: Deprecation period (minimum 6 months for external APIs, 3 months for internal)
        ── Usage analytics track who still uses deprecated features
        ── Migration guides published

Step 3: Removal (MAJOR version bump)
        ── Deprecated feature removed from the new major version
        ── Previous major version continues to be supported for minimum 12 months
```

### Cross-Version Compatibility

**Can a package written for Platform API v2 still run on Platform API v3?**

The answer depends on the compatibility mode:

| Scenario | Supported? | Mechanism |
|----------|-----------|-----------|
| Package uses only v2 features on a v3 platform | Yes | Platform maintains v2 compatibility shim for the deprecation period |
| Package uses v2 features that were removed in v3 | No | Package must be upgraded. `getPackageCompatibility()` detects this. |
| Package requires v3 features on a v2 platform | No | `validatePackage()` fails with capability mismatch. |
| Package uses v2 features on a v4 platform (v2 long-deprecated) | No | Two major versions of forward compatibility is not guaranteed. |

**Compatibility detection at activation time:**

```
activatePackage(package_id, tenant_id)
    → read package manifest (requires platform_api_version >= X.Y.Z)
    → compare against current platform version
    → if compatible: activate
    → if deprecated features used: activate with warnings
    → if incompatible: reject with migration guidance
```

### Breaking Change Communication

1. **API changelog** -- published with every release, categorizing changes as additive, deprecation, or breaking.
2. **Migration guides** -- for every major version bump, a detailed migration guide is published.
3. **SDK warnings** -- deprecated features emit compile-time warnings in typed SDKs.
4. **Runtime headers** -- API responses include `Deprecation` and `Sunset` headers for deprecated endpoints.
5. **Package compatibility checks** -- `validatePackage()` and `getPackageCompatibility()` proactively detect issues.

### Version Negotiation

Clients specify the API version they expect:

```
# Via header
X-Platform-API-Version: 1.2.0

# Via URL prefix (for REST)
/api/v1/ontology/entities

# Via SDK initialization
const platform = new PlatformClient({ apiVersion: "1.2.0" });
```

The platform responds with the version it is serving:

```
X-Platform-API-Version: 1.2.0
X-Platform-API-Version-Supported: ["1.0.0", "1.1.0", "1.2.0"]
```

---

## SDK Strategy

### Required SDKs

| SDK | Language | Primary Audience | Priority |
|-----|----------|-----------------|----------|
| **Platform SDK** | TypeScript | Application developers, frontend teams, package authors | P0 |
| **Platform SDK** | Python | Data teams, ML engineers, agent developers, package authors | P0 |
| **CLI** | Cross-platform (Go or Rust binary) | DevOps, CI/CD, package lifecycle management | P1 |
| **Platform SDK** | Go | Infrastructure teams, internal services | P2 |

### Generation Strategy

**Contract-first, auto-generated with hand-written ergonomic layers.**

```
API Contracts (OpenAPI + AsyncAPI + GraphQL SDL + protobuf)
    │
    ├── Auto-generated client code (request/response types, HTTP calls, error handling)
    │       ├── TypeScript (openapi-typescript-codegen or similar)
    │       ├── Python (openapi-generator or similar)
    │       └── Go (openapi-generator or similar)
    │
    └── Hand-written ergonomic layer (on top of generated code)
            ├── TypeScript: fluent builders, typed responses, async iterators for streaming
            ├── Python: Pydantic models, async/await, context managers
            └── Go: idiomatic error handling, context propagation
```

**Why not purely auto-generated?**
Auto-generated SDKs produce correct but unergonomic code. The ergonomic layer adds:
- Fluent method chaining and builder patterns
- Streaming response helpers (async iterators in TS, async generators in Python)
- Retry logic with sensible defaults
- Authentication and token refresh handling
- Tenant context propagation
- Type-safe domain-specific helpers for common operations

**Why not purely hand-written?**
Hand-written SDKs drift from the API contract. Auto-generation ensures that when the API changes, the SDK types change, and consumers get compile-time errors for breaking changes.

### SDK and Package Authoring

Package authors use the same SDKs to:

1. **Define domain artifacts** -- ontology types, agent definitions, tool schemas (using typed SDK helpers)
2. **Test packages locally** -- invoke agents, query ontology, run evaluations (using the SDK against a local platform instance)
3. **Validate packages** -- call `validatePackage()` to check compatibility before publishing
4. **Deploy packages** -- call `registerPackage()` and `activatePackage()` via SDK or CLI

```typescript
// TypeScript package authoring example (illustrative)
import { OntologyBuilder, AgentBuilder, PackageBuilder } from '@allotey/platform-sdk';

const ontology = new OntologyBuilder()
  .entityType('Order', {
    properties: {
      amount: { type: 'decimal', required: true },
      status: { type: 'enum', values: ['pending', 'approved', 'rejected'] },
    },
    actions: {
      approve: {
        params: { approver_note: { type: 'string' } },
        requires: { permission: 'order:approve' },
        constraints: [{ when: 'amount > 10000', require: 'vp_approval' }],
      },
    },
  })
  .build();

const pkg = new PackageBuilder()
  .name('procurement')
  .version('1.0.0')
  .ontology(ontology)
  .requires({ platform_api_version: '>=1.0.0' })
  .build();
```

```python
# Python package authoring example (illustrative)
from allotey_platform_sdk import OntologyBuilder, AgentBuilder, PackageBuilder

ontology = (
    OntologyBuilder()
    .entity_type("Order", {
        "properties": {
            "amount": {"type": "decimal", "required": True},
            "status": {"type": "enum", "values": ["pending", "approved", "rejected"]},
        },
        "actions": {
            "approve": {
                "params": {"approver_note": {"type": "string"}},
                "requires": {"permission": "order:approve"},
            },
        },
    })
    .build()
)

pkg = (
    PackageBuilder()
    .name("procurement")
    .version("1.0.0")
    .ontology(ontology)
    .requires(platform_api_version=">=1.0.0")
    .build()
)
```

---

## Capability Negotiation

### The Problem

A domain package may require platform capabilities that do not exist in every deployment. For example:
- A package that defines durable workflows requires the Workflow Runtime (Temporal)
- A package that defines analytics models requires the Analytics Engine (Cube)
- A package that uses custom ML models requires the ML Platform

Not every platform deployment will have every capability. The platform must be able to tell a package what is available, and the package must be able to declare what it requires.

### Package Capability Requirements

A package declares its requirements in its manifest:

```yaml
# package manifest
name: procurement
version: 1.0.0
platform:
  api_version: ">=1.0.0"
  schema_version: "1.0.0"

requires:
  # Required capabilities -- activation fails without these
  capabilities:
    ontology_runtime:
      version: ">=1.0.0"
    agent_runtime:
      version: ">=1.0.0"
    knowledge_engine:
      version: ">=1.0.0"

  # Optional capabilities -- package works without these but with reduced functionality
  optional_capabilities:
    workflow_runtime:
      version: ">=1.0.0"
      fallback: "skip_workflow_features"
    analytics_engine:
      version: ">=1.0.0"
      fallback: "skip_analytics_features"
    ml_platform:
      version: ">=1.0.0"
      fallback: "use_external_model_api"
```

### Platform Capability Advertisement

The platform advertises its capabilities through a discovery endpoint:

```
GET /api/v1/platform/capabilities
```

Response:

```json
{
  "platform_api_version": "1.2.0",
  "package_schema_version": "1.0.0",
  "ontology_ir_version": "1.0.0",
  "capabilities": {
    "ontology_runtime": { "version": "1.1.0", "status": "active" },
    "agent_runtime": { "version": "1.0.0", "status": "active" },
    "knowledge_engine": { "version": "1.0.0", "status": "active" },
    "workflow_runtime": { "version": "1.0.0", "status": "active" },
    "analytics_engine": { "version": "1.0.0", "status": "active" },
    "model_gateway": { "version": "1.0.0", "status": "active" },
    "event_system": { "version": "1.0.0", "status": "active" },
    "evaluation_engine": { "version": "1.0.0", "status": "active" },
    "ml_platform": { "version": "0.0.0", "status": "not_available" },
    "secure_compute": { "version": "1.0.0", "status": "active" }
  },
  "supported_api_versions": ["1.0.0", "1.1.0", "1.2.0"],
  "supported_package_schema_versions": ["1.0.0"],
  "supported_ontology_ir_versions": ["1.0.0"]
}
```

### Negotiation Flow

```
1. Package author calls validatePackage(package_source)
   └── Platform reads manifest
   └── Compares required capabilities against platform capabilities
   └── Returns:
       ├── COMPATIBLE      ── all required capabilities met
       ├── DEGRADED         ── required met, some optional missing (lists which)
       └── INCOMPATIBLE     ── required capability missing or version too old

2. Package author calls activatePackage(package_id, tenant_id)
   └── Platform re-checks capabilities at activation time (capabilities may have changed)
   └── If COMPATIBLE: activate all package features
   └── If DEGRADED: activate with warnings, disable features that require missing capabilities
   └── If INCOMPATIBLE: reject activation with specific error

3. During runtime, packages can query capabilities:
   └── getCapability(capability_name) → version, status
   └── Allows runtime feature flags based on available capabilities
```

### What Happens When a Required Capability Is Missing

| Scenario | Behavior |
|----------|----------|
| Required capability missing | `activatePackage()` fails with `INCOMPATIBLE` status and a message listing missing capabilities |
| Required capability version too old | `activatePackage()` fails with `INCOMPATIBLE` status and minimum version requirement |
| Optional capability missing | `activatePackage()` succeeds with `DEGRADED` status; affected features are disabled; health dashboard shows degraded status |
| Capability becomes unavailable after activation | Package health degrades; affected operations return `503 Service Unavailable` with details; alerts fire |

---

## API Gateway Architecture

All Platform API calls flow through the AI Gateway, which enforces cross-cutting concerns before any capability contract is invoked.

```
Client Request
    │
    ▼
┌────────────────────────────────────────┐
│           AI / INTELLIGENCE GATEWAY    │
│                                        │
│  1. TLS termination                    │
│  2. Rate limiting                      │
│  3. Authentication (validate token)    │
│  4. Tenant resolution                  │
│  5. Authorization (check permissions)  │
│  6. Cost/budget check                  │
│  7. Request validation                 │
│  8. Trace span creation                │
│  9. Route to capability service        │
│ 10. Response enrichment (headers,      │
│     deprecation warnings, trace IDs)   │
└────────────────┬───────────────────────┘
                 │
                 ▼
    Capability Service (Ontology, Agent, Knowledge, etc.)
```

Every response includes standard headers:

```
X-Request-ID: uuid
X-Trace-ID: uuid
X-Platform-API-Version: 1.2.0
X-Tenant-ID: tenant_abc
X-Cost-Tokens: 1250
X-Cost-USD: 0.0037
```

---

## Error Contract

All APIs use a consistent error response format:

```json
{
  "error": {
    "code": "ONTOLOGY_ENTITY_NOT_FOUND",
    "message": "Entity type 'Order' not found in active ontology",
    "details": {
      "entity_type": "Order",
      "package_id": "procurement-v1",
      "tenant_id": "tenant_abc"
    },
    "request_id": "req_abc123",
    "trace_id": "trace_xyz789",
    "documentation_url": "https://docs.allotey.ai/errors/ONTOLOGY_ENTITY_NOT_FOUND"
  }
}
```

Error code categories:

| Prefix | Category | HTTP Status Range |
|--------|----------|------------------|
| `AUTH_*` | Authentication/authorization failures | 401, 403 |
| `VALIDATION_*` | Request validation errors | 400 |
| `ONTOLOGY_*` | Ontology-related errors | 400, 404 |
| `AGENT_*` | Agent execution errors | 400, 404, 500 |
| `KNOWLEDGE_*` | Knowledge/retrieval errors | 400, 404 |
| `WORKFLOW_*` | Workflow errors | 400, 404, 409 |
| `PACKAGE_*` | Package lifecycle errors | 400, 404, 409 |
| `MODEL_*` | Model/LLM errors | 400, 429, 502 |
| `BUDGET_*` | Cost/budget exceeded | 429 |
| `CAPABILITY_*` | Capability not available | 501, 503 |
| `INTERNAL_*` | Internal platform errors | 500 |

---

## Research Questions

### API Design

1. **Should the platform expose a unified GraphQL API alongside REST, or should GraphQL be limited to the Ontology and Context APIs?** A unified GraphQL layer simplifies the client experience but adds complexity to the platform. Per-API GraphQL is simpler to maintain but fragments the client experience.

2. **How should the API handle long-running operations?** Agent invocations and workflow starts can take seconds to hours. Options: synchronous with timeout, polling (GET with status), webhooks (callback URL), server-sent events, or WebSocket. Different APIs may need different patterns.

3. **Should the platform adopt the JSON:API specification or a custom response envelope?** JSON:API provides standardized pagination, filtering, includes, and sparse fieldsets. A custom envelope gives more control but requires more documentation.

4. **How does the API handle bulk operations?** Some APIs need batch support (bulk entity queries, batch event publishing, batch ingestion). What is the bulk operation pattern -- single request with array body, or multipart request, or separate batch endpoint?

### Protocol and Surface

5. **Should the gRPC API be exposed externally or kept internal only?** External gRPC would benefit performance-sensitive integrations (high-throughput data ingestion, real-time analytics) but adds operational complexity (load balancing, browser compatibility).

6. **How should the MCP tool surface be generated from API contracts?** If the Ontology API defines an `approve` action, the MCP tool for that action should be auto-generated. What is the generation pipeline? Ontology IR -> MCP tool schema -> MCP server registration.

7. **Should the Event API use WebSocket, SSE, or a message broker protocol (AMQP, MQTT) for subscriptions?** WebSocket is bidirectional but stateful. SSE is simpler but unidirectional. Message broker protocols are powerful but require client library support.

### Versioning and Compatibility

8. **Should individual API surfaces version independently or should there be a single platform version?** Independent versioning gives flexibility but makes compatibility matrices complex. A single version is simpler but forces all APIs to version-bump together.

9. **How should the platform handle API version discovery for packages that depend on multiple API versions?** A package might require Ontology API v1.1 and Workflow API v1.0 -- how is this expressed in the manifest and validated at activation time?

10. **What is the versioning strategy for the MCP tool surface?** MCP tool schemas are derived from the ontology. When the ontology changes, do MCP tool versions change? How does an agent know that a tool's schema has changed?

### SDK and Developer Experience

11. **Should the SDK include a local development server that emulates the platform?** Package authors need to test locally without a deployed platform. A local emulator (like Firebase Emulator Suite or LocalStack) would significantly improve the development experience.

12. **How should the SDK handle streaming responses across languages?** TypeScript has async iterators, Python has async generators, Go has channels. The SDK must provide idiomatic streaming in each language.

### Security and Multi-Tenancy

13. **How does the API enforce tenant isolation at the protocol level?** Is tenant_id a path parameter, a header, or derived from the authentication token? Each approach has trade-offs for URL structure, caching, and security.

14. **How should API keys vs. OAuth tokens vs. service accounts be handled for different consumer types?** Human users need OAuth. Agents need delegated tokens. CI/CD needs service accounts. External integrations may need API keys. What is the unified model?

### Performance and Scale

15. **What is the pagination strategy for list/query operations?** Cursor-based pagination (opaque cursor, no page numbers) vs. offset-based (traditional page numbers). Cursor-based is more robust for real-time data but harder for "jump to page N" use cases.

16. **How should the API handle request coalescing and caching?** Multiple agents may query the same ontology definition simultaneously. How is this deduplicated? What is cache invalidation policy when ontology definitions change?

---

## Cross-References

- `architecture/domain-package-architecture.md` -- Package structure, lifecycle, and the platform boundary this API serves
- `architecture/platform-tenancy-model.md` -- Multi-tenant isolation model (how tenant_id propagates through the API)
- `architecture/reference-architecture.md` -- Three-layer conceptual model and the gateway architecture
- `architecture/ontology-architecture.md` -- Ontology IR, compiler, and the contract that the Ontology API exposes
- `architecture/agent-runtime-architecture.md` -- Agent execution model behind the Agent API
- `architecture/workflow-architecture.md` -- Durable workflow model behind the Workflow API
- `architecture/authorization-architecture.md` -- Three-layer authorization model behind the Identity API
- `architecture/mcp-architecture.md` -- MCP/A2A protocols and how they relate to the API surface
- `architecture/event-architecture.md` -- Event schema and lifecycle behind the Event API
- `architecture/evaluation-architecture.md` -- Evaluation model behind the Evaluation API
- `architecture/capability-model.md` -- Full capability taxonomy that the API surfaces expose
- `architecture/observability-architecture.md` -- Observability model behind the Observability API
- `architecture/knowledge-architecture.md` -- Knowledge engine model behind the Knowledge API
- `architecture/analytics-architecture.md` -- Analytics model behind the Analytics API
