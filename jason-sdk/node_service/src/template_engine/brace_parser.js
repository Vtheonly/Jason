import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { PipelineFilters } from './pipeline_filters.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('brace-parser');

export class BraceParser {
  static evaluateExpression(expression, dataset) {
    const trimmed = expression.trim();

    // Check for inline pipe transforms
    if (trimmed.includes('|')) {
      const pipeSegments = trimmed.split('|').map(segment => segment.trim());
      const dataSelector = pipeSegments[0];
      const operations = pipeSegments.slice(1);

      let workingValue = this.extractValueByPath(dataset, dataSelector);

      for (const op of operations) {
        const filterNameMatch = op.match(/^([^(]+)/);
        if (!filterNameMatch) continue;
        
        const filterName = filterNameMatch[1].trim();
        const argsMatch = op.match(/\(([^)]+)\)/);
        const args = argsMatch 
          ? argsMatch[1].split(',').map(arg => arg.trim().replace(/['"]/g, ''))
          : [];

        workingValue = PipelineFilters.apply(workingValue, filterName, args);
      }

      return workingValue !== undefined ? String(workingValue) : '';
    }

    const value = this.extractValueByPath(dataset, trimmed);
    return value !== undefined ? String(value) : '';
  }

  static extractValueByPath(obj, dotPath) {
    if (!obj || !dotPath) return undefined;
    if (dotPath === '.') return obj; // Self reference path accessor

    return dotPath.split('.').reduce((accumulator, segment) => {
      if (accumulator === null || accumulator === undefined) return undefined;
      return accumulator[segment];
    }, obj);
  }

  /**
   * Parse and replace {{placeholder}} expressions in XML content.
   * 
   * IMPORTANT: PowerPoint frequently splits text across multiple <a:r> (run)
   * elements within a single <a:p> (paragraph). For example, a placeholder
   * like {{title}} might be split as:
   *   <a:r><a:t>{{ti</a:t></a:r><a:r><a:t>tle}}</a:t></a:r>
   * 
   * A naive regex approach would miss these split placeholders. This method
   * uses a DOM-aware approach that:
   * 1. Merges consecutive text runs within each paragraph
   * 2. Performs placeholder replacement on the merged text
   * 3. Writes the result back as a single text run
   */
  static parseString(xmlString, dataset) {
    if (!xmlString) return '';

    // First, try the fast regex path for simple cases where placeholders
    // are NOT split across runs. If we find and replace all placeholders
    // this way, we're done.
    const quickResult = xmlString.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        return this.evaluateExpression(expression, dataset);
      } catch (err) {
        log.warn(`Evaluation failure on template expression placeholder: ${expression}. Error: ${err.message}`);
        return match;
      }
    });

    // If quick path found matches (result differs from input), return it
    if (quickResult !== xmlString) {
      return quickResult;
    }

    // If no simple matches found, check if there are split placeholders
    // by looking for partial brace patterns that suggest cross-run splits
    if (!xmlString.includes('{{') && !xmlString.includes('}}')) {
      return xmlString; // No placeholders at all
    }

    // Use DOM-based approach for cross-run placeholder resolution
    try {
      return this.parseXmlWithDom(xmlString, dataset);
    } catch (domErr) {
      log.warn(`DOM-based parsing failed, falling back to raw string: ${domErr.message}`);
      // Fallback: return the original string (placeholders remain unreplaced)
      return xmlString;
    }
  }

  /**
   * DOM-aware placeholder replacement that handles text split across
   * multiple <a:r> runs within the same <a:p> paragraph.
   */
  static parseXmlWithDom(xmlString, dataset) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    const paragraphs = doc.getElementsByTagName('a:p');
    let modified = false;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const runs = para.getElementsByTagName('a:r');
      
      if (runs.length === 0) continue;

      // Collect all text content from runs in this paragraph
      let combinedText = '';
      const runTextNodes = [];

      for (let j = 0; j < runs.length; j++) {
        const tNodes = runs[j].getElementsByTagName('a:t');
        for (let k = 0; k < tNodes.length; k++) {
          combinedText += tNodes[k].textContent || '';
          runTextNodes.push(tNodes[k]);
        }
      }

      // Check if combined text contains placeholders
      if (!combinedText.includes('{{') || !combinedText.includes('}}')) {
        continue;
      }

      // Replace placeholders in the combined text
      const replacedText = combinedText.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
        try {
          return this.evaluateExpression(expression, dataset);
        } catch (err) {
          log.warn(`Evaluation failure on template expression placeholder: ${expression}. Error: ${err.message}`);
          return match;
        }
      });

      if (replacedText !== combinedText) {
        // Placeholders were found and replaced. Write the entire replaced
        // text into the first <a:t> node and clear the rest.
        if (runTextNodes.length > 0) {
          runTextNodes[0].textContent = replacedText;
          // Clear remaining text nodes
          for (let j = 1; j < runTextNodes.length; j++) {
            runTextNodes[j].textContent = '';
          }
          modified = true;
        }
      }
    }

    if (!modified) {
      return xmlString;
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }
}
