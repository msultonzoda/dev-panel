type TriggerCallback = () => void | Promise<void>;

interface TriggerOptions {
  enabled?: boolean;
  shortcut?: string;
  callback: TriggerCallback;
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

function matchesShortcut(
  event: KeyboardEvent,
  parsed: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    key: string;
  },
): boolean {
  return (
    event.ctrlKey === parsed.ctrl &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.key.toUpperCase() === parsed.key
  );
}

export function registerDevTrigger(
  optionsOrCallback:
    TriggerOptions | TriggerCallback,
): () => void {
  const options: TriggerOptions =
    typeof optionsOrCallback === 'function'
      ? { callback: optionsOrCallback }
      : optionsOrCallback;

  const {
    enabled = true,
    shortcut = 'CTRL_ALT_D',
    callback,
  } = options;

  if (!enabled) {
    return () => {}; // noop destroy
  }

  const parsed = parseShortcut(shortcut);

  const handler = (
    event: KeyboardEvent,
  ): void => {
    if (matchesShortcut(event, parsed)) {
      event.preventDefault();
      callback();
    }
  };

  document.addEventListener('keydown', handler);

  // Возвращает destroy-функцию
  return () => {
    document.removeEventListener(
      'keydown',
      handler,
    );
  };
}
