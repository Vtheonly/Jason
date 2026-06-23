import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('pipeline-filters');

export class PipelineFilters {
  static apply(value, filterName, args = []) {
    try {
      switch (filterName) {
        case 'uppercase':
          return String(value).toUpperCase();

        case 'lowercase':
          return String(value).toLowerCase();

        case 'truncate': {
          const limit = args[0] ? parseInt(args[0], 10) : 50;
          const suffix = args[1] || '...';
          const str = String(value);
          return str.length > limit ? str.substring(0, limit) + suffix : str;
        }

        case 'formatCurrency': {
          const currencyCode = args[0] || 'USD';
          const rateValue = Number(value);
          if (isNaN(rateValue)) return value;
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(rateValue);
        }

        case 'formatDate': {
          const rawDate = new Date(value);
          if (isNaN(rawDate.getTime())) return value;
          const formatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
          return rawDate.toLocaleDateString('en-US', formatOptions);
        }

        case 'multiply': {
          const multiplier = Number(args[0]) || 1;
          const original = Number(value);
          if (isNaN(original)) return value;
          return original * multiplier;
        }

        case 'round': {
          const decimals = args[0] ? parseInt(args[0], 10) : 0;
          const original = Number(value);
          if (isNaN(original)) return value;
          return original.toFixed(decimals);
        }

        default:
          log.warn(`Formatting pipe request targeted an undefined filter execution: ${filterName}`);
          return value;
      }
    } catch (err) {
      log.error(`Filter calculation step crashed. Target: ${filterName}, Input: ${value}`, err);
      return value;
    }
  }
}