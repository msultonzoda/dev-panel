import { reactive } from 'vue';
import type { PanelState } from '@/types';

export function createPanelState(): PanelState {
  return reactive<PanelState>({
    isOpen: false,
    activePlugin: null,
    isAuthenticated: false,
    session: null,
    isLoading: false,
    error: null,
  });
}
