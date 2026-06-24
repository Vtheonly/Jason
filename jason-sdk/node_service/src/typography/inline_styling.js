import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('inline-styling');

export class InlineStyling {
  /**
   * Apply text run styling properties to an <a:r> XML element.
   * 
   * IMPORTANT: This method must NOT use destructive string replacement that
   * could corrupt surrounding XML structure. Instead, it carefully targets
   * only the <a:rPr> element within the run, preserving all other formatting.
   * 
   * @param {string} runXmlString - The XML string for a single <a:r> run
   * @param {Object} runStyles - Style flags: { bold, italic, underline, strike }
   * @returns {string} Modified XML string with styling applied
   */
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

  /**
   * Safely add or update a property on the <a:rPr> element.
   * 
   * This method carefully manipulates the <a:rPr> run properties element
   * without destroying existing formatting attributes. It uses precise regex
   * matching to find only the first <a:rPr> tag within the run and adds the
   * specified property as an attribute.
   * 
   * @param {string} xml - The XML string for a single <a:r> run
   * @param {string} tag - The OOXML attribute name (e.g., 'b', 'i', 'u')
   * @param {string} val - The attribute value (e.g., '1', 'sng')
   * @returns {string} Modified XML string
   */
  static ensureXmlProperty(xml, tag, val) {
    // Strategy 1: Look for an existing <a:rPr> opening tag and add attribute
    // We match the FIRST <a:rPr only (within this run), to avoid cross-run corruption
    const propertyBlockRegex = /<a:rPr([^>]*)>/;
    const match = xml.match(propertyBlockRegex);

    if (match) {
      const attributes = match[1];
      // Check if the attribute already exists (don't overwrite existing values)
      if (attributes.includes(` ${tag}=`)) {
        return xml; // Attribute already exists, return unchanged
      }
      
      // Add the new attribute to the existing <a:rPr> tag
      const newTag = `<a:rPr${attributes} ${tag}="${val}">`;
      // Replace only the FIRST occurrence to avoid corrupting multiple runs
      return xml.replace(propertyBlockRegex, newTag);
    }

    // Strategy 2: No <a:rPr> exists — create one inside the <a:r> element.
    // We insert <a:rPr .../> immediately after the <a:r> opening tag, but
    // ONLY if there is no existing <a:rPr> anywhere in the string (checked above).
    // This ensures we don't accidentally insert into nested content.
    const cleanRunOpenTagRegex = /(<a:r>)(?!.*<a:rPr)/;
    if (cleanRunOpenTagRegex.test(xml)) {
      const constructedPropertyBlock = `$1<a:rPr ${tag}="${val}"/>`;
      return xml.replace(cleanRunOpenTagRegex, constructedPropertyBlock);
    }

    // Fallback: If we can't find a safe insertion point, log a warning
    // and return the XML unchanged rather than risking corruption.
    log.warn(`Could not find safe insertion point for property "${tag}" in run XML. Skipping to avoid corruption.`);
    return xml;
  }
}
