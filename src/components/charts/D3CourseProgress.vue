<!-- D3 课程进度分布：突出当前在学内容与完成程度 -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'

type CourseProgressDatum = {
  id: string
  title: string
  progress: number
  updatedAt?: string
}

const props = defineProps<{
  data: CourseProgressDatum[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null

function barColor(p: number): string {
  if (p >= 100) return '#4A6741'
  if (p >= 70) return '#BE2A00'
  if (p >= 30) return '#1B4E79'
  return '#9C8B78'
}

function draw() {
  const container = containerRef.value
  const svgEl = svgRef.value
  if (!container || !svgEl) return

  const width = container.clientWidth || 760
  const rowH = 32
  const margin = { top: 14, right: 22, bottom: 8, left: 150 }
  const rows = Math.max(props.data.length, 1)
  const height = margin.top + margin.bottom + rows * rowH
  const innerW = Math.max(160, width - margin.left - margin.right)

  d3.select(svgEl).selectAll('*').remove()

  const svg = d3.select(svgEl)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  if (!props.data.length) {
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-text-subtle, #9C8B78)')
      .attr('font-size', 12)
      .text('暂无课程进度数据')
    return
  }

  const y = d3.scaleBand<string>()
    .domain(props.data.map(d => d.id))
    .range([0, rows * rowH])
    .padding(0.3)

  const x = d3.scaleLinear().domain([0, 100]).range([0, innerW])

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

  root.selectAll('rect.bg')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'bg')
    .attr('x', 0)
    .attr('y', d => y(d.id) ?? 0)
    .attr('width', innerW)
    .attr('height', y.bandwidth())
    .attr('rx', 6)
    .attr('fill', 'rgba(200,184,154,0.32)')

  const bars = root.selectAll('rect.fg')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'fg')
    .attr('x', 0)
    .attr('y', d => y(d.id) ?? 0)
    .attr('width', 0)
    .attr('height', y.bandwidth())
    .attr('rx', 6)
    .attr('fill', d => barColor(d.progress))
    .style('cursor', 'pointer')

  bars.transition()
    .duration(380)
    .ease(d3.easeCubicOut)
    .attr('width', d => x(Math.max(0, Math.min(100, d.progress))))

  root.selectAll('text.label')
    .data(props.data)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', -10)
    .attr('y', d => (y(d.id) ?? 0) + y.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 11)
    .attr('fill', 'var(--color-text, #1C1612)')
    .text(d => d.title.length > 14 ? `${d.title.slice(0, 14)}…` : d.title)

  root.selectAll('text.value')
    .data(props.data)
    .enter()
    .append('text')
    .attr('class', 'value')
    .attr('x', d => x(Math.min(100, d.progress)) + 6)
    .attr('y', d => (y(d.id) ?? 0) + y.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 11)
    .attr('font-weight', 700)
    .attr('fill', 'var(--color-text-muted, #6B5040)')
    .text(d => `${Math.round(d.progress)}%`)

  bars
    .on('mouseenter', function (event: MouseEvent, d) {
      d3.select(this).transition().duration(120).attr('opacity', 0.88)
      const text = `${d.title} · 进度 ${Math.round(d.progress)}%`
      tipText.text(text)
      const tw = (tipText.node()?.getComputedTextLength() ?? 120) + 14
      tipRect.attr('width', tw).attr('x', -tw / 2)
      tipText.attr('x', 0)
      const [mx, my] = d3.pointer(event, svgEl)
      tip.attr('transform', `translate(${mx},${Math.max(12, my - 14)})`).style('display', null)
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('opacity', 1)
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
  <div ref="containerRef" class="course-progress-wrap">
    <svg ref="svgRef" class="course-progress-svg" />
  </div>
</template>

<style scoped>
.course-progress-wrap {
  width: 100%;
}

.course-progress-svg {
  width: 100%;
  display: block;
}
</style>
