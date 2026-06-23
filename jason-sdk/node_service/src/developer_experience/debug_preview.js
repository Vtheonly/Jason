import { createScopedLogger } from './logger.js';

const log = createScopedLogger('debug-preview');

export class DebugPreview {
  static renderConsoleOutline(configData) {
    log.info('Compiling debugging dry-run outline on console.');
    if (!configData || !configData.slides) {
      console.log('--- Empty Presentation Config ---');
      return;
    }

    console.log('\n================================================================');
    console.log(`      JASON presentation dry-run outline compilation`);
    console.log(`      Export target: ${configData.export_format || 'pptx'}`);
    console.log('================================================================');

    configData.slides.forEach((slide, idx) => {
      console.log(`\nSlide [Index: ${slide.slide_index ?? idx}] | Title: "${slide.title}"`);
      if (slide.layout) console.log(`  └─ Layout Blueprint: ${slide.layout}`);
      if (slide.bullets && slide.bullets.length > 0) {
        console.log('  └─ Rich bullets:');
        slide.bullets.forEach(bullet => console.log(`      • ${bullet}`));
      }
      if (slide.charts && slide.charts.length > 0) {
        console.log('  └─ Bound Charts:');
        slide.charts.forEach(c => console.log(`      [Chart index: ${c.chart_index}, Type: ${c.chart_type}, Series count: ${c.dataset.length}]`));
      }
      if (slide.diagrams && slide.diagrams.length > 0) {
        console.log('  └─ Dynamic Diagrams:');
        slide.diagrams.forEach(d => console.log(`      [Diagram type: ${d.diagram_type}, Nodes count: ${d.nodes?.length}]`));
      }
    });

    console.log('\n======================== End of Outline ========================\n');
  }
}