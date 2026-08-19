import { createApp } from 'vue';
import type { App, Plugin } from 'vue';
import type { PanelManager } from '@/core/panel/panel-manager';
import DevPanelLayout from './layouts/DevPanelLayout.vue';
import './styles/variables.css';
import './styles/reset.css';

let devPanelApp: App | null = null;
let devPanelContainer: HTMLElement | null = null;

export interface MountOptions {
  theme?: 'light' | 'dark';
  /** Host application Pinia instance to share stores with DevPanel views/plugins */
  pinia?: Plugin;
  /** Additional Vue plugins from host application (e.g. i18n, router) */
  plugins?: Array<
    Plugin | [Plugin, ...unknown[]]
  >;
}

export function mountDevPanel(
  manager: PanelManager,
  optionsOrTheme:
    'light' | 'dark' | MountOptions = 'dark',
): void {
  if (devPanelApp) {
    console.warn(
      '[dev-panel] Panel is already mounted.',
    );
    return;
  }

  const options: MountOptions =
    typeof optionsOrTheme === 'string'
      ? { theme: optionsOrTheme }
      : optionsOrTheme || {};

  const theme = options.theme || 'dark';

  // Create host element
  devPanelContainer =
    document.createElement('div');
  devPanelContainer.id = 'dev-panel-host';

  if (theme === 'light') {
    devPanelContainer.classList.add(
      'dp-theme-light',
    );
  }

  document.body.appendChild(devPanelContainer);

  // Mount Vue app
  devPanelApp = createApp(DevPanelLayout);
  devPanelApp.provide(
    'dev-panel-manager',
    manager,
  );

  // Register host Pinia instance if provided
  if (options.pinia) {
    devPanelApp.use(options.pinia);
  }

  // Register other host plugins if provided
  if (
    options.plugins &&
    Array.isArray(options.plugins)
  ) {
    options.plugins.forEach((plugin) => {
      if (Array.isArray(plugin)) {
        devPanelApp!.use(
          plugin[0] as Plugin,
          ...plugin.slice(1),
        );
      } else {
        devPanelApp!.use(plugin as Plugin);
      }
    });
  }

  devPanelApp.mount(devPanelContainer);
}

export function unmountDevPanel(): void {
  if (devPanelApp) {
    devPanelApp.unmount();
    devPanelApp = null;
  }
  if (
    devPanelContainer &&
    devPanelContainer.parentNode
  ) {
    devPanelContainer.parentNode.removeChild(
      devPanelContainer,
    );
    devPanelContainer = null;
  }
}
