<!-- D3 周学习量趋势图：面积+折线，强调时间上的成长 -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'

type WeeklyPoint = {
  label: string
  weekStart: string
  weekEnd: string
  minutes: number
}

const props = defineProps<{
  data: WeeklyPoint[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null

function draw() {
  const container = containerRef.value
  const svgEl = svgRef.value
  if (!container || !svgEl) return

  const width = container.clientWidth || 760
  const height = 280
  const margin = { top: 20, right: 16, bottom: 44, left: 44 }
  const innerW = Math.max(120, width - margin.left - margin.right)
  const innerH = Math.max(120, height - margin.top - margin.bottom)

  d3.select(svgEl).selectAll('*').remove()

  const svg = d3.select(svgEl)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  if (!props.data.length) {
    root.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-text-subtle, #9C8B78)')
      .attr('font-size', 12)
      .text('暂无周趋势数据')
    return
  }

  const x = d3.scalePoint<string>()
    .domain(props.data.map(d => d.label))
    .range([0, innerW])
    .padding(0.4)

  const maxVal = d3.max(props.data, d => d.minutes) ?? 0
  const y = d3.scaleLinear()
    .domain([0, Math.max(60, maxVal * 1.15)])
    .range([innerH, 0])
    .nice()

  root.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(g => g.selectAll('text').attr('font-size', 10).attr('fill', 'var(--color-text-subtle, #9C8B78)'))
    .call(g => g.select('.domain').attr('stroke', 'var(--color-border, #C8B89A)'))

  root.append('g')
    .call(d3.axisLeft(y).ticks(4).tickSizeOuter(0))
    .call(g => g.selectAll('text').attr('font-size', 10).attr('fill', 'var(--color-text-subtle, #9C8B78)'))
    .call(g => g.select('.domain').attr('stroke', 'var(--color-border, #C8B89A)'))
    .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(200,184,154,0.6)'))

  const area = d3.area<WeeklyPoint>()
    .x(d => x(d.label) ?? 0)
    .y0(innerH)
    .y1(d => y(d.minutes))
    .curve(d3.curveMonotoneX)

  const line = d3.line<WeeklyPoint>()
    .x(d => x(d.label) ?? 0)
    .y(d => y(d.minutes))
    .curve(d3.curveMonotoneX)

  const defs = svg.append('defs')
  const gradId = `weekly-area-${Math.random().toString(36).slice(2, 8)}`
  const grad = defs.append('linearGradient')
    .attr('id', gradId)
    .attr('x1', '0%')
    .attr('x2', '0%')
    .attr('y1', '0%')
    .attr('y2', '100%')
  grad.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(190,42,0,0.34)')
  grad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(190,42,0,0.04)')

  root.append('path')
    .datum(props.data)
    .attr('fill', `url(#${gradId})`)
    .attr('d', area)

  root.append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', 'var(--color-primary, #BE2A00)')
    .attr('stroke-width', 2)
    .attr('d', line)

  const tip = svg.append('g').style('display', 'none').attr('pointer-events', 'none')
  const tipRect = tip.append('rect')
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('fill', 'var(--color-text, #111)')
    .attr('opacity', 0.92)
    .attr('height', 24)
  const tipText = tip.append('text')
    .attr('fill', 'var(--parchment-100, #F5F5F3)')
    .attr('font-size', 10)
    .attr('dominant-baseline', 'middle')

  root.selectAll('circle.point')
    .data(props.data)
    .enter()
    .append('circle')
    .attr('class', 'point')
    .attr('cx', d => x(d.label) ?? 0)
    .attr('cy', d => y(d.minutes))
    .attr('r', d => (d.minutes === 0 ? 3.2 : 4.1))
    .attr('fill', d => (d.minutes === 0 ? 'var(--parchment-100, #F5F5F3)' : 'var(--color-primary, #BE2A00)'))
    .attr('stroke', 'var(--color-primary, #BE2A00)')
    .attr('stroke-width', 1.2)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event: MouseEvent, d) {
      d3.select(this).transition().duration(120).attr('r', 5.5)
      const text = `${d.weekStart} ~ ${d.weekEnd} · ${d.minutes} 分钟`
      tipText.text(text)
      const tw = (tipText.node()?.getComputedTextLength() ?? 120) + 14
      tipRect.attr('width', tw).attr('x', -tw / 2)
      tipText.attr('x', 0)
      const [mx, my] = d3.pointer(event, svgEl)
      tip.attr('transform', `translate(${mx},${Math.max(12, my - 14)})`).style('display', null)
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('r', 4.1)
      tip.style('display', 'none')
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
  <div ref="containerRef" class="weekly-trend-wrap">
    <svg ref="svgRef" class="weekly-trend-svg" />
  </div>
</template>

<style scoped>
.weekly-trend-wrap {
  width: 100%;
}

.weekly-trend-svg {
  width: 100%;
  display: block;
}
</style>
