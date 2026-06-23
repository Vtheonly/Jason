import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('contrast-checker');

export class ContrastChecker {
  static evaluateHexContrast(hexForeground, hexBackground) {
    log.info(`Evaluating background legibility contrast levels. FG: ${hexForeground}, BG: ${hexBackground}`);
    
    const fgLuminance = this.calculateRelativeLuminance(hexForeground);
    const bgLuminance = this.calculateRelativeLuminance(hexBackground);

    const brightest = Math.max(fgLuminance, bgLuminance);
    const darkest = Math.min(fgLuminance, bgLuminance);

    const contrastRatio = (brightest + 0.05) / (darkest + 0.05);
    log.info(`Calculated relative contrast score: ${contrastRatio.toFixed(2)}:1`);

    // WCAG AAA guidelines recommend 4.5:1 ratio targets for bold header items
    return {
      ratio: contrastRatio,
      pass: contrastRatio >= 4.5
    };
  }

  static calculateRelativeLuminance(hexColor) {
    const cleanHex = hexColor.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const transform = (val) => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
  }
}