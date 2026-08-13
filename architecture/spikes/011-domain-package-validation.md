# Spike 011: Domain Package Validation — Four-Domain Stress Test

> STATUS: NOT STARTED
> Last updated: 2026-08-13
> References: `architecture/domain-package-architecture.md`, `AGENTS.md` rules 6-7

---

## Question

Can four architecturally distinct domains be modeled as domain packages without modifying platform core code? Does the Domain Definition IR and adapter pattern hold across fundamentally different architectural stress areas?

## Hypothesis

The platform's extension mechanisms (vendor-neutral IRs, adapters, domain packages) are sufficient to model any business domain. If all four synthetic domains can be fully operational without changes to `/core`, the abstraction boundary is strong.

## Why Four Domains, Not Two

Two domains that are both entity-CRUD-workflow-metrics validate the same architectural style twice. A truly product-agnostic platform must handle fundamentally different domain shapes:

| Domain | Architectural stress area |
|--------|--------------------------|
| **A. Regulated transactional** | Entity CRUD, governance, approval workflows, compliance policies |
| **B. Real-time telemetry** | High-volume event streams, pattern detection, anomaly alerting |
| **C. Knowledge-heavy** | Document ingestion, semantic search, multi-source retrieval, reasoning |
| **D. ML prediction** | Datasets, features, custom models, inference serving, evaluation |

---

## Synthetic Domains

### Domain A: Healthcare Clinic Scheduling (Regulated Transactional)

| Concept | Examples |
|---------|---------|
| Entities | Patient, Practitioner, Appointment, Clinic, Insurance, Referral |
| Relationships | Patient → booked → Appointment, Practitioner → available_at → Clinic |
| Actions | book_appointment, cancel_appointment, verify_insurance, send_reminder |
| Metrics | utilization_rate, no_show_rate, avg_wait_time, revenue_per_practitioner |
| Policies | HIPAA data classification, practitioner can only see own patients, admin can see all |
| Workflows | Appointment booking (check availability → verify insurance → confirm → remind) |
| Connectors | EHR system, insurance verification API, SMS gateway |
| **Stress focus** | Compliance, approval chains, audit trail, data classification |

### Domain B: Industrial IoT Monitoring (Real-Time Telemetry)

| Concept | Examples |
|---------|---------|
| Entities | Sensor, Device, Facility, Alert, MaintenanceOrder |
| Relationships | Sensor → installed_on → Device, Device → located_at → Facility |
| Actions | acknowledge_alert, schedule_maintenance, calibrate_sensor |
| Metrics | mean_time_between_failures, sensor_uptime, anomaly_rate, energy_consumption |
| Events | temperature_threshold_exceeded, vibration_anomaly_detected, device_offline |
| Policies | critical alerts must be acknowledged within 15 minutes, maintenance must be approved |
| Workflows | Anomaly response (detect → alert → acknowledge → investigate → resolve) |
| Connectors | MQTT broker, SCADA system, maintenance management system |
| **Stress focus** | High-volume event ingestion, pattern detection, real-time alerting, time-series |

### Domain C: Legal Research & Evidence Management (Knowledge-Heavy)

| Concept | Examples |
|---------|---------|
| Entities | Case, Document, Evidence, Precedent, Party, Filing |
| Relationships | Evidence → supports → Case, Filing → references → Precedent |
| Actions | file_motion, request_discovery, submit_evidence, annotate_document |
| Metrics | cases_per_attorney, avg_resolution_time, discovery_completeness |
| Knowledge | Legal documents, court rulings, regulatory texts, case files |
| Policies | privilege classification, redaction rules, retention requirements |
| Workflows | Case preparation (gather evidence → review → analyze → draft → file) |
| Connectors | Court filing system, document management, legal database |
| **Stress focus** | Document ingestion, semantic retrieval, multi-source reasoning, provenance |

### Domain D: Credit Risk Scoring (ML Prediction)

| Concept | Examples |
|---------|---------|
| Entities | Application, Applicant, CreditModel, FeatureSet, Prediction, Decision |
| Relationships | Prediction → generated_by → CreditModel, Application → submitted_by → Applicant |
| Actions | score_application, approve_credit, request_review, retrain_model |
| Metrics | model_accuracy, false_positive_rate, approval_rate, avg_processing_time |
| Models | Custom credit scoring model, fraud detection classifier |
| Policies | fair lending compliance, model explainability requirements, bias monitoring |
| Workflows | Credit decision (receive → score → review → decide → notify → audit) |
| Connectors | Credit bureau API, banking core system, regulatory reporting |
| **Stress focus** | Custom model lifecycle, feature engineering, prediction serving, model governance |

---

## Prototype Plan

### Phase 1: Package Structure Validation
- Define manifest schema and vendor-neutral IR schemas
- Create all four domain packages with full artifact sets
- Verify all four pass schema validation
- Verify vendor-neutral IRs can express all four domains without product-specific references

### Phase 2: IR Compilation
- Compile Domain A through all relevant adapters (DB, auth, policy, semantic, workflow, tools)
- Compile Domain B — stress test event IR and high-volume patterns
- Compile Domain C — stress test knowledge ingestion and retrieval patterns
- Compile Domain D — stress test ML model lifecycle and prediction patterns
- Verify no adapter changes needed that are domain-specific

### Phase 3: Runtime Loading
- Load all four domain packages into platform runtime (separate tenants/products)
- Verify all four operate independently
- Verify agent runtime handles all four domains without domain-specific code paths

### Phase 4: Cross-Domain Isolation
- Verify no cross-domain data leakage
- Verify no cross-domain policy leakage
- Verify no cross-domain agent visibility
- Verify no cross-domain semantic model contamination
- Verify no cross-domain event subscription leakage

### Phase 5: Core Code Audit
- Search `/core` for any domain-specific terms introduced during the prototype
- Catalog any platform changes that were required
- Classify each change: legitimate platform enhancement vs. domain leakage
- Verify adapters needed no domain-specific logic

## Success Criteria

1. All four domains are fully operational using only package artifacts — zero domain-specific code in `/core`
2. Domain Definition IR (all sub-IRs) handles all four domains without domain-specific extensions
3. Adapters handle all four domains through vendor-neutral contracts
4. Agent runtime loads and executes all four domain packages independently
5. Authorization model supports all four domains through package-defined relationships
6. Semantic engine serves all four domains through package-defined models
7. Event system handles Domain B's high-volume patterns without domain-specific optimizations in core
8. Knowledge system handles Domain C's document-heavy patterns without domain-specific retrieval in core
9. Model lifecycle handles Domain D's ML patterns without domain-specific model management in core
10. No cross-domain data, policy, agent, or configuration leakage
11. `/core` grep for domain terms returns zero results outside test fixtures

## Abort Criteria

- Core platform requires domain-specific conditionals (if domain == "healthcare"...)
- Any sub-IR cannot represent a domain's concepts
- Adapters require domain-specific code paths
- Agent runtime needs domain-specific loading logic
- Event, knowledge, or ML patterns require core modifications that are fundamentally domain-specific
- More than 5 platform changes are needed that are clearly domain accommodations rather than genuine platform improvements

## Test Methodology

**Quantitative:**
- Lines of code in `/core` changed: target = 0 for domain-specific changes
- Package artifact coverage: all IR types used by all four domains
- Adapter coverage: all adapters exercised by at least two domains

**Qualitative:**
- Code review of any `/core` changes by someone unfamiliar with all four domains
- If the reviewer can identify which domain motivated a core change, it is domain leakage
- Each domain should feel like a "first-class citizen" — no domain should require workarounds

## Results

PENDING — spike not yet started.

## Dependencies

- Spike 008 (Domain Definition IR Compiler) should be completed or at least in progress
- Basic platform runtime must be operational enough to load packages
- Adapter framework must support at least database, authorization, and semantic targets

## Notes

This spike is the acid test for the product agnosticism constraint. It should be run before significant product development begins. If it fails, the platform boundary needs redesign before domain-specific work proceeds.

The four domains are deliberately chosen to stress different architectural capabilities. If the platform handles all four, it has strong evidence of genuine domain independence.
