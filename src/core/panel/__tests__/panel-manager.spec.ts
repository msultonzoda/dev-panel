import { describe, it, expect, vi } from 'vitest';
import { createPanelManager } from '../panel-manager';
import type {
  DevPanelOptions,
  TriggerAdapter,
  AuthAdapter,
  SessionAdapter,
  ConfigAdapter,
  DevPanelPlugin,
} from '@/types';

function createMockTrigger(): TriggerAdapter {
  return {
    init: vi.fn(),
    destroy: vi.fn(),
  };
}

function createMockAuth(
  overrides: Partial<AuthAdapter> = {},
): AuthAdapter {
  return {
    authenticate: vi.fn().mockResolvedValue({
      success: true,
      session: { token: 'test' },
    }),
    restoreSession: vi
      .fn()
      .mockResolvedValue(null),
    logout: vi.fn().mockResolvedValue(undefined),
    requiresInteraction: false,
    ...overrides,
  };
}

function createMockSession(
  stored: unknown = null,
): SessionAdapter {
  let data = stored;
  return {
    save: vi.fn((s) => {
      data = s;
    }),
    get: vi.fn(
      () => data,
    ) as SessionAdapter['get'],
    clear: vi.fn(() => {
      data = null;
    }),
  };
}

function createMockConfig(): ConfigAdapter {
  return {
    getEnvironment: () => 'test',
    getBuildInfo: () => ({ version: '1.0.0' }),
    getRuntimeConfig: () => ({}),
  };
}

function createMockPlugin(
  overrides: Partial<DevPanelPlugin> = {},
): DevPanelPlugin {
  return {
    name: 'test-plugin',
    version: '1.0.0',
    apiVersion: '1.0.0',
    install: vi.fn(),
    ...overrides,
  };
}

function createOptions(
  overrides: Partial<DevPanelOptions> = {},
): DevPanelOptions {
  return {
    trigger: createMockTrigger(),
    auth: createMockAuth(),
    session: createMockSession(),
    config: createMockConfig(),
    plugins: [],
    ...overrides,
  };
}

describe('PanelManager', () => {
  it('инициализирует trigger при создании', () => {
    const trigger = createMockTrigger();
    createPanelManager(
      createOptions({ trigger }),
    );

    expect(trigger.init).toHaveBeenCalledOnce();
  });

  it('open — открывает панель', async () => {
    const manager = createPanelManager(
      createOptions(),
    );

    await manager.open();

    expect(manager.isOpen()).toBe(true);
  });

  it('close — закрывает панель', async () => {
    const manager = createPanelManager(
      createOptions(),
    );

    await manager.open();
    manager.close();

    expect(manager.isOpen()).toBe(false);
  });

  it('toggle — переключает состояние', async () => {
    const manager = createPanelManager(
      createOptions(),
    );

    await manager.toggle();
    expect(manager.isOpen()).toBe(true);

    await manager.toggle();
    expect(manager.isOpen()).toBe(false);
  });

  it('auth flow: автоматическая авторизация', async () => {
    const auth = createMockAuth({
      requiresInteraction: false,
    });
    const session = createMockSession();
    const manager = createPanelManager(
      createOptions({ auth, session }),
    );

    await manager.open();

    expect(auth.authenticate).toHaveBeenCalled();
    expect(session.save).toHaveBeenCalled();
    expect(
      manager.getState().isAuthenticated,
    ).toBe(true);
  });

  it('auth flow: восстановление сессии из storage', async () => {
    const session = createMockSession({
      token: 'saved-token',
    });
    const auth = createMockAuth();
    const manager = createPanelManager(
      createOptions({ auth, session }),
    );

    await manager.open();

    expect(
      auth.authenticate,
    ).not.toHaveBeenCalled();
    expect(
      manager.getState().isAuthenticated,
    ).toBe(true);
  });

  it('auth flow: requiresInteraction — открывает панель без auth', async () => {
    const auth = createMockAuth({
      requiresInteraction: true,
      restoreSession: vi
        .fn()
        .mockResolvedValue(null),
    });
    const session = createMockSession();
    const manager = createPanelManager(
      createOptions({ auth, session }),
    );

    await manager.open();

    expect(manager.isOpen()).toBe(true);
    expect(
      manager.getState().isAuthenticated,
    ).toBe(false);
  });

  it('plugin lifecycle: install вызывается при open', async () => {
    const plugin = createMockPlugin();
    const manager = createPanelManager(
      createOptions({ plugins: [plugin] }),
    );

    await manager.open();

    expect(plugin.install).toHaveBeenCalledOnce();
  });

  it('plugin lifecycle: onPanelOpen/onPanelClose вызываются', async () => {
    const onPanelOpen = vi.fn();
    const onPanelClose = vi.fn();
    const plugin = createMockPlugin({
      onPanelOpen,
      onPanelClose,
    });
    const manager = createPanelManager(
      createOptions({ plugins: [plugin] }),
    );

    await manager.open();
    expect(onPanelOpen).toHaveBeenCalledOnce();

    manager.close();
    expect(onPanelClose).toHaveBeenCalledOnce();
  });

  it('ошибка в plugin.install не ломает панель', async () => {
    const badPlugin = createMockPlugin({
      name: 'bad',
      install: () => {
        throw new Error('fail');
      },
    });
    const goodPlugin = createMockPlugin({
      name: 'good',
    });
    const manager = createPanelManager(
      createOptions({
        plugins: [badPlugin, goodPlugin],
      }),
    );

    await manager.open();

    expect(manager.isOpen()).toBe(true);
    expect(
      goodPlugin.install,
    ).toHaveBeenCalledOnce();
  });

  it('destroy — очищает всё', async () => {
    const trigger = createMockTrigger();
    const plugin = createMockPlugin({
      destroy: vi.fn(),
    });
    const manager = createPanelManager(
      createOptions({
        trigger,
        plugins: [plugin],
      }),
    );

    await manager.open();
    manager.destroy();

    expect(manager.isOpen()).toBe(false);
    expect(
      trigger.destroy,
    ).toHaveBeenCalledOnce();
    expect(plugin.destroy).toHaveBeenCalledOnce();
  });
});
