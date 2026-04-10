<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'
import type { ReportRecord } from '@/types'
import BookPage from '@/components/book/BookPage.vue'
import { init as echartsInit, use as echartsUse } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { JOB_PORTRAITS, getGrowthPlan, type SevenDim } from '@/mock/careerReportData'
import type { AbilityDimension, PersonInfo } from '@/composables/useAgentPortrait'
import { useUserStore } from '@/stores'

echartsUse([RadarChart, TooltipComponent, SVGRenderer])

const props = defineProps<{
  visible: boolean
  record: ReportRecord | null
  type: 'portrait' | 'career' | null
  originX: number
  originY: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'remove', id: string): void
}>()

const bookRef = ref<HTMLDivElement | null>(null)
const pageRef = ref<HTMLDivElement | null>(null)
const radarEl = ref<HTMLDivElement | null>(null)

let timeline: gsap.core.Timeline | null = null
let isClosing = false
let radarChart: ReturnType<typeof echartsInit> | null = null

const userStore = useUserStore()

function toLevel(score: number): '优秀' | '良好' | '待提升' {
  return score >= 80 ? '优秀' : score >= 60 ? '良好' : '待提升'
}

// ── 个人能力画像：从 snapshot 解析，兼容旧 { name, score } 和新 AbilityDimension 格式 ──
const portraitSnap = computed(() => {
  if (!props.record || props.type !== 'portrait') return null
  const snap = props.record.snapshot as Record<string, unknown>

  // 解析维度数组：兼容旧格式 { name, score } 和新格式 AbilityDimension
  const rawDims = (snap.sevenDim as Array<Record<string, unknown>> | undefined) ?? []
  const dimensions: AbilityDimension[] = rawDims.map((d, i) => {
    const score = Number(d.score ?? 60)
    const label = String(d.label ?? d.name ?? `维度${i + 1}`)
    return {
      key: (d.key as AbilityDimension['key']) ?? ('dim' + i as AbilityDimension['key']),
      label,
      score,
      level: (d.level as AbilityDimension['level']) ?? toLevel(score),
      desc: String(d.desc ?? ''),
      source: (d.source as AbilityDimension['source']) ?? 'computed',
    }
  })

  const skillTags = (snap.skillTags as Array<{ name: string; weight: number; category: string }> | undefined) ?? []
  const competitivenessScore = Number(snap.competitivenessScore ?? snap.score ?? 0)
  const completenessScore = Number(snap.completenessScore ?? 70)

  // personInfo 优先从 snapshot 取，否则用 fallback
  const snapInfo = snap.personInfo as PersonInfo | undefined
  const userName = userStore.currentUser?.name ?? '同学'
  const predictedRole = String(snap.predictedRole ?? snap.role ?? '未知方向')
  const personInfo: PersonInfo = snapInfo ?? {
    name: userName,
    school: '某高等院校',
    major: '计算机科学与技术',
    grade: '大三',
    targetRole: predictedRole,
    gpa: undefined,
    honors: [],
    projects: [],
  }

  return {
    predictedRole,
    competitivenessScore: competitivenessScore > 1 ? competitivenessScore : Math.round(competitivenessScore * 100),
    completenessScore: completenessScore > 1 ? completenessScore : Math.round(completenessScore * 100),
    dimensions,
    skillTags,
    personInfo,
  }
})

function lvColor(score: number): string {
  return score >= 80 ? 'rgba(94,179,107,0.95)' : score >= 60 ? 'rgba(212,168,85,0.95)' : 'rgba(200,100,90,0.95)'
}

function initPortraitRadar() {
  if (!radarEl.value || !portraitSnap.value?.dimensions.length) return
  if (radarChart) { radarChart.dispose(); radarChart = null }
  radarChart = echartsInit(radarEl.value, undefined, { renderer: 'svg' })
  const dims = portraitSnap.value.dimensions
  radarChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(14,8,3,0.97)',
      borderColor: 'rgba(212,201,181,0.18)',
      padding: [8, 12],
      textStyle: { color: 'rgba(220,205,185,0.9)', fontSize: 11 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        if (!p?.value) return ''
        return dims.map((d, i) => {
          const s = (p.value as number[])[i] ?? 0
          return `<div style="display:flex;align-items:center;gap:8px;padding:2px 0"><span style="color:rgba(180,165,140,0.7);font-size:10px;min-width:48px">${d.label}</span><span style="color:${lvColor(s)};font-weight:600;font-size:12px">${s}</span></div>`
        }).join('')
      },
    },
    radar: {
      indicator: dims.map(d => ({ name: d.label, max: 100 })),
      shape: 'polygon', center: ['50%', '50%'], radius: '62%', splitNumber: 5, nameGap: 8,
      axisName: {
        formatter: (name: string) => {
          const d = dims.find(x => x.label === name)
          if (!d) return name
          return d.score >= 80 ? `{g|${name}}` : d.score >= 60 ? `{m|${name}}` : `{r|${name}}`
        },
        rich: {
          g: { color: 'rgba(94,179,107,0.9)', fontSize: 10, fontWeight: '600' },
          m: { color: 'rgba(212,168,85,0.9)', fontSize: 10, fontWeight: '600' },
          r: { color: 'rgba(200,100,90,0.9)', fontSize: 10, fontWeight: '600' },
        },
      },
      splitArea: { show: true, areaStyle: { color: ['rgba(200,85,74,0.12)','rgba(200,85,74,0.08)','rgba(212,168,85,0.06)','rgba(212,168,85,0.07)','rgba(94,159,107,0.10)'] } },
      splitLine: { lineStyle: { color: 'rgba(212,201,181,0.10)', width: 1 } },
      axisLine:  { lineStyle: { color: 'rgba(212,201,181,0.10)' } },
    },
    series: [{
      type: 'radar',
      data: [{ value: dims.map(d => d.score), name: '能力雷达',
        areaStyle: { color: 'rgba(139,37,0,0.20)' },
        lineStyle: { color: 'rgba(180,60,20,0.85)', width: 2 },
        itemStyle: { color: 'rgba(200,80,30,0.9)' },
        symbolSize: 5,
        label: { show: true, formatter: (p: any) => `${p.value}`, fontSize: 9, fontWeight: '600',
          color: 'rgba(230,210,185,0.95)', backgroundColor: 'rgba(14,8,3,0.65)', borderRadius: 2, padding: [1,3] },
      }],
      animation: true, animationDuration: 900, animationEasing: 'cubicOut',
    }],
  })
}

function disposePortraitRadar() {
  radarChart?.dispose()
  radarChart = null
}

onBeforeUnmount(() => disposePortraitRadar())

// ── 职业生涯发展报告数据 ──
const DIM_NAMES = ['专业技能', '证书资质', '创新能力', '学习能力', '抗压能力', '沟通能力', '实习经验'] as const

function deriveLevelInfo(score: number): { label: string; desc: string; color: string } {
  if (score >= 80) return { label: '竞争力强', desc: '技能覆盖优于同方向多数应届生，可积极投递', color: 'var(--bamboo-green, #4A6741)' }
  if (score >= 60) return { label: '进阶阶段', desc: '技能栈基本完善，建议深耕重点领域并增加项目经验', color: 'var(--color-secondary)' }
  if (score >= 40) return { label: '成长阶段', desc: '已具备入门能力，关键差距在实战项目经验与工程化能力', color: 'var(--color-gold)' }
  return { label: '起步阶段', desc: '核心技能尚在积累，建议完成基础课程后再下一步', color: 'var(--color-primary)' }
}

const selectedCareerJob = computed(() => {
  if (!props.record || props.type !== 'career') return null
  const snap = props.record.snapshot as Record<string, unknown>
  const selectedId = String(snap.selectedJobId ?? '')
  if (selectedId) return JOB_PORTRAITS.find(job => job.id === selectedId) ?? null
  const roleSet = new Set(((snap.targetRoles as string[]) ?? []).map(v => String(v)))
  if (roleSet.size === 0) return null
  return JOB_PORTRAITS.find(job => Array.from(roleSet).some(role => job.title.includes(role))) ?? null
})

const careerRadarData = computed(() => {
  if (!props.record || props.type !== 'career') return []
  const snap = props.record.snapshot as Record<string, unknown>
  const studentDim = (snap.studentDimSnapshot as Partial<Record<(typeof DIM_NAMES)[number], number>> | undefined) ?? {}
  const jobDim = selectedCareerJob.value?.sevenDim
  return DIM_NAMES.map(name => {
    const mine = Number(studentDim[name] ?? 45)
    const need = Number((jobDim?.[name as keyof SevenDim]) ?? Math.min(92, mine + 14))
    return { axis: name, value: Math.max(0, Math.min(100, mine)), ref: Math.max(0, Math.min(100, need)) }
  })
})

const careerGaps = computed(() =>
  careerRadarData.value.map(item => ({
    name: item.axis, mine: item.value, need: item.ref ?? item.value, gap: (item.ref ?? item.value) - item.value,
  }))
)

const careerGrowthPlan = computed(() => {
  if (!selectedCareerJob.value) return []
  return getGrowthPlan(selectedCareerJob.value.id)
})

const careerSummary = computed(() => {
  if (!props.record || props.type !== 'career') return null
  const snap = props.record.snapshot as Record<string, unknown>
  const raw = Number(snap.topMatchScore ?? 0)
  const pct = raw > 1 ? raw : Math.round(raw * 100)
  return { topMatch: pct, roles: (snap.targetRoles as string[]) ?? [], level: deriveLevelInfo(pct) }
})

// ── 动画 ──
function runEnter() {
  if (!bookRef.value || !pageRef.value) return
  const dx = props.originX - window.innerWidth / 2
  const dy = props.originY - window.innerHeight / 2
  gsap.set(bookRef.value, { x: dx, y: dy, scale: 0.28, opacity: 0.9, rotate: -6 })
  gsap.set(pageRef.value, { opacity: 0, y: 12 })
  timeline?.kill()
  timeline = gsap.timeline({
    onComplete: () => {
      if (props.type === 'portrait') {
        nextTick().then(() => setTimeout(initPortraitRadar, 60))
      }
    }
  })
    .to(bookRef.value, { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
    .to(pageRef.value, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.18')
}

function closeWithAnim() {
  if (isClosing || !bookRef.value || !pageRef.value) { emit('close'); return }
  isClosing = true
  disposePortraitRadar()
  timeline?.kill()
  gsap.timeline({ onComplete: () => { isClosing = false; emit('close') } })
    .to(pageRef.value, { opacity: 0, y: 10, duration: 0.18, ease: 'power1.in' })
    .to(bookRef.value, { opacity: 0, scale: 0.86, duration: 0.22, ease: 'power2.in' })
}

function removeRecord() {
  if (!props.record) return
  emit('remove', props.record.id)
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) { await nextTick(); runEnter() }
    else { disposePortraitRadar(); timeline?.kill() }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="visible && record" class="open-overlay">
        <button class="overlay-mask" aria-label="关闭报告" @click="closeWithAnim"></button>

        <div ref="bookRef" class="open-book-shell">
          <div ref="pageRef" class="open-book-page" :class="{ 'open-book-page--portrait': type === 'portrait' }">
            <BookPage :chapter-name="record.title" :show-footer="false" :show-corners="type !== 'portrait'">
              <div class="detail-head">
                <span class="detail-date">{{ record.createdAt }}</span>
                <span class="detail-sub">{{ type === 'portrait' ? '个人能力画像报告' : '职业生涯发展报告' }}</span>
                <button class="icon-btn icon-btn--danger" title="删除报告" @click="removeRecord">
                  <Icon icon="lucide:trash-2" :width="14" />
                  删除报告
                </button>
                <button class="icon-btn" title="关闭" @click="closeWithAnim">
                  <Icon icon="lucide:x" :width="14" />
                  关闭
                </button>
              </div>

              <template v-if="type === 'portrait' && portraitSnap">
                <!-- [A] 个人信息头部 -->
                <div class="port-profile">
                  <div class="port-profile__header">
                    <div class="port-avatar">{{ portraitSnap.personInfo.name.charAt(0) }}</div>
                    <div class="port-profile__info">
                      <div class="port-profile__name-row">
                        <span class="port-profile__name">{{ portraitSnap.personInfo.name }}</span>
                        <span class="port-badge port-badge--grade">{{ portraitSnap.personInfo.grade }}</span>
                        <span class="port-badge port-badge--role">{{ portraitSnap.personInfo.targetRole }}</span>
                      </div>
                      <div class="port-profile__school-row">
                        <Icon icon="lucide:school" :width="10" class="port-meta-icon"/>
                        <span>{{ portraitSnap.personInfo.school }}</span>
                        <span class="port-sep">·</span>
                        <span>{{ portraitSnap.personInfo.major }}</span>
                        <template v-if="portraitSnap.personInfo.gpa">
                          <span class="port-sep">·</span>
                          <span>GPA {{ portraitSnap.personInfo.gpa }}</span>
                        </template>
                      </div>
                    </div>
                  </div>

                  <!-- [B] 评分横幅 -->
                  <div class="port-scores">
                    <div class="port-score-card port-score-card--complete">
                      <span class="port-score-val">{{ portraitSnap.completenessScore }}<em>%</em></span>
                      <span class="port-score-lbl">完整度</span>
                    </div>
                    <div class="port-score-card port-score-card--comp">
                      <span class="port-score-val">{{ portraitSnap.competitivenessScore }}<em>分</em></span>
                      <span class="port-score-lbl">竞争力</span>
                    </div>
                    <div class="port-score-card port-score-card--honors">
                      <div class="port-honors-row">
                        <span class="port-honor-item">
                          <Icon icon="lucide:award" :width="10"/>
                          <strong>{{ portraitSnap.personInfo.honors.filter(h => h.type === 'cert').length }}</strong> 证书
                        </span>
                        <span class="port-honor-item">
                          <Icon icon="lucide:briefcase" :width="10"/>
                          <strong>{{ portraitSnap.personInfo.honors.filter(h => h.type === 'intern').length }}</strong> 实习
                        </span>
                        <span class="port-honor-item">
                          <Icon icon="lucide:trophy" :width="10"/>
                          <strong>{{ portraitSnap.personInfo.honors.filter(h => h.type === 'award').length }}</strong> 获奖
                        </span>
                      </div>
                      <span class="port-score-lbl">荣誉档案</span>
                    </div>
                  </div>
                </div>

                <!-- [C] 雷达图 + 尺度条 -->
                <div class="port-viz-row">
                  <div ref="radarEl" class="port-radar"></div>
                  <div class="port-dims">
                    <div
                      v-for="dim in portraitSnap.dimensions"
                      :key="(dim.key ?? '') + dim.label"
                      class="port-dim-item"
                    >
                      <div class="port-dim-top">
                        <span class="port-dim-label">{{ dim.label }}</span>
                        <span class="port-dim-badge" :class="`port-dim-badge--${dim.level === '优秀' ? 'good' : dim.level === '良好' ? 'mid' : 'low'}`">{{ dim.level }}</span>
                      </div>
                      <div class="port-dim-bar-wrap">
                        <div class="port-dim-track">
                          <div class="port-dim-bar" :style="{ width: dim.score + '%' }" :class="`port-dim-bar--${dim.level === '优秀' ? 'good' : dim.level === '良好' ? 'mid' : 'low'}`"></div>
                        </div>
                        <span class="port-dim-score">{{ dim.score }}</span>
                      </div>
                      <p v-if="dim.desc" class="port-dim-desc">{{ dim.desc }}</p>
                    </div>

                    <!-- 技能标签 -->
                    <div v-if="portraitSnap.skillTags.length" class="port-tags-wrap">
                      <span class="port-tags-lbl">技能清单</span>
                      <div class="port-tags">
                        <span
                          v-for="tag in portraitSnap.skillTags"
                          :key="tag.name"
                          class="port-tag"
                          :class="`port-tag--${tag.category === '前端' ? 'fe' : tag.category === '后端' ? 'be' : tag.category === '测试' ? 'qa' : (['数据','机器学习'].includes(tag.category)) ? 'data' : 'gen'}`"
                          :style="{ opacity: 0.55 + tag.weight * 0.45, fontSize: (9 + tag.weight * 3) + 'px' }"
                        >{{ tag.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- [D] 经历亮点 -->
                <div v-if="portraitSnap.personInfo.honors.length || portraitSnap.personInfo.projects.length" class="port-highlights">
                  <span class="port-section-lbl">经历亮点</span>
                  <div class="port-highlights-grid">
                    <div v-if="portraitSnap.personInfo.honors.length" class="port-highlights-col">
                      <div
                        v-for="h in portraitSnap.personInfo.honors" :key="h.label"
                        class="port-honor-card"
                        :class="`port-honor-card--${h.type}`"
                      >
                        <Icon :icon="h.type === 'cert' ? 'lucide:award' : h.type === 'intern' ? 'lucide:briefcase' : 'lucide:trophy'" :width="12" class="port-honor-icon"/>
                        <span>{{ h.label }}</span>
                      </div>
                    </div>
                    <div v-if="portraitSnap.personInfo.projects.length" class="port-highlights-col">
                      <div
                        v-for="(proj, i) in portraitSnap.personInfo.projects" :key="i"
                        class="port-project-card"
                      >
                        <div class="port-project-accent"></div>
                        <div class="port-project-body">
                          <div class="port-project-head">
                            <span class="port-project-name">{{ proj.name }}</span>
                            <span class="port-project-role">{{ proj.role }}</span>
                          </div>
                          <p class="port-project-desc">{{ proj.desc }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="type === 'career' && careerSummary">
                <div class="level-banner" :style="{ borderLeftColor: careerSummary.level.color }">
                  <div class="level-banner__left">
                    <span class="level-label" :style="{ color: careerSummary.level.color }">{{ careerSummary.level.label }}</span>
                    <span class="level-role">匹配度 {{ careerSummary.topMatch }}%</span>
                  </div>
                  <p class="level-desc">{{ careerSummary.level.desc }}</p>
                </div>

                <div v-if="selectedCareerJob" class="career-hero">
                  <span class="career-job">{{ selectedCareerJob.title }}</span>
                  <span class="career-salary">{{ selectedCareerJob.salaryRange }}</span>
                  <p class="career-desc">{{ selectedCareerJob.desc }}</p>
                </div>

                <div v-if="careerRadarData.length" class="mini-radar-wrap">
                  <D3RadarChart
                    :data="careerRadarData"
                    :ghost-data="[]"
                    :width="320"
                    :height="220"
                    :show-legend="false"
                  />
                </div>

                <div v-if="careerGaps.length" class="gap-wrap">
                  <span class="snapshot-label">岗位差距</span>
                  <div class="gap-list">
                    <div v-for="item in careerGaps" :key="item.name" class="gap-row">
                      <span class="gap-label">{{ item.name }}</span>
                      <div class="gap-track">
                        <div class="gap-fill gap-fill--mine" :style="{ width: item.mine + '%' }"></div>
                        <div v-if="item.gap > 0" class="gap-fill gap-fill--need" :style="{ width: item.gap + '%', left: item.mine + '%' }"></div>
                      </div>
                      <span class="gap-num" :class="{ 'gap-num--ok': item.gap <= 0 }">{{ item.gap > 0 ? `-${item.gap}` : `+${Math.abs(item.gap)}` }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="careerGrowthPlan.length" class="plan-wrap">
                  <span class="snapshot-label">成长计划</span>
                  <div class="plan-list">
                    <div v-for="phase in careerGrowthPlan" :key="phase.phase" class="plan-item">
                      <div class="plan-head">
                        <span class="plan-phase">{{ phase.phaseLabel }}</span>
                        <span class="plan-goal">{{ phase.goal }}</span>
                      </div>
                      <ul class="plan-tasks">
                        <li v-for="(task, idx) in phase.tasks.slice(0, 3)" :key="idx">{{ task }}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div v-if="careerSummary.roles.length" class="dims-preview">
                  <span class="snapshot-label">关注方向</span>
                  <div class="dims-list">
                    <span v-for="role in careerSummary.roles" :key="role" class="dim-tag">{{ role }}</span>
                  </div>
                </div>
              </template>
            </BookPage>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.open-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
}

.overlay-mask {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(12, 10, 8, 0.68);
  backdrop-filter: blur(4px);
}

.open-book-shell {
  position: relative;
  width: min(940px, 92vw);
  height: min(720px, 88vh);
  z-index: 2;
}

.open-book-page {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  overflow: hidden;
  background: var(--parchment-100);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
}

.open-book-page--portrait {
  background: #0E0805;
  color: rgba(220, 205, 185, 0.9);
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.detail-date {
  font-size: 0.75rem;
  color: var(--color-text-subtle);
  font-family: var(--font-latin, monospace);
}

.detail-sub {
  font-size: 0.76rem;
  color: var(--color-text-muted);
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-background);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  padding: 0.24rem 0.62rem;
  cursor: pointer;
}

.icon-btn:hover {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.icon-btn--danger:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.mini-radar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.gauge-wrap {
  margin-bottom: 0.85rem;
}

.level-banner {
  border-left: 4px solid var(--color-secondary);
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-surface) 78%, transparent);
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.8rem;
}

.level-banner__left {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.25rem;
}

.level-label {
  font-family: var(--font-title);
  font-size: 0.85rem;
}

.level-role {
  font-size: 0.76rem;
  color: var(--color-text-subtle);
}

.level-desc {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.dims-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.snapshot-label {
  font-size: 0.72rem;
  color: var(--color-text-subtle);
  letter-spacing: 0.08em;
}

.dims-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dim-tag {
  font-size: 0.74rem;
  padding: 0.2rem 0.55rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
}

.career-hero {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-surface) 76%, transparent);
  padding: 0.52rem 0.65rem;
  margin-bottom: 0.8rem;
}

.career-job {
  font-family: var(--font-title);
  font-size: 0.84rem;
  color: var(--color-text);
}

.career-salary {
  margin-left: 0.45rem;
  font-size: 0.72rem;
  color: var(--color-secondary);
}

.career-desc {
  margin: 0.32rem 0 0;
  font-size: 0.74rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.gap-wrap,
.plan-wrap {
  margin-bottom: 0.85rem;
}

.gap-list {
  display: flex;
  flex-direction: column;
  gap: 0.34rem;
}

.gap-row {
  display: grid;
  grid-template-columns: 58px 1fr 42px;
  align-items: center;
  gap: 0.38rem;
}

.gap-label {
  font-size: 0.69rem;
  color: var(--color-text-subtle);
}

.gap-track {
  position: relative;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-border) 50%, transparent);
}

.gap-fill {
  position: absolute;
  top: 0;
  bottom: 0;
}

.gap-fill--mine {
  left: 0;
  background: var(--color-primary);
}

.gap-fill--need {
  background: var(--color-secondary);
}

.gap-num {
  font-size: 0.68rem;
  text-align: right;
  color: var(--color-primary);
}

.gap-num--ok {
  color: var(--bamboo-green, #4A6741);
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 0.46rem;
}

.plan-item {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-surface) 70%, transparent);
  padding: 0.45rem 0.54rem;
}

.plan-head {
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.plan-phase {
  font-size: 0.72rem;
  color: var(--color-secondary);
  font-weight: 600;
}

.plan-goal {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.plan-tasks {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

/* ── 个人能力画像：深色主题样式 ── */
.port-profile {
  margin-bottom: 0.65rem;
}

.port-profile__header {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}

.port-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(180, 60, 20, 0.75);
  border: 2px solid rgba(212, 168, 85, 0.40);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(230, 210, 185, 0.95);
  flex-shrink: 0;
}

.port-profile__info {
  flex: 1;
  min-width: 0;
}

.port-profile__name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.22rem;
}

.port-profile__name {
  font-size: 1.05rem;
  font-weight: 600;
  color: rgba(230, 215, 190, 0.95);
}

.port-badge {
  font-size: 0.62rem;
  padding: 0.07rem 0.4rem;
  border-radius: 2px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.port-badge--grade {
  background: rgba(212, 168, 85, 0.15);
  color: rgba(212, 168, 85, 0.9);
  border: 1px solid rgba(212, 168, 85, 0.25);
}

.port-badge--role {
  background: rgba(180, 60, 20, 0.20);
  color: rgba(220, 130, 80, 0.9);
  border: 1px solid rgba(200, 100, 60, 0.25);
}

.port-profile__school-row {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  flex-wrap: wrap;
  font-size: 0.68rem;
  color: rgba(160, 145, 120, 0.75);
}

.port-meta-icon {
  opacity: 0.6;
  flex-shrink: 0;
}

.port-sep {
  color: rgba(140, 125, 100, 0.5);
}

.port-score-card--honors {
  background: rgba(40, 30, 15, 0.55);
  border: 1px solid rgba(212, 168, 85, 0.22);
}

.port-honors-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.1rem;
}

.port-honor-item {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  font-size: 0.68rem;
  color: rgba(190, 170, 130, 0.8);
}

.port-honor-item strong {
  font-weight: 600;
  color: rgba(212, 168, 85, 0.95);
}

.port-highlights {
  margin-top: 0.55rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(212, 201, 181, 0.10);
}

.port-section-lbl {
  font-size: 0.65rem;
  color: rgba(160, 145, 120, 0.55);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 0.4rem;
}

.port-highlights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.port-highlights-col {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.port-honor-card {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
  color: rgba(200, 185, 160, 0.85);
  border: 1px solid rgba(212, 201, 181, 0.10);
  background: rgba(30, 20, 10, 0.40);
}

.port-honor-card--cert  { border-left: 2px solid rgba(212, 168, 85, 0.50); }
.port-honor-card--intern { border-left: 2px solid rgba(100, 160, 200, 0.50); }
.port-honor-card--award  { border-left: 2px solid rgba(200, 100, 60, 0.50); }

.port-honor-icon {
  opacity: 0.7;
  flex-shrink: 0;
}

.port-project-card {
  display: flex;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(212, 201, 181, 0.10);
  background: rgba(30, 20, 10, 0.40);
}

.port-project-accent {
  width: 3px;
  flex-shrink: 0;
  background: rgba(180, 60, 20, 0.65);
}

.port-project-body {
  padding: 0.3rem 0.45rem;
  flex: 1;
}

.port-project-head {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.15rem;
}

.port-project-name {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(220, 205, 185, 0.9);
}

.port-project-role {
  font-size: 0.6rem;
  padding: 0.05rem 0.28rem;
  border-radius: 2px;
  background: rgba(180, 60, 20, 0.15);
  color: rgba(200, 130, 80, 0.85);
  border: 1px solid rgba(180, 60, 20, 0.20);
}

.port-project-desc {
  margin: 0;
  font-size: 0.64rem;
  color: rgba(150, 135, 110, 0.7);
  line-height: 1.4;
}

.port-scores {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
  margin-bottom: 0.7rem;
}

.port-score-card {
  border-radius: 4px;
  padding: 0.55rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.port-score-card--comp {
  background: rgba(30, 80, 40, 0.55);
  border: 1px solid rgba(94, 179, 107, 0.30);
}

.port-score-card--complete {
  background: rgba(20, 30, 60, 0.55);
  border: 1px solid rgba(80, 130, 200, 0.30);
}

.port-score-card--role {
  background: rgba(60, 20, 10, 0.55);
  border: 1px solid rgba(200, 100, 60, 0.30);
  justify-content: center;
}

.port-score-val {
  font-size: 1.4rem;
  font-weight: 600;
  color: rgba(230, 215, 190, 0.95);
  line-height: 1.1;
}

.port-score-val em {
  font-style: normal;
  font-size: 0.65rem;
  font-weight: 400;
  color: rgba(180, 165, 140, 0.7);
  margin-left: 2px;
}

.port-score-role {
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(230, 160, 100, 0.9);
}

.port-score-lbl {
  font-size: 0.65rem;
  color: rgba(160, 145, 120, 0.7);
  letter-spacing: 0.06em;
}

.port-viz-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0.6rem;
  align-items: start;
}

.port-radar {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}

.port-dims {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  overflow-y: auto;
  max-height: 400px;
  scrollbar-width: thin;
  scrollbar-color: rgba(100,80,60,0.3) transparent;
}

.port-dim-item {
  padding: 0.28rem 0.4rem;
  border-radius: 3px;
  background: rgba(30, 20, 10, 0.35);
  border: 1px solid rgba(212, 201, 181, 0.08);
}

.port-dim-top {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.22rem;
}

.port-dim-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(220, 205, 185, 0.9);
  flex: 1;
}

.port-dim-badge {
  font-size: 0.62rem;
  padding: 0.08rem 0.35rem;
  border-radius: 2px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.port-dim-badge--good {
  background: rgba(94, 179, 107, 0.20);
  color: rgba(94, 179, 107, 0.95);
  border: 1px solid rgba(94, 179, 107, 0.25);
}

.port-dim-badge--mid {
  background: rgba(212, 168, 85, 0.15);
  color: rgba(212, 168, 85, 0.95);
  border: 1px solid rgba(212, 168, 85, 0.20);
}

.port-dim-badge--low {
  background: rgba(200, 100, 90, 0.15);
  color: rgba(200, 100, 90, 0.95);
  border: 1px solid rgba(200, 100, 90, 0.20);
}

.port-dim-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.18rem;
}

.port-dim-track {
  flex: 1;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.port-dim-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.port-dim-bar--good { background: rgba(94, 179, 107, 0.85); }
.port-dim-bar--mid  { background: rgba(212, 168, 85, 0.85); }
.port-dim-bar--low  { background: rgba(200, 100, 90, 0.85); }

.port-dim-score {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(200, 185, 160, 0.8);
  min-width: 22px;
  text-align: right;
}

.port-dim-desc {
  margin: 0;
  font-size: 0.66rem;
  color: rgba(160, 145, 120, 0.7);
  line-height: 1.4;
}

.port-tags-wrap {
  padding-top: 0.4rem;
  margin-top: 0.2rem;
  border-top: 1px solid rgba(212, 201, 181, 0.08);
}

.port-tags-lbl {
  font-size: 0.62rem;
  color: rgba(160, 145, 120, 0.6);
  letter-spacing: 0.08em;
  display: block;
  margin-bottom: 0.35rem;
}

.port-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
}

.port-tag {
  padding: 0.16rem 0.45rem;
  border-radius: 2px;
  font-family: var(--font-latin, monospace);
  letter-spacing: 0.02em;
  border: 1px solid;
}

.port-tag--fe   { color: rgba(180, 120, 80, 0.9);  border-color: rgba(180, 120, 80, 0.25);  background: rgba(180, 120, 80, 0.08); }
.port-tag--be   { color: rgba(100, 160, 200, 0.9); border-color: rgba(100, 160, 200, 0.25); background: rgba(100, 160, 200, 0.08); }
.port-tag--qa   { color: rgba(140, 190, 140, 0.9); border-color: rgba(140, 190, 140, 0.25); background: rgba(140, 190, 140, 0.08); }
.port-tag--data { color: rgba(200, 165, 80, 0.9);  border-color: rgba(200, 165, 80, 0.25);  background: rgba(200, 165, 80, 0.08); }
.port-tag--gen  { color: rgba(180, 165, 140, 0.7); border-color: rgba(180, 165, 140, 0.15); background: rgba(180, 165, 140, 0.05); }

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .open-book-shell {
    width: 94vw;
    height: 86vh;
  }

  .rpt-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
