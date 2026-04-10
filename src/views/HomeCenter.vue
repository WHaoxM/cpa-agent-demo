<!-- 页面：首页；路由：/app/dashboard（dashboard）；角色：STUDENT/ADMIN -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useCourseStore } from '@/stores'
import { useLearningStore, type LearningRecord } from '@/stores/learning'
import { useResumeStore } from '@/stores/resume'
import { useReportStore } from '@/stores/report'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { getCareerInsightsMock, type CareerRole } from '@/composables/useCareerInsights'
import D3HeatCalendar from '@/components/charts/D3HeatCalendar.vue'
import D3RadarChart from '@/components/charts/D3RadarChart.vue'
import D3WeeklyTrend from '@/components/charts/D3WeeklyTrend.vue'

type DayPayload = { date: string; minutes: number }
type WeeklyPoint = { label: string; weekStart: string; weekEnd: string; minutes: number }

const router = useRouter()
const userStore = useUserStore()
const learningStore = useLearningStore()
const courseStore = useCourseStore()
const resumeStore = useResumeStore()
const reportStore = useReportStore()

const { hasExplored, hasAssessed } = useOnboardingState()

// ── 确定性随机工具（内联自 CareerAnalysis.vue）──
function strHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}
function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
}
function getMarketKpi(role: string) {
  // TODO: GET /api/career/market-kpi?role=xxx
  const rng = seededRng(strHash('kpi_' + role))
  return {
    avgSalary: +(15 + rng() * 20).toFixed(1),
    demandTotal: Math.round(80000 + rng() * 150000),
    growthPct: +(8 + rng() * 12).toFixed(1),
  }
}

// ── 全部 role 列举
const VALID_ROLES: readonly CareerRole[] = ['前端开发', '后端开发', '测试开发', '数据分析', '机器学习工程师']

// ── 基础状态 ──
const currentUserId = computed(() => userStore.currentUser?.id ?? '')
const isStudent = computed(() => userStore.isStudent)

// ── 核心判断 ──
const effectiveRole = computed<CareerRole>(() => {
  const roles = learningStore.targetRoles
  const r = roles.length > 0 ? roles[roles.length - 1]!.role : undefined
  return (VALID_ROLES.includes(r as CareerRole) ? r : '前端开发') as CareerRole
})

const isParsedOrReported = computed(() =>
  resumeStore.isParsed || reportStore.portraitRecords.length > 0
)

// ── IntersectionObserver（滚动揭示） ──
let _observer: IntersectionObserver | null = null

// ── onMounted 兜底：确保热力日历有数据 + 启动揭示观察 ──
onMounted(() => {
  if (!learningStore.learningHistory.length) learningStore.loadFromStorage()
  _observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view')
        _observer?.unobserve(e.target)
      }
    }),
    { rootMargin: '-40px 0px', threshold: 0.1 },
  )
  document.querySelectorAll('.reveal').forEach(el => _observer!.observe(el))
})

onUnmounted(() => { _observer?.disconnect() })

// ── 学习历史（按用户过滤）──
const userLearningHistory = computed((): LearningRecord[] => {
  if (!currentUserId.value) return []
  return learningStore.learningHistory.filter(r => r.userId === currentUserId.value)
})

// ── Hero AI 数据 ──
const heroScore = computed(() => {
  const conf = resumeStore.insights?.confidence
  return conf != null ? Math.round(conf * 100) : null
})
const heroConfidence = computed(() => resumeStore.insights?.confidence ?? null)

// ── Hero 学习数字 ──
const totalLearningMinutes = computed(() =>
  userLearningHistory.value.reduce((sum, r) => sum + r.studyTime, 0),
)
const inProgressCourseCount = computed(() => {
  if (!currentUserId.value) return 0
  const list = courseStore.getUserProgress(currentUserId.value)
  const map = new Map<string, number>()
  for (const row of list) {
    map.set(row.courseId, Math.max(map.get(row.courseId) ?? 0, row.progress ?? 0))
  }
  return [...map.values()].filter(v => v > 0 && v < 100).length
})

// ── B-左 ArcGauge 数据 ──
const arcGaugeData = computed(() => {
  const nodes = getCareerInsightsMock(effectiveRole.value)
    .skillGraph.nodes
    .slice()
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 7)
  const conf = heroConfidence.value ?? 0.65
  return nodes.map((n, idx) => ({
    name: n.name,
    target: n.heat,
    value: isParsedOrReported.value
      ? Math.round(n.heat * (conf - 0.05 * idx) * 0.9)
      : 0,
    suggestion: n.heat >= 85 ? '核心技能，重点投入' : '进阶技能，系统学习',
  }))
})

// ── B-右上 职业匹配 ──
const heroCandidates = computed(() => {
  const raw = resumeStore.insights?.candidates ?? null
  const mock = getCareerInsightsMock(effectiveRole.value).candidates
  return (raw ?? mock).slice(0, 5)
})

// ── B-左 雷达图数据（arcGaugeData → RadarDatum） ──
const radarChartData = computed(() =>
  arcGaugeData.value.map(d => ({
    axis: d.name,
    value: d.value,
    ref: d.target,
  }))
)

// ── B-右下 市场速览 ──
const marketKpi = computed(() => getMarketKpi(effectiveRole.value))

// ── B' 周趋势图（近12周）──
const weeklyTrendData = computed((): WeeklyPoint[] => {
  const now = new Date()
  const dow = now.getDay()
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  thisMonday.setHours(0, 0, 0, 0)

  const points: WeeklyPoint[] = []
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(thisMonday.getDate() - w * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const startKey = toDayKey(weekStart)
    const endKey   = toDayKey(weekEnd)

    const minutes = userLearningHistory.value.reduce((sum, r) => {
      const day = r.completedAt.split('T')[0] ?? ''
      return day >= startKey && day <= endKey ? sum + r.studyTime : sum
    }, 0)

    const sm = String(weekStart.getMonth() + 1)
    const sd = String(weekStart.getDate()).padStart(2, '0')
    const em = String(weekEnd.getMonth() + 1)
    const ed = String(weekEnd.getDate()).padStart(2, '0')

    points.push({
      label: `${sm}/${sd}`,
      weekStart: `${sm}/${sd}`,
      weekEnd:   `${em}/${ed}`,
      minutes,
    })
  }
  return points
})

// ── C-右 最近3条学习记录 ──
const recentRecords = computed(() =>
  userLearningHistory.value
    .slice()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 3)
)

// ── C-右 推荐行动 ──
const nextAction = computed(() => {
  if (!hasExplored.value)
    return { text: '探索方向 → 前往职业分析，确认你的目标岗位', route: '/app/student/career-analysis' }
  if (!hasAssessed.value)
    return { text: '评估自我 → 上传简历或完成问卷，获取AI能力分析', route: '/app/student/career-navigation' }
  if (!reportStore.careerRecords.length)
    return { text: '沉淀成果 → 生成你的职业生涯发展报告', route: '/app/student/career-report' }
  return { text: `继续学习 → ${inProgressCourseCount.value} 门课进行中，针对差距强化`, route: '/app/student/learning' }
})

const nextActionLead = computed(() => nextAction.value.text.split('→')[0]?.trim() || nextAction.value.text)

// ── C-左 热力日历 ──
function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function parseDay(s: string): Date {
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

const todayKey = toDayKey(new Date())

const dayMinutesMap = computed(() => {
  const m = new Map<string, number>()
  for (const r of userLearningHistory.value) {
    const day = r.completedAt.split('T')[0]
    if (!day) continue
    m.set(day, (m.get(day) ?? 0) + r.studyTime)
  }
  return m
})

const heatCalendarData = computed(() =>
  [...dayMinutesMap.value.entries()]
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => (a.date > b.date ? 1 : -1)),
)

const dayRecordsMap = computed(() => {
  const m = new Map<string, LearningRecord[]>()
  for (const r of userLearningHistory.value) {
    const day = r.completedAt.split('T')[0]
    if (!day) continue
    const list = m.get(day) ?? []
    list.push(r)
    m.set(day, list)
  }
  return m
})

const selectedDay = ref<DayPayload | null>(null)
const selectedDayRecords = computed(() => {
  if (!selectedDay.value) return [] as LearningRecord[]
  return (dayRecordsMap.value.get(selectedDay.value.date) ?? [])
    .slice()
    .sort((a, b) => (a.completedAt > b.completedAt ? 1 : -1))
})

function handleDayClick(p: DayPayload) {
  selectedDay.value = selectedDay.value?.date === p.date ? null : p
}

const activeDays = computed(() => dayMinutesMap.value.size)

const streakDays = computed(() => {
  const dates = [...dayMinutesMap.value.keys()].sort().reverse()
  if (!dates.length) return 0
  let streak = 0
  const now = parseDay(todayKey)
  for (const k of dates) {
    const diff = Math.floor((now.getTime() - parseDay(k).getTime()) / 86400000)
    if (diff === streak) streak += 1
    else if (diff > streak) break
  }
  return streak
})

const thisWeekMinutes = computed(() => {
  const startKey = toDayKey(new Date(Date.now() - 6 * 86400000))
  return userLearningHistory.value.reduce((sum, r) => {
    const day = r.completedAt.split('T')[0] ?? ''
    return day >= startKey && day <= todayKey ? sum + r.studyTime : sum
  }, 0)
})

// ── Section D 阶段数据 ──
const phasesList = [
  {
    num: 1, title: '探索市场', subtitle: '了解行业趋势与岗位需求',
    route: '/app/student/career-analysis',
    items: [
      { label: '职业分析', route: '/app/student/career-analysis' },
      { label: '职业能力图谱', route: '/app/student/career-ability' },
    ],
  },
  {
    num: 2, title: '了解自己', subtitle: 'AI 分析你的能力现状',
    route: '/app/student/career-navigation',
    items: [
      { label: '职途导航', route: '/app/student/career-navigation' },
      { label: '个人能力画像', route: '/app/student/career-portrait' },
      { label: '技能自评', route: '/app/exams' },
    ],
  },
  {
    num: 3, title: '提升技能', subtitle: '针对差距制定学习计划',
    route: '/app/student/learning',
    items: [
      { label: '技能提升', route: '/app/student/learning' },
      { label: 'ai助手', route: '/app/student/ai-assistant' },
    ],
  },
  {
    num: 4, title: '沉淀成果', subtitle: '生成报告，完善职业规划',
    route: '/app/student/career-report',
    items: [
      { label: '职业生涯报告', route: '/app/student/career-report' },
      { label: '我的报告', route: '/app/student/my-reports' },
      { label: '心仪岗位', route: '/app/student/favorites' },
      { label: '简历制作', route: '/app/student/resume-builder' },
    ],
  },
] as const

const phasesDone = computed(() => [
  learningStore.targetRoles.length > 0,
  isParsedOrReported.value,
  userLearningHistory.value.length > 0,
  reportStore.records.length > 0,
])

// ── 格式化函数 ──
function fmt(min: number): string {
  if (min < 60) return `${min} 分钟`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

function fmtH(min: number): string {
  return `${(min / 60).toFixed(1)}h`
}

function nav(path: string) {
  router.push(path)
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const todayDisplay = computed(() => {
  const d = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${weekDays[d.getDay()]}`
})
</script>

<template>
  <div class="hc">

    <!-- ═══ 学生视图 ═══ -->
    <template v-if="isStudent">
  
      <!-- A · 指挥台顶带 -->
      <section class="hc-header reveal">
        <div class="hc-header__left">
          <div class="hc-header__greeting">{{ greeting }}，{{ userStore.currentUser?.name ?? '同学' }}</div>
          <div class="hc-header__date">{{ todayDisplay }}</div>
          <div class="hc-header__badges">
            <span v-if="learningStore.targetRoles.length" class="hc-badge hc-badge--role">
              目标岗位：{{ effectiveRole }}<span v-if="learningStore.targetRoles.length > 1"> +{{ learningStore.targetRoles.length - 1 }}</span>
            </span>
            <button v-else class="hc-badge hc-badge--empty" type="button" @click="nav('/app/student/career-analysis')">前往设置目标 →</button>
            <span v-if="heroScore != null" class="hc-badge hc-badge--ai">竞争力评估 {{ heroScore }} · {{ Math.round((heroConfidence ?? 0) * 100) }}%</span>
          </div>
        </div>
        <div class="hc-header__kpis">
          <div class="hc-kpi-item">
            <div class="hc-kpi-item__num">{{ fmtH(totalLearningMinutes) }}</div>
            <div class="hc-kpi-item__lbl">总学时</div>
          </div>
          <div class="hc-kpi-sep" aria-hidden="true" />
          <div class="hc-kpi-item">
            <div class="hc-kpi-item__num">{{ activeDays }}</div>
            <div class="hc-kpi-item__lbl">活跃天</div>
          </div>
          <div class="hc-kpi-sep" aria-hidden="true" />
          <div class="hc-kpi-item">
            <div class="hc-kpi-item__num">{{ streakDays }}</div>
            <div class="hc-kpi-item__lbl">连续天</div>
          </div>
          <div class="hc-kpi-sep" aria-hidden="true" />
          <div class="hc-kpi-item">
            <div class="hc-kpi-item__num">{{ inProgressCourseCount }}</div>
            <div class="hc-kpi-item__lbl">进行中</div>
          </div>
        </div>
      </section>

      <!-- B · 能力概览 -->
      <div class="hc-section-label reveal"><span>能力概览</span><span class="hc-section-label__line" /></div>
      <div class="hc-bi">
        <!-- B-left: Radar -->
        <div class="hc-card hc-card--radar reveal">
          <div class="hc-card__head">
            <span class="hc-card__title">{{ isParsedOrReported ? '能力雷达' : '岗位技能雷达' }}</span>
            <span class="hc-card__sub">{{ effectiveRole }}</span>
          </div>
          <div class="hc-radar-wrap">
            <D3RadarChart :data="radarChartData" />
          </div>
          <div v-if="!isParsedOrReported" class="hc-hint">完成简历解析或画像评估后可生成个人能力雷达，当前显示岗位要求参考线</div>
        </div>
        <!-- B-right: stacked cards -->
        <div class="hc-bi-right stagger">
          <!-- Market -->
          <div class="hc-card reveal">
            <div class="hc-card__head">
              <span class="hc-card__title">市场速览</span>
              <span class="hc-card__sub">{{ effectiveRole }}</span>
            </div>
            <div class="hc-mkt">
              <div class="hc-mkt__item">
                <div class="hc-mkt__val">{{ marketKpi.avgSalary }}k</div>
                <div class="hc-mkt__lbl">平均月薪</div>
              </div>
              <div class="hc-mkt__item">
                <div class="hc-mkt__val">{{ (marketKpi.demandTotal / 10000).toFixed(1) }}万</div>
                <div class="hc-mkt__lbl">岗位需求</div>
              </div>
              <div class="hc-mkt__item">
                <div class="hc-mkt__val">+{{ marketKpi.growthPct }}%</div>
                <div class="hc-mkt__lbl">年增长率</div>
              </div>
            </div>
          </div>
          <!-- Job match -->
          <div class="hc-card reveal">
            <div class="hc-card__head">
              <span class="hc-card__title">职业匹配</span>
              <span v-if="isParsedOrReported" class="hc-badge hc-badge--ai">个人评估 · {{ Math.round((heroConfidence ?? 0.78) * 100) }}%</span>
              <span v-else class="hc-badge">岗位基准</span>
            </div>
            <div class="hc-match-list">
              <div v-for="(c, i) in heroCandidates" :key="i" class="hc-match-row">
                <span class="hc-match-role">{{ c.role }}</span>
                <div class="hc-match-bar-wrap">
                  <div class="hc-match-bar" :class="{ 'hc-match-bar--active': isParsedOrReported }" :style="{ width: `${Math.round(c.score * 100)}%` }" />
                </div>
                <span class="hc-match-score">{{ Math.round(c.score * 100) }}%</span>
              </div>
            </div>
            <button v-if="!isParsedOrReported" class="hc-hint-link" type="button" @click="nav('/app/student/career-navigation')">完成评估后获取个人匹配分析 →</button>
          </div>
          <!-- Recommended action -->
          <div class="hc-card hc-card--action reveal">
            <div class="hc-card__head">
              <span class="hc-card__title">推荐行动</span>
              <span class="hc-badge hc-badge--priority">当前优先</span>
            </div>
            <p class="hc-action-text">{{ nextAction.text }}</p>
            <div class="hc-action-meta">
              <span class="hc-action-pill">{{ effectiveRole }}</span>
              <span class="hc-action-pill">{{ inProgressCourseCount }} 门进行中</span>
            </div>
            <button class="hc-btn hc-btn--primary" type="button" @click="nav(nextAction.route)">立即前往 →</button>
          </div>
        </div>
      </div>

      <!-- C · 职业规划全链路 -->
      <div class="hc-section-label reveal"><span>职业规划全链路</span><span class="hc-section-label__line" /></div>
      <section class="hc-phases reveal">
        <div class="hc-phases__track stagger">
          <div
            v-for="(phase, i) in phasesList"
            :key="phase.num"
            class="hc-phase reveal"
            :class="{ 'is-done': phasesDone[i] }"
          >
            <div class="hc-phase__circle" @click="nav(phase.route)">{{ phase.num }}</div>
            <div class="hc-phase__body">
              <div class="hc-phase__title" @click="nav(phase.route)">{{ phase.title }}</div>
              <div class="hc-phase__sub">{{ phase.subtitle }}</div>
              <ul class="hc-phase__links">
                <li v-for="item in phase.items" :key="item.route">
                  <button class="hc-phase__link" type="button" @click="nav(item.route)">{{ item.label }}</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- D · 成长数据双栏 -->
      <div class="hc-section-label reveal"><span>成长数据</span><span class="hc-section-label__line" /></div>
      <div class="hc-charts stagger">
        <!-- D-left: Weekly trend -->
        <div class="hc-card reveal">
          <div class="hc-card__head">
            <span class="hc-card__title">学习成长趋势</span>
            <span class="hc-card__sub">近 12 周 · 本周 {{ fmtH(thisWeekMinutes) }}</span>
          </div>
          <div class="hc-trend-wrap">
            <D3WeeklyTrend :data="weeklyTrendData" />
          </div>
        </div>
        <!-- D-right: Heat calendar -->
        <div class="hc-card reveal">
          <div class="hc-card__head">
            <span class="hc-card__title">成长足迹</span>
            <div class="hc-cal-stats">
              <span><b>{{ activeDays }}</b> 活跃天</span>
              <span aria-hidden="true" class="hc-cal-sep">·</span>
              <span><b>{{ streakDays }}</b> 连续天</span>
              <span aria-hidden="true" class="hc-cal-sep">·</span>
              <span><b>{{ fmtH(thisWeekMinutes) }}</b> 本周</span>
            </div>
          </div>
          <div class="hc-cal-body">
            <D3HeatCalendar v-if="heatCalendarData.length" :data="heatCalendarData" @day-click="handleDayClick" />
            <div v-else class="hc-empty">暂无学习记录，开始第一次课程学习后这里会形成成长轨迹</div>
            <div v-if="selectedDay && selectedDayRecords.length" class="hc-day-panel">
              <div class="hc-day-panel__head">
                <span>{{ selectedDay.date }} · {{ fmt(selectedDay.minutes) }}</span>
                <button class="hc-link" type="button" @click="selectedDay = null">收起</button>
              </div>
              <div class="hc-tl">
                <div v-for="r in selectedDayRecords" :key="r.id" class="hc-tl__row">
                  <span class="hc-tl__time">{{ new Date(r.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
                  <span class="hc-tl__course">{{ r.courseName }}</span>
                  <span class="hc-tl__meta">{{ fmt(r.studyTime) }} · {{ r.progress }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- E · 最近学习 -->
      <div class="hc-section-label reveal"><span>最近学习</span><span class="hc-section-label__line" /></div>
      <div class="hc-card reveal">
        <div class="hc-card__head"><span class="hc-card__title">最近学习</span></div>
        <div v-if="recentRecords.length" class="hc-recent">
          <div v-for="r in recentRecords" :key="r.id" class="hc-recent__row">
            <div class="hc-recent__info">
              <div class="hc-recent__name">{{ r.courseName }}</div>
              <div class="hc-recent__meta">{{ r.completedAt.split('T')[0] }}</div>
            </div>
            <div class="hc-recent__progress-wrap">
              <div class="hc-recent__bar" :style="{ width: r.progress + '%' }" />
            </div>
            <span class="hc-recent__pct">{{ r.progress }}%</span>
          </div>
        </div>
        <div v-else class="hc-empty hc-empty--action">
          完成你的第一次学习后，这里会呈现成长轨迹
          <button class="hc-hint-link" type="button" @click="nav('/app/student/learning')">前往学习中心 →</button>
        </div>
      </div>

    </template>

    <!-- ═══ 管理员视图 ═══ -->
    <template v-else>
      <section class="hc-admin reveal">
        <div class="hc-card__head">
          <span class="hc-card__title">管理端首页</span>
        </div>
        <div class="hc-admin__actions">
          <button class="hc-btn hc-btn--primary" type="button" @click="nav('/app/admin/job-dataset')">岗位数据集</button>
          <button class="hc-btn" type="button" @click="nav('/app/admin/knowledge-base')">知识库维护</button>
        </div>
      </section>
    </template>

  </div>
</template>

<style scoped>

/* ══ 页面根 ══ */
.hc {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px 28px 48px;
  background:
    linear-gradient(168deg, color-mix(in srgb, var(--vermilion-100) 18%, var(--parchment-100) 82%) 0%, var(--parchment-100) 38%, color-mix(in srgb, var(--indigo-100) 10%, var(--parchment-100) 90%) 100%);
  color: var(--text-100);
  font-family: var(--font-ui);
  font-size: 14px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--parchment-400) transparent;
  position: relative;
}

/* ══ 分区标签 ══ */
.hc-section-label {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--ink-500);
  text-transform: uppercase;
  margin-top: 4px;
}
.hc-section-label__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--parchment-400), transparent 80%);
}

/* ══ A · 指挥台顶带 ══ */
.hc-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px 22px;
  flex-wrap: wrap;
  min-height: 136px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background:
    linear-gradient(135deg,
      color-mix(in srgb, var(--vermilion-500) 6%, var(--color-surface) 94%) 0%,
      var(--color-surface) 40%,
      color-mix(in srgb, var(--gold-100) 30%, var(--color-surface) 70%) 100%);
  border: 1px solid color-mix(in srgb, var(--vermilion-300) 12%, var(--parchment-300) 88%);
  box-shadow:
    var(--shadow-md),
    0 0 0 1px rgba(190, 42, 0, 0.03),
    inset 0 1px 0 rgba(255,255,255,0.7);
}
.hc-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--vermilion-500), var(--gold-500) 50%, var(--indigo-500));
  opacity: 0.85;
}
.hc-header__left,
.hc-header__kpis {
  position: relative;
  z-index: 1;
}
.hc-header__left { display: flex; flex-direction: column; gap: 6px; }
.hc-header__greeting {
  font-size: 20px;
  font-weight: 500;
  color: var(--ink-900);
  line-height: 1.3;
  letter-spacing: 0.01em;
}
.hc-header__date {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.10em;
  color: var(--ink-300);
  text-transform: uppercase;
}
.hc-header__badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.hc-header__kpis {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hc-kpi-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 22px;
  gap: 5px;
}
.hc-kpi-item__num {
  font-size: 2.6rem;
  font-weight: 300;
  line-height: 1;
  color: var(--vermilion-700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}
.hc-kpi-item__lbl {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-300);
}
.hc-kpi-sep {
  width: 1px;
  height: 44px;
  background: linear-gradient(180deg, transparent, var(--parchment-400), transparent);
  flex-shrink: 0;
}

/* ══ 公共卡片 ══ */
.hc-card {
  background: var(--color-surface);
  border: 1px solid var(--parchment-300);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm), 0 0 0 1px rgba(0,0,0,0.02);
  overflow: hidden;
  transition: transform 300ms cubic-bezier(0.16,1,0.3,1), box-shadow 300ms ease-out, border-color 300ms ease;
  position: relative;
}
.hc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--vermilion-300), var(--gold-300));
  opacity: 0;
  transition: opacity 0.3s ease;
}
.hc-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md), 0 0 0 1px rgba(190,42,0,0.04);
  border-color: color-mix(in srgb, var(--vermilion-300) 20%, var(--parchment-300) 80%);
}
.hc-card:hover::before { opacity: 1; }

.hc-card--radar {
  background: linear-gradient(160deg, var(--color-surface) 60%, color-mix(in srgb, var(--indigo-100) 20%, var(--color-surface) 80%));
}
.hc-card--radar::before {
  background: linear-gradient(90deg, var(--indigo-300), var(--vermilion-300));
}

.hc-card--action {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--vermilion-500) 4%, var(--color-surface) 96%),
    color-mix(in srgb, var(--gold-100) 15%, var(--color-surface) 85%));
  border: 1px solid var(--card-emphasis-border);
  border-left: 3px solid var(--color-primary);
}
.hc-card--action::before { display: none; }
.hc-card--action:hover {
  box-shadow: var(--shadow-md), 0 0 16px rgba(190,42,0,0.06);
}

.hc-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 20px 12px;
  border-bottom: 1px solid var(--parchment-300);
  flex-wrap: wrap;
  background: linear-gradient(180deg, rgba(245,245,243,0.5) 0%, transparent 100%);
}
.hc-card__title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-700);
}
.hc-card__sub {
  font-size: 11px;
  color: var(--ink-300);
  letter-spacing: 0.02em;
}

/* ══ 徽章 ══ */
.hc-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
  background: var(--parchment-200);
  color: var(--ink-500);
  border: 1px solid var(--parchment-300);
  cursor: default;
  backdrop-filter: blur(4px);
}
.hc-badge--role {
  background: color-mix(in srgb, var(--vermilion-500) 8%, var(--color-surface) 92%);
  color: var(--vermilion-700);
  border-color: color-mix(in srgb, var(--vermilion-300) 25%, var(--parchment-300) 75%);
  font-weight: 600;
}
.hc-badge--ai {
  background: color-mix(in srgb, var(--indigo-500) 8%, var(--color-surface) 92%);
  color: var(--indigo-500);
  border-color: color-mix(in srgb, var(--indigo-300) 25%, var(--parchment-300) 75%);
}
.hc-badge--priority {
  background: color-mix(in srgb, var(--vermilion-500) 10%, var(--gold-100) 90%);
  color: var(--vermilion-700);
  border-color: color-mix(in srgb, var(--gold-300) 40%, var(--parchment-300) 60%);
  font-weight: 600;
}
.hc-badge--empty {
  border-style: dashed;
  cursor: pointer;
  color: var(--ink-300);
  background: transparent;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.hc-badge--empty:hover {
  border-color: var(--vermilion-300);
  color: var(--vermilion-500);
  background: color-mix(in srgb, var(--vermilion-500) 4%, transparent 96%);
}

/* ══ B · 能力概览双栏 ══ */
.hc-bi {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
  align-items: stretch;
}
.hc-bi-right {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.hc-bi-right .hc-card--action {
  flex: 1;
  min-height: 0;
}

.hc-radar-wrap { padding: 18px 20px 14px; height: 320px; }

/* 市场速览 */
.hc-mkt {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  padding: 18px 20px;
}
.hc-mkt__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
}
.hc-mkt__item + .hc-mkt__item {
  border-left: 1px solid var(--parchment-300);
}
.hc-mkt__val {
  font-size: 1.6rem;
  font-weight: 300;
  color: var(--indigo-700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.hc-mkt__lbl {
  font-size: 10px;
  font-weight: 500;
  color: var(--ink-300);
  letter-spacing: 0.08em;
  margin-top: 6px;
  text-transform: uppercase;
}

/* 职业匹配 */
.hc-match-list { padding: 14px 20px; display: flex; flex-direction: column; gap: 8px; }
.hc-match-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid var(--parchment-300);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--parchment-100) 50%, var(--color-surface) 50%);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.hc-match-row:hover {
  border-color: color-mix(in srgb, var(--vermilion-300) 30%, var(--parchment-300) 70%);
  background: var(--color-surface);
  box-shadow: 0 2px 8px rgba(190,42,0,0.06);
}
.hc-match-role { font-size: 12px; color: var(--ink-700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
.hc-match-bar-wrap {
  flex: 1;
  min-width: 60px;
  max-width: 100px;
  height: 5px;
  background: var(--parchment-300);
  border-radius: 999px;
  overflow: hidden;
}
.hc-match-bar {
  height: 100%;
  background: var(--parchment-400);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
}
.hc-match-bar--active {
  background: linear-gradient(90deg, var(--vermilion-300), var(--vermilion-500));
}
.hc-match-score { font-size: 11px; color: var(--ink-300); min-width: 30px; text-align: right; font-variant-numeric: tabular-nums; }

/* 推荐行动 */
.hc-action-text {
  font-size: 13px;
  color: var(--ink-500);
  line-height: 1.8;
  padding: 16px 20px 10px;
  margin: 0;
}
.hc-action-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0 20px 16px;
}
.hc-action-pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vermilion-100) 40%, var(--color-surface) 60%);
  border: 1px solid color-mix(in srgb, var(--vermilion-300) 15%, var(--parchment-300) 85%);
  color: var(--ink-500);
  font-size: 11px;
}
.hc-card--action .hc-btn {
  margin: 0 20px 18px;
}

/* ══ C · 职业规划链路 ══ */
.hc-phases {
  background: var(--color-surface);
  border: 1px solid var(--parchment-300);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 22px 24px 24px;
  overflow: hidden;
  position: relative;
}
.hc-phases__track {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  position: relative;
}
.hc-phases__track::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 22px;
  right: 22px;
  height: 2px;
  background: linear-gradient(90deg, var(--vermilion-300), var(--gold-300), var(--indigo-300));
  opacity: 0.25;
  border-radius: 1px;
  z-index: 0;
}
.hc-phase {
  position: relative;
  z-index: 1;
}
.hc-phase__circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--parchment-400);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-300);
  cursor: pointer;
  margin-bottom: 12px;
  transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), border-color 0.2s, color 0.2s, box-shadow 0.2s, background 0.2s;
  position: relative;
  z-index: 2;
}
.hc-phase__circle:hover {
  border-color: var(--vermilion-300);
  color: var(--vermilion-500);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 20px rgba(190,42,0,0.10);
  background: color-mix(in srgb, var(--vermilion-100) 20%, var(--color-surface) 80%);
}
.hc-phase.is-done .hc-phase__circle {
  border-color: var(--vermilion-500);
  background: linear-gradient(135deg, var(--vermilion-500), var(--vermilion-700));
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(190,42,0,0.20);
}
.hc-phase__body {
  padding: 14px 14px 16px;
  border: 1px solid var(--parchment-300);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--parchment-100) 40%, var(--color-surface) 60%);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.hc-phase:hover .hc-phase__body {
  border-color: color-mix(in srgb, var(--vermilion-300) 20%, var(--parchment-300) 80%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.hc-phase__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-900);
  margin-bottom: 4px;
  cursor: pointer;
  transition: color 0.15s;
}
.hc-phase__title:hover { color: var(--vermilion-500); }
.hc-phase.is-done .hc-phase__title { color: var(--vermilion-500); }
.hc-phase__sub { font-size: 11px; color: var(--ink-300); margin-bottom: 10px; line-height: 1.5; }
.hc-phase__links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
.hc-phase__link {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  font-size: 12px;
  color: var(--ink-500);
  cursor: pointer;
  padding: 5px 0;
  font-family: inherit;
  transition: color 0.15s, transform 0.15s, padding-left 0.15s;
  position: relative;
}
.hc-phase__link::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--parchment-400);
  margin-right: 8px;
  vertical-align: middle;
  transition: background 0.15s;
}
.hc-phase__link:hover { color: var(--vermilion-500); padding-left: 4px; }
.hc-phase__link:hover::before { background: var(--vermilion-300); }
.hc-phase__link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: 2px; }

/* ══ D · 成长数据双栏 ══ */
.hc-charts {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
  align-items: stretch;
}
.hc-trend-wrap { padding: 16px 20px 20px; }

.hc-cal-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-300);
}
.hc-cal-stats b { color: var(--vermilion-700); font-weight: 700; }
.hc-cal-sep { opacity: 0.3; }
.hc-cal-body { padding: 14px 18px 18px; }

.hc-day-panel {
  margin-top: 14px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--parchment-100) 50%, var(--color-surface) 50%);
  border-radius: var(--radius-sm);
  border: 1px solid var(--parchment-300);
}
.hc-day-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--ink-300);
  margin-bottom: 10px;
}
.hc-tl { display: flex; flex-direction: column; gap: 6px; }
.hc-tl__row { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; }
.hc-tl__time { font-size: 11px; color: var(--ink-300); font-variant-numeric: tabular-nums; }
.hc-tl__course { font-size: 12px; color: var(--ink-500); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hc-tl__meta { font-size: 11px; color: var(--ink-300); white-space: nowrap; }

/* ══ E · 最近学习 ══ */
.hc-recent { padding: 14px 20px 18px; display: flex; flex-direction: column; gap: 4px; }
.hc-recent__row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: var(--radius-sm);
  transition: background 0.2s, box-shadow 0.2s;
}
.hc-recent__row:hover {
  background: color-mix(in srgb, var(--parchment-100) 60%, var(--color-surface) 40%);
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.hc-recent__info { min-width: 0; }
.hc-recent__name { font-size: 13px; font-weight: 600; color: var(--ink-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hc-recent__meta { font-size: 11px; color: var(--ink-300); margin-top: 3px; }
.hc-recent__progress-wrap { width: 80px; height: 5px; background: var(--parchment-300); border-radius: 999px; overflow: hidden; }
.hc-recent__bar {
  height: 100%;
  background: linear-gradient(90deg, var(--vermilion-300), var(--vermilion-500));
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.16,1,0.3,1);
}
.hc-recent__pct { font-size: 11px; color: var(--ink-300); min-width: 28px; text-align: right; font-variant-numeric: tabular-nums; }

/* ══ 通用元素 ══ */
.hc-hint { font-size: 11px; color: var(--ink-300); padding: 6px 20px 16px; line-height: 1.7; }
.hc-hint-link {
  background: none;
  border: none;
  color: var(--vermilion-500);
  font-size: 12px;
  cursor: pointer;
  padding: 8px 20px 16px;
  font-family: inherit;
  display: block;
  text-align: left;
  font-weight: 500;
  transition: color 0.2s;
}
.hc-hint-link:hover { color: var(--vermilion-700); }
.hc-hint-link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.hc-empty {
  font-size: 12px;
  color: var(--ink-300);
  padding: 32px 24px;
  text-align: center;
  line-height: 1.8;
}
.hc-empty--action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.hc-empty--action .hc-hint-link { padding: 0; }

/* ══ 按钮 ══ */
.hc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--parchment-400);
  background: var(--color-surface);
  color: var(--ink-700);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1);
  white-space: nowrap;
}
.hc-btn:hover {
  border-color: var(--vermilion-300);
  color: var(--vermilion-500);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(190,42,0,0.08);
}
.hc-btn:active { transform: translateY(0) scale(0.98); }
.hc-btn--primary {
  background: linear-gradient(135deg, var(--vermilion-500), var(--vermilion-700));
  border-color: var(--vermilion-700);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(190,42,0,0.22);
  letter-spacing: 0.02em;
}
.hc-btn--primary:hover {
  background: linear-gradient(135deg, var(--vermilion-700), var(--vermilion-900));
  border-color: var(--vermilion-900);
  color: #fff;
  box-shadow: 0 6px 20px rgba(190,42,0,0.30);
  transform: translateY(-2px);
}
.hc-link {
  background: none;
  border: none;
  color: var(--vermilion-500);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  font-weight: 500;
}
.hc-link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: 2px; }

/* ══ 管理员 ══ */
.hc-admin {
  background: var(--color-surface);
  border: 1px solid var(--parchment-300);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 24px 28px;
}
.hc-admin__actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }

/* ══ 滚动揭示动效 ══ */
@media (prefers-reduced-motion: no-preference) {
  .reveal {
    opacity: 0;
    transform: translate3d(0, 18px, 0) scale(0.995);
    filter: blur(4px);
    will-change: transform, opacity, filter;
    transition:
      opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
      filter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hc-header.reveal { transition-duration: 0.5s, 0.5s, 0.5s; }
  .hc-section-label.reveal { transition-duration: 0.4s, 0.4s, 0.4s; }
  .hc-phases.reveal { transition-duration: 0.55s, 0.55s, 0.55s; }
  .hc-phase.reveal  { transition-duration: 0.55s, 0.55s, 0.55s; }
  .reveal.in-view { opacity: 1; transform: none; filter: none; }

  .stagger > .reveal:nth-child(1) { transition-delay: 0.00s; }
  .stagger > .reveal:nth-child(2) { transition-delay: 0.07s; }
  .stagger > .reveal:nth-child(3) { transition-delay: 0.14s; }
  .stagger > .reveal:nth-child(4) { transition-delay: 0.21s; }
  .stagger > .reveal:nth-child(5) { transition-delay: 0.28s; }
  .stagger > .reveal:nth-child(6) { transition-delay: 0.35s; }
}
@media (prefers-reduced-motion: reduce) {
  .reveal { transition: none; opacity: 1; transform: none; filter: none; }
}

/* ══ 响应式 ══ */
@media (max-width: 900px) {
  .hc-bi { grid-template-columns: 1fr; }
  .hc-bi-right .hc-card--action { flex: none; }
}
@media (max-width: 768px) {
  .hc { padding: 16px; gap: 14px; }
  .hc-header { flex-direction: column; align-items: stretch; padding: 20px 20px 18px; }
  .hc-header__kpis { justify-content: center; }
  .hc-charts { grid-template-columns: 1fr; }
  .hc-phases__track { grid-template-columns: repeat(2, 1fr); }
  .hc-phases__track::before { display: none; }
}
@media (max-width: 640px) {
  .hc-header__kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .hc-kpi-sep { display: none; }
  .hc-kpi-item { padding: 8px 0; }
  .hc-kpi-item__num { font-size: 2rem; }
  .hc-phases__track { grid-template-columns: 1fr; }
  .hc-btn { width: 100%; }
  .hc-mkt { grid-template-columns: 1fr; }
  .hc-mkt__item + .hc-mkt__item { border-left: none; border-top: 1px solid var(--parchment-300); }
}

</style>

