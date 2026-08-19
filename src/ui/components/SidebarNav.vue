<script setup lang="ts">
import type { DevPanelPlugin } from '@/types';

defineOptions({
  name: 'SidebarNav',
});

defineProps<{
  plugins: DevPanelPlugin[];
  activePlugin: string | null;
  version?: string;
}>();

defineEmits<{
  (e: 'select', pluginName: string): void;
}>();

const getInitials = (name: string) => {
  return name.slice(0, 2).toUpperCase();
};
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <nav
    class="dp-sidebar"
    aria-label="Plugins Navigation"
  >
    <div class="dp-nav-list">
      <div
        v-for="plugin in plugins"
        :key="plugin.name"
        class="dp-nav-item"
        :class="{
          'dp-nav-active':
            activePlugin === plugin.name,
        }"
        tabindex="0"
        role="button"
        :aria-label="plugin.name"
        @click="$emit('select', plugin.name)"
        @keydown.enter="
          $emit('select', plugin.name)
        "
      >
        <div class="dp-nav-icon">
          <template v-if="plugin.icon">
            <span
              class="dp-svg-wrapper"
              v-html="plugin.icon"
            />
          </template>
          <template v-else>
            <span class="dp-nav-initials">{{
              getInitials(plugin.name)
            }}</span>
          </template>
        </div>

        <!-- Tooltip on hover -->
        <div class="dp-nav-tooltip">
          {{ plugin.name }}
        </div>
      </div>
    </div>

    <!-- Version badge in footer -->
    <div
      v-if="version"
      class="dp-sidebar-footer"
      :title="'App Version: ' + version"
    >
      <span class="dp-version-text">{{
        version.startsWith('v')
          ? version
          : 'v' + version
      }}</span>
    </div>
  </nav>
</template>

<style scoped>
.dp-sidebar {
  width: 64px;
  background-color: var(--dp-bg-sidebar);
  border-right: 1px solid var(--dp-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px 0;
  gap: 12px;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  backdrop-filter: var(--dp-backdrop-blur);
  -webkit-backdrop-filter: var(
    --dp-backdrop-blur
  );
}

.dp-nav-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.dp-nav-item {
  width: 44px;
  height: 44px;
  border-radius: var(--dp-radius-item, 10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--dp-text-secondary);
  background: transparent;
  transition: all 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  user-select: none;
  outline: none;
}

.dp-nav-item:hover {
  background-color: var(--dp-bg-hover);
  color: var(--dp-text-primary);
  transform: translateY(-1px);
}

.dp-nav-item:focus-visible {
  box-shadow: 0 0 0 2px var(--dp-border-focus);
}

.dp-nav-item.dp-nav-active {
  background-color: var(--dp-bg-active);
  color: var(--dp-accent);
  box-shadow:
    0 0 0 1px var(--dp-border-focus),
    0 4px 12px var(--dp-accent-glow);
}

.dp-nav-item.dp-nav-active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background-color: var(--dp-accent);
}

.dp-nav-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.dp-svg-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dp-svg-wrapper :deep(svg) {
  width: 20px;
  height: 20px;
  display: block;
}

.dp-nav-initials {
  letter-spacing: -0.5px;
}

/* Floating Tooltip */
.dp-nav-tooltip {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%) translateX(-4px)
    scale(0.95);
  background: var(--dp-bg-tooltip, #1e293b);
  color: var(--dp-text-primary);
  font-size: 12px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: all 0.15s
    cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--dp-border);
  z-index: 100;
}

.dp-nav-tooltip::after {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 4px solid transparent;
  border-right-color: var(--dp-border);
}

.dp-nav-item:hover .dp-nav-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0)
    scale(1);
}

/* Footer Version */
.dp-sidebar-footer {
  margin-top: auto;
  padding: 3px 6px;
  border-radius: 6px;
  background: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  max-width: 52px;
}

.dp-version-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--dp-text-muted);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
  letter-spacing: -0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
