# Identity and Federation Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Purpose

This document defines **Identity and Federation** as a first-class architectural capability of the enterprise AI platform. Identity answers the foundational question: **"Who is X, and how did X prove it?"** This question must be resolved before any authorization check, policy evaluation, or domain constraint can execute.

Identity is **Layer 1** in the platform's governance stack (see `architecture/policy-architecture.md` for the four-layer model). It is architecturally distinct from both Authorization (OpenFGA/ReBAC, Layer 2) and Policy (OPA/Cedar, Layer 3), even though all three are tightly integrated at runtime.

---

## Why Identity Is a Separate Architectural Concern

OpenFGA answers **"Can X perform Y on Z?"** — but it assumes X has already been identified and authenticated. OpenFGA has no concept of:

- How X proved their identity (password, SSO, certificate, API key)
- Which identity provider issued X's credentials
- Whether X's session is still valid
- Whether X is a human user, a service account, an AI agent, or a workload
- Whether step-up authentication is required for a sensitive operation
- How X's identity was provisioned or deprovisioned

Without a robust identity layer, the authorization layer operates on unverified claims — a critical security failure in any enterprise system.

```
WITHOUT IDENTITY LAYER:
    "user:jane can view document:report-q4"
    → But who is jane? How do we know this request is actually from jane?
    → What if jane's account was deprovisioned 30 minutes ago?
    → What if this is an agent claiming to act on behalf of jane?

WITH IDENTITY LAYER:
    Request arrives with bearer token
    → Identity layer validates token signature, issuer, expiry, audience
    → Identity layer resolves token to identity: user:jane, tenant:acme
    → Identity layer confirms session is active and not revoked
    → Identity layer confirms authentication strength meets requirement
    → THEN authorization layer checks: "can user:jane view document:report-q4?"
```

---

## The Three-Layer Model: Identity, Authorization, Policy

The platform's governance stack operates as a pipeline. Every request flows through all layers sequentially. If any layer rejects, the request does not proceed.

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: IDENTITY AND FEDERATION                                   │
│                                                                     │
│  WHO is making this request? HOW did they authenticate?             │
│                                                                     │
│  Responsibilities:                                                  │
│  - Authentication (OIDC, OAuth 2.x, SAML 2.0, mTLS, API keys)     │
│  - Identity resolution (map credential to canonical identity)       │
│  - Session management (validity, expiry, revocation)                │
│  - MFA and step-up authentication                                   │
│  - Federation (trust relationships with external IdPs)              │
│  - Identity provisioning and lifecycle (SCIM, directory sync, JIT)  │
│  - Token issuance and validation                                    │
│  - Identity type resolution (user, service, agent, workload)        │
│                                                                     │
│  Output: Verified identity context                                  │
│  Rejection: 401 Unauthorized                                        │
│                                                                     │
│  THIS DOCUMENT covers this layer.                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ identity established
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: RELATIONSHIP AUTHORIZATION (ReBAC — OpenFGA)             │
│                                                                     │
│  CAN this identity perform this action on this resource?            │
│  See: architecture/authorization-architecture.md                    │
│  Rejection: 403 Forbidden                                           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ authorized
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: POLICY EVALUATION (ABAC — OPA or Cedar)                  │
│                                                                     │
│  SHOULD this action proceed given the current context?              │
│  See: architecture/policy-architecture.md                           │
│  Rejection: 403 Forbidden (with reason)                             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ policy allows
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 4: DOMAIN CONSTRAINTS (Ontology Rules)                      │
│                                                                     │
│  IS this action valid according to business rules?                  │
│  See: architecture/ontology-architecture.md                         │
│  Rejection: 422 Unprocessable Entity (with violations)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Protocols

The platform must support multiple authentication protocols because enterprise customers use different identity infrastructure.

### OpenID Connect (OIDC)

The primary authentication protocol for interactive users and the recommended standard for modern enterprise deployments.

**What it provides:**
- ID Tokens (JWT) containing user identity claims
- Standardized discovery (`/.well-known/openid-configuration`)
- Standardized scopes (`openid`, `profile`, `email`)
- PKCE flow for public clients (SPAs, CLIs)
- Authorization Code flow for confidential clients (backend services)

**Platform use cases:**
- User login to platform UI
- CLI authentication (device code or PKCE flow)
- Receiving identity assertions from customer IdPs

### OAuth 2.x

The authorization delegation framework underlying OIDC. The platform uses OAuth 2.x for:

**OAuth 2.0 / 2.1 flows:**
- Authorization Code + PKCE (interactive users)
- Client Credentials (service-to-service, no user context)
- Device Authorization Grant (CLI and IoT)
- Token Exchange (RFC 8693) — critical for agent delegation (see below)

**Token Introspection (RFC 7662):**
- Real-time validation of opaque tokens
- Required when tokens originate from external IdPs that do not issue JWTs

**Token Revocation (RFC 7009):**
- Immediate session termination
- Required for security incident response

### SAML 2.0

Required for enterprise federation with legacy identity providers. Many large enterprises still operate SAML-based identity infrastructure (Active Directory Federation Services, PingFederate, legacy Okta configurations).

**Platform approach:**
- The platform's identity provider acts as a SAML Service Provider (SP)
- Accepts SAML assertions from customer Identity Providers (IdPs)
- Translates SAML assertions into internal OIDC tokens for downstream consumption
- The rest of the platform never sees SAML — it operates on OIDC tokens exclusively

```
Customer ADFS (SAML IdP)
    │
    │ SAML Assertion
    ▼
Platform Identity Provider (SAML SP + OIDC OP)
    │
    │ OIDC Token (internal)
    ▼
Platform Services (OIDC RP)
```

This SAML-to-OIDC bridge pattern avoids spreading SAML handling throughout the platform.

### Mutual TLS (mTLS)

Used for workload-to-workload authentication within the platform and for service identity verification.

**Platform use cases:**
- Internal service mesh communication
- SPIFFE/SPIRE workload identity verification
- High-security API client authentication

---

## Identity Types

The platform must handle fundamentally different types of identities. Each type has different authentication methods, lifecycle management, and audit characteristics.

### 1. User Identity

Human users who interact with the platform directly.

| Attribute | Description |
|-----------|-------------|
| Authentication | OIDC, SAML (via federation), MFA |
| Provisioning | SCIM, JIT provisioning, manual |
| Lifecycle | Create → active → suspend → deactivate → delete |
| Membership model | A user may be a member of one or more organizations (consultant, auditor, multi-org employee). Identity exists independently of any single organization. |
| Session model | Interactive sessions with expiry and refresh |
| Audit identity | `user:{user_id}` with `org:{org_id}` and `tenant:{tenant_id}` as context |

### 2. Service Account Identity

Non-interactive identities used by backend services, CI/CD pipelines, and integrations.

| Attribute | Description |
|-----------|-------------|
| Authentication | Client Credentials (OAuth 2.0), API keys, mTLS |
| Provisioning | Admin-created, API-created |
| Lifecycle | Create → rotate credentials → deactivate → delete |
| Session model | No interactive session; token-per-request |
| Audit identity | `service:{tenant}:{service_id}` |

### 3. Agent Identity

AI agents have a dual identity model — they have their own registered identity for audit and capability tracking, AND they may act on behalf of a delegating principal (user or service account) or autonomously under their own permissions.

| Attribute | Description |
|-----------|-------------|
| Authentication | Token exchange (delegated modes), registered identity (autonomous mode) |
| Provisioning | Registered in agent registry with capabilities and execution mode |
| Lifecycle | Register → deploy → version → deprecate → decommission |
| Execution modes | User-delegated, service-delegated, autonomous (see Three Agent Execution Modes below) |
| Session model | Scoped to delegating session (delegated modes) or to workflow/schedule (autonomous mode) |
| Audit identity | `agent:{tenant}:{agent_id}` with delegation chain context: `on_behalf_of {principal}` or `autonomous (owner: {owner})` |

**Agent identity is the most architecturally complex identity type.** See the dedicated section below.

### 4. Workload Identity (SPIFFE/SPIRE)

Infrastructure-level identity for services and containers, independent of user or application context.

| Attribute | Description |
|-----------|-------------|
| Authentication | X.509 SVIDs (SPIFFE Verifiable Identity Documents) |
| Provisioning | Automatic via SPIRE attestation (node + workload) |
| Lifecycle | Auto-provisioned, auto-rotated, auto-revoked |
| Session model | Certificate-based, short-lived (minutes to hours) |
| Audit identity | `spiffe://{trust_domain}/{workload_path}` |

**SPIFFE (Secure Production Identity Framework For Everyone)** provides:
- Cryptographic workload identity without secrets management
- Automatic certificate rotation
- Zero-trust networking foundations
- Cross-cluster and cross-cloud identity federation

**SPIRE (SPIFFE Runtime Environment)** is the production implementation.

```
SPIFFE Identity Example:
    spiffe://platform.allotey.ai/agent-runtime/production
    spiffe://platform.allotey.ai/mcp-gateway/production
    spiffe://platform.allotey.ai/temporal-worker/production

These identities are:
- Cryptographically verifiable (X.509 certificates)
- Automatically provisioned (no manual credential management)
- Short-lived (rotated frequently, reducing blast radius of compromise)
- Attestation-based (proven by platform, not configured by humans)
```

---

## Agent Identity: The Hard Problem

Agent identity is the most novel and architecturally significant identity challenge in an AI platform. Traditional identity systems were built for humans and services — agents are neither.

### Agent Identity Model

Every agent always has its own registered identity. In delegated execution modes, the agent additionally carries a delegating principal identity.

```
EVERY AGENT HAS:
┌──────────────────────────────────────────────────────────────────┐
│  AGENT OWN IDENTITY              "Who the agent IS"              │
│                                                                   │
│  agent:acme:analytics-v2         ← Registered identity            │
│  Capabilities: [query, chart]    ← What this agent type can do    │
│  Version: 2.3.1                  ← For audit and rollback         │
│  Tools: [semantic_query, ...]    ← Registered tool access         │
└──────────────────────────────────────────────────────────────────┘

DELEGATED MODES ADDITIONALLY CARRY:
┌──────────────────────────────────────────────────────────────────┐
│  DELEGATING PRINCIPAL IDENTITY   "Who the agent acts for"        │
│                                                                   │
│  user:acme:jane                  ← From token exchange            │
│  Permissions: jane's perms       ← Governance ceiling             │
│  Tenant: acme                    ← Jane's tenant scope            │
│  Session: session_abc123         ← Bound to jane's session        │
└──────────────────────────────────────────────────────────────────┘

AUTONOMOUS MODE HAS NO DELEGATING PRINCIPAL:
┌──────────────────────────────────────────────────────────────────┐
│  agent:acme:nightly-audit-v1     ← Own identity                   │
│  owner: user:acme:finance-admin  ← Accountable human (metadata)   │
│  permissions: explicitly config. ← NOT inherited from owner       │
│  The owner is accountable but is NOT the runtime principal.       │
└──────────────────────────────────────────────────────────────────┘
```

**Per-mode governance:**

```
DELEGATED (user or service):
  ✓ Delegating principal's permissions allow it
  ✓ Agent's declared capability scope allows it
  ✓ Action-specific policy constraints allow it
  Audit: principal → agent (delegation chain recorded)

AUTONOMOUS:
  ✓ Agent's explicitly configured permissions allow it
  ✓ Action-specific policy constraints allow it
  Audit: agent (owner recorded for accountability)
```

### Agent Delegation via Token Exchange

When a user invokes an agent, the platform must create a delegation token that:

1. Proves the user authorized this agent to act
2. Carries the user's identity for permission inheritance
3. Carries the agent's identity for audit attribution
4. Has a limited scope (never broader than the user's permissions)
5. Has a limited lifetime (never outlives the user's session)
6. Can be revoked if the user's session is revoked

**OAuth 2.0 Token Exchange (RFC 8693)** is the protocol mechanism:

```
Step 1: User authenticates, receives user access token
Step 2: Agent runtime requests token exchange:
    POST /oauth/token
    grant_type=urn:ietf:params:oauth:grant-type:token-exchange
    subject_token={user_access_token}
    subject_token_type=urn:ietf:params:oauth:token-type:access_token
    requested_token_type=urn:ietf:params:oauth:token-type:access_token
    actor_token={agent_registration_token}
    actor_token_type=urn:ietf:params:oauth:token-type:jwt
    scope=query:semantic chart:generate

Step 3: Identity provider issues delegation token:
    {
      "sub": "user:acme:jane",
      "act": {
        "sub": "agent:acme:analytics-v2"
      },
      "scope": "query:semantic chart:generate",
      "tenant": "acme",
      "exp": 1723567890,
      "delegation_id": "del_abc123",
      "session_binding": "session_abc123"
    }
```

### Agent-to-Agent Delegation Chains

When agents invoke other agents (via A2A or internal orchestration), the delegation chain extends:

```
user:jane → agent:orchestrator → agent:analytics → tool:semantic_query

Delegation chain in token:
{
  "sub": "user:acme:jane",
  "act": {
    "sub": "agent:acme:analytics-v2",
    "act": {
      "sub": "agent:acme:orchestrator-v1"
    }
  }
}
```

**Critical constraint from AGENTS.md Rule 13:** Authorization Before Tool Execution. At every step in the delegation chain, every applicable governance layer must independently permit the operation. No agent in the chain can exceed the permissions of the originating principal.

### Three Agent Execution Modes

Agents operate in one of three modes, each with distinct identity and governance characteristics:

**Mode 1: User-Delegated** — Agent acts on behalf of an interactive user session. The user's identity is carried via token exchange (RFC 8693). The agent cannot exceed the user's permissions.

**Mode 2: Service-Delegated** — Agent acts on behalf of a service account (CI/CD pipeline, scheduled job, webhook-triggered integration). The service account's identity is the delegating principal. Same governance as user-delegated.

**Mode 3: Autonomous** — Agent operates under its own registered identity without an active delegating session. Scheduled tasks, background processing, event-driven agents. These agents:

- Have their own identity (not delegated)
- Have explicitly configured permissions (not inherited from a user or service account)
- Must have bounded permissions (principle of least privilege)
- Must be auditable to a registered human owner (the human who registered/deployed them)
- Must have explicit approval for the autonomous mode and its permission set

```
AUTONOMOUS AGENT IDENTITY:
    agent:acme:nightly-reconciliation-v1
    mode: autonomous
    owner: user:acme:finance-admin     (accountable human)
    permissions: explicitly configured, reviewed, and approved
    schedule: cron-based trigger
    audit: all actions attributed to agent identity + registered owner
    controls: permission ceiling, execution budget, kill switch
```

**Key constraint:** Autonomous agents are NOT ungoverned. They operate under explicit, bounded permissions with a registered human owner who is accountable for the agent's actions. The platform must support periodic review of autonomous agent permissions.

---

## Directory and Provisioning

### SCIM (System for Cross-domain Identity Management)

SCIM provides standardized APIs for identity provisioning and deprovisioning. Enterprise customers expect to manage platform users through their existing identity governance systems.

**Required SCIM operations:**
- Create user (provisioning from HR system or IdP)
- Update user attributes (role changes, department changes)
- Deactivate/delete user (offboarding — critical for security)
- Group management (sync organizational structure)
- Bulk operations (initial onboarding of large tenants)

**Why SCIM matters architecturally:**
- Without SCIM, user lifecycle is manual — leading to orphaned accounts
- Deprovisioning must cascade: disable user → revoke sessions → revoke agent delegations → restrict data access
- SCIM is the integration point with enterprise HR/identity systems (Workday, SAP SuccessFactors, Azure AD, Okta)

### Directory Sync

Some enterprises require continuous synchronization of their organizational directory with the platform:

- Organizational structure (departments, teams, reporting lines)
- Group memberships
- Role assignments
- Custom attributes

Directory sync enables the authorization layer (OpenFGA) to reflect the current organizational state without manual updates.

### Just-In-Time (JIT) Provisioning

Users authenticated via SAML or OIDC federation may not exist in the platform until their first login. JIT provisioning creates the user account on first authentication:

```
User authenticates via federated IdP (first time)
    → Identity provider validates SAML/OIDC assertion
    → Platform checks: does user exist locally? NO
    → JIT provisioning creates user with attributes from assertion
    → Default role/group assignment based on assertion claims
    → User is now active in the platform
    → Subsequent logins skip provisioning
```

**Architectural consideration:** JIT provisioning must also create the user in OpenFGA (authorization tuples) and any other systems that need to know about the user.

---

## External Identity and Account Linking

### The Problem: Identity Collision

The platform supports multi-organization membership. A user may authenticate through different identity providers for different organizations:

```
Organization A IdP (Entra/Azure AD)
    sub = 78291
    email = jane@example.com

Organization B IdP (Okta)
    sub = AABB3
    email = jane@example.com
```

**Are these the same person?** The platform must NEVER assume yes based solely on email. Email addresses can be:
- Reassigned (employee leaves, new employee gets the same address)
- Spoofed (in misconfigured IdPs)
- Shared (service mailboxes)
- Subject to domain takeover attacks

### Canonical External Identity Key

External identities are anchored to the authoritative `issuer + subject` pair, not to email:

```
ExternalIdentity:
    issuer:        "https://login.microsoftonline.com/org-a-tenant"
    subject:       "78291"
    provider_type: "oidc"
    email_hint:    "jane@example.com"    (informational, NOT authoritative)
    linked_to:     principal:p_123       (explicit, verified link)
```

### Principal and External Identity Model

A platform principal (the canonical identity) can have multiple external identities explicitly linked to it:

```
Principal: p_123 (canonical platform identity)
    │
    ├── ExternalIdentity: Entra Org A / sub 78291
    │   └── linked_at: 2025-01-15, link_method: first_login_jit
    │
    ├── ExternalIdentity: Okta Org B / sub 4721
    │   └── linked_at: 2025-03-22, link_method: admin_verified
    │
    └── ExternalIdentity: platform passkey / credential X
        └── linked_at: 2025-01-15, link_method: self_registered
```

### Account Linking Rules

| Rule | Rationale |
|------|-----------|
| **Never auto-merge on email alone** | Email is not a stable, unique, verified identity key |
| **Issuer + subject is authoritative** | This is the identity assertion the IdP signs |
| **Explicit linking required** | Admin verification, self-service verification flow, or SCIM correlation |
| **Link is auditable** | Who linked, when, by what method |
| **Unlinking must be supported** | If a link was made in error, it must be reversible |
| **Orphaned externals create new principals** | If no link exists, a new principal is created (JIT) |

### Account Linking Methods

| Method | Trust Level | Use Case |
|--------|-------------|----------|
| **JIT first-login** | Low | New user from a trusted IdP; creates new principal unless admin pre-linked |
| **SCIM correlation** | Medium | HR system pre-provisions user with external identity mapping |
| **Admin-verified** | High | Platform or org admin explicitly links two external identities to one principal |
| **Self-service verification** | Medium | User proves ownership of second identity (e.g., by authenticating through both IdPs) |

### Research Questions (Account Linking)

1. **Identity collision detection:** How does the platform detect when two external identities might represent the same person? What heuristics are safe (e.g., SCIM employee ID match) vs. unsafe (email match)?
2. **IdP migration:** When an organization migrates from one IdP to another (e.g., ADFS to Entra), how are existing external identities remapped to the new issuer+subject?
3. **Domain takeover protection:** If an attacker gains control of a domain (e.g., registers an expired corporate domain), how does the platform prevent them from impersonating users via email-based linking?
4. **Duplicate principal reconciliation:** If two principals are created for the same human (due to separate JIT provisioning from different orgs), what is the merge/reconciliation process? What happens to audit trails?

---

## MFA and Step-Up Authentication

### Multi-Factor Authentication (MFA)

The platform must support MFA for user authentication:

**MFA methods:**
- TOTP (Time-based One-Time Password) — Google Authenticator, Authy
- WebAuthn / FIDO2 — hardware security keys, biometrics (platform authenticators)
- Push notifications — mobile app approval
- SMS/Email OTP — fallback (weaker, but sometimes required)

**MFA enforcement levels:**
- Tenant-wide: all users in a tenant must use MFA
- Role-based: admin roles require MFA, viewer roles do not
- Conditional: MFA required when accessing from unknown devices/locations

### Step-Up Authentication

Certain operations may require re-authentication even within an active session. This is **step-up authentication** — the identity layer demands a higher assurance level before proceeding.

```
STEP-UP AUTHENTICATION FLOW:

User is authenticated (session active, MFA completed at login)
    │
    ▼
User requests high-risk action:
    "Delete all records in dataset X"
    "Approve payment of $500,000"
    "Export PII data"
    │
    ▼
Policy layer (Layer 3) evaluates:
    "action.risk_level = HIGH AND session.auth_strength < REQUIRED_LEVEL"
    → Result: STEP_UP_REQUIRED
    │
    ▼
Identity layer re-authenticates user:
    → Re-enter password
    → Complete MFA challenge
    → Biometric verification
    │
    ▼
Session auth_strength elevated
    │
    ▼
Action proceeds through remaining layers
```

**Why step-up matters for AI platforms:** An agent acting on behalf of a user should NOT be able to perform step-up-protected actions automatically. If an action requires step-up authentication, the agent must pause execution and request human re-authentication. This is a natural integration point with the workflow layer (durable workflow pauses for human input — see `architecture/workflow-architecture.md`).

---

## Enterprise Federation

Federation allows the platform to trust identity assertions from customer-managed identity providers. This is essential for enterprise adoption — no enterprise will require their employees to create separate credentials for every SaaS platform.

### Federation Architecture

```
┌──────────────────────────────────────┐
│  CUSTOMER IDENTITY INFRASTRUCTURE     │
│                                      │
│  Active Directory / Azure AD         │
│  Okta                                │
│  PingFederate                        │
│  Google Workspace                    │
│  OneLogin                            │
│  Custom SAML/OIDC IdP               │
└───────────────┬──────────────────────┘
                │
                │ SAML 2.0 or OIDC
                │
                ▼
┌──────────────────────────────────────┐
│  PLATFORM IDENTITY PROVIDER          │
│                                      │
│  - Federation broker                 │
│  - Protocol translation (SAML→OIDC)  │
│  - Token issuance (internal OIDC)    │
│  - Session management                │
│  - MFA enforcement                   │
│  - SCIM endpoint                     │
│  - User directory                    │
└───────────────┬──────────────────────┘
                │
                │ Internal OIDC tokens
                │
                ▼
┌──────────────────────────────────────┐
│  PLATFORM SERVICES                   │
│                                      │
│  AI Gateway, Agent Runtime,          │
│  MCP Gateway, etc.                   │
│  (all consume internal OIDC tokens)  │
└──────────────────────────────────────┘
```

### Multi-Tenant Federation

Each tenant can have its own federation configuration:

```
Tenant: acme
    IdP: Azure AD (OIDC)
    Domain: @acme.com
    MFA: Required
    SCIM: Enabled
    JIT: Enabled

Tenant: globex
    IdP: PingFederate (SAML 2.0)
    Domain: @globex.com
    MFA: Required for admins
    SCIM: Disabled (manual provisioning)
    JIT: Enabled

Tenant: initech
    IdP: Okta (OIDC)
    Domain: @initech.com, @initech.co.uk
    MFA: Required (WebAuthn only)
    SCIM: Enabled
    JIT: Enabled
```

### Federation Trust Model

- The platform trusts the customer IdP to authenticate users correctly
- The platform does NOT trust the customer IdP for authorization (authorization is managed internally via OpenFGA)
- The platform maps IdP claims (groups, roles, attributes) to internal authorization structures — but the mapping is configured by the platform, not dictated by the IdP
- Federation is per-tenant — one tenant's IdP configuration cannot affect another tenant

---

## Session Management and Session Policy

### Session Types

| Session Type | Initiated By | Lifetime | Storage | Revocation |
|-------------|-------------|----------|---------|------------|
| User interactive session | OIDC login | Hours (configurable per tenant) | Server-side session store | Immediate on logout, IdP signal, or admin action |
| API session | Client Credentials | Token lifetime (minutes) | Stateless (JWT validation) | Token revocation endpoint |
| Agent delegation session | Token exchange | Bounded by user session | Server-side, linked to parent | Cascading from parent session |
| Workload identity | SPIRE attestation | Certificate lifetime (minutes–hours) | Certificate-based | Certificate revocation |

### Session Policies

Session behavior is configurable per tenant and per role:

```
SESSION POLICY: tenant:acme (default)
    max_session_duration: 8h
    idle_timeout: 30m
    concurrent_sessions: 3
    session_binding: ip_range (optional)
    mfa_session_duration: 12h (before MFA re-prompt)

SESSION POLICY: tenant:acme (admin role)
    max_session_duration: 4h
    idle_timeout: 15m
    concurrent_sessions: 1
    session_binding: ip_range (required)
    mfa_session_duration: 4h
```

### Session Revocation Cascade

When a user session is revoked (logout, admin action, IdP signal, security event), all dependent sessions must be revoked:

```
User session revoked
    │
    ├── All active agent delegation tokens invalidated
    │   ├── Running agent tasks receive cancellation signal
    │   └── Pending agent actions are aborted
    │
    ├── All active MCP tool sessions terminated
    │
    ├── Refresh tokens invalidated
    │
    └── Audit record created: session_revoked
```

---

## Token Architecture

The platform uses multiple token types, each serving a specific purpose.

### Token Types

| Token | Format | Lifetime | Purpose | Contains |
|-------|--------|----------|---------|----------|
| **ID Token** | JWT (signed) | Short (minutes) | Proves user identity after OIDC authentication | User claims (sub, email, name, tenant, groups) |
| **Access Token** | JWT (signed) or opaque | Short (minutes–hours) | Authorizes API access | Subject, scope, audience, tenant, expiry |
| **Refresh Token** | Opaque | Long (hours–days) | Obtains new access tokens without re-authentication | Reference to session; stored server-side |
| **Agent Delegation Token** | JWT (signed) | Short (minutes) | Agent acts on behalf of user | Subject (user), actor (agent), scope, delegation_id, session_binding |
| **Service Token** | JWT (signed) | Short (minutes) | Service-to-service authentication | Client ID, scope, audience |
| **SPIFFE SVID** | X.509 certificate | Short (minutes–hours) | Workload identity verification | SPIFFE ID, trust domain, public key |

### Token Security Requirements

1. **Access tokens are short-lived** — minutes, not hours. This limits blast radius of token theft.
2. **Refresh tokens are server-side** — opaque references, not self-contained JWTs. Revocation is immediate.
3. **Agent delegation tokens are scope-limited** — never broader than the delegating user's permissions.
4. **Agent delegation tokens are session-bound** — if the user session dies, the delegation dies.
5. **All JWTs are signed** — RSA or ECDSA signatures, verified by consumers.
6. **No sensitive data in token payloads** — tokens carry identity references, not credentials or PII.
7. **Token rotation** — signing keys are rotated regularly; JWKS endpoint serves current and previous keys.

### Token Validation Flow

```
Request arrives with bearer token
    │
    ├── Is token format valid? (JWT structure) → NO → 401
    │
    ├── Is token signature valid? (verify against JWKS) → NO → 401
    │
    ├── Is token expired? (check exp claim) → YES → 401
    │
    ├── Is token audience correct? (aud matches this service) → NO → 401
    │
    ├── Is token issuer trusted? (iss matches known issuer) → NO → 401
    │
    ├── Is token revoked? (check revocation list/introspection) → YES → 401
    │
    ├── Is session still active? (for session-bound tokens) → NO → 401
    │
    └── Token valid → Extract identity context → Proceed to Layer 2
```

---

## How Identity Relates to Authorization and Policy

### Clear Boundaries

| Question | Layer | Technology |
|----------|-------|-----------|
| Who is this user? | Identity (Layer 1) | OIDC/SAML/SPIFFE |
| Is this token valid? | Identity (Layer 1) | Token validation |
| Has this user completed MFA? | Identity (Layer 1) | Session attributes |
| Is this agent's delegation valid? | Identity (Layer 1) | Token exchange |
| Can this user view this document? | Authorization (Layer 2) | OpenFGA |
| Can this agent use this tool? | Authorization (Layer 2) | OpenFGA |
| Is this request within rate limits? | Policy (Layer 3) | OPA/Cedar |
| Does this data transfer comply with GDPR? | Policy (Layer 3) | OPA/Cedar |
| Can an employee approve their own expense? | Domain (Layer 4) | Ontology Rules |

### Identity Context Flows Into Authorization

The identity layer produces a verified **identity context** that the authorization layer consumes:

```
Identity Context (produced by Layer 1):
{
  "subject_type": "user",
  "subject_id": "user:acme:jane",
  "tenant_id": "acme",
  "authentication_method": "oidc",
  "authentication_strength": "mfa_completed",
  "session_id": "session_abc123",
  "groups": ["engineering", "ml-team"],
  "acting_as": null,  // or agent identity if delegated
  "delegation_chain": [],
  "ip_address": "10.0.1.42",
  "device_fingerprint": "fp_xyz789"
}
```

OpenFGA (Layer 2) uses `subject_id` and `subject_type` to evaluate relationship tuples. OPA/Cedar (Layer 3) uses additional attributes like `authentication_strength` and `ip_address` to evaluate contextual policies.

---

## Technology Candidates

All technologies below are candidates for research. None are selected. Selection requires evaluation against platform requirements and AGENTS.md rules (especially Rule 5: Interfaces Over Vendor Coupling and Rule 2: No Unvetted Dependencies).

### Keycloak

| Attribute | Details |
|-----------|---------|
| **License** | Apache 2.0 |
| **Maintainer** | Red Hat / Community |
| **Maturity** | Very high — widely deployed in enterprise |
| **Protocols** | OIDC, OAuth 2.0, SAML 2.0, LDAP |
| **Federation** | Identity brokering with external IdPs |
| **Provisioning** | SCIM (via extension), LDAP sync, JIT |
| **MFA** | TOTP, WebAuthn, Kerberos, custom authenticators |
| **Multi-tenancy** | Realm-per-tenant model |
| **Token exchange** | Supported (RFC 8693) |
| **Customization** | Extensive — themes, authenticator SPIs, event listeners |
| **Concerns** | Heavyweight (Java/Quarkus), complex to operate at scale, realm-per-tenant can have performance implications at high tenant counts |

### Ory (Kratos + Hydra + Oathkeeper)

| Attribute | Details |
|-----------|---------|
| **License** | Apache 2.0 |
| **Maintainer** | Ory Corp / Community |
| **Maturity** | Moderate — production-ready, growing adoption |
| **Architecture** | Headless — API-first, no built-in UI |
| **Components** | Kratos (identity), Hydra (OAuth2/OIDC), Oathkeeper (access proxy) |
| **Protocols** | OIDC, OAuth 2.0 (via Hydra) |
| **Federation** | Social login, OIDC federation (SAML support limited) |
| **Provisioning** | API-based (no native SCIM — would need adapter) |
| **MFA** | TOTP, WebAuthn (via Kratos) |
| **Multi-tenancy** | Not native — requires architectural overlay |
| **Token exchange** | Supported via Hydra |
| **Concerns** | SAML support gaps, no native SCIM, multi-tenancy requires custom engineering, multiple components to operate |

### ZITADEL

| Attribute | Details |
|-----------|---------|
| **License** | Apache 2.0 |
| **Maintainer** | ZITADEL / Community |
| **Maturity** | Moderate — newer but purpose-built for multi-tenancy |
| **Architecture** | Single binary, event-sourced |
| **Protocols** | OIDC, OAuth 2.0, SAML 2.0 |
| **Federation** | OIDC and SAML identity brokering |
| **Provisioning** | Native SCIM support |
| **MFA** | TOTP, WebAuthn, passwordless |
| **Multi-tenancy** | First-class — organizations/projects model |
| **Token exchange** | Supported (RFC 8693) |
| **Concerns** | Smaller community, less ecosystem integration, event-sourced architecture may have operational learning curve |

### Authentik

| Attribute | Details |
|-----------|---------|
| **License** | Custom — **requires verification** |
| **Maintainer** | Authentik Security / Community |
| **Maturity** | Moderate — popular in self-hosted/homelab community |
| **Protocols** | OIDC, OAuth 2.0, SAML 2.0, LDAP, RADIUS, SCIM |
| **Federation** | SAML and OIDC brokering |
| **MFA** | TOTP, WebAuthn, Duo, SMS |
| **Multi-tenancy** | Tenant isolation via brands/tenants |
| **Concerns** | **License must be verified** — not standard Apache 2.0. Previous versions used non-OSI licenses. Check `licensing/` guidelines and verify current LICENSE file before any use beyond study |

### Auth0 / Okta / Commercial Options

| Attribute | Details |
|-----------|---------|
| **License** | Commercial / Proprietary |
| **Maturity** | Very high — industry-leading |
| **Strengths** | Feature-complete, managed service, enterprise support |
| **Weaknesses** | Vendor lock-in, per-user pricing can be expensive at scale, less control over customization |
| **Platform consideration** | If the platform is meant to be self-hostable (see `architecture/deployment-architecture.md`), a commercial IdP creates a dependency that self-hosting customers must also license or replace. This may violate AGENTS.md Rule 5 (Interfaces Over Vendor Coupling) |

### Comparison Matrix (To Be Completed)

| Capability | Keycloak | Ory | ZITADEL | Authentik | Auth0 |
|-----------|----------|-----|---------|-----------|-------|
| License (Apache 2.0) | Yes | Yes | Yes | **VERIFY** | No |
| OIDC | Yes | Yes | Yes | Yes | Yes |
| SAML 2.0 | Yes | Limited | Yes | Yes | Yes |
| SCIM | Extension | No | Yes | Yes | Yes |
| Token Exchange (RFC 8693) | Yes | Yes | Yes | Verify | Yes |
| Native Multi-tenancy | Realms | No | Yes | Limited | Yes |
| Self-hostable | Yes | Yes | Yes | Yes | No |
| Operational Complexity | High | Medium | Medium | Medium | None (managed) |
| Agent Delegation Support | Needs customization | Needs customization | Needs customization | Needs customization | Needs customization |

**Note:** No existing identity provider natively supports the agent delegation model described in this document. Token exchange (RFC 8693) provides the protocol foundation, but the platform will likely need custom token claims and delegation chain tracking regardless of which provider is chosen.

---

## Research Questions

### Protocol and Standards

1. **Token Exchange depth:** How well do the candidate identity providers support RFC 8693 Token Exchange, specifically the `act` claim for delegation chains? What customization is required to embed agent identity in delegation tokens?

2. **SAML-to-OIDC bridge reliability:** What are the edge cases and failure modes when translating SAML assertions to OIDC tokens? How are attribute mappings handled when SAML claims do not map cleanly to OIDC scopes?

3. **SPIFFE/SPIRE integration:** How does SPIFFE/SPIRE workload identity integrate with the chosen identity provider? Can the identity provider issue SVIDs, or is SPIRE a separate infrastructure component?

### Agent Identity

4. **Agent delegation token design:** What claims should the agent delegation token carry? How deep can delegation chains go before the token becomes unwieldy or the layered governance checks become too restrictive?

5. **Autonomous agent identity governance:** How should autonomous agents (no active user session) be governed? Who is accountable for their actions? How are their permissions reviewed and audited?

6. **Agent session binding:** When a user session expires or is revoked, how quickly must agent delegation tokens be invalidated? Is eventual consistency acceptable, or must revocation be synchronous?

### Enterprise Federation

7. **Tenant IdP onboarding:** What is the operational process for onboarding a new tenant's identity provider? How much of this can be self-service vs. requiring platform team involvement?

8. **Multi-domain tenants:** How does the platform handle tenants with multiple email domains or multiple identity providers (e.g., a company with subsidiaries using different IdPs)?

9. **IdP failover:** If a customer's identity provider is unavailable, what happens to their users? Should the platform cache identity decisions? What are the security implications?

### Operational

10. **Identity provider HA:** What is the high-availability architecture for the identity provider? Since identity is on the critical path of every request, identity provider downtime means platform downtime.

11. **Migration path:** If the platform starts with one identity provider and needs to switch, what is the migration path? How are existing sessions, tokens, and federation configurations migrated?

12. **Credential storage security:** Where are user credentials stored (for users who authenticate directly, not via federation)? What hashing algorithms are used? How are credential databases backed up and protected?

13. **Compliance implications:** How does the identity layer support SOC 2 (access control, authentication logging), GDPR (right to erasure of identity data), and HIPAA (authentication requirements for healthcare data access)? See `architecture/enterprise-nfr-architecture.md`.

14. **Session telemetry:** How does the identity layer integrate with the observability stack (see `architecture/observability-architecture.md`)? What identity-related metrics and traces should be emitted? Authentication latency, failure rates, federation errors, token exchange volumes.

---

## References

- `architecture/policy-architecture.md` — Four-layer model, Layer 3 (policy evaluation)
- `architecture/authorization-architecture.md` — Layer 2 (OpenFGA, ReBAC)
- `architecture/security-threat-model.md` — Trust boundaries, data classification
- `architecture/secrets-architecture.md` — Credential broker (complementary to identity)
- `architecture/reference-architecture.md` — AI Gateway, Identity box in architecture diagram
- `architecture/observability-architecture.md` — Identity telemetry and audit
- `architecture/deployment-architecture.md` — Self-hostability constraint
- `architecture/enterprise-nfr-architecture.md` — Availability, compliance, data governance
- `architecture/mcp-architecture.md` — MCP security model (identity required for tool access)
- `architecture/event-architecture.md` — Identity events (login, logout, provisioning)
- `open-source/authorization/openfga.md` — OpenFGA research (Layer 2)
- `open-source/authorization/opa.md` — OPA research (Layer 3)
- `AGENTS.md` — Rules 5 (interfaces over vendor coupling), 9 (tenant isolation), 10 (auditability), 13 (authorization before tool execution)
