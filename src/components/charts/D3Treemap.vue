<!-- D3 课程结构 Treemap 图 -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as d3 from 'd3'

export interface TreemapCategory {
  id: string
  name: string
}

export interface TreemapCourse {
  id: string
  title: string
  categoryId: string
  totalDuration: number
  isHighlighted?: boolean
}

const props = defineProps<{
  categories: TreemapCategory[]
  courses: TreemapCourse[]
}>()

const emit = defineEmits<{
  (e: 'select-category', categoryId: string): void
  (e: 'select-course', courseId: string): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
let resizeObs: ResizeObserver | null = null
let tooltipEl: HTMLDivElement | null = null

const CHART_COLORS = [
  '#D4622A', '#3D6B52', '#2E618F', '#7A5C8A',
  '#8A5230', '#8C4E2A', '#5A7A6A', '#6B5A8A',
]

function buildHierarchy() {
  const catMap = new Map(props.categories.map(c => [c.id, c.name]))
  const grouped = new Map<string, TreemapCourse[]>()
  for (const course of props.courses) {
    const arr = grouped.get(course.categoryId) ?? []
    arr.push(course)
    grouped.set(course.categoryId, arr)
  }

  return {
    name: 'root',
    children: props.categories.map(cat => ({
      name: catMap.get(cat.id) ?? cat.id,
      catId: cat.id,
      children: (grouped.get(cat.id) ?? []).map(c => ({
        name: c.title,
        courseId: c.id,
        catId: cat.id,
        value: Math.max(c.totalDuration, 10),
        isHighlighted: c.isHighlighted ?? false,
      })),
    })).filter(cat => cat.children.length > 0),
  }
}

function draw() {
  const svgEl = svgRef.value
  const container = containerRef.value
  if (!svgEl || !container) return

  const width = container.clientWidth || 480
  const height = container.clientHeight || 320
  if (width < 20 || height < 20) return

  d3.select(svgEl).selectAll('*').remove()

  const root = d3.hierarchy(buildHierarchy())
    .sum((d: any) => d.value ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  d3.treemap<any>()
    .size([width, height])
    .paddingOuter(4)
    .paddingInner(2)
    .paddingTop(20)
    .round(true)(root)

  const svg = d3.select(svgEl)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width)
    .attr('height', height)

  const colorMap = new Map<string, string>()
  root.children?.forEach((child, i) => {
    colorMap.set((child.data as any).catId, CHART_COLORS[i % CHART_COLORS.length]!)
  })

  const catGroups = svg.selectAll('g.cat-group')
    .data(root.children ?? [])
    .join('g')
    .attr('class', 'cat-group')
    .style('cursor', 'pointer')
    .on('click', (_evt: MouseEvent, d: any) => {
      emit('select-category', d.data.catId)
    })

  catGroups.append('rect')
    .attr('x', (d: any) => d.x0)
    .attr('y', (d: any) => d.y0)
    .attr('width', (d: any) => d.x1 - d.x0)
    .attr('height', (d: any) => d.y1 - d.y0)
    .attr('fill', (d: any) => {
      const c = d3.color(colorMap.get(d.data.catId) ?? '#8C7B6B')!
      c.opacity = 0.12
      return c.toString()
    })
    .attr('rx', 3)

  catGroups.append('text')
    .attr('x', (d: any) => d.x0 + 6)
    .attr('y', (d: any) => d.y0 + 14)
    .attr('font-size', 11)
    .attr('font-weight', '700')
    .attr('fill', (d: any) => colorMap.get(d.data.catId) ?? '#4a3c30')
    .attr('pointer-events', 'none')
    .text((d: any) => {
      const w = d.x1 - d.x0
      const name: string = d.data.name
      if (w < 40) return ''
      if (w < 70) return name.substring(0, 3)
      return name
    })

  const leaves = root.leaves()

  const leafGroups = svg.selectAll('g.leaf')
    .data(leaves)
    .join('g')
    .attr('class', 'leaf')
    .style('cursor', 'pointer')
    .on('click', (_evt: MouseEvent, d: any) => {
      emit('select-course', d.data.courseId)
    })
    .on('mouseenter', (evt: MouseEvent, d: any) => {
      showTooltip(evt, d.data.name, d.value ?? 0, d.data.isHighlighted)
    })
    .on('mousemove', (evt: MouseEvent) => {
      moveTooltip(evt)
    })
    .on('mouseleave', () => {
      hideTooltip()
    })

  leafGroups.append('rect')
    .attr('x', (d: any) => d.x0 + 1)
    .attr('y', (d: any) => d.y0 + 1)
    .attr('width', (d: any) => Math.max(0, d.x1 - d.x0 - 2))
    .attr('height', (d: any) => Math.max(0, d.y1 - d.y0 - 2))
    .attr('fill', (d: any) => {
      const baseColor = colorMap.get(d.data.catId) ?? '#8C7B6B'
      if (d.data.isHighlighted) return baseColor
      const c = d3.color(baseColor)!
      c.opacity = 0.55
      return c.toString()
    })
    .attr('stroke', (d: any) => {
      if (d.data.isHighlighted) return '#B8860B'
      return 'rgba(255,255,255,0.5)'
    })
    .attr('stroke-width', (d: any) => d.data.isHighlighted ? 2 : 0.8)
    .attr('rx', 2)

  leafGroups.each(function (this: any, d: any) {
    const w = d.x1 - d.x0
    const h = d.y1 - d.y0
    if (w < 18 || h < 12) return

    const g = d3.select(this)
    const fontSize = w > 100 && h > 36 ? 12 : w < 40 || h < 20 ? 8 : 10
    const charW = fontSize * 0.58
    const padX = fontSize < 10 ? 2 : 5
    const maxChars = Math.max(1, Math.floor((w - padX * 2) / charW))
    const name: string = d.data.name
    const label = name.length <= maxChars ? name : name.substring(0, maxChars - 1) + '…'

    const canTwoLine = h > 30 && w > 40
    const yBase = canTwoLine ? d.y0 + h * 0.38 : (d.y0 + d.y1) / 2 + 1

    g.append('text')
      .attr('x', d.x0 + padX)
      .attr('y', yBase)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', fontSize)
      .attr('font-weight', '600')
      .attr('fill', 'rgba(255,255,255,0.95)')
      .attr('pointer-events', 'none')
      .text(label)

    if (canTwoLine) {
      const dur = d.value ?? 0
      const durText = dur >= 60 ? `${Math.round(dur / 60)}h` : `${dur}min`
      g.append('text')
        .attr('x', d.x0 + padX)
        .attr('y', yBase + fontSize + 3)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', fontSize - 1)
        .attr('fill', 'rgba(255,255,255,0.7)')
        .attr('pointer-events', 'none')
        .text(durText)
    }
  })
}

function ensureTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.style.cssText = [
      'position:fixed;pointer-events:none;z-index:9999;',
      'padding:6px 10px;border-radius:4px;font-size:11px;line-height:1.5;',
      'background:#fff;color:#111;',
      'border:1px solid rgba(0,0,0,0.08);',
      'box-shadow:0 4px 16px rgba(0,0,0,0.12);',
      'display:none;',
    ].join('')
    document.body.appendChild(tooltipEl)
  }
}

function showTooltip(evt: MouseEvent, name: string, duration: number, highlighted: boolean) {
  ensureTooltip()
  if (!tooltipEl) return
  tooltipEl.innerHTML = [
    `<strong>${name}</strong>`,
    `时长：${duration} 分钟`,
    highlighted ? '<span style="color:#8B2500;font-size:10px">★ 推荐课程</span>' : '',
  ].filter(Boolean).join('<br/>')
  tooltipEl.style.display = 'block'
  moveTooltip(evt)
}

function moveTooltip(evt: MouseEvent) {
  if (!tooltipEl) return
  tooltipEl.style.left = `${evt.clientX + 14}px`
  tooltipEl.style.top = `${evt.clientY - 10}px`
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = 'none'
}

onMounted(() => {
  draw()
  resizeObs = new ResizeObserver(() => draw())
  if (containerRef.value) resizeObs.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObs?.disconnect()
  hideTooltip()
  if (tooltipEl) {
    tooltipEl.remove()
    tooltipEl = null
  }
})

watch([() => props.courses, () => props.categories], () => draw(), { deep: true })
</script>

<template>
  <div ref="containerRef" class="treemap-wrap">
    <svg ref="svgRef" class="treemap-svg" />
    <div v-if="!courses.length" class="treemap-empty">暂无课程数据</div>
  </div>
</template>

<style scoped>
.treemap-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 200px;
}

.treemap-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.treemap-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-text-subtle, #9C8B78);
}
</style>
