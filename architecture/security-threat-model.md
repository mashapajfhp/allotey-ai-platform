# Security Threat Model for AI/Agentic Systems

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Overview

AI/agentic platforms introduce novel attack vectors beyond traditional web application security. This document catalogs threats specific to AI systems, drawing from OWASP LLM Top 10, OWASP Agentic AI, and current security research.

---

## 1. Prompt Injection

**Threat:** Attacker crafts input that overrides system instructions, causing the agent to ignore safety guardrails or execute unintended actions.

**Variants:**
- Direct prompt injection — malicious instructions in user input
- Indirect prompt injection — malicious instructions embedded in retrieved documents, tool outputs, or third-party data

**Impact:** Agent executes unauthorized actions, leaks sensitive data, or bypasses safety controls.

**Mitigations:**
- Input sanitization and validation
- System prompt isolation (model-level if available)
- Output filtering for sensitive data patterns
- Tool invocations require explicit authorization regardless of prompt content
- Never let the LLM be the sole authority for permission decisions

---

## 2. Tool Injection / Privilege Escalation

**Threat:** Attacker manipulates the agent into calling tools it shouldn't, or calling tools with malicious parameters.

**Impact:** Unauthorized data access, unauthorized actions, system compromise.

**Mitigations:**
- Authorization check before every tool invocation
- Tool parameter validation against schema
- Tool allowlists per agent role
- Rate limiting on tool invocations
- Audit logging of all tool calls

---

## 3. Document Poisoning

**Threat:** Attacker introduces malicious content into the knowledge base (RAG documents) that contains hidden instructions for the agent.

**Impact:** Agent produces incorrect or harmful outputs based on poisoned context.

**Mitigations:**
- Document provenance tracking
- Input validation on document ingestion
- Separate user-provided content from system instructions in the prompt
- Content integrity verification (checksums, signatures)

---

## 4. SQL Injection via Agent

**Threat:** Agent generates SQL queries from user input without proper parameterization, enabling SQL injection.

**Impact:** Unauthorized data access, data modification, data exfiltration.

**Mitigations:**
- Semantic layer between agents and databases (agents never write raw SQL)
- Parameterized query execution
- Read-only database connections for analytical queries
- Query result row limits
- SQL validation/sanitization layer

---

## 5. Cross-Tenant Data Leakage

**Threat:** Agent or system error exposes one tenant's data to another tenant.

**Impact:** Privacy violation, compliance failure, trust destruction.

**Mitigations:**
- Tenant ID in every query/operation (enforced at the infrastructure level)
- Row-level security in databases
- Authorization checks that verify tenant membership
- Separate embedding namespaces per tenant
- Regular cross-tenant isolation testing

---

## 6. Memory Poisoning

**Threat:** Attacker manipulates agent memory (conversation history, learned facts) to influence future behavior.

**Impact:** Agent produces biased or incorrect outputs in future sessions.

**Mitigations:**
- Memory entries require provenance (who/when/what source)
- Memory review/approval for persistent facts
- Memory isolation between tenants
- Periodic memory validation
- Ability to purge/reset memory

---

## 7. Model Exfiltration / Extraction

**Threat:** Attacker uses repeated queries to extract information about the system prompt, tool schemas, or model behavior.

**Impact:** Intellectual property theft, system mapping for future attacks.

**Mitigations:**
- Rate limiting
- Anomaly detection on query patterns
- System prompt protection (avoid echoing system instructions)
- Tool schema exposure limited to authorized users

---

## 8. Excessive Agency

**Threat:** Agent has more permissions/capabilities than necessary for its task, enabling unintended actions.

**Impact:** Agent causes harm through actions it shouldn't have been able to take.

**Mitigations:**
- Least-privilege tool access per agent
- Action approval workflows for high-impact operations
- Agent capability boundaries defined at registration
- Budget/rate limits per agent
- Human-in-the-loop for destructive actions

---

## 9. Malicious MCP Servers

**Threat:** A compromised or malicious MCP server provides harmful tool implementations, exfiltrates data, or injects malicious context.

**Impact:** Agent executes malicious code, leaks data to external parties.

**Mitigations:**
- MCP server allowlisting
- Tool output validation
- Sandboxed tool execution
- Network isolation for MCP connections
- Audit logging of all MCP interactions

---

## 10. Compromised Tools

**Threat:** A previously trusted tool is compromised (supply chain attack) and begins returning malicious results or exfiltrating data.

**Impact:** Data exfiltration, incorrect agent behavior, system compromise.

**Mitigations:**
- Tool integrity verification
- Tool output validation
- Anomaly detection on tool behavior
- Version pinning for tools
- Regular security scanning of tool dependencies

---

## 11. Replay Attacks

**Threat:** Attacker replays a previously valid request to re-execute an action.

**Impact:** Duplicate actions, unauthorized re-execution.

**Mitigations:**
- Request nonces / idempotency keys
- Timestamp validation
- Action deduplication in the workflow engine

---

## 12. Forged Approval

**Threat:** Attacker bypasses human approval workflow by forging approval signals.

**Impact:** Unauthorized actions executed without genuine approval.

**Mitigations:**
- Approval tokens tied to specific actions (not reusable)
- Multi-factor approval for high-impact actions
- Approval audit trail with identity verification
- Time-bounded approval windows

---

## 13. Secret Leakage

**Threat:** Agent inadvertently includes secrets (API keys, credentials, PII) in responses, logs, or tool parameters.

**Impact:** Credential compromise, privacy violation.

**Mitigations:**
- Output scanning for secret patterns (regex-based detection)
- Secret injection via environment, not prompt
- Log sanitization
- PII detection and redaction in responses

---

## 14. Insecure Embeddings

**Threat:** Embedding models capture sensitive information that can be extracted through similarity queries.

**Impact:** Information leakage via vector similarity.

**Mitigations:**
- Tenant-isolated embedding namespaces
- Access control on similarity search results
- Embedding model selection considering information leakage risk

---

## 15. Provenance Tampering

**Threat:** Attacker modifies provenance records to hide evidence of malicious actions or falsify decision trails.

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

NEEDS VERIFICATION: Confirm current OWASP guidance versions and check for 2026 updates.
