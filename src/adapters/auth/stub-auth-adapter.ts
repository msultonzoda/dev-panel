import type {
  AuthAdapter,
  AuthResult,
  AuthSession,
} from '@/types';

export class StubAuthAdapter implements AuthAdapter {
  readonly requiresInteraction = true;

  async authenticate(): Promise<AuthResult> {
    return {
      success: true,
      session: {
        token: 'dev-token',
        user: {
          name: 'Developer',
          role: 'admin',
        },
      },
    };
  }

  async restoreSession(): Promise<AuthSession | null> {
    return null;
  }

  async logout(): Promise<void> {
    // nothing to do
  }
}
