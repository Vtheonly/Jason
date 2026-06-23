import { createScopedLogger } from './logger.js';

const log = createScopedLogger('plugin-manager');

export class PluginManager {
  constructor() {
    this.plugins = [];
  }

  register(pluginInstance) {
    if (!pluginInstance || typeof pluginInstance !== 'object') {
      log.warn('Attempted registration of invalid plugin instance structure. Rejected.');
      return;
    }

    const pluginName = pluginInstance.name || `anonymous_plugin_${this.plugins.length}`;
    log.info(`Registering extension plugin: ${pluginName}`);
    
    this.plugins.push({
      name: pluginName,
      instance: pluginInstance
    });
  }

  getHooksForEvent(eventName) {
    const hooks = [];
    for (const plugin of this.plugins) {
      if (typeof plugin.instance[eventName] === 'function') {
        hooks.push({
          pluginName: plugin.name,
          fn: plugin.instance[eventName].bind(plugin.instance)
        });
      }
    }
    return hooks;
  }
}