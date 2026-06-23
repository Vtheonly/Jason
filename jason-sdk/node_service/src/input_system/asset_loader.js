import fs from 'fs-extra';
import path from 'path';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('asset-loader');

export class AssetLoader {
  static async verifyAndLoadAssets(assetsFolder, localConfig) {
    log.info(`Initiating visual and media assets verification inside path: ${assetsFolder}`);
    
    if (!(await fs.pathExists(assetsFolder))) {
      log.warn(`Assets folder target was not found: ${assetsFolder}. Processing fallback assets.`);
      return;
    }

    // Compile assets registry matching types
    const files = await fs.readdir(assetsFolder);
    log.info(`Discovered ${files.length} candidate file blocks within assets folder.`);

    const assetsMap = {
      images: [],
      videos: [],
      audio: [],
      fonts: []
    };

    for (const file of files) {
      const fullPath = path.join(assetsFolder, file);
      const ext = path.extname(file).toLowerCase();
      const stats = await fs.stat(fullPath);

      if (!stats.isFile()) continue;

      if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
        assetsMap.images.push(fullPath);
      } else if (['.mp4', '.mov', '.avi'].includes(ext)) {
        assetsMap.videos.push(fullPath);
      } else if (['.mp3', '.wav', '.aac'].includes(ext)) {
        assetsMap.audio.push(fullPath);
      } else if (['.ttf', '.otf', '.woff'].includes(ext)) {
        assetsMap.fonts.push(fullPath);
      }
    }

    log.info(`Mapped resources summary: Images=${assetsMap.images.length}, Videos=${assetsMap.videos.length}, Audio=${assetsMap.audio.length}, Fonts=${assetsMap.fonts.length}`);
    return assetsMap;
  }
}