# Semantic Views and Semantic Model Generator

> STATUS: RESEARCH COMPLETE | Last updated: 2026-08-13

## What Semantic Views Are

Semantic Views are **first-class Snowflake schema objects** that encode business
meaning on top of physical tables. They are the bridge between raw database
schema and natural language analytics. Created with `CREATE SEMANTIC VIEW` DDL,
they live alongside tables and views in the database schema.

This is distinct from the older approach of YAML files stored on Snowflake
stages. Snowflake now recommends Semantic Views for all new implementations.

---

## Why Semantic Views Exist

The problem: LLMs cannot reliably translate natural language to SQL against raw
database schemas because:
- Column names like `d_rgn` or `amt_usd` are meaningless without context.
- Business rules (e.g., "active customers" means `status != 'CANCELLED'`) are
  not encoded anywhere the LLM can see.
- Aggregation logic (SUM vs. AVG vs. COUNT) varies by metric.
- Join paths between tables are ambiguous without declared relationships.

Semantic Views solve this by providing a **declarative business vocabulary**
that sits between the user's question and the physical schema.

---

## YAML Specification Structure

Semantic Views use a YAML specification. The same YAML format works for both
Semantic Views (native objects) and staged YAML files (legacy approach).

### Top-Level Structure

```yaml
name: sales_analytics
description: "Sales performance analysis across regions and products"

tables:
  - name: orders
    description: "Customer orders with revenue and status"
    base_table:
      database: analytics_db
      schema: public
      table: fact_orders

    dimensions:
      # ... (see below)

    time_dimensions:
      # ... (see below)

    measures:
      # ... (see below)

    filters:
      # ... (see below)

relationships:
  # ... (see below)

verified_queries:
  # ... (see below)
```

### Dimensions

Descriptive attributes used for grouping, filtering, and slicing data.

```yaml
dimensions:
  - name: region
    description: "Geographic sales region"
    expr: d_region              # physical column expression
    data_type: VARCHAR
    unique: false
    sample_values:
      - "North America"
      - "EMEA"
      - "APAC"
    synonyms:
      - "territory"
      - "area"

  - name: product_category
    description: "Top-level product classification"
    expr: prod_cat
    data_type: VARCHAR
    sample_values:
      - "Electronics"
      - "Furniture"
```

Key fields:
- `expr`: the physical column or SQL expression.
- `sample_values`: critical for accuracy -- tells the LLM what valid values
  look like so it can generate correct WHERE clauses.
- `synonyms`: alternate names users might use in questions.
- `unique`: whether values are unique (helps the LLM reason about cardinality).

### Time Dimensions

Special handling for temporal attributes -- enables date math, truncation,
and period comparisons.

```yaml
time_dimensions:
  - name: order_date
    description: "Date the order was placed"
    expr: order_timestamp
    data_type: TIMESTAMP
    synonyms:
      - "date"
      - "order time"
      - "when ordered"
    unique: false
```

### Measures

Numeric facts with declared aggregation semantics.

```yaml
measures:
  - name: total_revenue
    description: "Sum of order amounts in USD"
    expr: order_amount_usd
    data_type: NUMBER
    default_aggregation: SUM
    synonyms:
      - "revenue"
      - "sales"
      - "income"

  - name: order_count
    description: "Number of orders"
    expr: order_id
    data_type: NUMBER
    default_aggregation: COUNT

  - name: average_order_value
    description: "Average order amount in USD"
    expr: order_amount_usd
    data_type: NUMBER
    default_aggregation: AVG
```

`default_aggregation` is critical -- it tells the LLM whether to SUM, AVG,
COUNT, MIN, MAX, or COUNT_DISTINCT when a user asks about this measure.

### Filters

Pre-defined named business logic filters.

```yaml
filters:
  - name: active_orders
    description: "Non-cancelled, non-returned orders"
    expr: "status NOT IN ('CANCELLED', 'RETURNED')"

  - name: enterprise_customers
    description: "Customers with enterprise-tier contracts"
    expr: "customer_tier = 'ENTERPRISE'"
```

### Relationships

Declare how tables join -- this removes ambiguity about join paths.

```yaml
relationships:
  - name: orders_to_customers
    left_table: orders
    right_table: customers
    relationship_type: many_to_one
    join_expr: "orders.customer_id = customers.customer_id"
```

> NEEDS VERIFICATION: Whether relationship_type supports many_to_many and
> one_to_one in addition to many_to_one and one_to_many.

---

## Semantic View Autopilot Generator

Released as GA on February 3, 2026, Semantic View Autopilot is an AI-assisted
generator that:

1. Analyzes existing Snowflake tables.
2. Auto-generates semantic view DDL.
3. Maps entities, infers relationships, and suggests metrics.
4. Reduces semantic model creation from days to minutes.

### Creation Methods (Ranked by Effort)

| Method | Effort | Best For |
|---|---|---|
| Semantic View Autopilot | Lowest | New models, quick start |
| Snowsight Generator | Low | Guided creation with UI |
| YAML editing in Snowsight | Medium | Fine-tuning generated models |
| Manual DDL / YAML | Highest | Full control, complex models |

The older Streamlit-based Semantic Model Generator has been replaced by the
native Snowsight tools.

---

## Semantic Views vs. Staged YAML Files

| Aspect | Semantic Views | YAML on Stage |
|---|---|---|
| **Object type** | First-class schema object | Flat file on stage |
| **DDL** | `CREATE SEMANTIC VIEW` | N/A (file upload) |
| **RBAC** | Native -- roles grant/revoke on the view | Stage-level access only |
| **Discoverability** | `INFORMATION_SCHEMA`, Snowsight catalog | Must know stage path |
| **Version control** | Snowflake manages versions | Manual file versioning |
| **Recommendation** | Recommended for new work | Legacy, still supported |
| **Interoperability** | Same YAML format underneath | Same YAML format |

---

## Constraints and Limits

- YAML specification maximum size: **1 MB**.
- Recommended column ceiling: **50-100 columns** per model for optimal
  Cortex Analyst performance.
- No cross-account replication of semantic views.
- No native conversion or cumulative metric types (NEEDS VERIFICATION on
  whether this has changed in 2026).

---

## Relevance to Allotey

The semantic view pattern is the single most transferable concept from
Snowflake. The core insight:

1. **Business meaning must be declared, not inferred.** The LLM cannot
   reliably guess that `d_rgn` means "region" or that revenue should be
   summed not averaged.
2. **The semantic model is a contract.** It defines the vocabulary, valid
   operations, and relationships that the AI is allowed to use.
3. **Sample values are essential.** Without them, the LLM generates
   syntactically valid but semantically wrong filters.
4. **Synonyms prevent misunderstanding.** Users say "sales", the column is
   "revenue" -- synonyms bridge this gap.

This pattern can be implemented outside Snowflake with any YAML/JSON schema
definition + LLM integration.

---

## Sources

- [Semantic Views Overview](https://docs.snowflake.com/en/user-guide/views-semantic/overview)
- [YAML Specification](https://docs.snowflake.com/en/user-guide/views-semantic/semantic-view-yaml-spec)
- [CREATE SEMANTIC VIEW](https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view)
- [Creating with Snowsight](https://docs.snowflake.com/en/user-guide/views-semantic/creating-with-snowsight)
- [Semantic Model Generator (GitHub)](https://github.com/Snowflake-Labs/semantic-model-generator)
