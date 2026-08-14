import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check, checkAgentDelegation, deleteTuples, writeTuples } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('11 — Service-delegated agent (explicit tests, not structural inference)', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-11-agent-service-delegated'));
  });

  // --- Basic service-delegated access ---

  it('service account has resource permission (layer 1 prerequisite)', async () => {
    // service_account_etl_pipeline has treating_practitioner on patient:jones
    const result = await check(client, 'user:service_account_etl_pipeline', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true, 'Service account has treating_practitioner access');
  });

  it('service-delegated agent can read resource when all 3 layers pass', async () => {
    const result = await checkAgentDelegation(client, {
      agentId: 'user:data_quality_agent',
      delegatingPrincipal: 'user:service_account_etl_pipeline',
      relation: 'can_read',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:dq_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:etl_to_dq',
    });

    assert.equal(result.allowed, true, 'All 3 governance layers pass for service-delegated agent');
  });

  // --- Service account lacks permission on target resource ---

  it('service-delegated agent denied when service account lacks permission (layer 1)', async () => {
    // service_account_etl_pipeline has no access to patient:smith
    const result = await checkAgentDelegation(client, {
      agentId: 'user:data_quality_agent',
      delegatingPrincipal: 'user:service_account_etl_pipeline',
      relation: 'can_read',
      resource: 'patient:smith',
      capabilityObject: 'agent_capability:dq_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:etl_to_dq',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'principal_permission',
      'Service account has no treating relationship with smith');
  });

  // --- Cross-tenant via service account ---

  it('service account in Tenant A cannot access Tenant B resource via agent', async () => {
    const result = await checkAgentDelegation(client, {
      agentId: 'user:data_quality_agent',
      delegatingPrincipal: 'user:service_account_etl_pipeline',
      relation: 'can_read',
      resource: 'patient:rival_pat',
      capabilityObject: 'agent_capability:dq_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:etl_to_dq',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'principal_permission',
      'Cross-tenant access denied even through service-delegated agent');
  });

  // --- Delegation ceiling for service account ---

  it('service-delegated agent cannot delete even if service account could read', async () => {
    // service_account has treating_practitioner (can_read) but NOT admin (can_delete)
    const principalCanDelete = await check(
      client, 'user:service_account_etl_pipeline', 'can_delete', 'patient:jones'
    );
    assert.equal(principalCanDelete.allowed, false,
      'Service account cannot delete (only treating_practitioner)');

    const result = await checkAgentDelegation(client, {
      agentId: 'user:data_quality_agent',
      delegatingPrincipal: 'user:service_account_etl_pipeline',
      relation: 'can_delete',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:dq_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:etl_to_dq',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'principal_permission',
      'Delegation ceiling: service account lacks delete, so agent denied');
  });

  // --- Service account revocation ---

  it('revoking service account resource permission immediately denies agent', async () => {
    // Verify access works before revocation
    const before = await checkAgentDelegation(client, {
      agentId: 'user:data_quality_agent',
      delegatingPrincipal: 'user:service_account_etl_pipeline',
      relation: 'can_read',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:dq_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:etl_to_dq',
    });
    assert.equal(before.allowed, true, 'Agent has access before revocation');

    // Revoke the service account's treating_practitioner relationship
    await deleteTuples(client, [
      { user: 'user:service_account_etl_pipeline', relation: 'treating_practitioner', object: 'patient:jones' },
    ]);

    const after = await checkAgentDelegation(client, {
      agentId: 'user:data_quality_agent',
      delegatingPrincipal: 'user:service_account_etl_pipeline',
      relation: 'can_read',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:dq_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:etl_to_dq',
    });

    assert.equal(after.allowed, false);
    assert.equal(after.deniedBy, 'principal_permission',
      'Service account permission revoked → agent immediately denied');

    // Restore for other tests
    await writeTuples(client, [
      { user: 'user:service_account_etl_pipeline', relation: 'treating_practitioner', object: 'patient:jones' },
    ]);
  });

  it('deactivating service-to-agent delegation immediately denies agent', async () => {
    // Deactivate the delegation
    await deleteTuples(client, [
      { user: 'user:data_quality_agent', relation: 'is_active', object: 'agent_delegation:etl_to_dq' },
    ]);

    const result = await checkAgentDelegation(client, {
      agentId: 'user:data_quality_agent',
      delegatingPrincipal: 'user:service_account_etl_pipeline',
      relation: 'can_read',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:dq_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:etl_to_dq',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'delegation_inactive',
      'Deactivated delegation → agent immediately denied');

    // Restore
    await writeTuples(client, [
      { user: 'user:data_quality_agent', relation: 'is_active', object: 'agent_delegation:etl_to_dq' },
    ]);
  });

  // --- Independent layer verification ---

  it('all 3 layers independently verifiable for service-delegated mode', async () => {
    // Layer 1: service account has permission
    const layer1 = await check(
      client, 'user:service_account_etl_pipeline', 'can_read', 'patient:jones'
    );
    assert.equal(layer1.allowed, true, 'Layer 1: service account has treating_practitioner');

    // Layer 2: agent has capability
    const layer2 = await check(
      client, 'user:data_quality_agent', 'can_read', 'agent_capability:dq_patient_read'
    );
    assert.equal(layer2.allowed, true, 'Layer 2: agent has patient read capability');

    // Layer 3: delegation is active
    const layer3 = await check(
      client, 'user:data_quality_agent', 'is_active', 'agent_delegation:etl_to_dq'
    );
    assert.equal(layer3.allowed, true, 'Layer 3: delegation is active');
  });
});
