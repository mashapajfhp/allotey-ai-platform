# Security Threat Model for AI/Agentic Systems

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Overview

AI/agentic platforms introduce novel attack vectors beyond traditional web application security. This document catalogs threats specific to AI systems, drawing from OWASP LLM Top 10, OWASP Agentic AI, and current security research.

---

## Trust Boundary Model

The threat checklist below must be understood in the context of a trust-boundary architecture. Every data flow and tool invocation crosses one or more trust boundaries, and security controls must be enforced at each boundary transition.

```
Internet (UNTRUSTED)
   |
   v
API Gateway / AI Gateway
   |
   | == TRUST BOUNDARY ==
   v
Agent Runtime (SEMI-TRUSTED -- constrained by authorization)
   |
   | == TRUST BOUNDARY ==
   v
Tool Gateway / MCP Gateway (GOVERNED)
   |
   | == TRUST BOUNDARY ==
   v
External Systems (EXTERNAL TRUST)
```

### Trust Zones

- **UNTRUSTED (Internet):** All user input, browser clients, external API callers. Nothing from this zone is trusted. All data must be validated, sanitized, and authenticated before crossing into the next zone.
- **SEMI-TRUSTED (Agent Runtime):** Agents operate with delegated authority. They are constrained by authorization policies but are not fully trusted because their behavior is influenced by model outputs and potentially poisoned inputs. Every tool invocation from this zone requires independent authorization verification.
- **GOVERNED (Tool Gateway / MCP Gateway):** Tool execution is governed by policy. The gateway enforces allowlists, rate limits, parameter validation, and audit logging. Tools themselves may be trusted, but the requests to invoke them are not.
- **EXTERNAL TRUST (External Systems):** Third-party APIs, databases, and services. Trust is established through credentials and contracts but responses are validated because external systems can be compromised or return unexpected data.

### Data Classifications

All data in the system falls into one or more of these classifications. Classification determines handling requirements at every trust boundary.

| Classification | Description | Handling Requirements |
|---------------|-------------|----------------------|
| **untrusted** | User input, external API responses, model outputs | Validate, sanitize, never use as authority for security decisions |
| **trusted** | Validated internal data, ontology definitions | Integrity-protected, sourced from controlled pipelines |
| **privileged** | Authorization decisions, workflow state | Access restricted to authorization subsystem, immutable once decided |
| **secret** | Credentials, API keys, encryption keys | Never logged, never in prompts, vault-managed, rotated regularly |
| **tenant-scoped** | All user data, agent state, configurations | Tenant ID enforced on every query, row-level security, isolation verified |
| **public** | Documentation, published APIs | No access control required, but integrity-protected |
| **PII** | Personal data requiring regulatory compliance | Encrypted at rest, redacted in logs, retention policies, right-to-erasure |
| **regulated** | Financial data, healthcare data, audit logs | Compliance controls, immutable audit trails, retention requirements |

### Boundary Analysis Framework

For each trust boundary transition, the following must be documented and enforced:

**1. Internet -> API Gateway / AI Gateway**
- What data crosses: Authentication tokens, user requests, file uploads
- Validation: Authentication (JWT/OAuth), rate limiting, payload size limits, input schema validation
- Authorization: Identity verification, tenant membership confirmation
- Logging: All requests logged with identity, timestamp, source IP
- Threat scenarios: Credential stuffing, DDoS, malformed payloads, token theft

**2. API Gateway -> Agent Runtime**
- What data crosses: Validated user intent, session context, tenant-scoped data references
- Validation: Intent parsing, context size limits, prompt injection detection
- Authorization: User permissions mapped to agent capabilities, least-privilege scoping
- Logging: Agent session creation, capability grants, context loading
- Threat scenarios: Prompt injection surviving gateway, excessive context injection, privilege escalation through agent delegation

**3. Agent Runtime -> Tool Gateway / MCP Gateway**
- What data crosses: Tool invocation requests, parameters, agent identity
- Validation: Parameter schema validation, tool allowlist check, rate limit enforcement
- Authorization: Per-tool authorization (agent role + user delegation), parameter-level authorization
- Logging: Every tool invocation with full parameters, response summary, latency
- Threat scenarios: Tool injection, parameter manipulation, excessive agency, replay attacks

**4. Tool Gateway -> External Systems**
- What data crosses: API calls, database queries, file operations
- Validation: Response schema validation, response size limits, content type verification
- Authorization: Service-to-service credentials (managed, rotated), scope-limited API keys
- Logging: External call audit trail, response metadata, error tracking
- Threat scenarios: Credential compromise, man-in-the-middle, external system compromise, data exfiltration through tool responses

---

## Threat Catalog

### 1. Prompt Injection

**Threat:** Attacker crafts input that overrides system instructions, causing the agent to ignore safety guardrails or execute unintended actions.

**Trust boundary:** Internet -> API Gateway (direct injection), Tool Gateway -> Agent Runtime (indirect injection via tool responses)

**Variants:**
- Direct prompt injection -- malicious instructions in user input
- Indirect prompt injection -- malicious instructions embedded in retrieved documents, tool outputs, or third-party data

**Impact:** Agent executes unauthorized actions, leaks sensitive data, or bypasses safety controls.

**Mitigations:**
- Input sanitization and validation
- System prompt isolation (model-level if available)
- Output filtering for sensitive data patterns
- Tool invocations require explicit authorization regardless of prompt content
- Never let the LLM be the sole authority for permission decisions

---

### 2. Tool Injection / Privilege Escalation

**Threat:** Attacker manipulates the agent into calling tools it shouldn't, or calling tools with malicious parameters.

**Trust boundary:** Agent Runtime -> Tool Gateway

**Impact:** Unauthorized data access, unauthorized actions, system compromise.

**Mitigations:**
- Authorization check before every tool invocation
- Tool parameter validation against schema
- Tool allowlists per agent role
- Rate limiting on tool invocations
- Audit logging of all tool calls

---

### 3. Document Poisoning

**Threat:** Attacker introduces malicious content into the knowledge base (RAG documents) that contains hidden instructions for the agent.

**Trust boundary:** External Systems -> Tool Gateway (ingestion), Tool Gateway -> Agent Runtime (retrieval)

**Impact:** Agent produces incorrect or harmful outputs based on poisoned context.

**Mitigations:**
- Document provenance tracking
- Input validation on document ingestion
- Separate user-provided content from system instructions in the prompt
- Content integrity verification (checksums, signatures)

---

### 4. SQL Injection via Agent

**Threat:** Agent generates SQL queries from user input without proper parameterization, enabling SQL injection.

**Trust boundary:** Agent Runtime -> Tool Gateway -> External Systems (database)

**Impact:** Unauthorized data access, data modification, data exfiltration.

**Mitigations:**
- Semantic layer between agents and databases (agents never write raw SQL)
- Parameterized query execution
- Read-only database connections for analytical queries
- Query result row limits
- SQL validation/sanitization layer

---

### 5. Cross-Tenant Data Leakage

**Threat:** Agent or system error exposes one tenant's data to another tenant.

**Trust boundary:** All boundaries (tenant isolation must be enforced at every layer)

**Impact:** Privacy violation, compliance failure, trust destruction.

**Mitigations:**
- Tenant ID in every query/operation (enforced at the infrastructure level)
- Row-level security in databases
- Authorization checks that verify tenant membership
- Separate embedding namespaces per tenant
- Regular cross-tenant isolation testing

---

### 6. Memory Poisoning

**Threat:** Attacker manipulates agent memory (conversation history, learned facts) to influence future behavior.

**Trust boundary:** Agent Runtime (internal state corruption)

**Impact:** Agent produces biased or incorrect outputs in future sessions.

**Mitigations:**
- Memory entries require provenance (who/when/what source)
- Memory review/approval for persistent facts
- Memory isolation between tenants
- Periodic memory validation
- Ability to purge/reset memory

---

### 7. Model Exfiltration / Extraction

**Threat:** Attacker uses repeated queries to extract information about the system prompt, tool schemas, or model behavior.

**Trust boundary:** Internet -> API Gateway (repeated probing)

**Impact:** Intellectual property theft, system mapping for future attacks.

**Mitigations:**
- Rate limiting
- Anomaly detection on query patterns
- System prompt protection (avoid echoing system instructions)
- Tool schema exposure limited to authorized users

---

### 8. Excessive Agency

**Threat:** Agent has more permissions/capabilities than necessary for its task, enabling unintended actions.

**Trust boundary:** Agent Runtime -> Tool Gateway (over-permissioned agent)

**Impact:** Agent causes harm through actions it shouldn't have been able to take.

**Mitigations:**
- Least-privilege tool access per agent
- Action approval workflows for high-impact operations
- Agent capability boundaries defined at registration
- Budget/rate limits per agent
- Human-in-the-loop for destructive actions

---

### 9. Malicious MCP Servers

**Threat:** A compromised or malicious MCP server provides harmful tool implementations, exfiltrates data, or injects malicious context.

**Trust boundary:** Tool Gateway -> External Systems (compromised MCP server)

**Impact:** Agent executes malicious code, leaks data to external parties.

**Mitigations:**
- MCP server allowlisting
- Tool output validation
- Sandboxed tool execution
- Network isolation for MCP connections
- Audit logging of all MCP interactions

---

### 10. Compromised Tools

**Threat:** A previously trusted tool is compromised (supply chain attack) and begins returning malicious results or exfiltrating data.

**Trust boundary:** Tool Gateway -> External Systems (supply chain compromise)

**Impact:** Data exfiltration, incorrect agent behavior, system compromise.

**Mitigations:**
- Tool integrity verification
- Tool output validation
- Anomaly detection on tool behavior
- Version pinning for tools
- Regular security scanning of tool dependencies

---

### 11. Replay Attacks

**Threat:** Attacker replays a previously valid request to re-execute an action.

**Trust boundary:** Internet -> API Gateway

**Impact:** Duplicate actions, unauthorized re-execution.

**Mitigations:**
- Request nonces / idempotency keys
- Timestamp validation
- Action deduplication in the workflow engine

---

### 12. Forged Approval

**Threat:** Attacker bypasses human approval workflow by forging approval signals.

**Trust boundary:** Internet -> API Gateway (forged approval tokens)

**Impact:** Unauthorized actions executed without genuine approval.

**Mitigations:**
- Approval tokens tied to specific actions (not reusable)
- Multi-factor approval for high-impact actions
- Approval audit trail with identity verification
- Time-bounded approval windows

---

### 13. Secret Leakage

**Threat:** Agent inadvertently includes secrets (API keys, credentials, PII) in responses, logs, or tool parameters.

**Trust boundary:** Agent Runtime -> Internet (leakage in responses), all boundaries (leakage in logs)

**Impact:** Credential compromise, privacy violation.

**Mitigations:**
- Output scanning for secret patterns (regex-based detection)
- Secret injection via environment, not prompt
- Log sanitization
- PII detection and redaction in responses

---

### 14. Insecure Embeddings

**Threat:** Embedding models capture sensitive information that can be extracted through similarity queries.

**Trust boundary:** Tool Gateway -> External Systems (embedding storage), Agent Runtime -> Tool Gateway (similarity search)

**Impact:** Information leakage via vector similarity.

**Mitigations:**
- Tenant-isolated embedding namespaces
- Access control on similarity search results
- Embedding model selection considering information leakage risk

---

### 15. Provenance Tampering

**Threat:** Attacker modifies provenance records to hide evidence of malicious actions or falsify decision trails.

**Trust boundary:** All boundaries (provenance is recorded at every layer)

**Impact:** Audit trail becomes unreliable, accountability is destroyed.

**Mitigations:**
- Append-only provenance stores
- Cryptographic integrity on provenance records
- Separation of duties (agents cannot modify their own provenance)
- Regular provenance integrity verification

---

## OWASP References

- OWASP Top 10 for LLM Applications (2025)
- OWASP Agentic AI Threats
- OWASP Machine Learning Security Top 10

NEEDS VERIFICATION: Confirm current OWASP guidance versions and verify against 2026 material. The agentic AI threat landscape is evolving rapidly -- check for updated OWASP publications, particularly any 2026 revisions to the LLM Top 10, Agentic AI guidance, and any new working groups on AI agent security. Earlier versions may not adequately address trust-boundary concerns in multi-agent systems or MCP-based tool ecosystems.
