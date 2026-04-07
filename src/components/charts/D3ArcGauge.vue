<!-- D3 半圆弧量规：展示能力值与目标值差距 -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'

interface GaugeDatum {
  name: string
  value: number
  target: number
  suggestion?: string
}

const props = defineProps<{
  data: GaugeDatum[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v))
}

function draw() {
  const el = svgRef.value
  const container = containerRef.value
  if (!el || !container) return

  const width = container.clientWidth || 680
  const compact = width < 600
  const rowH = compact ? 44 : 56
  const height = Math.max(100, props.data.length * rowH + 20)

  d3.select(el).selectAll('*').remove()

  const svg = d3.select(el)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  if (!props.data.length) {
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-text-subtle, #9C8B78)')
      .attr('font-size', 12)
      .text('暂无能力差距数据')
    return
  }

  const labelX = 16
  const gaugeX = compact ? 160 : 190
  const gaugeRadius = 28

  const tip = svg.append('g').style('display', 'none').attr('pointer-events', 'none')
  const tipRect = tip.append('rect')
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('fill', 'var(--color-text, #1C1612)')
    .attr('opacity', 0.92)
    .attr('height', 24)
  const tipText = tip.append('text')
    .attr('fill', 'var(--parchment-100, #F5EFE0)')
    .attr('font-size', 10)
    .attr('dominant-baseline', 'middle')

  props.data.forEach((item, idx) => {
    const y = 20 + idx * rowH
    const value = clamp(item.value)
    const target = Math.max(1, clamp(item.target))
    const ratio = value / target

    if (compact) {
      const barX = 120
      const barW = Math.max(120, width - 180)
      const valW = Math.min(barW, barW * Math.min(ratio, 1.2))

      svg.append('text')
        .attr('x', 12)
        .attr('y', y + 16)
        .attr('fill', 'var(--color-text, #1C1612)')
        .attr('font-size', 11)
        .attr('font-weight', 600)
        .text(item.name)

      svg.append('rect')
        .attr('x', barX)
        .attr('y', y + 8)
        .attr('width', barW)
        .attr('height', 8)
        .attr('rx', 4)
        .attr('fill', 'var(--color-border, #C8B89A)')

      const bar = svg.append('rect')
        .attr('x', barX)
        .attr('y', y + 8)
        .attr('width', 0)
        .attr('height', 8)
        .attr('rx', 4)
        .attr('fill', ratio >= 1 ? 'var(--color-gold, #C9A227)' : 'var(--color-primary, #BE2A00)')

      bar.transition().duration(360).ease(d3.easeCubicOut).attr('width', valW)

      svg.append('text')
        .attr('x', barX)
        .attr('y', y + 28)
        .attr('font-size', 10)
        .attr('fill', 'var(--color-text-muted, #6B5040)')
        .text(`${Math.round(value)} / 目标 ${Math.round(target)}`)

      return
    }

    svg.append('text')
      .attr('x', labelX)
      .attr('y', y + 18)
      .attr('fill', 'var(--color-text, #1C1612)')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .text(item.name)

    const g = svg.append('g').attr('transform', `translate(${gaugeX},${y + 30})`)

    const baseArc = d3.arc<{ endAngle: number }>()
      .innerRadius(gaugeRadius - 4)
      .outerRadius(gaugeRadius + 2)
      .startAngle(-Math.PI)

    g.append('path')
      .datum({ endAngle: 0 })
      .attr('d', baseArc)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-border, #C8B89A)')
      .attr('stroke-width', 6)

    const endAngle = -Math.PI + Math.min(1.2, ratio) * Math.PI

    const activePath = g.append('path')
      .datum({ endAngle: -Math.PI })
      .attr('d', baseArc)
      .attr('fill', 'none')
      .attr('stroke', ratio >= 1 ? 'var(--color-gold, #C9A227)' : 'var(--color-primary, #BE2A00)')
      .attr('stroke-width', 6)
      .attr('stroke-linecap', 'round')
      .style('cursor', 'pointer')

    activePath.transition()
      .duration(420)
      .ease(d3.easeCubicOut)
      .attrTween('d', () => {
        const interpolate = d3.interpolate(-Math.PI, endAngle)
        return t => baseArc({ endAngle: interpolate(t) }) || ''
      })

    activePath.on('mouseenter', function (event: MouseEvent) {
      d3.select(this).transition().duration(120).attr('stroke-width', 8)
      const gap = Math.max(0, target - value)
      const text = gap > 0
        ? `${item.name}：差距 ${gap} 分 · ${item.suggestion ?? '建议强化练习'}`
        : `${item.name}：已超过目标 ${Math.round(value - target)} 分`
      tipText.text(text)
      const tw = (tipText.node()?.getComputedTextLength() ?? 120) + 14
      tipRect.attr('width', tw).attr('x', -tw / 2)
      tipText.attr('x', 0)
      const [mx, my] = d3.pointer(event, el)
      tip.attr('transform', `translate(${mx},${Math.max(12, my - 14)})`).style('display', null)
    })

    activePath.on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('stroke-width', 6)
      tip.style('display', 'none')
    })

    svg.append('text')
      .attr('x', gaugeX + 48)
      .attr('y', y + 16)
      .attr('font-size', 11)
      .attr('fill', 'var(--color-text-muted, #6B5040)')
      .text(`${Math.round(value)} / 目标 ${Math.round(target)}`)
  })
}

onMounted(() => {
  draw()
  resizeObs = new ResizeObserver(() => draw())
  if (containerRef.value) resizeObs.observe(containerRef.value)
})

onUnmounted(() => resizeObs?.disconnect())

watch(() => props.data, () => draw(), { deep: true })
</script>

<template>
  <div ref="containerRef" class="arc-gauge-wrap">
    <svg ref="svgRef" class="arc-gauge-svg" />
  </div>
</template>

<style scoped>
.arc-gauge-wrap {
  width: 100%;
}

.arc-gauge-svg {
  width: 100%;
  display: block;
}
</style>
