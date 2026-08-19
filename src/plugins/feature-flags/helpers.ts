import { shallowReactive } from 'vue';
import type {
  FeatureFlagValue,
  FeatureFlagDefinition,
  CustomFlagItem,
} from './types';

export const DEFAULT_FLAGS_STORAGE_KEY =
  'dev_feature_flags';
export const DEFAULT_CUSTOM_FLAGS_STORAGE_KEY =
  'dev_custom_feature_flags';
export const DEFAULT_PERSIST_FLAGS_KEY =
  'dev_feature_flags_persist';

/**
 * Global reactive state map for instant Vue 3 reactivity across components
 */
export const reactiveFlagsMap = shallowReactive<
  Record<string, FeatureFlagValue>
>({});

/**
 * Read saved flags from localStorage
 */
export function getSavedFlags(
  storageKey: string = DEFAULT_FLAGS_STORAGE_KEY,
): Record<string, FeatureFlagValue> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    return JSON.parse(raw) as Record<
      string,
      FeatureFlagValue
    >;
  } catch {
    return {};
  }
}

/**
 * Read custom user-defined flags from localStorage
 */
export function getCustomFlags(
  customStorageKey: string = DEFAULT_CUSTOM_FLAGS_STORAGE_KEY,
): CustomFlagItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(
      customStorageKey,
    );
    if (!raw) return [];
    return JSON.parse(raw) as CustomFlagItem[];
  } catch {
    return [];
  }
}

/**
 * Initialize and populate reactive flags map from definitions and storage
 */
export function initFeatureFlags(
  definitions: FeatureFlagDefinition[] = [],
  storageKey: string = DEFAULT_FLAGS_STORAGE_KEY,
  customStorageKey: string = DEFAULT_CUSTOM_FLAGS_STORAGE_KEY,
): Record<string, FeatureFlagValue> {
  const saved = getSavedFlags(storageKey);
  const custom = getCustomFlags(customStorageKey);

  // 1. Set defaults from definitions
  definitions.forEach((def) => {
    reactiveFlagsMap[def.key] = def.defaultValue;
  });

  // 2. Set custom flags
  custom.forEach((c) => {
    reactiveFlagsMap[c.key] = c.value;
  });

  // 3. Apply saved overrides
  Object.keys(saved).forEach((k) => {
    reactiveFlagsMap[k] = saved[k];
  });

  return { ...reactiveFlagsMap };
}

/**
 * Synchronous getter to read any feature flag value
 * Useful in router guards, Axios interceptors, and non-Vue utilities.
 */
export function getFeatureFlag<T = boolean>(
  key: string,
  fallback?: T,
): T {
  if (key in reactiveFlagsMap) {
    return reactiveFlagsMap[key] as unknown as T;
  }
  if (typeof window !== 'undefined') {
    const saved = getSavedFlags();
    if (key in saved) {
      return saved[key] as unknown as T;
    }
  }
  return fallback as T;
}

/**
 * Synchronous boolean helper to check if a feature flag is enabled
 */
export function isFeatureEnabled(
  key: string,
  fallback = false,
): boolean {
  const val = getFeatureFlag<unknown>(
    key,
    fallback,
  );
  return Boolean(val);
}

/**
 * Sets a feature flag value programmatically and updates reactive state & localStorage
 */
export function setFeatureFlag(
  key: string,
  value: FeatureFlagValue,
  storageKey: string = DEFAULT_FLAGS_STORAGE_KEY,
): void {
  reactiveFlagsMap[key] = value;
  if (typeof window !== 'undefined') {
    const current = getSavedFlags(storageKey);
    current[key] = value;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(current),
      );
    } catch {
      /* empty */
    }
  }
}

/**
 * Returns a snapshot of all active feature flags
 */
export function getAllFeatureFlags(): Record<
  string,
  FeatureFlagValue
> {
  return { ...reactiveFlagsMap };
}

/**
 * Resets all feature flags back to their default values
 */
export function resetFeatureFlags(
  definitions: FeatureFlagDefinition[] = [],
  storageKey: string = DEFAULT_FLAGS_STORAGE_KEY,
): void {
  const nextMap: Record<
    string,
    FeatureFlagValue
  > = {};
  definitions.forEach((def) => {
    nextMap[def.key] = def.defaultValue;
    reactiveFlagsMap[def.key] = def.defaultValue;
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(nextMap),
      );
    } catch {
      /* empty */
    }
  }
}
