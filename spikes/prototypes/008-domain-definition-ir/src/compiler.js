/**
 * Domain Definition IR Compiler
 *
 * Orchestrates the compilation pipeline:
 * 1. Load domain definition (YAML → IR)
 * 2. Validate IR (schema + cross-references)
 * 3. Audit vendor neutrality
 * 4. Compile through registered adapters
 * 5. Validate compilation outputs
 *
 * The compiler contains ZERO domain-specific logic.
 * It is a mechanical pipeline that transforms vendor-neutral IR
 * through vendor-aware (but domain-neutral) adapters.
 */

import { loadDomainDefinition, validateIR, validateCrossReferences, auditVendorNeutrality } from './ir-loader.js';
import { DatabaseSchemaAdapter } from './adapters/database-schema.js';
import { AuthorizationModelAdapter } from './adapters/authorization-model.js';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Run the full compilation pipeline for a domain.
 *
 * @param {string} domainDir - Path to the domain directory
 * @param {object} options
 * @param {string} options.schemasDir - Path to JSON schemas
 * @param {string} options.outputDir - Where to write compiled artifacts
 * @param {boolean} options.verbose - Print detailed output
 * @returns {{ success: boolean, results: object }}
 */
export function compileDomain(domainDir, options = {}) {
  const schemasDir = options.schemasDir || join(resolve(domainDir), '../../schemas');
  const outputDir = options.outputDir || join(resolve(domainDir), 'compiled');
  const verbose = options.verbose ?? true;

  const results = {
    domain: null,
    loading: { success: false, errors: [] },
    validation: { success: false, errors: [] },
    crossReferences: { success: false, errors: [] },
    vendorAudit: { success: false, violations: [] },
    compilations: [],
    summary: { adapters: 0, succeeded: 0, failed: 0, warnings: 0 },
  };

  // Step 1: Load
  log(verbose, '\n=== STEP 1: Loading domain definition ===');
  const { ir, errors: loadErrors } = loadDomainDefinition(domainDir);
  results.loading.errors = loadErrors;

  if (!ir) {
    results.loading.success = false;
    log(verbose, `FAIL: ${loadErrors.join(', ')}`);
    return { success: false, results };
  }

  results.loading.success = true;
  results.domain = ir.name || 'unknown';
  log(verbose, `OK: Loaded domain "${results.domain}" v${ir.version || '?'}`);

  // Count sub-IRs
  const subIRs = ['ontology', 'semantic', 'authorization', 'policy', 'actions', 'events', 'workflows', 'agent_capabilities'];
  const presentSubIRs = subIRs.filter(s => ir[s]);
  log(verbose, `   Sub-IRs present: ${presentSubIRs.join(', ')}`);

  // Step 2: Schema validation
  log(verbose, '\n=== STEP 2: Schema validation ===');
  const { valid, errors: valErrors } = validateIR(ir, schemasDir);
  results.validation.success = valid;
  results.validation.errors = valErrors;

  if (!valid) {
    log(verbose, `WARN: Schema validation issues:`);
    for (const err of valErrors) {
      log(verbose, `  - ${err}`);
    }
  } else {
    log(verbose, 'OK: Schema validation passed');
  }

  // Step 3: Cross-reference validation
  log(verbose, '\n=== STEP 3: Cross-IR reference validation ===');
  const { valid: xrefValid, errors: xrefErrors } = validateCrossReferences(ir);
  results.crossReferences.success = xrefValid;
  results.crossReferences.errors = xrefErrors;

  if (!xrefValid) {
    log(verbose, `WARN: Cross-reference issues:`);
    for (const err of xrefErrors) {
      log(verbose, `  - ${err}`);
    }
  } else {
    log(verbose, 'OK: All cross-IR references resolve');
  }

  // Step 4: Vendor neutrality audit
  log(verbose, '\n=== STEP 4: Vendor neutrality audit ===');
  const { clean, violations } = auditVendorNeutrality(ir);
  results.vendorAudit.success = clean;
  results.vendorAudit.violations = violations;

  if (!clean) {
    log(verbose, `FAIL: Vendor-specific terms found in IR:`);
    for (const v of violations) {
      log(verbose, `  - ${v}`);
    }
  } else {
    log(verbose, 'OK: IR is vendor-neutral');
  }

  // Step 5: Compile through adapters
  log(verbose, '\n=== STEP 5: Compilation ===');

  const adapters = [
    new DatabaseSchemaAdapter(),
    new AuthorizationModelAdapter(),
  ];

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const adapter of adapters) {
    log(verbose, `\n--- Adapter: ${adapter.name()} ---`);
    log(verbose, `   Consumes: ${adapter.consumes().join(', ')}`);

    results.summary.adapters++;

    try {
      const output = adapter.compile(ir);

      // Validate the output
      const validation = adapter.validate(output);

      const compilationResult = {
        adapter: adapter.name(),
        format: output.targetFormat,
        success: validation.valid,
        warnings: output.warnings,
        validationErrors: validation.errors,
      };

      results.compilations.push(compilationResult);

      if (validation.valid) {
        results.summary.succeeded++;
        log(verbose, `   OK: Compiled successfully`);

        // Write output file
        const ext = output.targetFormat === 'sql' ? 'sql' : output.targetFormat === 'openfga-dsl' ? 'openfga' : 'txt';
        const outFile = join(outputDir, `${adapter.name()}.${ext}`);
        writeFileSync(outFile, output.content, 'utf-8');
        log(verbose, `   Written to: ${outFile}`);
      } else {
        results.summary.failed++;
        log(verbose, `   FAIL: Validation errors:`);
        for (const err of validation.errors) {
          log(verbose, `     - ${err}`);
        }
      }

      if (output.warnings.length > 0) {
        results.summary.warnings += output.warnings.length;
        for (const w of output.warnings) {
          log(verbose, `   WARN: ${w}`);
        }
      }
    } catch (err) {
      results.summary.failed++;
      results.compilations.push({
        adapter: adapter.name(),
        format: 'error',
        success: false,
        warnings: [],
        validationErrors: [`Compilation error: ${err.message}`],
      });
      log(verbose, `   FAIL: ${err.message}`);
    }
  }

  // Summary
  log(verbose, '\n=== COMPILATION SUMMARY ===');
  log(verbose, `Domain: ${results.domain}`);
  log(verbose, `Sub-IRs: ${presentSubIRs.length}/8 (${presentSubIRs.join(', ')})`);
  log(verbose, `Adapters: ${results.summary.adapters} total, ${results.summary.succeeded} succeeded, ${results.summary.failed} failed`);
  log(verbose, `Warnings: ${results.summary.warnings}`);
  log(verbose, `Vendor neutral: ${results.vendorAudit.success ? 'YES' : 'NO'}`);
  log(verbose, `Cross-refs valid: ${results.crossReferences.success ? 'YES' : `NO (${results.crossReferences.errors.length} issues)`}`);

  const success = results.loading.success &&
    results.vendorAudit.success &&
    results.summary.failed === 0;

  log(verbose, `\nOverall: ${success ? 'PASS' : 'FAIL'}`);

  return { success, results };
}

/**
 * Audit compiler and adapter source code for domain-specific terms.
 * This checks that the compiler itself is domain-neutral.
 *
 * @param {string} srcDir - Path to the compiler source directory
 * @returns {{ clean: boolean, violations: string[] }}
 */
export function auditCoreDomainNeutrality(srcDir) {
  // Domain-specific terms from the four test domains
  const domainTerms = [
    // Healthcare
    'patient', 'practitioner', 'appointment', 'clinic', 'insurance',
    'hipaa', 'referral', 'diagnosis', 'prescription', 'medical',
    // IoT
    'sensor', 'device', 'facility', 'temperature', 'vibration',
    'maintenance', 'calibrat', 'scada', 'mqtt', 'telemetry',
    // Legal (excluding 'case' — it's a JS keyword)
    'legal_case', 'evidence', 'precedent', 'filing', 'attorney',
    'court', 'discovery', 'privilege', 'litigation',
    // Credit
    'credit', 'applicant', 'scoring', 'lending', 'loan',
    'bureau', 'underwriting',
  ];

  const violations = [];
  const patterns = domainTerms.map(t => ({ term: t, regex: new RegExp(`\\b${t}\\b`, 'i') }));

  // Scan all .js files in src/ recursively
  function scanDir(dir) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.js')) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip comments that are documenting the audit terms themselves
          if (line.trim().startsWith('//') && line.includes('Healthcare') || line.includes('IoT') || line.includes('Legal') || line.includes('Credit')) continue;
          // Skip the domainTerms array definition lines
          if (line.includes("'patient'") && line.includes("'practitioner'")) continue;
          if (line.includes("'sensor'") && line.includes("'device'")) continue;
          if (line.includes("'case'") && line.includes("'evidence'")) continue;
          if (line.includes("'credit'") && line.includes("'applicant'")) continue;
          if (line.includes("'bureau'") && line.includes("'underwriting'")) continue;
          if (line.includes("'hipaa'") && line.includes("'referral'")) continue;
          if (line.includes("'maintenance'") && line.includes("'calibrat'")) continue;
          if (line.includes("'court'") && line.includes("'discovery'")) continue;

          for (const { term, regex } of patterns) {
            if (regex.test(line)) {
              // Skip if this line is inside the domainTerms array
              if (line.trim().startsWith("'") && line.trim().endsWith("',")) continue;
              violations.push(`${entry.name}:${i + 1} — contains domain term "${term}"`);
            }
          }
        }
      }
    }
  }

  scanDir(srcDir);

  return { clean: violations.length === 0, violations };
}

function log(verbose, msg) {
  if (verbose) console.log(msg);
}
