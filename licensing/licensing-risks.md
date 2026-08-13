# Licensing Risks

> STATUS: DEEP REVIEW COMPLETE — methodology corrected 2026-08-13
> Last updated: 2026-08-13

## Licensing Analysis Methodology

> **This document provides architecture guidance, not legal advice.** License interpretation depends on specific deployment models, modification scope, derivative work boundaries, and jurisdiction. Where a license has nuanced implications, this document flags `LEGAL REVIEW REQUIRED` rather than stating definitive legal conclusions. Final licensing decisions for production adoption should involve counsel.

> **For each project, the following should be recorded before adoption:**
> - License file commit SHA
> - License version
> - Directories with different licenses (some repos have mixed licensing)
> - Dependencies with materially different licenses
> - SaaS/hosting implications
> - Modification implications
> - Distribution implications
> - Legal review requirement (yes/no)

---

## High-Risk Licenses in Scope

### 1. AGPL-3.0 — xpert-ai/xpert

**License observation:** AGPL-3.0 extends GPL copyleft to network use. If modified AGPL code is served over a network, the AGPL requires making the complete corresponding source code available. The scope of "combined work" and what constitutes a "modification" under AGPL are nuanced legal questions that depend on how the code is integrated.

**Architecture guidance:** DO NOT ADOPT WITHOUT LEGAL APPROVAL. Study only. Do not use Xpert code as a dependency, copy code from it, or modify it. Implement similar concepts independently using original code.

### 2. Custom License — langgenius/dify

**License observation:** Dify uses a custom license with restrictions on commercial use that differ from standard OSS licenses. Custom licenses lack the legal precedent and community understanding of standard licenses. Terms may change between versions.

**Architecture guidance:** DO NOT ADOPT WITHOUT LEGAL APPROVAL. Read the actual license text before any use. Do not copy code. Do not use as a dependency without explicit legal review.

### 3. MPL-2.0 — typedb/typedb

**License observation:** MPL-2.0 is a file-level copyleft license. Modified MPL files must remain MPL-2.0. New files can use any license. Linking/dependency use (without modifying MPL source files) does not trigger copyleft obligations.

**Architecture guidance:** Manageable with discipline. If using TypeDB as a dependency (without modifying its source files), no copyleft concern. If modifying TypeDB source files, those files must stay MPL-2.0.

**Note:** Agno was previously MPL-2.0 but changed to Apache 2.0 in January 2025 when Phidata rebranded to Agno. Agno is now fully permissive.

### 4. Dual-Licensed Projects

**License observation:** Core is OSS but enterprise features may be under separate commercial terms. If the platform depends on enterprise features, it creates a commercial dependency.

**Projects to watch:**
- LiteLLM (MIT core, enterprise proxy features unclear)
- Langfuse (MIT core, EE features separately licensed)
- Cube (Apache 2.0 core, Cube Cloud features separate)
- ClickHouse (Apache 2.0 core, ClickHouse Cloud features separate)

**Architecture guidance:** Identify which features are used. Ensure core OSS features are sufficient. Budget for enterprise licenses if needed. Document the feature boundary between OSS and EE for each project.

### 5. SSPL — inngest/inngest

**License observation:** SSPL (Server Side Public License) is more restrictive than AGPL. The SSPL requires that if you offer the software as a service, you must open-source the entire "Service Source Code" — all programs used to make the service available. The exact scope of this obligation is debated and has limited legal precedent.

**Architecture guidance:** DO NOT ADOPT WITHOUT LEGAL APPROVAL. The SSPL's service-use obligation creates significant risk for any SaaS deployment model. Temporal (MIT) is the recommended alternative. EXCLUDED from adoption.

### 6. BSL 1.1 — restatedev/restate

**License observation:** Business Source License is NOT an open-source license by OSI definition. It restricts commercial use until a "Change Date" (typically 4 years after release), when it converts to a permissive license (usually Apache 2.0). Until conversion, the licensor defines "Additional Use Grants" specifying what commercial use is permitted.

**Architecture guidance:** DO NOT ADOPT. Until the conversion date, commercial use is restricted. Temporal (MIT) is the recommended alternative. EXCLUDED from adoption.

### 7. GPLv3 — Neo4j Community

**License observation:** GPLv3 requires that derivative works distributed or made available over a network also be licensed under GPLv3. Whether using Neo4j as a database backend constitutes creating a "derivative work" depends on the specific integration method and is a nuanced legal question.

**Architecture guidance:** DO NOT ADOPT WITHOUT LEGAL APPROVAL. The GPLv3's copyleft obligations create risk for a proprietary platform. Apache AGE (Apache 2.0) is the recommended alternative for PostgreSQL-based graph workloads. EXCLUDED from adoption.

### 8. SSPL — FalkorDB

**License observation:** Same SSPL concerns as Inngest (item 5 above).

**Architecture guidance:** EXCLUDED from adoption. Same rationale as Inngest.

### Workflow Engine License Summary

| Engine | License | OSI-Approved Open Source? | Platform Decision |
|--------|---------|--------------------------|-------------------|
| Temporal | MIT | YES | CANDIDATE |
| Inngest | SSPL | NO | EXCLUDED |
| Restate | BSL 1.1 | NO | EXCLUDED |

### Graph Database License Summary

| Engine | License | OSI-Approved Open Source? | Platform Decision |
|--------|---------|--------------------------|-------------------|
| Apache AGE | Apache 2.0 | YES | CANDIDATE (PostgreSQL extension) |
| Neo4j Community | GPLv3 | YES (but copyleft) | EXCLUDED (copyleft risk) |
| FalkorDB | SSPL | NO | EXCLUDED |

---

## Model Licensing — Separate Concern

Library licenses and model licenses are separate. A library being Apache 2.0 does NOT mean models accessed through it are unrestricted.

| Category | License Status | Action Required |
|----------|---------------|-----------------|
| ML libraries (PyTorch, Transformers, vLLM, etc.) | Permissive (Apache 2.0 / BSD) | Include license — no restriction |
| Open-weight models (Llama 3, Mistral, Gemma, etc.) | VARIES per model | Individual license review for EACH model |
| API-served models (Claude, GPT-4, Gemini) | Pay-per-use API terms | No OSS license concern; creates commercial dependency |
| Fine-tuned models | Inherit base model license | Check base model license + training data terms |

**Action required:** Before adopting any specific model, read its license. Create a model licensing review checklist.

---

## Unverified Licenses

The following repositories have licenses that have NOT been read and verified:

- semantica-agi/semantica — previously marked NEEDS VERIFICATION; deep research indicates MIT but commit SHA not recorded
- trustgraph-ai/trustgraph — previously marked NEEDS VERIFICATION; deep research indicates Apache 2.0 but commit SHA not recorded
- UnicomAI/wanwu
- RightNow-AI/openfang
- agnt-gg/agnt
- compozy/compozy

**Action required:** Read the LICENSE file of each repository before any use beyond architecture study. Record the license file commit SHA.

---

## License Verification Checklist (per project)

For each project adopted beyond study, record:

- [ ] LICENSE file read
- [ ] License version identified
- [ ] Commit SHA of LICENSE file recorded
- [ ] Sub-directories checked for different licenses
- [ ] Key dependencies checked for materially different licenses
- [ ] SaaS/hosting implications assessed
- [ ] Modification implications assessed
- [ ] Distribution implications assessed
- [ ] Legal review required? (yes/no)
- [ ] Legal review completed? (if required)
