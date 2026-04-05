<!-- 页面：首页；路由：/app（dashboard） -->

<script setup lang="ts">
import { computed, onMounted, onUnmounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useCourseStore, useKnowledgeGraphStore } from '@/stores'
import CalendarChart from '@/components/charts/CalendarChart.vue'
import { getNetworkGraphData, layerLabelMap, layerColors } from '@/composables/useNetworkGraph'
import { gsap } from '@/plugins/gsap'

const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()

const isStudent = computed(() => userStore.isStudent)
const isAdmin = computed(() => userStore.isAdmin)

const favoriteCourses = computed(() => courseStore.userFavorites.slice(0, 4))

const kgStore = useKnowledgeGraphStore()
const graphData = getNetworkGraphData()
const graphNodeCount = graphData.nodes.length
const graphEdgeCount = graphData.edges.length

const studentCards = [
  { title: '知识图谱', desc: '探索网络工程知识', path: '/app/student/knowledge-graph' },
  { title: '学习中心', desc: '继续你的课程', path: '/app/student/learning' },
  { title: '学习报告', desc: '查看进度成绩', path: '/app/student/report' },
]

const adminCards = [
  { title: '岗位数据集', desc: '上传管理岗位数据', path: '/app/admin/job-dataset' },
  { title: '知识库维护', desc: '维护本地知识库', path: '/app/admin/knowledge-base' },
]

const currentCards = computed(() => {
  if (isStudent.value) return studentCards
  if (isAdmin.value) return adminCards
  return studentCards
})

const announcementsPath = '/app/messages'

const announcements = [
  { id: 1, title: '系统维护通知', content: '本周日凌晨2点维护', time: '2024-01-15', type: 'warning' },
  { id: 2, title: '新课程上线', content: 'Vue3高级实战上线', time: '2024-01-14', type: 'success' },
  { id: 3, title: '考试安排', content: '期末考1月20日', time: '2024-01-13', type: 'info' },
]

const todos = ref([
  { id: 1, title: '完成数学作业', deadline: '今天', completed: false, priority: 'high' },
  { id: 2, title: '复习英语单词', deadline: '明天', completed: false, priority: 'medium' },
  { id: 3, title: '预习物理第3章', deadline: '后天', completed: true, priority: 'low' },
])

const recentVisits = [
  { id: 1, title: 'Vue3入门基础', type: 'course', time: '10分钟前', path: '/app/student/course/course_001' },
  { id: 2, title: 'JavaScript高级', type: 'course', time: '2小时前', path: '/app/student/course/course_002' },
  { id: 3, title: '学习笔记 #23', type: 'note', time: '昨天', path: '/app/student/skills' },
  { id: 4, title: '错题本复习', type: 'quiz', time: '2天前', path: '/app/student/skills' },
]

const calendarData = [
  { day: 1, hours: 2, hasTask: true },
  { day: 2, hours: 3, hasTask: true },
  { day: 3, hours: 0, hasTask: false },
  { day: 4, hours: 1.5, hasTask: true },
  { day: 5, hours: 4, hasTask: true },
  { day: 6, hours: 2.5, hasTask: true },
  { day: 7, hours: 0, hasTask: false },
]

// ===== 知识图谱 & Agent 入口数据 =====
const kgCapabilities = [
  { icon: '融', label: '多模态融合', desc: '文本·命令·拓扑·抓包 四模态并存', status: 'active' },
  { icon: '协', label: '多Agent协作', desc: '知识定位·协议分析·故障诊断·学习建议', status: 'active' },
  { icon: '图', label: '知识图谱', desc: `${graphNodeCount} 个知识点 · ${graphEdgeCount} 条关系`, status: 'active' },
]

const agentRoles = [
  { id: 'locator', label: '知识定位 Agent', color: '#2E7D32', icon: '?' },
  { id: 'analyzer', label: '协议分析 Agent', color: '#1565C0', icon: '?' },
  { id: 'diagnoser', label: '故障诊断 Agent', color: '#E65100', icon: '?' },
  { id: 'advisor', label: '学习建议 Agent', color: '#6A1B9A', icon: '?' },
]

const weeklyTotal = computed(() => calendarData.reduce((sum, d) => sum + d.hours, 0))

const formatHistoryTime = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 图谱层级分布统计（用于展示小图）
const layerDistribution = computed(() => {
  const map: Record<string, number> = {}
  for (const n of graphData.nodes) {
    map[n.layer] = (map[n.layer] || 0) + 1
  }
  return Object.entries(map).map(([k, v]) => ({
    layer: k,
    label: layerLabelMap[k as keyof typeof layerLabelMap] || k,
    count: v,
    color: layerColors[k as keyof typeof layerColors] || '#666',
  })).sort((a, b) => b.count - a.count)
})

function navigateTo(path: string) {
  if (path) router.push(path)
}

function toggleTodo(id: number) {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}

/* ===== GSAP 章节入场 ===== */
const dashRef = ref<HTMLElement | null>(null)
let gsapCtx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  const el = document.querySelector('.content')
  if (el) el.classList.add('hide-scrollbar')

  if (!dashRef.value) return
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  gsapCtx = gsap.context(() => {
    /* 区块交错入场 */
    gsap.from('.zone-animate', {
      opacity: 0, y: 18,
      stagger: 0.1, duration: 0.45, ease: 'power2.out',
      delay: 0.1,
    })

    /* 小卡片交错 */
    gsap.from('.card-animate', {
      opacity: 0, y: 12,
      stagger: 0.06, duration: 0.35, ease: 'power2.out',
      delay: 0.35,
    })
  }, dashRef.value)
})

onUnmounted(() => {
  const el = document.querySelector('.content')
  if (el) el.classList.remove('hide-scrollbar')
})

onBeforeUnmount(() => {
  gsapCtx?.revert()
})
</script>







<template>
  <!-- 故宫档案室 · Palace Museum Archive Dashboard -->
  <div ref="dashRef" class="dash">

    <!-- ══ 顶部统计横条 ══ -->
    <div class="dash-stats zone-animate">
      <div class="stat-item">
        <span class="stat-num">07</span>
        <span class="stat-label">连续天数</span>
      </div>
      <span class="stat-divider"></span>
      <div class="stat-item">
        <span class="stat-num">{{ String(weeklyTotal).padStart(2, '0') }}</span>
        <span class="stat-label">本周学时</span>
      </div>
      <span class="stat-divider"></span>
      <div class="stat-item stat-item--bar">
        <div class="stat-bar-wrap">
          <div class="stat-bar-fill" style="width: 40%"></div>
        </div>
        <span class="stat-label">课程进度 4 / 10</span>
      </div>
      <span class="stat-divider"></span>
      <div class="stat-item">
        <span class="stat-num">0{{ agentRoles.length }}</span>
        <span class="stat-label">Agent 就绪</span>
      </div>
      <div class="stat-user">
        <span class="stat-live-dot"></span>
        <span class="stat-username">{{ userStore.currentUser?.username || '用户' }}</span>
        <span class="stat-role">{{ isStudent ? '学生' : '管理员' }}</span>
      </div>
    </div>

    <!-- ══ 主体：左主区 + 右侧栏 ══ -->
    <div class="dash-body">

      <!-- 左：日历 + 周统计 + 最近访问 -->
      <div class="dash-main zone-animate">

        <!-- 学习日历 -->
        <div class="panel-row">
          <div class="panel-header">
            <span class="panel-label">学习日历</span>
            <span class="panel-sub">本月学习记录</span>
          </div>
          <div class="calendar-wrap">
            <CalendarChart />
          </div>
        </div>

        <!-- 本周学时柱图（学生端） -->
        <div class="panel-row" v-if="isStudent">
          <div class="panel-header panel-header--sep">
            <span class="panel-label">本周学时</span>
            <div class="week-summary">
              <span class="week-big">{{ weeklyTotal }}</span>
              <span class="week-unit">小时</span>
            </div>
          </div>
          <div class="week-bars-row">
            <div v-for="day in calendarData" :key="day.day" class="wbar-col">
              <div class="wbar-track">
                <div class="wbar-fill" :style="{ height: `${Math.min(day.hours / 5 * 100, 100)}%` }"></div>
              </div>
              <span class="wbar-lbl">{{ ['一','二','三','四','五','六','日'][day.day - 1] }}</span>
            </div>
          </div>
        </div>

        <!-- 最近访问 -->
        <div class="panel-row">
          <div class="panel-header panel-header--sep">
            <span class="panel-label">最近访问</span>
          </div>
          <div class="recent-list">
            <div
              v-for="visit in recentVisits"
              :key="visit.id"
              class="recent-item"
              @click="navigateTo(visit.path)"
            >
              <span class="recent-time">{{ visit.time }}</span>
              <span class="recent-title">{{ visit.title }}</span>
              <span class="recent-arrow">?</span>
            </div>
          </div>
        </div>

      </div>

      <!-- 右：快捷入口 + 公告 + 待办 + 收藏 -->
      <div class="dash-rail zone-animate">

        <!-- 快捷入口 -->
        <div class="rail-section">
          <div class="rail-header">
            <span>快捷入口</span>
          </div>
          <div class="rail-links">
            <div
              v-for="card in currentCards"
              :key="card.title"
              class="rail-link"
              @click="navigateTo(card.path)"
            >
              <span class="rail-dot"></span>
              <div class="rail-link__info">
                <span class="rail-link__title">{{ card.title }}</span>
                <span class="rail-link__desc">{{ card.desc }}</span>
              </div>
              <span class="rail-arrow">?</span>
            </div>
          </div>
        </div>

        <!-- 公告 -->
        <div class="rail-section">
          <div class="rail-header">
            <span>公告</span>
            <span class="rail-badge">{{ announcements.length }}</span>
          </div>
          <div class="rail-notices">
            <div
              v-for="item in announcements"
              :key="item.id"
              class="notice-row"
              :class="item.type"
            >
              <span class="notice-dot"></span>
              <span class="notice-title">{{ item.title }}</span>
              <span class="notice-time">{{ item.time }}</span>
            </div>
          </div>
        </div>

        <!-- 待办 -->
        <div class="rail-section">
          <div class="rail-header">
            <span>待办</span>
            <span class="rail-badge">{{ todos.filter(t => !t.completed).length }}</span>
          </div>
          <div class="rail-todos">
            <div
              v-for="todo in todos"
              :key="todo.id"
              class="todo-row"
              :class="{ done: todo.completed }"
              @click="toggleTodo(todo.id)"
            >
              <span class="todo-check">{{ todo.completed ? '?' : '○' }}</span>
              <span class="todo-text">{{ todo.title }}</span>
              <span class="todo-tag" :class="todo.priority">{{ todo.deadline }}</span>
            </div>
          </div>
        </div>

        <!-- 收藏课程（学生，有收藏时） -->
        <div class="rail-section" v-if="isStudent && favoriteCourses.length > 0">
          <div class="rail-header">
            <span>收藏课程</span>
            <span class="rail-badge">{{ favoriteCourses.length }}</span>
          </div>
          <div class="rail-favs">
            <div
              v-for="course in favoriteCourses"
              :key="course.id"
              class="fav-row"
              @click="navigateTo(`/app/student/course/${course.id}`)"
            >
              <span class="fav-thumb">{{ course.title.charAt(0) }}</span>
              <span class="fav-name">{{ course.title }}</span>
            </div>
          </div>
        </div>

        <!-- 管理员系统概览 -->
        <div class="rail-section" v-if="isAdmin">
          <div class="rail-header"><span>系统概览</span></div>
          <div class="sys-strip">
            <div class="sys-cell"><span class="sys-n">353</span><span class="sys-l">用户</span></div>
            <div class="sys-cell"><span class="sys-n">51</span><span class="sys-l">课程</span></div>
            <div class="sys-cell"><span class="sys-n">3</span><span class="sys-l">待审</span></div>
            <div class="sys-cell"><span class="sys-n">180</span><span class="sys-l">活跃</span></div>
          </div>
        </div>

      </div>
    </div>

    <!-- ══ 底部：知识图谱入口 + Agent 状态 ══ -->
    <div class="dash-footer zone-animate">

      <!-- KG 入口 -->
      <div class="footer-kg" @click="navigateTo('/app/student/knowledge-graph')">
        <span class="footer-kg__icon">图</span>
        <div class="footer-kg__info">
          <span class="footer-kg__title">网络工程知识图谱</span>
          <span class="footer-kg__sub">{{ graphNodeCount }} 节点 · {{ graphEdgeCount }} 关系 · OSI 分层</span>
        </div>
        <div class="footer-kg__bar">
          <div
            v-for="item in layerDistribution"
            :key="item.layer"
            class="footer-kg__seg"
            :style="{ flex: item.count, background: item.color }"
            :title="item.label"
          />
        </div>
        <span class="footer-kg__cta">进入探索 ?</span>
      </div>

      <span class="footer-sep"></span>

      <!-- Agent 状态 -->
      <div class="footer-agents">
        <span class="footer-agents__label">Agent 集群</span>
        <div class="footer-agents__list">
          <div v-for="role in agentRoles" :key="role.id" class="footer-agent">
            <span class="footer-agent__dot" :style="{ background: role.color }"></span>
            <span class="footer-agent__name">{{ role.label }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ══════════════════════════════════════════════
   故宫档案室 · Palace Museum Archive Dashboard
   布局：统计横条 + 左主右栏双栏 + 底部信息条
   ══════════════════════════════════════════════ */

.dash {
  width: 100%;
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-text);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', 'Source Han Sans SC', sans-serif;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  scrollbar-width: none;
}

.dash::-webkit-scrollbar { display: none; }

:global(.content.hide-scrollbar) { scrollbar-width: none; overflow-y: auto; }
:global(.content.hide-scrollbar::-webkit-scrollbar) { display: none; }

/* ── 统计横条 ── */
.dash-stats {
  display: flex;
  align-items: center;
  gap: 0;
  border-top: 2px solid var(--color-primary);
  border-bottom: 1px solid var(--color-gold);
  background: var(--color-surface);
  padding: 0 24px;
  height: 52px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 0 20px;
}

.stat-item:first-child { padding-left: 0; }

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: 'JetBrains Mono', 'Fira Code', var(--font-title), monospace;
  line-height: 1;
  letter-spacing: 0.04em;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  letter-spacing: 0.06em;
  white-space: nowrap;
  font-family: var(--font-ui);
}

.stat-item--bar {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  justify-content: center;
}

.stat-bar-wrap {
  width: 110px;
  height: 3px;
  background: var(--color-border);
  position: relative;
}

.stat-bar-fill {
  position: absolute;
  inset: 0;
  right: auto;
  background: var(--color-primary);
  transition: width 0.5s ease;
}

.stat-divider {
  width: 1px;
  height: 22px;
  background: var(--color-border);
  flex-shrink: 0;
}

.stat-user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-live-dot {
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.stat-username {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  font-family: var(--font-title);
  letter-spacing: 0.04em;
}

.stat-role {
  font-size: 11px;
  color: var(--color-text-muted);
  padding: 1px 8px;
  border: 1px solid var(--color-border);
  letter-spacing: 0.06em;
}

/* ── 主体双栏 ── */
.dash-body {
  display: grid;
  grid-template-columns: 1fr 296px;
  flex: 1;
  min-height: 0;
  border-bottom: 1px solid var(--color-gold);
}

/* ── 左主区 ── */
.dash-main {
  padding: 20px 24px;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  scrollbar-width: none;
}

.dash-main::-webkit-scrollbar { display: none; }

.panel-row {
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header--sep {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-title);
  color: var(--color-text);
  letter-spacing: 0.08em;
}

.panel-sub {
  font-size: 11px;
  color: var(--color-text-muted);
}

.calendar-wrap {
  height: 200px;
  margin-bottom: 4px;
}

.calendar-wrap :deep(.calendar-chart-container),
.calendar-wrap :deep(.calendar-chart) {
  width: 100% !important;
  height: 100% !important;
}

/* 本周柱图 */
.week-summary {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.week-big {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: 'JetBrains Mono', 'Fira Code', 'Microsoft YaHei', monospace;
  line-height: 1;
}

.week-unit {
  font-size: 11px;
  color: var(--color-text-muted);
}

.week-bars-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 60px;
  margin-bottom: 4px;
}

.wbar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.wbar-track {
  width: 100%;
  height: 44px;
  background: var(--color-border);
  position: relative;
  flex-shrink: 0;
}

.wbar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-primary);
  opacity: 0.7;
  transition: height 0.4s ease;
}

.wbar-lbl {
  font-size: 10px;
  color: var(--color-text-subtle);
}

/* 最近访问 */
.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.recent-item:last-child { border-bottom: none; }
.recent-item:hover { background: color-mix(in srgb, var(--color-primary) 4%, transparent); }
.recent-item:hover .recent-title { color: var(--color-primary); }

.recent-time {
  font-size: 11px;
  color: var(--color-text-subtle);
  min-width: 64px;
  font-family: var(--font-ui);
  flex-shrink: 0;
}

.recent-title {
  flex: 1;
  font-size: 13px;
  color: var(--color-text);
  font-family: var(--font-ui);
  transition: color var(--transition-fast);
}

.recent-arrow {
  font-size: 14px;
  color: var(--color-text-subtle);
}

/* ── 右侧栏 ── */
.dash-rail {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  overflow-y: auto;
  scrollbar-width: none;
}

.dash-rail::-webkit-scrollbar { display: none; }

.rail-section {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.rail-section:last-child { border-bottom: none; }

.rail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-title);
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.rail-badge {
  font-size: 10px;
  padding: 1px 6px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-weight: 700;
  font-family: var(--font-ui);
}

/* 快捷链接 */
.rail-links { display: flex; flex-direction: column; gap: 2px; }

.rail-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.rail-link:hover { background: color-mix(in srgb, var(--color-primary) 5%, transparent); }
.rail-link:hover .rail-link__title { color: var(--color-primary); }

.rail-dot {
  width: 5px;
  height: 5px;
  background: var(--color-primary);
  flex-shrink: 0;
}

.rail-link__info { flex: 1; }
.rail-link__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  display: block;
  transition: color var(--transition-fast);
}
.rail-link__desc { font-size: 11px; color: var(--color-text-muted); display: block; margin-top: 1px; }
.rail-arrow { font-size: 14px; color: var(--color-text-subtle); }

/* 公告 */
.rail-notices { display: flex; flex-direction: column; }

.notice-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--color-border);
}

.notice-row:last-child { border-bottom: none; }

.notice-dot {
  width: 5px;
  height: 5px;
  background: var(--color-text-subtle);
  flex-shrink: 0;
}

.notice-row.warning .notice-dot { background: var(--color-secondary); }
.notice-row.success .notice-dot { background: var(--color-primary); }

.notice-title { flex: 1; font-size: 12px; color: var(--color-text); }
.notice-time { font-size: 10px; color: var(--color-text-subtle); white-space: nowrap; }

/* 待办 */
.rail-todos { display: flex; flex-direction: column; }

.todo-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.todo-row:last-child { border-bottom: none; }
.todo-row.done { opacity: 0.45; }
.todo-row:hover { background: color-mix(in srgb, var(--color-primary) 4%, transparent); }

.todo-check { font-size: 12px; color: var(--color-primary); width: 14px; text-align: center; flex-shrink: 0; }
.todo-text { flex: 1; font-size: 12px; color: var(--color-text); }
.todo-row.done .todo-text { text-decoration: line-through; }

.todo-tag {
  font-size: 10px;
  padding: 1px 5px;
  background: var(--color-border);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.todo-tag.high {
  background: color-mix(in srgb, var(--color-secondary) 15%, transparent);
  color: var(--color-secondary);
}

.todo-tag.medium {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}

/* 收藏 */
.rail-favs { display: flex; flex-direction: column; }

.fav-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
}

.fav-row:last-child { border-bottom: none; }
.fav-row:hover .fav-name { color: var(--color-primary); }

.fav-thumb {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-border);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: var(--font-title);
  flex-shrink: 0;
}

.fav-name {
  flex: 1;
  font-size: 12px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}

/* Admin 系统统计 */
.sys-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.sys-cell {
  text-align: center;
  padding: 10px 4px;
  background: var(--color-background);
}

.sys-n {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: 'JetBrains Mono', 'Fira Code', 'Microsoft YaHei', monospace;
  line-height: 1;
  margin-bottom: 4px;
}

.sys-l { font-size: 10px; color: var(--color-text-muted); }

/* ── 底部信息条 ── */
.dash-footer {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--color-gold);
  background: var(--color-surface);
  min-height: 50px;
  padding: 0 24px;
  gap: 0;
  flex-shrink: 0;
  position: relative;
}

.footer-kg {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px 0;
  flex: 1;
  min-width: 0;
  transition: opacity var(--transition-fast);
}

.footer-kg:hover { opacity: 0.78; }

.footer-kg__icon {
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  color: var(--color-surface-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.footer-kg__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.footer-kg__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  font-family: var(--font-title);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.footer-kg__sub {
  font-size: 10px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.footer-kg__bar {
  display: flex;
  height: 4px;
  width: 100px;
  overflow: hidden;
  gap: 1px;
  flex-shrink: 0;
}

.footer-kg__seg { min-width: 3px; }

.footer-kg__cta {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
  margin-left: 6px;
  flex-shrink: 0;
}

.footer-sep {
  width: 1px;
  height: 30px;
  background: var(--color-border);
  margin: 0 20px;
  flex-shrink: 0;
}

.footer-agents {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.footer-agents__label {
  font-size: 10px;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}

.footer-agents__list {
  display: flex;
  gap: 12px;
}

.footer-agent {
  display: flex;
  align-items: center;
  gap: 5px;
}

.footer-agent__dot {
  width: 6px;
  height: 6px;
  border-radius: 0;
  flex-shrink: 0;
}

.footer-agent__name {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ── 响应式 ── */
@media (max-width: 1024px) {
  .dash-body { grid-template-columns: 1fr 260px; }
  .footer-agents__list { display: none; }
}

@media (max-width: 768px) {
  .dash-stats {
    flex-wrap: wrap;
    height: auto;
    padding: 10px 16px;
    gap: 6px;
  }
  .stat-divider { display: none; }
  .stat-item { padding: 4px 0; }
  .dash-body { grid-template-columns: 1fr; }
  .dash-main { border-right: none; border-bottom: 1px solid var(--color-border); padding: 16px; }
  .dash-rail { order: -1; }
  .dash-footer {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 16px;
    gap: 8px;
  }
  .footer-sep { display: none; }
  .footer-kg__bar { display: none; }
}

/* ── 旧类已移除（故宫档案室改版完成）── */

</style>

