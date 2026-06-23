import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "fs-extra";
import path from "path";
import { createScopedLogger } from "../developer_experience/logger.js";

const log = createScopedLogger("schema-validator");
const ajv = new Ajv({ allErrors: true, useDefaults: true });
addFormats(ajv);

export class SchemaValidator {
  constructor() {
    this.validateFn = null;
  }

  async initialize(schemaPath) {
    try {
      log.info(`Loading shared validation schema from: ${schemaPath}`);
      const schemaJson = await fs.readJson(schemaPath);
      this.validateFn = ajv.compile(schemaJson);
    } catch (err) {
      log.error("Initialization of validation schema failed", err);
      throw err;
    }
  }

  validate(configData) {
    if (!this.validateFn) {
      throw new Error(
        "SchemaValidator must be initialized before validation can run.",
      );
    }

    const valid = this.validateFn(configData);
    if (!valid) {
      const formattedErrors = this.validateFn.errors.map((err) => ({
        instancePath: err.instancePath,
        schemaPath: err.schemaPath,
        keyword: err.keyword,
        message: err.message,
        params: err.params,
      }));

      log.warn(
        `Payload failed schema validation constraints. Found ${formattedErrors.length} validation errors.`,
      );
      return {
        isValid: false,
        errors: formattedErrors,
      };
    }

    log.info("Configuration payload successfully passed schema constraints.");
    return {
      isValid: true,
      errors: [],
    };
  }
}
