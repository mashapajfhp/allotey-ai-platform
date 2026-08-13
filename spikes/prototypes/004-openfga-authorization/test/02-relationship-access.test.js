import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../src/openfga-client.js';
import { setupTestStore } from './setup.js';

describe('02 — Relationship-based access', () => {
  let client;

  before(async () => {
    ({ client } = await setupTestStore('test-02-relationship-access'));
  });

  // --- Self-access ---
  it('patient can read own record (self_access)', async () => {
    const result = await check(client, 'user:patient_jones', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true);
  });

  it('patient cannot read another patient record', async () => {
    const result = await check(client, 'user:patient_jones', 'can_read', 'patient:smith');
    assert.equal(result.allowed, false, 'Self-access is per-patient, not global');
  });

  it('patient can update own demographics', async () => {
    const result = await check(client, 'user:patient_jones', 'can_update_demographics', 'patient:jones');
    assert.equal(result.allowed, true);
  });

  it('patient cannot update another patient demographics', async () => {
    const result = await check(client, 'user:patient_jones', 'can_update_demographics', 'patient:smith');
    assert.equal(result.allowed, false);
  });

  // --- Treating practitioner ---
  it('treating practitioner can read their patient', async () => {
    const result = await check(client, 'user:dr_chen', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true, 'Dr Chen treats Jones');
  });

  it('treating practitioner can update clinical notes', async () => {
    const result = await check(client, 'user:dr_chen', 'can_update_clinical', 'patient:jones');
    assert.equal(result.allowed, true);
  });

  it('practitioner cannot read patient they do not treat', async () => {
    // Dr Chen does NOT treat Smith
    const result = await check(client, 'user:dr_chen', 'can_read', 'patient:smith');
    assert.equal(result.allowed, false, 'No treating relationship = no access');
  });

  // --- Receptionist via clinic chain ---
  it('receptionist at clinic can read patients registered at that clinic', async () => {
    // receptionist_mary works at downtown, jones is at downtown
    const result = await check(client, 'user:receptionist_mary', 'can_read', 'patient:jones');
    assert.equal(result.allowed, true);
  });

  it('receptionist cannot read patients at a different clinic', async () => {
    // receptionist_mary works at downtown, smith is at uptown
    const result = await check(client, 'user:receptionist_mary', 'can_read', 'patient:smith');
    assert.equal(result.allowed, false, 'Receptionist access is scoped to their clinic');
  });

  // --- Appointment access ---
  it('patient can read own appointment', async () => {
    const result = await check(client, 'user:patient_jones', 'can_read', 'appointment:appt_001');
    assert.equal(result.allowed, true);
  });

  it('patient cannot read another patient appointment', async () => {
    const result = await check(client, 'user:patient_jones', 'can_read', 'appointment:appt_002');
    assert.equal(result.allowed, false);
  });

  it('assigned practitioner can read their appointment', async () => {
    const result = await check(client, 'user:dr_chen', 'can_read', 'appointment:appt_001');
    assert.equal(result.allowed, true);
  });

  it('assigned practitioner can update clinical data on their appointment', async () => {
    const result = await check(client, 'user:dr_chen', 'can_update_clinical', 'appointment:appt_001');
    assert.equal(result.allowed, true);
  });

  it('receptionist can update scheduling on clinic appointments', async () => {
    const result = await check(client, 'user:receptionist_mary', 'can_update_scheduling', 'appointment:appt_001');
    assert.equal(result.allowed, true, 'Receptionist at downtown can manage downtown appointments');
  });

  it('receptionist cannot update scheduling at other clinic', async () => {
    const result = await check(client, 'user:receptionist_mary', 'can_update_scheduling', 'appointment:appt_002');
    assert.equal(result.allowed, false, 'Uptown appointment is out of scope');
  });

  // --- Insurance coverage ---
  it('patient can read own insurance', async () => {
    const result = await check(client, 'user:patient_jones', 'can_read', 'insurance_coverage:ins_jones');
    assert.equal(result.allowed, true);
  });

  it('billing specialist at clinic can read insurance', async () => {
    const result = await check(client, 'user:billing_lee', 'can_read', 'insurance_coverage:ins_jones');
    assert.equal(result.allowed, true);
  });

  it('billing specialist at clinic can update insurance', async () => {
    const result = await check(client, 'user:billing_lee', 'can_update', 'insurance_coverage:ins_jones');
    assert.equal(result.allowed, true);
  });

  // --- Referrals ---
  it('referring practitioner can read referral', async () => {
    const result = await check(client, 'user:dr_chen', 'can_read', 'referral:ref_001');
    assert.equal(result.allowed, true);
  });

  it('target practitioner can read referral', async () => {
    const result = await check(client, 'user:dr_patel', 'can_read', 'referral:ref_001');
    assert.equal(result.allowed, true);
  });

  it('patient can read own referral', async () => {
    const result = await check(client, 'user:patient_jones', 'can_read', 'referral:ref_001');
    assert.equal(result.allowed, true);
  });

  // --- Schedule blocks ---
  it('practitioner can read own schedule', async () => {
    const result = await check(client, 'user:dr_chen', 'can_read', 'schedule_block:sched_001');
    assert.equal(result.allowed, true);
  });

  it('receptionist at clinic can read clinic schedule', async () => {
    const result = await check(client, 'user:receptionist_mary', 'can_read', 'schedule_block:sched_001');
    assert.equal(result.allowed, true);
  });
});
