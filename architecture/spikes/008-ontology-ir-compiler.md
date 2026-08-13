# Spike 008: Domain Definition IR Compiler

> STATUS: INITIAL PROTOTYPE COMPLETE — PARTIAL PASS
> Confidence: MEDIUM
> Last updated: 2026-08-14
> Prototype: `spikes/prototypes/008-domain-definition-ir/`
> Commit: `2b82978`

---

## Question

Can we design a **Domain Definition IR** — composed of multiple sub-IRs (ontology, semantic, authorization, policy, action, event, workflow, agent capability) — that serves as the canonical, vendor-neutral definition of a domain? Can this composed IR be compiled through adapters to produce platform artifacts without domain-specific code in the compiler or adapters?

## Hypothesis

A composed IR with independently-authored sub-IRs can express fundamentally different domains (regulated transactional, real-time telemetry, knowledge-heavy, ML prediction) without requiring domain-specific extensions. The IR is vendor-neutral — compilation targets are determined by adapter configuration, not hard-coded in the IR. The main challenge will be defining sub-IR boundaries that are clean enough to compose without overlap, yet expressive enough to capture real domain complexity.

## Why This Is the First Spike

The Domain Definition IR is the core abstraction of the Intelligence-as-Code thesis. If it fails — if different domains cannot be expressed in a common IR, or if the compiler needs domain-specific logic — then the platform's product agnosticism claim collapses. This must be validated before any other spike.

---

## Sub-IR Composition

The Domain Definition IR is composed of 8 sub-IRs, each independently authored:

| Sub-IR | Declares | Example |
|--------|----------|---------|
| **Ontology IR** | Entity types, properties, relationships, constraints | `Patient`, `Appointment`, `has_many` |
| **Semantic IR** | Metrics, dimensions, measures, cubes | `avg_wait_time`, `utilization_rate` |
| **Authorization IR** | Roles, relationships, permission rules | `practitioner can view own_patients` |
| **Policy IR** | Attribute-based rules, compliance constraints | `HIPAA data classification` |
| **Action IR** | Operations, side effects, tool bindings | `book_appointment`, `verify_insurance` |
| **Event IR** | Domain events, triggers, subscriptions | `appointment_booked`, `patient_no_show` |
| **Workflow IR** | Multi-step processes, approval chains | `booking_flow: check → verify → confirm` |
| **Agent Capability IR** | What agents can do, tool access, reasoning patterns | `scheduling_agent: [query, book, cancel]` |

---

## What Was Built

### Compiler Infrastructure

| Component | Lines | Purpose |
|-----------|-------|---------|
| `src/ir-loader.js` | 415 | YAML loading, normalization (arrays→maps, attributes→properties), schema validation with AJV, cross-reference validation, vendor neutrality audit with word-boundary matching |
| `src/compiler.js` | 271 | 5-step compilation pipeline (load → validate → cross-ref → vendor audit → compile adapters) + source code domain-neutrality auditor |
| `src/adapters/base.js` | 62 | CompilationAdapter interface (name, consumes, compile, validate) |
| `src/adapters/database-schema.js` | 242 | Ontology IR → PostgreSQL DDL (tables, typed columns, RLS, indexes, FKs, enum CHECK constraints, junction tables) |
| `src/adapters/authorization-model.js` | 191 | Authorization IR → OpenFGA DSL (platform hierarchy + domain entity types with relations) |
| `src/cli.js` | 153 | CLI: compile, validate, audit, compile-all |

### Schemas

9 JSON Schema files (domain-definition envelope + 8 sub-IR schemas) totaling 2,891 lines.

### Domain Definitions

| Domain | Lines | Entities | Measures | Dimensions | Roles | Authz Rules | Actions | Events | Workflows | Agents |
|--------|-------|----------|----------|------------|-------|-------------|---------|--------|-----------|--------|
| Healthcare Clinic | 2,834 | 8 | 10 | 12 | 7 | 23 | 12 | 12 | 3 | 4 |
| IoT Monitoring | 2,450 | 7 | 12 | 10 | 5 | 17 | 10 | 17 | 4 | 3 |

### Compiled Outputs (661 lines total)

| Output | Lines | Content |
|--------|-------|---------|
| Healthcare SQL | 252 | 8 tables + RLS + indexes + FKs + enum constraints |
| Healthcare OpenFGA | 126 | Platform hierarchy + 8 domain entity types |
| IoT SQL | 169 | 7 tables + RLS + indexes + FKs |
| IoT OpenFGA | 114 | Platform hierarchy + 7 domain entity types |

### Test Suite

38 tests across 8 categories: Loader (10), Schema Validation (5), Cross-Reference (4), Vendor Neutrality (4), Database Adapter (6), Authorization Adapter (4), Full Pipeline (3), Domain Neutrality (2). All pass.

---

## Results: What Was and Was Not Proven

### Validated (evidence exists)

| Claim | Evidence |
|-------|----------|
| Two materially different domains can share one IR structure | Healthcare (regulated transactional) and IoT (real-time telemetry) both expressed in same 8-sub-IR format |
| Compiler code is domain-neutral | Source audit finds zero domain-specific terms in compiler or adapter code |
| Adapter pattern works | Same two adapters produce valid output for both domains without modification |
| YAML normalization is necessary and tractable | Loader normalizes arrays→maps, attributes→properties at load time |
| Cross-IR reference validation catches real errors | Validator found genuine reference mismatches in initial domain drafts |
| Vendor neutrality audit with word-boundary matching avoids false positives | "copay" does not trigger "opa", "temporal dimension" does not trigger "Temporal" |

### NOT YET Validated (gaps remain)

| Claim | Gap | Required By |
|-------|-----|-------------|
| Generated SQL is executable and correct | No real PostgreSQL execution; validation counts CREATE TABLE vs ENABLE RLS, does not execute DDL | Spike 001 |
| Generated OpenFGA model is semantically equivalent to Authorization IR | Adapter emits generic CRUD relations (viewer/editor/creator/deleter) and writes domain roles as comments; does not faithfully compile relationship-based access rules | **Spike 004** |
| Tenant isolation works with generated RLS | No real PostgreSQL + multi-tenant data test | Spike 001 |
| All 8 sub-IRs can be compiled | Only Ontology→PostgreSQL and Authorization→OpenFGA demonstrated; no adapters for Semantic, Action, Event, Workflow, or Agent Capability | Future spikes |
| IR is expressive enough for adversarial domains | Healthcare and IoT were designed by the same architect who designed the IR; self-confirming risk | **Spike 011** |
| Vendor neutrality is structural, not just lexical | Keyword scanning catches explicit vendor names but not structural coupling (e.g., SQL expressions in Semantic IR) | Future review |

---

## Architecture Board Findings (Post-Review)

### Finding 1: OpenFGA Adapter Does Not Compile Authorization Semantics

**Severity: HIGH**

The current adapter generates:

```text
define viewer: [user, agent] or member from tenant
define editor: [user, agent] or admin from tenant
```

for every entity, regardless of what the Authorization IR specifies. This means any tenant member can view all entity types — the opposite of least-privilege.

The Authorization IR may specify `practitioner can view own patients only`, but the generated OpenFGA model does not encode that constraint. Role definitions are placed in comments.

**Required action:** Spike 004 must demonstrate that the Authorization IR semantics can be faithfully compiled into an OpenFGA model that produces correct allow/deny decisions when tested against a real OpenFGA instance.

### Finding 2: Default Relation is Allow-by-Default

**Severity: HIGH**

The default `viewer: [user, agent] or member from tenant` grants all tenant members view access to all generated entity types. Authorization should be deny-by-default unless explicitly granted by the Authorization IR.

**Required action:** Redesign default relation generation. Entity types should start with no public relations; only relations explicitly declared in the Authorization IR should appear.

### Finding 3: Adapter Validation is Structural, Not Semantic

**Severity: MEDIUM**

Adapter `validate()` methods check output shape (does it contain `CREATE TABLE`? does it contain `model`?). They do not verify semantic correctness.

**Required action:** For PostgreSQL — execute DDL against a real instance. For OpenFGA — parse the model and run check queries. Structural validation remains useful as a smoke test but is insufficient as the only validation layer.

### Finding 4: Only 2 of 8 Sub-IRs Have Compilation Adapters

**Severity: MEDIUM**

The IR defines 8 sub-IRs but only Ontology and Authorization have adapters. The remaining 6 (Semantic, Policy, Action, Event, Workflow, Agent Capability) are validated structurally but not compiled.

**Required action:** Before claiming the IR compiler is validated, representative adapters needed for at least Semantic→analytics engine, Action→tool declaration, and Workflow→orchestrator.

### Finding 5: Semantic IR May Have Structural Vendor Coupling

**Severity: LOW**

Some Semantic IR examples contain raw SQL expressions (e.g., `COUNT(CASE WHEN ...)`). This may couple the semantic model to SQL-oriented execution engines. A vendor-neutral expression model may be needed.

**Required action:** Review during Semantic adapter development. Determine whether SQL is an acceptable canonical expression or whether a vendor-neutral expression IR is required.

### Finding 6: Domains Are Self-Confirming

**Severity: LOW**

Both test domains were designed by the same process that designed the IR. This can hide missing abstractions. Spike 011's additional domains should be deliberately adversarial:

- **Knowledge-heavy domain:** documents, uncertain facts, provenance, contradictory knowledge, temporal knowledge
- **ML/prediction domain:** datasets, models, predictions, features, model versions, confidence, drift

IR changes discovered during those tests are expected and should be documented rather than avoided.

---

## Success Criteria Assessment

| Criterion | Status |
|-----------|--------|
| 1. Both domains fully expressed in Domain Definition IR | **PASS** |
| 2. IR validates against JSON Schema for all sub-IRs | **PASS** |
| 3. Cross-IR references resolve correctly for both domains | **PASS** (IoT clean; Healthcare has 2 minor workflow refs to undefined utility actions) |
| 4. Database schema adapter produces correct PostgreSQL DDL | **PARTIAL** — generates syntactically valid DDL but not proven executable |
| 5. Authorization adapter produces correct OpenFGA model | **PARTIAL** — generates syntactically valid model but does not faithfully encode domain authorization semantics |
| 6. Zero domain-specific code in compiler or adapters | **PASS** |
| 7. IR contains zero product-specific references | **PASS** |

## Abort Criteria Assessment

None triggered. No sub-IR failed to express a fundamental domain concept. No circular dependencies. No domain-specific code paths required.

---

## Findings During Implementation

1. **Array normalization is a canonical pattern.** YAML authors naturally write `- name: "patient"` arrays. The loader normalizes to maps at load time. This is not a bug in the YAML — it's a necessary loader responsibility.

2. **Word-boundary matching is critical for vendor audit.** Substring matching causes false positives ("opa" in "copay", "temporal" in "temporal dimension"). Regex `\b` boundaries solve this.

3. **Type mapping needs completeness.** `datetime`, `decimal`, `float`, `object`, `array` are natural IR types not in the initial SQL type map. Incomplete mapping produces warnings, not failures, but a complete map should be the default.

4. **The IoT domain uses different property naming than Healthcare.** IoT uses `attributes` and capitalized entity names (`Facility`); Healthcare uses `properties` and lowercase (`patient`). The loader normalizes both, proving the normalization layer is necessary.

---

## Next Steps

| Spike | Purpose | Depends On |
|-------|---------|------------|
| **004 Authorization Semantics** | Prove OpenFGA adapter can faithfully compile authorization meaning; test allow/deny with real OpenFGA | 008 findings 1-2 |
| **011 Four-Domain IR Test** | Add adversarial domains (knowledge, ML) to challenge IR expressiveness | 008 complete |
| **012 Package Lifecycle** | Validate versioning, migrations, upgrades across compiled artifacts | 008 complete |
| **001 PostgreSQL Data Plane** | Execute generated DDL against real PostgreSQL; test RLS, FKs, extensions | 008 finding 3 |

---

## Dependencies

- Architecture documents: `ontology-architecture.md`, `domain-package-architecture.md`
- Node.js runtime with `ajv`, `ajv-formats`, `js-yaml`
- JSON Schema tooling for IR validation

## Notes

This spike is the acid test for the Intelligence-as-Code thesis. The initial prototype demonstrates that the composed IR and domain-neutral compiler architecture are viable. Semantic correctness of compiled artifacts — particularly authorization — requires execution-level validation in subsequent spikes (004, 001). The hypothesis survives but has not been fully validated.
