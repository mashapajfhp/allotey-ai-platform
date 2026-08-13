/**
 * Base Compilation Adapter Interface
 *
 * All compilation adapters implement this interface.
 * Adapters transform vendor-neutral IR into product-specific artifacts.
 * Adapters must contain ZERO domain-specific logic.
 */

/**
 * @typedef {Object} CompilationOutput
 * @property {string} adapterName - Name of the adapter that produced this
 * @property {string} targetFormat - The output format (e.g., 'sql', 'openfga-model', 'json-schema')
 * @property {string} content - The compiled output content
 * @property {string[]} warnings - Non-fatal warnings during compilation
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * Base adapter class. Adapters extend this.
 */
export class CompilationAdapter {
  /**
   * @returns {string} Human-readable adapter name
   */
  name() {
    throw new Error('Adapter must implement name()');
  }

  /**
   * Which sub-IRs does this adapter consume?
   * @returns {string[]} Array of sub-IR names (e.g., ['ontology', 'authorization'])
   */
  consumes() {
    throw new Error('Adapter must implement consumes()');
  }

  /**
   * Compile the IR into the target format.
   *
   * @param {object} ir - The full Domain Definition IR
   * @param {object} config - Adapter-specific configuration
   * @returns {CompilationOutput}
   */
  compile(ir, config = {}) {
    throw new Error('Adapter must implement compile()');
  }

  /**
   * Validate the compilation output.
   *
   * @param {CompilationOutput} output
   * @returns {ValidationResult}
   */
  validate(output) {
    return { valid: true, errors: [] };
  }
}
