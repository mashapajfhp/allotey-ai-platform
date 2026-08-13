/**
 * Domain Definition IR Loader
 *
 * Loads domain definition YAML files and parses them into
 * an in-memory IR structure. Normalizes YAML array conventions
 * into canonical map-by-name IR shape. Validates against JSON Schema.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Load and parse a domain definition from a directory.
 * Expects a domain.yaml file in the given directory.
 * Normalizes YAML array format to canonical map-by-name IR.
 *
 * @param {string} domainDir - Path to the domain directory
 * @returns {{ ir: object, errors: string[] }}
 */
export function loadDomainDefinition(domainDir) {
  const domainPath = join(resolve(domainDir), 'domain.yaml');

  if (!existsSync(domainPath)) {
    return { ir: null, errors: [`Domain definition not found: ${domainPath}`] };
  }

  let raw;
  try {
    const content = readFileSync(domainPath, 'utf-8');
    raw = yamlLoad(content);
  } catch (err) {
    return { ir: null, errors: [`YAML parse error: ${err.message}`] };
  }

  if (!raw || !raw.domain_definition) {
    return { ir: null, errors: ['Missing top-level "domain_definition" key'] };
  }

  const ir = normalizeIR(raw.domain_definition);
  return { ir, errors: [] };
}

/**
 * Normalize the raw parsed IR into canonical shape.
 * Converts arrays-with-name-field to maps-keyed-by-name.
 * Normalizes field aliases (attributes → properties).
 */
function normalizeIR(raw) {
  const ir = { ...raw };

  // Normalize ontology entities
  if (ir.ontology?.entities) {
    ir.ontology = { ...ir.ontology };
    ir.ontology.entities = arrayToMap(ir.ontology.entities);

    // Normalize entity internals
    for (const [name, entity] of Object.entries(ir.ontology.entities)) {
      const normalized = { ...entity };

      // attributes → properties
      if (normalized.attributes && !normalized.properties) {
        normalized.properties = normalized.attributes;
        delete normalized.attributes;
      }

      // Normalize properties array → map
      if (Array.isArray(normalized.properties)) {
        normalized.properties = arrayToMap(normalized.properties);
      }

      // Normalize relationships array → map
      if (Array.isArray(normalized.relationships)) {
        normalized.relationships = arrayToMap(normalized.relationships);
      }

      ir.ontology.entities[name] = normalized;
    }
  }

  // Normalize semantic sub-IR
  if (ir.semantic) {
    ir.semantic = { ...ir.semantic };
    if (Array.isArray(ir.semantic.measures)) {
      ir.semantic.measures = arrayToMap(ir.semantic.measures);
    }
    if (Array.isArray(ir.semantic.dimensions)) {
      ir.semantic.dimensions = arrayToMap(ir.semantic.dimensions);
    }
  }

  // Normalize authorization sub-IR
  if (ir.authorization) {
    ir.authorization = { ...ir.authorization };
    if (Array.isArray(ir.authorization.roles)) {
      ir.authorization.roles = arrayToMap(ir.authorization.roles);
    }
    if (Array.isArray(ir.authorization.relationships)) {
      ir.authorization.relationships = arrayToMap(ir.authorization.relationships);
    }
    if (Array.isArray(ir.authorization.rules)) {
      ir.authorization.rules = arrayToMap(ir.authorization.rules);
    }
  }

  // Normalize policy sub-IR
  if (ir.policy) {
    ir.policy = { ...ir.policy };
    if (Array.isArray(ir.policy.compliance)) {
      ir.policy.compliance = arrayToMap(ir.policy.compliance);
    }
    if (Array.isArray(ir.policy.constraints)) {
      ir.policy.constraints = arrayToMap(ir.policy.constraints);
    }
    if (Array.isArray(ir.policy.operational)) {
      ir.policy.operational = arrayToMap(ir.policy.operational);
    }
  }

  // Normalize action, event, workflow, agent sub-IRs
  if (Array.isArray(ir.actions)) {
    ir.actions = arrayToMap(ir.actions);
  }
  if (Array.isArray(ir.events)) {
    ir.events = arrayToMap(ir.events);
  }
  if (Array.isArray(ir.workflows)) {
    ir.workflows = arrayToMap(ir.workflows);
  }
  if (Array.isArray(ir.agent_capabilities)) {
    ir.agent_capabilities = arrayToMap(ir.agent_capabilities);
  }

  return ir;
}

/**
 * Convert an array of objects with `name` fields to a map keyed by name.
 * Falls through gracefully if already a map or no name fields.
 */
function arrayToMap(arr) {
  if (!Array.isArray(arr)) return arr;
  const map = {};
  for (const item of arr) {
    if (item && typeof item === 'object' && item.name) {
      map[item.name] = item;
    }
  }
  // If no items had name fields, return as-is (shouldn't happen in valid IR)
  return Object.keys(map).length > 0 ? map : arr;
}

/**
 * Validate a loaded IR against JSON Schemas.
 *
 * @param {object} ir - The parsed (and normalized) domain definition IR
 * @param {string} schemasDir - Path to the schemas directory
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateIR(ir, schemasDir) {
  const errors = [];

  // Structural validation — basic checks
  if (!ir.name) errors.push('Missing required field: name');
  if (!ir.version) errors.push('Missing required field: version');

  const requiredSubIRs = ['ontology'];
  for (const subIR of requiredSubIRs) {
    if (!ir[subIR]) {
      errors.push(`Missing required sub-IR: ${subIR}`);
    }
  }

  // Try JSON Schema validation if schemas exist
  const envelopeSchemaPath = join(schemasDir, 'domain-definition.schema.json');
  if (existsSync(envelopeSchemaPath)) {
    try {
      const ajv = new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);

      // Load all sub-IR schemas first so $ref resolution works
      const schemaFiles = readdirSync(schemasDir).filter(f =>
        f.endsWith('.schema.json') && f !== 'domain-definition.schema.json'
      );
      for (const f of schemaFiles) {
        const schema = JSON.parse(readFileSync(join(schemasDir, f), 'utf-8'));
        try {
          ajv.addSchema(schema);
        } catch {
          // Schema already added or duplicate $id — skip
        }
      }

      // Compile the envelope schema last (it references the sub-IR schemas)
      const envelopeSchema = JSON.parse(readFileSync(envelopeSchemaPath, 'utf-8'));
      const validate = ajv.compile(envelopeSchema);
      const valid = validate({ domain_definition: ir });

      if (!valid && validate.errors) {
        for (const err of validate.errors) {
          errors.push(`Schema: ${err.instancePath} ${err.message}`);
        }
      }
    } catch (err) {
      errors.push(`Schema validation setup error: ${err.message}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Cross-IR reference validation.
 * Ensures all references between sub-IRs resolve correctly.
 *
 * @param {object} ir - The parsed (and normalized) domain definition IR
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCrossReferences(ir) {
  const errors = [];

  // Collect all entity names from ontology (case-insensitive lookup)
  const entityNames = new Set();
  const entityNamesLower = new Map(); // lowercase → original
  if (ir.ontology?.entities) {
    for (const name of Object.keys(ir.ontology.entities)) {
      entityNames.add(name);
      entityNamesLower.set(name.toLowerCase(), name);
    }
  }

  // Helper: check if entity ref resolves (case-insensitive, allows wildcards)
  const entityExists = (ref) => {
    if (!ref) return true;
    if (ref === '*' || ref === 'all') return true; // wildcard refs
    return entityNames.has(ref) || entityNamesLower.has(ref.toLowerCase());
  };

  // Validate semantic IR references entities that exist
  if (ir.semantic?.measures) {
    for (const [name, measure] of Object.entries(ir.semantic.measures)) {
      const entityRef = measure.entity || measure.source_entity;
      if (entityRef && !entityExists(entityRef)) {
        errors.push(`Semantic measure "${name}" references unknown entity "${entityRef}"`);
      }
      // Check entities array (some measures reference multiple entities)
      if (Array.isArray(measure.entities)) {
        for (const e of measure.entities) {
          const eName = typeof e === 'string' ? e : e.entity || e.name;
          if (eName && !entityExists(eName)) {
            errors.push(`Semantic measure "${name}" references unknown entity "${eName}"`);
          }
        }
      }
    }
  }
  if (ir.semantic?.dimensions) {
    for (const [name, dim] of Object.entries(ir.semantic.dimensions)) {
      const entityRef = dim.entity || dim.source_entity;
      if (entityRef && !entityExists(entityRef)) {
        errors.push(`Semantic dimension "${name}" references unknown entity "${entityRef}"`);
      }
    }
  }

  // Validate action IR references entities that exist
  if (ir.actions) {
    for (const [name, action] of Object.entries(ir.actions)) {
      const entityRef = action.entity || action.target_entity;
      if (entityRef && !entityExists(entityRef)) {
        errors.push(`Action "${name}" references unknown entity "${entityRef}"`);
      }
    }
  }

  // Validate event IR references entities that exist
  if (ir.events) {
    for (const [name, event] of Object.entries(ir.events)) {
      const entityRef = event.entity || event.source_entity;
      if (entityRef && !entityExists(entityRef)) {
        errors.push(`Event "${name}" references unknown entity "${entityRef}"`);
      }
    }
  }

  // Validate relationship targets exist
  if (ir.ontology?.entities) {
    for (const [entityName, entity] of Object.entries(ir.ontology.entities)) {
      if (entity.relationships) {
        const rels = typeof entity.relationships === 'object' && !Array.isArray(entity.relationships)
          ? Object.entries(entity.relationships)
          : [];
        for (const [relName, rel] of rels) {
          const targetRef = rel.target || rel.to;
          if (targetRef && !entityExists(targetRef)) {
            errors.push(`Entity "${entityName}" relationship "${relName}" references unknown target "${targetRef}"`);
          }
        }
      }
    }
  }

  // Validate authorization rules reference entities
  if (ir.authorization?.rules) {
    for (const [name, rule] of Object.entries(ir.authorization.rules)) {
      const entityRef = rule.on_entity || rule.entity;
      if (entityRef && !entityExists(entityRef)) {
        errors.push(`Authorization rule "${name}" references unknown entity "${entityRef}"`);
      }
    }
  }

  // Validate workflow steps reference actions that exist
  const actionNames = ir.actions ? new Set(Object.keys(ir.actions)) : new Set();
  const actionNamesLower = new Map();
  if (ir.actions) {
    for (const name of Object.keys(ir.actions)) {
      actionNamesLower.set(name.toLowerCase(), name);
    }
  }
  const actionExists = (ref) => {
    if (!ref || typeof ref !== 'string') return true;
    return actionNames.has(ref) || actionNamesLower.has(ref.toLowerCase());
  };

  if (ir.workflows) {
    for (const [wfName, workflow] of Object.entries(ir.workflows)) {
      if (workflow.steps) {
        for (const step of workflow.steps) {
          const actionRef = step.action || step.action_ref;
          if (actionRef && !actionExists(actionRef)) {
            errors.push(`Workflow "${wfName}" step references unknown action "${actionRef}"`);
          }
        }
      }
    }
  }

  // Validate agent capabilities reference actions
  if (ir.agent_capabilities) {
    for (const [agentName, agent] of Object.entries(ir.agent_capabilities)) {
      if (agent.allowed_actions) {
        for (const actionRef of agent.allowed_actions) {
          const ref = typeof actionRef === 'string' ? actionRef : actionRef?.name;
          if (ref && !actionExists(ref)) {
            errors.push(`Agent "${agentName}" references unknown action "${ref}"`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check IR for vendor-specific references.
 * The IR must be vendor-neutral. Uses word-boundary matching
 * to avoid false positives (e.g., "opa" in "copay").
 *
 * @param {object} ir - The parsed domain definition IR
 * @returns {{ clean: boolean, violations: string[] }}
 */
export function auditVendorNeutrality(ir) {
  const vendorTerms = [
    'postgresql', 'postgres', 'mysql', 'mongodb',
    'openfga', 'opa', 'cedar',
    'cubejs',
    'inngest', 'restate',
    'langchain', 'langgraph',
    'openai', 'anthropic',
    'kafka', 'rabbitmq', 'redis',
    'neo4j', 'qdrant', 'weaviate', 'pinecone',
    'debezium', 'clickhouse', 'duckdb',
  ];

  // Build regex patterns with word boundaries
  const vendorPatterns = vendorTerms.map(term => ({
    term,
    regex: new RegExp(`\\b${term}\\b`, 'i'),
  }));

  const violations = [];

  function scanObject(obj, path) {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'string') {
      for (const { term, regex } of vendorPatterns) {
        if (regex.test(obj)) {
          violations.push(`Vendor-specific term "${term}" found at ${path || '(root)'}`);
        }
      }
    } else if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        scanObject(obj[i], `${path}[${i}]`);
      }
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        for (const { term, regex } of vendorPatterns) {
          if (regex.test(key)) {
            violations.push(`Vendor-specific term "${term}" found in key at ${path}.${key}`);
          }
        }
        scanObject(value, `${path}.${key}`);
      }
    }
  }

  scanObject(ir, '');

  return { clean: violations.length === 0, violations };
}
