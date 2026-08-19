import { defineComponent, h } from 'vue';
import type {
  DevPanelPlugin,
  PluginContext,
} from '@/types';
import { CORE_API_VERSION } from '@/core/registry/plugin-registry';
import SystemInfoView from './SystemInfoView.vue';

export class SystemInfoPlugin implements DevPanelPlugin {
  name = 'System Info';
  version = '1.0.0';
  apiVersion = CORE_API_VERSION;
  order = 10; // First in the list
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`;

  install(context: PluginContext): void {
    context.registerView(
      defineComponent({
        name: 'SystemInfoWrapper',
        render() {
          return h(SystemInfoView, { context });
        },
      }),
    );
  }
}
