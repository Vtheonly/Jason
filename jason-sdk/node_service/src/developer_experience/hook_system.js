import { createScopedLogger } from './logger.js';

const log = createScopedLogger('hook-system');

export class HookSystem {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
  }

  async executePreProcess(configPayload) {
    log.info('Running registration lifecycle hooks: onPreProcess');
    const hooks = this.pluginManager.getHooksForEvent('onPreProcess');
    
    let workingPayload = { ...configPayload };
    for (const hook of hooks) {
      try {
        log.info(`Invoking onPreProcess hook from plugin: ${hook.pluginName}`);
        const result = await hook.fn(workingPayload);
        if (result) workingPayload = result;
      } catch (err) {
        log.error(`Hook runtime crash inside plugin: ${hook.pluginName} during onPreProcess.`, err);
      }
    }
    return workingPayload;
  }

  async executePostProcess(outputFilePath) {
    log.info('Running registration lifecycle hooks: onPostProcess');
    const hooks = this.pluginManager.getHooksForEvent('onPostProcess');

    for (const hook of hooks) {
      try {
        log.info(`Invoking onPostProcess hook from plugin: ${hook.pluginName}`);
        await hook.fn(outputFilePath);
      } catch (err) {
        log.error(`Hook runtime crash inside plugin: ${hook.pluginName} during onPostProcess.`, err);
      }
    }
  }
}