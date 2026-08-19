import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from 'vitest';
import {
  getActiveDevEnv,
  getDevEnv,
  DEFAULT_ENV_STORAGE_KEY,
} from '../helpers';
import { useEnvSwitcher } from '../useEnvSwitcher';
import type {
  EnvPreset,
  EnvSwitcherOptions,
} from '../types';
import type { PluginContext } from '@/types';

describe('EnvSwitcher helpers & useEnvSwitcher composable', () => {
  const samplePresets: EnvPreset[] = [
    {
      id: 'dev',
      name: 'Development',
      variables: {
        VITE_API_URL:
          'https://api-dev.example.com',
        VITE_MODE: 'development',
      },
    },
    {
      id: 'prod',
      name: 'Production',
      isProduction: true,
      variables: {
        VITE_API_URL: 'https://api.example.com',
        VITE_MODE: 'production',
      },
    },
  ];

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vi.restoreAllMocks();
  });

  it('reads active dev env from localStorage', () => {
    expect(getActiveDevEnv()).toBeNull();

    localStorage.setItem(
      DEFAULT_ENV_STORAGE_KEY,
      JSON.stringify(samplePresets[0]),
    );
    const active = getActiveDevEnv();
    expect(active?.id).toBe('dev');
    expect(active?.variables.VITE_API_URL).toBe(
      'https://api-dev.example.com',
    );
  });

  it('getDevEnv returns overridden variable or fallback', () => {
    expect(
      getDevEnv(
        'VITE_API_URL',
        'https://fallback.com',
      ),
    ).toBe('https://fallback.com');

    localStorage.setItem(
      DEFAULT_ENV_STORAGE_KEY,
      JSON.stringify(samplePresets[1]),
    );
    expect(
      getDevEnv(
        'VITE_API_URL',
        'https://fallback.com',
      ),
    ).toBe('https://api.example.com');
  });

  it('useEnvSwitcher selects and applies environments', () => {
    const emitMock = vi.fn();
    const contextMock = {
      events: {
        emit: emitMock,
        on: vi.fn(),
        off: vi.fn(),
      },
    } as unknown as PluginContext;

    const onEnvChangeMock = vi.fn();
    const options: EnvSwitcherOptions = {
      environments: samplePresets,
      defaultEnvId: 'dev',
      autoReload: false,
      onEnvChange: onEnvChangeMock,
    };

    const {
      selectedEnv,
      selectEnv,
      applyEnv,
      isCurrentlyApplied,
      autoReload,
      setAutoReload,
    } = useEnvSwitcher(options, contextMock);

    // Initial state
    expect(selectedEnv.value?.id).toBe('dev');

    // Switch to prod
    selectEnv(samplePresets[1]);
    expect(selectedEnv.value?.id).toBe('prod');
    expect(isCurrentlyApplied.value).toBe(false);

    // Apply
    applyEnv(false);

    expect(isCurrentlyApplied.value).toBe(true);
    expect(onEnvChangeMock).toHaveBeenCalledWith(
      samplePresets[1],
    );
    expect(emitMock).toHaveBeenCalledWith(
      'env:changed',
      {
        envId: 'prod',
        name: 'Production',
        isProduction: true,
        variables: samplePresets[1].variables,
      },
    );
    expect(
      localStorage.getItem(
        'dev_env_VITE_API_URL',
      ),
    ).toBe('https://api.example.com');

    // Auto-reload setting
    expect(autoReload.value).toBe(false);
    setAutoReload(true);
    expect(autoReload.value).toBe(true);
  });
});
