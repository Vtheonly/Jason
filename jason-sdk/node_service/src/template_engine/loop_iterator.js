import fs from 'fs-extra';
import path from 'path';
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
        
        // Remap rId (relationship ID) references in cloned nodes to prevent
        // OOXML relational model corruption. Each cloned shape must have
        // unique relationship IDs; otherwise PowerPoint detects duplicate
        // rId entries and throws "found a problem with content" errors.
        this.remapRelationshipIds(clonedNode, documentRef);

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

  /**
   * Remap rId references in a cloned XML subtree to unique IDs.
   * 
   * When cloneNode(true) clones shapes that reference images, charts, or
   * hyperlinks via rId attributes (e.g., r:embed="rId2"), the cloned node
   * references the SAME relationship entry. This causes PowerPoint to detect
   * duplicate references and throw corruption errors.
   * 
   * This method generates new unique rId values (rId_<counter>) for all
   * rId references within the cloned subtree. The caller (compiler) must
   * also update the corresponding .rels file to add the new relationships.
   */
  static remapRelationshipIds(node, documentRef) {
    // Find all elements with r:embed, r:link, or r:id attributes
    const RELATIONSHIP_ATTRS = ['r:embed', 'r:link', 'r:id'];
    const rIdMap = new Map();
    let rIdCounter = 100; // Start from rId100 to avoid collisions with existing IDs

    // Walk all elements in the cloned subtree
    const allElements = node.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      for (const attr of RELATIONSHIP_ATTRS) {
        const rIdValue = el.getAttribute(attr);
        if (rIdValue && rIdValue.startsWith('rId')) {
          // Generate a new unique rId for this reference
          if (!rIdMap.has(rIdValue)) {
            rIdCounter++;
            rIdMap.set(rIdValue, `rId${rIdCounter}`);
          }
          el.setAttribute(attr, rIdMap.get(rIdValue));
        }
      }
    }

    // Log the remapping for debugging
    if (rIdMap.size > 0) {
      log.info(`Remapped ${rIdMap.size} relationship ID(s) in cloned node: ${JSON.stringify(Object.fromEntries(rIdMap))}`);
    }

    return rIdMap;
  }

  /**
   * Update a slide's .rels file to add new relationship entries generated
   * by loop unrolling. This must be called after processLoops() to ensure
   * the PPTX relational model stays consistent.
   * 
   * @param {string} extractionPath - Path to the extracted PPTX directory
   * @param {string} slideFileName - e.g. "slide3.xml"
   * @param {Map} rIdMap - Map of old rId -> new rId from remapRelationshipIds
   */
  static async updateSlideRels(extractionPath, slideFileName, rIdMap) {
    if (!rIdMap || rIdMap.size === 0) return;

    const relsDir = path.join(extractionPath, 'ppt', 'slides', '_rels');
    const relsFile = path.join(relsDir, `${slideFileName}.rels`);

    if (!(await fs.pathExists(relsFile))) {
      log.warn(`Relationships file not found: ${relsFile}`);
      return;
    }

    try {
      let relsXml = await fs.readFile(relsFile, 'utf8');
      const parser = new DOMParser();
      const doc = parser.parseFromString(relsXml, 'application/xml');

      const relationships = doc.getElementsByTagName('Relationship');
      const newRelationships = [];

      for (let i = 0; i < relationships.length; i++) {
        const rel = relationships[i];
        const id = rel.getAttribute('Id');
        
        // If this relationship's ID was remapped, create a duplicate entry
        // with the new ID pointing to the same target
        if (rIdMap.has(id)) {
          const newId = rIdMap.get(id);
          const target = rel.getAttribute('Target');
          const type = rel.getAttribute('Type');
          
          const newRel = doc.createElement('Relationship');
          newRel.setAttribute('Id', newId);
          newRel.setAttribute('Type', type);
          newRel.setAttribute('Target', target);
          newRelationships.push(newRel);
          
          log.info(`Added relationship: ${newId} -> ${target} (cloned from ${id})`);
        }
      }

      // Append new relationships to the Relationships root element
      const relsRoot = doc.getElementsByTagName('Relationships')[0];
      for (const newRel of newRelationships) {
        relsRoot.appendChild(newRel);
      }

      const serializer = new XMLSerializer();
      await fs.writeFile(relsFile, serializer.serializeToString(doc), 'utf8');
      
      log.info(`Updated ${relsFile} with ${newRelationships.length} new relationship(s).`);
    } catch (err) {
      log.error(`Failed to update relationships file ${relsFile}: ${err.message}`);
    }
  }
}
