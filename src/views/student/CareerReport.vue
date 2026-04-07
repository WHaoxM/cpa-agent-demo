<!-- 页面：职业生涯发展报告；路由：student/career-report；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { forceSimulation, forceCenter, forceCollide, forceManyBody, forceX, forceY, type SimulationNodeDatum } from 'd3'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores'
import { useLearningStore } from '@/stores/learning'
import { useReportStore } from '@/stores/report'
import {
  JOB_PORTRAITS, CAREER_PATH_EDGES,
  deriveStudentSevenDim, getGrowthPlan,
  type JobPortrait, type JobLevel,
} from '@/mock/careerReportData'
import * as echarts from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { gsap } from '@/plugins/gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

echarts.use([RadarChart, TooltipComponent, LegendComponent, SVGRenderer])

const router = useRouter()
const resumeStore = useResumeStore()
const userStore = useUserStore()
const learningStore = useLearningStore()
const reportStore = useReportStore()

const reportSaved = ref(false)

/* 关注方向：targetRoles 优先，如果为空则 fallback 到 predictedRole 或默认 */
const effectiveTargetRoles = computed<string[]>(() => {
  if (learningStore.targetRoles.length > 0) return learningStore.targetRoles.map(r => r.role)
  const predicted = resumeStore.insights?.predictedRole
  if (predicted) return [predicted]
  return ['前端开发']
})

function saveCareerReport() {
  const today = new Date().toISOString().slice(0, 10)
  const roles = effectiveTargetRoles.value
  const topJob = selectedJob.value
  reportStore.addRecord({
    type: 'career',
    title: `${today} · ${roles.join(' / ')}方向分析`,
    snapshot: {
      targetRoles: roles,
      selectedJobId: selectedJobId.value,
      selectedJobTitle: topJob?.title ?? '',
      topMatchScore: topJob?.matchScore ?? 0,
      studentDimSnapshot: studentDim.value,
    },
  })
  reportSaved.value = true
}

/* ══ 界面状态 ══ */
const activeMode = ref<'analysis' | 'report'>('analysis')
const selectedJobId = ref<string>('')
const reportTextEditable = ref('')
const radarEl = ref<HTMLElement | null>(null)
const climbingSvgEl = ref<SVGSVGElement | null>(null)
let radarChart: echarts.ECharts | null = null
let climbTimeline: gsap.core.Timeline | null = null
const expandedStages = ref<Set<string>>(new Set())
const checkResults = ref<Array<{ section: string; found: boolean }>>([])
const showCheckResults = ref(false)
const polishLoading = ref(false)
const polishDiff = ref<{ before: string; after: string } | null>(null)
const showExportMenu = ref(false)

/* ══ 定常配置 ══ */
const DIM_NAMES = ['专业技能', '证书资质', '创新能力', '学习能力', '抗压能力', '沟通能力', '实习经验'] as const

const LINE_COLORS: Record<string, string> = {
  frontend: '#E85D3A',
  data:     '#D4A017',
  qa:       '#4A90D9',
  fullstack:'#3DB88C',
}

const LEVEL_ORDER: Record<JobLevel, number> = {
  intern: 0, junior: 1, mid: 2, senior: 3, lead: 4, expert: 5,
}

/* ══ 推荐岗位：优先展示 targetRoles 对应岗位 ══ */
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
  // 少优先展示 targetRoles 关注方向的岗位
  for (const role of effectiveTargetRoles.value) {
    ;(roleToIds[role] ?? []).forEach(id => ids.add(id))
  }
  // 再补充 resumeStore 匹配到的其他岗位
  for (const c of matched.slice(0, 3)) {
    ;(roleToIds[c.role] ?? []).slice(0, 2).forEach(id => ids.add(id))
  }
  if (ids.size === 0) {
    ;['fe-mid', 'fe-junior', 'da-junior', 'qa-junior', 'fullstack'].forEach(id => ids.add(id))
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

/* ══ Circle Packing 气泡图布局 ══ */
type BubbleItem = { job: JobPortrait; x: number; y: number; r: number }

const BB_W = 360, BB_H = 300

function circlePack(circles: Array<{ id: string; r: number }>): Array<{ id: string; x: number; y: number; r: number }> {
  if (!circles.length) return []
  const placed: Array<{ id: string; x: number; y: number; r: number }> = []
  const c0 = circles[0]!
  placed.push({ id: c0.id, r: c0.r, x: 0, y: 0 })
  if (circles.length === 1) return placed

  const c1 = circles[1]!
  placed.push({ id: c1.id, r: c1.r, x: c0.r + c1.r, y: 0 })
  if (circles.length === 2) return placed

  for (let i = 2; i < circles.length; i++) {
    const c = circles[i]
    if (!c) continue
    let bestX = 0, bestY = 0, bestDist = Infinity
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        const pa = placed[a]!, pb = placed[b]!
        const pts = tangentCircle(pa, pb, c.r)
        for (const pt of pts) {
          if (placed.every(p => Math.sqrt((pt.x - p.x) ** 2 + (pt.y - p.y) ** 2) >= p.r + c.r - 0.5)) {
            const d = pt.x * pt.x + pt.y * pt.y
            if (d < bestDist) { bestDist = d; bestX = pt.x; bestY = pt.y }
          }
        }
      }
    }
    placed.push({ id: c.id, r: c.r, x: bestX, y: bestY })
  }
  return placed
}

function tangentCircle(a: { x: number; y: number; r: number }, b: { x: number; y: number; r: number }, rc: number) {
  const dx = b.x - a.x, dy = b.y - a.y
  const dab = Math.sqrt(dx * dx + dy * dy)
  if (dab < 1e-6) return []
  const ra = a.r + rc, rb = b.r + rc
  const cosA = (dab * dab + ra * ra - rb * rb) / (2 * dab * ra)
  if (Math.abs(cosA) > 1) return []
  const sinA = Math.sqrt(1 - cosA * cosA)
  const angle = Math.atan2(dy, dx)
  return [
    { x: a.x + ra * Math.cos(angle + Math.asin(sinA)), y: a.y + ra * Math.sin(angle + Math.asin(sinA)) },
    { x: a.x + ra * Math.cos(angle - Math.asin(sinA)), y: a.y + ra * Math.sin(angle - Math.asin(sinA)) },
  ]
}

const bubbleLayout = computed<BubbleItem[]>(() => {
  const sorted = [...JOB_PORTRAITS]
    .map(j => ({ ...j, matchScore: recommendedIds.value.has(j.id) ? j.matchScore : j.matchScore * 0.65 }))
    .sort((a, b) => b.matchScore - a.matchScore)

  const circles = sorted.map(j => ({ id: j.id, r: Math.round(12 + j.matchScore * 28) }))
  const packed = circlePack(circles)
  if (!packed.length) return []

  const minX = Math.min(...packed.map(c => c.x - c.r))
  const maxX = Math.max(...packed.map(c => c.x + c.r))
  const minY = Math.min(...packed.map(c => c.y - c.r))
  const maxY = Math.max(...packed.map(c => c.y + c.r))
  const pw = maxX - minX, ph = maxY - minY
  const scale = Math.min((BB_W - 20) / pw, (BB_H - 20) / ph, 1.3)
  const cx = BB_W / 2, cy = BB_H / 2
  const ocx = (minX + maxX) / 2, ocy = (minY + maxY) / 2

  return packed.map(c => {
    const job = sorted.find(j => j.id === c.id)!
    return {
      job,
      x: Math.round(cx + (c.x - ocx) * scale),
      y: Math.round(cy + (c.y - ocy) * scale),
      r: Math.round(c.r * scale),
    }
  })
})

/* ══ D3 Force Simulation（气泡漂浮动画）══ */
type SimNode = SimulationNodeDatum & { id: string; r: number; job: JobPortrait }
type RenderNode = { id: string; x: number; y: number; r: number; job: JobPortrait }

const simNodes = ref<RenderNode[]>([])
let _sim: ReturnType<typeof forceSimulation<SimNode>> | null = null
let _orbitAngle = 0

function startSim(items: BubbleItem[]) {
  _sim?.stop()
  if (!items.length) { simNodes.value = []; return }

  const nodes: SimNode[] = items.map(item => ({
    id: item.job.id,
    x: item.x, y: item.y,
    r: item.r,
    job: item.job,
    vx: 0, vy: 0,
  }))

  /* 最大气泡固定在中心 */
  const largest = nodes.reduce((a, b) => a.r > b.r ? a : b)
  largest.fx = BB_W / 2
  largest.fy = BB_H / 2

  const nonCenter = nodes.filter(n => n.fx === undefined)
  const nCount = nonCenter.length
  const cx = BB_W / 2, cy = BB_H / 2
  /* 轨道半径：最大气泡半径 + 平均小泡半径 + 间距，确保不遮挡 */
  const avgR = nCount > 0 ? nonCenter.reduce((s, n) => s + n.r, 0) / nCount : 20
  const orbitR = largest.r + avgR + 8
  _orbitAngle = 0

  _sim = forceSimulation(nodes)
    /* 核心轨道力：每 tick 推进旋转角，驱动各气泡沿轨道环追踪 */
    .force('orbit', () => {
      _orbitAngle += 0.0005  /* rad/tick，约 45s 一圈（60fps）*/
      nonCenter.forEach((n, i) => {
        const angle = _orbitAngle + i * (2 * Math.PI / nCount)
        const tx = cx + Math.cos(angle) * orbitR
        const ty = cy + Math.sin(angle) * orbitR
        /* 弹簧力：朝轨道目标位置施力，驱动旋转 */
        n.vx = (n.vx ?? 0) + (tx - (n.x ?? cx)) * 0.09
        n.vy = (n.vy ?? 0) + (ty - (n.y ?? cy)) * 0.09
      })
    })
    /* 防重叠：气泡间保持 2px 间隙 */
    .force('collide', forceCollide<SimNode>(d => d.r + 2).strength(0.9).iterations(4))
    .alphaTarget(0.35)     /* 持续高能，轨道力始终有效 */
    .velocityDecay(0.18)   /* 低阻尼 = 惯性强 = 旋转流畅可见 */
    .on('tick', () => {
      simNodes.value = nodes.map(n => ({
        id: n.id,
        x: Math.max(n.r + 2, Math.min(BB_W - n.r - 2, n.x ?? cx)),
        y: Math.max(n.r + 2, Math.min(BB_H - n.r - 2, n.y ?? cy)),
        r: n.r,
        job: n.job,
      }))
    })
}

watch(bubbleLayout, items => startSim(items), { immediate: true })
onBeforeUnmount(() => _sim?.stop())

/* ══ 攀岩墙布局 ══ */
type ClimbNode = { id: string; title: string; level: JobLevel; lineId: string; salaryRange: string; x: number; y: number }
type ClimbHold = { x: number; y: number; label: string; mastered: boolean; edgeType: 'promote' | 'transfer' }
type ClimbRope = { path: string; type: 'promote' | 'transfer'; fromId: string; toId: string; holds: ClimbHold[] }

const CW_W = 400, CW_H = 720
const CW_NODE_R = 22

function strHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const masteredSkillNames = computed(() => {
  const set = new Set<string>()
  for (const s of resumeStore.parsedSkills) set.add(s.name.toLowerCase())
  return set
})

function isSkillMastered(skill: string): boolean {
  const lower = skill.toLowerCase()
  for (const s of masteredSkillNames.value) {
    if (lower.includes(s) || s.includes(lower)) return true
  }
  return false
}

const climbLayout = computed<{ nodes: ClimbNode[]; ropes: ClimbRope[] }>(() => {
  if (!selectedJob.value) return { nodes: [], ropes: [] }
  const lineId = selectedJob.value.lineId
  const lineJobs = JOB_PORTRAITS.filter(j => j.lineId === lineId)
    .sort((a, b) => (LEVEL_ORDER[a.level] ?? 0) - (LEVEL_ORDER[b.level] ?? 0))

  const relatedEdges = CAREER_PATH_EDGES.filter(e => {
    const from = JOB_PORTRAITS.find(j => j.id === e.fromId)
    const to = JOB_PORTRAITS.find(j => j.id === e.toId)
    return (from?.lineId === lineId || to?.lineId === lineId)
  })

  const allJobIds = new Set<string>()
  lineJobs.forEach(j => allJobIds.add(j.id))
  relatedEdges.forEach(e => { allJobIds.add(e.fromId); allJobIds.add(e.toId) })

  const allJobs = [...allJobIds].map(id => JOB_PORTRAITS.find(j => j.id === id)!).filter(Boolean)
  const mainIds = new Set(lineJobs.map(j => j.id))

  const pad = 50
  const levels = allJobs.map(j => LEVEL_ORDER[j.level] ?? 0)
  const minLvl = Math.min(...levels), maxLvl = Math.max(...levels)
  const range = Math.max(maxLvl - minLvl, 1)

  const nodes: ClimbNode[] = allJobs.map(j => {
    const lvl = LEVEL_ORDER[j.level] ?? 0
    const t = (lvl - minLvl) / range
    const isMain = mainIds.has(j.id)
    /* x: 主线节点在中央±40px范围内散布，旁支节点散至两侧 */
    const xJitter = isMain
      ? (strHash(j.id + 'x') % 80) - 40
      : (strHash(j.id) % 2 === 0 ? -1 : 1) * (80 + (strHash(j.id + 'x2') % 60))
    const xBase = Math.max(CW_NODE_R + 12, Math.min(CW_W - CW_NODE_R - 12, Math.round(CW_W / 2 + xJitter)))
    /* y: 同级节点上下±20px错落，呈现真实攀岩壁层次感 */
    const yJitter = (strHash(j.id + 'y') % 40) - 20
    return {
      id: j.id, title: j.title, level: j.level, lineId: j.lineId, salaryRange: j.salaryRange,
      x: xBase,
      y: Math.round(CW_H - pad - t * (CW_H - pad * 2)) + yJitter,
    }
  })

  /* 岗位节点防重叠：多轮推离，直到节点圆心间距 ≥ 2r+10 */
  const nodeMinDist = CW_NODE_R * 2 + 10
  for (let iter = 0; iter < 8; iter++) {
    for (let ai = 0; ai < nodes.length; ai++) {
      for (let bi = ai + 1; bi < nodes.length; bi++) {
        const a = nodes[ai]!, b = nodes[bi]!
        const ddx = b.x - a.x, ddy = b.y - a.y
        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
        if (dist < nodeMinDist && dist > 0.1) {
          const half = (nodeMinDist - dist) / 2 + 2
          const nx = ddx / dist, ny = ddy / dist
          a.x = Math.max(CW_NODE_R + 12, Math.min(CW_W - CW_NODE_R - 12, Math.round(a.x - nx * half)))
          a.y = Math.max(pad, Math.min(CW_H - pad, Math.round(a.y - ny * half)))
          b.x = Math.max(CW_NODE_R + 12, Math.min(CW_W - CW_NODE_R - 12, Math.round(b.x + nx * half)))
          b.y = Math.max(pad, Math.min(CW_H - pad, Math.round(b.y + ny * half)))
        }
      }
    }
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const ropes: ClimbRope[] = []

  /* 全局技能去重集合 & 已放置 hold 坐标（用于互斥推离） */
  const placedSkills = new Set<string>()
  const placedHoldPositions: Array<{ x: number; y: number }> = []

  for (const edge of relatedEdges) {
    const fn = nodeMap.get(edge.fromId)
    const tn = nodeMap.get(edge.toId)
    if (!fn || !tn) continue

    /* 路径 & 曲线求值函数 */
    let path: string
    let evalCurve: (t: number) => { x: number; y: number }

    if (edge.type === 'promote') {
      /* 晋升：二次贝塞尔，轻微侧弯 */
      const midY = (fn.y + tn.y) / 2
      const cpx = fn.x + (strHash(edge.fromId + edge.toId) % 30 - 15)
      path = `M ${fn.x} ${fn.y} Q ${cpx} ${midY} ${tn.x} ${tn.y}`
      evalCurve = (t) => ({
        x: (1 - t) * (1 - t) * fn.x + 2 * (1 - t) * t * cpx + t * t * tn.x,
        y: (1 - t) * (1 - t) * fn.y + 2 * (1 - t) * t * midY + t * t * tn.y,
      })
    } else {
      /* 转岗：三次贝塞尔，控制点向下偏移模拟绳子重力垂弧 */
      const dx = tn.x - fn.x
      const sag = Math.max(35, Math.abs(dx) * 0.38)
      const cx1 = fn.x + dx * 0.25
      const cy1 = fn.y + sag
      const cx2 = fn.x + dx * 0.75
      const cy2 = tn.y + sag
      path = `M ${fn.x} ${fn.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${tn.x} ${tn.y}`
      evalCurve = (t) => ({
        x: (1-t)**3*fn.x + 3*(1-t)**2*t*cx1 + 3*(1-t)*t**2*cx2 + t**3*tn.x,
        y: (1-t)**3*fn.y + 3*(1-t)**2*t*cy1 + 3*(1-t)*t**2*cy2 + t**3*tn.y,
      })
    }

    /* 过滤掉已经出现过的技能 */
    const uniqueSkills = edge.skills.filter(s => !placedSkills.has(s)).slice(0, 5)
    uniqueSkills.forEach(s => placedSkills.add(s))

    const holds: ClimbHold[] = uniqueSkills.map((skill, si) => {
      const t = (si + 1) / (uniqueSkills.length + 1)
      const { x: bx, y: by } = evalCurve(t)
      /* 用两个独立 hash 让 x/y 初始散布互不相关，范围更大 */
      const hash = strHash(skill)
      const hash2 = strHash(skill + '__scatter')
      let ox = (hash % 160) - 80
      let oy = (hash2 % 110) - 55
      /* 多轮推离：岗位节点 + 已放置 hold */
      for (let iter = 0; iter < 5; iter++) {
        for (const nd of nodes) {
          const dx2 = (bx + ox) - nd.x, dy2 = (by + oy) - nd.y
          const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2)
          const minDist = CW_NODE_R + 18
          if (dist < minDist && dist > 0.1) {
            const push = (minDist - dist) + 8
            ox += (dx2 / dist) * push
            oy += (dy2 / dist) * push
          }
        }
        for (const ph of placedHoldPositions) {
          const dx3 = (bx + ox) - ph.x, dy3 = (by + oy) - ph.y
          const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3)
          const minHoldDist = 42
          if (dist3 < minHoldDist && dist3 > 0.1) {
            const push3 = (minHoldDist - dist3) + 5
            ox += (dx3 / dist3) * push3
            oy += (dy3 / dist3) * push3
          }
        }
      }
      const finalX = Math.max(14, Math.min(CW_W - 14, Math.round(bx + ox)))
      const finalY = Math.max(14, Math.min(CW_H - 14, Math.round(by + oy)))
      placedHoldPositions.push({ x: finalX, y: finalY })
      return { x: finalX, y: finalY, label: skill, mastered: isSkillMastered(skill), edgeType: edge.type }
    })

    ropes.push({ path, type: edge.type, fromId: edge.fromId, toId: edge.toId, holds })
  }

  return { nodes, ropes }
})

/* ══ 差距数值 ══ */
const dimGaps = computed(() => {
  if (!selectedJob.value) return [] as Array<{ name: string; mine: number; need: number; gap: number }>
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
    animationDuration: 700,
    animationEasing: 'cubicOut' as const,
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: { name: string; value: number[] }) => {
        const vals = params.value
        return DIM_NAMES.map((n, i) => `<span style="color:#9C8B78">${n}</span> ${vals[i]}`).join('<br/>')
      },
    },
    radar: {
      indicator: DIM_NAMES.map(name => ({ name, max: 100 })),
      /* 42% × 250px 容器 = 105px 半径，上下各留 ~20px 给标签，不再溢出 */
      radius: '42%',
      center: ['50%', '50%'],
      splitNumber: 4,
      nameGap: 6,
      axisName: {
        color: '#5C4A38',
        fontSize: 10.5,
        fontFamily: 'var(--font-ui)',
        backgroundColor: 'rgba(247,242,232,0.75)',
        borderRadius: 3,
        padding: [2, 5],
      },
      splitLine: { lineStyle: { color: 'rgba(139,37,0,0.10)', width: 1 } },
      splitArea: {
        show: true,
        areaStyle: {
          color: [
            'rgba(247,242,232,0.55)',
            'rgba(240,234,220,0.40)',
            'rgba(233,225,210,0.25)',
            'rgba(226,217,200,0.12)',
          ],
        },
      },
      axisLine: { lineStyle: { color: 'rgba(139,37,0,0.12)' } },
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: DIM_NAMES.map(n => studentDim.value[n]),
          name: '我的能力',
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#C0501A', width: 2 },
          areaStyle: { color: 'rgba(192,80,26,0.20)' },
          itemStyle: { color: '#C0501A', borderColor: '#fff', borderWidth: 1.5 },
        },
        {
          value: DIM_NAMES.map(n => job.sevenDim[n]),
          name: '岗位要求',
          symbol: 'rect',
          symbolSize: 4,
          lineStyle: { color: '#2B6CB0', width: 1.8, type: 'dashed' as const },
          areaStyle: { color: 'rgba(43,108,176,0.08)' },
          itemStyle: { color: '#2B6CB0' },
        },
      ],
    }],
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

/* ══ GSAP 攀岩墙动画 ══ */
function animateClimbingWall() {
  if (!climbingSvgEl.value) return
  climbTimeline?.kill()
  const tl = gsap.timeline()
  climbTimeline = tl

  const ropePaths = climbingSvgEl.value.querySelectorAll('.cw-rope-path')
  ropePaths.forEach((path, i) => {
    const el = path as SVGPathElement
    const len = el.getTotalLength()
    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = `${len}`
    tl.to(el, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, i * 0.3)
  })

  const holds = climbingSvgEl.value.querySelectorAll('.cw-hold')
  if (holds.length) {
    tl.from(holds, { scale: 0, transformOrigin: 'center center', stagger: 0.03, ease: 'back.out(2)', duration: 0.3 }, '-=0.4')
  }

  const jobNodes = climbingSvgEl.value.querySelectorAll('.cw-job-node')
  if (jobNodes.length) {
    tl.from(jobNodes, { scale: 0.8, opacity: 0.5, transformOrigin: 'center center', stagger: 0.1, ease: 'elastic.out(1, 0.5)', duration: 0.6 }, '-=0.3')
  }

  const climber = climbingSvgEl.value.querySelector('.cw-climber')
  if (climber && ropePaths.length > 0) {
    const firstRope = ropePaths[0] as SVGPathElement
    tl.to(climber, {
      motionPath: { path: firstRope, align: firstRope, alignOrigin: [0.5, 0.5] },
      duration: 1.5, ease: 'power1.inOut',
    }, '-=0.2')
    tl.fromTo(climber, { scale: 1 }, { scale: 1.2, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut' })
  }
}

watch(() => climbLayout.value, async () => { await nextTick(); animateClimbingWall() })

/* ══ 报告文本 ══ */
const reportText = computed(() => {
  const job = selectedJob.value
  const user = userStore.currentUser?.name ?? '同学'
  if (!job) return ''
  const gaps = dimGaps.value.filter(d => d.gap > 0).map(d => `${d.name}（差 ${d.gap} 分）`).join('、') || '无明显差距'
  const plan = growthPlan.value.map(s => `**${s.phaseLabel}**：${s.goal}`).join('\n')
  return `# 职业生涯发展报告\n\n**学生**：${user}    **目标岗位**：${job.title}    **生成日期**：${new Date().toLocaleDateString('zh-CN')}\n\n## 岗位匹配摘要\n\n根据简历能力画像分析，系统匹配度最高岗位为「${job.title}」，匹配度 ${Math.round(job.matchScore * 100)}%。\n${job.desc}。工资区间：${job.salaryRange}\n\n## 七维能力差距\n\n主要待补齐维度：${gaps}\n\n## 个性化成长计划\n\n${plan}\n\n## 关键技能要求\n\n${job.keySkills.map(s => `- ${s}`).join('\n')}\n`
})

/* ══ Markdown → HTML ══ */
function mdToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h2 class="rp-h2">$1</h2>')
    .replace(/^## (.+)$/gm, '<h3 class="rp-h3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, '<ul class="rp-list">$&</ul>')
    .replace(/\n{2,}/g, '</p><p class="rp-p">')
    .replace(/^(?!<)(.+)/gm, '<p class="rp-p">$1</p>')
}

const reportHtml = computed(() => mdToHtml(reportTextEditable.value || reportText.value))

/* ══ 报告编辑工具 ══ */
function switchToReport() {
  if (!reportTextEditable.value) reportTextEditable.value = reportText.value
  activeMode.value = 'report'
}

function checkCompleteness() {
  const text = reportTextEditable.value
  const sections = [
    { section: '岗位匹配摘要', found: text.includes('岗位匹配摘要') },
    { section: '七维能力差距', found: text.includes('七维能力差距') },
    { section: '个性化成长计划', found: text.includes('成长计划') },
    { section: '关键技能要求', found: text.includes('技能要求') },
  ]
  checkResults.value = sections
  showCheckResults.value = true
}

function autoFillMissing() {
  const text = reportTextEditable.value
  let patched = text
  if (!text.includes('岗位匹配摘要') && selectedJob.value) {
    patched += `\n\n## 岗位匹配摘要\n\n匹配度 ${Math.round(selectedJob.value.matchScore * 100)}%。${selectedJob.value.desc}\n`
  }
  if (!text.includes('七维能力差距')) {
    const gaps = dimGaps.value.filter(d => d.gap > 0).map(d => `${d.name}（差 ${d.gap} 分）`).join('、') || '无明显差距'
    patched += `\n\n## 七维能力差距\n\n主要待补齐维度：${gaps}\n`
  }
  if (!text.includes('成长计划')) {
    const plan = growthPlan.value.map(s => `**${s.phaseLabel}**：${s.goal}`).join('\n')
    patched += `\n\n## 个性化成长计划\n\n${plan}\n`
  }
  if (!text.includes('技能要求') && selectedJob.value) {
    patched += `\n\n## 关键技能要求\n\n${selectedJob.value.keySkills.map(s => `- ${s}`).join('\n')}\n`
  }
  reportTextEditable.value = patched
  checkCompleteness()
}

function polishReport() {
  polishLoading.value = true
  polishDiff.value = null
  const before = reportTextEditable.value
  setTimeout(() => {
    let after = before
    after = after.replace(/匹配度 (\d+)%/g, '综合匹配度达 $1%')
    after = after.replace(/主要待补齐维度/g, '根据七维能力模型分析，主要待补齐维度')
    after = after.replace(/工资区间/g, '市场薪资参考区间')
    if (!after.includes('总结与展望')) {
      after += '\n\n## 总结与展望\n\n通过系统的技能补齐与实践积累，有望在 12–18 个月内达成目标岗位的核心能力要求。建议持续关注行业动态，及时调整成长路径。\n'
    }
    polishDiff.value = { before, after }
    polishLoading.value = false
  }, 1500)
}

function applyPolish() {
  if (polishDiff.value) {
    reportTextEditable.value = polishDiff.value.after
    polishDiff.value = null
  }
}

function refreshReportData() {
  reportTextEditable.value = reportText.value
}

function exportPrint() { showExportMenu.value = false; window.print() }

function exportCopy() {
  showExportMenu.value = false
  navigator.clipboard.writeText(reportTextEditable.value || reportText.value)
}

function exportDownload() {
  showExportMenu.value = false
  const blob = new Blob([reportTextEditable.value || reportText.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = '职业发展报告.md'; a.click()
  URL.revokeObjectURL(url)
}

const wordCount = computed(() => (reportTextEditable.value || reportText.value).length)

function selectJob(id: string) { selectedJobId.value = id }
function goBack() { router.push({ name: 'student-career-navigation' }) }
function toggleStage(phase: string) {
  if (expandedStages.value.has(phase)) expandedStages.value.delete(phase)
  else expandedStages.value.add(phase)
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
  climbTimeline?.kill()
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
      </div>
      <div class="cr-header__tabs">
        <button class="cr-tab" :class="{ 'cr-tab--active': activeMode === 'analysis' }" @click="activeMode = 'analysis'">
          <Icon icon="lucide:bar-chart-3" :width="13"/><span>职业分析</span>
        </button>
        <button class="cr-tab" :class="{ 'cr-tab--active': activeMode === 'report' }" @click="switchToReport">
          <Icon icon="lucide:file-text" :width="13"/><span>报告编辑</span>
        </button>
      </div>
      <div class="cr-header__right">
        <button
          class="cr-save-btn"
          :disabled="reportSaved"
          @click="saveCareerReport"
          title="保存本次报告到我的报告"
        >
          <Icon :icon="reportSaved ? 'lucide:check' : 'lucide:save'" :width="12"/>
          <span>{{ reportSaved ? '已保存' : '保存报告' }}</span>
        </button>
        <span class="cr-username">{{ userStore.currentUser?.name ?? '同学' }}</span>
        <!-- 导出按钮（仅报告模式） -->
        <div v-if="activeMode === 'report'" class="cr-export-wrap">
          <button class="cr-export-btn" @click="showExportMenu = !showExportMenu">
            <Icon icon="lucide:download" :width="12"/><span>导出</span><Icon icon="lucide:chevron-down" :width="10"/>
          </button>
          <div v-if="showExportMenu" class="cr-export-menu">
            <button @click="exportPrint"><Icon icon="lucide:printer" :width="12"/>打印 / PDF</button>
            <button @click="exportCopy"><Icon icon="lucide:copy" :width="12"/>复制到剪贴板</button>
            <button @click="exportDownload"><Icon icon="lucide:file-down" :width="12"/>下载 .md 文件</button>
          </div>
        </div>
        <!-- 生成报告按钮（仅分析模式） -->
        <button v-else class="cr-report-btn" :disabled="!selectedJob" @click="switchToReport">
          <Icon icon="lucide:file-text" :width="12"/><span>生成报告</span>
        </button>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════ -->
    <!--              模式 A：职业分析                 -->
    <!-- ═══════════════════════════════════════════ -->
    <div v-if="activeMode === 'analysis'" class="cr-main">

      <!-- ══ 左栏：攀岩墙路径图 ══ -->
      <div class="cr-left">
        <div class="cr-panel-title">
          <Icon icon="lucide:mountain" :width="12"/>
          <span>职业攀岩路径</span>
          <span v-if="selectedJob" class="cr-panel-sub">{{ selectedJob.title }} 所在线路</span>
        </div>

        <div class="cr-cw-wrap">
          <svg
            v-if="climbLayout.nodes.length"
            ref="climbingSvgEl"
            class="cr-cw-svg"
            :viewBox="`0 0 ${CW_W} ${CW_H}`"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
          >
            <!-- 墙面纹理 pattern -->
            <defs>
              <pattern id="cw-wall" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="var(--bg-200, #EDE5D6)"/>
                <circle cx="3" cy="7" r="0.6" fill="rgba(139,37,0,0.06)"/>
                <circle cx="14" cy="3" r="0.4" fill="rgba(139,37,0,0.04)"/>
                <circle cx="8" cy="16" r="0.5" fill="rgba(139,37,0,0.05)"/>
                <circle cx="17" cy="12" r="0.3" fill="rgba(139,37,0,0.04)"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cw-wall)"/>

            <!-- 绳索路径 -->
            <path
              v-for="(rope, ri) in climbLayout.ropes" :key="'r'+ri"
              class="cw-rope-path"
              :d="rope.path"
              :stroke="rope.type === 'promote' ? 'rgba(232,93,58,0.75)' : 'rgba(74,144,217,0.75)'"
              stroke-width="2" fill="none"
              stroke-linecap="round"
            />

            <!-- 技能抓手 -->
            <g v-for="rope in climbLayout.ropes" :key="'h'+rope.fromId+rope.toId">
              <g v-for="hold in rope.holds" :key="hold.label" class="cw-hold" :transform="`translate(${hold.x},${hold.y})`">
                <ellipse
                  rx="15" ry="10"
                  :fill="hold.mastered
                    ? (hold.edgeType === 'promote' ? 'rgba(62,184,140,0.88)' : 'rgba(74,144,217,0.85)')
                    : 'rgba(255,252,245,0.96)'"
                  :stroke="hold.mastered
                    ? (hold.edgeType === 'promote' ? '#2A9D6E' : '#2E78C0')
                    : (hold.edgeType === 'promote' ? '#B8421A' : '#2E78C0')"
                  :stroke-width="hold.mastered ? 2.2 : 1.8"
                />
                <text y="3" text-anchor="middle" class="cw-hold-text">
                  {{ hold.label.length > 6 ? hold.label.slice(0,6) + '…' : hold.label }}
                </text>
                <title>{{ hold.label }}{{ hold.mastered ? ' ✓ 已掌握' : ' ✗ 未掌握' }}</title>
              </g>
            </g>

            <!-- 岗位节点（圆形攀岩平台） -->
            <g
              v-for="node in climbLayout.nodes" :key="node.id"
              class="cw-job-node"
              :transform="`translate(${node.x},${node.y})`"
              @click="selectJob(node.id)"
            >
              <!-- 外圈光晕（选中态） -->
              <circle v-if="selectedJobId === node.id"
                :r="CW_NODE_R + 6" fill="none"
                :stroke="LINE_COLORS[node.lineId] ?? '#E85D3A'" stroke-width="1.5"
                opacity="0.35"
              />
              <!-- 主圆 -->
              <circle
                :r="CW_NODE_R"
                :fill="selectedJobId === node.id
                  ? (LINE_COLORS[node.lineId] ?? '#E85D3A')
                  : 'rgba(237,229,214,0.95)'"
                :stroke="LINE_COLORS[node.lineId] ?? '#E85D3A'"
                :stroke-width="selectedJobId === node.id ? 3 : 2"
              />
              <!-- 内部高光 -->
              <circle
                :r="CW_NODE_R - 6" fill="none"
                :stroke="selectedJobId === node.id ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.05)'"
                stroke-width="0.8"
              />
              <text y="-3" text-anchor="middle"
                class="cw-node-title"
                :class="{ 'cw-node-title--active': selectedJobId === node.id }">
                {{ node.title.length > 4 ? node.title.slice(0,4) : node.title }}
              </text>
              <text y="8" text-anchor="middle"
                class="cw-node-sub"
                :class="{ 'cw-node-sub--active': selectedJobId === node.id }">
                {{ node.salaryRange }}
              </text>
              <!-- 完整标题悬浮提示 -->
              <title>{{ node.title }} · {{ node.salaryRange }}</title>
            </g>

            <!-- 攀登者标记 -->
            <g v-if="selectedJob" class="cw-climber">
              <text
                :x="climbLayout.nodes.find(n => n.id === selectedJobId)?.x ?? CW_W/2"
                :y="(climbLayout.nodes.find(n => n.id === selectedJobId)?.y ?? CW_H - 50) + 24"
                text-anchor="middle" font-size="16">🧗</text>
            </g>

            <!-- 图例 -->
            <g transform="translate(8,12)">
              <line x1="0" y1="0" x2="16" y2="0" stroke="rgba(232,93,58,0.6)" stroke-width="2"/>
              <text x="20" y="4" class="cw-legend-text">晋升路径</text>
              <line x1="0" y1="14" x2="16" y2="14" stroke="rgba(74,144,217,0.6)" stroke-width="2"/>
              <text x="20" y="18" class="cw-legend-text">转岗路径</text>
              <ellipse cx="4" cy="30" rx="5" ry="3.5" fill="rgba(62,184,140,0.5)" stroke="#3DB88C" stroke-width="1"/>
              <text x="20" y="33" class="cw-legend-text">已掌握</text>
              <ellipse cx="4" cy="44" rx="5" ry="3.5" fill="rgba(237,229,214,0.5)" stroke="#E85D3A" stroke-width="1" stroke-dasharray="2 1"/>
              <text x="20" y="47" class="cw-legend-text">未掌握</text>
            </g>
          </svg>

          <div v-else class="cr-cw-empty">
            <Icon icon="lucide:mountain" :width="24"/>
            <p>选择岗位后<br/>展示攀岩路径</p>
          </div>
        </div>
      </div>

      <!-- ══ 中栏 ══ -->
      <div class="cr-center">

        <!-- ① Hero 概览条 -->
        <div v-if="selectedJob" class="cr-hero">
          <div class="cr-hero__gauge">
            <svg viewBox="0 0 80 80" class="cr-hero-ring">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-300)" stroke-width="5"/>
              <circle cx="40" cy="40" r="34" fill="none"
                :stroke="LINE_COLORS[selectedJob.lineId] ?? '#8B2500'"
                stroke-width="5" stroke-linecap="round"
                :stroke-dasharray="`${Math.round(selectedJob.matchScore * 213.6)} 213.6`"
                transform="rotate(-90 40 40)"/>
              <text x="40" y="38" text-anchor="middle" class="cr-hero-pct">{{ Math.round(selectedJob.matchScore * 100) }}%</text>
              <text x="40" y="50" text-anchor="middle" class="cr-hero-pct-label">匹配度</text>
            </svg>
          </div>
          <div class="cr-hero__info">
            <div class="cr-hero-job">{{ selectedJob.title }}</div>
            <div class="cr-hero-desc">{{ selectedJob.desc }}</div>
          </div>
        </div>

        <!-- 中栏上半：气泡图 + 雷达图 -->
        <div class="cr-center-top">

          <!-- ③ 气泡图 -->
          <div class="cr-bubble-panel">
            <div class="cr-panel-title">
              <Icon icon="lucide:circle-dot" :width="12"/>
              <span>岗位匹配气泡图</span>
              <span class="cr-panel-sub">气泡越大匹配度越高</span>
            </div>
            <svg :viewBox="`0 0 ${BB_W} ${BB_H}`" class="cr-bubble-svg">
              <g
                v-for="(item, i) in simNodes" :key="item.job.id"
                class="cr-bubble-g"
                :class="{ 'cr-bubble-g--sel': selectedJobId === item.job.id }"
                :style="{
                  '--c': LINE_COLORS[item.job.lineId] ?? '#8B2500',
                  '--bd': (3.2 + i * 0.35) + 's',
                  '--bk': '-' + (i * 0.55) + 's',
                }"
                :transform="`translate(${item.x},${item.y})`"
                @click="selectJob(item.job.id)"
              >
                <circle :r="item.r" class="cr-bubble-circle"/>
                <text v-if="item.r >= 22" class="cr-bt" dy="-4">
                  {{ item.job.title.length > 4 ? item.job.title.slice(0,4) : item.job.title }}
                </text>
                <text v-if="item.r >= 22" class="cr-bp" dy="10">
                  {{ Math.round(item.job.matchScore * 100) }}%
                </text>
                <text v-else-if="item.r >= 14" class="cr-ba" dy="4">
                  {{ item.job.title.slice(0,3) }}
                </text>
                <title>{{ item.job.title }} · {{ Math.round(item.job.matchScore * 100) }}%</title>
              </g>
            </svg>
          </div>

          <!-- ② 雷达图 + 差距条 -->
          <div class="cr-radar-panel">
            <div class="cr-panel-title">
              <Icon icon="lucide:radar" :width="12"/>
              <span>七维能力差距</span>
              <span class="cr-radar-legend">
                <span class="cr-legend-dot" style="background:#C0501A"></span><span>我的能力</span>
                <span class="cr-legend-dot cr-legend-dot--dashed" style="border-color:#2B6CB0"></span><span>岗位要求</span>
              </span>
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

        <!-- ⑤ 成长计划 -->
        <div class="cr-center-bottom">
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
              <div v-for="(stage, si) in growthPlan" :key="stage.phase" class="cr-plan-stage"
                :class="`cr-plan-stage--${stage.phase}`">
                <div class="cr-ps-head" @click="toggleStage(stage.phase)">
                  <Icon :icon="stage.phase === 'short' ? 'lucide:target' : 'lucide:rocket'" :width="14" class="cr-ps-icon"/>
                  <span class="cr-ps-label">{{ stage.phaseLabel }}</span>
                  <Icon :icon="expandedStages.has(stage.phase) ? 'lucide:chevron-up' : 'lucide:chevron-down'" :width="12" class="cr-ps-toggle"/>
                </div>
                <span class="cr-ps-goal">{{ stage.goal }}</span>
                <ul class="cr-ps-list" :class="{ 'cr-ps-list--collapsed': !expandedStages.has(stage.phase) }">
                  <li v-for="(t, ti) in stage.tasks" :key="ti">
                    <Icon icon="lucide:circle" :width="8" class="cr-ps-bullet"/>{{ t }}
                  </li>
                </ul>
                <button v-if="!expandedStages.has(stage.phase) && stage.tasks.length > 3" class="cr-ps-expand" @click="toggleStage(stage.phase)">
                  展开全部 ({{ stage.tasks.length }}项)
                </button>
                <div class="cr-ps-milestone">
                  <Icon icon="lucide:flag" :width="10"/>{{ stage.milestone }}
                </div>
                <!-- 阶段之间的箭头 -->
                <div v-if="si < growthPlan.length - 1" class="cr-ps-arrow">
                  <Icon icon="lucide:arrow-right" :width="16"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!--              模式 B：报告编辑                 -->
    <!-- ═══════════════════════════════════════════ -->
    <div v-else class="cr-report-main">

      <!-- 左栏：报告预览 -->
      <div class="cr-rp-preview">
        <div class="cr-rp-preview-inner" v-html="reportHtml"></div>
      </div>

      <!-- 右栏：工具栏 + 编辑区 -->
      <div class="cr-rp-right">

        <!-- ⑥ 工具栏 -->
        <div class="cr-rp-toolbar">
          <div class="cr-rp-toolbar-title">
            <Icon icon="lucide:wrench" :width="12"/>编辑工具
          </div>

          <!-- 完整性检查 -->
          <button class="cr-tool-btn" @click="checkCompleteness">
            <Icon icon="lucide:search-check" :width="13"/><span>完整性检查</span>
          </button>
          <div v-if="showCheckResults" class="cr-check-results">
            <div v-for="r in checkResults" :key="r.section" class="cr-check-item" :class="{ 'cr-check-item--ok': r.found }">
              <Icon :icon="r.found ? 'lucide:check-circle' : 'lucide:alert-circle'" :width="12"/>
              {{ r.section }}
            </div>
            <button v-if="checkResults.some(r => !r.found)" class="cr-tool-btn cr-tool-btn--sm" @click="autoFillMissing">
              <Icon icon="lucide:plus-circle" :width="11"/>一键补全缺失章节
            </button>
          </div>

          <!-- 智能润色 -->
          <button class="cr-tool-btn" :disabled="polishLoading" @click="polishReport">
            <Icon :icon="polishLoading ? 'lucide:loader-2' : 'lucide:sparkles'" :width="13" :class="{ 'cr-spin': polishLoading }"/>
            <span>{{ polishLoading ? '润色中…' : '智能润色' }}</span>
          </button>
          <div v-if="polishDiff" class="cr-polish-diff">
            <div class="cr-polish-actions">
              <button class="cr-tool-btn cr-tool-btn--sm cr-tool-btn--ok" @click="applyPolish">
                <Icon icon="lucide:check" :width="11"/>应用润色
              </button>
              <button class="cr-tool-btn cr-tool-btn--sm" @click="polishDiff = null">
                <Icon icon="lucide:x" :width="11"/>撤销
              </button>
            </div>
          </div>

          <!-- 数据刷新 -->
          <button class="cr-tool-btn" @click="refreshReportData">
            <Icon icon="lucide:refresh-cw" :width="13"/><span>数据摘要刷新</span>
          </button>
        </div>

        <!-- ⑦ 编辑区 -->
        <div class="cr-rp-editor-wrap">
          <textarea v-model="reportTextEditable" class="cr-rp-editor" placeholder="在此编辑 Markdown 报告内容…"></textarea>
        </div>
      </div>
    </div>

    <!-- ══ FOOTER ══ -->
    <footer class="cr-footer">
      <span class="cr-footer-source">数据来源：简历解析 + 岗位模型匹配</span>
      <span v-if="activeMode === 'report'" class="cr-footer-wc">字数：{{ wordCount }}</span>
      <span class="cr-footer-time">{{ new Date().toLocaleDateString('zh-CN') }}</span>
      <button v-if="activeMode === 'analysis'" class="cr-footer-go" @click="switchToReport">
        进入报告编辑 <Icon icon="lucide:arrow-right" :width="11"/>
      </button>
    </footer>

  </div>
</template>

<style scoped>
/* ══ 页面容器 ══ */
.cr-page {
  position: relative; width: 100%; height: 100vh; max-height: 100vh;
  background: var(--bg-100); display: flex; flex-direction: column;
  font-family: var(--font-title); overflow: hidden;
}

/* ══ HEADER ══ */
.cr-header {
  position: relative; z-index: 20;
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; height: 48px; min-height: 48px;
  background: linear-gradient(180deg, var(--bg-200) 0%, var(--bg-100) 100%);
  border-bottom: 1px solid var(--bg-300);
  box-shadow: 0 2px 16px rgba(26,20,16,0.09);
}
.cr-header__left  { display: flex; align-items: center; gap: 10px; }
.cr-header__tabs  { display: flex; align-items: center; gap: 0; }
.cr-header__right { display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
.cr-back {
  display: flex; align-items: center; gap: 4px; background: transparent;
  border: 1px solid var(--bg-300); color: var(--text-200);
  font-size: 12px; padding: 4px 10px; cursor: pointer; border-radius: 5px;
  transition: border-color 200ms ease, color 200ms ease, transform 150ms ease, box-shadow 150ms ease; font-family: var(--font-ui);
}
.cr-back:hover { border-color: var(--primary-100); color: var(--primary-100); transform: translateY(-1px); box-shadow: 0 3px 8px rgba(139,37,0,0.12); }
.cr-tab {
  display: flex; align-items: center; gap: 5px; cursor: pointer;
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--text-300); font-size: 12px; padding: 6px 18px; height: 100%;
  font-family: var(--font-ui); transition: color 200ms ease, border-color 200ms ease;
}
.cr-tab--active {
  color: var(--primary-100); font-weight: 700;
  border-bottom: 2px solid var(--primary-100);
}
.cr-tab:hover:not(.cr-tab--active) { color: var(--text-200); }
.cr-username { font-size: 12px; font-weight: 700; color: var(--primary-100); font-family: var(--font-title); }
.cr-report-btn {
  display: flex; align-items: center; gap: 5px; cursor: pointer;
  background: var(--primary-100); border: 1px solid var(--primary-100);
  color: #fff; border-radius: 5px; font-weight: 600;
  font-size: 11px; padding: 5px 14px; font-family: var(--font-ui);
  transition: background 200ms ease, transform 150ms ease, box-shadow 150ms ease;
}
.cr-report-btn:hover:not(:disabled) {
  background: var(--primary-300);
  transform: translateY(-1px); box-shadow: 0 3px 10px rgba(139,37,0,0.22);
}
.cr-report-btn:disabled { opacity: 0.4; cursor: not-allowed; background: var(--bg-300); border-color: var(--bg-300); color: var(--text-300); }

/* 导出按钮 */
.cr-export-wrap { position: relative; }
.cr-export-btn {
  display: flex; align-items: center; gap: 4px; cursor: pointer;
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-200) 92%);
  border: 1px solid rgba(139,37,0,0.35); color: var(--text-200); border-radius: 5px;
  font-size: 11px; padding: 5px 12px; font-family: var(--font-ui);
  transition: background 200ms ease, transform 150ms ease, box-shadow 150ms ease;
}
.cr-save-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 5px; font-family: var(--font-ui);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  background: rgba(139,105,20,0.15); border: 1px solid rgba(196,150,30,0.4);
  color: rgba(139,105,20,1);
}
.cr-save-btn:hover:not(:disabled) { background: rgba(139,105,20,0.3); }
.cr-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.cr-export-btn:hover { background: color-mix(in srgb, var(--primary-100) 15%, var(--bg-200) 85%); transform: translateY(-1px); box-shadow: 0 3px 8px rgba(139,37,0,0.12); }
.cr-export-menu {
  position: absolute; top: 100%; right: 0; margin-top: 4px;
  background: var(--bg-200); border: 1px solid var(--bg-300);
  box-shadow: 0 6px 24px rgba(26,20,16,0.15); z-index: 30;
  display: flex; flex-direction: column; min-width: 160px;
  border-radius: 6px; overflow: hidden;
}
.cr-export-menu button {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px;
  background: none; border: none; cursor: pointer; font-size: 11px;
  color: var(--text-200); font-family: var(--font-ui); text-align: left;
  transition: background 150ms ease;
}
.cr-export-menu button:hover { background: var(--bg-300); }

/* ══ FOOTER ══ */
.cr-footer {
  flex-shrink: 0; display: flex; align-items: center; gap: 16px;
  padding: 0 20px; height: 28px; min-height: 28px;
  background: var(--bg-200); border-top: 1px solid var(--bg-300);
  font-size: 10px; color: var(--text-300); font-family: var(--font-ui);
}
.cr-footer-source { opacity: 0.7; }
.cr-footer-wc { margin-left: auto; }
.cr-footer-time { opacity: 0.6; }
.cr-footer-go {
  margin-left: auto; display: flex; align-items: center; gap: 4px;
  background: none; border: 1px solid rgba(139,37,0,0.25); color: var(--primary-100);
  cursor: pointer; font-size: 10px; padding: 2px 10px; font-family: var(--font-ui);
  transition: background 200ms ease; border-radius: 4px;
}
.cr-footer-go:hover { background: rgba(139,37,0,0.06); }

/* ══ 分析模式主布局 ══ */
.cr-main {
  flex: 1; display: grid; grid-template-columns: 360px 1fr;
  overflow: hidden; min-height: 0; position: relative; z-index: 1;
}

/* ══ 左栏：攀岩墙 ══ */
.cr-left {
  display: flex; flex-direction: column;
  border-right: 1px solid var(--bg-300); overflow: hidden;
  background: linear-gradient(180deg, var(--bg-200) 0%, var(--bg-100) 60%);
  box-shadow: 4px 0 16px -4px rgba(26,20,16,0.06);
}
.cr-cw-wrap {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  display: flex; justify-content: center; padding: 4px;
}
.cr-cw-wrap::-webkit-scrollbar { width: 3px; }
.cr-cw-wrap::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.2); }
.cr-cw-svg { display: block; width: 100%; height: auto; cursor: default; }
.cw-job-node { cursor: pointer; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.22)); }
.cw-job-node:hover circle { filter: brightness(1.1); }
.cw-node-title { font-size: 10.5px; fill: #3D2B1A; font-weight: 700; pointer-events: none; }
.cw-node-title--active { fill: #fff; }
.cw-node-sub { font-size: 8.5px; fill: #5C4A38; pointer-events: none; }
.cw-node-sub--active { fill: rgba(255,255,255,0.9); }
.cw-hold { cursor: help; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.18)); }
.cw-hold:hover ellipse { filter: brightness(1.2); }
.cw-hold-text { font-size: 9px; fill: #3D2B1A; pointer-events: none; font-weight: 600; }
.cw-legend-text { font-size: 9px; fill: #5C4A38; font-weight: 600; }
.cw-rope-path { transition: stroke-width 200ms ease; }
.cw-rope-path:hover { stroke-width: 3; }
.cr-cw-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; color: var(--bg-400);
  font-size: 11px; text-align: center; line-height: 1.6;
}

/* ══ 中栏 ══ */
.cr-center { display: flex; flex-direction: column; overflow: hidden; min-height: 0; }

/* ── ① Hero 概览条 ── */
.cr-hero {
  flex-shrink: 0; display: flex; align-items: center; gap: 16px;
  padding: 10px 16px; height: 90px;
  background: linear-gradient(135deg, var(--bg-200) 0%, color-mix(in srgb, var(--primary-100) 5%, var(--bg-100) 95%) 100%);
  border-bottom: 1px solid var(--bg-300);
  box-shadow: 0 2px 12px rgba(26,20,16,0.07);
}
.cr-hero__gauge { flex-shrink: 0; }
.cr-hero-ring { width: 70px; height: 70px; }
.cr-hero-pct { font-size: 14px; font-weight: 700; fill: var(--primary-100, #8B2500); font-family: var(--font-ui); }
.cr-hero-pct-label { font-size: 7px; fill: var(--text-300, #9C8B78); }
.cr-hero__info { flex: 1; min-width: 0; }
.cr-hero-job { font-size: 16px; font-weight: 700; color: var(--primary-300); font-family: var(--font-title); letter-spacing: 0.08em; }
.cr-hero-desc { font-size: 11px; color: var(--text-300); margin-top: 4px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* ── 中栏上：气泡 + 雷达 ── */
.cr-center-top {
  flex: 0 0 380px; display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid var(--bg-300); overflow: hidden;
}
.cr-bubble-panel, .cr-radar-panel { display: flex; flex-direction: column; overflow: hidden; }
.cr-bubble-panel { border-right: 1px solid var(--bg-300); background: linear-gradient(180deg, var(--bg-100) 0%, color-mix(in srgb, var(--bg-200) 50%, var(--bg-100) 50%) 100%); }
.cr-radar-panel { background: var(--bg-100); }

/* ── 气泡图 SVG ── */
.cr-bubble-svg { display: block; width: 100%; flex: 1; }
.cr-bubble-g { cursor: pointer; }
.cr-bubble-g:hover .cr-bubble-circle {
  fill: color-mix(in srgb, var(--c) 48%, var(--bg-100, #F7F2E8) 52%);
  stroke-opacity: 0.75;
}
@keyframes cr-breathe {
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%       { transform: scale(1.12); opacity: 0.9; }
}
.cr-bubble-circle {
  fill: color-mix(in srgb, var(--c) 28%, var(--bg-100, #F7F2E8) 72%);
  stroke: var(--c);
  stroke-width: 1.2;
  stroke-opacity: 0.45;
  transform-box: fill-box;
  transform-origin: center;
  animation: cr-breathe var(--bd, 3.5s) ease-in-out var(--bk, 0s) infinite;
  transition: fill 180ms ease, stroke-opacity 180ms ease;
}
.cr-bubble-g--sel .cr-bubble-circle {
  fill: color-mix(in srgb, var(--c) 72%, var(--bg-100, #F7F2E8) 28%);
  stroke: color-mix(in srgb, var(--c) 88%, #000 12%);
  stroke-width: 2;
  stroke-opacity: 1;
}
.cr-bt {
  font-size: 10px; font-weight: 700; fill: var(--text-100, #1A1410);
  text-anchor: middle; pointer-events: none; font-family: var(--font-title);
}
.cr-bp {
  font-size: 8.5px; fill: var(--text-200, #6B5D4F);
  text-anchor: middle; pointer-events: none; font-family: var(--font-ui);
}
.cr-ba {
  font-size: 9px; font-weight: 700; fill: var(--text-100, #1A1410);
  text-anchor: middle; dominant-baseline: central; pointer-events: none; font-family: var(--font-title);
}
.cr-bubble-g--sel .cr-bt,
.cr-bubble-g--sel .cr-bp,
.cr-bubble-g--sel .cr-ba { fill: #fff; }

/* ── ② 雷达图 + 差距条 ── */
.cr-radar-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--bg-400); font-size: 11px; text-align: center; line-height: 1.7;
}
.cr-radar { flex-shrink: 0; width: 100%; height: 250px; }
.cr-radar-legend {
  display: flex; align-items: center; gap: 6px; margin-left: auto;
  font-size: 10px; color: var(--text-300); font-family: var(--font-ui);
}
.cr-legend-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0;
}
.cr-legend-dot--dashed {
  background: transparent !important;
  border: 1.5px dashed;
  border-radius: 2px;
}
.cr-gap-bars { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px; padding: 4px 8px 6px; }
.cr-gap-row  { display: flex; align-items: center; gap: 4px; }
.cr-gap-dim  { font-size: 9.5px; color: var(--text-200); width: 44px; flex-shrink: 0; font-family: var(--font-ui); }
.cr-gap-track { flex: 1; height: 7px; background: var(--bg-300); position: relative; overflow: hidden; border-radius: 4px; }
.cr-gap-bar--mine { position: absolute; top: 0; left: 0; height: 100%; background: var(--primary-100); opacity: 0.65; transition: width 500ms ease; border-radius: 4px; }
.cr-gap-bar--need {
  position: absolute; top: 0; height: 100%;
  background: repeating-linear-gradient(135deg, rgba(139,37,0,0.08), rgba(139,37,0,0.08) 2px, rgba(139,37,0,0.18) 2px, rgba(139,37,0,0.18) 4px);
  border: 1px dashed rgba(139,37,0,0.3);
  transition: width 500ms ease, left 500ms ease;
}
.cr-gap-num  { font-size: 10px; width: 30px; text-align: right; color: rgba(180,80,60,0.9); font-family: var(--font-ui); }
.cr-gap-num--pos { color: rgba(60,140,80,0.85); }

/* ── ⑤ 成长计划 ── */
.cr-center-bottom { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 200px; background: linear-gradient(180deg, var(--bg-100) 0%, var(--bg-200) 100%); }
.cr-planning { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.cr-planning-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; color: var(--bg-400);
  font-size: 11px; text-align: center; line-height: 1.6;
}
.cr-plan-stages { flex: 1; display: flex; gap: 14px; overflow-x: auto; overflow-y: hidden; padding: 10px 16px 14px; }
.cr-plan-stages::-webkit-scrollbar { height: 3px; }
.cr-plan-stages::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.2); }
.cr-plan-stage {
  flex: 1; min-width: 240px; position: relative;
  background: var(--bg-100); border: 1px solid var(--bg-300); border-radius: 8px;
  padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;
  box-shadow: 0 2px 10px rgba(26,20,16,0.06), inset 0 1px 0 rgba(255,255,255,0.6);
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.cr-plan-stage:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26,20,16,0.10), inset 0 1px 0 rgba(255,255,255,0.6);
}
.cr-plan-stage::-webkit-scrollbar { width: 2px; }
.cr-plan-stage--short { border-top: 3px solid var(--primary-100); }
.cr-plan-stage--mid   { border-top: 3px solid #8B6914; }
.cr-ps-head {
  display: flex; align-items: center; gap: 6px; cursor: pointer;
  user-select: none;
}
.cr-ps-icon { flex-shrink: 0; color: var(--primary-100); }
.cr-plan-stage--mid .cr-ps-icon { color: #8B6914; }
.cr-ps-label {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
  display: inline-block; width: fit-content; font-family: var(--font-ui);
}
.cr-plan-stage--short .cr-ps-label { background: color-mix(in srgb, var(--primary-100) 18%, var(--bg-100) 82%); color: var(--primary-100); border: 1px solid rgba(139,37,0,0.35); }
.cr-plan-stage--mid   .cr-ps-label { background: color-mix(in srgb, #8B6914 18%, var(--bg-100) 82%); color: #8B6914; border: 1px solid rgba(139,105,20,0.35); }
.cr-ps-toggle { margin-left: auto; color: var(--text-300); }
.cr-ps-goal { font-size: 12px; color: var(--text-100); font-weight: 500; line-height: 1.55; }
.cr-ps-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.cr-ps-list--collapsed li:nth-child(n+4) { display: none; }
.cr-ps-list li { display: flex; align-items: flex-start; gap: 6px; font-size: 11px; color: var(--text-100); line-height: 1.5; }
.cr-ps-bullet { flex-shrink: 0; margin-top: 3px; color: var(--primary-100); }
.cr-plan-stage--mid .cr-ps-bullet { color: #8B6914; }
.cr-ps-expand {
  background: none; border: 1px dashed var(--bg-300); color: var(--text-300);
  font-size: 10px; padding: 3px 8px; cursor: pointer; font-family: var(--font-ui);
  transition: color 200ms ease; align-self: flex-start; border-radius: 4px;
}
.cr-ps-expand:hover { color: var(--primary-100); border-color: rgba(139,37,0,0.3); }
.cr-ps-milestone {
  display: flex; align-items: flex-start; gap: 5px; font-size: 11px;
  color: #8B6914; padding-top: 8px; font-weight: 600;
  border-top: 1px solid var(--bg-300); margin-top: auto; font-family: var(--font-ui);
}
.cr-ps-arrow {
  position: absolute; right: -18px; top: 50%; transform: translateY(-50%);
  color: var(--bg-400); z-index: 2;
}

/* ══ 公用面板标题 ══ */
.cr-panel-title {
  flex-shrink: 0; display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: var(--text-100);
  font-family: var(--font-title); letter-spacing: 0.06em;
  padding: 9px 14px 8px 12px;
  border-left: 3px solid var(--primary-100);
  border-bottom: 1px solid var(--bg-300);
  background: linear-gradient(90deg, rgba(139,37,0,0.05) 0%, var(--bg-200) 60%);
}
.cr-panel-sub { font-size: 9.5px; font-weight: 400; color: var(--text-300); margin-left: 4px; font-family: var(--font-ui); }

/* ══ 报告编辑模式 ══ */
.cr-report-main {
  flex: 1; display: grid; grid-template-columns: 55% 45%;
  overflow: hidden; min-height: 0;
}

/* 左：预览区 */
.cr-rp-preview {
  overflow-y: auto; padding: 24px 32px;
  border-right: 1px solid var(--bg-300);
  background: var(--bg-100);
}
.cr-rp-preview::-webkit-scrollbar { width: 4px; }
.cr-rp-preview::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.2); }
.cr-rp-preview-inner :deep(.rp-h2) {
  font-size: 18px; font-weight: 700; color: var(--text-100); font-family: var(--font-title);
  letter-spacing: 0.1em; margin: 16px 0 8px; padding-bottom: 6px;
  border-bottom: 2px solid #8B6914;
}
.cr-rp-preview-inner :deep(.rp-h3) {
  font-size: 14px; font-weight: 600; color: var(--text-100); font-family: var(--font-title);
  margin: 14px 0 6px; padding-left: 10px;
  border-left: 3px solid var(--primary-100);
}
.cr-rp-preview-inner :deep(.rp-p) {
  font-size: 12px; color: var(--text-200); line-height: 1.8; margin: 6px 0;
  font-family: var(--font-ui);
}
.cr-rp-preview-inner :deep(.rp-list) {
  list-style: none; padding: 0 0 0 16px; margin: 6px 0;
}
.cr-rp-preview-inner :deep(.rp-list li) {
  font-size: 12px; color: var(--text-200); line-height: 1.7; padding: 2px 0;
  font-family: var(--font-ui);
}
.cr-rp-preview-inner :deep(.rp-list li::before) {
  content: '●'; color: var(--primary-100); margin-right: 8px; font-size: 8px;
}
.cr-rp-preview-inner :deep(strong) { color: var(--text-100); }

/* 右：工具栏 + 编辑区 */
.cr-rp-right { display: flex; flex-direction: column; overflow: hidden; }

.cr-rp-toolbar {
  flex-shrink: 0; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;
  border-bottom: 1px solid var(--bg-300); background: var(--bg-200);
}
.cr-rp-toolbar-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--text-200); font-family: var(--font-title);
  margin-bottom: 4px;
}
.cr-tool-btn {
  display: flex; align-items: center; gap: 6px; cursor: pointer;
  background: var(--bg-100); border: 1px solid var(--bg-300); color: var(--text-200);
  font-size: 11px; padding: 7px 12px; font-family: var(--font-ui); border-radius: 5px;
  transition: background 200ms ease, border-color 200ms ease, transform 150ms ease;
}
.cr-tool-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--primary-100) 6%, var(--bg-100) 94%); border-color: rgba(139,37,0,0.3); transform: translateY(-1px); }
.cr-tool-btn:disabled { opacity: 0.5; cursor: wait; }
.cr-tool-btn--sm { font-size: 10px; padding: 4px 10px; }
.cr-tool-btn--ok { color: #5B7744; border-color: rgba(91,119,68,0.4); }
.cr-tool-btn--ok:hover { background: rgba(91,119,68,0.08); }

.cr-check-results {
  display: flex; flex-direction: column; gap: 4px; padding: 6px 0 2px;
}
.cr-check-item {
  display: flex; align-items: center; gap: 6px; font-size: 10px;
  color: #8B2500; font-family: var(--font-ui);
}
.cr-check-item--ok { color: #5B7744; }

.cr-polish-diff { padding: 6px 0 2px; }
.cr-polish-actions { display: flex; gap: 6px; }

@keyframes cr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.cr-spin { animation: cr-spin 1s linear infinite; }

/* 编辑区 */
.cr-rp-editor-wrap { flex: 1; overflow: hidden; }
.cr-rp-editor {
  width: 100%; height: 100%; resize: none;
  background: var(--bg-100); border: none; outline: none;
  color: var(--text-200); font-size: 12px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  padding: 16px; line-height: 1.7;
}
.cr-rp-editor:focus { background: color-mix(in srgb, var(--primary-100) 2%, var(--bg-100) 98%); }

/* ══ prefers-reduced-motion ══ */
@media (prefers-reduced-motion: reduce) {
  .cr-bubble { animation: none; }
  .cr-back, .cr-report-btn, .cr-tab, .cr-tool-btn { transition: none; }
}

/* ══ 打印 ══ */
@media print {
  .cr-back, .cr-report-btn, .cr-footer, .cr-header__tabs, .cr-export-wrap { display: none !important; }
  .cr-page { height: auto; background: #fff; }
  .cr-report-main { display: block; }
  .cr-rp-right { display: none; }
  .cr-rp-preview { border: none; padding: 20px; }
}
</style>
