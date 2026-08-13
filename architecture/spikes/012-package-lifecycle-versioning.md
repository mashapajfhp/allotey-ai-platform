# Spike 012: Package Lifecycle and Versioning

> STATUS: NOT STARTED
> Last updated: 2026-08-14
> References: `architecture/domain-package-architecture.md`, `architecture/platform-tenancy-model.md`, `AGENTS.md` rules 6-7

---

## Question

Can the four-step package lifecycle (Artifact → Product Declaration → Environment Deployment → Tenant Instance) support safe evolution of domain packages? Can a domain package be upgraded, rolled back, and run in parallel versions across environments and tenants without data loss, authorization inconsistency, or agent failures?

## Hypothesis

The four-step lifecycle provides sufficient gates for safe package evolution. Artifacts are immutable (versioning is append-only). Declarations pin to version ranges. Deployments promote through environments. Instances activate per tenant with migration support. The main challenge will be schema migration across tenant instances — especially when ontology changes affect database schema, authorization models, and semantic definitions simultaneously.

## Why This Spike Matters

Intelligence-as-Code must be evolvable. If packages cannot safely change over time — if upgrading a package risks data corruption, authorization gaps, or agent failures — then the platform cannot serve enterprise customers who demand zero-downtime upgrades and rollback capability.

---

## Prototype Plan

### Phase 1: Package Versioning Model

1. **Artifact versioning**
   - Semantic versioning (major.minor.patch)
   - Immutable artifacts (published versions cannot be modified)
   - Compatibility metadata: minimum platform API version, breaking change flags
   - SBOM and signing (from supply-chain security model)

2. **Declaration version constraints**
   ```yaml
   product_declaration:
     package: healthcare-clinic
     version: "^2.0.0"       # compatible with 2.x
     pin_mode: range          # or: exact, latest
   ```

3. **Environment deployment states**
   ```
   v2.0.0 → deployed to dev (active)
   v2.0.0 → deployed to staging (active)
   v1.5.0 → deployed to prod (active)
   v2.0.0 → deployed to prod (canary, 10% of tenants)
   ```

4. **Tenant instance states**
   ```
   Tenant A: v1.5.0 (active)
   Tenant B: v2.0.0 (active, upgraded)
   Tenant C: v2.0.0 (pending migration)
   ```

### Phase 2: Schema Migration Testing

1. **Non-breaking ontology changes**
   - Add optional property to entity → ALTER TABLE ADD COLUMN (nullable)
   - Add new entity type → CREATE TABLE
   - Add new relationship type → no schema change (graph edge)
   - Verify: existing data unaffected, agents continue working

2. **Breaking ontology changes**
   - Rename entity property → requires migration strategy
   - Change property type → requires data transformation
   - Remove entity → requires data deletion or archival
   - Change relationship cardinality → requires data validation
   - Verify: migration runs without downtime, rollback is possible

3. **Authorization model changes**
   - Add new role → safe (additive)
   - Remove role → requires migration of existing assignments
   - Change relationship definition → requires tuple migration
   - Verify: no permission gaps during migration

4. **Semantic model changes**
   - Add new measure → safe (additive)
   - Modify measure calculation → cache invalidation required
   - Remove dimension → downstream dashboards break
   - Verify: semantic cache consistency during migration

### Phase 3: Parallel Version Testing

1. **Two tenants, different versions**
   - Tenant A runs v1.5.0, Tenant B runs v2.0.0
   - Both operate correctly and independently
   - Verify: no cross-version contamination

2. **Canary deployment**
   - Deploy v2.0.0 to 10% of tenants
   - Monitor for errors, latency regression, authorization failures
   - Roll back canary if issues detected
   - Verify: rollback restores v1.5.0 cleanly

3. **Version-specific agent behavior**
   - Agent definitions may change between versions
   - Verify: each tenant's agents match their package version
   - Verify: agent tool registrations are version-specific

### Phase 4: Rollback Testing

1. **Tenant-level rollback**
   - Upgrade Tenant A from v1.5.0 to v2.0.0
   - Detect issue
   - Roll back Tenant A to v1.5.0
   - Verify: data integrity preserved, no orphaned schema artifacts

2. **Environment-level rollback**
   - Roll back entire staging environment from v2.0.0 to v1.5.0
   - Verify: all tenant instances in that environment roll back correctly

3. **Failed migration recovery**
   - Simulate migration failure mid-way
   - Verify: partial migration is detected, tenant is marked degraded, not corrupted

---

## Test Methodology

### Migration Safety
- Zero data loss during upgrade and rollback
- No authorization gaps (no moment where a user has incorrect permissions)
- No agent execution failures due to version mismatch
- Migration duration under acceptable limits

### Parallel Version Correctness
- Tenants on different versions operate independently
- No cross-version interference in shared infrastructure (database, authorization store)
- Agent, tool, and workflow registrations are version-isolated

### Rollback Reliability
- Rollback restores previous version completely
- Rollback handles data created during the new version
- Rollback is tested for both clean and failed upgrades

### Operational Complexity
- How many manual steps does a version upgrade require?
- What observability is needed during migration?
- What is the blast radius of a failed migration?

---

## Success Criteria

1. Non-breaking changes upgrade without downtime
2. Breaking changes upgrade with bounded downtime per tenant (not platform-wide)
3. Rollback restores previous version without data loss
4. Parallel versions operate correctly in the same environment
5. Canary deployment works with configurable rollout percentage
6. Migration failure is detected and recoverable (no corrupted state)
7. Authorization model is consistent throughout the migration process

## Abort Criteria

- Schema migration requires platform-wide downtime
- Rollback loses data created during the new version
- Authorization model has gaps during migration (even briefly)
- Parallel versions interfere with each other through shared state
- Migration complexity exceeds what an operator can safely manage

---

## Results

PENDING — spike not yet started.

## Dependencies

- Spike 008 (Domain Definition IR) should produce compilable IR
- Basic package structure must be defined
- PostgreSQL migration tooling selected

## Notes

This spike validates that Intelligence-as-Code can evolve safely. A platform that cannot upgrade its domain packages without risk is not enterprise-grade. The four-step lifecycle (Artifact → Declaration → Deployment → Instance) should provide sufficient gates, but this spike must prove it empirically.
