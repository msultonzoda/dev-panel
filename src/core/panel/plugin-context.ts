import type { Component } from 'vue';
import type {
  DevPanelPlugin,
  PluginContext,
  PluginLogger,
  EventBus,
  PanelState,
  ConfigAdapter,
} from '@/types';

export interface PluginContextDeps {
  events: EventBus;
  state: PanelState;
  config: ConfigAdapter;
  onRegisterView: (
    pluginName: string,
    component: Component,
  ) => void;
}

function createPluginLogger(
  pluginName: string,
): PluginLogger {
  const prefix = `[dev-panel:${pluginName}]`;

  return {
    info: (message, data?) =>
      console.info(
        prefix,
        message,
        ...(data !== undefined ? [data] : []),
      ),
    warn: (message, data?) =>
      console.warn(
        prefix,
        message,
        ...(data !== undefined ? [data] : []),
      ),
    error: (message, data?) =>
      console.error(
        prefix,
        message,
        ...(data !== undefined ? [data] : []),
      ),
  };
}

export function createPluginContext(
  plugin: DevPanelPlugin,
  deps: PluginContextDeps,
): PluginContext {
  const {
    events,
    state,
    config,
    onRegisterView,
  } = deps;

  return {
    events,
    state: state as Readonly<PanelState>,
    config,
    registerView: (component: Component) =>
      onRegisterView(plugin.name, component),
    log: createPluginLogger(plugin.name),
  };
}
