import { defineComponent, h } from 'vue';
import type {
  DevPanelPlugin,
  PluginContext,
} from '@/types';
import { CORE_API_VERSION } from '@/core/registry/plugin-registry';
import ErrorGeneratorView from './ErrorGeneratorView.vue';

export class ErrorGeneratorPlugin implements DevPanelPlugin {
  name = 'Error Generator';
  version = '1.0.0';
  apiVersion = CORE_API_VERSION;
  order = 90;
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  install(context: PluginContext): void {
    context.registerView(
      defineComponent({
        name: 'ErrorGeneratorWrapper',
        render() {
          return h(ErrorGeneratorView, { context });
        },
      }),
    );
  }
}
