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
| agno-agi/agno | MPL-2.0 | Yes | Yes | Modified MPL files must be shared | None | File-level only | Yes | Yes | Caution | Caution | MEDIUM | Modified files must remain MPL-2.0; new files can be proprietary |
| microsoft/agent-framework | MIT | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| **Semantic Layer** | | | | | | | | | | | | |
| cube-js/cube | Apache 2.0 (core) | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | Verify EE/Cloud components |
| rilldata/rill | Apache 2.0 | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
| **Ontology / Context** | | | | | | | | | | | | |
| semantica-agi/semantica | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | Read LICENSE file before any use |
| trustgraph-ai/trustgraph | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | Read LICENSE file before any use |
| getzep/graphiti | MIT | Yes | Yes | Include license | None | None | Yes | Yes | Yes | Yes | LOW | |
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
| restatedev/restate | NEEDS VERIFICATION | — | — | — | — | — | Yes (research) | VERIFY | VERIFY | VERIFY | UNKNOWN | Read LICENSE file before any use |
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

### AGPL-3.0 (Xpert)
- **Network use triggers source disclosure** — if you modify Xpert and serve it over a network, you must release ALL source code of the combined work
- **Safe for:** Architecture study, concept research
- **NOT safe for:** Using as a dependency, copying code, modifying and deploying

### Custom Licenses (Dify)
- Dify uses a custom license that restricts certain commercial uses
- **Must read the actual license text** before any use beyond research
- Do not assume OSS-like freedoms

### MPL-2.0 (Agno, TypeDB)
- File-level copyleft — modified MPL files must remain MPL-2.0
- New files can use any license
- **Safe for:** Using as dependency (linking is OK)
- **Caution for:** Modifying existing MPL files (those must stay MPL-2.0)

### SSPL (Inngest)
- **Server Side Public License** — similar to AGPL but stricter: if you offer Inngest as part of a managed service, you must open-source the entire service stack
- **Safe for:** Self-hosted internal use, architecture research
- **Caution for:** Using in a product that could be characterized as offering Inngest as a service
- This is a significant concern if the platform is ever offered as SaaS

### Dual-Licensed Projects
- Several projects (LiteLLM, Langfuse, ClickHouse) have open-source cores with enterprise features under separate terms
- **Always verify** which features are covered by the OSS license vs. enterprise license
