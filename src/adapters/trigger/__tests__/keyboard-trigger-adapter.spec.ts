import {
  describe,
  it,
  expect,
  vi,
  afterEach,
} from 'vitest';
import { KeyboardTriggerAdapter } from '../keyboard-trigger-adapter';
import type { TriggerCallbacks } from '@/types';

function createMockCallbacks(): TriggerCallbacks {
  return {
    requestOpen: vi
      .fn()
      .mockResolvedValue(undefined),
    isOpen: vi.fn().mockReturnValue(false),
  };
}

describe('KeyboardTriggerAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('регистрирует listener при init', () => {
    vi.spyOn(document, 'addEventListener');
    const adapter = new KeyboardTriggerAdapter();
    adapter.init(createMockCallbacks());

    expect(
      document.addEventListener,
    ).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
    adapter.destroy();
  });

  it('вызывает requestOpen при shortcut', () => {
    const callbacks = createMockCallbacks();
    const adapter = new KeyboardTriggerAdapter();
    adapter.init(callbacks);

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        ctrlKey: true,
        altKey: true,
        key: 'D',
      }),
    );

    expect(
      callbacks.requestOpen,
    ).toHaveBeenCalledOnce();
    adapter.destroy();
  });

  it('поддерживает кастомный shortcut', () => {
    const callbacks = createMockCallbacks();
    const adapter = new KeyboardTriggerAdapter({
      shortcut: 'CTRL_ALT_X',
    });
    adapter.init(callbacks);

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'X',
        ctrlKey: true,
        altKey: true,
      }),
    );

    expect(
      callbacks.requestOpen,
    ).toHaveBeenCalledOnce();
    adapter.destroy();
  });

  it('destroy снимает listener', () => {
    vi.spyOn(document, 'removeEventListener');
    const adapter = new KeyboardTriggerAdapter();
    adapter.init(createMockCallbacks());
    adapter.destroy();

    expect(
      document.removeEventListener,
    ).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
  });
});
