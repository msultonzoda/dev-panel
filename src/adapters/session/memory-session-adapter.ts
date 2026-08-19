import type {
  SessionAdapter,
  AuthSession,
} from '@/types';

export class MemorySessionAdapter implements SessionAdapter {
  private session: AuthSession | null = null;

  save(session: AuthSession): void {
    this.session = { ...session };
  }

  get(): AuthSession | null {
    return this.session
      ? { ...this.session }
      : null;
  }

  clear(): void {
    this.session = null;
  }
}
