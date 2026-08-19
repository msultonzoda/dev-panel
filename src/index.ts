// Types
export * from './types';

// Core
export { createEventBus } from './core/events/event-bus';
export { createPanelState } from './core/state/panel-state';
export {
  createPluginRegistry,
  CORE_API_VERSION,
} from './core/registry/plugin-registry';
export { createPluginContext } from './core/panel/plugin-context';
export { createPanelManager } from './core/panel/panel-manager';
export type { PluginContextDeps } from './core/panel/plugin-context';

// Adapters
export { MemorySessionAdapter } from './adapters/session/memory-session-adapter';
export { LocalStorageSessionAdapter } from './adapters/session/local-storage-session-adapter';
export { StubAuthAdapter } from './adapters/auth/stub-auth-adapter';
export { StaticConfigAdapter } from './adapters/config/static-config-adapter';
export { KeyboardTriggerAdapter } from './adapters/trigger/keyboard-trigger-adapter';

// UI
export {
  mountDevPanel,
  unmountDevPanel,
  type MountOptions,
} from './ui/index';

// Plugins
export { SystemInfoPlugin } from './plugins/system-info';
export { ActionLogPlugin } from './plugins/action-log';
export {
  EnvSwitcherPlugin,
  getDevEnv,
  getActiveDevEnv,
  type EnvPreset,
  type EnvSwitcherOptions,
} from './plugins/env-switcher';
export {
  RoleEditorPlugin,
  getDevRoles,
  type RoleOption,
  type CustomRoleItem,
  type RoleEditorOptions,
} from './plugins/role-editor';
export {
  FeatureFlagsPlugin,
  useFeatureFlag,
  useFeatureFlags,
  isFeatureEnabled,
  getFeatureFlag,
  setFeatureFlag,
  resetFeatureFlags,
  getAllFeatureFlags,
  type FeatureFlagValue,
  type FeatureFlagType,
  type FeatureFlagDefinition,
  type FeatureFlagOptionItem,
  type CustomFlagItem,
  type FeatureFlagsOptions,
} from './plugins/feature-flags';
