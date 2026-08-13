# Data Ownership Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## The Fundamental Question

Who owns the data?

An enterprise AI platform does not operate in a vacuum. It sits alongside CRMs, ERPs, data warehouses, operational databases, and SaaS applications that already manage critical business entities. The platform must answer a non-trivial question for every entity it works with: **Is the platform the source of truth, or is something else?**

Getting this wrong produces two failure modes:
1. **Data duplication without clear ownership** -- two systems believe they are authoritative, leading to conflicts, stale reads, and write collisions.
2. **Forced migration** -- requiring all data to move into the platform before AI can operate on it, creating adoption friction and organizational resistance.

The platform must support multiple data ownership modes because different entities, domains, and organizational contexts demand different source-of-truth patterns.

---

## Separating Logical Ownership from Physical Storage

The three operational modes below conflate two independent concerns if not carefully separated:

1. **Who owns the truth?** (source_of_truth / logical_owner) — Which system is authoritative for this entity?
2. **Where do the bytes live?** (physical_store / access_mode) — Where is data stored and how is it accessed?

These are orthogonal. An entity can be logically owned by an external CRM but physically cached in the platform's database. An entity can be logically owned by the platform but physically stored in a customer-managed database.

### Four Dimensions of Data Ownership

Every entity type should declare all four dimensions:

| Dimension | Question | Values |
|-----------|----------|--------|
| **source_of_truth** | Which system is authoritative for writes? | `platform`, `external:{system}` |
| **logical_owner** | Which organizational entity governs this data? | `platform_operator`, `tenant`, `external_system_owner` |
| **physical_store** | Where do the bytes physically reside? | `platform_db`, `external_only`, `platform_cache + external`, `customer_managed_db` |
| **access_mode** | How does the platform read/write this data? | `direct`, `adapter_query`, `local_projection`, `delegated_action` |

### Example: Same Logical Owner, Different Physical Arrangements

```
Entity: Customer
  source_of_truth: external:salesforce      (CRM is authoritative)
  logical_owner:   tenant                    (tenant's data)
  physical_store:  platform_cache + external (projection cached locally)
  access_mode:     local_projection (reads), delegated_action (writes)

Entity: AgentMemory
  source_of_truth: platform                  (platform is authoritative)
  logical_owner:   tenant                    (tenant's data)
  physical_store:  platform_db               (stored in platform)
  access_mode:     direct                    (read/write via platform API)

Entity: ComplianceAuditLog
  source_of_truth: platform                  (platform generates it)
  logical_owner:   platform_operator         (operator governed, tenant scoped)
  physical_store:  customer_managed_db       (BYOK, customer-controlled storage)
  access_mode:     direct                    (write to customer's storage)
```

---

## Three Operational Modes

The three operational modes describe the most common combinations of the four dimensions above. They are shorthands, not the full model.

```
                     ┌──────────────────────────────────────┐
                     │         OPERATIONAL MODES             │
                     └──────────────────────────────────────┘

    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  PLATFORM-MANAGED │  │    FEDERATED     │  │   MATERIALIZED   │
    │                    │  │                  │  │                  │
    │  Platform IS the   │  │  External system │  │  External system │
    │  source of truth.  │  │  owns data.      │  │  owns truth.     │
    │  Full CRUD.        │  │  Platform reads   │  │  Platform caches │
    │  Schema evolution  │  │  through adapters.│  │  a projection.   │
    │  owned by platform.│  │  No duplication.  │  │  Sync mechanism. │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

These are the **common patterns**. Edge cases (e.g., platform as source of truth but stored in customer-managed DB) exist and are handled by the four-dimension model above.

---

### Mode 1: PLATFORM-MANAGED

**Definition:** The AI platform owns entity storage, schema, and lifecycle. The platform's database is the authoritative source of truth. Products and external systems interact with these entities exclusively through platform APIs.

**When to use:**
- The entity is native to the AI platform and has no prior home (agent memories, evaluation datasets, prompt templates, workflow state)
- The platform IS the system of record for this data
- New entities created specifically for AI-driven operations that no existing system manages

**Examples:**
- Agent memory and conversation history
- Evaluation results and quality metrics
- Ontology definitions and compiled artifacts
- Platform-native workflow state
- Prompt version history and A/B test configurations
- Knowledge graph nodes created by the platform itself

**Characteristics:**

| Dimension | Behavior |
|-----------|----------|
| **Reads** | Direct database query; lowest latency |
| **Writes** | Direct mutation through platform API; platform enforces validation, authorization, and audit |
| **Consistency** | Strong consistency; reads always reflect latest writes |
| **Latency** | Lowest; no network hops to external systems |
| **Availability** | Tied to platform infrastructure availability |
| **Schema evolution** | Platform owns migrations; schema changes are versioned and deployed through the platform's migration system |
| **Backup/Recovery** | Platform is responsible for backup, disaster recovery, and data retention |
| **Authorization** | Platform's authorization model (OpenFGA) directly governs access |

**Data flow:**

```
┌──────────────────┐      ┌──────────────────────────────────────┐
│  Product / Agent │ ──── │         PLATFORM API                 │
│                  │      │                                      │
│  read / write    │      │  Validate → Authorize → Persist      │
│  via API         │      │                     │                │
└──────────────────┘      │              ┌──────▼───────┐        │
                          │              │ Platform DB  │        │
                          │              │ (source of   │        │
                          │              │  truth)      │        │
                          │              └──────────────┘        │
                          └──────────────────────────────────────┘
```

---

### Mode 2: FEDERATED

**Definition:** An external system (CRM, ERP, operational database, SaaS application) owns the data. The AI platform does not store a copy. Instead, it reads data at query time through adapters that translate between the platform's ontology model and the external system's schema.

This is conceptually similar to Palantir's approach: ontology objects represent data that physically resides in underlying operational systems. The ontology provides a unified view without requiring data migration.

**When to use:**
- The data already exists in a well-managed operational system
- The external system has established data governance, access controls, and operational processes
- Data freshness is critical -- stale copies are unacceptable
- Regulatory or compliance constraints prohibit copying data to another system
- The cost or risk of data migration outweighs the performance benefit

**Examples:**
- CRM customer records (Salesforce, HubSpot)
- ERP financial data (SAP, NetSuite)
- HR system employee records (Workday, BambooHR)
- Existing relational databases that are the system of record for operational entities
- Regulated data that must remain in its original system for compliance

**Characteristics:**

| Dimension | Behavior |
|-----------|----------|
| **Reads** | Resolved at query time through adapters; higher latency than platform-managed |
| **Writes** | Delegated to the external system through action adapters; platform does not write directly |
| **Consistency** | Delegated consistency -- the external system's consistency model applies |
| **Latency** | Higher; network round-trip to external system per query |
| **Availability** | Dependent on external system availability; adapter must handle degraded modes |
| **Schema evolution** | External system evolves independently; adapters must handle schema drift |
| **Backup/Recovery** | External system's responsibility |
| **Authorization** | Dual authorization -- platform checks its own policies AND respects external system's access controls |

**Data flow:**

```
┌──────────────────┐      ┌──────────────────────────────────────┐
│  Agent / Query   │ ──── │         PLATFORM QUERY ENGINE        │
│                  │      │                                      │
│  "Get customer   │      │  Ontology lookup → Adapter dispatch  │
│   details"       │      │                     │                │
└──────────────────┘      │              ┌──────▼───────┐        │
                          │              │   ADAPTER    │        │
                          │              │   FRAMEWORK  │        │
                          │              └──────┬───────┘        │
                          └─────────────────────┼────────────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │   EXTERNAL SYSTEM     │
                                    │   (CRM / ERP / DB)    │
                                    │   Source of Truth      │
                                    └───────────────────────┘
```

**Adapter Framework Requirements:**

- **Schema mapping:** Translate between ontology property names and external system field names
- **Type coercion:** Convert between platform types and external types (e.g., string dates to timestamps)
- **Query translation:** Convert ontology queries to the external system's query language (SQL, REST parameters, GraphQL, SOQL)
- **Pagination handling:** Manage paginated responses transparently
- **Authentication:** Handle OAuth, API keys, service accounts for external systems
- **Rate limiting:** Respect external system rate limits
- **Error handling:** Graceful degradation when external system is unavailable
- **Circuit breaking:** Prevent cascading failures from external system outages

---

### Mode 3: MATERIALIZED / PROJECTED

**Definition:** An external system owns the authoritative data. The AI platform maintains a local projection (cache, materialized view, or pre-computed representation) optimized for AI operations. The projection is kept in sync through a defined sync mechanism, but it is explicitly NOT authoritative for writes.

This mode exists because AI workloads have access patterns that differ from operational systems. An agent assembling context needs sub-millisecond access to customer profiles, not a 200ms API call to a CRM. But the CRM remains the truth.

**When to use:**
- AI operations require low-latency access to data owned by external systems
- The external system cannot handle the query volume or patterns that AI workloads generate
- Data needs to be pre-processed, enriched, or restructured for AI consumption (e.g., embedding generation, graph construction, metric pre-computation)
- The data is relatively stable (not changing every second) and slight staleness is acceptable
- Multiple AI operations need the same data, making repeated federation queries wasteful

**Examples:**
- Customer profiles cached in the context graph for agent context assembly
- Product catalogs pre-embedded in the vector store for semantic search
- Financial metrics pre-computed and cached for dashboard agents
- Employee org charts materialized in the graph database for relationship queries
- Historical transaction data aggregated for pattern detection

**Characteristics:**

| Dimension | Behavior |
|-----------|----------|
| **Reads** | From local projection; near platform-managed latency |
| **Writes** | NEVER to the projection directly; writes go to the external source, then sync propagates changes |
| **Consistency** | Eventual consistency; staleness bounded by sync policy |
| **Latency** | Low for reads (local); sync latency determined by strategy (seconds for CDC, minutes for polling) |
| **Availability** | Reads available even when external system is down (graceful degradation); writes require external system |
| **Schema evolution** | External system drives schema changes; sync adapters must detect and handle drift |
| **Backup/Recovery** | Projection is rebuildable from source; backup is a convenience, not a necessity |
| **Authorization** | Platform enforces access to the projection; must mirror external system's access model |

**Data flow:**

```
┌──────────────────┐      ┌──────────────────────────────────────┐
│  Agent / Query   │ ──── │         PLATFORM QUERY ENGINE        │
│                  │      │                                      │
│  "Get customer   │      │  Read from local projection          │
│   context"       │      │         │                            │
└──────────────────┘      │  ┌──────▼───────┐                    │
                          │  │  PROJECTION  │ ◄── Sync Engine    │
                          │  │  (context    │         │          │
                          │  │   graph,     │    ┌────▼────┐     │
                          │  │   vector     │    │  SYNC   │     │
                          │  │   store,     │    │ ADAPTER │     │
                          │  │   cache)     │    └────┬────┘     │
                          │  └──────────────┘         │          │
                          └───────────────────────────┼──────────┘
                                                      │
                                          ┌───────────▼───────────┐
                                          │   EXTERNAL SYSTEM     │
                                          │   Source of Truth      │
                                          └───────────────────────┘
```

**Sync Strategies:**

| Strategy | Mechanism | Latency | Use Case |
|----------|-----------|---------|----------|
| **CDC (Change Data Capture)** | Database transaction log tailing (Debezium) | Seconds | Operational databases with log access |
| **Polling** | Periodic API queries for changed records | Minutes | SaaS APIs without webhook/CDC support |
| **Webhook-driven** | External system pushes change notifications | Seconds | SaaS systems with webhook support |
| **On-demand** | Lazy refresh when data is accessed and stale | Variable | Infrequently accessed entities |
| **Batch** | Scheduled full or incremental sync | Hours | Large datasets, analytics workloads |

**Staleness Policy:**

Every materialized entity type must declare an acceptable staleness window:

```yaml
projections:
  Customer:
    source: salesforce
    sync_strategy: webhook
    max_staleness: 5m
    on_stale: serve_stale_with_warning    # or: block_until_fresh, serve_stale_silent
  TransactionHistory:
    source: core_banking_db
    sync_strategy: cdc
    max_staleness: 30s
    on_stale: serve_stale_silent
  ProductCatalog:
    source: pim_system
    sync_strategy: polling
    max_staleness: 1h
    on_stale: serve_stale_silent
```

**Critical invariant:** The projection is NEVER authoritative for writes. Any mutation must flow through the external source system. An agent that wants to update a customer record must invoke the CRM's API (via a federated action adapter), NOT update the local projection directly. The projection is eventually updated through the sync mechanism.

---

## Comparison Matrix

| Dimension | PLATFORM-MANAGED | FEDERATED | MATERIALIZED |
|-----------|-----------------|-----------|--------------|
| **source_of_truth** | Platform | External system | External system |
| **logical_owner** | Tenant (or platform) | Tenant (or external system owner) | Tenant (or external system owner) |
| **physical_store** | Platform DB | External system only | External system + platform cache |
| **access_mode** | Direct | Adapter query / delegated action | Local projection (reads), delegated action (writes) |
| **Read latency** | Lowest | Highest | Low (from cache) |
| **Write path** | Platform API | External system API | External system API (sync back) |
| **Consistency** | Strong | Delegated (external) | Eventual |
| **Availability** | Platform uptime | External system uptime | Reads survive external outage |
| **Schema control** | Platform owns | External owns | External owns; platform adapts |
| **Data duplication** | None (single copy) | None (no copy) | Controlled duplication (projection) |
| **Operational cost** | Lowest | Adapter maintenance | Sync infrastructure + storage |
| **Compliance** | Platform's responsibility | Data stays in source | Must handle data residency for copies |

---

## Ontology Integration

### Declaring Data Ownership in the Ontology

The ontology must declare the data ownership mode for every entity type. This is not optional metadata -- it determines how the platform's query engine, write path, and sync infrastructure behave for that entity.

**Candidate declaration syntax in Ontology IR (using four-dimension model):**

```yaml
# PLATFORM-MANAGED entity
entity: AgentMemory
  ownership:
    source_of_truth: platform
    logical_owner: tenant
    physical_store: platform_db
    access_mode: direct
  storage: context_graph
  properties:
    session_id: string
    content: text
    created_at: timestamp
  actions:
    create: platform_api
    read: platform_api
    delete: platform_api
```

```yaml
# FEDERATED entity
entity: Customer
  ownership:
    source_of_truth: external:salesforce
    logical_owner: tenant
    physical_store: external_only
    access_mode: adapter_query (reads), delegated_action (writes)
  adapter: salesforce_rest          # registered adapter name
  mapping:
    customer.id:       CRM.Id
    customer.name:     CRM.Name
    customer.email:    CRM.Email
    customer.industry: CRM.Industry
    customer.revenue:  CRM.AnnualRevenue
  actions:
    read: federated_query           # resolved at query time via adapter
    update: federated_action        # delegated to CRM via action adapter
    create: federated_action
```

```yaml
# MATERIALIZED entity
entity: CustomerProfile
  ownership:
    source_of_truth: external:salesforce
    logical_owner: tenant
    physical_store: platform_cache + external
    access_mode: local_projection (reads), delegated_action (writes)
  projection: materialized
  source_entity: Customer           # what this is a projection of
  adapter: salesforce_rest
  sync:
    strategy: webhook
    staleness: 5m
    on_stale: serve_stale_with_warning
  enrichments:                      # platform adds value beyond raw source data
    - embedding: name + industry    # vector embedding for semantic search
    - graph_links: orders, support_tickets   # relationships materialized in graph
  mapping:
    profile.id:        CRM.Id
    profile.name:      CRM.Name
    profile.segment:   CRM.Industry   # renamed for AI context
    profile.ltv:       computed        # derived metric, pre-computed
  storage:
    primary: context_graph
    vector: knowledge_store
  actions:
    read: local_projection
    write: NOT_ALLOWED              # writes go through source entity adapter
```

### How the Domain Package Declares Data Ownership

The Domain Package (see `architecture/domain-package-architecture.md`) bundles all domain-specific configuration, including data ownership declarations. The data ownership mode is declared per entity type within the package's ontology definitions.

```
domain-package/
├── manifest.yaml
├── ontology/
│   ├── entities/
│   │   ├── agent-memory.yaml       # source_of_truth: platform
│   │   ├── customer.yaml           # source_of_truth: external (federated)
│   │   └── customer-profile.yaml   # source_of_truth: external (materialized)
│   └── ...
├── connectors/
│   ├── adapters/
│   │   ├── salesforce-adapter.yaml # adapter config for federated/materialized
│   │   └── erp-adapter.yaml
│   └── sync/
│       ├── customer-sync.yaml      # sync config for materialized entities
│       └── product-sync.yaml
└── ...
```

**Package validation rules:**
- Every entity with `source_of_truth: external` and no `projection` must have an adapter reference
- Every entity with `projection: materialized` must have a sync configuration
- Every adapter reference must resolve to a registered adapter in the connector registry
- Materialized entities must not declare write actions that target the local projection

---

## Adapter and Connector Architecture

### Adapter Types

The adapter framework must support different adapter types for different ownership modes:

```
┌───────────────────────────────────────────────────────────┐
│                    ADAPTER FRAMEWORK                       │
│                                                           │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │  QUERY ADAPTER   │  │  ACTION ADAPTER  │               │
│  │                  │  │                  │                │
│  │  Translates      │  │  Translates      │               │
│  │  ontology reads  │  │  ontology actions │               │
│  │  to external     │  │  to external      │               │
│  │  system queries  │  │  system mutations  │              │
│  └─────────────────┘  └─────────────────┘                │
│                                                           │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │  SYNC ADAPTER    │  │  SCHEMA ADAPTER  │               │
│  │                  │  │                  │                │
│  │  Manages         │  │  Discovers and   │               │
│  │  materialized    │  │  maps external   │               │
│  │  projection sync │  │  system schemas  │               │
│  └─────────────────┘  └─────────────────┘                │
└───────────────────────────────────────────────────────────┘
```

| Adapter Type | Used By | Purpose |
|-------------|---------|---------|
| **Query Adapter** | Federated mode | Translate ontology reads to external queries (SQL, REST, SOQL, GraphQL) |
| **Action Adapter** | Federated + Materialized | Delegate write operations to external systems |
| **Sync Adapter** | Materialized mode | Keep local projection in sync with external source |
| **Schema Adapter** | All external modes | Discover external schema, detect drift, validate mappings |

### Adapter Interface (Candidate)

```
interface QueryAdapter<T> {
  // Discover what the external system's schema looks like
  discoverSchema(): ExternalSchema

  // Translate an ontology query to an external system query
  translateQuery(ontologyQuery: OntologyQuery): ExternalQuery

  // Execute the translated query against the external system
  execute(query: ExternalQuery): Result<T[]>

  // Map external results back to ontology entity format
  mapToOntology(externalResult: ExternalResult): OntologyEntity<T>

  // Health check
  checkConnection(): ConnectionStatus
}

interface SyncAdapter<T> {
  // Get changes since last sync point
  getChanges(since: SyncCursor): ChangeSet<T>

  // Apply changes to local projection
  applyToProjection(changes: ChangeSet<T>): SyncResult

  // Full re-sync (rebuild projection from scratch)
  fullSync(): SyncResult

  // Get current sync state
  getSyncState(): SyncState
}
```

---

## Consistency Guarantees Per Mode

### Platform-Managed: Strong Consistency

- Reads always return the most recently committed write
- Transactions are ACID-compliant
- No stale reads under normal operation
- The platform's database consistency model applies directly

### Federated: Delegated Consistency

- Consistency depends entirely on the external system
- The platform cannot make consistency guarantees beyond what the external system provides
- If the external system has eventual consistency (e.g., DynamoDB), federated reads reflect that
- The platform must document the consistency model of each adapter

### Materialized: Eventual Consistency with Bounded Staleness

- Reads from the projection may be stale by up to the `max_staleness` window
- The sync mechanism provides eventual convergence
- **Conflict resolution is critical:** if the external system and projection diverge, the external system always wins
- The platform must track and expose sync lag as an observable metric

```
                     Consistency Spectrum

  STRONG ◄──────────────────────────────────────► EVENTUAL

  Platform-     Federated        Materialized
  Managed       (delegated)      (bounded staleness)

  Reads always  Depends on       Reads may be stale
  current       external system  by up to max_staleness
```

---

## CDC and Ingestion Relationship

Data ownership modes interact directly with the data ingestion architecture (see `architecture/data-ingestion-architecture.md`):

| Mode | Ingestion Role |
|------|---------------|
| **Platform-Managed** | Ingestion feeds data INTO platform-managed entities from external sources (ETL/ELT). Once ingested, the platform owns the data. |
| **Federated** | Ingestion is not involved; data stays in place. Adapters query at runtime. |
| **Materialized** | Ingestion/sync infrastructure maintains the projection. CDC, polling, and webhooks are the mechanisms. This is the primary consumer of the ingestion layer. |

### CDC as the Backbone of Materialized Mode

For entities projected from operational databases, CDC (Change Data Capture) is the preferred sync mechanism:

```
┌────────────────┐    Transaction    ┌─────────────┐    CDC Events    ┌──────────────┐
│  Operational   │ ──── Log ────── │  Debezium    │ ──────────────── │  Platform    │
│  Database      │                  │  (CDC)       │                  │  Sync Engine │
│  (Source of    │                  │              │                  │              │
│  Truth)        │                  └──────────────┘                  │  ┌────────┐  │
└────────────────┘                                                   │  │Project-│  │
                                                                     │  │  ion   │  │
                                                                     │  └────────┘  │
                                                                     └──────────────┘
```

For SaaS systems without CDC access, webhook-driven or polling sync is used instead.

---

## Relationship to Palantir's Ontology Model

Palantir's Foundry ontology is the primary conceptual inspiration for this architecture. Key parallels and divergences:

### Parallels

| Palantir Concept | Platform Equivalent |
|-----------------|---------------------|
| Ontology objects represent underlying data sources | Federated and Materialized entity types represent external data |
| Objects have actions that mutate state | Ontology actions with adapter-based delegation |
| Pipeline-backed ontology | Materialized mode with sync infrastructure |
| Live-backed ontology | Federated mode with query adapters |
| Object type defines schema separate from source | Ontology IR defines entity schema; mapping layer connects to source |

### Divergences

| Aspect | Palantir | This Platform |
|--------|---------|---------------|
| **Platform scope** | Palantir owns the entire data pipeline and compute | This platform is AI-focused; it does not replace the data warehouse |
| **Deployment model** | Palantir is the infrastructure | This platform integrates with existing infrastructure |
| **Data gravity** | Palantir tends to pull data into Foundry | This platform supports federation without data movement |
| **Openness** | Proprietary | Open architecture with pluggable adapters |

### What We Learn from Palantir

1. **The ontology as a unifying abstraction works.** Representing external data as typed ontology objects that agents can reason about is the right pattern.
2. **Actions on objects (not just reads) are critical.** The ontology is not a read-only view -- it must support agent-initiated mutations that flow through to source systems.
3. **Pipeline-backed vs. live-backed is a real distinction.** Not all entities need the same freshness or ownership model. The platform must support both.
4. **Schema mapping is a first-class concern.** The mapping between ontology schema and source schema is complex, evolving, and must be managed as a platform capability.

---

## Schema Mapping and Evolution

### Schema Mapping

Every federated and materialized entity requires a mapping between the ontology schema and the external system's schema:

```yaml
mapping:
  # Simple field rename
  ontology.customer_name: source.full_name

  # Type conversion
  ontology.created_at: source.create_date | to_timestamp("YYYY-MM-DD")

  # Computed field
  ontology.display_name: concat(source.first_name, " ", source.last_name)

  # Nested field access
  ontology.city: source.address.city

  # Enum mapping
  ontology.status:
    active: source.status == "A"
    inactive: source.status == "I"
    suspended: source.status == "S"
```

### Schema Evolution Scenarios

| Scenario | Mode | Impact | Mitigation |
|----------|------|--------|------------|
| Platform adds a property to an entity | Platform-Managed | Migration handled by platform | Standard migration tooling |
| External system adds a column | Federated / Materialized | No impact unless mapping is updated | Schema discovery adapter detects drift |
| External system renames a column | Federated / Materialized | Mapping breaks | Schema adapter detects rename; alerts; mapping update required |
| External system removes a column | Federated / Materialized | Mapped properties return null/error | Schema adapter detects removal; alert + graceful degradation |
| External system changes a column type | Federated / Materialized | Type coercion may break | Schema adapter detects type change; adapter must handle conversion |
| Ontology renames a property | All modes | Downstream consumers (agents, queries) must update | Ontology IR versioning; deprecation period for old name |

### Schema Drift Detection

The platform must continuously monitor for schema drift in external systems:

```
┌────────────────┐     Periodic Schema     ┌──────────────────┐
│  External      │ ◄── Discovery Probe ──── │  Schema Adapter  │
│  System        │                          │                  │
│                │ ──── Current Schema ──── │  Compare against │
└────────────────┘                          │  registered      │
                                            │  mapping         │
                                            │        │         │
                                            │  ┌─────▼──────┐  │
                                            │  │ Drift?     │  │
                                            │  │ Y: Alert   │  │
                                            │  │ N: OK      │  │
                                            │  └────────────┘  │
                                            └──────────────────┘
```

---

## Mixed-Mode Entities and Relationships

Real-world domains will have entities spanning multiple ownership modes. A single domain package might contain:

```yaml
# Platform-managed
entity: AgentMemory          # source_of_truth: platform
entity: EvaluationResult     # source_of_truth: platform

# Federated
entity: Customer             # source_of_truth: external (CRM)
entity: Invoice              # source_of_truth: external (ERP)

# Materialized
entity: CustomerProfile      # projection of Customer, cached for agent context
entity: ProductCatalog       # projection of PIM data, embedded for search
```

**Cross-mode relationships** are inevitable. An `AgentMemory` (platform-managed) references a `Customer` (federated). A `CustomerProfile` (materialized) links to `Invoice` (federated).

**Resolution rules for cross-mode queries:**

1. Resolve each entity through its declared mode
2. The query engine assembles results from multiple resolution paths
3. Latency is bounded by the slowest resolution (typically federated)
4. If a federated source is unavailable, the query engine can fall back to a materialized projection if one exists

```
Query: "Get agent conversation about customer including recent invoices"

Resolution:
  AgentMemory     → platform DB         (platform-managed, ~1ms)
  Customer        → CRM adapter         (federated, ~200ms)
  Invoice         → ERP adapter         (federated, ~150ms)

Total latency: ~200ms (parallel resolution of federated entities)

OR with materialized fallback:
  AgentMemory     → platform DB         (platform-managed, ~1ms)
  CustomerProfile → local projection    (materialized, ~2ms)
  Invoice         → ERP adapter         (federated, ~150ms)

Total latency: ~150ms
```

---

## Governance and Compliance Implications

### Data Residency

- **Platform-Managed:** Data resides in the platform's infrastructure. Platform determines region/jurisdiction.
- **Federated:** Data never leaves the external system. Strongest compliance posture for data residency.
- **Materialized:** Data is copied to the platform's infrastructure. Must comply with data residency requirements for both the source and the projection.

### Right to Deletion (GDPR, CCPA)

- **Platform-Managed:** Platform handles deletion directly.
- **Federated:** Deletion in external system is automatically reflected (no platform copy to delete).
- **Materialized:** Deletion must propagate from external system through sync mechanism. The projection must be purged within the staleness window or via an explicit deletion event.

### Audit Trail

All three modes must produce audit events for the platform's provenance system:

```
READ events:  who accessed what entity, when, through which mode
WRITE events: who mutated what entity, through which system, with what result
SYNC events:  when was the projection last updated, from what source, what changed
```

---

## Research Questions

1. **Adapter abstraction level:** What is the right level of abstraction for query adapters? Should they translate to SQL, REST calls, or a more abstract intermediate query language that then targets specific systems?

2. **Query planning across modes:** How does the query engine plan and optimize queries that span multiple ownership modes? Is there a federated query planner analogous to database query optimizers?

3. **Materialized projection storage:** Should materialized projections use the same storage as platform-managed entities (context graph, relational DB), or dedicated projection-specific stores? What are the indexing implications?

4. **Sync failure recovery:** When CDC or polling sync fails for a materialized entity, what is the recovery path? Full re-sync? Partial catchup? How is the staleness budget enforced during failure?

5. **Write-through vs. write-around:** For materialized entities, should writes go through the platform (which delegates to the external system and updates the projection) or directly to the external system (with sync catching up)? What are the consistency tradeoffs?

6. **Mode migration:** Can an entity change ownership modes over time? For example, starting as federated, then moving to materialized for performance, then eventually to platform-managed if the external system is decommissioned. What is the migration path?

7. **Hybrid entities:** Can a single entity type have some properties platform-managed and others federated? For example, a Customer with CRM-sourced fields AND platform-managed AI-generated fields (risk score, segment prediction). Is this a fourth mode or a composition of modes?

8. **Authorization model alignment:** How does the platform's OpenFGA authorization model stay aligned with external system permissions for federated entities? If a user loses access in the CRM, how quickly is that reflected in the platform?

9. **Adapter ecosystem:** Should adapters be part of domain packages, or a separate shared registry? How are adapters versioned, tested, and certified? Is there a marketplace model?

10. **Observability per mode:** What metrics and traces are needed per ownership mode? Federated mode needs external system latency tracking. Materialized mode needs sync lag monitoring. Platform-managed mode needs standard database observability. How does this integrate with the platform's observability architecture?

11. **Cost modeling:** What is the cost profile of each mode? Federated has per-query API costs. Materialized has storage and sync compute costs. Platform-managed has storage and backup costs. How does the platform's metering system account for these differences?

12. **Conflict resolution:** When a materialized projection receives a sync event that conflicts with a concurrent agent action (e.g., agent reads stale data, makes a decision, then sync updates the data), how is this detected and handled? Is this an application-level concern or a platform-level concern?

13. **Testing strategy:** How do domain package authors test federated and materialized entities during development? Mock adapters? Sandbox instances of external systems? Recorded fixture data?

---

## References

- `architecture/domain-package-architecture.md` -- Domain package structure, package lifecycle, connector configuration
- `architecture/ontology-architecture.md` -- Ontology IR, compiler, entity type definitions, Palantir inspiration
- `architecture/data-ingestion-architecture.md` -- Ingestion layer, CDC, schema discovery, sync mechanisms
- `architecture/context-graph-architecture.md` -- Context graph as projection store for materialized entities
- `architecture/event-architecture.md` -- Event-driven sync and CDC event processing
- `commercial-platforms/palantir/ontology.md` -- Palantir Foundry ontology model (primary inspiration)
