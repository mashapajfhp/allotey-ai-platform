import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('01 — Deny by default', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-01-deny-by-default'));
  });

  it('tenant member with no role cannot read any patient', async () => {
    // new_member is a tenant member but has no role assignments
    const result = await check(client, 'user:new_member', 'can_read', 'patient:jones');
    assert.equal(result.allowed, false, 'Tenant membership alone must NOT grant patient read');
  });

  it('tenant member with no role cannot read appointments', async () => {
    const result = await check(client, 'user:new_member', 'can_read', 'appointment:appt_001');
    assert.equal(result.allowed, false, 'Tenant membership alone must NOT grant appointment read');
  });

  it('tenant member with no role cannot read insurance', async () => {
    const result = await check(client, 'user:new_member', 'can_read', 'insurance_coverage:ins_jones');
    assert.equal(result.allowed, false, 'Tenant membership alone must NOT grant insurance read');
  });

  it('tenant member with no role cannot read referrals', async () => {
    const result = await check(client, 'user:new_member', 'can_read', 'referral:ref_001');
    assert.equal(result.allowed, false, 'Tenant membership alone must NOT grant referral read');
  });

  it('tenant member with no role cannot read schedule blocks', async () => {
    const result = await check(client, 'user:new_member', 'can_read', 'schedule_block:sched_001');
    assert.equal(result.allowed, false, 'Tenant membership alone must NOT grant schedule read');
  });

  it('tenant member with no role cannot read clinics', async () => {
    const result = await check(client, 'user:new_member', 'can_read', 'clinic:downtown');
    assert.equal(result.allowed, false, 'Tenant membership alone must NOT grant clinic read');
  });

  it('tenant member with no role cannot delete patients', async () => {
    const result = await check(client, 'user:new_member', 'can_delete', 'patient:jones');
    assert.equal(result.allowed, false, 'Tenant membership alone must NOT grant patient delete');
  });

  it('tenant member with no role cannot create patients', async () => {
    const result = await check(client, 'user:new_member', 'can_create', 'patient:jones');
    assert.equal(result.allowed, false, 'Tenant membership alone must NOT grant patient create');
  });
});
