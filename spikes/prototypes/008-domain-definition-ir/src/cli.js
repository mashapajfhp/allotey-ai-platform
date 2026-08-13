#!/usr/bin/env node

/**
 * Domain Definition IR Compiler — CLI
 *
 * Usage:
 *   node src/cli.js compile <domain-dir>     Compile a domain definition
 *   node src/cli.js validate <domain-dir>    Validate without compiling
 *   node src/cli.js audit                     Audit compiler source for domain-specific terms
 *   node src/cli.js compile-all               Compile all domains in domains/
 */

import { compileDomain, auditCoreDomainNeutrality } from './compiler.js';
import { loadDomainDefinition, validateIR, validateCrossReferences, auditVendorNeutrality } from './ir-loader.js';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const command = args[0];
const target = args[1];

const projectRoot = resolve(import.meta.dirname, '..');

switch (command) {
  case 'compile': {
    if (!target) {
      console.error('Usage: node src/cli.js compile <domain-dir>');
      process.exit(1);
    }
    const domainDir = resolve(target);
    const { success, results } = compileDomain(domainDir, {
      schemasDir: join(projectRoot, 'schemas'),
      verbose: true,
    });
    process.exit(success ? 0 : 1);
    break;
  }

  case 'validate': {
    if (!target) {
      console.error('Usage: node src/cli.js validate <domain-dir>');
      process.exit(1);
    }
    const domainDir = resolve(target);
    const { ir, errors } = loadDomainDefinition(domainDir);
    if (!ir) {
      console.error('Failed to load:', errors.join(', '));
      process.exit(1);
    }

    console.log(`Domain: ${ir.name} v${ir.version}`);

    const schemasDir = join(projectRoot, 'schemas');
    const { valid, errors: valErrors } = validateIR(ir, schemasDir);
    if (!valid) {
      console.log('Schema validation issues:');
      for (const e of valErrors) console.log(`  - ${e}`);
    } else {
      console.log('Schema validation: PASS');
    }

    const { valid: xrefValid, errors: xrefErrors } = validateCrossReferences(ir);
    if (!xrefValid) {
      console.log('Cross-reference issues:');
      for (const e of xrefErrors) console.log(`  - ${e}`);
    } else {
      console.log('Cross-references: PASS');
    }

    const { clean, violations } = auditVendorNeutrality(ir);
    if (!clean) {
      console.log('Vendor neutrality violations:');
      for (const v of violations) console.log(`  - ${v}`);
    } else {
      console.log('Vendor neutrality: PASS');
    }

    process.exit(valid && xrefValid && clean ? 0 : 1);
    break;
  }

  case 'audit': {
    console.log('Auditing compiler source for domain-specific terms...');
    const srcDir = join(projectRoot, 'src');
    const result = auditCoreDomainNeutrality(srcDir);
    if (result.clean) {
      console.log('PASS: No domain-specific terms found in compiler source');
    } else {
      console.log('FAIL: Domain-specific terms found:');
      for (const v of result.violations) console.log(`  - ${v}`);
    }
    process.exit(result.clean ? 0 : 1);
    break;
  }

  case 'compile-all': {
    const domainsDir = join(projectRoot, 'domains');
    if (!existsSync(domainsDir)) {
      console.error('No domains/ directory found');
      process.exit(1);
    }

    const domains = readdirSync(domainsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    console.log(`Found ${domains.length} domains: ${domains.join(', ')}\n`);

    let allSuccess = true;
    const domainResults = [];

    for (const domain of domains) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`COMPILING: ${domain}`);
      console.log('='.repeat(60));

      const domainDir = join(domainsDir, domain);
      const { success, results } = compileDomain(domainDir, {
        schemasDir: join(projectRoot, 'schemas'),
        verbose: true,
      });

      domainResults.push({ domain, success, results });
      if (!success) allSuccess = false;
    }

    // Cross-domain summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('CROSS-DOMAIN SUMMARY');
    console.log('='.repeat(60));

    for (const { domain, success, results } of domainResults) {
      const status = success ? 'PASS' : 'FAIL';
      const adapters = `${results.summary.succeeded}/${results.summary.adapters} adapters`;
      const vendor = results.vendorAudit.success ? 'vendor-neutral' : 'VENDOR VIOLATIONS';
      console.log(`  ${status}  ${domain} — ${adapters}, ${vendor}`);
    }

    console.log(`\nOverall: ${allSuccess ? 'ALL PASS' : 'SOME FAILED'}`);
    process.exit(allSuccess ? 0 : 1);
    break;
  }

  default:
    console.log('Domain Definition IR Compiler');
    console.log('');
    console.log('Usage:');
    console.log('  node src/cli.js compile <domain-dir>     Compile a domain');
    console.log('  node src/cli.js validate <domain-dir>    Validate without compiling');
    console.log('  node src/cli.js audit                    Audit compiler for domain terms');
    console.log('  node src/cli.js compile-all              Compile all domains');
    process.exit(0);
}
