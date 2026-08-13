# Spike 008: Domain Definition IR Compiler

> STATUS: NOT STARTED
> Last updated: 2026-08-14
> References: `architecture/ontology-architecture.md`, `architecture/domain-package-architecture.md`, `AGENTS.md` rules 6-7

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

## Prototype Plan

### Phase 1: IR Schema Design

1. **Define JSON Schema for each sub-IR**
   - Each sub-IR has its own schema
   - Cross-references between sub-IRs use stable identifiers (e.g., Action IR references Ontology IR entities)
   - Schema is versioned (`ir_schema_version`)

2. **Define the composed Domain Definition IR envelope**
   ```yaml
   domain_definition:
     version: "1.0"
     ir_schema_version: "0.1.0"
     domain: "healthcare-clinic"
     sub_irs:
       ontology: { ... }
       semantic: { ... }
       authorization: { ... }
       policy: { ... }
       actions: { ... }
       events: { ... }
       workflows: { ... }
       agent_capabilities: { ... }
   ```

3. **Validation rules**
   - Internal consistency: all entity references resolve
   - Cross-IR consistency: action targets exist in ontology, authorization roles exist
   - Completeness: every entity has at least authorization rules
   - No vendor-specific references: IR uses abstract targets, not product names

### Phase 2: Author Healthcare Domain (Domain A from Spike 011)

Write the complete Healthcare Clinic Scheduling domain in YAML:

**Ontology IR:**
```yaml
entities:
  Patient:
    properties:
      name: { type: string, required: true }
      date_of_birth: { type: date, required: true }
      insurance_id: { type: string }
      data_classification: { type: enum, values: [phi, pii, general] }
    relationships:
      appointments: { type: has_many, target: Appointment }
      primary_practitioner: { type: belongs_to, target: Practitioner }

  Practitioner:
    properties:
      name: { type: string, required: true }
      specialty: { type: string }
      license_number: { type: string, required: true }
    relationships:
      patients: { type: has_many, target: Patient, through: Appointment }
      clinics: { type: many_to_many, target: Clinic }

  Appointment:
    properties:
      scheduled_at: { type: timestamp, required: true }
      duration_minutes: { type: integer, default: 30 }
      status: { type: enum, values: [scheduled, confirmed, cancelled, completed, no_show] }
      reason: { type: string }
    relationships:
      patient: { type: belongs_to, target: Patient }
      practitioner: { type: belongs_to, target: Practitioner }
      clinic: { type: belongs_to, target: Clinic }
```

**Authorization IR:**
```yaml
roles:
  practitioner_role:
    can_view: [own_patients, own_appointments]
    can_create: [appointment_for_own_patients]
    can_update: [own_appointments]
  admin_role:
    can_view: [all_patients, all_appointments, all_practitioners]
    can_create: [any_appointment, practitioner]
    can_update: [any_appointment, clinic]
  patient_role:
    can_view: [own_record, own_appointments]
    can_create: [appointment_request]

relationships:
  practitioner_owns_patients:
    subject: Practitioner
    relation: treats
    object: Patient
    condition: "active appointment exists"
```

**Semantic IR:**
```yaml
measures:
  utilization_rate:
    description: "Percentage of available slots that are booked"
    sql: "COUNT(CASE WHEN status != 'cancelled' THEN 1 END) / COUNT(*)"
    entity: Appointment
  no_show_rate:
    description: "Percentage of confirmed appointments where patient did not show"
    sql: "COUNT(CASE WHEN status = 'no_show' THEN 1 END) / COUNT(CASE WHEN status IN ('completed','no_show') THEN 1 END)"
    entity: Appointment
dimensions:
  practitioner_specialty:
    entity: Practitioner
    property: specialty
  clinic_name:
    entity: Clinic
    property: name
```

(Similar depth for Action, Event, Workflow, Policy, Agent Capability sub-IRs)

### Phase 3: Compiler Implementation

1. **IR Parser** — Load YAML, validate against JSON Schema, produce in-memory IR
2. **Cross-IR Validator** — Verify all cross-references resolve, all entities have authorization rules
3. **Adapter Interface** — Define the contract that compilation targets implement:
   ```
   interface CompilationAdapter {
     name(): string
     accepts(subIR: SubIR): boolean
     compile(ir: DomainDefinitionIR, config: AdapterConfig): CompilationOutput
     validate(output: CompilationOutput): ValidationResult
   }
   ```
4. **Database Schema Adapter** — Compile Ontology IR → SQL DDL (PostgreSQL)
5. **Authorization Adapter** — Compile Authorization IR → OpenFGA model
6. **Validation Suite** — Verify compiled outputs are correct

### Phase 4: Second Domain (Domain B — IoT Monitoring)

Author the Industrial IoT Monitoring domain. This stresses:
- High-volume event patterns (Event IR under pressure)
- Time-series metrics (Semantic IR for sensor data)
- Alert workflows (Workflow IR for anomaly response)
- Different entity shapes (Sensor, Device, Facility vs Patient, Practitioner, Clinic)

**Key test:** Can the same compiler and adapters produce correct output for both domains without any domain-specific code paths?

### Phase 5: Core Code Audit

1. Grep the compiler source for domain-specific terms (healthcare, patient, sensor, device)
2. Any domain-specific logic in the compiler or adapters = architectural failure
3. Count lines of domain-specific code: target = 0

---

## Test Methodology

### IR Expressiveness
- Can both domains (Healthcare + IoT) be expressed without IR extensions?
- Are there concepts that cannot be expressed? Document gaps.
- Do cross-IR references work correctly for both domains?

### Compilation Correctness
- Do generated database schemas match expected DDL for both domains?
- Does the OpenFGA model enforce expected authorization for both domains?
- Are the outputs correct and independently verifiable?

### Vendor Neutrality
- Does the IR contain any product-specific references?
- Could a different database adapter produce equivalent output for a different database?
- Could a different authorization adapter produce equivalent output for a different auth system?

### Adapter Independence
- Does adding Domain B require any changes to adapters written for Domain A?
- Are adapters purely mechanical transformations with no domain knowledge?

---

## Success Criteria

1. Both Healthcare and IoT domains fully expressed in Domain Definition IR
2. IR validates against JSON Schema for all sub-IRs
3. Cross-IR references resolve correctly for both domains
4. Database schema adapter produces correct PostgreSQL DDL for both
5. Authorization adapter produces correct OpenFGA model for both
6. Zero domain-specific code in compiler or adapters
7. IR contains zero product-specific references

## Abort Criteria

- A sub-IR cannot express a fundamental domain concept
- Cross-IR references create circular dependencies that cannot be resolved
- The compiler requires domain-specific conditionals
- An adapter requires domain-specific code paths
- The IR becomes so complex that authoring it is impractical

---

## Results

PENDING — spike not yet started.

## Dependencies

- Architecture documents: `ontology-architecture.md`, `domain-package-architecture.md`
- Node.js/TypeScript runtime for compiler implementation
- JSON Schema tooling for IR validation

## Notes

This spike is the acid test for the Intelligence-as-Code thesis. If the Domain Definition IR and compiler work for two fundamentally different domains, spike 011 extends the test to four domains. If this spike fails, the platform boundary needs redesign before any other work proceeds.
