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
  frontend: '#8B2500',
  data:     '#8B6914',
  qa:       '#2B4C6F',
  fullstack:'#5B7744',
}

/* 气泡漂移坐标（黄金角分布，模块级常量，稳定不重算） */
const BUBBLE_DRIFTS = Array.from({ length: 20 }, (_, i) => {
  const a1 = (i * 137.5) % 360
  const a2 = (i * 137.5 + 80) % 360
  const a3 = (i * 137.5 + 160) % 360
  const s = 4 + (i % 3)
  return {
    dx1: +(Math.cos(a1 * Math.PI / 180) * s).toFixed(1),
    dy1: +(Math.sin(a1 * Math.PI / 180) * s * 0.7).toFixed(1),
    dx2: +(Math.cos(a2 * Math.PI / 180) * s).toFixed(1),
    dy2: +(Math.sin(a2 * Math.PI / 180) * s * 0.7).toFixed(1),
    dx3: +(Math.cos(a3 * Math.PI / 180) * s).toFixed(1),
    dy3: +(Math.sin(a3 * Math.PI / 180) * s * 0.7).toFixed(1),
  }
})

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
type FlowBead = { x: number; y: number; label: string }
type FlowEdgeLayout = {
  fromNode: FlowNode; toNode: FlowNode
  type: 'promote' | 'transfer'; skills: string[]
  mid: { x: number; y: number }
  beads: FlowBead[]
}

const FC_W = 340, FC_H = 520

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function lerpPt(a: {x:number;y:number}, b: {x:number;y:number}, t: number) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

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
        const off = Math.ceil((i + 1) / 2) * 110
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
    const fromNode = nodeMap.get(edge.fromId)
    const toNode = nodeMap.get(edge.toId)
    if (!fromNode || !toNode) continue
    const fn = { x: fromNode.x, y: fromNode.y }
    const tn = { x: toNode.x,   y: toNode.y   }
    /* 折点：晋升路径向内侧偏移（Z形），转岗路径取正中（V形） */
    const mid = edge.type === 'promote'
      ? { x: fn.x + (fn.x < FC_W / 2 ? 22 : -22), y: (fn.y + tn.y) / 2 }
      : { x: (fn.x + tn.x) / 2, y: (fn.y + tn.y) / 2 }
    /* 串珠密度限制：按段长动态计算 */
    const seg1Len = Math.sqrt((mid.x - fn.x) ** 2 + (mid.y - fn.y) ** 2)
    const seg2Len = Math.sqrt((tn.x - mid.x) ** 2 + (tn.y - mid.y) ** 2)
    const maxBeads = Math.min(8, Math.floor((seg1Len + seg2Len) / 10))
    const skills = edge.skills.slice(0, maxBeads)
    const beads: FlowBead[] = skills.map((label, i) => {
      const t = (i + 0.5) / skills.length
      let pt: { x: number; y: number }
      if (t <= 0.5) {
        const st = t * 2
        pt = lerpPt(lerpPt(fn, mid, 0.15), lerpPt(fn, mid, 0.85), st)
      } else {
        const st = (t - 0.5) * 2
        pt = lerpPt(lerpPt(mid, tn, 0.15), lerpPt(mid, tn, 0.85), st)
      }
      return { x: Math.round(pt.x), y: Math.round(pt.y), label }
    })
    edges.push({ fromNode, toNode, type: edge.type, skills: edge.skills, mid, beads })
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
    legend: { bottom: 0, textStyle: { color: '#6B5D4F', fontSize: 10 }, data: ['我的能力', '岗位要求'] },
    radar: {
      indicator: DIM_NAMES.map(name => ({ name, max: 100 })),
      radius: '58%', center: ['50%', '46%'], splitNumber: 4,
      axisName: { color: '#6B5D4F', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(139,37,0,0.12)' } },
      splitArea: { areaStyle: { color: ['rgba(247,242,232,0.6)', 'rgba(237,229,214,0.4)'] } },
      axisLine: { lineStyle: { color: 'rgba(139,37,0,0.15)' } },
    },
    series: [{ type: 'radar', data: [
      { value: DIM_NAMES.map(n => studentDim.value[n]), name: '我的能力',
        lineStyle: { color: '#8B2500', width: 1.5 }, areaStyle: { color: 'rgba(139,37,0,0.12)' }, itemStyle: { color: '#8B2500' } },
      { value: DIM_NAMES.map(n => job.sevenDim[n]), name: '岗位要求',
        lineStyle: { color: '#8B6914', width: 1.5, type: 'dashed' }, areaStyle: { color: 'rgba(139,105,20,0.08)' }, itemStyle: { color: '#8B6914' } },
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
            <!-- 折线边（Z/V 形两段斜线）-->
            <g v-for="(edge, ei) in flowLayout.edges" :key="'e'+ei">
              <polyline
                :points="`${edge.fromNode.x},${edge.fromNode.y} ${edge.mid.x},${edge.mid.y} ${edge.toNode.x},${edge.toNode.y}`"
                :stroke="edge.type === 'promote' ? 'rgba(139,37,0,0.22)' : 'rgba(43,76,111,0.2)'"
                stroke-width="1" fill="none" stroke-linejoin="round"
              />
              <!-- 串珠技能节点 -->
              <g v-for="bead in edge.beads" :key="bead.label">
                <circle
                  :cx="bead.x" :cy="bead.y" r="3.5"
                  :fill="edge.type === 'promote' ? 'rgba(139,37,0,0.3)' : 'rgba(43,76,111,0.28)'"
                  :stroke="edge.type === 'promote' ? '#8B2500' : '#2B4C6F'"
                  stroke-width="0.8"
                />
                <title>{{ bead.label }}</title>
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
                  ? (LINE_COLORS[node.lineId] ?? '#8B2500')
                  : 'rgba(237,229,214,0.55)'"
                :stroke="LINE_COLORS[node.lineId] ?? '#8B2500'"
                :stroke-width="selectedJobId === node.id ? 2.5 : 1.5"
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
              <polyline points="0,0 7,0 14,0" stroke="rgba(139,37,0,0.55)" stroke-width="2" fill="none"/>
              <text x="18" y="4" class="cr-fc-legend-text">晋升路径</text>
              <polyline points="0,14 7,14 14,14" stroke="rgba(43,76,111,0.5)" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
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
            <div class="cr-bubble-stage">
              <!-- 连线：其他泡→中心泡 -->
              <svg class="cr-bubble-lines" :viewBox="`0 0 ${BB_W} ${BB_H}`"
                :width="BB_W" :height="BB_H" style="position:absolute;top:0;left:0;pointer-events:none">
                <line
                  v-for="item in bubbleLayout.slice(1)" :key="'bl-'+item.job.id"
                  :x1="item.x" :y1="item.y"
                  :x2="bubbleLayout[0]?.x ?? BB_W/2" :y2="bubbleLayout[0]?.y ?? BB_H/2"
                  stroke="rgba(139,37,0,0.1)" stroke-width="0.8"
                />
              </svg>
              <!-- div 气泡 -->
              <div
                v-for="(item, i) in bubbleLayout" :key="item.job.id"
                class="cr-bubble"
                :class="{ 'cr-bubble--selected': selectedJobId === item.job.id }"
                :style="{
                  left: (item.x - item.r) + 'px',
                  top:  (item.y - item.r) + 'px',
                  width:  item.r * 2 + 'px',
                  height: item.r * 2 + 'px',
                  '--c':         LINE_COLORS[item.job.lineId] ?? '#8B2500',
                  '--dur':       (5.5 + i * 0.7) + 's',
                  '--neg-delay': '-' + (i * 0.9 + 1.2) + 's',
                  '--dx1': (BUBBLE_DRIFTS[i % 20]?.dx1 ?? 0) + 'px',
                  '--dy1': (BUBBLE_DRIFTS[i % 20]?.dy1 ?? 0) + 'px',
                  '--dx2': (BUBBLE_DRIFTS[i % 20]?.dx2 ?? 0) + 'px',
                  '--dy2': (BUBBLE_DRIFTS[i % 20]?.dy2 ?? 0) + 'px',
                  '--dx3': (BUBBLE_DRIFTS[i % 20]?.dx3 ?? 0) + 'px',
                  '--dy3': (BUBBLE_DRIFTS[i % 20]?.dy3 ?? 0) + 'px',
                }"
                @click="selectJob(item.job.id)"
              >
                <!-- 大泡：完整标题 + 匹配度 -->
                <template v-if="item.r >= 22">
                  <span class="cr-bubble-title">{{ item.job.title }}</span>
                  <span class="cr-bubble-pct">{{ Math.round(item.job.matchScore * 100) }}%</span>
                </template>
                <!-- 中泡：4字简写 -->
                <template v-else-if="item.r >= 14">
                  <span class="cr-bubble-abbr" :title="item.job.title">
                    {{ item.job.title.slice(0, 4) }}
                  </span>
                </template>
                <!-- 小泡：外部下方标签 -->
                <span v-else class="cr-bubble-ext-label">{{ item.job.title }}</span>
              </div>
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

        <!-- 中栏下半：个性化成长计划 -->
        <div class="cr-center-bottom">

          <!-- 成长计划 -->
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
/* ══ CSS 变量（对齐 CareerNavigation 左栏） ══ */
.cr-page {
  --cr-bg:     #F7F2E8;
  --cr-panel:  #EDE5D6;
  --cr-border: #D4C9B5;
  --cr-muted:  #C4B9A6;
  --cr-red:    #8B2500;
  --cr-gold:   #8B6914;
  --cr-text:   #1A1410;
  --cr-sub:    #6B5D4F;
  --cr-hint:   #9C8B78;
  --cr-dark:   #1A1008;
}

/* ══ 页面容器 ══ */
.cr-page {
  position: relative; width: 100%; height: 100vh; max-height: 100vh;
  background: var(--cr-bg); display: flex; flex-direction: column;
  font-family: var(--font-title, 'LXGW WenKai', serif); overflow: hidden;
}
.cr-page::before {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(26,20,16,0.06) 1px, transparent 0);
  background-size: 4px 4px;
}

/* ══ HEADER ══ */
.cr-header {
  position: relative; z-index: 10;
  flex-shrink: 0; display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center; padding: 0 24px; height: 48px; min-height: 48px;
  background: var(--cr-panel); border-bottom: 1px solid var(--cr-border);
}
.cr-header__left  { display: flex; align-items: center; gap: 12px; }
.cr-header__center{ display: flex; align-items: center; gap: 5px; justify-content: center; }
.cr-header__right { display: flex; justify-content: flex-end; }
.cr-back {
  display: flex; align-items: center; gap: 4px; background: transparent;
  border: 1px solid var(--cr-border); color: var(--cr-sub);
  font-size: 12px; padding: 4px 10px; cursor: pointer;
  transition: border-color 200ms ease, color 200ms ease; letter-spacing: 0.04em;
  font-family: inherit;
}
.cr-back:hover { border-color: var(--cr-red); color: var(--cr-red); }
.cr-back:active { transform: scale(0.97); }
.cr-title    { font-size: 13px; font-weight: 700; color: var(--cr-text); letter-spacing: 0.14em; }
.cr-username { font-size: 12px; font-weight: 700; color: var(--cr-red); }
.cr-sep      { font-size: 11px; color: var(--cr-muted); margin: 0 3px; }
.cr-tagline  { font-size: 11px; color: var(--cr-hint); letter-spacing: 0.04em; }
.cr-report-btn {
  display: flex; align-items: center; gap: 5px; cursor: pointer;
  background: color-mix(in srgb, var(--cr-red) 6%, var(--cr-panel) 94%);
  border: 1px solid rgba(139,37,0,0.35); color: var(--cr-sub);
  font-size: 11px; padding: 5px 14px; font-family: inherit;
  transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
  letter-spacing: 0.04em;
}
.cr-report-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--cr-red) 12%, var(--cr-panel) 88%);
  border-color: var(--cr-red); color: var(--cr-red);
}
.cr-report-btn:active:not(:disabled) { transform: scale(0.97); }
.cr-report-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ══ 主布局 ══ */
.cr-main {
  flex: 1; display: grid; grid-template-columns: 350px 1fr;
  overflow: hidden; min-height: 0; position: relative; z-index: 1;
}

/* ══ 左栏：路径图 ══ */
.cr-left {
  display: flex; flex-direction: column;
  border-right: 1px solid var(--cr-border); overflow: hidden;
  background: var(--cr-bg);
}
.cr-fc-wrap {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  display: flex; justify-content: center; padding: 8px 4px 12px;
}
.cr-fc-wrap::-webkit-scrollbar { width: 3px; }
.cr-fc-wrap::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.2); }
.cr-fc-svg { display: block; flex-shrink: 0; cursor: default; }
.cr-fc-node { cursor: pointer; }
.cr-fc-node:hover circle { filter: brightness(1.15); }
.cr-fc-node-text {
  font-size: 9px; fill: var(--cr-sub); pointer-events: none; font-weight: 600;
}
.cr-fc-node-text--active { fill: #fff; }
.cr-fc-label {
  font-size: 9px; fill: var(--cr-hint); pointer-events: none;
}
.cr-fc-label--active { fill: var(--cr-sub); font-weight: 700; }
.cr-fc-legend-text { font-size: 9px; fill: var(--cr-hint); }
.cr-fc-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; color: var(--cr-muted);
  font-size: 11px; text-align: center; line-height: 1.6;
}

/* ══ 中栏 ══ */
.cr-center { display: flex; flex-direction: column; overflow: hidden; min-height: 0; }

/* 中栏上：气泡 + 雷达（固定高度） */
.cr-center-top {
  flex: 0 0 270px; display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid var(--cr-border); overflow: hidden;
}
.cr-bubble-panel, .cr-radar-panel {
  display: flex; flex-direction: column; overflow: hidden;
}
.cr-bubble-panel { border-right: 1px solid var(--cr-border); }

/* ── 气泡图容器（div 绝对定位方案）── */
.cr-bubble-stage {
  flex: 1; position: relative; overflow: visible;
  width: 300px; height: 220px; margin: auto;
}

/* ── 水泡动画 ── */
@keyframes cr-float {
  0%   { transform: translate(0px, 0px) scale(1); }
  20%  { transform: translate(var(--dx1), var(--dy1)) scale(1.06); }
  40%  { transform: translate(var(--dx2), var(--dy2)) scale(0.96); }
  65%  { transform: translate(var(--dx3), var(--dy3)) scale(1.05); }
  80%  { transform: translate(var(--dx1), calc(var(--dy1) * -1)) scale(0.98); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.cr-bubble {
  position: absolute; border-radius: 50%; cursor: pointer;
  background:
    radial-gradient(circle at 32% 26%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0) 36%),
    radial-gradient(circle at 66% 72%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 24%),
    color-mix(in srgb, var(--c) 20%, rgba(240,234,220,0.7) 80%);
  border: 1.5px solid color-mix(in srgb, var(--c) 55%, rgba(255,255,255,0.6) 45%);
  box-shadow:
    inset 0 -5px 10px -2px color-mix(in srgb, var(--c) 30%, transparent),
    inset 0  3px  5px -1px rgba(255,255,255,0.45),
    0 3px 12px rgba(26,20,16,0.07);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  will-change: transform;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  animation: cr-float var(--dur, 6s) ease-in-out var(--neg-delay, -1.2s) infinite;
}
.cr-bubble--selected {
  background:
    radial-gradient(circle at 32% 26%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 34%),
    radial-gradient(circle at 66% 72%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 22%),
    color-mix(in srgb, var(--c) 55%, rgba(247,242,232,0.5) 45%);
  border-color: var(--c); border-width: 2px;
  box-shadow:
    inset 0 -5px 10px -2px color-mix(in srgb, var(--c) 40%, transparent),
    inset 0  3px  5px -1px rgba(255,255,255,0.5),
    0 4px 16px rgba(26,20,16,0.12);
  z-index: 10;
}
.cr-bubble:hover { filter: brightness(1.08); }
.cr-bubble:active { transform: scale(0.93) !important; }
/* 岗位标注 */
.cr-bubble-title {
  font-size: 11px; font-weight: 700; color: var(--cr-text);
  text-align: center; pointer-events: none; line-height: 1.2; padding: 0 4px;
}
.cr-bubble-pct {
  font-size: 9px; color: var(--cr-sub); pointer-events: none; letter-spacing: 0.04em;
}
.cr-bubble-abbr {
  font-size: 9.5px; font-weight: 700; color: var(--cr-text); pointer-events: none;
}
.cr-bubble--selected .cr-bubble-title,
.cr-bubble--selected .cr-bubble-abbr { color: #fff; }
.cr-bubble--selected .cr-bubble-pct  { color: rgba(255,255,255,0.8); }
.cr-bubble-ext-label {
  position: absolute; top: calc(100% + 4px); left: 50%;
  transform: translateX(-50%); white-space: nowrap;
  font-size: 9px; color: var(--cr-sub); pointer-events: none;
  background: rgba(247,242,232,0.9); padding: 1px 4px; letter-spacing: 0.03em;
}

/* 雷达图 */
.cr-radar-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--cr-muted); font-size: 11px; text-align: center; line-height: 1.7;
}
.cr-radar { flex-shrink: 0; width: 100%; height: 150px; }
.cr-gap-bars { display: flex; flex-direction: column; gap: 4px; padding: 6px 12px 8px; }
.cr-gap-row  { display: flex; align-items: center; gap: 6px; }
.cr-gap-dim  { font-size: 9.5px; color: var(--cr-sub); width: 48px; flex-shrink: 0; }
.cr-gap-track { flex: 1; height: 4px; background: var(--cr-border); border-radius: 2px; position: relative; overflow: visible; }
.cr-gap-bar--mine { position: absolute; top: 0; left: 0; height: 100%; background: rgba(139,37,0,0.55); border-radius: 2px; }
.cr-gap-bar--need { position: absolute; top: 0; height: 100%; background: rgba(139,37,0,0.2); border: 1px dashed rgba(139,37,0,0.35); border-radius: 2px; }
.cr-gap-num  { font-size: 9.5px; width: 28px; text-align: right; color: rgba(180,80,60,0.9); }
.cr-gap-num--pos { color: rgba(60,140,80,0.85); }

/* 中栏下：成长计划独占 */
.cr-center-bottom { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.cr-planning { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.cr-planning-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; color: var(--cr-muted);
  font-size: 11px; text-align: center; line-height: 1.6;
}
.cr-plan-stages { flex: 1; display: flex; gap: 10px; overflow-x: auto; overflow-y: hidden; padding: 0 12px 10px; }
.cr-plan-stages::-webkit-scrollbar { height: 3px; }
.cr-plan-stages::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.2); }
.cr-plan-stage {
  flex: 1; min-width: 200px;
  background: var(--cr-panel); border: 1px solid var(--cr-border);
  padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto;
}
.cr-plan-stage::-webkit-scrollbar { width: 2px; }
.cr-plan-stage--short { border-color: color-mix(in srgb, var(--cr-red) 30%, var(--cr-border) 70%); }
.cr-plan-stage--mid   { border-color: color-mix(in srgb, var(--cr-gold) 30%, var(--cr-border) 70%); }
.cr-ps-head { display: flex; flex-direction: column; gap: 4px; }
.cr-ps-label {
  font-size: 9.5px; font-weight: 700; padding: 2px 7px;
  display: inline-block; width: fit-content;
}
.cr-plan-stage--short .cr-ps-label { background: color-mix(in srgb, var(--cr-red) 10%, var(--cr-bg) 90%); color: var(--cr-red); border: 1px solid rgba(139,37,0,0.25); }
.cr-plan-stage--mid   .cr-ps-label { background: color-mix(in srgb, var(--cr-gold) 10%, var(--cr-bg) 90%); color: var(--cr-gold); border: 1px solid rgba(139,105,20,0.25); }
.cr-ps-goal { font-size: 10px; color: var(--cr-sub); line-height: 1.55; }
.cr-ps-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.cr-ps-list li { display: flex; align-items: flex-start; gap: 5px; font-size: 10px; color: var(--cr-sub); line-height: 1.5; }
.cr-ps-milestone {
  display: flex; align-items: flex-start; gap: 5px; font-size: 9.5px;
  color: var(--cr-gold); padding-top: 6px;
  border-top: 1px solid var(--cr-border); margin-top: auto;
}

/* ══ 公用面板标题 ══ */
.cr-panel-title {
  flex-shrink: 0; display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--cr-sub);
  letter-spacing: 0.06em; padding: 8px 12px 6px;
  border-bottom: 1px solid var(--cr-border);
}
.cr-panel-sub { font-size: 9.5px; font-weight: 400; color: var(--cr-hint); margin-left: 4px; }

/* ══ 智能汇报抽屉（保持深色） ══ */
.cr-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(480px, 40vw);
  background: var(--cr-dark);
  border-left: 1px solid rgba(212,201,181,0.15);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 250ms cubic-bezier(0.215, 0.61, 0.355, 1);
  z-index: 100;
  box-shadow: -6px 0 24px rgba(0,0,0,0.35);
}
.cr-drawer--open { transform: translateX(0); }
.cr-drawer-mask {
  position: fixed; inset: 0; background: rgba(26,20,16,0.3);
  z-index: 99; cursor: pointer;
}
.cr-drawer-header {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; height: 48px; border-bottom: 1px solid rgba(212,201,181,0.12);
  background: rgba(10,6,2,0.5);
}
.cr-drawer-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 700; color: rgba(220,205,185,0.9);
}
.cr-drawer-actions { display: flex; align-items: center; gap: 6px; }
.cr-drawer-btn {
  display: flex; align-items: center; gap: 4px; cursor: pointer;
  background: rgba(212,201,181,0.07); border: 1px solid rgba(212,201,181,0.18);
  color: rgba(180,165,145,0.75); font-size: 10.5px; padding: 4px 10px;
  transition: background 150ms ease; font-family: inherit;
}
.cr-drawer-btn:hover:not(:disabled) { background: rgba(212,201,181,0.14); }
.cr-drawer-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.cr-drawer-btn--edit   { color: rgba(196,165,100,0.85); border-color: rgba(196,165,100,0.28); }
.cr-drawer-btn--export {
  color: rgba(210,150,100,0.9); border-color: rgba(139,37,0,0.4);
  background: rgba(139,37,0,0.15);
}
.cr-drawer-btn--export:hover { background: rgba(139,37,0,0.28); }
.cr-drawer-close {
  background: none; border: none; color: rgba(160,145,125,0.6);
  cursor: pointer; padding: 4px; display: flex; align-items: center;
  transition: color 150ms ease;
}
.cr-drawer-close:hover { color: rgba(220,205,185,0.9); }
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

/* ══ prefers-reduced-motion ══ */
@media (prefers-reduced-motion: reduce) {
  .cr-bubble { animation: none; }
  .cr-drawer { transition: none; }
  .cr-back, .cr-report-btn, .cr-drawer-btn, .cr-drawer-close { transition: none; }
}

/* ══ 打印 ══ */
@media print {
  .cr-back, .cr-report-btn, .cr-drawer-mask { display: none !important; }
  .cr-page { height: auto; background: #fff; }
  .cr-drawer { position: static; transform: none; width: 100%; box-shadow: none; border: none; }
}
</style>
