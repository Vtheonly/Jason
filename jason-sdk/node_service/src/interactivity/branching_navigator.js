import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('branching-navigator');

export class BranchingNavigator {
  static configureDecisionBranches(slideXmlString, branchOptions, relationshipIdMap) {
    log.info(`Configuring dynamic branching decision flows. Registered options: ${branchOptions?.length}`);
    if (!branchOptions || branchOptions.length === 0) return slideXmlString;

    const parser = new DOMParser();
    const doc = parser.parseFromString(slideXmlString, 'application/xml');
    const shapeNodes = doc.getElementsByTagName('p:sp');

    branchOptions.forEach((option) => {
      const targetShape = this.findMatchingBranchShape(shapeNodes, option.button_keyword);
      if (targetShape) {
        log.info(`Target shape found for branching path [${option.button_keyword}] -> Slide [${option.destination_slide_id}]`);
        this.applyBranchLink(targetShape, option.destination_slide_id, relationshipIdMap);
      } else {
        log.warn(`Branch shape with description matching keyword [${option.button_keyword}] not found.`);
      }
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  static findMatchingBranchShape(shapeNodes, keyword) {
    for (let i = 0; i < shapeNodes.length; i++) {
      const node = shapeNodes[i];
      const descr = node.getElementsByTagName('p:cNvPr')[0]?.getAttribute('descr') || '';
      if (descr.toLowerCase().includes(keyword.toLowerCase())) {
        return node;
      }
    }
    return null;
  }

  static applyBranchLink(shapeNode, destSlideId, relationshipIdMap) {
    const rId = relationshipIdMap[destSlideId];
    if (!rId) {
      log.warn(`No relationship reference ID map resolved for branch slide: ${destSlideId}`);
      return;
    }

    const docRef = shapeNode.ownerDocument;
    const actionNode = docRef.createElement('a:hlinkClick');
    actionNode.setAttribute('r:id', rId);
    actionNode.setAttribute('action', 'ppaction://hlinkslide');

    // Attach actions directly to dynamic click shapes properties (nonVisualShapeProperties -> cNvPr)
    const cNvPr = shapeNode.getElementsByTagName('p:cNvPr')[0];
    if (cNvPr) {
      cNvPr.appendChild(actionNode);
    }
  }
}