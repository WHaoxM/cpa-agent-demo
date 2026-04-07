<!-- 组件：祥云连续 Tab 导航 -->
<script setup lang="ts">
defineProps<{ tabs: { key: string; label: string }[]; modelValue: string }>()

const emit = defineEmits<{ (e: 'update:modelValue', val: string): void }>()
</script>

<template>
  <nav class="cloud-nav" aria-label="功能导航">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="cloud-tab"
      :class="{ 'is-active': modelValue === tab.key }"
      @click="emit('update:modelValue', tab.key)"
    >
      <svg
        class="cloud-bg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <!--
          S 形波浪路径：
          右边 C 110,0 66,100 94,100 → 上凸出（CP1 x=110）再下收（CP2 x=66），形成 S 波
          左边 C 28,100 -16,0 0,0     → 与右边对称，形成咬合的另一侧波浪
          相邻 tab margin-right:-12px 叠压，波浪咬合呈现分隔线
        -->
        <path class="cloud-fill" d="M 0,0 L 82,0 C 110,0 66,100 94,100 L 0,100 C 28,100 -16,0 0,0 Z" />
      </svg>
      <span class="cloud-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.cloud-nav {
  display: flex;
  align-items: stretch;
  background: #1a2f4a;
  height: 46px;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
}

.cloud-nav::-webkit-scrollbar {
  display: none;
}

.cloud-tab {
  position: relative;
  flex: 1;
  min-width: 86px;
  height: 100%;
  border: none;
  background: transparent;
  margin-right: -12px;
  padding: 0;
  cursor: pointer;
  z-index: 1;
  overflow: visible;
}

.cloud-tab:hover {
  z-index: 2;
}

.cloud-tab.is-active {
  z-index: 3;
}

.cloud-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.cloud-fill {
  fill: rgba(255, 255, 255, 0.07);
  transition: fill 180ms ease;
}

.cloud-tab:hover .cloud-fill {
  fill: rgba(255, 255, 255, 0.15);
}

.cloud-tab.is-active .cloud-fill {
  fill: rgba(201, 162, 39, 0.22);
}

.cloud-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-title, serif);
  letter-spacing: 0.08em;
  color: rgba(235, 225, 200, 0.82);
  white-space: nowrap;
  pointer-events: none;
  transition: color 180ms ease;
  user-select: none;
}

.cloud-tab:hover .cloud-label {
  color: rgba(250, 240, 215, 1);
}

.cloud-tab.is-active .cloud-label {
  color: var(--gold-300, #e0c060);
}

@media (max-width: 1024px) {
  .cloud-tab {
    min-width: 76px;
  }

  .cloud-label {
    font-size: 12px;
    padding: 0 16px;
  }
}
</style>
