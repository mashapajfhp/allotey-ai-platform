import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('03 — Role hierarchy and admin override', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-03-role-hierarchy'));
  });

  // --- Referral coordinator inherits receptionist permissions via clinic ---
  it('referral coordinator can read patients at their clinic (inherited from receptionist-like access)', async () => {
    // coord_dave is referral_coordinator at clinic:downtown
    // patient:jones is at clinic:downtown
    // The model grants can_read to referral_coordinator from clinic (same as receptionist)
    const result = await check(client, 'user:coord_dave', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true, 'Referral coordinator gets patient read via clinic chain');
  });

  it('referral coordinator can read and update referrals', async () => {
    const readResult = await check(client, 'user:coord_dave', 'can_read', 'referral:ref_001');
    assert.equal(readResult.allowed, true);

    const updateResult = await check(client, 'user:coord_dave', 'can_update', 'referral:ref_001');
    assert.equal(updateResult.allowed, true);
  });

  it('referral coordinator cannot read patients at a different clinic', async () => {
    const result = await check(client, 'user:coord_dave', 'can_read', 'patient:smith');
    assert.equal(result.allowed, false, 'Smith is at uptown, coord_dave is at downtown');
  });

  // --- Admin override ---
  it('admin can read any patient in their clinics', async () => {
    const jones = await check(client, 'user:admin_carol', 'can_read', 'patient:jones');
    const smith = await check(client, 'user:admin_carol', 'can_read', 'patient:smith');
    assert.equal(jones.allowed, true);
    assert.equal(smith.allowed, true);
  });

  it('admin can delete patients', async () => {
    const result = await check(client, 'user:admin_carol', 'can_delete', 'patient:jones');
    assert.equal(result.allowed, true);
  });

  it('admin can update clinical data', async () => {
    const result = await check(client, 'user:admin_carol', 'can_update_clinical', 'patient:jones');
    assert.equal(result.allowed, true);
  });

  it('admin can manage clinics', async () => {
    const result = await check(client, 'user:admin_carol', 'can_manage', 'clinic:downtown');
    assert.equal(result.allowed, true);
  });

  it('admin can read all appointments', async () => {
    const appt1 = await check(client, 'user:admin_carol', 'can_read', 'appointment:appt_001');
    const appt2 = await check(client, 'user:admin_carol', 'can_read', 'appointment:appt_002');
    assert.equal(appt1.allowed, true);
    assert.equal(appt2.allowed, true);
  });

  it('admin can delete appointments', async () => {
    const result = await check(client, 'user:admin_carol', 'can_delete', 'appointment:appt_001');
    assert.equal(result.allowed, true);
  });

  // --- Non-admin cannot delete ---
  it('practitioner cannot delete patients', async () => {
    const result = await check(client, 'user:dr_chen', 'can_delete', 'patient:jones');
    assert.equal(result.allowed, false, 'Only admins can delete');
  });

  it('receptionist cannot delete patients', async () => {
    const result = await check(client, 'user:receptionist_mary', 'can_delete', 'patient:jones');
    assert.equal(result.allowed, false);
  });

  // --- Nurse access ---
  it('nurse at clinic can read patients at that clinic', async () => {
    const result = await check(client, 'user:nurse_garcia', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true, 'Nurse at downtown can read downtown patients');
  });

  it('nurse at clinic can read clinic itself', async () => {
    const result = await check(client, 'user:nurse_garcia', 'can_read', 'clinic:downtown');
    assert.equal(result.allowed, true);
  });
});
