import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('inline-styling');

export class InlineStyling {
  static applyTextRunStyle(runXmlString, runStyles) {
    if (!runStyles) return runXmlString;

    log.info('Injecting formatting properties onto PPTX run XML structures.');
    let updatedXml = runXmlString;

    // Check formatting flags and modify target XML run blocks
    if (runStyles.bold) {
      updatedXml = this.ensureXmlProperty(updatedXml, 'b', '1');
    }
    if (runStyles.italic) {
      updatedXml = this.ensureXmlProperty(updatedXml, 'i', '1');
    }
    if (runStyles.underline) {
      updatedXml = this.ensureXmlProperty(updatedXml, 'u', 'sng');
    }
    if (runStyles.strike) {
      updatedXml = this.ensureXmlProperty(updatedXml, 'strike', 'sngStrike');
    }

    return updatedXml;
  }

  static ensureXmlProperty(xml, tag, val) {
    const propertyBlockRegex = /<a:rPr([^>]*)>/;
    const match = xml.match(propertyBlockRegex);

    if (match) {
      const attributes = match[1];
      if (attributes.includes(` ${tag}=`)) {
        return xml; // Attribute already exists, return unchanged
      }
      
      const newTag = `<a:rPr${attributes} ${tag}="${val}">`;
      return xml.replace(propertyBlockRegex, newTag);
    }

    // If no run properties block (rPr) exists, create one with the target formatting property
    const cleanRunOpenTagRegex = /<a:r>/;
    const constructedPropertyBlock = `<a:r><a:rPr ${tag}="${val}"/>`;
    return xml.replace(cleanRunOpenTagRegex, constructedPropertyBlock);
  }
}