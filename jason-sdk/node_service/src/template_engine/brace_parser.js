import { createScopedLogger } from '../developer_experience/logger.js';
import { PipelineFilters } from './pipeline_filters.js';

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

  static parseString(templateString, dataset) {
    if (!templateString) return '';
    return templateString.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        return this.evaluateExpression(expression, dataset);
      } catch (err) {
        log.warn(`Evaluation failure on template expression placeholder: ${expression}. Error: ${err.message}`);
        return match; // Safe fallback: return unmodified brace segment
      }
    });
  }
}