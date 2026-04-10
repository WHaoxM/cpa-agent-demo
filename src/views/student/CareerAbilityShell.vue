<!-- 页面：职业能力图谱 Shell；路由：student/career-ability；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, provide, onMounted, onBeforeUnmount, watch, nextTick, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores'
import { useResumeStore } from '@/stores/resume'
import { init as echartsInit } from 'echarts/core'
import {
  getAbilityGraphData, computeOrbitalLayout,
  GROUP_COLORS, GROUP_LABELS, RELATION_STYLES,
  type AbilityNode, type AbilityEdge, type AbilityGroup, type OrbitalNode,
} from '@/composables/useAbilityGraph'
import { useResizeObserver } from '@/composables/useResizeObserver'
import type { LayoutMode } from '@/types'
import CareerAbilityGraph from './CareerAbilityGraph.vue'
import CareerAbilityDual from './CareerAbilityDual.vue'
import CareerAbilityWorkspace from './CareerAbilityWorkspace.vue'

defineOptions({ name: 'CareerAbilityShell' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const resumeStore = useResumeStore()

/* 已掌握技能集合（供子组件高亮用） */
const masteredSkillNames = computed(() =>
  new Set(resumeStore.parsedSkills.map(s => s.name.toLowerCase()))
)

const roleName = computed(() => (route.query.role as string) || '前端开发')

function goBack() { router.back() }

/* ═══ 布局模式：同一路由内切换，不依赖子路由 ═══ */
const layoutMode = ref<LayoutMode>('single')
const isSplit = computed(() => layoutMode.value === 'split')
const isWorkspace = computed(() => layoutMode.value === 'workspace')

function toggleLayout() {
  layoutMode.value = layoutMode.value === 'single' ? 'split' : 'single'
}

/* ═══ 图谱状态 ═══ */
const allNodes = shallowRef<AbilityNode[]>([])
const allEdges = shallowRef<AbilityEdge[]>([])
const collapsedBoards = ref<Set<string>>(new Set())
const showEdgeLabels = ref(false)
const chartEl = ref<HTMLElement>()
const graphContainerEl = ref<HTMLElement>()

let chart: ReturnType<typeof echartsInit> | null = null
let animFrame: number | null = null
let animStartTime = 0
let tick = 0
let skipUntil = 0
const orbitalMap = new Map<string, OrbitalNode>()
const CX = 400, CY = 400
const FRAME_MS = 50
const ORBIT_AMP = 0.22
let isDragging = false
let dragOffsets = new Map<string, { dx: number; dy: number }>()

/* ═══ 数据加载 ═══ */
async function loadData() {
  const data = await getAbilityGraphData(roleName.value)
  allNodes.value = data.nodes
  allEdges.value = data.edges
  collapsedBoards.value = new Set()
  rebuildOrbital()
  tick = 0
  animStartTime = performance.now()
  await nextTick()
  initChart()
}

/* ═══ 可见节点/边 ═══ */
const visibleNodes = computed(() => {
  const c = collapsedBoards.value
  if (c.size === 0) return allNodes.value
  return allNodes.value.filter(n => n.level <= 1 || !c.has(n.parentId || ''))
})
const visibleNodeIds = computed(() => new Set(visibleNodes.value.map(n => n.id)))
const visibleEdges = computed(() => {
  const ids = visibleNodeIds.value
  return allEdges.value.filter(e => ids.has(e.source) && ids.has(e.target))
})

/* ═══ 轨道布局 ═══ */
function rebuildOrbital() {
  const orbitals = computeOrbitalLayout(visibleNodes.value, { radii: [0, 130, 270, 380] })
  orbitalMap.clear()
  orbitals.forEach(o => orbitalMap.set(o.id, o))
}
function orbitalXY(orb: OrbitalNode, t: number) {
  if (orb.layer === 0) return { x: CX, y: CY }
  const speed = 0.7 / (orb.layer * 0.55 + 0.45)
  const phase = orb.baseAngle * 3.17 + orb.layer * 1.37
  const amp = ORBIT_AMP + 0.06 / orb.layer
  const angle = orb.baseAngle + amp * Math.sin(t * speed + phase)
  return { x: CX + orb.radius * Math.cos(angle), y: CY + orb.radius * Math.sin(angle) }
}

/* ═══ ECharts 节点/边 ═══ */
const catIdx: Record<AbilityGroup, number> = { job: 0, professional: 1, position: 2, cognitive: 3, general: 4 }
function buildNodes(t: number) {
  return visibleNodes.value.map(n => {
    const orb = orbitalMap.get(n.id)
    let pos = orb ? orbitalXY(orb, t) : { x: CX, y: CY }
    const offset = dragOffsets.get(n.id)
    if (offset) pos = { x: pos.x + offset.dx, y: pos.y + offset.dy }
    const isJob = n.level === 0, isBoard = n.level === 1
    const collapsed = isBoard && collapsedBoards.value.has(n.id)
    const size = isJob ? 64 : isBoard ? (collapsed ? 30 : 44) : 14 + (n.heat || 50) * 0.13
    return {
      id: n.id, name: n.name, x: pos.x, y: pos.y, fixed: false,
      category: catIdx[n.group], symbolSize: size,
      symbol: (isJob ? 'circle' : isBoard ? 'roundRect' : 'circle') as 'circle' | 'roundRect',
      label: {
        show: true,
        position: (isJob || isBoard ? 'inside' : 'right') as 'inside' | 'right',
        fontSize: isJob ? 14 : isBoard ? (collapsed ? 10 : 12) : 10,
        color: isJob || isBoard ? '#fff' : GROUP_COLORS[n.group],
        fontWeight: isJob || isBoard ? 700 : 400, formatter: n.name,
      },
      itemStyle: {
        color: collapsed ? 'rgba(255,255,255,0.55)' : GROUP_COLORS[n.group],
        borderColor: collapsed ? GROUP_COLORS[n.group] : isJob ? '#5C1A00' : isBoard ? 'rgba(0,0,0,0.15)' : undefined,
        borderWidth: collapsed ? 2.5 : isJob ? 3 : isBoard ? 1.5 : 0,
        borderType: (collapsed ? 'dashed' : 'solid') as 'dashed' | 'solid',
        shadowBlur: collapsed ? 12 : isJob ? 16 : isBoard ? 8 : 3,
        shadowColor: collapsed ? GROUP_COLORS[n.group] + '80' : isJob ? 'rgba(139,37,0,0.5)' : 'rgba(0,0,0,0.12)',
        opacity: collapsed ? 0.75 : 1,
      },
      emphasis: {
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.35)', borderColor: '#333', borderWidth: 2 },
        label: { fontSize: isJob ? 16 : isBoard ? 14 : 12, fontWeight: 700 },
      },
    }
  })
}
function buildLinks() {
  return visibleEdges.value.map((e, i) => {
    const style = RELATION_STYLES[e.relation]
    const isBelong = e.relation === 'belong'
    const sign = i % 2 === 0 ? 1 : -1
    return {
      source: e.source, target: e.target,
      lineStyle: {
        color: style.color, width: isBelong ? 1.6 : 0.9,
        type: style.dash.length > 0 ? style.dash : ('solid' as const),
        curveness: style.curveness * sign, opacity: isBelong ? 0.4 : 0.3,
      },
      label: {
        show: showEdgeLabels.value && !isBelong,
        formatter: e.label || style.label, fontSize: 9, color: style.color,
        padding: [2, 4] as [number, number],
        backgroundColor: 'rgba(247,242,232,0.85)', borderRadius: 2,
      },
    }
  })
}
function buildFullOption(t: number) {
  const categories = (['job', 'professional', 'position', 'cognitive', 'general'] as AbilityGroup[]).map(g => ({
    name: GROUP_LABELS[g], itemStyle: { color: GROUP_COLORS[g] },
  }))
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    animationDurationUpdate: 0,
    animationEasingUpdate: 'linear' as const,
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(255,255,255,0.96)', borderColor: 'rgba(0,0,0,0.08)',
      textStyle: { color: '#111', fontSize: 13 },
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const nd = allNodes.value.find(n => n.id === params.data.id)
          if (!nd) return params.name
          return `<b>${nd.name}</b><br/>类别: ${GROUP_LABELS[nd.group]}${nd.heat != null ? '<br/>热度: ' + nd.heat : ''}`
        }
        if (params.dataType === 'edge') {
          const ed = allEdges.value.find(x => x.source === params.data.source && x.target === params.data.target)
          if (ed) {
            const sn = allNodes.value.find(n => n.id === ed.source)?.name || ed.source
            const tn = allNodes.value.find(n => n.id === ed.target)?.name || ed.target
            return `${sn} → ${tn}<br/>关系: ${RELATION_STYLES[ed.relation].label}${ed.label ? '<br/>' + ed.label : ''}`
          }
        }
        return ''
      },
    },
    series: [{
      type: 'graph' as const, layout: 'none' as const,
      roam: true, draggable: true, zoom: 0.9, center: [CX, CY],
      categories, data: buildNodes(t), links: buildLinks(),
      edgeSymbol: ['none', 'arrow'] as const, edgeSymbolSize: [0, 5],
      emphasis: { focus: 'adjacency' as const, lineStyle: { width: 2.5, opacity: 1 } },
      blur: { itemStyle: { opacity: 0.3 }, lineStyle: { opacity: 0.1 } },
    }],
  }
}

/* ═══ 邻接表 ═══ */
function getAdjacentIds(nodeId: string): string[] {
  const ids: string[] = []
  for (const e of allEdges.value) {
    if (e.source === nodeId) ids.push(e.target)
    else if (e.target === nodeId) ids.push(e.source)
  }
  return ids
}

/* ═══ 图表初始化与动画 ═══ */
function initChart() {
  if (!chartEl.value) return
  if (chart) { chart.dispose(); chart = null }
  chart = echartsInit(chartEl.value)
  chart.setOption(buildFullOption(tick) as any, true)
  chart.on('click', onChartClick)
  let dragNodeId: string | null = null
  let dragStartX = 0, dragStartY = 0
  chart.on('mousedown', (params: any) => {
    if (params.dataType !== 'node') return
    isDragging = true; dragNodeId = params.data.id
    dragStartX = params.event?.offsetX ?? 0; dragStartY = params.event?.offsetY ?? 0
  })
  chart.getZr().on('mousemove', (e: any) => {
    if (!isDragging || !dragNodeId) return
    const dx = (e.offsetX - dragStartX) * 1.1, dy = (e.offsetY - dragStartY) * 1.1
    dragOffsets.set(dragNodeId, { dx, dy })
    for (const nid of getAdjacentIds(dragNodeId)) dragOffsets.set(nid, { dx: dx * 0.35, dy: dy * 0.35 })
  })
  chart.getZr().on('mouseup', () => {
    if (!isDragging) return
    isDragging = false; dragNodeId = null; dragOffsets.clear()
  })
  skipUntil = performance.now() + 500
  startAnimation()
}
function startAnimation() {
  stopAnimation()
  let lastFrame = 0
  const loop = (now: number) => {
    animFrame = requestAnimationFrame(loop)
    const elapsed = now - lastFrame
    if (!isDragging && elapsed < FRAME_MS) return
    lastFrame = now
    if (!chart || now < skipUntil) return
    tick = (now - animStartTime) / 1400
    chart.setOption({
      animationDurationUpdate: 0,
      series: [{ data: buildNodes(tick), links: buildLinks() }],
    } as any)
  }
  animFrame = requestAnimationFrame(loop)
}
function stopAnimation() { if (animFrame != null) { cancelAnimationFrame(animFrame); animFrame = null } }
function onChartClick(params: any) {
  if (params.dataType !== 'node' || isDragging) return
  const node = allNodes.value.find(n => n.id === params.data.id)
  if (!node || node.level !== 1) return
  const s = new Set(collapsedBoards.value)
  if (s.has(node.id)) s.delete(node.id); else s.add(node.id)
  collapsedBoards.value = s; rebuildOrbital()
  if (chart) {
    chart.setOption({
      animationDurationUpdate: 400,
      animationEasingUpdate: 'cubicOut',
      series: [{ data: buildNodes(tick), links: buildLinks() }],
    } as any)
    skipUntil = performance.now() + 400
  }
}
function refreshLayout() {
  animStartTime = performance.now()
  tick = 0; dragOffsets.clear(); rebuildOrbital()
  if (chart) {
    chart.setOption(buildFullOption(tick) as any, true)
    skipUntil = performance.now() + 500
  }
}
/* ═══ Provide 共享状态给嵌入的子组件 ═══ */
provide('shared-graph', {
  allNodes, allEdges, visibleNodes, visibleEdges, roleName,
  showEdgeLabels, collapsedBoards,
  refreshLayout, layoutMode, toggleLayout,
  masteredSkillNames,
})

/* ═══ useResizeObserver：监听图容器尺寸变化 → chart.resize() ═══ */
useResizeObserver(graphContainerEl, () => {
  requestAnimationFrame(() => chart?.resize())
}, { debounceMs: 80 })

/* ═══ 布局切换时持续 resize，使图谱丝滑跟随容器宽度过渡 ═══ */
let layoutTransitionRaf: number | null = null
watch(layoutMode, () => {
  if (layoutTransitionRaf != null) cancelAnimationFrame(layoutTransitionRaf)
  const start = performance.now()
  const DURATION = 480 // 略长于 CSS transition 0.45s
  const step = (now: number) => {
    chart?.resize()
    if (now - start < DURATION) {
      layoutTransitionRaf = requestAnimationFrame(step)
    } else {
      layoutTransitionRaf = null
    }
  }
  layoutTransitionRaf = requestAnimationFrame(step)
})

/* ═══ 生命周期 ═══ */
onMounted(async () => {
  await loadData()
})
onBeforeUnmount(() => {
  stopAnimation()
  if (layoutTransitionRaf != null) { cancelAnimationFrame(layoutTransitionRaf); layoutTransitionRaf = null }
  chart?.dispose(); chart = null
})
watch(roleName, () => loadData())
watch(showEdgeLabels, () => { if (chart) chart.setOption({ series: [{ links: buildLinks() }] } as any) })
</script>

<template>
  <div class="shell-page">
    <!-- ═══ 顶栏 ═══ -->
    <header class="shell-header">
      <div class="shell-header__left">
        <button class="shell-back" @click="goBack" title="返回">
          <Icon icon="lucide:arrow-left" :width="16" />
          <span>返回</span>
        </button>
        <div class="shell-brand">
          <span class="shell-brand__icon">舆</span>
          <span class="shell-brand__title">职业发展中心 / 职业能力复合图谱 · {{ roleName }}</span>
        </div>
      </div>

      <div class="shell-layout-toggle">
        <button
          class="shell-toggle-btn"
          :class="{ 'shell-toggle-btn--active': layoutMode === 'single' }"
          @click="layoutMode = 'single'"
        >
          <Icon icon="lucide:maximize" :width="14" />
          <span>图谱</span>
        </button>
        <button
          class="shell-toggle-btn"
          :class="{ 'shell-toggle-btn--active': layoutMode === 'split' }"
          @click="layoutMode = 'split'"
        >
          <Icon icon="lucide:columns" :width="14" />
          <span>双栏</span>
        </button>
        <button
          class="shell-toggle-btn"
          :class="{ 'shell-toggle-btn--active': isWorkspace }"
          @click="layoutMode = 'workspace'"
        >
          <Icon icon="lucide:layout-dashboard" :width="14" />
          <span>工作台</span>
        </button>
      </div>

      <div class="shell-header__right">
        <span class="shell-scroll-label">卷2/3</span>
        <div class="shell-user-info">
          <div class="shell-avatar">{{ userStore.currentUser?.name?.substring(0, 1) || '学' }}</div>
          <div class="shell-user-text">
            <span class="shell-user-name">{{ userStore.currentUser?.name || '张同学' }}</span>
            <span class="shell-user-role">学生</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ═══ 内容区：图谱始终可见 + 右侧面板滑入/滑出 ═══ -->
    <div class="shell-body" :class="'shell-body--' + layoutMode">
      <!-- 图区域（始终挂载，宽度随 layoutMode 平滑过渡） -->
      <div ref="graphContainerEl" class="shell-graph">
        <div ref="chartEl" class="shell-chart"></div>
        <!-- 图谱叠加层：工具栏 + 图例 -->
        <CareerAbilityGraph />
      </div>
      <!-- 右侧面板（始终挂载，CSS 控制宽度与可见性） -->
      <div class="shell-panel">
        <CareerAbilityDual />
      </div>
      <!-- 工作台（始终挂载，CSS 控制可见性） -->
      <div class="shell-workspace">
        <CareerAbilityWorkspace />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ Shell 根 ═══ */
.shell-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-100, #F5F5F3);
  color: var(--text-100, #111);
  font-family: var(--font-title), sans-serif;
  overflow: hidden;
}

/* ═══ 顶栏 ═══ */
.shell-header {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 10px 24px;
  background: var(--bg-200, #EDEDEB);
  border-bottom: 1px solid var(--bg-300, #CBCBC8);
  flex-shrink: 0;
}
.shell-header__left { display: flex; align-items: center; gap: 14px; justify-self: start; }
.shell-header__right { display: flex; align-items: center; gap: 16px; justify-self: end; }

.shell-back {
  display: inline-flex; align-items: center; gap: 4px;
  background: transparent; border: 1px solid var(--bg-300);
  color: var(--primary-100, #8B2500); padding: 5px 12px; font-family: inherit; font-size: 13px;
  cursor: pointer; transition: all 0.2s ease; border-radius: var(--radius-sm, 2px);
}
.shell-back:hover { border-color: var(--primary-100); background: rgba(139,37,0,0.06); }

.shell-brand { display: flex; align-items: center; gap: 8px; }
.shell-brand__icon {
  width: 30px; height: 30px; display: grid; place-items: center;
  border: 1.5px solid var(--primary-100); color: var(--primary-100); font-size: 15px; font-weight: 600;
  transform: rotate(-3deg);
}
.shell-brand__title {
  font-size: 15px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-100);
  white-space: nowrap;
}

/* ═══ 布局切换按钮组 ═══ */
.shell-layout-toggle {
  justify-self: center;
  display: flex; align-items: center; gap: 0;
  background: var(--bg-100, #F5F5F3);
  border: 1px solid var(--bg-300, #CBCBC8);
  border-radius: var(--radius-md, 3px);
  overflow: hidden;
}
.shell-toggle-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 22px; font-size: 13px; font-weight: 600;
  font-family: inherit; letter-spacing: 0.08em;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-200, #666);
  transition: all 0.2s ease;
}
.shell-toggle-btn + .shell-toggle-btn { border-left: 1px solid var(--bg-300, #CBCBC8); }
.shell-toggle-btn:hover { color: var(--primary-100, #8B2500); background: rgba(139,37,0,0.04); }
.shell-toggle-btn--active {
  color: var(--primary-100, #8B2500);
  background: var(--bg-200, #EDEDEB);
  box-shadow: inset 0 -2px 0 var(--primary-100, #8B2500);
}

.shell-scroll-label {
  font-size: 16px; font-weight: 600; color: var(--primary-100);
  letter-spacing: 0.08em; font-variant-numeric: tabular-nums;
}

.shell-user-info { display: flex; align-items: center; gap: 10px; }
.shell-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  display: grid; place-items: center; color: #fff;
  font-size: 14px; font-weight: 600;
  background: var(--primary-100);
}
.shell-user-text { display: flex; flex-direction: column; line-height: 1.3; }
.shell-user-name { font-size: 13px; font-weight: 600; color: var(--text-100); }
.shell-user-role { font-size: 11px; color: var(--text-300, #999); }

/* ═══ 内容区 ═══ */
.shell-body {
  flex: 1; min-height: 0;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 图谱容器（始终挂载，宽度平滑过渡） */
.shell-graph {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  background:
    linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px),
    var(--bg-100, #F5F5F3);
  background-size: 40px 40px;
}
.shell-chart { width: 100%; height: 100%; }

/* 右侧面板（始终挂载，从右侧滑入/滑出） */
.shell-panel {
  position: relative;
  flex-shrink: 0;
  width: 0;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    width 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s ease 0.1s;
}

/* ── single 模式：图谱 100%，面板隐藏 ── */
.shell-body--single .shell-graph { width: 100%; }
.shell-body--single .shell-panel { width: 0; opacity: 0; }

/* ── split 模式：图谱 ~50%，面板 ~50% 滑入 ── */
.shell-body--split .shell-graph { width: 50%; }
.shell-body--split .shell-panel {
  width: 50%;
  height: 100%;
  opacity: 1;
  overflow: hidden;
  border-left: 1px solid var(--bg-300, #CBCBC8);
}

/* 工作台容器（始终挂载，宽度平滑过渡） */
.shell-workspace {
  position: relative;
  flex-shrink: 0;
  width: 0;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    width 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s ease 0.1s;
}

/* ── workspace 模式：图谱和面板隐藏，工作台 100% ── */
.shell-body--workspace .shell-graph { width: 0; }
.shell-body--workspace .shell-panel { width: 0; opacity: 0; }
.shell-body--workspace .shell-workspace {
  width: 100%;
  height: 100%;
  opacity: 1;
  overflow: hidden;
}

/* ═══ 响应式 ═══ */
@media (max-width: 1023px) {
  .shell-brand__title { font-size: 12px; letter-spacing: 0.06em; }
  .shell-header { padding: 8px 14px; }
}
@media (max-width: 767px) {
  .shell-brand__title { display: none; }
  .shell-scroll-label { font-size: 13px; }
}
</style>
