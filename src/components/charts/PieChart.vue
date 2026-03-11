<!-- 组件：饼图（用于展示占比结构） -->
<template>
  <div ref="chartRef" class="d3-chart-container"></div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface DataPoint {
  name: string
  value: number
}

interface Props {
  data: DataPoint[]
  width?: number
  height?: number
  title?: string
  innerRadius?: number
  colors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 400,
  title: '分布占比',
  innerRadius: 60,
  colors: () => ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9254DE'],
})

const chartRef = ref<HTMLDivElement>()
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

function initChart() {
  if (!chartRef.value || props.data.length === 0) return

  d3.select(chartRef.value).selectAll('*').remove()

  const margin = { top: 60, right: 150, bottom: 40, left: 40 }
  const innerWidth = props.width - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom
  const radius = Math.min(innerWidth, innerHeight) / 2

  svg = d3
    .select(chartRef.value)
    .append('svg')
    .attr('width', props.width)
    .attr('height', props.height)
    .attr('viewBox', `0 0 ${props.width} ${props.height}`)

  // 标题
  svg
    .append('text')
    .attr('x', margin.left + innerWidth / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#303133')
    .text(props.title)

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left + innerWidth / 2},${margin.top + innerHeight / 2})`)

  // 颜色比例尺
  const color = d3.scaleOrdinal<string>().domain(props.data.map(d => d.name)).range(props.colors)

  // 饼图生成器
  const pie = d3
    .pie<DataPoint>()
    .value(d => d.value)
    .sort(null)

  // 弧生成器
  const arc = d3.arc<d3.PieArcDatum<DataPoint>>().innerRadius(props.innerRadius).outerRadius(radius)

  // 悬停时的弧
  const arcHover = d3
    .arc<d3.PieArcDatum<DataPoint>>()
    .innerRadius(props.innerRadius)
    .outerRadius(radius + 10)

  // 绘制饼图
  const path = g
    .selectAll('path')
    .data(pie(props.data))
    .join('path')
    .attr('fill', d => color(d.data.name))
    .attr('d', arc)
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function (event, d) {
      d3.select(this).transition().duration(200).attr('d', arcHover)

      const total = props.data.reduce((sum, item) => sum + item.value, 0)
      const percentage = ((d.data.value / total) * 100).toFixed(1)

      const tooltip = d3
        .select(chartRef.value)
        .append('div')
        .attr('class', 'chart-tooltip')
        .style('position', 'absolute')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 30}px`)
        .style('padding', '8px 12px')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .html(`${d.data.name}<br/>数量: ${d.data.value}<br/>占比: ${percentage}%`)
    })
    .on('mouseout', function () {
      d3.select(this).transition().duration(200).attr('d', arc)
      d3.select(chartRef.value).selectAll('.chart-tooltip').remove()
    })
    .transition()
    .duration(1000)
    .attrTween('d', function (d) {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
      return function (t) {
        return arc(interpolate(t)) || ''
      }
    })

  // 添加中心文字
  const total = props.data.reduce((sum, d) => sum + d.value, 0)
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.2em')
    .style('font-size', '14px')
    .style('fill', '#606266')
    .text('总计')
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.2em')
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .style('fill', '#303133')
    .text(total.toString())

  // 图例
  const legend = svg
    .append('g')
    .attr('transform', `translate(${props.width - 140}, ${margin.top})`)

  const legendItems = legend
    .selectAll('g')
    .data(props.data)
    .join('g')
    .attr('transform', (d, i) => `translate(0, ${i * 25})`)

  legendItems
    .append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('rx', 2)
    .attr('fill', d => color(d.name))

  legendItems
    .append('text')
    .attr('x', 22)
    .attr('y', 12)
    .style('font-size', '12px')
    .style('fill', '#606266')
    .text(d => d.name)
}

onMounted(() => {
  nextTick(() => {
    initChart()
    resizeObserver = new ResizeObserver(() => {
      initChart()
    })
    if (chartRef.value) {
      resizeObserver.observe(chartRef.value)
    }
  })
})

onUnmounted(() => {
  if (resizeObserver && chartRef.value) {
    resizeObserver.unobserve(chartRef.value)
    resizeObserver.disconnect()
  }
  svg = null
})

watch(() => props.data, initChart, { deep: true })
</script>

<style scoped>
.d3-chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>


