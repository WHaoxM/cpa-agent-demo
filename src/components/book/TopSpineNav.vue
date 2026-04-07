<!-- 组件：顶部功能岛导航；路由主导航（左侧） -->
<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface TopMenu {
  index: string
  icon: string
  title: string
}

defineProps<{
  menus: TopMenu[]
  activeIndex: string
  mobile: boolean
}>()

const emit = defineEmits<{
  (e: 'select', index: string): void
  (e: 'toggle'): void
}>()
</script>

<template>
  <nav class="top-spine" aria-label="功能导航">
    <button
      v-if="mobile"
      class="top-spine__menu-btn"
      type="button"
      aria-label="打开导航"
      @click="emit('toggle')"
    >
      <Icon icon="lucide:menu" />
    </button>

    <div v-else class="top-spine__tabs">
      <button
        v-for="menu in menus"
        :key="menu.index"
        type="button"
        class="top-spine__tab"
        :class="{ 'is-active': activeIndex === menu.index }"
        :title="menu.title"
        @click="emit('select', menu.index)"
      >
        <Icon :icon="menu.icon" class="top-spine__tab-icon" />
        <span class="top-spine__tab-label">{{ menu.title }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.top-spine {
  height: 52px;
  width: 100%;
  display: inline-flex;
  align-items: center;
  background: var(--vermilion-700);
  border: 1px solid rgba(201, 162, 39, 0.35);
  border-bottom-color: rgba(201, 162, 39, 0.6);
  box-shadow:
    inset 0 -1px 0 rgba(201, 162, 39, 0.55),
    0 4px 10px rgba(28, 20, 14, 0.2);
  min-width: 0;
  max-width: 100%;
}


.top-spine__tabs {
  flex: 1;
  width: 0;
  display: inline-flex;
  align-items: stretch;
  height: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.top-spine__tabs::-webkit-scrollbar {
  display: none;
}

.top-spine__tab {
  position: relative;
  height: 100%;
  padding: 0 10px;
  min-width: 88px;
  border: none;
  border-right: 1px solid rgba(201, 162, 39, 0.22);
  background: transparent;
  color: rgba(250, 232, 220, 0.84);
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 0.08em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  clip-path: polygon(6% 0, 100% 0, 94% 100%, 0 100%);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.top-spine__tab:hover {
  background: rgba(255, 255, 255, 0.07);
  color: var(--vermilion-100);
}

.top-spine__tab.is-active {
  background: rgba(255, 255, 255, 0.14);
  color: var(--gold-300);
}

.top-spine__tab.is-active::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 3px;
  background: var(--gold-500);
}

.top-spine__tab-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.top-spine__tab-label {
  white-space: nowrap;
}

.top-spine__menu-btn {
  width: 42px;
  height: 100%;
  border: none;
  border-left: 1px solid rgba(201, 162, 39, 0.28);
  background: transparent;
  color: var(--vermilion-100);
  display: grid;
  place-items: center;
  font-size: 18px;
}

@media (max-width: 1024px) {
  .top-spine__tab {
    min-width: 80px;
    padding: 0 8px;
    font-size: 11px;
  }
}
</style>
