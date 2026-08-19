<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PluginContext } from '@/types';
import type {
  EnvPreset,
  EnvSwitcherOptions,
} from './types';
import {
  DEFAULT_ENV_STORAGE_KEY,
  getActiveDevEnv,
} from './helpers';

defineOptions({
  name: 'EnvSwitcherView',
});

const props = defineProps<{
  context: PluginContext;
  options: EnvSwitcherOptions;
}>();

const storageKey =
  props.options.storageKey ||
  DEFAULT_ENV_STORAGE_KEY;
const environments = ref<EnvPreset[]>(
  props.options.environments || [],
);
const selectedId = ref<string>('');
const savedAppliedId = ref<string>('');
const showSuccessAlert = ref(false);

const selectedEnv = computed(() => {
  return (
    environments.value.find(
      (e) => e.id === selectedId.value,
    ) ||
    environments.value[0] ||
    null
  );
});

const isCurrentlyApplied = computed(() => {
  return (
    selectedEnv.value?.id === savedAppliedId.value
  );
});

onMounted(() => {
  const saved = getActiveDevEnv(storageKey);
  if (
    saved &&
    environments.value.some(
      (e) => e.id === saved.id,
    )
  ) {
    selectedId.value = saved.id;
    savedAppliedId.value = saved.id;
  } else if (props.options.defaultEnvId) {
    selectedId.value = props.options.defaultEnvId;
    savedAppliedId.value =
      props.options.defaultEnvId;
  } else if (
    environments.value.length > 0 &&
    environments.value[0]
  ) {
    selectedId.value = environments.value[0].id;
    savedAppliedId.value =
      environments.value[0].id;
  }
});

const selectEnv = (env: EnvPreset) => {
  selectedId.value = env.id;
};

const applyEnv = (reload: boolean = true) => {
  const env = selectedEnv.value;
  if (!env) return;

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      storageKey,
      JSON.stringify(env),
    );
    Object.entries(env.variables).forEach(
      ([k, v]) => {
        localStorage.setItem(`dev_env_${k}`, v);
      },
    );
  }

  savedAppliedId.value = env.id;

  if (props.options.onEnvChange) {
    props.options.onEnvChange(env);
  }

  props.context.events.emit('env:changed', {
    envId: env.id,
    name: env.name,
    isProduction: !!env.isProduction,
    variables: env.variables,
  });

  showSuccessAlert.value = true;
  setTimeout(() => {
    showSuccessAlert.value = false;
  }, 2500);

  if (reload && typeof window !== 'undefined') {
    window.location.reload();
  }
};
</script>

<template>
  <div class="dp-plugin-container">
    <!-- View Header -->
    <div class="dp-view-header">
      <div>
        <h2 class="dp-plugin-title">
          Environment Switcher
        </h2>
        <p class="dp-plugin-desc">
          Switch runtime environments and API
          endpoints without rebuilding
        </p>
      </div>

      <div
        v-if="selectedEnv"
        class="dp-current-badge"
        :class="{
          'dp-is-prod': selectedEnv.isProduction,
        }"
      >
        <span class="dp-indicator-dot" />
        <span>
          {{
            isCurrentlyApplied
              ? 'Active: ' + selectedEnv.name
              : 'Selected (Not Applied)'
          }}
        </span>
      </div>
    </div>

    <!-- Segmented Control (Tabs) -->
    <div class="dp-segmented-control">
      <button
        v-for="env in environments"
        :key="env.id"
        type="button"
        class="dp-segment-btn"
        :class="{
          'dp-segment-active':
            selectedId === env.id,
          'dp-segment-prod': env.isProduction,
        }"
        @click="selectEnv(env)"
      >
        <span
          class="dp-segment-indicator"
          :class="{
            'dp-ind-prod': env.isProduction,
            'dp-ind-dev': !env.isProduction,
          }"
        />
        <span class="dp-segment-name">
          {{ env.name }}
        </span>
        <span
          v-if="savedAppliedId === env.id"
          class="dp-segment-tag-active"
        >
          ACTIVE
        </span>
      </button>
    </div>

    <!-- Production Warning Banner -->
    <div
      v-if="selectedEnv?.isProduction"
      class="dp-prod-warning"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        />
        <line
          x1="12"
          y1="9"
          x2="12"
          y2="13"
        />
        <line
          x1="12"
          y1="17"
          x2="12.01"
          y2="17"
        />
      </svg>
      <div>
        <strong>
          Warning: Production Environment Selected
        </strong>
        <p>
          Your client requests will be directed to
          live Production servers.
        </p>
      </div>
    </div>

    <!-- Success Feedback Alert -->
    <div
      v-if="showSuccessAlert"
      class="dp-success-alert"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>
        Environment
        <strong>{{ selectedEnv?.name }}</strong>
        applied & saved!
      </span>
    </div>

    <!-- Single Detailed Environment Card -->
    <div
      v-if="selectedEnv"
      class="dp-detail-card"
      :class="{
        'dp-detail-prod':
          selectedEnv.isProduction,
      }"
    >
      <div class="dp-card-header">
        <div class="dp-card-header-left">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="dp-detail-icon"
          >
            <rect
              x="2"
              y="3"
              width="20"
              height="14"
              rx="2"
              ry="2"
            />
            <line
              x1="8"
              y1="21"
              x2="16"
              y2="21"
            />
            <line
              x1="12"
              y1="17"
              x2="12"
              y2="21"
            />
          </svg>
          <span class="dp-card-title">
            {{ selectedEnv.name }}
            Configuration
          </span>
        </div>

        <span
          v-if="selectedEnv.isProduction"
          class="dp-badge-prod"
        >
          PRODUCTION
        </span>
        <span
          v-else
          class="dp-badge-dev"
        >
          DEVELOPMENT
        </span>
      </div>

      <p
        v-if="selectedEnv.description"
        class="dp-detail-desc"
      >
        {{ selectedEnv.description }}
      </p>

      <!-- Variables Table for Selected Environment -->
      <div class="dp-vars-section">
        <div class="dp-vars-header">
          <span>Environment Variables</span>
          <span class="dp-vars-count">
            {{
              Object.keys(selectedEnv.variables)
                .length
            }}
            variables
          </span>
        </div>

        <div class="dp-vars-table">
          <div
            v-for="(
              val, key
            ) in selectedEnv.variables"
            :key="key"
            class="dp-var-row"
          >
            <span class="dp-var-key">{{
              key
            }}</span>
            <span class="dp-var-val">{{
              val
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons Footer -->
    <div class="dp-actions-footer">
      <button
        type="button"
        class="dp-btn dp-btn-primary"
        title="Apply selected environment and reload application"
        @click="applyEnv(true)"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="23 4 23 10 17 10" />
          <path
            d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"
          />
        </svg>
        <span>Apply & Reload App</span>
      </button>

      <button
        type="button"
        class="dp-btn dp-btn-secondary"
        title="Apply selected environment without page reload"
        @click="applyEnv(false)"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
          />
          <polyline
            points="17 21 17 13 7 13 7 21"
          />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        <span>Apply (No Reload)</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dp-plugin-container {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

.dp-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--dp-border-subtle);
}

.dp-plugin-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dp-text-primary);
  letter-spacing: -0.3px;
  margin: 0;
}

.dp-plugin-desc {
  font-size: 12px;
  color: var(--dp-text-secondary);
  margin: 3px 0 0 0;
}

.dp-current-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dp-accent);
}

.dp-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--dp-success);
  box-shadow: 0 0 8px var(--dp-success);
}

.dp-current-badge.dp-is-prod {
  border-color: var(--dp-error);
  color: var(--dp-error);
}

.dp-current-badge.dp-is-prod .dp-indicator-dot {
  background-color: var(--dp-error);
  box-shadow: 0 0 8px var(--dp-error);
}

/* Segmented Control Bar */
.dp-segmented-control {
  display: flex;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 12px;
  padding: 4px;
  gap: 6px;
}

.dp-segment-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--dp-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.dp-segment-btn:hover {
  color: var(--dp-text-primary);
  background-color: var(--dp-bg-hover);
}

.dp-segment-btn.dp-segment-active {
  background-color: var(--dp-bg-card, #1e293b);
  color: var(--dp-text-primary);
  border-color: var(--dp-border-focus);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--dp-border-focus);
}

.dp-segment-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dp-ind-dev {
  background-color: var(--dp-success);
  box-shadow: 0 0 6px var(--dp-success);
}

.dp-ind-prod {
  background-color: var(--dp-error);
  box-shadow: 0 0 6px var(--dp-error);
}

.dp-segment-tag-active {
  background-color: rgba(99, 102, 241, 0.15);
  color: var(--dp-accent);
  border: 1px solid var(--dp-accent);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Production Warning */
.dp-prod-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--dp-error-bg);
  border: 1px solid var(--dp-error);
  border-radius: 10px;
  color: var(--dp-error);
}

.dp-prod-warning svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.dp-prod-warning strong {
  display: block;
  font-size: 13px;
  margin-bottom: 2px;
}

.dp-prod-warning p {
  margin: 0;
  color: var(--dp-text-secondary);
  font-size: 12px;
}

/* Success Alert */
.dp-success-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background-color: rgba(16, 185, 129, 0.15);
  border: 1px solid var(--dp-success);
  border-radius: 8px;
  color: var(--dp-success);
  font-size: 13px;
}

.dp-success-alert svg {
  width: 16px;
  height: 16px;
}

/* Detailed Environment Card */
.dp-detail-card {
  background-color: var(
    --dp-bg-card,
    var(--dp-bg-secondary)
  );
  border: 1px solid var(--dp-border);
  border-radius: 14px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transition: all 0.24s ease;
}

.dp-detail-card.dp-detail-prod {
  border-color: rgba(244, 63, 94, 0.4);
}

.dp-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dp-card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dp-detail-icon {
  width: 18px;
  height: 18px;
  color: var(--dp-accent);
}

.dp-card-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--dp-text-primary);
}

.dp-badge-prod {
  background: var(--dp-error-bg);
  color: var(--dp-error);
  border: 1px solid var(--dp-error);
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.dp-badge-dev {
  background: rgba(16, 185, 129, 0.15);
  color: var(--dp-success);
  border: 1px solid var(--dp-success);
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.dp-detail-desc {
  margin: 0;
  font-size: 13px;
  color: var(--dp-text-secondary);
  line-height: 1.4;
}

.dp-vars-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dp-vars-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--dp-text-secondary);
}

.dp-vars-count {
  font-size: 11px;
  color: var(--dp-text-muted);
}

.dp-vars-table {
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border-subtle);
  border-radius: 10px;
  overflow: hidden;
}

.dp-var-row {
  display: flex;
  padding: 8px 14px;
  border-bottom: 1px solid var(--dp-border-subtle);
  font-size: 12px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
}

.dp-var-row:last-child {
  border-bottom: none;
}

.dp-var-key {
  width: 170px;
  color: var(--dp-accent);
  font-weight: 600;
  flex-shrink: 0;
}

.dp-var-val {
  color: var(--dp-text-primary);
  word-break: break-all;
}

/* Action Buttons Footer */
.dp-actions-footer {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.dp-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
  border: none;
}

.dp-btn svg {
  width: 15px;
  height: 15px;
}

.dp-btn-primary {
  background-color: var(--dp-accent);
  color: white;
  box-shadow: 0 4px 12px var(--dp-accent-glow);
}

.dp-btn-primary:hover {
  background-color: var(--dp-accent-hover);
  transform: translateY(-1px);
}

.dp-btn-secondary {
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  color: var(--dp-text-primary);
}

.dp-btn-secondary:hover {
  background-color: var(--dp-bg-hover);
  border-color: var(--dp-border-focus);
}
</style>
