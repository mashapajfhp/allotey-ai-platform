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

## Canonical Ontology Intermediate Representation (IR)

### Why TypeScript Is Not the Answer

Earlier iterations of this architecture assumed TypeScript as the canonical ontology representation. This is premature. TypeScript is one possible authoring interface, but conflating the authoring format with the canonical representation creates several problems:

- **Lock-in to a single ecosystem.** Teams that work in Python, YAML, or visual editors cannot participate as first-class ontology authors.
- **Compilation target confusion.** If TypeScript IS the ontology, what compiles it? TypeScript is not designed to be a compiler input for generating database schemas, authorization models, and semantic layers.
- **IP fragility.** The core intellectual property should be in a format-independent representation and the compiler that processes it, not in any single authoring DSL.

The architecture should instead be based on a **canonical Ontology Intermediate Representation (IR)** with multiple authoring interfaces that all compile down to it.

### Architecture

```
       CANONICAL ONTOLOGY IR
                |
       +--------+---------+
       |        |         |
      TS       YAML      UI
    authoring authoring authoring
       |        |         |
       +--------+---------+
                v
             COMPILER
                |
      +---------+-------------+
      v         v             v
API Schema  Permissions     Semantics
      |         |             |
      v         v             v
MCP Tools   OpenFGA       Cube models
```

Multiple authoring interfaces (TypeScript DSL, YAML definitions, visual UI editor, potentially Python/Pydantic) all produce the same canonical IR. The compiler then emits all downstream artifacts from this single source of truth.

### The IR Is the Core IP

The Ontology IR and its compiler are the potential core intellectual property of the platform. The IR must be:

- **Format-independent** -- not tied to any programming language's type system
- **Self-describing** -- carries enough metadata to generate any downstream artifact
- **Versionable** -- supports schema evolution without breaking existing consumers
- **Validatable** -- can be checked for consistency before compilation
- **Extensible** -- new output targets can be added without modifying the IR itself

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

The compiler should emit the following from a single ontology definition:

| Output | Purpose |
|--------|---------|
| **Database schema** | PostgreSQL DDL, migration files |
| **Graph schema** | Neo4j/TypeDB schema definitions |
| **JSON Schema** | Validation schemas for API payloads |
| **OpenAPI specs** | REST API documentation and client generation |
| **MCP tool definitions** | Tool schemas for agent consumption |
| **OpenFGA authorization models** | Fine-grained authorization rules |
| **Cube semantic models** | Analytics semantic layer definitions |
| **SDK types (TypeScript)** | Typed client libraries for frontend/backend |
| **SDK types (Python)** | Typed client libraries for ML/data pipelines |
| **Event schemas** | CloudEvents / AsyncAPI definitions for event-driven flows |
| **Validation rules** | Runtime validators for entity mutations |
| **UI metadata** | Form schemas, display rules, field ordering |
| **Agent context definitions** | Structured context for AI agents to understand entities |

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

- `commercial-platforms/palantir/ontology.md` -- primary inspiration
- `open-source/ontology-context/semantica.md` -- context graph approach
- `open-source/ontology-context/typedb.md` -- typed ontology with reasoning
