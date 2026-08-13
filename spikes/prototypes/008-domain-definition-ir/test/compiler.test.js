/**
 * Domain Definition IR Compiler — Test Suite
 *
 * Tests the spike 008 hypothesis:
 * "A composed set of vendor-neutral sub-IRs can be mechanically compiled
 *  to vendor-specific targets without domain-specific compiler logic."
 */

import { strict as assert } from 'node:assert';
import { join, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { loadDomainDefinition, validateIR, validateCrossReferences, auditVendorNeutrality } from '../src/ir-loader.js';
import { compileDomain, auditCoreDomainNeutrality } from '../src/compiler.js';
import { DatabaseSchemaAdapter } from '../src/adapters/database-schema.js';
import { AuthorizationModelAdapter } from '../src/adapters/authorization-model.js';

const projectRoot = resolve(import.meta.dirname, '..');
const schemasDir = join(projectRoot, 'schemas');
const healthcareDir = join(projectRoot, 'domains', 'healthcare-clinic');
const iotDir = join(projectRoot, 'domains', 'iot-monitoring');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

// ===========================================================================
// 1. LOADER TESTS
// ===========================================================================
console.log('\n=== Loader Tests ===');

test('loads healthcare domain definition', () => {
  const { ir, errors } = loadDomainDefinition(healthcareDir);
  assert.ok(ir, 'IR should not be null');
  assert.equal(ir.name, 'healthcare-clinic');
  assert.equal(ir.version, '1.0.0');
});

test('loads IoT domain definition', () => {
  const { ir, errors } = loadDomainDefinition(iotDir);
  assert.ok(ir, 'IR should not be null');
  assert.equal(ir.name, 'iot-monitoring');
  assert.equal(ir.version, '1.0.0');
});

test('returns error for missing directory', () => {
  const { ir, errors } = loadDomainDefinition('/nonexistent/path');
  assert.equal(ir, null);
  assert.ok(errors.length > 0);
});

test('normalizes entity arrays to maps', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  assert.ok(!Array.isArray(ir.ontology.entities), 'entities should be a map');
  assert.ok(ir.ontology.entities.patient, 'should have patient entity');
  assert.ok(ir.ontology.entities.practitioner, 'should have practitioner entity');
});

test('normalizes IoT entity arrays to maps (preserves casing)', () => {
  const { ir } = loadDomainDefinition(iotDir);
  assert.ok(!Array.isArray(ir.ontology.entities), 'entities should be a map');
  assert.ok(ir.ontology.entities.Facility || ir.ontology.entities.facility, 'should have Facility entity');
});

test('normalizes attributes to properties', () => {
  const { ir } = loadDomainDefinition(iotDir);
  const entityNames = Object.keys(ir.ontology.entities);
  for (const name of entityNames) {
    const entity = ir.ontology.entities[name];
    assert.ok(!entity.attributes, `entity ${name} should have properties, not attributes`);
  }
});

test('normalizes action arrays to maps', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  assert.ok(!Array.isArray(ir.actions), 'actions should be a map');
  assert.ok(ir.actions.book_appointment, 'should have book_appointment action');
});

test('normalizes semantic measures and dimensions', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  assert.ok(!Array.isArray(ir.semantic.measures), 'measures should be a map');
  assert.ok(!Array.isArray(ir.semantic.dimensions), 'dimensions should be a map');
});

test('loads all 8 sub-IRs for healthcare', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const subIRs = ['ontology', 'semantic', 'authorization', 'policy', 'actions', 'events', 'workflows', 'agent_capabilities'];
  for (const sub of subIRs) {
    assert.ok(ir[sub], `Missing sub-IR: ${sub}`);
  }
});

test('loads all 8 sub-IRs for IoT', () => {
  const { ir } = loadDomainDefinition(iotDir);
  const subIRs = ['ontology', 'semantic', 'authorization', 'policy', 'actions', 'events', 'workflows', 'agent_capabilities'];
  for (const sub of subIRs) {
    assert.ok(ir[sub], `Missing sub-IR: ${sub}`);
  }
});

// ===========================================================================
// 2. SCHEMA VALIDATION TESTS
// ===========================================================================
console.log('\n=== Schema Validation Tests ===');

test('healthcare passes schema validation', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const { valid, errors } = validateIR(ir, schemasDir);
  assert.ok(valid, `Schema errors: ${errors.join(', ')}`);
});

test('IoT passes schema validation', () => {
  const { ir } = loadDomainDefinition(iotDir);
  const { valid, errors } = validateIR(ir, schemasDir);
  assert.ok(valid, `Schema errors: ${errors.join(', ')}`);
});

test('catches missing name', () => {
  const { valid, errors } = validateIR({ version: '1.0.0', ontology: {} }, schemasDir);
  assert.ok(!valid);
  assert.ok(errors.some(e => e.includes('name')));
});

test('catches missing version', () => {
  const { valid, errors } = validateIR({ name: 'test', ontology: {} }, schemasDir);
  assert.ok(!valid);
  assert.ok(errors.some(e => e.includes('version')));
});

test('catches missing ontology', () => {
  const { valid, errors } = validateIR({ name: 'test', version: '1.0.0' }, schemasDir);
  assert.ok(!valid);
  assert.ok(errors.some(e => e.includes('ontology')));
});

// ===========================================================================
// 3. CROSS-REFERENCE VALIDATION TESTS
// ===========================================================================
console.log('\n=== Cross-Reference Tests ===');

test('IoT domain has valid cross-references', () => {
  const { ir } = loadDomainDefinition(iotDir);
  const { valid, errors } = validateCrossReferences(ir);
  assert.ok(valid, `Cross-ref errors: ${errors.join(', ')}`);
});

test('detects invalid entity references', () => {
  const ir = {
    ontology: { entities: { user: { name: 'user' } } },
    actions: { delete_order: { name: 'delete_order', entity: 'nonexistent' } },
  };
  const { valid, errors } = validateCrossReferences(ir);
  assert.ok(!valid);
  assert.ok(errors.some(e => e.includes('nonexistent')));
});

test('handles wildcard entity references', () => {
  const ir = {
    ontology: { entities: { user: { name: 'user' } } },
    authorization: { rules: { admin_all: { name: 'admin_all', entity: '*' } } },
  };
  const { valid } = validateCrossReferences(ir);
  assert.ok(valid, 'Wildcard entity refs should be valid');
});

test('validates case-insensitive entity references', () => {
  const ir = {
    ontology: { entities: { Facility: { name: 'Facility' } } },
    actions: { inspect: { name: 'inspect', target_entity: 'facility' } },
  };
  const { valid } = validateCrossReferences(ir);
  assert.ok(valid, 'Case-insensitive entity refs should resolve');
});

// ===========================================================================
// 4. VENDOR NEUTRALITY TESTS
// ===========================================================================
console.log('\n=== Vendor Neutrality Tests ===');

test('healthcare domain is vendor-neutral', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const { clean, violations } = auditVendorNeutrality(ir);
  assert.ok(clean, `Vendor violations: ${violations.join(', ')}`);
});

test('IoT domain is vendor-neutral', () => {
  const { ir } = loadDomainDefinition(iotDir);
  const { clean, violations } = auditVendorNeutrality(ir);
  assert.ok(clean, `Vendor violations: ${violations.join(', ')}`);
});

test('detects vendor-specific terms', () => {
  const ir = {
    name: 'test',
    ontology: { entities: { user: { description: 'Stored in PostgreSQL' } } },
  };
  const { clean, violations } = auditVendorNeutrality(ir);
  assert.ok(!clean);
  assert.ok(violations.some(v => v.includes('postgresql')));
});

test('does not false-positive on substrings', () => {
  const ir = {
    name: 'test',
    ontology: { entities: { user: { properties: { copay: { type: 'decimal' } } } } },
  };
  const { clean } = auditVendorNeutrality(ir);
  assert.ok(clean, '"copay" should not match "opa"');
});

// ===========================================================================
// 5. DATABASE SCHEMA ADAPTER TESTS
// ===========================================================================
console.log('\n=== Database Schema Adapter Tests ===');

test('compiles healthcare to SQL', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new DatabaseSchemaAdapter();
  const output = adapter.compile(ir);
  assert.equal(output.targetFormat, 'sql');
  assert.ok(output.content.includes('CREATE TABLE'));
  assert.ok(output.content.includes('tenant_id UUID NOT NULL'));
  assert.ok(output.content.includes('ENABLE ROW LEVEL SECURITY'));
});

test('compiles IoT to SQL', () => {
  const { ir } = loadDomainDefinition(iotDir);
  const adapter = new DatabaseSchemaAdapter();
  const output = adapter.compile(ir);
  assert.equal(output.targetFormat, 'sql');
  assert.ok(output.content.includes('CREATE TABLE'));
});

test('generates RLS for every table', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new DatabaseSchemaAdapter();
  const output = adapter.compile(ir);
  const { valid, errors } = adapter.validate(output);
  assert.ok(valid, `RLS validation failed: ${errors.join(', ')}`);
});

test('maps IR types to SQL types', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new DatabaseSchemaAdapter();
  const output = adapter.compile(ir);
  assert.ok(output.content.includes('TEXT'));
  assert.ok(output.content.includes('UUID'));
  assert.ok(output.content.includes('BOOLEAN'));
  assert.ok(output.content.includes('DATE'));
  assert.ok(output.content.includes('INTEGER'));
});

test('generates enum CHECK constraints', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new DatabaseSchemaAdapter();
  const output = adapter.compile(ir);
  assert.ok(output.content.includes('CHECK'), 'Should have CHECK constraints for enums');
});

test('produces zero warnings with fixed type map', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new DatabaseSchemaAdapter();
  const output = adapter.compile(ir);
  assert.equal(output.warnings.length, 0, `Unexpected warnings: ${output.warnings.join(', ')}`);
});

// ===========================================================================
// 6. AUTHORIZATION MODEL ADAPTER TESTS
// ===========================================================================
console.log('\n=== Authorization Model Adapter Tests ===');

test('compiles healthcare to OpenFGA DSL', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new AuthorizationModelAdapter();
  const output = adapter.compile(ir);
  assert.equal(output.targetFormat, 'openfga-dsl');
  assert.ok(output.content.includes('model'));
  assert.ok(output.content.includes('schema 1.1'));
});

test('includes platform hierarchy types', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new AuthorizationModelAdapter();
  const output = adapter.compile(ir);
  for (const type of ['platform', 'product', 'tenant', 'workspace', 'user', 'agent']) {
    assert.ok(output.content.includes(`type ${type}`), `Missing type ${type}`);
  }
});

test('generates domain entity types', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new AuthorizationModelAdapter();
  const output = adapter.compile(ir);
  assert.ok(output.content.includes('type patient'), 'Should have patient type');
  assert.ok(output.content.includes('type practitioner'), 'Should have practitioner type');
  assert.ok(output.content.includes('type appointment'), 'Should have appointment type');
});

test('validates output structure', () => {
  const { ir } = loadDomainDefinition(healthcareDir);
  const adapter = new AuthorizationModelAdapter();
  const output = adapter.compile(ir);
  const { valid, errors } = adapter.validate(output);
  assert.ok(valid, `Validation failed: ${errors.join(', ')}`);
});

// ===========================================================================
// 7. FULL PIPELINE TESTS
// ===========================================================================
console.log('\n=== Full Pipeline Tests ===');

test('healthcare full pipeline passes', () => {
  const { success, results } = compileDomain(healthcareDir, {
    schemasDir,
    verbose: false,
  });
  assert.ok(success, 'Healthcare compilation should pass');
  assert.equal(results.summary.succeeded, 2);
  assert.equal(results.summary.failed, 0);
  assert.ok(results.vendorAudit.success);
});

test('IoT full pipeline passes', () => {
  const { success, results } = compileDomain(iotDir, {
    schemasDir,
    verbose: false,
  });
  assert.ok(success, 'IoT compilation should pass');
  assert.equal(results.summary.succeeded, 2);
  assert.equal(results.summary.failed, 0);
  assert.ok(results.vendorAudit.success);
});

test('pipeline produces compiled output files', () => {
  compileDomain(healthcareDir, { schemasDir, verbose: false });
  assert.ok(existsSync(join(healthcareDir, 'compiled', 'database-schema-postgresql.sql')));
  assert.ok(existsSync(join(healthcareDir, 'compiled', 'authorization-model-openfga.openfga')));
});

// ===========================================================================
// 8. DOMAIN NEUTRALITY TESTS
// ===========================================================================
console.log('\n=== Domain Neutrality Tests ===');

test('compiler source is domain-neutral', () => {
  const srcDir = join(projectRoot, 'src');
  const { clean, violations } = auditCoreDomainNeutrality(srcDir);
  assert.ok(clean, `Domain terms in compiler source: ${violations.join(', ')}`);
});

test('same adapters work for both domains', () => {
  const healthcareResult = compileDomain(healthcareDir, { schemasDir, verbose: false });
  const iotResult = compileDomain(iotDir, { schemasDir, verbose: false });
  assert.ok(healthcareResult.success);
  assert.ok(iotResult.success);
  // Both use same adapters, produce same format
  assert.equal(healthcareResult.results.compilations.length, iotResult.results.compilations.length);
  assert.equal(healthcareResult.results.compilations[0].format, iotResult.results.compilations[0].format);
  assert.equal(healthcareResult.results.compilations[1].format, iotResult.results.compilations[1].format);
});

// ===========================================================================
// SUMMARY
// ===========================================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\nSPIKE 008 HYPOTHESIS: NEEDS INVESTIGATION');
  process.exit(1);
} else {
  console.log('\nSPIKE 008 HYPOTHESIS: SURVIVES');
  console.log('  "A composed set of vendor-neutral sub-IRs can be mechanically');
  console.log('   compiled to vendor-specific targets without domain-specific');
  console.log('   compiler logic."');
  console.log('\n  Evidence:');
  console.log('  - Two distinct domains (healthcare, IoT) compiled successfully');
  console.log('  - Same adapters, zero domain-specific code');
  console.log('  - Vendor neutrality verified in both IR and compiler source');
  console.log('  - Cross-domain compilation with identical pipeline');
}
