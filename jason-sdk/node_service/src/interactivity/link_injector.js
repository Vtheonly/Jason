import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('link-injector');

export class LinkInjector {
  static createSlideHyperlink(runXmlString, targetSlideId, relationshipIdMap) {
    if (!targetSlideId) return runXmlString;

    log.info(`Configuring dynamic slide hyperlink targets. Destination ID: ${targetSlideId}`);
    
    // Resolve slide relationship identifier maps
    const rId = relationshipIdMap[targetSlideId];
    if (!rId) {
      log.warn(`Unable to map target slide path reference to relationship ID: ${targetSlideId}`);
      return runXmlString;
    }

    const actionMarkup = `<a:hlinkClick r:id="${rId}" action="ppaction://hlinkslide"/>`;

    // Regex to match slide run properties
    const rPrRegex = /<\/a:rPr>/;
    if (runXmlString.match(rPrRegex)) {
      return runXmlString.replace(rPrRegex, `${actionMarkup}</a:rPr>`);
    }

    // Create rPr wrapper if none exists on current elements
    const runTextOpenRegex = /<a:t>/;
    return runXmlString.replace(runTextOpenRegex, `<a:rPr>${actionMarkup}</a:rPr><a:t>`);
  }
}