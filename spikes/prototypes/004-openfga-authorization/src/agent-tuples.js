/**
 * Agent delegation test scenario tuples.
 *
 * Models three agent patterns:
 * 1. User-delegated: scheduling_agent acts on behalf of patient_jones
 * 2. Service-delegated: data_quality_agent acts on behalf of service_account:etl_pipeline
 * 3. Autonomous: nightly_audit has explicit grants, owner is admin_carol (for accountability only)
 */

// --- User-delegated agent: scheduling_agent ---
// patient_jones delegates to scheduling_agent for appointment management
export const userDelegatedAgentTuples = [
  // Agent capability: scheduling_agent can read patients and read/write appointments
  { user: 'user:scheduling_agent', relation: 'agent', object: 'agent_capability:sched_patient_read' },
  { user: 'user:scheduling_agent', relation: 'agent', object: 'agent_capability:sched_appointment_read' },
  { user: 'user:scheduling_agent', relation: 'agent', object: 'agent_capability:sched_appointment_write' },

  // Active delegation from patient_jones to scheduling_agent
  { user: 'user:scheduling_agent', relation: 'agent',                object: 'agent_delegation:jones_to_sched' },
  { user: 'user:patient_jones',    relation: 'delegating_principal', object: 'agent_delegation:jones_to_sched' },
  { user: 'user:scheduling_agent', relation: 'is_active',           object: 'agent_delegation:jones_to_sched' },
];

// --- Service-delegated agent: data_quality_agent ---
// service_account:etl_pipeline delegates to data_quality_agent for patient data validation.
// The service account has treating_practitioner access on patient:jones (for ETL reads).
export const serviceDelegatedAgentTuples = [
  // Agent capability: data_quality_agent can read patients
  { user: 'user:data_quality_agent', relation: 'agent', object: 'agent_capability:dq_patient_read' },

  // Active delegation from service_account:etl_pipeline to data_quality_agent
  { user: 'user:data_quality_agent',          relation: 'agent',                object: 'agent_delegation:etl_to_dq' },
  { user: 'user:service_account_etl_pipeline', relation: 'delegating_principal', object: 'agent_delegation:etl_to_dq' },
  { user: 'user:data_quality_agent',          relation: 'is_active',           object: 'agent_delegation:etl_to_dq' },
];

// --- Service-account resource permissions (written alongside healthcare tuples) ---
// The service account needs explicit resource permissions — same as any other principal.
export const serviceAccountResourceTuples = [
  // service_account is a tenant member
  { user: 'user:service_account_etl_pipeline', relation: 'member', object: 'tenant:acme_health' },

  // service_account has treating_practitioner access to patient:jones (for ETL processing)
  { user: 'user:service_account_etl_pipeline', relation: 'treating_practitioner', object: 'patient:jones' },
];

// --- Autonomous agent: nightly_audit ---
// Has explicit read-only grants. Owner is admin_carol but owner perms don't transfer.
export const autonomousAgentTuples = [
  // Explicit grant: nightly_audit can read patients (but only specific ones granted)
  { user: 'user:nightly_audit', relation: 'agent', object: 'agent_grant:audit_patient_read' },

  // Owner relationship (for accountability/audit trail only, NOT for permission inheritance)
  // Note: We intentionally do NOT give nightly_audit any direct resource relations.
  // Its permissions come only from explicit agent_grant tuples, NOT from its owner.
];

// --- Delegation ceiling test agent: ceiling_agent ---
// Delegated by patient_jones but tries to perform actions patient_jones cannot do
export const ceilingTestTuples = [
  // ceiling_agent has write capability declared
  { user: 'user:ceiling_agent', relation: 'agent', object: 'agent_capability:ceiling_patient_write' },
  { user: 'user:ceiling_agent', relation: 'agent', object: 'agent_capability:ceiling_patient_delete' },

  // Active delegation from patient_jones
  { user: 'user:ceiling_agent',  relation: 'agent',                object: 'agent_delegation:jones_to_ceiling' },
  { user: 'user:patient_jones',  relation: 'delegating_principal', object: 'agent_delegation:jones_to_ceiling' },
  { user: 'user:ceiling_agent',  relation: 'is_active',           object: 'agent_delegation:jones_to_ceiling' },
];

// --- Confused deputy agent: wrong_scope_agent ---
// Agent claims tenant scope that doesn't match the resource
export const confusedDeputyTuples = [
  { user: 'user:wrong_scope_agent', relation: 'agent', object: 'agent_capability:scope_patient_read' },

  // Delegation from rival_user (Tenant B)
  { user: 'user:wrong_scope_agent', relation: 'agent',                object: 'agent_delegation:rival_to_scope' },
  { user: 'user:rival_user',        relation: 'delegating_principal', object: 'agent_delegation:rival_to_scope' },
  { user: 'user:wrong_scope_agent', relation: 'is_active',           object: 'agent_delegation:rival_to_scope' },
];

/**
 * Returns all agent tuples combined.
 */
export function getAllAgentTuples() {
  return [
    ...userDelegatedAgentTuples,
    ...serviceDelegatedAgentTuples,
    ...serviceAccountResourceTuples,
    ...autonomousAgentTuples,
    ...ceilingTestTuples,
    ...confusedDeputyTuples,
  ];
}
