# 🚀 Dev Panel for Vue 3

> Мощная, расширяемая и типобезопасная панель разработчика для Vue 3 приложений с поддержкой микро-плагинов, адаптеров авторизации, переключения окружений, управления ролями и фиче-флагами.

---

## 🌟 Особенности

- 🧩 **Расширяемая архитектура плагинов**: Добавляйте собственные вкладки в сайдбар или используйте богатый набор встроенных плагинов.
- 🌐 **Environment Switcher**: Мгновенное переключение API endpoints и окружений (Dev, Staging, Prod) без пересборки приложения.
- 🚩 **Feature Flags**: Живое управление фиче-флагами и A/B тестами с реактивным хуком `useFeatureFlag` и синхронным `isFeatureEnabled`.
- 🎭 **Role Editor**: Быстрое переключение ролей пользователя и прав доступа с автоматической реактивной синхронизацией Pinia store.
- 📜 **Action Log**: Хронологический лог событий и действий пользователя (незаменимо для тестирования и QA).
- 🔐 **Гибкая авторизация (Auth Adapters)**: Защита доступа (по паролю, скрытым токенам, комбинациям клавиш).
- 🎨 **Современный Glassmorphism UI**: Адаптивный дизайн, темная и светлая темы, плавные микро-анимации.
- 📦 **Zero-cost в Production (Tree-Shaking)**: Изолированный триггер весит всего ~0.5 KB, основной бандл панели загружается только по требованию (динамический импорт).
- 🛡️ **Изоляция ошибок (Error Boundaries)**: Ошибка внутри плагина никогда не сломает хост-приложение.

---

## 📦 Установка

### Из Git-репозитория (GitHub):
```bash
npm install github:<username>/dev-panel#v0.1.0
```
*или через SSH:*
```bash
npm install git+ssh://git@github.com:<username>/dev-panel.git
```

> **Примечание:** `vue` (^3.3.0) и `pinia` (опционально) используются в качестве peer dependencies.

---

## 🚀 Быстрый старт

### 1. Подключение в приложении (`src/main.ts` или `providers/dev-panel/index.ts`)

```ts
import { createApp } from 'vue';
import App from './App.vue';
import { useProfileStore } from '@/entities/profile';

const app = createApp(App);

if (import.meta.env.DEV) {
  // Динамически загружаем Dev Panel только для разработки и стейджинга
  import('dev-panel').then(({
    createPanelManager,
    KeyboardTriggerAdapter,
    LocalStorageSessionAdapter,
    StubAuthAdapter,
    StaticConfigAdapter,
    mountDevPanel,
    EnvSwitcherPlugin,
    FeatureFlagsPlugin,
    RoleEditorPlugin,
    ActionLogPlugin,
    SystemInfoPlugin,
  }) => {
    const manager = createPanelManager({
      // Открытие панели по хоткею Ctrl + Shift + D (или Ctrl + Alt + D)
      trigger: new KeyboardTriggerAdapter({ shortcut: 'CTRL_SHIFT_D' }),
      auth: new StubAuthAdapter(),
      session: new LocalStorageSessionAdapter(),
      config: new StaticConfigAdapter({
        environment: 'development',
        buildInfo: {
          version: '1.0.0',
          commitHash: 'a1b2c3d',
        },
      }),
      plugins: [
        // 1. Переключатель окружений
        new EnvSwitcherPlugin({
          environments: [
            {
              id: 'dev',
              name: 'Development',
              variables: { VITE_API_URL: 'https://dev-api.example.com' },
            },
            {
              id: 'staging',
              name: 'Staging',
              variables: { VITE_API_URL: 'https://stage-api.example.com' },
            },
            {
              id: 'prod',
              name: 'Production',
              isProduction: true,
              variables: { VITE_API_URL: 'https://api.example.com' },
            },
          ],
        }),

        // 2. Управление фиче-флагами
        new FeatureFlagsPlugin({
          flags: [
            {
              key: 'new_dashboard',
              name: 'Новый дашборд',
              description: 'Редизайн главной страницы',
              defaultValue: false,
              group: 'UI',
            },
            {
              key: 'ab_pricing_test',
              name: 'A/B тест тарифов',
              defaultValue: 'control',
              type: 'string',
              options: [
                { label: 'Control (Базовый)', value: 'control' },
                { label: 'Variant A (Скидка 15%)', value: 'variant_a' },
              ],
              group: 'Billing',
            },
          ],
        }),

        // 3. Редактор ролей с синхронизацией Pinia
        new RoleEditorPlugin({
          piniaStore: () => useProfileStore(),
          storePath: 'profile.company_member_roles',
          roles: [
            { id: 'client', name: 'Клиент' },
            { id: 'logistic', name: 'Логист' },
            { id: 'master', name: 'Мастер' },
          ],
        }),

        // 4. Лог действий и системная информация
        new ActionLogPlugin(),
        new SystemInfoPlugin(),
      ],
    });

    mountDevPanel(manager, 'dark');
  });
}

app.mount('#app');
```

---

## 🚩 Использование Feature Flags в коде

### В компонентах Vue 3 (Реактивно):

```vue
<script setup lang="ts">
import { useFeatureFlag } from 'dev-panel';

const isNewDashboard = useFeatureFlag('new_dashboard');
const pricingVariant = useFeatureFlag<string>('ab_pricing_test', 'control');
</script>

<template>
  <NewDashboardView v-if="isNewDashboard" />
  <OldDashboardView v-else />
</template>
```

### В Router Guards или Axios интерцепторах (Синхронно):

```ts
import { isFeatureEnabled, getFeatureFlag } from 'dev-panel';

router.beforeEach((to) => {
  if (to.meta.requiresNewDashboard && !isFeatureEnabled('new_dashboard')) {
    return { name: 'home' };
  }
});
```

---

## 🔌 Создание собственного плагина

Плагин представляет собой класс или объект, реализующий интерфейс `DevPanelPlugin`:

```vue
<!-- CustomDiagnosticsView.vue -->
<script setup lang="ts">
import type { PluginContext } from 'dev-panel';

defineOptions({ name: 'CustomDiagnosticsView' });
defineProps<{ context: PluginContext }>();
</script>

<template>
  <div style="padding: 20px;">
    <h3>Мой кастомный инструмент</h3>
    <button @click="localStorage.clear()">Очистить Storage</button>
  </div>
</template>
```

```ts
// CustomDiagnosticsPlugin.ts
import { defineComponent, h } from 'vue';
import type { DevPanelPlugin, PluginContext } from 'dev-panel';
import CustomDiagnosticsView from './CustomDiagnosticsView.vue';

export class CustomDiagnosticsPlugin implements DevPanelPlugin {
  name = 'Diagnostics';
  version = '1.0.0';
  apiVersion = '1.0.0';
  order = 30; // Порядковый номер в меню
  
  // SVG иконка для сайдбара
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;

  install(context: PluginContext): void {
    context.registerView(
      defineComponent({
        render: () => h(CustomDiagnosticsView, { context }),
      }),
    );
  }
}
```

---

## 🧱 Архитектура ядра

```
dev-panel/
├── core/            # Ядро панели: менеджер, шина событий, стейт, реестр плагинов
├── adapters/        # Адаптеры (Auth, Config, Session, Trigger)
├── plugins/         # Встроенные модули (EnvSwitcher, FeatureFlags, RoleEditor, ActionLog, SystemInfo)
├── ui/              # Компоненты интерфейса, сайдбар, стили, модальное окно
└── types/           # Полная типизация TypeScript
```

---

## 🧪 Разработка и тестирование

```bash
# Установка зависимостей
npm install

# Запуск демо-стенда
npm run dev:demo

# Запуск тестов
npm run test

# Линтинг и форматирование
npm run lint:fix
npm run format

# Сборка production пакета
npm run build
```

---

## 📄 Лицензия

[MIT](./LICENSE)
