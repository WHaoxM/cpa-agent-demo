<!-- D3 学习热力日历（GitHub 风格 52×7），支持周悬停摘要 -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'

interface DayRecord {
  date: string   // 'YYYY-MM-DD'
  minutes: number
}

const props = withDefaults(defineProps<{
  data: DayRecord[]
  weeks?: number
}>(), { weeks: 52 })

const emit = defineEmits<{
  weekHover: [payload: { weekMinutes: number; days: { date: string; minutes: number }[] }]
  dayClick: [payload: { date: string; minutes: number }]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null

const CELL = 11
const GAP = 2
const STEP = CELL + GAP
const DAYS_LABEL = ['日', '一', '二', '三', '四', '五', '六']

function buildDayMap(): Map<string, number> {
  const m = new Map<string, number>()
  for (const d of props.data) m.set(d.date, (m.get(d.date) ?? 0) + d.minutes)
  return m
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function draw() {
  const el = svgRef.value
  const container = containerRef.value
  if (!el || !container) return

  const W = container.clientWidth || 540
  const weeks = props.weeks
  const paddingLeft = 22  // day labels
  const paddingTop = 18   // week labels (Mon/Wed/Fri)
  const H = STEP * 7 + paddingTop + 34

  d3.select(el).selectAll('*').remove()

  const svg = d3.select(el)
    .attr('width', W)
    .attr('height', H)

  const g = svg.append('g').attr('transform', `translate(${paddingLeft},${paddingTop})`)

  // build date grid (ending today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDay = new Date(today)
  startDay.setDate(today.getDate() - weeks * 7 + 1)

  const dayMap = buildDayMap()
  const maxMin = d3.max([...dayMap.values()]) ?? 60

  const colorScale = d3.scaleThreshold<number, string>()
    .domain([1, 20, 45, 90])
    .range([
      'var(--color-border, #C8B89A)',
      'rgba(190,42,0,0.15)',
      'rgba(190,42,0,0.4)',
      'rgba(190,42,0,0.7)',
      'var(--color-primary, #BE2A00)',
    ])

  // collect cells
  const cells: { date: string; minutes: number; col: number; row: number }[] = []
  const cur = new Date(startDay)
  let col = 0
  let prevWeek = -1
  while (cur <= today) {
    const dayOfWeek = cur.getDay() // 0=Sun
    if (dayOfWeek === 0 && prevWeek !== -1) col++
    prevWeek = dayOfWeek
    cells.push({
      date: isoDate(cur),
      minutes: dayMap.get(isoDate(cur)) ?? 0,
      col,
      row: dayOfWeek,
    })
    cur.setDate(cur.getDate() + 1)
  }

  const totalCols = (col + 1)
  const cellW = Math.min(CELL, (W - paddingLeft - 4) / totalCols - GAP)
  const cellStep = cellW + GAP

  // ── day-of-week labels ──
  DAYS_LABEL.forEach((label, i) => {
    if (i % 2 === 0) {
      g.append('text')
        .attr('x', -6).attr('y', i * STEP + CELL / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 9)
        .attr('fill', 'var(--color-text-subtle, #9C8B78)')
        .text(label)
    }
  })

  // ── month labels（按该月学习总时长加权透明度） ──
  const monthMinutes = new Map<string, number>()
  cells.forEach(c => {
    const month = c.date.slice(0, 7)
    monthMinutes.set(month, (monthMinutes.get(month) ?? 0) + c.minutes)
  })
  const monthMax = d3.max([...monthMinutes.values()]) ?? 1

  const monthsSeen = new Set<string>()
  cells.forEach(c => {
    if (c.row === 0) {
      const month = c.date.substring(0, 7)
      if (!monthsSeen.has(month)) {
        monthsSeen.add(month)
        g.append('text')
          .attr('x', c.col * cellStep)
          .attr('y', -5)
          .attr('font-size', 9)
          .attr('fill', 'var(--color-text-subtle, #9C8B78)')
          .attr('opacity', 0.4 + ((monthMinutes.get(month) ?? 0) / monthMax) * 0.6)
          .text(c.date.substring(5, 7) + '月')
      }
    }
  })

  // ── cells ──
  const tip = svg.append('g').style('display', 'none').attr('pointer-events', 'none')
  const tipRect = tip.append('rect').attr('rx', 3).attr('ry', 3)
    .attr('fill', 'var(--color-text, #1C1612)').attr('opacity', 0.85).attr('height', 22)
  const tipText = tip.append('text').attr('fill', 'var(--parchment-100, #F5EFE0)')
    .attr('font-size', 10).attr('dominant-baseline', 'middle')

  const rects = g.selectAll('rect.cell')
    .data(cells)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', d => d.col * cellStep)
    .attr('y', d => d.row * STEP)
    .attr('width', cellW)
    .attr('height', cellW)
    .attr('rx', 2)
    .attr('fill', d => colorScale(d.minutes))
    .attr('opacity', 0)
    .style('cursor', 'default')

  rects.transition()
    .delay((_d, i) => i * 1.5)
    .duration(200)
    .attr('opacity', 1)

  const weekMap = new Map<number, { date: string; minutes: number }[]>()
  cells.forEach(c => {
    const list = weekMap.get(c.col) ?? []
    list.push({ date: c.date, minutes: c.minutes })
    weekMap.set(c.col, list)
  })

  // 连续学习 >= 7 天的下划线轨迹
  const streakLayer = g.append('g').attr('opacity', 0.85)
  let currentRun: typeof cells = []
  const drawRun = (run: typeof cells) => {
    if (run.length < 7) return
    const points = run.map(item => [
      item.col * cellStep + cellW / 2,
      item.row * STEP + cellW + 2,
    ] as [number, number])
    streakLayer.append('path')
      .attr('d', d3.line<[number, number]>()(points) ?? '')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(190,42,0,0.5)')
      .attr('stroke-width', 1.3)
      .attr('stroke-linecap', 'round')
  }

  cells.forEach(item => {
    if (item.minutes > 0) {
      currentRun.push(item)
    }
    else {
      drawRun(currentRun)
      currentRun = []
    }
  })
  drawRun(currentRun)

  const miniWeekWrap = svg.append('g')
    .style('display', 'none')

  const miniBg = miniWeekWrap.append('rect')
    .attr('x', Math.max(0, W - 98))
    .attr('y', 4)
    .attr('width', 94)
    .attr('height', 36)
    .attr('rx', 6)
    .attr('fill', 'rgba(28,22,18,0.75)')

  const miniBarG = miniWeekWrap.append('g')
  const miniScaleX = d3.scaleBand<number>().domain([0, 1, 2, 3, 4, 5, 6]).range([0, 70]).padding(0.25)

  const miniBars = miniBarG.selectAll('rect')
    .data([0, 0, 0, 0, 0, 0, 0])
    .enter()
    .append('rect')
    .attr('x', (_d, i) => (miniScaleX(i) ?? 0))
    .attr('y', 14)
    .attr('width', miniScaleX.bandwidth())
    .attr('height', 0)
    .attr('rx', 2)
    .attr('fill', 'rgba(201,162,39,0.9)')

  miniBarG.attr('transform', `translate(${Math.max(0, W - 86)},8)`)
  miniWeekWrap.append('text')
    .attr('x', Math.max(0, W - 82))
    .attr('y', 14)
    .attr('font-size', 9)
    .attr('fill', 'rgba(245,239,224,0.95)')
    .text('本周节奏')

  rects
    .on('mouseenter', function (event: MouseEvent, d) {
      const label = d.minutes > 0 ? `${d.date} · ${d.minutes}分钟` : `${d.date} · 未学习`
      tipText.text(label)
      const tw = (tipText.node()?.getComputedTextLength() ?? 80) + 12
      tipRect.attr('width', tw).attr('x', -tw / 2)
      tipText.attr('x', 0)
      const [mx, my] = d3.pointer(event, el)
      tip.attr('transform', `translate(${mx},${Math.max(12, my - 14)})`).style('display', null)

      const days = weekMap.get(d.col) ?? []
      const weekMinutes = days.reduce((sum, item) => sum + item.minutes, 0)
      emit('weekHover', { weekMinutes, days })

      if (W >= 620) {
        miniWeekWrap.style('display', null)
        const miniScaleY = d3.scaleLinear()
          .domain([0, Math.max(1, d3.max(days.map(i => i.minutes)) ?? 1)])
          .range([14, 2])
        miniBars
          .data(days.map(i => i.minutes))
          .attr('y', val => miniScaleY(val))
          .attr('height', val => Math.max(1, 14 - miniScaleY(val)))
      }
    })
    .on('mouseleave', () => {
      tip.style('display', 'none')
      miniWeekWrap.style('display', 'none')
      emit('weekHover', { weekMinutes: 0, days: [] })
    })
    .on('click', (_event: MouseEvent, d) => {
      emit('dayClick', { date: d.date, minutes: d.minutes })
    })

  const todayCell = cells.find(c => c.date === isoDate(today))
  if (todayCell) {
    const todayOutline = g.append('rect')
      .attr('x', todayCell.col * cellStep - 1)
      .attr('y', todayCell.row * STEP - 1)
      .attr('width', cellW + 2)
      .attr('height', cellW + 2)
      .attr('rx', 3)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-primary, #BE2A00)')
      .attr('stroke-width', 1.5)

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const loop = () => {
        todayOutline
          .transition()
          .duration(900)
          .ease(d3.easeQuadInOut)
          .attr('opacity', 0.35)
          .transition()
          .duration(900)
          .ease(d3.easeQuadInOut)
          .attr('opacity', 1)
          .on('end', loop)
      }
      loop()
    }
  }

  // ── legend ──
  const legendG = svg.append('g').attr('transform', `translate(${paddingLeft},${H - 14})`)
  legendG.append('text').attr('y', 8).attr('font-size', 9).attr('fill', 'var(--color-text-subtle, #9C8B78)').text('学习较少')
  const steps = 5
  for (let s = 0; s < steps; s++) {
    const pct = s / (steps - 1)
    legendG.append('rect')
      .attr('x', 18 + s * (cellW + 2)).attr('y', 0)
      .attr('width', cellW).attr('height', cellW)
      .attr('rx', 2)
      .attr('fill', colorScale(pct * maxMin))
  }
  legendG.append('text').attr('x', 18 + steps * (cellW + 2) + 4).attr('y', 8)
    .attr('font-size', 9).attr('fill', 'var(--color-text-subtle, #9C8B78)').text('较多')
}

onMounted(() => {
  draw()
  resizeObs = new ResizeObserver(() => draw())
  if (containerRef.value) resizeObs.observe(containerRef.value)
})

onUnmounted(() => resizeObs?.disconnect())

watch(() => [props.data, props.weeks], () => draw(), { deep: true })
</script>

<template>
  <div ref="containerRef" class="heat-cal-wrap">
    <svg ref="svgRef" />
  </div>
</template>

<style scoped>
.heat-cal-wrap {
  width: 100%;
  overflow-x: auto;
}
.heat-cal-wrap svg {
  display: block;
}
</style>
