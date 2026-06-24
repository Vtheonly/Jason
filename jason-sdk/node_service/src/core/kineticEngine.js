import fs from 'fs-extra';
import path from 'path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('kinetic-engine');

/**
 * Node-side native PPTX morph transition pre-processor.
 *
 * Scans slides for shapes whose name/descr match any keyword declared in
 * the transition mapping list and prepends the `!!jason_morph_<id>` tag
 * to those shape names. PowerPoint then animates them with the Morph
 * transition automatically when consecutive slides share the same tag.
 *
 * This mirrors the Python morph_engine for the cases where the Node
 * orchestrator compiles a deck without round-tripping through gRPC.
 */
export async function applyNativeMorphEngine(extractionPath, transitionsManifest) {
  log.info('Applying native morph transition pre-processing on slide XML files.');

  if (!transitionsManifest || !transitionsManifest.mappings) {
    log.info('No transition mappings declared. Skipping morph tagging step.');
    return;
  }

  const mappings = transitionsManifest.mappings;
  if (!Array.isArray(mappings) || mappings.length === 0) {
    log.info('Empty transition mappings list. Skipping morph tagging step.');
    return;
  }

  const slidesDir = path.join(extractionPath, 'ppt/slides');
  if (!(await fs.pathExists(slidesDir))) {
    log.warn(`Slides directory not found inside extraction path: ${slidesDir}`);
    return;
  }

  const files = await fs.readdir(slidesDir);
  const slideFiles = files.filter(f => f.endsWith('.xml')).sort();

  for (const slideFile of slideFiles) {
    const slidePath = path.join(slidesDir, slideFile);
    let rawXml = await fs.readFile(slidePath, 'utf8');

    let modified = false;
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawXml, 'application/xml');

    // cNvPr nodes hold the shape name and descr (alt-text) attributes
    const cNvPrNodes = doc.getElementsByTagName('p:cNvPr');
    for (let i = 0; i < cNvPrNodes.length; i++) {
      const node = cNvPrNodes[i];
      const nameVal = node.getAttribute('name') || '';
      const descrVal = node.getAttribute('descr') || '';

      for (const map of mappings) {
        const keyword = map.keyword;
        const morphId = map.morph_id;
        if (!keyword || !morphId) continue;

        if (nameVal.includes(keyword) || descrVal.includes(keyword)) {
          const morphTag = `!!jason_morph_${morphId}`;
          node.setAttribute('name', morphTag);
          // Preserve original descr (alt-text) for accessibility — only append
          // the morph tag, don't overwrite the description
          node.setAttribute('descr', descrVal ? `${descrVal} ${morphTag}` : morphTag);
          modified = true;
          log.info(`Tagged shape in ${slideFile} with morph id: ${morphId}`);
        }
      }
    }

    if (modified) {
      const serializer = new XMLSerializer();
      await fs.writeFile(slidePath, serializer.serializeToString(doc), 'utf8');
    }
  }

  log.info('Native morph pre-processing completed.');
}
