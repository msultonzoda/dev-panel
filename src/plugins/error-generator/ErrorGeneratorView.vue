<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import type { PluginContext } from '@/types';

defineOptions({
  name: 'ErrorGeneratorView',
});

defineProps<{
  context: PluginContext;
}>();

type ErrorType = 'sync' | 'async' | 'promise';

const errorType = ref<ErrorType>('sync');
const errorMessage = ref(
  'Test Synchronous Error from DevPanel',
);

watch(errorType, (newType) => {
  if (newType === 'sync') {
    errorMessage.value =
      'Test Synchronous Error from DevPanel';
  } else if (newType === 'async') {
    errorMessage.value =
      'Test Asynchronous Error from DevPanel';
  } else if (newType === 'promise') {
    errorMessage.value =
      'Test Unhandled Promise Rejection from DevPanel';
  }
});

const generateBtnRef =
  ref<HTMLButtonElement | null>(null);

const handleNativeClick = () => {
  const msg = errorMessage.value;
  if (errorType.value === 'sync') {
    throw new Error(msg);
  } else if (errorType.value === 'async') {
    setTimeout(() => {
      throw new Error(msg);
    }, 100);
  } else if (errorType.value === 'promise') {
    Promise.reject(new Error(msg));
  }
};

onMounted(() => {
  generateBtnRef.value?.addEventListener(
    'click',
    handleNativeClick,
  );
});

onBeforeUnmount(() => {
  generateBtnRef.value?.removeEventListener(
    'click',
    handleNativeClick,
  );
});
</script>

<template>
  <div class="dp-plugin-container">
    <div
      class="dp-view-header"
      style="padding: 12px 16px">
      <div class="dp-header-text">
        <h2 class="dp-plugin-title">
          Error Generator
        </h2>
        <p class="dp-plugin-desc">
          Generate errors to test error tracking
          systems like Sentry
        </p>
      </div>
    </div>

    <div class="dp-section">
      <div class="dp-settings-group">
        <div
          class="dp-setting-item"
          style="
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          ">
          <div
            class="dp-setting-info"
            style="width: 100%">
            <h3 class="dp-setting-title">
              Error Type
            </h3>
            <p class="dp-setting-desc">
              Select the type of error to
              generate.
            </p>
          </div>
          <select
            v-model="errorType"
            class="dp-input"
            style="width: 100%; cursor: pointer">
            <option value="sync">
              Synchronous Error
            </option>
            <option value="async">
              Asynchronous Error
            </option>
            <option value="promise">
              Unhandled Promise Rejection
            </option>
          </select>
        </div>

        <div
          class="dp-setting-item"
          style="
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          ">
          <div
            class="dp-setting-info"
            style="width: 100%">
            <h3 class="dp-setting-title">
              Custom Error Message
            </h3>
            <p class="dp-setting-desc">
              Type a custom message for the error.
            </p>
          </div>
          <input
            v-model="errorMessage"
            type="text"
            class="dp-input"
            style="width: 100%"
            placeholder="Error text..." />
        </div>

        <button
          ref="generateBtnRef"
          type="button"
          class="dp-btn-primary dp-btn-danger"
          style="
            width: 100%;
            padding: 12px;
            margin-top: 8px;
            justify-content: center;
            font-size: 14px;
          ">
          Generate Error
        </button>
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
  background-color: var(
    --dp-bg-tertiary,
    #1f1f2e
  );
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
.dp-input {
  background-color: var(
    --dp-bg-secondary,
    #1a1a24
  );
  color: var(--dp-text-primary, #fff);
  border: 1px solid var(--dp-border, #2d2d3d);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  min-width: 200px;
  width: 60%;
}
.dp-input:focus {
  border-color: var(--dp-primary-main, #3b82f6);
}
select.dp-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 36px;
}
.dp-btn-danger {
  padding: 6px 10px;
  border-radius: 6px;
  background-color: var(--dp-error-main, #ef4444);
  color: white;
  border: none;
}
.dp-btn-danger:hover {
  background-color: var(
    --dp-error-hover,
    #dc2626
  );
}
</style>
