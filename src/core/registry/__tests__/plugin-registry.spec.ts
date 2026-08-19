import { describe, it, expect, vi } from 'vitest';
import {
  createPluginRegistry,
  CORE_API_VERSION,
} from '../plugin-registry';
import { createEventBus } from '../../events/event-bus';
import type { DevPanelPlugin } from '@/types';

function createMockPlugin(
  overrides: Partial<DevPanelPlugin> = {},
): DevPanelPlugin {
  return {
    name: 'test-plugin',
    version: '1.0.0',
    apiVersion: CORE_API_VERSION,
    install: vi.fn(),
    ...overrides,
  };
}

describe('PluginRegistry', () => {
  it('регистрирует плагин', () => {
    const registry = createPluginRegistry(
      createEventBus(),
    );
    const plugin = createMockPlugin();

    registry.register(plugin);

    expect(
      registry.getPlugin('test-plugin'),
    ).toBe(plugin);
  });

  it('getAll возвращает все зарегистрированные плагины', () => {
    const registry = createPluginRegistry(
      createEventBus(),
    );
    const plugin1 = createMockPlugin({
      name: 'a',
    });
    const plugin2 = createMockPlugin({
      name: 'b',
    });

    registry.register(plugin1);
    registry.register(plugin2);

    expect(registry.getAll()).toHaveLength(2);
  });

  it('getAll сортирует по order', () => {
    const registry = createPluginRegistry(
      createEventBus(),
    );
    const pluginA = createMockPlugin({
      name: 'a',
      order: 200,
    });
    const pluginB = createMockPlugin({
      name: 'b',
      order: 50,
    });
    const pluginC = createMockPlugin({
      name: 'c',
    }); // default 100

    registry.register(pluginA);
    registry.register(pluginB);
    registry.register(pluginC);

    const names = registry
      .getAll()
      .map((p) => p.name);
    expect(names).toEqual(['b', 'c', 'a']);
  });

  it('не регистрирует дубликат по имени', () => {
    const registry = createPluginRegistry(
      createEventBus(),
    );
    const plugin1 = createMockPlugin();
    const plugin2 = createMockPlugin();

    registry.register(plugin1);
    registry.register(plugin2);

    expect(registry.getAll()).toHaveLength(1);
  });

  it('не регистрирует плагин с несовместимой apiVersion', () => {
    const eventBus = createEventBus();
    const errorHandler = vi.fn();
    eventBus.on('plugin:error', errorHandler);

    const registry =
      createPluginRegistry(eventBus);
    const plugin = createMockPlugin({
      apiVersion: '2.0.0',
    });

    registry.register(plugin);

    expect(
      registry.getPlugin('test-plugin'),
    ).toBeUndefined();
    expect(errorHandler).toHaveBeenCalledOnce();
  });

  it('emit plugin:registered при успешной регистрации', () => {
    const eventBus = createEventBus();
    const handler = vi.fn();
    eventBus.on('plugin:registered', handler);

    const registry =
      createPluginRegistry(eventBus);
    registry.register(createMockPlugin());

    expect(handler).toHaveBeenCalledWith({
      pluginName: 'test-plugin',
    });
  });

  it('unregister удаляет плагин и вызывает destroy', () => {
    const registry = createPluginRegistry(
      createEventBus(),
    );
    const destroy = vi.fn();
    const plugin = createMockPlugin({ destroy });

    registry.register(plugin);
    registry.unregister('test-plugin');

    expect(
      registry.getPlugin('test-plugin'),
    ).toBeUndefined();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('unregister несуществующего плагина — не падает', () => {
    const registry = createPluginRegistry(
      createEventBus(),
    );

    expect(() =>
      registry.unregister('nope'),
    ).not.toThrow();
  });
});
