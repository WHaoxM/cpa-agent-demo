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
  ctx = gsap.context(() => {
    gsap.from('.spine-tab', {
      x: -20,
      opacity: 0,
      stagger: 0.04,
      duration: 0.4,
      ease: 'power3.out',
      delay: 0.2,
    })
  }, spineRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})

watch(() => props.collapsed, (val) => {
  if (!spineRef.value) return
  gsap.to(spineRef.value, {
    width: val ? 'var(--book-spine-width)' : 'var(--book-spine-expanded)',
    duration: 0.35,
    ease: 'power2.inOut',
  })
})
</script>

<template>
  <nav ref="spineRef" class="book-spine" :class="{ 'is-collapsed': collapsed }">
    <!-- 书脊标题 -->
    <div class="spine-brand" @click="emit('toggle')">
      <div class="spine-title-vertical" v-if="collapsed">
        <span class="spine-char">课</span>
        <span class="spine-char">程</span>
        <span class="spine-char">系</span>
        <span class="spine-char">统</span>
      </div>
      <div class="spine-title-horizontal" v-else>
        <span class="spine-seal">学</span>
        <div class="spine-name">
          <div class="spine-name-main">课程管理系统</div>
          <div class="spine-name-sub">知行合一</div>
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
.book-spine {
  width: var(--book-spine-expanded);
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(135deg, rgba(139, 37, 0, 0.03) 0%, transparent 40%),
    var(--bg-200);
  border-right: var(--book-binding-width) solid var(--book-binding-color);
  position: relative;
  overflow: hidden;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.book-spine::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 12px;
  background: linear-gradient(to left, rgba(26, 20, 16, 0.04), transparent);
  pointer-events: none;
}

.book-spine.is-collapsed {
  width: var(--book-spine-width);
}

/* 书脊标题区 */
.spine-brand {
  padding: 16px 12px;
  border-bottom: 1px solid var(--bg-300);
  cursor: pointer;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spine-title-vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: var(--primary-100);
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

.spine-seal {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 2px solid var(--primary-100);
  color: var(--primary-100);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.spine-name-main {
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-100);
  letter-spacing: 0.06em;
}

.spine-name-sub {
  font-family: var(--font-accent);
  font-size: 11px;
  color: var(--text-300);
  letter-spacing: 0.1em;
  margin-top: 2px;
}

/* 书签列表 */
.spine-tabs {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
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
  color: var(--text-200);
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.06em;
  cursor: pointer;
  position: relative;
  transition: all 0.25s ease;
  text-align: left;
}

.is-collapsed .spine-tab {
  justify-content: center;
  padding: 10px 8px;
}

.spine-tab::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 60%;
  background: var(--primary-100);
  transition: width 0.25s ease;
}

.spine-tab:hover {
  background: color-mix(in srgb, var(--primary-100) 5%, transparent 95%);
  color: var(--text-100);
}

.spine-tab.is-active {
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
  color: var(--primary-100);
  font-weight: 600;
}

.spine-tab.is-active::before {
  width: 3px;
}

.spine-tab-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.spine-tab-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spine-tab-marker {
  font-size: 16px;
  color: var(--primary-100);
  flex-shrink: 0;
}

/* 底部 */
.spine-foot {
  padding: 8px 12px;
  border-top: 1px solid var(--bg-300);
}

.spine-toggle {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--bg-300);
  background: transparent;
  color: var(--text-300);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.spine-toggle:hover {
  border-color: var(--primary-200);
  color: var(--primary-100);
}
</style>
