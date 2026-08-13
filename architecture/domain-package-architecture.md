# Domain Package Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Foundational Principle

The platform is product-agnostic. The core must not contain assumptions about any specific application domain, workflow, entity type, industry, or product. Domain-specific concepts enter only through explicit extension mechanisms.

**The platform stays generic; intelligence enters through packages.**

**Domain packages must depend on platform contracts, not infrastructure products.** Cube, OpenFGA, OPA, MCP, Temporal, etc. are compiler/runtime adapters — not package-level dependencies. Replacing any infrastructure product must not require changing domain packages.

---

## Intelligence-as-Code

The Domain Package System is potentially the platform's most defensible IP. The vision is broader than an ontology compiler: it is the ability to describe domain intelligence declaratively and have the platform compile, validate, execute, observe, and evolve it.

```
DOMAIN INTELLIGENCE PACKAGE
          │
    Domain Definition IR
    (vendor-neutral)
          │
      COMPILER
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
 ADAPTERS → Infrastructure
          │
      RUNTIME
          │
    GOVERNANCE
```

A domain package expresses:
- What entities exist and how they relate
- What metrics mean and how they are calculated
- What agents can do and what they know
- What tools are available and what they require
- What actions are possible and what governance applies
- What workflows model business processes
- What policies govern access and behavior
- What events matter and what they trigger

The platform compiles this into executable intelligence. The author thinks in domain terms. The platform handles infrastructure.

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
        Domain Definition IR (vendor-neutral)
                     │
               Stable Platform API
                     │
┌────────────────────▼────────────────────────────┐
│            ENTERPRISE AI PLATFORM               │
│                                                 │
│ Compiler + Adapters                             │
│ Intelligence Gateway                            │
│ Agent Runtime          Workflow Runtime          │
│ Tool Gateway           Authorization Runtime     │
│ Ontology Runtime       Policy Runtime            │
│ Semantic Runtime       Context / Knowledge       │
│ Decision Governance    Evaluation / Observability │
│ Provenance / Audit     Cost / Metering           │
│ Secure Compute         Developer Platform        │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│          INFRASTRUCTURE / DATA                  │
│ Databases │ Graph │ Vector │ Events │ ML        │
└─────────────────────────────────────────────────┘
```

---

## Vendor-Neutral Package Design

### The Problem with Vendor-Specific Packages

If domain packages contain Cube models, OpenFGA type definitions, OPA Rego policies, or Temporal workflow DSL directly, then replacing any of those products requires changing every domain package. That violates the platform substitutability principle.

### The Adapter Pattern

```
DOMAIN PACKAGE
       │
       ▼
Vendor-neutral definitions
       │
       ├── semantic IR      (measures, dimensions, calculations)
       ├── authorization IR  (roles, relationships, permissions)
       ├── policy IR         (rules, conditions, constraints)
       ├── tool capability IR(capabilities, inputs, outputs, permissions)
       ├── workflow IR       (steps, approvals, conditions, signals)
       ├── agent IR          (capabilities, instructions, tool access)
       ├── ontology IR       (entities, relationships, actions, constraints)
       └── event IR          (event types, triggers, subscriptions)
              │
              ▼
          ADAPTERS (platform core)
       ┌──────┼───────┬───────┐
       ▼      ▼       ▼       ▼
     Cube  OpenFGA   OPA     MCP ...
```

Each IR defines vendor-neutral contracts. Adapters translate to specific implementations. Replacing an infrastructure product means writing a new adapter, not changing packages.

### What Goes in the Package vs. What Goes in Adapters

| Package contains | Adapter produces |
|-----------------|-----------------|
| `measure: revenue` with calculation logic | Cube measure definition, or Snowflake Semantic View, or any future semantic engine model |
| `role: finance_manager` with relationship to entities | OpenFGA type definition, or SpiceDB schema, or any future ReBAC model |
| `policy: approval_threshold` with conditions | OPA Rego policy, or Cedar policy, or any future policy engine rules |
| `tool: verify_insurance` with capability description | MCP tool definition, or any future tool protocol |
| `workflow: order_fulfillment` with steps | Temporal workflow definition, or any future workflow engine |

### MCP Is Slightly Different

MCP is an interoperability standard, not a vendor product. However, not every internal platform tool needs to be fundamentally an MCP tool. Tools can be:
- **Defined** in vendor-neutral tool capability IR
- **Exposed through** MCP for external/agent consumption
- **Invoked internally** through direct platform APIs for performance

The distinction: tools are defined once in the package, and the platform decides how to expose them.

---

## What Is a Domain Package?

A Domain Package is the unit of domain-specific intelligence that the platform loads, validates, and executes. The platform core provides the runtime, governance, and infrastructure. A domain package provides the knowledge, behavior, and business rules for a specific domain.

### Candidate Package Structure

> The exact format is under research. This is a candidate structure.

```
domain-package/
├── manifest.yaml              # Package metadata, version, dependencies, compatibility
├── ontology/                  # Entity types, relationships, actions, rules
│   ├── entities/              #   (vendor-neutral ontology IR)
│   ├── relationships/
│   ├── actions/
│   └── constraints/
├── semantics/                 # Business metric definitions
│   ├── measures/              #   (vendor-neutral semantic IR — NOT Cube models)
│   ├── dimensions/
│   └── calculations/
├── agents/                    # Agent definitions, capabilities, instructions
│   ├── definitions/           #   (vendor-neutral agent IR)
│   └── prompts/
├── tools/                     # Tool capability definitions
│   ├── capabilities/          #   (vendor-neutral tool IR — NOT MCP definitions)
│   └── handlers/              #   (executable extensions → run in Secure Compute)
├── workflows/                 # Business process definitions
│   └── definitions/           #   (vendor-neutral workflow IR — NOT Temporal DSL)
├── policies/                  # Domain-specific governance rules
│   ├── authorization/         #   (vendor-neutral authorization IR — NOT OpenFGA models)
│   └── governance/            #   (vendor-neutral policy IR — NOT OPA Rego)
├── connectors/                # External system integrations
│   ├── ingestion/
│   └── actions/
├── events/                    # Domain event definitions
│   ├── types/                 #   (vendor-neutral event IR)
│   └── subscriptions/
├── evaluations/               # Domain-specific quality evaluation criteria
│   └── test-cases/
├── prompts/                   # Prompt templates with domain context
│   └── templates/
└── migrations/                # Schema migrations for domain-specific data
    └── versions/
```

---

## Declarative-First Package Design

### Principle

The core package should be **declarative**, not imperative. Arbitrary executable code creates supply-chain risk and governance complexity.

**Declarative artifacts** (safe to load directly):
- Ontology definitions
- Semantic model definitions
- Policy rules
- Agent manifests and instructions
- Tool capability schemas
- Workflow definitions
- Event type definitions
- Evaluation criteria
- Prompt templates

**Executable extensions** (must run through Secure Compute):
- Custom tool handler code (Python, TypeScript)
- Custom connector implementations
- Custom evaluation functions
- Custom data transformations

```
Declarative artifact → Platform loads directly → Runtime

Executable extension → Package references it
                           ↓
                    Secure Compute sandbox
                           ↓
                    Isolated execution with declared permissions
```

Executable extensions should be the exception, not the norm. The more the platform's IR can express declaratively, the less custom code is needed.

---

## Package Supply-Chain Security

A domain package is not merely configuration. Packages can contain executable code, access data, invoke external systems, and modify schemas. This makes them a **software supply-chain boundary** requiring enterprise-grade governance.

### Package Security Model

```
Package Author
    → signs package with publisher identity
        → package includes artifact hashes + SBOM
            → platform validates signature + integrity
                → package declares required capabilities
                    → administrator reviews + approves activation
                        → runtime enforces declared permissions
                            → all package operations are audited
```

### Required Package Metadata

```yaml
# manifest.yaml — security section
publisher:
  identity: "org.example.engineering"
  signature: "<cryptographic signature>"

integrity:
  algorithm: "sha256"
  manifest_hash: "<hash of all artifacts>"

sbom:
  format: "cyclonedx"
  dependencies: []

capabilities:
  data:
    read: ["customer", "order"]
    write: ["order_status"]
  tools:
    external: ["shipping_api"]
  secrets:
    required: ["shipping_api_token"]
  network:
    allowed: ["api.shipping.example.com"]
  compute:
    python: true
    sandbox: required

platform:
  min_version: "1.0"
  required_capabilities: ["semantic_engine", "workflow_runtime"]
```

### Package Governance Capabilities

| Capability | Description |
|-----------|-------------|
| Package signing | Cryptographic verification of publisher identity |
| Publisher registry | Trusted publisher identities with verification |
| Artifact hashing | Integrity verification of all package contents |
| SBOM | Software bill of materials for dependency tracking |
| Provenance | Where did this package come from? What built it? |
| Dependency scanning | Automated vulnerability scanning of dependencies |
| Static analysis | Analysis of executable extensions for security patterns |
| Capability manifest | Declared permissions (data, tools, secrets, network, compute) |
| Permission review | Administrative approval before package activation |
| Runtime enforcement | Platform enforces declared permissions at execution time |
| Audit trail | All package operations are logged |
| Rollback | Ability to revert to previous package version |
| Revocation | Ability to immediately disable a compromised package |

### Analogy

Think: **an App Store + package manager + IAM system for intelligence extensions.**

---

## Platform Core vs. Domain Package Boundary

### Platform Core Provides (Domain-Independent)

| Capability | What the core does |
|-----------|-------------------|
| Ontology Runtime | Loads, validates, and serves ontology definitions — does NOT define entities |
| Semantic Engine | Executes metric queries from declarative models — does NOT define metrics |
| Agent Runtime | Executes agents with governance — does NOT contain domain reasoning |
| Tool Gateway | Governs tool access — does NOT implement domain tools |
| Workflow Runtime | Runs durable workflows — does NOT define business processes |
| Authorization Runtime | Enforces relationship-based access — does NOT define domain roles |
| Policy Engine | Evaluates policies — does NOT contain domain rules |
| Context Graph | Stores and queries entity instances — does NOT define entity types |
| Model Gateway | Routes LLM requests — does NOT know what questions are being asked |
| Observability | Traces everything — does NOT interpret domain meaning |
| Provenance | Records evidence chains — does NOT judge domain correctness |
| Secure Compute | Sandboxes execution — does NOT know what code is running |
| Compiler + Adapters | Translates vendor-neutral IR to runtime artifacts — does NOT contain domain definitions |

### Domain Package Provides (Domain-Specific)

| Artifact | What the package provides |
|----------|-------------------------|
| Ontology definitions | Entity types, relationships, valid actions, business constraints |
| Semantic definitions | Measures, dimensions, time grains, calculation logic |
| Agent definitions | Agent capabilities, instructions, tool access, reasoning patterns |
| Tool definitions | Tool capabilities, inputs, outputs, permission requirements |
| Workflow definitions | Business process definitions, approval chains, scheduled operations |
| Authorization definitions | Domain roles, permissions, relationship types |
| Policy definitions | Compliance rules, data classification, action constraints |
| Event definitions | Domain event types, triggers, subscriptions |
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
| AUTHOR | Developer creates or updates package artifacts using SDK/CLI |
| VALIDATE | Platform validates against IR schemas, checks compatibility, runs evaluation suite, scans for vulnerabilities |
| REGISTER | Package is signed, hashed, and registered in the package registry |
| ACTIVATE | Administrator approves; package is loaded into runtime for a specific product/tenant |
| MONITOR | Platform tracks package health — agent quality, tool success rates, error rates |
| VERSION | New package version authored, validated, and activated (with rollback capability) |
| DEPRECATE | Package is marked for removal, dependents are notified, grace period before deactivation |

---

## Multi-Product Isolation

> See `architecture/platform-tenancy-model.md` for the full tenancy hierarchy. Product and tenant are distinct concepts.

Different products using the same platform must not leak:
- **Data** — product and tenant data boundaries are enforced
- **Policies** — Product A's authorization rules do not affect Product B
- **Semantic models** — Product A's metric definitions do not appear in Product B's queries
- **Agents** — Product A's agents cannot be invoked from Product B's context
- **Configuration** — Package settings are scoped to product/tenant
- **Packages** — Package installations are scoped to products; package instances are scoped to tenants

This is enforced through:
- Tenant isolation at the infrastructure layer (RLS, namespace separation)
- Package scoping at the control plane (installed per product, instantiated per tenant)
- Authorization boundaries at the gateway (relationship-based access scopes visibility)

---

## Architecture Validation Test

**Build at least four deliberately different synthetic domains during the architecture-spike phase.**

| Domain | Architectural stress area |
|--------|--------------------------|
| **A. Regulated transactional** (appointments, payments, approvals) | Entity CRUD, governance, approval workflows, compliance policies |
| **B. Real-time telemetry** (sensors, events, anomalies) | High-volume event streams, pattern detection, alerting |
| **C. Knowledge-heavy** (documents, evidence, reasoning, retrieval) | Document ingestion, semantic search, multi-source retrieval, provenance |
| **D. ML prediction** (datasets, features, custom models, inference) | Model lifecycle, feature engineering, prediction serving, evaluation |

If all four can be modeled as domain packages without changing `/core`, the abstraction is strong. If core code starts filling with domain conditionals, the boundary is wrong.

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
- References to specific infrastructure products (Cube, OpenFGA, OPA, Temporal) in package definitions

**Test:** Search `/core` for domain-specific terms. If any are found outside test fixtures, it is an architecture violation.

---

## Relationship to Domain Definition IR

The Domain Package contains artifacts expressed in vendor-neutral intermediate representations. The platform compiles these through adapters to produce runtime artifacts for the selected infrastructure.

```
Package artifact (vendor-neutral IR)
    → Domain Definition Compiler
        → Adapter: Semantic Engine (e.g., Cube)
        → Adapter: Authorization (e.g., OpenFGA)
        → Adapter: Policy Engine (e.g., OPA)
        → Adapter: Workflow Runtime (e.g., Temporal)
        → Adapter: Tool Protocol (e.g., MCP)
        → Adapter: Database Schema
        → Adapter: Graph Schema
        → Adapter: SDK Types
        → Adapter: Validation Rules
        → Adapter: Agent Context
```

The compiler and adapters are platform core. The IR definitions are domain package content. Replacing an infrastructure product means writing a new adapter — not changing packages.

See `architecture/ontology-architecture.md` for the Domain Definition IR design.

---

## Research Questions

### Package Format
1. What is the manifest schema? YAML, JSON, TOML?
2. How are package dependencies declared and resolved?
3. How are package versions managed? SemVer? Content-addressed?
4. How are breaking changes detected between package versions?

### Vendor Neutrality
5. What is the minimum viable set of vendor-neutral IRs? (ontology, semantic, authorization, policy, tool, workflow, event, agent)
6. Can all current architecture candidates (Cube, OpenFGA, OPA, Temporal, MCP) be fully expressed through vendor-neutral IRs?
7. What is the adapter interface contract? How are adapters tested for correctness?
8. How much expressiveness is lost in the abstraction? Are there capabilities of specific products that cannot be represented in the IR?

### Package Security
9. What signing infrastructure is needed? (GPG, Sigstore, custom?)
10. How are publisher identities managed and verified?
11. How is the capability manifest enforced at runtime?
12. How are executable extensions sandboxed? (WASM, containers, microVMs?)
13. How are package vulnerabilities reported and patched?

### Package Loading
14. How does the platform discover and load packages at runtime?
15. Can packages be hot-reloaded without platform restart?
16. How are package conflicts resolved when multiple packages define overlapping concepts?

### Package Governance
17. Who can author, publish, and activate packages?
18. How are packages reviewed before activation?
19. How is package quality tracked over time?

### Multi-Product
20. Can one tenant run multiple domain packages simultaneously?
21. How do packages compose? Can a "finance" package extend a "core-business" package?
22. How are cross-package relationships handled?

### Developer Experience
23. What does the local development workflow look like for package authors?
24. How are packages tested before deployment?
25. What SDK or CLI tooling is needed?

---

## References

- `AGENTS.md` rules 6, 7, 8 — Product agnosticism, validation questions, domain/infrastructure separation
- `architecture/reference-architecture.md` — Three-layer conceptual model
- `architecture/ontology-architecture.md` — Domain Definition IR design
- `architecture/platform-tenancy-model.md` — Product vs. tenant hierarchy
- `architecture/platform-api-architecture.md` — Stable Platform API contracts
- `architecture/secure-compute-architecture.md` — Sandbox for executable extensions
- `architecture/spikes/011-domain-package-validation.md` — Four-domain validation test
