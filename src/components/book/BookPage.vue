<!-- 组件：书页包装器；为内容区添加宣纸纹理、四角花纹、页眉页脚 -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from '@/plugins/gsap'

const props = withDefaults(defineProps<{
  chapterName?: string
  pageNumber?: number | string
  showCorners?: boolean
  showHeader?: boolean
  showFooter?: boolean
}>(), {
  chapterName: '',
  pageNumber: '',
  showCorners: true,
  showHeader: true,
  showFooter: true,
})

const pageRef = ref<HTMLElement | null>(null)
const cornersVisible = ref(false)
let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (!pageRef.value) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    cornersVisible.value = true
    return
  }

  ctx = gsap.context(() => {
    /* 页面内容淡入 */
    gsap.from('.book-page__body', {
      y: 12,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      delay: 0.15,
    })

    /* 四角花纹绘制 */
    if (props.showCorners) {
      gsap.fromTo('.corner-line',
        { scaleX: 0, scaleY: 0 },
        {
          scaleX: 1,
          scaleY: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          delay: 0.3,
          onComplete: () => { cornersVisible.value = true },
        }
      )
    }
  }, pageRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div ref="pageRef" class="book-page book-paper">
    <!-- 宣纸纹理（由 book-paper 类提供） -->

    <!-- 四角花纹 -->
    <div v-if="showCorners" class="book-page__corners" :class="{ 'is-drawn': cornersVisible }">
      <span class="corner-line corner-tl"></span>
      <span class="corner-line corner-tr"></span>
      <span class="corner-line corner-bl"></span>
      <span class="corner-line corner-br"></span>
    </div>

    <!-- 页眉 -->
    <header v-if="showHeader && chapterName" class="book-page__header">
      <span class="header-ornament">◆</span>
      <span class="header-chapter">{{ chapterName }}</span>
      <span class="header-ornament">◆</span>
    </header>

    <!-- 正文区 -->
    <div class="book-page__body">
      <slot />
    </div>

    <!-- 页脚 -->
    <footer v-if="showFooter" class="book-page__footer">
      <span class="footer-rule"></span>
      <span v-if="pageNumber" class="footer-page">{{ pageNumber }}</span>
      <span class="footer-rule"></span>
    </footer>
  </div>
</template>

<style scoped>
.book-page {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

/* 四角花纹 */
.book-page__corners {
  position: absolute;
  inset: 8px;
  pointer-events: none;
  z-index: 1;
}

.corner-line {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: var(--primary-100);
  border-style: solid;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.corner-tl {
  top: 0; left: 0;
  border-width: 2px 0 0 2px;
  transform-origin: top left;
}
.corner-tr {
  top: 0; right: 0;
  border-width: 2px 2px 0 0;
  transform-origin: top right;
}
.corner-bl {
  bottom: 0; left: 0;
  border-width: 0 0 2px 2px;
  transform-origin: bottom left;
}
.corner-br {
  bottom: 0; right: 0;
  border-width: 0 2px 2px 0;
  transform-origin: bottom right;
}

.book-page__corners.is-drawn .corner-line {
  opacity: 0.5;
}

/* 页眉 */
.book-page__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 24px;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 60%, transparent 40%);
  font-family: var(--font-title);
  font-size: 12px;
  color: var(--text-300);
  letter-spacing: 0.2em;
  flex-shrink: 0;
  z-index: 2;
}

.header-ornament {
  font-size: 8px;
  opacity: 0.4;
}

.header-chapter {
  white-space: nowrap;
}

/* 正文区 */
.book-page__body {
  flex: 1;
  padding: 20px 24px;
  position: relative;
  z-index: 2;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--bg-300) transparent;
}

.book-page__body::-webkit-scrollbar {
  width: 4px;
}

.book-page__body::-webkit-scrollbar-thumb {
  background: var(--bg-300);
}

/* 页脚 */
.book-page__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 24px;
  flex-shrink: 0;
  z-index: 2;
}

.footer-rule {
  flex: 1;
  height: 1px;
  background: color-mix(in srgb, var(--bg-300) 50%, transparent 50%);
}

.footer-page {
  font-family: var(--font-latin);
  font-size: 11px;
  color: var(--text-300);
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .book-page__body {
    padding: 14px 16px;
  }
  .book-page__header {
    padding: 8px 16px;
    font-size: 11px;
  }
  .corner-line {
    width: 18px;
    height: 18px;
  }
}
</style>
