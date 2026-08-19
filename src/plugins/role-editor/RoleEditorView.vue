<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { PluginContext } from '@/types';
import type {
  RoleOption,
  RoleEditorOptions,
  CustomRoleItem,
} from './types';
import {
  DEFAULT_ROLES_STORAGE_KEY,
  DEFAULT_CUSTOM_ROLES_STORAGE_KEY,
  DEFAULT_PERSIST_KEY,
  getDevRoles,
  getDevCustomRoles,
} from './helpers';

defineOptions({
  name: 'RoleEditorView',
});

const props = defineProps<{
  context: PluginContext;
  options: RoleEditorOptions;
}>();

const storageKey =
  props.options.storageKey ||
  DEFAULT_ROLES_STORAGE_KEY;
const customRolesStorageKey =
  props.options.customRolesStorageKey ||
  DEFAULT_CUSTOM_ROLES_STORAGE_KEY;

const predefinedRoles = ref<RoleOption[]>(
  props.options.roles || [],
);
const customRoles = ref<CustomRoleItem[]>([]);
const selectedRoleIds = ref<string[]>([]);
const newRoleInput = ref('');
const showSuccessAlert = ref(false);
const alertMessage = ref(
  'Roles applied to Store & saved!',
);
const persistAcrossReloads = ref(true);

// Combined list of all available roles (predefined + custom)
const allAvailableRoles = computed<RoleOption[]>(
  () => {
    const customAsOptions: RoleOption[] =
      customRoles.value.map((c) => ({
        id: c.id,
        name: c.name,
        value: c.value,
        badge: 'CUSTOM',
      }));
    return [
      ...predefinedRoles.value,
      ...customAsOptions,
    ];
  },
);

// Active selected role values to pass to store/localStorage
const activeSelectedValues = computed<unknown[]>(
  () => {
    const result: unknown[] = [];
    allAvailableRoles.value.forEach((role) => {
      if (
        selectedRoleIds.value.includes(role.id)
      ) {
        result.push(
          role.value !== undefined
            ? role.value
            : role.id,
        );
      }
    });
    return result;
  },
);

const selectedCount = computed(
  () => selectedRoleIds.value.length,
);
const totalCount = computed(
  () => allAvailableRoles.value.length,
);

onMounted(() => {
  // 1. Load persistence preference
  if (typeof window !== 'undefined') {
    const savedPersist = localStorage.getItem(
      DEFAULT_PERSIST_KEY,
    );
    if (savedPersist !== null) {
      persistAcrossReloads.value =
        savedPersist === 'true';
    } else if (
      props.options
        .defaultPersistAcrossReloads !== undefined
    ) {
      persistAcrossReloads.value =
        props.options.defaultPersistAcrossReloads;
    }
  }

  // 2. Load custom roles from localStorage
  const savedCustom = getDevCustomRoles(
    customRolesStorageKey,
  );
  customRoles.value = savedCustom;

  // 3. Load selected role IDs or values from localStorage / sessionStorage
  if (typeof window !== 'undefined') {
    let savedValues: unknown[] = [];
    if (persistAcrossReloads.value) {
      savedValues = getDevRoles<unknown[]>(
        storageKey,
        [],
      );
    } else {
      try {
        const raw =
          sessionStorage.getItem(storageKey);
        if (raw) savedValues = JSON.parse(raw);
      } catch {
        /* empty */
      }
    }

    const initialIds: string[] = [];

    if (
      Array.isArray(savedValues) &&
      savedValues.length > 0
    ) {
      allAvailableRoles.value.forEach((role) => {
        const valToMatch =
          role.value !== undefined
            ? role.value
            : role.id;
        const isMatched = savedValues.some(
          (v) => {
            if (
              typeof v === 'object' &&
              typeof valToMatch === 'object'
            ) {
              return (
                JSON.stringify(v) ===
                JSON.stringify(valToMatch)
              );
            }
            return (
              v === valToMatch || v === role.id
            );
          },
        );
        if (
          isMatched &&
          !initialIds.includes(role.id)
        ) {
          initialIds.push(role.id);
        }
      });
    }

    // If no saved selection, fall back to getCurrentRoles / getCurrentRole or defaultRoleIds
    if (initialIds.length === 0) {
      const getter =
        props.options.getCurrentRoles ||
        props.options.getCurrentRole;
      if (typeof getter === 'function') {
        try {
          const current = getter();
          const list = Array.isArray(current)
            ? current
            : current
              ? [current]
              : [];
          allAvailableRoles.value.forEach(
            (role) => {
              const valToMatch =
                role.value !== undefined
                  ? role.value
                  : role.id;
              if (
                list.includes(valToMatch) ||
                list.includes(role.id)
              ) {
                if (!initialIds.includes(role.id))
                  initialIds.push(role.id);
              }
            },
          );
        } catch {
          /* empty */
        }
      }
    }

    // If still empty, fall back to defaultRoleIds / defaultRoleId
    if (initialIds.length === 0) {
      if (
        props.options.defaultRoleIds &&
        props.options.defaultRoleIds.length > 0
      ) {
        props.options.defaultRoleIds.forEach(
          (id) => {
            if (!initialIds.includes(id))
              initialIds.push(id);
          },
        );
      } else if (props.options.defaultRoleId) {
        initialIds.push(
          props.options.defaultRoleId,
        );
      } else if (
        predefinedRoles.value.length > 0 &&
        predefinedRoles.value[0]
      ) {
        initialIds.push(
          predefinedRoles.value[0].id,
        );
      }
    }

    selectedRoleIds.value = initialIds;
  }
});

const toggleRole = (roleId: string) => {
  const idx =
    selectedRoleIds.value.indexOf(roleId);
  if (idx > -1) {
    selectedRoleIds.value.splice(idx, 1);
  } else {
    selectedRoleIds.value.push(roleId);
  }
};

const selectAll = () => {
  selectedRoleIds.value =
    allAvailableRoles.value.map((r) => r.id);
};

const deselectAll = () => {
  selectedRoleIds.value = [];
};

const addCustomRole = () => {
  const name = newRoleInput.value.trim();
  if (!name) return;

  const existing = allAvailableRoles.value.find(
    (r) =>
      r.name.toLowerCase() ===
        name.toLowerCase() ||
      String(r.value).toLowerCase() ===
        name.toLowerCase(),
  );

  if (existing) {
    if (
      !selectedRoleIds.value.includes(existing.id)
    ) {
      selectedRoleIds.value.push(existing.id);
    }
    newRoleInput.value = '';
    return;
  }

  const customId = `custom_${Date.now()}`;
  const newItem: CustomRoleItem = {
    id: customId,
    name,
    value: name,
  };

  customRoles.value.push(newItem);
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      customRolesStorageKey,
      JSON.stringify(customRoles.value),
    );
  }

  if (!selectedRoleIds.value.includes(customId)) {
    selectedRoleIds.value.push(customId);
  }

  newRoleInput.value = '';
};

const removeCustomRole = (
  roleId: string,
  event?: Event,
) => {
  event?.stopPropagation();
  customRoles.value = customRoles.value.filter(
    (r) => r.id !== roleId,
  );

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      customRolesStorageKey,
      JSON.stringify(customRoles.value),
    );
  }

  selectedRoleIds.value =
    selectedRoleIds.value.filter(
      (id) => id !== roleId,
    );
};

const onPersistToggle = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      DEFAULT_PERSIST_KEY,
      String(persistAcrossReloads.value),
    );
  }
};

const applyRoles = (
  showToast = true,
  reloadAfter = false,
) => {
  const values = activeSelectedValues.value;
  const activeOptions =
    allAvailableRoles.value.filter((r) =>
      selectedRoleIds.value.includes(r.id),
    );

  // 1. Save to localStorage or sessionStorage based on persist checkbox
  if (typeof window !== 'undefined') {
    try {
      if (persistAcrossReloads.value) {
        localStorage.setItem(
          storageKey,
          JSON.stringify(values),
        );
        localStorage.setItem(
          DEFAULT_ROLES_STORAGE_KEY,
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

  // 2. Emit events to plugin core for single-point Pinia store mutation
  props.context.events.emit('dev:role-changed', {
    roles: values,
    selectedValues: values,
    selectedOptions: activeOptions,
  });

  props.context.events.emit(
    'auth:role-switched',
    {
      roles: values,
      role:
        values.length === 1 ? values[0] : values,
    },
  );

  if (reloadAfter) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }

  if (showToast) {
    alertMessage.value = `Roles applied (${selectedCount.value} active)`;
    showSuccessAlert.value = true;
    setTimeout(() => {
      showSuccessAlert.value = false;
    }, 2000);
  }
};
</script>

<template>
  <div class="dp-role-container">
    <!-- View Header -->
    <div class="dp-header-row">
      <div class="dp-header-text">
        <h2 class="dp-view-title">
          Roles & Permissions
        </h2>
        <p
          v-if="options.storePath"
          class="dp-target-hint"
        >
          Injecting into
          <code>store.{{ options.storePath }}</code>
        </p>
      </div>

      <div class="dp-active-counter">
        <span class="dp-pulse-dot" />
        <span>{{ selectedCount }} /
          {{ totalCount }} active</span>
      </div>
    </div>

    <!-- Success Toast -->
    <div
      v-if="showSuccessAlert"
      class="dp-toast"
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

    <!-- Toolbar: Quick Actions -->
    <div class="dp-toolbar">
      <span class="dp-toolbar-label">Select roles to activate:</span>
      <div class="dp-toolbar-actions">
        <button
          type="button"
          class="dp-btn-link"
          @click="selectAll"
        >
          Select All
        </button>
        <span class="dp-sep">/</span>
        <button
          type="button"
          class="dp-btn-link"
          @click="deselectAll"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Minimalist Role Cards List -->
    <div class="dp-roles-grid">
      <div
        v-for="role in allAvailableRoles"
        :key="role.id"
        class="dp-role-card"
        :class="{
          'dp-role-card-active':
            selectedRoleIds.includes(role.id),
        }"
        @click="toggleRole(role.id)"
      >
        <!-- Checkbox -->
        <div
          class="dp-check-box"
          :class="{
            'dp-check-active':
              selectedRoleIds.includes(role.id),
          }"
        >
          <svg
            v-if="
              selectedRoleIds.includes(role.id)
            "
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <!-- Role Main Info -->
        <div class="dp-role-info">
          <div class="dp-role-title-row">
            <span class="dp-role-name">{{
              role.name
            }}</span>
            <span
              v-if="
                role.badge &&
                  role.badge !==
                  role.name.toUpperCase()
              "
              class="dp-role-badge"
              :class="{
                'dp-badge-custom':
                  role.badge === 'CUSTOM',
              }"
            >
              {{ role.badge }}
            </span>
          </div>

          <span
            v-if="role.description"
            class="dp-role-desc"
          >
            {{ role.description }}
          </span>
        </div>

        <!-- Delete Custom Role Button -->
        <button
          v-if="role.id.startsWith('custom_')"
          type="button"
          class="dp-btn-del"
          title="Remove custom role"
          @click="
            removeCustomRole(role.id, $event)
          "
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Minimalist Add Custom Role Form -->
    <div
      v-if="options.allowCustomRoles !== false"
      class="dp-add-box"
    >
      <form
        class="dp-add-form"
        @submit.prevent="addCustomRole"
      >
        <input
          v-model="newRoleInput"
          type="text"
          placeholder="+ Add custom role..."
          class="dp-add-input"
        >
        <button
          type="submit"
          class="dp-btn-add-mini"
          :disabled="!newRoleInput.trim()"
        >
          Add
        </button>
      </form>
    </div>

    <!-- Sticky Footer Actions -->
    <div class="dp-footer">
      <label class="dp-persist-label">
        <input
          v-model="persistAcrossReloads"
          type="checkbox"
          class="dp-checkbox-native"
          @change="onPersistToggle"
        >
        <span>Persist in LocalStorage</span>
      </label>

      <div class="dp-actions-group">
        <button
          type="button"
          class="dp-btn-primary"
          @click="applyRoles(true, false)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Apply Roles</span>
        </button>

        <button
          type="button"
          class="dp-btn-secondary"
          title="Apply roles and reload application"
          @click="applyRoles(true, true)"
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
.dp-role-container {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

/* Header */
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

.dp-target-hint {
  font-size: 11px;
  color: var(--dp-text-secondary);
  margin: 3px 0 0 0;
}

.dp-target-hint code {
  color: var(--dp-accent);
  background: var(--dp-bg-hover);
  padding: 1px 5px;
  border-radius: 4px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, monospace;
}

.dp-active-counter {
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

/* Toolbar */
.dp-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.dp-toolbar-label {
  color: var(--dp-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.4px;
}

.dp-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dp-btn-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--dp-accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.dp-btn-link:hover {
  text-decoration: underline;
}

.dp-sep {
  color: var(--dp-text-muted);
  font-size: 11px;
}

/* Grid of Cards */
.dp-roles-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dp-role-card {
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

.dp-role-card:hover {
  background-color: var(--dp-bg-hover);
  border-color: var(--dp-border-focus);
}

.dp-role-card.dp-role-card-active {
  background-color: var(--dp-bg-active);
  border-color: var(--dp-border-focus);
  box-shadow:
    0 0 0 1px var(--dp-border-focus),
    0 2px 8px var(--dp-accent-glow);
}

/* Checkbox */
.dp-check-box {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 2px solid var(--dp-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: var(--dp-bg-secondary);
  transition: all 0.15s;
}

.dp-check-box.dp-check-active {
  background-color: var(--dp-accent);
  border-color: var(--dp-accent);
}

.dp-check-box svg {
  width: 12px;
  height: 12px;
  stroke: white;
}

/* Role Info */
.dp-role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dp-role-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dp-role-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dp-text-primary);
}

.dp-role-badge {
  background: var(--dp-bg-hover);
  color: var(--dp-accent);
  border: 1px solid var(--dp-border-focus);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.dp-role-badge.dp-badge-custom {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.35);
}

.dp-role-desc {
  font-size: 11px;
  color: var(--dp-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dp-btn-del {
  background: none;
  border: none;
  color: var(--dp-text-muted);
  cursor: pointer;
  padding: 4px 6px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.15s;
}

.dp-btn-del:hover {
  background: var(--dp-error-bg);
  color: var(--dp-error);
}

/* Add Custom Role */
.dp-add-box {
  background-color: var(--dp-bg-secondary);
  border: 1px dashed var(--dp-border);
  border-radius: 8px;
  padding: 6px 10px;
}

.dp-add-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.dp-add-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--dp-text-primary);
  font-family: inherit;
}

.dp-add-input::placeholder {
  color: var(--dp-text-muted);
}

.dp-btn-add-mini {
  padding: 4px 10px;
  background-color: var(--dp-accent);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.dp-btn-add-mini:hover:not(:disabled) {
  background-color: var(--dp-accent-hover);
}

.dp-btn-add-mini:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Footer */
.dp-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid var(--dp-border-subtle);
  gap: 12px;
}

.dp-persist-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dp-text-secondary);
  cursor: pointer;
  user-select: none;
}

.dp-checkbox-native {
  width: 14px;
  height: 14px;
  accent-color: var(--dp-accent);
  cursor: pointer;
}

.dp-actions-group {
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
  transition: all 0.18s
    cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px var(--dp-accent-glow);
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
  transition: all 0.18s
    cubic-bezier(0.16, 1, 0.3, 1);
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
