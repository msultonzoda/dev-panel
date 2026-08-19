<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
} from 'vue';

defineOptions({
  name: 'DevPanelModal',
});

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Constants
const EDGE_OFFSET = 20;
const COLLAPSED_WIDTH = 200;
const COLLAPSED_HEIGHT = 44;
const DEFAULT_EXPANDED_WIDTH = 840;
const DEFAULT_EXPANDED_HEIGHT = 580;

const isMinimized = ref(false);
const position = ref({ x: 20, y: 20 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const initialPosition = ref({ x: 0, y: 0 });
const hasDragged = ref(false);

const modalWidth = computed(() => {
  if (isMinimized.value) return COLLAPSED_WIDTH;
  if (typeof window === 'undefined')
    return DEFAULT_EXPANDED_WIDTH;
  return Math.min(
    DEFAULT_EXPANDED_WIDTH,
    window.innerWidth - EDGE_OFFSET * 2,
  );
});

const modalHeight = computed(() => {
  if (isMinimized.value) return COLLAPSED_HEIGHT;
  if (typeof window === 'undefined')
    return DEFAULT_EXPANDED_HEIGHT;
  return Math.min(
    DEFAULT_EXPANDED_HEIGHT,
    window.innerHeight - EDGE_OFFSET * 2,
  );
});

// Clamp position inside screen bounds
const clampPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  if (typeof window === 'undefined')
    return { x, y };
  const maxX = Math.max(
    0,
    window.innerWidth - width,
  );
  const maxY = Math.max(
    0,
    window.innerHeight - height,
  );
  return {
    x: Math.max(0, Math.min(maxX, x)),
    y: Math.max(0, Math.min(maxY, y)),
  };
};

// Snap minimized pill to the nearest horizontal edge
const snapToNearestEdge = (
  currX: number,
  currY: number,
) => {
  if (typeof window === 'undefined')
    return { x: currX, y: currY };
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const pillCenter = currX + COLLAPSED_WIDTH / 2;

  // Snap to left or right edge with margin
  const snappedX =
    pillCenter < screenW / 2
      ? EDGE_OFFSET
      : screenW - COLLAPSED_WIDTH - EDGE_OFFSET;

  const clampedY = Math.max(
    EDGE_OFFSET,
    Math.min(
      screenH - COLLAPSED_HEIGHT - EDGE_OFFSET,
      currY,
    ),
  );

  return { x: snappedX, y: clampedY };
};

const STORAGE_KEY_MODAL_STATE =
  'dev_panel_modal_state';

interface SavedModalState {
  isMinimized?: boolean;
  position?: { x: number; y: number };
}

const saveModalState = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY_MODAL_STATE,
      JSON.stringify({
        isMinimized: isMinimized.value,
        position: position.value,
      }),
    );
  } catch {
    /* empty */
  }
};

// Smart expand into the direction where there is enough screen space
const expandSmartly = () => {
  if (typeof window === 'undefined') {
    isMinimized.value = false;
    return;
  }

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const targetW = Math.min(
    DEFAULT_EXPANDED_WIDTH,
    screenW - EDGE_OFFSET * 2,
  );
  const targetH = Math.min(
    DEFAULT_EXPANDED_HEIGHT,
    screenH - EDGE_OFFSET * 2,
  );

  const currX = position.value.x;
  const currY = position.value.y;

  // Horizontal space calculation
  const spaceRight = screenW - currX;
  const spaceLeft = currX + COLLAPSED_WIDTH;
  let targetX = currX;

  if (spaceRight >= targetW + EDGE_OFFSET) {
    // Expand towards the right
    targetX = currX;
  } else if (spaceLeft >= targetW + EDGE_OFFSET) {
    // Expand towards the left
    targetX = currX + COLLAPSED_WIDTH - targetW;
  } else {
    // Fallback: center horizontally or clamp
    targetX = Math.max(
      EDGE_OFFSET,
      Math.min(
        screenW - targetW - EDGE_OFFSET,
        currX,
      ),
    );
  }

  // Vertical space calculation
  const spaceBottom = screenH - currY;
  const spaceTop = currY + COLLAPSED_HEIGHT;
  let targetY = currY;

  if (spaceBottom >= targetH + EDGE_OFFSET) {
    // Expand downwards
    targetY = currY;
  } else if (spaceTop >= targetH + EDGE_OFFSET) {
    // Expand upwards
    targetY = currY + COLLAPSED_HEIGHT - targetH;
  } else {
    // Fallback: center vertically or clamp
    targetY = Math.max(
      EDGE_OFFSET,
      Math.min(
        screenH - targetH - EDGE_OFFSET,
        currY,
      ),
    );
  }

  position.value = { x: targetX, y: targetY };
  isMinimized.value = false;
  saveModalState();
};

// Collapse and snap to closest edge
const collapseSmartly = () => {
  const targetW = modalWidth.value;
  const centerX = position.value.x + targetW / 2;
  const screenW = window.innerWidth;

  const targetX =
    centerX < screenW / 2
      ? EDGE_OFFSET
      : screenW - COLLAPSED_WIDTH - EDGE_OFFSET;

  const targetY = Math.max(
    EDGE_OFFSET,
    Math.min(
      window.innerHeight -
        COLLAPSED_HEIGHT -
        EDGE_OFFSET,
      position.value.y,
    ),
  );

  position.value = { x: targetX, y: targetY };
  isMinimized.value = true;
  saveModalState();
};

const toggleMinimize = () => {
  if (isMinimized.value) {
    expandSmartly();
  } else {
    collapseSmartly();
  }
};

// Drag Handlers
const startDrag = (
  clientX: number,
  clientY: number,
) => {
  isDragging.value = true;
  hasDragged.value = false;
  dragStart.value = { x: clientX, y: clientY };
  initialPosition.value = { ...position.value };

  window.addEventListener(
    'mousemove',
    handleMouseMove,
  );
  window.addEventListener(
    'mouseup',
    handleMouseUp,
  );
  window.addEventListener(
    'touchmove',
    handleTouchMove,
    { passive: false },
  );
  window.addEventListener(
    'touchend',
    handleTouchEnd,
  );
};

const updateDrag = (
  clientX: number,
  clientY: number,
) => {
  if (!isDragging.value) return;

  const dx = clientX - dragStart.value.x;
  const dy = clientY - dragStart.value.y;

  if (Math.hypot(dx, dy) > 4) {
    hasDragged.value = true;
  }

  const currentW = modalWidth.value;
  const currentH = modalHeight.value;

  position.value = clampPosition(
    initialPosition.value.x + dx,
    initialPosition.value.y + dy,
    currentW,
    currentH,
  );
};

const endDrag = () => {
  if (!isDragging.value) return;
  isDragging.value = false;

  window.removeEventListener(
    'mousemove',
    handleMouseMove,
  );
  window.removeEventListener(
    'mouseup',
    handleMouseUp,
  );
  window.removeEventListener(
    'touchmove',
    handleTouchMove,
  );
  window.removeEventListener(
    'touchend',
    handleTouchEnd,
  );

  // If minimized, snap to nearest screen edge on release
  if (isMinimized.value) {
    position.value = snapToNearestEdge(
      position.value.x,
      position.value.y,
    );
  }

  saveModalState();
};

const handleMouseDown = (e: MouseEvent) => {
  // Prevent dragging when clicking on control buttons
  const target = e.target as HTMLElement;
  if (
    target.closest('.dp-control-btn') ||
    target.closest('button')
  )
    return;
  startDrag(e.clientX, e.clientY);
};

const handleMouseMove = (e: MouseEvent) => {
  updateDrag(e.clientX, e.clientY);
};

const handleMouseUp = () => {
  endDrag();
};

const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0];
  if (!touch) return;
  const target = e.target as HTMLElement;
  if (
    target.closest('.dp-control-btn') ||
    target.closest('button')
  )
    return;
  startDrag(touch.clientX, touch.clientY);
};

const handleTouchMove = (e: TouchEvent) => {
  const touch = e.touches[0];
  if (!touch) return;
  e.preventDefault();
  updateDrag(touch.clientX, touch.clientY);
};

const handleTouchEnd = () => {
  endDrag();
};

const handlePillClick = () => {
  // Only expand if it was a click, not a drag gesture
  if (!hasDragged.value && isMinimized.value) {
    expandSmartly();
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
};

const handleWindowResize = () => {
  if (isMinimized.value) {
    position.value = snapToNearestEdge(
      position.value.x,
      position.value.y,
    );
  } else {
    position.value = clampPosition(
      position.value.x,
      position.value.y,
      modalWidth.value,
      modalHeight.value,
    );
  }
};

onMounted(() => {
  // Initial smart positioning in the bottom-right or center-right
  if (typeof window !== 'undefined') {
    let restored = false;
    try {
      const raw = localStorage.getItem(
        STORAGE_KEY_MODAL_STATE,
      );
      if (raw) {
        const saved: SavedModalState =
          JSON.parse(raw);
        if (
          typeof saved.isMinimized === 'boolean'
        ) {
          isMinimized.value = saved.isMinimized;
        }
        if (
          saved.position &&
          typeof saved.position.x === 'number' &&
          typeof saved.position.y === 'number'
        ) {
          const w = isMinimized.value
            ? COLLAPSED_WIDTH
            : DEFAULT_EXPANDED_WIDTH;
          const h = isMinimized.value
            ? COLLAPSED_HEIGHT
            : DEFAULT_EXPANDED_HEIGHT;
          position.value = clampPosition(
            saved.position.x,
            saved.position.y,
            w,
            h,
          );
          restored = true;
        }
      }
    } catch {
      /* empty */
    }

    if (!restored) {
      const defaultX = Math.max(
        EDGE_OFFSET,
        window.innerWidth -
          DEFAULT_EXPANDED_WIDTH -
          EDGE_OFFSET,
      );
      const defaultY = Math.max(
        EDGE_OFFSET,
        window.innerHeight -
          DEFAULT_EXPANDED_HEIGHT -
          EDGE_OFFSET,
      );
      position.value = clampPosition(
        defaultX,
        defaultY,
        DEFAULT_EXPANDED_WIDTH,
        DEFAULT_EXPANDED_HEIGHT,
      );
    }
  }

  document.addEventListener(
    'keydown',
    handleKeyDown,
  );
  window.addEventListener(
    'resize',
    handleWindowResize,
  );
});

onUnmounted(() => {
  document.removeEventListener(
    'keydown',
    handleKeyDown,
  );
  window.removeEventListener(
    'resize',
    handleWindowResize,
  );
  window.removeEventListener(
    'mousemove',
    handleMouseMove,
  );
  window.removeEventListener(
    'mouseup',
    handleMouseUp,
  );
  window.removeEventListener(
    'touchmove',
    handleTouchMove,
  );
  window.removeEventListener(
    'touchend',
    handleTouchEnd,
  );
});
</script>

<template>
  <Teleport to="body">
    <Transition name="dp-fade">
      <div
        v-if="isOpen"
        class="dp-root"
        :class="{
          'dp-is-minimized': isMinimized,
          'dp-is-dragging': isDragging,
        }"
      >
        <div
          class="dp-modal-window"
          :style="{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            width: `${modalWidth}px`,
            height: `${modalHeight}px`,
          }"
          @mousedown="
            isMinimized
              ? handleMouseDown($event)
              : undefined
          "
          @touchstart="
            isMinimized
              ? handleTouchStart($event)
              : undefined
          "
          @click="
            isMinimized
              ? handlePillClick()
              : undefined
          "
        >
          <!-- Header Bar (or Collapsed Capsule Bar) -->
          <div
            class="dp-modal-header"
            @mousedown="
              !isMinimized
                ? handleMouseDown($event)
                : undefined
            "
            @touchstart="
              !isMinimized
                ? handleTouchStart($event)
                : undefined
            "
          >
            <!-- Left title area / brand -->
            <div class="dp-header-left">
              <div class="dp-brand-badge">
                <span class="dp-status-dot" />
                <svg
                  class="dp-bolt-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polygon
                    points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                    fill="currentColor"
                  />
                </svg>
                <span class="dp-modal-title">Dev Panel</span>
              </div>
            </div>

            <!-- Controls area -->
            <div class="dp-modal-controls">
              <!-- Minimize / Expand Button -->
              <button
                class="dp-control-btn"
                :title="
                  isMinimized
                    ? 'Expand panel'
                    : 'Minimize to pill'
                "
                aria-label="Toggle Minimize"
                @click.stop="toggleMinimize"
              >
                <svg
                  v-if="!isMinimized"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                  />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline
                    points="15 3 21 3 21 9"
                  />
                  <polyline
                    points="9 21 3 21 3 15"
                  />
                  <line
                    x1="21"
                    y1="3"
                    x2="14"
                    y2="10"
                  />
                  <line
                    x1="3"
                    y1="21"
                    x2="10"
                    y2="14"
                  />
                </svg>
              </button>

              <!-- Close Button -->
              <button
                class="dp-control-btn dp-close-btn"
                title="Close panel (Esc)"
                aria-label="Close Dev Panel"
                @click.stop="emit('close')"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line
                    x1="18"
                    y1="6"
                    x2="6"
                    y2="18"
                  />
                  <line
                    x1="6"
                    y1="6"
                    x2="18"
                    y2="18"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Body Content (Hidden when Minimized) -->
          <div
            v-show="!isMinimized"
            class="dp-modal-body"
          >
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dp-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999999;
  font-family: var(--dp-font-family);
}

.dp-modal-window {
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--dp-bg-primary);
  border: 1px solid var(--dp-border);
  border-radius: var(--dp-radius-modal, 16px);
  box-shadow: var(--dp-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  backdrop-filter: var(--dp-backdrop-blur);
  -webkit-backdrop-filter: var(
    --dp-backdrop-blur
  );
  will-change: transform, width, height;
  transition:
    transform 0.32s cubic-bezier(0.16, 1, 0.3, 1),
    width 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    border-radius 0.28s ease,
    box-shadow 0.28s ease;
}

/* When actively dragging, disable transitions for 1:1 real-time tracking */
.dp-is-dragging .dp-modal-window {
  transition: none !important;
  user-select: none;
}

/* Minimized Pill Styling */
.dp-is-minimized .dp-modal-window {
  border-radius: var(--dp-radius-pill, 24px);
  box-shadow: var(--dp-shadow-pill);
  background-color: var(--dp-bg-pill);
  cursor: grab;
}

.dp-is-minimized.dp-is-dragging .dp-modal-window {
  cursor: grabbing;
}

.dp-is-minimized .dp-modal-window:hover {
  box-shadow:
    0 14px 34px -4px rgba(0, 0, 0, 0.55),
    0 0 0 1px var(--dp-border-focus),
    0 0 24px var(--dp-accent-glow);
}

.dp-modal-header {
  height: 44px;
  background-color: var(--dp-bg-header);
  border-bottom: 1px solid var(--dp-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px 0 16px;
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.dp-modal-header:active {
  cursor: grabbing;
}

.dp-is-minimized .dp-modal-header {
  height: 44px;
  border-bottom: none;
  padding: 0 10px 0 14px;
  background-color: transparent;
}

.dp-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dp-brand-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--dp-text-primary);
}

.dp-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--dp-success);
  box-shadow: 0 0 8px var(--dp-success);
  animation: dp-pulse 2.2s infinite ease-in-out;
  flex-shrink: 0;
}

@keyframes dp-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(0.85);
  }
}

.dp-bolt-icon {
  width: 14px;
  height: 14px;
  color: var(--dp-accent);
  display: block;
}

.dp-modal-title {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: -0.2px;
  color: var(--dp-text-primary);
  white-space: nowrap;
}

.dp-modal-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dp-control-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dp-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.18s
    cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.dp-control-btn svg {
  width: 14px;
  height: 14px;
  display: block;
  stroke: currentColor;
}

.dp-control-btn:hover {
  background-color: var(--dp-bg-hover);
  color: var(--dp-text-primary);
  transform: scale(1.06);
}

.dp-control-btn:focus-visible {
  box-shadow: 0 0 0 2px var(--dp-border-focus);
}

.dp-close-btn:hover {
  background-color: var(--dp-error-bg);
  color: var(--dp-error);
}

.dp-modal-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: var(--dp-bg-primary);
}

/* Transitions */
.dp-fade-enter-active,
.dp-fade-leave-active {
  transition: opacity 0.25s
    cubic-bezier(0.16, 1, 0.3, 1);
}

.dp-fade-enter-from,
.dp-fade-leave-to {
  opacity: 0;
}
</style>
