import fs from 'fs-extra';
import path from 'path';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('missing-asset-checker');

export class MissingAssetChecker {
  static async auditAssetDependencies(configPayload, assetsDirectoryPath) {
    log.info('Auditing local asset requirements from incoming presentation definitions.');
    const missingAssets = [];

    if (!configPayload.slides) return missingAssets;

    for (const [idx, slide] of configPayload.slides.entries()) {
      // Traverse Markdown contents looking for inline local image matches: ![alt](path)
      if (slide.markdown_body) {
        const imageMatches = slide.markdown_body.matchAll(/!\[.*?\]\((.*?)\)/g);
        for (const match of imageMatches) {
          const imageRelativePath = match[1];
          if (!this.isValidUrl(imageRelativePath)) {
            const absolutePath = path.isAbsolute(imageRelativePath)
              ? imageRelativePath
              : path.resolve(assetsDirectoryPath || '.', imageRelativePath);

            const fileExists = await fs.pathExists(absolutePath);
            if (!fileExists) {
              missingAssets.push({
                slide_index: slide.slide_index ?? idx,
                asset_type: 'IMAGE',
                declared_path: imageRelativePath,
                resolved_path: absolutePath
              });
            }
          }
        }
      }
    }

    if (missingAssets.length > 0) {
      log.warn(`Dependencies checklist warning: identified ${missingAssets.length} missing layout assets.`);
    } else {
      log.info('Asset checklist processed successfully. All paths are valid.');
    }

    return missingAssets;
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;  
    }
  }
}