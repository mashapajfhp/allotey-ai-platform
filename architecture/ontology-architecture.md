# Ontology Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## What Is an Ontology in This Context?

An ontology is the authoritative model of what exists in the business domain — entity types, relationship types, properties, actions, rules, and constraints. It is the bridge between raw data and business-meaningful operations.

## Why Ontology Is More Than a Semantic Layer

A traditional BI semantic layer defines:
- Metrics (measures, dimensions, calculations)
- Analytical relationships (joins, hierarchies)
- Business naming conventions

An operational ontology (as pioneered by Palantir) adds:
- **Actions** — what can be done to entities (approve, reject, assign, escalate)
- **Security** — who can see/modify which entities under what conditions
- **Logic** — functions and computations that run on entities
- **Automations** — event-triggered workflows operating on entities
- **Agents** — AI agents that reason over and act upon entities

```
Semantic Layer:  Data + Metrics + Naming
Ontology:        Data + Logic + Actions + Security + Agents
```

This distinction is critical. The ontology is not just a read model — it is an operational model that agents can act through.

## Ontology Components

### Entity Types
Define the kinds of things that exist: Customer, Order, Employee, Product, Claim, Policy. Each entity type has a schema of properties and a set of allowed actions.

### Properties
Typed attributes of entities: `name: string`, `amount: decimal`, `status: enum[active, inactive]`, `created_at: timestamp`.

### Relationships (Links)
Typed connections between entities: `Order → belongs_to → Customer`, `Employee → reports_to → Employee`. Relationships have cardinality and may have properties.

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

## Research Questions

- How should the ontology be defined? Code-first (TypeScript/Python), YAML, or a visual editor?
- How does ontology versioning work? Can the ontology evolve without breaking existing agents?
- How does the ontology relate to the underlying database schema?
- Should the ontology support inheritance? (TypeDB does; Palantir has a simpler model)
- How do ontology changes propagate to agents, tools, and the semantic layer?
- How does the ontology handle multi-tenancy? Same schema, different data? Different schemas per tenant?

## References

- `commercial-platforms/palantir/ontology.md` — primary inspiration
- `open-source/ontology-context/semantica.md` — context graph approach
- `open-source/ontology-context/typedb.md` — typed ontology with reasoning
