# Domain Package Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Foundational Principle

The platform is product-agnostic. The core must not contain assumptions about any specific application domain, workflow, entity type, industry, or product. Domain-specific concepts enter only through explicit extension mechanisms.

**The platform stays generic; intelligence enters through packages.**

---

## Conceptual Architecture

```
┌─────────────────────────────────────────────────┐
│              PRODUCT / DOMAIN LAYER             │
│                                                 │
│ Ontologies   Semantics   Agents   Tools         │
│ Policies     Workflows   Connectors             │
└────────────────────┬────────────────────────────┘
                     │
               Stable Platform API
                     │
┌────────────────────▼────────────────────────────┐
│            ENTERPRISE AI PLATFORM               │
│                                                 │
│ Intelligence Gateway                            │
│ Model Gateway                                   │
│ Agent Runtime                                   │
│ Tool / MCP Gateway                              │
│ Ontology Runtime / Compiler                     │
│ Context / Knowledge                             │
│ Decision & Action Governance                    │
│ Authorization / Policy                          │
│ Workflow Runtime                                │
│ Evaluation / Observability                      │
│ Provenance / Audit                              │
│ Cost / Metering                                 │
│ Secure Compute                                  │
│ Developer Platform                              │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│          INFRASTRUCTURE / DATA                  │
│ Databases │ Graph │ Vector │ Events │ ML        │
└─────────────────────────────────────────────────┘
```

---

## What Is a Domain Package?

A Domain Package is the unit of domain-specific intelligence that the platform loads, validates, and executes. The platform core provides the runtime, governance, and infrastructure. A domain package provides the knowledge, behavior, and business rules for a specific domain.

### Candidate Package Structure

> The exact format is under research. This is a candidate structure.

```
domain-package/
├── manifest.yaml              # Package metadata, version, dependencies, compatibility
├── ontology/                  # Entity types, relationships, actions, rules
│   ├── entities/
│   ├── relationships/
│   ├── actions/
│   └── constraints/
├── semantics/                 # Business metric definitions (Cube models, measures, dimensions)
│   ├── models/
│   └── views/
├── agents/                    # Agent definitions, capabilities, instructions
│   ├── definitions/
│   └── prompts/
├── tools/                     # MCP tool definitions and implementations
│   ├── definitions/
│   └── handlers/
├── workflows/                 # Durable workflow definitions
│   └── definitions/
├── policies/                  # Domain-specific authorization and governance rules
│   ├── authorization/         # OpenFGA model extensions
│   └── governance/            # OPA/Cedar policy extensions
├── connectors/                # External system integrations
│   ├── ingestion/
│   └── actions/
├── evaluations/               # Domain-specific quality evaluation criteria
│   └── test-cases/
├── prompts/                   # Prompt templates with domain context
│   └── templates/
└── migrations/                # Schema migrations for domain-specific data
    └── versions/
```

---

## Platform Core vs. Domain Package Boundary

### Platform Core Provides (Domain-Independent)

| Capability | What the core does |
|-----------|-------------------|
| Ontology Runtime | Loads, validates, and serves ontology definitions — does NOT define entities |
| Semantic Engine | Executes metric queries from declarative models — does NOT define metrics |
| Agent Runtime | Executes agents with governance — does NOT contain domain reasoning |
| Tool Gateway | Governs tool access via MCP — does NOT implement domain tools |
| Workflow Runtime | Runs durable workflows — does NOT define business processes |
| Authorization | Enforces relationship-based access — does NOT define domain roles |
| Policy Engine | Evaluates policies — does NOT contain domain rules |
| Context Graph | Stores and queries entity instances — does NOT define entity types |
| Model Gateway | Routes LLM requests — does NOT know what questions are being asked |
| Observability | Traces everything — does NOT interpret domain meaning |
| Provenance | Records evidence chains — does NOT judge domain correctness |
| Secure Compute | Sandboxes execution — does NOT know what code is running |

### Domain Package Provides (Domain-Specific)

| Artifact | What the package provides |
|----------|-------------------------|
| Ontology definitions | Entity types, relationships, valid actions, business constraints |
| Semantic models | Measures, dimensions, time grains, calculation logic |
| Agent definitions | Agent capabilities, instructions, tool access, reasoning patterns |
| Tool implementations | MCP tools for domain-specific operations |
| Workflow definitions | Business process definitions, approval chains, scheduled operations |
| Authorization models | Domain roles, permissions, relationship types |
| Governance policies | Compliance rules, data classification, action constraints |
| Connector configs | External system mappings, ingestion rules, action targets |
| Evaluation criteria | Domain-specific quality test cases |
| Prompt templates | Domain-aware prompt patterns |

---

## Package Lifecycle

```
AUTHOR → VALIDATE → REGISTER → ACTIVATE → MONITOR → VERSION → DEPRECATE
```

| Stage | What happens |
|-------|-------------|
| AUTHOR | Developer creates or updates package artifacts |
| VALIDATE | Platform validates package against schema, checks compatibility, runs evaluation suite |
| REGISTER | Package is registered in the platform's package registry |
| ACTIVATE | Package is loaded into the runtime for a specific tenant/environment |
| MONITOR | Platform tracks package health — agent quality, tool success rates, error rates |
| VERSION | New package version authored, validated, and activated (with rollback capability) |
| DEPRECATE | Package is marked for removal, dependents are notified |

---

## Multi-Product Isolation

Different products using the same platform must not leak:
- **Data** — tenant and product data boundaries are enforced
- **Policies** — Product A's authorization rules do not affect Product B
- **Models** — Product A's semantic definitions do not appear in Product B's queries
- **Agents** — Product A's agents cannot be invoked from Product B's context
- **Configuration** — Package settings are scoped to product/tenant

This is enforced through:
- Tenant isolation at the infrastructure layer (RLS, namespace separation)
- Package scoping at the control plane (packages are activated per tenant/product)
- Authorization boundaries at the gateway (OpenFGA relationships scope access)

---

## Architecture Validation Test

**Build two deliberately unrelated synthetic domains during the architecture-spike phase.**

Example synthetic domains:
1. **Healthcare clinic scheduling** — patients, appointments, practitioners, referrals, insurance verification
2. **Supply chain logistics** — warehouses, shipments, routes, carriers, inventory, customs

If both can be modeled as domain packages without changing `/core`, the abstraction is healthy. If core code starts filling with domain conditionals, the boundary is wrong.

See `architecture/spikes/011-domain-package-validation.md`.

---

## What the Platform Core Must NOT Contain

- Entity type definitions for any specific domain
- Business metric calculations
- Industry-specific compliance rules
- Product-specific UI components
- Domain-specific agent prompts or instructions
- Hardcoded references to external systems
- Domain-specific data schemas (beyond the package schema itself)

**Test:** Search `/core` for domain-specific terms. If any are found outside test fixtures, it is an architecture violation.

---

## Relationship to Ontology IR

The ontology portion of a domain package is compiled through the Ontology IR Compiler (see `architecture/ontology-architecture.md`). The package manifest references ontology source files; the compiler produces runtime artifacts (database schemas, graph schemas, MCP tools, authorization models, semantic models, etc.).

```
Package ontology source files
    → Ontology IR Compiler
        → Database schema migrations
        → Graph schema definitions
        → MCP tool definitions
        → OpenFGA authorization model
        → Cube semantic models
        → SDK types
        → Validation rules
        → Agent context definitions
```

The compiler is platform core. The ontology definitions are domain package content.

---

## Research Questions

### Package Format
1. What is the manifest schema? YAML, JSON, TOML?
2. How are package dependencies declared and resolved?
3. How are package versions managed? SemVer? Content-addressed?
4. How are breaking changes detected between package versions?

### Package Loading
5. How does the platform discover and load packages at runtime?
6. Can packages be hot-reloaded without platform restart?
7. How are package conflicts resolved when multiple packages define overlapping concepts?

### Package Governance
8. Who can author, publish, and activate packages?
9. How are packages reviewed before activation?
10. How is package quality tracked over time?

### Multi-Product
11. Can one tenant run multiple domain packages simultaneously?
12. How do packages compose? Can a "finance" package extend a "core-business" package?
13. How are cross-package relationships handled (e.g., an order entity referencing a customer entity from a different package)?

### Developer Experience
14. What does the local development workflow look like for package authors?
15. How are packages tested before deployment?
16. What SDK or CLI tooling is needed?

---

## References

- `AGENTS.md` rules 6, 7, 8 — Product agnosticism, validation questions, domain/infrastructure separation
- `architecture/reference-architecture.md` — Three-layer conceptual model
- `architecture/ontology-architecture.md` — Ontology IR Compiler
- `architecture/spikes/011-domain-package-validation.md` — Two-domain validation test
