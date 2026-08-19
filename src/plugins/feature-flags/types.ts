export type FeatureFlagValue =
  | boolean
  | string
  | number
  | Record<string, unknown>;

export type FeatureFlagType =
  'boolean' | 'string' | 'number' | 'json';

export interface FeatureFlagOptionItem {
  label: string;
  value: FeatureFlagValue;
}

export interface FeatureFlagDefinition {
  /** Unique flag key identifier (e.g. 'new_transactions_table') */
  key: string;

  /** Human-readable title */
  name: string;

  /** Description of what this flag enables or tests */
  description?: string;

  /** Category/section for UI grouping (e.g. 'UI / Pages', 'Billing', 'Core') */
  group?: string;

  /** Default value if not overridden in localStorage */
  defaultValue: FeatureFlagValue;

  /** Flag data type (default: 'boolean') */
  type?: FeatureFlagType;

  /** Selectable options for multivariate/string flags */
  options?: FeatureFlagOptionItem[];

  /** Tags for categorization or filtering (e.g. ['beta', 'qa']) */
  tags?: string[];
}

export interface CustomFlagItem {
  key: string;
  name: string;
  value: FeatureFlagValue;
  type: FeatureFlagType;
}

/** Supported Pinia Store input: store instance or getter function */
export type PiniaStoreInput =
  | Record<string, unknown>
  | (() => unknown)
  | unknown;

export interface FeatureFlagsOptions {
  /** Predefined list of feature flags */
  flags: FeatureFlagDefinition[];

  /**
   * LocalStorage key to save overridden flags
   * Default: 'dev_feature_flags'
   */
  storageKey?: string;

  /**
   * LocalStorage key for custom user-created flags
   * Default: 'dev_custom_feature_flags'
   */
  customStorageKey?: string;

  /**
   * Optional Pinia Store instance or getter function
   */
  piniaStore?: PiniaStoreInput;

  /**
   * Path/field in the Pinia store to update (e.g. 'featureFlags' or 'flags')
   */
  storePath?: string;

  /**
   * Custom callback called when a flag changes
   */
  onFlagChange?: (
    key: string,
    value: FeatureFlagValue,
    allFlags: Record<string, FeatureFlagValue>,
  ) => void;

  /** Whether to allow adding custom freeform flags (default: true) */
  allowCustomFlags?: boolean;

  /** Default state for "Persist across reloads" checkbox (default: true) */
  defaultPersist?: boolean;
}
