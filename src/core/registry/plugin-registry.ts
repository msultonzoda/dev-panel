import type {
  DevPanelPlugin,
  EventBus,
} from '@/types';

export interface PluginRegistry {
  register(plugin: DevPanelPlugin): void;
  unregister(pluginName: string): void;
  getPlugin(
    name: string,
  ): DevPanelPlugin | undefined;
  getAll(): DevPanelPlugin[];
}

/** Проверка совместимости major-версии API */
function isApiCompatible(
  pluginApiVersion: string,
  coreApiVersion: string,
): boolean {
  const pluginMajor = parseInt(
    pluginApiVersion
      .replace(/[^\d.]/, '')
      .split('.')[0],
    10,
  );
  const coreMajor = parseInt(
    coreApiVersion.split('.')[0],
    10,
  );
  return pluginMajor === coreMajor;
}

export const CORE_API_VERSION = '1.0.0';

export function createPluginRegistry(
  eventBus: EventBus,
): PluginRegistry {
  const plugins = new Map<
    string,
    DevPanelPlugin
  >();

  function register(
    plugin: DevPanelPlugin,
  ): void {
    if (plugins.has(plugin.name)) {
      console.warn(
        `[dev-panel] Plugin "${plugin.name}" is already registered. Skipping.`,
      );
      return;
    }

    if (
      !isApiCompatible(
        plugin.apiVersion,
        CORE_API_VERSION,
      )
    ) {
      const errorMessage =
        `Plugin "${plugin.name}" requires API v${plugin.apiVersion}, ` +
        `but core provides v${CORE_API_VERSION}`;

      console.warn(`[dev-panel] ${errorMessage}`);
      eventBus.emit('plugin:error', {
        pluginName: plugin.name,
        error: errorMessage,
      });
      return;
    }

    plugins.set(plugin.name, plugin);
    eventBus.emit('plugin:registered', {
      pluginName: plugin.name,
    });
  }

  function unregister(pluginName: string): void {
    const plugin = plugins.get(pluginName);
    if (plugin) {
      plugin.destroy?.();
      plugins.delete(pluginName);
    }
  }

  function getPlugin(
    name: string,
  ): DevPanelPlugin | undefined {
    return plugins.get(name);
  }

  function getAll(): DevPanelPlugin[] {
    return Array.from(plugins.values()).sort(
      (a, b) =>
        (a.order ?? 100) - (b.order ?? 100),
    );
  }

  return {
    register,
    unregister,
    getPlugin,
    getAll,
  };
}
