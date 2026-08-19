import type {
  DevPanelEvent,
  EventBus,
} from '@/types';

type Handler<T = unknown> = (payload: T) => void;

export function createEventBus(): EventBus {
  const handlers = new Map<
    DevPanelEvent,
    Set<Handler>
  >();

  function on<T = unknown>(
    event: DevPanelEvent,
    handler: Handler<T>,
  ): void {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)!.add(handler as Handler);
  }

  function off<T = unknown>(
    event: DevPanelEvent,
    handler: Handler<T>,
  ): void {
    handlers
      .get(event)
      ?.delete(handler as Handler);
  }

  function emit<T = unknown>(
    event: DevPanelEvent,
    payload?: T,
  ): void {
    handlers.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(
          `[dev-panel] Error in event handler for "${event}":`,
          error,
        );
      }
    });
  }

  return { on, off, emit };
}
