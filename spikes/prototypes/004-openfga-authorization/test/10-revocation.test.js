import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check, checkAgentDelegation, createTestStore, writeTuples, deleteTuples } from '../src/openfga-client.js';
import { waitForHealth } from '../src/openfga-client.js';
import { getAllHealthcareTuples } from '../src/healthcare-tuples.js';

describe('10 — Revocation (delete tuple → immediate DENY)', () => {
  let client;

  before(async () => {
    await waitForHealth(10, 500);
    ({ client } = await createTestStore('test-10-revocation'));

    // Write base healthcare tuples
    await writeTuples(client, getAllHealthcareTuples());

    // Write a minimal delegation for revocation testing
    await writeTuples(client, [
      { user: 'user:revoke_agent', relation: 'agent',                object: 'agent_capability:revoke_cap_read' },
      { user: 'user:revoke_agent', relation: 'agent',                object: 'agent_delegation:jones_to_revoke' },
      { user: 'user:patient_jones', relation: 'delegating_principal', object: 'agent_delegation:jones_to_revoke' },
      { user: 'user:revoke_agent', relation: 'is_active',           object: 'agent_delegation:jones_to_revoke' },
    ]);
  });

  it('treating practitioner has access before revocation', async () => {
    const result = await check(client, 'user:dr_chen', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true, 'Dr Chen can read Jones (treating relationship exists)');
  });

  it('revoking treating relationship immediately denies access', async () => {
    // Remove the treating_practitioner tuple
    await deleteTuples(client, [
      { user: 'user:dr_chen', relation: 'treating_practitioner', object: 'patient:jones' },
    ]);

    const result = await check(client, 'user:dr_chen', 'can_read', 'patient:jones');
    assert.equal(result.allowed, false, 'After revocation, access is immediately denied');
  });

  it('re-granting treating relationship restores access', async () => {
    // Restore the tuple
    await writeTuples(client, [
      { user: 'user:dr_chen', relation: 'treating_practitioner', object: 'patient:jones' },
    ]);

    const result = await check(client, 'user:dr_chen', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true, 'Access restored after re-granting');
  });

  it('revoking receptionist clinic assignment denies patient access', async () => {
    // Verify access exists
    const before = await check(client, 'user:receptionist_mary', 'can_read', 'patient:jones');
    assert.equal(before.allowed, true, 'Receptionist has access before revocation');

    // Remove receptionist from clinic
    await deleteTuples(client, [
      { user: 'user:receptionist_mary', relation: 'receptionist', object: 'clinic:downtown' },
    ]);

    const after = await check(client, 'user:receptionist_mary', 'can_read', 'patient:jones');
    assert.equal(after.allowed, false, 'Receptionist loses access when removed from clinic');

    // Restore for other tests
    await writeTuples(client, [
      { user: 'user:receptionist_mary', relation: 'receptionist', object: 'clinic:downtown' },
    ]);
  });

  it('deactivating agent delegation immediately denies agent', async () => {
    // Verify delegation is active
    const activeBefore = await check(client, 'user:revoke_agent', 'is_active', 'agent_delegation:jones_to_revoke');
    assert.equal(activeBefore.allowed, true, 'Delegation is active');

    // Deactivate by removing is_active tuple
    await deleteTuples(client, [
      { user: 'user:revoke_agent', relation: 'is_active', object: 'agent_delegation:jones_to_revoke' },
    ]);

    // Layer 3 now fails
    const activeAfter = await check(client, 'user:revoke_agent', 'is_active', 'agent_delegation:jones_to_revoke');
    assert.equal(activeAfter.allowed, false, 'Delegation deactivated');

    // Full delegation check also fails
    const result = await checkAgentDelegation(client, {
      agentId: 'user:revoke_agent',
      delegatingPrincipal: 'user:patient_jones',
      relation: 'can_read',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:revoke_cap_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:jones_to_revoke',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'delegation_inactive', 'Agent denied due to inactive delegation');
  });

  it('revoking admin from clinic denies admin access to that clinic', async () => {
    // Verify admin has access
    const before = await check(client, 'user:admin_carol', 'can_manage', 'clinic:downtown');
    assert.equal(before.allowed, true, 'Admin can manage clinic');

    // Remove admin from downtown clinic
    await deleteTuples(client, [
      { user: 'user:admin_carol', relation: 'admin', object: 'clinic:downtown' },
    ]);

    const after = await check(client, 'user:admin_carol', 'can_manage', 'clinic:downtown');
    assert.equal(after.allowed, false, 'Admin loses clinic management after revocation');

    // Restore
    await writeTuples(client, [
      { user: 'user:admin_carol', relation: 'admin', object: 'clinic:downtown' },
    ]);
  });
});
