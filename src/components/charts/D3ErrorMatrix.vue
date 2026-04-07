<!-- D3 错题矩阵热力图：知识点 × 难度 -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'

interface MatrixDatum {
  knowledgePoint: string
  difficulty: 'easy' | 'medium' | 'hard'
  times: number
  lastWrongAt?: string
  careerImpact?: 'high' | 'medium' | 'low'
}

const props = defineProps<{
  data: MatrixDatum[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null
let pulseTimer: number | null = null

const difficulties: Array<MatrixDatum['difficulty']> = ['easy', 'medium', 'hard']
const diffLabel: Record<MatrixDatum['difficulty'], string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

function draw() {
  const el = svgRef.value
  const container = containerRef.value
  if (!el || !container) return

  if (pulseTimer) {
    window.clearInterval(pulseTimer)
    pulseTimer = null
  }

  const width = container.clientWidth || 760
  const knowledgePoints = [...new Set(props.data.map(d => d.knowledgePoint))].slice(0, 12)
  const rowH = 32
  const margin = { top: 40, right: 40, bottom: 20, left: 110 }
  const innerW = Math.max(260, width - margin.left - margin.right)
  const innerH = Math.max(80, knowledgePoints.length * rowH)
  const height = margin.top + innerH + margin.bottom

  d3.select(el).selectAll('*').remove()

  const svg = d3.select(el)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  if (!knowledgePoints.length) {
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-text-subtle, #9C8B78)')
      .attr('font-size', 12)
      .text('还没有错题记录 · 完成一次测验后自动更新')
    return
  }

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleBand<string>()
    .domain(difficulties)
    .range([0, innerW])
    .padding(0.16)

  const y = d3.scaleBand<string>()
    .domain(knowledgePoints)
    .range([0, innerH])
    .padding(0.16)

  const colorScale = d3.scaleThreshold<number, string>()
    .domain([1, 2, 3, 4])
    .range([
      '#ebedf0',
      'rgba(190,42,0,0.2)',
      'rgba(190,42,0,0.5)',
      'rgba(190,42,0,0.8)',
      '#BE2A00',
    ])

  const fullData = knowledgePoints.flatMap(kp => difficulties.map(diff => {
    const found = props.data.find(d => d.knowledgePoint === kp && d.difficulty === diff)
    return found ?? {
      knowledgePoint: kp,
      difficulty: diff,
      times: 0,
      lastWrongAt: '',
      careerImpact: 'low' as const,
    }
  }))

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

  const rects = g.selectAll('rect.cell')
    .data(fullData)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', d => x(d.difficulty) ?? 0)
    .attr('y', d => y(d.knowledgePoint) ?? 0)
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('rx', 4)
    .attr('fill', d => colorScale(d.times))
    .style('cursor', 'default')

  rects.on('mouseenter', function (event: MouseEvent, d) {
    d3.select(this).transition().duration(120).attr('transform', 'scale(1.04)')
    const label = `${d.knowledgePoint} × ${diffLabel[d.difficulty]} · 错了${d.times}次`
    tipText.text(label)
    const tw = (tipText.node()?.getComputedTextLength() ?? 100) + 14
    tipRect.attr('width', tw).attr('x', -tw / 2)
    tipText.attr('x', 0)
    const [mx, my] = d3.pointer(event, el)
    tip.attr('transform', `translate(${mx},${Math.max(14, my - 14)})`).style('display', null)
  })

  rects.on('mouseleave', function () {
    d3.select(this).transition().duration(120).attr('transform', null)
    tip.style('display', 'none')
  })

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const dangerRects = rects.filter(d => d.times >= 3)
    let lowOpacity = false
    pulseTimer = window.setInterval(() => {
      lowOpacity = !lowOpacity
      dangerRects
        .transition()
        .duration(600)
        .ease(d3.easeQuadInOut)
        .attr('opacity', lowOpacity ? 0.5 : 1)
    }, 760)
  }

  const xAxis = g.append('g')
  difficulties.forEach(diff => {
    xAxis.append('text')
      .attr('x', (x(diff) ?? 0) + x.bandwidth() / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', 'var(--color-text-muted, #6B5040)')
      .text(diffLabel[diff])
  })

  const yAxis = g.append('g')
  knowledgePoints.forEach(kp => {
    const impact = props.data.find(d => d.knowledgePoint === kp)?.careerImpact ?? 'low'
    yAxis.append('text')
      .attr('x', -8)
      .attr('y', (y(kp) ?? 0) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 11)
      .attr('fill', 'var(--color-text, #1C1612)')
      .text(kp)

    yAxis.append('circle')
      .attr('cx', -18)
      .attr('cy', (y(kp) ?? 0) + y.bandwidth() / 2)
      .attr('r', 3)
      .attr('fill', impact === 'high'
        ? 'var(--color-primary, #BE2A00)'
        : impact === 'medium'
          ? 'var(--color-gold, #C9A227)'
          : 'var(--color-text-subtle, #9C8B78)')
  })
}

onMounted(() => {
  draw()
  resizeObs = new ResizeObserver(() => draw())
  if (containerRef.value) resizeObs.observe(containerRef.value)
})

onUnmounted(() => resizeObs?.disconnect())

onUnmounted(() => {
  if (pulseTimer) {
    window.clearInterval(pulseTimer)
    pulseTimer = null
  }
})

watch(() => props.data, () => draw(), { deep: true })
</script>

<template>
  <div ref="containerRef" class="error-matrix-wrap">
    <svg ref="svgRef" class="error-matrix-svg" />
  </div>
</template>

<style scoped>
.error-matrix-wrap {
  width: 100%;
}

.error-matrix-svg {
  width: 100%;
  display: block;
}
</style>
