<!-- 页面：课程体系分层图谱；路由：student/course-system；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores'
import * as echarts from 'echarts'
import 'echarts-gl'
import { gsap } from '@/plugins/gsap'
import { useResizeObserver } from '@/composables/useResizeObserver'
import {
  getCourseSystemData, compute3DLayouts, computeNode3DPositions,
  TIER_ORDER, TIER_LABELS, TIER_COLORS, TIER_GLOW,
  COURSE_GROUP_LABELS, COURSE_GROUP_COLORS,
  type CourseNode, type CourseEdge, type SkillTier,
  type CourseSystemData, type GraphCourseNode, type CourseGroup,
} from '@/composables/useCourseSystem'

defineOptions({ name: 'CourseSystemGraph' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const roleName = computed(() => (route.query.role as string) || '前端开发工程师')
function goBack() { router.back() }

/* ═══ 状态 ═══ */
const highlightTier = ref<SkillTier | null>(null)
const selectedSkillId = ref<string | null>(null)
const showLabels = ref(false)

/* ═══ 数据 ═══ */
const graphData = ref<CourseSystemData | null>(null)
const nodes = ref<CourseNode[]>([])
const edges = ref<CourseEdge[]>([])
const courseNodes = ref<GraphCourseNode[]>([])

/* ═══ 层级高亮切换 ═══ */
function toggleTierHighlight(tier: SkillTier) {
  highlightTier.value = highlightTier.value === tier ? null : tier
  selectedSkillId.value = null
  rebuildChart()
}
function rebuildChart() {
  if (!chart) return
  chart.setOption(buildOption() as any, { replaceMerge: ['series'], lazyUpdate: true })
}

function selectPathNode(nodeId: string) {
  if (selectedSkillId.value === nodeId) return
  selectedSkillId.value = nodeId
  rebuildChart()
}

function toggleLabels() {
  showLabels.value = !showLabels.value
  rebuildChart()
}

/* ═══ ECharts ═══ */
const chartEl = ref<HTMLElement>()
const graphContainerEl = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let _blankClickTimer: ReturnType<typeof setTimeout> | null = null

/* ═══ 古籍配色常量 ═══ */
const PARCHMENT_BG = '#f8f4ec'
const PLATFORM_FILL: Record<SkillTier, string> = {
  foundation: 'rgba(205,178,144,0.60)',
  junior:     'rgba(186,150,114,0.58)',
  mid:        'rgba(164,122,84,0.54)',
  senior:     'rgba(130,90,58,0.48)',
  job:        'rgba(139,37,0,0.10)',
}
const PLATFORM_STROKE: Record<SkillTier, string> = {
  foundation: 'rgba(135,98,58,0.42)',
  junior:     'rgba(130,86,48,0.46)',
  mid:        'rgba(120,72,38,0.50)',
  senior:     'rgba(102,54,26,0.56)',
  job:        'rgba(155,56,40,0.22)',
}
const NODE_SIZE = 10

/* ═══ 成长路径追溯 ═══ */
function computeGrowthPath(nodeId: string): CourseNode[] {
  const nodeMap = new Map(nodes.value.map(n => [n.id, n]))
  const pathIds = new Set<string>()
  const path: CourseNode[] = []

  // 向上追溯（source → target 表示 source 支撑 target）
  let upQueue = [nodeId]
  while (upQueue.length > 0) {
    const next: string[] = []
    for (const id of upQueue) {
      if (pathIds.has(id)) continue
      pathIds.add(id)
      const node = nodeMap.get(id)
      if (node) path.push(node)
      edges.value
        .filter(e => e.source === id && e.isCareerPath)
        .forEach(e => { if (!pathIds.has(e.target)) next.push(e.target) })
    }
    upQueue = next
  }

  // 向下追溯（找前置基础）
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
      const node = nodeMap.get(id)
      if (node) downPath.push(node)
      edges.value
        .filter(e => e.target === id && e.isCareerPath)
        .forEach(e => { if (!pathIds.has(e.source)) next.push(e.source) })
    }
    downQueue = next
  }

  const tierIdx = (t: SkillTier) => TIER_ORDER.indexOf(t)
  const allPath = [...downPath, ...path]
  allPath.sort((a, b) => tierIdx(a.tier) - tierIdx(b.tier))
  return allPath
}

/* ═══ 选中节点的计算属性 ═══ */
const selectedNode = computed(() => {
  if (!selectedSkillId.value) return null
  return nodes.value.find(n => n.id === selectedSkillId.value) ?? null
})

const growthPath = computed(() => {
  if (!selectedSkillId.value) return []
  return computeGrowthPath(selectedSkillId.value)
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

/* ═══ 节点透明度 ═══ */
function getNodeOpacity(tier: SkillTier, nodeId: string): number {
  const ht = highlightTier.value
  const sel = selectedSkillId.value

  if (sel) {
    const pathIds = new Set(growthPath.value.map(n => n.id))
    if (nodeId === sel) return 1
    if (pathIds.has(nodeId)) return 0.9
    const isNeighbor = edges.value.some(e =>
      (e.source === sel && e.target === nodeId) || (e.target === sel && e.source === nodeId)
    )
    if (isNeighbor) return 0.7
    return 0.15
  }
  if (ht) return ht === tier ? 1 : 0.88
  return tier === 'job' ? 1 : 0.88
}

/* ═══ 布局与位置缓存 ═══ */
let _layouts: ReturnType<typeof compute3DLayouts> | null = null
let _posMap: Map<string, { x: number; y: number; z: number }> | null = null
function invalidateLayoutCache() { _layouts = null; _posMap = null }
function getLayouts() {
  if (!_layouts) _layouts = compute3DLayouts()
  return _layouts
}
function getPosMap() {
  const l = getLayouts()
  if (!_posMap) _posMap = computeNode3DPositions(nodes.value, l)
  return _posMap
}

/* ── 3D 贝塞尔曲线 ── */
function makeCurve3D(
  sp: { x: number; y: number; z: number },
  tp: { x: number; y: number; z: number },
  arcBoost = 1,
  segments = 16,
): number[][] {
  const mx = (sp.x + tp.x) / 2, my = (sp.y + tp.y) / 2, mz = (sp.z + tp.z) / 2
  const dy = Math.abs(tp.y - sp.y), dx = Math.abs(tp.x - sp.x), dz = Math.abs(tp.z - sp.z)
  const arcH = Math.max(dy * 0.18, dx * 0.06, dz * 0.08, 5) * arcBoost
  const cx = mx + (tp.z - sp.z) * 0.08
  const cy = my + arcH
  const cz = mz - (tp.x - sp.x) * 0.06
  const pts: number[][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, it = 1 - t
    pts.push([
      it * it * sp.x + 2 * it * t * cx + t * t * tp.x,
      it * it * sp.y + 2 * it * t * cy + t * t * tp.y,
      it * it * sp.z + 2 * it * t * cz + t * t * tp.z,
    ])
  }
  return pts
}

/* ── 合并多条曲线为单 series（NaN 分隔） ── */
function joinCurves(curves: number[][][]): number[][] {
  const out: number[][] = []
  curves.forEach((c, i) => { if (i > 0) out.push([NaN, NaN, NaN]); out.push(...c) })
  return out
}
function mkLine3D(data: number[][], style: Record<string, unknown>, zlevel: number) {
  return { type: 'line3D', coordinateSystem: 'cartesian3D', data, lineStyle: style,
    symbol: 'none', label: { show: false }, zlevel, silent: true, animation: false }
}

/* ═══ 构建 ECharts GL option ═══ */
function buildOption() {
  const layouts = getLayouts()
  const posMap = getPosMap()
  const layoutMap = new Map(layouts.map(l => [l.tier, l]))
  const ht = highlightTier.value
  const sel = selectedSkillId.value
  const labels = showLabels.value
  const pathNodeIds = sel ? new Set(growthPath.value.map(n => n.id)) : new Set<string>()

  /* ── 平台面（跳过 job 层，岗位节点独立悬浮） ── */
  const surfaceSeries = layouts
    .filter(lay => lay.tier !== 'job')
    .map(lay => ({
      type: 'surface',
      coordinateSystem: 'cartesian3D',
      parametric: true,
      wireframe: ht === lay.tier
        ? { show: true, lineStyle: { color: PLATFORM_STROKE[lay.tier], width: 1.5, opacity: 0.85 } }
        : { show: false },
      shading: 'lambert',
      parametricEquation: {
        u: { min: -lay.xHalf, max: lay.xHalf, step: lay.xHalf },
        v: { min: -lay.zHalf, max: lay.zHalf, step: lay.zHalf },
        x: (u: number) => u,
        y: () => lay.yLevel,
        z: (_u: number, v: number) => v,
      },
      itemStyle: {
        color: ht === lay.tier
          ? PLATFORM_FILL[lay.tier].replace(/([\.\d]+)\)$/, (_: string, v: string) => `${Math.min(parseFloat(v) + 0.30, 0.94)}`+ ')')
          : PLATFORM_FILL[lay.tier],
        opacity: 0.96,
      },
      zlevel: 1,
      silent: true,
    }))

  /* ── 层级标签 ── */
  const labelSeries = {
    type: 'scatter3D',
    coordinateSystem: 'cartesian3D',
    symbolSize: 0,
    data: layouts.filter(l => l.tier !== 'job').map(lay => ({
      value: [-(lay.xHalf + 8), lay.yLevel, 0],
      name: TIER_LABELS[lay.tier],
      tier: lay.tier,
    })),
    label: {
      show: true,
      formatter: (p: any) => `{tierTag|${p.data.name as string}}`,
      position: 'left',
      rich: {
        tierTag: {
          fontSize: 12, fontWeight: 700,
          color: '#5c1a00',
          backgroundColor: 'rgba(247,242,232,0.96)',
          borderColor: 'rgba(139,37,0,0.22)',
          borderWidth: 1,
          padding: [5, 10, 5, 10],
          borderRadius: 2,
          shadowBlur: 6,
          shadowColor: 'rgba(26,20,16,0.04)',
        },
      },
    },
    emphasis: { scale: false },
    zlevel: 4,
    silent: true,
  }

  /* ── 技能节点（扁平色块 + 始终显示标签） ── */
  const scatterSeries = TIER_ORDER.map(tier => {
    const tierNodes = nodes.value.filter(n => n.tier === tier)
    const lay = layoutMap.get(tier)
    return {
      type: 'scatter3D',
      name: `skill-${tier}`,
      coordinateSystem: 'cartesian3D',
      data: tierNodes.map(n => {
        const pos = posMap.get(n.id) ?? { x: 0, y: lay?.yLevel ?? 0, z: 0 }
        const op = getNodeOpacity(tier, n.id)
        const isSelected = sel === n.id
        const isOnPath = pathNodeIds.has(n.id)
        return {
          value: [pos.x, pos.y, pos.z],
          name: n.name,
          tier,
          nodeId: n.id,
          itemStyle: {
            opacity: op,
            borderWidth: isSelected ? 2.5 : isOnPath ? 1.5 : 0,
            borderColor: isSelected ? '#8B2500' : isOnPath ? '#B8860B' : 'transparent',
          },
        }
      }),
      symbolSize: tier === 'job' ? NODE_SIZE * 1.8 : (ht && ht === tier) ? NODE_SIZE * 1.5 : NODE_SIZE,
      symbol: 'circle',
      itemStyle: {
        color: TIER_COLORS[tier],
        shadowBlur: tier === 'job' ? 20 : 8,
        shadowColor: TIER_GLOW[tier],
        borderWidth: tier === 'job' ? 2 : 0,
        borderColor: tier === 'job' ? 'rgba(255,210,140,0.85)' : 'transparent',
      },
      label: {
        show: labels || tier === 'job',
        formatter: (p: any) => tier === 'job' ? `目标职业｜${p.data.name as string}` : (p.data.name as string),
        position: 'right',
        distance: tier === 'job' ? 8 : 4,
        textStyle: {
          fontSize: tier === 'job' ? 11 : 9,
          fontWeight: tier === 'job' ? 700 : 500,
          color: '#5c1a00',
          backgroundColor: tier === 'job' ? 'rgba(247,242,232,0.96)' : 'rgba(247,242,232,0.82)',
          padding: tier === 'job' ? [4, 8] : [2, 4],
          borderColor: tier === 'job' ? 'rgba(139,37,0,0.22)' : 'transparent',
          borderWidth: tier === 'job' ? 1 : 0,
          borderRadius: 2,
        },
      },
      emphasis: {
        label: {
          show: true,
          textStyle: {
            fontSize: tier === 'job' ? 12 : 11, fontWeight: 700, color: '#5c1a00',
            backgroundColor: 'rgba(247,242,232,0.96)',
            padding: [3, 6], borderRadius: 2,
            borderColor: 'rgba(139,37,0,0.18)', borderWidth: 1,
          },
        },
        itemStyle: {
          opacity: 1,
          borderColor: 'rgba(92,26,0,0.3)',
          borderWidth: 1.5,
          shadowBlur: 12,
          shadowColor: TIER_GLOW[tier],
        },
      },
      blendMode: 'source-over',
      zlevel: 3,
    }
  })

  /* ── 边：按类型收集曲线，最后合并为至多 4 个 series ── */
  const pathCurves: number[][][] = []
  const relCurves: number[][][] = []
  const tierCurves: number[][][] = []

  if (sel) {
    edges.value.forEach(e => {
      if (!e.isCareerPath || !pathNodeIds.has(e.source) || !pathNodeIds.has(e.target)) return
      const sp = posMap.get(e.source), tp = posMap.get(e.target)
      if (sp && tp) pathCurves.push(makeCurve3D(sp, tp, 1.28, 22))
    })
    edges.value.forEach(e => {
      if ((e.source !== sel && e.target !== sel) || (pathNodeIds.has(e.source) && pathNodeIds.has(e.target))) return
      const sp = posMap.get(e.source), tp = posMap.get(e.target)
      if (sp && tp) relCurves.push(makeCurve3D(sp, tp, 0.84, 10))
    })
  } else if (ht) {
    edges.value.forEach(e => {
      const sn = nodes.value.find(n => n.id === e.source)
      const tn = nodes.value.find(n => n.id === e.target)
      if (sn?.tier !== ht && tn?.tier !== ht) return
      const sp = posMap.get(e.source), tp = posMap.get(e.target)
      if (sp && tp) tierCurves.push(makeCurve3D(sp, tp, 1.05, 12))
    })
  }

  const edgeSeries: any[] = []
  if (pathCurves.length) {
    const d = joinCurves(pathCurves)
    edgeSeries.push(mkLine3D(d, { width: 5.0, color: 'rgba(130,80,10,0.25)', opacity: 0.72 }, 3))
    edgeSeries.push(mkLine3D(d, { width: 2.6, color: 'rgba(215,152,24,1)', opacity: 1 }, 4))
  }
  if (relCurves.length) {
    edgeSeries.push(mkLine3D(joinCurves(relCurves), { width: 1.2, color: 'rgba(72,118,168,0.78)', opacity: 0.80 }, 3))
  }
  if (tierCurves.length) {
    edgeSeries.push(mkLine3D(joinCurves(tierCurves), { width: 1.6, color: 'rgba(84,150,108,0.88)', opacity: 0.88 }, 3))
  }

  return {
    animation: false,
    backgroundColor: PARCHMENT_BG,
    tooltip: {
      show: true,
      backgroundColor: 'rgba(247,242,232,0.98)',
      borderColor: 'rgba(139,37,0,0.18)',
      borderWidth: 1,
      textStyle: { color: '#1a1410', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 12px rgba(26,20,16,0.06);',
      formatter: (params: any) => {
        const d = params.data
        if (!d || !d.name) return ''
        if (d.tier) {
          const tier = d.tier as SkillTier
          return `<span style="color:${TIER_COLORS[tier]};font-weight:600">${d.name}</span>`
            + `<br/><span style="color:#6b5d4f;font-size:11px">${TIER_LABELS[tier]}</span>`
        }
        return d.name
      },
    },
    grid3D: {
      boxWidth: 340,
      boxHeight: 96,
      boxDepth: 190,
      show: false,
      viewControl: {
        alpha: 90, beta: 0, distance: 240,
        minDistance: 130, maxDistance: 480,
        rotateSensitivity: 0, zoomSensitivity: 0.55, panSensitivity: 0,
        autoRotate: false,
      },
      light: {
        main: { intensity: 0.72, shadow: false, alpha: 36, beta: 118 },
        ambient: { intensity: 0.58 },
      },
      environment: PARCHMENT_BG,
    },
    xAxis3D: {
      type: 'value', min: -190, max: 220,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0)' } },
      axisTick: { lineStyle: { color: 'rgba(0,0,0,0)' } },
      axisLabel: { textStyle: { color: 'rgba(0,0,0,0)' } },
      splitLine: { lineStyle: { opacity: 0 } }, splitArea: { show: false },
    },
    yAxis3D: {
      type: 'value', min: -5, max: 105,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0)' } },
      axisTick: { lineStyle: { color: 'rgba(0,0,0,0)' } },
      axisLabel: { textStyle: { color: 'rgba(0,0,0,0)' } },
      splitLine: { lineStyle: { opacity: 0 } }, splitArea: { show: false },
    },
    zAxis3D: {
      type: 'value', min: -95, max: 95,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0)' } },
      axisTick: { lineStyle: { color: 'rgba(0,0,0,0)' } },
      axisLabel: { textStyle: { color: 'rgba(0,0,0,0)' } },
      splitLine: { lineStyle: { opacity: 0 } }, splitArea: { show: false },
    },
    series: [
      ...surfaceSeries,
      labelSeries,
      ...scatterSeries,
      ...edgeSeries,
    ] as any[],
  }
}

/* ═══ 图表点击事件 ═══ */
function handleChartClick(params: any) {
  const d = params.data
  if (!d) return
  if (d.nodeId) {
    selectedSkillId.value = selectedSkillId.value === d.nodeId ? null : d.nodeId
    rebuildChart()
  }
}

function closePanel() {
  selectedSkillId.value = null
  rebuildChart()
}

/* ═══ 初始化 & resize ═══ */
function initChart() {
  if (!chartEl.value) return
  chart?.dispose()
  try {
    chart = echarts.init(chartEl.value)
    chart.setOption(buildOption() as any)
    // 节点点击：取消空白点击计时器，再处理选中
    chart.on('click', (params: any) => {
      if (_blankClickTimer !== null) {
        clearTimeout(_blankClickTimer)
        _blankClickTimer = null
      }
      handleChartClick(params)
    })
    // 空白点击：延迟执行，让 chart.on('click') 有机会先取消
    chart.getZr().on('click', () => {
      if (_blankClickTimer !== null) clearTimeout(_blankClickTimer)
      _blankClickTimer = setTimeout(() => {
        _blankClickTimer = null
        if (selectedSkillId.value !== null || highlightTier.value !== null) {
          selectedSkillId.value = null
          highlightTier.value = null
          rebuildChart()
        }
      }, 120)
    })
  } catch (err) {
    console.error('[CourseSystemGraph] initChart error:', err)
  }
}

function resizeChart() {
  if (!chart) return
  chart.resize()
}

useResizeObserver(graphContainerEl, () => {
  requestAnimationFrame(resizeChart)
}, { debounceMs: 150 })

/* ═══ GSAP 入场 ═══ */
const shellRef = ref<HTMLElement>()
let gsapCtx: ReturnType<typeof gsap.context> | null = null

function playEntrance() {
  if (!shellRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  return gsap.context(() => {
    gsap.from('.cs-header', { y: -28, opacity: 0, duration: 0.5, ease: 'power3.out' })
    gsap.from('.cs-graph',  { opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.12 })
    gsap.from('.cs-legend', { y: 16, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.55 })
  }, shellRef.value)
}

/* ═══ 数据加载 ═══ */
async function loadData() {
  const data = await getCourseSystemData(roleName.value)
  graphData.value = data
  nodes.value = data.nodes
  edges.value = data.edges
  courseNodes.value = data.courseNodes
  invalidateLayoutCache()
  await nextTick()
  initChart()
  gsapCtx = playEntrance() ?? null
}

onMounted(() => loadData())
onBeforeUnmount(() => {
  gsapCtx?.revert()
  chart?.dispose()
  chart = null
})
watch(roleName, () => loadData())

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
          <span class="cs-brand__icon">谱</span>
          <span class="cs-brand__title">职业发展中心 / 课程体系 · {{ roleName }}</span>
        </div>
      </div>
      <div class="cs-header__right">
        <span class="cs-scroll-label">卷1/3</span>
        <div class="cs-user-info">
          <div class="cs-avatar">{{ userStore.currentUser?.name?.substring(0, 1) || '学' }}</div>
          <div class="cs-user-text">
            <span class="cs-user-name">{{ userStore.currentUser?.name || '张同学' }}</span>
            <span class="cs-user-role">学生</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ═══ 主体 ═══ -->
    <div class="cs-body">
      <div ref="graphContainerEl" class="cs-graph">
        <div ref="chartEl" class="cs-chart"></div>

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

        <!-- 左下角连线说明图例 -->
        <div class="cs-legend">
          <div class="cs-legend__title">连线说明</div>
          <div class="cs-legend__lines">
            <div class="cs-legend__line-item">
              <span class="cs-legend__line cs-legend__line--path"></span>
              <span>成长路径：从基础能力到目标职业的主线</span>
            </div>
            <div class="cs-legend__line-item">
              <span class="cs-legend__line cs-legend__line--related"></span>
              <span>关联能力：与当前选中节点直接相关</span>
            </div>
            <div class="cs-legend__line-item">
              <span class="cs-legend__line cs-legend__line--tier"></span>
              <span>层级关系：当前高亮分层中的能力联系</span>
            </div>
            <div class="cs-legend__tip">点击最上方岗位节点，可查看完整成长路径。</div>
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
          <span>滚轮缩放 · 点击节点查看详情 · 点击顶部岗位节点查看完整成长路径 · 点击图例高亮层级</span>
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
  background: var(--bg-100);
  color: var(--text-100);
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
  background: var(--card-bg);
  border-bottom: 2px solid var(--primary-100);
  flex-shrink: 0;
}
.cs-header__left { display: flex; align-items: center; gap: 14px; }
.cs-header__right { display: flex; align-items: center; gap: 16px; }

.cs-back {
  display: inline-flex; align-items: center; gap: 5px;
  background: transparent;
  border: 1px solid var(--bg-300);
  color: var(--text-200); padding: 5px 12px;
  font-family: inherit; font-size: 13px;
  cursor: pointer; transition: border-color var(--transition-fast), color var(--transition-fast);
  border-radius: var(--radius-sm);
}
.cs-back:hover { border-color: var(--primary-100); color: var(--primary-100); }

.cs-brand { display: flex; align-items: center; gap: 9px; }
.cs-brand__icon {
  width: 30px; height: 30px; display: grid; place-items: center;
  border: 1.5px solid var(--primary-100); color: var(--primary-100);
  font-size: 14px; font-weight: 900; transform: rotate(-3deg);
}
.cs-brand__title {
  font-size: 14px; font-weight: 600; letter-spacing: 0.06em;
  color: var(--text-100); white-space: nowrap;
}

.cs-scroll-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-100);
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
}

.cs-user-info { display: flex; align-items: center; gap: 8px; }
.cs-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--primary-100);
  color: #fff; display: grid; place-items: center;
  font-size: 13px; font-weight: 700;
}
.cs-user-text { display: flex; flex-direction: column; }
.cs-user-name { font-size: 13px; font-weight: 600; color: var(--text-100); line-height: 1.2; }
.cs-user-role { font-size: 11px; color: var(--text-300); }

/* ═══ 图谱主区 ═══ */
.cs-body {
  flex: 1;
  min-height: 0;
  background: var(--bg-100);
}
.cs-graph {
  width: 100%; height: 100%;
  position: relative;
  background: linear-gradient(180deg, #f8f4ec 0%, #f1eadf 100%);
}
.cs-chart {
  width: 100%; height: 100%;
  background: transparent;
}

/* ═══ 右上工具栏 ═══ */
.cs-tools {
  position: absolute;
  top: 16px; right: 16px; z-index: 5;
  display: flex;
  pointer-events: auto;
}
.cs-tools__btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(139,37,0,0.16);
  background: rgba(247,242,232,0.92);
  color: rgba(92,26,0,0.65);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  transition: all 0.15s ease;
  backdrop-filter: blur(8px);
}
.cs-tools__btn:hover {
  color: #5c1a00;
  border-color: rgba(139,37,0,0.28);
  background: rgba(247,242,232,0.98);
}
.cs-tools__btn.is-active {
  color: #5c1a00;
  background: rgba(139,37,0,0.08);
  border-color: rgba(139,37,0,0.22);
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
  border-left: 3.5px solid var(--bm-color, #8B2500);
  background: rgba(247,242,232,0.88);
  color: rgba(26,20,16,0.72);
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  border-radius: 0 6px 6px 0;
  backdrop-filter: blur(8px);
  box-shadow: 2px 2px 8px rgba(26,20,16,0.06);
  transition: all 0.2s ease;
  white-space: nowrap;
}
.cs-bookmark:hover {
  background: rgba(247,242,232,0.96);
  color: rgba(26,20,16,0.92);
  padding-right: 18px;
  box-shadow: 3px 2px 12px rgba(26,20,16,0.1);
}
.cs-bookmark.is-active {
  background: var(--bm-bg, #8B2500);
  color: #fff;
  font-weight: 700;
  padding-right: 20px;
  box-shadow: 3px 3px 14px rgba(26,20,16,0.14);
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

/* ═══ 左下角连线说明图例 ═══ */
.cs-legend {
  position: absolute;
  bottom: 20px; left: 20px; z-index: 5;
  background: rgba(247,242,232,0.92);
  border: 1px solid rgba(139,37,0,0.16);
  border-left: 3px solid var(--primary-100);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  pointer-events: auto;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 24px rgba(26,20,16,0.08);
}
.cs-legend__title {
  font-size: 10px; font-weight: 700;
  color: rgba(92,26,0,0.62); letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(139,37,0,0.1);
}
.cs-legend__lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cs-legend__line-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: rgba(26,20,16,0.72);
  line-height: 1.45;
}
.cs-legend__line {
  width: 24px;
  height: 0;
  margin-top: 7px;
  flex-shrink: 0;
  border-top: 2px solid;
  border-radius: 999px;
}
.cs-legend__line--path {
  border-color: rgba(215,152,24,1);
  box-shadow: 0 0 7px rgba(215,152,24,0.40);
  border-width: 2.5px;
}
.cs-legend__line--related {
  border-color: rgba(72,118,168,0.88);
}
.cs-legend__line--tier {
  border-color: rgba(84,150,108,0.90);
}
.cs-legend__tip {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed rgba(139,37,0,0.12);
  font-size: 10px;
  line-height: 1.5;
  color: rgba(92,26,0,0.55);
}

/* ═══ 右侧详情面板 ═══ */
.cs-panel {
  position: absolute;
  top: 16px; right: 16px; bottom: 16px; z-index: 6;
  width: 280px;
  display: flex;
  flex-direction: column;
  background: rgba(247,242,232,0.96);
  border: 1px solid rgba(139,37,0,0.18);
  border-top: 3px solid var(--primary-100);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 32px rgba(26,20,16,0.12);
  overflow: hidden;
}
.cs-panel__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(139,37,0,0.1);
  flex-shrink: 0;
}
.cs-panel__title {
  font-size: 15px; font-weight: 700; color: #5c1a00;
  line-height: 1.3;
}
.cs-panel__close {
  display: grid; place-items: center;
  width: 24px; height: 24px;
  border: none; background: transparent;
  color: rgba(92,26,0,0.5); cursor: pointer;
  border-radius: 3px; transition: all 0.15s;
  flex-shrink: 0;
}
.cs-panel__close:hover {
  background: rgba(139,37,0,0.08);
  color: #5c1a00;
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
  border-radius: 3px;
  background: rgba(139,37,0,0.04);
}
.cs-panel__heat {
  font-size: 11px; color: var(--text-300);
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
  font-size: 11px; font-weight: 700;
  color: rgba(92,26,0,0.65);
  letter-spacing: 0.08em;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(139,37,0,0.08);
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
  border-radius: 3px;
  transition: background 0.15s;
}
.cs-panel__path-step:hover {
  background: rgba(139,37,0,0.05);
}
.cs-panel__path-step.is-current {
  font-weight: 700;
}
.cs-panel__path-step.is-current .cs-panel__path-name {
  color: #5c1a00;
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
  color: var(--text-200);
  flex: 1;
  min-width: 0;
}
.cs-panel__path-tier {
  font-size: 10px;
  color: var(--text-300);
  flex-shrink: 0;
}
.cs-panel__path-line {
  position: absolute;
  left: 3.5px;
  top: calc(50% + 4px);
  width: 1px;
  height: calc(100% - 4px);
  background: rgba(139,37,0,0.15);
}

/* ── 课程 ── */
.cs-panel__course-group {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 600;
  color: rgba(92,26,0,0.55);
  letter-spacing: 0.06em;
  margin: 10px 0 4px;
}
.cs-panel__course-group:first-child {
  margin-top: 0;
}
.cs-panel__course-group-dot {
  width: 6px; height: 6px; border-radius: 1px; flex-shrink: 0;
}
.cs-panel__course-card {
  padding: 6px 8px;
  margin-bottom: 4px;
  background: rgba(139,37,0,0.03);
  border: 1px solid rgba(139,37,0,0.08);
  border-radius: 3px;
  transition: border-color 0.15s;
}
.cs-panel__course-card:hover {
  border-color: rgba(139,37,0,0.18);
}
.cs-panel__course-name {
  font-size: 12px; font-weight: 600; color: var(--text-100);
  margin-bottom: 3px;
}
.cs-panel__course-tags {
  display: flex; gap: 4px;
}
.cs-panel__tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 2px;
  border: 1px solid rgba(139,37,0,0.12);
  color: var(--text-300);
  background: rgba(247,242,232,0.8);
}
.cs-panel__tag--core {
  border-color: rgba(139,37,0,0.25);
  color: #8B2500;
  background: rgba(139,37,0,0.06);
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
  font-size: 12px; color: rgba(92,26,0,0.4);
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
  font-size: 11px; color: rgba(92,26,0,0.48);
  pointer-events: none;
  background: rgba(247,242,232,0.68);
  border: 1px solid rgba(139,37,0,0.1);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
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
  .cs-tools { top: 10px; right: 10px; }
  .cs-tools__btn span { display: none; }
  .cs-hint { display: none; }
  .cs-brand__title { font-size: 13px; }
  .cs-panel { width: 220px; top: 10px; right: 10px; bottom: 10px; }
}
@media (max-width: 640px) {
  .cs-header { padding: 8px 12px; }
  .cs-back span { display: none; }
  .cs-brand__title { font-size: 12px; }
  .cs-scroll-label { display: none; }
  .cs-user-text { display: none; }
  .cs-legend { display: none; }
  .cs-panel {
    top: auto; bottom: 0; left: 0; right: 0;
    width: 100%; height: 50%;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  }
  .panel-slide-enter-from { transform: translateY(100%); }
  .panel-slide-leave-to { transform: translateY(100%); }
}
</style>
