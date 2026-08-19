<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PluginContext } from '@/types';
import type {
  FeatureFlagValue,
  FeatureFlagDefinition,
  CustomFlagItem,
  FeatureFlagsOptions,
} from './types';
import {
  DEFAULT_FLAGS_STORAGE_KEY,
  DEFAULT_CUSTOM_FLAGS_STORAGE_KEY,
  DEFAULT_PERSIST_FLAGS_KEY,
  getSavedFlags,
  getCustomFlags,
  setFeatureFlag,
} from './helpers';

defineOptions({
  name: 'FeatureFlagsView',
});

const props = defineProps<{
  context: PluginContext;
  options: FeatureFlagsOptions;
}>();

const storageKey =
  props.options.storageKey ||
  DEFAULT_FLAGS_STORAGE_KEY;
const customStorageKey =
  props.options.customStorageKey ||
  DEFAULT_CUSTOM_FLAGS_STORAGE_KEY;

const definitions = ref<FeatureFlagDefinition[]>(
  props.options.flags || [],
);
const customFlags = ref<CustomFlagItem[]>([]);
const localValues = ref<
  Record<string, FeatureFlagValue>
>({});
const searchQuery = ref('');
const activeFilter = ref<
  'all' | 'active' | 'modified'
>('all');
const persistAcrossReloads = ref(true);
const showSuccessAlert = ref(false);
const alertMessage = ref(
  'Flags applied successfully!',
);

// New custom flag inputs
const newFlagKey = ref('');
const newFlagName = ref('');
const newFlagType = ref<'boolean' | 'string'>(
  'boolean',
);

// All available flag definitions (predefined + custom)
const allFlags = computed<
  FeatureFlagDefinition[]
>(() => {
  const customDefs: FeatureFlagDefinition[] =
    customFlags.value.map((c) => ({
      key: c.key,
      name: c.name || c.key,
      defaultValue: c.value,
      type: c.type,
      group: 'Custom Flags',
      tags: ['custom'],
    }));
  return [...definitions.value, ...customDefs];
});

// Filtered flags by search and active filter
const filteredFlags = computed<
  FeatureFlagDefinition[]
>(() => {
  let list = allFlags.value;
  const q = searchQuery.value
    .trim()
    .toLowerCase();

  if (q) {
    list = list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        (f.description &&
          f.description
            .toLowerCase()
            .includes(q)) ||
        (f.group &&
          f.group.toLowerCase().includes(q)),
    );
  }

  if (activeFilter.value === 'active') {
    list = list.filter((f) =>
      Boolean(localValues.value[f.key]),
    );
  } else if (activeFilter.value === 'modified') {
    list = list.filter((f) => {
      const current = localValues.value[f.key];
      return (
        JSON.stringify(current) !==
        JSON.stringify(f.defaultValue)
      );
    });
  }

  return list;
});

// Group flags by section
const groupedFlags = computed<
  Record<string, FeatureFlagDefinition[]>
>(() => {
  const groups: Record<
    string,
    FeatureFlagDefinition[]
  > = {};
  filteredFlags.value.forEach((flag) => {
    const groupName = flag.group || 'General';
    if (!groups[groupName])
      groups[groupName] = [];
    groups[groupName].push(flag);
  });
  return groups;
});

const totalCount = computed(
  () => allFlags.value.length,
);
const activeCount = computed(
  () =>
    Object.values(localValues.value).filter((v) =>
      Boolean(v),
    ).length,
);
const modifiedCount = computed(() => {
  return allFlags.value.filter((f) => {
    const current = localValues.value[f.key];
    return (
      JSON.stringify(current) !==
      JSON.stringify(f.defaultValue)
    );
  }).length;
});

onMounted(() => {
  // 1. Load persistence setting
  if (typeof window !== 'undefined') {
    const savedPersist = localStorage.getItem(
      DEFAULT_PERSIST_FLAGS_KEY,
    );
    if (savedPersist !== null) {
      persistAcrossReloads.value =
        savedPersist === 'true';
    } else if (
      props.options.defaultPersist !== undefined
    ) {
      persistAcrossReloads.value =
        props.options.defaultPersist;
    }
  }

  // 2. Load custom flags
  customFlags.value = getCustomFlags(
    customStorageKey,
  );

  // 3. Populate local values from defaults + storage
  const saved = getSavedFlags(storageKey);
  const initialMap: Record<
    string,
    FeatureFlagValue
  > = {};

  allFlags.value.forEach((f) => {
    initialMap[f.key] = f.defaultValue;
  });

  Object.keys(saved).forEach((k) => {
    initialMap[k] = saved[k];
  });

  localValues.value = initialMap;
});

const toggleFlag = (
  flag: FeatureFlagDefinition,
) => {
  const current = localValues.value[flag.key];
  localValues.value[flag.key] = !current;
};

const setSelectFlagValue = (
  key: string,
  val: FeatureFlagValue,
) => {
  localValues.value[key] = val;
};

const resetToDefaults = () => {
  const defaultMap: Record<
    string,
    FeatureFlagValue
  > = {};
  allFlags.value.forEach((f) => {
    defaultMap[f.key] = f.defaultValue;
  });
  localValues.value = defaultMap;
};

const addCustomFlag = () => {
  const key = newFlagKey.value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (!key) return;

  const existing = allFlags.value.find(
    (f) => f.key === key,
  );
  if (existing) {
    newFlagKey.value = '';
    newFlagName.value = '';
    return;
  }

  const initialVal: FeatureFlagValue =
    newFlagType.value === 'boolean' ? true : '';
  const item: CustomFlagItem = {
    key,
    name: newFlagName.value.trim() || key,
    value: initialVal,
    type: newFlagType.value,
  };

  customFlags.value.push(item);
  localValues.value[key] = initialVal;

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      customStorageKey,
      JSON.stringify(customFlags.value),
    );
  }

  newFlagKey.value = '';
  newFlagName.value = '';
};

const removeCustomFlag = (
  key: string,
  event?: Event,
) => {
  event?.stopPropagation();
  customFlags.value = customFlags.value.filter(
    (c) => c.key !== key,
  );
  delete localValues.value[key];

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      customStorageKey,
      JSON.stringify(customFlags.value),
    );
  }
};

const onPersistToggle = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      DEFAULT_PERSIST_FLAGS_KEY,
      String(persistAcrossReloads.value),
    );
  }
};

const applyFlags = (
  showToast = true,
  reloadAfter = false,
) => {
  const values = { ...localValues.value };

  // 1. Save to reactive flags map
  Object.keys(values).forEach((k) => {
    setFeatureFlag(k, values[k], storageKey);
  });

  // 2. Persist in storage
  if (typeof window !== 'undefined') {
    try {
      if (persistAcrossReloads.value) {
        localStorage.setItem(
          storageKey,
          JSON.stringify(values),
        );
        sessionStorage.removeItem(storageKey);
      } else {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify(values),
        );
        localStorage.removeItem(storageKey);
      }
    } catch {
      /* empty */
    }
  }

  // 3. Emit event to EventBus
  props.context.events.emit(
    'feature-flags:changed',
    {
      flags: values,
    },
  );

  // 4. Callback
  if (props.options.onFlagChange) {
    Object.keys(values).forEach((k) => {
      props.options.onFlagChange?.(
        k,
        values[k],
        values,
      );
    });
  }

  if (reloadAfter) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }

  if (showToast) {
    alertMessage.value = `Feature flags applied (${activeCount.value} active)`;
    showSuccessAlert.value = true;
    setTimeout(() => {
      showSuccessAlert.value = false;
    }, 2000);
  }
};
</script>

<template>
  <div class="dp-ff-container">
    <!-- Header -->
    <div class="dp-ff-header">
      <div>
        <h2 class="dp-ff-title">
          Feature Flags
        </h2>
        <p class="dp-ff-desc">
          Toggle and test experimental features
          live
        </p>
      </div>

      <div class="dp-ff-counter">
        <span class="dp-pulse-dot" />
        <span>{{ activeCount }} /
          {{ totalCount }} active</span>
      </div>
    </div>

    <!-- Toast Alert -->
    <div
      v-if="showSuccessAlert"
      class="dp-ff-toast"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>{{ alertMessage }}</span>
    </div>

    <!-- Search & Filter Controls -->
    <div class="dp-ff-controls">
      <div class="dp-ff-search-box">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="dp-search-icon"
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
          placeholder="Search flags by name or key..."
          class="dp-search-input"
        >
        <button
          v-if="searchQuery"
          type="button"
          class="dp-btn-clear-search"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <div class="dp-filter-tabs">
        <button
          type="button"
          class="dp-filter-btn"
          :class="{
            'dp-filter-active':
              activeFilter === 'all',
          }"
          @click="activeFilter = 'all'"
        >
          All ({{ totalCount }})
        </button>
        <button
          type="button"
          class="dp-filter-btn"
          :class="{
            'dp-filter-active':
              activeFilter === 'active',
          }"
          @click="activeFilter = 'active'"
        >
          Active ({{ activeCount }})
        </button>
        <button
          type="button"
          class="dp-filter-btn"
          :class="{
            'dp-filter-active':
              activeFilter === 'modified',
          }"
          @click="activeFilter = 'modified'"
        >
          Modified ({{ modifiedCount }})
        </button>
      </div>
    </div>

    <!-- Empty Search State -->
    <div
      v-if="filteredFlags.length === 0"
      class="dp-empty-state"
    >
      <p>
        No feature flags found matching your
        filter.
      </p>
    </div>

    <!-- Grouped Flags List -->
    <div
      v-else
      class="dp-groups-list"
    >
      <div
        v-for="(
          flagsInGroup, groupName
        ) in groupedFlags"
        :key="groupName"
        class="dp-flag-group"
      >
        <h3 class="dp-group-title">
          <span>{{ groupName }}</span>
          <span class="dp-group-count">{{
            flagsInGroup.length
          }}</span>
        </h3>

        <div class="dp-flags-stack">
          <div
            v-for="flag in flagsInGroup"
            :key="flag.key"
            class="dp-flag-card"
            :class="{
              'dp-flag-active': Boolean(
                localValues[flag.key],
              ),
            }"
            @click="
              flag.type !== 'string'
                ? toggleFlag(flag)
                : undefined
            "
          >
            <!-- Flag Left Details -->
            <div class="dp-flag-main">
              <div class="dp-flag-title-row">
                <span class="dp-flag-name">{{
                  flag.name
                }}</span>
                <span
                  v-if="
                    JSON.stringify(
                      localValues[flag.key],
                    ) !==
                      JSON.stringify(
                        flag.defaultValue,
                      )
                  "
                  class="dp-tag-modified"
                  title="Overridden from default"
                >
                  MODIFIED
                </span>
                <span
                  v-if="
                    flag.tags?.includes('custom')
                  "
                  class="dp-tag-custom"
                >
                  CUSTOM
                </span>
              </div>

              <p
                v-if="flag.description"
                class="dp-flag-desc"
              >
                {{ flag.description }}
              </p>

              <code class="dp-flag-key">{{
                flag.key
              }}</code>
            </div>

            <!-- Flag Right Control -->
            <div
              class="dp-flag-control"
              @click.stop
            >
              <!-- Options Select for Multivariate / String Flags -->
              <div
                v-if="
                  flag.type === 'string' &&
                    flag.options &&
                    flag.options.length > 0
                "
                class="dp-select-wrapper"
              >
                <select
                  :value="
                    String(
                      localValues[flag.key] ??
                        flag.defaultValue,
                    )
                  "
                  class="dp-select-control"
                  @change="
                    setSelectFlagValue(
                      flag.key,
                      (
                        $event.target as HTMLSelectElement
                      ).value,
                    )
                  "
                >
                  <option
                    v-for="opt in flag.options"
                    :key="String(opt.value)"
                    :value="String(opt.value)"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- Boolean Switch for Boolean Flags -->
              <button
                v-else
                type="button"
                class="dp-switch"
                :class="{
                  'dp-switch-on': Boolean(
                    localValues[flag.key],
                  ),
                }"
                @click="toggleFlag(flag)"
              >
                <span class="dp-switch-knob" />
              </button>

              <!-- Delete Custom Flag -->
              <button
                v-if="
                  flag.tags?.includes('custom')
                "
                type="button"
                class="dp-btn-del-flag"
                title="Remove custom flag"
                @click="
                  removeCustomFlag(
                    flag.key,
                    $event,
                  )
                "
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Custom Flag Box -->
    <div
      v-if="options.allowCustomFlags !== false"
      class="dp-add-flag-card"
    >
      <form
        class="dp-add-flag-form"
        @submit.prevent="addCustomFlag"
      >
        <input
          v-model="newFlagKey"
          type="text"
          placeholder="Flag key (e.g. 'new_checkout')"
          class="dp-input-key"
        >
        <input
          v-model="newFlagName"
          type="text"
          placeholder="Display Name"
          class="dp-input-name"
        >
        <button
          type="submit"
          class="dp-btn-add-flag"
          :disabled="!newFlagKey.trim()"
        >
          + Add Flag
        </button>
      </form>
    </div>

    <!-- Footer Actions -->
    <div class="dp-ff-footer">
      <div class="dp-footer-left">
        <label class="dp-persist-label">
          <input
            v-model="persistAcrossReloads"
            type="checkbox"
            class="dp-checkbox-native"
            @change="onPersistToggle"
          >
          <span>Persist in LocalStorage</span>
        </label>

        <button
          type="button"
          class="dp-btn-reset"
          title="Reset all flags to default values"
          @click="resetToDefaults"
        >
          Reset Defaults
        </button>
      </div>

      <div class="dp-footer-right">
        <button
          type="button"
          class="dp-btn-primary"
          @click="applyFlags(true, false)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Apply Flags</span>
        </button>

        <button
          type="button"
          class="dp-btn-secondary"
          title="Apply flags and reload application"
          @click="applyFlags(true, true)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"
            />
          </svg>
          <span>Apply & Reload</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dp-ff-container {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

/* Header */
.dp-ff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--dp-border-subtle);
}

.dp-ff-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--dp-text-primary);
  margin: 0;
  letter-spacing: -0.2px;
}

.dp-ff-desc {
  font-size: 11px;
  color: var(--dp-text-secondary);
  margin: 2px 0 0 0;
}

.dp-ff-counter {
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

/* Toast */
.dp-ff-toast {
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

.dp-ff-toast svg {
  width: 15px;
  height: 15px;
}

/* Controls */
.dp-ff-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dp-ff-search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  padding: 6px 10px;
}

.dp-search-icon {
  width: 14px;
  height: 14px;
  color: var(--dp-text-muted);
}

.dp-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--dp-text-primary);
  font-family: inherit;
}

.dp-search-input::placeholder {
  color: var(--dp-text-muted);
}

.dp-btn-clear-search {
  background: none;
  border: none;
  color: var(--dp-text-muted);
  cursor: pointer;
  padding: 0;
  font-size: 11px;
}

.dp-filter-tabs {
  display: flex;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.dp-filter-btn {
  background: none;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--dp-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.dp-filter-btn:hover {
  color: var(--dp-text-primary);
}

.dp-filter-btn.dp-filter-active {
  background-color: var(--dp-bg-hover);
  color: var(--dp-accent);
}

/* Empty */
.dp-empty-state {
  text-align: center;
  padding: 30px 10px;
  color: var(--dp-text-muted);
  font-size: 12px;
}

/* Groups */
.dp-groups-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dp-flag-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dp-group-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--dp-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dp-group-count {
  background: var(--dp-bg-secondary);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
  color: var(--dp-text-muted);
}

.dp-flags-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dp-flag-card {
  background-color: var(
    --dp-bg-card,
    var(--dp-bg-secondary)
  );
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.dp-flag-card:hover {
  background-color: var(--dp-bg-hover);
  border-color: var(--dp-border-focus);
}

.dp-flag-card.dp-flag-active {
  background-color: var(--dp-bg-active);
  border-color: var(--dp-border-focus);
}

.dp-flag-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dp-flag-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dp-flag-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dp-text-primary);
}

.dp-tag-modified {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.35);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
}

.dp-tag-custom {
  background: var(--dp-bg-hover);
  color: var(--dp-accent);
  border: 1px solid var(--dp-border-focus);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
}

.dp-flag-desc {
  font-size: 11px;
  color: var(--dp-text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dp-flag-key {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
  font-size: 10px;
  color: var(--dp-text-muted);
}

.dp-flag-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Switch */
.dp-switch {
  width: 36px;
  height: 20px;
  background-color: var(--dp-bg-hover);
  border: 1px solid var(--dp-border);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
}

.dp-switch.dp-switch-on {
  background-color: var(--dp-accent);
  border-color: var(--dp-accent);
}

.dp-switch-knob {
  width: 14px;
  height: 14px;
  background-color: white;
  border-radius: 50%;
  display: block;
  transition: transform 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dp-switch.dp-switch-on .dp-switch-knob {
  transform: translateX(16px);
}

.dp-select-control {
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  color: var(--dp-text-primary);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  outline: none;
  cursor: pointer;
}

.dp-btn-del-flag {
  background: none;
  border: none;
  color: var(--dp-text-muted);
  cursor: pointer;
  padding: 4px;
  font-size: 11px;
}

.dp-btn-del-flag:hover {
  color: var(--dp-error);
}

/* Add Card */
.dp-add-flag-card {
  background-color: var(--dp-bg-secondary);
  border: 1px dashed var(--dp-border);
  border-radius: 8px;
  padding: 8px 10px;
}

.dp-add-flag-form {
  display: flex;
  gap: 8px;
  margin: 0;
}

.dp-input-key,
.dp-input-name {
  flex: 1;
  background: transparent;
  border: 1px solid var(--dp-border-subtle);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--dp-text-primary);
  outline: none;
  font-family: inherit;
}

.dp-input-key::placeholder,
.dp-input-name::placeholder {
  color: var(--dp-text-muted);
}

.dp-btn-add-flag {
  padding: 4px 10px;
  background-color: var(--dp-accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.dp-btn-add-flag:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Footer */
.dp-ff-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid var(--dp-border-subtle);
  gap: 12px;
}

.dp-footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dp-persist-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dp-text-secondary);
  cursor: pointer;
}

.dp-checkbox-native {
  width: 14px;
  height: 14px;
  accent-color: var(--dp-accent);
}

.dp-btn-reset {
  background: none;
  border: none;
  color: var(--dp-text-muted);
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.dp-btn-reset:hover {
  color: var(--dp-text-primary);
}

.dp-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--dp-accent);
  color: white;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--dp-accent-glow);
  transition: all 0.15s;
}

.dp-btn-primary svg {
  width: 14px;
  height: 14px;
}

.dp-btn-primary:hover {
  background-color: var(--dp-accent-hover);
  transform: translateY(-1px);
}

.dp-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: var(--dp-bg-secondary);
  border: 1px solid var(--dp-border);
  color: var(--dp-text-primary);
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.dp-btn-secondary svg {
  width: 13px;
  height: 13px;
  color: var(--dp-accent);
}

.dp-btn-secondary:hover {
  background-color: var(--dp-bg-hover);
  border-color: var(--dp-border-focus);
  transform: translateY(-1px);
}
</style>
