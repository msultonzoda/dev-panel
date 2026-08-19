export interface RoleOption {
  id: string;
  name: string;
  value?: unknown;
  description?: string;
  badge?: string;
}

export interface CustomRoleItem {
  id: string;
  name: string;
  value: string;
}

/**
 * Supported Pinia Store input: store instance or getter function
 */
export type PiniaStoreInput =
  | Record<string, unknown>
  | (() => unknown)
  | unknown;

export interface RoleEditorOptions {
  /** List of predefined roles for checkboxes */
  roles: RoleOption[];

  /** Initial selected role IDs (e.g. ['admin', 'logistic']) */
  defaultRoleIds?: string[];
  defaultRoleId?: string;

  /**
   * LocalStorage key to save the active roles array directly
   * (e.g. 'roles', 'user_roles', 'auth_role')
   * Default: 'dev_panel_roles'
   */
  storageKey?: string;

  /**
   * LocalStorage key for custom user-created roles
   * Default: 'dev_panel_custom_roles'
   */
  customRolesStorageKey?: string;

  /**
   * Pinia Store instance or getter function (optional).
   * If provided with `storePath`, DevPanel will directly mutate the store property.
   * @example
   * piniaStore: useProfileStore()
   * // or
   * piniaStore: () => useProfileStore()
   */
  piniaStore?: PiniaStoreInput;

  /**
   * Path/field in the Pinia store to update (e.g. 'profile.company_member_roles' or 'roles')
   */
  storePath?: string;

  /**
   * Custom callback called when roles are applied
   */
  onRoleChange?: (
    activeRoleValues: unknown[],
    activeRoleOptions: RoleOption[],
  ) => void;

  /**
   * Getter to read current active roles from host app (plural alias)
   */
  getCurrentRoles?: () => unknown[];

  /**
   * Getter to read current active role or roles from host app (singular alias)
   */
  getCurrentRole?: () => unknown;

  /** Whether to allow adding custom freeform roles (default: true) */
  allowCustomRoles?: boolean;

  /** Default state for "Persist across reloads" checkbox (default: true) */
  defaultPersistAcrossReloads?: boolean;
}
