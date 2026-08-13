# Research Log

Chronological record of research sessions. Each entry documents what was examined, findings, and follow-up needed.

## Entry Format

```markdown
## YYYY-MM-DD — [Topic]

**Source:** [URL or repository]
**Repository/Documentation:** [specific repo or doc section]
**Commit/Tag/Version:** [if applicable]

### What Was Examined
- ...

### Important Findings
- ...

### Questions Raised
- ...

### Architecture Implications
- ...

### Follow-up Needed
- ...
```

---

## 2026-08-13 — Initial Repository Setup and First Research Pass

**Source:** Multiple — official documentation and GitHub repositories
**Scope:** Commercial platforms (Palantir, Databricks, Snowflake) and priority OSS projects

### What Was Examined
- Palantir Foundry/AIP/Ontology architecture via official documentation
- Databricks Unity Catalog, Genie, Mosaic AI via official documentation
- Snowflake Cortex suite and Semantic Views via official documentation
- Open-source projects: Semantica, TrustGraph, Graphiti, Cube, DataHub, Agno, Xpert, LiteLLM, OpenFGA, Langfuse

### Important Findings
- Palantir's Ontology model (Data + Logic + Actions + Security) is the most mature enterprise approach to agents-on-domain-objects
- The distinction between ontology, semantic layer, context graph, and knowledge store is critical and widely conflated
- Licensing is a major concern — AGPL (Xpert), custom licenses (Dify), and mixed licensing (LiteLLM) require careful navigation
- MCP adoption is accelerating across commercial and OSS platforms
- Authorization for AI agents is an unsolved problem across most platforms

### Questions Raised
- Should ontology and semantic layer be unified or separate subsystems?
- Is Temporal the right durable workflow engine, or would Inngest/Restate be simpler?
- How should delegated authorization work when agents chain across tools?
- What is the minimum viable observability stack?

### Architecture Implications
- A control plane / data plane separation appears in nearly all mature platforms
- Identity delegation (user → agent → tool) is architecturally critical
- Decision intelligence as first-class objects is worth serious investigation
- The platform needs both reasoning workflows (ephemeral) and durable workflows (persistent)

### Follow-up Needed
- Deep dive into Temporal vs. Inngest vs. Restate
- Deep dive into LangGraph vs. Google ADK vs. Strands
- TypeDB investigation for typed ontology
- ClickHouse vs. DuckDB evaluation for analytics workloads
- MCP specification deep read
- A2A protocol analysis
- Security threat model creation (OWASP LLM guidance)
