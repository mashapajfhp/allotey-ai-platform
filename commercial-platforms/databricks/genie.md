# Genie and AI/BI -- Natural Language Analytics

STATUS: RESEARCH COMPLETE -- August 2026

## What Genie Is

Genie is Databricks' **natural language analytics interface** for business users. It lets non-technical users ask data questions in plain English (or other languages) and receive answers as text summaries, tables, and visualizations. Genie is part of the broader **AI/BI** product family, which also includes AI/BI Dashboards.

Genie reached **General Availability** in 2025 and has since evolved significantly. The product was recently rebranded from "Genie Spaces" to "Genie Agents" to reflect its expanding agent capabilities.

## How Genie Works

### Natural Language to SQL Pipeline

1. User asks a question in natural language (e.g., "What were the top 10 revenue-generating products in Q1 2026?")
2. Genie interprets the question using the **Data Intelligence Engine**, which understands business terminology, table semantics, and prior query patterns
3. Genie generates SQL against the underlying Unity Catalog tables
4. The SQL executes on a serverless SQL warehouse
5. Results are returned as a combination of text summary, tabular data, and auto-generated visualizations

### Semantic Understanding

Genie's quality depends on **semantic context** provided by:

- **Table and column descriptions** in Unity Catalog metadata
- **Instructions** written by Genie space administrators (business definitions, terminology mappings, known edge cases)
- **Sample queries** provided as reference SQL
- **Trusted assets** (verified SQL functions and queries)
- **Prior conversation context** within a session
- **Semantic models**: If an organization invests in semantic modeling (defining business metrics, relationships, approved terminology), Genie can produce more trustworthy results

## Genie Spaces (Genie Agents)

A Genie Space (now called a Genie Agent) is a **curated environment** configured for a specific domain or use case:

- **Tables**: Which Unity Catalog tables the space can query
- **Instructions**: Natural language guidance for Genie (e.g., "Revenue means net revenue after returns", "Always filter by active customers unless specified")
- **Sample SQL queries**: Reference queries Genie can learn from
- **Trusted assets**: Pre-verified parameterized queries and functions
- **Permissions**: Who can access the space and the underlying data

### Best Practices for Genie Spaces
- Keep spaces domain-specific (e.g., "Sales Pipeline", "HR Headcount") rather than broad
- Write clear, specific instructions with business terminology definitions
- Provide representative sample queries covering common question patterns
- Curate the table set -- fewer, well-described tables produce better results than many loosely related ones
- Invest in the underlying semantic model (column descriptions, metric definitions)

## Verified Answers and Trusted Assets

### Trusted Assets
Trusted assets are **pre-defined SQL queries and functions** that provide verified answers:

- When a user's question matches a trusted asset, the response is flagged as "Trusted"
- This adds an assurance layer: the answer came from a pre-approved query, not ad-hoc SQL generation
- Trusted assets are parameterized, so they handle variations (e.g., "revenue by region for Q1" vs. "revenue by region for Q2")

### Verification Workflow
- Domain experts write and validate SQL queries for common questions
- These are added as trusted assets to the Genie space
- When Genie recognizes a question matches a trusted asset pattern, it uses the pre-approved SQL
- Responses using trusted assets are visually marked as verified in the UI

## AI/BI Dashboards

AI/BI Dashboards are the **visualization component** of the AI/BI product family:

- Native dashboard builder replacing legacy DBSQL dashboards
- SQL-based datasets connected to Databricks SQL warehouses
- Visualization types: tables, charts, counters, maps, etc.
- **Cross-filtering and drill-through** on tables (added 2026)
- **AI-generated dashboards**: Describe what you want and AI generates the initial dashboard
- **Import BI workbooks** (Beta): Upload Tableau or Power BI files and Genie Code builds a replicating AI/BI dashboard

### Dashboard + Genie Integration
- Dashboards can embed Genie chat, allowing users to ask follow-up questions about dashboard data
- Genie can reference dashboard datasets for conversational exploration

## Genie as an MCP Server

As of 2026, Genie is available as a **Managed MCP Server**:

- Any MCP-compatible agent can call Genie's `genie_execute_message` tool
- The agent sends a natural language question; Genie returns structured data
- Genie MCP inherits Unity Catalog permissions -- the calling user can only query tables they have access to
- This enables agents to use Genie as a "data question answering" tool alongside other tools

This is significant: it means external AI agents (e.g., Claude, ChatGPT with MCP support) can use Genie to answer data questions grounded in the organization's actual data, with full governance enforcement.

## Quality Tuning

Genie quality can be tuned through:

- **Instructions**: Natural language guidance about business context, terminology, and edge cases
- **Sample queries**: Example SQL that teaches Genie query patterns for the domain
- **Feedback**: Users can rate answers, and domain experts can review and correct SQL
- **Table selection**: Curating which tables are in scope for the space
- **Column descriptions**: Rich metadata in Unity Catalog helps Genie understand column semantics
- **Trusted assets**: Pre-approved queries for high-frequency or high-stakes questions

NEEDS VERIFICATION: Whether Genie supports multi-turn refinement where it remembers corrections across sessions (beyond single-conversation context). Current documentation suggests session-level memory only, but DAIS 2026 hinted at persistent learning from feedback.

## Competitive Context

Genie competes with:
- **Snowflake Cortex Analyst**: Natural language SQL on Snowflake (also uses semantic models)
- **Google Gemini in BigQuery**: Natural language queries in BigQuery
- **Microsoft Copilot for Power BI**: Natural language analytics in the Microsoft stack
- **ThoughtSpot**: Standalone natural language analytics platform

Databricks' differentiator is the **Unity Catalog integration** -- Genie inherits governance, lineage, and semantic metadata from the same system that governs the underlying data, rather than requiring a separate semantic layer.
