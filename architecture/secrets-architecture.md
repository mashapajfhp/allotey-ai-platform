# Secrets and Credential Broker Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Purpose

Defines the architecture for secure credential management in an AI-agent platform. Long-lived credentials must NEVER be exposed directly to an LLM or agent runtime.

---

## The Problem

AI agents need to access external systems — databases, APIs, SaaS applications, cloud services. Every access requires credentials. But agents are fundamentally different from traditional applications:

```
TRADITIONAL APPLICATION:
    Application reads DB_PASSWORD from environment variable
        → Connects to database
        → Credential is managed by the deployment system
        → Application is trusted, deterministic code

AI AGENT PLATFORM:
    Agent decides to call an external API
        → Agent reasoning is non-deterministic (LLM-based)
        → Agent may be manipulated by prompt injection
        → Agent-generated code runs in sandboxes
        → Credentials MUST NOT be in the agent's context window
        → Credentials MUST NOT be in environment variables accessible to generated code
        → Credentials MUST be short-lived and minimally scoped
```

**The fundamental rule:** An LLM should never see, process, or have access to raw credentials. The credential broker mediates all access.

---

## Architecture: The Credential Broker Pattern

```
┌────────────────────────────────────────────────────────────────────┐
│                       AGENT RUNTIME                                │
│                                                                    │
│  Agent decides: "I need to query the Salesforce API"               │
│       │                                                            │
│       ▼                                                            │
│  ┌──────────────────────────────────┐                              │
│  │ Authorized Tool Request          │                              │
│  │ - tool: salesforce_query         │                              │
│  │ - operation: read_contacts       │                              │
│  │ - user_context: jane@corp.com    │                              │
│  │ - tenant: tenant_123            │                              │
│  └──────────────┬───────────────────┘                              │
└─────────────────┼──────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────┐
│              CREDENTIAL BROKER                                     │
│                                                                    │
│  1. Verify agent is authorized for this tool (via OpenFGA)         │
│  2. Verify user context has permission for this operation          │
│  3. Retrieve base credential from secrets store                    │
│  4. Generate short-lived, scoped credential                        │
│  5. Return credential with expiry and scope restrictions           │
│                                                                    │
│  ┌──────────────────┐    ┌──────────────────┐                      │
│  │ Policy Engine    │    │ Secrets Store    │                      │
│  │ (authorization)  │    │ (OpenBao/Vault)  │                      │
│  └──────────────────┘    └──────────────────┘                      │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────┐
              │ Short-lived, scoped  │
              │ credential           │
              │ - expires in N min   │
              │ - read-only scope    │
              │ - tenant-scoped      │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ External System      │
              │ (Salesforce API)     │
              └──────────────────────┘
```

**The key flow:**
1. Agent requests an authorized tool operation (never requests a raw credential)
2. Credential Broker verifies authorization (agent + user + tenant)
3. Credential Broker retrieves the base credential from the secrets store
4. Credential Broker generates a short-lived, minimally scoped credential
5. Short-lived credential is used for the specific operation
6. Credential expires automatically

**What the agent NEVER sees:** The base credential, the secrets store, or the credential generation logic.

---

## Credential Types

### 1. API Keys

**Pattern:** Stored in secrets store; Credential Broker wraps API calls rather than exposing the key.
**Scoping:** Rate-limited, operation-scoped proxy.
**Example:** OpenAI API key, Stripe API key, SendGrid API key.

### 2. Database Credentials

**Pattern:** Stored in secrets store; Credential Broker creates short-lived database users or tokens.
**Scoping:** Read-only, schema-limited, row-level security where supported.
**Example:** PostgreSQL credentials, MongoDB connection strings.

### 3. OAuth Refresh Tokens

**Pattern:** Refresh tokens stored in secrets store; Credential Broker exchanges for short-lived access tokens.
**Scoping:** Access tokens have limited scope (read-only, specific resources).
**Example:** Salesforce OAuth, Google Workspace OAuth, Microsoft Graph OAuth.

### 4. MCP Credentials

**Pattern:** Credentials for accessing external MCP servers. Broker handles authentication on behalf of the agent.
**Scoping:** Per-server, per-capability.
**Example:** MCP server authentication tokens.

### 5. LLM API Keys

**Pattern:** Managed by the Model Gateway (LiteLLM), not directly by agents. The Model Gateway itself uses the Credential Broker.
**Scoping:** Per-provider, per-model, budget-limited.
**Example:** Anthropic API key, OpenAI API key, Google AI API key.

### 6. Signing Keys

**Pattern:** Never leave the secrets store. Signing operations are performed by the secrets store itself (transit encryption).
**Scoping:** Purpose-bound (e.g., JWT signing, webhook signature verification).
**Example:** JWT signing key, HMAC keys for webhook verification.

### 7. Encryption Keys

**Pattern:** Never leave the secrets store. Encryption/decryption operations are performed by the secrets store (transit encryption).
**Scoping:** Purpose-bound, tenant-scoped.
**Example:** Data encryption keys, tenant-specific encryption keys.

---

## Security Principles

### 1. Least Privilege
Every credential is scoped to the minimum permissions needed for the specific operation. A credential to read Salesforce contacts does not grant write access.

### 2. Short-Lived
Credentials expire automatically. Default TTL should be minutes, not hours. The credential broker renews as needed.

### 3. Auditable
Every credential issuance is logged — who requested it, what agent, what user context, what scope, when it expires.

### 4. No Credential in Context Window
The LLM's context window NEVER contains raw credentials. The credential broker operates outside the LLM's visibility.

### 5. No Credential in Sandbox
Sandboxed code execution environments (see `architecture/secure-compute-architecture.md`) do not contain credentials as environment variables. If sandboxed code needs external access, the Credential Broker provides a scoped, time-limited credential as a runtime parameter.

### 6. Tenant Isolation
Credentials are tenant-scoped. Tenant A's credentials are cryptographically separated from Tenant B's.

---

## Workload Identity

For service-to-service authentication within the platform (not user-facing credentials):

```
TRADITIONAL:
    Service A has a static API key to call Service B
        → Key is long-lived, not rotated, compromisable

WORKLOAD IDENTITY:
    Service A has a cryptographic identity (SPIFFE)
        → Identity is attested at runtime (this is Service A, running on Node X)
        → Service B validates the identity, not a shared secret
        → No static secrets to leak
```

**SPIFFE/SPIRE** provides this pattern — every platform service gets a cryptographic identity (SVID) that is automatically rotated and attested.

---

## Technology Landscape

> All technologies below require individual deep research.

| Technology | License | Category | Status |
|-----------|---------|----------|--------|
| OpenBao | MPL-2.0 | Secrets management (HashiCorp Vault fork) | NOT STARTED |
| HashiCorp Vault | BSL (source-available) | Secrets management | NOT STARTED |
| SPIFFE/SPIRE | Apache 2.0 | Workload identity framework (CNCF) | NOT STARTED |
| Cloud workload identity | Cloud-specific | AWS IAM roles, GCP workload identity, Azure managed identity | NOT STARTED |
| OAuth token exchange | Standard (RFC 8693) | Token exchange for delegation patterns | NOT STARTED |

### License Warnings

- **OpenBao:** MPL-2.0 (Mozilla Public License). This is acceptable per the project's licensing policy (MPL-2.0 acceptable with discipline), but requires understanding the copyleft obligations — modifications to MPL-licensed files must be shared, but combining with proprietary code is allowed.
- **HashiCorp Vault:** Changed from MPL-2.0 to BSL (Business Source License) in August 2023. BSL is NOT open source — it restricts competitive use. OpenBao is the community fork that maintained the open license. Vault should be studied but OpenBao is the adoption candidate.

---

## Integration with Platform Architecture

### With Agent Runtime
```
Agent wants to call external API
    → Agent invokes authorized tool
        → Tool implementation requests credential from Broker
            → Broker verifies authorization (agent + user + tenant)
                → Broker returns scoped, short-lived credential
                    → Tool uses credential for external call
                        → Credential expires
```

### With Model Gateway (LiteLLM)
```
Model Gateway needs LLM API key
    → Gateway requests credential from Broker at startup
        → Broker provides key with rotation schedule
            → Gateway uses key for model calls
                → Key is rotated automatically
```

### With MCP Gateway
```
Agent accesses external MCP server
    → MCP Gateway requests authentication from Broker
        → Broker provides scoped MCP credentials
            → MCP connection authenticated
```

### With Secure Compute (Sandboxes)
```
Sandboxed code needs external access (rare, controlled)
    → Secure Compute Orchestrator requests credential from Broker
        → Broker provides ultra-short-lived, ultra-scoped credential
            → Credential passed as runtime parameter (NOT env var)
                → Sandbox uses credential
                    → Sandbox destroyed, credential expires
```

### With OpenFGA (Authorization)
```
Credential Broker checks authorization before issuing any credential:
    → "Is this agent authorized to use the salesforce_query tool?"
    → "Is the user this agent represents authorized for read_contacts?"
    → "Does this tenant have Salesforce integration enabled?"

All three must pass before a credential is issued.
```

---

## Research Questions

1. **OpenBao vs. Vault:** Is OpenBao mature enough for production use? What features are missing compared to Vault Enterprise?
2. **SPIFFE/SPIRE complexity:** Is workload identity needed for V1, or can V1 use simpler service-to-service authentication?
3. **Transit encryption:** Should the secrets store handle encryption operations (Vault/OpenBao transit engine), or should encryption be handled separately?
4. **Multi-cloud:** How does the credential broker abstract across cloud providers' native credential management?
5. **Credential rotation:** What is the rotation strategy for different credential types? How does rotation avoid downtime?
6. **Disaster recovery:** How are secrets backed up and recovered? What happens if the secrets store is unavailable?
7. **V1 scope:** Can V1 start with a simpler secrets management approach (e.g., Kubernetes secrets + SOPS) and graduate to OpenBao in V2?

---

## References

- `architecture/reference-architecture.md` — AI/Intelligence Gateway, cross-cutting security
- `architecture/security-threat-model.md` — secret leakage threats
- `architecture/secure-compute-architecture.md` — sandbox credential handling
- `architecture/authorization-architecture.md` — OpenFGA authorization checks
- `architecture/mcp-architecture.md` — MCP server authentication
- `open-source/secrets-identity/README.md` — individual technology research
