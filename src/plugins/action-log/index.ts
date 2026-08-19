import { defineComponent, h } from 'vue';
import type {
  DevPanelPlugin,
  PluginContext,
} from '@/types';
import { CORE_API_VERSION } from '@/core/registry/plugin-registry';
import ActionLogView from './ActionLogView.vue';

export class ActionLogPlugin implements DevPanelPlugin {
  name = 'Action Log';
  version = '1.0.0';
  apiVersion = CORE_API_VERSION;
  order = 20;
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>`;

  install(context: PluginContext): void {
    context.registerView(
      defineComponent({
        name: 'ActionLogWrapper',
        render() {
          return h(ActionLogView, { context });
        },
      }),
    );
  }
}
