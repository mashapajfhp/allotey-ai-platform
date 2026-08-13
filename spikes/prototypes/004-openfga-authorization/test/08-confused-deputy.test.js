import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check, checkAgentDelegation } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('08 — Confused deputy prevention', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-08-confused-deputy'));
  });

  it('agent delegated by Tenant B user cannot access Tenant A patient', async () => {
    // wrong_scope_agent is delegated by rival_user (Tenant B)
    // It tries to access patient:jones (Tenant A)
    const result = await checkAgentDelegation(client, {
      agentId: 'user:wrong_scope_agent',
      delegatingPrincipal: 'user:rival_user',
      relation: 'can_read',
      resource: 'patient:jones',
      capabilityObject: 'agent_capability:scope_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:rival_to_scope',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'principal_permission',
      'Denied because rival_user has no permission on Tenant A resources');
  });

  it('Tenant B delegated agent cannot read Tenant A appointments', async () => {
    const result = await checkAgentDelegation(client, {
      agentId: 'user:wrong_scope_agent',
      delegatingPrincipal: 'user:rival_user',
      relation: 'can_read',
      resource: 'appointment:appt_001',
      capabilityObject: 'agent_capability:scope_patient_read',
      capabilityRelation: 'can_read',
      delegationObject: 'agent_delegation:rival_to_scope',
    });

    assert.equal(result.allowed, false);
    assert.equal(result.deniedBy, 'principal_permission');
  });

  it('Tenant B delegated agent CAN access Tenant B resources', async () => {
    // rival_user has self_access on patient:rival_pat
    // Layer 1 should pass for their own resources
    const principalCheck = await check(client, 'user:rival_user', 'can_read', 'patient:rival_pat');
    assert.equal(principalCheck.allowed, true, 'Principal has access to own tenant resources');
  });

  it('scope mismatch is caught at the principal permission layer', async () => {
    // Even if agent has capability and active delegation,
    // the principal's lack of permission on the target resource prevents access.
    // This is the confused deputy defense: the resource's relationships
    // determine who can access it, NOT the agent's claimed scope.

    // Verify all 3 layers independently:
    // Layer 1: principal has no access to Tenant A patient
    const layer1 = await check(client, 'user:rival_user', 'can_read', 'patient:jones');
    assert.equal(layer1.allowed, false, 'Layer 1 (principal) correctly denies cross-tenant');

    // Layer 2: agent HAS the capability
    const layer2 = await check(client, 'user:wrong_scope_agent', 'can_read', 'agent_capability:scope_patient_read');
    assert.equal(layer2.allowed, true, 'Layer 2 (capability) would pass');

    // Layer 3: delegation IS active
    const layer3 = await check(client, 'user:wrong_scope_agent', 'is_active', 'agent_delegation:rival_to_scope');
    assert.equal(layer3.allowed, true, 'Layer 3 (delegation) would pass');

    // But combined result is DENY because layer 1 fails
  });
});
