import { defineComponent, h } from 'vue';
import type {
  DevPanelPlugin,
  PluginContext,
} from '@/types';
import { CORE_API_VERSION } from '@/core/registry/plugin-registry';
import FeatureFlagsView from './FeatureFlagsView.vue';
import type {
  FeatureFlagsOptions,
  FeatureFlagValue,
} from './types';
import {
  DEFAULT_FLAGS_STORAGE_KEY,
  DEFAULT_CUSTOM_FLAGS_STORAGE_KEY,
  initFeatureFlags,
  setFeatureFlag,
} from './helpers';

export * from './types';
export * from './helpers';
export * from './composables';

export class FeatureFlagsPlugin implements DevPanelPlugin {
  name = 'Feature Flags';
  version = '1.0.0';
  apiVersion = CORE_API_VERSION;
  order = 12;
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;

  constructor(
    private options: FeatureFlagsOptions,
  ) {}

  install(context: PluginContext): void {
    const opts = this.options;
    const storageKey =
      opts.storageKey ||
      DEFAULT_FLAGS_STORAGE_KEY;
    const customStorageKey =
      opts.customStorageKey ||
      DEFAULT_CUSTOM_FLAGS_STORAGE_KEY;

    // 1. Initialize reactive flags state from definitions & localStorage
    const currentFlags = initFeatureFlags(
      opts.flags,
      storageKey,
      customStorageKey,
    );

    // 2. Synchronize with Pinia store if configured
    const syncToPinia = (
      flagsMap: Record<string, FeatureFlagValue>,
    ) => {
      if (!opts.piniaStore) return;
      try {
        let store: Record<
          string,
          unknown
        > | null = null;
        if (
          typeof opts.piniaStore === 'function'
        ) {
          store = (
            opts.piniaStore as () => Record<
              string,
              unknown
            >
          )();
        } else {
          store = opts.piniaStore as Record<
            string,
            unknown
          >;
        }

        if (store) {
          const path = opts.storePath || 'flags';
          if (path in store) {
            store[path] = { ...flagsMap };
          }
        }
      } catch (err) {
        console.warn(
          '[dev-panel:feature-flags] Failed to sync flags to piniaStore:',
          err,
        );
      }
    };

    syncToPinia(currentFlags);

    // 3. Listen to panel events
    context.events.on(
      'feature-flags:changed',
      (payload: unknown) => {
        const p = payload as {
          flags?: Record<
            string,
            FeatureFlagValue
          >;
        };
        if (p && p.flags) {
          Object.keys(p.flags).forEach((k) => {
            setFeatureFlag(
              k,
              p.flags![k],
              storageKey,
            );
          });
          syncToPinia(p.flags);
        }
      },
    );

    // 4. Register View
    context.registerView(
      defineComponent({
        name: 'FeatureFlagsWrapper',
        render() {
          return h(FeatureFlagsView, {
            context,
            options: opts,
          });
        },
      }),
    );
  }
}
