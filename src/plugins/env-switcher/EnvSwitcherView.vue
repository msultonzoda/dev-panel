<script setup lang="ts">
import type { PluginContext } from '@/types';
import type { EnvSwitcherOptions } from './types';
import { useEnvSwitcher } from './useEnvSwitcher';

defineOptions({
  name: 'EnvSwitcherView',
});

const props = defineProps<{
  context: PluginContext;
  options: EnvSwitcherOptions;
}>();

const {
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
} = useEnvSwitcher(props.options, props.context);
</script>

<template>
  <div class="dp-env-container">
    <!-- Header -->
    <div class="dp-header-row">
      <div class="dp-header-text">
        <h2 class="dp-view-title">Environment</h2>
        <p class="dp-view-desc">
          Switch runtime API endpoints and presets
        </p>
      </div>

      <div
        v-if="activeEnv"
        class="dp-active-badge"
        :class="{
          'dp-is-prod': activeEnv.isProduction,
        }">
        <span class="dp-pulse-dot" />
        <span class="dp-active-name">{{
          activeEnv.name
        }}</span>
      </div>
    </div>

    <!-- Success Toast -->
    <div
      v-if="showSuccessAlert"
      class="dp-toast">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>
        Environment
        <strong>{{ selectedEnv?.name }}</strong>
        applied
      </span>
    </div>

    <!-- Environment Cards List -->
    <div class="dp-env-list">
      <div
        v-for="env in environments"
        :key="env.id"
        class="dp-env-card"
        :class="{
          'dp-card-selected':
            selectedId === env.id,
          'dp-card-applied':
            savedAppliedId === env.id,
          'dp-card-prod': env.isProduction,
        }"
        @click="selectEnv(env)">
        <!-- Radio Circle -->
        <div
          class="dp-radio"
          :class="{
            'dp-radio-active':
              selectedId === env.id,
          }">
          <div class="dp-radio-dot" />
        </div>

        <!-- Info -->
        <div class="dp-card-content">
          <div class="dp-card-top">
            <span class="dp-env-name">{{
              env.name
            }}</span>
            <div class="dp-badges">
              <span
                v-if="savedAppliedId === env.id"
                class="dp-badge-active"
                >ACTIVE</span
              >
              <span
                v-if="env.isProduction"
                class="dp-badge-prod"
                >PROD</span
              >
              <span
                v-else
                class="dp-badge-dev"
                >DEV</span
              >
            </div>
          </div>
          <p
            v-if="env.description"
            class="dp-env-desc">
            {{ env.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Production Note -->
    <div
      v-if="selectedEnv?.isProduction"
      class="dp-prod-note">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2">
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line
          x1="12"
          y1="9"
          x2="12"
          y2="13" />
        <line
          x1="12"
          y1="17"
          x2="12.01"
          y2="17" />
      </svg>
      <span
        >Production selected: requests will target
        live servers.</span
      >
    </div>

    <!-- Variables Accordion -->
    <div
      v-if="
        selectedEnv &&
        Object.keys(selectedEnv.variables)
          .length > 0
      "
      class="dp-vars-accordion">
      <button
        type="button"
        class="dp-vars-toggle-btn"
        @click="toggleVariables">
        <div class="dp-vars-toggle-left">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="dp-chevron"
            :class="{
              'dp-chevron-open': showVariables,
            }">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span>Variables preview</span>
        </div>
        <span class="dp-vars-count"
          >{{
            Object.keys(selectedEnv.variables)
              .length
          }}
          keys</span
        >
      </button>

      <div
        v-if="showVariables"
        class="dp-vars-content">
        <div
          v-for="(
            val, key
          ) in selectedEnv.variables"
          :key="key"
          class="dp-var-row">
          <span class="dp-var-key">{{
            key
          }}</span>
          <span class="dp-var-val">{{
            val
          }}</span>
        </div>
      </div>
    </div>

    <!-- Sticky Footer Actions -->
    <div class="dp-footer">
      <label class="dp-reload-toggle">
        <input
          type="checkbox"
          :checked="autoReload"
          class="dp-checkbox"
          @change="
            setAutoReload(
              ($event.target as HTMLInputElement)
                .checked,
            )
          " />
        <span>Reload page on apply</span>
      </label>

      <button
        type="button"
        class="dp-btn-primary"
        :class="{
          'dp-btn-applied': isCurrentlyApplied,
        }"
        @click="applyEnv()">
        <svg
          v-if="!isCurrentlyApplied"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{
          isCurrentlyApplied
            ? 'Currently Active'
            : autoReload
              ? 'Apply & Reload'
              : 'Apply Environment'
        }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dp-env-container {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.dp-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--dp-border-subtle);
}

.dp-view-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--dp-text-primary);
  margin: 0;
  letter-spacing: -0.2px;
}

.dp-view-desc {
  font-size: 11px;
  color: var(--dp-text-secondary);
  margin: 2px 0 0 0;
}

.dp-active-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--dp-text-primary);
}

.dp-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--dp-success);
  box-shadow: 0 0 6px var(--dp-success);
}

.dp-active-badge.dp-is-prod .dp-pulse-dot {
  background-color: var(--dp-error);
  box-shadow: 0 0 6px var(--dp-error);
}

.dp-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(16, 185, 129, 0.12);
  border: 1px solid var(--dp-success);
  border-radius: 8px;
  color: var(--dp-success);
  font-size: 12px;
  font-weight: 600;
}

.dp-toast svg {
  width: 15px;
  height: 15px;
}

.dp-env-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dp-env-card {
  background-color: var(
    --dp-bg-card,
    var(--dp-bg-secondary)
  );
  border: 1px solid var(--dp-border);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.16s
    cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}

.dp-env-card:hover {
  background-color: var(--dp-bg-hover);
  border-color: var(--dp-border-focus);
}

.dp-env-card.dp-card-selected {
  background-color: var(--dp-bg-active);
  border-color: var(--dp-border-focus);
  box-shadow:
    0 0 0 1px var(--dp-border-focus),
    0 2px 8px var(--dp-accent-glow);
}

.dp-env-card.dp-card-selected.dp-card-prod {
  border-color: rgba(244, 63, 94, 0.5);
  box-shadow:
    0 0 0 1px rgba(244, 63, 94, 0.4),
    0 2px 8px rgba(244, 63, 94, 0.15);
}

.dp-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--dp-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: var(--dp-bg-secondary);
  transition: all 0.15s;
}

.dp-radio.dp-radio-active {
  border-color: var(--dp-accent);
}

.dp-card-prod .dp-radio.dp-radio-active {
  border-color: var(--dp-error);
}

.dp-radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: transparent;
  transition: all 0.15s;
}

.dp-radio.dp-radio-active .dp-radio-dot {
  background-color: var(--dp-accent);
}

.dp-card-prod
  .dp-radio.dp-radio-active
  .dp-radio-dot {
  background-color: var(--dp-error);
}

.dp-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dp-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dp-env-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dp-text-primary);
}

.dp-env-desc {
  font-size: 11px;
  color: var(--dp-text-secondary);
  margin: 0;
  line-height: 1.3;
}

.dp-badges {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dp-badge-active {
  background-color: rgba(99, 102, 241, 0.18);
  color: var(--dp-accent);
  border: 1px solid var(--dp-accent);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.dp-badge-dev {
  background-color: rgba(16, 185, 129, 0.14);
  color: var(--dp-success);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
}

.dp-badge-prod {
  background-color: var(--dp-error-bg);
  color: var(--dp-error);
  border: 1px solid var(--dp-error);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
}

.dp-prod-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background-color: var(--dp-error-bg);
  border: 1px solid rgba(244, 63, 94, 0.3);
  border-radius: 6px;
  color: var(--dp-error);
  font-size: 11px;
}

.dp-prod-note svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.dp-vars-accordion {
  border: 1px solid var(--dp-border-subtle);
  border-radius: 8px;
  background-color: var(--dp-bg-secondary);
  overflow: hidden;
}

.dp-vars-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--dp-text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.dp-vars-toggle-btn:hover {
  color: var(--dp-text-primary);
  background-color: var(--dp-bg-hover);
}

.dp-vars-toggle-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dp-chevron {
  width: 13px;
  height: 13px;
  transition: transform 0.2s ease;
}

.dp-chevron-open {
  transform: rotate(180deg);
}

.dp-vars-count {
  font-size: 10px;
  color: var(--dp-text-muted);
}

.dp-vars-content {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--dp-border-subtle);
  max-height: 140px;
  overflow-y: auto;
}

.dp-var-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  border-bottom: 1px solid var(--dp-border-subtle);
  font-size: 11px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
}

.dp-var-row:last-child {
  border-bottom: none;
}

.dp-var-key {
  color: var(--dp-accent);
  font-weight: 600;
}

.dp-var-val {
  color: var(--dp-text-secondary);
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--dp-border-subtle);
}

.dp-reload-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--dp-text-secondary);
  cursor: pointer;
  user-select: none;
}

.dp-checkbox {
  accent-color: var(--dp-accent);
  cursor: pointer;
}

.dp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  background-color: var(--dp-accent);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--dp-accent-glow);
  transition: all 0.16s ease;
}

.dp-btn-primary:hover {
  background-color: var(--dp-accent-hover);
  transform: translateY(-1px);
}

.dp-btn-primary.dp-btn-applied {
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  color: var(--dp-text-muted);
  box-shadow: none;
  cursor: default;
  transform: none;
}

.dp-btn-primary svg {
  width: 14px;
  height: 14px;
}
</style>
