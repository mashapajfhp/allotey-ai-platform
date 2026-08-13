import { OpenFgaClient } from '@openfga/sdk';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = join(__dirname, '..', 'models', 'healthcare-authorization.json');

const API_URL = process.env.OPENFGA_API_URL || 'http://localhost:18080';

/**
 * Create a new OpenFGA store with the healthcare authorization model.
 * Each test file gets its own isolated store.
 */
export async function createTestStore(storeName) {
  // Create a client without store context to create the store
  const bootstrapClient = new OpenFgaClient({ apiUrl: API_URL });

  const { id: storeId } = await bootstrapClient.createStore({ name: storeName });

  // Create a client bound to the new store
  const client = new OpenFgaClient({ apiUrl: API_URL, storeId });

  // Read and write the authorization model
  const modelJson = JSON.parse(await readFile(MODEL_PATH, 'utf-8'));
  const { authorization_model_id } = await client.writeAuthorizationModel(modelJson);

  return {
    client,
    storeId,
    modelId: authorization_model_id,
  };
}

/**
 * Write relationship tuples to the store.
 * @param {OpenFgaClient} client
 * @param {Array<{user: string, relation: string, object: string}>} tuples
 */
export async function writeTuples(client, tuples) {
  // OpenFGA SDK accepts max 100 tuples per write; batch if needed
  const BATCH_SIZE = 100;
  for (let i = 0; i < tuples.length; i += BATCH_SIZE) {
    const batch = tuples.slice(i, i + BATCH_SIZE);
    await client.write({ writes: batch }, {});
  }
}

/**
 * Delete relationship tuples from the store.
 * @param {OpenFgaClient} client
 * @param {Array<{user: string, relation: string, object: string}>} tuples
 */
export async function deleteTuples(client, tuples) {
  await client.write({ deletes: tuples }, {});
}

/**
 * Run an authorization check. Returns { allowed: boolean }.
 * @param {OpenFgaClient} client
 * @param {string} user - e.g. "user:alice"
 * @param {string} relation - e.g. "can_read"
 * @param {string} object - e.g. "patient:jones"
 */
export async function check(client, user, relation, object) {
  const response = await client.check({ user, relation, object });
  return { allowed: response.allowed };
}

/**
 * Perform a layered agent delegation check.
 * All three layers must independently permit:
 *   1. Delegating principal has permission on the resource
 *   2. Agent has declared capability for this entity type
 *   3. Delegation is active
 *
 * @param {OpenFgaClient} client
 * @param {object} params
 * @param {string} params.agentId - agent identity (used as user:agent_xxx)
 * @param {string} params.delegatingPrincipal - e.g. "user:alice"
 * @param {string} params.relation - e.g. "can_read"
 * @param {string} params.resource - e.g. "patient:jones"
 * @param {string} params.capabilityObject - e.g. "agent_capability:scheduling_agent_patient_read"
 * @param {string} params.capabilityRelation - e.g. "can_read"
 * @param {string} params.delegationObject - e.g. "agent_delegation:alice_to_scheduling_agent"
 */
export async function checkAgentDelegation(client, params) {
  const {
    agentId,
    delegatingPrincipal,
    relation,
    resource,
    capabilityObject,
    capabilityRelation,
    delegationObject,
  } = params;

  // Layer 1: Does the delegating principal have permission?
  const principalCheck = await check(client, delegatingPrincipal, relation, resource);
  if (!principalCheck.allowed) {
    return { allowed: false, deniedBy: 'principal_permission' };
  }

  // Layer 2: Does the agent have the declared capability?
  const capabilityCheck = await check(client, agentId, capabilityRelation, capabilityObject);
  if (!capabilityCheck.allowed) {
    return { allowed: false, deniedBy: 'agent_capability' };
  }

  // Layer 3: Is the delegation active?
  const delegationCheck = await check(client, agentId, 'is_active', delegationObject);
  if (!delegationCheck.allowed) {
    return { allowed: false, deniedBy: 'delegation_inactive' };
  }

  return { allowed: true };
}

/**
 * Wait for OpenFGA to be healthy (used by test setup).
 */
export async function waitForHealth(maxRetries = 30, intervalMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${API_URL}/healthz`);
      if (res.ok) return true;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`OpenFGA not healthy after ${maxRetries} retries at ${API_URL}`);
}
