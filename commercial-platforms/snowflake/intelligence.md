# Snowflake Intelligence -- The End-to-End Enterprise Agent

> STATUS: RESEARCH COMPLETE | Last updated: 2026-08-13

## What Snowflake Intelligence Is

Snowflake Intelligence is the **user-facing product** that ties all Cortex
capabilities together into a single conversational experience. It is an
enterprise agent that lets any employee -- not just analysts or engineers --
ask questions in natural language and get answers from both structured and
unstructured data.

GA since November 4, 2025. Launched with 80+ partners.

---

## How It Works Under the Hood

When a user asks a question, the flow is:

```
User question (natural language)
        |
        v
   Cortex Agent (orchestration layer)
        |
        +---> Cortex Analyst (structured data)
        |       Uses semantic views to generate SQL
        |       Returns tabular results
        |
        +---> Cortex Search (unstructured data)
        |       Retrieves relevant documents/text
        |       Returns passages with relevance scores
        |
        +---> Code Execution (if needed)
        |       Runs Python for calculations/transforms
        |
        v
   Agent synthesizes results
        |
        v
   Response with insights, visualizations, citations
```

The user does not know or care which tool was invoked. They see a unified
answer that may include:
- A natural language explanation.
- A data table or chart.
- Citations from retrieved documents.

---

## Key Features

### Natural Language Querying
- Users ask questions in plain English (or other supported languages).
- No SQL knowledge required.
- The system decides whether to query structured data, search documents, or both.

### Semantic Model Powered
- Accuracy depends on well-defined semantic views.
- Without a semantic model, the system falls back to raw schema interpretation
  (with lower accuracy).
- Organizations must invest in semantic model curation for reliable results.

### Verified Query Integration
- Verified queries from semantic models serve as guardrails.
- Common business questions are pre-mapped to correct SQL.
- Onboarding questions help new users discover what they can ask.

### Visualizations
- Snowflake Intelligence can generate charts and tables from query results.
- Visualizations are rendered inline in the conversational interface.

> NEEDS VERIFICATION: Exact visualization types supported (bar, line, pie,
> scatter, etc.) and whether custom visualization is possible.

---

## User Skills (2026 Feature)

User Skills let any user capture a **repeatable workflow in natural language**
and run it on demand. Examples:

- "Monday recap" -- summarize key metrics from the past week.
- "Variance analysis" -- compare this month vs. last month across KPIs.
- "Follow-up email" -- draft an email based on the latest data.

This turns Snowflake Intelligence from a Q&A tool into a **task automation
agent** that executes multi-step workflows defined by business users.

> NEEDS VERIFICATION: Whether User Skills is GA or still in preview as of
> August 2026.

---

## Automations and Subscriptions

- **Automations**: scheduled or event-triggered agent runs (public preview).
- **Time-based subscriptions**: deliver scheduled briefs and anomaly alerts
  to email, Slack, or mobile.
- This positions Snowflake Intelligence as not just reactive (answer questions)
  but proactive (push insights before they are asked for).

> NEEDS VERIFICATION: GA status of automations and subscriptions.

---

## Snowflake CoWork

The branded name for Snowflake Intelligence's personal work agent experience.

### Security Model
- Inherits Snowflake's existing access controls, row-level policies, and
  data masking automatically.
- Admins provision users via Okta or Microsoft Entra ID through SCIM.
- AI costs are managed with budget controls per team/user.

### Positioning
- "All your knowledge. One trusted enterprise agent."
- Designed to be the **single entry point** for data-driven decision making
  across the organization.
- Every employee gets a personalized agent that learns their access patterns,
  preferred metrics, and common questions.

---

## Partner Ecosystem

Launched with 80+ partners across:
- **Data providers**: enriching Snowflake data with external sources.
- **Consulting partners**: implementing and tuning semantic models.
- **Technology partners**: integrating with BI tools, data catalogs, and
  workflow platforms.

---

## Pricing Context

Snowflake Intelligence consumes credits based on:
- LLM token usage (orchestration + generation).
- Compute for SQL execution (virtual warehouse credits).
- Cortex Search queries.
- Code execution sandbox time.

Exact pricing is consumption-based and varies by model, warehouse size, and
query complexity.

> NEEDS VERIFICATION: Whether Snowflake Intelligence has a separate SKU or is
> purely consumption-based on existing Cortex credit pricing.

---

## What Makes This Different from a Chatbot

Snowflake Intelligence is NOT a thin wrapper around an LLM. The critical
differences:

| Aspect | Generic LLM Chatbot | Snowflake Intelligence |
|---|---|---|
| Data access | None (or via RAG only) | Full SQL + search + code |
| Accuracy mechanism | Prompt engineering only | Semantic models + verified queries |
| Governance | Application-level auth | Snowflake RBAC, RLS, masking |
| Data freshness | Stale context windows | Live queries against current data |
| Multi-step reasoning | Basic chain-of-thought | Agent with tool use and reflection |
| Auditability | Minimal logging | Full query history and tool call logs |

---

## Relevance to Allotey

Snowflake Intelligence demonstrates the **end state** of the pattern we are
studying: when you combine a governed data platform + semantic models +
hybrid search + agentic orchestration, you get a product where business users
can ask questions in natural language and get trustworthy answers.

The key lesson: **this only works when the semantic model is well-curated**.
Without it, the system degrades to raw text-to-SQL with ~64% accuracy --
not good enough for business decisions.

---

## Sources

- [Snowflake Intelligence Product Page](https://www.snowflake.com/en/product/snowflake-intelligence/)
- [Snowflake Intelligence Blog](https://www.snowflake.com/en/blog/snowflake-intelligence-enterprise-ai/)
- [Personal Work Agent Blog](https://www.snowflake.com/en/blog/snowflake-intelligence-work-agent/)
- [Data Agents Use Case](https://www.snowflake.com/en/product/use-cases/data-agents/)
- [Summit 2026 Features](https://medium.com/snowflake/snowflake-summit-2026-summary-of-new-features-09f3d5ffeefe)
