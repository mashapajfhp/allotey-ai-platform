# Lessons from Snowflake -- What to Learn, What to Copy, What to Avoid

> STATUS: RESEARCH COMPLETE | Last updated: 2026-08-13

## The Core Pattern

Snowflake's AI analytics stack validates a specific pattern:

```
Structured Data --> Semantic Business Model --> Natural Language Analytics
```

This is not novel in concept (semantic layers have existed for decades in BI),
but Snowflake's implementation demonstrates how to make it work with LLMs at
enterprise scale. The lessons below are extracted from studying their approach.

---

## LESSON 1: The Semantic Model Is the Product, Not the LLM

The most important insight from Snowflake's approach: **accuracy comes from
the semantic model, not from the LLM**. The numbers prove this:

- Raw text-to-SQL (LLM against schema): ~64.5% accuracy.
- With semantic model: ~72.7% accuracy.
- With semantic model + verified queries: higher still (exact ceiling
  not published, but the feedback loop continuously improves it).

**What to copy:**
- Define a declarative vocabulary of dimensions, measures, time dimensions,
  relationships, and filters.
- Include sample values for every dimension (the LLM needs to know that
  "California" is spelled "California" not "CA" in your data).
- Declare synonyms so the LLM maps user language to your vocabulary.
- Specify default aggregation for every measure (SUM vs. AVG vs. COUNT is
  not something an LLM should guess).

**What NOT to copy:**
- The YAML format itself is Snowflake-specific. Use whatever schema definition
  works for your stack (JSON Schema, Protocol Buffers, even a database table).
- The 1 MB / 50-100 column limit is a Snowflake constraint, not a fundamental
  one. But keeping models focused is good practice regardless.

---

## LESSON 2: Verified Queries Are the Accuracy Flywheel

Snowflake's Verified Query Repository (VQR) is the most replicable concept
in their entire stack.

**How it works:**
1. Humans curate a set of (question, correct SQL) pairs.
2. When a user asks something similar to a verified question, the system
   uses the verified SQL as a template or returns it directly.
3. Usage data surfaces common questions that lack verified answers.
4. Humans verify those, expanding the repository.
5. Accuracy improves over time as the repository grows.

**What to copy:**
- Build a verified query repository for your own system.
- Use it for few-shot prompting: include relevant verified examples in the
  LLM's context when generating new queries.
- Build an evaluation loop: measure what percentage of questions are covered
  by verified queries, and expand coverage over time.
- Let verified queries serve as onboarding examples ("here are questions you
  can ask").

**What NOT to copy:**
- Snowflake ties verified queries to YAML syntax. A simpler key-value store
  of (question, correct query, metadata) is sufficient.
- The evaluation framework is useful but can be built with any testing tool.

---

## LESSON 3: Governance Inheritance, Not Governance Duplication

Snowflake's AI features inherit the same RBAC, row-level security, and data
masking that govern direct SQL access. This means:

- Zero additional security configuration for AI features.
- If a user cannot see a column via SQL, the AI cannot surface it.
- Audit trails capture AI-generated queries the same as human-written ones.

**What to copy:**
- Design your AI layer so it authenticates as the user, not as a service
  account. The AI should see exactly what the user is authorized to see.
- Do not build a separate permissions model for the AI -- reuse your existing
  one.
- Log all AI-generated queries for audit purposes.

**What NOT to copy:**
- Snowflake's RBAC is deeply integrated with their platform. If you are
  building on a different database, use that database's native access control
  rather than trying to replicate Snowflake's role hierarchy.

---

## LESSON 4: Hybrid Retrieval Is the Standard for Search

Cortex Search demonstrates that production-quality search requires three stages:

1. **Vector search** (semantic similarity).
2. **Keyword search** (exact term matching).
3. **Semantic reranking** (final relevance scoring).

**What to copy:**
- Never rely on vector search alone. Keyword search catches exact terms,
  product codes, and proper nouns that embeddings miss.
- Always rerank. The combined candidate set from vector + keyword search
  needs a final relevance pass.
- Abstract index freshness (Snowflake's TARGET_LAG pattern) so users do not
  have to manually trigger re-indexing.

**What NOT to copy:**
- The fully managed nature is Snowflake's value-add (and lock-in). Building
  your own hybrid search pipeline with open-source tools (e.g., Elasticsearch
  + vector store + cross-encoder reranker) gives you control and portability.

---

## LESSON 5: Agent as Orchestrator, Not Expert

Cortex Agents demonstrates a clean separation:

- The **agent** handles planning, tool selection, and response synthesis.
- The **semantic model** provides domain knowledge.
- **Specialized tools** (Analyst, Search, code sandbox) handle execution.

The agent itself contains no domain knowledge. It is a general-purpose
orchestrator.

**What to copy:**
- Keep your agent layer thin. It should decide what tools to call, not how
  to write SQL or search queries.
- Make tools independently testable. Cortex Analyst can be called without
  an agent; Cortex Search can be called without an agent. The agent adds
  orchestration, not capability.
- Provide clear tool descriptions so the agent can select the right one.

**What NOT to copy:**
- Snowflake's agent is tightly coupled to their tool ecosystem. Build your
  agent layer to be tool-agnostic (via standardized interfaces like MCP or
  function calling schemas).

---

## LESSON 6: MCP as the Integration Standard

Snowflake's managed MCP server and Cortex AI Gateway demonstrate that the
Model Context Protocol is becoming the standard for connecting AI agents
to enterprise data and tools.

**What to copy:**
- Expose your capabilities as MCP tools. This makes them accessible to any
  MCP-compatible agent (Claude, Cursor, custom agents).
- Implement governance at the MCP gateway level: who can call what tools
  with what permissions.
- Log all tool invocations for audit and cost attribution.

**What NOT to copy:**
- Snowflake's gateway governs 100+ MCP servers, which is enterprise-scale
  complexity. Start with a simple MCP server for your own tools and add
  gateway-level governance only when you have multiple servers to manage.

---

## LESSON 7: The Semantic Model Should Be Autogenerated Then Curated

Snowflake's Semantic View Autopilot generates initial semantic models from
existing tables in minutes, but humans must curate the results.

**What to copy:**
- Use LLMs to bootstrap semantic model creation. Analyze column names, data
  types, sample values, and table relationships to generate an initial model.
- ALWAYS have humans review and refine. Auto-generated descriptions may be
  wrong. Default aggregations may be incorrect. Relationships may be missing.
- Treat the semantic model as a living document that improves over time,
  not a one-time artifact.

**What NOT to copy:**
- The Snowsight-specific UI for model editing. Build your own lightweight
  editor or use any YAML/JSON editor with a schema validator.

---

## Anti-Patterns to Avoid

1. **Skipping the semantic model.** Raw text-to-SQL is too inaccurate for
   business use (~64%). Do not ship it.
2. **Over-engineering the semantic model.** Start with 10-20 columns and
   5-10 verified queries. Expand based on actual user questions.
3. **Treating AI analytics as a BI replacement.** Snowflake Intelligence
   supplements BI tools, it does not replace dashboards for known, recurring
   metrics.
4. **Ignoring the feedback loop.** Without verified queries and evaluation,
   accuracy stagnates. Build the loop from day one.
5. **Building a separate governance model for AI.** Reuse your existing
   access control. Any duplication will drift and create security gaps.
6. **Vendor lock-in.** Snowflake's approach works because it controls the
   full stack. If you are building a platform, ensure each component
   (semantic model, search, agent) can be swapped independently.

---

## Summary: What to Take Away

| Concept | Portability | Priority |
|---|---|---|
| Semantic model definition | Highly portable | MUST HAVE |
| Verified query repository | Highly portable | MUST HAVE |
| Governance inheritance | Pattern portable, implementation varies | MUST HAVE |
| Hybrid retrieval (vector + keyword + rerank) | Fully portable | SHOULD HAVE |
| Agent-as-orchestrator pattern | Fully portable | SHOULD HAVE |
| MCP tool exposure | Fully portable | SHOULD HAVE |
| Auto-generate then curate | Portable with any LLM | NICE TO HAVE |
| Semantic View Autopilot | Snowflake-specific | DO NOT COPY |
| Cortex AI Gateway | Snowflake-specific | STUDY ONLY |

---

## Sources

- All sources from the companion documents in this directory.
- [Cortex Analyst vs Custom Text-to-SQL Accuracy](https://atlan.com/know/snowflake/cortex-analyst-vs-text-to-sql/)
- [Agentic Semantic Model Improvement](https://www.snowflake.com/en/blog/engineering/agentic-semantic-model-text-to-sql/)
- [Enterprise AI Security and MCP Governance](https://www.snowflake.com/en/blog/enterprise-ai-security-agentic-mcp-governance/)
