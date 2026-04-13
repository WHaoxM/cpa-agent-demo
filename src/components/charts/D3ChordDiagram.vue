<!-- D3 技能亲和力弦图 — 渐变 Ribbon + 横向标签 + 外弧刻度 + 高级 Hover -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps<{
  nodes: string[]
  matrix: number[][]
  pairCourses?: Map<string, string[]>
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null
let tooltipEl: HTMLDivElement | null = null
let uid = 0

const PALETTE = [
  '#C75C2A', '#2E7D5A', '#2E618F', '#9B59B6', '#B8860B',
  '#E67E22', '#1ABC9C', '#3498DB', '#8E44AD', '#D4A843',
  '#27AE60', '#2980B9', '#C0392B', '#16A085', '#F39C12',
  '#7F8C8D', '#6C3483', '#1F618D', '#A04000', '#148F77',
]

function draw() {
  const el = svgRef.value
  const container = containerRef.value
  if (!el || !container) return

  const nodes = props.nodes
  const matrix = props.matrix
  if (!nodes.length || !matrix.length) return

  const width = container.clientWidth || 600
  const height = container.clientHeight || 400
  const dim = Math.min(width, height)
  const labelMargin = Math.max(70, dim * 0.18)
  const outerRadius = (dim - labelMargin) / 2
  const innerRadius = outerRadius - Math.max(8, dim * 0.028)
  const tickRadius = outerRadius + 4

  const svg = d3.select(el)
  svg.selectAll('*').remove()
  const id = ++uid
  svg.attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  if (nodes.length < 3) {
    svg.append('text')
      .attr('x', width / 2).attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-text-subtle, #9C8B78)')
      .attr('font-size', 12)
      .text('技能数据不足，无法展示弦图')
    return
  }

  const color = d3.scaleOrdinal<string>().domain(nodes).range(PALETTE)

  const chordLayout = d3.chord()
    .padAngle(0.05)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending)

  const chords = chordLayout(matrix)

  const arcGen = d3.arc<d3.ChordGroup>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)

  const ribbonGen = d3.ribbon<d3.Chord, d3.ChordSubgroup>()
    .radius(innerRadius)

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  // ── defs: gradients + glow filter ──
  const defs = svg.append('defs')

  const glowFilter = defs.append('filter').attr('id', `glow-${id}`)
  glowFilter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur')
  const feMerge = glowFilter.append('feMerge')
  feMerge.append('feMergeNode').attr('in', 'coloredBlur')
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

  // ── radial gradient bg ──
  const bgGrad = defs.append('radialGradient').attr('id', `bg-rad-${id}`)
  bgGrad.append('stop').attr('offset', '0%').attr('stop-color', 'var(--color-primary-light, #f5ebe0)').attr('stop-opacity', 0.5)
  bgGrad.append('stop').attr('offset', '50%').attr('stop-color', 'var(--color-primary-light, #f5ebe0)').attr('stop-opacity', 0.2)
  bgGrad.append('stop').attr('offset', '100%').attr('stop-color', 'transparent').attr('stop-opacity', 0)

  // ── dot grid pattern ──
  const dotPat = defs.append('pattern')
    .attr('id', `dot-grid-${id}`)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 20).attr('height', 20)
  dotPat.append('circle')
    .attr('cx', 10).attr('cy', 10).attr('r', 0.8)
    .attr('fill', 'var(--color-text-subtle, #9C8B78)').attr('opacity', 0.3)

  // ── noise filter ──
  const noiseFilter = defs.append('filter').attr('id', `noise-${id}`)
    .attr('x', '0%').attr('y', '0%').attr('width', '100%').attr('height', '100%')
  noiseFilter.append('feTurbulence')
    .attr('type', 'fractalNoise').attr('baseFrequency', '0.65')
    .attr('numOctaves', '3').attr('stitchTiles', 'stitch')
  noiseFilter.append('feColorMatrix').attr('type', 'saturate').attr('values', '0')

  // ── Background layers (pointer-events: none 防止遮挡交互) ──
  const bgGroup = svg.append('g')
    .attr('class', 'chord-bg')
    .style('pointer-events', 'none')

  // radial glow
  bgGroup.append('circle')
    .attr('cx', width / 2).attr('cy', height / 2)
    .attr('r', outerRadius * 1.4)
    .attr('fill', `url(#bg-rad-${id})`)

  // concentric guide circles
  const guideG = bgGroup.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)
  const rings = [0.35, 0.55, 0.75, 1.0, 1.25]
  rings.forEach(ratio => {
    guideG.append('circle')
      .attr('r', innerRadius * ratio)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-text-subtle, #9C8B78)')
      .attr('stroke-opacity', ratio === 1.0 ? 0.18 : 0.09)
      .attr('stroke-width', ratio === 1.0 ? 1 : 0.5)
      .attr('stroke-dasharray', ratio < 1.0 ? '3,5' : 'none')
  })

  // cross-hair lines
  const crossLen = innerRadius * 1.2
  ;[0, 45, 90, 135].forEach(deg => {
    const rad = deg * Math.PI / 180
    guideG.append('line')
      .attr('x1', -crossLen * Math.cos(rad))
      .attr('y1', -crossLen * Math.sin(rad))
      .attr('x2', crossLen * Math.cos(rad))
      .attr('y2', crossLen * Math.sin(rad))
      .attr('stroke', 'var(--color-text-subtle, #9C8B78)')
      .attr('stroke-opacity', 0.07)
      .attr('stroke-width', 0.5)
  })

  // dot grid overlay
  bgGroup.append('rect')
    .attr('width', width).attr('height', height)
    .attr('fill', `url(#dot-grid-${id})`)

  // noise texture overlay
  bgGroup.append('rect')
    .attr('width', width).attr('height', height)
    .attr('filter', `url(#noise-${id})`)
    .attr('opacity', 0.06)

  chords.forEach(ch => {
    const si = ch.source.index
    const ti = ch.target.index
    const gradId = `cg${id}-${si}-${ti}`
    const sAngle = (ch.source.startAngle + ch.source.endAngle) / 2 - Math.PI / 2
    const tAngle = (ch.target.startAngle + ch.target.endAngle) / 2 - Math.PI / 2

    defs.append('linearGradient')
      .attr('id', gradId)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', innerRadius * Math.cos(sAngle))
      .attr('y1', innerRadius * Math.sin(sAngle))
      .attr('x2', innerRadius * Math.cos(tAngle))
      .attr('y2', innerRadius * Math.sin(tAngle))
      .selectAll('stop')
      .data([
        { offset: '0%', color: color(nodes[si] ?? '') },
        { offset: '100%', color: color(nodes[ti] ?? '') },
      ])
      .join('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)
  })

  // ── Ribbons ──
  const ribbons = g.append('g')
    .selectAll('path')
    .data(chords)
    .join('path')
    .attr('class', 'chord-ribbon')
    .attr('d', ribbonGen as any)
    .attr('fill', d => `url(#cg${id}-${d.source.index}-${d.target.index})`)
    .attr('fill-opacity', 0.5)
    .attr('stroke', 'rgba(255,255,255,0.15)')
    .attr('stroke-width', 0.5)
    .on('mouseenter', (evt: MouseEvent, d) => {
      const si = d.source.index
      const ti = d.target.index
      const key = si < ti ? `${si}-${ti}` : `${ti}-${si}`
      const portraits = props.pairCourses?.get(key) ?? []
      const val = Math.max(matrix[si]?.[ti] ?? 0, matrix[ti]?.[si] ?? 0)
      const colorS = color(nodes[si] ?? '')
      const colorT = color(nodes[ti] ?? '')
      const html = [
        `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">`,
        `<span style="width:8px;height:8px;border-radius:50%;background:${colorS};display:inline-block"></span>`,
        `<strong>${nodes[si]}</strong>`,
        `<span style="color:#aaa">↔</span>`,
        `<span style="width:8px;height:8px;border-radius:50%;background:${colorT};display:inline-block"></span>`,
        `<strong>${nodes[ti]}</strong>`,
        `</div>`,
        `<div style="color:#666;margin-bottom:3px">共 <b style="color:#333">${val}</b> 个岗位同时需要</div>`,
        portraits.length ? `<div style="color:#999;font-size:10px;border-top:1px solid #eee;padding-top:3px;margin-top:2px">${portraits.slice(0, 4).join('、')}${portraits.length > 4 ? '…' : ''}</div>` : '',
      ].join('')
      showTooltip(evt, html)

      ribbons.attr('fill-opacity', r =>
        (r.source.index === si && r.target.index === ti) ? 0.88 : 0.04)
      groups.select('.arc-path').attr('opacity', (gd: any) =>
        (gd.index === si || gd.index === ti) ? 1 : 0.15)
      labelTexts.attr('opacity', (gd: any) =>
        (gd.index === si || gd.index === ti) ? 1 : 0.15)
      tickGroups.attr('opacity', (gd: any) =>
        (gd.index === si || gd.index === ti) ? 1 : 0.1)
    })
    .on('mousemove', (evt: MouseEvent) => moveTooltip(evt))
    .on('mouseleave', () => {
      hideTooltip()
      resetHighlight()
    })

  // ── Arcs (groups) ──
  const groups = g.append('g')
    .selectAll('g')
    .data(chords.groups)
    .join('g')
    .style('cursor', 'pointer')

  groups.append('path')
    .attr('class', 'arc-path')
    .attr('d', arcGen)
    .attr('fill', d => color(nodes[d.index] ?? ''))
    .attr('stroke', 'rgba(255,255,255,0.9)')
    .attr('stroke-width', 1)

  // ── 外弧 Ticks ──
  const tickGroups = g.append('g')
    .selectAll('g')
    .data(chords.groups)
    .join('g')

  tickGroups.each(function (this: any, d: any) {
    const total = (matrix[d.index] ?? []).reduce((s: number, v: number) => s + v, 0)
    if (total === 0) return
    const groupAngle = d.endAngle - d.startAngle
    const step = groupAngle / Math.max(1, Math.min(total, 6))
    const ticks: number[] = []
    for (let a = d.startAngle; a < d.endAngle - step * 0.3; a += step) {
      ticks.push(a)
    }
    d3.select(this).selectAll('line')
      .data(ticks)
      .join('line')
      .attr('x1', (a: number) => Math.cos(a - Math.PI / 2) * outerRadius)
      .attr('y1', (a: number) => Math.sin(a - Math.PI / 2) * outerRadius)
      .attr('x2', (a: number) => Math.cos(a - Math.PI / 2) * tickRadius)
      .attr('y2', (a: number) => Math.sin(a - Math.PI / 2) * tickRadius)
      .attr('stroke', color(nodes[d.index] ?? ''))
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1)
  })

  // ── 横向标签 ──
  const labelTexts = g.append('g')
    .selectAll('text')
    .data(chords.groups)
    .join('text')
    .attr('class', 'chord-label')
    .each((d: any) => {
      d._midAngle = (d.startAngle + d.endAngle) / 2
    })
    .attr('x', (d: any) => {
      const r = outerRadius + 14
      return Math.cos(d._midAngle - Math.PI / 2) * r
    })
    .attr('y', (d: any) => {
      const r = outerRadius + 14
      return Math.sin(d._midAngle - Math.PI / 2) * r
    })
    .attr('text-anchor', (d: any) => {
      const angle = d._midAngle
      if (angle < 0.3 || angle > Math.PI * 2 - 0.3) return 'middle'
      if (angle > Math.PI - 0.3 && angle < Math.PI + 0.3) return 'middle'
      return angle > Math.PI ? 'end' : 'start'
    })
    .attr('dominant-baseline', (d: any) => {
      const angle = d._midAngle
      if (angle < 0.5) return 'auto'
      if (angle > Math.PI * 2 - 0.5) return 'auto'
      if (angle > Math.PI - 0.5 && angle < Math.PI + 0.5) return 'hanging'
      return 'middle'
    })
    .attr('font-size', dim > 400 ? 10 : dim > 300 ? 9 : 7)
    .attr('font-weight', '600')
    .attr('fill', 'var(--color-text, #2d2d2d)')
    .text(d => nodes[d.index] ?? '')

  // ── 共现数值标注（标签旁） ──
  g.append('g')
    .selectAll('text')
    .data(chords.groups)
    .join('text')
    .each((d: any) => {
      d._midAngle2 = (d.startAngle + d.endAngle) / 2
    })
    .attr('x', (d: any) => {
      const r = outerRadius + 14
      return Math.cos(d._midAngle2 - Math.PI / 2) * r
    })
    .attr('y', (d: any) => {
      const r = outerRadius + 14
      return Math.sin(d._midAngle2 - Math.PI / 2) * r + (dim > 400 ? 12 : 10)
    })
    .attr('text-anchor', (d: any) => {
      const angle = d._midAngle2
      if (angle < 0.3 || angle > Math.PI * 2 - 0.3) return 'middle'
      if (angle > Math.PI - 0.3 && angle < Math.PI + 0.3) return 'middle'
      return angle > Math.PI ? 'end' : 'start'
    })
    .attr('font-size', dim > 400 ? 8 : 7)
    .attr('fill', 'var(--color-text-subtle, #9C8B78)')
    .text(d => {
      const total = (matrix[d.index] ?? []).reduce((s: number, v: number) => s + v, 0)
      return total > 0 ? `${total} 关联` : ''
    })

  // ── Group hover ──
  groups.on('mouseenter', (evt: MouseEvent, d) => {
    const idx = d.index
    const total = (matrix[idx] ?? []).reduce((s: number, v: number) => s + v, 0)
    const linked = chords.filter(c => c.source.index === idx || c.target.index === idx)
      .map(c => {
        const other = c.source.index === idx ? c.target.index : c.source.index
        return nodes[other] ?? ''
      })
    const html = [
      `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">`,
      `<span style="width:10px;height:10px;border-radius:50%;background:${color(nodes[idx] ?? '')};display:inline-block"></span>`,
      `<strong style="font-size:12px">${nodes[idx]}</strong>`,
      `</div>`,
      `<div style="color:#666">被 <b style="color:#333">${total}</b> 个岗位需要</div>`,
      linked.length ? `<div style="color:#999;font-size:10px;margin-top:3px">关联: ${linked.join('、')}</div>` : '',
    ].join('')
    showTooltip(evt, html)

    ribbons.attr('fill-opacity', r =>
      (r.source.index === idx || r.target.index === idx) ? 0.85 : 0.03)
    groups.select('.arc-path').attr('opacity', (gd: any) => {
      if (gd.index === idx) return 1
      const hasLink = chords.some(c =>
        (c.source.index === idx && c.target.index === gd.index) ||
        (c.target.index === idx && c.source.index === gd.index))
      return hasLink ? 0.8 : 0.12
    })
    labelTexts.attr('opacity', (gd: any) => {
      if (gd.index === idx) return 1
      const hasLink = chords.some(c =>
        (c.source.index === idx && c.target.index === gd.index) ||
        (c.target.index === idx && c.source.index === gd.index))
      return hasLink ? 1 : 0.15
    })
    tickGroups.attr('opacity', (gd: any) => {
      if (gd.index === idx) return 1
      return 0.1
    })
  })
    .on('mousemove', (evt: MouseEvent) => moveTooltip(evt))
    .on('mouseleave', () => {
      hideTooltip()
      resetHighlight()
    })

  function resetHighlight() {
    ribbons.attr('fill-opacity', 0.5)
    groups.select('.arc-path').attr('opacity', 1)
    labelTexts.attr('opacity', 1)
    tickGroups.attr('opacity', 1)
  }

  // ── 入场动画 ──
  ribbons.attr('opacity', 0)
    .transition().duration(700).delay((_, i) => i * 20)
    .attr('opacity', 1)

  groups.select('.arc-path')
    .attr('opacity', 0)
    .transition().duration(400).delay((_, i) => i * 30)
    .attr('opacity', 1)

  labelTexts.attr('opacity', 0)
    .transition().duration(400).delay((_, i) => 200 + i * 30)
    .attr('opacity', 1)
}

/* ── Tooltip helpers ── */
function ensureTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.style.cssText = [
      'position:fixed;pointer-events:none;z-index:9999;',
      'padding:10px 14px;border-radius:8px;font-size:11px;line-height:1.7;',
      'background:rgba(255,255,255,0.97);color:#222;',
      'border:1px solid rgba(0,0,0,0.06);',
      'box-shadow:0 8px 32px rgba(0,0,0,0.16);',
      'max-width:280px;display:none;backdrop-filter:blur(8px);',
    ].join('')
    document.body.appendChild(tooltipEl)
  }
}

function showTooltip(evt: MouseEvent, html: string) {
  ensureTooltip()
  if (!tooltipEl) return
  tooltipEl.innerHTML = html
  tooltipEl.style.display = 'block'
  moveTooltip(evt)
}

function moveTooltip(evt: MouseEvent) {
  if (!tooltipEl) return
  const x = evt.clientX + 18
  const y = evt.clientY - 14
  const vw = window.innerWidth
  const rect = tooltipEl.getBoundingClientRect()
  tooltipEl.style.left = `${x + rect.width > vw - 8 ? evt.clientX - rect.width - 12 : x}px`
  tooltipEl.style.top = `${y}px`
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = 'none'
}

onMounted(() => {
  nextTick(() => draw())
  resizeObs = new ResizeObserver(() => draw())
  if (containerRef.value) resizeObs.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObs?.disconnect()
  hideTooltip()
  if (tooltipEl) { tooltipEl.remove(); tooltipEl = null }
})

watch([() => props.nodes, () => props.matrix], () => nextTick(() => draw()), { deep: true })
</script>

<template>
  <div ref="containerRef" class="chord-wrap">
    <svg ref="svgRef" class="chord-svg" />
    <div v-if="!nodes.length" class="chord-empty">暂无技能数据</div>
  </div>
</template>

<style scoped>
.chord-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.chord-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.chord-svg :deep(.chord-ribbon) {
  transition: fill-opacity 0.25s ease;
}

.chord-svg :deep(.arc-path) {
  transition: opacity 0.25s ease;
}

.chord-svg :deep(.chord-label) {
  transition: opacity 0.25s ease;
}

.chord-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-text-subtle, #9C8B78);
}
</style>
