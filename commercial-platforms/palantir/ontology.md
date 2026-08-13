# Palantir Ontology: Deep Study

**STATUS: RESEARCHED -- Based on official Palantir documentation and verified public sources (August 2026)**

---

## 1. What the Ontology Is

The Palantir Ontology is an **operational layer** that sits on top of the digital assets integrated into the Palantir platform (datasets, virtual tables, models) and connects them to their real-world counterparts -- physical assets like plants, equipment, and products, and conceptual entities like customer orders, financial transactions, or maintenance schedules.

The Ontology is explicitly described by Palantir as a "digital twin of the organization." It contains both:

- **Semantic elements** (objects, properties, links) -- the structure and meaning of organizational data
- **Kinetic elements** (actions, functions, dynamic security) -- the operations and governance that make data actionable

This dual nature is what distinguishes it from a traditional data model, semantic layer, or knowledge graph.

## 2. Core Conceptual Model: Data + Logic + Actions + Security

The Ontology integrates four dimensions into a single operational layer:

```
+------------------+------------------+
|      DATA        |      LOGIC       |
|  Objects         |  Functions       |
|  Properties      |  Derived values  |
|  Links           |  Business rules  |
|  Backing datasets|  ML models       |
+------------------+------------------+
|     ACTIONS      |    SECURITY      |
|  Modifications   |  Markings        |
|  Side effects    |  Row/col/cell    |
|  Webhooks        |  Object policies |
|  Automations     |  Classifications |
+------------------+------------------+
```

This four-fold integration is what makes the Ontology more than a BI semantic layer. A traditional semantic layer provides Data + Logic (metrics, dimensions, business definitions). The Ontology adds governed write operations (Actions) and mandatory, propagating security (Security) that follow data across all derivations.

## 3. Object Types

### Definition
An object type is a schema definition representing a real-world entity or event. It has:

- A **display name** for human readability
- A **set of typed properties** defining its attributes
- A **primary key** for unique identification
- **One or more backing datasets** that populate it with data

### How Objects Work
- An individual instance of an object type is called an **object**
- A collection of objects is an **object set**
- Objects are populated from backing datasets but present a business-meaningful abstraction over raw data
- Multiple backing datasets can feed a single object type (data fusion)

### Example
```
Object Type: "Customer Order"
  Properties: order_id (PK), customer_name, order_date, total_amount, status
  Backing datasets: orders_table, crm_enrichment_view
  Links: placed_by -> Customer, contains -> Product
```

## 4. Properties

### Definition
Properties are typed schema definitions that characterize an object type's attributes, analogous to columns in a dataset.

### Property Types Supported
- Primitives: string, integer, double, boolean, date, timestamp
- Complex: arrays, structs (composite property types)
- Geospatial types for location-aware objects
- Media references for documents, images, attachments

### Property Behavior
- Properties of each object type are converted to typed fields in the generated SDK code
- Array properties are converted to ReadOnlyArray types -- modification requires replacing the entire array value
- Properties can be derived (computed from functions or business rules), not just direct mappings from backing data

## 5. Link Types

### Definition
A link type is the schema definition of a relationship between two object types. A link is a single instance of that relationship between two objects.

### Characteristics
- Links are directional but can be traversed in both directions
- Links can be one-to-one, one-to-many, or many-to-many
- Links enable relational reasoning across the Ontology without requiring SQL joins
- AI agents can traverse links to navigate related objects (e.g., from an "Order" to a "Customer" to that customer's "Service Tickets")

### How Links Differ from Foreign Keys
Links carry semantic meaning (the relationship has a name and business purpose), not just referential integrity. They are first-class citizens in the Ontology schema, discoverable by both humans and AI agents.

## 6. Action Types

### Definition
An action type defines "a set of changes or edits to objects, property values, and links that a user can take at once." Actions enable users and agents to modify Ontology data while thinking about business objectives, not individual property edits.

### Components of an Action Type
1. **Parameters** -- User-defined typed inputs that standardize how data modifications occur
2. **Rules** -- Logic that transforms parameters into Ontology edits or triggers other effects
3. **Submission Criteria** -- Conditions that must pass before an action can be submitted (business logic validation)
4. **Side Effects** -- Post-action triggers: notifications, webhooks, scheduled builds

### Action Execution
- Actions are transactional: all changes succeed or all fail
- Actions can modify properties, create/delete objects, create/modify links
- Actions can trigger external system integrations via webhooks
- Actions support undo/revert capabilities
- Actions maintain an immutable edit history for audit

See `actions.md` for full detail.

## 7. Functions

### Definition
Functions are typed logic written in TypeScript or Python that run against Ontology objects. They accept inputs (Ontology objects, primitives, or text) and return outputs (objects, primitives, strings, or Ontology edits).

### Purpose
- Validation rules (enforce business constraints)
- Derived values (compute properties from other properties or related objects)
- Action side effects (post-action logic)
- Custom queries and aggregations
- LLM-powered functions (via AIP Logic)

### SDK Generation
Functions are generated as typed client code in the OSDK (TypeScript, Python, Java), enabling external applications to call Ontology functions with full type safety.

## 8. Interfaces

### Definition
Interfaces describe object shapes and capabilities, enabling polymorphism across object types. If multiple object types share common structures (e.g., all "Assets" have a `location` and `status` property), an interface can standardize interaction patterns.

### Purpose
- Write generic functions that operate on any object type implementing an interface
- Build applications that work across multiple object types without hardcoding each one
- Enable consistent modeling patterns across domains

## 9. Automations

The Ontology supports multiple automation modalities:

| Type | Trigger | Use Case |
|------|---------|----------|
| **Schedule-based** | Cron/interval | Periodic data refresh, report generation |
| **Event-driven** | Object state changes, streaming data | Near real-time responses to operational events |
| **API-driven** | External system calls | Integration-triggered workflows |

Automations operate on Ontology objects and can invoke actions, functions, and LLM-powered logic.

## 10. Ontology SDK (OSDK)

The OSDK generates strongly-typed client-side code for:

- **TypeScript** -- For web and Node.js applications
- **Python** -- For data science and backend integration
- **Java** -- For enterprise backend systems

### What Gets Generated
- Object type interfaces with typed properties
- Action type functions with typed parameters
- Function wrappers with typed inputs/outputs
- Link traversal methods

### How It Works
1. Define object types, actions, and functions in the Ontology Manager
2. Create an application in the Developer Console
3. Generate the OSDK package
4. Import and use type-safe Ontology operations in external code

## 11. Ontology Security

### Object Security Policies (Row-Level)
Configure view permissions on individual object instances based on security policies, independently of the permissions on the backing data source.

### Property Security Policies (Column-Level)
Guard visibility of specific properties with additional property security policies. Users must pass both object and property policies to view a property value.

### Cell-Level Security
The combination of object security policies and property security policies achieves cell-level security -- specific property values on specific objects can be hidden from specific users.

### Markings (Mandatory Access Controls)
When a marking (e.g., PII) is applied to a dataset:
- Users without access to that marking can never access the data
- This restriction **propagates** to any data derived from the marked dataset, anywhere in the platform
- Even project owners cannot override markings by sharing

### Classification-Based Access Controls
Attribute-based rules that compare user attributes, columns/properties, and values to determine data visibility. These are granular policies that go beyond simple role assignment.

## 12. Why the Ontology Is More Powerful Than a Traditional BI Semantic Layer

| Dimension | BI Semantic Layer | Palantir Ontology |
|-----------|-------------------|-------------------|
| **Read/Write** | Read-only (queries, metrics) | Read-write (queries + governed mutations) |
| **Actions** | None | First-class action types with validation, side effects, webhooks |
| **Security** | Usually deferred to database layer | Mandatory, propagating, cell-level security built into the Ontology |
| **Agent interaction** | Agents must understand database schema | Agents interact through typed, governed Ontology abstractions |
| **Automation** | Limited to scheduled queries | Schedule-based, event-driven, and API-driven automations |
| **Relationships** | SQL joins | Named, semantic link types that carry business meaning |
| **Lineage** | Often external tools | Built-in, automatic, covers all transformations |
| **Application layer** | Separate BI dashboards | Applications built directly on Ontology (Workshop, OSDK apps) |

The fundamental insight: **a semantic layer defines how to calculate; the Ontology defines what things are, how they connect, and what should happen when their state changes.**

## 13. How the Ontology Mediates Between Data and Applications

```
Raw Data Sources          Ontology                    Consumers
+------------------+     +------------------+     +------------------+
| ERPs             | --> |                  | --> | Workshop Apps    |
| CRMs             | --> | Object Types     | --> | OSDK Web Apps   |
| Industrial DBs   | --> | Properties       | --> | AIP Agents      |
| Sensor streams   | --> | Links            | --> | Automations     |
| Document stores  | --> | Actions          | --> | External APIs   |
| Geospatial repos | --> | Functions        | --> | MCP Clients     |
+------------------+     | Security         |     +------------------+
                          +------------------+
```

No consumer (human or AI) ever touches raw data directly. They interact with the Ontology's typed, governed, semantically rich abstractions. This means:

1. **Changing a backing dataset** does not change the application interface
2. **Security propagates** from data through Ontology to every consumer
3. **AI agents** reason over business concepts, not database tables
4. **Actions** are validated and audited regardless of which consumer triggers them

## 14. Entity and Relationship Representation

The Ontology represents entities (object types) and relationships (link types) as first-class, schema-defined constructs. This is comparable to a graph data model but with:

- Strong typing on all properties
- Mandatory security at every level
- Action types that define how the graph can be mutated
- Functions that compute derived values across the graph
- Interfaces that enable polymorphic operations

This makes the Ontology a **typed, secured, actionable graph** -- fundamentally different from both relational databases and traditional graph databases.

## 15. Business Meaning Modeling

The Ontology forces explicit modeling of business meaning:

- Every object type has a display name and description explaining what it represents
- Every property has a type and description explaining what it means
- Every link type has a name explaining the relationship
- Every action type has parameters and descriptions explaining what business operation it performs
- Every function has typed inputs/outputs explaining what logic it encodes

This explicit semantic layer is what enables AI agents to reason about business operations using natural language -- the Ontology already contains the business vocabulary the LLM needs.

---

**Sources:**
- [Ontology Core Concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts)
- [Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview)
- [The Ontology System](https://www.palantir.com/docs/foundry/architecture-center/ontology-system)
- [Ontology Architecture (Object Backend)](https://www.palantir.com/docs/foundry/object-backend/overview)
- [Object Security Policies](https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies)
- [Types Reference](https://www.palantir.com/docs/foundry/object-link-types/type-reference)
- [TypeScript OSDK](https://www.palantir.com/docs/foundry/ontology-sdk/typescript-osdk)
- [Ontology vs Semantic Layer (Atlan)](https://atlan.com/know/ontology-vs-semantic-layer/)
