import type { EnvPreset } from './types';

export const DEFAULT_ENV_STORAGE_KEY =
  'dev_panel_env_override';

/**
 * Get active environment preset from localStorage (if overridden in DevPanel)
 */
export function getActiveDevEnv(
  storageKey: string = DEFAULT_ENV_STORAGE_KEY,
): EnvPreset | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as EnvPreset;
  } catch {
    return null;
  }
}

/**
 * Read environment variable with DevPanel override support.
 * If DevPanel has an active environment override in localStorage, returns that value;
 * otherwise returns fallback or import.meta.env[key].
 *
 * @example
 * const apiUrl = getDevEnv('VITE_BASE_URL', import.meta.env.VITE_BASE_URL);
 */
export function getDevEnv(
  key: string,
  fallback: string = '',
  storageKey: string = DEFAULT_ENV_STORAGE_KEY,
): string {
  const activePreset =
    getActiveDevEnv(storageKey);
  if (
    activePreset &&
    activePreset.variables &&
    key in activePreset.variables
  ) {
    const val = activePreset.variables[key];
    if (typeof val === 'string') return val;
  }
  return fallback;
}
