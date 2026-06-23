import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { BraceParser } from './brace_parser.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('conditional-evaluator');

export class ConditionalEvaluator {
  static processConditions(slideXmlString, dataset) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(slideXmlString, 'application/xml');
    
    const paragraphs = doc.getElementsByTagName('a:p');
    let elementsModified = false;

    for (let i = 0; i < paragraphs.length; i++) {
      const pNode = paragraphs[i];
      const textContent = pNode.textContent || '';

      if (textContent.includes('{{#if')) {
        const ifMatch = textContent.match(/\{\{#if\s+([^\}]+)\}\}/);
        if (ifMatch) {
          log.info(`Evaluating runtime layout conditional block expression: ${ifMatch[1]}`);
          this.executeConditionPruning(pNode, ifMatch[1], dataset);
          elementsModified = true;
        }
      }
    }

    if (!elementsModified) return slideXmlString;

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  static executeConditionPruning(pNode, conditionalExpression, dataset) {
    const parent = pNode.parentNode;
    const targets = [];
    let current = pNode;
    let closingFound = false;

    while (current) {
      targets.push(current);
      const text = current.textContent || '';
      if (text.includes('{{/if}}')) {
        closingFound = true;
        break;
      }
      current = current.nextSibling;
    }

    if (!closingFound) {
      log.error(`Conditional block evaluation missing structural closing '{{/if}}' tag.`);
      return;
    }

    const evaluationResult = this.evaluateSimpleCondition(conditionalExpression, dataset);

    if (evaluationResult) {
      // Retain visual tags inside parameters - prune container boundary identifiers
      for (const node of targets) {
        const text = node.textContent || '';
        if (text.includes('{{#if') || text.includes('{{/if}}')) {
          parent.removeChild(node);
        }
      }
    } else {
      // Invalidate the entire layout block
      for (const node of targets) {
        parent.removeChild(node);
      }
    }
  }

  static evaluateSimpleCondition(expressionStr, dataset) {
    const cleanExpression = expressionStr.trim();
    
    // Check for logical absolute inequality comparison structures
    if (cleanExpression.includes('===')) {
      const parts = cleanExpression.split('===').map(p => p.trim());
      const leftVal = BraceParser.extractValueByPath(dataset, parts[0]);
      const rightVal = parts[1].replace(/['"]/g, '');
      return String(leftVal) === String(rightVal);
    }

    // Direct boolean check mapping
    const value = BraceParser.extractValueByPath(dataset, cleanExpression);
    return !!value;
  }
}