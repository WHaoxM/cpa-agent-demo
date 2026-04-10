<!-- 页面：技能自评；路由：exams（exams）；角色：STUDENT -->
<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import gsap from 'gsap'
import { roleOptions, type CareerRole } from '@/composables/useCareerInsights'
import D3CareerTree from '@/components/charts/D3CareerTree.vue'

const router = useRouter()

type Phase = 'select' | 'quiz' | 'result'
type RoleTrack = {
  label: string
  focus: string
}
type TrackOption = RoleTrack & {
  role: CareerRole
  icon: string
}

const phase = ref<Phase>('select')
const selectedRole = ref<CareerRole>('前端开发')
const selectedTrack = ref('')
const currentQuestionIndex = ref(0)

/* 5 级能力选项（映射为 0-100 分） */
const levelOptions = [
  { label: '没听说过',            desc: '对此技术完全陌生',           score: 0 },
  { label: '了解概念',            desc: '知道是什么，没有动手实践过',  score: 25 },
  { label: '能做简单任务',        desc: '需要查文档，能完成基础功能',  score: 50 },
  { label: '独立完成项目',        desc: '可以独立使用并解决问题',      score: 75 },
  { label: '精通 / 能指导他人',   desc: '深入理解原理，能教授他人',   score: 100 },
]

const levelLabel = (score: number): string => {
  if (score <= 0) return '未掌握'
  if (score <= 25) return '初识'
  if (score <= 50) return '入门'
  if (score <= 75) return '进阶'
  return '精通'
}

const roleTrackMap: Record<CareerRole, RoleTrack[]> = {
  前端开发: [
    { label: 'Vue 方向', focus: '组件化、状态管理、权限与工程化' },
    { label: 'React 方向', focus: 'Hooks、状态组织、性能优化' },
    { label: '可视化方向', focus: '图表、数据表达、交互体验' },
  ],
  后端开发: [
    { label: 'Java 后端', focus: 'Spring Boot、MySQL、Redis、接口设计' },
    { label: 'Go 后端', focus: '并发、服务治理、gRPC、性能' },
    { label: 'C++ 开发', focus: '底层性能、网络、系统与工程规范' },
  ],
  测试开发: [
    { label: '自动化测试', focus: 'Playwright、接口测试、脚本编排' },
    { label: '质量平台', focus: 'CI/CD、质量门禁、缺陷分析' },
    { label: '性能测试', focus: '压测方案、指标定位、瓶颈分析' },
  ],
  数据分析: [
    { label: '商业分析', focus: '指标体系、报表表达、业务洞察' },
    { label: '数据开发', focus: 'ETL、数仓、SQL 与数据链路' },
    { label: '增长分析', focus: 'A/B 测试、转化分析、用户分层' },
  ],
  机器学习工程师: [
    { label: '算法方向', focus: '机器学习、特征工程、实验调优' },
    { label: '深度学习方向', focus: 'PyTorch、模型训练、CV/NLP' },
    { label: 'AI 应用工程', focus: '部署、评估、数据闭环与 MLOps' },
  ],
}

const roleMetaMap: Record<CareerRole, { icon: string; summary: string }> = {
  前端开发: { icon: 'lucide:monitor', summary: '面向 Web 界面、交互体验和工程交付。' },
  后端开发: { icon: 'lucide:server', summary: '面向接口设计、数据存储与服务稳定性。' },
  测试开发: { icon: 'lucide:bug', summary: '面向质量保障、自动化测试与测试平台。' },
  数据分析: { icon: 'lucide:bar-chart-2', summary: '面向数据洞察、指标分析与业务决策支持。' },
  机器学习工程师: { icon: 'lucide:cpu', summary: '面向算法建模、模型落地与 AI 工程化。' },
}

/* 各方向技能标准（来自 useCareerInsights skillGraph，热度即要求权重） */
const roleSkillDefs: Record<CareerRole, { id: string; name: string; required: number }[]> = {
  '前端开发': [
    { id: 'vue3', name: 'Vue 3', required: 92 },
    { id: 'react', name: 'React', required: 84 },
    { id: 'ts', name: 'TypeScript', required: 88 },
    { id: 'webpack', name: 'Vite / Webpack', required: 74 },
    { id: 'css', name: 'CSS / 动效 / 设计还原', required: 78 },
    { id: 'http', name: 'HTTP/浏览器原理', required: 70 },
    { id: 'git', name: 'Git / 协作开发', required: 72 },
    { id: 'node', name: 'Node.js / 前端工程脚本', required: 60 },
  ],
  '后端开发': [
    { id: 'java', name: 'Java / Go / C++ 基础', required: 90 },
    { id: 'mysql', name: 'MySQL / SQL', required: 85 },
    { id: 'redis', name: 'Redis / 缓存设计', required: 78 },
    { id: 'docker', name: 'Docker', required: 62 },
    { id: 'microservice', name: '服务治理 / 微服务', required: 72 },
    { id: 'mq', name: '消息队列 / 异步通信', required: 68 },
    { id: 'ts', name: '并发 / RPC / 网络基础', required: 64 },
    { id: 'git', name: 'Git / CI-CD', required: 72 },
  ],
  '测试开发': [
    { id: 'python', name: 'Python 自动化', required: 88 },
    { id: 'selenium', name: 'Selenium / Playwright', required: 82 },
    { id: 'testcase', name: '测试用例设计', required: 90 },
    { id: 'api-test', name: 'API 接口测试', required: 84 },
    { id: 'perf', name: '性能测试 / 压测分析', required: 70 },
    { id: 'cicd', name: 'CI/CD 流水线', required: 68 },
    { id: 'git', name: 'Git', required: 72 },
    { id: 'sql', name: 'SQL / 测试数据构造', required: 64 },
  ],
  '数据分析': [
    { id: 'python', name: 'Python / Pandas', required: 90 },
    { id: 'sql', name: 'SQL', required: 88 },
    { id: 'visual', name: '数据可视化 / 报表表达', required: 80 },
    { id: 'stats', name: '统计学基础', required: 78 },
    { id: 'tableau', name: 'Tableau / BI 工具', required: 70 },
    { id: 'etl', name: 'ETL / 数据清洗', required: 74 },
    { id: 'excel', name: 'Excel 高级应用', required: 62 },
    { id: 'spark', name: 'Spark / 数仓基础', required: 60 },
  ],
  '机器学习工程师': [
    { id: 'python', name: 'Python', required: 92 },
    { id: 'pytorch', name: 'PyTorch / TensorFlow', required: 88 },
    { id: 'ml-algo', name: '机器学习算法', required: 90 },
    { id: 'math', name: '数学基础（线代/概率）', required: 85 },
    { id: 'nlp', name: 'NLP / CV 基础', required: 72 },
    { id: 'spark', name: '数据处理 / 大数据基础', required: 68 },
    { id: 'docker', name: 'Docker / 部署', required: 62 },
    { id: 'git', name: 'Git', required: 70 },
  ],
}

const currentSkills = computed(() => roleSkillDefs[selectedRole.value] ?? [])
const totalQuestions = computed(() => currentSkills.value.length)
const currentSkill = computed(() => currentSkills.value[currentQuestionIndex.value])
const currentTracks = computed(() => roleTrackMap[selectedRole.value] ?? [])
const selectedDirectionLabel = computed(() => selectedTrack.value || selectedRole.value)
const allTrackOptions = computed<TrackOption[]>(() => {
  return roleOptions.flatMap((role) => {
    return (roleTrackMap[role] ?? []).map((track) => ({
      ...track,
      role,
      icon: roleMetaMap[role].icon,
    }))
  })
})

/* 用户作答（技能id → 得分 0/25/50/75/100） */
const userAnswers = ref<Record<string, number>>({})

const selectedScore = computed({
  get: () => userAnswers.value[currentSkill.value?.id ?? ''] ?? -1,
  set: (val: number) => {
    if (currentSkill.value) userAnswers.value[currentSkill.value.id] = val
  },
})

const progressPct = computed(() =>
  totalQuestions.value ? Math.round((currentQuestionIndex.value / totalQuestions.value) * 100) : 0
)

function selectRole(role: CareerRole, trackLabel = '') {
  selectedRole.value = role
  selectedTrack.value = trackLabel
  currentQuestionIndex.value = 0
  userAnswers.value = {}
  phase.value = 'quiz'
}

function goNext() {
  if (selectedScore.value < 0) return
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++
  } else {
    phase.value = 'result'
  }
}

function goPrev() {
  if (currentQuestionIndex.value > 0) currentQuestionIndex.value--
  else phase.value = 'select'
}

function resetAll() {
  phase.value = 'select'
  selectedTrack.value = ''
  userAnswers.value = {}
  currentQuestionIndex.value = 0
}

/* 差距计算 */
const gapResults = computed(() => {
  return currentSkills.value.map(skill => {
    const userScore = userAnswers.value[skill.id] ?? 0
    const gap = skill.required - userScore
    const mastery = Math.round((userScore / skill.required) * 100)
    return { ...skill, userScore, gap, mastery }
  }).sort((a, b) => b.gap - a.gap)
})

const overallMastery = computed(() => {
  if (!gapResults.value.length) return 0
  const total = gapResults.value.reduce((sum, s) => sum + s.mastery, 0)
  return Math.round(total / gapResults.value.length)
})

const overallLevel = computed(() => {
  const m = overallMastery.value
  if (m >= 80) return { label: '竞争力强', desc: '技能覆盖优于同方向多数应届生，可积极投递', color: 'var(--bamboo-green, #4A6741)' }
  if (m >= 60) return { label: '进阶阶段', desc: '技能栈基本完善，建议深耕重点领域', color: 'var(--color-secondary)' }
  if (m >= 40) return { label: '成长阶段', desc: '已具备入门能力，关键差距在实战项目经验', color: 'var(--color-gold)' }
  return { label: '起步阶段', desc: '核心技能尚在积累，建议先完成基础课程', color: 'var(--color-primary)' }
})

const weakSkills = computed(() => gapResults.value.filter(s => s.gap > 30))

function gapColor(gap: number): string {
  if (gap <= 10) return 'var(--bamboo-green, #4A6741)'
  if (gap <= 30) return 'var(--color-gold)'
  return 'var(--color-primary)'
}

function masteryBg(mastery: number): string {
  if (mastery >= 80) return 'rgba(74,103,65,0.08)'
  if (mastery >= 50) return 'rgba(201,162,39,0.08)'
  return 'rgba(190,42,0,0.06)'
}

function goToAnalysis() {
  router.push({ path: '/app/student/career-analysis', query: { role: selectedDirectionLabel.value } })
}

function goToNavigation() {
  router.push('/app/student/career-navigation')
}

/* ─── 视图切换 ─── */
const viewMode = ref<'card' | 'tree'>('card')
const cardViewRef = ref<HTMLElement | null>(null)
const treeViewRef = ref<HTMLElement | null>(null)

async function switchView(mode: 'card' | 'tree') {
  if (viewMode.value === mode) return
  const leaving = mode === 'tree' ? cardViewRef.value : treeViewRef.value
  if (leaving) {
    await gsap.to(leaving, {
      opacity: 0,
      y: mode === 'tree' ? -10 : 0,
      duration: 0.15,
      ease: 'power2.in',
    })
    gsap.set(leaving, { opacity: '', y: '' })
  }
  viewMode.value = mode
  await nextTick()
  const entering = mode === 'tree' ? treeViewRef.value : cardViewRef.value
  if (!entering) return
  if (mode === 'card') {
    const cards = entering.querySelectorAll<HTMLElement>('.role-card, .subrole-card')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out', clearProps: 'opacity,transform' },
    )
  } else {
    gsap.fromTo(
      entering,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'opacity,transform' },
    )
  }
}
</script>

<template>
  <div class="exams-page">

    <!-- ══ 阶段一：选择方向 ══ -->
    <div v-if="phase === 'select'" class="phase phase--select">
      <div class="page-hd">
        <div>
          <h1 class="page-hd__title">技能自评</h1>
          <p class="page-hd__sub">选择目标岗位方向，逐项回答能力问题，生成差距诊断报告</p>
        </div>
        <button
          class="view-toggle-btn"
          :title="viewMode === 'card' ? '切换到关系图' : '切换到卡片'"
          @click="switchView(viewMode === 'card' ? 'tree' : 'card')"
        >
          <Icon :icon="viewMode === 'card' ? 'lucide:git-fork' : 'lucide:layout-grid'" :width="18" />
        </button>
      </div>

      <!-- 卡片视图 -->
      <div v-show="viewMode === 'card'" ref="cardViewRef" class="card-view">
        <p class="select-hint">你目前最感兴趣或正在准备的方向：</p>

        <div class="role-grid">
          <button
            v-for="(role, i) in roleOptions"
            :key="role"
            class="role-card"
            @click="selectRole(role as CareerRole)"
          >
            <Icon
              :icon="roleMetaMap[role as CareerRole]?.icon || (['lucide:monitor','lucide:server','lucide:bug','lucide:bar-chart-2','lucide:cpu'])[i] || 'lucide:briefcase'"
              :width="28" class="role-card__icon"
            />
            <span class="role-card__name">{{ role }}</span>
            <span class="role-card__summary">{{ roleMetaMap[role as CareerRole]?.summary }}</span>
            <span class="role-card__count">{{ roleSkillDefs[role as CareerRole]?.length ?? 0 }} 项核心技能</span>
            <span class="role-card__tracks">{{ roleTrackMap[role as CareerRole]?.map(item => item.label).join(' / ') }}</span>
          </button>
        </div>

        <div class="subrole-panel">
          <div class="subrole-panel__head">
            <strong>细分准备方向</strong>
            <span>如果你已经更明确，可以直接从细分赛道开始自评。</span>
          </div>
          <div class="subrole-grid">
            <button
              v-for="track in allTrackOptions"
              :key="`${track.role}-${track.label}`"
              class="subrole-card"
              @click="selectRole(track.role, track.label)"
            >
              <div class="subrole-card__top">
                <span class="subrole-card__role">{{ track.role }}</span>
                <Icon :icon="track.icon" :width="14" class="subrole-card__icon" />
              </div>
              <strong class="subrole-card__title">{{ track.label }}</strong>
              <span class="subrole-card__desc">{{ track.focus }}</span>
            </button>
          </div>
        </div>

        <p class="tip-row">
          <Icon icon="lucide:info" :width="13" />
          没有简历？先自评了解差距，再
          <button class="link-btn" @click="goToNavigation">上传简历获取精准评估</button>
        </p>
      </div>

      <!-- 关系图视图 -->
      <div v-show="viewMode === 'tree'" ref="treeViewRef" class="tree-view">
        <D3CareerTree
          :roles="roleOptions as CareerRole[]"
          :role-track-map="roleTrackMap"
          :role-meta-map="roleMetaMap"
          @select-role="(role, track) => selectRole(role, track)"
        />
        <p class="tip-row tree-tip-row">
          <Icon icon="lucide:info" :width="13" />
          点击大方向节点进行整体自评，点击细分节点直接进入对应赛道
        </p>
      </div>
    </div>

    <!-- ══ 阶段二：逐题问卷 ══ -->
    <div v-else-if="phase === 'quiz'" class="phase phase--quiz">
      <!-- 顶部进度 -->
      <div class="quiz-progress">
        <div class="quiz-progress__meta">
          <span class="quiz-progress__role">{{ selectedDirectionLabel }}</span>
          <span class="quiz-progress__count">{{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</span>
        </div>
        <div class="quiz-progress__bar">
          <div class="quiz-progress__fill" :style="{ width: progressPct + '%' }" />
        </div>
      </div>

      <div v-if="selectedTrack" class="quiz-direction-chip">
        <span>归属主方向：{{ selectedRole }}</span>
      </div>

      <div class="track-panel">
        <span class="track-panel__title">该方向常见细分赛道</span>
        <div class="track-list">
          <div v-for="item in currentTracks" :key="item.label" class="track-item">
            <strong>{{ item.label }}</strong>
            <span>{{ item.focus }}</span>
          </div>
        </div>
      </div>

      <!-- 题目卡片 -->
      <div class="quiz-card" v-if="currentSkill">
        <div class="quiz-card__meta">
          <span class="quiz-card__heat">岗位热度 {{ currentSkill.required }}</span>
          <span class="quiz-card__required">高频核心技能</span>
        </div>
        <h2 class="quiz-card__skill">{{ currentSkill.name }}</h2>
        <p class="quiz-card__ask">你目前对 <strong>{{ currentSkill.name }}</strong> 的掌握程度是？</p>

        <div class="quiz-options">
          <label
            v-for="opt in levelOptions"
            :key="opt.score"
            class="quiz-option"
            :class="{ 'quiz-option--selected': selectedScore === opt.score }"
          >
            <input
              type="radio"
              :name="'q-' + currentSkill.id"
              :value="opt.score"
              v-model="selectedScore"
              class="quiz-option__radio"
            />
            <div class="quiz-option__content">
              <span class="quiz-option__label">{{ opt.label }}</span>
              <span class="quiz-option__desc">{{ opt.desc }}</span>
            </div>
            <Icon v-if="selectedScore === opt.score" icon="lucide:check-circle" :width="16" class="quiz-option__check" />
          </label>
        </div>
      </div>

      <!-- 底部导航 -->
      <div class="quiz-nav">
        <button class="btn-ghost" @click="goPrev">
          <Icon icon="lucide:arrow-left" :width="14" />
          {{ currentQuestionIndex === 0 ? '重选方向' : '上一题' }}
        </button>
        <button
          class="btn-primary"
          :disabled="selectedScore < 0"
          @click="goNext"
        >
          {{ currentQuestionIndex === totalQuestions - 1 ? '生成差距报告' : '下一题' }}
          <Icon icon="lucide:arrow-right" :width="14" />
        </button>
      </div>
    </div>

    <!-- ══ 阶段三：差距报告 ══ -->
    <div v-else-if="phase === 'result'" class="phase phase--result">
      <!-- 总览卡 -->
      <div class="result-overview">
        <div class="result-overview__left">
          <div class="result-level" :style="{ color: overallLevel.color }">
            {{ overallLevel.label }}
          </div>
          <div class="result-pct">综合掌握度 {{ overallMastery }}%</div>
          <p class="result-desc">{{ overallLevel.desc }}</p>
          <div class="result-overview__bar">
            <div class="result-overview__fill" :style="{ width: overallMastery + '%', background: overallLevel.color }" />
          </div>
        </div>
        <div class="result-overview__right">
          <div class="result-weak-title" v-if="weakSkills.length">
            还有 {{ weakSkills.length }} 项差距较大
          </div>
          <div class="result-weak-tags">
            <span v-for="s in weakSkills.slice(0,4)" :key="s.id" class="weak-tag">{{ s.name }}</span>
          </div>
        </div>
      </div>

      <!-- 逐项列表 -->
      <div class="gap-list">
        <div
          v-for="skill in gapResults" :key="skill.id"
          class="gap-item"
          :style="{ background: masteryBg(skill.mastery) }"
        >
          <div class="gap-item__name">
            {{ skill.name }}
            <span class="gap-item__level">{{ levelLabel(skill.userScore) }}</span>
          </div>
          <div class="gap-item__bars">
            <div class="gap-item__bar-row">
              <span class="gap-bar-lbl">自评</span>
              <div class="gap-bar-track">
                <div class="gap-bar-fill gap-bar-fill--user" :style="{ width: skill.userScore + '%' }" />
              </div>
              <span class="gap-bar-val">{{ skill.userScore }}</span>
            </div>
            <div class="gap-item__bar-row">
              <span class="gap-bar-lbl">要求</span>
              <div class="gap-bar-track">
                <div class="gap-bar-fill gap-bar-fill--req" :style="{ width: skill.required + '%' }" />
              </div>
              <span class="gap-bar-val">{{ skill.required }}</span>
            </div>
          </div>
          <span
            class="gap-badge"
            :style="{ color: gapColor(skill.gap), borderColor: gapColor(skill.gap) }"
          >
            {{ skill.gap > 0 ? `差 ${skill.gap}` : '✓ 达标' }}
          </span>
        </div>
      </div>

      <!-- 底部 CTA -->
      <div class="result-footer">
        <button class="btn-ghost" @click="resetAll">
          <Icon icon="lucide:rotate-ccw" :width="13" /> 重新评估
        </button>
        <button class="btn-primary" @click="goToAnalysis">
          <Icon icon="lucide:target" :width="13" />
          了解 {{ selectedDirectionLabel }} 岗位实情
        </button>
        <button class="btn-secondary" @click="goToNavigation">
          <Icon icon="lucide:route" :width="13" />
          上传简历精准评估
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ─── 容器 ─── */
.exams-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 20px;
}
.phase { display: flex; flex-direction: column; gap: 20px; width: 100%; }

.phase--select { max-width: none; }

.phase--quiz,
.phase--result {
  max-width: 680px;
  margin: 0 auto;
}

/* ─── 页头 ─── */
.page-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.page-hd__title {
  font-size: 1.375rem; font-weight: 600;
  color: var(--color-text); margin: 0 0 4px;
  border-left: 3px solid var(--color-primary);
  padding-left: 10px;
}
.page-hd__sub { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}
.view-toggle-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}
.view-toggle-btn:active { transform: scale(0.9); }

/* ─── 视图容器 ─── */
.card-view { display: flex; flex-direction: column; gap: 20px; }
.tree-view { display: flex; flex-direction: column; gap: 14px; }
.tree-tip-row { justify-content: center; }

/* ─── 方向选择 ─── */
.select-hint { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.role-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}
.role-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  min-height: 220px;
  padding: 18px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer; transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  text-align: center;
}
.role-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}
.role-card__icon { color: var(--color-primary); }
.role-card__name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.role-card__summary {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.role-card__count { font-size: 11px; color: var(--color-text-subtle); }
.role-card__tracks {
  font-size: 10px;
  color: var(--color-primary);
  line-height: 1.5;
}

.subrole-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 78%, var(--color-secondary-light, rgba(0,0,0,0.03)));
}

.subrole-panel__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subrole-panel__head strong {
  font-size: 14px;
  color: var(--color-text);
}

.subrole-panel__head span {
  font-size: 12px;
  color: var(--color-text-muted);
}

.subrole-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.subrole-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 132px;
  padding: 16px 16px 14px;
  border: 1px solid color-mix(in srgb, var(--color-border) 84%, var(--color-primary));
  border-radius: var(--radius-md);
  background: var(--color-background);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.subrole-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.subrole-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.subrole-card__role {
  font-size: 10px;
  color: var(--color-text-subtle);
}

.subrole-card__icon {
  color: var(--color-primary);
}

.subrole-card__title {
  font-size: 14px;
  color: var(--color-text);
}

.subrole-card__desc {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.tip-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-text-subtle);
}
.link-btn {
  background: none; border: none; cursor: pointer;
  color: var(--color-secondary); font-size: inherit; text-decoration: underline; padding: 0;
}

/* ─── 问卷进度 ─── */
.quiz-progress { display: flex; flex-direction: column; gap: 6px; }
.quiz-progress__meta {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px;
}
.quiz-progress__role { color: var(--color-primary); font-weight: 600; }
.quiz-progress__count { color: var(--color-text-muted); }
.quiz-progress__bar {
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.quiz-progress__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

.track-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-surface) 76%, var(--color-primary-light));
}

.track-panel__title {
  font-size: 12px;
  color: var(--color-text-muted);
}

.quiz-direction-chip {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 600;
}

.track-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.track-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-primary));
  background: var(--color-background);
}

.track-item strong {
  font-size: 13px;
  color: var(--color-text);
}

.track-item span {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* ─── 题目卡片 ─── */
.quiz-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 24px;
}
.quiz-card__meta {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
}
.quiz-card__heat {
  font-size: 11px; font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.quiz-card__required {
  font-size: 11px; color: var(--color-text-subtle);
}
.quiz-card__skill {
  font-size: 1.25rem; font-weight: 600;
  color: var(--color-text); margin: 0 0 6px;
}
.quiz-card__ask {
  font-size: 13px; color: var(--color-text-muted); margin: 0 0 20px;
}

/* ─── 选项 ─── */
.quiz-options { display: flex; flex-direction: column; gap: 8px; }
.quiz-option {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-background);
}
.quiz-option:hover { border-color: var(--color-primary); background: var(--color-primary-light); }
.quiz-option--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.quiz-option__radio { display: none; }
.quiz-option__content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.quiz-option__label { font-size: 13px; font-weight: 600; color: var(--color-text); }
.quiz-option__desc { font-size: 11px; color: var(--color-text-muted); }
.quiz-option__check { color: var(--color-primary); flex-shrink: 0; }

/* ─── 问卷底部导航 ─── */
.quiz-nav {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 4px;
}

/* ─── 结果总览 ─── */
.result-overview {
  display: flex; gap: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 20px;
  flex-wrap: wrap;
}
.result-overview__left { flex: 1; min-width: 200px; }
.result-level { font-size: 1.5rem; font-weight: 600; margin-bottom: 2px; }
.result-pct { font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.result-desc { font-size: 12px; color: var(--color-text-muted); margin: 0 0 12px; line-height: 1.5; }
.result-overview__bar {
  height: 5px; background: var(--color-border);
  border-radius: var(--radius-sm); overflow: hidden;
}
.result-overview__fill {
  height: 100%; border-radius: var(--radius-sm); transition: width 0.5s ease;
}
.result-overview__right { display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.result-weak-title { font-size: 12px; color: var(--color-text-muted); }
.result-weak-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.weak-tag {
  font-size: 11px; padding: 2px 8px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

/* ─── 差距列表 ─── */
.gap-list { display: flex; flex-direction: column; gap: 6px; }
.gap-item {
  display: grid; grid-template-columns: 160px 1fr auto;
  align-items: center; gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
}
.gap-item__name { font-size: 13px; font-weight: 500; color: var(--color-text); display: flex; flex-direction: column; gap: 2px; }
.gap-item__level { font-size: 10px; color: var(--color-text-subtle); font-weight: 400; }
.gap-item__bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.gap-bar-lbl { font-size: 10px; color: var(--color-text-subtle); width: 24px; flex-shrink: 0; }
.gap-bar-track { flex: 1; height: 4px; background: var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
.gap-bar-fill { height: 100%; border-radius: var(--radius-sm); }
.gap-bar-fill--user { background: var(--color-secondary); }
.gap-bar-fill--req { background: var(--color-text-subtle); opacity: 0.4; }
.gap-bar-val { font-size: 10px; color: var(--color-text-muted); width: 24px; text-align: right; flex-shrink: 0; }
.gap-badge {
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid;
  white-space: nowrap;
}

/* ─── 底部按钮 ─── */
.result-footer { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 4px; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px;
  background: var(--color-primary);
  color: var(--parchment-100); border: none;
  border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity var(--transition-fast);
}
.btn-primary:hover:not(:disabled) { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px;
  background: var(--color-secondary);
  color: var(--parchment-100); border: none;
  border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity var(--transition-fast);
}
.btn-secondary:hover { opacity: 0.88; }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 14px;
  background: none;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px; cursor: pointer; transition: background var(--transition-fast);
}
.btn-ghost:hover { background: var(--color-surface); }

@media (max-width: 960px) {
  .role-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .subrole-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .exams-page { padding: 20px 16px; }
  .role-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .subrole-panel { padding: 18px; }
  .subrole-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .role-card,
  .subrole-card { min-height: unset; }
  .view-toggle-btn { display: none; }
  .tree-view { display: none !important; }
}

@media (prefers-reduced-motion: reduce) {
  .view-toggle-btn { transition: none; }
}

@media (max-width: 640px) {
  .gap-item { grid-template-columns: 1fr; }
  .result-overview { flex-direction: column; }
  .role-grid { grid-template-columns: 1fr; }
  .subrole-grid { grid-template-columns: 1fr; }
  .track-list { grid-template-columns: 1fr; }
}
</style>


