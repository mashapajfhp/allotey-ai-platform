# Licensing Matrix

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

## License Risk Levels

| Risk Level | Meaning |
|------------|---------|
| LOW | Permissive license, safe for all uses |
| MEDIUM | Copyleft with manageable obligations |
| HIGH | Strong copyleft or restrictive custom license |
| CRITICAL | May prevent commercial use or require source disclosure |

---

## Repository Licensing

| Repository | License | Commercial Use | Modification | Distribution Requirements | Network-Use Obligations | Source Disclosure Risk | Safe for Research? | Safe as Dependency? | Safe to Modify? | Safe to Copy Code? | Risk Level | Notes |
|------------|---------|---------------|-------------|--------------------------|------------------------|----------------------|-------------------|--------------------|-----------------|--------------------|------------|-------|
| **Agent Runtimes** | | | | | | | | | | | | |
| langchain-ai/langgraph | MIT | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| google/adk-python | Apache 2.0 | Yes | Yes | Include license + NOTICE | None | None | Yes | Yes | Yes | Yes | LOW | |
| google/adk-js | Apache 2.0 | Yes | Yes | Include license + NOTICE | None | None | Yes | Yes | Yes | Yes | LOW | |
| strands-agents/sdk-python | Apache 2.0 | Yes | Yes | Include license + NOTICE | None | None | Yes | Yes | Yes | Yes | LOW | |
| strands-agents/sdk-typescript | Apache 2.0 | Yes | Yes | Include license + NOTICE | None | None | Yes | Yes | Yes | Yes | LOW | |
| agno-agi/agno | Apache 2.0 | Yes | Yes | Include license + NOTICE | None | None | Yes | Yes | Yes | Yes | LOW | License changed from MPL-2.0 to Apache 2.0 when Phidata rebranded to Agno (Jan 2025) |
| microsoft/agent-framework | MIT | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| **Semantic Layer** | | | | | | | | | | | | |
| cube-js/cube | Apache 2.0 (core) | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | Verify EE/Cloud components |
| rilldata/rill | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| **Ontology / Context** | | | | | | | | | | | | |
| semantica-agi/semantica | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | Read LICENSE file before any use |
| trustgraph-ai/trustgraph | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | Read LICENSE file before any use |
| getzep/graphiti | Apache 2.0 | Yes | Yes | Include license + NOTICE | None | None | Yes | Yes | Yes | Yes | LOW | Previously recorded as MIT; verified Apache-2.0 from pyproject.toml |
| typedb/typedb | MPL-2.0 | Yes | Yes | Modified MPL files shared | None | File-level | Yes | Caution | Caution | Caution | MEDIUM | Server is MPL-2.0 |
| terminusdb/terminusdb | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| **Model Gateway** | | | | | | | | | | | | |
| BerriAI/litellm | MIT (core) | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | VERIFY: Enterprise proxy features may have separate terms |
| **Knowledge/Retrieval** | | | | | | | | | | | | |
| lancedb/lancedb | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | Cloud service is separate |
| **Analytics** | | | | | | | | | | | | |
| ClickHouse/ClickHouse | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| **Authorization** | | | | | | | | | | | | |
| openfga/openfga | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | CNCF project |
| **Observability** | | | | | | | | | | | | |
| langfuse/langfuse | MIT (core) | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | VERIFY: EE features may be separately licensed |
| **Workflows** | | | | | | | | | | | | |
| temporalio/temporal | MIT | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | Cloud service is separate |
| inngest/inngest | SSPL | Restricted | Yes | Source disclosure if offering as service | Yes — if offered as managed service | HIGH if offering as service | Yes (research) | Caution | Caution | NO | HIGH | SSPL prohibits offering as a managed service without full source disclosure |
| restatedev/restate | BSL 1.1 | Restricted | Yes | Converts to Apache 2.0 after 4 years | Yes — commercial use restricted | HIGH if commercial | Yes (research) | NO (until converts) | NO | NO | HIGH | Business Source License — NOT open source until conversion date |
| **Metadata** | | | | | | | | | | | | |
| datahub-project/datahub | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| open-metadata/OpenMetadata | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| **Protocols** | | | | | | | | | | | | |
| modelcontextprotocol/* | MIT | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| **Emerging Platforms** | | | | | | | | | | | | |
| xpert-ai/xpert | AGPL-3.0 | Restricted | Yes | Full source disclosure required | Yes — network use triggers | CRITICAL | Yes (research) | NO | NO | NO | CRITICAL | AGPL requires disclosing all source code of the combined work when accessed over a network |
| langgenius/dify | Custom (Dify) | Restricted | Limited | Custom terms | Custom terms | HIGH | Yes (research) | VERIFY | VERIFY | NO | HIGH | Custom license — read carefully before any use beyond study |
| UnicomAI/wanwu | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | |
| RightNow-AI/openfang | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | |
| agnt-gg/agnt | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | |
| compozy/compozy | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | |
| **Data Pipelines** | | | | | | | | | | | | |
| dagster-io/dagster | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | Cloud features separate |

---

## Critical License Warnings

> **This is architecture guidance, not legal advice.** See `licensing-risks.md` for methodology and caveats. Where interpretation depends on deployment model or integration method, this matrix flags risk level but does not state definitive legal conclusions.

### AGPL-3.0 (Xpert)
- **Network use may trigger source disclosure obligations** — the scope of "combined work" and "modification" under AGPL are nuanced legal questions
- **Architecture guidance:** DO NOT ADOPT WITHOUT LEGAL APPROVAL
- **Safe for:** Architecture study, concept research
- **Not safe for:** Using as a dependency, copying code, modifying and deploying

### Custom Licenses (Dify)
- Dify uses a custom license that restricts certain commercial uses
- **Must read the actual license text** before any use beyond research
- Do not assume OSS-like freedoms
- **Architecture guidance:** DO NOT ADOPT WITHOUT LEGAL APPROVAL

### MPL-2.0 (TypeDB)
- File-level copyleft — modified MPL files must remain MPL-2.0
- New files can use any license
- **Safe for:** Using as dependency (linking is OK)
- **Caution for:** Modifying existing MPL files (those must stay MPL-2.0)
- Note: Agno was previously MPL-2.0 but changed to Apache 2.0 in January 2025

### SSPL (Inngest, FalkorDB)
- **Server Side Public License** — more restrictive than AGPL. The SSPL's requirement to open-source the "Service Source Code" when offering the software as a service has limited legal precedent and debated scope.
- **Architecture guidance:** DO NOT ADOPT WITHOUT LEGAL APPROVAL. EXCLUDED from candidate architecture.
- **Safe for:** Self-hosted internal use, architecture research
- **Not safe for:** Any product that could be characterized as offering the software as a service

### BSL 1.1 (Restate)
- **Business Source License** — NOT OSI-approved open source. Restricts commercial use until conversion date.
- **Architecture guidance:** EXCLUDED. Temporal (MIT) is the recommended alternative.

### GPLv3 (Neo4j Community)
- **Strong copyleft** — whether using Neo4j as a backend constitutes creating a "derivative work" is a nuanced legal question.
- **Architecture guidance:** DO NOT ADOPT WITHOUT LEGAL APPROVAL. Apache AGE (Apache 2.0) is the recommended alternative. EXCLUDED from candidate architecture.

### Dual-Licensed Projects
- Several projects (LiteLLM, Langfuse, ClickHouse) have open-source cores with enterprise features under separate terms
- **Always verify** which features are covered by the OSS license vs. enterprise license
- Document the feature boundary before adoption

### Model Licenses (Separate from Library Licenses)
- ML library licenses (Apache 2.0, BSD) do NOT govern the models accessed through them
- Every model adopted needs its own license review
- See `licensing-risks.md` for model licensing categories
