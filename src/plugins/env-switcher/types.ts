export interface EnvPreset {
  id: string;
  name: string;
  description?: string;
  isProduction?: boolean;
  variables: Record<string, string>;
}

export interface EnvSwitcherOptions {
  storageKey?: string;
  defaultEnvId?: string;
  environments: EnvPreset[];
  autoReload?: boolean;
  onEnvChange?: (env: EnvPreset) => void;
}
