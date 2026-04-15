<!-- D3 职业成长树：展示职业路径与节点关系 -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as d3 from 'd3'
import type { CareerRole } from '@/composables/useCareerInsights'

type RoleTrack = { label: string; focus: string }
type RoleMeta  = { icon: string; summary: string }

const props = defineProps<{
  roles: CareerRole[]
  roleTrackMap: Record<CareerRole, RoleTrack[]>
  roleMetaMap:  Record<CareerRole, RoleMeta>
}>()

const emit = defineEmits<{
  'select-role': [role: CareerRole, track?: string]
}>()

const svgRef = ref<SVGSVGElement | null>(null)

const ROLE_COLORS = ['#BE2A00', '#8B5E2A', '#2A6B8B', '#4A6741', '#6B3D8B']

function arcPath(ir: number, or: number, sa: number, ea: number, cr = 0): string {
  return d3.arc().cornerRadius(cr)({ innerRadius: ir, outerRadius: or, startAngle: sa, endAngle: ea }) ?? ''
}

function draw() {
  const el = svgRef.value
  if (!el) return
  d3.select(el).selectAll('*').remove()

  const W  = el.clientWidth  || 800
  const H  = el.clientHeight || 540
  const cx = W / 2

  // ─── 两弧各自独立圆心，开口相对 ────────────────────────
  // 根弧（底部 ⌣）：圆心在 SVG 上方，节点向下展开，开口朝上
  const cy_R = -170           // root arc center（SVG 上方 170px）
  const R_ROOT = 700, TR = 14  // root mid-radius / half-thickness → center y = 530
  const ROOT_HALF = Math.PI * 0.14  // ±25.2°，5段

  // 冠弧（顶部 ⌢）：圆心在 SVG 下方，节点向上展开，开口朝下
  const cy_C = H + 180        // crown arc center（SVG 下方 180px）
  const R_CROWN = 700, TC = 9  // crown mid-radius / half-thickness → center y = 20
  const CROWN_HALF = Math.PI * 0.14 // ±25.2°，15段

  const GAP_R = 0.018, GAP_C = 0.012

  const nRoot  = props.roles.length
  const nCrown = props.roles.length * 3

  const rootSpan  = (2 * ROOT_HALF  - (nRoot  - 1) * GAP_R) / nRoot
  const crownSpan = (2 * CROWN_HALF - (nCrown - 1) * GAP_C) / nCrown

  // ── 根节点（底部 ⌣） ──────────────────────────────────
  // 根弧 d3 中心角 = π（6点钟，朝下），从 π−ROOT_HALF 开始分配
  type RootDatum = {
    role: CareerRole; idx: number; color: string
    d3s: number; d3e: number; mathMid: number
    // 内边缘中点（朝上 = 朝向冠弧 = 连线起点，绝对坐标）
    lnkX: number; lnkY: number
  }

  const rootData: RootDatum[] = props.roles.map((role, i) => {
    // 反转：i=0 从最左侧（π+ROOT_HALF）起，向右递减，与冠弧 ci=0 同侧
    const d3e    = (Math.PI + ROOT_HALF) - i * (rootSpan + GAP_R)
    const d3s    = d3e - rootSpan
    const d3mid  = (d3s + d3e) / 2
    // 转回标准数学角（x 右，y 下）
    const mathMid = d3mid - Math.PI / 2
    const inR = R_ROOT - TR
    return {
      role, idx: i,
      color: ROLE_COLORS[i % ROLE_COLORS.length] as string,
      d3s, d3e, mathMid,
      lnkX: cx + inR * Math.cos(mathMid),
      lnkY: cy_R + inR * Math.sin(mathMid),
    }
  })

  // ── 冠节点（顶部 ⌢） ──────────────────────────────────
  // 冠弧 d3 中心角 = 0（12点钟，朝上），从 −CROWN_HALF 开始分配
  type CrownDatum = {
    role: CareerRole; track: RoleTrack; parentIdx: number; color: string
    d3s: number; d3e: number; mathMid: number
    // 内边缘中点（朝下 = 朝向根弧 = 连线终点，绝对坐标）
    lnkX: number; lnkY: number
  }

  const crownData: CrownDatum[] = []
  let ci = 0
  props.roles.forEach((role, ri) => {
    ;(props.roleTrackMap[role] ?? []).forEach(track => {
      const d3s    = -CROWN_HALF + ci * (crownSpan + GAP_C)
      const d3e    = d3s + crownSpan
      const d3mid  = (d3s + d3e) / 2
      const mathMid = d3mid - Math.PI / 2
      const inR = R_CROWN - TC
      crownData.push({
        role, track, parentIdx: ri,
        color: ROLE_COLORS[ri % ROLE_COLORS.length] as string,
        d3s, d3e, mathMid,
        lnkX: cx + inR * Math.cos(mathMid),
        lnkY: cy_C + inR * Math.sin(mathMid),
      })
      ci++
    })
  })

  const svg = d3.select(el)

  // 各自独立的弧组（坐标系原点 = 各自圆心）
  const rootArcG  = svg.append('g').attr('transform', `translate(${cx},${cy_R})`)
  const crownArcG = svg.append('g').attr('transform', `translate(${cx},${cy_C})`)

  // ── 树状扇形连线（绝对坐标，不在 arcG 内） ──────────────
  // 各组父→子线在自己横向区间内展开，不交叉
  // M rx,ry  C rx,midY  crownX,midY  crownX,cy
  const midY = H * 0.5
  const linkG   = svg.append('g')
  const linkSel = linkG.selectAll<SVGPathElement, CrownDatum>('path')
    .data(crownData).enter()
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 1.6)
    .attr('stroke-opacity', 0.35)
    .attr('d', d => {
      const root = rootData[d.parentIdx]
      if (!root) return ''
      // CP1：根节点正上方 midY；CP2：冠节点正下方 midY
      return `M${root.lnkX},${root.lnkY} C${root.lnkX},${midY} ${d.lnkX},${midY} ${d.lnkX},${d.lnkY}`
    })
    .attr('stroke-dasharray', function () { return (this as SVGPathElement).getTotalLength() })
    .attr('stroke-dashoffset', function () { return (this as SVGPathElement).getTotalLength() })

  linkSel.transition()
    .delay((_, i) => 360 + i * 20)
    .duration(520)
    .ease(d3.easeCubicOut)
    .attr('stroke-dashoffset', 0)

  // ── 冠弧段（顶部 ⌢，在 crownArcG 坐标系内） ─────────────
  const crownSel = crownArcG.selectAll<SVGGElement, CrownDatum>('g')
    .data(crownData).enter()
    .append('g')
    .attr('opacity', 0)
    .style('cursor', 'pointer')

  crownSel.append('path')
    .attr('d', d => arcPath(R_CROWN - TC, R_CROWN + TC, d.d3s, d.d3e, 4))
    .attr('fill', d => d.color)
    .attr('fill-opacity', 0.14)
    .attr('stroke', d => d.color)
    .attr('stroke-width', 1.5)

  // 冠弧标签：向内侧（圆心方向 = 朝下 = 中间空白区）
  crownSel.append('text')
    .attr('transform', d => {
      const r = R_CROWN - TC - 15
      return `translate(${r * Math.cos(d.mathMid)},${r * Math.sin(d.mathMid)})`
    })
    .attr('text-anchor', d => {
      const c = Math.cos(d.mathMid)
      return c < -0.15 ? 'end' : c > 0.15 ? 'start' : 'middle'
    })
    .attr('dominant-baseline', 'central')
    .attr('font-size', '11px')
    .attr('fill', d => d.color)
    .attr('fill-opacity', 0.88)
    .text(d => d.track.label)

  crownSel.transition()
    .delay((_, i) => 800 + i * 28)
    .duration(280)
    .ease(d3.easeCubicOut)
    .attr('opacity', 1)

  // ── 根弧段（底部 ⌣，在 rootArcG 坐标系内） ─────────────
  const rootSel = rootArcG.selectAll<SVGGElement, RootDatum>('g')
    .data(rootData).enter()
    .append('g')
    .attr('opacity', 0)
    .style('cursor', 'pointer')

  rootSel.append('path')
    .attr('d', d => arcPath(R_ROOT - TR, R_ROOT + TR, d.d3s, d.d3e, 5))
    .attr('fill', d => d.color)
    .attr('fill-opacity', 0.18)
    .attr('stroke', d => d.color)
    .attr('stroke-width', 2)

  // 根弧标签：向内侧（圆心方向 = 朝上 = 中间空白区）
  rootSel.append('text')
    .attr('transform', d => {
      const r = R_ROOT - TR - 16
      return `translate(${r * Math.cos(d.mathMid)},${r * Math.sin(d.mathMid)})`
    })
    .attr('text-anchor', d => {
      const c = Math.cos(d.mathMid)
      return c < -0.15 ? 'end' : c > 0.15 ? 'start' : 'middle'
    })
    .attr('dominant-baseline', 'central')
    .attr('font-size', '12.5px')
    .attr('font-weight', '600')
    .attr('fill', d => d.color)
    .text(d => d.role)

  rootSel.transition()
    .delay((_, i) => i * 80)
    .duration(340)
    .ease(d3.easeCubicOut)
    .attr('opacity', 1)

  // ── 交互 ─────────────────────────────────────────────
  function highlight(pIdx: number | null) {
    if (pIdx === null) {
      linkSel.attr('stroke-opacity', 0.28).attr('stroke-width', 1.3)
      crownSel.attr('opacity', 1)
      rootSel.attr('opacity', 1)
    } else {
      linkSel
        .attr('stroke-opacity', d => d.parentIdx === pIdx ? 0.85 : 0.05)
        .attr('stroke-width',   d => d.parentIdx === pIdx ? 2.5  : 0.8)
      crownSel.attr('opacity', d => d.parentIdx === pIdx ? 1 : 0.15)
      rootSel .attr('opacity', (_, i) => i === pIdx ? 1 : 0.20)
    }
  }

  rootSel
    .on('mouseenter', (_, d) => highlight(d.idx))
    .on('mouseleave', () => highlight(null))
    .on('click',      (_, d) => emit('select-role', d.role))

  crownSel
    .on('mouseenter', (_, d) => highlight(d.parentIdx))
    .on('mouseleave', () => highlight(null))
    .on('click',      (_, d) => emit('select-role', d.role, d.track.label))
}

let ro: ResizeObserver | null = null

onMounted(() => {
  draw()
  ro = new ResizeObserver(draw)
  if (svgRef.value) ro.observe(svgRef.value)
})

onBeforeUnmount(() => { ro?.disconnect() })

watch(() => props.roles, draw)
</script>

<template>
  <svg ref="svgRef" class="d3-career-tree" aria-label="职业方向关系图" />
</template>

<style scoped>
.d3-career-tree {
  width: 100%;
  height: 540px;
  display: block;
  overflow: visible;
}
</style>
