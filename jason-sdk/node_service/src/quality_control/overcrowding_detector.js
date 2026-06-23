import { LIMITS } from '../config/constants.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('overcrowding-detector');

export class OvercrowdingDetector {
  static auditOvercrowding(configPayload) {
    log.info('Running slide word-density safety compliance checks.');
    const violations = [];

    configPayload.slides.forEach((slide, idx) => {
      let wordCount = 0;
      
      if (slide.title) wordCount += slide.title.split(/\s+/).length;
      if (slide.subtitle) wordCount += slide.subtitle.split(/\s+/).length;
      if (slide.markdown_body) wordCount += slide.markdown_body.split(/\s+/).length;

      if (slide.bullets && Array.isArray(slide.bullets)) {
        if (slide.bullets.length > LIMITS.MAX_BULLETS_PER_SLIDE) {
          violations.push({
            slide_index: slide.slide_index ?? idx,
            rule: 'MAX_BULLETS_LIMIT',
            message: `Slide contains ${slide.bullets.length} bullets, exceeding safety limit thresholds of ${LIMITS.MAX_BULLETS_PER_SLIDE}.`
          });
        }
        
        slide.bullets.forEach(bullet => {
          wordCount += bullet.split(/\s+/).length;
        });
      }

      if (wordCount > LIMITS.OVERCROWD_WORD_THRESHOLD) {
        violations.push({
          slide_index: slide.slide_index ?? idx,
          rule: 'OVERCROWDED_TEXT',
          message: `Slide contains approximately ${wordCount} words. High density lowers legibility. Consider splitting contents.`
        });
      }
    });

    if (violations.length > 0) {
      log.warn(`Word density rules scanner identified ${violations.length} layout warning points.`);
    } else {
      log.info('All slides successfully cleared word density safety audits.');
    }

    return violations;
  }
}