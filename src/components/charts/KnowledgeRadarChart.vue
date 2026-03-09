<!-- 组件：知识雷达图（用于展示能力/知识点维度表现） -->
<template>
  <div ref="chartRef" class="d3-chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface DataPoint {
  axis: string
  value: number
}

interface Props {
  data: DataPoint[]
  width?: number
  height?: number
  title?: string
  maxValue?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 500,
  height: 400,
  title: '知识点掌握情况',
  maxValue: 100,
  color: '#409EFF',
})

const chartRef = ref<HTMLDivElement>()
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

function initChart() {
  if (!chartRef.value) return

  d3.select(chartRef.value).selectAll('*').remove()

  const margin = { top: 60, right: 80, bottom: 60, left: 80 }
  const innerWidth = props.width - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom
  const radius = Math.min(innerWidth, innerHeight) / 2 - 20

  svg = d3
    .select(chartRef.value)
    .append('svg')
    .attr('width', props.width)
    .attr('height', props.height)
    .attr('viewBox', `0 0 ${props.width} ${props.height}`)

  // 标题
  svg
    .append('text')
    .attr('x', props.width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#303133')
    .text(props.title)

  const g = svg
    .append('g')
    .attr('transform', `translate(${props.width / 2},${props.height / 2 + 10})`)

  const features = props.data.map(d => d.axis)
  const angleSlice = (Math.PI * 2) / features.length

  // 比例尺
  const rScale = d3.scaleLinear().domain([0, props.maxValue]).range([0, radius])

  // 绘制网格圆环
  const levels = 5
  for (let i = 0; i < levels; i++) {
    const levelFactor = radius * ((i + 1) / levels)

    g.selectAll('.levels')
      .data([1])
      .enter()
      .append('circle')
      .attr('r', levelFactor)
      .style('fill', 'none')
      .style('stroke', '#E4E7ED')
      .style('stroke-opacity', '0.7')

    // 添加刻度标签
    g.append('text')
      .attr('x', 4)
      .attr('y', -levelFactor)
      .attr('dy', '0.3em')
      .style('font-size', '10px')
      .style('fill', '#909399')
      .text(((props.maxValue * (i + 1)) / levels).toFixed(0))
  }

  // 绘制轴线
  const axes = g.selectAll('.axis').data(features).enter().append('g').attr('class', 'axis')

  axes
    .append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', (d, i) => rScale(props.maxValue) * Math.cos(angleSlice * i - Math.PI / 2))
    .attr('y2', (d, i) => rScale(props.maxValue) * Math.sin(angleSlice * i - Math.PI / 2))
    .style('stroke', '#E4E7ED')
    .style('stroke-width', '1px')

  // 添加轴标签
  axes
    .append('text')
    .attr('class', 'legend')
    .style('font-size', '12px')
    .style('fill', '#606266')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr(
      'x',
      (d, i) => (rScale(props.maxValue) + 30) * Math.cos(angleSlice * i - Math.PI / 2),
    )
    .attr(
      'y',
      (d, i) => (rScale(props.maxValue) + 30) * Math.sin(angleSlice * i - Math.PI / 2),
    )
    .text(d => d)

  // 绘制雷达区域
  const radarLine = d3
    .lineRadial<[number, string]>()
    .radius(d => rScale(d[0]))
    .angle((d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed)

  // 准备数据
  const chartData = props.data.map(d => [d.value, d.axis] as [number, string])

  // 绘制外圈（边框）
  g.append('path')
    .datum(chartData)
    .attr('d', radarLine)
    .style('stroke-width', 2)
    .style('stroke', props.color)
    .style('fill', props.color)
    .style('fill-opacity', 0.3)
    .on('mouseover', function () {
      d3.select(this).style('fill-opacity', 0.5).style('stroke-width', 3)
    })
    .on('mouseout', function () {
      d3.select(this).style('fill-opacity', 0.3).style('stroke-width', 2)
    })
    .transition()
    .duration(1000)
    .attrTween('d', function (d) {
      const interpolate = d3.interpolateArray(
        d.map(() => [0, ''] as [number, string]),
        d,
      )
      return function (t) {
        return radarLine(interpolate(t)) || ''
      }
    })

  // 绘制数据点
  g.selectAll('.radar-circle')
    .data(props.data)
    .enter()
    .append('circle')
    .attr('class', 'radar-circle')
    .attr('r', 4)
    .attr(
      'cx',
      (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2),
    )
    .attr(
      'cy',
      (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2),
    )
    .style('fill', 'white')
    .style('stroke', props.color)
    .style('stroke-width', 2)
    .style('opacity', 0)
    .on('mouseover', function (event, d) {
      d3.select(this).transition().duration(200).attr('r', 7)

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
        .html(`${d.axis}: ${d.value}分`)
    })
    .on('mouseout', function () {
      d3.select(this).transition().duration(200).attr('r', 4)
      d3.select(chartRef.value).selectAll('.chart-tooltip').remove()
    })
    .transition()
    .delay((d, i) => i * 100 + 500)
    .duration(500)
    .style('opacity', 1)
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
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>


