<script setup lang="ts">
import { ref } from 'vue';

defineOptions({
  name: 'DemoApp',
});

const counter = ref(0);
const lastAction = ref('');

const increment = () => {
  counter.value++;
  lastAction.value = `Counter incremented to ${counter.value}`;

  if (window.__devPanelBus) {
    window.__devPanelBus.emit('app:action', {
      action: 'increment',
      value: counter.value,
    });
  }
};
</script>

<template>
  <div class="app-container">
    <header class="hero-section">
      <div class="badge">Demo Environment</div>
      <h1>Host Application</h1>
      <p class="subtitle">
        Simulated host application with integrated
        <strong>Dev Panel</strong>.
      </p>
      <div class="shortcut-tip">
        Press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> +
        <kbd>D</kbd> (or click the floating pill)
        to toggle the Dev Panel.
      </div>
    </header>

    <div class="state-card">
      <h3>Host App State Simulator</h3>
      <div class="counter-display">
        <span class="counter-label">
          Counter Value
        </span>
        <span class="counter-number">{{
          counter
        }}</span>
      </div>
      <div class="btn-group">
        <button
          class="primary-btn"
          @click="increment">
          Increment Counter (+1)
        </button>
      </div>
      <p
        v-if="lastAction"
        class="last-action">
        ⚡ {{ lastAction }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 720px;
  margin: 60px auto;
  padding: 0 24px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Inter',
    'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  margin-bottom: 12px;
}

h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0 0 20px 0;
}

.shortcut-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
}

kbd {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.state-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}

.state-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
}

.counter-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 20px;
}

.counter-label {
  font-weight: 500;
  color: #64748b;
}

.counter-number {
  font-size: 28px;
  font-weight: 800;
  color: #6366f1;
  font-family: monospace;
}

.btn-group {
  display: flex;
  gap: 12px;
}

.primary-btn {
  padding: 10px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}

.last-action {
  margin: 16px 0 0 0;
  font-size: 13px;
  color: #10b981;
  font-weight: 500;
}
</style>
