import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { ArgsParser } from './args_parser.js';
import { FolderScanner } from '../input_system/folder_scanner.js';
import { ConfigMerger } from '../input_system/config_merger.js';
import { FileResolver } from '../input_system/file_resolver.js';
import { SchemaValidator } from '../config/schema_validator.js';
import { TemplateCompiler } from '../template_engine/compiler.js';
import { executeChartCompilation } from '../grpc/client_orchestrator.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('cli-router');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// node_service/src/cli/cli_router.js -> ../.. reaches the repo root.
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_SCHEMA_PATH = path.join(REPO_ROOT, 'shared_schemas', 'presentation_schema.json');

async function run() {
  const options = ArgsParser.parse(process.argv);
  const runId = `cli_${Date.now()}`;
  const extractionDir = path.join('/tmp/jason_workspace/extractions/', runId);
  const schemaPath = process.env.SCHEMA_PATH || DEFAULT_SCHEMA_PATH;

  try {
    log.info(`CLI process active. Task Reference: ${runId}`);

    // 1. Traverse and scan JSON data structures
    const inputPath = path.resolve(options.input);
    const rawConfigs = await FolderScanner.scan(inputPath);
    if (rawConfigs.length === 0) {
      throw new Error(`Execution halted: Empty configuration source parsed at: ${inputPath}`);
    }

    // 2. Resolve external schema/file inheritance bounds
    const resolvedConfigs = [];
    const baseDir = fs.statSync(inputPath).isDirectory() ? inputPath : path.dirname(inputPath);
    
    for (const raw of rawConfigs) {
      const resolved = await FileResolver.resolveReferences(raw, baseDir);
      resolvedConfigs.push(resolved);
    }

    // 3. Consolidate layout blocks
    const finalPayload = ConfigMerger.merge(resolvedConfigs);

    // 4. Validate configuration syntax parameters
    const validator = new SchemaValidator();
    await validator.initialize(schemaPath);
    const validationResult = validator.validate(finalPayload);

    if (!validationResult.isValid) {
      throw new Error(`Input payload syntax validation failed. Check parameters.`);
    }

    // 5. Decompress and interpolate XML template
    const templatePath = path.resolve(options.template);
    await TemplateCompiler.compile(templatePath, finalPayload, extractionDir);

    // 6. Invoke gRPC for advanced charts, diagrams, and video rendering tasks
    if (!options.debug) {
      const chartPayload = [];
      for (const slide of finalPayload.slides) {
        if (slide.charts) {
          for (const chart of slide.charts) {
            chartPayload.push({
              slide_index: slide.slide_index,
              chart_index: chart.chart_index,
              dataset: chart.dataset
            });
          }
        }
      }

      if (chartPayload.length > 0) {
        log.info(`Delegating raw Excel computations to Python service core for ${chartPayload.length} charts.`);
        await executeChartCompilation(extractionDir, chartPayload, finalPayload.theme || {}, finalPayload.transitions || {});
      }
    } else {
      log.info('Running in Debug mode. Skipping gRPC Excel compilation steps.');
    }

    // 7. Repack modified XML components into output PPTX
    const outPath = path.resolve(options.output);
    await fs.ensureDir(path.dirname(outPath));
    await TemplateCompiler.pack(extractionDir, outPath);

    log.info(`Presentation compiled successfully. Output file created at: ${outPath}`);
    process.exit(0);
  } catch (err) {
    log.error('CLI compiler process halted unexpectedly', err);
    process.exit(1);
  } finally {
    // Cleanup temporary extraction workspace
    await fs.remove(extractionDir).catch(e => log.warn(`Failed to clean workspace directory: ${e.message}`));
  }
}

run();