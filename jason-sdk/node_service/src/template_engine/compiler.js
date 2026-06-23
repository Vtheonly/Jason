import fs from 'fs-extra';
import path from 'path';
import decompress from 'decompress';
import archiver from 'archiver';
import { BraceParser } from './brace_parser.js';
import { LoopIterator } from './loop_iterator.js';
import { ConditionalEvaluator } from './conditional_evaluator.js';
import { applyNativeMorphEngine } from '../core/kineticEngine.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('compiler');

export class TemplateCompiler {
  static async compile(templateFilePath, configPayload, tempExtractionPath) {
    log.info(`Initiating PPTX template compilation workflow inside: ${tempExtractionPath}`);
    
    if (!(await fs.pathExists(templateFilePath))) {
      throw new Error(`Template PPTX archive missing at: ${templateFilePath}`);
    }

    // 1. Decompress template archive container
    await decompress(templateFilePath, tempExtractionPath);

    // 2. Perform Native XML morph logic mappings
    if (configPayload.transitions) {
      await applyNativeMorphEngine(tempExtractionPath, configPayload.transitions);
    }

    // 3. Process each slides structural design file
    const slidesDirectory = path.join(tempExtractionPath, 'ppt/slides');
    const files = await fs.readdir(slidesDirectory);

    for (const file of files) {
      if (file.endsWith('.xml')) {
        const slidePath = path.join(slidesDirectory, file);
        let xmlContent = await fs.readFile(slidePath, 'utf8');

        // Apply Loop execution boundaries
        xmlContent = LoopIterator.processLoops(xmlContent, configPayload);

        // Apply dynamic layout rendering branches
        xmlContent = ConditionalEvaluator.processConditions(xmlContent, configPayload);

        // Apply standard textual run expressions and pipeline modifications
        xmlContent = BraceParser.parseString(xmlContent, configPayload);

        await fs.writeFile(slidePath, xmlContent, 'utf8');
      }
    }

    log.info('XML tag interpolation pipeline successfully completed.');
  }

  static pack(sourceDirectoryPath, outputFilePath) {
    return new Promise((resolve, reject) => {
      log.info(`Zipping modifications back into package layout at: ${outputFilePath}`);
      const outputStream = fs.createWriteStream(outputFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      outputStream.on('close', () => {
        log.info(`PPTX archive package packed. Size: ${archive.pointer()} bytes.`);
        resolve();
      });

      archive.on('error', (err) => {
        log.error('Archiver compilation failure', err);
        reject(err);
      });

      archive.pipe(outputStream);
      archive.directory(sourceDirectoryPath, false);
      archive.finalize();
    });
  }
}