# Model Context Protocol (MCP)

**STATUS: NOT STARTED**
**Specification:** https://modelcontextprotocol.io
**Introduced by:** Anthropic (November 2024)
**Latest Spec:** July 28, 2026 revision

---

## Overview

The Model Context Protocol (MCP) is an open standard that gives LLM-based
applications a consistent way to connect with external tools, data sources,
and systems. It is the "USB-C for tool connectivity" -- a standardized
interface between AI agents and the capabilities they can use.

The distinction: **MCP = agent to tools/context** (vertical). It is NOT
agent-to-agent communication (that is A2A).

---

## Architecture

Three principal roles:

1. **MCP Host:** The user-facing AI application (e.g., Claude Desktop, an
   IDE plugin, a custom agent)
2. **MCP Client:** An intermediary managing bidirectional communication
   between host and server
3. **MCP Server:** An independent process that exposes tools, resources,
   and prompts to the client

---

## Core Primitives

### Tools (Executable Actions)

Functions the agent can call to perform actions:
- Execute code, query databases, call APIs
- Send messages, create files, modify state
- The most commonly used primitive

### Resources (Read-Only Data)

Structured data the agent can read for context:
- Files, database records, API responses
- Configuration, documentation, knowledge bases
- Read-only -- resources do not modify state

### Prompts (Reusable Templates)

Pre-built prompt templates that servers can expose:
- Domain-specific prompt patterns
- Standardized interaction templates
- Parameterized prompts with input schemas

---

## Transports

### Stdio

For local MCP servers running as child processes. The host spawns the server
process and communicates via stdin/stdout. Simple, fast, no network overhead.

### Streamable HTTP

For remote MCP servers. As of the July 2026 revision, the remote transport
is stateless -- sessions and the initialization handshake were removed. Clients
discover capabilities through `server/discover`.

---

## Discovery

As of July 2026, capability discovery happens through the `server/discover`
method. Servers expose their available tools, resources, and prompts with
metadata including:
- Names and descriptions
- Input/output schemas
- Icons and additional metadata (added November 2025)

---

## Authorization and Security

### OAuth 2.0

The November 2025 specification enhanced authorization server discovery with
support for OpenID Connect Discovery 1.0. Servers can require OAuth tokens
for access control.

### Security Considerations

- TLS for transport security on remote connections
- Sandboxing of tool execution
- Consent flows for sensitive operations
- Tool approval by the user before execution (host-level policy)

### Known Security Concerns (2025-2026 Research)

Active research on MCP security threats:
- Prompt injection via tool responses
- Agent context poisoning
- Tool-invocation-based exfiltration
- Configuration discovery attacks
- Insufficient input validation on tool parameters

These are protocol-level concerns that any MCP implementation must address.

---

## OpenTelemetry Integration

OTel MCP semantic conventions (v1.39) enable end-to-end tracing across the
agent-to-MCP-server boundary. This fixes trace disconnection issues where
agent traces and tool execution traces were previously separate.

---

## Key Questions

- [ ] How should MCP tool access be authorized? Should calling a tool require
      an OpenFGA check (agent has permission to use tool X)?
- [ ] How to handle MCP server discovery in a multi-tenant platform?
- [ ] Should each tenant have their own MCP servers, or shared servers with
      tenant-scoped access?
- [ ] What is the security model for user-installed MCP servers vs platform-
      provided servers?
- [ ] How to audit and log all MCP tool invocations for compliance?
- [ ] How does MCP interact with A2A when an agent delegates to another agent
      that needs tools?

---

## References

- MCP Specification: https://modelcontextprotocol.io
- MCP Security Analysis: https://arxiv.org/pdf/2503.23278
- MCP GitHub: https://github.com/modelcontextprotocol
