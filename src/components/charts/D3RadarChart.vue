<!-- D3 技能雷达图：支持参考线、幽灵对比、多边形动效 -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'

interface RadarDatum {
  axis: string
  value: number
  ref?: number
}

const props = withDefaults(defineProps<{
  data: RadarDatum[]
  ghostData?: RadarDatum[]
  width?: number
  height?: number
  levels?: number
  showLegend?: boolean
}>(), {
  width: 340,
  height: 300,
  levels: 5,
  showLegend: true,
})

const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null
let rafId: number | null = null
let phase = 0

function clamp100(v: number): number {
  return Math.max(0, Math.min(100, v))
}

function organicOffset(index: number, t: number): number {
  return (Math.sin(index * 2.1 + t) * 0.5 + Math.cos(index * 1.7 - t) * 0.5) * 3
}

function draw() {
  const el = svgRef.value
  if (!el) return

  const W = el.clientWidth || props.width
  const H = el.clientHeight || props.height
  const margin = 52
  const radius = Math.max(24, Math.min(W, H) / 2 - margin)

  d3.select(el).selectAll('*').remove()

  const svg = d3.select(el)
    .attr('role', 'img')
    .attr('aria-label', '能力雷达图')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  const root = svg.append('g').attr('transform', `translate(${W / 2},${H / 2})`)

  const N = props.data.length
  if (!N) {
    root.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-text-subtle, #9C8B78)')
      .attr('font-size', 12)
      .text('上传简历后生成')
    return
  }

  const angleSlice = (Math.PI * 2) / N
  const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius])

  const defs = svg.append('defs')
  const gradId = `radar-gradient-${Math.random().toString(36).slice(2, 8)}`
  const grad = defs.append('radialGradient').attr('id', gradId)
  grad.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(190,42,0,0.03)')
  grad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(190,42,0,0.24)')

  const levels = props.levels
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = radius * (lvl / levels)
    const ringPoints = d3.range(N).map(i => {
      const angle = angleSlice * i - Math.PI / 2
      return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number]
    })
    root.append('polygon')
      .attr('points', ringPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', 'rgba(190,42,0,0.1)')
      .attr('stroke-width', 1)
  }

  const axisLines = root.append('g')
  const labels = root.append('g')
  props.data.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2
    const x = rScale(100) * Math.cos(angle)
    const y = rScale(100) * Math.sin(angle)
    axisLines.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', y)
      .attr('stroke', 'rgba(190,42,0,0.16)')
      .attr('stroke-width', 1)

    const labelR = radius + 16
    const lx = labelR * Math.cos(angle)
    const ly = labelR * Math.sin(angle)
    labels.append('text')
      .attr('x', lx)
      .attr('y', ly)
      .attr('text-anchor', Math.abs(lx) < 5 ? 'middle' : lx > 0 ? 'start' : 'end')
      .attr('dominant-baseline', Math.abs(ly) < 5 ? 'middle' : ly > 0 ? 'hanging' : 'auto')
      .attr('font-size', 10)
      .attr('fill', 'var(--color-text-muted, #666)')
      .text(d.axis)
  })

  const line = d3.lineRadial<number>()
    .angle((_d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed)

  const radarWrap = root.append('g').attr('transform', `rotate(-90)`)

  const refVals = props.data.map(d => clamp100(d.ref ?? 75))
  radarWrap.append('path')
    .datum(refVals)
    .attr('d', line.radius(v => rScale(v)))
    .attr('fill', 'rgba(201,162,39,0.06)')
    .attr('stroke', 'var(--color-gold, #C9A227)')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '6,3')

  if (props.ghostData?.length === N) {
    const ghostVals = props.ghostData.map(d => clamp100(d.value))
    radarWrap.append('path')
      .datum(ghostVals)
      .attr('d', line.radius(v => rScale(v)))
      .attr('fill', 'rgba(107,80,64,0.08)')
      .attr('stroke', 'rgba(107,80,64,0.65)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,2')
  }

  const userVals = props.data.map(d => clamp100(d.value))
  const userPath = radarWrap.append('path')
    .datum(userVals)
    .attr('fill', `url(#${gradId})`)
    .attr('stroke', 'var(--color-primary, #BE2A00)')
    .attr('stroke-width', 2.2)
    .attr('d', line.radius(() => 0))

  userPath.transition()
    .duration(700)
    .ease(d3.easeBounceOut)
    .attr('d', line.radius(v => rScale(v)))

  const tip = svg.append('g').style('display', 'none').attr('pointer-events', 'none')
  const tipRect = tip.append('rect')
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('fill', 'var(--color-text, #111)')
    .attr('opacity', 0.9)
    .attr('height', 24)
  const tipText = tip.append('text')
    .attr('fill', 'var(--parchment-100, #F5F5F3)')
    .attr('font-size', 10)
    .attr('dominant-baseline', 'middle')

  const dots = root.append('g')
  props.data.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2
    const r = rScale(clamp100(d.value))
    const cx = r * Math.cos(angle)
    const cy = r * Math.sin(angle)

    const dot = dots.append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 0)
      .attr('fill', 'var(--color-primary, #BE2A00)')
      .attr('stroke', 'var(--parchment-100, #F5F5F3)')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')

    dot.transition().delay(560).duration(180).attr('r', 4)

    dot.on('mouseenter', function (event: MouseEvent) {
      d3.select(this).transition().duration(120).attr('r', 7)
      const [mx, my] = d3.pointer(event, el)
      const txt = `${d.axis}：${clamp100(d.value)} / 参考 ${clamp100(d.ref ?? 75)}`
      tipText.text(txt)
      const tw = (tipText.node()?.getComputedTextLength() ?? 80) + 14
      tipRect.attr('width', tw).attr('x', -tw / 2)
      tipText.attr('x', 0)
      tip.attr('transform', `translate(${mx},${Math.max(12, my - 16)})`).style('display', null)
    })

    dot.on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('r', 4)
      tip.style('display', 'none')
    })
  })

  if (props.showLegend) {
    const legend = root.append('g').attr('transform', `translate(${-radius},${radius + 18})`)
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 4)
      .attr('x2', 14)
      .attr('y2', 4)
      .attr('stroke', 'var(--color-primary, #BE2A00)')
      .attr('stroke-width', 2)
    legend.append('text')
      .attr('x', 18)
      .attr('y', 4)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 10)
      .attr('fill', 'var(--color-text-muted, #666)')
      .text('当前')

    if (props.ghostData?.length === N) {
      legend.append('line')
        .attr('x1', 52)
        .attr('y1', 4)
        .attr('x2', 66)
        .attr('y2', 4)
        .attr('stroke', 'rgba(107,80,64,0.65)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,2')
      legend.append('text')
        .attr('x', 70)
        .attr('y', 4)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 10)
        .attr('fill', 'var(--color-text-muted, #666)')
        .text('上次')
    }

    legend.append('line')
      .attr('x1', 110)
      .attr('y1', 4)
      .attr('x2', 124)
      .attr('y2', 4)
      .attr('stroke', 'var(--color-gold, #C9A227)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,3')
    legend.append('text')
      .attr('x', 128)
      .attr('y', 4)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 10)
      .attr('fill', 'var(--color-text-muted, #666)')
      .text('岗位参考')
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const animate = () => {
    phase += 0.035
    userPath.attr('d', line.radius((v, i) => {
      const raw = clamp100(v) + organicOffset(i, phase)
      return rScale(clamp100(raw))
    }))
    rafId = requestAnimationFrame(animate)
  }

  rafId = requestAnimationFrame(animate)
}

onMounted(() => {
  draw()
  resizeObs = new ResizeObserver(() => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    draw()
  })
  if (svgRef.value?.parentElement) resizeObs.observe(svgRef.value.parentElement)
})

onUnmounted(() => {
  resizeObs?.disconnect()
  if (rafId) cancelAnimationFrame(rafId)
})

watch(() => [props.data, props.ghostData, props.levels], () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  draw()
}, { deep: true })
</script>

<template>
  <svg ref="svgRef" class="d3-radar" :width="width" :height="height" />
</template>

<style scoped>
.d3-radar {
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
