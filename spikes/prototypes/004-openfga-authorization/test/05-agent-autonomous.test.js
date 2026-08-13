import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('05 — Autonomous agent (explicit permissions only)', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-05-agent-autonomous'));
  });

  it('autonomous agent with explicit grant can read', async () => {
    // nightly_audit has an agent_grant for patient read
    const result = await check(client, 'user:nightly_audit', 'can_read', 'agent_grant:audit_patient_read');
    assert.equal(result.allowed, true, 'Explicit grant permits read');
  });

  it('autonomous agent without explicit grant cannot write', async () => {
    // nightly_audit has NO write grant
    const result = await check(client, 'user:nightly_audit', 'can_read', 'agent_grant:audit_patient_write');
    assert.equal(result.allowed, false, 'No explicit grant = no access');
  });

  it('autonomous agent owner permissions do NOT transfer to agent', async () => {
    // admin_carol is the owner of nightly_audit, and admin_carol can delete patients.
    // But nightly_audit should NOT inherit admin_carol's permissions.
    // nightly_audit has no direct relation to patient:jones.
    const agentResult = await check(client, 'user:nightly_audit', 'can_read', 'patient:jones');
    assert.equal(agentResult.allowed, false, 'Agent does NOT inherit owner permissions');

    // Verify the owner DOES have permission (to prove it's not inherited)
    const ownerResult = await check(client, 'user:admin_carol', 'can_read', 'patient:jones');
    assert.equal(ownerResult.allowed, true, 'Owner has permission, but agent does not inherit it');
  });

  it('autonomous agent cannot delete even though owner can', async () => {
    const agentResult = await check(client, 'user:nightly_audit', 'can_delete', 'patient:jones');
    assert.equal(agentResult.allowed, false);

    const ownerResult = await check(client, 'user:admin_carol', 'can_delete', 'patient:jones');
    assert.equal(ownerResult.allowed, true);
  });

  it('autonomous agent with no resource tuples gets DENY for all resources', async () => {
    const checks = await Promise.all([
      check(client, 'user:nightly_audit', 'can_read', 'patient:jones'),
      check(client, 'user:nightly_audit', 'can_read', 'appointment:appt_001'),
      check(client, 'user:nightly_audit', 'can_read', 'clinic:downtown'),
      check(client, 'user:nightly_audit', 'can_read', 'insurance_coverage:ins_jones'),
    ]);

    for (const result of checks) {
      assert.equal(result.allowed, false, 'No resource tuples = DENY for all resources');
    }
  });
});
