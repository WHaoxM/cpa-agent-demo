<!-- 组件：内容页容器 -->
<script setup lang="ts">
import { ref } from 'vue'

const pageRef = ref<HTMLElement | null>(null)
</script>

<template>
  <div ref="pageRef" class="book-page">
    <div class="book-page__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.book-page {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  overflow: hidden;
}

.book-page__body {
  flex: 1;
  padding: 20px 24px;
  position: relative;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--parchment-400) transparent;
}

.book-page__body::-webkit-scrollbar {
  width: 4px;
}

.book-page__body::-webkit-scrollbar-thumb {
  background: var(--parchment-400);
}

@media (max-width: 768px) {
  .book-page__body {
    padding: 14px 16px;
  }
}
</style>
