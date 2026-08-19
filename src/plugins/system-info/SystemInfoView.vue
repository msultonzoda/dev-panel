<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { PluginContext } from '@/types';

defineOptions({
  name: 'SystemInfoView',
});

const props = defineProps<{
  context: PluginContext;
}>();

const buildInfo = computed(() =>
  props.context.config.getBuildInfo(),
);
const copied = ref(false);
const storageItemsCount = ref(0);
const memoryUsage = ref<{
  used: string;
  total: string;
  limit: string;
} | null>(null);
const viewportSize = ref('0 × 0');
const pixelRatio = ref('1x DPR');
const userAgentString = ref('');

const clientDiagnostics = computed(() => {
  if (typeof window === 'undefined') return [];

  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
    deviceMemory?: number;
  };

  const diag = [
    {
      label: 'Viewport Size',
      value: viewportSize.value,
    },
    {
      label: 'Screen Resolution',
      value: `${window.screen?.width || 0} × ${window.screen?.height || 0} px`,
    },
    {
      label: 'Device Pixel Ratio',
      value: pixelRatio.value,
    },
    {
      label: 'OS Color Scheme',
      value: window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches
        ? 'Dark'
        : 'Light',
    },
    {
      label: 'Network Status',
      value: navigator.onLine
        ? 'Online 🟢'
        : 'Offline 🔴',
    },
  ];

  if (nav.connection?.effectiveType) {
    diag.push({
      label: 'Connection Type',
      value: `${nav.connection.effectiveType.toUpperCase()} (${nav.connection.downlink || 0} Mbps)`,
    });
  }

  if (nav.deviceMemory) {
    diag.push({
      label: 'Device RAM (Approx)',
      value: `~${nav.deviceMemory} GB`,
    });
  }

  diag.push(
    {
      label: 'Platform / OS',
      value: navigator.platform || 'Unknown',
    },
    {
      label: 'Browser Language',
      value: navigator.language,
    },
  );

  return diag;
});

onMounted(() => {
  if (typeof window !== 'undefined') {
    viewportSize.value = `${window.innerWidth} × ${window.innerHeight}`;
    pixelRatio.value = `${window.devicePixelRatio || 1}x DPR`;
    userAgentString.value = navigator.userAgent;
    storageItemsCount.value = localStorage.length;

    // Check Chromium performance.memory
    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (perf.memory) {
      const formatMB = (bytes: number) =>
        `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      memoryUsage.value = {
        used: formatMB(
          perf.memory.usedJSHeapSize,
        ),
        total: formatMB(
          perf.memory.totalJSHeapSize,
        ),
        limit: formatMB(
          perf.memory.jsHeapSizeLimit,
        ),
      };
    }
  }
});

const copyDiagnostics = async () => {
  if (typeof window === 'undefined') return;

  const data = {
    build: buildInfo.value,
    client: clientDiagnostics.value.reduce(
      (acc, item) => {
        acc[item.label] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    ),
    memory: memoryUsage.value,
    storageItems: storageItemsCount.value,
    userAgent: userAgentString.value,
    timestamp: new Date().toISOString(),
  };

  try {
    await navigator.clipboard.writeText(
      JSON.stringify(data, null, 2),
    );
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error(
      'Failed to copy diagnostics:',
      err,
    );
  }
};
</script>

<template>
  <div class="dp-plugin-container">
    <!-- View Header -->
    <div class="dp-view-header">
      <div class="dp-header-text">
        <h2 class="dp-plugin-title">
          System & Device Diagnostics
        </h2>
        <p class="dp-plugin-desc">
          Client browser specifications, screen
          metrics, memory and build metadata
        </p>
      </div>

      <button
        type="button"
        class="dp-btn-copy"
        :class="{ 'dp-btn-copied': copied }"
        title="Copy full diagnostic report as JSON"
        @click="copyDiagnostics"
      >
        <svg
          v-if="!copied"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect
            x="9"
            y="9"
            width="13"
            height="13"
            rx="2"
            ry="2"
          />
          <path
            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
          />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{
          copied
            ? 'Copied to Clipboard!'
            : 'Copy Diagnostics'
        }}</span>
      </button>
    </div>

    <!-- Quick Stats Grid -->
    <div class="dp-stats-grid">
      <div class="dp-stat-card">
        <span class="dp-stat-label">Viewport</span>
        <span class="dp-stat-val">{{
          viewportSize
        }}</span>
      </div>

      <div class="dp-stat-card">
        <span class="dp-stat-label">Pixel Ratio</span>
        <span class="dp-stat-val">{{
          pixelRatio
        }}</span>
      </div>

      <div
        v-if="memoryUsage"
        class="dp-stat-card"
      >
        <span class="dp-stat-label">JS Heap</span>
        <span class="dp-stat-val">{{
          memoryUsage.used
        }}</span>
      </div>

      <div class="dp-stat-card">
        <span class="dp-stat-label">LocalStorage</span>
        <span class="dp-stat-val">{{ storageItemsCount }} keys</span>
      </div>
    </div>

    <!-- Client & Display Diagnostics Card -->
    <div class="dp-card">
      <div class="dp-card-header">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
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
        <span>Display & Browser Specs</span>
      </div>

      <div class="dp-info-table">
        <div
          v-for="item in clientDiagnostics"
          :key="item.label"
          class="dp-info-row"
        >
          <span class="dp-info-label">{{
            item.label
          }}</span>
          <span class="dp-info-value">{{
            item.value
          }}</span>
        </div>
      </div>
    </div>

    <!-- Application & Build Metadata Card -->
    <div
      v-if="Object.keys(buildInfo).length > 0"
      class="dp-card"
    >
      <div class="dp-card-header">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
          />
          <polyline
            points="3.27 6.96 12 12.01 20.73 6.96"
          />
          <line
            x1="12"
            y1="22.08"
            x2="12"
            y2="12"
          />
        </svg>
        <span>App & Build Metadata</span>
      </div>

      <div class="dp-info-table">
        <div
          v-for="(value, key) in buildInfo"
          :key="key"
          class="dp-info-row"
        >
          <span class="dp-info-label">{{
            key
          }}</span>
          <span class="dp-info-value">{{
            value
          }}</span>
        </div>
      </div>
    </div>

    <!-- User Agent String Card -->
    <div class="dp-card">
      <div class="dp-card-header">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <line
            x1="2"
            y1="12"
            x2="22"
            y2="12"
          />
          <path
            d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
          />
        </svg>
        <span>Raw User Agent</span>
      </div>
      <div class="dp-ua-box">
        <code>{{ userAgentString }}</code>
      </div>
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

.dp-btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dp-text-primary);
  cursor: pointer;
  transition: all 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.dp-btn-copy svg {
  width: 14px;
  height: 14px;
  color: var(--dp-accent);
}

.dp-btn-copy:hover {
  background-color: var(--dp-bg-hover);
  border-color: var(--dp-border-focus);
  transform: translateY(-1px);
}

.dp-btn-copied {
  border-color: var(--dp-success);
  color: var(--dp-success);
  background-color: rgba(16, 185, 129, 0.12);
}

.dp-btn-copied svg {
  color: var(--dp-success);
}

/* Quick Stats Grid */
.dp-stats-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(130px, 1fr)
  );
  gap: 10px;
}

.dp-stat-card {
  background-color: var(
    --dp-bg-card,
    var(--dp-bg-secondary)
  );
  border: 1px solid var(--dp-border);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dp-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--dp-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dp-stat-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--dp-text-primary);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
}

/* Detailed Cards */
.dp-card {
  background-color: var(
    --dp-bg-card,
    var(--dp-bg-secondary)
  );
  border: 1px solid var(--dp-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.dp-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: var(--dp-bg-secondary);
  border-bottom: 1px solid var(--dp-border);
  font-size: 13px;
  font-weight: 600;
  color: var(--dp-text-primary);
}

.dp-card-header svg {
  width: 15px;
  height: 15px;
  color: var(--dp-accent);
}

.dp-info-table {
  display: flex;
  flex-direction: column;
}

.dp-info-row {
  display: flex;
  padding: 8px 16px;
  border-bottom: 1px solid var(--dp-border-subtle);
  align-items: center;
  font-size: 12px;
  gap: 16px;
}

.dp-info-row:last-child {
  border-bottom: none;
}

.dp-info-label {
  width: 170px;
  font-weight: 500;
  color: var(--dp-text-secondary);
  flex-shrink: 0;
}

.dp-info-value {
  color: var(--dp-text-primary);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
  word-break: break-all;
  flex: 1;
}

.dp-ua-box {
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.15);
}

.dp-ua-box code {
  font-size: 11px;
  color: var(--dp-text-secondary);
  word-break: break-all;
  line-height: 1.5;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
}
</style>
