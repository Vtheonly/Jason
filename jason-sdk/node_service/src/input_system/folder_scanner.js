import fs from 'fs-extra';
import path from 'path';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('folder-scanner');

export class FolderScanner {
  static async scan(inputPath) {
    try {
      const stats = await fs.stat(inputPath);
      
      if (stats.isFile()) {
        if (!inputPath.endsWith('.json')) {
          throw new Error(`The provided target file is not a JSON document: ${inputPath}`);
        }
        log.info(`Single file scan targeted: ${inputPath}`);
        const singleContent = await fs.readJson(inputPath);
        return [singleContent];
      }

      if (stats.isDirectory()) {
        log.info(`Target directory scan started on path: ${inputPath}`);
        const items = await fs.readdir(inputPath);
        const jsonFiles = items
          .filter(file => file.endsWith('.json'))
          .sort() // Ensure predictable ordering of merge operations
          .map(file => path.join(inputPath, file));

        if (jsonFiles.length === 0) {
          log.warn(`No JSON elements detected within directory: ${inputPath}`);
          return [];
        }

        const collectedConfigs = [];
        for (const filePath of jsonFiles) {
          log.info(`Reading manifest element: ${path.basename(filePath)}`);
          const fileJson = await fs.readJson(filePath);
          collectedConfigs.push(fileJson);
        }

        return collectedConfigs;
      }

      throw new Error(`Unsupported path type targeting: ${inputPath}`);
    } catch (err) {
      log.error(`Scan execution context broken on input path: ${inputPath}`, err);
      throw err;
    }
  }
}