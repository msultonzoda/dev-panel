<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
} from 'vue';
import type {
  PluginContext,
  DevPanelEvent,
} from '@/types';

defineOptions({
  name: 'ActionLogView',
});

const props = defineProps<{
  context: PluginContext;
}>();

interface LogEntry {
  id: number;
  time: Date;
  event: string;
  payload: unknown;
}

const logs = ref<LogEntry[]>([]);
const searchQuery = ref('');
let nextId = 1;

const handleEvent = (
  event: DevPanelEvent,
  payload: unknown,
) => {
  logs.value.unshift({
    id: nextId++,
    time: new Date(),
    event,
    payload,
  });

  // Keep last 150
  if (logs.value.length > 150) {
    logs.value.pop();
  }
};

const formatTime = (date: Date) => {
  return (
    date.toTimeString().split(' ')[0] +
    '.' +
    String(date.getMilliseconds()).padStart(
      3,
      '0',
    )
  );
};

const clearLogs = () => {
  logs.value = [];
};

const filteredLogs = computed(() => {
  if (!searchQuery.value.trim())
    return logs.value;
  const q = searchQuery.value.toLowerCase();
  return logs.value.filter(
    (log) =>
      log.event.toLowerCase().includes(q) ||
      JSON.stringify(log.payload ?? '')
        .toLowerCase()
        .includes(q),
  );
});

const getEventColorClass = (
  eventName: string,
) => {
  if (eventName.startsWith('auth:'))
    return 'dp-event-auth';
  if (eventName.startsWith('plugin:'))
    return 'dp-event-plugin';
  if (eventName.startsWith('panel:'))
    return 'dp-event-panel';
  return 'dp-event-custom';
};

const knownEvents: DevPanelEvent[] = [
  'panel:open',
  'panel:close',
  'panel:ready',
  'auth:success',
  'auth:failure',
  'auth:logout',
  'plugin:registered',
  'plugin:error',
  'plugin:activated',
  'navigation:change',
];

onMounted(() => {
  knownEvents.forEach((evt) => {
    props.context.events.on(evt, (payload) =>
      handleEvent(evt, payload),
    );
  });
});

onUnmounted(() => {
  // Cleanup
});
</script>

<template>
  <div class="dp-plugin-container">
    <div class="dp-log-header">
      <div>
        <h2 class="dp-plugin-title">
          Action & Event Log
        </h2>
        <p class="dp-plugin-desc">
          Live stream of internal event bus
          emissions ({{ logs.length }} events)
        </p>
      </div>

      <div class="dp-log-actions">
        <div class="dp-search-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
            />
            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter events or payload..."
          >
        </div>

        <button
          class="dp-clear-btn"
          title="Clear all logs"
          @click="clearLogs"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <div class="dp-log-list">
      <div
        v-if="filteredLogs.length === 0"
        class="dp-log-empty"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <line
            x1="8"
            y1="12"
            x2="16"
            y2="12"
          />
        </svg>
        <p>
          {{
            searchQuery
              ? 'No matching events found.'
              : 'No events recorded yet.'
          }}
        </p>
      </div>

      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="dp-log-entry"
      >
        <div class="dp-log-meta">
          <span class="dp-log-time">{{
            formatTime(log.time)
          }}</span>
          <span
            class="dp-log-event"
            :class="getEventColorClass(log.event)"
          >{{ log.event }}</span>
        </div>
        <div
          v-if="log.payload !== undefined"
          class="dp-log-payload"
        >
          <pre>{{
            JSON.stringify(log.payload, null, 2)
          }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dp-plugin-container {
  padding: 24px 28px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.dp-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
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

.dp-log-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dp-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  padding: 6px 12px;
  transition: border-color 0.2s;
}

.dp-search-box:focus-within {
  border-color: var(--dp-border-focus);
}

.dp-search-box svg {
  width: 14px;
  height: 14px;
  color: var(--dp-text-muted);
}

.dp-search-box input {
  background: transparent;
  border: none;
  color: var(--dp-text-primary);
  font-size: 12px;
  outline: none;
  width: 180px;
}

.dp-search-box input::placeholder {
  color: var(--dp-text-muted);
}

.dp-clear-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  color: var(--dp-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
}

.dp-clear-btn svg {
  width: 14px;
  height: 14px;
}

.dp-clear-btn:hover {
  background-color: var(--dp-error-bg);
  border-color: var(--dp-error);
  color: var(--dp-error);
}

.dp-log-list {
  flex: 1;
  background-color: var(
    --dp-bg-card,
    var(--dp-bg-secondary)
  );
  border: 1px solid var(--dp-border);
  border-radius: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.dp-log-empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--dp-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.dp-log-empty svg {
  width: 32px;
  height: 32px;
}

.dp-log-entry {
  padding: 12px 16px;
  border-bottom: 1px solid var(--dp-border-subtle);
  transition: background-color 0.15s ease;
}

.dp-log-entry:hover {
  background-color: var(--dp-bg-hover);
}

.dp-log-entry:last-child {
  border-bottom: none;
}

.dp-log-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dp-log-time {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
  font-size: 11px;
  color: var(--dp-text-muted);
}

.dp-log-event {
  font-weight: 600;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
}

.dp-event-auth {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--dp-warning);
}

.dp-event-plugin {
  background-color: rgba(99, 102, 241, 0.15);
  color: var(--dp-accent);
}

.dp-event-panel {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--dp-success);
}

.dp-event-custom {
  background-color: var(--dp-bg-hover);
  color: var(--dp-text-primary);
}

.dp-log-payload {
  background-color: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--dp-border-subtle);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
}

.dp-log-payload pre {
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
  font-size: 11px;
  color: var(--dp-text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
