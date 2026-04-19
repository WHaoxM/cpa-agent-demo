<!-- 页面：个人能力画像；路由：student/career-portrait；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'
import UserInfoBar from '@/components/UserInfoBar.vue'
import { useResumeStore } from '@/stores/resume'
import { useReportStore } from '@/stores/report'
import { callAgentPortraitStreaming, PHASE_META } from '@/composables/useAgentPortrait'
import type { AgentPortraitResult, AgentPhase, PhaseData, PersonInfo, AbilityDimension, SummarySource } from '@/composables/useAgentPortrait'
import type { PortraitReplaySnapshot, PortraitSessionStatus } from '@/composables/usePortraitSession'
import D3RadarChart from '@/components/charts/D3RadarChart.vue'
import type { RadarDatum } from '@/components/charts/D3RadarChart.vue'

const props = withDefaults(defineProps<{
  embedded?: boolean
  replaySnapshots?: PortraitReplaySnapshot[]
  resultData?: AgentPortraitResult | null
  sessionStatus?: PortraitSessionStatus
}>(), {
  embedded: false,
  replaySnapshots: () => [],
  resultData: null,
  sessionStatus: 'idle',
})

const router = useRouter()
const resumeStore = useResumeStore()
const reportStore = useReportStore()

/* ═══ 完整结果（保存/导出用） ═══ */
const portraitData = ref<AgentPortraitResult | null>(null)
const portraitSaved = ref(false)
const pageRef = ref<HTMLElement | null>(null)

/* ═══ 阶段渐进渲染 ═══ */
const portraitAgentLoading = ref(false)
const currentPhase = ref<AgentPhase | 'idle' | 'done'>('idle')
const phaseIndex = computed(() => {
  const map: Record<string, number> = { idle: -1, parsing: 0, evaluating: 1, analyzing: 2, summarizing: 3, done: 4 }
  return map[currentPhase.value] ?? -1
})

const phasePersonInfo = ref<PersonInfo | null>(null)
const phaseCompleteness = ref(0)
const phaseDimensions = ref<AbilityDimension[]>([])
const phaseCompetitiveness = ref(0)
const phaseSkillTags = ref<{ name: string; weight: number; category: string }[]>([])
const phaseHonors = ref<PersonInfo['honors']>([])
const phaseProjects = ref<PersonInfo['projects']>([])

/* ═══ AI 综评（string | ReadableStream 双模式） ═══ */
const displaySummary = ref('')
const summaryDone = ref(false)
let typingTimer: ReturnType<typeof setInterval> | null = null
let fullSummaryText = ''

const phaseOrder: Record<AgentPhase, number> = {
  parsing: 0,
  evaluating: 1,
  analyzing: 2,
  summarizing: 3,
}

const processedPhases = new Set<AgentPhase>()

function startTyping(fullText: string) {
  displaySummary.value = ''
  summaryDone.value = false
  fullSummaryText = fullText
  let idx = 0
  typingTimer = setInterval(() => {
    displaySummary.value += fullText[idx++] ?? ''
    if (idx >= fullText.length) {
      clearInterval(typingTimer!)
      typingTimer = null
      summaryDone.value = true
    }
  }, 28)
}

async function streamToDisplay(stream: ReadableStream<string>) {
  const reader = stream.getReader()
  displaySummary.value = ''
  summaryDone.value = false
  fullSummaryText = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      displaySummary.value += value
      fullSummaryText = displaySummary.value
    }
  } finally {
    reader.releaseLock()
    summaryDone.value = true
  }
}

function renderSummary(source: SummarySource) {
  if (typeof source === 'string') {
    startTyping(source)
  } else {
    streamToDisplay(source)
  }
}

function stopTyping() {
  if (typingTimer) { clearInterval(typingTimer); typingTimer = null }
  displaySummary.value = fullSummaryText || portraitData.value?.agentSummary || ''
  summaryDone.value = true
}

function resetPortraitState() {
  stopTyping()
  processedPhases.clear()
  portraitSaved.value = false
  portraitData.value = null
  portraitAgentLoading.value = false
  currentPhase.value = 'idle'
  phasePersonInfo.value = null
  phaseCompleteness.value = 0
  phaseDimensions.value = []
  phaseCompetitiveness.value = 0
  phaseSkillTags.value = []
  phaseHonors.value = []
  phaseProjects.value = []
  displaySummary.value = ''
  summaryDone.value = false
  fullSummaryText = ''
}

function exportPortrait() {
  window.print()
}

function savePortraitReport() {
  if (!portraitData.value) return
  const predictedRole = resumeStore.insights?.predictedRole ?? '未知方向'
  const today = new Date().toISOString().slice(0, 10)
  reportStore.addRecord({
    type: 'portrait',
    title: `${today} · ${predictedRole}方向画像`,
    snapshot: {
      predictedRole,
      competitivenessScore: portraitData.value.competitivenessScore,
      completenessScore: portraitData.value.completenessScore,
      sevenDim: portraitData.value.dimensions,
      skillTags: portraitData.value.skillTags,
      personInfo: portraitData.value.personInfo,
    },
  })
  portraitSaved.value = true
}

function goToCareerReport() {
  router.push({ name: 'student-career-report' })
}

function goToResumeBuilder() {
  router.push({ name: 'student-resume-builder' })
}

function goBack() {
  router.push({ name: 'student-career-navigation' })
}

/* ═══ D3 雷达图数据（基于阶段 ref） ═══ */
const radarData = computed<RadarDatum[]>(() => {
  if (!phaseDimensions.value.length) return []
  return phaseDimensions.value.map(d => ({
    axis: d.label,
    value: d.score,
    level: d.level,
    desc: d.desc,
  }))
})

/* ═══ 建议（基于阶段 ref） ═══ */
const portraitSuggestions = computed(() => {
  if (!phaseDimensions.value.length) return []
  const dims = phaseDimensions.value
  const sorted = [...dims].sort((a, b) => a.score - b.score)
  const topDim = [...dims].sort((a, b) => b.score - a.score)[0]!
  const weak1 = sorted[0]!
  const weak2 = sorted[1]!
  const actionMap: Record<string, string> = {
    professional: '系统学习行业主流技术栈，完成 2-3 个完整项目',
    certificate:  '备考 1-2 项行业认可证书（如软考、云计算认证）',
    innovation:   '参与开源项目或黑客马拉松，积累创新实践经历',
    learning:     '制定系统学习计划，建立个人技术知识体系',
    stress:       '争取高强度项目经历，参与团队协作与冲刺开发',
    communication:'加入技术社区，进行技术分享或撰写技术博客',
    internship:   '积极寻求暑期/兼职实习，优先匹配目标方向岗位',
  }
  return [
    { type: 'strength', label: '核心优势', text: `「${topDim.label}」是你的突出优势（${topDim.score}分），持续深耕可成为核心竞争力` },
    { type: 'improve',  label: '优先提升', text: `「${weak1.label}」得分偏低（${weak1.score}分）：${actionMap[weak1.key] ?? '针对性提升该维度'}` },
    { type: 'improve',  label: '建议加强', text: `「${weak2.label}」（${weak2.score}分）仍有提升空间：${actionMap[weak2.key] ?? '持续关注并加强'}` },
  ]
})

/* ═══ 每阶段入场动画 ═══ */
const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function animatePhase1() {
  if (reducedMotion) return
  gsap.fromTo('.tp-portrait__header', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
}

function animatePhase2() {
  if (reducedMotion) return
  gsap.fromTo('.tp-portrait__radar-wrap', { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.2)' })
  gsap.fromTo('.tp-portrait__dim-item', { opacity: 0, x: 14 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.28, ease: 'power2.out', delay: 0.1 })
  gsap.fromTo('.tp-portrait__tag', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, stagger: 0.03, duration: 0.22, ease: 'back.out(1.4)', delay: 0.2 })
}

function animatePhase3() {
  if (reducedMotion) return
  gsap.fromTo('.tp-portrait__honor-card', { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.3, ease: 'power2.out' })
  gsap.fromTo('.tp-portrait__project-card', { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.3, ease: 'power2.out', delay: 0.12 })
}

function animatePhase4() {
  if (reducedMotion) return
  gsap.fromTo('.tp-portrait__summary', { opacity: 0 }, { opacity: 1, duration: 0.4 })
  gsap.fromTo('.tp-portrait__step-guide', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, delay: 0.15, ease: 'power2.out' })
}

/* ═══ 阶段回调处理 ═══ */
function applyPhaseData(data: PhaseData) {
  if (portraitAgentLoading.value) {
    portraitAgentLoading.value = false
  }

  switch (data.phase) {
    case 'parsing':
      phasePersonInfo.value = data.personInfo
      phaseCompleteness.value = data.completenessScore
      currentPhase.value = 'parsing'
      nextTick(() => animatePhase1())
      break
    case 'evaluating':
      phaseDimensions.value = data.dimensions
      phaseCompetitiveness.value = data.competitivenessScore
      phaseSkillTags.value = data.skillTags
      currentPhase.value = 'evaluating'
      nextTick(() => animatePhase2())
      break
    case 'analyzing':
      phaseHonors.value = data.honors
      phaseProjects.value = data.projects
      currentPhase.value = 'analyzing'
      nextTick(() => animatePhase3())
      break
    case 'summarizing':
      currentPhase.value = 'summarizing'
      nextTick(() => {
        animatePhase4()
        renderSummary(data.agentSummary)
      })
      break
  }
}

function syncEmbeddedSnapshots(snapshots: PortraitReplaySnapshot[]) {
  const orderedSnapshots = [...snapshots].sort((a, b) => phaseOrder[a.phase] - phaseOrder[b.phase])
  portraitData.value = props.resultData ?? null
  if (!orderedSnapshots.length) {
    portraitAgentLoading.value = props.sessionStatus === 'running'
    if (props.sessionStatus === 'completed') {
      currentPhase.value = 'done'
    }
    return
  }
  for (const snapshot of orderedSnapshots) {
    if (processedPhases.has(snapshot.phase)) continue
    applyPhaseData(snapshot.data)
    processedPhases.add(snapshot.phase)
  }
  if (props.sessionStatus === 'completed') {
    portraitAgentLoading.value = false
    currentPhase.value = 'done'
  }
}

watch(
  () => props.sessionStatus,
  status => {
    if (!props.embedded) return
    if (status === 'idle') {
      resetPortraitState()
      return
    }
    if (!props.replaySnapshots.length) {
      portraitAgentLoading.value = status === 'running'
    }
    if (status === 'completed' && props.replaySnapshots.length) {
      portraitAgentLoading.value = false
      currentPhase.value = 'done'
    }
  },
  { immediate: true },
)

watch(
  () => props.resultData,
  data => {
    if (!props.embedded) return
    portraitData.value = data ?? null
  },
  { immediate: true },
)

watch(
  () => props.replaySnapshots,
  snapshots => {
    if (!props.embedded) return
    syncEmbeddedSnapshots(snapshots)
  },
  { deep: true, immediate: true },
)

onMounted(async () => {
  if (!resumeStore.isParsed) {
    if (!props.embedded) {
      router.replace({ name: 'student-career-navigation' })
    }
    return
  }

  if (props.embedded) {
    return
  }

  await nextTick()
  resetPortraitState()
  portraitAgentLoading.value = true
  try {
    portraitData.value = await callAgentPortraitStreaming(
      {
        resumeText: resumeStore.rawText || resumeStore.fileName,
        parsedSkills: resumeStore.parsedSkills,
        predictedRole: resumeStore.insights?.predictedRole ?? '前端开发',
        confidence: resumeStore.insights?.confidence ?? 0.7,
        matchedCareers: resumeStore.matchedCareers,
      },
      applyPhaseData,
    )
    currentPhase.value = 'done'
  } catch {
    portraitAgentLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (typingTimer) clearInterval(typingTimer)
})
</script>

<template>
  <div :class="['tp-page', { 'tp-page--embedded': props.embedded }]" ref="pageRef">

    <!-- HEADER -->
    <header v-if="!props.embedded" class="tp-header">
      <div class="tp-header__left">
        <button class="tp-back" @click="goBack"><Icon icon="lucide:arrow-left" :width="14"/><span>重新上传</span></button>
        <span class="tp-brand-name">职途导航</span>
        <div class="tp-header-tag">个人能力画像</div>
      </div>
      <div class="tp-header__right">
        <UserInfoBar />
        <button class="tp-export-btn" @click="exportPortrait">
          <Icon icon="lucide:download" :width="12"/><span>导出报告</span>
        </button>
      </div>
    </header>

    <!-- ═══ 阶段进度指示器 ═══ -->
    <div v-if="phaseIndex >= 0 && currentPhase !== 'done'" class="tp-phase-bar">
      <div
        v-for="(pm, idx) in PHASE_META" :key="pm.key"
        class="tp-phase-step"
        :class="{
          'tp-phase-step--done': phaseIndex > idx,
          'tp-phase-step--active': phaseIndex === idx,
          'tp-phase-step--waiting': phaseIndex < idx,
        }"
      >
        <span class="tp-phase-dot">
          <Icon v-if="phaseIndex > idx" icon="lucide:check" :width="9"/>
          <Icon v-else-if="phaseIndex === idx" icon="lucide:loader-circle" :width="9" class="tp-loading-spin"/>
          <span v-else class="tp-phase-num">{{ idx + 1 }}</span>
        </span>
        <span class="tp-phase-label">{{ pm.label }}</span>
        <span v-if="idx < PHASE_META.length - 1" class="tp-phase-line" :class="{ 'tp-phase-line--done': phaseIndex > idx }"/>
      </div>
    </div>

    <!-- 初始加载中（Phase 1 到达前） -->
    <div v-if="portraitAgentLoading" class="tp-loading-wrap">
      <div class="tp-loading-seal">
        <Icon icon="lucide:loader-circle" :width="34" class="tp-loading-spin" />
      </div>
      <p class="tp-loading-msg">正在连接 Agent 分析服务…</p>
    </div>

    <!-- 画像内容（按阶段渐进渲染） -->
    <div v-else-if="phaseIndex >= 0" class="tp-portrait">

      <!-- [A] 个人信息 + 评分横幅（Phase ① parsing） -->
      <div v-if="phasePersonInfo" class="tp-portrait__header">
        <div class="tp-portrait__header-top">
          <div class="tp-portrait__avatar">{{ phasePersonInfo.name.charAt(0) }}</div>
          <div class="tp-portrait__info">
            <div class="tp-portrait__name-row">
              <span class="tp-portrait__name">{{ phasePersonInfo.name }}</span>
              <span class="tp-portrait__grade">{{ phasePersonInfo.grade }}</span>
              <span class="tp-portrait__target">{{ phasePersonInfo.targetRole }}</span>
            </div>
            <div class="tp-portrait__school-row">
              <Icon icon="lucide:school" :width="10" class="tp-portrait__meta-icon"/>
              <span>{{ phasePersonInfo.school }}</span>
              <span class="tp-portrait__sep">·</span>
              <span>{{ phasePersonInfo.major }}</span>
              <template v-if="phasePersonInfo.gpa">
                <span class="tp-portrait__sep">·</span>
                <span>GPA {{ phasePersonInfo.gpa }}</span>
              </template>
            </div>
          </div>
        </div>
        <!-- 评分横幅 -->
        <div class="tp-portrait__score-banner">
          <div class="tp-portrait__score-card tp-portrait__score-card--completeness">
            <span class="tp-portrait__score-val">{{ phaseCompleteness }}<em>%</em></span>
            <span class="tp-portrait__score-lbl">完整度</span>
          </div>
          <div class="tp-portrait__score-card tp-portrait__score-card--competitiveness" :class="{ 'tp-portrait__score-card--pending': !phaseCompetitiveness }">
            <template v-if="phaseCompetitiveness">
              <span class="tp-portrait__score-val">{{ phaseCompetitiveness }}<em>分</em></span>
            </template>
            <template v-else>
              <span class="tp-portrait__score-val tp-portrait__score-val--pending">--<em>分</em></span>
            </template>
            <span class="tp-portrait__score-lbl">竞争力</span>
          </div>
          <div class="tp-portrait__score-card tp-portrait__score-card--honors">
            <div class="tp-portrait__honor-row">
              <span class="tp-portrait__honor-item">
                <Icon icon="lucide:award" :width="11"/>
                <strong>{{ phasePersonInfo.honors.filter(h => h.type === 'cert').length }}</strong> 证书
              </span>
              <span class="tp-portrait__honor-item">
                <Icon icon="lucide:briefcase" :width="11"/>
                <strong>{{ phasePersonInfo.honors.filter(h => h.type === 'intern').length }}</strong> 实习
              </span>
              <span class="tp-portrait__honor-item">
                <Icon icon="lucide:trophy" :width="11"/>
                <strong>{{ phasePersonInfo.honors.filter(h => h.type === 'award').length }}</strong> 获奖
              </span>
            </div>
            <span class="tp-portrait__score-lbl">荣誉档案</span>
          </div>
        </div>
      </div>

      <!-- [B+C] 雷达图 + 分项评分（Phase ② evaluating） -->
      <div v-if="phaseDimensions.length" class="tp-portrait__viz-row">
        <div class="tp-portrait__radar-wrap">
          <D3RadarChart :data="radarData" :show-legend="false" />
        </div>
        <div class="tp-portrait__dims">
          <div
            v-for="dim in phaseDimensions" :key="dim.key"
            class="tp-portrait__dim-item"
          >
            <div class="tp-portrait__dim-top">
              <span class="tp-portrait__dim-label">{{ dim.label }}</span>
              <span class="tp-portrait__dim-badge"
                :class="`tp-portrait__dim-badge--${dim.level === '优秀' ? 'good' : dim.level === '良好' ? 'mid' : 'low'}`">
                {{ dim.level }}
              </span>
              <span class="tp-portrait__dim-src"
                :class="{ 'tp-portrait__dim-src--agent': dim.source === 'agent' }"
                :title="dim.source === 'agent' ? 'AI 模型计算（后端论文算法）' : '基于简历数据直接计算'">
                <Icon :icon="dim.source === 'agent' ? 'lucide:bot' : 'lucide:calculator'" :width="9"/>
              </span>
            </div>
            <div class="tp-portrait__dim-bar-wrap">
              <div class="tp-portrait__dim-track">
                <div class="tp-portrait__dim-bar"
                  :style="{ width: dim.score + '%' }"
                  :class="`tp-portrait__dim-bar--${dim.level === '优秀' ? 'good' : dim.level === '良好' ? 'mid' : 'low'}`">
                </div>
              </div>
              <span class="tp-portrait__dim-score">{{ dim.score }}</span>
            </div>
            <p class="tp-portrait__dim-desc">{{ dim.desc }}</p>
          </div>
          <!-- 技能标签（内嵌于维度面板底部） -->
          <div v-if="phaseSkillTags.length" class="tp-portrait__tags-inline">
            <span class="tp-portrait__tags-inline-lbl">技能清单</span>
            <div class="tp-portrait__tags">
              <span
                v-for="tag in phaseSkillTags" :key="tag.name"
                class="tp-portrait__tag"
                :class="`tp-portrait__tag--${tag.category === '前端' ? 'fe' : tag.category === '后端' ? 'be' : tag.category === '测试' ? 'qa' : (tag.category === '数据' || tag.category === '机器学习') ? 'data' : 'gen'}`"
                :style="{ opacity: 0.55 + tag.weight * 0.45, fontSize: (9 + tag.weight * 3) + 'px' }"
                :title="'权重: ' + Math.round(tag.weight * 100) + '%'"
              >{{ tag.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- [D] 经历亮点（Phase ③ analyzing） -->
      <div v-if="phaseHonors.length || phaseProjects.length" class="tp-portrait__highlights">
        <span class="tp-portrait__section-lbl">经历亮点</span>
        <div class="tp-portrait__highlights-grid">
          <!-- 荣誉/证书/实习列 -->
          <div class="tp-portrait__highlights-col">
            <div
              v-for="h in phaseHonors" :key="h.label"
              class="tp-portrait__honor-card"
              :class="`tp-portrait__honor-card--${h.type}`"
            >
              <Icon :icon="h.type === 'cert' ? 'lucide:award' : h.type === 'intern' ? 'lucide:briefcase' : 'lucide:trophy'" :width="13" class="tp-portrait__honor-icon"/>
              <span class="tp-portrait__honor-lbl">{{ h.label }}</span>
            </div>
          </div>
          <!-- 项目经历列 -->
          <div class="tp-portrait__highlights-col">
            <div
              v-for="(proj, i) in phaseProjects" :key="i"
              class="tp-portrait__project-card"
            >
              <div class="tp-portrait__project-accent"></div>
              <div class="tp-portrait__project-body">
                <div class="tp-portrait__project-head">
                  <span class="tp-portrait__project-name">{{ proj.name }}</span>
                  <span class="tp-portrait__project-role">{{ proj.role }}</span>
                </div>
                <p class="tp-portrait__project-desc">{{ proj.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- [E] AI 综合评语 + 建议 + 自我评价（Phase ④ summarizing） -->
      <div v-if="currentPhase === 'summarizing' || currentPhase === 'done'" class="tp-portrait__summary">
        <span class="tp-portrait__section-lbl">
          <Icon icon="lucide:bot" :width="10" style="vertical-align: middle; margin-right: 4px;"/>AI 综合评语
        </span>
        <p class="tp-portrait__summary-text" @click="stopTyping">
          {{ displaySummary }}<span v-if="!summaryDone" class="tp-typing-cursor">|</span>
        </p>
        <!-- 三条具体建议 -->
        <div class="tp-portrait__suggestions">
          <div
            v-for="(s, i) in portraitSuggestions" :key="i"
            class="tp-portrait__suggestion"
            :class="`tp-portrait__suggestion--${s.type}`"
          >
            <span class="tp-portrait__suggestion-lbl">{{ s.label }}</span>
            <span class="tp-portrait__suggestion-text">{{ s.text }}</span>
          </div>
        </div>
        <template v-if="phasePersonInfo?.selfSummary">
          <div class="tp-portrait__summary-divider"></div>
          <span class="tp-portrait__section-lbl" style="margin-top: 2px;">自我评价</span>
          <p class="tp-portrait__self-summary">{{ phasePersonInfo.selfSummary }}</p>
        </template>
      </div>

      <!-- [H] 操作区（Phase ④ 完成后显示） -->
      <div v-if="currentPhase === 'summarizing' || currentPhase === 'done'" class="tp-portrait__step-guide">
        <div class="tp-portrait__step-guide-inner">
          <div class="tp-portrait__step-guide-info">
            <span class="tp-portrait__step-guide-title">能力画像已生成 —— 下一步</span>
            <p class="tp-portrait__step-guide-desc">保存画像报告，或根据你关注的方向查看人岗匹配分析</p>
          </div>
          <div class="tp-portrait__step-actions">
            <button
              class="tp-portrait__step-guide-btn tp-portrait__step-guide-btn--secondary"
              :disabled="portraitSaved"
              @click="savePortraitReport"
            >
              <Icon :icon="portraitSaved ? 'lucide:check' : 'lucide:save'" :width="13"/>
              {{ portraitSaved ? '已保存' : '保存画像报告' }}
            </button>
            <button
              class="tp-portrait__step-guide-btn"
              :disabled="!summaryDone"
              @click="goToCareerReport"
            >
              <Icon icon="lucide:map" :width="13"/>
              查看人岗匹配报告
              <Icon icon="lucide:arrow-right" :width="12"/>
            </button>
            <button
              class="tp-portrait__step-guide-btn tp-portrait__step-guide-btn--ghost"
              @click="goToResumeBuilder"
            >
              <Icon icon="lucide:file-text" :width="13"/>
              制作简历
            </button>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
/* ── CSS vars ── */
:root {
  --tp-bg: #F5F5F3;
  --tp-panel: #EDEDEB;
  --tp-border: #E3E3E0;
  --tp-red: #8B2500;
  --tp-gold: #8B6914;
  --tp-text: #111111;
  --tp-sub: #666666;
  --tp-hint: #999999;
  --tp-dark: #151515;
  --tp-dark2: #111111;
}

/* ── Page container ── */
.tp-page {
  position: relative;
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  background: #151515;
  display: flex;
  flex-direction: column;
  font-family: var(--font-title), sans-serif;
  overflow: hidden;
}

.tp-page--embedded {
  height: 100%;
  min-height: 0;
  max-height: none;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--tp-bg) 72%, #ffffff 28%),
    color-mix(in srgb, var(--tp-panel) 34%, var(--tp-bg) 66%)
  );
  color: var(--tp-text);
  --tp-embedded-surface: color-mix(in srgb, var(--tp-bg) 22%, #ffffff 78%);
  --tp-embedded-surface-soft: color-mix(in srgb, var(--tp-panel) 52%, #ffffff 48%);
  --tp-embedded-border: color-mix(in srgb, var(--tp-border) 82%, #ffffff 18%);
  --tp-embedded-text: var(--tp-text);
  --tp-embedded-sub: var(--tp-sub);
  --tp-embedded-muted: var(--tp-hint);
  --tp-embedded-blue: var(--color-secondary, #1B4E79);
  --tp-embedded-green: #447755;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.42);
}

/* ═══ HEADER ═══ */
.tp-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 48px;
  min-height: 48px;
  background: #0a0a0a;
  border-bottom: 1px solid rgba(212,201,181,0.12);
  flex-shrink: 0;
}
.tp-header__left { display: flex; align-items: center; gap: 14px; }
.tp-header__right {
  display: flex; align-items: center; gap: 8px;
  --uib-icon-color: rgba(168,152,122,0.6);
  --uib-icon-hover: rgba(220,170,130,0.9);
  --uib-avatar-bg: rgba(139,37,0,0.22);
  --uib-avatar-color: rgba(220,140,100,0.9);
  --uib-name-color: rgba(220,220,220,0.85);
  --uib-role-color: rgba(168,152,122,0.7);
}

.tp-back {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border: 1px solid rgba(212,201,181,0.22);
  background: transparent; color: rgba(168,152,122,0.88);
  font-size: 12px; font-family: inherit; cursor: pointer;
  transition: all 0.3s ease; letter-spacing: 0.02em;
}
.tp-back:hover { border-color: rgba(139,37,0,0.55); color: rgba(200,120,90,0.9); }

.tp-brand-name { font-size: 13px; font-weight: 600; color: rgba(220,220,220,0.5); letter-spacing: 0.04em; }

.tp-header-tag {
  font-size: 10px; letter-spacing: 0.06em;
  color: rgba(220,170,130,0.9);
  border: 1px solid rgba(139,37,0,0.35);
  background: rgba(139,37,0,0.12);
  padding: 3px 12px;
}


.tp-export-btn {
  display: flex; align-items: center; gap: 5px;
  background: rgba(139,37,0,0.06); border: 1px solid rgba(139,37,0,0.35);
  padding: 4px 10px; cursor: pointer; font-size: 10px; letter-spacing: 0.02em;
  font-family: inherit; color: rgba(210,150,100,0.85);
  transition: all 0.3s ease;
}
.tp-export-btn:hover { background: rgba(139,37,0,0.12); border-color: rgba(139,37,0,0.55); }

/* ── Loading ── */
.tp-loading-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.tp-loading-seal {
  width: 60px; height: 60px;
  border: 2px solid rgba(139,37,0,0.35);
  display: grid; place-items: center;
  background: rgba(139,37,0,0.06);
}
.tp-loading-spin { color: rgba(200,80,40,0.9); animation: tp-spin 1.2s linear infinite; }
@keyframes tp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.tp-loading-msg { font-size: 13px; color: rgba(200,200,200,0.88); letter-spacing: 0.02em; margin: 0; }

.tp-page--embedded .tp-loading-wrap {
  padding: 24px 16px;
}

/* ── Phase Progress Bar ── */
.tp-phase-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 10px 28px;
  background: rgba(10,10,10,0.85);
  border-bottom: 1px solid rgba(212,201,181,0.08);
  flex-shrink: 0;
}

.tp-page--embedded .tp-phase-bar {
  padding: 10px 18px;
}
.tp-phase-step {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}
.tp-phase-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 10px; font-weight: 700;
  border: 1.5px solid rgba(212,201,181,0.18);
  background: rgba(20,20,20,0.9);
  color: rgba(168,152,122,0.5);
  transition: all 0.35s ease;
  flex-shrink: 0;
}
.tp-phase-step--done .tp-phase-dot {
  border-color: rgba(139,105,20,0.6);
  background: rgba(139,105,20,0.18);
  color: rgba(196,170,90,0.95);
}
.tp-phase-step--active .tp-phase-dot {
  border-color: rgba(192,52,24,0.7);
  background: rgba(192,52,24,0.15);
  color: rgba(220,100,60,0.95);
  box-shadow: 0 0 8px rgba(192,52,24,0.3);
}
.tp-phase-num { font-size: 9px; }
.tp-phase-label {
  font-size: 11px; letter-spacing: 0.03em;
  color: rgba(168,152,122,0.45);
  transition: color 0.3s ease;
  white-space: nowrap;
}
.tp-phase-step--done .tp-phase-label { color: rgba(196,170,90,0.8); }
.tp-phase-step--active .tp-phase-label { color: rgba(220,170,130,0.95); font-weight: 600; }
.tp-phase-line {
  display: inline-block;
  width: 28px; height: 1.5px;
  background: rgba(212,201,181,0.12);
  margin: 0 6px;
  transition: background 0.35s ease;
  flex-shrink: 0;
}
.tp-phase-line--done { background: rgba(139,105,20,0.45); }

/* ── Pending score card ── */
.tp-portrait__score-card--pending { opacity: 0.45; }
.tp-portrait__score-val--pending { color: rgba(168,152,122,0.5) !important; }

/* ══════════════════════════════════════════
   Portrait 主容器
══════════════════════════════════════════ */
.tp-portrait {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 20px 22px 20px;
  display: flex; flex-direction: column; gap: 14px;
  background: var(--tp-dark, #151515);
  color: rgba(220,205,185,0.9);
}
.tp-page--embedded .tp-portrait {
  padding: 18px 18px 20px;
}
.tp-portrait::-webkit-scrollbar { width: 3px; }
.tp-portrait::-webkit-scrollbar-track { background: transparent; }
.tp-portrait::-webkit-scrollbar-thumb { background: rgba(192,52,24,0.42); }

.tp-portrait__section-lbl {
  display: block;
  font-size: 9px; font-weight: 600; letter-spacing: 0.06em;
  color: rgba(200,200,200,0.7); text-transform: uppercase;
  margin-bottom: 6px;
}

/* ── [A] 个人信息 + 评分横幅 ── */
.tp-portrait__header {
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px 16px;
  background: rgba(237,229,214,0.05);
  border: 1px solid rgba(212,201,181,0.15);
  border-radius: 8px;
}
.tp-portrait__header-top { display: flex; align-items: center; gap: 12px; }
.tp-portrait__avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(192,52,24,0.75), rgba(196,150,30,0.65));
  border: 1.5px solid rgba(192,52,24,0.62);
  display: grid; place-items: center;
  font-size: 18px; font-weight: 600; color: rgba(240,225,200,0.9);
}
.tp-portrait__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.tp-portrait__name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tp-portrait__name { font-size: 16px; font-weight: 600; color: rgba(230,230,230,0.95); letter-spacing: 0.02em; }
.tp-portrait__grade {
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: rgba(196,150,30,0.22); border: 1px solid rgba(196,150,30,0.48);
  color: rgba(238,198,88,0.98); letter-spacing: 0.02em;
}
.tp-portrait__target { font-size: 11px; font-weight: 600; color: rgba(218,78,52,0.97); letter-spacing: 0.02em; }
.tp-portrait__school-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.tp-portrait__school-row span { font-size: 11px; color: rgba(202,188,162,0.92); }
.tp-portrait__meta-icon { color: rgba(165,148,118,0.72); flex-shrink: 0; }
.tp-portrait__sep { color: rgba(128,112,86,0.6) !important; }

/* 评分横幅 */
.tp-portrait__score-banner {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.tp-portrait__score-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 10px 12px; border-radius: 6px; gap: 3px;
}
.tp-portrait__score-card--completeness {
  background: rgba(80,165,90,0.18); border: 1px solid rgba(80,165,90,0.5);
}
.tp-portrait__score-card--competitiveness {
  background: rgba(200,60,38,0.18); border: 1px solid rgba(200,60,38,0.48);
}
.tp-portrait__score-card--honors {
  background: rgba(196,150,30,0.14); border: 1px solid rgba(196,150,30,0.38);
}
.tp-portrait__score-val {
  font-size: 26px; font-weight: 600; line-height: 1; letter-spacing: -0.02em;
}
.tp-portrait__score-card--completeness .tp-portrait__score-val { color: rgb(95,218,128); }
.tp-portrait__score-card--competitiveness .tp-portrait__score-val { color: rgb(240,100,68); }
.tp-portrait__score-val em { font-size: 12px; font-weight: 600; font-style: normal; opacity: 0.7; }
.tp-portrait__score-lbl { font-size: 9px; color: rgba(168,152,122,0.88); letter-spacing: 0.1em; }
.tp-portrait__honor-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.tp-portrait__honor-item {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: rgba(215,200,175,0.97); letter-spacing: 0.04em;
}
.tp-portrait__honor-item strong { color: rgba(245,220,158,1); font-size: 13px; }

/* ── [B+C] 雷达 + 分项评分 ── */
.tp-portrait__viz-row {
  display: grid; grid-template-columns: 220px 1fr; gap: 16px;
}
.tp-portrait__radar-wrap {
  background: rgba(237,229,214,0.03);
  border: 1px solid rgba(212,201,181,0.1);
  border-radius: 8px; overflow: visible;
  height: 220px; flex-shrink: 0;
}

.tp-portrait__dims { display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.tp-portrait__dim-item { display: flex; flex-direction: column; gap: 2px; }
.tp-portrait__dim-top { display: flex; align-items: center; gap: 5px; }
.tp-portrait__dim-label { font-size: 12px; font-weight: 600; color: rgba(228,212,190,1.0); flex: 1; }
.tp-portrait__dim-badge {
  font-size: 9px; padding: 1px 6px; border-radius: 8px; letter-spacing: 0.02em;
}
.tp-portrait__dim-badge--good { background: rgba(80,165,90,0.22); color: rgb(100,218,138); border: 1px solid rgba(80,165,90,0.48); }
.tp-portrait__dim-badge--mid  { background: rgba(196,150,30,0.18); color: rgb(238,200,85); border: 1px solid rgba(196,150,30,0.48); }
.tp-portrait__dim-badge--low  { background: rgba(200,60,38,0.15); color: rgb(242,108,78); border: 1px solid rgba(200,60,38,0.38); }
.tp-portrait__dim-src {
  display: inline-flex; align-items: center; padding: 2px 5px; cursor: default;
  border: 1px solid rgba(196,185,166,0.25); color: rgba(175,155,110,0.82); border-radius: 3px;
}
.tp-portrait__dim-src--agent { border-color: rgba(145,88,200,0.48); color: rgba(198,158,232,0.95); }
.tp-portrait__dim-bar-wrap {
  display: grid; grid-template-columns: 1fr 28px; align-items: center; gap: 6px;
}
.tp-portrait__dim-track {
  height: 3px; background: rgba(212,201,181,0.22); border-radius: 2px; overflow: hidden;
}
.tp-portrait__dim-bar {
  height: 100%; border-radius: 2px;
  transition: width 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.2s;
}
.tp-portrait__dim-bar--good { background: linear-gradient(90deg, rgba(80,165,90,0.8), rgb(100,218,138)); }
.tp-portrait__dim-bar--mid  { background: linear-gradient(90deg, rgba(196,150,30,0.8), rgb(238,200,85)); }
.tp-portrait__dim-bar--low  { background: linear-gradient(90deg, rgba(200,60,38,0.7), rgb(242,108,78)); }
.tp-portrait__dim-score { font-size: 11px; font-weight: 600; color: rgba(225,225,225,0.95); text-align: right; }
.tp-portrait__dim-desc { font-size: 10px; color: rgba(178,162,132,0.85); line-height: 1.45; margin: 0; }

/* 技能标签内嵌 */
.tp-portrait__tags-inline {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(212,201,181,0.1);
}
.tp-portrait__tags-inline-lbl {
  display: block; font-size: 9px; font-weight: 600; letter-spacing: 0.06em;
  color: rgba(200,200,200,0.7); text-transform: uppercase; margin-bottom: 6px;
}
.tp-portrait__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tp-portrait__tag {
  padding: 3px 10px; border-radius: 3px; letter-spacing: 0.04em;
  transition: border-color 0.3s ease; cursor: default;
  border: 1px solid;
}
.tp-portrait__tag--fe { color: rgb(235,158,112); background: rgba(200,60,38,0.12); border-color: rgba(200,60,38,0.32); }
.tp-portrait__tag--be { color: rgb(242,205,90); background: rgba(196,150,30,0.12); border-color: rgba(196,150,30,0.35); }
.tp-portrait__tag--qa { color: rgb(135,178,228); background: rgba(74,120,168,0.12); border-color: rgba(74,120,168,0.32); }
.tp-portrait__tag--data { color: rgb(102,205,158); background: rgba(74,168,122,0.12); border-color: rgba(74,168,122,0.32); }
.tp-portrait__tag--gen { color: rgba(215,200,178,0.97); background: rgba(196,185,166,0.1); border-color: rgba(196,185,166,0.28); }

/* ── [D] 经历亮点 ── */
.tp-portrait__highlights {
  padding: 12px 14px;
  background: rgba(237,229,214,0.03);
  border: 1px solid rgba(212,201,181,0.1);
  border-radius: 8px;
  display: flex; flex-direction: column; gap: 8px;
}
.tp-portrait__highlights-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.tp-portrait__highlights-col { display: flex; flex-direction: column; gap: 6px; }
.tp-portrait__honor-card {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 6px; border: 1px solid;
  flex: 1; min-width: 160px;
}
.tp-portrait__honor-card--cert { background: rgba(196,150,30,0.13); border-color: rgba(196,150,30,0.42); }
.tp-portrait__honor-card--intern { background: rgba(74,120,168,0.12); border-color: rgba(74,120,168,0.38); }
.tp-portrait__honor-card--award { background: rgba(200,60,38,0.12); border-color: rgba(200,60,38,0.38); }
.tp-portrait__honor-icon { flex-shrink: 0; opacity: 0.9; }
.tp-portrait__honor-card--cert .tp-portrait__honor-icon { color: rgb(242,202,85); }
.tp-portrait__honor-card--intern .tp-portrait__honor-icon { color: rgb(132,178,228); }
.tp-portrait__honor-card--award .tp-portrait__honor-icon { color: rgb(238,148,108); }
.tp-portrait__honor-lbl { font-size: 11px; color: rgba(215,200,178,0.97); letter-spacing: 0.02em; }
.tp-portrait__project-card {
  display: flex; overflow: hidden;
  background: rgba(240,235,224,0.04);
  border: 1px solid rgba(212,201,181,0.1);
  border-radius: 6px;
  transition: border-color 0.3s ease;
}
.tp-portrait__project-card:hover { border-color: rgba(192,52,24,0.48); }
.tp-portrait__project-accent { width: 3px; flex-shrink: 0; background: rgba(200,60,38,0.8); }
.tp-portrait__project-body { flex: 1; padding: 9px 12px; display: flex; flex-direction: column; gap: 4px; }
.tp-portrait__project-head { display: flex; align-items: center; gap: 8px; }
.tp-portrait__project-name { font-size: 13px; font-weight: 600; color: rgba(240,240,240,0.99); }
.tp-portrait__project-role {
  font-size: 10px; padding: 1px 7px; border-radius: 8px;
  background: rgba(196,150,30,0.16); border: 1px solid rgba(196,150,30,0.42);
  color: rgb(242,205,90);
}
.tp-portrait__project-desc {
  font-size: 11px; color: rgba(195,180,158,0.92); line-height: 1.5; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ── [E] AI 综合评语 ── */
.tp-portrait__summary {
  padding: 12px 14px;
  background: rgba(139,37,0,0.05);
  border: 1px solid rgba(139,37,0,0.15);
  border-radius: 8px;
  display: flex; flex-direction: column; gap: 6px;
}
.tp-portrait__summary-text {
  font-size: 11px; color: rgba(212,196,172,0.97); line-height: 1.7; margin: 0;
  letter-spacing: 0.02em; cursor: pointer;
}
.tp-typing-cursor {
  display: inline-block; width: 1px; height: 1em;
  background: rgba(200,140,100,0.8); vertical-align: text-bottom; margin-left: 1px;
  animation: tp-blink 0.9s step-end infinite;
}
@keyframes tp-blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
.tp-portrait__summary-divider {
  height: 1px; background: rgba(139,37,0,0.12); margin: 2px 0;
}
.tp-portrait__self-summary {
  font-size: 11px; color: rgba(188,172,150,0.88); line-height: 1.6; margin: 0;
  font-style: italic;
}
.tp-portrait__suggestions {
  display: flex; flex-direction: column; gap: 5px;
  margin-top: 4px;
}
.tp-portrait__suggestion {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 6px 10px; border-radius: 5px; border: 1px solid;
  font-size: 11px; line-height: 1.45;
}
.tp-portrait__suggestion--strength {
  background: rgba(94,159,107,0.07); border-color: rgba(94,159,107,0.22);
}
.tp-portrait__suggestion--improve {
  background: rgba(212,168,85,0.07); border-color: rgba(212,168,85,0.22);
}
.tp-portrait__suggestion-lbl {
  flex-shrink: 0; font-size: 9px; font-weight: 600; letter-spacing: 0.04em;
  padding: 1px 6px; border-radius: 3px; white-space: nowrap; margin-top: 1px;
}
.tp-portrait__suggestion--strength .tp-portrait__suggestion-lbl {
  background: rgba(80,165,90,0.22); color: rgb(100,218,138);
}
.tp-portrait__suggestion--improve .tp-portrait__suggestion-lbl {
  background: rgba(196,150,30,0.22); color: rgb(238,200,85);
}
.tp-portrait__suggestion-text { color: rgba(208,192,168,0.97); }

/* ── [H] 步骤引导 ── */
.tp-portrait__step-guide {
  border: 1px solid rgba(139,37,0,0.2);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(139,37,0,0.06), rgba(139,105,20,0.04));
  padding: 14px 16px;
}
.tp-portrait__step-guide-inner {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.tp-portrait__step-guide-info { display: flex; flex-direction: column; gap: 4px; }
.tp-portrait__step-guide-title {
  font-size: 12px; font-weight: 600; color: rgba(240,240,240,1); letter-spacing: 0.02em;
}
.tp-portrait__step-guide-desc {
  font-size: 10px; color: rgba(182,165,138,0.88); line-height: 1.5; margin: 0; max-width: 380px;
}
.tp-portrait__step-guide-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 6px; font-family: inherit;
  font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
  border: 1px solid rgba(192,58,32,0.7); color: rgba(242,182,142,0.99);
  background: rgba(192,58,32,0.25); cursor: pointer;
  white-space: nowrap; transition: background 0.3s, border-color 0.3s;
}
.tp-portrait__step-guide-btn:hover:not(:disabled) {
  background: rgba(192,58,32,0.42); border-color: rgba(192,58,32,0.9);
}
.tp-portrait__step-guide-btn:disabled {
  opacity: 0.38; cursor: not-allowed;
  border-color: rgba(139,37,0,0.2); color: rgba(160,130,100,0.5);
  background: rgba(139,37,0,0.05);
}
.tp-portrait__step-guide-btn--secondary {
  background: rgba(139,105,20,0.18);
  border-color: rgba(196,150,30,0.5);
  color: rgba(220,185,100,1);
}
.tp-portrait__step-guide-btn--secondary:hover:not(:disabled) {
  background: rgba(139,105,20,0.35);
  border-color: rgba(196,150,30,0.9);
}
.tp-portrait__step-guide-btn--ghost {
  background: transparent;
  border-color: rgba(160,130,100,0.3);
  color: rgba(182,165,138,0.88);
}
.tp-portrait__step-guide-btn--ghost:hover:not(:disabled) {
  background: rgba(255,255,255,0.06);
  border-color: rgba(160,130,100,0.6);
}
.tp-portrait__step-actions {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}

.tp-page--embedded .tp-loading-wrap {
  padding: 32px 20px;
}
.tp-page--embedded .tp-loading-seal {
  width: 68px;
  height: 68px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--tp-red) 24%, var(--tp-embedded-border) 76%);
  background: linear-gradient(
    180deg,
    var(--tp-embedded-surface),
    var(--tp-embedded-surface-soft)
  );
  box-shadow: var(--shadow-sm);
}
.tp-page--embedded .tp-loading-msg {
  color: var(--tp-embedded-sub);
}
.tp-page--embedded .tp-phase-bar {
  padding: 11px 18px;
  background: color-mix(in srgb, var(--tp-panel) 72%, #ffffff 28%);
  border-bottom: 1px solid var(--tp-embedded-border);
}
.tp-page--embedded .tp-phase-dot {
  border-color: color-mix(in srgb, var(--tp-embedded-border) 78%, var(--tp-gold) 22%);
  background: rgba(255,255,255,0.9);
  color: var(--tp-embedded-muted);
}
.tp-page--embedded .tp-phase-step--done .tp-phase-dot {
  border-color: color-mix(in srgb, var(--tp-gold) 46%, var(--tp-embedded-border) 54%);
  background: color-mix(in srgb, var(--tp-gold) 10%, #ffffff 90%);
  color: var(--tp-gold);
}
.tp-page--embedded .tp-phase-step--active .tp-phase-dot {
  border-color: color-mix(in srgb, var(--tp-red) 60%, var(--tp-embedded-border) 40%);
  background: color-mix(in srgb, var(--tp-red) 8%, #ffffff 92%);
  color: var(--tp-red);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tp-red) 12%, transparent 88%);
}
.tp-page--embedded .tp-phase-label {
  color: var(--tp-embedded-muted);
}
.tp-page--embedded .tp-phase-step--done .tp-phase-label {
  color: color-mix(in srgb, var(--tp-gold) 76%, var(--tp-embedded-sub) 24%);
}
.tp-page--embedded .tp-phase-step--active .tp-phase-label {
  color: var(--tp-red);
}
.tp-page--embedded .tp-phase-line {
  background: color-mix(in srgb, var(--tp-embedded-border) 72%, transparent 28%);
}
.tp-page--embedded .tp-phase-line--done {
  background: color-mix(in srgb, var(--tp-gold) 42%, var(--tp-embedded-border) 58%);
}
.tp-page--embedded .tp-portrait {
  padding: 20px 20px 22px;
  gap: 16px;
  background: transparent;
  color: var(--tp-embedded-text);
}
.tp-page--embedded .tp-portrait::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--tp-red) 28%, var(--tp-embedded-border) 72%);
}
.tp-page--embedded .tp-portrait__section-lbl,
.tp-page--embedded .tp-portrait__tags-inline-lbl {
  color: var(--tp-embedded-muted);
}
.tp-page--embedded .tp-portrait__header,
.tp-page--embedded .tp-portrait__radar-wrap,
.tp-page--embedded .tp-portrait__dims,
.tp-page--embedded .tp-portrait__highlights,
.tp-page--embedded .tp-portrait__summary,
.tp-page--embedded .tp-portrait__step-guide {
  border-radius: var(--radius-lg, 14px);
  border: 1px solid var(--tp-embedded-border);
  background: linear-gradient(
    180deg,
    var(--tp-embedded-surface),
    var(--tp-embedded-surface-soft)
  );
  box-shadow: var(--shadow-sm);
}
.tp-page--embedded .tp-portrait__header {
  gap: 12px;
}
.tp-page--embedded .tp-portrait__avatar {
  box-shadow: 0 10px 22px rgba(192,52,24,0.18);
}
.tp-page--embedded .tp-portrait__name,
.tp-page--embedded .tp-portrait__dim-label,
.tp-page--embedded .tp-portrait__dim-score,
.tp-page--embedded .tp-portrait__project-name,
.tp-page--embedded .tp-portrait__step-guide-title {
  color: var(--tp-embedded-text);
}
.tp-page--embedded .tp-portrait__grade {
  background: color-mix(in srgb, var(--tp-gold) 14%, #ffffff 86%);
  border-color: color-mix(in srgb, var(--tp-gold) 32%, var(--tp-embedded-border) 68%);
  color: var(--tp-gold);
}
.tp-page--embedded .tp-portrait__target {
  color: var(--tp-red);
}
.tp-page--embedded .tp-portrait__school-row span,
.tp-page--embedded .tp-portrait__honor-item,
.tp-page--embedded .tp-portrait__dim-desc,
.tp-page--embedded .tp-portrait__summary-text,
.tp-page--embedded .tp-portrait__suggestion-text,
.tp-page--embedded .tp-portrait__self-summary,
.tp-page--embedded .tp-portrait__step-guide-desc,
.tp-page--embedded .tp-portrait__project-desc,
.tp-page--embedded .tp-portrait__honor-lbl {
  color: var(--tp-embedded-sub);
}
.tp-page--embedded .tp-portrait__meta-icon,
.tp-page--embedded .tp-portrait__sep {
  color: var(--tp-embedded-muted) !important;
}
.tp-page--embedded .tp-portrait__score-banner {
  gap: 10px;
}
.tp-page--embedded .tp-portrait__score-card {
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
}
.tp-page--embedded .tp-portrait__score-card--pending {
  opacity: 0.72;
}
.tp-page--embedded .tp-portrait__score-card--completeness {
  background: color-mix(in srgb, var(--tp-embedded-green) 10%, #ffffff 90%);
  border-color: color-mix(in srgb, var(--tp-embedded-green) 30%, var(--tp-embedded-border) 70%);
}
.tp-page--embedded .tp-portrait__score-card--competitiveness {
  background: color-mix(in srgb, var(--tp-red) 10%, #ffffff 90%);
  border-color: color-mix(in srgb, var(--tp-red) 30%, var(--tp-embedded-border) 70%);
}
.tp-page--embedded .tp-portrait__score-card--honors {
  background: color-mix(in srgb, var(--tp-gold) 10%, #ffffff 90%);
  border-color: color-mix(in srgb, var(--tp-gold) 26%, var(--tp-embedded-border) 74%);
}
.tp-page--embedded .tp-portrait__score-card--completeness .tp-portrait__score-val {
  color: var(--tp-embedded-green);
}
.tp-page--embedded .tp-portrait__score-card--competitiveness .tp-portrait__score-val {
  color: var(--tp-red);
}
.tp-page--embedded .tp-portrait__score-val--pending {
  color: color-mix(in srgb, var(--tp-red) 42%, var(--tp-embedded-muted) 58%) !important;
}
.tp-page--embedded .tp-portrait__score-lbl {
  color: var(--tp-embedded-muted);
}
.tp-page--embedded .tp-portrait__honor-item strong {
  color: var(--tp-gold);
}
.tp-page--embedded .tp-portrait__viz-row {
  align-items: stretch;
  gap: 14px;
}
.tp-page--embedded .tp-portrait__radar-wrap {
  min-height: 220px;
}
.tp-page--embedded .tp-portrait__dims {
  padding: 14px 16px;
  gap: 10px;
}
.tp-page--embedded .tp-portrait__dim-item + .tp-portrait__dim-item {
  padding-top: 8px;
  border-top: 1px solid color-mix(in srgb, var(--tp-embedded-border) 74%, transparent 26%);
}
.tp-page--embedded .tp-portrait__dim-src {
  border-color: color-mix(in srgb, var(--tp-embedded-border) 72%, var(--tp-gold) 28%);
  color: color-mix(in srgb, var(--tp-gold) 74%, var(--tp-embedded-sub) 26%);
  background: rgba(255,255,255,0.8);
}
.tp-page--embedded .tp-portrait__dim-src--agent {
  border-color: color-mix(in srgb, #8a63d2 42%, var(--tp-embedded-border) 58%);
  color: #7c58c2;
}
.tp-page--embedded .tp-portrait__dim-track {
  background: color-mix(in srgb, var(--tp-embedded-border) 78%, #ffffff 22%);
}
.tp-page--embedded .tp-portrait__tags-inline {
  margin-top: 12px;
  padding-top: 12px;
  border-top-color: color-mix(in srgb, var(--tp-embedded-border) 76%, transparent 24%);
}
.tp-page--embedded .tp-portrait__tag--fe {
  color: var(--tp-red);
  background: color-mix(in srgb, var(--tp-red) 7%, #ffffff 93%);
  border-color: color-mix(in srgb, var(--tp-red) 20%, var(--tp-embedded-border) 80%);
}
.tp-page--embedded .tp-portrait__tag--be {
  color: var(--tp-gold);
  background: color-mix(in srgb, var(--tp-gold) 8%, #ffffff 92%);
  border-color: color-mix(in srgb, var(--tp-gold) 20%, var(--tp-embedded-border) 80%);
}
.tp-page--embedded .tp-portrait__tag--qa {
  color: var(--tp-embedded-blue);
  background: color-mix(in srgb, var(--tp-embedded-blue) 8%, #ffffff 92%);
  border-color: color-mix(in srgb, var(--tp-embedded-blue) 18%, var(--tp-embedded-border) 82%);
}
.tp-page--embedded .tp-portrait__tag--data {
  color: var(--tp-embedded-green);
  background: color-mix(in srgb, var(--tp-embedded-green) 8%, #ffffff 92%);
  border-color: color-mix(in srgb, var(--tp-embedded-green) 18%, var(--tp-embedded-border) 82%);
}
.tp-page--embedded .tp-portrait__tag--gen {
  color: var(--tp-embedded-sub);
  background: color-mix(in srgb, var(--tp-panel) 76%, #ffffff 24%);
  border-color: color-mix(in srgb, var(--tp-embedded-border) 76%, transparent 24%);
}
.tp-page--embedded .tp-portrait__honor-card--cert {
  background: color-mix(in srgb, var(--tp-gold) 8%, #ffffff 92%);
  border-color: color-mix(in srgb, var(--tp-gold) 20%, var(--tp-embedded-border) 80%);
}
.tp-page--embedded .tp-portrait__honor-card--intern {
  background: color-mix(in srgb, var(--tp-embedded-blue) 8%, #ffffff 92%);
  border-color: color-mix(in srgb, var(--tp-embedded-blue) 18%, var(--tp-embedded-border) 82%);
}
.tp-page--embedded .tp-portrait__honor-card--award {
  background: color-mix(in srgb, var(--tp-red) 8%, #ffffff 92%);
  border-color: color-mix(in srgb, var(--tp-red) 18%, var(--tp-embedded-border) 82%);
}
.tp-page--embedded .tp-portrait__project-card {
  background: rgba(255,255,255,0.92);
  border-color: color-mix(in srgb, var(--tp-embedded-border) 76%, transparent 24%);
}
.tp-page--embedded .tp-portrait__project-card:hover {
  border-color: color-mix(in srgb, var(--tp-red) 38%, var(--tp-embedded-border) 62%);
}
.tp-page--embedded .tp-portrait__project-role {
  background: color-mix(in srgb, var(--tp-gold) 12%, #ffffff 88%);
  border-color: color-mix(in srgb, var(--tp-gold) 20%, var(--tp-embedded-border) 80%);
  color: var(--tp-gold);
}
.tp-page--embedded .tp-portrait__summary {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--tp-red) 6%, #ffffff 94%),
    color-mix(in srgb, var(--tp-gold) 4%, #ffffff 96%)
  );
  border-color: color-mix(in srgb, var(--tp-red) 18%, var(--tp-embedded-border) 82%);
}
.tp-page--embedded .tp-typing-cursor {
  background: color-mix(in srgb, var(--tp-red) 72%, var(--tp-gold) 28%);
}
.tp-page--embedded .tp-portrait__summary-divider {
  background: color-mix(in srgb, var(--tp-red) 12%, var(--tp-embedded-border) 88%);
}
.tp-page--embedded .tp-portrait__suggestion--strength {
  background: color-mix(in srgb, var(--tp-embedded-green) 7%, #ffffff 93%);
  border-color: color-mix(in srgb, var(--tp-embedded-green) 18%, var(--tp-embedded-border) 82%);
}
.tp-page--embedded .tp-portrait__suggestion--improve {
  background: color-mix(in srgb, var(--tp-gold) 7%, #ffffff 93%);
  border-color: color-mix(in srgb, var(--tp-gold) 18%, var(--tp-embedded-border) 82%);
}
.tp-page--embedded .tp-portrait__suggestion--strength .tp-portrait__suggestion-lbl {
  background: color-mix(in srgb, var(--tp-embedded-green) 14%, #ffffff 86%);
  color: var(--tp-embedded-green);
}
.tp-page--embedded .tp-portrait__suggestion--improve .tp-portrait__suggestion-lbl {
  background: color-mix(in srgb, var(--tp-gold) 14%, #ffffff 86%);
  color: var(--tp-gold);
}
.tp-page--embedded .tp-portrait__step-guide {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--tp-red) 5%, #ffffff 95%),
    color-mix(in srgb, var(--tp-gold) 7%, #ffffff 93%)
  );
  border-color: color-mix(in srgb, var(--tp-red) 16%, var(--tp-embedded-border) 84%);
}
.tp-page--embedded .tp-portrait__step-guide-btn {
  border-color: color-mix(in srgb, var(--tp-red) 22%, transparent 78%);
  color: var(--tp-bg);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--tp-red) 86%, #ffffff 14%),
    var(--tp-red)
  );
  box-shadow: 0 10px 20px rgba(139,37,0,0.14);
}
.tp-page--embedded .tp-portrait__step-guide-btn:hover:not(:disabled) {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--tp-red) 78%, #ffffff 22%),
    color-mix(in srgb, var(--tp-red) 92%, #5c0e00 8%)
  );
  border-color: color-mix(in srgb, var(--tp-red) 40%, transparent 60%);
}
.tp-page--embedded .tp-portrait__step-guide-btn:disabled {
  background: color-mix(in srgb, var(--tp-panel) 78%, #ffffff 22%);
  border-color: color-mix(in srgb, var(--tp-embedded-border) 80%, transparent 20%);
  color: var(--tp-embedded-muted);
}
.tp-page--embedded .tp-portrait__step-guide-btn--secondary {
  background: color-mix(in srgb, var(--tp-gold) 14%, #ffffff 86%);
  border-color: color-mix(in srgb, var(--tp-gold) 22%, var(--tp-embedded-border) 78%);
  color: var(--tp-gold);
  box-shadow: none;
}
.tp-page--embedded .tp-portrait__step-guide-btn--secondary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tp-gold) 22%, #ffffff 78%);
  border-color: color-mix(in srgb, var(--tp-gold) 30%, var(--tp-embedded-border) 70%);
}
.tp-page--embedded .tp-portrait__step-guide-btn--ghost {
  background: rgba(255,255,255,0.72);
  border-color: color-mix(in srgb, var(--tp-embedded-border) 78%, transparent 22%);
  color: var(--tp-embedded-sub);
  box-shadow: none;
}
.tp-page--embedded .tp-portrait__step-guide-btn--ghost:hover:not(:disabled) {
  background: rgba(255,255,255,0.92);
  border-color: color-mix(in srgb, var(--tp-red) 18%, var(--tp-embedded-border) 82%);
}

/* ══════════════════════════════════════════
   打印 / 导出报告样式
══════════════════════════════════════════ */
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  :global(html),
  :global(body),
  :global(#app) {
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    background: #fff !important;
  }

  .tp-header,
  .tp-portrait__step-guide { display: none !important; }
  .tp-page {
    display: block !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    background: #fff !important;
  }
  .tp-portrait {
    flex: none !important;
    height: auto !important;
    min-height: unset !important;
    max-height: none !important;
    background: #fff !important;
    color: #1a1410 !important;
    overflow: visible !important;
    padding: 24px 32px !important;
    gap: 16px !important;
  }
  .tp-portrait__section-lbl { color: #5a4e42 !important; }
  .tp-portrait__header,
  .tp-portrait__viz-row,
  .tp-portrait__highlights,
  .tp-portrait__summary {
    background: #f9f6f0 !important;
    border-color: #d4c9b5 !important;
    color: #1a1410 !important;
  }
  .tp-portrait__score-card { background: #f0ece4 !important; border-color: #c4b9a6 !important; }
  .tp-portrait__score-val { color: #1a1410 !important; }
  .tp-portrait__score-card--completeness .tp-portrait__score-val { color: #3a7a3a !important; }
  .tp-portrait__score-card--competitiveness .tp-portrait__score-val { color: #8b2500 !important; }
  .tp-portrait__name { color: #1a1410 !important; }
  .tp-portrait__dim-label { color: #2a2018 !important; }
  .tp-portrait__dim-track { background: #d4c9b5 !important; }
  .tp-portrait__summary-text { color: #3a3028 !important; }
  .tp-portrait__self-summary { color: #5a4e42 !important; }
  .tp-portrait__honor-lbl { color: #3a3028 !important; }
  .tp-portrait__project-name { color: #1a1410 !important; }
  .tp-portrait__project-desc { color: #5a4e42 !important; -webkit-line-clamp: unset !important; line-clamp: unset !important; }
  .tp-portrait__dim-desc { color: #6a5e52 !important; }
  .tp-typing-cursor { display: none !important; }
  .tp-portrait__header,
  .tp-portrait__viz-row,
  .tp-portrait__project-card {
    break-inside: auto;
    page-break-inside: auto;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .tp-portrait__viz-row { grid-template-columns: 190px 1fr; gap: 12px; }
}
@media (max-width: 768px) {
  .tp-portrait { padding: 14px 14px; }
  .tp-portrait__viz-row { grid-template-columns: 1fr; }
  .tp-portrait__highlights-grid { grid-template-columns: 1fr; }
}
</style>
