import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('06 — Tenant isolation', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-06-tenant-isolation'));
  });

  it('Tenant B user cannot read Tenant A patient', async () => {
    const result = await check(client, 'user:rival_user', 'can_read', 'patient:jones');
    assert.equal(result.allowed, false, 'Cross-tenant patient access must be DENIED');
  });

  it('Tenant B user cannot read Tenant A appointment', async () => {
    const result = await check(client, 'user:rival_user', 'can_read', 'appointment:appt_001');
    assert.equal(result.allowed, false, 'Cross-tenant appointment access must be DENIED');
  });

  it('Tenant B user cannot read Tenant A insurance', async () => {
    const result = await check(client, 'user:rival_user', 'can_read', 'insurance_coverage:ins_jones');
    assert.equal(result.allowed, false, 'Cross-tenant insurance access must be DENIED');
  });

  it('Tenant B user cannot read Tenant A referral', async () => {
    const result = await check(client, 'user:rival_user', 'can_read', 'referral:ref_001');
    assert.equal(result.allowed, false, 'Cross-tenant referral access must be DENIED');
  });

  it('Tenant B user cannot read Tenant A clinic', async () => {
    const result = await check(client, 'user:rival_user', 'can_read', 'clinic:downtown');
    assert.equal(result.allowed, false, 'Cross-tenant clinic access must be DENIED');
  });

  it('Tenant B user cannot read Tenant A schedule', async () => {
    const result = await check(client, 'user:rival_user', 'can_read', 'schedule_block:sched_001');
    assert.equal(result.allowed, false, 'Cross-tenant schedule access must be DENIED');
  });

  it('Tenant B admin cannot read Tenant A patient', async () => {
    // rival_admin is admin of tenant:rival_health, NOT of clinic:downtown
    const result = await check(client, 'user:rival_admin', 'can_read', 'patient:jones');
    assert.equal(result.allowed, false, 'Tenant B admin has no authority over Tenant A resources');
  });

  it('Tenant B admin cannot delete Tenant A patient', async () => {
    const result = await check(client, 'user:rival_admin', 'can_delete', 'patient:jones');
    assert.equal(result.allowed, false);
  });

  it('Tenant A user can read own tenant patient (sanity check)', async () => {
    const result = await check(client, 'user:patient_jones', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true, 'Same-tenant self-access works');
  });

  it('Tenant B user can read own tenant patient (sanity check)', async () => {
    const result = await check(client, 'user:rival_user', 'can_read', 'patient:rival_pat');
    assert.equal(result.allowed, true, 'Own tenant self-access works');
  });
});
