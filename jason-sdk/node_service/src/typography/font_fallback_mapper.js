import { TYPOGRAPHY_DEFAULTS } from '../config/constants.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('font-fallback-mapper');

export class FontFallbackMapper {
  static mapSystemFontPairing(xmlString, platform = 'universal') {
    log.info(`Applying matching OS fallback typography mappings. Target: ${platform}`);
    let updatedXml = xmlString;

    const fontMap = {
      windows: { heading: 'Segoe UI', body: 'Calibri' },
      macos: { heading: 'Helvetica Neue', body: 'Helvetica' },
      linux: { heading: 'Liberation Sans', body: 'Liberation Sans' },
      universal: { heading: TYPOGRAPHY_DEFAULTS.HEADING_FONT, body: TYPOGRAPHY_DEFAULTS.BODY_FONT }
    };

    const activeSettings = fontMap[platform] || fontMap.universal;

    // Regex to match and replace font properties inside presentation structures
    const latinFontRegex = /<a:latin\s+typeface="([^"]*)"([^>]*)\/>/g;
    const eaFontRegex = /<a:ea\s+typeface="([^"]*)"([^>]*)\/>/g;

    updatedXml = updatedXml.replace(latinFontRegex, (match, typeface, rest) => {
      const cleanTypeface = typeface.toLowerCase();
      const fontSelection = (cleanTypeface.includes('title') || cleanTypeface.includes('head'))
        ? activeSettings.heading
        : activeSettings.body;
      return `<a:latin typeface="${fontSelection}"${rest}/>`;
    });

    updatedXml = updatedXml.replace(eaFontRegex, (match, typeface, rest) => {
      const cleanTypeface = typeface.toLowerCase();
      const fontSelection = (cleanTypeface.includes('title') || cleanTypeface.includes('head'))
        ? activeSettings.heading
        : activeSettings.body;
      return `<a:ea typeface="${fontSelection}"${rest}/>`;
    });

    return updatedXml;
  }
}