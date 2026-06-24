import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('markdown-parser');

export class MarkdownParser {
  static parseInlineToRuns(text) {
    if (!text) return [];

    log.info('Converting Markdown elements to formatted text runs.');
    const runs = [];
    const combinedTokens = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`|__.*?__|_.*?_)/g;
    
    let lastIndex = 0;
    let match;

    while ((match = combinedTokens.exec(text)) !== null) {
      const matchIndex = match.index;

      // Unformatted plain-text runs before current styled match
      if (matchIndex > lastIndex) {
        runs.push({
          text: text.substring(lastIndex, matchIndex),
          styles: { bold: false, italic: false, code: false }
        });
      }

      const tokenValue = match[0];

      if (tokenValue.startsWith('***')) {
        runs.push({
          text: tokenValue.slice(3, -3),
          styles: { bold: true, italic: true, code: false }
        });
      } else if (tokenValue.startsWith('**')) {
        runs.push({
          text: tokenValue.slice(2, -2),
          styles: { bold: true, italic: false, code: false }
        });
      } else if (tokenValue.startsWith('*')) {
        runs.push({
          text: tokenValue.slice(1, -1),
          styles: { bold: false, italic: true, code: false }
        });
      } else if (tokenValue.startsWith('`')) {
        runs.push({
          text: tokenValue.slice(1, -1),
          styles: { bold: false, italic: false, code: true }
        });
      } else if (tokenValue.startsWith('__')) {
        runs.push({
          text: tokenValue.slice(2, -2),
          styles: { bold: true, italic: false, code: false }
        });
      } else if (tokenValue.startsWith('_')) {
        runs.push({
          text: tokenValue.slice(1, -1),
          styles: { bold: false, italic: true, code: false }
        });
      }

      lastIndex = combinedTokens.lastIndex;
    }

    // Append trailing unstyled plain-text elements
    if (lastIndex < text.length) {
      runs.push({
        text: text.substring(lastIndex),
        styles: { bold: false, italic: false, code: false }
      });
    }

    return runs;
  }
}