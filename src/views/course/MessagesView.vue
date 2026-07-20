<!-- 页面：消息中心；路由：messages（messages） -->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { listMessages, markMessageRead, type InboxMessage } from '@/api/messages'
import { DEMO_STUDENT_ID } from '@/api/config'
import { useUserStore } from '@/stores'

type MsgType = '系统消息'
type Msg = InboxMessage

const userStore = useUserStore()
const tab = ref<MsgType | '全部'>('全部')
const list = ref<Msg[]>([])

const filtered = computed(() => {
  return list.value.filter((x) => (tab.value === '全部' ? true : x.type === tab.value))
})

const unreadCount = computed(() => list.value.filter((x) => !x.read).length)
const latestTime = computed(() => list.value.length ? list.value[0]!.time.split(' ')[0] : '—')

async function markRead(id: string) {
  const m = list.value.find((x) => x.id === id)
  if (m) m.read = true
  const uid = userStore.currentUser?.id || DEMO_STUDENT_ID
  await markMessageRead(id, uid).catch(() => {})
}

/* ── 进场动画 ── */
let observer: IntersectionObserver | null = null

function bindReveal() {
  observer?.disconnect()
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, { rootMargin: '-40px 0px', threshold: 0.08 })

  document.querySelectorAll('.tl-reveal').forEach((el, i) => {
    ;(el as HTMLElement).style.transitionDelay = `${i * 80}ms`
    observer?.observe(el)
  })
}

onMounted(async () => {
  try {
    list.value = await listMessages(userStore.currentUser?.id || DEMO_STUDENT_ID)
  } catch (e) {
    console.warn('[messages] load failed', e)
  }
  await nextTick()
  bindReveal()
})

onUnmounted(() => { observer?.disconnect() })
</script>



<template>
  <div class="messages-page">
    <!-- ── 页头区（深底 hero） ── -->
    <div class="msg-hero tl-reveal">
      <div class="msg-hero__inner">
        <div class="msg-hero__left">
          <div class="msg-hero__title">
            <Icon icon="mdi:bell-outline" class="msg-hero__icon" />
            <h1>消息中心</h1>
          </div>
          <div class="msg-hero__stats">
            <span class="stat-item">未读 <strong>{{ unreadCount }}</strong> 条</span>
            <span class="stat-sep">·</span>
            <span class="stat-item">共 <strong>{{ list.length }}</strong> 条</span>
            <span class="stat-sep">·</span>
            <span class="stat-item">最近 <strong>{{ latestTime }}</strong></span>
          </div>
        </div>
        <el-segmented
          class="msg-hero__seg"
          v-model="tab"
          :options="[
            { label: '全部', value: '全部' },
            { label: '系统消息', value: '系统消息' },
          ]"
        />
      </div>
    </div>

    <!-- ── 内容区 ── -->
    <div class="msg-body">

      <!-- ── 摘要统计条 ── -->
      <div class="msg-stat-strip tl-reveal">
        <div class="msg-stat-item">
          <Icon icon="mdi:email-outline" class="msg-stat-icon" />
          <div class="msg-stat-text">
            <span class="msg-stat-value">{{ unreadCount }}</span>
            <span class="msg-stat-label">未读消息</span>
          </div>
        </div>
        <div class="msg-stat-item">
          <Icon icon="mdi:inbox-full" class="msg-stat-icon" />
          <div class="msg-stat-text">
            <span class="msg-stat-value">{{ list.length }}</span>
            <span class="msg-stat-label">全部消息</span>
          </div>
        </div>
        <div class="msg-stat-item msg-stat-item--latest">
          <Icon icon="mdi:clock-outline" class="msg-stat-icon" />
          <div class="msg-stat-text">
            <span class="msg-stat-value">{{ latestTime }}</span>
            <span class="msg-stat-label">最近更新</span>
          </div>
        </div>
      </div>

      <!-- ── 时间线 ── -->
      <div v-if="filtered.length" class="timeline" role="list">
        <div
          v-for="m in filtered"
          :key="m.id"
          class="tl-node tl-reveal"
          :class="{ 'tl-node--unread': !m.read }"
          role="listitem"
        >
          <!-- 圆点 -->
          <span class="tl-dot" :class="{ 'tl-dot--unread': !m.read }" />

          <!-- 卡片 -->
          <button
            class="tl-card"
            :class="{ 'tl-card--unread': !m.read }"
            type="button"
            @click="markRead(m.id)"
          >
            <div class="tl-card__head">
              <Icon icon="mdi:cog-outline" class="tl-card__type-icon" />
              <span class="tl-card__title">{{ m.title }}</span>
              <span class="tl-card__time">{{ m.time }}</span>
            </div>
            <div class="tl-card__body">{{ m.content }}</div>
          </button>
        </div>
      </div>

      <!-- ── 空状态 ── -->
      <div v-else class="msg-empty tl-reveal">
        <Icon icon="mdi:bell-off-outline" class="msg-empty__icon" />
        <div class="msg-empty__title">暂无消息</div>
        <div class="msg-empty__desc">系统通知会在这里集中展示</div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ══════════════════════════════════
   页面容器
   ══════════════════════════════════ */
.messages-page {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--parchment-100);
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}

/* ══════════════════════════════════
   页头 Hero
   ══════════════════════════════════ */
.msg-hero {
  background: #1A1815;
  padding: 0 28px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.28);
}

/* 锦纹斜线纹理 */
.msg-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M0 48L48 0M-6 6L6-6M42 54L54 42' stroke='rgba(255,255,255,0.035)' stroke-width='1'/%3E%3C/svg%3E");
  pointer-events: none;
}

.msg-hero__inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 24px 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.msg-hero__left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.msg-hero__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.msg-hero__icon {
  font-size: 24px;
  color: var(--color-primary);
  filter: drop-shadow(0 0 8px rgba(180, 60, 40, 0.5));
}

.msg-hero__title h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  font-family: var(--font-title);
  letter-spacing: 0.06em;
  line-height: 1;
}

.msg-hero__stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.msg-hero__stats strong {
  color: var(--color-gold);
  font-size: 15px;
  font-family: var(--font-latin);
}

.msg-hero__stats .stat-sep {
  opacity: 0.4;
}

.msg-hero__seg {
  --el-border-radius-base: 4px;
}

/* segmented 白色描边风格 */
.msg-hero :deep(.el-segmented) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  --el-text-color-primary: rgba(255, 255, 255, 0.7);
}

.msg-hero :deep(.el-segmented__item.is-selected) {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.msg-hero :deep(.el-segmented__item) {
  color: rgba(255, 255, 255, 0.55);
}

/* ══════════════════════════════════
   内容区
   ══════════════════════════════════ */
.msg-body {
  flex: 1;
  max-width: 1160px;
  width: 100%;
  margin: 0 auto;
  padding: 16px 28px 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ══════════════════════════════════
   摘要统计条
   ══════════════════════════════════ */
.msg-stat-strip {
  display: flex;
  gap: 12px;
}

.msg-stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.msg-stat-icon {
  font-size: 20px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.msg-stat-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.msg-stat-value {
  font-size: 18px;
  font-weight: 600;
  font-family: var(--font-latin);
  color: var(--color-text);
  line-height: 1.1;
}

.msg-stat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  letter-spacing: 0.01em;
}

/* ══════════════════════════════════
   时间线
   ══════════════════════════════════ */
.timeline {
  position: relative;
  padding-left: 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 竖轴线 */
.timeline::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--color-border);
  border-radius: 1px;
}

/* ── 节点 ── */
.tl-node {
  position: relative;
}

/* ── 圆点 ── */
.tl-dot {
  position: absolute;
  left: -32px;
  top: 18px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--parchment-400);
  border: 2px solid var(--color-surface);
  transform: translateX(4px);
  z-index: 1;
}

.tl-dot--unread {
  background: var(--color-primary);
  border-color: var(--color-surface);
  animation: pulse-dot 2s ease-out infinite;
}

@keyframes pulse-dot {
  0%   { box-shadow: 0 0 0 0 rgba(190, 42, 0, 0.35); }
  70%  { box-shadow: 0 0 0 7px rgba(190, 42, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(190, 42, 0, 0); }
}

/* ── 卡片 ── */
.tl-card {
  display: block;
  width: 100%;
  text-align: left;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: 16px 18px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    border-color 200ms ease;
  font-family: inherit;
}

.tl-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.tl-card--unread {
  border-left: 3px solid var(--color-primary);
  background: var(--card-emphasis-bg);
}

.tl-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tl-card__type-icon {
  font-size: 14px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.tl-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tl-card__time {
  font-size: 12px;
  color: var(--color-text-subtle);
  flex-shrink: 0;
  font-family: var(--font-latin);
}

.tl-card__body {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ══════════════════════════════════
   空状态
   ══════════════════════════════════ */
.msg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
  gap: 8px;
}

.msg-empty__icon {
  font-size: 48px;
  color: var(--color-text-subtle);
  margin-bottom: 4px;
}

.msg-empty__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.msg-empty__desc {
  font-size: 13px;
  color: var(--color-text-muted);
}

/* ══════════════════════════════════
   进场动画
   ══════════════════════════════════ */
@media (prefers-reduced-motion: no-preference) {
  .tl-reveal {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(6px);
    transition:
      opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
      filter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .tl-reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

/* ══════════════════════════════════
   响应式
   ══════════════════════════════════ */
@media (max-width: 768px) {
  .msg-hero {
    padding: 0 16px;
  }

  .msg-hero__inner {
    padding: 18px 0 22px;
  }

  .msg-hero__title h1 {
    font-size: 22px;
  }

  .msg-body {
    padding: 12px 16px 36px;
  }

  .msg-stat-strip {
    flex-wrap: wrap;
  }

  .msg-stat-item {
    min-width: calc(50% - 6px);
  }

  .timeline {
    padding-left: 28px;
  }

  .tl-dot {
    left: -28px;
  }

  .timeline::before {
    left: 9px;
  }
}

@media (max-width: 640px) {
  .msg-stat-item--latest {
    display: none;
  }

  .msg-hero__stats .stat-sep:last-of-type,
  .msg-hero__stats .stat-item:last-child {
    display: none;
  }
}
</style>
