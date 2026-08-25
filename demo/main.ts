import { createApp } from 'vue';
import DemoApp from './DemoApp.vue';

import {
  createPanelManager,
  KeyboardTriggerAdapter,
  LocalStorageSessionAdapter,
  StubAuthAdapter,
  StaticConfigAdapter,
  mountDevPanel,
  SystemInfoPlugin,
  ActionLogPlugin,
  ErrorGeneratorPlugin,
  EnvSwitcherPlugin,
  RoleEditorPlugin,
  type EventBus,
} from '../src';

// 1. Initialize host application
const app = createApp(DemoApp);
app.mount('#app');

// 2. Initialize Dev Panel with EnvSwitcher and RoleEditor
const manager = createPanelManager({
  trigger: new KeyboardTriggerAdapter({
    shortcut: 'CTRL_ALT_D',
  }),
  auth: new StubAuthAdapter(),
  session: new LocalStorageSessionAdapter(),
  config: new StaticConfigAdapter({
    environment: 'development',
    buildInfo: {
      version: '0.0.3-demo',
      buildDate: new Date().toISOString(),
    },
    runtimeConfig: {
      client: 'B2B Client Interface',
    },
  }),
  plugins: [
    new SystemInfoPlugin(),
    // 1. Переключатель сред (.development vs .production)
    new EnvSwitcherPlugin({
      defaultEnvId: 'dev',
      environments: [
        {
          id: 'dev',
          name: 'Development (.env.development)',
          description:
            'Тестовая среда разработки со стендовыми API и эмуляторами',
          variables: {
            VITE_BASE_URL:
              'https://api-dev.jura.local/v1',
            VITE_WS_URL:
              'wss://ws-dev.jura.local/orders',
            VITE_APP_MODE: 'development',
          },
        },
        {
          id: 'prod',
          name: 'Production (.env.production)',
          description:
            'Боевая среда (реальные данные, боевые сервера)',
          isProduction: true,
          variables: {
            VITE_BASE_URL:
              'https://api.jura.com/v1',
            VITE_WS_URL:
              'wss://ws.jura.com/orders',
            VITE_APP_MODE: 'production',
          },
        },
      ],
    }),
    // 2. Гибкий редактор ролей (запись в любое поле стора)
    new RoleEditorPlugin({
      defaultRoleId: 'b2b_employee',
      roles: [
        {
          id: 'b2b_admin',
          name: 'B2B Администратор',
          badge: 'ADMIN',
          description:
            'Управление сотрудниками, лимитами компании и договором',
          value: {
            role: 'b2b_admin',
            permissions: [
              'orders:create',
              'employees:manage',
              'billing:view',
            ],
            companyId: 101,
          },
        },
        {
          id: 'b2b_employee',
          name: 'B2B Сотрудник с лимитом',
          badge: 'EMPLOYEE',
          description:
            'Заказ такси в пределах корпоративного лимита',
          value: {
            role: 'b2b_employee',
            permissions: ['orders:create'],
            corporateLimit: 25000,
            companyId: 101,
          },
        },
        {
          id: 'b2c_passenger',
          name: 'Обычный клиент (B2C)',
          badge: 'CLIENT',
          description:
            'Личный аккаунт, оплата банковской картой',
          value: 'client',
        },
      ],
      // Гибкий коллбек: здесь можно записать значение в любой стор Pinia!
      onRoleChange: (val) => {
        console.log(
          '🔄 DevPanel: Роль изменена на:',
          val,
        );
        // В реальном проекте: userStore.role = val (или userStore.setRole(val))
      },
    }),
    new ErrorGeneratorPlugin(),
    new ActionLogPlugin(),
  ],
});

// 3. Mount UI
mountDevPanel(manager, 'dark');

// Expose EventBus for demo purposes
declare global {
  interface Window {
    __devPanelBus?: EventBus;
  }
}
window.__devPanelBus = manager.getEventBus();

console.log(
  '✅ Dev Panel initialized. Press Ctrl+Alt+D to open.',
);
