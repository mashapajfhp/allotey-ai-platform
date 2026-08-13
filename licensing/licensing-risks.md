# Licensing Risks

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

## High-Risk Licenses in Scope

### 1. AGPL-3.0 — xpert-ai/xpert

**Risk:** Network use of modified AGPL code requires releasing the entire combined work's source code. If Xpert code is integrated into the platform and served over a network, all platform source code may need to be disclosed.

**Mitigation:** Study only. Do not use Xpert code as a dependency, copy code from it, or modify it. Implement similar concepts independently using original code.

### 2. Custom License — langgenius/dify

**Risk:** Dify's custom license imposes restrictions on commercial use that differ from standard OSS licenses. Terms may change between versions.

**Mitigation:** Read the actual license text before any use. Do not copy code. Do not use as a dependency without explicit legal review.

### 3. MPL-2.0 — typedb/typedb

**Risk:** Moderate. Modified MPL files must remain MPL-2.0. New files can be proprietary. This is manageable but requires discipline.

**Mitigation:** If using TypeDB as a dependency (without modifying its source files), no issue. If modifying TypeDB source files, those files must stay MPL-2.0.

**Note:** Agno was previously MPL-2.0 but changed to Apache 2.0 in January 2025 when Phidata rebranded to Agno. Agno is now fully permissive.

### 4. Dual-Licensed Projects

**Risk:** Core is OSS but enterprise features require paid license. If the platform depends on enterprise features, it creates a commercial dependency.

**Projects to watch:**
- LiteLLM (MIT core, enterprise proxy features unclear)
- Langfuse (MIT core, EE features separately licensed)
- Cube (Apache 2.0 core, Cube Cloud features separate)
- ClickHouse (Apache 2.0 core, ClickHouse Cloud features separate)

**Mitigation:** Identify which features are used. Ensure core OSS features are sufficient. Budget for enterprise licenses if needed.

### 5. SSPL — inngest/inngest

**Risk:** SSPL (Server Side Public License) is more restrictive than AGPL. If the platform offers Inngest as part of a managed service, the entire service stack must be open-sourced. This is a significant concern for any SaaS deployment.

**Mitigation:** Evaluate whether Inngest can be used purely for self-hosted internal workflows. If the platform will be offered as SaaS, consider Temporal (MIT) or Restate (verify license) as alternatives. Do not adopt Inngest as a core workflow dependency without confirming deployment model implications.

### 6. BSL 1.1 — restatedev/restate

**Risk:** Business Source License is NOT an open-source license. It restricts commercial use until a conversion date (typically 4 years after release), when it converts to Apache 2.0. Until that conversion, commercial use is restricted.

**Mitigation:** Do not adopt Restate. Temporal (MIT) is the correct durable workflow choice for the platform.

### Workflow Engine License Summary

| Engine | License | Open-Source? | Platform Decision |
|--------|---------|-------------|-------------------|
| Temporal | MIT | YES | ADOPT |
| Inngest | SSPL | NO | EXCLUDED |
| Restate | BSL 1.1 | NO | EXCLUDED |

## Unverified Licenses

The following repositories have licenses that have NOT been read and verified:

- semantica-agi/semantica
- trustgraph-ai/trustgraph
- UnicomAI/wanwu
- RightNow-AI/openfang
- agnt-gg/agnt
- compozy/compozy

**Action required:** Read the LICENSE file of each repository before any use beyond architecture study.
