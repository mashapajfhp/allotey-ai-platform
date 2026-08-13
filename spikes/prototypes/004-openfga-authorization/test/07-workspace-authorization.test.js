import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { check, createTestStore, writeTuples } from '../src/openfga-client.js';
import { waitForHealth } from '../src/openfga-client.js';

describe('07 — Workspace authorization', () => {
  let client;

  before(async () => {
    await waitForHealth(10, 500);
    ({ client } = await createTestStore('test-07-workspace-authorization'));

    // Set up workspace scenario
    await writeTuples(client, [
      // Tenant
      { user: 'user:alice', relation: 'member', object: 'tenant:acme' },
      { user: 'user:bob',   relation: 'member', object: 'tenant:acme' },
      { user: 'user:eve',   relation: 'member', object: 'tenant:acme' },

      // Engineering workspace
      { user: 'tenant:acme', relation: 'tenant',      object: 'workspace:engineering' },
      { user: 'user:alice',  relation: 'lead',         object: 'workspace:engineering' },
      { user: 'user:bob',   relation: 'contributor',  object: 'workspace:engineering' },

      // Finance workspace
      { user: 'tenant:acme', relation: 'tenant',      object: 'workspace:finance' },
      { user: 'user:eve',   relation: 'contributor',  object: 'workspace:finance' },

      // Resources scoped to workspaces
      { user: 'workspace:engineering', relation: 'workspace', object: 'workspace_resource:eng_doc_1' },
      { user: 'workspace:finance',     relation: 'workspace', object: 'workspace_resource:fin_doc_1' },
    ]);
  });

  it('workspace contributor can read resources in their workspace', async () => {
    const result = await check(client, 'user:bob', 'can_read', 'workspace_resource:eng_doc_1');
    assert.equal(result.allowed, true);
  });

  it('workspace lead can read resources in their workspace', async () => {
    const result = await check(client, 'user:alice', 'can_read', 'workspace_resource:eng_doc_1');
    assert.equal(result.allowed, true);
  });

  it('workspace contributor can write resources in their workspace', async () => {
    const result = await check(client, 'user:bob', 'can_write', 'workspace_resource:eng_doc_1');
    assert.equal(result.allowed, true);
  });

  it('workspace lead can manage workspace', async () => {
    const result = await check(client, 'user:alice', 'can_manage', 'workspace:engineering');
    assert.equal(result.allowed, true);
  });

  it('non-member cannot read workspace resources', async () => {
    // Eve is in finance, NOT in engineering
    const result = await check(client, 'user:eve', 'can_read', 'workspace_resource:eng_doc_1');
    assert.equal(result.allowed, false, 'No workspace membership = no resource access');
  });

  it('engineering member cannot read finance resources', async () => {
    const result = await check(client, 'user:bob', 'can_read', 'workspace_resource:fin_doc_1');
    assert.equal(result.allowed, false, 'Cross-workspace access denied');
  });

  it('contributor cannot manage workspace', async () => {
    const result = await check(client, 'user:bob', 'can_manage', 'workspace:engineering');
    assert.equal(result.allowed, false, 'Only leads can manage');
  });

  it('finance member can read finance resources', async () => {
    const result = await check(client, 'user:eve', 'can_read', 'workspace_resource:fin_doc_1');
    assert.equal(result.allowed, true);
  });
});
