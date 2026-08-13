# Ontology Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## What Is an Ontology in This Context?

An ontology is the authoritative model of what exists in the business domain -- entity types, relationship types, properties, actions, rules, and constraints. It is the bridge between raw data and business-meaningful operations.

## Why Ontology Is More Than a Semantic Layer

A traditional BI semantic layer defines:
- Metrics (measures, dimensions, calculations)
- Analytical relationships (joins, hierarchies)
- Business naming conventions

An operational ontology (as pioneered by Palantir) adds:
- **Actions** -- what can be done to entities (approve, reject, assign, escalate)
- **Security** -- who can see/modify which entities under what conditions
- **Logic** -- functions and computations that run on entities
- **Automations** -- event-triggered workflows operating on entities
- **Agents** -- AI agents that reason over and act upon entities

```
Semantic Layer:  Data + Metrics + Naming
Ontology:        Data + Logic + Actions + Security + Agents
```

This distinction is critical. The ontology is not just a read model -- it is an operational model that agents can act through.

## Ontology Components

### Entity Types
Define the kinds of things that exist: Customer, Order, Employee, Product, Claim, Policy. Each entity type has a schema of properties and a set of allowed actions.

### Properties
Typed attributes of entities: `name: string`, `amount: decimal`, `status: enum[active, inactive]`, `created_at: timestamp`.

### Relationships (Links)
Typed connections between entities: `Order -> belongs_to -> Customer`, `Employee -> reports_to -> Employee`. Relationships have cardinality and may have properties.

### Actions
Operations that modify entity state: `approve(order)`, `assign(task, employee)`, `escalate(claim)`. Actions have:
- Input parameters
- Validation rules
- Authorization requirements
- Side effects (notifications, webhooks)
- Audit trail

### Functions
Computations over entities that don't modify state: `calculateRisk(customer)`, `predictDemand(product, region)`. Functions can be deterministic or model-backed.

### Rules & Constraints
Business rules that entities must satisfy: "An order cannot be approved if amount > $10,000 without VP approval." Constraints are enforced at the ontology level, not scattered across application code.

### Security Model
Per-entity-type and per-instance access control:
- Who can read entities of this type?
- Who can modify them?
- Who can execute which actions?
- What marking categories apply?
- How does row-level security interact with agent delegation?

---

## Domain Definition IR — Beyond Ontology Alone

### Why a Single Ontology IR Is Not Sufficient

The earlier architecture proposed a single Ontology IR that the compiler would use to generate database schemas, authorization models, semantic layers, MCP tools, and more. This is conceptually appealing but has a fundamental problem:

**You cannot automatically derive all semantics, permissions, and business policies merely from entity ontology.**

Consider an entity definition:

```
Invoice
  amount: decimal
  owner: User
  status: enum[draft, submitted, approved, paid]
```

This does NOT automatically tell us:
- `Revenue = sum(amount) WHERE status = 'paid' AND type != 'tax'` ← semantic definition
- `Finance managers can approve invoices under $50,000 except related-party invoices` ← policy definition
- `When invoice.status changes to 'submitted', notify the assigned approver` ← event/workflow definition
- `The invoice agent can read all invoices but can only approve those assigned to the requesting user's team` ← agent capability definition

These are **separately authored domain meanings**, not derivable from entity structure.

### The Domain Definition IR

The solution is a composed IR that includes multiple sub-IRs, each addressing a different aspect of domain intelligence:

```
DOMAIN DEFINITION IR
         │
         ├── Ontology IR        (entities, relationships, actions, constraints)
         ├── Semantic IR         (measures, dimensions, calculations, time grains)
         ├── Authorization IR    (roles, relationships, permissions, delegation)
         ├── Policy IR           (rules, conditions, constraints, compliance)
         ├── Action IR           (action schemas, validation, side effects, approvals)
         ├── Event IR            (event types, triggers, subscriptions, patterns)
         ├── Workflow IR         (process definitions, steps, approvals, signals)
         └── Agent Capability IR (agent definitions, instructions, tool access, reasoning)
```

Each sub-IR is authored independently (though they cross-reference). The compiler validates cross-IR consistency and produces runtime artifacts through adapters.

### Architecture

```
  AUTHORING INTERFACES
       │
  TS  YAML  UI  Python
       │
       ▼
  DOMAIN DEFINITION IR (vendor-neutral)
       │
       ├── Ontology IR ──────────┐
       ├── Semantic IR ──────────┤
       ├── Authorization IR ─────┤
       ├── Policy IR ────────────┤
       ├── Action IR ────────────┤
       ├── Event IR ─────────────┤
       ├── Workflow IR ──────────┤
       └── Agent Capability IR ──┤
                                 │
                           COMPILER
                                 │
                           ADAPTERS
                        ┌────┬────┬────┐
                        ▼    ▼    ▼    ▼
                     DB   Auth  Sem  Tools ...
                    (PG) (ReBAC)(Cube)(MCP)
```

**Critically:** the adapters translate vendor-neutral IR to specific infrastructure products. Replacing Cube with another semantic engine, or OpenFGA with another authorization system, means writing a new adapter — not changing domain packages or the IR.

### Why TypeScript Is Not the Answer

Earlier iterations assumed TypeScript as the canonical ontology representation. This is premature. TypeScript is one possible authoring interface, but conflating the authoring format with the canonical representation creates:

- **Lock-in to a single ecosystem.** Teams that work in Python, YAML, or visual editors cannot participate as first-class ontology authors.
- **Compilation target confusion.** TypeScript is not designed to be a compiler input for generating database schemas, authorization models, and semantic layers.
- **IP fragility.** The core IP should be in a format-independent representation and the compiler that processes it, not in any single authoring DSL.

### The Domain Definition IR Is the Core IP

The Domain Definition IR, its compiler, and its adapter framework are potentially the platform's most defensible intellectual property. The IR must be:

- **Format-independent** -- not tied to any programming language's type system
- **Self-describing** -- carries enough metadata to generate any downstream artifact
- **Versionable** -- supports schema evolution without breaking existing consumers
- **Validatable** -- can be checked for cross-IR consistency before compilation
- **Extensible** -- new output targets can be added without modifying the IR itself
- **Composable** -- sub-IRs can reference each other (semantic IR references ontology IR entities)
- **Vendor-neutral** -- no references to Cube, OpenFGA, OPA, Temporal, MCP, or any specific product

### Authoring Formats Under Research

The following formats are being evaluated as potential authoring interfaces (not as the IR itself):

| Format | Strengths | Concerns |
|--------|-----------|----------|
| **TypeScript DSL** | Type-safe, IDE support, familiar to frontend teams | Ties to JS ecosystem, hard to parse programmatically |
| **Python / Pydantic** | Type-safe, familiar to ML/data teams, strong validation | Ties to Python ecosystem |
| **YAML** | Human-readable, language-agnostic, easy to template | No type safety, verbose for complex schemas |
| **JSON Schema** | Industry standard, wide tooling support | Verbose, weak at expressing relationships and actions |
| **OpenAPI** | API-first, broad ecosystem | Designed for REST APIs, not ontologies |
| **GraphQL SDL** | Strong type system, relationship-native | Focused on query shape, not business logic |
| **Protocol Buffers** | Compact, versioning-friendly, multi-language codegen | No native support for business rules or actions |
| **RDF / OWL** | Formal semantics, reasoning support, W3C standard | Steep learning curve, poor developer ergonomics |
| **SHACL** | Constraint language for RDF, validation-focused | Tied to RDF ecosystem |
| **TypeQL** | Native reasoning, typed relationships | Small ecosystem, TypeDB dependency |

The likely outcome is that the IR is a purpose-built format (possibly JSON-based) and multiple authoring interfaces compile into it.

### Compiler Output Targets

The compiler processes the composed Domain Definition IR and emits runtime artifacts through adapters. Adapters are infrastructure-specific; the IR is vendor-neutral.

| Output | Source IR(s) | Adapter translates to |
|--------|-------------|----------------------|
| **Database schema** | Ontology IR | DDL for selected database (e.g., PostgreSQL) |
| **Graph schema** | Ontology IR | Schema for selected graph store |
| **JSON Schema** | Ontology IR | Validation schemas for API payloads |
| **OpenAPI specs** | Ontology IR, Action IR | REST API documentation and client generation |
| **Tool definitions** | Action IR, Agent Capability IR | Tool schemas for selected tool protocol (e.g., MCP) |
| **Authorization models** | Authorization IR | Model for selected auth system (e.g., OpenFGA) |
| **Semantic models** | Semantic IR | Model for selected semantic engine (e.g., Cube) |
| **Policy rules** | Policy IR | Rules for selected policy engine (e.g., OPA, Cedar) |
| **Workflow definitions** | Workflow IR | Definitions for selected workflow engine (e.g., Temporal) |
| **SDK types (TypeScript)** | Ontology IR, Action IR | Typed client libraries |
| **SDK types (Python)** | Ontology IR, Action IR | Typed client libraries |
| **Event schemas** | Event IR | Event definitions for selected event system |
| **Validation rules** | Ontology IR, Policy IR | Runtime validators |
| **UI metadata** | Ontology IR | Form schemas, display rules, field ordering |
| **Agent context definitions** | Ontology IR, Agent Capability IR | Structured context for agent consumption |

**Key principle:** Infrastructure product names (Cube, OpenFGA, MCP, Temporal, etc.) appear only in adapter implementations — never in the IR or domain packages.

---

## Research Questions

### IR Design
- What is the right internal format for the IR? JSON-based AST? A graph structure? Something else?
- How does the IR represent actions, rules, and security -- concepts that go beyond data schema?
- How does the IR handle computed properties and function definitions?
- Can the IR support inheritance and mixins? Should it?
- How does IR versioning work? Can schemas evolve without breaking existing compiled artifacts?

### Authoring
- Which authoring formats should be supported in the first iteration?
- How do we ensure round-trip fidelity (author -> IR -> author) for each format?
- Can multiple authoring formats coexist for the same ontology (e.g., some entities defined in YAML, others in TypeScript)?
- How does a visual/UI authoring tool interact with the IR?

### Compilation
- How does the compiler handle partial recompilation (only regenerate affected outputs)?
- How are compiler plugins structured for adding new output targets?
- How does the compiler handle target-specific constraints (e.g., PostgreSQL column limits vs. Neo4j property types)?
- What is the testing strategy for compiler correctness across all output targets?

### Ontology Lifecycle
- How does ontology versioning work? Can the ontology evolve without breaking existing agents?
- How does the ontology relate to the underlying database schema?
- How do ontology changes propagate to agents, tools, and the semantic layer?
- How does the ontology handle multi-tenancy? Same schema, different data? Different schemas per tenant?

### Integration
- How does the compiled OpenFGA model stay in sync with the compiled database schema?
- How do MCP tool definitions reference the compiled JSON Schema for validation?
- How does the Cube semantic model reference the compiled database schema?
- How do event schemas relate to action definitions in the ontology?

## Spike Reference

- `architecture/spikes/008-ontology-ir-compiler.md` -- detailed investigation of IR formats and compiler architecture

## References

- `architecture/domain-package-architecture.md` -- Domain packages use the Domain Definition IR
- `architecture/spikes/008-ontology-ir-compiler.md` -- Compiler architecture spike
- `commercial-platforms/palantir/ontology.md` -- primary inspiration
- `open-source/ontology-context/semantica.md` -- context graph approach
- `open-source/ontology-context/typedb.md` -- typed ontology with reasoning
