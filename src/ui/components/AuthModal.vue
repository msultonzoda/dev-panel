<script setup lang="ts">
import { ref } from 'vue';

defineOptions({
  name: 'AuthModal',
});

defineProps<{
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'success',
    session: { token: string },
  ): void;
  (e: 'error', error: string): void;
}>();

const login = ref('');
const password = ref('');
const error = ref('');

const handleSubmit = () => {
  error.value = '';

  if (!login.value || !password.value) {
    error.value = 'Please fill in both fields';
    return;
  }

  // This is a default form, it just passes data back.
  // The actual authentication is done by the adapter.
  emit('success', {
    token: 'token-from-default-form',
  });
};
</script>

<template>
  <div class="dp-auth-container">
    <div class="dp-auth-card">
      <div class="dp-auth-icon-wrap">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round">
          <rect
            x="3"
            y="11"
            width="18"
            height="11"
            rx="2"
            ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h2 class="dp-auth-title">
        Dev Panel Access
      </h2>
      <p class="dp-auth-subtitle">
        Enter credentials to unlock developer
        tools
      </p>

      <form
        class="dp-auth-form"
        @submit.prevent="handleSubmit">
        <div class="dp-form-group">
          <label>Login</label>
          <input
            v-model="login"
            type="text"
            placeholder="developer"
            :disabled="isLoading" />
        </div>

        <div class="dp-form-group">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            :disabled="isLoading" />
        </div>

        <div
          v-if="error"
          class="dp-error-msg">
          {{ error }}
        </div>

        <button
          type="submit"
          class="dp-submit-btn"
          :disabled="isLoading">
          {{
            isLoading
              ? 'Authenticating...'
              : 'Unlock Panel'
          }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.dp-auth-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--dp-bg-primary);
  padding: 24px;
}

.dp-auth-card {
  width: 320px;
  padding: 32px 28px;
  background-color: var(
    --dp-bg-card,
    var(--dp-bg-secondary)
  );
  border: 1px solid var(--dp-border);
  border-radius: 14px;
  box-shadow: var(--dp-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dp-auth-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background-color: var(--dp-bg-active);
  border: 1px solid var(--dp-border-focus);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dp-accent);
  margin-bottom: 16px;
}

.dp-auth-icon-wrap svg {
  width: 20px;
  height: 20px;
}

.dp-auth-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  text-align: center;
  color: var(--dp-text-primary);
  letter-spacing: -0.3px;
}

.dp-auth-subtitle {
  font-size: 12px;
  color: var(--dp-text-secondary);
  margin-bottom: 22px;
  text-align: center;
}

.dp-auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.dp-form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dp-form-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--dp-text-secondary);
}

.dp-form-group input {
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--dp-border);
  background-color: var(--dp-bg-secondary);
  color: var(--dp-text-primary);
  outline: none;
  font-size: 13px;
  transition: all 0.2s;
}

.dp-form-group input:focus {
  border-color: var(--dp-border-focus);
  box-shadow: 0 0 0 2px var(--dp-accent-glow);
}

.dp-error-msg {
  color: var(--dp-error);
  font-size: 12px;
  text-align: center;
  background-color: var(--dp-error-bg);
  padding: 6px 10px;
  border-radius: 6px;
}

.dp-submit-btn {
  margin-top: 6px;
  padding: 10px;
  background-color: var(--dp-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s
    cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px var(--dp-accent-glow);
}

.dp-submit-btn:hover:not(:disabled) {
  background-color: var(--dp-accent-hover);
  transform: translateY(-1px);
}

.dp-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
