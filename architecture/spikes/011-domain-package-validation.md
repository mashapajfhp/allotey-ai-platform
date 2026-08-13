# Spike 011: Domain Package Validation — Two-Domain Test

> STATUS: NOT STARTED
> Last updated: 2026-08-13
> References: `architecture/domain-package-architecture.md`, `AGENTS.md` rules 6-7

---

## Question

Can two deliberately unrelated domains be modeled as domain packages without modifying platform core code? Is the platform boundary correctly drawn?

## Hypothesis

The platform's extension mechanisms (ontology definitions, semantic models, agents, tools, workflows, policies, connectors) are sufficient to model any business domain. If both synthetic domains can be fully operational without changes to `/core`, the abstraction boundary is healthy.

## Synthetic Domains

### Domain A: Healthcare Clinic Scheduling

| Concept | Examples |
|---------|---------|
| Entities | Patient, Practitioner, Appointment, Clinic, Insurance, Referral |
| Relationships | Patient → booked → Appointment, Practitioner → available_at → Clinic |
| Actions | book_appointment, cancel_appointment, verify_insurance, send_reminder |
| Metrics | utilization_rate, no_show_rate, avg_wait_time, revenue_per_practitioner |
| Policies | HIPAA data classification, practitioner can only see own patients, admin can see all |
| Workflows | Appointment booking (check availability → verify insurance → confirm → remind) |
| Connectors | EHR system, insurance verification API, SMS gateway |

### Domain B: Supply Chain Logistics

| Concept | Examples |
|---------|---------|
| Entities | Warehouse, Shipment, Route, Carrier, Product, CustomsDeclaration |
| Relationships | Shipment → assigned_to → Carrier, Product → stored_in → Warehouse |
| Actions | create_shipment, assign_carrier, update_tracking, file_customs |
| Metrics | on_time_delivery_rate, warehouse_utilization, transit_time_avg, cost_per_unit |
| Policies | hazmat handling rules, carrier certification requirements, customs compliance |
| Workflows | Order fulfillment (pick → pack → ship → track → deliver → confirm) |
| Connectors | Carrier API, customs filing system, warehouse management system |

## Prototype Plan

### Phase 1: Package Structure Validation
- Define manifest schema
- Create Domain A package with all artifact types (ontology, semantics, agents, tools, workflows, policies)
- Create Domain B package with all artifact types
- Verify both packages pass schema validation

### Phase 2: Ontology Compilation
- Compile Domain A ontology through IR compiler → database schema, MCP tools, authorization model
- Compile Domain B ontology through IR compiler → same targets
- Verify no ontology compiler changes needed between domains

### Phase 3: Runtime Loading
- Load Domain A package into platform runtime
- Load Domain B package into platform runtime (separate tenant)
- Verify both operate independently

### Phase 4: Cross-Domain Isolation
- Verify Domain A agents cannot access Domain B data
- Verify Domain A semantic models do not appear in Domain B queries
- Verify Domain A tools are not discoverable from Domain B context
- Verify Domain A policies do not affect Domain B authorization

### Phase 5: Core Code Audit
- Search `/core` for any domain-specific terms introduced during the prototype
- Catalog any platform changes that were required
- Classify each change: legitimate platform enhancement vs. domain leakage

## Success Criteria

1. Both domains are fully operational using only package artifacts — zero domain-specific code in `/core`
2. Ontology compiler handles both domains without domain-specific logic
3. Agent runtime loads and executes both domain packages independently
4. Authorization model supports both domains through package-defined relationships
5. Semantic layer serves both domains through package-defined models
6. No cross-domain data, policy, or configuration leakage
7. `/core` grep for domain terms (patient, shipment, clinic, warehouse, etc.) returns zero results outside test fixtures

## Abort Criteria

- Core platform requires domain-specific conditionals (if domain == "healthcare"...)
- Ontology compiler cannot represent one domain's concepts
- Authorization model requires domain-specific code paths
- Agent runtime needs domain-specific loading logic
- More than 3 platform changes are needed that are clearly domain accommodations rather than genuine platform improvements

## Test Methodology

**Quantitative:**
- Lines of code in `/core` changed: target = 0 for domain-specific changes
- Package artifact coverage: all 10 artifact types (ontology, semantics, agents, tools, workflows, policies, connectors, evaluations, prompts, migrations) used by both domains

**Qualitative:**
- Code review of any `/core` changes by someone unfamiliar with either domain
- If the reviewer can identify which domain motivated a core change, it is domain leakage

## Results

PENDING — spike not yet started.

## Dependencies

- Spike 008 (Ontology IR Compiler) should be completed or at least in progress before this spike starts
- Basic platform runtime must be operational enough to load packages

## Notes

This spike is the acid test for the product agnosticism constraint. It should be run before significant product development begins. If it fails, the platform boundary needs redesign before domain-specific work proceeds.
