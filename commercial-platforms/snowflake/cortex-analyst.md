# Cortex Analyst -- Natural Language to SQL via Semantic Models

> STATUS: RESEARCH COMPLETE | Last updated: 2026-08-13

## What Cortex Analyst Does

Cortex Analyst translates natural language questions into SQL queries against
structured data in Snowflake. The critical differentiator is that it does NOT
work against raw schema -- it works against a **semantic model** that encodes
business meaning, relationships, and pre-approved query patterns.

The pattern: **NL question --> semantic model lookup --> SQL generation -->
execution in user's Snowflake context --> results**.

---

## The Semantic Model

The semantic model is a YAML definition that maps business concepts to
physical database objects. It is the core artifact that makes Cortex Analyst
accurate -- without it, the system would be doing raw text-to-SQL with no
business context.

### Key Components of the YAML

```yaml
# Simplified structure (not exhaustive)
name: revenue_model
description: "Revenue analysis for North America"

tables:
  - name: orders
    base_table:
      database: analytics
      schema: public
      table: fact_orders

    dimensions:
      - name: region
        description: "Sales region"
        expr: d_region
        data_type: VARCHAR
        sample_values: ["North America", "EMEA", "APAC"]

    time_dimensions:
      - name: order_date
        description: "Date the order was placed"
        synonyms: ["date", "order time"]
        expr: order_timestamp
        data_type: TIMESTAMP

    measures:
      - name: total_revenue
        description: "Sum of order revenue in USD"
        synonyms: ["revenue", "sales"]
        expr: order_amount_usd
        data_type: NUMBER
        default_aggregation: SUM

    filters:
      - name: active_orders
        description: "Only non-cancelled orders"
        expr: "status != 'CANCELLED'"

verified_queries:
  - name: monthly_revenue
    question: "What was total revenue by month last year?"
    verified_at: "2026-01-15"
    verified_by: "data_team"
    use_as_onboarding_question: true
    sql: >
      SELECT DATE_TRUNC('month', order_date) AS month,
             SUM(total_revenue) AS revenue
      FROM orders
      WHERE order_date >= DATEADD('year', -1, CURRENT_DATE())
      GROUP BY 1
      ORDER BY 1
```

### Component Breakdown

| Component | Purpose |
|---|---|
| **dimensions** | Descriptive attributes for grouping/filtering (region, product, status). Include `sample_values` to help the LLM understand valid values. |
| **time_dimensions** | Temporal attributes with special handling for date/time operations. |
| **measures** | Numeric facts with a `default_aggregation` (SUM, AVG, COUNT, etc.). |
| **filters** | Pre-defined named filters that encode business logic (e.g., "active only"). |
| **synonyms** | Alternate names users might use ("revenue" vs "sales" vs "total_revenue"). |
| **verified_queries** | Pre-approved question-to-SQL mappings that serve as few-shot examples. |

### YAML Constraints

- Maximum size: 1 MB.
- Recommended ceiling: 50-100 columns per model for optimal Cortex Analyst
  performance.
- Verified SQL must reference logical table and column names defined in the
  model, not the underlying physical names.

---

## Verified Queries -- The Accuracy Mechanism

Verified queries are the most important accuracy tool in Cortex Analyst. They
are a curated set of (natural language question, correct SQL) pairs stored in
the semantic model.

### How They Work

1. User asks a natural language question.
2. Cortex Analyst checks the Verified Query Repository (VQR) for similar
   questions.
3. If a close match exists, the verified SQL is used as a template or returned
   directly.
4. If no match, the LLM generates SQL using the semantic model's dimensions,
   measures, and relationships as context.

### The Optimization Loop

Cortex Analyst includes a feedback mechanism:

1. System suggests common questions based on usage data and query history.
2. A human verifies the suggested query and its SQL.
3. Verified queries are added to the repository.
4. Cortex Analyst uses these to improve future generation for similar questions.

This creates a **flywheel**: more usage --> more suggested queries --> more
verified queries --> higher accuracy.

### Accuracy Numbers (2026 Context)

- Raw text-to-SQL (no semantic layer): ~64.5% overall accuracy.
- With semantic model layer: ~72.7% overall accuracy.
- The gap narrows with verified queries -- Cortex Analyst reaches its ceiling
  faster because Snowflake has already built the evaluation loops and
  verification tooling.
- Between 2023 and 2026, raw text-to-SQL accuracy roughly doubled (32.7% to
  64.5%), but it still trails a modeled semantic layer.

> NEEDS VERIFICATION: These accuracy numbers come from Atlan's comparison guide.
> Snowflake's own published benchmarks may differ.

---

## Semantic Views vs. Staged YAML Files

There are two ways to provide a semantic model to Cortex Analyst:

| Aspect | Semantic Views (Recommended) | YAML Files on Stage |
|---|---|---|
| Object type | First-class Snowflake schema object (DDL: `CREATE SEMANTIC VIEW`) | Flat YAML file on a Snowflake stage |
| Governance | Native RBAC applies to the view itself | Governed by stage access only |
| Discoverability | Appears in `INFORMATION_SCHEMA`, Snowsight | Must know the stage path |
| Editing | Snowsight UI or YAML | Manual YAML editing |
| Recommendation | Snowflake recommends for new implementations | Legacy, still supported |

Snowflake handles sync: editing a Semantic View's YAML in the Cortex Analyst
UI produces the same underlying format as a staged YAML file.

---

## Data Privacy

- Cortex Analyst does NOT train on customer data.
- Metadata from the semantic model is used only to generate SQL at query time.
- Query execution happens entirely within the user's Snowflake account.
- RBAC governs what data the AI can surface -- if the user's role cannot see a
  column, Cortex Analyst cannot query it.

---

## Custom Instructions

Cortex Analyst supports custom instructions that modify its behavior for a
specific semantic model. These can include:

- Response formatting preferences
- Business rules the LLM should follow
- Disambiguation rules for ambiguous terms

> NEEDS VERIFICATION: Exact custom instruction syntax and scope. The feature
> is documented at docs.snowflake.cn but may have evolved.

---

## Key Takeaway for Allotey

The verified query pattern is the single most important concept to study. It
acknowledges that LLMs alone are not accurate enough for business analytics
and solves this with human-curated examples that constrain generation. This
is replicable outside Snowflake.

---

## Sources

- [Cortex Analyst Documentation](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst)
- [Verified Query Repository](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst/verified-query-repository)
- [Cortex Analyst Evaluations](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst-evaluations)
- [Agentic Semantic Model Improvement](https://www.snowflake.com/en/blog/engineering/agentic-semantic-model-text-to-sql/)
- [Custom Instructions](https://docs.snowflake.cn/en/user-guide/snowflake-cortex/cortex-analyst/custom-instructions)
