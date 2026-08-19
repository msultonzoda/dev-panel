import { describe, it, expect } from 'vitest';
import { isReactive } from 'vue';
import { createPanelState } from '../panel-state';

describe('PanelState', () => {
  it('создаёт начальное состояние с корректными дефолтами', () => {
    const state = createPanelState();

    expect(state.isOpen).toBe(false);
    expect(state.activePlugin).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('состояние реактивно', () => {
    const state = createPanelState();
    expect(isReactive(state)).toBe(true);
  });

  it('каждый вызов создаёт независимый экземпляр', () => {
    const state1 = createPanelState();
    const state2 = createPanelState();

    state1.isOpen = true;
    expect(state2.isOpen).toBe(false);
  });
});
