# SpiceDB (authzed/spicedb)

**STATUS: NOT STARTED**
**License:** Apache 2.0 (OSS core), commercial (Authzed managed)
**Repository:** https://github.com/authzed/spicedb

---

## Overview

SpiceDB is the closest open-source implementation of Google's Zanzibar paper. Built
by Authzed, it provides a gRPC-first authorization database with its own schema
language, strong consistency guarantees via ZedTokens, and the Leopard indexing
system for efficient deeply-nested group resolution.

---

## Key Characteristics

### Schema Language

SpiceDB uses `definition` blocks that closely mirror Zanzibar's original notation:

```
definition user {}

definition document {
    relation owner: user
    relation editor: user | team#member
    relation viewer: user | team#member

    permission edit = owner + editor
    permission view = edit + viewer
}
```

NEEDS VERIFICATION: Exact syntax may have evolved since last review.

### Relationship Model

Same tuple-based model as OpenFGA: `(resource, relation, subject)`. SpiceDB stores
these in its own purpose-built storage layer rather than relying on generic SQL.

### Consistency Guarantees

The primary differentiator from OpenFGA:
- **ZedTokens:** Opaque tokens returned from write operations that encode a point
  in time. Pass a ZedToken to subsequent reads to guarantee "at least as fresh"
  consistency -- directly implementing Zanzibar's "zookies"
- **Fully Consistent mode:** Available for scenarios requiring linearizable reads
- **Minimize Latency mode:** Eventually consistent for high-throughput, latency-
  sensitive workloads

OpenFGA uses a simpler flag-based approach (HIGHER_CONSISTENCY opt-in) without
token-based freshness tracking.

### Leopard Index

SpiceDB implements the Leopard indexing algorithm from the Zanzibar paper, which
pre-computes membership for deeply nested groups. This makes queries like "list all
documents accessible by members of the engineering org (which contains 50 nested
teams)" significantly faster than OpenFGA, which lacks Leopard.

---

## Comparison to OpenFGA

| Dimension | SpiceDB | OpenFGA |
|-----------|---------|---------|
| Consistency | ZedToken-based (Zanzibar zookies) | Flag-based opt-in |
| Deep nesting | Leopard index (fast) | No Leopard (slower at depth) |
| API style | gRPC-first | HTTP/gRPC |
| Schema closeness to Zanzibar | Closest | Adapted |
| CNCF | No | Sandbox |
| Commercial backing | Authzed (managed service) | Auth0/Okta |
| Ecosystem breadth | Narrower | Broader (Auth0 ecosystem) |
| AI agent patterns | Not documented | First-class docs |

---

## Key Questions

- [ ] Is the consistency advantage material for our workload, or is OpenFGA's
      flag-based consistency sufficient?
- [ ] Do we anticipate deeply nested group hierarchies that would benefit from
      Leopard?
- [ ] Is the Authzed managed service relevant, or are we self-hosting regardless?
- [ ] How does SpiceDB handle multi-tenancy compared to OpenFGA's stores?
- [ ] What is the operational complexity of running SpiceDB vs OpenFGA?

---

## References

- SpiceDB GitHub: https://github.com/authzed/spicedb
- Authzed Documentation: https://authzed.com/docs
- SpiceDB vs OpenFGA: https://authzed.com/learn/openfga-alternatives
