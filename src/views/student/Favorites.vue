<!-- 页面：心仪岗位；路由：student/favorites（student-favorites）；角色：STUDENT -->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { Delete } from '@element-plus/icons-vue'
import { useLearningStore } from '@/stores'
import { useResumeStore } from '@/stores/resume'
import { mockTargetRoleMarkets } from '@/mock/data'
import type { TargetRoleMarket } from '@/types'

type SortKey = 'matchScore' | 'savedAt' | 'medianSalary'
type SortOrder = 'asc' | 'desc'

type FollowedRoleMarket = TargetRoleMarket & {
  sourceRole: string
  savedAt: string
  matchScore: number
}

const router = useRouter()
const learningStore = useLearningStore()
const resumeStore = useResumeStore()

/* 动态计算匹配度：parsedSkills 与 requiredSkills 的交集占比 */
function normalizeRole(role: string): TargetRoleMarket['role'] {
  const text = role.toLowerCase()
  if (role === '机器学习工程师' || /机器学习|深度学习|算法|pytorch|tensorflow|ml/.test(text)) return '机器学习工程师'
  if (role === '数据分析' || /数据|分析|sql|bi|etl|python|增长/.test(text)) return '数据分析'
  if (role === '测试开发' || /测试|qa|playwright|selenium|自动化/.test(text)) return '测试开发'
  if (role === '后端开发' || /java|go|golang|c\+\+|后端|服务端|微服务|redis|mysql/.test(text)) return '后端开发'
  return '前端开发'
}

function getRoleMarket(role: string): TargetRoleMarket {
  return mockTargetRoleMarkets.find(item => item.role === normalizeRole(role)) ?? mockTargetRoleMarkets[0]!
}

function computeMatchScore(job: TargetRoleMarket): number {
  if (!resumeStore.isParsed || !resumeStore.parsedSkills.length) return job.referenceMatch
  const userSkills = new Set(resumeStore.parsedSkills.map(s => s.name.toLowerCase()))
  const required = job.skillTags.map(s => s.toLowerCase())
  if (!required.length) return job.referenceMatch
  const matched = required.filter(s => userSkills.has(s)).length
  return Math.round((matched / required.length) * 100)
}

function goToAnalysis(role: string) {
  router.push({ path: '/app/student/career-analysis', query: { role: normalizeRole(role) } })
}

// TODO: API — GET /api/saved-jobs?userId=xxx
const savedJobs = computed(() => learningStore.savedJobs)

const sortKey = ref<SortKey>('matchScore')
const sortOrder = ref<SortOrder>('desc')

const filteredDirections = computed<FollowedRoleMarket[]>(() => {
  const merged = new Map<string, FollowedRoleMarket>()

  learningStore.targetRoles.forEach(item => {
    const market = getRoleMarket(item.role)
    const nextItem: FollowedRoleMarket = {
      ...market,
      sourceRole: item.role,
      savedAt: item.savedAt,
      matchScore: computeMatchScore(market),
    }
    const existing = merged.get(market.role)
    if (!existing || existing.savedAt < nextItem.savedAt) {
      merged.set(market.role, nextItem)
    }
  })

  return [...merged.values()]
    .sort((a, b) => {
      const direction = sortOrder.value === 'asc' ? 1 : -1
      if (sortKey.value === 'medianSalary') return (a.medianSalary - b.medianSalary) * direction
      if (sortKey.value === 'savedAt') return a.savedAt.localeCompare(b.savedAt) * direction
      return (a.matchScore - b.matchScore) * direction
    })
})

const followedCount = computed(() => {
  const uniqueRoles = new Set(learningStore.targetRoles.map(item => normalizeRole(item.role)))
  return uniqueRoles.size
})

function removeJob(role: string) {
  const matched = learningStore.targetRoles.find(item => normalizeRole(item.role) === role)
  if (!matched) return
  learningStore.toggleTargetRole(matched.role)
  ElMessage.success('已取消关注该方向')
}

function goToMatch() {
  router.push('/app/student/career-navigation')
}

function goToCareerAnalysis() {
  router.push('/app/student/career-analysis')
}

const isParsed = computed(() => resumeStore.isParsed)

/* ── Hero 统计数据 ── */
const heroStats = computed(() => {
  const dirs = filteredDirections.value
  if (!dirs.length) return null
  const avgMatch = Math.round(dirs.reduce((s, d) => s + d.matchScore, 0) / dirs.length)
  const bestSalary = Math.max(...dirs.map(d => d.medianSalary))
  return { count: dirs.length, avgMatch, bestSalary }
})

/* ── 数字滚动动画 ── */
const displayScores = ref<Record<string, number>>({})

/* ── 进度条宽度（改动 3） ── */
const progressWidths = ref<Record<string, number>>({})

function animateCountUp(role: string, target: number) {
  const start = performance.now()
  const duration = 900
  const update = (now: number) => {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    const val = Math.round(eased * target)
    displayScores.value[role] = val
    progressWidths.value[role] = val
    if (t < 1) requestAnimationFrame(update)
  }
  displayScores.value[role] = 0
  progressWidths.value[role] = 0
  requestAnimationFrame(update)
}

function triggerDataAnimations() {
  filteredDirections.value.forEach((job, i) => {
    setTimeout(() => animateCountUp(job.role, job.matchScore), i * 120)
  })
}

function topSkills(skills: string[]) { return skills.slice(0, 3) }
function extraCount(skills: string[]) { return Math.max(0, skills.length - 3) }

function demandClass(level: string) {
  if (/极高|旺盛/.test(level)) return 'demand--high'
  if (/较高|稳定/.test(level)) return 'demand--mid'
  return 'demand--low'
}

let cardObserver: IntersectionObserver | null = null

onMounted(async () => {
  /* 初始化显示值为 0 */
  filteredDirections.value.forEach(job => {
    displayScores.value[job.role] = 0
    progressWidths.value[job.role] = 0
  })

  await nextTick()

  /* 卡片进场 IntersectionObserver */
  cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        cardObserver?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.08 })

  const cards = document.querySelectorAll('.job-card')
  cards.forEach((el, i) => {
    ;(el as HTMLElement).style.transitionDelay = `${i * 80}ms`
    el.addEventListener('transitionend', () => {
      ;(el as HTMLElement).style.transitionDelay = ''
    }, { once: true })
    cardObserver?.observe(el)
  })

  /* 100ms 后启动数据动画，确保卡片已开始进场 */
  setTimeout(triggerDataAnimations, 100)
})

onUnmounted(() => {
  cardObserver?.disconnect()
})

const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: '按匹配度排序', value: 'matchScore' },
  { label: '按关注时间排序', value: 'savedAt' },
  { label: '按中位薪资排序', value: 'medianSalary' },
]

const sortOrderOptions: Array<{ label: string; value: SortOrder }> = [
  { label: '顺序', value: 'asc' },
  { label: '逆序', value: 'desc' },
]

function scoreColor(score: number) {
  if (score >= 80) return 'var(--color-primary)'
  if (score >= 60) return 'var(--color-gold)'
  return 'var(--color-text-muted)'
}
</script>



<template>
  <div class="favorites-page">
    <!-- ── Hero 页头区 ── -->
    <div class="page-hero">
      <div class="hero-inner">
        <div class="hero-left">
          <div class="hero-title">
            <span class="hero-icon">♥</span>
            <h1>心仪岗位</h1>
          </div>
          <div v-if="heroStats" class="hero-stats">
            <span class="stat-item">
              <strong>{{ heroStats.count }}</strong> 个方向
            </span>
            <span class="stat-sep">·</span>
            <span class="stat-item">
              均匹配 <strong>{{ heroStats.avgMatch }}%</strong>
            </span>
            <span class="stat-sep">·</span>
            <span class="stat-item">
              最高薪资 <strong>{{ heroStats.bestSalary }}K</strong>
            </span>
          </div>
          <div v-else class="hero-subtitle">在职业分析中关注方向，同步展示薪资与匹配度</div>
        </div>
        <div class="hero-actions">
          <el-button class="hero-btn-outline" @click="goToCareerAnalysis">去关注方向</el-button>
          <el-button class="hero-btn-solid" @click="goToMatch">进入职途导航</el-button>
        </div>
      </div>
    </div>

    <!-- ── 内容区 ── -->
    <div class="favorites-content">

    <!-- ── Slim 工具栏 ── -->
    <div v-if="followedCount > 0" class="toolbar">
      <span class="toolbar__count">共 {{ filteredDirections.length }} 个方向</span>
      <div class="toolbar__controls">
        <el-select v-model="sortKey" size="small" style="width: 148px">
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="sortOrder" size="small" style="width: 96px">
          <el-option v-for="item in sortOrderOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </div>

    <div v-if="filteredDirections.length > 0" class="jobs-list">
      <div v-for="job in filteredDirections" :key="job.role" class="job-card">
        <!-- 左侧彩色 accent bar -->
        <div class="job-accent-bar" :style="{ background: scoreColor(job.matchScore) }"></div>

        <!-- 主体内容 -->
        <div class="job-body">
          <!-- 第一区：岗位名 + 薪资 + 匹配度 ring -->
          <div class="card-header">
            <div class="card-title-area">
              <h3 class="job-title">{{ job.role }}</h3>
              <div class="job-meta">
                <span>{{ job.industries.join(' / ') }}</span>
                <span class="job-sep">·</span>
                <span>{{ job.hotCities.slice(0, 2).join(' / ') }}</span>
              </div>
            </div>
            <div class="card-salary">
              <span class="salary-range">{{ job.salaryRange }}</span>
              <small class="salary-median">中位 {{ job.medianSalary }}K</small>
            </div>
            <div
              class="score-ring"
              :title="isParsed ? '结合简历估算' : '参考匹配度'"
              :style="{ '--score-pct': progressWidths[job.role] ?? 0, '--ring-fill': scoreColor(job.matchScore) }"
            >
              <div class="score-ring-inner">
                <span class="score-num" :style="{ color: scoreColor(job.matchScore) }">{{ displayScores[job.role] ?? 0 }}</span>
                <span class="score-pct-sign">%</span>
              </div>
            </div>
          </div>

          <!-- 第二区：需求标签 + 技能（top-3 + N） -->
          <div class="card-middle">
            <span class="demand-badge" :class="demandClass(job.demandLevel)">
              <span class="demand-dot"></span>{{ job.demandLevel }}
            </span>
            <div class="job-skills">
              <el-tag
                v-for="skill in topSkills(job.skillTags)"
                :key="skill"
                size="small"
                effect="plain"
                class="skill-tag"
              >{{ skill }}</el-tag>
              <span v-if="extraCount(job.skillTags) > 0" class="skill-extra">+{{ extraCount(job.skillTags) }}</span>
            </div>
          </div>

          <!-- 第三区：岗位实情（单行截断）+ 操作按钮 -->
          <div class="card-footer">
            <div class="job-notes">
              <span class="notes-label">实情：</span>{{ job.trendNote }}
            </div>
            <div class="card-actions">
              <span class="job-saved-at">关注于 {{ job.savedAt }}</span>
              <div class="action-btns">
                <el-button text size="small" @click="goToAnalysis(job.role)">查看实情</el-button>
                <el-button text size="small" @click="goToMatch">去匹配</el-button>
                <el-button text type="danger" :icon="Delete" size="small" @click="removeJob(job.role)">取消关注</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="followedCount > 0" class="empty-box">
      <Icon icon="mdi:filter-off-outline" class="empty-icon" />
      <div class="empty-title">当前排序条件下暂无结果</div>
      <div class="empty-desc">尝试切换排序方式或顺序</div>
      <el-button size="default" @click="sortOrder = 'desc'">切换为逆序</el-button>
    </div>

    <div v-else class="empty-box">
      <Icon icon="mdi:bookmark-outline" class="empty-icon" />
      <div class="empty-title">还没有关注任何方向</div>
      <div class="empty-desc">
        在职业分析页面关注感兴趣的方向，这里会自动同步展示岗位实情、薪资和匹配度
        <span v-if="savedJobs.length">（已保留 {{ savedJobs.length }} 条历史收藏）</span>
      </div>
      <el-button type="primary" size="default" @click="goToCareerAnalysis">去职业分析关注方向</el-button>
    </div>

    </div><!-- /.favorites-content -->
  </div>
</template>

<style scoped>
/* ══════════════════════════════════
   页面容器（immersive，自管理滚动）
   ══════════════════════════════════ */
.favorites-page {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: #f5f4f2;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}

/* ══════════════════════════════════
   Hero 页头区
   ══════════════════════════════════ */
.page-hero {
  background: linear-gradient(135deg, #1c1410 0%, #2d1f14 60%, #3a2318 100%);
  padding: 0 28px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

/* 噪点纹理叠加 */
.page-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* 底部渐变分割线 */
.page-hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent);
}

.hero-inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 28px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.hero-left { display: flex; flex-direction: column; gap: 10px; }

.hero-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-icon {
  font-size: 22px;
  color: var(--color-primary);
  line-height: 1;
  filter: drop-shadow(0 0 8px rgba(180, 60, 40, 0.5));
}

.hero-title h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  font-family: var(--font-title);
  letter-spacing: 0.06em;
  line-height: 1;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.hero-stats strong {
  color: var(--color-gold);
  font-size: 15px;
  font-family: var(--font-latin);
}

.stat-sep { opacity: 0.4; }

.hero-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.hero-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

.hero-btn-outline {
  background: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
  color: rgba(255, 255, 255, 0.85) !important;
}

.hero-btn-outline:hover {
  border-color: rgba(255, 255, 255, 0.7) !important;
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

.hero-btn-solid {
  background: #ffffff !important;
  border-color: #ffffff !important;
  color: #1c1410 !important;
  font-weight: 600 !important;
}

.hero-btn-solid:hover {
  background: rgba(255, 255, 255, 0.9) !important;
}

/* ══════════════════════════════════
   内容区（max-width 版心）
   ══════════════════════════════════ */
.favorites-content {
  flex: 1;
  max-width: 1160px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 28px 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ══════════════════════════════════
   Slim 工具栏
   ══════════════════════════════════ */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.toolbar__count {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.toolbar__controls { display: flex; gap: 8px; align-items: center; }

/* ══════════════════════════════════
   卡片列表
   ══════════════════════════════════ */
.jobs-list { display: flex; flex-direction: column; gap: 12px; }

/* ── 卡片：白底 + 阴影 + 进场动画 ── */
.job-card {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.42s ease,
    transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 200ms ease;
}

.job-card.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  transition:
    box-shadow 200ms ease,
    transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.job-card.is-visible:hover {
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.11), 0 3px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

/* ── accent bar + hover 展宽 ── */
.job-accent-bar {
  width: 5px;
  flex-shrink: 0;
  background: var(--color-primary);
  transition: width 200ms ease;
}

.job-card.is-visible:hover .job-accent-bar {
  width: 8px;
}

/* ── 卡片主体 ── */
.job-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  gap: 12px;
}

/* ── 第一区：三列 header ── */
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-title-area { flex: 1; min-width: 0; }

.job-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #1a1a1a;
  font-family: var(--font-title);
  letter-spacing: 0.03em;
  line-height: 1.3;
}

.job-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #888;
}

.job-sep { opacity: 0.35; }

.card-salary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.salary-range {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: var(--font-ui);
  line-height: 1.2;
}

.salary-median {
  font-size: 11px;
  color: #aaa;
  font-weight: 400;
}

/* ── 匹配度圆弧 Ring ── */
.score-ring {
  --score-pct: 0;
  --ring-fill: #aaa;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: conic-gradient(
    var(--ring-fill) 0% calc(var(--score-pct) * 1%),
    #e8e8e8 calc(var(--score-pct) * 1%) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-ring-inner {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.score-num {
  font-size: 19px;
  font-weight: 700;
  font-family: var(--font-latin);
  line-height: 1;
}

.score-pct-sign {
  font-size: 9px;
  color: #bbb;
  margin-top: 1px;
}

/* ── 第二区：需求标签 + 技能 ── */
.card-middle {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 4px;
  border-top: 1px dashed rgba(0,0,0,0.08);
}

.demand-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.demand-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.demand--high {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.demand--mid {
  color: var(--color-gold);
  background: color-mix(in srgb, var(--color-gold) 12%, transparent);
}

.demand--low {
  color: #aaa;
  background: #f0f0f0;
}

.job-skills { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
.skill-tag { font-size: 11px; }

.skill-extra {
  font-size: 11px;
  color: #999;
  font-weight: 600;
  padding: 2px 7px;
  background: #f0f0f0;
  border-radius: 10px;
}

/* ── 第三区：岗位实情 + 操作 ── */
.card-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px dashed rgba(0,0,0,0.08);
}

.job-notes {
  font-size: 12px;
  color: #888;
  padding: 6px 10px;
  background: #fffbf0;
  border-left: 2px solid var(--color-gold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 0 4px 4px 0;
}

.notes-label { font-weight: 600; color: #555; }

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.job-saved-at {
  font-size: 10px;
  color: #bbb;
}

.action-btns { display: flex; align-items: center; gap: 0; }

/* ══════════════════════════════════
   自定义空状态
   ══════════════════════════════════ */
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  color: var(--color-primary);
  opacity: 0.38;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #444;
  font-family: var(--font-title);
}

.empty-desc {
  font-size: 13px;
  color: #999;
  line-height: 1.7;
  max-width: 380px;
}

/* ══════════════════════════════════
   响应式
   ══════════════════════════════════ */
@media (max-width: 900px) {
  .hero-inner { padding: 22px 0; }
  .hero-title h1 { font-size: 22px; }
  .favorites-content { padding: 16px 16px 32px; }
}

@media (max-width: 768px) {
  .page-hero { padding: 0 16px; }
  .hero-actions { width: 100%; }
  .card-header { flex-wrap: wrap; }
  .card-salary { align-items: flex-start; }
  .score-ring { width: 56px; height: 56px; }
  .score-ring-inner { width: 44px; height: 44px; }
  .score-num { font-size: 16px; }
  .card-actions { flex-direction: column; align-items: flex-start; gap: 4px; }
}
</style>


