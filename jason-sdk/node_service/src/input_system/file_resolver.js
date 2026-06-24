import fs from 'fs-extra';
import path from 'path';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('file-resolver');

export class FileResolver {
  static async resolveReferences(configData, basePath) {
    log.info(`Resolving relative JSON reference paths inside configuration. Context directory: ${basePath}`);
    return this.walkAndResolve(configData, basePath, new Set());
  }

  /**
   * Validate that a resolved path stays within the allowed base directory.
   * This prevents path traversal attacks where a malicious config could use
   * $ref pointers like "/etc/passwd" or "../../secrets" to read arbitrary
   * files on the host system.
   * 
   * @param {string} resolvedPath - The absolute path after resolution
   * @param {string} allowedBase - The base directory that paths must stay within
   * @throws {Error} If the path escapes the allowed directory
   */
  static validatePathSandbox(resolvedPath, allowedBase) {
    const normalizedPath = path.normalize(resolvedPath);
    const normalizedBase = path.normalize(allowedBase);
    
    if (!normalizedPath.startsWith(normalizedBase + path.sep) && normalizedPath !== normalizedBase) {
      throw new Error(
        `Security violation: Resource path "${normalizedPath}" attempts to escape sandbox "${normalizedBase}". ` +
        `All $ref references must point to files within the workspace directory.`
      );
    }
  }

  static async walkAndResolve(node, basePath, visitedPaths) {
    if (node === null || typeof node !== 'object') {
      return node;
    }

    // Resolve structural array elements recursively
    if (Array.isArray(node)) {
      const resolvedArray = [];
      for (const element of node) {
        resolvedArray.push(await this.walkAndResolve(element, basePath, visitedPaths));
      }
      return resolvedArray;
    }

    // Process local reference keywords
    if (node.$ref && typeof node.$ref === 'string') {
      // Reject absolute paths — they are a path traversal vector
      if (path.isAbsolute(node.$ref)) {
        throw new Error(
          `Security violation: Absolute path in $ref is not allowed: "${node.$ref}". ` +
          `Use relative paths within the workspace directory only.`
        );
      }

      const targetPath = path.resolve(basePath, node.$ref);

      // Validate that the resolved path stays within the sandbox
      this.validatePathSandbox(targetPath, basePath);

      log.info(`Resolving sub-schema reference file: ${targetPath}`);

      if (visitedPaths.has(targetPath)) {
        throw new Error(`Circular reference loop path detected: ${targetPath}`);
      }

      if (!(await fs.pathExists(targetPath))) {
        throw new Error(`Reference compilation failed. Referenced file path does not exist: ${targetPath}`);
      }

      visitedPaths.add(targetPath);
      const subJson = await fs.readJson(targetPath);
      
      // Merge properties and execute recursive lookup inside child manifest
      const mergedWithRef = { ...node, ...subJson };
      delete mergedWithRef.$ref;

      const resolvedRef = await this.walkAndResolve(mergedWithRef, path.dirname(targetPath), visitedPaths);
      visitedPaths.delete(targetPath);
      return resolvedRef;
    }

    // Walk dictionary node properties
    const resolvedObject = {};
    for (const [key, value] of Object.entries(node)) {
      resolvedObject[key] = await this.walkAndResolve(value, basePath, visitedPaths);
    }

    return resolvedObject;
  }
}
