# Secrets and Identity Research

> STATUS: NOT STARTED
> Last updated: 2026-08-13

Research into secrets management, credential brokering, and workload identity technologies. Long-lived credentials must NEVER be exposed directly to an LLM or agent runtime.

See `architecture/secrets-architecture.md` for the architectural context.

---

## Research Queue

| Project | License | Category | Status | Notes |
|---------|---------|----------|--------|-------|
| OpenBao | MPL-2.0 | Secrets management (HashiCorp Vault fork) | NOT STARTED | Community fork maintaining open license after Vault went BSL |
| HashiCorp Vault | BSL (source-available) | Secrets management | NOT STARTED | Study only — BSL is NOT open source; OpenBao is the adoption candidate |
| SPIFFE/SPIRE | Apache 2.0 | Workload identity framework (CNCF) | NOT STARTED | Cryptographic service identity; automatic rotation and attestation |

### Also Study (Patterns, Not Direct Adoption)

- **Cloud workload identity** — AWS IAM roles for service accounts, GCP workload identity federation, Azure managed identity
- **OAuth token exchange (RFC 8693)** — standard for token delegation patterns
- **Kubernetes secrets + SOPS** — simpler V1 alternative to full secrets management

---

## License Warnings

- **OpenBao:** MPL-2.0 (Mozilla Public License 2.0). Acceptable per project licensing policy (MPL-2.0 acceptable with discipline). Copyleft applies to modified MPL-licensed files only; combining with proprietary code is allowed. This is the community fork of HashiCorp Vault created after Vault changed to BSL.
- **HashiCorp Vault:** Changed from MPL-2.0 to BSL (Business Source License) in August 2023. BSL restricts competitive use and is NOT open source by OSI definition. Study the architecture and API patterns, but OpenBao is the adoption candidate.
- **SPIFFE/SPIRE:** Apache 2.0, CNCF Graduated project. No license concerns.

---

## Research Template

Each project research file should cover:
1. **License verification** — confirm license, identify any commercial tier or usage restrictions
2. **Credential lifecycle** — how are secrets created, rotated, revoked, and audited?
3. **Dynamic secrets** — does it support generating short-lived, scoped credentials on demand?
4. **Transit encryption** — can it perform encryption/decryption without exposing keys?
5. **Access control** — how are permissions to secrets managed? Integration with OpenFGA?
6. **High availability** — clustering, replication, disaster recovery
7. **Operational complexity** — what infrastructure is required? Can it run on a single node?
8. **Self-hosted viability** — can this run entirely self-hosted without vendor dependencies?
9. **Community and maturity** — activity, governance, production users, release cadence
10. **Adopt/Wrap/Study decision** — recommendation for the platform
