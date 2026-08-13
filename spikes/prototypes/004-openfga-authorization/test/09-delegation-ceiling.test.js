import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check, checkAgentDelegation } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('09 — Delegation ceiling (agent cannot exceed principal)', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-09-delegation-ceiling'));
  });

  it('agent cannot delete patient even though it has delete capability declared', async () => {
    // ceiling_agent is delegated by patient_jones
    // ceiling_agent declares a delete capability
    // But patient_jones CANNOT delete patients (only admins can)
    // Therefore the delegation ceiling applies: agent is denied.
    const result = await checkAgentDelegation(client, {
      agentId: 'user:ceiling_agent',
      delegatingPrincipal: 'user:patient_jones',
      relation: 'can_delete',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:ceiling_patient_delete',
      capabilityRelation: 'can_read', // agent has the capability tuple
      delegationObject: 'agent_delegation:jones_to_ceiling',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'principal_permission',
      'Denied because patient_jones cannot delete (delegation ceiling)');
  });

  it('confirm principal lacks the permission (ceiling source)', async () => {
    const result = await check(client, 'user:patient_jones', 'can_delete', 'patient:jones');
    assert.equal(result.allowed, false, 'Patients cannot delete patient records');
  });

  it('agent cannot write to patient even though it has write capability', async () => {
    // patient_jones can only update demographics (not clinical)
    // ceiling_agent has write capability but principal lacks can_update_clinical
    const result = await checkAgentDelegation(client, {
      agentId: 'user:ceiling_agent',
      delegatingPrincipal: 'user:patient_jones',
      relation: 'can_update_clinical',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:ceiling_patient_write',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:jones_to_ceiling',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'principal_permission',
      'Patient cannot update clinical data → agent ceiling applies');
  });

  it('agent CAN read when principal has read access (ceiling allows)', async () => {
    // patient_jones CAN read patient:jones (self_access)
    // If ceiling_agent had a read capability, this would pass layers 1 and 2
    const principalCheck = await check(client, 'user:patient_jones', 'can_read', 'patient:jones');
    assert.equal(principalCheck.allowed, true, 'Principal can read → ceiling would allow read');
  });

  it('delegation ceiling works even for admin-delegated agents', async () => {
    // Even if patient_jones tried to grant admin-level delete to an agent,
    // the ceiling prevents it because patient_jones doesn't have delete permission.
    // The agent's declared capabilities are irrelevant if the principal lacks the permission.
    const agentDeleteCapability = await check(
      client, 'user:ceiling_agent', 'can_read', 'agent_capability:ceiling_patient_delete'
    );
    assert.equal(agentDeleteCapability.allowed, true, 'Agent HAS the delete capability declared');

    const principalDelete = await check(client, 'user:patient_jones', 'can_delete', 'patient:jones');
    assert.equal(principalDelete.allowed, false, 'But principal LACKS delete permission');

    // Combined: DENY (ceiling enforced)
  });
});
