import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { BraceParser } from './brace_parser.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('loop-iterator');

export class LoopIterator {
  static processLoops(slideXmlString, dataset) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(slideXmlString, 'application/xml');
    
    // Scan matching paragraphs or container runs for loop expressions
    const paragraphNodes = doc.getElementsByTagName('a:p');
    let needsRecompile = false;

    for (let i = 0; i < paragraphNodes.length; i++) {
      const node = paragraphNodes[i];
      const textContent = node.textContent || '';

      if (textContent.includes('{{#each')) {
        const match = textContent.match(/\{\{#each\s+([^\}]+)\}\}/);
        if (match) {
          log.info(`Identified list loop segment targeting path: ${match[1]}`);
          this.executeLoopUnroll(node, match[1], dataset);
          needsRecompile = true;
        }
      }
    }

    if (!needsRecompile) return slideXmlString;

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  static executeLoopUnroll(pNode, arraySelector, dataset) {
    const listItems = BraceParser.extractValueByPath(dataset, arraySelector.trim());
    if (!Array.isArray(listItems) || listItems.length === 0) {
      log.warn(`Loop array selector: "${arraySelector}" yielded zero array elements.`);
      pNode.parentNode.removeChild(pNode);
      return;
    }

    const parent = pNode.parentNode;
    const documentRef = pNode.ownerDocument;

    // Build the template segment bounds
    const templateRows = [];
    let currentSibling = pNode;
    let foundClosing = false;

    while (currentSibling) {
      templateRows.push(currentSibling);
      const textContent = currentSibling.textContent || '';
      if (textContent.includes('{{/each}}')) {
        foundClosing = true;
        break;
      }
      currentSibling = currentSibling.nextSibling;
    }

    if (!foundClosing) {
      log.error(`Loop execution aborted. No matching closing block tag '{{/each}}' found starting at node.`);
      return;
    }

    // Duplicate rows mapped against individual items in target payload
    for (const item of listItems) {
      for (const row of templateRows) {
        const rawRowText = row.textContent || '';
        if (rawRowText.includes('{{#each') || rawRowText.includes('{{/each}}')) {
          continue; // Strip template loop control boundaries from rendering pipeline
        }

        const clonedNode = row.cloneNode(true);
        const serialized = new XMLSerializer().serializeToString(clonedNode);
        
        // Inline brace evaluation inside the duplicated XML block
        const processedXml = BraceParser.parseString(serialized, item);
        const fragment = new DOMParser().parseFromString(processedXml, 'application/xml').documentElement;

        const importedNode = documentRef.importNode(fragment, true);
        parent.insertBefore(importedNode, templateRows[0]);
      }
    }

    // Evict original structural templates
    for (const row of templateRows) {
      parent.removeChild(row);
    }
  }
}