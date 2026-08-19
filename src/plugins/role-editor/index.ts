import { defineComponent, h, watch } from 'vue';
import type {
  DevPanelPlugin,
  PluginContext,
} from '@/types';
import { CORE_API_VERSION } from '@/core/registry/plugin-registry';
import RoleEditorView from './RoleEditorView.vue';
import type { RoleEditorOptions } from './types';
import {
  DEFAULT_ROLES_STORAGE_KEY,
  getDevRoles,
  getNestedProperty,
  setNestedProperty,
  resolveStore,
} from './helpers';

export * from './types';
export * from './helpers';

export class RoleEditorPlugin implements DevPanelPlugin {
  name = 'Roles & Permissions';
  version = '1.0.0';
  apiVersion = CORE_API_VERSION;
  order = 15;
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

  constructor(
    private options: RoleEditorOptions,
  ) {}

  install(context: PluginContext): void {
    const opts = this.options;
    const storageKey =
      opts.storageKey ||
      DEFAULT_ROLES_STORAGE_KEY;
    const getStore = () =>
      resolveStore(opts.piniaStore);
    let isInternalUpdate = false;

    const applyToHost = (
      rolesToApply: unknown[],
    ) => {
      if (
        !rolesToApply ||
        (Array.isArray(rolesToApply) &&
          rolesToApply.length === 0)
      ) {
        return;
      }

      const targetStore = getStore();
      if (targetStore && opts.storePath) {
        const path = opts.storePath;
        const currentInStore = getNestedProperty(
          targetStore,
          path,
        );

        // Avoid redundant mutations if already equal
        if (
          JSON.stringify(currentInStore) ===
          JSON.stringify(rolesToApply)
        ) {
          return;
        }

        try {
          isInternalUpdate = true;
          // Direct property set
          setNestedProperty(
            targetStore,
            path,
            rolesToApply,
            false,
          );

          // Setter methods support if present on store
          if (
            typeof (
              targetStore as {
                setRoles?: unknown;
              }
            ).setRoles === 'function'
          ) {
            (
              targetStore as {
                setRoles: (v: unknown) => void;
              }
            ).setRoles(rolesToApply);
          } else if (
            typeof (
              targetStore as { setRole?: unknown }
            ).setRole === 'function'
          ) {
            (
              targetStore as {
                setRole: (v: unknown) => void;
              }
            ).setRole(
              Array.isArray(rolesToApply) &&
                rolesToApply.length === 1
                ? rolesToApply[0]
                : rolesToApply,
            );
          }
        } catch (err) {
          console.warn(
            '[dev-panel:roles] ⚠️ Error applying roles to piniaStore:',
            err,
          );
        } finally {
          setTimeout(() => {
            isInternalUpdate = false;
          }, 50);
        }
      }

      // User callback
      if (opts.onRoleChange) {
        try {
          opts.onRoleChange(rolesToApply, []);
        } catch (err) {
          console.error(
            '[dev-panel:roles] Error in options.onRoleChange:',
            err,
          );
        }
      }
    };

    // Setup active roles from storage on startup
    const initialSavedRoles = getDevRoles<
      unknown[]
    >(storageKey, []);

    // Setup Watcher on Pinia Store if storePath is provided
    if (opts.storePath) {
      const path = opts.storePath;
      const lastDot = path.lastIndexOf('.');

      if (lastDot > 0) {
        const parentPath = path.substring(
          0,
          lastDot,
        );
        // Watch the parent object (e.g. 'profile')
        watch(
          () => {
            const s = getStore();
            return s
              ? getNestedProperty(s, parentPath)
              : undefined;
          },
          (parentVal) => {
            if (isInternalUpdate) return;
            if (
              parentVal &&
              typeof parentVal === 'object'
            ) {
              const s = getStore();
              if (s) {
                const currentSaved = getDevRoles<
                  unknown[]
                >(storageKey, initialSavedRoles);
                if (
                  currentSaved &&
                  currentSaved.length > 0
                ) {
                  const currentRoles =
                    getNestedProperty(s, path);
                  if (
                    JSON.stringify(
                      currentRoles,
                    ) !==
                    JSON.stringify(currentSaved)
                  ) {
                    applyToHost(currentSaved);
                  }
                }
              }
            }
          },
          { immediate: true },
        );
      } else {
        // Top-level path
        watch(
          () => {
            const s = getStore();
            return s
              ? getNestedProperty(s, path)
              : undefined;
          },
          (val) => {
            if (isInternalUpdate) return;
            const currentSaved = getDevRoles<
              unknown[]
            >(storageKey, initialSavedRoles);
            const s = getStore();
            if (
              s &&
              currentSaved &&
              currentSaved.length > 0 &&
              JSON.stringify(val) !==
                JSON.stringify(currentSaved)
            ) {
              applyToHost(currentSaved);
            }
          },
        );
      }
    }

    // Apply immediately if store is already populated
    if (
      initialSavedRoles &&
      initialSavedRoles.length > 0
    ) {
      applyToHost(initialSavedRoles);
    }

    // Listen to panel events
    context.events.on(
      'dev:role-changed',
      (payload: unknown) => {
        const p = payload as {
          selectedValues?: unknown[];
        };
        if (p && p.selectedValues) {
          applyToHost(p.selectedValues);
        }
      },
    );

    context.registerView(
      defineComponent({
        name: 'RoleEditorWrapper',
        render() {
          return h(RoleEditorView, {
            context,
            options: opts,
          });
        },
      }),
    );
  }
}
