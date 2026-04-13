<!-- 页面：首页；路由：/app/dashboard（dashboard）；角色：STUDENT/ADMIN -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useCourseStore } from '@/stores'
import { useLearningStore } from '@/stores/learning'
import { useResumeStore } from '@/stores/resume'
import { useReportStore } from '@/stores/report'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { Icon } from '@iconify/vue'

const router = useRouter()
const userStore = useUserStore()
const learningStore = useLearningStore()
const courseStore = useCourseStore()
const resumeStore = useResumeStore()
const reportStore = useReportStore()

const { hasExplored, hasAssessed } = useOnboardingState()

// ── 基础状态 ──
const currentUserId = computed(() => userStore.currentUser?.id ?? '')
const isStudent = computed(() => userStore.isStudent)

const isParsedOrReported = computed(() =>
  resumeStore.isParsed || reportStore.portraitRecords.length > 0
)

// ── IntersectionObserver（滚动揭示） ──
let _observer: IntersectionObserver | null = null

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

// ── 学习历史 ──
const userLearningHistory = computed(() => {
  if (!currentUserId.value) return []
  return learningStore.learningHistory.filter(r => r.userId === currentUserId.value)
})

// ── Hero 精简 KPI ──
const inProgressCourseCount = computed(() => {
  if (!currentUserId.value) return 0
  const list = courseStore.getUserProgress(currentUserId.value)
  const map = new Map<string, number>()
  for (const row of list) {
    map.set(row.courseId, Math.max(map.get(row.courseId) ?? 0, row.progress ?? 0))
  }
  return [...map.values()].filter(v => v > 0 && v < 100).length
})

// ── 目标岗位 ──
const effectiveRole = computed(() => {
  const roles = learningStore.targetRoles
  return roles.length > 0 ? roles[roles.length - 1]!.role : null
})

// ── 当前阶段判断 ──
const currentPhaseIndex = computed(() => {
  if (!hasExplored.value) return 0
  if (!hasAssessed.value) return 1
  if (userLearningHistory.value.length === 0) return 2
  if (!reportStore.records.length) return 3
  return 4
})

// ── 学习概览统计 ──
const overviewStats = computed(() => {
  const raw = learningStore.statistics.averageScore
  return {
    completedCourses: learningStore.statistics.totalCourses,
    streakDays: learningStore.statistics.streakDays,
    averageScore: isNaN(raw) || raw === 0 ? '—' : String(Math.round(raw)),
  }
})
const hasAnyLearningData = computed(() => userLearningHistory.value.length > 0)

// ── 阶段成果摘要 ──
const phaseStats = computed<(string | null)[]>(() => [
  learningStore.targetRoles.length > 0
    ? `已关注 ${learningStore.targetRoles.length} 个职业方向`
    : null,
  isParsedOrReported.value
    ? resumeStore.isParsed ? '简历已解析，能力已评估' : '完成技能自评'
    : null,
  userLearningHistory.value.length > 0
    ? `已涉及 ${new Set(userLearningHistory.value.map(r => r.courseId)).size} 门课程`
    : null,
  reportStore.records.length > 0
    ? `已生成 ${reportStore.records.length} 份报告`
    : null,
])

// ── 智能引导卡 ──
const guideCard = computed(() => {
  if (!hasExplored.value) return {
    step: 1, title: '探索你的职业方向',
    desc: '了解行业趋势和岗位需求，选择一个目标职业方向。这是职涯规划的第一步。',
    cta: '开始探索', route: '/app/student/career-analysis', icon: 'lucide:compass',
  }
  if (!hasAssessed.value) return {
    step: 2, title: '评估你的能力现状',
    desc: '上传简历或完成技能自评，AI 将分析你的能力与目标岗位的差距。',
    cta: '开始评估', route: '/app/student/career-navigation', icon: 'lucide:crosshair',
  }
  if (userLearningHistory.value.length === 0) return {
    step: 3, title: '开始你的技能提升',
    desc: '根据能力差距分析，制定学习计划，针对性地提升核心技能。',
    cta: '前往学习', route: '/app/student/learning', icon: 'lucide:trending-up',
  }
  if (!reportStore.records.length) return {
    step: 4, title: '沉淀你的成长成果',
    desc: '生成职业生涯发展报告，梳理学习成果和能力变化。',
    cta: '生成报告', route: '/app/student/career-report', icon: 'lucide:file-text',
  }
  return {
    step: 0, title: '继续你的学习之旅',
    desc: `你有 ${inProgressCourseCount.value} 门课程正在进行中，持续提升竞争力。`,
    cta: '继续学习', route: '/app/student/learning', icon: 'lucide:rocket',
  }
})

// ── 职业规划链路（纯进度，无子链接） ──
const phasesList = [
  { num: 1, title: '探索市场', subtitle: '了解行业趋势与岗位需求', icon: 'lucide:compass', route: '/app/student/career-analysis' },
  { num: 2, title: '了解自己', subtitle: 'AI 分析你的能力现状', icon: 'lucide:crosshair', route: '/app/student/career-navigation' },
  { num: 3, title: '提升技能', subtitle: '针对差距制定学习计划', icon: 'lucide:trending-up', route: '/app/student/learning' },
  { num: 4, title: '沉淀成果', subtitle: '生成报告，完善职业规划', icon: 'lucide:award', route: '/app/student/career-report' },
] as const

const phasesDone = computed(() => [
  learningStore.targetRoles.length > 0,
  isParsedOrReported.value,
  userLearningHistory.value.length > 0,
  reportStore.records.length > 0,
])

// ── 功能介绍卡片 ──
const featureCards = [
  {
    title: '职业分析', icon: 'lucide:target', route: '/app/student/career-analysis',
    desc: '不确定未来方向？这里汇集行业趋势与真实岗位数据，AI 帮你找到最匹配的发展路径。',
  },
  {
    title: '技能自评', icon: 'lucide:check-square', route: '/app/exams',
    desc: '量化你的技能水平。通过结构化评测了解自己与目标岗位的差距，定位优先提升方向。',
  },
  {
    title: '职途导航', icon: 'lucide:route', route: '/app/student/career-navigation',
    desc: '有目标却不知如何规划？职途导航为你制定个性化成长路径，从当前位置走向目标岗位。',
  },
  {
    title: '技能提升', icon: 'lucide:trending-up', route: '/app/student/learning',
    desc: '系统补齐能力短板。根据评估结果精准推荐课程，针对性地提升核心竞争技能。',
  },
  {
    title: '我的报告', icon: 'lucide:file-text', route: '/app/student/my-reports',
    desc: '把成长过程留存下来。生成职业分析报告和能力画像，记录进步轨迹和阶段成果。',
  },
  {
    title: 'AI 助手', icon: 'lucide:bot', route: '/app/student/ai-assistant',
    desc: '遇到困惑随时问。无论职业方向还是技能学习，AI 助手都能给出专业、个性化的建议。',
  },
] as const

// ── 工具函数 ──
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

      <!-- A · Hero -->
      <section class="hc-hero reveal">
        <div class="hc-hero__left">
          <h1 class="hc-hero__greeting">{{ greeting }}，{{ userStore.currentUser?.name ?? '同学' }}</h1>
          <p class="hc-hero__date">{{ todayDisplay }}</p>
          <div class="hc-hero__tags">
            <span v-if="effectiveRole" class="hc-tag hc-tag--role">
              目标岗位：{{ effectiveRole }}<span v-if="learningStore.targetRoles.length > 1"> +{{ learningStore.targetRoles.length - 1 }}</span>
            </span>
            <button v-else class="hc-tag hc-tag--empty" type="button" @click="nav('/app/student/career-analysis')">
              <Icon icon="lucide:plus" :width="12" /> 设置目标岗位
            </button>
            <span class="hc-tag hc-tag--step">
              当前进度：第 {{ Math.min(currentPhaseIndex + 1, 4) }} 步 / 共 4 步
            </span>
          </div>
        </div>
        <div class="hc-hero__stats">
          <div class="hc-stat">
            <span class="hc-stat__num">{{ inProgressCourseCount }}</span>
            <span class="hc-stat__lbl">进行中</span>
          </div>
        </div>
      </section>

      <!-- B · 智能引导卡（首屏主角） -->
      <section class="hc-guide reveal" @click="nav(guideCard.route)">
        <div class="hc-guide__icon-wrap">
          <Icon :icon="guideCard.icon" :width="28" />
        </div>
        <div class="hc-guide__content">
          <div class="hc-guide__head">
            <span v-if="guideCard.step > 0" class="hc-guide__step">第 {{ guideCard.step }} 步</span>
            <span v-else class="hc-guide__step hc-guide__step--done">持续提升</span>
          </div>
          <h2 class="hc-guide__title">{{ guideCard.title }}</h2>
          <p class="hc-guide__desc">{{ guideCard.desc }}</p>
        </div>
        <button class="hc-guide__cta" type="button">
          {{ guideCard.cta }} <Icon icon="lucide:arrow-right" :width="16" />
        </button>
      </section>

      <!-- C · 学习概览 -->
      <section class="hc-overview reveal">
        <div class="hc-overview__header">
          <span class="hc-overview__label">学习概览</span>
        </div>
        <template v-if="hasAnyLearningData">
          <div class="hc-overview__grid">
            <div class="hc-overview__stat">
              <span class="hc-overview__num">{{ overviewStats.completedCourses }}</span>
              <span class="hc-overview__key">已完成课程</span>
            </div>
            <div class="hc-overview__stat">
              <span class="hc-overview__num">{{ overviewStats.streakDays }}</span>
              <span class="hc-overview__key">连续学习天数</span>
            </div>
            <div class="hc-overview__stat">
              <span class="hc-overview__num">{{ overviewStats.averageScore }}</span>
              <span class="hc-overview__key">平均测评分</span>
            </div>
          </div>
        </template>
        <div v-else class="hc-overview__empty">
          <Icon icon="lucide:bar-chart-2" :width="24" class="hc-overview__empty-icon" />
          <span>开始学习后，这里会显示你的成长数据</span>
          <button class="hc-overview__start-btn" type="button" @click.stop="nav('/app/student/learning')">去学习</button>
        </div>
      </section>

      <!-- D · 职业规划路径（纯进度可视化） -->
      <div class="hc-section-label reveal"><span>职业规划路径</span><span class="hc-section-label__line" /></div>
      <section class="hc-pipeline reveal">
        <div class="hc-pipeline__track">
          <div
            v-for="(phase, i) in phasesList"
            :key="phase.num"
            class="hc-step"
            :class="{
              'is-done': phasesDone[i],
              'is-current': i === currentPhaseIndex && currentPhaseIndex < 4,
              'is-future': i > currentPhaseIndex,
            }"
          >
            <div class="hc-step__circle">
              <Icon v-if="phasesDone[i]" icon="lucide:check" :width="18" />
              <Icon v-else :icon="phase.icon" :width="18" />
            </div>
            <div class="hc-step__info">
              <div class="hc-step__title">{{ phase.title }}</div>
              <div class="hc-step__sub">{{ phase.subtitle }}</div>
              <div v-if="phaseStats[i]" class="hc-step__badge hc-step__badge--done">{{ phaseStats[i] }}</div>
              <button
                v-else-if="i === currentPhaseIndex && currentPhaseIndex < 4"
                class="hc-step__badge hc-step__badge--cta"
                type="button"
                @click="nav(phase.route)"
              >开始这一步 →</button>
            </div>
          </div>
        </div>
      </section>

      <!-- E · 平台功能介绍 -->
      <div class="hc-section-label reveal"><span>平台功能</span><span class="hc-section-label__line" /></div>
      <div class="hc-features stagger">
        <div
          v-for="card in featureCards" :key="card.route"
          class="hc-feat reveal"
          role="button"
          tabindex="0"
          @click="nav(card.route)"
          @keydown.enter="nav(card.route)"
        >
          <div class="hc-feat__icon-wrap">
            <Icon :icon="card.icon" :width="20" />
          </div>
          <div class="hc-feat__body">
            <div class="hc-feat__title">{{ card.title }}</div>
            <p class="hc-feat__desc">{{ card.desc }}</p>
          </div>
          <Icon class="hc-feat__arrow" icon="lucide:chevron-right" :width="16" />
        </div>
      </div>

    </template>

    <!-- ═══ 管理员视图 ═══ -->
    <template v-else>
      <section class="hc-admin reveal">
        <h2 class="hc-admin__title">管理端首页</h2>
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
  display: flex; flex-direction: column; gap: 20px;
  padding: 28px 28px 48px; max-width: 960px; margin: 0 auto;
  background: linear-gradient(168deg,
    color-mix(in srgb, var(--vermilion-100) 12%, var(--parchment-100) 88%) 0%,
    var(--parchment-100) 40%,
    color-mix(in srgb, var(--indigo-100) 8%, var(--parchment-100) 92%) 100%);
  color: var(--text-100); font-family: var(--font-ui); font-size: 14px;
  height: 100%; overflow-y: auto; overflow-x: hidden;
  scrollbar-width: thin; scrollbar-color: var(--parchment-400) transparent;
}

/* ══ 分区标签 ══ */
.hc-section-label {
  display: flex; align-items: center; gap: 14px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.12em;
  color: var(--ink-500); text-transform: uppercase; margin-top: 8px;
}
.hc-section-label__line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--parchment-400), transparent 80%); }

/* ══ A · Hero（overflow 改为 clip-path，修复 tags 裁切） ══ */
.hc-hero {
  position: relative; display: flex; align-items: center;
  justify-content: space-between; gap: 24px; padding: 26px 28px 24px;
  flex-wrap: wrap; border-radius: var(--radius-lg);
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--vermilion-500) 5%, var(--color-surface) 95%) 0%,
    var(--color-surface) 50%,
    color-mix(in srgb, var(--gold-100) 25%, var(--color-surface) 75%) 100%);
  border: 1px solid color-mix(in srgb, var(--vermilion-300) 10%, var(--parchment-300) 90%);
  border-top: 3px solid transparent;
  background-clip: padding-box;
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.7);
}
.hc-hero::before {
  content: ''; position: absolute; top: -3px; left: -1px; right: -1px; height: 3px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: linear-gradient(90deg, var(--vermilion-500), var(--gold-500) 50%, var(--indigo-500));
  opacity: 0.85;
}
.hc-hero__left { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 6px; }
.hc-hero__greeting { font-size: 20px; font-weight: 500; color: var(--ink-900); line-height: 1.3; margin: 0; }
.hc-hero__date { font-size: 11px; font-weight: 500; letter-spacing: 0.10em; color: var(--ink-300); text-transform: uppercase; margin: 0; }
.hc-hero__tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
.hc-hero__stats { position: relative; z-index: 1; display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.hc-stat { display: flex; flex-direction: column; align-items: center; padding: 0 22px; gap: 5px; }
.hc-stat__num {
  font-size: 2.2rem; font-weight: 300; line-height: 1;
  color: var(--vermilion-700); font-variant-numeric: tabular-nums; letter-spacing: -0.03em;
}
.hc-stat__lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-300); }
.hc-stat-sep { width: 1px; height: 36px; background: linear-gradient(180deg, transparent, var(--parchment-400), transparent); flex-shrink: 0; }

/* ══ 标签 ══ */
.hc-tag {
  display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 10px;
  border-radius: var(--radius-sm); font-size: 11px; font-weight: 500;
  background: var(--parchment-200); color: var(--ink-500);
  border: 1px solid var(--parchment-300); cursor: default;
}
.hc-tag--role {
  background: color-mix(in srgb, var(--vermilion-500) 8%, var(--color-surface) 92%);
  color: var(--vermilion-700);
  border-color: color-mix(in srgb, var(--vermilion-300) 25%, var(--parchment-300) 75%);
  font-weight: 600;
}
.hc-tag--step {
  background: color-mix(in srgb, var(--indigo-500) 6%, var(--color-surface) 94%);
  color: var(--indigo-500);
  border-color: color-mix(in srgb, var(--indigo-300) 20%, var(--parchment-300) 80%);
}
.hc-tag--empty {
  border-style: dashed; cursor: pointer; color: var(--ink-300); background: transparent;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.hc-tag--empty:hover {
  border-color: var(--vermilion-300); color: var(--vermilion-500);
  background: color-mix(in srgb, var(--vermilion-500) 4%, transparent 96%);
}

/* ══ B · 智能引导卡 ══ */
.hc-guide {
  display: flex; align-items: center; gap: 20px; padding: 24px 28px;
  border-radius: var(--radius-lg); cursor: pointer; position: relative;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--vermilion-500) 4%, var(--color-surface) 96%),
    color-mix(in srgb, var(--gold-100) 20%, var(--color-surface) 80%));
  border: 1px solid color-mix(in srgb, var(--vermilion-300) 15%, var(--parchment-300) 85%);
  border-left: 4px solid var(--vermilion-500);
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease;
}
.hc-guide:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md), 0 0 20px rgba(190,42,0,0.06);
}
.hc-guide__icon-wrap {
  flex-shrink: 0; width: 56px; height: 56px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--vermilion-500), var(--vermilion-700));
  color: #fff; box-shadow: 0 4px 14px rgba(190,42,0,0.25);
}
.hc-guide__content { flex: 1; min-width: 0; }
.hc-guide__head { margin-bottom: 4px; }
.hc-guide__step {
  display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
  color: var(--vermilion-500); text-transform: uppercase;
}
.hc-guide__step--done { color: var(--indigo-500); }
.hc-guide__title { font-size: 17px; font-weight: 600; color: var(--ink-900); margin: 0 0 6px; line-height: 1.3; }
.hc-guide__desc { font-size: 13px; color: var(--ink-500); margin: 0; line-height: 1.6; }
.hc-guide__cta {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;
  height: 40px; padding: 0 22px; border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--vermilion-500), var(--vermilion-700));
  border: none; color: #fff; font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.02em; white-space: nowrap;
  box-shadow: 0 4px 14px rgba(190,42,0,0.22);
  transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
}
.hc-guide__cta:hover {
  background: linear-gradient(135deg, var(--vermilion-700), var(--vermilion-900));
  box-shadow: 0 6px 20px rgba(190,42,0,0.30); transform: translateY(-1px);
}

/* ══ C · 学习概览 ══ */
.hc-overview {
  background: var(--color-surface); border: 1px solid var(--parchment-300);
  border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: 18px 24px;
}
.hc-overview__header { margin-bottom: 14px; }
.hc-overview__label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
  color: var(--ink-300); text-transform: uppercase;
}
.hc-overview__grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  border-radius: var(--radius-sm); overflow: hidden;
  border: 1px solid var(--parchment-200);
}
.hc-overview__stat {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 14px 10px; border-right: 1px solid var(--parchment-200);
}
.hc-overview__stat:last-child { border-right: none; }
.hc-overview__num {
  font-size: 1.7rem; font-weight: 300; line-height: 1;
  color: var(--vermilion-700); font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
}
.hc-overview__key { font-size: 11px; color: var(--ink-300); letter-spacing: 0.02em; text-align: center; }
.hc-overview__empty {
  display: flex; align-items: center; gap: 10px;
  color: var(--ink-300); font-size: 13px; padding: 4px 0;
}
.hc-overview__empty-icon { color: var(--parchment-400); flex-shrink: 0; }
.hc-overview__start-btn {
  margin-left: auto; height: 28px; padding: 0 14px;
  border-radius: var(--radius-sm); border: 1px solid var(--vermilion-300);
  background: transparent; color: var(--vermilion-500);
  font-family: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.hc-overview__start-btn:hover { background: var(--vermilion-500); color: #fff; }

/* ══ D · 职业规划链路（纯进度） ══ */
.hc-pipeline {
  background: var(--color-surface); border: 1px solid var(--parchment-300);
  border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: 24px 28px;
}
.hc-pipeline__track {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 0; position: relative;
}
.hc-pipeline__track::before {
  content: ''; position: absolute;
  top: 22px; left: 12.5%; right: 12.5%; height: 2px;
  background: linear-gradient(90deg, var(--vermilion-300), var(--gold-300) 50%, var(--parchment-300));
  opacity: 0.35; z-index: 0; border-radius: 1px;
}
.hc-step {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; position: relative; z-index: 1; padding: 0 10px;
}
.hc-step__circle {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid var(--parchment-400); background: var(--color-surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-300); margin-bottom: 12px;
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s, background 0.2s;
}
.hc-step.is-done .hc-step__circle {
  border-color: var(--vermilion-500);
  background: linear-gradient(135deg, var(--vermilion-500), var(--vermilion-700));
  color: #fff; box-shadow: 0 3px 10px rgba(190,42,0,0.18);
}
.hc-step.is-current .hc-step__circle {
  border-color: var(--vermilion-300); color: var(--vermilion-500);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--vermilion-100) 35%, transparent 65%);
  animation: pulse-ring 2.4s ease infinite;
}
.hc-step.is-future .hc-step__circle { opacity: 0.4; }
@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--vermilion-100) 35%, transparent 65%); }
  50% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--vermilion-100) 15%, transparent 85%); }
}
.hc-step__info { width: 100%; }
.hc-step__title { font-size: 13px; font-weight: 600; color: var(--ink-900); }
.hc-step.is-done .hc-step__title { color: var(--vermilion-500); }
.hc-step.is-future .hc-step__title { color: var(--ink-300); }
.hc-step__sub { font-size: 11px; color: var(--ink-300); margin-top: 3px; line-height: 1.4; }
.hc-step__badge {
  display: inline-block; margin-top: 8px; font-size: 11px; padding: 2px 8px;
  border-radius: 20px; line-height: 1.6;
}
.hc-step__badge--done {
  color: var(--indigo-500);
  background: color-mix(in srgb, var(--indigo-100) 35%, transparent 65%);
}
.hc-step__badge--cta {
  color: var(--vermilion-500); cursor: pointer; border: none; font-family: inherit;
  background: color-mix(in srgb, var(--vermilion-100) 35%, transparent 65%);
  transition: background 0.15s, color 0.15s;
}
.hc-step__badge--cta:hover {
  background: var(--vermilion-500); color: #fff;
}

/* ══ E · 功能介绍 ══ */
.hc-features {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
}
.hc-feat {
  display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px;
  background: var(--color-surface); border: 1px solid var(--parchment-300);
  border-radius: var(--radius-md); cursor: pointer; position: relative;
  box-shadow: var(--shadow-sm); outline: none;
  transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s, border-color 0.25s;
}
.hc-feat:hover, .hc-feat:focus-visible {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md), 0 0 0 1px rgba(190,42,0,0.04);
  border-color: color-mix(in srgb, var(--vermilion-300) 22%, var(--parchment-300) 78%);
}
.hc-feat:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.hc-feat__icon-wrap {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px; margin-top: 2px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--vermilion-100) 50%, var(--parchment-100) 50%);
  color: var(--vermilion-500);
  transition: background 0.2s, color 0.2s;
}
.hc-feat:hover .hc-feat__icon-wrap, .hc-feat:focus-visible .hc-feat__icon-wrap {
  background: linear-gradient(135deg, var(--vermilion-500), var(--vermilion-700));
  color: #fff;
}
.hc-feat__body { flex: 1; min-width: 0; }
.hc-feat__title { font-size: 14px; font-weight: 600; color: var(--ink-900); margin-bottom: 5px; }
.hc-feat__desc { font-size: 12px; color: var(--ink-500); line-height: 1.65; margin: 0; }
.hc-feat__arrow { flex-shrink: 0; color: var(--parchment-400); margin-top: 4px; transition: color 0.2s, transform 0.2s; }
.hc-feat:hover .hc-feat__arrow, .hc-feat:focus-visible .hc-feat__arrow {
  color: var(--vermilion-400); transform: translateX(3px);
}

/* ══ 按钮（管理员） ══ */
.hc-btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 38px; padding: 0 20px; border-radius: var(--radius-sm);
  border: 1px solid var(--parchment-400); background: var(--color-surface);
  color: var(--ink-700); font-family: inherit; font-size: 13px; font-weight: 500;
  cursor: pointer; white-space: nowrap;
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.hc-btn:hover { border-color: var(--vermilion-300); color: var(--vermilion-500); transform: translateY(-1px); box-shadow: 0 3px 10px rgba(190,42,0,0.08); }
.hc-btn:active { transform: translateY(0) scale(0.98); }
.hc-btn--primary {
  background: linear-gradient(135deg, var(--vermilion-500), var(--vermilion-700));
  border-color: var(--vermilion-700); color: #fff; font-weight: 600;
  box-shadow: 0 4px 14px rgba(190,42,0,0.22); letter-spacing: 0.02em;
}
.hc-btn--primary:hover {
  background: linear-gradient(135deg, var(--vermilion-700), var(--vermilion-900));
  border-color: var(--vermilion-900); color: #fff;
  box-shadow: 0 6px 20px rgba(190,42,0,0.30); transform: translateY(-2px);
}

/* ══ 管理员 ══ */
.hc-admin {
  background: var(--color-surface); border: 1px solid var(--parchment-300);
  border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: 24px 28px;
}
.hc-admin__title { font-size: 16px; font-weight: 600; color: var(--ink-900); margin: 0 0 16px; }
.hc-admin__actions { display: flex; gap: 12px; flex-wrap: wrap; }

/* ══ 滚动揭示动效 ══ */
@media (prefers-reduced-motion: no-preference) {
  .reveal {
    opacity: 0; transform: translate3d(0, 18px, 0) scale(0.995); filter: blur(4px);
    will-change: transform, opacity, filter;
    transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.6s cubic-bezier(0.16,1,0.3,1);
  }
  .hc-hero.reveal { transition-duration: 0.5s; }
  .hc-guide.reveal { transition-duration: 0.55s; transition-delay: 0.05s; }
  .hc-overview.reveal { transition-duration: 0.5s; transition-delay: 0.08s; }
  .hc-section-label.reveal { transition-duration: 0.4s; }
  .hc-pipeline.reveal { transition-duration: 0.55s; }
  .reveal.in-view { opacity: 1; transform: none; filter: none; }
  .stagger > .reveal:nth-child(1) { transition-delay: 0.00s; }
  .stagger > .reveal:nth-child(2) { transition-delay: 0.06s; }
  .stagger > .reveal:nth-child(3) { transition-delay: 0.12s; }
  .stagger > .reveal:nth-child(4) { transition-delay: 0.18s; }
  .stagger > .reveal:nth-child(5) { transition-delay: 0.24s; }
  .stagger > .reveal:nth-child(6) { transition-delay: 0.30s; }
}
@media (prefers-reduced-motion: reduce) {
  .reveal { transition: none; opacity: 1; transform: none; filter: none; }
}

/* ══ 响应式 ══ */
@media (max-width: 768px) {
  .hc { padding: 16px; gap: 14px; }
  .hc-hero { flex-direction: column; align-items: stretch; padding: 20px; }
  .hc-hero__stats { justify-content: center; }
  .hc-guide { flex-direction: column; align-items: stretch; gap: 16px; }
  .hc-guide__cta { width: 100%; justify-content: center; }
  .hc-overview__grid { grid-template-columns: 1fr; }
  .hc-overview__stat { border-right: none; border-top: 1px solid var(--parchment-200); }
  .hc-overview__stat:first-child { border-top: none; }
  .hc-pipeline__track { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .hc-pipeline__track::before { display: none; }
  .hc-features { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .hc-hero__stats { flex-direction: row; justify-content: space-around; }
  .hc-stat { padding: 8px 12px; }
  .hc-stat__num { font-size: 1.8rem; }
  .hc-stat-sep { display: none; }
  .hc-pipeline__track { grid-template-columns: 1fr; }
}
</style>
