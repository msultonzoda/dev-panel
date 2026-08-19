import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  afterEach,
} from 'vitest';
import { MemorySessionAdapter } from '../memory-session-adapter';
import { LocalStorageSessionAdapter } from '../local-storage-session-adapter';
import type { AuthSession } from '@/types';

const testSession: AuthSession = {
  token: 'test-token',
  user: { id: 1, name: 'Dev' },
};

describe('MemorySessionAdapter', () => {
  it('возвращает null если сессия не сохранена', () => {
    const adapter = new MemorySessionAdapter();
    expect(adapter.get()).toBeNull();
  });

  it('сохраняет и возвращает сессию', () => {
    const adapter = new MemorySessionAdapter();
    adapter.save(testSession);
    expect(adapter.get()).toEqual(testSession);
  });

  it('очищает сессию', () => {
    const adapter = new MemorySessionAdapter();
    adapter.save(testSession);
    adapter.clear();
    expect(adapter.get()).toBeNull();
  });

  it('возвращает копию сессии, чтобы предотвратить мутации', () => {
    const adapter = new MemorySessionAdapter();
    adapter.save(testSession);

    const retrieved = adapter.get()!;
    retrieved.token = 'mutated';

    expect(adapter.get()?.token).toBe(
      'test-token',
    );
  });
});

describe('LocalStorageSessionAdapter', () => {
  const KEY = 'test_session_key';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('возвращает null если сессия не сохранена', () => {
    const adapter =
      new LocalStorageSessionAdapter({
        key: KEY,
      });
    expect(adapter.get()).toBeNull();
  });

  it('сохраняет и возвращает сессию', () => {
    const adapter =
      new LocalStorageSessionAdapter({
        key: KEY,
      });
    adapter.save(testSession);

    expect(localStorage.getItem(KEY)).toBe(
      JSON.stringify(testSession),
    );
    expect(adapter.get()).toEqual(testSession);
  });

  it('очищает сессию', () => {
    const adapter =
      new LocalStorageSessionAdapter({
        key: KEY,
      });
    adapter.save(testSession);
    adapter.clear();

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(adapter.get()).toBeNull();
  });

  it('возвращает null если в localStorage невалидный JSON', () => {
    const adapter =
      new LocalStorageSessionAdapter({
        key: KEY,
      });
    localStorage.setItem(KEY, 'not-json');

    expect(adapter.get()).toBeNull();
  });

  it('возвращает null если структура JSON некорректна', () => {
    const adapter =
      new LocalStorageSessionAdapter({
        key: KEY,
      });
    localStorage.setItem(
      KEY,
      JSON.stringify({ someKey: 'value' }),
    ); // нет token

    expect(adapter.get()).toBeNull();
  });

  it('не падает, если localStorage недоступен (throws exception)', () => {
    const adapter =
      new LocalStorageSessionAdapter({
        key: KEY,
      });

    vi.spyOn(
      Storage.prototype,
      'setItem',
    ).mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    expect(() =>
      adapter.save(testSession),
    ).not.toThrow();
  });
});
