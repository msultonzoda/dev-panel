<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

defineOptions({
  name: 'PluginErrorBoundary',
});

defineProps<{
  pluginName: string;
}>();

const error = ref<Error | null>(null);

onErrorCaptured((err: unknown) => {
  error.value =
    err instanceof Error
      ? err
      : new Error(String(err));
  return false; // Prevent error from propagating further
});

const retry = () => {
  error.value = null;
};
</script>

<template>
  <div
    v-if="error"
    class="dp-error-boundary">
    <div class="dp-error-card">
      <div class="dp-error-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round">
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
      </div>
      <div class="dp-error-title">
        Plugin Error
      </div>
      <div class="dp-error-desc">
        Plugin
        <strong>"{{ pluginName }}"</strong>
        encountered an error while rendering.
      </div>
      <div class="dp-error-message">
        {{ error.message }}
      </div>
      <button
        class="dp-retry-btn"
        @click="retry">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path
            d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        <span>Retry Plugin</span>
      </button>
    </div>
  </div>
  <slot v-else />
</template>

<style scoped>
.dp-error-boundary {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.dp-error-card {
  max-width: 420px;
  padding: 28px;
  background-color: var(--dp-error-bg);
  border: 1px solid var(--dp-error);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 8px 24px rgba(244, 63, 94, 0.15);
}

.dp-error-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: rgba(244, 63, 94, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dp-error);
  margin-bottom: 12px;
}

.dp-error-icon svg {
  width: 24px;
  height: 24px;
}

.dp-error-title {
  font-weight: 700;
  font-size: 16px;
  color: var(--dp-error);
  margin-bottom: 6px;
}

.dp-error-desc {
  font-size: 13px;
  color: var(--dp-text-secondary);
  margin-bottom: 16px;
}

.dp-error-desc strong {
  color: var(--dp-text-primary);
}

.dp-error-message {
  width: 100%;
  padding: 10px 14px;
  background-color: var(--dp-bg-primary);
  border: 1px solid var(--dp-border);
  border-radius: 6px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
  font-size: 12px;
  color: var(--dp-error);
  margin-bottom: 18px;
  word-break: break-all;
  text-align: left;
}

.dp-retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 6px;
  color: var(--dp-text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
}

.dp-retry-btn svg {
  width: 14px;
  height: 14px;
}

.dp-retry-btn:hover {
  background-color: var(--dp-bg-hover);
  border-color: var(--dp-border-focus);
  color: var(--dp-accent);
}
</style>
