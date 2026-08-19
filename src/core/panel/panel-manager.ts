import type { Component } from 'vue';
import type {
  DevPanelOptions,
  PanelState,
  EventBus,
} from '@/types';
import { createEventBus } from '@/core/events/event-bus';
import { createPanelState } from '@/core/state/panel-state';
import {
  createPluginRegistry,
  type PluginRegistry,
} from '@/core/registry/plugin-registry';
import { createPluginContext } from './plugin-context';

export interface PanelManager {
  open(): Promise<void>;
  close(): void;
  toggle(): Promise<void>;
  isOpen(): boolean;
  destroy(): void;
  /** Завершает интерактивную авторизацию (вызывается из UI) */
  submitAuth(
    credentials?: Record<string, unknown>,
  ): Promise<boolean>;
  /** Внутренние объекты — для UI-слоя */
  getState(): PanelState;
  getEventBus(): EventBus;
  getRegistry(): PluginRegistry;
  getPluginViews(): ReadonlyMap<
    string,
    Component
  >;
  getConfig(): DevPanelOptions['config'];
}

const STORAGE_KEY_PANEL_OPEN =
  'dev_panel_is_open';
const STORAGE_KEY_ACTIVE_PLUGIN =
  'dev_panel_active_plugin';

export function createPanelManager(
  options: DevPanelOptions,
): PanelManager {
  const eventBus = createEventBus();
  const state = createPanelState();
  const registry = createPluginRegistry(eventBus);
  const pluginViews = new Map<
    string,
    Component
  >();

  const shouldPersist =
    options.persistState !== false;
  let isInitialized = false;

  function initPlugins(): void {
    if (isInitialized) return;

    for (const plugin of options.plugins) {
      try {
        const context = createPluginContext(
          plugin,
          {
            events: eventBus,
            state,
            config: options.config,
            onRegisterView: (name, component) =>
              pluginViews.set(name, component),
          },
        );

        registry.register(plugin);
        plugin.install(context);
      } catch (error) {
        console.error(
          `[dev-panel] Plugin "${plugin.name}" failed to install:`,
          error,
        );
        eventBus.emit('plugin:error', {
          pluginName: plugin.name,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    isInitialized = true;

    // Активируем сохраненный плагин или первый по умолчанию
    const allPlugins = registry.getAll();
    if (allPlugins.length > 0) {
      let savedPlugin: string | null = null;
      if (
        shouldPersist &&
        typeof window !== 'undefined'
      ) {
        try {
          savedPlugin = localStorage.getItem(
            STORAGE_KEY_ACTIVE_PLUGIN,
          );
        } catch {
          /* empty */
        }
      }
      const matched =
        savedPlugin &&
        allPlugins.some(
          (p) => p.name === savedPlugin,
        );
      state.activePlugin = matched
        ? savedPlugin
        : allPlugins[0].name;
    }
  }

  async function authenticate(): Promise<boolean> {
    // 1. Попытка восстановить сессию
    const existingSession = options.session.get();
    if (existingSession) {
      // Валидация, если адаптер поддерживает
      if (options.auth.validateSession) {
        const isValid =
          await options.auth.validateSession(
            existingSession,
          );
        if (isValid) {
          state.session = existingSession;
          state.isAuthenticated = true;
          eventBus.emit(
            'auth:success',
            existingSession,
          );
          return true;
        }
        // Сессия невалидна — очищаем
        options.session.clear();
      } else {
        state.session = existingSession;
        state.isAuthenticated = true;
        eventBus.emit(
          'auth:success',
          existingSession,
        );
        return true;
      }
    }

    // 2. Попытка restoreSession через auth adapter
    const restoredSession =
      await options.auth.restoreSession();
    if (restoredSession) {
      state.session = restoredSession;
      state.isAuthenticated = true;
      options.session.save(restoredSession);
      eventBus.emit(
        'auth:success',
        restoredSession,
      );
      return true;
    }

    // 3. Автоматическая авторизация (без UI)
    if (!options.auth.requiresInteraction) {
      try {
        const result =
          await options.auth.authenticate();
        if (result.success && result.session) {
          state.session = result.session;
          state.isAuthenticated = true;
          options.session.save(result.session);
          eventBus.emit(
            'auth:success',
            result.session,
          );
          return true;
        }
      } catch {
        // Автоматическая авторизация не удалась
      }
      eventBus.emit('auth:failure');
      return false;
    }

    // 4. Нужна интерактивная авторизация — UI-слой покажет модал
    return false;
  }

  async function open(): Promise<void> {
    if (state.isOpen) return;

    state.isLoading = true;
    state.error = null;

    try {
      const isAuthed = await authenticate();

      if (
        !isAuthed &&
        options.auth.requiresInteraction
      ) {
        // UI-слой должен показать auth модал
        // PanelManager устанавливает состояние, UI реагирует
        state.isLoading = false;
        state.isOpen = true; // открываем панель в режиме auth
        eventBus.emit('panel:open');
        return;
      }

      if (!isAuthed) {
        state.isLoading = false;
        state.error = {
          code: 'AUTH_FAILED',
          message: 'Authentication failed',
          source: 'auth',
        };
        return;
      }

      initPlugins();
      state.isOpen = true;
      state.isLoading = false;

      if (
        shouldPersist &&
        typeof window !== 'undefined'
      ) {
        try {
          localStorage.setItem(
            STORAGE_KEY_PANEL_OPEN,
            'true',
          );
        } catch {
          /* empty */
        }
      }

      eventBus.emit('panel:open');
      eventBus.emit('panel:ready');

      // Lifecycle hooks
      for (const plugin of registry.getAll()) {
        try {
          plugin.onPanelOpen?.();
        } catch (error) {
          console.error(
            `[dev-panel] Plugin "${plugin.name}" onPanelOpen error:`,
            error,
          );
        }
      }
    } catch (error) {
      state.isLoading = false;
      state.error = {
        code: 'OPEN_FAILED',
        message:
          error instanceof Error
            ? error.message
            : String(error),
        source: 'core',
      };
    }
  }

  function close(): void {
    if (!state.isOpen) return;

    // Lifecycle hooks
    for (const plugin of registry.getAll()) {
      try {
        plugin.onPanelClose?.();
      } catch (error) {
        console.error(
          `[dev-panel] Plugin "${plugin.name}" onPanelClose error:`,
          error,
        );
      }
    }

    state.isOpen = false;
    if (
      shouldPersist &&
      typeof window !== 'undefined'
    ) {
      try {
        localStorage.setItem(
          STORAGE_KEY_PANEL_OPEN,
          'false',
        );
      } catch {
        /* empty */
      }
    }
    eventBus.emit('panel:close');
  }

  async function toggle(): Promise<void> {
    if (state.isOpen) {
      close();
    } else {
      await open();
    }
  }

  function destroy(): void {
    close();

    // Уничтожаем плагины
    for (const plugin of registry.getAll()) {
      registry.unregister(plugin.name);
    }

    // Уничтожаем триггер
    options.trigger.destroy();

    // Очищаем состояние
    state.isAuthenticated = false;
    state.session = null;
    state.activePlugin = null;
    state.error = null;
  }

  // Инициализация триггера
  options.trigger.init({
    requestOpen: () => open(),
    isOpen: () => state.isOpen,
  });

  // Автоматическое восстановление состояния при перезагрузке страницы
  if (typeof window !== 'undefined') {
    const savedOpen = shouldPersist
      ? localStorage.getItem(
          STORAGE_KEY_PANEL_OPEN,
        )
      : null;
    const shouldAutoOpen =
      savedOpen === 'true' ||
      options.initialState === 'open';

    if (shouldAutoOpen) {
      setTimeout(() => {
        open().catch((err) => {
          console.warn(
            '[dev-panel] Failed to auto-restore open state:',
            err,
          );
        });
      }, 0);
    }
  }

  async function submitAuth(
    credentials?: Record<string, unknown>,
  ): Promise<boolean> {
    state.isLoading = true;
    state.error = null;

    try {
      const result =
        await options.auth.authenticate(
          credentials,
        );

      if (result.success && result.session) {
        state.session = result.session;
        state.isAuthenticated = true;
        options.session.save(result.session);
        eventBus.emit(
          'auth:success',
          result.session,
        );

        // Теперь инициализируем плагины
        initPlugins();
        state.isLoading = false;
        eventBus.emit('panel:ready');

        // Lifecycle hooks
        for (const plugin of registry.getAll()) {
          try {
            plugin.onPanelOpen?.();
          } catch (error) {
            console.error(
              `[dev-panel] Plugin "${plugin.name}" onPanelOpen error:`,
              error,
            );
          }
        }

        return true;
      }

      state.isLoading = false;
      state.error = {
        code: 'AUTH_FAILED',
        message:
          result.error || 'Authentication failed',
        source: 'auth',
      };
      eventBus.emit('auth:failure');
      return false;
    } catch (error) {
      state.isLoading = false;
      state.error = {
        code: 'AUTH_ERROR',
        message:
          error instanceof Error
            ? error.message
            : String(error),
        source: 'auth',
      };
      eventBus.emit('auth:failure');
      return false;
    }
  }

  return {
    open,
    close,
    toggle,
    isOpen: () => state.isOpen,
    destroy,
    submitAuth,
    getState: () => state,
    getEventBus: () => eventBus,
    getRegistry: () => registry,
    getPluginViews: () => pluginViews,
    getConfig: () => options.config,
  };
}
