import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('bullet-formatter');

export class BulletFormatter {
  static configureParagraphBullet(paragraphXmlString, nestingLevel = 0, bulletCharacter = '•') {
    log.info(`Formatting slide layout lists indentation level. Indentation depth set to: ${nestingLevel}`);
    let modifiedXml = paragraphXmlString;

    // Regex to match paragraph formatting parameters
    const pPrRegex = /<a:pPr([^>]*)>/;
    const match = modifiedXml.match(pPrRegex);

    const levelAttr = `lvl="${nestingLevel}"`;
    const indentAttr = `marL="${(nestingLevel + 1) * 342900}"`; // EMU scale offset metrics

    if (match) {
      let attributes = match[1];
      if (!attributes.includes('lvl=')) {
        attributes += ` ${levelAttr}`;
      }
      if (!attributes.includes('marL=')) {
        attributes += ` ${indentAttr}`;
      }

      const updatedTag = `<a:pPr${attributes}>`;
      modifiedXml = modifiedXml.replace(pPrRegex, updatedTag);
    } else {
      // If no paragraph properties exist, create properties with level and indentation rules
      const pOpenRegex = /<a:p>/;
      const injectedBlock = `<a:p><a:pPr ${levelAttr} ${indentAttr}/>`;
      modifiedXml = modifiedXml.replace(pOpenRegex, injectedBlock);
    }

    // Inject customized vector bullet character markers
    modifiedXml = this.injectBulletCharacter(modifiedXml, bulletCharacter);
    return modifiedXml;
  }

  static injectBulletCharacter(xml, character) {
    const bulletContainerRegex = /<a:buChar([^>]*)>/;
    const charValueAttr = `char="${character}"`;

    if (xml.match(bulletContainerRegex)) {
      return xml.replace(/<a:buChar([^>]*)>/, `<a:buChar ${charValueAttr}/>`);
    }

    // Add buChar node inside pPr node to override standard bullet settings
    const pPrCloseRegex = /<\/a:pPr>/;
    const insertedCharacterNode = `<a:buChar ${charValueAttr}/></a:pPr>`;
    return xml.replace(pPrCloseRegex, insertedCharacterNode);
  }
}