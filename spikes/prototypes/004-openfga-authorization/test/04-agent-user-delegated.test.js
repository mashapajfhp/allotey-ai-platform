import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check, checkAgentDelegation } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('04 — User-delegated agent (3-layer governance)', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-04-agent-user-delegated'));
  });

  it('scheduling agent can read delegating patient record (all 3 layers pass)', async () => {
    const result = await checkAgentDelegation(client, {
      agentId: 'user:scheduling_agent',
      delegatingPrincipal: 'user:patient_jones',
      relation: 'can_read',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:sched_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:jones_to_sched',
    });

    assert.equal(result.allowed, true, 'All 3 governance layers permit');
  });

  it('scheduling agent can read delegating patient appointment', async () => {
    const result = await checkAgentDelegation(client, {
      agentId: 'user:scheduling_agent',
      delegatingPrincipal: 'user:patient_jones',
      relation: 'can_read',
      resource: 'appointment:appt_001',
      capabilityObject: 'agent_capability:sched_appointment_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:jones_to_sched',
    });

    assert.equal(result.allowed, true);
  });

  it('scheduling agent CANNOT read non-delegating patient (layer 1 fails)', async () => {
    // patient_jones cannot read patient:smith, so agent can't either
    const result = await checkAgentDelegation(client, {
      agentId: 'user:scheduling_agent',
      delegatingPrincipal: 'user:patient_jones',
      relation: 'can_read',
      resource: 'patient:smith',
      capabilityObject: 'agent_capability:sched_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:jones_to_sched',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'principal_permission', 'Denied because principal lacks permission');
  });

  it('agent without matching capability is denied (layer 2 fails)', async () => {
    // scheduling_agent has no capability for insurance_coverage
    const result = await checkAgentDelegation(client, {
      agentId: 'user:scheduling_agent',
      delegatingPrincipal: 'user:patient_jones',
      relation: 'can_read',
      resource: 'insurance_coverage:ins_jones',
      capabilityObject: 'agent_capability:nonexistent_capability',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:jones_to_sched',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'agent_capability', 'Denied because agent lacks capability');
  });

  it('each layer is checked independently — all must pass', async () => {
    // Verify layer 1 passes on its own
    const layer1 = await check(client, 'user:patient_jones', 'can_read', 'patient:jones');
    assert.equal(layer1.allowed, true, 'Layer 1 (principal) passes');

    // Verify layer 2 passes on its own
    const layer2 = await check(client, 'user:scheduling_agent', 'can_read', 'agent_capability:sched_patient_read');
    assert.equal(layer2.allowed, true, 'Layer 2 (capability) passes');

    // Verify layer 3 passes on its own
    const layer3 = await check(client, 'user:scheduling_agent', 'is_active', 'agent_delegation:jones_to_sched');
    assert.equal(layer3.allowed, true, 'Layer 3 (delegation active) passes');
  });
});
