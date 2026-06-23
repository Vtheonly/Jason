import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('args-parser');

export class ArgsParser {
  static parse(argv) {
    log.info('Parsing terminal execution parameters.');
    const args = argv.slice(2);
    const parsed = {
      input: null,
      template: null,
      output: 'output.pptx',
      debug: false,
      assets: null
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--input' || arg === '-i') {
        parsed.input = args[++i];
      } else if (arg === '--template' || arg === '-t') {
        parsed.template = args[++i];
      } else if (arg === '--output' || arg === '-o') {
        parsed.output = args[++i];
      } else if (arg === '--assets' || arg === '-a') {
        parsed.assets = args[++i];
      } else if (arg === '--debug' || arg === '-d') {
        parsed.debug = true;
      } else if (arg === '--help' || arg === '-h') {
        this.printUsage();
        process.exit(0);
      } else {
        log.warn(`Unidentified option variable passed to CLI compiler: ${arg}`);
      }
    }

    if (!parsed.input || !parsed.template) {
      log.error('Missing required arguments: both --input and --template parameters must be set.');
      this.printUsage();
      process.exit(1);
    }

    return parsed;
  }

  static printUsage() {
    console.log(`
========================================================================
     JASON SDK - Highly Modular Presentation Generator CLI Tool
========================================================================

Usage:
  npm run cli -- -i <input_path> -t <template_path> [options]

Required Options:
  -i, --input <path>      Directory of JSON configuration folders or a single JSON document.
  -t, --template <path>   Raw source presentation template (.pptx) file.

Additional Parameters:
  -o, --output <path>     Target output destination for compiled PPTX file. (Default: output.pptx)
  -a, --assets <path>     Dynamic path targeting local pictures and video file binders.
  -d, --debug             Activates trace levels, skipping heavy chart/spreadsheet rebuilds.
  -h, --help              Outputs execution instruction blocks.
    `);
  }
}