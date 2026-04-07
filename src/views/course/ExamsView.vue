<!-- 页面：技能自评；路由：exams（exams）；角色：STUDENT -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { roleOptions, type CareerRole } from '@/composables/useCareerInsights'

const router = useRouter()

type Phase = 'select' | 'quiz' | 'result'

const phase = ref<Phase>('select')
const selectedRole = ref<CareerRole>('前端开发')
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

/* 各方向技能标准（来自 useCareerInsights skillGraph，热度即要求权重） */
const roleSkillDefs: Record<CareerRole, { id: string; name: string; required: number }[]> = {
  '前端开发': [
    { id: 'vue3', name: 'Vue 3', required: 92 },
    { id: 'react', name: 'React', required: 84 },
    { id: 'ts', name: 'TypeScript', required: 88 },
    { id: 'webpack', name: 'Webpack/Vite', required: 74 },
    { id: 'css', name: 'CSS/Tailwind', required: 78 },
    { id: 'http', name: 'HTTP/浏览器原理', required: 70 },
    { id: 'git', name: 'Git/协作开发', required: 72 },
    { id: 'node', name: 'Node.js 基础', required: 60 },
  ],
  '后端开发': [
    { id: 'java', name: 'Java/Spring Boot', required: 90 },
    { id: 'mysql', name: 'MySQL', required: 85 },
    { id: 'redis', name: 'Redis', required: 78 },
    { id: 'docker', name: 'Docker', required: 62 },
    { id: 'microservice', name: '微服务架构', required: 72 },
    { id: 'mq', name: '消息队列', required: 68 },
    { id: 'ts', name: 'TypeScript/Golang', required: 64 },
    { id: 'git', name: 'Git/CI-CD', required: 72 },
  ],
  '测试开发': [
    { id: 'python', name: 'Python 自动化', required: 88 },
    { id: 'selenium', name: 'Selenium/Playwright', required: 82 },
    { id: 'testcase', name: '测试用例设计', required: 90 },
    { id: 'api-test', name: 'API 接口测试', required: 84 },
    { id: 'perf', name: '性能测试', required: 70 },
    { id: 'cicd', name: 'CI/CD 流水线', required: 68 },
    { id: 'git', name: 'Git', required: 72 },
    { id: 'sql', name: 'SQL', required: 64 },
  ],
  '数据分析': [
    { id: 'python', name: 'Python/Pandas', required: 90 },
    { id: 'sql', name: 'SQL', required: 88 },
    { id: 'visual', name: '数据可视化', required: 80 },
    { id: 'stats', name: '统计学基础', required: 78 },
    { id: 'tableau', name: 'Tableau/BI 工具', required: 70 },
    { id: 'etl', name: 'ETL/数据清洗', required: 74 },
    { id: 'excel', name: 'Excel 高级应用', required: 62 },
    { id: 'spark', name: 'Spark/Hadoop 基础', required: 60 },
  ],
  '机器学习工程师': [
    { id: 'python', name: 'Python', required: 92 },
    { id: 'pytorch', name: 'PyTorch/TensorFlow', required: 88 },
    { id: 'ml-algo', name: '机器学习算法', required: 90 },
    { id: 'math', name: '数学基础（线代/概率）', required: 85 },
    { id: 'nlp', name: 'NLP/CV 基础', required: 72 },
    { id: 'spark', name: 'Spark/大数据', required: 68 },
    { id: 'docker', name: 'Docker/k8s', required: 62 },
    { id: 'git', name: 'Git', required: 70 },
  ],
}

const currentSkills = computed(() => roleSkillDefs[selectedRole.value] ?? [])
const totalQuestions = computed(() => currentSkills.value.length)
const currentSkill = computed(() => currentSkills.value[currentQuestionIndex.value])

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

function selectRole(role: CareerRole) {
  selectedRole.value = role
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
  router.push({ path: '/app/student/career-analysis', query: { role: selectedRole.value } })
}

function goToNavigation() {
  router.push('/app/student/career-navigation')
}
</script>

<template>
  <div class="exams-page">

    <!-- ══ 阶段一：选择方向 ══ -->
    <div v-if="phase === 'select'" class="phase phase--select">
      <div class="page-hd">
        <h1 class="page-hd__title">技能自评</h1>
        <p class="page-hd__sub">选择目标岗位方向，逐项回答能力问题，生成差距诊断报告</p>
      </div>

      <p class="select-hint">你目前最感兴趣或正在准备的方向：</p>

      <div class="role-grid">
        <button
          v-for="(role, i) in roleOptions"
          :key="role"
          class="role-card"
          @click="selectRole(role as CareerRole)"
        >
          <Icon
            :icon="(['lucide:monitor','lucide:server','lucide:bug','lucide:bar-chart-2','lucide:cpu'])[i] || 'lucide:briefcase'"
            :width="28" class="role-card__icon"
          />
          <span class="role-card__name">{{ role }}</span>
          <span class="role-card__count">{{ roleSkillDefs[role as CareerRole]?.length ?? 0 }} 项核心技能</span>
        </button>
      </div>

      <p class="tip-row">
        <Icon icon="lucide:info" :width="13" />
        没有简历？先自评了解差距，再
        <button class="link-btn" @click="goToNavigation">上传简历获取精准评估</button>
      </p>
    </div>

    <!-- ══ 阶段二：逐题问卷 ══ -->
    <div v-else-if="phase === 'quiz'" class="phase phase--quiz">
      <!-- 顶部进度 -->
      <div class="quiz-progress">
        <div class="quiz-progress__meta">
          <span class="quiz-progress__role">{{ selectedRole }}</span>
          <span class="quiz-progress__count">{{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</span>
        </div>
        <div class="quiz-progress__bar">
          <div class="quiz-progress__fill" :style="{ width: progressPct + '%' }" />
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
          了解 {{ selectedRole }} 市场行情
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
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 20px;
}
.phase { display: flex; flex-direction: column; gap: 20px; }

/* ─── 页头 ─── */
.page-hd__title {
  font-size: 1.375rem; font-weight: 700;
  color: var(--color-text); margin: 0 0 4px;
  border-left: 3px solid var(--color-primary);
  padding-left: 10px;
}
.page-hd__sub { font-size: 13px; color: var(--color-text-muted); margin: 0; }

/* ─── 方向选择 ─── */
.select-hint { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.role-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 12px;
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
.role-card__count { font-size: 11px; color: var(--color-text-subtle); }

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
  font-size: 1.25rem; font-weight: 700;
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
.result-level { font-size: 1.5rem; font-weight: 800; margin-bottom: 2px; }
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

@media (max-width: 640px) {
  .gap-item { grid-template-columns: 1fr; }
  .result-overview { flex-direction: column; }
}
</style>


