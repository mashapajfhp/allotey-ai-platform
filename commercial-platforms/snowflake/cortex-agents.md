# Cortex Agents -- Agentic AI with Built-in Tool Use

> STATUS: RESEARCH COMPLETE | Last updated: 2026-08-13

## What Cortex Agents Does

Cortex Agents is Snowflake's fully managed agentic platform for building AI
agents that reason, plan, call tools, execute code, and generate responses --
all within Snowflake's governed environment. You do not build your own
orchestration loop, runtime, or sandbox. Snowflake provides it.

The key differentiator: agents have native access to both **structured data**
(via Cortex Analyst) and **unstructured data** (via Cortex Search), and can
combine results from both in a single response.

---

## How Agent Orchestration Works

When a request arrives:

1. **Planning**: The agent's LLM analyzes the request and decomposes it into
   sub-tasks.
2. **Tool Selection**: For each sub-task, the agent identifies the right tool
   (Analyst, Search, code execution, web search).
3. **Execution**: The agent calls tools sequentially or in parallel as needed.
4. **Reflection**: The agent reviews intermediate results and may adjust its
   plan (e.g., refine a query if results are unexpected).
5. **Response Generation**: The agent synthesizes all results into a final
   answer.

You specify:
- Which LLM the agent uses for orchestration.
- Which tools are available to the agent.
- Instructions that influence behavior (system prompts).

---

## Available Tools

### Cortex Analyst (Structured Data)
- Generates SQL over structured data using semantic views.
- Returns tabular results the agent can reason over.
- Governed by the semantic model's definitions and the user's RBAC.

### Cortex Search (Unstructured Data)
- Retrieves relevant text passages from indexed documents/data.
- Provides context for questions that cannot be answered with SQL alone.
- Supports dynamic service selection (query the right index based on context).

### Code Execution (Python Sandbox)
- A built-in code execution tool that runs Python in a **secure, isolated
  sandbox**.
- Used for data processing, calculations, transformations, and visualizations
  that go beyond SQL.
- The sandbox prevents code from accessing external resources or the broader
  Snowflake environment beyond what the agent is authorized to use.

### Web Search
- Queries the web via the Brave Search API to retrieve real-time information.
- Useful for supplementing internal data with external context.

> NEEDS VERIFICATION: Whether additional tool types (custom functions, external
> APIs) are supported as of August 2026, or only the four above.

---

## Creating and Managing Agents

Agents can be created through three interfaces:

1. **Snowsight UI**: Visual configuration of tools, instructions, and models.
2. **SQL DDL**: `CREATE AGENT` commands for programmatic management.
3. **REST API**: For integration into external applications.

### REST API Usage

The REST API enables embedding agent interactions in custom applications:

```
POST /api/v2/cortex/agents/{agent_name}/sessions
POST /api/v2/cortex/agents/{agent_name}/sessions/{session_id}/messages
```

Responses are streamed, allowing real-time display of agent reasoning and
results.

---

## Cortex AI Gateway (July 2026)

Snowflake launched **Cortex AI Gateway** as a centralized control layer for
governing AI agent fleets across the enterprise.

### What It Does

- **Visibility**: When an agent calls a tool, queries data, or takes an action,
  the gateway logs it -- who requested it, what permissions they have, whether
  the action is allowed.
- **Cost Attribution**: Token usage is captured and attributed to the specific
  agent, team, and workload that generated it.
- **Cross-Platform Governance**: Governs agents built inside Snowflake AND
  third-party agents built on external tools (Claude Code, Cursor, etc.).

### MCP Server Support

The gateway supports 100+ MCP (Model Context Protocol) servers, centralizing
access policies, authentication, permissions, and audit logging.

Built on Snowflake's acquisition of **Natoma Labs** (enterprise MCP
infrastructure startup).

---

## Snowflake-Managed MCP Server

Snowflake provides a managed MCP server that exposes Cortex AI capabilities
to external AI agents via the Model Context Protocol.

### Bundled Tools

The managed MCP server exposes four tool categories:

| Tool | Capability |
|---|---|
| Cortex Analyst | NL-to-SQL over semantic views |
| Cortex Search | Semantic retrieval over unstructured data |
| Cortex Agents | Invoke a Snowflake agent as a tool |
| SQL Execution | Direct SQL queries (optional read-only mode) |

### Authentication

- **Snowflake OAuth** (default)
- **External OAuth** (integrate with your identity provider)
- **Key-pair authentication** (fallback for environments without OAuth)

### Governance

- Same RBAC, masking policies, and row-level security that govern data tables
  automatically govern the MCP server.
- Organizations should assign least-privilege roles to each workflow.
- Tool discovery and invocation are controlled by role-based permissions.

---

## Agent Design Best Practices (from Snowflake)

1. **Provide clear, specific instructions** -- vague prompts produce vague plans.
2. **Scope tools narrowly** -- give the agent only the tools it needs.
3. **Use semantic views** (not raw tables) for Cortex Analyst tools.
4. **Test with evaluation datasets** before production deployment.
5. **Monitor with Cortex AI Gateway** for cost and behavior visibility.

---

## Relevance to Allotey

Cortex Agents demonstrates the **agent-as-orchestrator** pattern where:
- The agent does NOT contain domain knowledge itself.
- Instead, it has access to specialized tools (structured query, unstructured
  search, code execution) and decides which to call.
- The semantic model provides the domain knowledge, not the agent's prompt.

This separation of orchestration logic from domain knowledge is a pattern
worth replicating.

---

## Sources

- [Cortex Agents Documentation](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents)
- [Cortex Agents REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api)
- [Managed MCP Server](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-mcp)
- [Cortex AI Gateway Announcement](https://www.snowflake.com/en/blog/enterprise-ai-security-agentic-mcp-governance/)
- [Best Practices for Building Cortex Agents](https://www.snowflake.com/en/developers/guides/best-practices-to-building-cortex-agents/)
