import type { CustomRoleItem } from './types';

export const DEFAULT_ROLES_STORAGE_KEY =
  'dev_panel_roles';
export const DEFAULT_CUSTOM_ROLES_STORAGE_KEY =
  'dev_panel_custom_roles';
export const DEFAULT_PERSIST_KEY =
  'dev_panel_roles_persist';

/**
 * Get active dev roles from localStorage or fallback
 */
export function getDevRoles<T = unknown[]>(
  storageKey: string = DEFAULT_ROLES_STORAGE_KEY,
  fallback: T = [] as unknown as T,
): T {
  if (typeof window === 'undefined')
    return fallback;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get saved custom roles from localStorage
 */
export function getDevCustomRoles(
  customStorageKey: string = DEFAULT_CUSTOM_ROLES_STORAGE_KEY,
): CustomRoleItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(
      customStorageKey,
    );
    if (!raw) return [];
    return JSON.parse(raw) as CustomRoleItem[];
  } catch {
    return [];
  }
}

/**
 * Resolve store instance whether passed as object or getter function
 */
export function resolveStore(
  storeOption: unknown,
): Record<string, unknown> | null {
  if (!storeOption) return null;
  if (typeof storeOption === 'function') {
    try {
      return (
        storeOption as () => Record<
          string,
          unknown
        >
      )();
    } catch (err) {
      console.warn(
        '[dev-panel:roles] Failed to execute store getter function:',
        err,
      );
      return null;
    }
  }
  return storeOption as Record<string, unknown>;
}

/**
 * Safely sets a deeply nested property in an object without destroying other properties
 * (e.g. 'profile.company_member_roles' -> target.profile.company_member_roles = val)
 */
export function setNestedProperty(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
  createIfMissing: boolean = true,
): boolean {
  if (!target || !path) return false;
  const keys = path.split('.');
  let current: Record<string, unknown> = target;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    let val = current[key];

    // Unwrap Vue ref if needed
    if (
      val &&
      typeof val === 'object' &&
      'value' in val &&
      !path.includes('value')
    ) {
      val = (val as { value: unknown }).value;
    }

    if (
      val === undefined ||
      val === null ||
      typeof val !== 'object'
    ) {
      if (!createIfMissing) {
        return false;
      }
      val = {};
      current[key] = val;
    }
    current = val as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  if (current && typeof current === 'object') {
    // Mutate in place on the reactive proxy without reassigning parent references
    current[lastKey] = Array.isArray(value)
      ? [...value]
      : value;
    return true;
  }

  console.warn(
    `[dev-panel:roles] ⚠️ Failed to set "${path}" on target`,
    target,
  );
  return false;
}

/**
 * Safely gets a deeply nested property from an object
 */
export function getNestedProperty(
  target: Record<string, unknown>,
  path: string,
): unknown {
  if (!target || !path) return undefined;
  const keys = path.split('.');
  let current: unknown = target;

  for (const key of keys) {
    if (
      current === undefined ||
      current === null ||
      typeof current !== 'object'
    ) {
      return undefined;
    }
    current = (
      current as Record<string, unknown>
    )[key];
    // Unwrap Vue ref if needed
    if (
      current &&
      typeof current === 'object' &&
      'value' in current &&
      !path.includes('value')
    ) {
      current = (current as { value: unknown })
        .value;
    }
  }

  return current;
}
