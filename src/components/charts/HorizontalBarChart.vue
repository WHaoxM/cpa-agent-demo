<!-- 组件：横向条形图（用于类别对比） -->
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
  barColor?: string
  valueLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 350,
  title: '横向柱状图',
  barColor: '#F56C6C',
  valueLabel: '错误率 (%)',
})

const chartRef = ref<HTMLDivElement>()
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

const margin = { top: 60, right: 80, bottom: 40, left: 120 }

function initChart() {
  if (!chartRef.value || props.data.length === 0) return

  d3.select(chartRef.value).selectAll('*').remove()

  const innerWidth = props.width - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom

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
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 按值排序
  const sortedData = [...props.data].sort((a, b) => a.value - b.value)

  // 比例尺
  const x = d3.scaleLinear().domain([0, d3.max(sortedData, d => d.value) || 0]).nice().range([0, innerWidth])

  const y = d3.scaleBand().domain(sortedData.map(d => d.name)).range([innerHeight, 0]).padding(0.2)

  // 绘制柱状图
  g.selectAll('.bar')
    .data(sortedData)
    .join('rect')
    .attr('class', 'bar')
    .attr('y', d => y(d.name) || 0)
    .attr('height', y.bandwidth())
    .attr('x', 0)
    .attr('width', 0)
    .attr('fill', props.barColor)
    .attr('rx', 3)
    .on('mouseover', function (event, d) {
      d3.select(this).transition().duration(200).style('opacity', 0.8)

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
        .style('border-radius', '0')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .html(`${d.name}<br/>${props.valueLabel}: ${d.value}%`)
    })
    .on('mouseout', function () {
      d3.select(this).transition().duration(200).style('opacity', 1)
      d3.select(chartRef.value).selectAll('.chart-tooltip').remove()
    })
    .transition()
    .duration(800)
    .attr('width', d => x(d.value))

  // 添加数值标签
  g.selectAll('.label')
    .data(sortedData)
    .join('text')
    .attr('class', 'label')
    .attr('y', d => (y(d.name) || 0) + y.bandwidth() / 2)
    .attr('x', d => x(d.value) + 5)
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('fill', '#606266')
    .style('opacity', 0)
    .text(d => d.value)
    .transition()
    .delay(500)
    .duration(500)
    .style('opacity', 1)

  // Y轴
  g.append('g').call(d3.axisLeft(y)).style('font-size', '12px').style('color', '#606266')

  // X轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}%`))
    .style('font-size', '12px')
    .style('color', '#606266')

  // X轴标签
  g.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 35)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#606266')
    .text(props.valueLabel)
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
  min-height: 350px;
}
</style>


