import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { registerDevTrigger } from '../index';

describe('registerDevTrigger', () => {
  beforeEach(() => {
    vi.spyOn(document, 'addEventListener');
    vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('регистрирует keydown listener', () => {
    const destroy = registerDevTrigger(() => {});

    expect(
      document.addEventListener,
    ).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
    destroy();
  });

  it('не регистрирует listener при enabled: false', () => {
    registerDevTrigger({
      enabled: false,
      callback: () => {},
    });

    expect(
      document.addEventListener,
    ).not.toHaveBeenCalled();
  });

  it('вызывает callback при нажатии shortcut', () => {
    const callback = vi.fn();
    const destroy = registerDevTrigger(callback);

    const event = new KeyboardEvent('keydown', {
      key: 'D',
      ctrlKey: true,
      altKey: true,
    });
    document.dispatchEvent(event);

    expect(callback).toHaveBeenCalledOnce();
    destroy();
  });

  it('не вызывает callback при неправильном сочетании', () => {
    const callback = vi.fn();
    const destroy = registerDevTrigger(callback);

    const event = new KeyboardEvent('keydown', {
      key: 'D',
      ctrlKey: false,
      shiftKey: true,
    });
    document.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
    destroy();
  });

  it('кастомный shortcut работает', () => {
    const callback = vi.fn();
    const destroy = registerDevTrigger({
      shortcut: 'ALT_P',
      callback,
    });

    const event = new KeyboardEvent('keydown', {
      key: 'P',
      altKey: true,
    });
    document.dispatchEvent(event);

    expect(callback).toHaveBeenCalledOnce();
    destroy();
  });

  it('destroy снимает listener', () => {
    const callback = vi.fn();
    const destroy = registerDevTrigger(callback);
    destroy();

    const event = new KeyboardEvent('keydown', {
      key: 'D',
      ctrlKey: true,
      altKey: true,
    });
    document.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });
});
