# Руководство по разработке плагинов и расширений (Dev Panel)

Это исчерпывающее руководство по созданию пользовательских плагинов, адаптеров и расширений для Dev Panel. Оно предназначено как для разработчиков, так и для ИИ-агентов, чтобы писать плагины "с нуля" без необходимости изучать исходный код панели.

---

## 1. Архитектура Плагинов

Плагин в Dev Panel — это класс или объект, реализующий интерфейс `DevPanelPlugin`. Панель использует **Vue 3** для отрисовки интерфейса, но логика плагина отделена от фреймворка. 

Каждый плагин получает изолированный **контекст (`PluginContext`)**, через который он взаимодействует с ядром панели (EventBus, Config, State) и регистрирует свой UI.

### Интерфейс `DevPanelPlugin`

```typescript
export interface DevPanelPlugin {
  /** Уникальное имя плагина (используется как ID и отображается в UI) */
  readonly name: string;
  
  /** Версия вашего плагина (semver) */
  readonly version: string;
  
  /** 
   * Версия API ядра, с которой совместим плагин. 
   * Текущая версия: '1.0.0'
   */
  readonly apiVersion: string;
  
  /** SVG-иконка в формате строки для бокового меню (опционально) */
  readonly icon?: string;
  
  /** Порядок сортировки в сайдбаре (меньше = выше) */
  readonly order?: number;

  /** 
   * Главный метод инициализации. Вызывается ядром при загрузке плагина.
   * Здесь нужно подписаться на события и зарегистрировать Vue-компонент.
   */
  install(context: PluginContext): void;

  /** Опциональный хук: вызывается каждый раз при открытии панели */
  onPanelOpen?(): void;

  /** Опциональный хук: вызывается каждый раз при закрытии панели */
  onPanelClose?(): void;
}
```

### Объект `PluginContext`

Когда вызывается метод `install(context)`, вы получаете доступ к контексту:

```typescript
export interface PluginContext {
  /** Глобальная шина событий (EventBus). Используется для обмена сообщениями. */
  events: {
    on(event: string, handler: (payload: any) => void): void;
    off(event: string, handler: (payload: any) => void): void;
    emit(event: string, payload?: any): void;
  };
  
  /** Доступ к конфигурации, переданной при инициализации (ConfigAdapter) */
  config: {
    getEnvironment(): string;
    getBuildInfo(): Record<string, string>;
    getRuntimeConfig(): Record<string, unknown>;
  };
  
  /** Текущее состояние панели (только для чтения) */
  state: {
    isOpen: boolean;
    activePlugin: string | null;
  };
  
  /** 
   * Регистрация корневого Vue-компонента плагина.
   * Component — это валидный Vue 3 компонент (defineComponent или импортированный .vue файл)
   */
  registerView(component: Component): void;
}
```

---

## 2. Создание UI Плагина (Шаблон)

Чаще всего плагин состоит из двух файлов: логики плагина (`Plugin.ts`) и его отображения (`View.vue`).

### Шаг 2.1: Vue-компонент (`View.vue`)

Вам нужно передать `PluginContext` внутрь компонента через пропсы, чтобы компонент мог взаимодействовать с ядром (например, читать конфиг или слушать события).

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { PluginContext } from 'dev-panel';

const props = defineProps<{ context: PluginContext }>();
const myData = ref<string[]>([]);

const handleEvent = (payload: any) => {
  myData.value.push(payload);
};

onMounted(() => {
  // Подписка на кастомное событие приложения
  props.context.events.on('app:some-event', handleEvent);
});

onUnmounted(() => {
  // Не забывайте отписываться при уничтожении!
  props.context.events.off('app:some-event', handleEvent);
});
</script>

<template>
  <div style="padding: 20px;">
    <h2>Мой Плагин</h2>
    <p>Окружение: {{ context.config.getEnvironment() }}</p>
    <ul>
      <li v-for="(item, i) in myData" :key="i">{{ item }}</li>
    </ul>
  </div>
</template>
```

### Шаг 2.2: Класс плагина (`Plugin.ts`)

Оборачиваем компонент в функцию `h` (создание виртуального DOM-узла Vue), чтобы прокинуть пропс `context`.

```typescript
import { defineComponent, h } from 'vue';
import type { DevPanelPlugin, PluginContext } from 'dev-panel';
// Импортируем CORE_API_VERSION, чтобы не сломаться при обновлениях панели
import { CORE_API_VERSION } from 'dev-panel';
import MyView from './View.vue';

export class MyCustomPlugin implements DevPanelPlugin {
  name = 'Awesome Tool';
  version = '1.0.0';
  apiVersion = CORE_API_VERSION;
  order = 100;
  icon = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="..."/></svg>`;

  install(context: PluginContext): void {
    // Регистрация UI
    context.registerView(
      defineComponent({
        render: () => h(MyView, { context })
      })
    );
    
    // Также здесь можно перехватывать системные события панели:
    context.events.on('panel:open', () => console.log('Панель открыта!'));
  }
}
```

---

## 3. Расширение через Адаптеры (Adapters)

Если плагины расширяют **функционал**, то адаптеры изменяют **поведение ядра**. При инициализации `createPanelManager` вы обязаны передать реализации адаптеров:

### 3.1. `AuthAdapter` (Авторизация)
Определяет, кто имеет доступ к панели.

```typescript
import type { AuthAdapter, AuthResult } from 'dev-panel';

export class MyCustomAuth implements AuthAdapter {
  // Если false, панель попытается войти скрыто, не показывая окно логина.
  requiresInteraction = true; 

  async authenticate(credentials?: Record<string, any>): Promise<AuthResult> {
    if (credentials?.password === 'secret') {
      return { success: true, session: { token: '123' } };
    }
    return { success: false, error: 'Неверный пароль' };
  }

  async restoreSession(): Promise<AuthSession | null> {
    // Логика восстановления (например, из cookie)
    return null; 
  }
}
```

### 3.2. `SessionAdapter` (Хранение сессии)
Определяет, где хранится сессия авторизации между перезагрузками. В комплекте уже есть `LocalStorageSessionAdapter` и `MemorySessionAdapter`.

### 3.3. `TriggerAdapter` (Способ открытия панели)
Определяет, какое действие вызывает окно. По умолчанию это `KeyboardTriggerAdapter` (открытие по шорткату).
Вы можете написать, например, `ClickTriggerAdapter` (открытие по 5-кратному клику на логотип).

```typescript
import type { TriggerAdapter, TriggerCallbacks } from 'dev-panel';

export class SecretClickTrigger implements TriggerAdapter {
  private count = 0;
  private callbacks?: TriggerCallbacks;

  init(callbacks: TriggerCallbacks) {
    this.callbacks = callbacks;
    window.addEventListener('click', this.onClick);
  }

  destroy() {
    window.removeEventListener('click', this.onClick);
  }

  private onClick = () => {
    this.count++;
    if (this.count >= 5) {
      this.callbacks?.requestOpen(); // Просит панель открыться
      this.count = 0;
    }
  }
}
```

---

## 4. Лучшие практики и правила для ИИ-Агентов

1. **Не используйте глобальные состояния Vue (`App.provide` / `Pinia`)**. Плагины должны быть полностью изолированы. Вся глобальная коммуникация — строго через `context.events`.
2. **Стилизуйте изолированно**. В компонентах `.vue` всегда используйте `<style scoped>`. Не ломайте стили хост-приложения.
3. **Используйте дизайн-токены**. Панель предоставляет CSS переменные, привязанные к темной/светлой теме:
   - `--dp-bg-primary`, `--dp-bg-secondary`
   - `--dp-text-primary`, `--dp-text-secondary`
   - `--dp-border`, `--dp-accent`, `--dp-error`
   *Используйте их в своих плагинах, чтобы они автоматически поддерживали смену темы!*
4. **Неблокирующий UI**. Если плагин делает тяжелый запрос, используйте состояние `isLoading` внутри вашего компонента. Панель не должна зависать.
5. **Безопасность**. Не выводите секретные данные в `SystemInfoPlugin` или `ActionLogPlugin` на продакшене.
