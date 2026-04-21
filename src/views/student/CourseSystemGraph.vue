<!-- 页面：课程体系分层图谱；路由：student/course-system；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLearningStore } from '@/stores'
import UserInfoBar from '@/components/UserInfoBar.vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { gsap } from '@/plugins/gsap'
import { useResizeObserver } from '@/composables/useResizeObserver'
import { CAREER_DOMAINS } from '@/composables/useCareerInsights'
import {
  getCourseSystemData,
  TIER_ORDER, TIER_LABELS, TIER_COLORS,
  COURSE_GROUP_LABELS, COURSE_GROUP_COLORS,
  type CourseNode, type CourseEdge, type SkillTier,
  type CourseSystemData, type GraphCourseNode, type CourseGroup,
} from '@/composables/useCourseSystem'

defineOptions({ name: 'CourseSystemGraph' })

const route = useRoute()
const router = useRouter()
const learningStore = useLearningStore()

const graphMode = computed<'focus' | 'overview'>(() => (
  route.name === 'student-skill-graph' ? 'overview' : 'focus'
))
const isOverviewMode = computed(() => graphMode.value === 'overview')

const roleName = computed(() => {
  const qr = route.query.role as string | undefined
  if (qr) return qr
  if (learningStore.targetRoles.length > 0) return learningStore.targetRoles[0]!.role
  return '前端开发'
})

const pageTitle = computed(() => (
  isOverviewMode.value ? '技能图谱 · 15个职业总览' : `课程体系图谱 · ${roleName.value}`
))

function resolveJobNode(role: string): { domainId: string; jobIndex: number } | null {
  for (const d of CAREER_DOMAINS) {
    const ji = d.jobs.findIndex(j => j === role)
    if (ji !== -1) return { domainId: d.id, jobIndex: ji }
  }
  for (const d of CAREER_DOMAINS) {
    if (d.role === role || d.name === role) return { domainId: d.id, jobIndex: 0 }
  }
  return null
}

function goBack() { router.back() }
function goToLearningCenter() {
  const targetRole = learningCenterRole.value
  if (!targetRole) return
  router.push({ name: 'student-learning', query: { role: targetRole } })
}

/* ═══ 状态 ═══ */
const highlightTier = ref<SkillTier | null>(null)
const selectedSkillId = ref<string | null>(null)
const selectedCareerId = ref<string | null>(null)
const showLabels = ref(false)
const hoverTooltip = ref<{ name: string; tier: string; x: number; y: number } | null>(null)

/* ═══ 数据 ═══ */
const graphData = ref<CourseSystemData | null>(null)
const nodes = ref<CourseNode[]>([])
const edges = ref<CourseEdge[]>([])
const courseNodes = ref<GraphCourseNode[]>([])

/* ═══ 层级高亮切换 ═══ */
function toggleTierHighlight(tier: SkillTier) {
  highlightTier.value = highlightTier.value === tier ? null : tier
  selectedSkillId.value = null
  selectedCareerId.value = null
  updateHighlight()
}

function selectPathNode(nodeId: string) {
  if (selectedSkillId.value === nodeId) return
  selectedSkillId.value = nodeId
  selectedCareerId.value = null
  updateHighlight()
}

function toggleLabels() {
  showLabels.value = !showLabels.value
  for (const [id, div] of labelDivs) {
    const mesh = nodeMeshes.get(id)
    if (!mesh) continue
    const n = mesh.userData.node as CourseNode
    if (n.tier === 'job') continue
    div.style.display = showLabels.value ? '' : 'none'
  }
  updateLabels()
}

/* ═══ Three.js 场景对象 ═══ */
const canvasContainer = ref<HTMLDivElement>()
const graphContainerEl = ref<HTMLElement>()
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let animFrameId = 0
const nodeMeshes = new Map<string, THREE.Mesh>()
const edgeMeshes: { mesh: THREE.Mesh; edge: CourseEdge }[] = []
const labelDivs = new Map<string, HTMLDivElement>()
let posMap3D = new Map<string, THREE.Vector3>()
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 12, 28)
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 7, 0)
const VIEW_RESET_DURATION = 0.6
let viewResetTimeline: ReturnType<typeof gsap.timeline> | null = null

/* ═══ 五域配色 ═══ */
const DOMAIN_COLORS: Record<string, string> = {
  frontend: '#F43F5E',
  backend:  '#10B981',
  qa:       '#06B6D4',
  data:     '#F59E0B',
  ml:       '#6366F1',
}
function getNodeColor(node: CourseNode): string {
  return DOMAIN_COLORS[node.domainId ?? 'backend'] ?? '#666'
}

/* ═══ 3D 常量 ═══ */
const NODE_RADIUS_3D: Record<SkillTier, number> = {
  foundation: 0.16, junior: 0.19, mid: 0.23, senior: 0.30, job: 0.50,
}
const TIER_Y_3D: Record<SkillTier, number> = {
  foundation: 0, junior: 3.5, mid: 7, senior: 10.5, job: 14,
}
const PLATFORM_BASE_W = 6
const PLATFORM_BASE_D = 3
const TIER_PLATFORM_SCALE: Record<SkillTier, number> = {
  job: 1.0, senior: 1.8, mid: 2.6, junior: 3.4, foundation: 4.2,
}
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function compute3DPositions(allNodes: CourseNode[], mode: 'focus' | 'overview'): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>()
  const tierBuckets = new Map<SkillTier, CourseNode[]>()
  for (const n of allNodes) {
    const arr = tierBuckets.get(n.tier) ?? []
    arr.push(n)
    tierBuckets.set(n.tier, arr)
  }
  for (const tier of TIER_ORDER) {
    const bucket = tierBuckets.get(tier) ?? []
    const y = TIER_Y_3D[tier]
    const scale = TIER_PLATFORM_SCALE[tier]
    const halfW = (PLATFORM_BASE_W * scale) * 0.42
    const halfD = (PLATFORM_BASE_D * scale) * 0.42

    if (tier === 'job') {
      bucket.forEach(n => {
        map.set(
          n.id,
          mode === 'overview' ? computeOverviewJobPosition(n, y) : new THREE.Vector3(0, y, 0),
        )
      })
      continue
    }

    const count = bucket.length
    bucket.forEach((n, i) => {
      const r = Math.sqrt((i + 0.5) / count)
      const theta = i * GOLDEN_ANGLE
      const seed = n.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
      const jx = (seededRand(seed) - 0.5) * 0.25
      const jz = (seededRand(seed * 2.71) - 0.5) * 0.25
      const x = r * Math.cos(theta) * halfW + jx
      const z = r * Math.sin(theta) * halfD + jz
      map.set(n.id, new THREE.Vector3(x, y, z))
    })
  }
  return map
}

function computeOverviewJobPosition(node: CourseNode, y: number): THREE.Vector3 {
  const domainIndex = Math.max(CAREER_DOMAINS.findIndex(d => d.id === node.domainId), 0)
  const idParts = node.id.split('-')
  const jobIndex = Number(idParts[idParts.length - 1] ?? 0)
  const domainAngle = -Math.PI / 2 + domainIndex * ((Math.PI * 2) / CAREER_DOMAINS.length)
  const radius = 5.8
  const tangentX = -Math.sin(domainAngle)
  const tangentZ = Math.cos(domainAngle)
  const center = new THREE.Vector3(
    Math.cos(domainAngle) * radius,
    y,
    Math.sin(domainAngle) * radius,
  )
  const spread = (jobIndex - 1) * 1.55
  const radialOffset = jobIndex === 1 ? 0.32 : 0

  return center.add(new THREE.Vector3(
    tangentX * spread + Math.cos(domainAngle) * radialOffset,
    0,
    tangentZ * spread + Math.sin(domainAngle) * radialOffset,
  ))
}

/* ═══ 成长路径追溯 ═══ */
function computeGrowthPath(nodeId: string): CourseNode[] {
  const nodeMap = new Map(nodes.value.map(n => [n.id, n]))
  const node = nodeMap.get(nodeId)
  if (!node) return []

  // 如果选中了职业节点，路径是所有关联该职业的技能
  if (node.tier === 'job') {
    const related = nodes.value.filter(
      n => n.relatedCareers?.includes(nodeId) || n.id === nodeId,
    )
    const tierIdx = (t: SkillTier) => TIER_ORDER.indexOf(t)
    return related.sort((a, b) => tierIdx(a.tier) - tierIdx(b.tier))
  }

  // 普通技能节点：BFS 向上追溯
  const pathIds = new Set<string>()
  const path: CourseNode[] = []

  let upQueue = [nodeId]
  while (upQueue.length > 0) {
    const next: string[] = []
    for (const id of upQueue) {
      if (pathIds.has(id)) continue
      pathIds.add(id)
      const n = nodeMap.get(id)
      if (n) path.push(n)
      edges.value
        .filter(e => e.source === id && e.isCareerPath)
        .forEach(e => { if (!pathIds.has(e.target)) next.push(e.target) })
    }
    upQueue = next
  }

  const downPath: CourseNode[] = []
  let downQueue: string[] = []
  edges.value
    .filter(e => e.target === nodeId && e.isCareerPath)
    .forEach(e => { if (!pathIds.has(e.source)) downQueue.push(e.source) })

  while (downQueue.length > 0) {
    const next: string[] = []
    for (const id of downQueue) {
      if (pathIds.has(id)) continue
      pathIds.add(id)
      const n = nodeMap.get(id)
      if (n) downPath.push(n)
      edges.value
        .filter(e => e.target === id && e.isCareerPath)
        .forEach(e => { if (!pathIds.has(e.source)) next.push(e.source) })
    }
    downQueue = next
  }

  const tierIdx = (t: SkillTier) => TIER_ORDER.indexOf(t)
  return [...downPath, ...path].sort((a, b) => tierIdx(a.tier) - tierIdx(b.tier))
}

/* ═══ 选中节点的计算属性 ═══ */
const selectedNode = computed(() => {
  if (!selectedSkillId.value) return null
  return nodes.value.find(n => n.id === selectedSkillId.value) ?? null
})

const growthPath = computed(() => {
  const id = selectedCareerId.value || selectedSkillId.value
  if (!id) return []
  return computeGrowthPath(id)
})

const relatedCourses = computed(() => {
  if (!selectedSkillId.value || !graphData.value) return []
  const linkedIds = new Set(
    graphData.value.skillCourseEdges
      .filter(e => e.skillId === selectedSkillId.value)
      .map(e => e.courseId)
  )
  return courseNodes.value.filter(c => linkedIds.has(c.id))
})

const groupedCourses = computed(() => {
  const groups = new Map<CourseGroup, GraphCourseNode[]>()
  for (const c of relatedCourses.value) {
    const arr = groups.get(c.group) ?? []
    arr.push(c)
    groups.set(c.group, arr)
  }
  return groups
})

/* ═══ 关联职业（面板用） ═══ */
const JOB_NAME_MAP = new Map<string, { name: string; domainId: string }>(
  CAREER_DOMAINS.flatMap(d =>
    d.jobs.map((jobName, ji) => [`job-${d.id}-${ji}`, { name: jobName, domainId: d.id }] as const),
  ),
)
const selectedCareerName = computed(() => {
  if (!selectedCareerId.value) return ''
  return JOB_NAME_MAP.get(selectedCareerId.value)?.name ?? ''
})
const learningCenterRole = computed(() => (
  isOverviewMode.value ? selectedCareerName.value : roleName.value
))
const canGoToLearningCenter = computed(() => Boolean(learningCenterRole.value))
const learningButtonLabel = computed(() => {
  if (!isOverviewMode.value) return '查看岗位课程'
  return selectedCareerName.value ? `查看 ${selectedCareerName.value} 课程` : '选择岗位后查看课程'
})
const legendTip = computed(() => (
  isOverviewMode.value
    ? '点击岗位节点，可切换查看该职业的全链路技能。'
    : '点击岗位节点，高亮当前职业的全链路技能。'
))
const hintText = computed(() => (
  isOverviewMode.value
    ? '拖拽旋转 · 滚轮缩放 · 右键平移 · 点击岗位切换职业视角 · 双击重置'
    : '拖拽旋转 · 滚轮缩放 · 右键平移 · 点击节点查看详情 · 点击岗位高亮全链路 · 双击重置'
))

const relatedCareers = computed(() => {
  if (!selectedNode.value) return []
  const careers = selectedNode.value.relatedCareers ?? []
  return careers.map(cId => {
    const info = JOB_NAME_MAP.get(cId)
    const domainId = info?.domainId ?? cId.split('-').slice(1, -1).join('-')
    return { id: cId, name: info?.name ?? cId, domainId, color: DOMAIN_COLORS[domainId] ?? '#666' }
  })
})

/* ═══ 节点透明度 ═══ */
function getNodeOpacity(node: CourseNode): number {
  const ht = highlightTier.value
  const selCareer = selectedCareerId.value
  const selSkill = selectedSkillId.value

  if (selCareer) {
    if (node.id === selCareer) return 1
    if (node.relatedCareers?.includes(selCareer)) return 1
    return 0.08
  }
  if (selSkill) {
    const pathIds = new Set(growthPath.value.map(n => n.id))
    if (node.id === selSkill) return 1
    if (pathIds.has(node.id)) return 0.85
    const isNeighbor = edges.value.some(e =>
      (e.source === selSkill && e.target === node.id) || (e.target === selSkill && e.source === node.id)
    )
    if (isNeighbor) return 0.65
    return 0.08
  }
  if (ht) return ht === node.tier ? 1 : 0.15
  return node.tier === 'job' ? 1 : 0.82
}

/* ═══ 现代纹理背景 ═══ */
function createModernBgTexture(): THREE.CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!

  // 1) 较深暖灰→冷蓝渐变底（有明显色差）
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#D6D0C8')
  grad.addColorStop(0.45, '#CDD0D8')
  grad.addColorStop(1, '#C4CAD6')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // 2) 左上暖光晕（明显高光区）
  const r1 = ctx.createRadialGradient(size * 0.25, size * 0.2, 0, size * 0.25, size * 0.2, size * 0.55)
  r1.addColorStop(0, 'rgba(248,240,225,0.55)')
  r1.addColorStop(0.6, 'rgba(248,240,225,0.15)')
  r1.addColorStop(1, 'rgba(248,240,225,0)')
  ctx.fillStyle = r1
  ctx.fillRect(0, 0, size, size)

  // 3) 右下冷色晕（形成冷暖对比）
  const r2 = ctx.createRadialGradient(size * 0.8, size * 0.85, 0, size * 0.8, size * 0.85, size * 0.5)
  r2.addColorStop(0, 'rgba(170,190,220,0.4)')
  r2.addColorStop(0.6, 'rgba(170,190,220,0.1)')
  r2.addColorStop(1, 'rgba(170,190,220,0)')
  ctx.fillStyle = r2
  ctx.fillRect(0, 0, size, size)

  // 4) 粗颗粒噪点（纸感）
  const imgData = ctx.getImageData(0, 0, size, size)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 36
    d[i]! += n; d[i + 1]! += n; d[i + 2]! += n
  }
  ctx.putImageData(imgData, 0, 0)

  // 5) 网格点阵（明显可见）
  ctx.fillStyle = 'rgba(150,145,140,0.12)'
  const step = 20
  for (let gx = 0; gx < size; gx += step) {
    for (let gy = 0; gy < size; gy += step) {
      ctx.beginPath()
      ctx.arc(gx, gy, 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 6) 几条淡对角装饰线
  ctx.strokeStyle = 'rgba(160,155,150,0.08)'
  ctx.lineWidth = 1
  for (let k = 0; k < 8; k++) {
    const offset = (k - 4) * size * 0.15
    ctx.beginPath()
    ctx.moveTo(offset, 0)
    ctx.lineTo(size + offset, size)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

/* ═══ Three.js 场景初始化 ═══ */
function initScene() {
  const container = canvasContainer.value
  if (!container) return
  const w = container.clientWidth || 800
  const h = container.clientHeight || 600

  scene = new THREE.Scene()
  scene.background = createModernBgTexture()

  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200)
  camera.position.copy(DEFAULT_CAMERA_POSITION)
  camera.lookAt(DEFAULT_CAMERA_TARGET)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.7)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
  dirLight.position.set(5, 15, 10)
  scene.add(ambient, dirLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 8
  controls.maxDistance = 50
  controls.maxPolarAngle = Math.PI * 0.48
  controls.target.copy(DEFAULT_CAMERA_TARGET)
  controls.update()

  renderer.domElement.addEventListener('click', handleClick)
  renderer.domElement.addEventListener('mousemove', handleHover)
  renderer.domElement.addEventListener('dblclick', handleDblClick)

  const loop = () => {
    animFrameId = requestAnimationFrame(loop)
    controls?.update()
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
      updateLabels()
    }
  }
  loop()
}

function applyDefaultView() {
  if (!camera || !controls) return
  controls.enabled = true
  camera.position.copy(DEFAULT_CAMERA_POSITION)
  controls.target.copy(DEFAULT_CAMERA_TARGET)
  camera.lookAt(DEFAULT_CAMERA_TARGET)
  controls.update()
}

function resetView(animate = true) {
  if (!camera || !controls) return

  viewResetTimeline?.kill()
  viewResetTimeline = null
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)

  if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyDefaultView()
    return
  }

  controls.enabled = false
  viewResetTimeline = gsap.timeline({
    defaults: { duration: VIEW_RESET_DURATION, ease: 'power2.out' },
    onUpdate: () => {
      controls?.update()
    },
    onComplete: () => {
      if (!camera || !controls) return
      camera.lookAt(controls.target)
      controls.enabled = true
      controls.update()
      viewResetTimeline = null
    },
  })

  viewResetTimeline
    .to(camera.position, {
      x: DEFAULT_CAMERA_POSITION.x,
      y: DEFAULT_CAMERA_POSITION.y,
      z: DEFAULT_CAMERA_POSITION.z,
    }, 0)
    .to(controls.target, {
      x: DEFAULT_CAMERA_TARGET.x,
      y: DEFAULT_CAMERA_TARGET.y,
      z: DEFAULT_CAMERA_TARGET.z,
    }, 0)
}

/* ═══ 构建分层平台 ═══ */
function buildPlatforms() {
  if (!scene) return
  for (const tier of TIER_ORDER) {
    if (tier === 'job') continue
    const scale = TIER_PLATFORM_SCALE[tier]
    const pw = PLATFORM_BASE_W * scale
    const pd = PLATFORM_BASE_D * scale
    const geo = new THREE.PlaneGeometry(pw, pd)
    const color = new THREE.Color(TIER_COLORS[tier])
    const mat = new THREE.MeshStandardMaterial({
      color, transparent: true, opacity: 0.45,
      emissive: color, emissiveIntensity: 0.20,
      roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(0, TIER_Y_3D[tier] - 0.05, 0)
    mesh.receiveShadow = true
    scene.add(mesh)
  }
}

/* ═══ 构建节点 ═══ */
function buildNodes() {
  if (!scene) return
  const posMap = compute3DPositions(nodes.value, graphMode.value)
  const labelContainer = graphContainerEl.value
  for (const n of nodes.value) {
    const pos = posMap.get(n.id)
    if (!pos) continue
    const r = NODE_RADIUS_3D[n.tier]
    const color = new THREE.Color(getNodeColor(n))
    const geo = new THREE.SphereGeometry(r, 16, 12)
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: n.tier === 'job' ? 0.35 : 0.15,
      roughness: 0.45, metalness: 0.08, transparent: true, opacity: 1,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(pos)
    mesh.userData = { node: n }
    scene.add(mesh)
    nodeMeshes.set(n.id, mesh)

    if (labelContainer) {
      const div = document.createElement('div')
      div.className = 'cs-3d-label'
      div.textContent = n.name
      if (n.tier === 'job') div.classList.add('is-job')
      div.style.color = getNodeColor(n)
      if (n.tier !== 'job' && !showLabels.value) div.style.display = 'none'
      labelContainer.appendChild(div)
      labelDivs.set(n.id, div)
    }
  }
  // Store positions for edges
  posMap3D = posMap
}

/* ═══ 构建连线（默认隐藏，统一冰蓝光管） ═══ */
const EDGE_COLOR = 0x38BDF8
const TUBE_RADIUS = 0.025
const TUBE_RADIUS_HL = 0.04
function buildEdges() {
  if (!scene) return
  for (const e of edges.value) {
    const sp = posMap3D.get(e.source)
    const tp = posMap3D.get(e.target)
    if (!sp || !tp) continue
    const mid = new THREE.Vector3(
      (sp.x + tp.x) / 2,
      (sp.y + tp.y) / 2 + Math.abs(tp.y - sp.y) * 0.18,
      (sp.z + tp.z) / 2,
    )
    const curve = new THREE.QuadraticBezierCurve3(sp.clone(), mid, tp.clone())
    const geo = new THREE.TubeGeometry(curve, 12, TUBE_RADIUS, 5, false)
    const mat = new THREE.MeshStandardMaterial({
      color: EDGE_COLOR, emissive: EDGE_COLOR, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.7,
      roughness: 0.3, metalness: 0.15,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.visible = false
    scene.add(mesh)
    edgeMeshes.push({ mesh, edge: e })
  }
}

/* ═══ 高亮更新 ═══ */
function updateHighlight() {
  const nodeMap = new Map(nodes.value.map(n => [n.id, n]))
  const selCareer = selectedCareerId.value
  const selSkill = selectedSkillId.value
  const ht = highlightTier.value
  const pathIds = new Set(growthPath.value.map(n => n.id))

  // Update node opacity
  for (const [id, mesh] of nodeMeshes) {
    const n = nodeMap.get(id)
    if (!n) continue
    const mat = mesh.material as THREE.MeshStandardMaterial
    const op = getNodeOpacity(n)
    gsap.to(mat, { opacity: op, duration: 0.3 })
    const isSelected = id === selCareer || id === selSkill
    mesh.scale.setScalar(isSelected ? 1.4 : 1)
  }

  // Update edge visibility & glow — only on node selection, not on tier highlight
  const hasNodeSel = !!(selCareer || selSkill)
  for (const { mesh: eMesh, edge: e } of edgeMeshes) {
    if (!hasNodeSel) {
      eMesh.visible = false
      continue
    }
    const mat = eMesh.material as THREE.MeshStandardMaterial
    let show = false
    let intense = false

    if (selCareer) {
      const relatedIds = new Set(nodes.value.filter(n => n.relatedCareers?.includes(selCareer)).map(n => n.id))
      relatedIds.add(selCareer)
      if (relatedIds.has(e.source) && relatedIds.has(e.target)) {
        show = true; intense = true
      }
    } else if (selSkill) {
      const onPath = pathIds.has(e.source) && pathIds.has(e.target)
      const isNeighbor = e.source === selSkill || e.target === selSkill
      if (onPath) { show = true; intense = true }
      else if (isNeighbor) { show = true }
    }

    eMesh.visible = show
    if (show) {
      mat.opacity = intense ? 0.9 : 0.5
      mat.emissiveIntensity = intense ? 0.6 : 0.25
    }
  }

  updateLabels()
}

/* ═══ 标签更新 ═══ */
function updateLabels() {
  if (!camera || !renderer) return
  const w2 = renderer.domElement.clientWidth / 2
  const h2 = renderer.domElement.clientHeight / 2
  for (const [id, div] of labelDivs) {
    const mesh = nodeMeshes.get(id)
    if (!mesh) { div.style.display = 'none'; continue }
    const n = mesh.userData.node as CourseNode
    const show = n.tier === 'job' || showLabels.value
    div.style.display = show ? '' : 'none'
    if (!show) continue
    const v = mesh.position.clone().project(camera)
    const x = v.x * w2 + w2
    const y = -(v.y * h2) + h2
    const r3d = NODE_RADIUS_3D[n.tier] ?? 0.2
    div.style.transform = `translate(${x + r3d * 30}px, ${y - 6}px)`
    const op = (mesh.material as THREE.MeshStandardMaterial).opacity
    div.style.opacity = String(Math.max(op, 0.1))
  }
}

/* ═══ 交互：Raycaster ═══ */
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let hoveredMesh: THREE.Mesh | null = null

function handleClick(event: MouseEvent) {
  if (!camera || !scene) return
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const meshes = Array.from(nodeMeshes.values())
  const hits = raycaster.intersectObjects(meshes, false)
  if (hits.length > 0) {
    const n = hits[0]!.object.userData.node as CourseNode
    if (n.tier === 'job') {
      if (selectedCareerId.value === n.id) {
        selectedCareerId.value = null
        selectedSkillId.value = null
      } else {
        selectedCareerId.value = n.id
        selectedSkillId.value = n.id
      }
    } else {
      selectedCareerId.value = null
      selectedSkillId.value = selectedSkillId.value === n.id ? null : n.id
    }
    updateHighlight()
  }
}

function handleHover(event: MouseEvent) {
  if (!camera || !scene || !renderer) return
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const meshes = Array.from(nodeMeshes.values())
  const hits = raycaster.intersectObjects(meshes, false)
  const newHover = hits.length > 0 ? (hits[0]!.object as THREE.Mesh) : null

  if (hoveredMesh && hoveredMesh !== newHover) {
    gsap.to(hoveredMesh.scale, { x: 1, y: 1, z: 1, duration: 0.15 })
  }
  if (newHover && newHover !== hoveredMesh) {
    gsap.to(newHover.scale, { x: 1.35, y: 1.35, z: 1.35, duration: 0.15 })
  }

  // Tooltip
  if (newHover) {
    const n = newHover.userData.node as CourseNode
    const pos = newHover.position.clone().project(camera)
    const w2 = renderer.domElement.clientWidth / 2
    const h2 = renderer.domElement.clientHeight / 2
    hoverTooltip.value = {
      name: n.name,
      tier: TIER_LABELS[n.tier],
      x: pos.x * w2 + w2,
      y: -(pos.y * h2) + h2,
    }
  } else {
    hoverTooltip.value = null
  }

  hoveredMesh = newHover
  renderer.domElement.style.cursor = newHover ? 'pointer' : ''
}

function handleDblClick(event: MouseEvent) {
  event.preventDefault()
  selectedSkillId.value = null
  selectedCareerId.value = null
  highlightTier.value = null
  updateHighlight()
  resetView()
}

function closePanel() {
  selectedSkillId.value = null
  selectedCareerId.value = null
  updateHighlight()
}

/* ═══ resize ═══ */
useResizeObserver(graphContainerEl, () => {
  requestAnimationFrame(() => {
    const container = canvasContainer.value
    if (!container || !renderer || !camera) return
    const w = container.clientWidth
    const h = container.clientHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  })
}, { debounceMs: 150 })

/* ═══ GSAP 入场 ═══ */
const shellRef = ref<HTMLElement>()
let gsapCtx: ReturnType<typeof gsap.context> | null = null

function playEntrance() {
  if (!shellRef.value || !camera) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cam = camera
  const startPos = {
    x: DEFAULT_CAMERA_POSITION.x,
    y: DEFAULT_CAMERA_POSITION.y + 8,
    z: DEFAULT_CAMERA_POSITION.z + 12,
  }
  cam.position.set(startPos.x, startPos.y, startPos.z)
  return gsap.context(() => {
    gsap.to(cam.position, {
      x: DEFAULT_CAMERA_POSITION.x,
      y: DEFAULT_CAMERA_POSITION.y,
      z: DEFAULT_CAMERA_POSITION.z,
      duration: 1.4,
      ease: 'power3.out',
    })
    gsap.from('.cs-header', { y: -28, opacity: 0, duration: 0.5, ease: 'power3.out' })
    gsap.from('.cs-legend', { y: 16, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.55 })
  }, shellRef.value)
}

/* ═══ 清理 ═══ */
function disposeScene() {
  cancelAnimationFrame(animFrameId)
  renderer?.domElement.removeEventListener('click', handleClick)
  renderer?.domElement.removeEventListener('mousemove', handleHover)
  renderer?.domElement.removeEventListener('dblclick', handleDblClick)
  viewResetTimeline?.kill()
  viewResetTimeline = null
  controls?.dispose()
  for (const [, mesh] of nodeMeshes) {
    (mesh.material as THREE.Material).dispose()
    mesh.geometry.dispose()
  }
  nodeMeshes.clear()
  for (const { mesh } of edgeMeshes) {
    (mesh.material as THREE.Material).dispose()
    mesh.geometry.dispose()
  }
  edgeMeshes.length = 0
  for (const [, div] of labelDivs) div.remove()
  labelDivs.clear()
  renderer?.dispose()
  renderer?.domElement.remove()
  renderer = null; scene = null; camera = null; controls = null
}

/* ═══ 数据加载 ═══ */
async function loadData() {
  disposeScene()
  const data = await getCourseSystemData(roleName.value)
  graphData.value = data

  const resolved = resolveJobNode(roleName.value)
  const matchedJobId = resolved ? `job-${resolved.domainId}-${resolved.jobIndex}` : null

  selectedSkillId.value = null
  selectedCareerId.value = null
  highlightTier.value = null

  const filteredNodes = data.nodes.filter(n => {
    if (n.tier !== 'job') return true
    if (isOverviewMode.value) return true
    return n.id === matchedJobId
  })
  const nodeIdSet = new Set(filteredNodes.map(n => n.id))
  const filteredEdges = data.edges.filter(e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))

  nodes.value = filteredNodes
  edges.value = filteredEdges
  courseNodes.value = data.courseNodes
  await nextTick()
  initScene()
  buildPlatforms()
  buildNodes()
  buildEdges()
  updateHighlight()
  gsapCtx = playEntrance() ?? null
}

onMounted(() => loadData())
onBeforeUnmount(() => {
  gsapCtx?.revert()
  disposeScene()
})
watch([roleName, graphMode], () => loadData())

const legendTiers = TIER_ORDER.slice().reverse() as SkillTier[]

/* ═══ 标签映射 ═══ */
const difficultyLabels: Record<string, string> = {
  beginner: '入门', intermediate: '进阶', advanced: '高阶',
}
const importanceLabels: Record<string, string> = {
  core: '核心', recommended: '推荐', optional: '选修',
}
</script>

<template>
  <div ref="shellRef" class="cs-page">
    <!-- ═══ 顶栏 ═══ -->
    <header class="cs-header">
      <div class="cs-header__left">
        <button class="cs-back" @click="goBack" title="返回">
          <Icon icon="lucide:arrow-left" :width="16" />
          <span>返回</span>
        </button>
        <div class="cs-brand">
          <span class="cs-brand__title">{{ pageTitle }}</span>
        </div>
      </div>
      <div v-if="!isOverviewMode" class="cs-header__right">
        <UserInfoBar />
      </div>
    </header>

    <!-- ═══ 主体 ═══ -->
    <div class="cs-body">
      <div ref="graphContainerEl" class="cs-graph">
        <div ref="canvasContainer" class="cs-canvas-wrap"></div>

        <!-- hover 浮窗 -->
        <div
          v-if="hoverTooltip"
          class="cs-tooltip"
          :style="{ transform: `translate(${hoverTooltip.x + 14}px, ${hoverTooltip.y - 18}px)` }"
        >
          <span class="cs-tooltip__name">{{ hoverTooltip.name }}</span>
          <span class="cs-tooltip__tier">{{ hoverTooltip.tier }}</span>
        </div>

        <div class="cs-primary-action">
          <button class="cs-tools__btn cs-tools__btn--learning" :disabled="!canGoToLearningCenter" @click="goToLearningCenter">
            <Icon icon="lucide:book-open" :width="14" />
            <span>{{ learningButtonLabel }}</span>
          </button>
        </div>

        <div class="cs-tools">
          <button class="cs-tools__btn" :class="{ 'is-active': showLabels }" @click="toggleLabels">
            <Icon :icon="showLabels ? 'lucide:tag' : 'lucide:tag-off'" :width="14" />
            <span>{{ showLabels ? '隐藏节点名称' : '显示节点名称' }}</span>
          </button>
        </div>

        <!-- 左侧书签式分层控件 -->
        <div class="cs-bookmarks">
          <button
            v-for="tier in legendTiers"
            :key="tier"
            class="cs-bookmark"
            :class="{ 'is-active': highlightTier === tier }"
            :style="{
              '--bm-color': TIER_COLORS[tier],
              '--bm-bg': highlightTier === tier ? TIER_COLORS[tier] : 'transparent',
            }"
            @click="toggleTierHighlight(tier)"
          >
            <span class="cs-bookmark__dot" :style="{ background: TIER_COLORS[tier] }"></span>
            <span class="cs-bookmark__label">{{ TIER_LABELS[tier] }}</span>
          </button>
        </div>

        <!-- 左下角领域图例 -->
        <div class="cs-legend">
          <div class="cs-legend__title">领域配色</div>
          <div class="cs-legend__lines">
            <div v-for="dom in CAREER_DOMAINS" :key="dom.id" class="cs-legend__line-item">
              <span class="cs-legend__dot" :style="{ background: DOMAIN_COLORS[dom.id] }"></span>
              <span>{{ dom.name }}</span>
            </div>
            <div class="cs-legend__tip">{{ legendTip }}</div>
          </div>
        </div>

        <!-- 选中技能 — 右侧详情面板 -->
        <Transition name="panel-slide">
          <div v-if="selectedSkillId && selectedNode" class="cs-panel">
            <div class="cs-panel__header">
              <span class="cs-panel__title">{{ selectedNode.name }}</span>
              <button class="cs-panel__close" @click="closePanel">
                <Icon icon="lucide:x" :width="14" />
              </button>
            </div>
            <div class="cs-panel__meta">
              <span
                class="cs-panel__tier-badge"
                :style="{ borderColor: TIER_COLORS[selectedNode.tier], color: TIER_COLORS[selectedNode.tier] }"
              >{{ TIER_LABELS[selectedNode.tier] }}</span>
              <span class="cs-panel__heat">热度 {{ selectedNode.heat }}</span>
            </div>

            <div class="cs-panel__scroll">
              <!-- 关联职业 -->
              <div v-if="relatedCareers.length > 0 && selectedNode?.tier !== 'job'" class="cs-panel__section">
                <div class="cs-panel__section-title">
                  <Icon icon="lucide:briefcase" :width="13" />
                  <span>关联职业</span>
                </div>
                <div class="cs-panel__careers">
                  <span
                    v-for="c in relatedCareers"
                    :key="c.id"
                    class="cs-panel__career-badge"
                    :style="{ borderColor: c.color, color: c.color }"
                    @click="selectedCareerId = c.id; updateHighlight()"
                  >{{ c.name }}</span>
                </div>
              </div>

              <!-- 成长路径 -->
              <div v-if="growthPath.length > 1" class="cs-panel__section">
                <div class="cs-panel__section-title">
                  <Icon icon="lucide:git-branch" :width="13" />
                  <span>成长路径</span>
                </div>
                <div class="cs-panel__path">
                  <div
                    v-for="(pn, idx) in growthPath"
                    :key="pn.id"
                    class="cs-panel__path-step"
                    :class="{ 'is-current': pn.id === selectedSkillId }"
                    @click="selectPathNode(pn.id)"
                  >
                    <span class="cs-panel__path-dot" :style="{ background: TIER_COLORS[pn.tier] }"></span>
                    <span class="cs-panel__path-name">{{ pn.name }}</span>
                    <span class="cs-panel__path-tier">{{ TIER_LABELS[pn.tier] }}</span>
                    <div v-if="idx < growthPath.length - 1" class="cs-panel__path-line"></div>
                  </div>
                </div>
              </div>

              <!-- 关联课程 -->
              <div v-if="relatedCourses.length > 0" class="cs-panel__section">
                <div class="cs-panel__section-title">
                  <Icon icon="lucide:book-open" :width="13" />
                  <span>推荐课程</span>
                </div>
                <template v-for="[group, courses] in groupedCourses" :key="group">
                  <div class="cs-panel__course-group">
                    <span class="cs-panel__course-group-dot" :style="{ background: COURSE_GROUP_COLORS[group] }"></span>
                    <span>{{ COURSE_GROUP_LABELS[group] }}</span>
                  </div>
                  <div
                    v-for="cn in courses"
                    :key="cn.id"
                    class="cs-panel__course-card"
                  >
                    <div class="cs-panel__course-name">{{ cn.title }}</div>
                    <div class="cs-panel__course-tags">
                      <span class="cs-panel__tag cs-panel__tag--diff">{{ difficultyLabels[cn.difficulty] || cn.difficulty }}</span>
                      <span class="cs-panel__tag" :class="`cs-panel__tag--${cn.importance}`">{{ importanceLabels[cn.importance] || cn.importance }}</span>
                    </div>
                  </div>
                </template>
              </div>

              <div v-if="relatedCourses.length === 0" class="cs-panel__empty">
                <Icon icon="lucide:book-x" :width="16" />
                <span>暂无关联课程</span>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 操作提示 -->
        <div class="cs-hint">
          <Icon icon="lucide:mouse-pointer-2" :width="12" />
          <span>{{ hintText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ 根 ═══ */
.cs-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #FAFAF8;
  color: #222;
  overflow: hidden;
}

/* ═══ 顶栏 ═══ */
.cs-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 22px;
  background: #fff;
  border-bottom: 1px solid #e8e6e2;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.cs-header__left { display: flex; align-items: flex-start; gap: 14px; }
.cs-header__right { display: flex; align-items: center; gap: 16px; }

.cs-back {
  display: inline-flex; align-items: center; gap: 5px;
  background: transparent;
  border: 1px solid #ddd;
  color: #555; padding: 5px 12px;
  font-family: inherit; font-size: 13px;
  cursor: pointer; transition: all 0.15s;
  border-radius: 6px;
}
.cs-back:hover { border-color: #aaa; color: #222; }

.cs-brand {
  display: flex;
  align-items: center;
  min-width: 0;
}
.cs-brand__title {
  font-size: 15px; font-weight: 600; letter-spacing: 0.02em;
  color: #222; white-space: nowrap;
}


/* ═══ 图谱主区 ═══ */
.cs-body {
  flex: 1;
  min-height: 0;
  background: #FAFAF8;
}
.cs-graph {
  width: 100%; height: 100%;
  position: relative;
  background: #FAFAF8;
}
.cs-canvas-wrap {
  width: 100%; height: 100%;
  position: relative;
  overflow: hidden;
}
.cs-canvas-wrap canvas {
  display: block;
  position: relative;
  z-index: 1;
  width: 100% !important;
  height: 100% !important;
}
:global(.cs-3d-label) {
  position: absolute;
  top: 0; left: 0;
  z-index: 2;
  pointer-events: none;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.5);
  transition: opacity 0.2s;
}
:global(.cs-3d-label.is-job) {
  font-size: 13px;
  font-weight: 700;
}

/* ═══ hover 浮窗 ═══ */
.cs-tooltip {
  position: absolute;
  top: 0; left: 0;
  z-index: 20;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: rgba(15, 23, 42, 0.88);
  color: #fff;
  border-radius: 6px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.18);
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.4;
}
.cs-tooltip__name {
  font-weight: 600;
}
.cs-tooltip__tier {
  font-size: 10px;
  color: rgba(255,255,255,0.6);
  padding-left: 4px;
  border-left: 1px solid rgba(255,255,255,0.2);
}

/* ═══ 顶部工具栏 ═══ */
.cs-primary-action {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 7;
  display: flex;
  gap: 6px;
  pointer-events: auto;
}
.cs-tools {
  position: absolute;
  top: 16px; right: 16px; z-index: 5;
  display: flex;
  gap: 6px;
  pointer-events: auto;
}
.cs-tools__btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: rgba(255,255,255,0.92);
  color: #555;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  transition: all 0.15s ease;
  backdrop-filter: blur(8px);
}
.cs-tools__btn:hover {
  color: #222;
  border-color: #bbb;
  background: #fff;
}
.cs-tools__btn:disabled {
  cursor: not-allowed;
  color: #A8A29E;
  border-color: #E7E5E4;
  background: rgba(255,255,255,0.8);
  box-shadow: none;
}
.cs-tools__btn.is-active {
  color: #C04A2B;
  background: rgba(192,74,43,0.06);
  border-color: rgba(192,74,43,0.3);
}
.cs-tools__btn--learning {
  background: rgba(192,74,43,0.08);
  border-color: rgba(192,74,43,0.25);
  color: #C04A2B;
  font-weight: 600;
}
.cs-tools__btn--learning:hover {
  background: rgba(192,74,43,0.14);
  border-color: rgba(192,74,43,0.4);
}

/* ═══ 左侧书签式分层控件 ═══ */
.cs-bookmarks {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  max-height: 50%;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 2px;
  pointer-events: auto;
  overflow-y: auto;
  scrollbar-width: none;
}
.cs-bookmarks::-webkit-scrollbar { display: none; }
.cs-bookmark {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px 8px 12px;
  border: none;
  border-left: 3px solid var(--bm-color, #C04A2B);
  background: rgba(255,255,255,0.88);
  color: #666;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  border-radius: 0 6px 6px 0;
  backdrop-filter: blur(8px);
  box-shadow: 1px 1px 6px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
  white-space: nowrap;
}
.cs-bookmark:hover {
  background: rgba(255,255,255,0.96);
  color: #333;
  padding-right: 18px;
  box-shadow: 2px 1px 10px rgba(0,0,0,0.06);
}
.cs-bookmark.is-active {
  background: var(--bm-bg, #C04A2B);
  color: #fff;
  font-weight: 600;
  padding-right: 20px;
  box-shadow: 2px 2px 12px rgba(0,0,0,0.08);
}
.cs-bookmark.is-active .cs-bookmark__dot {
  background: #fff !important;
  box-shadow: 0 0 4px rgba(255,255,255,0.5);
}
.cs-bookmark__dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.2s;
}
.cs-bookmark__label {
  line-height: 1;
}

/* ═══ 左下角领域图例 ═══ */
.cs-legend {
  position: absolute;
  bottom: 20px; left: 20px; z-index: 5;
  background: rgba(255,255,255,0.92);
  border: 1px solid #e0ddd8;
  border-radius: 8px;
  padding: 10px 14px;
  pointer-events: auto;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}
.cs-legend__title {
  font-size: 10px; font-weight: 600;
  color: #888; letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}
.cs-legend__lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.cs-legend__line-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #555;
  line-height: 1.4;
}
.cs-legend__dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cs-legend__tip {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed #ddd;
  font-size: 10px;
  line-height: 1.5;
  color: #999;
}

/* ═══ 右侧详情面板 ═══ */
.cs-panel {
  position: absolute;
  top: 16px; right: 16px; bottom: 16px; z-index: 6;
  width: 280px;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.96);
  border: 1px solid #e0ddd8;
  border-radius: 10px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  overflow: hidden;
}
.cs-panel__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.cs-panel__title {
  font-size: 15px; font-weight: 600; color: #222;
  line-height: 1.3;
}
.cs-panel__close {
  display: grid; place-items: center;
  width: 24px; height: 24px;
  border: none; background: transparent;
  color: #999; cursor: pointer;
  border-radius: 4px; transition: all 0.15s;
  flex-shrink: 0;
}
.cs-panel__close:hover {
  background: #f0f0f0;
  color: #333;
}
.cs-panel__meta {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px 10px;
  flex-shrink: 0;
}
.cs-panel__tier-badge {
  font-size: 11px; font-weight: 600;
  padding: 2px 8px;
  border: 1.5px solid;
  border-radius: 4px;
  background: rgba(0,0,0,0.02);
}
.cs-panel__heat {
  font-size: 11px; color: #999;
}
.cs-panel__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 16px;
}

/* ── 面板分区 ── */
.cs-panel__section {
  margin-bottom: 16px;
}
.cs-panel__section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600;
  color: #888;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

/* ── 关联职业 ── */
.cs-panel__careers {
  display: flex; flex-wrap: wrap; gap: 5px;
}
.cs-panel__career-badge {
  font-size: 11px; font-weight: 500;
  padding: 2px 8px;
  border: 1.5px solid;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  background: rgba(0,0,0,0.01);
}
.cs-panel__career-badge:hover {
  background: rgba(0,0,0,0.04);
}

/* ── 成长路径 ── */
.cs-panel__path {
  padding-left: 4px;
}
.cs-panel__path-step {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  padding: 5px 4px 5px 16px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.cs-panel__path-step:hover {
  background: rgba(0,0,0,0.03);
}
.cs-panel__path-step.is-current {
  font-weight: 600;
}
.cs-panel__path-step.is-current .cs-panel__path-name {
  color: #222;
}
.cs-panel__path-dot {
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  z-index: 1;
}
.cs-panel__path-name {
  color: #555;
  flex: 1;
  min-width: 0;
}
.cs-panel__path-tier {
  font-size: 10px;
  color: #999;
  flex-shrink: 0;
}
.cs-panel__path-line {
  position: absolute;
  left: 3.5px;
  top: calc(50% + 4px);
  width: 1px;
  height: calc(100% - 4px);
  background: #ddd;
}

/* ── 课程 ── */
.cs-panel__course-group {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 600;
  color: #888;
  letter-spacing: 0.04em;
  margin: 10px 0 4px;
}
.cs-panel__course-group:first-child {
  margin-top: 0;
}
.cs-panel__course-group-dot {
  width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0;
}
.cs-panel__course-card {
  padding: 6px 8px;
  margin-bottom: 4px;
  background: rgba(0,0,0,0.015);
  border: 1px solid #eee;
  border-radius: 4px;
  transition: border-color 0.15s;
}
.cs-panel__course-card:hover {
  border-color: #ccc;
}
.cs-panel__course-name {
  font-size: 12px; font-weight: 600; color: #222;
  margin-bottom: 3px;
}
.cs-panel__course-tags {
  display: flex; gap: 4px;
}
.cs-panel__tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid #ddd;
  color: #888;
  background: #f9f9f7;
}
.cs-panel__tag--core {
  border-color: rgba(192,74,43,0.3);
  color: #C04A2B;
  background: rgba(192,74,43,0.05);
}
.cs-panel__tag--recommended {
  border-color: rgba(184,134,11,0.25);
  color: #8B6914;
}
.cs-panel__tag--optional {
  border-color: rgba(107,142,107,0.25);
  color: #5B7744;
}
.cs-panel__empty {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #bbb;
  font-style: italic;
  padding: 8px 0;
}

/* ═══ 面板过渡动画 ═══ */
.panel-slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.panel-slide-leave-active {
  transition: transform 0.2s ease-in, opacity 0.2s ease;
}
.panel-slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.panel-slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* ═══ 操作提示 ═══ */
.cs-hint {
  position: absolute;
  bottom: 20px; right: 20px; z-index: 5;
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #999;
  pointer-events: none;
  background: rgba(255,255,255,0.72);
  border: 1px solid #e8e6e2;
  padding: 6px 10px;
  border-radius: 6px;
}

/* ═══ 响应式 ═══ */
@media (max-width: 1024px) {
  .cs-panel { width: 250px; }
}
@media (max-width: 768px) {
  .cs-legend { bottom: 10px; left: 10px; padding: 8px 12px; }
  .cs-bookmarks { top: 6%; max-height: 52%; gap: 1px; }
  .cs-bookmark { font-size: 10px; padding: 6px 10px 6px 8px; }
  .cs-bookmark__label { display: none; }
  .cs-primary-action { top: 10px; left: 10px; }
  .cs-tools { top: 10px; right: 10px; }
  .cs-tools__btn span,
  .cs-primary-action .cs-tools__btn span { display: none; }
  .cs-hint { display: none; }
  .cs-brand__title { font-size: 13px; }
  .cs-panel { width: 220px; top: 10px; right: 10px; bottom: 10px; }
}
@media (max-width: 640px) {
  .cs-header { padding: 8px 12px; }
  .cs-back span { display: none; }
  .cs-brand__title { font-size: 12px; }
  .uib__text { display: none; }
  .cs-legend { display: none; }
  .cs-panel {
    top: auto; bottom: 0; left: 0; right: 0;
    width: 100%; height: 50%;
    border-radius: 10px 10px 0 0;
  }
  .panel-slide-enter-from { transform: translateY(100%); }
  .panel-slide-leave-to { transform: translateY(100%); }
}
</style>
