<!-- 页面：首页；路由：/app/dashboard（dashboard）；角色：STUDENT/ADMIN -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
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

const { hasExplored, hasQuizRecords, hasAssessed, onboardingDone } = useOnboardingState()

const isStudent = computed(() => userStore.isStudent)
const currentUser = computed(() => userStore.currentUser)
const currentUserId = computed(() => userStore.currentUser?.id ?? '')

function navigateTo(path: string) {
  router.push(path)
}

function toDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDay(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00`)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

const userLearningHistory = computed(() => {
  if (!currentUserId.value) return [] as LearningRecord[]
  return learningStore.learningHistory.filter(record => record.userId === currentUserId.value)
})

const dayMinutesMap = computed(() => {
  const m = new Map<string, number>()
  for (const record of userLearningHistory.value) {
    const day = record.completedAt.split('T')[0]
    if (!day) continue
    m.set(day, (m.get(day) ?? 0) + record.studyTime)
  }
  return m
})

const heatCalendarData = computed(() => {
  return Array.from(dayMinutesMap.value.entries())
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => (a.date > b.date ? 1 : -1))
})

const dayRecordsMap = computed(() => {
  const m = new Map<string, LearningRecord[]>()
  for (const record of userLearningHistory.value) {
    const day = record.completedAt.split('T')[0]
    if (!day) continue
    const list = m.get(day) ?? []
    list.push(record)
    m.set(day, list)
  }
  return m
})

const selectedDay = ref<DayPayload | null>(null)
const selectedDayRecords = computed(() => {
  if (!selectedDay.value) return [] as LearningRecord[]
  const records = dayRecordsMap.value.get(selectedDay.value.date) ?? []
  return records.slice().sort((a, b) => (a.completedAt > b.completedAt ? 1 : -1))
})

function handleDayClick(payload: DayPayload) {
  if (selectedDay.value?.date === payload.date) {
    selectedDay.value = null
    return
  }
  selectedDay.value = payload
}

const todayKey = toDayKey(new Date())

const todayMinutes = computed(() => dayMinutesMap.value.get(todayKey) ?? 0)

const activeDays = computed(() => dayMinutesMap.value.size)

const streakDays = computed(() => {
  const dates = Array.from(dayMinutesMap.value.keys()).sort().reverse()
  if (!dates.length) return 0

  let streak = 0
  const now = parseDay(todayKey)
  for (const dateKey of dates) {
    const cur = parseDay(dateKey)
    const diff = Math.floor((now.getTime() - cur.getTime()) / 86400000)
    if (diff === streak) streak += 1
    else if (diff > streak) break
  }
  return streak
})

const maxStreak = computed(() => {
  const dates = Array.from(dayMinutesMap.value.keys()).sort()
  if (!dates.length) return 0

  let best = 1
  let cur = 1
  for (let i = 1; i < dates.length; i += 1) {
    const prev = parseDay(dates[i - 1] ?? '')
    const next = parseDay(dates[i] ?? '')
    const diff = Math.floor((next.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) {
      cur += 1
      best = Math.max(best, cur)
    } else {
      cur = 1
    }
  }
  return best
})

const weekStart = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - 6)
  return d
})

const thisWeekMinutes = computed(() => {
  const startKey = toDayKey(weekStart.value)
  return userLearningHistory.value.reduce((sum, record) => {
    const day = record.completedAt.split('T')[0] ?? ''
    if (day >= startKey && day <= todayKey) return sum + record.studyTime
    return sum
  }, 0)
})

const courseStats = computed(() => {
  if (!currentUserId.value) {
    return { enrolled: 0, completed: 0 }
  }

  const progressList = courseStore.getUserProgress(currentUserId.value)
  const map = new Map<string, number>()
  for (const item of progressList) {
    const prev = map.get(item.courseId) ?? 0
    map.set(item.courseId, Math.max(prev, item.progress ?? 0))
  }

  const enrolled = map.size
  const completed = Array.from(map.values()).filter(v => v >= 100).length
  return { enrolled, completed }
})

const targetRole = computed(() => learningStore.targetRoles[0]?.role ?? '')

const onboardingCards = computed(() => {
  return [
    {
      key: 'analysis',
      title: '职业分析',
      desc: '适合不了解岗位、想先看方向的同学',
      detail: '了解岗位要求与发展路径',
      completed: hasExplored.value,
      action: hasExplored.value ? '查看方向' : '开始探索',
      path: '/app/student/career-analysis',
    },
    {
      key: 'navigation',
      title: '职途导航',
      desc: '适合准备求职且已有简历的同学',
      detail: '通过简历解析评估技能匹配',
      completed: resumeStore.isParsed,
      action: resumeStore.isParsed ? '查看结果' : '上传简历',
      path: '/app/student/career-navigation',
    },
    {
      key: 'exam',
      title: '技能自评',
      desc: '适合准备求职且暂时没有简历的同学',
      detail: '通过问卷自评技能水平',
      completed: hasQuizRecords.value,
      action: hasQuizRecords.value ? '查看结果' : '开始自评',
      path: '/app/exams',
    },
  ]
})

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}
</script>

<template>
  <div class="home-page">
    <template v-if="isStudent">
      <section class="home-status-strip card-surface">
        <div class="home-status-strip__left">
          <span class="home-status-strip__title">首页</span>
          <span class="home-status-strip__user">{{ currentUser?.name || currentUser?.username || '同学' }} · 学生</span>
        </div>
        <div class="home-status-strip__right">
          <span class="home-status-chip">
            <Icon icon="lucide:flame" :width="14" />
            连续 {{ streakDays }} 天
          </span>
          <span class="home-status-chip">今日 {{ formatMinutes(todayMinutes) }}</span>
          <span class="home-status-chip">方向：{{ targetRole || '未设置' }}</span>
        </div>
      </section>

      <section class="home-onboarding card-emphasis" :class="{ 'is-done': onboardingDone }">
        <div v-if="onboardingDone" class="home-onboarding__done">
          <div class="home-onboarding__done-text">
            <Icon icon="lucide:badge-check" :width="16" />
            职业规划已启动 · 已关注 {{ learningStore.targetRoles.length }} 个方向 ·
            {{ hasAssessed ? '已完成能力评估' : '待完成能力评估' }}
          </div>
          <button class="home-link-btn" @click="navigateTo('/app/student/career-analysis')">重新配置</button>
        </div>

        <template v-else>
          <div class="home-onboarding__head">
            <h2>开始你的职业规划</h2>
            <p>职业分析适合探索岗位；职途导航与技能自评是同一目标的两种评估方式，选一个即可。</p>
          </div>
          <div class="home-onboarding__cards">
            <article v-for="item in onboardingCards" :key="item.key" class="onboarding-card" :class="{ 'is-completed': item.completed }">
              <span v-if="item.completed" class="onboarding-card__badge">✓ 已完成</span>
              <h3>{{ item.title }}</h3>
              <p class="onboarding-card__desc">{{ item.desc }}</p>
              <p class="onboarding-card__detail">{{ item.detail }}</p>
              <button class="home-link-btn" @click="navigateTo(item.path)">{{ item.action }}</button>
            </article>
          </div>
        </template>
      </section>

      <section class="home-calendar card-emphasis">
        <header class="home-section-head">
          <div>
            <h2>学习活跃日历</h2>
            <p>活跃 {{ activeDays }} 天 · 连续 {{ streakDays }} 天 · 最长 {{ maxStreak }} 天</p>
          </div>
        </header>

        <div v-if="heatCalendarData.length" class="home-calendar__chart-wrap">
          <D3HeatCalendar :data="heatCalendarData" @day-click="handleDayClick" />
        </div>
        <div v-else class="home-empty">还没有学习记录，完成一次课程学习后这里会自动展示成长轨迹。</div>

        <div v-if="selectedDay && selectedDayRecords.length" class="home-day-records card-data">
          <div class="home-day-records__head">
            <span>{{ selectedDay.date }} · {{ formatMinutes(selectedDay.minutes) }}</span>
            <button class="home-text-btn" @click="selectedDay = null">收起</button>
          </div>
          <div class="home-day-records__list">
            <div v-for="record in selectedDayRecords" :key="record.id" class="home-day-record">
              <div>
                <div class="home-day-record__title">{{ record.courseName }}</div>
                <div class="home-day-record__meta">{{ new Date(record.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</div>
              </div>
              <div class="home-day-record__right">
                <span>{{ formatMinutes(record.studyTime) }}</span>
                <span>进度 {{ record.progress }}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="home-summary-grid">
        <article class="home-summary card-surface">
          <h3>成长摘要</h3>
          <div class="home-summary__stats">
            <div class="summary-stat">
              <strong>{{ activeDays }}</strong>
              <span>活跃天数</span>
            </div>
            <div class="summary-stat">
              <strong>{{ formatMinutes(thisWeekMinutes) }}</strong>
              <span>近 7 天学习</span>
            </div>
            <div class="summary-stat">
              <strong>{{ courseStats.completed }}/{{ courseStats.enrolled }}</strong>
              <span>课程完成</span>
            </div>
          </div>
          <button class="home-link-btn" @click="navigateTo('/app/student/my-reports')">查看我的报告</button>
        </article>

        <article class="home-summary card-surface">
          <h3>职业方向摘要</h3>
          <template v-if="hasExplored">
            <div class="home-summary__career-kv">
              <div class="kv-row"><span class="kv-row__k">目标方向</span><span class="kv-row__v">{{ targetRole }}</span></div>
              <div class="kv-row"><span class="kv-row__k">关注方向</span><span class="kv-row__v">{{ learningStore.targetRoles.length }} 个</span></div>
              <div class="kv-row"><span class="kv-row__k">评估状态</span><span class="kv-row__v">{{ hasAssessed ? '已完成' : '待完成' }}</span></div>
            </div>
            <button class="home-link-btn" @click="navigateTo('/app/student/career-navigation')">查看职途导航</button>
          </template>
          <template v-else>
            <p class="home-empty">设置目标方向后，这里会展示你的职业进展摘要。</p>
            <button class="home-link-btn" @click="navigateTo('/app/student/career-analysis')">去设置目标方向</button>
          </template>
        </article>
      </section>

      <section class="home-tools card-surface">
        <button class="home-tool-item" @click="navigateTo('/app/student/wrongquestions')">薄弱点记录</button>
        <button class="home-tool-item" @click="navigateTo('/app/notes')">学习笔记</button>
        <button class="home-tool-item" @click="navigateTo('/app/student/ai-assistant')">AI 助手</button>
        <button class="home-tool-item" @click="navigateTo('/app/student/favorites')">心仪岗位</button>
        <button class="home-tool-item" @click="navigateTo('/app/student/settings')">个人设置</button>
      </section>
    </template>

    <template v-else>
      <section class="home-admin card-emphasis">
        <h2>首页</h2>
        <p>当前角色为管理员，快捷入口如下：</p>
        <div class="home-admin__actions">
          <button class="home-link-btn" @click="navigateTo('/app/admin/job-dataset')">岗位数据集</button>
          <button class="home-link-btn" @click="navigateTo('/app/admin/knowledge-base')">知识库维护</button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home-status-strip {
  border-top: 2px solid var(--color-primary);
  border-bottom: 1px solid var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
}

.home-status-strip__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.home-status-strip__title {
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 700;
}

.home-status-strip__user {
  font-size: 12px;
  color: var(--color-text-muted);
}

.home-status-strip__right {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.home-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  padding: 4px 8px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.home-onboarding {
  padding: 12px;
}

.home-onboarding__head h2,
.home-section-head h2,
.home-summary h3,
.home-admin h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.home-onboarding__head p,
.home-section-head p,
.home-admin p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-muted);
}

.home-onboarding__cards {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.onboarding-card {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.onboarding-card.is-completed {
  background: color-mix(in srgb, var(--color-surface) 90%, var(--color-primary) 10%);
}

.onboarding-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  color: var(--color-primary);
}

.onboarding-card h3 {
  margin: 0;
  font-size: 14px;
}

.onboarding-card__desc,
.onboarding-card__detail {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.home-onboarding__done {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.home-onboarding__done-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.home-calendar {
  padding: 12px;
}

.home-calendar__chart-wrap {
  margin-top: 8px;
}

.home-empty {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.home-day-records {
  margin-top: 10px;
  padding: 10px;
}

.home-day-records__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text);
}

.home-text-btn {
  border: none;
  background: none;
  font-size: 12px;
  color: var(--color-primary);
  cursor: pointer;
}

.home-day-records__list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.home-day-record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 8px 10px;
}

.home-day-record__title {
  font-size: 12px;
  color: var(--color-text);
}

.home-day-record__meta,
.home-day-record__right {
  font-size: 11px;
  color: var(--color-text-subtle);
}

.home-day-record__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.home-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.home-summary {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home-summary__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.summary-stat {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.summary-stat strong {
  font-size: 14px;
  color: var(--color-text);
}

.summary-stat span {
  font-size: 11px;
  color: var(--color-text-subtle);
}

.home-summary__career-kv {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  padding: 0 10px;
}

.home-tools {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  overflow: hidden;
}

.home-tool-item {
  border: none;
  border-right: 1px solid var(--color-border);
  background: transparent;
  padding: 11px 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  cursor: pointer;
}

.home-tool-item:last-child {
  border-right: none;
}

.home-tool-item:hover {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface) 94%);
}

.home-link-btn {
  width: fit-content;
  border: 1px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-surface) 86%, var(--color-primary) 14%);
  color: var(--color-primary);
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
}

.home-link-btn:hover {
  background: color-mix(in srgb, var(--color-surface) 78%, var(--color-primary) 22%);
}

.home-admin {
  padding: 12px;
}

.home-admin__actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 1100px) {
  .home-onboarding__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .home-status-strip {
    flex-direction: column;
    align-items: flex-start;
  }

  .home-status-strip__right {
    justify-content: flex-start;
  }

  .home-onboarding__cards {
    grid-template-columns: 1fr;
  }

  .home-summary__stats {
    grid-template-columns: 1fr;
  }

  .home-tools {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
