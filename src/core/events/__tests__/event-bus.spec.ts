import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../event-bus';

describe('EventBus', () => {
  it('вызывает handler при emit', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on('panel:open', handler);
    bus.emit('panel:open', { test: true });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      test: true,
    });
  });

  it('поддерживает несколько handler на одно событие', () => {
    const bus = createEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('panel:open', handler1);
    bus.on('panel:open', handler2);
    bus.emit('panel:open');

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('off — handler больше не вызывается', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on('panel:close', handler);
    bus.off('panel:close', handler);
    bus.emit('panel:close');

    expect(handler).not.toHaveBeenCalled();
  });

  it('emit без подписчиков — не падает', () => {
    const bus = createEventBus();

    expect(() =>
      bus.emit('panel:open'),
    ).not.toThrow();
  });

  it('ошибка в handler не ломает другие', () => {
    const bus = createEventBus();
    const errorHandler = vi.fn(() => {
      throw new Error('fail');
    });
    const normalHandler = vi.fn();

    bus.on('panel:open', errorHandler);
    bus.on('panel:open', normalHandler);
    bus.emit('panel:open');

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(normalHandler).toHaveBeenCalledOnce();
  });

  it('не добавляет дубликат одного handler', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on('panel:open', handler);
    bus.on('panel:open', handler);
    bus.emit('panel:open');

    expect(handler).toHaveBeenCalledOnce();
  });

  it('off несуществующего handler — не падает', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    expect(() =>
      bus.off('panel:open', handler),
    ).not.toThrow();
  });

  it('разные события не пересекаются', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on('panel:open', handler);
    bus.emit('panel:close');

    expect(handler).not.toHaveBeenCalled();
  });
});
