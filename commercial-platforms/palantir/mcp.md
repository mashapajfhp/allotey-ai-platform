# Palantir MCP Integration: Deep Study

**STATUS: RESEARCHED -- Based on official Palantir documentation and verified public sources (August 2026)**

---

## 1. Overview

Palantir offers two distinct Model Context Protocol (MCP) implementations that serve different audiences and use cases:

| Implementation | Audience | Purpose | Data Write? |
|---------------|----------|---------|-------------|
| **Palantir MCP** | Ontology builders, developers | Build and modify Ontology types from external IDEs | Can modify Ontology schema, but CANNOT write Ontology data |
| **Ontology MCP (OMCP)** | Ontology consumers, external AI agents | Read/write Ontology data safely | YES -- governed data writes |

This distinction is critical: **Palantir MCP is for building the Ontology; Ontology MCP is for using the Ontology.**

## 2. Palantir MCP

### What It Is
Palantir MCP is an implementation of the Model Context Protocol that enables AI IDEs and AI agents to autonomously design, build, edit, and review applications within the Palantir platform.

### What It Provides

**Context:**
- LLM agents receive understanding of Foundry architecture and Palantir libraries
- Recognizes repository types and injects tailored context (OSDK, Python transforms, TypeScript functions)
- Access to Palantir's snippet index for code context

**Tools (70+ tools):**
- Search ontologies and modify ontology types (object types, link types, action types)
- Update Developer Console applications
- Run and debug Python transforms iteratively
- Build OSDK applications with AI assistance
- Explore Foundry projects and resources

### What It Cannot Do
- **Cannot write actual Ontology data** (no creating/modifying object instances)
- Cannot execute actions against the Ontology
- Cannot query Ontology objects for operational data

### IDE Integration
Palantir MCP can be installed in:
- VS Code Copilot
- Claude Code
- Windsurf
- Cursor
- Continue extension

### Installation
A lightweight open-source wrapper (available on GitHub: `palantir/palantir-mcp`) handles:
- Authentication setup
- Package retrieval from the Foundry environment
- Environment configuration
- Secure connection establishment

## 3. Ontology MCP (OMCP)

### What It Is
Ontology MCP is a Developer Console feature that exposes an application's Ontology resources as MCP tools, enabling external AI agents and systems to interact with the Ontology as MCP clients.

### What It Exposes

Ontology MCP makes the following Ontology resources available as MCP tools:
- **Object types** -- Read, search, filter, and aggregate Ontology objects
- **Action types** -- Execute predefined, governed actions that modify Ontology data
- **Query functions** -- Run Foundry functions that return computed results

### How External AI Agents Interact

1. **Discovery** -- External agents discover available tools through standard MCP tool listing
2. **Read** -- Agents query Ontology objects using filters and search criteria
3. **Execute actions** -- Agents invoke predefined actions (subject to validation and permissions)
4. **Query** -- Agents call functions for computed results
5. **Write** -- Through actions, agents can safely write data to the Ontology

### Security Model

**Application Restrictions:**
- Each OMCP configuration restricts which actions the agent can take
- Restrictions are defined at the application level in Developer Console
- Only explicitly exposed object types, actions, and functions are available

**Token-Based Access:**
- The Palantir MCP enables external AI systems to interact via AI-friendly API endpoints using the configured user token permissions
- The external agent operates under the permissions of the configured token
- All Ontology security policies (markings, object-level, property-level) apply

**Governance Warning:**
Organizations must review data governance policies before enabling OMCP, as it makes data in the Palantir environment available to an external MCP client.

**Audit:**
- All interactions via OMCP are logged in Foundry's audit system
- Every API call carries identity attribution
- Actions executed via OMCP are audited identically to direct actions

### Integration Partners
Ontology MCP has been documented for use with:
- **Claude.ai** (desktop agent)
- **Microsoft Copilot Studio** (requires "Backend service" application with "User's permissions" for authorization code grant flow)
- **Gemini Enterprise**
- Custom MCP clients

### Agent Tool Descriptions
Developers control how external agents understand each tool by configuring the **Agent tool description** field in the Ontology Manager. This guides the LLM on:
- When to invoke each action
- Required parameters and their meanings
- Business logic constraints and sequencing

### Skills
Skills function as reusable instruction sets that encode complex business logic for external agents. Example: a `get-or-create-task` skill prevents duplicate records by instructing the agent to search before creating, guiding proper tool sequencing.

## 4. Sample Architecture

A typical OMCP architecture:

```
+------------------------+
| External AI Agent      |
| (Claude, Copilot, etc) |
+-----------|------------+
            |
            | MCP Protocol (STDIO/SSE)
            |
+-----------|------------+
| Ontology MCP Server    |
| (Developer Console)    |
| - Exposed object types |
| - Exposed actions      |
| - Exposed functions    |
+-----------|------------+
            |
            | Foundry API (authenticated)
            |
+-----------|------------+
| Palantir Ontology      |
| - Objects & Properties |
| - Links                |
| - Security Policies    |
| - Markings             |
+------------------------+
```

## 5. What Palantir MCP Exposes vs. Ontology MCP

| Capability | Palantir MCP | Ontology MCP |
|-----------|-------------|--------------|
| Browse Ontology schema | YES | YES (limited to exposed types) |
| Modify Ontology schema | YES | NO |
| Read Ontology data (objects) | NO | YES |
| Write Ontology data (via actions) | NO | YES |
| Execute Ontology functions | NO | YES |
| Build/modify applications | YES | NO |
| Run Python transforms | YES | NO |
| Debug code | YES | NO |
| Explore Foundry projects | YES | NO |
| Number of tools | 70+ | Varies by configuration |

## 6. Security Considerations

### Data Flow
When OMCP is enabled, data flows from the Palantir environment to the external MCP client:
- Object properties are transmitted to the external agent
- Function results are transmitted to the external agent
- The agent may store, process, or retransmit this data depending on its own policies

### Recommendations from Palantir
- Review data governance policies before enabling OMCP
- Use application restrictions to limit what is exposed
- Configure tokens with minimum necessary permissions
- Monitor audit logs for OMCP access patterns
- Consider what data classifications are acceptable for external agent access

### Token Management
- Tokens used by OMCP should follow the principle of least privilege
- Tokens should be rotated according to organizational security policies
- For Microsoft Copilot Studio, the authorization code grant flow ensures proper user-context delegation

## 7. Example MCP Workflows

Palantir documents several example workflows for Ontology MCP:

1. **Data enrichment** -- External agent reads Ontology objects, enriches them with external data, writes updates via actions
2. **Cross-system orchestration** -- External agent queries Ontology for context, then takes actions across both Palantir and external systems
3. **Conversational data access** -- Desktop AI assistant queries Ontology on behalf of a user to answer business questions
4. **Automated reporting** -- External system queries Ontology functions for computed metrics and generates reports

## 8. A2A Protocol Support

**STATUS: NEEDS VERIFICATION**

As of August 2026, there is no confirmed public documentation of Palantir supporting Google's Agent-to-Agent (A2A) protocol. While A2A has been adopted by 150+ organizations and is governed by the Linux Foundation, Palantir's agent interoperability story appears to be focused on MCP (which is a tool-exposure protocol, not an agent-to-agent protocol).

Palantir's approach to multi-agent orchestration is currently handled internally through:
- Durable orchestrations in AIP Logic
- Multi-agent coordinator patterns within the platform
- OMCP for external agent access to Ontology resources

Whether Palantir will adopt A2A for cross-platform agent coordination remains to be confirmed.

---

**Sources:**
- [Palantir MCP Overview](https://www.palantir.com/docs/foundry/palantir-mcp/overview)
- [Palantir MCP Security](https://www.palantir.com/docs/foundry/palantir-mcp/security)
- [Palantir MCP Installation](https://www.palantir.com/docs/foundry/palantir-mcp/installation)
- [Ontology MCP Overview](https://www.palantir.com/docs/foundry/ontology-mcp/overview)
- [Ontology MCP Sample Architecture](https://www.palantir.com/docs/foundry/ontology-mcp/sample-architecture)
- [Ontology MCP Tools and Agent Configuration](https://www.palantir.com/docs/foundry/ontology-mcp/mcp-tools-and-agent-configuration)
- [Ontology MCP Example Workflows](https://www.palantir.com/docs/foundry/ontology-mcp/example-mcp-workflows)
- [Developer Console Ontology MCP](https://www.palantir.com/docs/foundry/developer-console/ontology-mcp)
- [GitHub: palantir/palantir-mcp](https://github.com/palantir/palantir-mcp)
