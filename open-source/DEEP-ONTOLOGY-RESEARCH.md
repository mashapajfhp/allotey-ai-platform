# Deep Ontology & Context Graph Research

**Date**: August 13, 2026
**Purpose**: Evaluate open-source ontology and context graph projects for the Allotey AI Platform
**Mandate**: NO PAID DEPENDENCIES. Enterprise-grade. Open-source-first.

---

## Table of Contents

1. [Semantica Analysis](#1-semantica-analysis)
2. [TrustGraph Analysis](#2-trustgraph-analysis)
3. [TypeDB Analysis](#3-typedb-analysis)
4. [TerminusDB Status Check](#4-terminusdb-status-check)
5. [Build-Your-Own Ontology Analysis](#5-build-your-own-ontology-analysis)
6. [Architecture Recommendation](#6-architecture-recommendation)
7. [TypeDB + Graphiti Combination](#7-typedb--graphiti-combination)
8. [Final Recommendation](#8-final-recommendation)

---

## 1. Semantica Analysis

**Repository**: https://github.com/semantica-agi/semantica
**License**: MIT
**Language**: Python
**Stars**: ~6,400 | **Forks**: ~673 | **Contributors**: 21
**Current Version**: 0.6.5 (security release)
**First Stable Release**: v0.3.0 (March 10, 2026)

### 1.1 What Is It Actually?

Semantica is a Python framework for building auditable, explainable AI systems using context graphs, decision intelligence, and W3C-compliant provenance. It brands itself as "The Open Source Palantir for AI Agents." The project was created by a solo developer who left their job to build it, and has since attracted 21 contributors.

**Pipeline architecture**: Sources -> Ingest -> Parse -> Normalize -> Split -> Extract -> Conflict Detection -> Deduplication -> Knowledge Graph -> [Ontology / Reasoning / Provenance / Decisions] -> Enriched KG -> Vector Store + Polyglot Graph Store -> Export/Visualize/REST/MCP/CLI

### 1.2 Context Graphs -- Implementation Reality

Context graphs in Semantica are implemented via the `ContextGraph` class with:

- **Typed nodes and edges** with metadata (add_node, add_edge)
- **BFS traversal** via `get_neighbors(node_id, hops=N)`
- **Point-in-time snapshots** via `state_at(timestamp)` -- temporal validity (`valid_from`/`valid_until`)
- **Cross-graph linking** -- separate ContextGraph instances can reference each other
- **AgentContext API** -- wraps ContextGraph + VectorStore for agent memory workflows

```python
graph = ContextGraph(advanced_analytics=True)
graph.add_node("acme_corp", "Organization", name="Acme Corp", industry="SaaS")
graph.add_edge("alice_chen", "acme_corp", edge_type="works_for", since="2019-03-01")
neighbors = graph.get_neighbors("acme_corp", hops=2)
snapshot = graph.state_at("2024-01-01")
```

**Verdict**: Context graphs are real and functional. The API is clean and Pythonic. The temporal support and cross-graph linking are genuine features backed by code and tests.

### 1.3 Decision Objects -- Code Evidence

Decision objects are first-class citizens in Semantica:

- `record_decision()` -- creates a structured decision node with category, scenario, reasoning, outcome, confidence
- `add_causal_relationship()` -- links decisions with typed causal edges (CAUSED, INFLUENCED, PRECEDENT_FOR)
- `trace_decision_chain()` -- full causal ancestry traversal
- `find_similar_decisions()` -- semantic precedent search
- `analyze_decision_impact()` -- downstream influence mapping
- `check_decision_rules()` -- policy compliance gates

**Verdict**: Decision objects are genuinely implemented, not marketing. This is one of Semantica's strongest differentiators. No other open-source project in this space treats decisions as first-class queryable graph nodes.

### 1.4 Provenance -- W3C PROV-O

- ProvenanceManager class with `track_entity()` for source tracking
- Export to W3C PROV-O Turtle format via `RDFExporter`
- Source-linked lineage across all 17 modules (per release notes)
- Full PROV-O trust/spec completeness claimed as of v0.6.5

**Verdict**: W3C PROV-O is implemented and export-ready. The v0.6.5 release specifically highlights "full PROV-O trust/spec completeness."

### 1.5 MCP Support

The repository contains an `/mcp` directory with a Model Context Protocol server implementation. Additionally, there are plugin bundles for Claude Code, Cursor, Windsurf, and a REST API for tools like GitHub Copilot and Amazon Q.

**Verdict**: MCP support is real and shipping.

### 1.6 Maturity Assessment

| Signal | Status |
|--------|--------|
| Lines of Python code | ~5,875 |
| Test count | 237 tests (886+ passing across all checks) |
| Production releases | v0.3.0 (Mar 2026) through v0.6.5 (Aug 2026) |
| Security patches | v0.6.5 closed 6 CVEs including Critical auth gap |
| Graph backends | 8+ (Neo4j, FalkorDB, AGE, Neptune, Oxigraph, Blazegraph, Jena, RDF4J) |
| Vector backends | FAISS, Pinecone, Weaviate, Qdrant, Milvus, pgvector |
| GitHub Trending | #1 on August 10, 2026 |
| Graph algorithms | 30+ across 7 categories |

**Codebase size concern**: ~5,875 lines of Python for 29 claimed production modules is lean. That averages ~200 lines per module. This suggests either very tight code or that some modules are thin wrappers around existing libraries. For a library-style project (not a full application), this is plausible but warrants scrutiny.

**NEEDS VERIFICATION**: Whether the 5,875 LOC figure counts only the `semantica/` directory or the entire repo (including tests, examples, integrations). The actual core library may be larger or smaller.

### 1.7 Concepts Worth Borrowing

1. **Decision-as-first-class-object** -- brilliant pattern for enterprise AI. Every agent decision becomes traceable, searchable, and auditable. This maps directly to Palantir's "Actions" concept.
2. **Causal relationship chains** between decisions -- essential for compliance and explainability.
3. **Polyglot graph storage** -- the idea of a unified API over multiple backends (RDF and LPG) is architecturally sound.
4. **Temporal context** (`valid_from`/`valid_until` on all nodes/edges) -- essential for enterprise use.
5. **Conflict detection before merge** -- prevents silent data corruption in multi-source scenarios.

### 1.8 Risks

- **Small team**: 21 contributors, but likely driven by 1-3 core developers. Bus factor risk.
- **Rapid version progression**: v0.3.0 to v0.6.5 in 5 months suggests fast iteration but also potential instability.
- **6 CVEs in a single release** (v0.6.5) is concerning for a project of this age -- though the fact that they were found and fixed is positive.
- **Codebase leanness**: 5,875 LOC may indicate reliance on external libraries for heavy lifting. Could be a strength (less to maintain) or a weakness (less control).

---

## 2. TrustGraph Analysis

**Repository**: https://github.com/trustgraph-ai/trustgraph
**License**: Apache 2.0
**Language**: Python (core), TypeScript (UI/client libraries)
**Stars**: ~12,000+ | **Forks**: ~299 | **Commits**: 1,516
**Founded**: July 10, 2024 (San Francisco)
**Current Version**: TrustGraph 2.0 (March 2026)

### 2.1 Architecture Overview

TrustGraph is a **full platform**, not just a library. It is a containerized, microservices-based system with:

- **Messaging backbone**: Apache Pulsar or RabbitMQ (all services communicate via pub/sub)
- **Storage layer**: Cassandra (metadata), Qdrant (vectors), Garage (S3-compatible objects)
- **Graph databases**: Pluggable -- Neo4j, Memgraph, FalkorDB
- **LLM inference**: vLLM, Ollama, TGI, LM Studio, Llamafiles
- **Observability**: Grafana + Loki
- **Deployment**: Docker/Podman locally, Kubernetes for production
- **Standards**: RDF, OWL, SKOS, SHACL (full W3C Semantic Web stack)

This is a **heavyweight infrastructure platform**, not a pip-installable library.

### 2.2 Holonic Context Graphs -- What They Actually Mean

TrustGraph's "holonic" approach treats knowledge as nested wholes-within-wholes:

- A **holon** = a single semantic triple (Subject-Predicate-Object) plus metadata (provenance, source, confidence)
- Holons use **RDF 1.2 (RDF-star)** for graph reification -- making "statements about statements"
- A **context graph** = a dynamic, query-specific subgraph assembled by traversing holons via OWL ontology relationships
- Context graphs are temporary -- built on-the-fly per query rather than pre-computed

**Key insight**: TrustGraph's context graphs are NOT the same as Graphiti's. TrustGraph builds transient subgraphs per query from a global knowledge graph. Graphiti builds persistent per-subject context graphs with temporal versioning.

### 2.3 Context Cores -- Deployable Knowledge Packages

Context Cores are TrustGraph's unit of knowledge isolation:

- **Contains**: Knowledge graph edges + schema information + graph embeddings
- **States**: Offline (file) -> Online (loaded in service) -> Loaded (queryable)
- **Portable**: Can be exported, transferred between instances, versioned
- **One core per document** when using standard extraction flows
- **Use case**: Package domain knowledge and deploy it to different agent environments

**Verdict**: Context Cores are a genuine, well-designed concept for knowledge modularity. This is conceptually similar to how Palantir packages ontology segments for different applications.

### 2.4 Multi-Tenancy

Implemented through **Workspaces** -- fully isolated tenancy scopes where all data, users, configuration, and pipelines live independently. Within workspaces, **Collections** provide domain-specific groupings.

**Verdict**: Multi-tenancy is real and architecturally sound, though verification of actual production deployments would strengthen confidence.

### 2.5 Agent Architecture

- REST API + WebSocket API for client access
- Python and TypeScript client libraries (@trustgraph/client, @trustgraph/react-state, @trustgraph/react-provider)
- MCP server (`trustgraph-mcp`) for agent tool integration
- Agent console with streaming responses
- Ontology and schema workbenches (UI)

### 2.6 W3C Standards Support

| Standard | Status |
|----------|--------|
| RDF 1.2 (RDF-star) | Core data model |
| OWL | Ontology definitions |
| SKOS | Vocabulary management |
| SHACL | Schema validation |
| SPARQL | Querying (via RDF stores) |

**Verdict**: TrustGraph has the most comprehensive W3C standards support of any project reviewed. This is a genuine strength for enterprise compliance and interoperability.

### 2.7 Maturity Assessment

| Signal | Status |
|--------|--------|
| Stars | 12,000+ (strong community signal) |
| Architecture | Production-grade microservices |
| Deployment | Docker, K8s, multi-cloud verified |
| Infrastructure deps | Cassandra + Qdrant + Pulsar/RabbitMQ (HEAVY) |
| Community | Active Discord, YouTube, documentation site |
| TrustGraph 2.0 | End-to-end explainability (March 2026) |
| TypeScript libraries | React providers, state management |

### 2.8 Concepts Worth Borrowing

1. **Context Cores** -- portable, versioned, deployable knowledge packages. Brilliant concept.
2. **RDF-star reification** -- making statements about statements, attaching provenance to relationships themselves.
3. **Holonic composition** -- knowledge units that are both complete in themselves and part of a larger whole.
4. **Ontology-guided extraction** -- using OWL/SHACL schemas to guide LLM knowledge extraction from documents.
5. **Flow-based processing** -- decoupled processors communicating via pub/sub for knowledge extraction pipelines.

### 2.9 Risks

- **Infrastructure weight**: Requires Cassandra + Qdrant + Pulsar/RabbitMQ minimum. This is NOT a lightweight dependency. Running TrustGraph in production means operating a distributed systems stack.
- **Operational complexity**: Multiple containerized services to manage, monitor, and scale.
- **Tight coupling to specific backends**: While pluggable, the architecture assumes a specific infrastructure pattern.
- **Overkill for many use cases**: If you just need typed entity definitions and action rules, TrustGraph is bringing a battleship to a knife fight.

---

## 3. TypeDB Analysis

**Repository**: https://github.com/typedb/typedb
**License**: MPL-2.0 (Mozilla Public License 2.0)
**Language**: Rust (as of 3.0, previously Java)
**Stars**: ~4,400 | **Forks**: ~371 | **Commits**: 7,374
**Current Version**: TypeDB 3.0 (December 20, 2024)
**Company**: TypeDB (formerly Vaticle)

### 3.1 Type System

TypeDB implements a **Polymorphic Entity-Relation-Attribute (PERA)** model:

```typeql
define
  attribute username, value string;
  attribute page-visibility, value string @values("public", "private");
  attribute address, value string;
  attribute dob, value date;

  entity profile @abstract, owns username @key, owns page-visibility @card(1);
  entity person, sub profile, owns dob, plays employment:employee;
  entity company, sub profile, owns address @card(0..), plays employment:employer;

  relation employment, relates employer, relates employee;
```

Key type system features:
- **Entity types** with single inheritance (`sub`)
- **Relation types** with named roles (`relates`)
- **Attribute types** with value constraints (`@values`, `@card`, `@key`, `@unique`)
- **Abstract types** (cannot be instantiated directly)
- **Hypergraph relations** (n-ary, connecting multiple entities)
- No null values -- attributes either exist or don't
- Multi-valued attributes by default (many-to-many cardinality)

### 3.2 TypeQL -- Query Language

TypeQL 3.0 is declarative, functional, and strongly typed:

- **Pattern matching** with AND, OR, NOT, TRY (optional)
- **Query pipelining** -- chain read/write/transformation without client round-trips
- **User-defined functions** (replaced rules in 3.0) -- supports recursion, aggregation, streams
- **Computed values and expressions** (arithmetic, date/time planned)
- **CRUD**: insert, put, update, delete, reduce, fetch

### 3.3 Reasoning -- Functions Replace Rules

In TypeDB 3.0, **functions** replace the previous rule-based reasoning:
- More powerful: support recursion, aggregation, streaming
- More composable: reusable subqueries
- More intuitive: familiar programming model
- Bridge between querying and reasoning in the type system

**NEEDS VERIFICATION**: How performant is function-based reasoning at scale? Benchmarks are "forthcoming" per TypeDB's blog.

### 3.4 TypeDB 3.0 Rust Rewrite Status

- Full rewrite from Java to Rust completed and released December 2024
- Storage engine: RocksDB
- Build system: Bazel or Cargo
- Communication: gRPC + ZeroMQ
- Cross-platform: Linux, macOS, Windows (x86_64 + ARM64)
- Performance improvements claimed but benchmarks not yet published

### 3.5 Schema as Ontology Definition

TypeDB's schema IS an ontology:
- Entity types map to ontology classes
- Relation types map to ontology relationships
- Attribute types map to ontology properties
- Inheritance hierarchies model class taxonomies
- Constraints enforce domain rules (cardinality, value ranges, enumerations)
- Functions can encode business rules and inference

**This is TypeDB's killer feature for our use case**: It provides a formal, validated, strongly-typed ontology definition language that can serve as the single source of truth for entity types, relationships, and constraints.

### 3.6 Could TypeDB Serve as the Ontology Definition Layer?

**Arguments FOR**:
- Purpose-built for exactly this: defining typed entity-relation-attribute schemas
- Validation at write time prevents invalid data
- Inheritance hierarchy models real-world domain taxonomies
- Constraints (cardinality, value ranges, enums) are built-in, not bolted-on
- The PERA model is more expressive than relational or document models
- Functions enable reasoning and inference within the schema

**Arguments AGAINST**:
- **Operational overhead**: Running a separate database system just for ontology definitions
- **Learning curve**: TypeQL is a new language developers must learn
- **Ecosystem size**: Much smaller community than PostgreSQL or Neo4j
- **Performance unknowns**: 3.0 benchmarks not published
- **Enterprise features gated**: Clustering, HA, RBAC are Enterprise Edition only
- **Driver availability**: Python, TypeScript, Java, Rust only -- no Go, C#, C++

### 3.7 MPL-2.0 License Implications

MPL-2.0 is a **per-file weak copyleft**:
- If you **modify a TypeDB source file**, you must release that modified file under MPL-2.0
- If you **add new files** alongside TypeDB, those files can remain proprietary or use any license
- You CAN use TypeDB in commercial products without opening your entire codebase
- You CAN combine TypeDB with proprietary code in the same project
- Practical impact: **minimal** for a platform that uses TypeDB as a dependency. You only need to share modifications to TypeDB itself.

**Verdict**: MPL-2.0 is compatible with our open-source-first mandate. It is less permissive than MIT/Apache 2.0 but far less restrictive than GPL. The per-file copyleft means we can use TypeDB freely as long as we don't fork and modify its source files.

### 3.8 Multi-Tenancy

Each TypeDB database is an isolation unit. You can create multiple databases per server for tenant isolation. However, there is no built-in multi-tenancy at the application level -- this would need to be implemented in the application layer.

### 3.9 AI/Agent Integration

- "Vibe querying" -- natural language to TypeQL (new in 3.0)
- MCP server for autonomous agent operations (in development)
- llms.txt context files for LLM integration
- TypeDB Studio with AI-assisted querying

**NEEDS VERIFICATION**: The MCP server is described as "in development" -- unclear if it is shipping or planned.

---

## 4. TerminusDB Status Check

**Repository**: https://github.com/terminusdb/terminusdb
**License**: Apache 2.0
**Language**: Prolog (core engine), Rust (storage layer)
**Stars**: ~3,400 | **Forks**: ~148 | **Commits**: 5,798
**Current Version**: v12.0.7 (latest stable)
**Maintainer**: DFRNT (assumed maintainership in 2025)

### 4.1 Is It Alive?

**Yes, but in a niche, steady-state mode.**

- TerminusDB 12 was released December 2025 with significant features
- v12.0.7 released in 2026 with 3 new contributors
- DFRNT (dfrnt.com) assumed maintainership during 2025
- New website at terminusdb.org, active Discord community
- Contracted developer for engine enhancements

The project is NOT dead, but it is in a **maintenance/incremental improvement phase** under new stewardship rather than experiencing rapid growth or feature development.

### 4.2 Key Features

- **Git-for-data**: Branch, merge, diff, push, pull, clone, time-travel queries
- **Schema engine**: Compatible with OWL ontologies (closed-world interpretation)
- **WOQL**: Prolog-based Datalog query language
- **JSON-LD**: Documents linked in semantic knowledge graphs
- **Precision**: Arbitrary precision decimals (v12), Allen Interval Algebra for temporal reasoning
- **Revision control**: Full version history with diff capabilities

### 4.3 Versioning Concepts Worth Borrowing

TerminusDB's most valuable contribution is its **data versioning model**:

1. **Branch**: Create branches of the entire database state
2. **Diff**: Compare any two states to see what changed
3. **Merge**: Combine branches with conflict detection
4. **Time travel**: Query the database at any historical point
5. **Push/Pull**: Distribute data changes like git

**For ontology versioning**: These concepts are directly applicable. An ontology that evolves over time needs:
- Version history (who changed what, when, why)
- Branch-and-merge for testing ontology changes
- Diff to understand impact of ontology evolution
- Time travel to query data under historical schemas

### 4.4 Assessment for Our Platform

**Not recommended as a primary ontology store**, but the versioning concepts should inform our design. TerminusDB is:
- Too niche (Prolog-based, small community)
- Too specialized (git-for-data is its identity, not ontology management)
- WOQL query language has minimal adoption and tooling
- Limited ecosystem and integration options

**Borrow the ideas; don't adopt the tool.**

---

## 5. Build-Your-Own Ontology Analysis

### 5.1 What Palantir's Ontology Actually Does

Based on research into Palantir's Foundry documentation, the ontology layer provides:

| Component | Palantir Implementation | What We Need |
|-----------|------------------------|--------------|
| **Object Types** | Schema definitions for real-world entities with typed properties, primary keys, backing datasets | Entity type definitions with properties and constraints |
| **Link Types** | Typed, directed relationships between object types | Relationship definitions with cardinality and validation |
| **Action Types** | Governed operations on entities with rules, side effects, validation, permissions | Action definitions that generate agent tools |
| **Functions** | TypeScript/Python functions for business logic, ontology edits, model integration | Business logic layer tied to entity types |
| **Interfaces** | Object type polymorphism for shared shapes | Type hierarchies and shared property schemas |
| **Structs** | Reusable data structures across types | Composable property schemas |
| **Security** | Object-level permissions, action authorization, user edit history | Fine-grained authorization tied to entity types |

### 5.2 The Ontology-as-Code Approach

Inspired by how Cube.js does "metrics-as-code," we could define ontology-as-code:

```typescript
// entities/customer.entity.ts
import { defineEntity, string, number, date, relation } from '@allotey/ontology';

export const Customer = defineEntity('Customer', {
  properties: {
    id: string().key(),
    name: string().required(),
    email: string().unique().format('email'),
    tier: string().enum(['free', 'pro', 'enterprise']),
    mrr: number().min(0),
    createdAt: date().default('now'),
  },
  relations: {
    orders: relation('Order').hasMany(),
    account_manager: relation('Employee').hasOne(),
    organization: relation('Organization').belongsTo(),
  },
  actions: {
    upgrade: action({
      params: { newTier: string().enum(['pro', 'enterprise']) },
      rules: [
        require('customer.can_upgrade'),
        validate(({ customer, newTier }) => customer.tier !== newTier),
      ],
      execute: async ({ customer, newTier }) => {
        customer.tier = newTier;
        await notify('account_manager', `${customer.name} upgraded to ${newTier}`);
      },
    }),
    churn: action({
      params: { reason: string() },
      rules: [require('customer.can_modify')],
      sideEffects: [webhook('crm.customer_churned')],
    }),
  },
  security: {
    read: 'customer:viewer',    // OpenFGA relation
    write: 'customer:editor',
    delete: 'customer:admin',
  },
});
```

### 5.3 What the Compiler Would Generate

From ontology definitions, a compiler would produce:

1. **Database schemas**: PostgreSQL tables, indexes, constraints, migrations
2. **API endpoints**: REST/GraphQL endpoints for CRUD operations
3. **Agent tools**: MCP tool definitions agents can discover and invoke
4. **Validation logic**: Runtime type checking and constraint enforcement
5. **Authorization checks**: OpenFGA relationship queries for each operation
6. **TypeScript/Python types**: Strongly-typed client SDKs
7. **Documentation**: Auto-generated API docs and entity relationship diagrams

### 5.4 Technology Stack for Build-Your-Own

| Layer | Technology | Role |
|-------|-----------|------|
| **Definition** | TypeScript types + decorators | Ontology schema as code |
| **Validation** | JSON Schema (generated from definitions) | Runtime validation |
| **Storage** | PostgreSQL + pgvector | Entity instances, relationships, embeddings |
| **Authorization** | OpenFGA | Fine-grained access control (CNCF Incubating) |
| **Context graphs** | Graphiti (temporal KG) | Agent memory, temporal facts |
| **Versioning** | Git (ontology definitions are code) | Version control, branching, PRs |
| **Agent tools** | MCP server (generated from ontology) | Agent integration |
| **Inference** | Custom rules engine or SPARQL | Business rule evaluation |

### 5.5 Feasibility Assessment

**Strengths of build-your-own**:
- Full control over every design decision
- No external database to operate (PostgreSQL is already a dependency)
- Ontology definitions live in the codebase (version controlled, code reviewed, CI/CD)
- TypeScript/Python -- languages the team already knows
- JSON Schema is universal and well-tooled
- OpenFGA is CNCF Incubating with excellent adoption (Grafana, Docker, Canonical)
- Graphiti provides temporal context graphs without running a separate graph database
- Ontology evolution = code changes = standard git workflow

**Weaknesses of build-your-own**:
- Must build the ontology compiler from scratch (significant engineering effort)
- No built-in reasoning/inference engine (must build or integrate one)
- No hypergraph support (PostgreSQL is relational, not natively graph)
- Schema validation is simpler than TypeDB's (no inheritance-aware type checking)
- Must implement ontology-aware query capabilities manually
- Risk of reinventing wheels that TypeDB/Semantica already solved

**Estimated engineering effort**: 3-6 months for a v1 ontology compiler that generates database schemas, API endpoints, agent tools, and authorization checks from TypeScript definitions.

---

## 6. Architecture Recommendation

### 6.1 Ruling Out Full Platform Adoption

| Project | Verdict | Reason |
|---------|---------|--------|
| **TrustGraph** (adopt whole) | NO | Too heavy. Requires Cassandra + Qdrant + Pulsar minimum. We would be adopting an infrastructure platform, not a library. |
| **TypeDB** (primary store) | NO | Adds operational complexity of running a separate database. Enterprise features (HA, clustering, RBAC) are not in Community Edition. TypeQL learning curve for the team. |
| **Semantica** (adopt whole) | MAYBE | Closer to what we need -- it is a pip-installable library with clean APIs. But it is young (first stable release March 2026) and small-team risk. |
| **TerminusDB** (adopt whole) | NO | Too niche, WOQL is obscure, git-for-data is not our primary need. |

### 6.2 Recommended Architecture: Ontology-as-Code + Selective Borrowing

The platform should **build its own ontology-as-code system** while selectively borrowing proven concepts:

```
+-------------------------------------------------------------------+
|                    Ontology-as-Code Layer                          |
|  TypeScript/Python definitions -> Compiler -> Generated artifacts |
+-------------------------------------------------------------------+
       |              |              |              |
       v              v              v              v
+----------+  +-----------+  +----------+  +------------+
| PostgreSQL|  | OpenFGA   |  | MCP Tools|  | Graphiti   |
| (storage) |  | (authz)   |  | (agents) |  | (context)  |
+----------+  +-----------+  +----------+  +------------+
```

**Borrow from Semantica**:
- Decision-as-first-class-object pattern
- Causal relationship chains between decisions
- Conflict detection before merge
- W3C PROV-O export patterns (for compliance)

**Borrow from TrustGraph**:
- Context Cores concept (portable knowledge packages)
- Ontology-guided extraction (using schema to guide LLM extraction)
- Holonic composition (knowledge units that are both whole and part)

**Borrow from TypeDB**:
- PERA model (entity-relation-attribute with inheritance)
- Constraint system (cardinality, value ranges, enumerations)
- Type inheritance hierarchies

**Borrow from TerminusDB**:
- Ontology versioning concepts (branch, diff, merge, time travel)
- Treat ontology changes like data migrations with diff capabilities

### 6.3 Why Not Just Use Semantica Directly?

Semantica is the closest to what we need, but:

1. **It is a knowledge graph framework, not an ontology definition system.** It helps you BUILD graphs and REASON over them, but it does not provide a declarative way to define your domain ontology and compile it into database schemas, API endpoints, and agent tools.

2. **We need ontology -> infrastructure generation.** Palantir's power comes from defining object types and having the platform automatically generate UIs, APIs, permissions, and agent tools. Semantica doesn't do this.

3. **Integration risk.** Semantica is young and lean. Building our platform's core ontology layer on a 5,875 LOC library with 21 contributors is a risk. Better to borrow its best ideas.

4. **Semantica could be a COMPLEMENT, not a replacement.** Use ontology-as-code for entity/relationship/action definitions, and potentially use Semantica's context graph and decision intelligence modules for the runtime reasoning layer.

---

## 7. TypeDB + Graphiti Combination

### 7.1 The Theoretical Appeal

The idea: TypeDB defines the ontology (types, constraints, rules) and Graphiti stores temporal instances (facts about entities, their relationships, how they change over time).

```
TypeDB (Schema Layer)           Graphiti (Instance Layer)
- Entity types                  - Entity instances
- Relation types               - Relationship facts
- Attribute constraints         - Temporal state changes
- Inference rules              - Agent memory
- Type validation              - Point-in-time queries
```

### 7.2 Why This Is Over-Engineered

1. **Two separate databases to operate**: TypeDB + Neo4j/FalkorDB (Graphiti's backend). Plus PostgreSQL for the rest of the platform. That's 3 database systems.

2. **Synchronization burden**: Keeping TypeDB's schema in sync with Graphiti's graph structure requires a custom synchronization layer. When you add a new entity type in TypeDB, Graphiti doesn't automatically know about it.

3. **Query fragmentation**: Developers must decide whether to query TypeDB (for schema/type questions) or Graphiti (for instance/temporal questions). This creates cognitive overhead and potential inconsistencies.

4. **TypeDB Community Edition limitations**: No clustering, no HA, no RBAC. For a production platform, you would need Enterprise Edition (paid) for TypeDB, which violates the NO PAID DEPENDENCIES mandate.

5. **Graphiti's Neo4j dependency**: Graphiti's primary backend is Neo4j 5.26+. Neo4j Community Edition is GPL-licensed (copyleft). Neo4j Enterprise is paid. FalkorDB is an alternative but less mature.

6. **Marginal benefit over PostgreSQL**: The TypeDB type system is elegant, but PostgreSQL + JSON Schema + application-layer validation can achieve 80% of the same result at 20% of the operational cost.

### 7.3 Verdict

**TypeDB + Graphiti is architecturally elegant but operationally impractical for our use case.** The complexity-to-value ratio is too high. The same goals can be achieved with:
- TypeScript type definitions (schema)
- PostgreSQL (storage)
- Graphiti or Semantica context graphs (temporal reasoning)
- OpenFGA (authorization)

---

## 8. Final Recommendation

### 8.1 Primary Recommendation: Build Ontology-as-Code

**Build a custom ontology-as-code system** inspired by Cube's metrics-as-code pattern, TypeDB's type system concepts, and Palantir's ontology architecture.

#### Core Design Principles

1. **Code-first**: Ontology definitions are TypeScript/Python files in the repository
2. **Compiled**: A compiler transforms definitions into database schemas, API endpoints, agent tools, and authorization rules
3. **Version-controlled**: Ontology changes go through git (branch, PR, review, merge)
4. **Migrated**: Ontology evolution generates database migrations (like Prisma or Alembic)
5. **Validated**: JSON Schema generated from definitions for runtime validation
6. **Authorized**: OpenFGA integration for entity-level and action-level access control
7. **Agent-native**: MCP tool definitions auto-generated from action definitions

#### Technology Choices

| Component | Choice | License | Rationale |
|-----------|--------|---------|-----------|
| Ontology definitions | TypeScript types | N/A | Team knows it, version controllable, IDE support |
| Ontology compiler | Custom (build) | Own | Core platform differentiator |
| Entity storage | PostgreSQL | PostgreSQL License | Already a platform dependency, proven at scale |
| Authorization | OpenFGA | Apache 2.0 | CNCF Incubating, Zanzibar model, agent authorization support |
| Context graphs | Graphiti | Apache 2.0 (NEEDS VERIFICATION) | Temporal KG, MCP server, 30k+ stars, production-grade |
| Context graph backend | FalkorDB | Server Side Public License / MIT (client) | Open-source Redis-compatible graph DB, Graphiti-supported |
| Decision intelligence | Semantica (selective) | MIT | Borrow decision-as-object and causal chain patterns |
| Provenance | W3C PROV-O (custom impl) | N/A | Standard-based, generate from ontology metadata |
| Validation | JSON Schema (generated) | N/A | Universal standard, generated from type definitions |
| Agent tools | MCP server (generated) | N/A | Auto-generated from action definitions |

#### Graphiti Backend Note

Graphiti supports Neo4j, FalkorDB, and Amazon Neptune as backends. For the open-source-first mandate:
- **Neo4j Community**: GPL-3.0 (strong copyleft -- problematic for commercial platform)
- **FalkorDB**: SSPL for server, MIT for client libraries -- similar to MongoDB's model
- **Neptune**: AWS proprietary (ruled out)

**NEEDS VERIFICATION**: FalkorDB's SSPL license may create issues if we modify the database server itself. For using it as a dependency (not modifying server code), SSPL is generally acceptable. Alternatively, Graphiti's deprecated Kuzu backend or a custom PostgreSQL-based backend could be explored.

### 8.2 Phased Implementation

**Phase 1 (Months 1-2): Foundation**
- Define the ontology DSL (TypeScript types, decorators, or builder pattern)
- Build the ontology compiler v1 (generates PostgreSQL schemas + JSON Schema)
- Implement entity CRUD with validation
- Basic OpenFGA integration for entity-level permissions

**Phase 2 (Months 2-4): Agent Integration**
- MCP tool generator (from action definitions)
- Graphiti integration for temporal context graphs
- Decision recording (borrow Semantica's pattern)
- Action execution with authorization checks

**Phase 3 (Months 4-6): Intelligence Layer**
- Ontology-guided knowledge extraction (borrow TrustGraph's concept)
- Causal reasoning chains (borrow Semantica's pattern)
- Ontology versioning with migration generation
- Context Core-like knowledge packaging (borrow TrustGraph's concept)

### 8.3 What We Are NOT Building

- A general-purpose graph database (use PostgreSQL + Graphiti)
- A full W3C Semantic Web stack (RDF/OWL/SPARQL -- too heavy for our needs)
- A distributed knowledge extraction pipeline (TrustGraph's domain, not ours)
- A replacement for Semantica or TrustGraph (different scope)

### 8.4 The Bottom Line

| Approach | Build Effort | Operational Complexity | Control | Power |
|----------|-------------|----------------------|---------|-------|
| **Ontology-as-Code (recommended)** | Medium (3-6 months) | Low (PostgreSQL + OpenFGA) | Full | 80% of TypeDB |
| TypeDB as ontology store | Low (integrate) | High (separate DB to operate) | Partial | 100% |
| Semantica as platform | Low (integrate) | Medium | Low | Different focus |
| TrustGraph as platform | Low (deploy) | Very High (Cassandra + Qdrant + Pulsar) | Low | Overkill |
| TypeDB + Graphiti combo | Medium | Very High (3 databases) | Partial | Maximum |

**The ontology-as-code approach provides the best balance of control, simplicity, and power for an open-source-first enterprise AI platform.** It avoids external database dependencies beyond PostgreSQL, keeps the ontology in version-controlled code, generates everything agents need automatically, and can be extended incrementally as needs evolve.

The key insight from this research: **Palantir's ontology power comes not from a sophisticated database, but from the compiler that transforms entity definitions into operational infrastructure (APIs, UIs, permissions, agent tools).** We should build that compiler, not adopt someone else's database.

---

## Appendix A: Project Comparison Matrix

| Feature | Semantica | TrustGraph | TypeDB | TerminusDB |
|---------|-----------|------------|--------|------------|
| **License** | MIT | Apache 2.0 | MPL-2.0 | Apache 2.0 |
| **Language** | Python | Python/TS | Rust | Prolog/Rust |
| **Stars** | ~6,400 | ~12,000 | ~4,400 | ~3,400 |
| **Type** | Library | Platform | Database | Database |
| **Ontology definition** | SHACL/OWL | OWL/SKOS/SHACL | TypeQL schemas | OWL-compatible |
| **Context graphs** | Yes (first-class) | Yes (holonic) | No | No |
| **Decision tracking** | Yes (first-class) | No | No | No |
| **Temporal support** | Yes (valid_from/until) | Yes (RDF-star) | No native | Yes (Allen algebra) |
| **MCP support** | Yes (shipping) | Yes (shipping) | In development | No |
| **Reasoning** | Rete, Datalog, SPARQL | Via ontology traversal | Functions (3.0) | WOQL/Datalog |
| **Provenance** | W3C PROV-O | RDF-star reification | No | Git-like history |
| **Multi-tenancy** | No native | Workspaces | Databases | Branches |
| **Deployment** | pip install | Docker/K8s stack | Binary/Docker | Docker/Snap |
| **Infra deps** | Minimal (embedded OK) | Cassandra+Qdrant+Pulsar | RocksDB (embedded) | None (embedded) |
| **Maturity** | Young (2026) | Active (2024-2026) | Mature (rewritten 2024) | Steady (2025 new owners) |
| **Primary risk** | Small team, young | Infrastructure weight | Enterprise features gated | Niche, small community |

## Appendix B: License Compatibility Summary

| License | Commercial Use | Modification Sharing | Copyleft Scope | Compatible with MIT? |
|---------|---------------|---------------------|----------------|---------------------|
| MIT | Yes | No requirement | None | Yes |
| Apache 2.0 | Yes | No requirement | None | Yes |
| MPL-2.0 | Yes | Modified files only | Per-file | Yes (with care) |
| GPL-3.0 (Neo4j CE) | Yes | Entire derivative work | Strong | No |
| SSPL (FalkorDB) | Yes (with limits) | Service code if offering as service | Very strong | No |

## Appendix C: Key Sources

- [Semantica GitHub](https://github.com/semantica-agi/semantica)
- [Semantica Website](https://getsemantica.ai/)
- [TrustGraph GitHub](https://github.com/trustgraph-ai/trustgraph)
- [TrustGraph Documentation](https://docs.trustgraph.ai/)
- [TrustGraph - Holons, Context Graphs, Ontologies](https://trustgraph.ai/guides/key-concepts/ontologies-holons-context-graphs/)
- [TrustGraph - Context Cores](https://docs.trustgraph.ai/guides/context-cores/)
- [TrustGraph - Why Not PostgreSQL](https://trustgraph.ai/guides/key-concepts/why-cant-i-do-this-in-postgres/)
- [TypeDB GitHub](https://github.com/typedb/typedb)
- [TypeDB Features](https://typedb.com/features)
- [TypeDB 3.0 Announcement](https://typedb.com/blog/typedb-3-0-is-now-live/)
- [TypeDB Schema Documentation](https://typedb.com/docs/core-concepts/typeql/schema-data/)
- [TerminusDB GitHub](https://github.com/terminusdb/terminusdb)
- [TerminusDB 12 Release](https://terminusdb.org/blog/2025-12-08-terminusdb-12-release/)
- [Graphiti GitHub](https://github.com/getzep/graphiti)
- [Graphiti MCP Server](https://github.com/getzep/graphiti/blob/main/mcp_server/README.md)
- [Palantir Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview)
- [Palantir Ontology Explained](https://www.puppygraph.com/blog/palantir-ontology)
- [OpenFGA - Authorization for Agents](https://openfga.dev/docs/modeling/agents)
- [OpenFGA CNCF Incubation](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/)
- [MPL-2.0 FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)
- [Active Ontology 2026 (Atlan)](https://atlan.com/know/what-is-active-ontology/)
- [Ontology for Agentic AI Research Brief](https://www.designpattern.fyi/ontological-engineering/ontology-agentic-ai-research-brief/)
- [Cube Semantic Layer](https://cube.dev/use-cases/semantic-layer)
