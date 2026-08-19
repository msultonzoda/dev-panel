import { defineComponent, h } from 'vue';
import type {
  DevPanelPlugin,
  PluginContext,
} from '@/types';
import { CORE_API_VERSION } from '@/core/registry/plugin-registry';
import EnvSwitcherView from './EnvSwitcherView.vue';
import type { EnvSwitcherOptions } from './types';

export * from './types';
export * from './helpers';
export * from './useEnvSwitcher';

export class EnvSwitcherPlugin implements DevPanelPlugin {
  name = 'Environment';
  version = '1.0.0';
  apiVersion = CORE_API_VERSION;
  order = 10;
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z"/><path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="16" x2="6.01" y2="16"/></svg>`;

  constructor(
    private options: EnvSwitcherOptions,
  ) {}

  install(context: PluginContext): void {
    const opts = this.options;
    context.registerView(
      defineComponent({
        name: 'EnvSwitcherWrapper',
        render() {
          return h(EnvSwitcherView, {
            context,
            options: opts,
          });
        },
      }),
    );
  }
}
