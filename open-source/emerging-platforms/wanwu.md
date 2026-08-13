# Wanwu (Yuanjing Wanwu) — Research Note

**Repository:** [UnicomAI/wanwu](https://github.com/UnicomAI/wanwu)
**License:** Developer-friendly (described as commercially friendly — exact
license NEEDS VERIFICATION)
**Language:** NEEDS VERIFICATION (likely Python backend)
**Origin:** China Unicom (state-owned telecom)
**GitHub Stars:** ~2,600
**Status:** NOT STARTED — initial observations from web research

---

## Overview

Wanwu AI Agent Platform (full name: Yuanjing Wanwu Agent Platform) is an
enterprise-grade, multi-tenant AI agent development platform from China Unicom.
It is designed for business scenarios and positions itself as a one-stop,
commercially friendly AI solution. The platform covers agent development,
workflow orchestration, RAG, model management, and MCP integration.

---

## Core Capabilities

### Agent Development
- Rapid development of intelligent agents.
- Integration of large language models for reasoning.
- Business process automation.

### Workflow Orchestration
- Complex workflow design and execution.
- Visual workflow authoring (NEEDS VERIFICATION on the specific UI
  capabilities).
- Multi-step business process support.

### Model Management
- Full lifecycle model management — configure, monitor, and manage different
  models.
- Multi-model support across providers.
- NEEDS VERIFICATION: Does this include model fine-tuning, or is it limited to
  inference management?

### Knowledge Base / RAG
- Enterprise knowledge base construction.
- Document ingestion and retrieval.
- NEEDS VERIFICATION on chunking strategies, embedding options, and retrieval
  methods.

---

## Ontology Agents and GraphRAG

China Unicom's research group (same org) has published **UniAI-GraphRAG**, which
integrates:

- **Domain knowledge ontology modeling** — structured representation of domain
  concepts, relationships, and rules.
- **Knowledge graph construction** — building entity-relationship graphs from
  documents.
- **Community report construction** — clustering and summarizing knowledge
  graph regions.
- **Graph Retrieval-Augmented Generation** — using graph structure for more
  accurate multi-hop reasoning.

UniAI-GraphRAG reportedly outperforms LightRAG in comprehensive F1 scores,
particularly in inference and temporal queries.

NEEDS VERIFICATION: Is UniAI-GraphRAG integrated into the Wanwu platform, or
is it a separate research project? The GitHub organization suggests they are
related but the integration depth is unclear.

---

## MCP Integration

The platform integrates MCP with:
- 100+ pre-selected industry-specific MCP servers available for immediate use.
- Web search capabilities via MCP.
- Custom MCP server support.

The breadth of pre-built MCP servers (100+) is notable and suggests significant
investment in the MCP ecosystem for enterprise use cases.

---

## Multi-Tenancy

Built-in multi-tenancy support:
- Organization management.
- Role-based access control.
- User management.
- Platform-level configuration.

This is expected given the enterprise and telecom origin of the platform.

---

## Structured Business-Data Reasoning

The GraphRAG and ontology capabilities suggest a structured approach to
business data reasoning:
- Ontology-guided extraction of entities and relationships from documents.
- Multi-dimensional clustering for organizing knowledge.
- Dual-channel fusion for combining structured (graph) and unstructured (text)
  retrieval.

This positions Wanwu for complex QA scenarios like cross-document
summarization and multi-hop relational reasoning — useful for enterprise
knowledge management.

---

## Technical Infrastructure

NEEDS VERIFICATION on the complete technical stack. From the repository:
- Docker Compose deployment with TiDB support (suggesting distributed database
  capability).
- NEEDS VERIFICATION: What other databases are supported?
- NEEDS VERIFICATION: What is the frontend framework?
- NEEDS VERIFICATION: What are the system requirements?

---

## Key Observations

1. **Enterprise pedigree** — backed by a major state-owned telecom, suggesting
   production-grade reliability and enterprise feature completeness.
2. **GraphRAG integration** — the ontology-based knowledge graph approach is
   more sophisticated than standard vector-based RAG.
3. **MCP ecosystem** — 100+ pre-built MCP servers is significant for
   out-of-the-box enterprise integration.
4. **Chinese market focus** — documentation is primarily in Chinese, which
   limits accessibility for non-Chinese-speaking teams.
5. **License ambiguity** — described as "developer-friendly" and "commercially
   friendly" but the exact license terms need verification from the repository.
6. **Moderate community** — 2,600 GitHub stars suggests growing but not yet
   mainstream adoption.

---

## Key Questions to Investigate

- [ ] What is the exact license? Is it Apache-2.0, MIT, or a custom license?
- [ ] Is UniAI-GraphRAG integrated into the platform or separate?
- [ ] What is the English-language documentation situation?
- [ ] What is the deployment complexity — can it run on standard cloud
      infrastructure outside China?
- [ ] How does the ontology modeling work — is it manual, semi-automated, or
      fully automated?
- [ ] What are the performance characteristics at scale?
- [ ] Is there an active English-speaking community or contributors?
- [ ] What is the relationship between the open-source platform and China
      Unicom's commercial AI services?

---

## Relevance to Allotey AI Platform

Wanwu is interesting primarily for its GraphRAG and ontology-based knowledge
approach, and for the scale of its MCP server ecosystem. The structured
business-data reasoning capabilities are worth studying as an architectural
pattern. However, the Chinese-market focus, language barriers, and license
ambiguity make it a study target rather than an adoption candidate at this
stage.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — requires license verification and deeper repository analysis*
