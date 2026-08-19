import {
  ref,
  computed,
  onMounted,
  getCurrentInstance,
} from 'vue';
import type { PluginContext } from '@/types';
import type {
  EnvPreset,
  EnvSwitcherOptions,
} from './types';
import {
  DEFAULT_ENV_STORAGE_KEY,
  getActiveDevEnv,
} from './helpers';

export const RELOAD_PREF_STORAGE_KEY =
  'dev_panel_env_auto_reload';

export function useEnvSwitcher(
  options: EnvSwitcherOptions,
  context?: PluginContext,
) {
  const storageKey =
    options.storageKey || DEFAULT_ENV_STORAGE_KEY;
  const environments = ref<EnvPreset[]>(
    options.environments || [],
  );
  const selectedId = ref<string>('');
  const savedAppliedId = ref<string>('');
  const autoReload = ref<boolean>(
    options.autoReload !== false,
  );
  const showSuccessAlert = ref<boolean>(false);
  const showVariables = ref<boolean>(false);

  const selectedEnv = computed<EnvPreset | null>(
    () => {
      return (
        environments.value.find(
          (e) => e.id === selectedId.value,
        ) ||
        environments.value[0] ||
        null
      );
    },
  );

  const activeEnv = computed<EnvPreset | null>(
    () => {
      return (
        environments.value.find(
          (e) => e.id === savedAppliedId.value,
        ) || null
      );
    },
  );

  const isCurrentlyApplied = computed<boolean>(
    () => {
      return (
        !!selectedEnv.value &&
        selectedEnv.value.id ===
          savedAppliedId.value
      );
    },
  );

  const selectEnv = (env: EnvPreset) => {
    selectedId.value = env.id;
  };

  const toggleVariables = () => {
    showVariables.value = !showVariables.value;
  };

  const setAutoReload = (val: boolean) => {
    autoReload.value = val;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          RELOAD_PREF_STORAGE_KEY,
          String(val),
        );
      } catch {
        /* empty */
      }
    }
  };

  const applyEnv = (forceReload?: boolean) => {
    const env = selectedEnv.value;
    if (!env) return;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(env),
        );
        Object.entries(env.variables).forEach(
          ([k, v]) => {
            localStorage.setItem(
              `dev_env_${k}`,
              v,
            );
          },
        );
      } catch {
        /* empty */
      }
    }

    savedAppliedId.value = env.id;

    if (options.onEnvChange) {
      options.onEnvChange(env);
    }

    if (context) {
      context.events.emit('env:changed', {
        envId: env.id,
        name: env.name,
        isProduction: !!env.isProduction,
        variables: env.variables,
      });
    }

    showSuccessAlert.value = true;
    setTimeout(() => {
      showSuccessAlert.value = false;
    }, 2000);

    const shouldReload =
      forceReload !== undefined
        ? forceReload
        : autoReload.value;
    if (
      shouldReload &&
      typeof window !== 'undefined'
    ) {
      window.location.reload();
    }
  };

  const init = () => {
    if (typeof window !== 'undefined') {
      const savedReloadPref =
        localStorage.getItem(
          RELOAD_PREF_STORAGE_KEY,
        );
      if (savedReloadPref !== null) {
        autoReload.value =
          savedReloadPref === 'true';
      }
    }

    const saved = getActiveDevEnv(storageKey);
    if (
      saved &&
      environments.value.some(
        (e) => e.id === saved.id,
      )
    ) {
      selectedId.value = saved.id;
      savedAppliedId.value = saved.id;
    } else if (options.defaultEnvId) {
      selectedId.value = options.defaultEnvId;
      savedAppliedId.value = options.defaultEnvId;
    } else if (
      environments.value.length > 0 &&
      environments.value[0]
    ) {
      selectedId.value = environments.value[0].id;
      savedAppliedId.value =
        environments.value[0].id;
    }
  };

  if (getCurrentInstance()) {
    onMounted(init);
  } else {
    init();
  }

  return {
    environments,
    selectedId,
    savedAppliedId,
    autoReload,
    showSuccessAlert,
    showVariables,
    selectedEnv,
    activeEnv,
    isCurrentlyApplied,
    selectEnv,
    toggleVariables,
    setAutoReload,
    applyEnv,
  };
}
