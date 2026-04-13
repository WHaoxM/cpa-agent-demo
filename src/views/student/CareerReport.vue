<!-- 页面：职业生涯发展报告；路由：student/career-report；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { forceSimulation, forceCenter, forceCollide, forceManyBody, forceX, forceY, type SimulationNodeDatum } from 'd3'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores'
import UserInfoBar from '@/components/UserInfoBar.vue'
import { useLearningStore } from '@/stores/learning'
import { useReportStore } from '@/stores/report'
import {
  JOB_PORTRAITS, CAREER_PATH_EDGES,
  deriveStudentSevenDim, getGrowthPlan,
  type JobPortrait, type JobLevel,
} from '@/mock/careerReportData'
import D3RadarChart from '@/components/charts/D3RadarChart.vue'
import type { RadarDatum } from '@/components/charts/D3RadarChart.vue'
import { gsap } from '@/plugins/gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import parchmentBaseUrl from '@/assets/textures/parchment-base.jpg'
const parchmentBg = `url("${parchmentBaseUrl}")`

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
      topMatchScore: effectiveMatchScore.value,
      studentDimSnapshot: studentDim.value,
    },
  })
  reportSaved.value = true
}

/* ══ 界面状态 ══ */
const activeMode = ref<'analysis' | 'report'>('analysis')
const selectedJobId = ref<string>('')
const reportTextEditable = ref('')
const climbingSvgEl = ref<SVGSVGElement | null>(null)
let climbTimeline: gsap.core.Timeline | null = null
const expandedStages = ref<Set<string>>(new Set())
const checkResults = ref<Array<{ section: string; found: boolean }>>([])
const showCheckResults = ref(false)
const polishLoading = ref(false)
const polishDiff = ref<{ before: string; after: string } | null>(null)
const showExportMenu = ref(false)
const activeSkillEdge = ref<{ fromId: string; toId: string; skills: string[]; fromTitle: string; toTitle: string } | null>(null)
const planLoading = ref(false)
const planStages = ref<Array<{ phase: string; phaseLabel: string; goal: string; tasks: string[]; milestone: string }>>([])
const radarLoading = ref(false)
const radarReady = ref(false)
let planTimers: ReturnType<typeof setTimeout>[] = []

/* ══ 定常配置 ══ */
const DIM_NAMES = ['专业技能', '证书资质', '创新能力', '学习能力', '抗压能力', '沟通能力', '实习经验'] as const

const LINE_COLORS: Record<string, string> = {
  frontend:    '#C4622D',
  data:        '#B8962E',
  qa:          '#3A8A7A',
  fullstack:   '#6A5B8A',
  general:     '#7A6F5A',
  algorithm:   '#5B7E91',
  'data-analyst': '#B8962E',
  backend:     '#2E7D5E',
  ai:          '#8B4A9C',
  bigdata:     '#C45E2A',
  ops:         '#4A6FA5',
  embedded:    '#6B5E3A',
  security:    '#9C2E2E',
  cloud:       '#2E6B9C',
  database:    '#5A7A4A',
  support:     '#8A7A5A',
  multimedia:  '#9C5E2E',
}

/* ══ 攀岩墙白名单：只展示 CAREER_DOMAINS 15 职业的岗位 ══ */
const CLIMB_JOB_IDS = new Set<string>([
  /* 前端：Vue 前端工程师 */
  'fe-intern', 'fe-junior', 'fe-mid', 'fe-senior', 'fe-lead',
  /* 前端：React 前端工程师 */
  'fe-react-intern', 'fe-react-junior', 'fe-react-mid', 'fe-react-senior',
  /* 前端：可视化工程师 */
  'fe-vis-junior', 'fe-vis-mid', 'fe-vis-senior',
  /* 后端：Java 后端工程师 */
  'be-java-intern', 'be-java-junior', 'be-java-mid', 'be-java-senior',
  /* 后端：Go 后端工程师 */
  'be-go-intern', 'be-go-junior', 'be-go-mid', 'be-go-senior',
  /* 后端：Python 后端工程师 */
  'be-python-intern', 'be-python-junior', 'be-python-mid', 'be-python-senior',
  /* 测试：自动化测试工程师 */
  'qa-intern', 'qa-junior', 'qa-mid', 'qa-senior',
  /* 测试：质量平台工程师 */
  'qa-plat-junior', 'qa-plat-mid', 'qa-plat-senior',
  /* 测试：性能测试工程师 */
  'qa-perf-intern', 'qa-perf-junior', 'qa-perf-mid', 'qa-perf-senior',
  /* 数据：商业数据分析师 */
  'da-biz-junior', 'da-biz-mid', 'da-biz-senior',
  /* 数据：数据开发工程师 */
  'da-dev-junior', 'da-dev-mid', 'da-dev-senior',
  /* 数据：增长分析师 */
  'da-growth-junior', 'da-growth-mid', 'da-growth-senior',
  /* ML：推荐算法工程师 */
  'algo-recsys-intern', 'algo-recsys-junior', 'algo-recsys-mid', 'algo-recsys-senior',
  /* ML：深度学习工程师 */
  'dl-junior', 'dl-mid', 'dl-senior',
  /* ML：LLM 应用工程师 */
  'ai-llm-intern', 'ai-llm-junior', 'ai-llm-mid', 'ai-llm-senior',
])

const LEVEL_ORDER: Record<JobLevel, number> = {
  intern: 0, junior: 1, mid: 2, senior: 3, lead: 4, expert: 5,
}

/* ══ 推荐岗位：优先展示 targetRoles 对应岗位（基于 CAREER_DOMAINS 15 职业）══ */
const recommendedIds = computed<Set<string>>(() => {
  const matched = resumeStore.matchedCareers
  const roleToIds: Record<string, string[]> = {
    '前端开发': ['fe-junior', 'fe-mid', 'fe-react-junior', 'fe-vis-junior'],
    '后端开发': ['be-java-junior', 'be-java-mid', 'be-go-junior', 'be-python-junior'],
    '测试开发': ['qa-junior', 'qa-mid', 'qa-plat-junior', 'qa-perf-junior'],
    '数据分析': ['da-biz-junior', 'da-biz-mid', 'da-dev-junior', 'da-growth-junior'],
    '机器学习工程师': ['algo-recsys-junior', 'algo-recsys-mid', 'dl-junior', 'ai-llm-junior'],
  }
  const ids = new Set<string>()
  for (const role of effectiveTargetRoles.value) {
    ;(roleToIds[role] ?? []).forEach(id => ids.add(id))
  }
  for (const c of matched.slice(0, 3)) {
    ;(roleToIds[c.role] ?? []).slice(0, 2).forEach(id => ids.add(id))
  }
  if (ids.size === 0) {
    ;['fe-mid', 'fe-junior', 'be-java-junior', 'da-biz-junior', 'qa-junior'].forEach(id => ids.add(id))
  }
  return ids
})

const selectedJob = computed(() => JOB_PORTRAITS.find(j => j.id === selectedJobId.value) ?? null)

/* 统一匹配度：与气泡图一致，推荐岗位 +0.2 */
const effectiveMatchScore = computed(() => {
  if (!selectedJob.value) return 0
  const raw = selectedJob.value.matchScore
  return recommendedIds.value.has(selectedJob.value.id) ? Math.min(1, raw + 0.2) : raw
})

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
  /* 只从 15 职业白名单中选气泡，优先推荐岗位 */
  const weighted = [...JOB_PORTRAITS]
    .filter(j => CLIMB_JOB_IDS.has(j.id))
    .map(j => ({ ...j, matchScore: recommendedIds.value.has(j.id) ? Math.min(1, j.matchScore + 0.2) : j.matchScore }))
    .sort((a, b) => b.matchScore - a.matchScore)

  /* 心仪岗位方向强制占位：若有 evaluatingRole，保证该方向至少 1 个气泡 */
  const roleToIds: Record<string, string[]> = {
    '前端开发': ['fe-junior', 'fe-mid', 'fe-react-junior', 'fe-vis-junior'],
    '后端开发': ['be-java-junior', 'be-java-mid', 'be-go-junior', 'be-python-junior'],
    '测试开发': ['qa-junior', 'qa-mid', 'qa-plat-junior', 'qa-perf-junior'],
    '数据分析': ['da-biz-junior', 'da-biz-mid', 'da-dev-junior', 'da-growth-junior'],
    '机器学习工程师': ['algo-recsys-junior', 'algo-recsys-mid', 'dl-junior', 'ai-llm-junior'],
  }
  const evalRole = resumeStore.evaluatingRole
  let pinnedJob: (typeof weighted)[0] | null = null
  if (evalRole) {
    const ids = new Set(roleToIds[evalRole] ?? [])
    pinnedJob = weighted.find(j => ids.has(j.id)) ?? null
  }

  // 过滤：matchScore > 0.4 优先，最多取 8 个；不足时按分数补足
  const highScore = weighted.filter(j => j.matchScore > 0.4)
  let sorted = highScore.length >= 8
    ? highScore.slice(0, 8)
    : weighted.slice(0, Math.min(8, weighted.length))

  // 确保 pinnedJob 在列表中
  if (pinnedJob && !sorted.some(j => j.id === pinnedJob!.id)) {
    sorted = [pinnedJob, ...sorted.slice(0, 7)]
  }

  const circles = sorted.map(j => ({ id: j.id, r: Math.max(16, Math.round(12 + j.matchScore * 28)) }))
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

/* ══ 气泡图标签断行 ══ */
function splitBubbleTitle(title: string, r: number): string[] {
  const max = r >= 30 ? 7 : r >= 24 ? 5 : 4
  if (title.length <= max) return [title]
  let split = max
  for (let i = Math.min(max, title.length); i >= 2; i--) {
    const ch = title[i] ?? ''
    const prev = title[i - 1] ?? ''
    if (prev === ' ') { split = i; break }
    if (/[a-zA-Z0-9]/.test(prev) && !/[a-zA-Z0-9]/.test(ch)) { split = i; break }
    if (!/[a-zA-Z0-9\s]/.test(prev) && /[a-zA-Z]/.test(ch)) { split = i; break }
  }
  const line1 = title.slice(0, split).trimEnd()
  const rest = title.slice(split).trimStart()
  if (!rest) return [line1]
  if (rest.length <= max) return [line1, rest]
  return [line1, rest.slice(0, max - 1) + '…']
}

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
type ClimbRope = { path: string; type: 'promote' | 'transfer'; fromId: string; toId: string; holds: ClimbHold[]; allSkills: string[]; omittedCount: number }

const CW_W = 400, CW_H = 900
const CW_NODE_R = 28

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
  const selId = selectedJob.value.id
  const selLineId = selectedJob.value.lineId

  /* ── 1. 收集同 lineId 内晋升链（双向 BFS，找到完整连通分量）── */
  const promoteAdj = new Map<string, Array<typeof CAREER_PATH_EDGES[0]>>()
  const reverseAdj = new Map<string, Array<typeof CAREER_PATH_EDGES[0]>>()
  for (const e of CAREER_PATH_EDGES) {
    if (e.type !== 'promote' || !CLIMB_JOB_IDS.has(e.fromId) || !CLIMB_JOB_IDS.has(e.toId)) continue
    const fj = JOB_PORTRAITS.find(j => j.id === e.fromId)
    const tj = JOB_PORTRAITS.find(j => j.id === e.toId)
    if (fj?.lineId !== selLineId || tj?.lineId !== selLineId) continue
    if (!promoteAdj.has(e.fromId)) promoteAdj.set(e.fromId, [])
    promoteAdj.get(e.fromId)!.push(e)
    if (!reverseAdj.has(e.toId)) reverseAdj.set(e.toId, [])
    reverseAdj.get(e.toId)!.push(e)
  }
  const promotionEdges: typeof CAREER_PATH_EDGES = []
  const promotionIds = new Set<string>([selId])
  const queue = [selId]
  while (queue.length) {
    const cur = queue.shift()!
    for (const e of (promoteAdj.get(cur) ?? [])) {
      if (!promotionIds.has(e.toId)) {
        promotionIds.add(e.toId); promotionEdges.push(e); queue.push(e.toId)
      }
    }
    for (const e of (reverseAdj.get(cur) ?? [])) {
      if (!promotionIds.has(e.fromId)) {
        promotionIds.add(e.fromId); promotionEdges.push(e); queue.push(e.fromId)
      }
    }
  }

  /* ── 2. 转岗边：每个晋升节点最多 2 条转岗（优先出边）── */
  const transferEdges: typeof CAREER_PATH_EDGES = []
  const usedTransferIds = new Set<string>()
  const nodeTransferCount = new Map<string, number>()
  // 收集所有可用转岗边
  const allTransferCandidates: typeof CAREER_PATH_EDGES = []
  for (const e of CAREER_PATH_EDGES) {
    if (e.type !== 'transfer' || !CLIMB_JOB_IDS.has(e.fromId) || !CLIMB_JOB_IDS.has(e.toId)) continue
    if (promotionIds.has(e.fromId) || promotionIds.has(e.toId)) allTransferCandidates.push(e)
  }
  // 按优先级排序：选中岗位直接相关 > 同 lineId > 跨 lineId
  allTransferCandidates.sort((a, b) => {
    const aDirectly = (a.fromId === selId || a.toId === selId) ? 0 : 1
    const bDirectly = (b.fromId === selId || b.toId === selId) ? 0 : 1
    if (aDirectly !== bDirectly) return aDirectly - bDirectly
    const aOther = promotionIds.has(a.fromId) ? a.toId : a.fromId
    const bOther = promotionIds.has(b.fromId) ? b.toId : b.fromId
    const aJob = JOB_PORTRAITS.find(j => j.id === aOther)
    const bJob = JOB_PORTRAITS.find(j => j.id === bOther)
    const aSame = aJob?.lineId === selLineId ? 0 : 1
    const bSame = bJob?.lineId === selLineId ? 0 : 1
    return aSame - bSame
  })
  // 每个晋升节点最多 2 条，全局最多 4 条
  const MAX_TRANSFERS = 4
  for (const e of allTransferCandidates) {
    if (transferEdges.length >= MAX_TRANSFERS) break
    const srcId = promotionIds.has(e.fromId) ? e.fromId : e.toId
    const tgtId = srcId === e.fromId ? e.toId : e.fromId
    if ((nodeTransferCount.get(srcId) ?? 0) >= 2) continue
    if (usedTransferIds.has(tgtId) || promotionIds.has(tgtId)) continue
    transferEdges.push(e)
    usedTransferIds.add(tgtId)
    nodeTransferCount.set(srcId, (nodeTransferCount.get(srcId) ?? 0) + 1)
  }

  /* ── 3. 汇总节点 ── */
  const allJobIds = new Set<string>(promotionIds)
  for (const e of transferEdges) { allJobIds.add(e.fromId); allJobIds.add(e.toId) }
  const allJobs = [...allJobIds].map(id => JOB_PORTRAITS.find(j => j.id === id)!).filter(Boolean)
  const allEdges = [...promotionEdges, ...transferEdges]

  /* ── 4. 布局：选中岗位底部居中，晋升链向上，转岗横向 ── */
  const pad = 55
  const mainLineJobs = allJobs.filter(j => promotionIds.has(j.id))
    .sort((a, b) => (LEVEL_ORDER[a.level] ?? 0) - (LEVEL_ORDER[b.level] ?? 0))
  const transferJobs = allJobs.filter(j => !promotionIds.has(j.id))

  const mainCount = mainLineJobs.length
  const mainYStep = mainCount > 1 ? (CW_H - pad * 2) / (mainCount - 1) : 0
  const nodes: ClimbNode[] = []

  mainLineJobs.forEach((j, i) => {
    nodes.push({
      id: j.id, title: j.title, level: j.level, lineId: j.lineId, salaryRange: j.salaryRange,
      x: Math.round(CW_W / 2),
      y: Math.round(CW_H - pad - i * mainYStep),
    })
  })

  // 为每个转岗节点找到其源晋升节点，放在源节点附近
  // 按源节点分组，同源 2 个转岗 → 一左一右；1 个转岗 → hash 决定侧
  const nodeMap0 = new Map(nodes.map(n => [n.id, n]))
  const srcToTransfers = new Map<string, typeof transferJobs>()
  for (const j of transferJobs) {
    const edge = transferEdges.find(e => e.fromId === j.id || e.toId === j.id)
    const srcId = edge ? (promotionIds.has(edge.fromId) ? edge.fromId : edge.toId) : selId
    if (!srcToTransfers.has(srcId)) srcToTransfers.set(srcId, [])
    srcToTransfers.get(srcId)!.push(j)
  }
  for (const [srcId, group] of srcToTransfers) {
    const srcNode = nodeMap0.get(srcId)
    const srcY = srcNode?.y ?? (CW_H / 2)
    const xOff = 120
    if (group.length >= 2) {
      // 两个转岗：一左一右
      group.forEach((j, gi) => {
        const side = gi === 0 ? -1 : 1
        const yJitter = (strHash(j.id) % 24) - 12
        nodes.push({
          id: j.id, title: j.title, level: j.level, lineId: j.lineId, salaryRange: j.salaryRange,
          x: Math.max(CW_NODE_R + 8, Math.min(CW_W - CW_NODE_R - 8, Math.round(CW_W / 2 + side * xOff))),
          y: Math.max(pad, Math.min(CW_H - pad, Math.round(srcY + yJitter))),
        })
      })
    } else {
      // 单个转岗：hash 决定侧
      const j = group[0]!
      const side = strHash(j.id) % 2 === 0 ? -1 : 1
      const yJitter = (strHash(j.id) % 24) - 12
      nodes.push({
        id: j.id, title: j.title, level: j.level, lineId: j.lineId, salaryRange: j.salaryRange,
        x: Math.max(CW_NODE_R + 8, Math.min(CW_W - CW_NODE_R - 8, Math.round(CW_W / 2 + side * xOff))),
        y: Math.max(pad, Math.min(CW_H - pad, Math.round(srcY + yJitter))),
      })
    }
  }

  /* 防重叠 */
  const nodeMinDist = CW_NODE_R * 2 + 14
  for (let iter = 0; iter < 12; iter++) {
    for (let ai = 0; ai < nodes.length; ai++) {
      for (let bi = ai + 1; bi < nodes.length; bi++) {
        const a = nodes[ai]!, b = nodes[bi]!
        const ddx = b.x - a.x, ddy = b.y - a.y
        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
        if (dist < nodeMinDist && dist > 0.1) {
          const half = (nodeMinDist - dist) / 2 + 2
          const nx = ddx / dist, ny = ddy / dist
          const aMain = promotionIds.has(a.id), bMain = promotionIds.has(b.id)
          if (!aMain) a.x = Math.max(CW_NODE_R + 8, Math.min(CW_W - CW_NODE_R - 8, Math.round(a.x - nx * half)))
          a.y = Math.max(pad, Math.min(CW_H - pad, Math.round(a.y - ny * half)))
          if (!bMain) b.x = Math.max(CW_NODE_R + 8, Math.min(CW_W - CW_NODE_R - 8, Math.round(b.x + nx * half)))
          b.y = Math.max(pad, Math.min(CW_H - pad, Math.round(b.y + ny * half)))
        }
      }
    }
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const ropes: ClimbRope[] = []
  const placedSkills = new Set<string>()
  const placedHoldPositions: Array<{ x: number; y: number }> = []

  for (const edge of allEdges) {
    const fn = nodeMap.get(edge.fromId), tn = nodeMap.get(edge.toId)
    if (!fn || !tn) continue

    let path: string
    let evalCurve: (t: number) => { x: number; y: number }

    if (edge.type === 'promote') {
      const midY = (fn.y + tn.y) / 2
      const cpx = fn.x + (strHash(edge.fromId + edge.toId) % 24 - 12)
      path = `M ${fn.x} ${fn.y} Q ${cpx} ${midY} ${tn.x} ${tn.y}`
      evalCurve = (t) => ({
        x: (1 - t) * (1 - t) * fn.x + 2 * (1 - t) * t * cpx + t * t * tn.x,
        y: (1 - t) * (1 - t) * fn.y + 2 * (1 - t) * t * midY + t * t * tn.y,
      })
    } else {
      const dx = tn.x - fn.x
      const sag = Math.max(30, Math.abs(dx) * 0.35)
      const cx1 = fn.x + dx * 0.25, cy1 = fn.y + sag
      const cx2 = fn.x + dx * 0.75, cy2 = tn.y + sag
      path = `M ${fn.x} ${fn.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${tn.x} ${tn.y}`
      evalCurve = (t) => ({
        x: (1-t)**3*fn.x + 3*(1-t)**2*t*cx1 + 3*(1-t)*t**2*cx2 + t**3*tn.x,
        y: (1-t)**3*fn.y + 3*(1-t)**2*t*cy1 + 3*(1-t)*t**2*cy2 + t**3*tn.y,
      })
    }

    /* 技能抓手：每条边最多 3 个显示 */
    const uniqueSkills = edge.skills.filter(s => !placedSkills.has(s))
    const displaySkills = uniqueSkills.slice(0, 3)
    displaySkills.forEach(s => placedSkills.add(s))
    const omittedCount = Math.max(0, edge.skills.length - displaySkills.length)

    const holds: ClimbHold[] = displaySkills.map((skill, si) => {
      const slots = displaySkills.length + (omittedCount > 0 ? 1 : 0) + 1
      const t = (si + 1) / slots
      const { x: bx, y: by } = evalCurve(t)
      const hash = strHash(skill), hash2 = strHash(skill + '__scatter')
      let ox = (hash % 100) - 50, oy = (hash2 % 70) - 35
      for (let it = 0; it < 8; it++) {
        for (const nd of nodes) {
          const dx2 = (bx + ox) - nd.x, dy2 = (by + oy) - nd.y
          const d = Math.sqrt(dx2 * dx2 + dy2 * dy2)
          if (d < CW_NODE_R + 18 && d > 0.1) {
            const p = (CW_NODE_R + 18 - d) + 8
            ox += (dx2 / d) * p; oy += (dy2 / d) * p
          }
        }
        for (const ph of placedHoldPositions) {
          const dx3 = (bx + ox) - ph.x, dy3 = (by + oy) - ph.y
          const d3 = Math.sqrt(dx3 * dx3 + dy3 * dy3)
          if (d3 < 54 && d3 > 0.1) {
            const p3 = (54 - d3) + 5
            ox += (dx3 / d3) * p3; oy += (dy3 / d3) * p3
          }
        }
      }
      const fx = Math.max(14, Math.min(CW_W - 14, Math.round(bx + ox)))
      const fy = Math.max(14, Math.min(CW_H - 14, Math.round(by + oy)))
      placedHoldPositions.push({ x: fx, y: fy })
      return { x: fx, y: fy, label: skill, mastered: isSkillMastered(skill), edgeType: edge.type }
    })

    ropes.push({ path, type: edge.type, fromId: edge.fromId, toId: edge.toId, holds, allSkills: edge.skills, omittedCount })
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

/* ══ D3 雷达图数据 ══ */
const crRadarData = computed<RadarDatum[]>(() => {
  const job = selectedJob.value
  if (!job) return []
  return DIM_NAMES.map(name => ({
    axis: name,
    value: studentDim.value[name],
    ref: job.sevenDim[name],
  }))
})

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
  return `# 职业生涯发展报告\n\n**学生**：${user}    **目标岗位**：${job.title}    **生成日期**：${new Date().toLocaleDateString('zh-CN')}\n\n## 岗位匹配摘要\n\n根据简历能力画像分析，系统匹配度最高岗位为「${job.title}」，匹配度 ${Math.round(effectiveMatchScore.value * 100)}%。\n${job.desc}。工资区间：${job.salaryRange}\n\n## 七维能力差距\n\n主要待补齐维度：${gaps}\n\n## 个性化成长计划\n\n${plan}\n\n## 关键技能要求\n\n${job.keySkills.map(s => `- ${s}`).join('\n')}\n`
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
    patched += `\n\n## 岗位匹配摘要\n\n匹配度 ${Math.round(effectiveMatchScore.value * 100)}%。${selectedJob.value.desc}\n`
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

function selectJob(id: string) {
  selectedJobId.value = id
  activeSkillEdge.value = null
  /* 延迟加载成长计划，模拟 Agent 分析过程 */
  planTimers.forEach(t => clearTimeout(t))
  planTimers = []
  planStages.value = []
  if (!id) { planLoading.value = false; radarLoading.value = false; radarReady.value = false; return }
  planLoading.value = true
  radarLoading.value = true
  radarReady.value = false
  planTimers.push(setTimeout(() => { radarReady.value = true }, 700))
  planTimers.push(setTimeout(() => { radarLoading.value = false }, 1400))
  const raw = getGrowthPlan(id)
  if (!raw.length) { planLoading.value = false; return }
  planTimers.push(setTimeout(() => {
    if (raw[0]) planStages.value = [{ ...raw[0], tasks: [] }]
  }, 900))
  /* 短期任务逐条 */
  if (raw[0]) {
    raw[0].tasks.forEach((_, ti) => {
      planTimers.push(setTimeout(() => {
        if (planStages.value[0]) planStages.value[0].tasks = raw[0]!.tasks.slice(0, ti + 1)
      }, 1100 + ti * 140))
    })
  }
  const shortDone = 1100 + (raw[0]?.tasks.length ?? 0) * 140 + 400
  /* 中期卡片 */
  if (raw[1]) {
    planTimers.push(setTimeout(() => {
      planStages.value = [...planStages.value, { ...raw[1]!, tasks: [] }]
    }, shortDone))
    raw[1].tasks.forEach((_, ti) => {
      planTimers.push(setTimeout(() => {
        if (planStages.value[1]) planStages.value[1].tasks = raw[1]!.tasks.slice(0, ti + 1)
      }, shortDone + 200 + ti * 140))
    })
    const midDone = shortDone + 200 + raw[1].tasks.length * 140 + 200
    planTimers.push(setTimeout(() => { planLoading.value = false }, midDone))
  } else {
    planTimers.push(setTimeout(() => { planLoading.value = false }, shortDone))
  }
}
function goBack() { router.push({ name: 'student-career-navigation' }) }
function goToFavorites() { router.push({ name: 'student-favorites' }) }
function goToLearningCenter() {
  if (!selectedJob.value) return
  router.push({ name: 'student-learning', query: { role: selectedJob.value.title } })
}
function toggleStage(phase: string) {
  if (expandedStages.value.has(phase)) expandedStages.value.delete(phase)
  else expandedStages.value.add(phase)
}
onMounted(() => {
  /* 不自动选中，引导用户主动点击气泡图 */
})

onBeforeUnmount(() => {
  climbTimeline?.kill()
  planTimers.forEach(t => clearTimeout(t))
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
        <button class="cr-my-reports-btn" @click="router.push({ name: 'student-my-reports' })">
          <Icon icon="lucide:book-open" :width="12"/><span>我的报告</span>
        </button>
        <UserInfoBar />
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
            <defs></defs>

            <!-- 绳索路径 -->
            <path
              v-for="(rope, ri) in climbLayout.ropes" :key="'r'+ri"
              class="cw-rope-path"
              :d="rope.path"
              :stroke="rope.type === 'promote' ? 'rgba(232,93,58,0.75)' : 'rgba(74,144,217,0.75)'"
              stroke-width="2" fill="none"
              stroke-linecap="round"
            />

            <!-- 技能抓手 + 省略标记 -->
            <g v-for="rope in climbLayout.ropes" :key="'h'+rope.fromId+rope.toId">
              <g v-for="hold in rope.holds" :key="hold.label" class="cw-hold"
                :transform="`translate(${hold.x},${hold.y})`"
                @click.stop="activeSkillEdge = { fromId: rope.fromId, toId: rope.toId, skills: rope.allSkills, fromTitle: JOB_PORTRAITS.find(j => j.id === rope.fromId)?.title ?? '', toTitle: JOB_PORTRAITS.find(j => j.id === rope.toId)?.title ?? '' }"
              >
                <ellipse
                  rx="18" ry="12"
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
                <title>{{ hold.label }}{{ hold.mastered ? ' ✓ 已掌握' : ' ✗ 未掌握' }}（点击查看全部技能）</title>
              </g>
              <g v-if="rope.omittedCount > 0 && rope.holds.length > 0" class="cw-hold cw-hold--more"
                :transform="`translate(${(rope.holds[rope.holds.length - 1]?.x ?? 0) + 38},${rope.holds[rope.holds.length - 1]?.y ?? 0})`"
                @click.stop="activeSkillEdge = { fromId: rope.fromId, toId: rope.toId, skills: rope.allSkills, fromTitle: JOB_PORTRAITS.find(j => j.id === rope.fromId)?.title ?? '', toTitle: JOB_PORTRAITS.find(j => j.id === rope.toId)?.title ?? '' }"
              >
                <ellipse rx="15" ry="10" fill="rgba(139,37,0,0.08)" stroke="rgba(139,37,0,0.25)" stroke-width="1.2" stroke-dasharray="3 2"/>
                <text y="3" text-anchor="middle" class="cw-hold-text" style="fill:rgba(139,37,0,0.6)">+{{ rope.omittedCount }}</text>
                <title>还有 {{ rope.omittedCount }} 项技能，点击查看</title>
              </g>
            </g>

            <!-- 岗位节点（圆形攀岩平台） -->
            <g
              v-for="node in climbLayout.nodes" :key="node.id"
              class="cw-job-node"
              :transform="`translate(${node.x},${node.y})`"
              @click="selectJob(node.id)"
            >
              <circle v-if="selectedJobId === node.id"
                :r="CW_NODE_R + 6" fill="none"
                :stroke="LINE_COLORS[node.lineId] ?? '#E85D3A'" stroke-width="1.5"
                opacity="0.35"
              />
              <circle
                :r="CW_NODE_R"
                :fill="selectedJobId === node.id
                  ? (LINE_COLORS[node.lineId] ?? '#E85D3A')
                  : 'rgba(237,229,214,0.95)'"
                :stroke="LINE_COLORS[node.lineId] ?? '#E85D3A'"
                :stroke-width="selectedJobId === node.id ? 3 : 2"
              />
              <circle
                :r="CW_NODE_R - 6" fill="none"
                :stroke="selectedJobId === node.id ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.05)'"
                stroke-width="0.8"
              />
              <text y="-3" text-anchor="middle"
                class="cw-node-title"
                :class="{ 'cw-node-title--active': selectedJobId === node.id }">
                {{ node.title.length > 6 ? node.title.slice(0,6) : node.title }}
              </text>
              <text y="8" text-anchor="middle"
                class="cw-node-sub"
                :class="{ 'cw-node-sub--active': selectedJobId === node.id }">
                {{ node.salaryRange }}
              </text>
              <title>{{ node.title }} · {{ node.salaryRange }}</title>
            </g>

            <!-- 攀登者标记 + 起点文字 -->
            <g v-if="selectedJob" class="cw-climber">
              <text
                :x="climbLayout.nodes.find(n => n.id === selectedJobId)?.x ?? CW_W/2"
                :y="(climbLayout.nodes.find(n => n.id === selectedJobId)?.y ?? CW_H - 50) + 24"
                text-anchor="middle" font-size="16">🧗</text>
              <text
                :x="climbLayout.nodes.find(n => n.id === selectedJobId)?.x ?? CW_W/2"
                :y="(climbLayout.nodes.find(n => n.id === selectedJobId)?.y ?? CW_H - 50) + 38"
                text-anchor="middle" class="cw-origin-label">当前位置</text>
            </g>

          </svg>

          <!-- 图例（HTML 浮层，固定在容器左上角） -->
          <div class="cw-legend-overlay">
            <div class="cw-legend-item"><span class="cw-legend-line cw-legend-line--promote"></span><span>晋升路径</span></div>
            <div class="cw-legend-item"><span class="cw-legend-line cw-legend-line--transfer"></span><span>转岗路径</span></div>
            <div class="cw-legend-item"><span class="cw-legend-dot cw-legend-dot--mastered"></span><span>已掌握</span></div>
            <div class="cw-legend-item"><span class="cw-legend-dot cw-legend-dot--unmastered"></span><span>未掌握</span></div>
          </div>

          <!-- 技能详情浮动面板 -->
          <div v-if="activeSkillEdge" class="cw-skill-panel" @click.stop>
            <div class="cw-sp-header">
              <span class="cw-sp-title">{{ activeSkillEdge.fromTitle }} → {{ activeSkillEdge.toTitle }}</span>
              <button class="cw-sp-close" @click="activeSkillEdge = null"><Icon icon="lucide:x" :width="12"/></button>
            </div>
            <ul class="cw-sp-list">
              <li v-for="skill in activeSkillEdge.skills" :key="skill" class="cw-sp-item">
                <span class="cw-sp-dot" :class="isSkillMastered(skill) ? 'cw-sp-dot--ok' : 'cw-sp-dot--gap'"></span>
                <span class="cw-sp-name">{{ skill }}</span>
                <span v-if="isSkillMastered(skill)" class="cw-sp-tag cw-sp-tag--ok">已掌握</span>
                <span v-else class="cw-sp-tag cw-sp-tag--gap">待提升</span>
              </li>
            </ul>
          </div>

          <!-- 未选岗位引导 -->
          <div v-if="!selectedJob" class="cr-guide-overlay">
            <Icon icon="lucide:mountain" :width="28" class="cr-guide-icon"/>
            <p class="cr-guide-text">请先在右侧<br/><strong>点击岗位气泡</strong></p>
            <Icon icon="lucide:arrow-right" :width="18" class="cr-guide-arrow"/></div>
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
                :stroke-dasharray="`${Math.round(effectiveMatchScore * 213.6)} 213.6`"
                transform="rotate(-90 40 40)"/>
              <text x="40" y="38" text-anchor="middle" class="cr-hero-pct">{{ Math.round(effectiveMatchScore * 100) }}%</text>
              <text x="40" y="50" text-anchor="middle" class="cr-hero-pct-label">匹配度</text>
            </svg>
          </div>
          <div class="cr-hero__info">
            <div class="cr-hero-job">{{ selectedJob.title }}</div>
            <div class="cr-hero-desc">{{ selectedJob.desc }}</div>
            <button class="cr-hero-courses-btn" @click="goToLearningCenter">
              <Icon icon="lucide:book-open" :width="13"/>
              <span>查看岗位课程</span>
            </button>
          </div>
        </div>

        <!-- 中栏上半：气泡图 + 雷达图 -->
        <div class="cr-center-top">

          <!-- ③ 气泡图 -->
          <div class="cr-bubble-panel">
            <div class="cr-panel-title">
              <Icon icon="lucide:circle-dot" :width="12"/>
              <span>岗位匹配气泡图</span>
              <span v-if="selectedJob" class="cr-panel-sub">气泡越大匹配度越高</span>
              <span v-else class="cr-panel-sub cr-panel-sub--hint">← 点击气泡选择目标岗位</span>
            </div>
            <svg :viewBox="`0 0 ${BB_W} ${BB_H}`" class="cr-bubble-svg">
              <defs>
                <radialGradient id="bb-warm" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stop-color="rgba(196,150,80,0.06)"/>
                  <stop offset="100%" stop-color="transparent"/>
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#bb-warm)"/>
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
                <text v-if="item.r >= 22 && splitBubbleTitle(item.job.title, item.r).length === 1" class="cr-bt" dy="-4">
                  {{ splitBubbleTitle(item.job.title, item.r)[0] }}
                </text>
                <text v-else-if="item.r >= 22 && splitBubbleTitle(item.job.title, item.r).length >= 2" class="cr-bt">
                  <tspan :x="0" dy="-8" text-anchor="middle">{{ splitBubbleTitle(item.job.title, item.r)[0] }}</tspan>
                  <tspan :x="0" dy="11" text-anchor="middle">{{ splitBubbleTitle(item.job.title, item.r)[1] }}</tspan>
                </text>
                <text v-if="item.r >= 22" class="cr-bp" :dy="splitBubbleTitle(item.job.title, item.r).length >= 2 ? 16 : 10">
                  {{ Math.round(item.job.matchScore * 100) }}%
                </text>
                <text v-else-if="item.r >= 14" class="cr-ba" dy="4">
                  {{ splitBubbleTitle(item.job.title, item.r)[0] }}
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
              <Icon icon="lucide:radar" :width="24" class="cr-guide-icon"/>
              <p>点击气泡选择岗位<br/>即可查看能力差距</p>
            </div>
            <!-- 骨架屏 -->
            <div v-else-if="radarLoading && !radarReady" class="cr-radar-skeleton">
              <div class="cr-skel-radar-circle"></div>
              <div class="cr-skel-bar cr-skel-bar--text" style="width:70%;margin:8px auto 0"></div>
              <div class="cr-skel-bar cr-skel-bar--text cr-skel-bar--short" style="width:50%;margin:4px auto 0"></div>
            </div>
            <!-- 雷达图淡入 -->
            <template v-else>
              <div class="cr-plan-fadein cr-radar-chart-area">
                <D3RadarChart :data="crRadarData" :show-legend="true" :height="280" />
              </div>
              <div v-if="!radarLoading" class="cr-gap-bars">
                <div v-for="(item, gi) in dimGaps" :key="item.name" class="cr-gap-row cr-task-fadein"
                  :style="{ animationDelay: gi * 0.08 + 's' }">
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
              <template v-if="planLoading">
                <span>AI 正在分析 {{ selectedJob?.title }} 成长路径</span>
                <Icon icon="lucide:loader-2" :width="12" class="cr-spin" style="margin-left:4px; color:var(--primary-100)"/>
              </template>
              <template v-else>
                <span>个性化成长计划</span>
                <span v-if="!selectedJob" class="cr-panel-sub">选中岗位后生成</span>
              </template>
            </div>

            <!-- 未选岗位 -->
            <div v-if="!selectedJob" class="cr-planning-empty">
              <Icon icon="lucide:sparkles" :width="20" class="cr-guide-icon"/>
              <p>选择目标岗位后<br/>AI 将生成专属成长方案</p>
            </div>

            <!-- 骨架屏（已选岗位但计划还没加载出来） -->
            <div v-else-if="planLoading && !planStages.length" class="cr-plan-skeleton">
              <div class="cr-skel-card" v-for="n in 2" :key="n">
                <div class="cr-skel-bar cr-skel-bar--title"></div>
                <div class="cr-skel-bar cr-skel-bar--text"></div>
                <div class="cr-skel-bar cr-skel-bar--text cr-skel-bar--short"></div>
                <div class="cr-skel-bar cr-skel-bar--text"></div>
              </div>
            </div>

            <!-- 逐步显示的计划卡片 -->
            <div v-else-if="planStages.length" class="cr-plan-stages">
              <div v-for="(stage, si) in planStages" :key="stage.phase" class="cr-plan-stage cr-plan-fadein"
                :class="`cr-plan-stage--${stage.phase}`"
                :style="{ animationDelay: si * 0.15 + 's' }">
                <div class="cr-ps-head" @click="toggleStage(stage.phase)">
                  <Icon :icon="stage.phase === 'short' ? 'lucide:target' : 'lucide:rocket'" :width="14" class="cr-ps-icon"/>
                  <span class="cr-ps-label">{{ stage.phaseLabel }}</span>
                  <Icon :icon="expandedStages.has(stage.phase) ? 'lucide:chevron-up' : 'lucide:chevron-down'" :width="12" class="cr-ps-toggle"/>
                </div>
                <span class="cr-ps-goal">{{ stage.goal }}</span>
                <ul class="cr-ps-list" :class="{ 'cr-ps-list--collapsed': !expandedStages.has(stage.phase) }">
                  <li v-for="(t, ti) in stage.tasks" :key="ti" class="cr-task-fadein" :style="{ animationDelay: ti * 0.08 + 's' }">
                    <Icon icon="lucide:circle" :width="8" class="cr-ps-bullet"/>{{ t }}
                  </li>
                </ul>
                <button v-if="!expandedStages.has(stage.phase) && stage.tasks.length > 3" class="cr-ps-expand" @click="toggleStage(stage.phase)">
                  展开全部 ({{ stage.tasks.length }}项)
                </button>
                <div v-if="stage.milestone && !planLoading" class="cr-ps-milestone">
                  <Icon icon="lucide:flag" :width="10"/>{{ stage.milestone }}
                </div>
                <div v-if="si < planStages.length - 1" class="cr-ps-arrow">
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
      <button class="cr-footer-fav" @click="goToFavorites">
        <Icon icon="lucide:heart" :width="11"/>
        查看心仪岗位匹配度
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
.cr-header__tabs  { display: flex; align-items: center; gap: 0; position: absolute; left: 50%; transform: translateX(-50%); }
.cr-header__right { display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
.cr-back {
  display: flex; align-items: center; gap: 4px; background: transparent;
  border: 1px solid var(--bg-300); color: var(--text-200);
  font-size: 12px; padding: 4px 10px; cursor: pointer; border-radius: var(--radius-sm);
  transition: border-color 300ms ease, color 300ms ease, transform 150ms ease, box-shadow 150ms ease; font-family: var(--font-ui);
}
.cr-back:hover { border-color: var(--primary-100); color: var(--primary-100); transform: translateY(-1px); box-shadow: 0 3px 8px rgba(139,37,0,0.12); }
.cr-tab {
  display: flex; align-items: center; gap: 5px; cursor: pointer;
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--text-300); font-size: 12px; padding: 6px 18px; height: 100%;
  font-family: var(--font-ui); transition: color 300ms ease, border-color 300ms ease;
}
.cr-tab--active {
  color: var(--primary-100); font-weight: 600;
  border-bottom: 2px solid var(--primary-100);
}
.cr-tab:hover:not(.cr-tab--active) { color: var(--text-200); }
.cr-report-btn {
  display: flex; align-items: center; gap: 5px; cursor: pointer;
  background: var(--primary-100); border: 1px solid var(--primary-100);
  color: #fff; border-radius: var(--radius-sm); font-weight: 600;
  font-size: 11px; padding: 5px 14px; font-family: var(--font-ui);
  transition: background 300ms ease, transform 150ms ease, box-shadow 150ms ease;
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
  border: 1px solid rgba(139,37,0,0.35); color: var(--text-200); border-radius: var(--radius-sm);
  font-size: 11px; padding: 5px 12px; font-family: var(--font-ui);
  transition: background 300ms ease, transform 150ms ease, box-shadow 150ms ease;
}
.cr-save-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: var(--radius-sm); font-family: var(--font-ui);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.3s;
  background: rgba(139,105,20,0.15); border: 1px solid rgba(196,150,30,0.4);
  color: rgba(139,105,20,1);
}
.cr-save-btn:hover:not(:disabled) { background: rgba(139,105,20,0.3); }
.cr-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cr-my-reports-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: var(--radius-sm); font-family: var(--font-ui);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.3s;
  background: rgba(139,105,20,0.15); border: 1px solid rgba(196,150,30,0.4);
  color: rgba(139,105,20,1);
}
.cr-my-reports-btn:hover { background: rgba(139,105,20,0.3); }

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
  transition: background 300ms ease; border-radius: var(--radius-sm);
}
.cr-footer-go:hover { background: rgba(139,37,0,0.06); }
.cr-footer-fav {
  display: flex; align-items: center; gap: 4px;
  background: none; border: 1px solid rgba(139,37,0,0.25); color: var(--primary-100);
  cursor: pointer; font-size: 10px; padding: 2px 10px; font-family: var(--font-ui);
  transition: background 300ms ease; border-radius: var(--radius-sm);
}
.cr-footer-fav:hover { background: rgba(139,37,0,0.06); }

/* ══ 分析模式主布局 ══ */
.cr-main {
  flex: 1; display: grid; grid-template-columns: 420px 1fr;
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
  position: relative;
  background:
    radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(26,20,16,0.08) 100%),
    radial-gradient(circle at 18% 25%, rgba(139,37,0,0.04) 0%, transparent 50%),
    radial-gradient(circle at 75% 60%, rgba(139,37,0,0.03) 0%, transparent 45%),
    radial-gradient(circle at 45% 80%, rgba(139,105,20,0.025) 0%, transparent 40%),
    var(--bg-200);
}
.cr-cw-wrap::-webkit-scrollbar { width: 3px; }
.cr-cw-wrap::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.2); }
.cr-cw-svg { display: block; width: 100%; height: auto; cursor: default; }
.cw-job-node { cursor: pointer; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.22)); }
.cw-job-node:hover circle { filter: brightness(1.1); }
.cw-node-title { font-size: 12px; fill: #333; font-weight: 600; pointer-events: none; }
.cw-node-title--active { fill: #fff; }
.cw-node-sub { font-size: 10px; fill: #5C4A38; pointer-events: none; }
.cw-node-sub--active { fill: rgba(255,255,255,0.9); }
.cw-hold { cursor: pointer; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.18)); }
.cw-hold:hover ellipse { filter: brightness(1.2); }
.cw-hold--more { cursor: pointer; opacity: 0.85; }
.cw-hold--more:hover { opacity: 1; }
.cw-hold-text { font-size: 10px; fill: #3D2B1A; pointer-events: none; font-weight: 600; }
.cw-origin-label { font-size: 9px; fill: var(--primary-100, #8B2500); font-weight: 600; font-family: var(--font-ui); }
.cw-legend-overlay {
  position: absolute; top: 4px; left: 4px; z-index: 2;
  display: flex; flex-direction: column; gap: 5px;
  padding: 6px 10px; border-radius: 6px;
  background: rgba(245,240,232,0.88); backdrop-filter: blur(4px);
  border: 1px solid rgba(139,37,0,0.08);
  pointer-events: none;
}
.cw-legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #5C4A38; font-family: var(--font-ui); white-space: nowrap; }
.cw-legend-line { display: inline-block; width: 20px; height: 3px; border-radius: 2px; flex-shrink: 0; }
.cw-legend-line--promote { background: rgba(232,93,58,0.6); }
.cw-legend-line--transfer { background: rgba(74,144,217,0.6); }
.cw-legend-dot { display: inline-block; width: 12px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.cw-legend-dot--mastered { background: rgba(62,184,140,0.5); border: 1.4px solid #3DB88C; }
.cw-legend-dot--unmastered { background: rgba(237,229,214,0.5); border: 1.4px dashed #E85D3A; }
.cw-rope-path { transition: stroke-width 300ms ease; }
.cw-rope-path:hover { stroke-width: 3; }
/* ── 引导覆盖层 ── */
.cr-guide-overlay {
  position: absolute; inset: 0; z-index: 5;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  background: rgba(237,229,214,0.55); backdrop-filter: blur(2px);
  color: var(--text-300); text-align: center;
}
.cr-guide-text { font-size: 12px; line-height: 1.6; color: var(--text-200); }
.cr-guide-text strong { color: var(--primary-100); }
.cr-guide-icon { color: var(--bg-400); opacity: 0.6; }
.cr-guide-arrow {
  color: var(--primary-100); animation: cr-pulse-arrow 1.6s ease-in-out infinite;
}
@keyframes cr-pulse-arrow {
  0%, 100% { transform: translateX(0); opacity: 0.6; }
  50% { transform: translateX(6px); opacity: 1; }
}
.cr-panel-sub--hint {
  color: var(--primary-100); font-weight: 500;
  animation: cr-pulse-arrow 2s ease-in-out infinite;
}

/* ── 技能详情浮动面板 ── */
.cw-skill-panel {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 180px; max-height: 280px; overflow-y: auto;
  background: rgba(255,252,245,0.96); border: 1px solid rgba(139,37,0,0.2);
  border-radius: 8px; box-shadow: 0 4px 16px rgba(26,20,16,0.15);
  padding: 10px 12px; z-index: 10; backdrop-filter: blur(6px);
}
.cw-sp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.cw-sp-title { font-size: 10px; font-weight: 600; color: var(--text-100); font-family: var(--font-title); line-height: 1.3; }
.cw-sp-close {
  flex-shrink: 0; background: none; border: none; cursor: pointer;
  color: var(--text-300); padding: 2px; display: flex; align-items: center;
}
.cw-sp-close:hover { color: var(--primary-100); }
.cw-sp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.cw-sp-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--text-200); }
.cw-sp-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.cw-sp-dot--ok { background: #3DB88C; }
.cw-sp-dot--gap { background: #E85D3A; }
.cw-sp-name { flex: 1; min-width: 0; font-family: var(--font-ui); }
.cw-sp-tag { font-size: 9px; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; font-family: var(--font-ui); }
.cw-sp-tag--ok { background: rgba(62,184,140,0.15); color: #2A9D6E; }
.cw-sp-tag--gap { background: rgba(232,93,58,0.12); color: #B8421A; }

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
.cr-hero-pct { font-size: 14px; font-weight: 600; fill: var(--primary-100, #8B2500); font-family: var(--font-ui); }
.cr-hero-pct-label { font-size: 7px; fill: var(--text-300, #999); }
.cr-hero__info { flex: 1; min-width: 0; }
.cr-hero-job { font-size: 16px; font-weight: 600; color: var(--primary-300); font-family: var(--font-title); letter-spacing: 0.02em; }
.cr-hero-desc { font-size: 11px; color: var(--text-300); margin-top: 4px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cr-hero-courses-btn {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;
  padding: 4px 12px; border: 1px solid var(--primary-200, #C0501A); border-radius: 14px;
  background: transparent; color: var(--primary-200, #C0501A); font-size: 11px;
  cursor: pointer; transition: all 0.2s;
}
.cr-hero-courses-btn:hover {
  background: var(--primary-200, #C0501A); color: #fff;
}
/* ── 中栏上：气泡 + 雷达 ── */
.cr-center-top {
  flex: 0 0 420px; display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid var(--bg-300); overflow: hidden;
}
.cr-bubble-panel, .cr-radar-panel { display: flex; flex-direction: column; overflow: hidden; }
.cr-bubble-panel { border-right: 1px solid var(--bg-300); background: linear-gradient(180deg, var(--bg-100) 0%, color-mix(in srgb, var(--bg-200) 50%, var(--bg-100) 50%) 100%); position: relative; }
.cr-bubble-panel::before {
  content: ''; position: absolute; inset: 0; z-index: 0;
  pointer-events: none; opacity: 0.14;
  background-image: v-bind(parchmentBg);
  background-size: cover; background-position: center;
}
.cr-radar-panel { background: var(--bg-100); position: relative; }
.cr-radar-panel::before {
  content: ''; position: absolute; inset: 0; z-index: 0;
  pointer-events: none; opacity: 0.16;
  background-image: v-bind(parchmentBg);
  background-size: cover; background-position: center;
}

/* ── 气泡图 SVG ── */
.cr-bubble-svg { display: block; width: 100%; flex: 1; position: relative; z-index: 1; }
.cr-bubble-g { cursor: pointer; }
.cr-bubble-g:hover .cr-bubble-circle {
  fill: color-mix(in srgb, var(--c) 48%, var(--bg-100) 52%);
  stroke-opacity: 0.75;
}
@keyframes cr-breathe {
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%       { transform: scale(1.12); opacity: 0.9; }
}
.cr-bubble-circle {
  fill: color-mix(in srgb, var(--c) 28%, var(--bg-100) 72%);
  stroke: var(--c);
  stroke-width: 1.2;
  stroke-opacity: 0.45;
  transform-box: fill-box;
  transform-origin: center;
  animation: cr-breathe var(--bd, 3.5s) ease-in-out var(--bk, 0s) infinite;
  transition: fill 180ms ease, stroke-opacity 180ms ease;
}
.cr-bubble-g--sel .cr-bubble-circle {
  fill: color-mix(in srgb, var(--c) 72%, var(--bg-100) 28%);
  stroke: color-mix(in srgb, var(--c) 88%, #000 12%);
  stroke-width: 2;
  stroke-opacity: 1;
}
.cr-bt {
  font-size: 10px; font-weight: 600; fill: var(--text-100);
  text-anchor: middle; pointer-events: none; font-family: var(--font-title);
}
.cr-bp {
  font-size: 8.5px; fill: var(--text-200, #666);
  text-anchor: middle; pointer-events: none; font-family: var(--font-ui);
}
.cr-ba {
  font-size: 9px; font-weight: 600; fill: var(--text-100);
  text-anchor: middle; dominant-baseline: central; pointer-events: none; font-family: var(--font-title);
}
.cr-bubble-g--sel .cr-bt,
.cr-bubble-g--sel .cr-bp,
.cr-bubble-g--sel .cr-ba { fill: #fff; }

/* ── ② 雷达图 + 差距条 ── */
.cr-radar-chart-area { flex: 1; min-height: 0; overflow: hidden; transition: flex-basis 0.5s ease, height 0.5s ease; }
.cr-radar-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--bg-400); font-size: 11px; text-align: center; line-height: 1.7;
}
.cr-radar { flex-shrink: 0; width: 100%; height: 250px; }
.cr-radar-legend {
  display: flex; align-items: center; gap: 10px; margin-left: auto;
  font-size: 11px; font-weight: 600; color: var(--text-200); font-family: var(--font-ui);
  background: rgba(139,37,0,0.04); padding: 2px 10px; border-radius: 12px;
}
.cr-legend-dot {
  display: inline-block; width: 10px; height: 10px; border-radius: 50%;
  flex-shrink: 0; box-shadow: 0 0 0 2px rgba(255,255,255,0.6);
}
.cr-legend-dot--dashed {
  background: transparent !important;
  border: 2px dashed;
  border-radius: 3px;
  width: 10px; height: 10px;
}
.cr-gap-bars { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px; padding: 4px 8px 6px; animation: cr-gap-enter 0.5s ease both; }
@keyframes cr-gap-enter { from { opacity: 0; max-height: 0; padding: 0 8px; } to { opacity: 1; max-height: 200px; padding: 4px 8px 6px; } }
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
  transition: transform 300ms ease, box-shadow 300ms ease;
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
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-sm);
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
  transition: color 300ms ease; align-self: flex-start; border-radius: var(--radius-sm);
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

/* ── 雷达骨架屏 ── */
.cr-radar-skeleton {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px; padding: 20px;
}
.cr-skel-radar-circle {
  width: 140px; height: 140px; border-radius: 50%;
  background: linear-gradient(135deg, var(--bg-300) 25%, rgba(139,37,0,0.04) 50%, var(--bg-300) 75%);
  background-size: 200% 200%;
  animation: cr-shimmer 1.5s ease-in-out infinite;
}

/* ── 骨架屏 ── */
.cr-plan-skeleton {
  flex: 1; display: flex; gap: 14px; padding: 14px 16px; overflow: hidden;
}
.cr-skel-card {
  flex: 1; min-width: 200px; padding: 16px; border-radius: 8px;
  background: var(--bg-200); display: flex; flex-direction: column; gap: 12px;
}
.cr-skel-bar {
  height: 12px; border-radius: 6px;
  background: linear-gradient(90deg, var(--bg-300) 25%, rgba(139,37,0,0.06) 50%, var(--bg-300) 75%);
  background-size: 200% 100%;
  animation: cr-shimmer 1.5s ease-in-out infinite;
}
.cr-skel-bar--title { width: 50%; height: 14px; margin-bottom: 4px; }
.cr-skel-bar--text  { width: 85%; }
.cr-skel-bar--short { width: 60%; }
@keyframes cr-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── 计划卡片淡入 ── */
.cr-plan-fadein {
  animation: cr-slide-up 0.45s ease-out both;
}
@keyframes cr-slide-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cr-task-fadein {
  animation: cr-task-in 0.3s ease-out both;
}
@keyframes cr-task-in {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ══ 公用面板标题 ══ */
.cr-panel-title {
  flex-shrink: 0; display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--text-100);
  font-family: var(--font-title); letter-spacing: 0.02em;
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
  font-size: 18px; font-weight: 600; color: var(--text-100); font-family: var(--font-title);
  letter-spacing: 0.02em; margin: 16px 0 8px; padding-bottom: 6px;
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
  font-size: 11px; padding: 7px 12px; font-family: var(--font-ui); border-radius: var(--radius-sm);
  transition: background 300ms ease, border-color 300ms ease, transform 150ms ease;
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
