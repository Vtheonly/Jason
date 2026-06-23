import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('overview-builder');

export class OverviewBuilder {
  static generateAgendaRoadmap(slideXmlString, sectionsList) {
    log.info(`Generating agenda roadmap on overview slides. Elements count: ${sectionsList.length}`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(slideXmlString, 'application/xml');

    const shapeNodes = doc.getElementsByTagName('p:sp');
    const shapeTemplate = this.findTemplateShape(shapeNodes);

    if (!shapeTemplate) {
      log.warn('Could not locate a valid placeholder layout card to clone. Standard index compilation skipped.');
      return slideXmlString;
    }

    const parentNode = shapeTemplate.parentNode;
    const boundingSpacingOffset = 800000; // Layout EM metrics

    sectionsList.forEach((section, index) => {
      const clonedCard = shapeTemplate.cloneNode(true);
      
      // Dynamic spacing coordinates translation
      this.translateShapePosition(clonedCard, index * boundingSpacingOffset);
      this.replaceTemplateText(clonedCard, section.title, section.index);

      parentNode.appendChild(clonedCard);
    });

    // Remove the original placeholder card used as a template
    parentNode.removeChild(shapeTemplate);

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  static findTemplateShape(shapeNodes) {
    for (let i = 0; i < shapeNodes.length; i++) {
      const node = shapeNodes[i];
      const descr = node.getElementsByTagName('p:cNvPr')[0]?.getAttribute('descr') || '';
      if (descr.includes('jason_agenda_card_template')) {
        return node;
      }
    }
    return null;
  }

  static translateShapePosition(shapeNode, offsetValue) {
    const offNode = shapeNode.getElementsByTagName('a:off')[0];
    if (offNode) {
      const currentY = parseInt(offNode.getAttribute('y') || '0', 10);
      offNode.setAttribute('y', String(currentY + offsetValue));
    }
  }

  static replaceTemplateText(shapeNode, titleText, slideNum) {
    const textRuns = shapeNode.getElementsByTagName('a:t');
    if (textRuns.length > 0) {
      textRuns[0].textContent = `${slideNum}. ${titleText}`;
    }
  }
}