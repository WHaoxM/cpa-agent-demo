<!-- D3 知识流向弦图 -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'

interface ChordLink {
  source: string
  target: string
  value: number
}

const props = defineProps<{
  data: ChordLink[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null

function draw() {
  const el = svgRef.value
  const container = containerRef.value
  if (!el || !container) return

  const width = container.clientWidth || 720
  const height = Math.max(360, Math.min(560, Math.round(width * 0.72)))
  const outerRadius = Math.min(width, height) * 0.34
  const innerRadius = outerRadius - 20

  d3.select(el).selectAll('*').remove()

  const svg = d3.select(el)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  const nodes = Array.from(new Set(props.data.flatMap(d => [d.source, d.target])))
  if (nodes.length < 3) {
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-text-subtle, #9C8B78)')
      .attr('font-size', 12)
      .text('至少需要 3 个知识点才能展示弦图')
    return
  }

  const matrix = Array.from({ length: nodes.length }, () => Array(nodes.length).fill(0))
  props.data.forEach(d => {
    const s = nodes.indexOf(d.source)
    const t = nodes.indexOf(d.target)
    if (s >= 0 && t >= 0) {
      const rowS = matrix[s]
      const rowT = matrix[t]
      if (!rowS || !rowT) return
      rowS[t] = (rowS[t] ?? 0) + d.value
      rowT[s] = (rowT[s] ?? 0) + d.value
    }
  })

  const color = d3.scaleOrdinal<string, string>()
    .domain(nodes)
    .range(['#8B2500', '#B8860B', '#4A7A5A', '#4A6B8A', '#A0937D', '#8C7B6B', '#7A5C3A', '#5A7A6A'])

  const chord = d3.chord()
    .padAngle(0.06)
    .sortSubgroups(d3.descending)

  const arcs = chord(matrix)
  const arc = d3.arc<d3.ChordGroup>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
  const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>()
    .radius(innerRadius)

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const ribbons = g.append('g')
    .attr('fill-opacity', 0.65)
    .selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', ribbon)
    .attr('fill', d => color(nodes[d.source.index] || ''))
    .attr('stroke', d => d3.color(color(nodes[d.source.index] || ''))?.darker(0.5).toString() || '#7a6a59')
    .attr('stroke-width', 0.5)
    .attr('opacity', 0.5)

  const group = g.append('g')
    .selectAll('g')
    .data(arcs.groups)
    .join('g')

  group.append('path')
    .attr('d', arc)
    .attr('fill', d => color(nodes[d.index] || ''))
    .attr('stroke', 'rgba(255,255,255,0.9)')
    .attr('stroke-width', 1.5)

  group.append('text')
    .each(d => {
      ;(d as d3.ChordGroup & { angle?: number }).angle = (d.startAngle + d.endAngle) / 2
    })
    .attr('dy', '0.35em')
    .attr('transform', d => {
      const angle = (((d as d3.ChordGroup & { angle?: number }).angle || 0) * 180 / Math.PI) - 90
      return `rotate(${angle}) translate(${outerRadius + 14}) ${((d as d3.ChordGroup & { angle?: number }).angle || 0) > Math.PI ? 'rotate(180)' : ''}`
    })
    .attr('text-anchor', d => (((d as d3.ChordGroup & { angle?: number }).angle || 0) > Math.PI ? 'end' : 'start'))
    .attr('font-size', 10)
    .attr('font-weight', '500')
    .attr('fill', '#4a3c30')
    .text(d => nodes[d.index] || '')

  group.on('mouseenter', (_event, d) => {
    ribbons.attr('opacity', r => (r.source.index === d.index || r.target.index === d.index ? 0.9 : 0.08))
  })

  group.on('mouseleave', () => {
    ribbons.attr('opacity', 0.5)
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
  <div ref="containerRef" class="chord-wrap">
    <svg ref="svgRef" class="chord-svg" />
  </div>
</template>

<style scoped>
.chord-wrap {
  width: 100%;
}

.chord-svg {
  width: 100%;
  display: block;
}
</style>
