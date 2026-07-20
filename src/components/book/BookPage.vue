<!-- 组件：内容页容器 -->
<template>
  <div class="book-page">
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
  padding: 0;
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

</style>
