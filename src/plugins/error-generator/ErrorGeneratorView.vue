<script setup lang="ts">
import type { PluginContext } from '@/types';

defineOptions({
  name: 'ErrorGeneratorView',
});

defineProps<{
  context: PluginContext;
}>();

const throwSyncError = () => {
  throw new Error('Test Synchronous Error from DevPanel');
};

const throwAsyncError = () => {
  setTimeout(() => {
    throw new Error('Test Asynchronous Error from DevPanel');
  }, 100);
};

const throwUnhandledPromise = () => {
  Promise.reject(
    new Error('Test Unhandled Promise Rejection from DevPanel'),
  );
};
</script>

<template>
  <div class="dp-plugin-container">
    <div class="dp-view-header">
      <div class="dp-header-text">
        <h2 class="dp-plugin-title">Error Generator</h2>
        <p class="dp-plugin-desc">
          Generate errors to test error tracking systems like Sentry
        </p>
      </div>
    </div>

    <div class="dp-section">
      <div class="dp-settings-group">
        <div class="dp-setting-item">
          <div class="dp-setting-info">
            <h3 class="dp-setting-title">Synchronous Error</h3>
            <p class="dp-setting-desc">Throws a standard JS Error immediately.</p>
          </div>
          <button type="button" class="dp-btn-primary dp-btn-danger" @click="throwSyncError">
            Throw Error
          </button>
        </div>

        <div class="dp-setting-item">
          <div class="dp-setting-info">
            <h3 class="dp-setting-title">Asynchronous Error</h3>
            <p class="dp-setting-desc">Throws an error inside a setTimeout.</p>
          </div>
          <button type="button" class="dp-btn-primary dp-btn-danger" @click="throwAsyncError">
            Throw Error
          </button>
        </div>

        <div class="dp-setting-item">
          <div class="dp-setting-info">
            <h3 class="dp-setting-title">Unhandled Promise Rejection</h3>
            <p class="dp-setting-desc">Rejects a Promise without a catch block.</p>
          </div>
          <button type="button" class="dp-btn-primary dp-btn-danger" @click="throwUnhandledPromise">
            Reject Promise
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dp-section {
  padding: 16px;
}
.dp-settings-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dp-setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--dp-bg-tertiary, #1f1f2e);
  border-radius: 8px;
  border: 1px solid var(--dp-border, #2d2d3d);
}
.dp-setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dp-setting-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--dp-text-primary, #fff);
}
.dp-setting-desc {
  margin: 0;
  font-size: 12px;
  color: var(--dp-text-secondary, #94a3b8);
}
.dp-btn-danger {
  background-color: var(--dp-error-main, #ef4444);
  color: white;
  border: none;
}
.dp-btn-danger:hover {
  background-color: var(--dp-error-hover, #dc2626);
}
</style>
