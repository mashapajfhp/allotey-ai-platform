# Palantir Governance: Deep Study

**STATUS: RESEARCHED -- Based on official Palantir documentation and verified public sources (August 2026)**

---

## 1. Governance Philosophy

Palantir's governance model is built on two core principles:

1. **Strict enforcement** -- Users and agents access only authorized data, with no exceptions and no workarounds
2. **Transparency** -- Users can understand who accesses what resources and why

This philosophy permeates every layer of the platform: data integration, Ontology, AI, applications, and deployment.

## 2. Data Lineage

### Automatic Lineage Tracking
All backend data pipelines in Foundry are backed by **automatic data lineage tracking**. The Data Lineage application provides an interactive view of how data flows through the platform.

### Capabilities
- Visualize the full dependency graph of datasets, transforms, and derived outputs
- Trace how any dataset was produced (upstream dependencies)
- Identify what depends on any dataset (downstream impact)
- View build timelines: history of when datasets were built and their status
- Check permissions propagation through the lineage graph

### Workflow Lineage (AIP Extension)
AIP observability integrates into Workflow Lineage, extending lineage tracking to:
- Functions and their execution dependencies
- Actions and their side effects
- LLM calls and their context sources
- Agent orchestrations and their tool chains
- Automations and their triggers

This enables cross-functional teams to monitor and optimize performance at every level of applications, workflows, and products built with AIP and the Ontology.

## 3. Audit

### Audit Log Coverage
Foundry maintains comprehensive audit logs that capture **every action** taken in the platform:

- What data was accessed (read operations)
- What data was modified (write operations)
- Where the access occurred (application, API, automation)
- When the access occurred (timestamp with precision)
- Who performed the action (user identity or agent identity)

### Audit Log Categories
Audit log categories group events by what happened rather than requiring enumeration of every event name:

| Category | What It Captures |
|----------|-----------------|
| **Data loading** | Import, sync, CDC events |
| **Data exporting** | Export, download, external delivery |
| **Authentication** | Login, logout, token events |
| **Authorization** | Permission checks, access grants/denials |
| **Ontology operations** | Object reads, action executions, function calls |
| **Repository operations** | Code changes, build events |
| **Administrative** | User management, group changes, policy updates |

### Audit for AI Operations
Because every API call carries identity (whether from a human or agent):
- AIP Logic function executions are audited
- Agent tool invocations are audited with inputs, outputs, and reasoning context
- LLM prompts and responses can be captured in audit logs
- Token consumption is tracked per function, agent, and workflow

### Monitoring
Audit logs can be monitored through:
- Platform-native monitoring interfaces
- Integration with external SIEM systems (NEEDS VERIFICATION: specific SIEM integrations)
- Alerting on suspicious patterns or policy violations

## 4. Permissions

### Discretionary Permissions (RBAC)
Discretionary permissions are granted to users on individual resources through roles with different operations:

| Permission Level | Operations |
|-----------------|------------|
| **Viewer** | Read access to the resource |
| **Editor** | Read and modify the resource |
| **Owner** | Full control including permission management |

Roles can be granted at:
- The Ontology level (broad access)
- Individual resource level (specific object types, datasets, applications)

### Object Security Policies (Row-Level Security)
Object security policies configure view permissions on individual **object instances**:
- Independent of permissions on the backing data source
- Based on rules comparing user attributes, object properties, and values
- Enable row-level security at the Ontology layer (not just the database layer)

### Property Security Policies (Column-Level Security)
Property security policies guard the visibility of specific properties:
- Apply to a selection of properties on an object type
- Users must pass both the object security policy AND the property security policy to view a property value
- Enable column-level security at the Ontology layer

### Cell-Level Security
The combination of object and property security policies achieves cell-level security:
- Specific property values on specific objects can be hidden from specific users
- This is the most granular access control level available

### Granular Policies
Granular policies are sets of rules and logical operators that:
- Compare user attributes (e.g., department, clearance level, region)
- Compare against column/property values
- Determine which data the user can see
- Can be applied to both object and property security policies

## 5. Marking Categories

### What Markings Are
Markings are Palantir's implementation of **mandatory access controls (MAC)**. A marking represents a type of data to which a specified list of users or groups have access.

### Key Properties of Markings

1. **Mandatory** -- Markings cannot be overridden by project owners or data custodians
2. **Propagating** -- When a marking is applied to a dataset, the restriction propagates to **any data derived from that dataset, anywhere in the platform**
3. **Absolute** -- Users without access to a marking are guaranteed to never be able to access the marked data, even if someone tries to share it with them

### Common Marking Types
- PII (Personally Identifiable Information)
- Financially sensitive data
- Health records
- Government classification levels
- Trade secrets or proprietary data

### How Markings Work in Practice
```
Dataset A (marked: PII)
    |
    v
Transform pipeline derives Dataset B
    |
    v
Dataset B inherits PII marking automatically
    |
    v
User without PII access: BLOCKED from Dataset B
    (even if they have access to Dataset A's project)
```

### Markings in the Ontology
Markings apply at the Ontology level:
- Object types backed by marked datasets inherit those markings
- Actions that operate on marked objects enforce marking-based access
- AI agents accessing marked data must operate under tokens with appropriate marking access

### Marking Lineage
The Data Lineage application shows where markings originated:
- Click Legend > Permissions type: Data access in datasets
- Trace marking propagation through the lineage graph
- Identify the original data source that introduced a marking

## 6. Classifications

### Classification-Based Access Controls
Classifications provide attribute-based access controls that go beyond simple role assignment:

- Define classification levels (e.g., Unclassified, Confidential, Secret, Top Secret)
- Assign classifications to data resources
- Users must have the appropriate classification level to access classified data
- Classifications can be combined with markings for multi-dimensional access control

### How Classifications Differ from Markings
- Markings are categorical (PII vs. non-PII) and propagate through derivations
- Classifications are hierarchical (a user with "Secret" clearance can access "Confidential" and "Unclassified" data)
- Both are mandatory access controls that cannot be overridden

## 7. RBAC in Practice

### Group-Based Access
Users are organized in groups that can be:
- Managed within the Foundry platform directly
- Managed through external identity providers (SSO, LDAP, SAML)
- Nested (groups within groups)

### Permission Assignment Flow
```
Identity Provider
    |
    v
User --> Groups --> Roles --> Permissions on Resources
    |                             |
    v                             v
Markings/Classifications    Object/Property Policies
```

### Example Permission Matrix

| User Attribute | Permission | Scope |
|---------------|-----------|-------|
| Department: Engineering | Editor | Project: Engine Monitoring |
| Clearance: Secret | Read | All Secret-classified data |
| Marking: PII approved | Read | All PII-marked data |
| Region: EMEA | Row-level filter | See only EMEA objects |

## 8. Tenant Isolation

### Organization-Level Isolation
Organizations are the primary tenant isolation mechanism in Foundry:

- **Users of one Organization cannot access resources of another Organization** unless sharing protocols have been explicitly configured
- Organizations function as mandatory controls enforcing strict silos between user groups and resources
- Cross-organization sharing requires explicit configuration at the platform administration level

### What Isolation Guarantees

| Dimension | Guarantee |
|-----------|-----------|
| **Data** | No cross-tenant data access without explicit sharing |
| **Compute** | Rubix provides isolated compute environments |
| **Identity** | Separate user directories per organization |
| **Audit** | Audit logs are scoped to the organization |
| **Administration** | Organization administrators cannot affect other organizations |

### Multi-Tenant vs. Single-Tenant
Palantir supports both deployment models:
- **Multi-tenant SaaS** -- Organization-level isolation within shared infrastructure
- **Single-tenant** -- Dedicated infrastructure per customer (common in government/defense)
- **Air-gapped** -- Physically isolated deployments for classified environments

### Cross-Organization Sharing
When sharing is explicitly configured:
- Specific resources can be shared across organizations
- Shared resources carry their markings and classifications
- Audit logs capture all cross-organization access
- Sharing can be revoked at any time

## 9. Provenance and Event History

### Object Edit History
The Edit History widget provides an immutable audit trail of all changes made to Ontology objects:
- Changelog records **cannot be deleted or modified** by end users
- Permanent and accurate history of all changes
- Designed for compliance and traceability

### Data Provenance
Every dataset in Foundry has provenance information:
- Who created it
- What transforms produced it
- What data sources feed it
- When it was last built
- What markings apply to it

### AI Provenance
AIP extends provenance tracking to AI operations:
- Which LLM generated a result
- What context was provided to the LLM
- What tools were invoked during reasoning
- What actions were taken as a result
- Token consumption and model version

## 10. Governance for AI Agents

### AIP-Specific Governance Controls

1. **Model access control** -- Which models can be used by which functions/agents
2. **Data access scope** -- LLMs receive access only to data necessary for the task
3. **Action authorization** -- Agent-invoked actions are subject to the same submission criteria as human actions
4. **Content filtering** -- Safety guardrails apply to every model call
5. **PII handling** -- Automated PII detection and handling in LLM interactions
6. **Audit completeness** -- Every agent interaction is fully audited

### Ethics and Governance Framework
Palantir documents an AI ethics and governance framework that includes:
- Content filtering policies
- PII handling policies
- Model usage policies
- Human oversight requirements
- Audit and accountability requirements

---

**Sources:**
- [Security Overview](https://www.palantir.com/docs/foundry/security/overview)
- [Protecting Sensitive Data](https://www.palantir.com/docs/foundry/security/protecting-sensitive-data)
- [Markings](https://www.palantir.com/docs/foundry/security/markings)
- [Classification-Based Access Controls](https://www.palantir.com/docs/foundry/security/classification-based-access-controls)
- [Restricted Views](https://www.palantir.com/docs/foundry/security/restricted-views)
- [Audit Logs Overview](https://www.palantir.com/docs/foundry/security/audit-logs-overview)
- [Audit Log Categories](https://www.palantir.com/docs/foundry/security/audit-log-categories)
- [Object Permissioning Overview](https://www.palantir.com/docs/foundry/object-permissioning/overview)
- [Object Security Policies](https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies)
- [Managing Object Security](https://www.palantir.com/docs/foundry/object-permissioning/managing-object-security)
- [Data Lineage Overview](https://www.palantir.com/docs/foundry/data-lineage/overview)
- [Manage Markings](https://www.palantir.com/docs/foundry/platform-security-management/manage-markings)
- [AI Ethics and Governance](https://www.palantir.com/docs/foundry/aip/ethics-governance)
