# Spike 008: Ontology Intermediate Representation (IR) Compiler

**Status:** NOT STARTED
**Time-box:** 2 weeks
**Author:** TBD
**Date:** 2026-08-13

## Question

Can we design an Ontology Intermediate Representation (IR) that serves as the canonical definition of platform entities, relationships, and behaviors — then compile this IR to multiple output formats (database schema, MCP tool definitions, OpenFGA authorization model, JSON Schema validation, API types)? Is the IR, rather than any single authoring format like TypeScript, the right core abstraction?

## Hypothesis

We believe an IR-based approach decouples the authoring experience from the compilation targets, allowing multiple input formats (TypeScript DSL, YAML, JSON Schema) to produce a single canonical IR that compilers then transform into platform artifacts. This prevents lock-in to a single authoring format and enables optimization at the IR level. We expect the main challenge to be defining an IR expressive enough to capture all platform concepts (entities, relationships, computed properties, authorization rules, temporal validity, agent capabilities) while remaining compilable to all target formats.

## Prototype Plan

### Phase 1: IR Design

1. **Core IR concepts:**
   - **Entity** — Named type with properties, relationships, behaviors
   - **Property** — Typed field (scalar, enum, reference, computed, vector embedding)
   - **Relationship** — Typed, directed edge between entities (with cardinality, constraints)
   - **Behavior** — Operations an entity supports (CRUD, custom actions)
   - **Authorization rule** — Who can perform which behavior on which entity
   - **Temporal annotation** — Valid-from/valid-to, versioning semantics
   - **Tenant scope** — How the entity is isolated per tenant
   - **Agent capability** — What agent operations this entity participates in

2. **IR format:**
   - JSON-based (for machine processing)
   - Versioned schema (IR schema evolves independently)
   - Serializable (can be stored, transmitted, cached)
   - Self-describing (includes metadata about authoring source, compilation targets)

3. **IR validation:**
   - Internal consistency (no dangling references, valid types)
   - Completeness (all required annotations present for target compilation)
   - Compatibility (breaking change detection between IR versions)

### Phase 2: Authoring Formats (Inputs)

#### Format A: TypeScript DSL
```typescript
const Customer = entity("Customer", {
  properties: {
    name: string().required(),
    email: string().email().unique(),
    plan: enum_(["free", "pro", "enterprise"]),
    embedding: vector(1536),
  },
  relationships: {
    orders: hasMany("Order"),
    tenant: belongsTo("Tenant"),
  },
  authorization: {
    view: ["tenant_member", "admin"],
    edit: ["tenant_admin", "admin"],
  },
  temporal: { versioned: true },
});
```

#### Format B: YAML
```yaml
entities:
  Customer:
    properties:
      name: { type: string, required: true }
      email: { type: string, format: email, unique: true }
      plan: { type: enum, values: [free, pro, enterprise] }
      embedding: { type: vector, dimensions: 1536 }
    relationships:
      orders: { type: hasMany, target: Order }
      tenant: { type: belongsTo, target: Tenant }
    authorization:
      view: [tenant_member, admin]
      edit: [tenant_admin, admin]
    temporal:
      versioned: true
```

#### Format C: JSON Schema (Extended)
```json
{
  "$type": "entity",
  "$id": "Customer",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email", "x-unique": true }
  },
  "x-relationships": { ... },
  "x-authorization": { ... },
  "x-temporal": { ... }
}
```

### Phase 3: Compilation Targets (Outputs)

#### Target 1: Database Schema (PostgreSQL + AGE)
- Relational tables with columns, types, constraints, indexes
- AGE graph types for relationship-heavy entities
- pgvector columns for embedding properties
- RLS policies from authorization rules
- Temporal tables (valid_from/valid_to) from temporal annotations
- Migration files (incremental schema changes)

#### Target 2: MCP Tool Definitions
- One MCP tool per entity behavior (e.g., `create_customer`, `get_customer`, `list_customers`)
- Tool input schemas from entity properties
- Tool descriptions from entity metadata
- Authorization annotations for MCP governance gateway

#### Target 3: OpenFGA Authorization Model
- Type definitions from entities
- Relation definitions from authorization rules
- Computed relations from relationship patterns
- Condition definitions from property-based access rules

#### Target 4: JSON Schema Validation
- Request/response validation schemas
- Property-level validation rules
- Relationship reference validation
- API documentation generation (OpenAPI)

#### Target 5: API Types (TypeScript)
- TypeScript interfaces from entity definitions
- Zod schemas for runtime validation
- API client types (request/response)
- Database query types (Drizzle/Prisma schema)

### Phase 4: Round-Trip Testing

1. **Author** entity definition in TypeScript DSL
2. **Compile** to IR
3. **Compile** IR to all 5 output targets
4. **Verify** outputs are correct and consistent with each other
5. **Modify** entity definition (add property, change type, add relationship)
6. **Recompile** and verify incremental changes are handled correctly
7. **Test with all 3 authoring formats** producing identical IR

## Test Methodology

### IR Expressiveness
- Can the IR represent all entities in the platform's domain model?
- Are there concepts that cannot be expressed? Document gaps.
- Is the IR overly complex for simple entities?

### Compilation Correctness
- Do generated database schemas match expected DDL?
- Do generated MCP tools have correct schemas?
- Does the OpenFGA model enforce expected authorization?
- Do JSON Schemas validate correctly against sample data?
- Do TypeScript types compile without errors?

### Authoring Format Parity
- Do all 3 authoring formats produce identical IR for the same entity?
- Which format is most natural for developers?
- Which format is most appropriate for non-developer authoring (product managers, domain experts)?

### Incremental Compilation
- Can the compiler produce migration diffs (not just full schemas)?
- Does adding a property to an entity produce correct ALTER TABLE + schema updates?
- Does changing a relationship produce correct migration steps?

### Performance
- Compilation time for 10, 50, 100 entity definitions
- IR serialization/deserialization speed
- Memory usage during compilation

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

PENDING — Failure modes will be documented during investigation. Anticipated areas of concern:

- IR may become overly complex trying to be expressive enough for all compilation targets
- Database schema generation may not handle all PostgreSQL-specific features (partial indexes, custom types, extensions)
- OpenFGA model generation may produce overly permissive or overly restrictive authorization
- Incremental compilation (migrations) is significantly harder than full compilation
- Multiple authoring formats may drift in capability if not rigorously tested for parity
- The IR itself becomes the maintenance burden — every new platform feature requires IR schema changes
- Compilation target ordering may matter (e.g., database schema must exist before MCP tools reference it)

## Operational Findings

PENDING — Operational findings will be documented during investigation.

## Security Findings

PENDING — Security findings will be documented during investigation.

## Performance Findings

PENDING — Performance findings will be documented during investigation.

## Conclusion

PENDING — Conclusion will be documented when the spike is completed.

## Recommendation

PENDING — Recommendation will be made when results are available.

## Confidence Level

PENDING — Confidence level will be assessed based on the breadth of entity types tested and the correctness of all compilation targets.
