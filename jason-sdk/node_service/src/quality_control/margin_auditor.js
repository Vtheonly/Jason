import { PRESENTATION_DIMENSIONS } from '../config/constants.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('margin-auditor');

export class MarginAuditor {
  static verifyBoundaryOverlap(positionX, positionY, elementWidth, elementHeight, ratio = '16_9') {
    log.info('Running slide bounding-box safety alignment audits.');
    
    const presentationBounds = ratio === '16_9' 
      ? PRESENTATION_DIMENSIONS.RATIO_16_9 
      : PRESENTATION_DIMENSIONS.RATIO_4_3;

    const safetyThresholdInches = 0.5; // Minimal margin safety boundary requirements
    const safetyThresholdEmu = safetyThresholdInches * 914400; // Inches to EMU scale transformations

    const maxWidth = presentationBounds.width_emu;
    const maxHeight = presentationBounds.height_emu;

    const errors = [];

    // Right and Bottom boundary overlap checking
    if (positionX + elementWidth > maxWidth - safetyThresholdEmu) {
      errors.push({
        type: 'HORIZONTAL_OVERLAP',
        message: 'Visual element exceeds presentation safety right-side limits.'
      });
    }

    if (positionY + elementHeight > maxHeight - safetyThresholdEmu) {
      errors.push({
        type: 'VERTICAL_OVERLAP',
        message: 'Visual element exceeds presentation safety bottom-side limits.'
      });
    }

    // Left and Top boundary overlap checking
    if (positionX < safetyThresholdEmu) {
      errors.push({
        type: 'LEFT_MARGIN_VIOLATION',
        message: 'Visual element exceeds left margin boundaries.'
      });
    }

    if (positionY < safetyThresholdEmu) {
      errors.push({
        type: 'TOP_MARGIN_VIOLATION',
        message: 'Visual element exceeds top margin boundaries.'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}