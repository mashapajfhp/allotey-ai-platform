# Platform Tenancy Model

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

This document defines the formal tenancy hierarchy for the enterprise AI platform. It corrects a conceptual conflation present in early architecture discussions where "product" and "tenant" were used interchangeably. These are distinct concepts with different isolation, identity, and lifecycle requirements.

**Cross-references:**
- `AGENTS.md` -- rules 6 (product agnosticism), 7 (validation questions), 9 (tenant isolation)
- `architecture/domain-package-architecture.md` -- how domain packages scope to products and tenants
- `architecture/reference-architecture.md` -- the structural blueprint this model governs

---

## The Problem: "Product" Is Not "Tenant"

Early architecture documents use "tenant" loosely to mean "whoever is using the platform." This conflation is incorrect and creates ambiguity in three critical areas:

1. **Isolation boundaries** -- data isolation between customers is different from data isolation between products
2. **Identity scope** -- a user may have a single identity across products but separate authorization in each
3. **Package activation** -- a domain package is installed for a product but instantiated per tenant

The tenancy model must distinguish these concepts formally. Without this distinction, the authorization model, data isolation strategy, cost attribution, and package lifecycle cannot be designed correctly.

---

## Entity Hierarchy

```
PLATFORM
│
├── Product / Application
│   │
│   ├── Product Environment (dev, staging, prod)
│   │
│   └── Package Installation
│       └── (a domain package installed for this product)
│
└── Organization / Customer
    │
    ├── Tenant / Workspace
    │   │
    │   ├── Package Instance
    │   │   └── (a running instance of an installed package for this tenant)
    │   │
    │   └── Agent Instances
    │       └── (agents executing within this tenant's boundary)
    │
    ├── Users (human identities)
    │
    └── Service Accounts (machine identities)
```

The hierarchy has two independent branches that intersect:

- **Products** define WHAT intelligence capabilities exist (what packages are installed, what agents are available, what tools are exposed)
- **Organizations** define WHO uses those capabilities and WHERE data boundaries are drawn

A **Tenant** is the intersection point -- it represents a specific organization's isolated workspace within a specific product.

---

## Entity Definitions

### 1. Platform

The deployment itself. A single running instance of the enterprise AI platform.

**Scope:** Everything. The platform is the outermost boundary.

**Responsibilities:**
- Global configuration (model gateway endpoints, infrastructure settings)
- Platform-level administration (creating products, onboarding organizations)
- Cross-product observability and cost aggregation
- Infrastructure lifecycle (upgrades, migrations, scaling)
- Platform-level security policies (TLS, network isolation, audit retention)

**Cardinality:** One per deployment. Multiple deployments are separate platforms (e.g., a SaaS deployment and a customer's self-hosted deployment are separate platforms).

**What it does NOT do:** The platform entity does not hold domain-specific configuration, user data, or business logic. It is pure infrastructure governance.

---

### 2. Product / Application

A distinct product built on the platform. Each product is an independent application with its own domain, user experience, and business purpose.

**Scope:** A product defines a self-contained application boundary.

**Responsibilities:**
- Determines which domain packages are installed and available
- Defines the product's API surface (which platform capabilities are exposed)
- Owns product-level configuration (default models, rate limits, branding)
- Defines product-level authorization model extensions
- Determines which agent types are available to tenants

**Cardinality:** One platform serves multiple products.

**Examples:**
- An operational intelligence product for supply chain management
- An HR analytics product for workforce planning
- A customer support automation product
- An internal developer productivity tool

**Isolation guarantee:** Products are fully isolated from each other by default. Product A's packages, agents, tools, ontologies, semantic models, policies, and configurations are invisible to Product B. This is not a suggestion -- it is an enforcement boundary.

**Key distinction from Tenant:** A product is an application definition. It does not contain user data. Data enters only when an organization creates a tenant within the product.

---

### 3. Environment

A deployment stage within a product. Environments allow a product to maintain separate configurations and data for development, testing, and production use.

**Scope:** An environment is a sub-boundary within a product.

**Responsibilities:**
- Separate configuration (which model versions, which package versions)
- Separate data stores or logical data partitions
- Separate authorization policies (e.g., relaxed auth in dev, strict in prod)
- Separate observability streams (dev traces do not pollute prod dashboards)
- Promotion workflow (changes flow dev -> staging -> prod)

**Cardinality:** Each product has at least one environment. Typical: dev, staging, prod.

**Isolation guarantee:** Environments within a product are fully isolated from each other. A staging environment cannot read production data. A dev environment cannot invoke production tools.

**Relationship to tenants:** Tenants exist within an environment. When Organization A uses Product X in production, that is a tenant in Product X's `prod` environment. When Organization A's developers test against Product X, that may be a tenant in Product X's `staging` environment.

---

### 4. Organization / Customer

An enterprise customer of the platform. An organization is a billing, contractual, and identity boundary.

**Scope:** An organization groups all of a customer's activity across products.

**Responsibilities:**
- Billing and cost attribution (aggregated across all products the org uses)
- Identity provider integration (SSO, directory sync)
- Organization-level policies (data residency, compliance requirements)
- Organization-level administration (managing users, service accounts)
- Contractual boundary (SLAs, entitlements, licensing)

**Cardinality:** One platform serves multiple organizations. One organization may use multiple products.

**Isolation guarantee:** Organizations are fully isolated from each other. Organization A's data, users, agents, and activity are invisible to Organization B. This holds within a product and across products. Cross-organization data sharing is not supported by the platform's core model (it is a fundamentally different architecture concern -- federation -- and would be handled at the product level if ever needed).

**Key distinction from Product:** A product defines what capabilities exist. An organization defines who uses them.

---

### 5. Tenant / Workspace

An isolated data boundary within a product for an organization. The tenant is the intersection of an organization and a product environment.

**Scope:** A tenant is the finest-grained isolation boundary for data at rest and data in motion.

**Responsibilities:**
- Data isolation (all data stored for this tenant is accessible only to this tenant)
- Package instance lifecycle (domain packages are instantiated per tenant)
- Tenant-level configuration (custom settings, feature flags, overrides)
- Tenant-level authorization (which users have which roles within this workspace)
- Cost tracking (metering and budget enforcement scoped to this tenant)
- Agent execution boundary (agents executing in this tenant can only access this tenant's data)

**Cardinality:** One tenant per (organization, product, environment) triple. An organization using three products in production has three tenants.

**Formal identity:**
```
tenant_id = f(organization_id, product_id, environment_id)
```

**Isolation guarantee:** Tenants are the hardest isolation boundary in the system. Every data path, every query, every agent execution, every tool invocation must respect tenant boundaries. Cross-tenant data leakage is a critical security failure (per AGENTS.md rule 9).

**Why "Workspace" is an acceptable alias:** Some products may present tenants as "workspaces" or "projects" in their UI. The underlying isolation model is the same regardless of the user-facing terminology.

---

### 6. User

A human identity that interacts with the platform through one or more products.

**Scope:** A user is an identity that belongs to an organization and is granted access to specific tenants.

**Responsibilities:**
- Authenticates via the organization's identity provider
- Holds roles and permissions within specific tenants
- Initiates agent sessions (agents inherit the user's effective permissions)
- Owns audit trail of all actions performed
- Has personal preferences and settings scoped to each tenant

**Cardinality:** A user belongs to exactly one organization. A user may have access to multiple tenants (across products and environments).

**Identity model:**
```
User (org-level identity)
  ├── Tenant A membership (roles, permissions)
  ├── Tenant B membership (roles, permissions)
  └── Tenant C membership (roles, permissions)
```

**Key principle:** A user's identity is managed at the organization level. Their authorization is managed at the tenant level. Authentication is universal; authorization is local.

---

### 7. Service Account

A machine identity used for automated, programmatic access to the platform.

**Scope:** A service account belongs to an organization and is scoped to specific tenants.

**Responsibilities:**
- API access for integrations, pipelines, and automated workflows
- Holds explicit permissions (never implicit or inherited from a human user)
- Credential lifecycle management (rotation, revocation)
- Rate limiting and cost budget enforcement
- Full audit trail of all operations

**Cardinality:** An organization may have multiple service accounts. A service account may be scoped to one or more tenants.

**Key distinction from User:** Service accounts do not authenticate via SSO. They use API keys, client credentials, or workload identity (SPIFFE/SPIRE). Service accounts cannot delegate to agents in the same way users do -- an agent running under a service account operates with the service account's explicit permissions, not with the implicit permissions of a human.

---

### 8. Agent

An AI agent identity. Agents are not users or service accounts -- they are a third category of principal in the authorization model.

**Scope:** An agent is defined by a product (via its domain package) and executes within a tenant on behalf of a user or service account.

**Responsibilities:**
- Registered in the Agent Registry with declared capabilities, tools, and permissions
- Executes within a tenant's data boundary
- Inherits permissions from the delegating user or service account
- Bounded by its own declared permission scope (an agent cannot exceed its own declared capabilities even if the user has broader permissions)
- Produces audit records for every action

**Effective permission model:**
```
Effective agent permissions =
    Delegating principal's permissions (user or service account)
    INTERSECT
    Agent's declared permission scope
    INTERSECT
    Tenant's active policies
```

**Cardinality:** An agent type is defined once (in a domain package). Agent instances execute per-session within a tenant. Multiple users in the same tenant may use the same agent type simultaneously, but each session is isolated.

**Key principle:** Agents are never autonomous -- they always act on behalf of a principal, and their effective permissions are the intersection (not the union) of the principal's permissions and the agent's own capability declarations.

---

### 9. Package Installation

A domain package installed for a specific product. This makes the package's capabilities available to the product but does not activate them for any tenant.

**Scope:** A package installation exists at the product level.

**Responsibilities:**
- Registers the package's artifacts (ontology definitions, semantic models, agent definitions, tool definitions, workflow definitions, policies, connectors, evaluation criteria)
- Validates compatibility with the platform version and other installed packages
- Makes the package available for tenant-level instantiation
- Manages package versioning and upgrade paths

**Cardinality:** A product may have multiple packages installed. A package may be installed across multiple products (but each installation is independent).

**Lifecycle:**
```
INSTALL (product-level)
    → Package artifacts registered
    → Compatibility validated
    → Available for tenant instantiation
    → NOT yet active for any tenant
```

**Key distinction from Package Instance:** An installation makes capabilities available. An instance activates them for a specific tenant with tenant-specific data and configuration.

---

### 10. Package Instance

A running instance of an installed domain package, activated for a specific tenant.

**Scope:** A package instance exists at the tenant level.

**Responsibilities:**
- Tenant-specific data schemas deployed (database tables, graph schemas, vector collections)
- Tenant-specific authorization model loaded (roles, permissions, relationships)
- Tenant-specific configuration applied (feature flags, custom settings)
- Agent definitions activated (agents available to users in this tenant)
- Tools registered and authorized for this tenant
- Evaluation criteria active for quality monitoring

**Cardinality:** Each tenant may have multiple package instances (one per installed package they activate). Each package instance belongs to exactly one tenant.

**Lifecycle:**
```
INSTANTIATE (tenant-level)
    → Schema migrations run for this tenant
    → Authorization tuples created for this tenant
    → Configuration applied
    → Agents and tools activated
    → Monitoring and evaluation started
```

**Key distinction from Package Installation:** The installation is the blueprint. The instance is the live, tenant-specific deployment of that blueprint with tenant-specific data, configuration, and access control.

---

## Complete Hierarchy Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PLATFORM                                                                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ PRODUCT A                              PRODUCT B                    │ │
│  │                                                                     │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                │ │
│  │  │ Environment: prod    │  │ Environment: prod     │                │ │
│  │  │                      │  │                       │                │ │
│  │  │  ┌────────────────┐  │  │  ┌─────────────────┐  │                │ │
│  │  │  │ Tenant: Org X  │  │  │  │ Tenant: Org X   │  │                │ │
│  │  │  │  in Prod A     │  │  │  │  in Prod B      │  │                │ │
│  │  │  │                │  │  │  │                  │  │                │ │
│  │  │  │  Pkg Instance  │  │  │  │  Pkg Instance    │  │                │ │
│  │  │  │  Agent sessions│  │  │  │  Agent sessions  │  │                │ │
│  │  │  │  Data boundary │  │  │  │  Data boundary   │  │                │ │
│  │  │  └────────────────┘  │  │  └─────────────────┘  │                │ │
│  │  │                      │  │                       │                │ │
│  │  │  ┌────────────────┐  │  │  ┌─────────────────┐  │                │ │
│  │  │  │ Tenant: Org Y  │  │  │  │ Tenant: Org Y   │  │                │ │
│  │  │  │  in Prod A     │  │  │  │  in Prod B      │  │                │ │
│  │  │  │                │  │  │  │                  │  │                │ │
│  │  │  │  Pkg Instance  │  │  │  │  Pkg Instance    │  │                │ │
│  │  │  │  Agent sessions│  │  │  │  Agent sessions  │  │                │ │
│  │  │  │  Data boundary │  │  │  │  Data boundary   │  │                │ │
│  │  │  └────────────────┘  │  │  └─────────────────┘  │                │ │
│  │  └──────────────────────┘  └──────────────────────┘                │ │
│  │                                                                     │ │
│  │  Installed Packages:           Installed Packages:                  │ │
│  │   [supply-chain-pkg v2.1]       [hr-analytics-pkg v1.4]            │ │
│  │   [finance-core-pkg v3.0]       [workforce-pkg v2.0]               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ORGANIZATION X                         ORGANIZATION Y               │ │
│  │                                                                     │ │
│  │  Users:                                Users:                       │ │
│  │   alice@orgx.com                        bob@orgy.com                │ │
│  │   carol@orgx.com                        dave@orgy.com               │ │
│  │                                                                     │ │
│  │  Service Accounts:                     Service Accounts:            │ │
│  │   sa-pipeline-orgx                      sa-etl-orgy                 │ │
│  │   sa-webhook-orgx                       sa-api-orgy                 │ │
│  │                                                                     │ │
│  │  Uses: Product A, Product B            Uses: Product A, Product B   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Isolation Matrix

This matrix defines what is isolated between each boundary level.

### Between Products (Product A vs. Product B)

| Resource | Isolated? | Notes |
|----------|-----------|-------|
| Domain packages | YES | Packages are installed per product |
| Ontology definitions | YES | Each product has its own entity types |
| Semantic models | YES | Metric definitions are product-scoped |
| Agent definitions | YES | Agents are defined per product's packages |
| Tool definitions | YES | Tools are registered per product |
| Data at rest | YES | No data sharing between products by default |
| Configuration | YES | Product-level settings are independent |
| Authorization models | YES | Each product has its own authorization model extensions |
| Observability data | PARTIAL | Platform-level aggregation exists, but product-specific traces are separated |
| Cost tracking | SEPARATE | Costs are attributed per product per tenant |
| User identity | SHARED (conditional) | See Identity Sharing Model below |
| Infrastructure | SHARED | Products share platform infrastructure (databases, runtimes) |

### Between Tenants (Org X in Product A vs. Org Y in Product A)

| Resource | Isolated? | Notes |
|----------|-----------|-------|
| Business data | YES | Hard isolation -- cross-tenant leakage is a critical security failure |
| Package instances | YES | Each tenant has its own instance with its own data |
| Agent sessions | YES | Agent execution is bounded to the tenant |
| Authorization tuples | YES | Each tenant has its own relationship graph |
| Configuration | YES | Tenant-specific overrides |
| Audit logs | YES | Each tenant's audit trail is separate |
| Cost/budget | YES | Metering and budgets are per-tenant |
| Ontology definitions | SHARED | Defined by the product's installed packages (read-only to tenants) |
| Agent type definitions | SHARED | Defined by packages, but sessions are isolated |
| Model access | SHARED | Same model gateway, but requests are tenant-tagged |
| Infrastructure | SHARED | Tenants share product infrastructure with logical isolation |

### Between Environments (dev vs. staging vs. prod within a product)

| Resource | Isolated? | Notes |
|----------|-----------|-------|
| Data | YES | No data flows between environments without explicit promotion |
| Configuration | YES | Each environment has its own settings |
| Package versions | INDEPENDENT | Environments may run different package versions |
| Model routing | INDEPENDENT | Dev may use cheaper models; prod uses production models |
| Tenants | INDEPENDENT | Tenants in dev are separate from tenants in prod |
| Authorization models | INDEPENDENT | May differ (relaxed in dev, strict in prod) |
| Observability | SEPARATE | Separate trace/metric streams |
| Infrastructure | VARIES | May share infrastructure (cost) or be fully separate (risk) |

---

## Identity Sharing Model

Identity is the one dimension where boundaries can be intentionally permeable. The question: when can a user's identity cross product boundaries within an organization?

### Principle: Authenticate Once, Authorize Per Tenant

A user authenticates at the organization level. Their identity (who they are) is established once. But their authorization (what they can do) is resolved independently in each tenant they access.

```
alice@orgx.com authenticates via Org X's SSO
    │
    ├── Tenant: Org X in Product A (prod)
    │   └── Roles: admin, data-analyst
    │   └── Permissions: full access to supply chain data
    │
    ├── Tenant: Org X in Product B (prod)
    │   └── Roles: viewer
    │   └── Permissions: read-only access to HR dashboards
    │
    └── Tenant: Org X in Product A (staging)
        └── Roles: developer
        └── Permissions: test data only
```

### Three Identity Sharing Modes

The platform supports three modes, configured per organization:

#### Mode 1: Fully Isolated Identity

Each product manages its own user directory. No identity sharing.

```
Product A: alice-in-product-a (separate credentials)
Product B: alice-in-product-b (separate credentials)
```

**When to use:** Regulatory environments where even identity correlation across products is prohibited. Rare.

#### Mode 2: Shared Authentication, Separate Authorization (DEFAULT)

Users authenticate once via the organization's identity provider. Each product/tenant manages its own authorization independently.

```
SSO: alice@orgx.com (single authentication)
    Product A authorization: {admin, data-analyst}
    Product B authorization: {viewer}
```

**When to use:** Most enterprise deployments. The user has one login but different permissions in each product.

#### Mode 3: Shared Authentication with Cross-Product Authorization Policies

Users authenticate once. Some authorization policies span products -- for example, an organization admin role that grants administrative access across all products the organization uses.

```
SSO: alice@orgx.com (single authentication)
    Organization role: org-admin
        → Inherited in Product A: admin
        → Inherited in Product B: admin
    Product-specific role in Product A: data-analyst
    Product-specific role in Product B: (none beyond org-admin inheritance)
```

**When to use:** When the organization needs unified administration across products. Requires explicit opt-in and careful authorization model design.

---

## Data Boundary Model

### Principle: Data Never Crosses Tenant Boundaries Without Explicit Authorization

Data isolation between tenants is absolute by default. There are no implicit sharing mechanisms. Data can cross boundaries only through explicit, auditable, revocable authorization grants.

### Within a Tenant

All data within a tenant is accessible to authorized principals within that tenant, subject to fine-grained authorization (role-based, attribute-based, row-level).

```
Tenant: Org X in Product A
    └── All data in this tenant is queryable by authorized users of this tenant
    └── Fine-grained access within the tenant is governed by authorization tuples
    └── Agents executing in this tenant can only access this tenant's data
```

### Between Tenants in the Same Product

No data sharing. Tenant A and Tenant B in the same product cannot see each other's data under any circumstances through the platform's core APIs.

### Between Tenants in Different Products (Same Organization)

No data sharing by default. The fact that Org X uses both Product A and Product B does not create any data path between them.

If data must flow between products for the same organization, this is handled through:
1. **Explicit data export/import** -- not a live connection, but a governed pipeline
2. **Cross-product connector** (a domain package capability, not a core platform feature)
3. **Shared data lake/warehouse** external to the platform with separate ingestion per product

The platform core does not provide cross-product data bridging. This is a deliberate constraint to maintain isolation.

### Cross-Organization

Impossible through the platform. Organizations are the hardest boundary.

### Authorized Exceptions Summary

| Boundary | Default | Exception Mechanism |
|----------|---------|-------------------|
| Within tenant | Accessible (subject to fine-grained auth) | N/A |
| Between tenants, same product | Blocked | None -- architectural constraint |
| Between products, same org | Blocked | Explicit connector or external pipeline |
| Between organizations | Blocked | None -- architectural constraint |

---

## Intelligence Sharing Model

Intelligence assets (agents, models, knowledge bases, semantic definitions) have different sharing characteristics than data.

### What Can Be Shared

| Asset | Shareable Across Products? | Shareable Across Tenants? | Mechanism |
|-------|---------------------------|--------------------------|-----------|
| Agent type definitions | NO (product-scoped via packages) | YES (defined at product level) | Package installation |
| Agent instances/sessions | NO | NO (tenant-isolated) | N/A |
| Custom-trained models | NO by default | NO by default | Explicit model registry grant |
| Knowledge base content | NO | NO (tenant data) | N/A |
| Ontology definitions | NO (product-scoped) | YES (product-level definitions) | Package installation |
| Semantic metric definitions | NO (product-scoped) | YES (product-level definitions) | Package installation |
| Tool implementations | NO by default | YES (product-level tools) | Package installation |
| Prompt templates | NO (product-scoped) | YES (product-level definitions) | Package installation |
| Evaluation criteria | NO (product-scoped) | YES (product-level definitions) | Package installation |
| Policies | PARTIAL (some platform-level) | YES (product-level, with tenant overrides) | Package + platform config |

### Intelligence Sharing with Explicit Authorization

In some cases, an organization may want to share intelligence assets across products. For example:
- A custom-trained model developed for Product A could be useful in Product B
- A knowledge base built for one product could enrich another

This is permitted only through the platform's explicit authorization grant mechanism:

```
1. Asset owner (org admin or designated role) creates a sharing grant
2. Grant specifies: source (product/tenant), target (product/tenant), asset, permissions
3. Grant is recorded in the authorization system with full audit trail
4. Grant is revocable at any time
5. Shared asset access is read-only by default (no modification from the consuming product)
```

---

## Mapping to ReBAC Authorization

The tenancy hierarchy maps directly to relationship-based authorization (ReBAC). Each entity in the hierarchy becomes a type in the authorization model, and the relationships between them become the authorization graph.

### Authorization Model Structure

```
type platform

type product
  relations
    define parent: [platform]
    define admin: [user, service_account]
    define member: [user, service_account]

type environment
  relations
    define parent: [product]
    define admin: [user, service_account] or admin from parent

type organization
  relations
    define parent: [platform]
    define admin: [user]
    define member: [user, service_account]

type tenant
  relations
    define product: [product]
    define organization: [organization]
    define environment: [environment]
    define admin: [user, service_account] or admin from organization
    define member: [user, service_account] or member from organization
    define viewer: [user, service_account] or member

type user
  relations
    define belongs_to: [organization]

type service_account
  relations
    define belongs_to: [organization]
    define scoped_to: [tenant]

type agent
  relations
    define defined_by: [package_installation]
    define can_act_on_behalf_of: [user, service_account]
    define scoped_to: [tenant]

type package_installation
  relations
    define installed_in: [product]
    define admin: [user, service_account] or admin from installed_in

type package_instance
  relations
    define installation: [package_installation]
    define tenant: [tenant]
    define admin: [user, service_account] or admin from tenant
```

### Key Authorization Checks

| Check | ReBAC Query |
|-------|-------------|
| Can user access this tenant? | `Check(user:alice, member, tenant:orgx-prodA-prod)` |
| Can agent use this tool in this tenant? | `Check(agent:summarizer, can_use, tool:query-engine)` AND `Check(user:alice, member, tenant:T)` |
| Can this service account write to this tenant? | `Check(service_account:sa-pipeline, writer, tenant:T)` |
| Is this user an org admin? | `Check(user:alice, admin, organization:orgx)` |
| Can this user manage packages for this product? | `Check(user:alice, admin, product:prodA)` |

### Tenant Isolation Enforcement

Every data query, every agent execution, and every tool invocation includes a mandatory tenant context. The authorization system enforces that the requesting principal has a valid relationship to the tenant in the request context.

```
Request: { principal: user:alice, tenant: tenant:orgx-prodA-prod, action: query, resource: ... }

Authorization check sequence:
  1. Is alice a member of tenant orgx-prodA-prod? (ReBAC check)
  2. Does alice have permission for this action in this tenant? (ReBAC check)
  3. Do active policies allow this action given current context? (Policy evaluation)
  4. Is the resource within this tenant's data boundary? (Data-level enforcement via RLS)
```

---

## Mapping to the Domain Package System

Domain packages interact with the tenancy model at two levels:

### Level 1: Package Installation (Product-Scoped)

When a domain package is installed for a product:
- The package's artifacts are registered in the product's namespace
- Ontology definitions are compiled and made available
- Agent definitions are registered in the product's agent registry
- Tool definitions are registered in the product's tool registry
- Semantic models are compiled and available for tenant instantiation
- Authorization model extensions are merged into the product's authorization model

Installation does NOT create any data stores, does NOT activate any agents, and does NOT affect any existing tenant.

### Level 2: Package Instantiation (Tenant-Scoped)

When a tenant activates an installed package:
- Database schema migrations run for this tenant's data boundary
- Tenant-specific authorization tuples are created (e.g., default roles, permissions)
- Tenant-specific configuration is applied
- Agents and tools become available to users in this tenant
- Evaluation and monitoring criteria are activated
- Connectors are configured with tenant-specific credentials

```
Product A has package "supply-chain" installed (Level 1)
    │
    ├── Tenant: Org X in Product A
    │   └── Package Instance: supply-chain for Org X
    │       ├── Org X's supply chain data (isolated)
    │       ├── Org X's supply chain agent sessions (isolated)
    │       └── Org X's supply chain configuration
    │
    └── Tenant: Org Y in Product A
        └── Package Instance: supply-chain for Org Y
            ├── Org Y's supply chain data (isolated)
            ├── Org Y's supply chain agent sessions (isolated)
            └── Org Y's supply chain configuration
```

### Package Dependency Resolution

Package dependencies are resolved at the product level (installation), not the tenant level (instantiation). If Package B depends on Package A:
- Package A must be installed in the product before Package B can be installed
- When a tenant activates Package B, the system ensures Package A is also instantiated for that tenant
- The dependency is declared in the package manifest and enforced by the platform

---

## Cost Attribution Model

The tenancy hierarchy defines how costs are tracked and attributed:

```
Platform total cost
    ├── Product A total cost
    │   ├── Infrastructure cost (shared, apportioned)
    │   ├── Tenant: Org X in Product A
    │   │   ├── Model tokens consumed
    │   │   ├── Agent execution time
    │   │   ├── Data storage
    │   │   ├── Tool invocations
    │   │   └── Workflow executions
    │   └── Tenant: Org Y in Product A
    │       ├── Model tokens consumed
    │       ├── Agent execution time
    │       ├── Data storage
    │       ├── Tool invocations
    │       └── Workflow executions
    └── Product B total cost
        └── (same structure)
```

Every metered operation carries a `(product_id, tenant_id, principal_id, agent_id)` context. This enables:
- Billing per organization per product
- Cost alerting per tenant
- Budget enforcement per tenant or per user within a tenant
- Infrastructure cost apportionment across products

---

## Research Questions

### Isolation Implementation

1. **Row-Level Security (RLS) vs. Schema-per-Tenant vs. Database-per-Tenant** -- what is the right isolation strategy for the data plane? RLS is simplest operationally but has performance and security tradeoffs at scale. Schema-per-tenant provides stronger isolation. Database-per-tenant is the strongest but most expensive. What hybrid approach balances security, performance, and operational cost?

2. **Authorization store topology** -- should the ReBAC authorization engine use a single store with organization-scoped relations, or one store per tenant? Single store is simpler to manage but may have performance implications. Per-tenant stores provide stronger isolation but complicate cross-tenant checks (e.g., organization-level admin queries).

3. **Environment promotion** -- how are package versions, configurations, and authorization models promoted from dev to staging to prod? Is this a CI/CD pipeline concern, a platform-native concern, or both?

### Identity and Authentication

4. **Cross-product session management** -- when a user is authenticated for Product A and navigates to Product B (same organization), is a new authentication event required or is the SSO session sufficient? How does this interact with product-specific MFA requirements?

5. **Service account scoping granularity** -- can a service account be scoped to a subset of tenants, or only to all tenants within an organization? What about service accounts that need to operate across environments (e.g., a CI/CD service account that deploys to staging and prod)?

6. **Agent identity persistence** -- agents currently have session-scoped identity. Should agents have persistent identity for long-running workflows? How does agent identity interact with the durable workflow runtime?

### Package Lifecycle

7. **Package version coexistence** -- can two tenants within the same product run different versions of the same package? If so, how does the platform manage schema compatibility, agent definition differences, and tool version mismatches?

8. **Package deactivation and data retention** -- when a tenant deactivates a package instance, what happens to the data? Is it archived, deleted, or retained for a configurable period? How does this interact with data residency requirements?

9. **Cross-package entity references** -- if Package A defines a "Customer" entity and Package B defines an "Order" entity that references a Customer, how is this relationship managed when the packages are independently versioned and may be at different versions?

### Scale and Operations

10. **Tenant provisioning latency** -- what is the acceptable latency for creating a new tenant? If instantiation requires running migrations, creating authorization tuples, and activating agents, this could take seconds to minutes. How does this interact with self-service onboarding?

11. **Noisy neighbor isolation** -- in a shared-infrastructure deployment, how does the platform prevent one tenant's heavy workload from degrading another tenant's experience? Is this purely a rate-limiting concern, or does it require compute-level isolation (separate worker pools, resource quotas)?

12. **Tenant data migration** -- if an organization needs to move a tenant from one environment to another (e.g., migrating from a shared deployment to a dedicated deployment), what is the migration path? What about moving between platform instances (e.g., from SaaS to self-hosted)?

### Governance

13. **Cross-product audit correlation** -- an organization admin may need to see all activity across all products. How does the platform aggregate audit logs across product boundaries while maintaining product-level isolation for non-admin users?

14. **Organization-level policy enforcement** -- if an organization has a data residency policy (e.g., "all data must stay in the EU"), how is this enforced across all products and tenants? Is this a platform-level policy, an organization-level policy, or both?

15. **Tenant deletion and right to erasure** -- when an organization terminates its use of a product, how is all tenant data completely removed, including data in backups, event stores, vector databases, graph databases, and audit logs? How does this interact with regulatory retention requirements?

---

## References

- `AGENTS.md` -- rules 6 (product agnosticism), 7 (validation questions), 9 (tenant isolation)
- `architecture/reference-architecture.md` -- structural blueprint
- `architecture/domain-package-architecture.md` -- package structure, lifecycle, multi-product isolation
- `architecture/authorization-architecture.md` -- three-layer authorization model
- `architecture/policy-architecture.md` -- four-layer policy model
- `architecture/deployment-architecture.md` -- infrastructure topology, multi-tenant deployment questions
- `open-source/authorization/openfga.md` -- ReBAC implementation, stores, agent authorization
- `architecture/security-threat-model.md` -- cross-tenant leakage as critical threat
