import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('config-merger');

export class ConfigMerger {
  static merge(configs) {
    if (!configs || configs.length === 0) {
      log.warn('No configurations provided to merge. Returning default empty model.');
      return { slides: [] };
    }

    log.info(`Initiating configuration merge operations across ${configs.length} source payloads.`);
    const baseConfig = {
      export_format: 'pptx',
      theme: {},
      transitions: { mappings: [], global_video_settings: {} },
      slides: []
    };

    for (const config of configs) {
      if (config.export_format) {
        baseConfig.export_format = config.export_format;
      }

      // Merge Theme settings (last-write-wins at properties level)
      if (config.theme) {
        baseConfig.theme = {
          ...baseConfig.theme,
          ...config.theme
        };
      }

      // Merge Transitions mappings and settings
      if (config.transitions) {
        const mappings = config.transitions.mappings || [];
        baseConfig.transitions.mappings = [
          ...baseConfig.transitions.mappings,
          ...mappings
        ];
        
        if (config.transitions.global_video_settings) {
          baseConfig.transitions.global_video_settings = {
            ...baseConfig.transitions.global_video_settings,
            ...config.transitions.global_video_settings
          };
        }
      }

      // Merge Slides (override by slide_index matches or append)
      if (config.slides && Array.isArray(config.slides)) {
        for (const targetSlide of config.slides) {
          const matchingIndex = baseConfig.slides.findIndex(
            s => s.slide_index !== undefined && s.slide_index === targetSlide.slide_index
          );

          if (matchingIndex !== -1) {
            log.info(`Slide collision detected at index ${targetSlide.slide_index}. Overlaying properties.`);
            baseConfig.slides[matchingIndex] = this.deepMergeObjects(
              baseConfig.slides[matchingIndex],
              targetSlide
            );
          } else {
            baseConfig.slides.push(targetSlide);
          }
        }
      }
    }

    // Retain clean numeric sort sequence on resulting slides
    baseConfig.slides.sort((a, b) => {
      const idxA = a.slide_index ?? Infinity;
      const idxB = b.slide_index ?? Infinity;
      return idxA - idxB;
    });

    log.info(`Configuration merge completed successfully. Resulting slides count: ${baseConfig.slides.length}`);
    return baseConfig;
  }

  static deepMergeObjects(target, source) {
    const output = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        output[key] = { ...target[key], ...source[key] };
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }
}