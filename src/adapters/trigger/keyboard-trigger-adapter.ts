import type {
  TriggerAdapter,
  TriggerCallbacks,
} from '@/types';

interface KeyboardTriggerOptions {
  shortcut?: string;
}

function parseShortcut(shortcut: string): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
} {
  const parts = shortcut.toUpperCase().split('_');
  return {
    ctrl: parts.includes('CTRL'),
    shift: parts.includes('SHIFT'),
    alt: parts.includes('ALT'),
    key:
      parts.filter(
        (p) =>
          !['CTRL', 'SHIFT', 'ALT'].includes(p),
      )[0] || '',
  };
}

export class KeyboardTriggerAdapter implements TriggerAdapter {
  private readonly shortcut: string;
  private handler:
    ((event: KeyboardEvent) => void) | null =
    null;

  constructor(
    options: KeyboardTriggerOptions = {},
  ) {
    this.shortcut =
      options.shortcut ?? 'CTRL_ALT_D';
  }

  init(callbacks: TriggerCallbacks): void {
    const parsed = parseShortcut(this.shortcut);

    this.handler = (
      event: KeyboardEvent,
    ): void => {
      if (
        event.ctrlKey === parsed.ctrl &&
        event.shiftKey === parsed.shift &&
        event.altKey === parsed.alt &&
        event.key.toUpperCase() === parsed.key
      ) {
        event.preventDefault();
        callbacks.requestOpen();
      }
    };

    document.addEventListener(
      'keydown',
      this.handler,
    );
  }

  destroy(): void {
    if (this.handler) {
      document.removeEventListener(
        'keydown',
        this.handler,
      );
      this.handler = null;
    }
  }
}
