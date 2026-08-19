import type {
  SessionAdapter,
  AuthSession,
} from '@/types';

export interface LocalStorageSessionOptions {
  key?: string;
}

export class LocalStorageSessionAdapter implements SessionAdapter {
  private readonly storageKey: string;

  constructor(
    options: LocalStorageSessionOptions = {},
  ) {
    this.storageKey =
      options.key ?? 'dev_panel_session';
  }

  save(session: AuthSession): void {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(session),
      );
    } catch (error) {
      console.warn(
        `[dev-panel] Failed to save session to localStorage:`,
        error,
      );
    }
  }

  get(): AuthSession | null {
    try {
      const data = localStorage.getItem(
        this.storageKey,
      );
      if (!data) return null;

      const parsed = JSON.parse(data);
      // Базовая валидация структуры
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.token === 'string'
      ) {
        return parsed as AuthSession;
      }
      return null;
    } catch {
      // Если JSON невалидный - считаем что сессии нет
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn(
        `[dev-panel] Failed to clear session from localStorage:`,
        error,
      );
    }
  }
}
