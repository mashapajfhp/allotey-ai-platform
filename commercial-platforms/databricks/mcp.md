# MCP Support -- Model Context Protocol on Databricks

STATUS: RESEARCH COMPLETE -- August 2026

## Overview

Databricks has made **Model Context Protocol (MCP)** a first-class integration point in its platform. As of 2026, Databricks provides **managed MCP servers** that expose Lakehouse capabilities (data queries, vector search, functions) to any MCP-compatible AI client. MCP servers are governed by Unity Catalog and routed through Unity AI Gateway.

The MCP integration was announced alongside a "Week of Agents" initiative in early 2026 and expanded significantly at DAIS 2026.

## Managed MCP Server Types

Databricks provides four types of fully-managed MCP servers, each exposing a specific Lakehouse capability:

### 1. Genie MCP Server
- **Purpose**: Natural language data querying
- **Tool exposed**: `genie_execute_message`
- **How it works**: Send a plain-English question; Genie translates to SQL, executes against Unity Catalog tables, and returns structured results
- **Example**: "What were the top 10 revenue-generating products in Q1 2026?" returns a table of results
- **Governance**: Inherits caller's Unity Catalog permissions; row-level security and column masks are enforced
- **Status**: Beta (as of documentation reviewed)

### 2. AI Search (Vector Search) MCP Server
- **Purpose**: Query AI Search indexes for document retrieval
- **How it works**: Send a search query; retrieve relevant documents from vector/hybrid indexes
- **Requirements**: Index must use Databricks managed embeddings
- **Governance**: Inherits caller's UC permissions on the underlying table
- **Note**: The previous URL prefix `/api/2.0/mcp/vector-search/` and `vector-search` scope still work after the rename to AI Search
- **Status**: GA

### 3. Unity Catalog Functions MCP Server
- **Purpose**: Execute Unity Catalog functions as tools
- **How it works**: Any UC function becomes an MCP tool **automatically** when the MCP server is deployed -- no additional configuration needed
- **Tool types**: SQL UDFs, Python UDFs, AI functions
- **Governance**: Function executes with the caller's permissions, not a service account
- **Status**: GA

### 4. SQL MCP Server
- **Purpose**: Run SQL against Databricks SQL warehouses
- **How it works**: AI coding tools (e.g., Claude Code, Cursor) can generate and execute SQL to create data pipelines
- **Capabilities**: Read and write operations
- **Execution model**: Asynchronous -- call the tool to start, then poll until the response completes
- **Governance**: Caller's UC permissions enforced
- **Status**: GA

## Architecture and Security

### On-Behalf-Of-User Authentication

This is the most important security property of Databricks' MCP implementation:

- Every MCP tool call **executes with the identity of the calling user**
- The MCP server does not use a shared service account
- If a data analyst connects Claude Desktop to a Genie MCP server, they can only query tables their UC role allows
- No manual ACL syncing is required between the MCP server and Unity Catalog
- This is enforced at the platform level, not at the application level

### Serverless Infrastructure
- Managed MCP servers run on **Databricks serverless compute**
- No infrastructure provisioning or management required
- Auto-scaling based on demand
- Customer data stays in the customer's data plane

### Unity AI Gateway Integration
- MCP servers are registered as endpoints in Unity AI Gateway
- Rate limits can be applied to MCP tool calls (requests per minute)
- Audit logs capture all MCP invocations (who called what tool, when, with what parameters)
- Guardrails can be configured for MCP request/response filtering

## External MCP Servers

In addition to managed MCP servers, Databricks agents can connect to **external MCP servers**:

- Third-party MCP servers (e.g., GitHub MCP, Slack MCP, custom MCP servers)
- Connected via the agent's tool configuration
- External MCP calls are still logged through AI Gateway audit
- External MCP servers do NOT benefit from UC permission pass-through (they have their own auth)

## Connecting MCP Clients to Databricks

MCP-compatible clients can connect to Databricks managed MCP servers:

### Supported Clients (confirmed)
- **Claude Desktop**: Connect via MCP server configuration
- **Claude Code**: CLI-based access to Databricks MCP servers
- **Cursor**: AI coding tool with MCP support
- **Custom agents**: Any agent using the MCP protocol

NEEDS VERIFICATION: The full list of officially supported MCP clients. The MCP ecosystem is expanding rapidly in 2026, and Databricks documentation may not enumerate all compatible clients.

### Connection Configuration
```json
{
  "mcpServers": {
    "databricks-genie": {
      "url": "https://<workspace-url>/api/2.0/mcp/genie/<space-id>",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

NEEDS VERIFICATION: Exact connection configuration format. The above is a simplified representation; actual configuration may vary by client and authentication method (OAuth, PAT, etc.).

## MCP and the Supervisor Agent

The Supervisor Agent can use MCP servers as sub-agents:

- A Supervisor can orchestrate Genie MCP, AI Search MCP, UC Functions MCP, and external MCP servers
- The Supervisor routes requests to the appropriate MCP server based on the user's intent
- All MCP calls through the Supervisor inherit the end user's permissions
- This creates a **unified agent entry point** that can access data, search knowledge bases, execute functions, and call external services -- all governed

## How Databricks Uses MCP vs. How Others Use MCP

| Aspect | Databricks Approach | Typical MCP Usage |
|---|---|---|
| Governance | UC permissions pass through every tool call | Auth is per-server, often shared credentials |
| Hosting | Managed serverless MCP servers | Self-hosted or third-party hosted |
| Tool registration | UC functions become MCP tools automatically | Manual tool definition in MCP server code |
| Audit | All calls logged via AI Gateway | Depends on implementation |
| Rate limiting | AI Gateway rate limits on MCP | Not standard in MCP protocol |
| Reranking/routing | AI Gateway smart routing for MCP | Not applicable |

## Key Insight

Databricks' MCP strategy is not just about "supporting MCP" -- it is about making **Unity Catalog the authoritative source of tools, data, and permissions for the MCP ecosystem**. By automatically exposing UC functions as MCP tools and enforcing UC permissions on every MCP call, Databricks ensures that the governance layer extends from data through to agent tool use. The MCP server becomes a governed interface to the Lakehouse, not an ungoverned side channel.

This pattern -- where the data platform's governance layer extends to cover external AI client access via MCP -- is a significant architectural idea worth studying for any platform that wants to expose capabilities to AI agents.
