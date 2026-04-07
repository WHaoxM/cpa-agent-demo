<!-- 页面：首页；路由：/app/dashboard（dashboard）；角色：STUDENT/ADMIN -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useCourseStore } from '@/stores'
import { useLearningStore, type LearningRecord } from '@/stores/learning'
import { useResumeStore } from '@/stores/resume'
import { useOnboardingState } from '@/composables/useOnboardingState'
import D3HeatCalendar from '@/components/charts/D3HeatCalendar.vue'

type DayPayload = { date: string; minutes: number }

const router = useRouter()
const userStore = useUserStore()
const learningStore = useLearningStore()
const courseStore = useCourseStore()
const resumeStore = useResumeStore()

const {
  hasExplored,
  hasQuizRecords,
  hasAssessed,
  hasStartedLearning,
  onboardingDone,
} = useOnboardingState()

const currentUserId = computed(() => userStore.currentUser?.id ?? '')
const isStudent = computed(() => userStore.isStudent)
const expandGuide = ref(false)

const userLearningHistory = computed((): LearningRecord[] => {
  if (!currentUserId.value) return []
  return learningStore.learningHistory.filter(r => r.userId === currentUserId.value)
})

const quizCount = computed(() => {
  if (!currentUserId.value) return 0
  return learningStore.getUserQuizRecords(currentUserId.value).length
})

const targetRole = computed(() => {
  const fromAnalysis = learningStore.targetRoles[0]?.role
  if (fromAnalysis) return fromAnalysis
  return (resumeStore.matchedCareers[0]?.role as string) ?? ''
})

const targetRoleCount = computed(() => learningStore.targetRoles.length)
const matchedCareerCount = computed(() => resumeStore.matchedCareers.length)

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

function nav(path: string) {
  router.push(path)
}

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

const maxStreak = computed(() => {
  const dates = [...dayMinutesMap.value.keys()].sort()
  if (!dates.length) return 0
  let best = 1, cur = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.floor((parseDay(dates[i]!).getTime() - parseDay(dates[i - 1]!).getTime()) / 86400000)
    if (diff === 1) { cur++; best = Math.max(best, cur) } else cur = 1
  }
  return best
})

const thisWeekMinutes = computed(() => {
  const startKey = toDayKey(new Date(Date.now() - 6 * 86400000))
  return userLearningHistory.value.reduce((sum, r) => {
    const day = r.completedAt.split('T')[0] ?? ''
    return day >= startKey && day <= todayKey ? sum + r.studyTime : sum
  }, 0)
})

const guideVisible = computed(() => !onboardingDone.value || expandGuide.value)

const assessDetail = computed(() => {
  if (resumeStore.isParsed) return `已解析简历 · 匹配 ${matchedCareerCount.value} 个方向`
  if (hasQuizRecords.value) return `已完成 ${quizCount.value} 次技能问卷`
  return ''
})

function fmt(min: number): string {
  if (min < 60) return `${min} 分钟`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

function fmtH(min: number): string {
  return `${(min / 60).toFixed(1)}h`
}
</script>

<template>
  <div class="hc book-paper">
    <!-- ═══ 学生视图 ═══ -->
    <template v-if="isStudent">

      <!-- ── 区域1：入门三径 ── -->
      <section class="hc-panel">
        <!-- 区块页眉 -->
        <header class="hc-bar">
          <span class="hc-bar__title">◈ 入 门 三 径</span>
          <button v-if="onboardingDone" class="hc-link" type="button" @click="expandGuide = !expandGuide">
            {{ expandGuide ? '收起 ↑' : '展开 ↓' }}
          </button>
        </header>

        <!-- 已完成折叠条 -->
        <div class="hc-done-bar" :class="{ 'hc-done-bar--visible': onboardingDone && !expandGuide }">
          <span class="hc-done-bar__text">✓ 三步均已完成 · 方向：{{ targetRole || '未设置' }}<template v-if="assessDetail"> · {{ assessDetail }}</template></span>
        </div>

        <!-- 三步展开 -->
        <div class="hc-steps" :class="{ 'hc-steps--hidden': !guideVisible }">

          <!-- 步骤 1 -->
          <article class="hc-step" :class="{ 'is-done': hasExplored }">
            <div class="step-badge">
              <span v-if="hasExplored" class="step-badge__check">✓</span>
              <span v-else class="step-badge__no">一</span>
            </div>
            <div class="step-body">
              <h3 class="step-title">探索方向</h3>
              <p class="step-desc">在职业分析中确定目标方向，后续评估和学习都会围绕此方向展开。</p>
              <div v-if="hasExplored" class="step-status">已关注 {{ targetRoleCount }} 个方向 · 主要方向：{{ targetRole || '未设置' }}</div>
            </div>
            <div class="step-action">
              <button v-if="!hasExplored" class="hc-btn hc-btn--primary" type="button" @click="nav('/app/student/career-analysis')">开始探索</button>
              <button v-else class="hc-btn" type="button" @click="nav('/app/student/career-analysis')">重新探索</button>
            </div>
          </article>

          <!-- 步骤 2 -->
          <article class="hc-step" :class="{ 'is-done': hasAssessed }">
            <div class="step-badge">
              <span v-if="hasAssessed" class="step-badge__check">✓</span>
              <span v-else class="step-badge__no">二</span>
            </div>
            <div class="step-body">
              <h3 class="step-title">明了差距</h3>
              <p class="step-desc">有简历走职途导航，无简历走技能自评，两者目标一致，选一即可。</p>
              <div v-if="assessDetail" class="step-status">{{ assessDetail }}</div>
            </div>
            <div class="step-action">
              <template v-if="!hasAssessed">
                <button class="hc-btn hc-btn--primary" type="button" @click="nav('/app/student/career-navigation')">上传简历</button>
                <span class="step-or">或</span>
                <button class="hc-btn" type="button" @click="nav('/app/exams')">技能问卷</button>
              </template>
              <template v-else>
                <button class="hc-btn" type="button"
                  @click="nav(resumeStore.isParsed ? '/app/student/career-navigation' : '/app/exams')">
                  {{ resumeStore.isParsed ? '重新上传' : '再做一次' }}
                </button>
              </template>
            </div>
          </article>

          <!-- 步骤 3 -->
          <article class="hc-step" :class="{ 'is-done': hasStartedLearning }">
            <div class="step-badge">
              <span v-if="hasStartedLearning" class="step-badge__check">✓</span>
              <span v-else class="step-badge__no">三</span>
            </div>
            <div class="step-body">
              <h3 class="step-title">开始学习</h3>
              <p class="step-desc">根据差距进入技能提升，形成学习记录，逐步沉淀成长轨迹。</p>
              <div v-if="hasStartedLearning" class="step-status">已学习 {{ fmt(totalLearningMinutes) }} · {{ inProgressCourseCount }} 门课进行中</div>
            </div>
            <div class="step-action">
              <button v-if="!hasStartedLearning" class="hc-btn hc-btn--primary" type="button" @click="nav('/app/student/learning')">去技能提升</button>
              <button v-else class="hc-btn" type="button" @click="nav('/app/student/learning')">继续学习</button>
            </div>
          </article>

        </div>
      </section>

      <!-- ── 区域2：成长足迹 ── -->
      <section class="hc-panel">
        <header class="hc-bar hc-bar--growth">
          <span class="hc-bar__title">◈ 成 长 足 迹</span>
          <div class="growth-stats">
            <span><b>{{ activeDays }}</b> 活跃天</span>
            <em>·</em>
            <span><b>{{ streakDays }}</b> 连续天</span>
            <em>·</em>
            <span><b>{{ maxStreak }}</b> 最长连学</span>
            <em>·</em>
            <span><b>{{ fmtH(thisWeekMinutes) }}</b> 本周学习</span>
          </div>
        </header>

        <div class="hc-calendar-wrap">
          <div v-if="heatCalendarData.length">
            <D3HeatCalendar :data="heatCalendarData" @day-click="handleDayClick" />
          </div>
          <div v-else class="hc-empty">
            暂无学习记录，完成一次课程学习后这里会形成成长轨迹。
          </div>

          <!-- 日期时间线 -->
          <div v-if="selectedDay && selectedDayRecords.length" class="day-panel">
            <div class="day-panel__head">
              <span>{{ selectedDay.date }} · {{ fmt(selectedDay.minutes) }}</span>
              <button class="hc-link" type="button" @click="selectedDay = null">收起</button>
            </div>
            <div class="day-timeline">
              <div v-for="r in selectedDayRecords" :key="r.id" class="tl-row">
                <span class="tl-time">{{ new Date(r.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
                <span class="tl-course">{{ r.courseName }}</span>
                <span class="tl-meta">{{ fmt(r.studyTime) }} · {{ r.progress }}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 区域3：快捷工具 ── -->
      <nav class="hc-shelf" aria-label="快捷工具">
        <button class="bookmark-tab" type="button" @click="nav('/app/student/wrongquestions')">薄弱点记录</button>
        <button class="bookmark-tab" type="button" @click="nav('/app/notes')">学习笔记</button>
        <button class="bookmark-tab" type="button" @click="nav('/app/student/ai-assistant')">AI 助手</button>
        <button class="bookmark-tab" type="button" @click="nav('/app/student/favorites')">心仪岗位</button>
        <button class="bookmark-tab" type="button" @click="nav('/app/student/my-reports')">我的报告</button>
      </nav>

    </template>

    <!-- ═══ 管理员视图 ═══ -->
    <template v-else>
      <section class="hc-panel">
        <header class="hc-bar">
          <span class="hc-bar__title">◈ 管理端首页</span>
        </header>
        <div class="hc-admin-actions">
          <button class="hc-btn hc-btn--primary" type="button" @click="nav('/app/admin/job-dataset')">岗位数据集</button>
          <button class="hc-btn" type="button" @click="nav('/app/admin/knowledge-base')">知识库维护</button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* ── 页面容器 ── */
.hc {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── 面板（每个区域的卡片） ── */
.hc-panel {
  border: 1px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  background: var(--color-surface);
  margin-bottom: 10px;
}

.hc-panel:last-of-type {
  margin-bottom: 0;
}

/* ── 区块页眉 ── */
.hc-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 16px;
  border-bottom: 1px solid var(--color-gold);
  min-height: 40px;
}

.hc-bar__title {
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--color-text);
}

/* ── 成长页眉额外样式 ── */
.hc-bar--growth {
  flex-wrap: wrap;
  gap: 8px;
}

.growth-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: var(--font-accent);
  color: var(--color-text-muted);
}

.growth-stats b {
  font-family: var(--font-latin);
  font-size: 16px;
  font-weight: 400;
  color: var(--color-primary);
  margin-right: 1px;
}

.growth-stats em {
  font-style: normal;
  color: var(--color-gold);
  font-size: 13px;
}

/* ── 折叠完成条 ── */
.hc-done-bar {
  overflow: hidden;
  max-height: 0;
  transition: max-height 300ms ease, padding 300ms ease, opacity 300ms ease;
  opacity: 0;
  background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface) 94%);
  border-bottom: 1px dashed var(--color-border);
}

.hc-done-bar--visible {
  max-height: 48px;
  opacity: 1;
  padding: 10px 16px;
}

.hc-done-bar__text {
  font-size: 12px;
  font-family: var(--font-accent);
  color: var(--color-text-muted);
}

/* ── 步骤容器（可折叠） ── */
.hc-steps {
  overflow: hidden;
  max-height: 1200px;
  transition: max-height 380ms ease;
}

.hc-steps--hidden {
  max-height: 0;
}

/* ── 单步骤行 ── */
.hc-step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  min-height: 64px;
  transition: background 200ms;
}

.hc-step:last-child {
  border-bottom: none;
}

.hc-step.is-done {
  background: color-mix(in srgb, var(--color-surface) 96%, var(--color-primary) 4%);
}

/* ── 步骤圆形徽标 ── */
.step-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid var(--parchment-400);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 250ms, border-color 250ms;
}

.hc-step.is-done .step-badge {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.step-badge__no {
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--color-text-subtle);
  line-height: 1;
}

.step-badge__check {
  font-size: 13px;
  color: var(--parchment-100);
  line-height: 1;
}

/* ── 步骤正文 ── */
.step-body {
  flex: 1;
  min-width: 0;
}

.step-title {
  margin: 0;
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-text);
}

.hc-step.is-done .step-title {
  color: var(--color-text-muted);
}

.step-desc {
  margin: 4px 0 0;
  font-family: var(--font-accent);
  font-size: 12px;
  color: var(--color-text-subtle);
  line-height: 1.65;
}

.step-status {
  margin-top: 5px;
  font-family: var(--font-accent);
  font-size: 11px;
  color: var(--color-primary);
}

/* ── 步骤操作区 ── */
.step-action {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 220px;
  justify-content: flex-end;
}

.step-or {
  font-family: var(--font-accent);
  font-size: 12px;
  color: var(--color-gold);
}

/* ── 按钮 ── */
.hc-btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 0.08em;
  padding: 5px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms, color 150ms;
}

.hc-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent 90%);
}

.hc-btn--primary {
  background: var(--color-primary);
  color: var(--parchment-100);
}

.hc-btn--primary:hover {
  background: var(--color-primary-dark);
}

/* ── 链接按钮 ── */
.hc-link {
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-family: var(--font-accent);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

/* ── 日历区 ── */
.hc-calendar-wrap {
  padding: 12px 16px 16px;
}

.hc-empty {
  padding: 16px 0;
  font-family: var(--font-accent);
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.7;
}

/* ── 日期时间线面板 ── */
.day-panel {
  margin-top: 12px;
  border-top: 1px dashed var(--color-border);
  padding-top: 10px;
}

.day-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-title);
  font-size: 12px;
  color: var(--color-text);
  margin-bottom: 8px;
}

.day-timeline {
  padding-left: 20px;
  border-left: 2px solid var(--color-primary);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tl-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 0;
  font-size: 12px;
}

.tl-row::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--parchment-100);
  border: 1.5px solid var(--color-primary);
}

.tl-time {
  font-family: var(--font-latin);
  color: var(--color-text-subtle);
  width: 52px;
  flex-shrink: 0;
}

.tl-course {
  flex: 1;
  font-family: var(--font-title);
  color: var(--color-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-meta {
  font-family: var(--font-accent);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* ── 快捷工具书签栏 ── */
.hc-shelf {
  display: flex;
  border-top: 1px solid var(--color-border);
  border-bottom: 2px solid var(--color-primary);
  overflow-x: auto;
}

.bookmark-tab {
  flex: 1;
  min-width: 110px;
  text-align: center;
  justify-content: center;
  letter-spacing: 0.1em;
}

/* ── 管理员 ── */
.hc-admin-actions {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
}

/* ── 响应式 ── */
@media (max-width: 900px) {
  .step-action {
    width: 160px;
  }
}

@media (max-width: 720px) {
  .hc-step {
    flex-wrap: wrap;
  }

  .step-action {
    width: 100%;
    justify-content: flex-start;
    padding-left: 48px;
  }
}

@media (max-width: 560px) {
  .step-badge {
    display: none;
  }

  .step-action {
    padding-left: 0;
  }

  .growth-stats {
    flex-wrap: wrap;
    gap: 4px;
  }

  .hc-shelf {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .bookmark-tab {
    min-width: 0;
  }
}
</style>
