import type { Component } from 'vue';

// --- Base Types ---

export interface AuthResult {
  success: boolean;
  session: AuthSession | null;
  error?: string;
}

export interface AuthSession {
  token: string;
  expiresAt?: number;
  user?: Record<string, unknown>;
}

export interface BuildInfo {
  version: string;
  commitHash?: string;
  buildDate?: string;
  environment?: string;
  [key: string]: unknown;
}

export interface PanelError {
  code: string;
  message: string;
  source: 'auth' | 'plugin' | 'adapter' | 'core';
  details?: unknown;
}

// --- Adapters ---

export interface TriggerCallbacks {
  requestOpen: () => Promise<void>;
  isOpen: () => boolean;
}

export interface TriggerAdapter {
  init(callbacks: TriggerCallbacks): void;
  destroy(): void;
}

export interface AuthAdapter {
  authenticate(
    credentials?: Record<string, unknown>,
  ): Promise<AuthResult>;
  restoreSession(): Promise<AuthSession | null>;
  logout(): Promise<void>;
  validateSession?(
    session: AuthSession,
  ): Promise<boolean>;
  readonly requiresInteraction: boolean;
  getAuthComponent?(): Component;
}

export interface SessionAdapter {
  save(session: AuthSession): void;
  get(): AuthSession | null;
  clear(): void;
}

export interface ConfigAdapter {
  getEnvironment(): string;
  getBuildInfo(): BuildInfo;
  getRuntimeConfig(): Record<string, unknown>;
}

// --- Plugins ---

export interface PluginLogger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export interface PluginContext {
  events: EventBus;
  state: Readonly<PanelState>;
  config: ConfigAdapter;
  registerView(component: Component): void;
  log: PluginLogger;
}

export interface DevPanelPlugin {
  name: string;
  version: string;
  apiVersion: string;
  icon?: string;
  order?: number;

  install(context: PluginContext): void;
  onActivate?(): void;
  onDeactivate?(): void;
  onPanelOpen?(): void;
  onPanelClose?(): void;
  destroy?(): void;
}

export interface DiagnosticResult {
  status: 'ok' | 'warning' | 'error';
  message?: string;
  details?: unknown;
}

export interface DiagnosticCheck {
  name: string;
  category?: string;
  check: () => Promise<DiagnosticResult>;
}

// --- Core ---

export type DevPanelEvent =
  | 'panel:open'
  | 'panel:close'
  | 'panel:ready'
  | 'auth:success'
  | 'auth:failure'
  | 'auth:logout'
  | 'plugin:registered'
  | 'plugin:error'
  | 'plugin:activated'
  | 'navigation:change'
  | (string & {});

export interface EventBus {
  on<T = unknown>(
    event: DevPanelEvent,
    handler: (payload: T) => void,
  ): void;
  off<T = unknown>(
    event: DevPanelEvent,
    handler: (payload: T) => void,
  ): void;
  emit<T = unknown>(
    event: DevPanelEvent,
    payload?: T,
  ): void;
}

export interface PanelState {
  isOpen: boolean;
  activePlugin: string | null;
  isAuthenticated: boolean;
  session: AuthSession | null;
  isLoading: boolean;
  error: PanelError | null;
}

// --- Configuration ---

export interface DevPanelOptions {
  trigger: TriggerAdapter;
  auth?: AuthAdapter;
  session: SessionAdapter;
  config: ConfigAdapter;
  plugins: DevPanelPlugin[];
  theme?: 'dark' | 'light';
  showPluginErrors?: boolean;
  /** Persist open/closed and minimized state across page reloads (default: true) */
  persistState?: boolean;
  /** Initial state on first launch if no saved state exists ('open' | 'closed') */
  initialState?: 'open' | 'closed';
}
