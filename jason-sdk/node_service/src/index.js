import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createScopedLogger } from './developer_experience/logger.js';
import { FolderScanner } from './input_system/folder_scanner.js';
import { FileResolver } from './input_system/file_resolver.js';
import { ConfigMerger } from './input_system/config_merger.js';
import { SchemaValidator } from './config/schema_validator.js';
import { TemplateCompiler } from './template_engine/compiler.js';
import { executeChartCompilation } from './grpc/client_orchestrator.js';
import { OvercrowdingDetector } from './quality_control/overcrowding_detector.js';
import { MissingAssetChecker } from './quality_control/missing_asset_checker.js';
import { DebugPreview } from './developer_experience/debug_preview.js';

const log = createScopedLogger('web-gateway');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve repo-root paths in a CWD-independent way (works inside Docker too).
// node_service/src/index.js -> ../.. to reach the repo root that contains
// shared_schemas/ and protos/.
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SHARED_SCHEMAS_DIR = process.env.SHARED_SCHEMAS_DIR || path.join(REPO_ROOT, 'shared_schemas');
const DEFAULT_SCHEMA_PATH = path.join(SHARED_SCHEMAS_DIR, 'presentation_schema.json');

const PORT = parseInt(process.env.PORT || '3000', 10);
const WORKSPACE_ROOT = process.env.JASON_WORKSPACE || '/tmp/jason_workspace';

const app = express();
const upload = multer({ dest: path.join(os.tmpdir(), 'jason_uploads') });

// Ensure the shared workspace exists on boot.
await fs.ensureDir(WORKSPACE_ROOT);

// Health check endpoint - useful for Docker health probes and load balancers.
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'jason-web-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    workspace: WORKSPACE_ROOT
  });
});

// Root endpoint - human-friendly landing page.
app.get('/', (_req, res) => {
  res.type('text/plain').send(
    'Jason SDK Web Gateway\n' +
    '=====================\n\n' +
    'POST /api/generate  (multipart: template + config) -> compiled .pptx\n' +
    'GET  /health        -> service liveness probe\n'
  );
});

/**
 * POST /api/generate
 * Multipart form fields:
 *   - template: .pptx template file
 *   - config:  .json configuration file
 * Response: compiled .pptx stream
 */
app.post('/api/generate', upload.fields([
  { name: 'template', maxCount: 1 },
  { name: 'config', maxCount: 1 }
]), async (req, res) => {
  const runId = `rest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const runWorkspace = path.join(WORKSPACE_ROOT, 'runs', runId);
  const extractionDir = path.join(runWorkspace, 'extracted');
  const outputDir = path.join(runWorkspace, 'output');
  const uploadsDir = path.join(runWorkspace, 'uploads');

  try {
    await fs.ensureDir(extractionDir);
    await fs.ensureDir(outputDir);
    await fs.ensureDir(uploadsDir);

    if (!req.files || !req.files.template || !req.files.config) {
      return res.status(400).json({
        error: 'Both "template" (.pptx) and "config" (.json) multipart fields are required.'
      });
    }

    const templateFile = req.files.template[0];
    const configFile = req.files.config[0];

    if (path.extname(templateFile.originalname).toLowerCase() !== '.pptx') {
      return res.status(400).json({ error: 'Template file must be a .pptx archive.' });
    }
    if (path.extname(configFile.originalname).toLowerCase() !== '.json') {
      return res.status(400).json({ error: 'Config file must be a .json document.' });
    }

    // Move uploaded files into the run workspace with their original extensions.
    const templatePath = path.join(uploadsDir, 'template.pptx');
    const configPath = path.join(uploadsDir, 'config.json');
    await fs.move(templateFile.path, templatePath, { overwrite: true });
    await fs.move(configFile.path, configPath, { overwrite: true });

    log.info(`[${runId}] Received template (${templateFile.originalname}) and config (${configFile.originalname}).`);

    // 1. Scan and parse the JSON config payload.
    const rawConfigs = await FolderScanner.scan(configPath);
    if (rawConfigs.length === 0) {
      throw new Error('Empty configuration payload parsed from uploaded config.');
    }

    // 2. Resolve any external $ref pointers (relative to the run workspace).
    const resolvedConfigs = [];
    for (const raw of rawConfigs) {
      const resolved = await FileResolver.resolveReferences(raw, uploadsDir);
      resolvedConfigs.push(resolved);
    }

    // 3. Merge resolved configuration fragments.
    const finalPayload = ConfigMerger.merge(resolvedConfigs);

    // 4. Validate against the shared JSON schema.
    const validator = new SchemaValidator();
    await validator.initialize(DEFAULT_SCHEMA_PATH);
    const validationResult = validator.validate(finalPayload);
    if (!validationResult.isValid) {
      log.warn(`[${runId}] Schema validation failed: ${JSON.stringify(validationResult.errors)}`);
      return res.status(400).json({
        error: 'Configuration payload failed schema validation.',
        details: validationResult.errors
      });
    }

    // 5. Optional quality-control checks (warnings only, non-blocking).
    try {
      OvercrowdingDetector.auditOvercrowding(finalPayload);
    } catch (qcErr) {
      log.warn(`[${runId}] Overcrowding audit skipped: ${qcErr.message}`);
    }

    // 6. Compile the PPTX template (unzip, interpolate XML, re-zip).
    await TemplateCompiler.compile(templatePath, finalPayload, extractionDir);

    // 7. Delegate chart/Excel compilation to the Python core over gRPC.
    const chartPayload = [];
    for (const slide of finalPayload.slides || []) {
      if (Array.isArray(slide.charts)) {
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
      log.info(`[${runId}] Delegating ${chartPayload.length} chart(s) to Python core over gRPC.`);
      try {
        await executeChartCompilation(
          extractionDir,
          chartPayload,
          finalPayload.theme || {},
          finalPayload.transitions || {}
        );
      } catch (grpcErr) {
        // gRPC failure is non-fatal: we still return the compiled PPTX,
        // but emit a warning so the caller knows chart data may be stale.
        log.warn(`[${runId}] gRPC chart compilation failed: ${grpcErr.message}`);
      }
    }

    // 8. Pack the modified XML back into a final .pptx archive.
    const outputPptx = path.join(outputDir, 'compiled.pptx');
    await TemplateCompiler.pack(extractionDir, outputPptx);

    log.info(`[${runId}] Compilation complete. Streaming result back to client.`);

    // 9. Stream the file back to the caller.
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', 'attachment; filename="compiled.pptx"');

    const stream = fs.createReadStream(outputPptx);
    stream.on('error', (err) => {
      log.error(`[${runId}] Output stream error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream compiled file.' });
      }
    });
    stream.on('end', () => {
      log.info(`[${runId}] Response stream completed.`);
    });
    stream.pipe(res);
  } catch (err) {
    log.error(`[${runId}] Compilation pipeline failed.`, err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Compilation pipeline failure.',
        message: err.message
      });
    }
  } finally {
    // Best-effort cleanup of the per-run workspace. We keep the output
    // file around for download debugging if the cleanup fails.
    try {
      await fs.remove(path.join(WORKSPACE_ROOT, 'runs', runId, 'extracted'));
      await fs.remove(path.join(WORKSPACE_ROOT, 'runs', runId, 'uploads'));
    } catch (cleanupErr) {
      log.warn(`[${runId}] Workspace cleanup failed: ${cleanupErr.message}`);
    }
  }
});

app.use((err, _req, res, _next) => {
  log.error('Unhandled Express error.', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  log.info(`Jason Web Gateway listening on port ${PORT}`);
  log.info(`Workspace root: ${WORKSPACE_ROOT}`);
  log.info(`Shared schemas directory: ${SHARED_SCHEMAS_DIR}`);
  log.info(`Default schema path: ${DEFAULT_SCHEMA_PATH}`);
});

// Graceful shutdown on SIGTERM / SIGINT (Docker stop and Ctrl+C).
function shutdown(signal) {
  log.info(`Received ${signal}. Shutting down gracefully.`);
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
