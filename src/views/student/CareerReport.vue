<!-- 页面：职业生涯发展报告；路由：student/career-report；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores'
import {
  JOB_PORTRAITS, CAREER_PATH_EDGES,
  deriveStudentSevenDim, getGrowthPlan,
  type JobPortrait, type JobLevel,
} from '@/mock/careerReportData'
import * as echarts from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([RadarChart, TooltipComponent, LegendComponent, SVGRenderer])

const router = useRouter()
const resumeStore = useResumeStore()
const userStore = useUserStore()

/* ══ 选中与界面状态 ══ */
const selectedJobId = ref<string>('')
const showDrawer = ref(false)
const editingReport = ref(false)
const reportTextEditable = ref('')
const radarEl = ref<HTMLElement | null>(null)
let radarChart: echarts.ECharts | null = null

/* ══ 定常配置 ══ */
const DIM_NAMES = ['专业技能', '证书资质', '创新能力', '学习能力', '抗压能力', '沟通能力', '实习经验'] as const

const LINE_COLORS: Record<string, string> = {
  frontend: '#C4622D', data: '#B8962E', qa: '#3A8A7A', fullstack: '#6A5B8A',
}

const LEVEL_ORDER: Record<JobLevel, number> = {
  intern: 0, junior: 1, mid: 2, senior: 3, lead: 4, expert: 5,
}

/* ══ 推荐岗位（来自 resumeStore 匹配结果）══ */
const recommendedIds = computed<Set<string>>(() => {
  const matched = resumeStore.matchedCareers
  const roleToIds: Record<string, string[]> = {
    '前端开发': ['fe-junior', 'fe-mid', 'fe-senior'],
    '后端开发': ['fullstack', 'fe-mid'],
    '测试开发': ['qa-junior', 'qa-senior'],
    '数据分析': ['da-junior', 'da-mid'],
    '机器学习工程师': ['ml-engineer', 'da-mid'],
  }
  const ids = new Set<string>()
  if (!matched.length) {
    ;['fe-mid', 'fe-junior', 'da-junior', 'qa-junior', 'fullstack'].forEach(id => ids.add(id))
  } else {
    for (const c of matched.slice(0, 3)) {
      ;(roleToIds[c.role] ?? []).slice(0, 2).forEach(id => ids.add(id))
    }
  }
  return ids
})

const selectedJob = computed(() => JOB_PORTRAITS.find(j => j.id === selectedJobId.value) ?? null)

/* ══ 学生七维 ══ */
const studentDim = computed(() => {
  const skills = resumeStore.parsedSkills
  const confidence = resumeStore.insights?.confidence ?? 0.5
  return deriveStudentSevenDim(skills, confidence)
})

/* ══ 成长计划 ══ */
const growthPlan = computed(() => selectedJobId.value ? getGrowthPlan(selectedJobId.value) : [])

/* ══ 气泡图布局 ══ */
type BubbleItem = { job: JobPortrait; x: number; y: number; r: number; isCenter: boolean }

const BB_W = 300, BB_H = 220

const bubbleLayout = computed<BubbleItem[]>(() => {
  const sorted = [...JOB_PORTRAITS]
    .map(j => ({ ...j, matchScore: recommendedIds.value.has(j.id) ? j.matchScore : j.matchScore * 0.65 }))
    .sort((a, b) => b.matchScore - a.matchScore)
  const cx = BB_W / 2, cy = BB_H / 2
  const items: BubbleItem[] = []
  const center = sorted[0]
  if (!center) return items
  items.push({ job: center, x: cx, y: cy, r: Math.round(16 + center.matchScore * 36), isCenter: true })
  const rest = sorted.slice(1)
  const n = rest.length
  rest.forEach((job, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const dist = 90 + (1 - job.matchScore) * 25
    items.push({
      job, isCenter: false,
      x: Math.round(cx + dist * Math.cos(angle)),
      y: Math.round(cy + dist * Math.sin(angle)),
      r: Math.round(10 + job.matchScore * 22),
    })
  })
  return items
})

/* ══ 竖向流程图布局 ══ */
type FlowNode = JobPortrait & { x: number; y: number }
type SkillDot = { x: number; y: number; label: string; side: 'left' | 'right' }
type FlowEdgeLayout = { fromNode: FlowNode; toNode: FlowNode; type: 'promote' | 'transfer'; skills: string[]; dots: SkillDot[] }

const FC_W = 290, FC_H = 520

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

const flowLayout = computed<{ nodes: FlowNode[]; edges: FlowEdgeLayout[] }>(() => {
  if (!selectedJobId.value) return { nodes: [], edges: [] }
  const nodeMap = new Map<string, FlowNode>()
  const visited = new Set<string>()

  function addNode(id: string, x: number) {
    if (nodeMap.has(id)) return
    const job = JOB_PORTRAITS.find(j => j.id === id)
    if (!job) return
    nodeMap.set(id, { ...job, x, y: 0 })
  }

  addNode(selectedJobId.value, FC_W / 2)

  const queue: { id: string; depth: number }[] = [{ id: selectedJobId.value, depth: 0 }]
  while (queue.length) {
    const curr = queue.shift()!
    if (visited.has(curr.id) || curr.depth >= 3) continue
    visited.add(curr.id)
    const parent = nodeMap.get(curr.id)
    if (!parent) continue
    const outgoing = CAREER_PATH_EDGES.filter(e => e.fromId === curr.id)
    const promotions = outgoing.filter(e => e.type === 'promote')
    const transfers = outgoing.filter(e => e.type === 'transfer')
    for (const edge of promotions) {
      if (!nodeMap.has(edge.toId)) {
        addNode(edge.toId, parent.x)
        queue.push({ id: edge.toId, depth: curr.depth + 1 })
      }
    }
    transfers.forEach((edge, i) => {
      if (!nodeMap.has(edge.toId)) {
        const sign = i % 2 === 0 ? -1 : 1
        const off = Math.ceil((i + 1) / 2) * 130
        addNode(edge.toId, parent.x + sign * off)
        queue.push({ id: edge.toId, depth: curr.depth + 1 })
      }
    })
  }

  const nodes = [...nodeMap.values()]
  if (!nodes.length) return { nodes: [], edges: [] }

  const levels = nodes.map(n => LEVEL_ORDER[n.level as JobLevel] ?? 0)
  const minLvl = Math.min(...levels), maxLvl = Math.max(...levels)
  const pad = 60
  const range = FC_H - 2 * pad

  for (const node of nodes) {
    const lvl = LEVEL_ORDER[node.level as JobLevel] ?? 0
    node.y = maxLvl === minLvl
      ? FC_H / 2
      : FC_H - pad - ((lvl - minLvl) / (maxLvl - minLvl)) * range
  }

  const edges: FlowEdgeLayout[] = []
  for (const edge of CAREER_PATH_EDGES) {
    const fn = nodeMap.get(edge.fromId)
    const tn = nodeMap.get(edge.toId)
    if (!fn || !tn) continue
    const dx = tn.x - fn.x, dy = tn.y - fn.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const nx = len > 0 ? -dy / len : 0
    const ny = len > 0 ? dx / len : 1
    const shown = edge.skills.slice(0, 6)
    const dots: SkillDot[] = shown.map((label, i) => {
      const t = (i + 1) / (shown.length + 1)
      const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right'
      const offset = 18 * (side === 'left' ? -1 : 1)
      return { label, side, x: Math.round(lerp(fn.x, tn.x, t) + nx * offset), y: Math.round(lerp(fn.y, tn.y, t) + ny * offset) }
    })
    edges.push({ fromNode: fn, toNode: tn, type: edge.type, skills: edge.skills, dots })
  }

  return { nodes, edges }
})

/* ══ 差距数值 ══ */
const dimGaps = computed(() => {
  if (!selectedJob.value) return []
  return DIM_NAMES.map(name => {
    const mine = studentDim.value[name]
    const need = selectedJob.value!.sevenDim[name]
    return { name, mine, need, gap: need - mine }
  })
})

/* ══ 雷达图 ══ */
function buildRadarOption() {
  const job = selectedJob.value
  if (!job) return null
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: 'rgba(212,201,181,0.65)', fontSize: 10 }, data: ['我的能力', '岗位要求'] },
    radar: {
      indicator: DIM_NAMES.map(name => ({ name, max: 100 })),
      radius: '58%', center: ['50%', '46%'], splitNumber: 4,
      axisName: { color: 'rgba(212,201,181,0.7)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(212,201,181,0.1)' } },
      splitArea: { areaStyle: { color: ['rgba(30,20,10,0.2)', 'rgba(30,20,10,0.08)'] } },
      axisLine: { lineStyle: { color: 'rgba(212,201,181,0.12)' } },
    },
    series: [{ type: 'radar', data: [
      { value: DIM_NAMES.map(n => studentDim.value[n]), name: '我的能力',
        lineStyle: { color: '#C4622D', width: 1.5 }, areaStyle: { color: 'rgba(196,98,45,0.18)' }, itemStyle: { color: '#C4622D' } },
      { value: DIM_NAMES.map(n => job.sevenDim[n]), name: '岗位要求',
        lineStyle: { color: '#B8962E', width: 1.5, type: 'dashed' }, areaStyle: { color: 'rgba(184,150,46,0.1)' }, itemStyle: { color: '#B8962E' } },
    ] }],
  }
}

function initRadarChart() {
  if (!radarEl.value) return
  radarChart?.dispose()
  radarChart = echarts.init(radarEl.value, undefined, { renderer: 'svg' })
  const opt = buildRadarOption()
  if (opt) radarChart.setOption(opt)
}

watch(selectedJob, async () => { if (selectedJob.value) { await nextTick(); initRadarChart() } })
watch(radarEl, el => { if (el && selectedJob.value) initRadarChart() })

/* ══ 智能汇报 ══ */
const reportText = computed(() => {
  const job = selectedJob.value
  const user = userStore.currentUser?.name ?? '同学'
  if (!job) return ''
  const gaps = dimGaps.value.filter(d => d.gap > 0).map(d => `${d.name}（差 ${d.gap} 分）`).join('、') || '无明显差距'
  const plan = growthPlan.value.map(s => `**${s.phaseLabel}**：${s.goal}`).join('\n')
  return `# 职业生涯发展报告

**学生**：${user}    **目标岗位**：${job.title}    **生成日期**：${new Date().toLocaleDateString('zh-CN')}

## 岗位匹配摘要

根据简历能力画像分析，系统匹配度最高岗位为「${job.title}」，匹配度 ${Math.round(job.matchScore * 100)}%。
${job.desc}工资区间：${job.salaryRange}

## 七维能力差距

主要待补齐维度：${gaps}

## 个性化成长计划

${plan}

## 关键技能要求

${job.keySkills.map(s => `- ${s}`).join('\n')}
`
})

function openDrawer() {
  reportTextEditable.value = reportText.value
  showDrawer.value = true
  editingReport.value = false
}

function selectJob(id: string) {
  selectedJobId.value = id
}

function goBack() {
  router.push({ name: 'student-career-navigation' })
}

function printReport() {
  window.print()
}

function onResize() { radarChart?.resize() }

onMounted(() => {
  window.addEventListener('resize', onResize)
  const defaultId = [...JOB_PORTRAITS].sort((a, b) => b.matchScore - a.matchScore)[0]?.id ?? ''
  selectedJobId.value = defaultId
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  radarChart?.dispose()
  radarChart = null
})
</script>

<template>
  <div class="cr-page">

    <!-- ══ HEADER ══ -->
    <header class="cr-header">
      <div class="cr-header__left">
        <button class="cr-back" @click="goBack">
          <Icon icon="lucide:arrow-left" :width="14"/><span>返回</span>
        </button>
        <span class="cr-title">职业生涯发展报告</span>
      </div>
      <div class="cr-header__center">
        <span class="cr-username">{{ userStore.currentUser?.name ?? '同学' }}</span>
        <span class="cr-sep">的</span>
        <span class="cr-tagline">岗位匹配 · 路径规划 · 成长行动</span>
      </div>
      <div class="cr-header__right">
        <button class="cr-report-btn" :disabled="!selectedJob" @click="openDrawer">
          <Icon icon="lucide:file-text" :width="12"/><span>生成报告</span>
        </button>
      </div>
    </header>

    <!-- ══ 主体：左栏 + 中栏 ══ -->
    <div class="cr-main">

      <!-- ══ 左栏：竖向职业路径流程图 ══ -->
      <div class="cr-left">
        <div class="cr-panel-title">
          <Icon icon="lucide:git-branch" :width="12"/>
          <span>职业路径图谱</span>
          <span v-if="selectedJob" class="cr-panel-sub">从 {{ selectedJob.title }} 出发</span>
        </div>

        <div class="cr-fc-wrap">
          <svg
            v-if="flowLayout.nodes.length"
            class="cr-fc-svg"
            :viewBox="`0 0 ${FC_W} ${FC_H}`"
            :width="FC_W" :height="FC_H"
            fill="none"
          >
            <!-- 边（连线） -->
            <g v-for="(edge, ei) in flowLayout.edges" :key="'e'+ei">
              <line
                :x1="edge.fromNode.x" :y1="edge.fromNode.y"
                :x2="edge.toNode.x"   :y2="edge.toNode.y"
                :stroke="edge.type === 'promote' ? 'rgba(196,98,45,0.55)' : 'rgba(106,91,138,0.45)'"
                :stroke-width="edge.type === 'promote' ? 2 : 1.5"
                :stroke-dasharray="edge.type === 'transfer' ? '5 4' : ''"
                stroke-linecap="round"
              />
              <!-- 技能点 -->
              <g v-for="(dot, di) in edge.dots" :key="'d'+ei+di">
                <rect
                  :x="dot.x - 24" :y="dot.y - 7"
                  width="48" height="13" rx="6"
                  :fill="edge.type === 'promote' ? 'rgba(139,37,0,0.22)' : 'rgba(74,58,110,0.22)'"
                  :stroke="edge.type === 'promote' ? 'rgba(196,98,45,0.4)' : 'rgba(106,91,138,0.4)'"
                  stroke-width="0.8"
                />
                <text
                  :x="dot.x" :y="dot.y + 3.5"
                  text-anchor="middle"
                  class="cr-skill-dot-text"
                >{{ dot.label.length > 10 ? dot.label.slice(0,9)+'…' : dot.label }}</text>
              </g>
            </g>

            <!-- 节点 -->
            <g
              v-for="node in flowLayout.nodes" :key="node.id"
              class="cr-fc-node"
              @click="selectJob(node.id)"
            >
              <circle
                :cx="node.x" :cy="node.y" r="22"
                :fill="selectedJobId === node.id
                  ? (LINE_COLORS[node.lineId] ?? '#888')
                  : 'rgba(237,229,214,0.06)'"
                :stroke="LINE_COLORS[node.lineId] ?? '#888'"
                :stroke-width="selectedJobId === node.id ? 2.5 : 1.5"
                :fill-opacity="selectedJobId === node.id ? 1 : 0.9"
              />
              <text :x="node.x" :y="node.y + 4" text-anchor="middle" class="cr-fc-node-text"
                :class="{'cr-fc-node-text--active': selectedJobId === node.id}">
                {{ node.title.length > 5 ? node.title.slice(0,5) : node.title }}
              </text>
              <text :x="node.x" :y="node.y + 34" text-anchor="middle" class="cr-fc-label"
                :class="{'cr-fc-label--active': selectedJobId === node.id}">
                {{ node.title }}
              </text>
            </g>

            <!-- 图例 -->
            <g transform="translate(8,12)">
              <line x1="0" y1="0" x2="14" y2="0" stroke="rgba(196,98,45,0.6)" stroke-width="2"/>
              <text x="18" y="4" class="cr-fc-legend-text">晋升路径</text>
              <line x1="0" y1="14" x2="14" y2="14" stroke="rgba(106,91,138,0.55)" stroke-width="1.5" stroke-dasharray="4 3"/>
              <text x="18" y="18" class="cr-fc-legend-text">转岗路径</text>
            </g>
          </svg>

          <div v-else class="cr-fc-empty">
            <Icon icon="lucide:git-branch" :width="24"/>
            <p>点击中栏气泡图<br/>选择目标岗位</p>
          </div>
        </div>
      </div>

      <!-- ══ 中栏 ══ -->
      <div class="cr-center">

        <!-- 中栏上半：气泡图 + 雷达图 -->
        <div class="cr-center-top">

          <!-- 气泡图 -->
          <div class="cr-bubble-panel">
            <div class="cr-panel-title">
              <Icon icon="lucide:circle-dot" :width="12"/>
              <span>岗位匹配气泡图</span>
              <span class="cr-panel-sub">气泡越大匹配度越高</span>
            </div>
            <div class="cr-bubble-wrap">
              <svg :viewBox="`0 0 ${BB_W} ${BB_H}`" :width="BB_W" :height="BB_H" class="cr-bubble-svg">
                <!-- 连线：其他泡到中心 -->
                <line
                  v-for="item in bubbleLayout.slice(1)" :key="'bl-'+item.job.id"
                  :x1="item.x" :y1="item.y"
                  :x2="bubbleLayout[0]?.x ?? BB_W/2" :y2="bubbleLayout[0]?.y ?? BB_H/2"
                  stroke="rgba(196,185,166,0.1)" stroke-width="1"
                />
                <!-- 气泡 -->
                <g
                  v-for="item in bubbleLayout" :key="item.job.id"
                  class="cr-bubble-node"
                  @click="selectJob(item.job.id)"
                >
                  <circle
                    :cx="item.x" :cy="item.y" :r="item.r"
                    :fill="selectedJobId === item.job.id
                      ? (LINE_COLORS[item.job.lineId] ?? '#888')
                      : (item.isCenter ? 'rgba(196,98,45,0.35)' : 'rgba(237,229,214,0.08)')"
                    :stroke="LINE_COLORS[item.job.lineId] ?? '#888'"
                    :stroke-width="item.isCenter ? 2 : 1"
                    :fill-opacity="selectedJobId === item.job.id ? 0.85 : (item.isCenter ? 0.8 : 0.7)"
                  />
                  <text v-if="item.r >= 18"
                    :x="item.x" :y="item.y + 3"
                    text-anchor="middle" class="cr-bubble-text"
                    :class="{'cr-bubble-text--active': selectedJobId === item.job.id}"
                  >{{ item.job.title.length > 5 ? item.job.title.slice(0,5) : item.job.title }}</text>
                  <!-- 匹配度百分比（仅中心泡） -->
                  <text v-if="item.isCenter"
                    :x="item.x" :y="item.y + item.r + 12"
                    text-anchor="middle" class="cr-bubble-pct"
                  >{{ Math.round(item.job.matchScore * 100) }}%</text>
                </g>
              </svg>
            </div>
          </div>

          <!-- 雷达图 -->
          <div class="cr-radar-panel">
            <div class="cr-panel-title">
              <Icon icon="lucide:radar" :width="12"/>
              <span>七维能力差距</span>
            </div>
            <div v-if="!selectedJob" class="cr-radar-empty">
              <p>选中岗位后<br/>展示能力对比</p>
            </div>
            <template v-else>
              <div ref="radarEl" class="cr-radar"></div>
              <div class="cr-gap-bars">
                <div v-for="item in dimGaps" :key="item.name" class="cr-gap-row">
                  <span class="cr-gap-dim">{{ item.name }}</span>
                  <div class="cr-gap-track">
                    <div class="cr-gap-bar--mine" :style="{ width: item.mine + '%' }"></div>
                    <div v-if="item.gap > 0" class="cr-gap-bar--need" :style="{ width: item.gap + '%', left: item.mine + '%' }"></div>
                  </div>
                  <span class="cr-gap-num" :class="{ 'cr-gap-num--pos': item.gap <= 0 }">
                    {{ item.gap > 0 ? '−'+item.gap : '+'+Math.abs(item.gap) }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 中栏下半：未来规划 + AI 占位 -->
        <div class="cr-center-bottom">

          <!-- AI 智能体占位区 -->
          <div class="cr-ai-placeholder">
            <div class="cr-ai-header">
              <Icon icon="lucide:bot" :width="13"/>
              <span>AI 职业顾问</span>
              <span class="cr-ai-badge">即将接入</span>
            </div>
            <div class="cr-ai-body">
              <p class="cr-ai-hint">输入问题，AI 将结合你的能力画像给出个性化建议</p>
              <div class="cr-ai-input-row">
                <input class="cr-ai-input" disabled placeholder="例如：我适合从哪个岗位入手？" />
                <button class="cr-ai-send" disabled>
                  <Icon icon="lucide:send" :width="11"/>
                </button>
              </div>
            </div>
          </div>

          <!-- 未来规划 -->
          <div class="cr-planning">
            <div class="cr-panel-title">
              <Icon icon="lucide:calendar-check" :width="12"/>
              <span>个性化成长计划</span>
              <span v-if="!selectedJob" class="cr-panel-sub">选中岗位后生成</span>
            </div>
            <div v-if="!selectedJob || !growthPlan.length" class="cr-planning-empty">
              <Icon icon="lucide:sparkles" :width="20"/>
              <p>在上方选择目标岗位<br/>即可生成分阶段成长计划</p>
            </div>
            <div v-else class="cr-plan-stages">
              <div v-for="stage in growthPlan" :key="stage.phase" class="cr-plan-stage"
                :class="`cr-plan-stage--${stage.phase}`">
                <div class="cr-ps-head">
                  <span class="cr-ps-label">{{ stage.phaseLabel }}</span>
                  <span class="cr-ps-goal">{{ stage.goal }}</span>
                </div>
                <ul class="cr-ps-list">
                  <li v-for="t in stage.tasks" :key="t">
                    <Icon icon="lucide:check-circle-2" :width="10"/>{{ t }}
                  </li>
                </ul>
                <div class="cr-ps-milestone">
                  <Icon icon="lucide:flag" :width="10"/>{{ stage.milestone }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ 智能汇报抽屉（右侧滑入）══ -->
    <div class="cr-drawer" :class="{ 'cr-drawer--open': showDrawer }">
      <div class="cr-drawer-header">
        <span class="cr-drawer-title"><Icon icon="lucide:file-text" :width="13"/>智能汇报</span>
        <div class="cr-drawer-actions">
          <button class="cr-drawer-btn" disabled title="AI润色（即将开放）">
            <Icon icon="lucide:wand-2" :width="11"/>润色
          </button>
          <button class="cr-drawer-btn cr-drawer-btn--edit" @click="editingReport = !editingReport">
            <Icon :icon="editingReport ? 'lucide:eye' : 'lucide:pencil'" :width="11"/>
            {{ editingReport ? '预览' : '编辑' }}
          </button>
          <button class="cr-drawer-btn cr-drawer-btn--export" @click="printReport">
            <Icon icon="lucide:printer" :width="11"/>导出
          </button>
          <button class="cr-drawer-close" @click="showDrawer = false">
            <Icon icon="lucide:x" :width="14"/>
          </button>
        </div>
      </div>
      <div class="cr-drawer-body">
        <textarea v-if="editingReport" v-model="reportTextEditable" class="cr-drawer-editor"/>
        <div v-else class="cr-drawer-preview">
          <pre class="cr-report-pre">{{ reportTextEditable || reportText }}</pre>
        </div>
      </div>
    </div>
    <div v-if="showDrawer" class="cr-drawer-mask" @click="showDrawer = false"/>

  </div>
</template>

<style scoped>
.cr-page {
  position: relative; width: 100%; height: 100vh; max-height: 100vh;
  background: #120C04; display: flex; flex-direction: column;
  font-family: var(--font-title, 'LXGW WenKai', serif); overflow: hidden;
}

/* ── HEADER ── */
.cr-header {
  flex-shrink: 0; display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center; padding: 0 20px; height: 48px; min-height: 48px;
  border-bottom: 1px solid rgba(196,185,166,0.1);
  background: rgba(8,4,0,0.75); backdrop-filter: blur(12px); z-index: 20;
}
.cr-header__left { display: flex; align-items: center; gap: 10px; }
.cr-header__center { display: flex; align-items: center; gap: 5px; }
.cr-header__right { display: flex; justify-content: flex-end; }
.cr-back {
  display: flex; align-items: center; gap: 5px; background: none;
  border: 1px solid rgba(196,185,166,0.18); color: rgba(190,175,155,0.7);
  font-size: 11px; padding: 4px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s;
}
.cr-back:hover { border-color: rgba(139,37,0,0.5); color: rgba(220,170,130,0.9); }
.cr-title { font-size: 13px; font-weight: 700; color: rgba(237,229,214,0.9); letter-spacing: 0.08em; }
.cr-username { font-size: 12px; font-weight: 700; color: rgba(220,170,130,0.9); }
.cr-sep { font-size: 11px; color: rgba(130,115,95,0.45); margin: 0 2px; }
.cr-tagline { font-size: 11px; color: rgba(175,160,135,0.5); letter-spacing: 0.06em; }
.cr-report-btn {
  display: flex; align-items: center; gap: 5px; cursor: pointer;
  background: rgba(139,37,0,0.2); border: 1px solid rgba(139,37,0,0.45);
  color: rgba(220,160,120,0.9); font-size: 11px; padding: 5px 14px; border-radius: 4px;
  transition: all 0.2s; letter-spacing: 0.04em;
}
.cr-report-btn:hover:not(:disabled) { background: rgba(139,37,0,0.35); }
.cr-report-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── 主布局：左栏 + 中栏 ── */
.cr-main {
  flex: 1; display: grid; grid-template-columns: 310px 1fr;
  overflow: hidden; min-height: 0;
}

/* ── 左栏：流程图 ── */
.cr-left {
  display: flex; flex-direction: column;
  border-right: 1px solid rgba(196,185,166,0.09);
  overflow: hidden;
}
.cr-fc-wrap {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  display: flex; justify-content: center; padding: 8px 4px 12px;
}
.cr-fc-wrap::-webkit-scrollbar { width: 3px; }
.cr-fc-wrap::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.25); }
.cr-fc-svg { display: block; flex-shrink: 0; cursor: default; }
.cr-fc-node { cursor: pointer; }
.cr-fc-node-text {
  font-size: 8.5px; fill: rgba(237,229,214,0.75); pointer-events: none; font-weight: 600;
}
.cr-fc-node-text--active { fill: #fff; }
.cr-fc-label {
  font-size: 8px; fill: rgba(190,175,155,0.55); pointer-events: none;
}
.cr-fc-label--active { fill: rgba(237,229,214,0.85); font-size: 8.5px; }
.cr-skill-dot-text {
  font-size: 7px; fill: rgba(200,185,165,0.75); pointer-events: none;
}
.cr-fc-legend-text { font-size: 8px; fill: rgba(150,135,110,0.5); }
.cr-fc-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; color: rgba(130,115,95,0.4);
  font-size: 11px; text-align: center; line-height: 1.6;
}

/* ── 中栏 ── */
.cr-center {
  display: flex; flex-direction: column; overflow: hidden; min-height: 0;
}

/* 中栏上：气泡 + 雷达 */
.cr-center-top {
  flex: 0 0 auto; display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid rgba(196,185,166,0.09); min-height: 0;
}
.cr-bubble-panel, .cr-radar-panel {
  display: flex; flex-direction: column; padding: 8px 12px 10px; overflow: hidden;
}
.cr-bubble-panel { border-right: 1px solid rgba(196,185,166,0.09); }
.cr-bubble-wrap { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cr-bubble-svg { display: block; cursor: default; }
.cr-bubble-node { cursor: pointer; }
.cr-bubble-text { font-size: 9px; fill: rgba(237,229,214,0.85); pointer-events: none; font-weight: 600; }
.cr-bubble-text--active { fill: #fff; }
.cr-bubble-pct { font-size: 9px; fill: rgba(220,170,130,0.75); pointer-events: none; }
.cr-radar-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: rgba(130,115,95,0.4); font-size: 11px; text-align: center; line-height: 1.7;
}
.cr-radar { flex-shrink: 0; width: 100%; height: 160px; }
.cr-gap-bars { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
.cr-gap-row { display: flex; align-items: center; gap: 6px; }
.cr-gap-dim { font-size: 9.5px; color: rgba(165,150,128,0.75); width: 46px; flex-shrink: 0; }
.cr-gap-track { flex: 1; height: 4px; background: rgba(237,229,214,0.07); border-radius: 2px; position: relative; overflow: visible; }
.cr-gap-bar--mine { position: absolute; top: 0; left: 0; height: 100%; background: rgba(196,98,45,0.6); border-radius: 2px; }
.cr-gap-bar--need { position: absolute; top: 0; height: 100%; background: rgba(196,98,45,0.2); border: 1px dashed rgba(196,98,45,0.35); border-radius: 2px; }
.cr-gap-num { font-size: 9.5px; width: 28px; text-align: right; color: rgba(200,100,80,0.8); }
.cr-gap-num--pos { color: rgba(90,160,100,0.8); }

/* 中栏下：规划 + AI */
.cr-center-bottom {
  flex: 1; display: grid; grid-template-columns: 280px 1fr;
  overflow: hidden; min-height: 0;
}
.cr-ai-placeholder {
  border-right: 1px solid rgba(196,185,166,0.09);
  display: flex; flex-direction: column; padding: 10px 12px; gap: 8px; overflow: hidden;
}
.cr-ai-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; color: rgba(190,175,155,0.7);
}
.cr-ai-badge {
  font-size: 9px; padding: 1px 6px; border-radius: 3px;
  background: rgba(196,185,166,0.08); border: 1px solid rgba(196,185,166,0.2);
  color: rgba(150,135,110,0.6);
}
.cr-ai-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.cr-ai-hint { font-size: 10px; color: rgba(140,125,100,0.5); line-height: 1.5; margin: 0; }
.cr-ai-input-row { display: flex; gap: 6px; margin-top: auto; }
.cr-ai-input {
  flex: 1; background: rgba(237,229,214,0.04); border: 1px solid rgba(196,185,166,0.15);
  color: rgba(190,175,155,0.6); font-size: 10px; padding: 5px 8px; border-radius: 4px;
  cursor: not-allowed; font-family: inherit;
}
.cr-ai-send {
  background: rgba(196,185,166,0.08); border: 1px solid rgba(196,185,166,0.15);
  color: rgba(150,135,110,0.5); padding: 5px 8px; border-radius: 4px; cursor: not-allowed;
}

.cr-planning { flex: 1; display: flex; flex-direction: column; padding: 10px 12px; overflow: hidden; }
.cr-planning-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; color: rgba(130,115,95,0.4);
  font-size: 11px; text-align: center; line-height: 1.6;
}
.cr-plan-stages { flex: 1; display: flex; gap: 10px; overflow-x: auto; overflow-y: hidden; padding-bottom: 6px; }
.cr-plan-stages::-webkit-scrollbar { height: 3px; }
.cr-plan-stages::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.2); }
.cr-plan-stage {
  flex: 1; min-width: 220px; background: rgba(237,229,214,0.04);
  border: 1px solid rgba(196,185,166,0.12); border-radius: 6px;
  padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto;
}
.cr-plan-stage::-webkit-scrollbar { width: 2px; }
.cr-plan-stage--short { border-color: rgba(139,37,0,0.25); }
.cr-plan-stage--mid   { border-color: rgba(139,105,20,0.22); }
.cr-ps-head { display: flex; flex-direction: column; gap: 4px; }
.cr-ps-label {
  font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 3px;
  display: inline-block; width: fit-content;
}
.cr-plan-stage--short .cr-ps-label { background: rgba(139,37,0,0.2); color: rgba(220,140,100,0.9); }
.cr-plan-stage--mid   .cr-ps-label { background: rgba(139,105,20,0.2); color: rgba(200,170,90,0.9); }
.cr-ps-goal { font-size: 10px; color: rgba(195,180,160,0.8); line-height: 1.55; }
.cr-ps-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.cr-ps-list li { display: flex; align-items: flex-start; gap: 5px; font-size: 10px; color: rgba(165,150,130,0.75); line-height: 1.5; }
.cr-ps-milestone {
  display: flex; align-items: flex-start; gap: 5px; font-size: 9.5px;
  color: rgba(175,148,85,0.75); padding-top: 6px;
  border-top: 1px solid rgba(196,185,166,0.1); margin-top: auto;
}

/* ── 公用面板标题 ── */
.cr-panel-title {
  flex-shrink: 0; display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: rgba(196,185,166,0.7);
  letter-spacing: 0.06em; padding: 8px 12px 6px;
  border-bottom: 1px solid rgba(196,185,166,0.08);
}
.cr-panel-sub { font-size: 9.5px; font-weight: 400; color: rgba(140,125,100,0.5); margin-left: 4px; }

/* ── 智能汇报抽屉 ── */
.cr-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(640px, 50vw);
  background: #0E0804;
  border-left: 1px solid rgba(196,185,166,0.15);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.32s cubic-bezier(0.22,0.61,0.36,1);
  z-index: 100;
  box-shadow: -8px 0 32px rgba(0,0,0,0.5);
}
.cr-drawer--open { transform: translateX(0); }
.cr-drawer-mask {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  z-index: 99; cursor: pointer;
}
.cr-drawer-header {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; height: 48px; border-bottom: 1px solid rgba(196,185,166,0.1);
  background: rgba(8,4,0,0.6);
}
.cr-drawer-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 700; color: rgba(237,229,214,0.9);
}
.cr-drawer-actions { display: flex; align-items: center; gap: 6px; }
.cr-drawer-btn {
  display: flex; align-items: center; gap: 4px; cursor: pointer;
  background: rgba(196,185,166,0.07); border: 1px solid rgba(196,185,166,0.18);
  color: rgba(180,165,145,0.75); font-size: 10.5px; padding: 4px 10px; border-radius: 4px;
  transition: all 0.2s; font-family: inherit;
}
.cr-drawer-btn:hover:not(:disabled) { background: rgba(196,185,166,0.14); }
.cr-drawer-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.cr-drawer-btn--edit { color: rgba(196,165,100,0.85); border-color: rgba(196,165,100,0.28); }
.cr-drawer-btn--export { color: rgba(220,160,120,0.9); border-color: rgba(139,37,0,0.4); background: rgba(139,37,0,0.15); }
.cr-drawer-btn--export:hover { background: rgba(139,37,0,0.28); }
.cr-drawer-close {
  background: none; border: none; color: rgba(160,145,125,0.6);
  cursor: pointer; padding: 4px; display: flex; align-items: center;
  transition: color 0.2s;
}
.cr-drawer-close:hover { color: rgba(220,170,130,0.9); }
.cr-drawer-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.cr-drawer-editor {
  flex: 1; width: 100%; resize: none; background: rgba(237,229,214,0.03);
  border: none; color: rgba(210,195,175,0.88); font-size: 12px; font-family: inherit;
  padding: 16px; line-height: 1.7; outline: none;
}
.cr-drawer-preview { flex: 1; overflow-y: auto; padding: 16px; }
.cr-drawer-preview::-webkit-scrollbar { width: 4px; }
.cr-drawer-preview::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.3); }
.cr-report-pre {
  white-space: pre-wrap; font-family: inherit; font-size: 12px;
  color: rgba(210,195,175,0.85); line-height: 1.8; margin: 0;
}

/* ── 打印 ── */
@media print {
  .cr-back, .cr-report-btn, .cr-drawer-mask { display: none !important; }
  .cr-page { height: auto; background: #fff; }
  .cr-drawer { position: static; transform: none; width: 100%; box-shadow: none; border: none; }
}
</style>
