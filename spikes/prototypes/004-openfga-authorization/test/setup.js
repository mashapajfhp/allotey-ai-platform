import { createTestStore, writeTuples, waitForHealth } from '../src/openfga-client.js';
import { getAllHealthcareTuples } from '../src/healthcare-tuples.js';
import { getAllAgentTuples } from '../src/agent-tuples.js';

/**
 * Create an isolated test store with all healthcare + agent tuples loaded.
 * Each test file calls this to get a fresh store.
 */
export async function setupTestStore(storeName) {
  await waitForHealth(10, 500);

  const { client, storeId, modelId } = await createTestStore(storeName);

  const allTuples = [...getAllHealthcareTuples(), ...getAllAgentTuples()];
  await writeTuples(client, allTuples);

  return { client, storeId, modelId };
}

/**
 * Create a store with only healthcare tuples (no agent tuples).
 */
export async function setupHealthcareOnlyStore(storeName) {
  await waitForHealth(10, 500);

  const { client, storeId, modelId } = await createTestStore(storeName);
  await writeTuples(client, getAllHealthcareTuples());

  return { client, storeId, modelId };
}
