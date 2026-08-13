# Enterprise Non-Functional Requirements Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Purpose

This document defines the enterprise non-functional requirements (NFRs) that materially influence architecture choices for the AI platform. These are NOT implementation details — they are **architectural constraints** that must be considered from the beginning. Retrofitting NFRs into a system that was not designed for them is expensive, error-prone, and sometimes impossible.

Each NFR category below includes: what it means, why it matters architecturally, how it influences specific design decisions, and open research questions.

**Foundational constraint from `AGENTS.md` Rule 6:** The platform must be enterprise-grade. Enterprise-grade does not mean "lots of microservices." It means predictable contracts, isolation, governance, security, lifecycle management, observability, upgradeability, extensibility, reliability, and evidence that the platform behaves correctly.

---

## NFR-to-Architecture Influence Matrix

This table summarizes how each NFR category drives specific architecture decisions. Detailed discussion follows in each section.

| NFR Category | Architectural Implication | Affected Components |
|-------------|--------------------------|---------------------|
| **Availability (99.99%)** | Requires active-active or active-passive redundancy; no single points of failure; health checking at every layer | All — database, identity, agent runtime, gateway, workflow engine |
| **RTO < 1 hour** | Requires automated failover; infrastructure-as-code; pre-provisioned standby environments | Deployment, database, identity provider, workflow state |
| **RPO < 15 minutes** | Requires continuous replication or frequent snapshots; WAL shipping for databases | PostgreSQL, ClickHouse, object storage, event store |
| **Data residency** | May require regional deployment; affects database topology, replication strategy, and CDN configuration | Database, object storage, identity provider, agent runtime |
| **BYOK encryption** | Requires key management integration (KMS); affects all data-at-rest storage; adds operational complexity | PostgreSQL, ClickHouse, object storage, backup systems |
| **Right to erasure (GDPR)** | Requires PII inventory; cascading deletion across all stores; audit of deletion completeness | All data stores, context graph, knowledge store, agent memory, logs |
| **Latency SLOs (< 200ms API)** | Constrains synchronous call chains; may require caching, pre-computation, or async patterns | AI Gateway, authorization (OpenFGA), policy (OPA/Cedar), semantic layer |
| **Rate limiting per tenant** | Requires tenant-aware rate limiting at gateway; per-tenant quota tracking | AI Gateway, model gateway (LiteLLM), MCP gateway |
| **Zero-downtime deployment** | Requires backward-compatible APIs; rolling deployments; database migration strategy that avoids downtime | All services, database schema, API versioning |
| **Audit trail completeness** | Every action must produce an immutable audit record; affects storage, retention, and query performance | Event store, observability, identity, authorization |
| **SOC 2 compliance** | Requires evidence of access control, change management, monitoring, incident response | Identity, authorization, deployment, observability |
| **Multi-region deployment** | Affects data replication, consistency model (eventual vs. strong), and latency characteristics | Database, identity provider, agent runtime, workflow engine |

---

## 1. Availability and Reliability

### 1.1 Availability Targets

Availability is expressed as uptime percentage over a measurement period (typically monthly or annually). Each additional "nine" represents a 10x reduction in allowed downtime and a significant increase in architectural complexity and cost.

| Target | Annual Downtime | Monthly Downtime | Architectural Implication |
|--------|----------------|------------------|--------------------------|
| 99.9% ("three nines") | 8h 45m | 43m 50s | Single-region, redundant components, automated restart |
| 99.95% | 4h 22m | 21m 55s | Single-region, active-passive failover, health-checked load balancing |
| 99.99% ("four nines") | 52m 36s | 4m 23s | Multi-region or active-active, zero-downtime deployment, no single points of failure |
| 99.999% ("five nines") | 5m 15s | 26s | Active-active multi-region, automatic failover, consensus-based systems — extremely expensive |

**Research decision needed:** What availability target does the platform commit to? This decision cascades into every infrastructure choice. A 99.9% target allows simpler architecture than 99.99%.

**Component-specific availability:** Not all components need the same availability target:
- **AI Gateway and Identity Provider** — must match the overall platform SLA (on the critical path of every request)
- **Agent Runtime** — can be slightly lower if failed agent requests are retried
- **Analytical Engine (ClickHouse)** — can be lower if analytics queries are not business-critical
- **Workflow Engine (Temporal)** — must be highly available because it holds durable workflow state

### 1.2 RTO (Recovery Time Objective)

RTO defines the maximum acceptable time to restore service after a failure. It directly determines the failover architecture.

| RTO Target | Required Architecture |
|-----------|----------------------|
| < 5 minutes | Active-active with automatic failover; pre-provisioned standby; no manual intervention |
| < 1 hour | Active-passive with automated failover; infrastructure-as-code for rapid provisioning |
| < 4 hours | Warm standby; semi-automated recovery procedures; documented runbooks |
| < 24 hours | Cold standby; manual recovery from backups; acceptable for non-critical workloads |

**AI platform specificity:** Agent state (in-flight reasoning, tool execution) may not survive failover. The architecture must distinguish between:
- **Durable state** (workflow state in Temporal, authorization tuples in OpenFGA) — must survive failover
- **Ephemeral state** (agent reasoning steps, model context windows) — can be lost and restarted
- **Session state** (user sessions, agent delegation tokens) — must be replicated or reconstructable

### 1.3 RPO (Recovery Point Objective)

RPO defines the maximum acceptable data loss measured in time. It determines the backup and replication strategy.

| RPO Target | Required Architecture |
|-----------|----------------------|
| 0 (zero data loss) | Synchronous replication; consensus-based writes; significant latency impact |
| < 1 minute | Asynchronous streaming replication (WAL shipping); near-zero lag |
| < 15 minutes | Frequent point-in-time backups; WAL archiving |
| < 1 hour | Periodic snapshots; acceptable for analytical/derived data |
| < 24 hours | Daily backups; acceptable for data that can be reconstructed |

**Component-specific RPO:**
- **Transactional data (PostgreSQL):** RPO should be near-zero (async replication with WAL streaming)
- **Authorization state (OpenFGA):** RPO should be near-zero (losing authorization tuples creates security risk)
- **Observability data (Langfuse/ClickHouse):** RPO can be higher (observability data can be regenerated from source systems)
- **Knowledge store (vector embeddings):** RPO can be higher (embeddings can be regenerated from source documents)
- **Event store:** RPO must be near-zero (events are immutable facts — losing them is losing business history)

### 1.4 Disaster Recovery Strategy

Disaster recovery must account for multiple failure scenarios:

| Scenario | Impact | Recovery Strategy |
|----------|--------|-------------------|
| Single component failure | Service degradation | Auto-restart, health check, circuit breaker |
| Availability zone failure | Regional degradation | Multi-AZ deployment, automatic rebalancing |
| Region failure | Full outage | Multi-region failover (if architecture supports it) |
| Data corruption | Data integrity | Point-in-time recovery from backups, WAL replay |
| Security breach | Confidentiality | Incident response, key rotation, credential revocation |

**DR testing:** Disaster recovery that is not tested is not disaster recovery. The architecture must support regular DR drills without affecting production.

### 1.5 Failover Architecture

```
ACTIVE-PASSIVE (SIMPLER — APPROPRIATE FOR 99.9% - 99.95%):

┌─────────────────┐        ┌─────────────────┐
│   REGION A       │        │   REGION B       │
│   (active)       │        │   (passive)      │
│                  │  async │                  │
│  App Services ──────────────  App Services   │
│  PostgreSQL  ──────────────  PostgreSQL      │
│  ClickHouse  ──────────────  ClickHouse      │
│                  │  repl  │                  │
│  ✓ Serves traffic│        │  ✗ Standby       │
└─────────────────┘        └─────────────────┘
    │                           │
    └─── Failover (manual or ───┘
         automated via health checks)


ACTIVE-ACTIVE (COMPLEX — REQUIRED FOR 99.99%+):

┌─────────────────┐        ┌─────────────────┐
│   REGION A       │        │   REGION B       │
│   (active)       │        │   (active)       │
│                  │  sync/ │                  │
│  App Services ──────────────  App Services   │
│  PostgreSQL  ──────────────  PostgreSQL      │
│  ClickHouse  ──────────────  ClickHouse      │
│                  │  repl  │                  │
│  ✓ Serves traffic│        │  ✓ Serves traffic│
└─────────────────┘        └─────────────────┘
    │                           │
    └─── Global Load ───────────┘
         Balancer (DNS/Anycast)

Challenges:
- Write conflicts (which region is authoritative?)
- Consistency model (eventual? strong? per-entity?)
- Data residency (can data replicate across regions?)
```

### 1.6 Health Checking and Self-Healing

Every component must expose health endpoints and participate in automated recovery:

**Health check levels:**
- **Liveness:** "Is the process running?" — if no, restart the container
- **Readiness:** "Can this instance accept traffic?" — if no, remove from load balancer
- **Startup:** "Has initialization completed?" — prevents premature traffic routing
- **Deep health:** "Are all dependencies reachable?" — detects cascading failures

**Self-healing patterns:**
- Automatic restart on liveness failure
- Circuit breaker on dependency failure (see `architecture/policy-architecture.md` — operational policies)
- Automatic scaling on resource pressure
- Automatic failover on AZ/region failure
- Retry with backoff on transient failures

---

## 2. Data Governance

### 2.1 Data Residency and Sovereignty

Data residency requirements dictate WHERE data can be stored and processed. They are driven by regulatory requirements (GDPR, data localization laws) and customer contractual obligations.

**Architectural impact:** Data residency may require the platform to deploy in specific geographic regions, with data isolation guarantees that prevent cross-region data movement.

```
SINGLE-REGION DEPLOYMENT (SIMPLER):
    All data for all tenants in one region
    Appropriate when: all customers are in one jurisdiction
    Risk: Cannot serve customers with conflicting residency requirements

REGIONAL DEPLOYMENT (MODERATE):
    Tenant data stored in tenant's designated region
    Platform control plane may be centralized
    Data plane (databases, storage) is regional
    Appropriate when: customers span 2-3 regions

MULTI-REGION DEPLOYMENT (COMPLEX):
    Full platform deployment per region
    Cross-region communication only for non-data operations
    Appropriate when: strict data sovereignty requirements (e.g., banking, government)
```

**Key question:** Does regional deployment mean separate database instances per region, or can a single database enforce data residency through row-level controls? The answer depends on regulatory interpretation and customer trust.

### 2.2 Encryption

#### Encryption at Rest

All persistent data must be encrypted at rest. This is non-negotiable for enterprise deployments and required by SOC 2, GDPR, HIPAA, and PCI DSS.

**Scope:** Every data store — PostgreSQL, ClickHouse, object storage, Redis (if persistent), backups, WAL archives, log files.

**Approaches:**
- **Storage-level encryption (default):** Cloud provider encrypts the underlying storage (EBS, managed disks). Transparent to the application.
- **Database-level encryption:** Database encrypts data files. More control, but operational overhead.
- **Application-level encryption:** Application encrypts sensitive fields before storage. Most control, but impacts query capability (cannot query encrypted fields).
- **Envelope encryption:** Data encrypted with data encryption key (DEK); DEK encrypted with key encryption key (KEK) from KMS. Standard pattern for BYOK.

#### Encryption in Transit

All network communication must use TLS 1.2+ (prefer TLS 1.3).

**Scope:**
- Client to platform (external) — TLS termination at load balancer or gateway
- Service to service (internal) — mTLS via service mesh or SPIFFE/SPIRE (see `architecture/identity-federation-architecture.md`)
- Platform to external systems — TLS with certificate validation
- Database connections — TLS required, not optional

#### BYOK (Bring Your Own Key) / Customer-Managed Encryption Keys

Enterprise customers may require that their data is encrypted with keys they control. This ensures the platform operator cannot access customer data even with database access.

**Architectural implications:**
- Key management integration with customer KMS (AWS KMS, Azure Key Vault, Google Cloud KMS, HashiCorp Vault)
- Per-tenant encryption keys — data for Tenant A is encrypted with Tenant A's key
- Key rotation must be supported without data re-encryption downtime
- Key revocation by customer must render their data inaccessible
- Backup encryption must also use customer keys

**Complexity warning:** BYOK adds significant operational complexity. It is typically a requirement only for highly regulated industries (banking, healthcare, government). The architecture should SUPPORT BYOK but not require it for all tenants.

### 2.3 Audit Log Retention

All security-relevant events must produce immutable audit logs. Retention periods are driven by compliance requirements.

| Compliance Framework | Minimum Retention | Typical Enterprise Requirement |
|---------------------|-------------------|-------------------------------|
| SOC 2 | 1 year | 1-3 years |
| GDPR | No specific minimum | "As long as necessary" |
| HIPAA | 6 years | 6-7 years |
| PCI DSS | 1 year | 1-3 years |
| Financial regulations (various) | 5-7 years | 7-10 years |

**Architectural implications:**
- Audit logs must be stored in append-only, tamper-evident storage
- Long retention periods require cost-efficient storage tiers (hot → warm → cold → archive)
- Audit logs must be queryable even in cold storage (compliance investigations)
- Audit log deletion must be governed (cannot be deleted before retention period expires)
- Audit logs must survive system failures — they cannot be stored only in the system being audited

**Cross-reference:** Audit log content is defined in `AGENTS.md` Rule 10 (Every AI Action Must Be Auditable) and `architecture/event-architecture.md`.

### 2.4 Legal Hold

Legal hold is the ability to preserve specific data from deletion or modification in response to litigation, regulatory investigation, or internal inquiry.

**Architectural implications:**
- Data subject to legal hold must be exempted from automated retention/deletion policies
- Legal hold must be granular — hold specific tenant's data, specific date range, specific entity types
- Legal hold must be auditable — who placed the hold, when, why
- Legal hold must prevent right-to-erasure requests from deleting held data (GDPR allows exemption for legal proceedings)

### 2.5 PII Deletion / Right to Erasure

GDPR Article 17 requires the ability to delete all personal data for a specific individual upon request. This is architecturally challenging because PII may exist across multiple stores.

**PII locations in the platform:**

| Store | PII Examples | Deletion Challenge |
|-------|-------------|-------------------|
| User directory / Identity provider | Name, email, phone | Straightforward — delete user record |
| Authorization store (OpenFGA) | User relationship tuples | Must remove all tuples referencing the user |
| Context graph | Entity references to the user | Must remove or anonymize references |
| Event store | User as actor in events | Events are immutable — anonymize, do not delete |
| Agent memory | User preferences, session history | Must delete all memory entries for user |
| Knowledge store | Documents uploaded by user | Must delete or retain based on ownership model |
| Observability / traces | User ID in trace spans | Must anonymize or delete |
| Audit logs | User actions | Retention requirements may conflict — anonymize |
| Backups | All of the above | Must handle deletion in backups or accept residual PII |

**Architectural requirement:** The platform needs a **PII registry** — a map of where each user's PII is stored — so that deletion requests can be fulfilled completely. Without this registry, deletion is best-effort, which is not compliant.

### 2.6 Data Retention Policies

Different data types have different retention requirements:

| Data Type | Suggested Retention | Rationale |
|-----------|--------------------|-----------|
| Transactional data | Tenant-configurable (1-7 years) | Business requirements vary |
| Audit logs | Compliance-driven (1-10 years) | See retention table above |
| Observability traces | 30-90 days (hot), 1 year (cold) | Debugging and performance analysis |
| Agent execution logs | 90 days (hot), 1 year (cold) | Agent quality analysis |
| Event store | Indefinite or compliance-driven | Immutable business history |
| Knowledge store documents | Until explicitly deleted | Document lifecycle managed by owner |
| Analytical data | Tenant-configurable | Business intelligence needs |
| Session data | Until session expiry + grace period | No value after session ends |
| Backups | Rolling retention (daily: 7, weekly: 4, monthly: 12) | Recovery and compliance |

**Architectural requirement:** Retention policies must be enforced automatically. Manual retention management will drift and create compliance risk.

### 2.7 Backup Strategy and Restore Testing

**Backup requirements:**
- All persistent data must be backed up
- Backups must be stored in a different failure domain than primary data
- Backups must be encrypted (with the same key management as primary data)
- Backups must be tested regularly — a backup that cannot be restored is not a backup

**Restore testing:**
- Regular automated restore tests (at least monthly)
- Restore to isolated environment (not production)
- Validate data integrity after restore
- Measure restore time against RTO targets
- Document and track restore test results

---

## 3. Performance and Capacity

### 3.1 Latency SLOs per API Surface

Different API surfaces have different latency requirements:

| API Surface | Target P50 | Target P95 | Target P99 | Rationale |
|------------|-----------|-----------|-----------|-----------|
| Authentication / Token validation | < 5ms | < 20ms | < 50ms | On critical path of every request |
| Authorization check (OpenFGA) | < 5ms | < 15ms | < 30ms | On critical path of every request |
| Policy evaluation (OPA/Cedar) | < 2ms | < 10ms | < 20ms | On critical path of every request |
| Platform API (non-AI) | < 50ms | < 200ms | < 500ms | Standard CRUD operations |
| Semantic query (Cube) | < 200ms | < 1s | < 3s | Depends on query complexity |
| Agent response (streaming first token) | < 2s | < 5s | < 10s | Depends on model provider |
| Agent response (complete) | < 10s | < 30s | < 60s | Depends on complexity and tool calls |
| Knowledge retrieval (vector search) | < 100ms | < 300ms | < 500ms | Hybrid search with reranking |
| Event ingestion | < 10ms | < 50ms | < 100ms | High-throughput append |

**Architectural implications:**
- Synchronous call chains must be short. If auth + authz + policy + semantic query are all synchronous, latencies compound.
- Caching is critical for authorization and policy decisions — many checks are repeated frequently with the same inputs.
- Agent latency is dominated by model provider latency — the platform's overhead should be minimal (< 100ms added).

### 3.2 Throughput Targets

**Research question:** What are the throughput targets? These depend on the deployment scale and pricing model. Example ranges:

| Metric | Small Deployment | Medium Deployment | Large Deployment |
|--------|-----------------|-------------------|------------------|
| API requests/second | 100 | 1,000 | 10,000+ |
| Concurrent agent sessions | 10 | 100 | 1,000+ |
| Events ingested/second | 1,000 | 10,000 | 100,000+ |
| Authorization checks/second | 500 | 5,000 | 50,000+ |
| Model API calls/second | 10 | 100 | 1,000+ |

### 3.3 Rate Limiting and Quotas

Rate limiting protects the platform from abuse, prevents noisy-neighbor problems in multi-tenant deployments, and enforces contractual limits.

**Rate limiting dimensions:**
- Per tenant (total platform usage)
- Per user within tenant (individual usage)
- Per agent (prevent runaway agents)
- Per API endpoint (protect specific surfaces)
- Per model provider (respect upstream rate limits — see `open-source/model-gateway/litellm.md`)

**Quota dimensions:**
- Token consumption per tenant/day/month
- API calls per tenant/day/month
- Storage per tenant
- Agent execution minutes per tenant/month
- Number of active agents per tenant

**Architectural implications:**
- Rate limiting must be enforced at the AI Gateway (see `architecture/reference-architecture.md`)
- Quota tracking must be durable (survives restarts) but fast (adds minimal latency)
- Rate limit state must be shared across gateway instances (distributed rate limiting — Redis/Valkey or distributed counter)
- Quota enforcement integrates with cost management (see policy-architecture.md — cost policies)

### 3.4 Capacity Planning Methodology

The platform must support capacity planning — predicting when current infrastructure will be insufficient.

**Required data for capacity planning:**
- Current resource utilization (CPU, memory, disk, network) per component
- Growth trends (request rate, data volume, tenant count)
- Seasonal patterns (if any)
- Per-tenant resource consumption
- Model API cost trends

**Architectural requirement:** The observability stack (see `architecture/observability-architecture.md`) must capture resource utilization metrics at a granularity sufficient for capacity planning.

### 3.5 Autoscaling Strategy

**Horizontal scaling candidates:**
- AI Gateway (stateless — easy to scale)
- Agent Runtime (stateless reasoning — scale based on concurrent sessions)
- Temporal Workers (scale based on workflow backlog)
- MCP Gateway (stateless — scale based on tool invocation rate)

**Vertical scaling candidates:**
- PostgreSQL (scaling reads via replicas is easy; scaling writes is hard)
- ClickHouse (add shards for write throughput; add replicas for read throughput)
- Redis/Valkey (scale reads via replicas; scale writes via cluster sharding)

**Cannot easily scale:**
- OpenFGA (evaluate scaling characteristics — may need read replicas)
- Identity Provider (evaluate scaling characteristics of chosen provider)
- Temporal Server (has its own scaling model — evaluate)

---

## 4. Operational Requirements

### 4.1 Zero-Downtime Deployment

The platform must be deployable without service interruption. This is both a customer expectation and a prerequisite for frequent, safe releases.

**Requirements for zero-downtime deployment:**
- Rolling deployments with health-check gating
- Backward-compatible API changes (new version serves old API contracts)
- Database migrations that do not lock tables or break existing queries
- Feature flags for incremental rollout
- Canary deployments for risk mitigation
- Instant rollback capability

**Database migration strategy:**

| Migration Type | Zero-Downtime Approach |
|---------------|----------------------|
| Add column (nullable) | Safe — existing queries unaffected |
| Add column (NOT NULL with default) | Safe in PostgreSQL 11+ (virtual default) |
| Drop column | Dangerous — remove from code first, then drop after all instances updated |
| Rename column | Dangerous — use add + backfill + code update + drop pattern |
| Add index | Use `CREATE INDEX CONCURRENTLY` (PostgreSQL) |
| Alter column type | Dangerous — use new column + migration pattern |
| Add table | Safe |
| Drop table | Remove all references first, then drop |

### 4.2 Upgrade Compatibility

**The platform upgrade problem:** When the platform is upgraded, do deployed domain packages (see `architecture/domain-package-architecture.md`) continue to work?

**Requirements:**
- Platform API versioning with deprecation policy
- Package compatibility matrix (which package versions work with which platform versions)
- Automated compatibility testing as part of platform CI/CD
- Deprecation warnings before breaking changes
- Migration guides for breaking changes

**Cross-reference:** This directly relates to `AGENTS.md` Rule 6 (enterprise-grade means upgradeability) and the domain package lifecycle in `architecture/domain-package-architecture.md`.

### 4.3 Configuration Management

**Configuration hierarchy:**
1. Platform defaults (hardcoded sensible defaults)
2. Deployment configuration (environment-specific — dev, staging, production)
3. Tenant configuration (per-tenant overrides — rate limits, session policies, feature flags)
4. User preferences (per-user settings within tenant bounds)

**Requirements:**
- Configuration changes must not require restart (hot reload for tenant/user config)
- Configuration changes must be audited
- Configuration must be version-controlled (infrastructure-as-code)
- Sensitive configuration (secrets) must use the credential broker (see `architecture/secrets-architecture.md`)
- Tenant configuration must be isolated — one tenant's configuration change cannot affect another

### 4.4 Incident Response

**Architectural support for incident response:**
- Observability data must be queryable during incidents (see `architecture/observability-architecture.md`)
- Health dashboards must be available even when the platform is degraded
- Circuit breakers must prevent cascading failures
- Tenant isolation must prevent one tenant's incident from affecting others
- Communication channels (status page, alerts) must be independent of the platform itself

### 4.5 Runbook Requirements

**Every operational component must have:**
- Health check endpoints and expected responses
- Common failure modes and recovery procedures
- Scaling procedures (how to add capacity)
- Backup and restore procedures
- Credential rotation procedures
- Dependency map (what this component depends on and what depends on it)

**Architectural implication:** The deployment architecture must be simple enough that runbooks are maintainable. This reinforces `AGENTS.md` Rule 16 (No Premature Microservices) — more services means more runbooks, more failure modes, and more operational complexity.

### 4.6 On-Call Architecture

**Requirements:**
- Automated alerting based on SLO violations (not just threshold breaches)
- Alert routing based on component ownership
- Escalation paths for unacknowledged alerts
- Post-incident review process
- SLO burn-rate alerting (detect when SLO budget is being consumed too fast)

**Architectural implication:** The observability stack must support SLO-based alerting. This is more sophisticated than simple threshold alerting and requires tracking error budgets over time.

---

## 5. Compliance

### 5.1 SOC 2 Implications

SOC 2 is the most common compliance framework for SaaS platforms. It evaluates Trust Service Criteria across five categories. Each has architectural implications.

| SOC 2 Category | Architectural Requirement |
|---------------|--------------------------|
| **Security** | Access control (identity + authorization), encryption, network segmentation, vulnerability management |
| **Availability** | Redundancy, failover, monitoring, capacity planning, incident response |
| **Processing Integrity** | Data validation, error handling, audit trails, provenance |
| **Confidentiality** | Data classification, encryption, access control, tenant isolation |
| **Privacy** | PII handling, consent management, data minimization, right to erasure |

**Specific SOC 2 evidence requirements that affect architecture:**
- **Access reviews:** The identity layer must support periodic access reviews (list all users, their roles, last login)
- **Change management:** All changes to production must be auditable (infrastructure-as-code, deployment logs)
- **Monitoring:** Security events must be logged and reviewed (see `architecture/observability-architecture.md`)
- **Vendor management:** Third-party dependencies (model providers, cloud infrastructure) must be documented and assessed
- **Incident management:** Incident response procedures must be documented and tested

### 5.2 GDPR Implications

| GDPR Requirement | Architectural Implication |
|-----------------|--------------------------|
| Lawful basis for processing | Consent management, contractual basis documentation |
| Right to access (Art. 15) | Must be able to export all data for a specific user |
| Right to erasure (Art. 17) | PII deletion across all stores (see Section 2.5) |
| Right to rectification (Art. 16) | Must be able to correct user data across all stores |
| Data portability (Art. 20) | Must be able to export user data in machine-readable format |
| Data minimization (Art. 5) | Collect only necessary PII; do not store PII longer than needed |
| Privacy by design (Art. 25) | Privacy considerations built into architecture from the start |
| Data breach notification (Art. 33) | Must detect breaches within 72 hours; requires security monitoring |
| Data Protection Impact Assessment | Required for high-risk processing (AI-based decision making qualifies) |
| Cross-border transfers | Data residency requirements (see Section 2.1); adequacy decisions or SCCs |

**AI-specific GDPR concern:** Automated decision-making (Art. 22). If the platform makes decisions that significantly affect individuals (hiring recommendations, credit scoring, etc.), GDPR requires the ability to explain the decision and offer human review. This reinforces `AGENTS.md` Rule 14 (Provenance for Recommendations and Decisions).

### 5.3 Industry-Specific Compliance

#### HIPAA (Healthcare)

| Requirement | Architectural Implication |
|------------|--------------------------|
| PHI (Protected Health Information) handling | Data classification; specific encryption requirements |
| Access logging | All PHI access must be logged with user identity |
| Minimum necessary | Users should access only the PHI they need (enforced by authorization) |
| Business Associate Agreement (BAA) | Contractual, not architectural — but affects vendor selection |
| Breach notification | 60-day breach notification requirement |
| Data retention | Minimum 6-year retention for HIPAA-related records |

#### PCI DSS (Payment Card Industry)

| Requirement | Architectural Implication |
|------------|--------------------------|
| Cardholder data isolation | Network segmentation; dedicated storage with restricted access |
| Encryption of cardholder data | Specific encryption standards; key management requirements |
| Access control | Role-based access; MFA for administrative access |
| Logging and monitoring | Comprehensive audit logs; real-time monitoring |
| Vulnerability management | Regular scanning; patch management |
| Network segmentation | PCI-scoped systems must be isolated from general platform |

**Platform note:** The platform itself may not need PCI DSS compliance unless it directly handles payment card data. However, domain packages that process financial data may bring PCI requirements that the platform must support.

### 5.4 Audit Trail Completeness

**Required audit trail content** (from `AGENTS.md` Rule 10):

| Field | Purpose |
|-------|---------|
| Who initiated the action | User identity (from identity layer) |
| What agent performed it | Agent identity (from identity layer) |
| What tools were called | Tool invocation records |
| What data was accessed | Data access records with entity references |
| What model produced the output | Model identity, version, provider |
| What the outcome was | Action result, error details |
| Timestamp | Precise timestamp with timezone |
| Correlation ID | Links related events across services |
| Tenant ID | Ensures audit data is tenant-scoped |
| Delegation chain | Full chain from user to agent to sub-agent |

**Audit trail properties:**
- **Immutable:** Once written, cannot be modified or deleted (within retention period)
- **Tamper-evident:** Any modification is detectable (hash chains or append-only storage)
- **Queryable:** Must support compliance investigations and access reviews
- **Retained:** According to compliance-driven retention policies
- **Separated:** Audit logs must not be stored solely in the system being audited

---

## NFR Interactions and Trade-offs

NFRs do not exist in isolation. Improving one often degrades another. The architecture must make conscious trade-offs.

| Trade-off | Tension | Architectural Decision Required |
|-----------|---------|-------------------------------|
| Availability vs. Consistency | Higher availability (multi-region active-active) may require eventual consistency | Define consistency requirements per data type |
| Performance vs. Security | Encryption, authorization checks, and policy evaluation add latency | Budget latency across the governance pipeline |
| Data Residency vs. Availability | Regional data isolation limits failover options | Determine if cross-region failover is acceptable under data residency constraints |
| Audit Completeness vs. Performance | Logging every action adds I/O overhead | Determine which actions require synchronous audit vs. async |
| BYOK vs. Operational Simplicity | Customer-managed keys add key management complexity | Offer BYOK as opt-in for tenants that require it |
| Zero-downtime vs. Development Speed | Backward-compatible changes are slower to develop | Invest in migration tooling and API versioning |
| RPO (zero) vs. Latency | Synchronous replication adds write latency | Accept async replication with near-zero RPO for most data |
| Compliance (multiple) vs. Architecture Simplicity | Supporting HIPAA + PCI + GDPR + SOC 2 simultaneously adds complexity | Determine which compliance frameworks are V1 requirements vs. later |

---

## Research Questions

### Availability and Reliability

1. **Target selection:** What availability target should the platform commit to for V1? Is 99.9% sufficient initially, with a path to 99.99%? What changes are needed to move between tiers?

2. **Multi-region necessity:** Do V1 customers require multi-region deployment, or is multi-AZ within a single region sufficient? What is the cost difference?

3. **Failover testing:** How will failover be tested regularly? Can chaos engineering (e.g., Chaos Monkey, Litmus) be integrated into the platform's testing pipeline?

4. **Component availability mapping:** Which components are on the critical path? Can the platform operate in a degraded mode (e.g., agent execution continues but analytics is unavailable)?

### Data Governance

5. **PII registry implementation:** How should the PII registry be implemented? As a metadata service? As annotations in the data catalog? How is it kept in sync as new data stores are added?

6. **BYOK architecture:** What KMS integrations are needed for V1? Can the platform start without BYOK and add it later without data re-encryption?

7. **Backup encryption:** How are backups encrypted in a BYOK model? If a customer revokes their key, are their backups also inaccessible?

8. **Cross-border data transfer:** How does the platform handle data transfer between regions for tenants with strict data residency requirements? Is data replication across regions ever acceptable?

### Performance

9. **Governance pipeline latency budget:** What is the total acceptable latency for the identity → authorization → policy pipeline? How is the latency budget allocated across the three layers?

10. **Authorization caching:** OpenFGA check latency is critical. Can authorization decisions be cached? What invalidation strategy ensures security is not compromised?

11. **Distributed rate limiting:** What is the strategy for distributed rate limiting across multiple gateway instances? Token bucket in Redis? Sliding window? What is the accuracy vs. performance trade-off?

### Operational

12. **Migration tooling:** What tooling supports zero-downtime database migrations? Are there tools that validate migration safety before execution?

13. **SLO definition:** How are SLOs defined, measured, and reported? What observability infrastructure supports SLO-based alerting and error budget tracking?

14. **Runbook automation:** How much of the runbook can be automated? What is the balance between automated recovery and human intervention?

### Compliance

15. **Compliance scope for V1:** Which compliance frameworks must be supported at launch? SOC 2 is likely mandatory. Is GDPR mandatory? HIPAA? PCI DSS?

16. **Compliance evidence automation:** How much compliance evidence can be generated automatically from the observability and audit systems? What requires manual collection?

17. **AI-specific compliance:** Are there emerging AI-specific regulations (EU AI Act, US executive orders) that must be considered? How do they affect the architecture?

18. **Third-party risk:** How are third-party dependencies (model providers, cloud infrastructure) assessed for compliance? What happens if a model provider's compliance posture changes?

---

## References

- `architecture/reference-architecture.md` — Platform architecture overview, AI Gateway
- `architecture/deployment-architecture.md` — Deployment topology, infrastructure components
- `architecture/identity-federation-architecture.md` — Identity layer (Layer 1), session management
- `architecture/authorization-architecture.md` — Authorization layer (Layer 2, OpenFGA)
- `architecture/policy-architecture.md` — Policy layer (Layer 3, OPA/Cedar), four-layer model
- `architecture/observability-architecture.md` — Telemetry, tracing, metrics
- `architecture/event-architecture.md` — Event store, immutable audit events
- `architecture/security-threat-model.md` — Trust boundaries, data classification
- `architecture/secrets-architecture.md` — Credential management
- `architecture/domain-package-architecture.md` — Package lifecycle and upgrade compatibility
- `architecture/knowledge-architecture.md` — Knowledge store (PII implications)
- `architecture/context-graph-architecture.md` — Context graph (PII implications)
- `architecture/runtime-dependency-matrix.md` — Infrastructure component inventory
- `AGENTS.md` — Rules 6 (enterprise-grade), 9 (tenant isolation), 10 (auditability), 14 (provenance), 16 (no premature microservices)
