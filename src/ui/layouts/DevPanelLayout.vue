<script setup lang="ts">
import {
  computed,
  inject,
  ref,
  onMounted,
  onUnmounted,
} from 'vue';
import DevPanelModal from '../components/DevPanelModal.vue';
import AuthModal from '../components/AuthModal.vue';
import SidebarNav from '../components/SidebarNav.vue';
import PluginErrorBoundary from '../components/PluginErrorBoundary.vue';
import type { DevPanelPlugin } from '@/types';
import type { PanelManager } from '@/core/panel/panel-manager';
import type { Component } from 'vue';

defineOptions({
  name: 'DevPanelLayout',
});

const manager = inject<PanelManager>(
  'dev-panel-manager',
);

if (!manager) {
  throw new Error(
    '[dev-panel] PanelManager not provided',
  );
}

const state = manager.getState();
const registry = manager.getRegistry();
const pluginViews = manager.getPluginViews();
const eventBus = manager.getEventBus();

const plugins = ref<DevPanelPlugin[]>([]);
const updatePluginsList = () => {
  plugins.value = registry.getAll();
};

onMounted(() => {
  updatePluginsList();
  eventBus.on(
    'plugin:registered',
    updatePluginsList,
  );
});

onUnmounted(() => {
  eventBus.off(
    'plugin:registered',
    updatePluginsList,
  );
});

const activeComponent =
  computed<Component | null>(() => {
    if (!state.activePlugin) return null;
    return (
      pluginViews.get(state.activePlugin) || null
    );
  });

const appVersion = computed(() => {
  try {
    const buildInfo = manager
      .getConfig()
      ?.getBuildInfo();
    return (buildInfo?.version as string) || '';
  } catch {
    return '';
  }
});

const handleClose = () => {
  manager.close();
};

const handleAuthSuccess = async () => {
  await manager.submitAuth();
};

const selectPlugin = (name: string) => {
  state.activePlugin = name;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        'dev_panel_active_plugin',
        name,
      );
    } catch {
      /* empty */
    }
  }
};
</script>

<template>
  <DevPanelModal
    :is-open="state.isOpen"
    @close="handleClose">
    <template v-if="!state.isAuthenticated">
      <AuthModal
        :is-loading="state.isLoading"
        @success="handleAuthSuccess" />
    </template>

    <template v-else-if="state.isLoading">
      <div class="dp-loading">
        <div class="dp-spinner" />
        <span>Loading Dev Panel...</span>
      </div>
    </template>

    <template v-else-if="state.error">
      <div class="dp-error-screen">
        <div class="dp-error-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <circle
              cx="12"
              cy="12"
              r="10" />
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="12" />
            <line
              x1="12"
              y1="16"
              x2="12.01"
              y2="16" />
          </svg>
        </div>
        <div class="dp-error-code">
          {{ state.error.code }}
        </div>
        <div class="dp-error-msg">
          {{ state.error.message }}
        </div>
      </div>
    </template>

    <template v-else>
      <div class="dp-layout-container">
        <SidebarNav
          :plugins="plugins"
          :active-plugin="state.activePlugin"
          :version="appVersion"
          @select="selectPlugin" />

        <main class="dp-content-area">
          <div
            v-if="!activeComponent"
            class="dp-empty-state">
            <div class="dp-empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2" />
                <line
                  x1="3"
                  y1="9"
                  x2="21"
                  y2="9" />
                <line
                  x1="9"
                  y1="21"
                  x2="9"
                  y2="9" />
              </svg>
            </div>
            <p>
              Select a plugin from the sidebar
            </p>
          </div>
          <PluginErrorBoundary
            v-else
            :plugin-name="
              state.activePlugin || 'unknown'
            ">
            <component :is="activeComponent" />
          </PluginErrorBoundary>
        </main>
      </div>
    </template>
  </DevPanelModal>
</template>

<style scoped>
.dp-loading,
.dp-empty-state,
.dp-error-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--dp-text-secondary);
  gap: 12px;
  padding: 32px;
  text-align: center;
}

.dp-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--dp-border);
  border-top-color: var(--dp-accent);
  border-radius: 50%;
  animation: dp-spin 0.8s linear infinite;
}

@keyframes dp-spin {
  to {
    transform: rotate(360deg);
  }
}

.dp-empty-icon,
.dp-error-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dp-empty-icon svg {
  width: 40px;
  height: 40px;
  color: var(--dp-text-muted);
}

.dp-error-icon svg {
  width: 40px;
  height: 40px;
  color: var(--dp-error);
}

.dp-error-screen {
  color: var(--dp-error);
}

.dp-error-code {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.5px;
}

.dp-error-msg {
  color: var(--dp-text-secondary);
  font-size: 13px;
  max-width: 400px;
}

.dp-layout-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.dp-content-area {
  flex: 1;
  background-color: var(--dp-bg-primary);
  overflow: auto;
  position: relative;
}
</style>
