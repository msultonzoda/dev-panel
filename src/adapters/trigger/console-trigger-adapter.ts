import type { TriggerAdapter, TriggerCallbacks } from '@/types';

export interface ConsoleTriggerOptions {
  /**
   * Имя функции в глобальном объекте window.
   * По умолчанию: 'dev'
   */
  commandName?: string;

  /**
   * SHA-256 хэш секретного слова (hex-строка из 64 символов).
   * Если задан, введенный пароль хэшируется через SHA-256 и сравнивается с этим хэшем.
   */
  secretHash?: string;

  /**
   * Секретный токен в открытом виде (если не используется secretHash).
   */
  secretToken?: string;

  /**
   * Сообщение об успешном открытии в консоли.
   */
  successMessage?: string;
}

export async function computeSha256(text: string): Promise<string> {
  const cryptoObj =
    typeof crypto !== 'undefined' && crypto.subtle
      ? crypto
      : typeof globalThis !== 'undefined' && globalThis.crypto?.subtle
        ? globalThis.crypto
        : null;

  if (cryptoObj?.subtle) {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return text;
}

export class ConsoleTriggerAdapter implements TriggerAdapter {
  private readonly commandName: string;
  private readonly secretHash?: string;
  private readonly secretToken?: string;
  private readonly successMessage: string;

  constructor(options: ConsoleTriggerOptions = {}) {
    this.commandName = options.commandName ?? 'dev';
    this.secretHash = options.secretHash?.toLowerCase().trim();
    this.secretToken = options.secretToken;
    this.successMessage = options.successMessage ?? '🚀 Dev Panel opened';
  }

  init(callbacks: TriggerCallbacks): void {
    if (typeof window === 'undefined') return;

    const execute = async (input?: string) => {
      const provided = input !== undefined && input !== null ? String(input) : '';

      // 1. Проверка по SHA-256 хэшу
      if (this.secretHash) {
        const inputHash = await computeSha256(provided);
        if (inputHash !== this.secretHash) {
          console.warn(
            '%c[DevPanel] ❌ Доступ запрещен: неверный пароль',
            'color: #ef4444; font-weight: bold;',
          );
          return '❌ Invalid secret';
        }
      } else if (this.secretToken) {
        // 2. Проверка по открытому токену
        if (provided !== this.secretToken) {
          console.warn(
            '%c[DevPanel] ❌ Доступ запрещен: неверный токен',
            'color: #ef4444; font-weight: bold;',
          );
          return '❌ Invalid secret';
        }
      }

      await callbacks.requestOpen();
      console.log(
        `%c[DevPanel] ${this.successMessage}`,
        'color: #10b981; font-weight: bold;',
      );
      return this.successMessage;
    };

    (window as unknown as Record<string, unknown>)[this.commandName] = execute;
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>)[this.commandName];
    }
  }
}
