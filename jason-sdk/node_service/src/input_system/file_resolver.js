import fs from 'fs-extra';
import path from 'path';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('file-resolver');

export class FileResolver {
  static async resolveReferences(configData, basePath) {
    log.info(`Resolving relative JSON reference paths inside configuration. Context directory: ${basePath}`);
    return this.walkAndResolve(configData, basePath, new Set());
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
      const targetPath = path.isAbsolute(node.$ref)
        ? node.$ref
        : path.resolve(basePath, node.$ref);

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