/**
 * Database Schema Adapter
 *
 * Compiles Ontology IR → SQL DDL (PostgreSQL).
 * This adapter is vendor-AWARE (it targets PostgreSQL) but domain-NEUTRAL
 * (it contains zero domain-specific logic).
 */

import { CompilationAdapter } from './base.js';

const IR_TYPE_TO_SQL = {
  string: 'TEXT',
  text: 'TEXT',
  integer: 'INTEGER',
  number: 'NUMERIC',
  float: 'DOUBLE PRECISION',
  decimal: 'NUMERIC',
  boolean: 'BOOLEAN',
  date: 'DATE',
  datetime: 'TIMESTAMPTZ',
  timestamp: 'TIMESTAMPTZ',
  json: 'JSONB',
  object: 'JSONB',
  array: 'JSONB',
  uuid: 'UUID',
};

function toSnakeCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

export class DatabaseSchemaAdapter extends CompilationAdapter {
  name() {
    return 'database-schema-postgresql';
  }

  consumes() {
    return ['ontology'];
  }

  compile(ir, config = {}) {
    const warnings = [];
    const statements = [];
    const schemaName = config.schema || 'public';

    if (!ir.ontology?.entities) {
      return {
        adapterName: this.name(),
        targetFormat: 'sql',
        content: '-- No entities defined in ontology IR',
        warnings: ['No entities found in ontology sub-IR'],
      };
    }

    // Generate CREATE TABLE for each entity
    for (const [entityName, entity] of Object.entries(ir.ontology.entities)) {
      const tableName = toSnakeCase(entityName);
      const columns = [];
      const constraints = [];

      // Primary key
      columns.push('  id UUID PRIMARY KEY DEFAULT gen_random_uuid()');

      // Tenant isolation column
      columns.push('  tenant_id UUID NOT NULL');

      // Properties
      if (entity.properties) {
        for (const [propName, prop] of Object.entries(entity.properties)) {
          const colName = toSnakeCase(propName);
          const colDef = this._compileProperty(colName, prop, warnings, entityName);
          if (colDef) columns.push(colDef);
        }
      }

      // Belongs-to relationships → foreign key columns
      if (entity.relationships) {
        for (const [relName, rel] of Object.entries(entity.relationships)) {
          if (rel.type === 'belongs_to') {
            const fkCol = `  ${toSnakeCase(relName)}_id UUID`;
            columns.push(fkCol);
            const refTable = toSnakeCase(rel.target);
            constraints.push(
              `  CONSTRAINT fk_${tableName}_${toSnakeCase(relName)} ` +
              `FOREIGN KEY (${toSnakeCase(relName)}_id) REFERENCES ${schemaName}.${refTable}(id)`
            );
          }
        }
      }

      // Timestamps
      columns.push('  created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
      columns.push('  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()');

      // Assemble CREATE TABLE
      const allParts = [...columns, ...constraints];
      const createTable = [
        `CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (`,
        allParts.join(',\n'),
        ');',
      ].join('\n');

      statements.push(createTable);

      // Tenant isolation index
      statements.push(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_tenant ON ${schemaName}.${tableName}(tenant_id);`
      );

      // RLS policy
      statements.push(`ALTER TABLE ${schemaName}.${tableName} ENABLE ROW LEVEL SECURITY;`);
      statements.push(
        `CREATE POLICY tenant_isolation_${tableName} ON ${schemaName}.${tableName} ` +
        `USING (tenant_id = current_setting('app.current_tenant_id')::UUID);`
      );

      statements.push(''); // blank line between entities
    }

    // Many-to-many junction tables
    if (ir.ontology?.entities) {
      for (const [entityName, entity] of Object.entries(ir.ontology.entities)) {
        if (entity.relationships) {
          for (const [relName, rel] of Object.entries(entity.relationships)) {
            if (rel.type === 'many_to_many') {
              const table1 = toSnakeCase(entityName);
              const table2 = toSnakeCase(rel.target);
              const junctionTable = `${table1}_${table2}`;

              statements.push(
                `CREATE TABLE IF NOT EXISTS ${schemaName}.${junctionTable} (\n` +
                `  ${table1}_id UUID NOT NULL REFERENCES ${schemaName}.${table1}(id),\n` +
                `  ${table2}_id UUID NOT NULL REFERENCES ${schemaName}.${table2}(id),\n` +
                `  tenant_id UUID NOT NULL,\n` +
                `  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n` +
                `  PRIMARY KEY (${table1}_id, ${table2}_id)\n` +
                `);`
              );
              statements.push(
                `ALTER TABLE ${schemaName}.${junctionTable} ENABLE ROW LEVEL SECURITY;`
              );
              statements.push(
                `CREATE POLICY tenant_isolation_${junctionTable} ON ${schemaName}.${junctionTable} ` +
                `USING (tenant_id = current_setting('app.current_tenant_id')::UUID);`
              );
              statements.push('');
            }
          }
        }
      }
    }

    const header = [
      '-- Generated by Domain Definition IR Compiler',
      `-- Domain: ${ir.name || 'unknown'}`,
      `-- Version: ${ir.version || 'unknown'}`,
      `-- Generated at: ${new Date().toISOString()}`,
      '-- WARNING: This is compiled output. Do not edit manually.',
      '--',
      '-- This adapter is domain-neutral. It compiled the ontology sub-IR',
      '-- without any knowledge of the specific domain.',
      '',
    ].join('\n');

    return {
      adapterName: this.name(),
      targetFormat: 'sql',
      content: header + statements.join('\n'),
      warnings,
    };
  }

  _compileProperty(colName, prop, warnings, entityName) {
    // Handle enum type
    if (prop.type === 'enum') {
      const values = prop.values || [];
      if (values.length === 0) {
        warnings.push(`Entity "${entityName}" property "${colName}" is enum with no values`);
        return `  ${colName} TEXT`;
      }
      const checkValues = values.map(v => `'${v}'`).join(', ');
      const nullable = prop.required ? ' NOT NULL' : '';
      const defaultVal = prop.default ? ` DEFAULT '${prop.default}'` : '';
      return `  ${colName} TEXT${nullable}${defaultVal} CHECK (${colName} IN (${checkValues}))`;
    }

    // Handle vector type
    if (prop.type === 'vector') {
      const dims = prop.dimensions || 1536;
      return `  ${colName} vector(${dims})`;
    }

    // Handle reference type (to another entity)
    if (prop.type === 'reference') {
      return `  ${colName}_id UUID`;
    }

    // Standard types
    const sqlType = IR_TYPE_TO_SQL[prop.type];
    if (!sqlType) {
      warnings.push(`Entity "${entityName}" property "${colName}" has unknown type "${prop.type}", defaulting to TEXT`);
      return `  ${colName} TEXT`;
    }

    const nullable = prop.required ? ' NOT NULL' : '';
    const unique = prop.unique ? ' UNIQUE' : '';
    const defaultVal = prop.default !== undefined ? ` DEFAULT ${this._formatDefault(prop.default, prop.type)}` : '';

    return `  ${colName} ${sqlType}${nullable}${unique}${defaultVal}`;
  }

  _formatDefault(value, type) {
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
  }

  validate(output) {
    const errors = [];

    if (!output.content) {
      errors.push('Compilation produced empty output');
    }

    // Basic SQL syntax checks
    if (output.content && !output.content.includes('CREATE TABLE')) {
      errors.push('Compilation produced no CREATE TABLE statements');
    }

    // Check that RLS is enabled for every table
    const createTableCount = (output.content.match(/CREATE TABLE IF NOT EXISTS/g) || []).length;
    const rlsCount = (output.content.match(/ENABLE ROW LEVEL SECURITY/g) || []).length;
    if (createTableCount !== rlsCount) {
      errors.push(`RLS mismatch: ${createTableCount} tables but ${rlsCount} RLS policies`);
    }

    return { valid: errors.length === 0, errors };
  }
}
