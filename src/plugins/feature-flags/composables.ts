import { computed, type ComputedRef } from 'vue';
import type { FeatureFlagValue } from './types';
import {
  reactiveFlagsMap,
  getFeatureFlag,
  isFeatureEnabled,
  setFeatureFlag,
  getAllFeatureFlags,
} from './helpers';

/**
 * Vue 3 Composable to reactively read a single feature flag
 *
 * @example
 * const isNewTable = useFeatureFlag('new_transactions_table');
 * const abVariant = useFeatureFlag<string>('pricing_ab_test', 'v1');
 */
export function useFeatureFlag<T = boolean>(
  key: string,
  fallback?: T,
): ComputedRef<T> {
  return computed<T>(() => {
    if (key in reactiveFlagsMap) {
      return reactiveFlagsMap[
        key
      ] as unknown as T;
    }
    return fallback as T;
  });
}

/**
 * Vue 3 Composable to access and control all feature flags
 *
 * @example
 * const { flags, isEnabled, setFlag } = useFeatureFlags();
 */
export function useFeatureFlags() {
  const flags = computed<
    Record<string, FeatureFlagValue>
  >(() => ({
    ...reactiveFlagsMap,
  }));

  return {
    flags,
    getFlag: getFeatureFlag,
    isEnabled: isFeatureEnabled,
    setFlag: setFeatureFlag,
    getAllFlags: getAllFeatureFlags,
  };
}
