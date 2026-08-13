/**
 * Healthcare domain test scenario tuples.
 *
 * Scenario: Two tenants (acme_health, rival_health), two clinics (downtown, uptown),
 * patients, practitioners, receptionists, admin, and various roles.
 *
 * Every relationship is explicit. No ambient access from tenant membership.
 */

// --- Tenant membership (does NOT grant any resource access) ---
export const tenantTuples = [
  // Tenant A members
  { user: 'user:patient_jones',     relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:patient_smith',     relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:dr_chen',           relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:dr_patel',          relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:receptionist_mary', relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:nurse_garcia',      relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:billing_lee',       relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:admin_carol',       relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:coord_dave',        relation: 'member', object: 'tenant:acme_health' },
  { user: 'user:new_member',        relation: 'member', object: 'tenant:acme_health' },

  // Tenant A admin
  { user: 'user:admin_carol', relation: 'admin', object: 'tenant:acme_health' },

  // Tenant B members (for cross-tenant isolation tests)
  { user: 'user:rival_user',  relation: 'member', object: 'tenant:rival_health' },
  { user: 'user:rival_admin', relation: 'admin',  object: 'tenant:rival_health' },
];

// --- Clinic setup ---
export const clinicTuples = [
  // Clinics belong to tenants
  { user: 'tenant:acme_health',  relation: 'tenant', object: 'clinic:downtown' },
  { user: 'tenant:acme_health',  relation: 'tenant', object: 'clinic:uptown' },
  { user: 'tenant:rival_health', relation: 'tenant', object: 'clinic:rival_clinic' },

  // Clinic staff assignments
  { user: 'user:receptionist_mary', relation: 'receptionist', object: 'clinic:downtown' },
  { user: 'user:dr_chen',           relation: 'practitioner', object: 'clinic:downtown' },
  { user: 'user:dr_patel',          relation: 'practitioner', object: 'clinic:uptown' },
  { user: 'user:nurse_garcia',      relation: 'nurse',        object: 'clinic:downtown' },
  { user: 'user:billing_lee',       relation: 'billing_specialist', object: 'clinic:downtown' },
  { user: 'user:coord_dave',        relation: 'referral_coordinator', object: 'clinic:downtown' },
  { user: 'user:admin_carol',       relation: 'admin',        object: 'clinic:downtown' },
  { user: 'user:admin_carol',       relation: 'admin',        object: 'clinic:uptown' },
];

// --- Patient records ---
export const patientTuples = [
  // Patient Jones — registered at downtown clinic, self-access, treated by Dr Chen
  { user: 'user:patient_jones',  relation: 'self_access',           object: 'patient:jones' },
  { user: 'user:dr_chen',        relation: 'treating_practitioner', object: 'patient:jones' },
  { user: 'clinic:downtown',     relation: 'clinic',                object: 'patient:jones' },
  { user: 'tenant:acme_health',  relation: 'tenant',                object: 'patient:jones' },
  { user: 'user:admin_carol',    relation: 'admin',                 object: 'patient:jones' },

  // Patient Smith — registered at uptown clinic, self-access, treated by Dr Patel
  { user: 'user:patient_smith',  relation: 'self_access',           object: 'patient:smith' },
  { user: 'user:dr_patel',       relation: 'treating_practitioner', object: 'patient:smith' },
  { user: 'clinic:uptown',       relation: 'clinic',                object: 'patient:smith' },
  { user: 'tenant:acme_health',  relation: 'tenant',                object: 'patient:smith' },
  { user: 'user:admin_carol',    relation: 'admin',                 object: 'patient:smith' },

  // Patient at rival tenant (for isolation tests)
  { user: 'user:rival_user',     relation: 'self_access',           object: 'patient:rival_pat' },
  { user: 'clinic:rival_clinic', relation: 'clinic',                object: 'patient:rival_pat' },
  { user: 'tenant:rival_health', relation: 'tenant',                object: 'patient:rival_pat' },
];

// --- Appointment records ---
export const appointmentTuples = [
  // Appointment for patient Jones with Dr Chen at downtown clinic
  { user: 'user:patient_jones', relation: 'patient_owner',        object: 'appointment:appt_001' },
  { user: 'user:dr_chen',      relation: 'assigned_practitioner', object: 'appointment:appt_001' },
  { user: 'clinic:downtown',   relation: 'clinic',                object: 'appointment:appt_001' },
  { user: 'user:admin_carol',  relation: 'admin',                 object: 'appointment:appt_001' },
  { user: 'tenant:acme_health',relation: 'tenant',                object: 'appointment:appt_001' },

  // Appointment for patient Smith with Dr Patel at uptown clinic
  { user: 'user:patient_smith', relation: 'patient_owner',        object: 'appointment:appt_002' },
  { user: 'user:dr_patel',     relation: 'assigned_practitioner', object: 'appointment:appt_002' },
  { user: 'clinic:uptown',     relation: 'clinic',                object: 'appointment:appt_002' },
  { user: 'user:admin_carol',  relation: 'admin',                 object: 'appointment:appt_002' },
  { user: 'tenant:acme_health',relation: 'tenant',                object: 'appointment:appt_002' },
];

// --- Insurance coverage ---
export const insuranceTuples = [
  { user: 'user:patient_jones', relation: 'patient_owner', object: 'insurance_coverage:ins_jones' },
  { user: 'clinic:downtown',    relation: 'clinic',        object: 'insurance_coverage:ins_jones' },
  { user: 'user:admin_carol',   relation: 'admin',         object: 'insurance_coverage:ins_jones' },
  { user: 'tenant:acme_health', relation: 'tenant',        object: 'insurance_coverage:ins_jones' },
];

// --- Referrals ---
export const referralTuples = [
  // Dr Chen refers Jones to Dr Patel
  { user: 'user:dr_chen',       relation: 'referring_practitioner', object: 'referral:ref_001' },
  { user: 'user:dr_patel',      relation: 'target_practitioner',   object: 'referral:ref_001' },
  { user: 'user:patient_jones', relation: 'patient_owner',         object: 'referral:ref_001' },
  { user: 'user:coord_dave',    relation: 'referral_coordinator',  object: 'referral:ref_001' },
  { user: 'user:admin_carol',   relation: 'admin',                 object: 'referral:ref_001' },
  { user: 'tenant:acme_health', relation: 'tenant',                object: 'referral:ref_001' },
];

// --- Schedule blocks ---
export const scheduleBlockTuples = [
  { user: 'user:dr_chen',       relation: 'owner_practitioner', object: 'schedule_block:sched_001' },
  { user: 'clinic:downtown',    relation: 'clinic',             object: 'schedule_block:sched_001' },
  { user: 'user:admin_carol',   relation: 'admin',              object: 'schedule_block:sched_001' },
  { user: 'tenant:acme_health', relation: 'tenant',             object: 'schedule_block:sched_001' },
];

/**
 * Returns all healthcare tuples combined.
 */
export function getAllHealthcareTuples() {
  return [
    ...tenantTuples,
    ...clinicTuples,
    ...patientTuples,
    ...appointmentTuples,
    ...insuranceTuples,
    ...referralTuples,
    ...scheduleBlockTuples,
  ];
}
