<!-- 组件：书脊导航；替代传统侧边栏，竖排书签式菜单 -->
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'

interface SpineMenu {
  index: string
  icon: string
  title: string
}

const props = defineProps<{
  menus: SpineMenu[]
  activeIndex: string
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'select', index: string): void
}>()

const spineRef = ref<HTMLElement | null>(null)
let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (!spineRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    const tabs = spineRef.value?.querySelectorAll('.spine-tab')
    if (!tabs?.length) return
    gsap.fromTo(tabs,
      { x: -20, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.02,
        duration: 0.24,
        ease: 'power2.out',
        delay: 0.04,
        clearProps: 'transform,opacity',
      }
    )
  }, spineRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})

watch(() => props.collapsed, (val) => {
  if (!spineRef.value) return
  gsap.to(spineRef.value, {
    width: val ? 'var(--book-spine-width)' : 'var(--book-spine-expanded)',
    duration: 0.22,
    ease: 'power1.out',
    overwrite: 'auto',
  })
})
</script>

<template>
  <nav ref="spineRef" class="book-spine" :class="{ 'is-collapsed': collapsed }">
    <!-- 书脊标题 -->
    <div class="spine-brand" @click="emit('toggle')">
      <div class="spine-title-vertical" v-if="collapsed">
        <span class="spine-char">职</span>
        <span class="spine-char">涯</span>
        <span class="spine-char">规</span>
        <span class="spine-char">划</span>
      </div>
      <div class="spine-title-horizontal" v-else>
        <span class="spine-seal">职</span>
        <div class="spine-name">
          <div class="spine-name-main">AI职涯规划</div>
          <div class="spine-name-sub">知行</div>
        </div>
      </div>
    </div>

    <!-- 书签标签列表 -->
    <div class="spine-tabs">
      <button
        v-for="menu in menus"
        :key="menu.index"
        class="spine-tab"
        :class="{ 'is-active': activeIndex === menu.index }"
        @click="emit('select', menu.index)"
        :title="menu.title"
      >
        <Icon :icon="menu.icon" class="spine-tab-icon" />
        <span v-if="!collapsed" class="spine-tab-label">{{ menu.title }}</span>
        <span v-if="!collapsed && activeIndex === menu.index" class="spine-tab-marker">›</span>
      </button>
    </div>

    <!-- 收起/展开 -->
    <div class="spine-foot">
      <button class="spine-toggle" @click="emit('toggle')">
        <span v-if="collapsed">展</span>
        <span v-else>收起</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* ══ 故宫侧边栏 · Palace Museum Sidebar ══
   深朱底色 #8B1A00 + 御金线 #C9A227 + 宣纸文字
   ════════════════════════════════════════ */

.book-spine {
  width: var(--book-spine-expanded);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--vermilion-700);    /* #8B1A00 深朱 */
  border-right: 1px solid var(--gold-700);
  position: relative;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

/* 右侧金线装饰光 */
.book-spine::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--gold-500) 20%,
    var(--gold-300) 50%,
    var(--gold-500) 80%,
    transparent 100%
  );
  opacity: 0.6;
  pointer-events: none;
}

.book-spine.is-collapsed {
  width: var(--book-spine-width);
}

/* ── 品牌标题区 ── */
.spine-brand {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(201, 162, 39, 0.3);
  cursor: pointer;
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 品牌区顶部金线 */
.spine-brand::before {
  content: '';
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--gold-500), transparent);
  opacity: 0.5;
}

.spine-title-vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: var(--vermilion-100);   /* 宣纸浅色 */
  line-height: 1;
}

.spine-char {
  display: block;
}

.spine-title-horizontal {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 4px;
}

/* 印章 */
.spine-seal {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 2px solid var(--gold-500);
  color: var(--gold-500);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
  border-radius: 0;
}

.spine-name-main {
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 700;
  color: var(--vermilion-100);
  letter-spacing: 0.06em;
}

.spine-name-sub {
  font-family: var(--font-accent);
  font-size: 11px;
  color: var(--gold-300);
  letter-spacing: 0.12em;
  margin-top: 2px;
  opacity: 0.85;
}

/* ── 导航列表 ── */
.spine-tabs {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;
  scrollbar-width: none;
}

.spine-tabs::-webkit-scrollbar {
  display: none;
}

.spine-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: rgba(249, 218, 206, 0.75);  /* 宣纸浅色，略透明 */
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.04em;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease, color 0.2s ease;
  text-align: left;
}

.is-collapsed .spine-tab {
  justify-content: center;
  padding: 10px 8px;
}

/* 金色左边激活指示条 */
.spine-tab::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 55%;
  background: var(--gold-500);
  transition: width 0.2s ease;
  border-radius: 0 1px 1px 0;
}

.spine-tab:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--vermilion-100);
}

.spine-tab.is-active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--gold-300);
  font-weight: 600;
}

.spine-tab.is-active::before {
  width: 3px;
}

.spine-tab-icon {
  font-size: 17px;
  flex-shrink: 0;
  color: inherit;
}

.spine-tab :deep(.iconify) {
  color: inherit;
}

.spine-tab-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spine-tab-marker {
  font-size: 14px;
  color: var(--gold-500);
  flex-shrink: 0;
  opacity: 0.8;
}

/* ── 底部折叠按钮 ── */
.spine-foot {
  padding: 8px 12px;
  border-top: 1px solid rgba(201, 162, 39, 0.25);
}

.spine-toggle {
  width: 100%;
  padding: 6px;
  border: 1px solid rgba(201, 162, 39, 0.3);
  background: transparent;
  color: rgba(249, 218, 206, 0.6);
  font-family: var(--font-ui);
  font-size: 11px;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
  border-radius: 0;
}

.spine-toggle:hover {
  border-color: var(--gold-500);
  color: var(--gold-300);
}
</style>
