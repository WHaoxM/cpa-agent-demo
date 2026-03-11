<!-- 组件：直方图（用于展示分布/频次统计） -->
<template>
  <div ref="chartRef" class="d3-chart-container"></div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface DataPoint {
  range: string
  count: number
}

interface Props {
  data: DataPoint[]
  width?: number
  height?: number
  title?: string
  barColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 350,
  title: '成绩分布直方图',
  barColor: '#409EFF',
})

const chartRef = ref<HTMLDivElement>()
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

const margin = { top: 60, right: 30, bottom: 60, left: 60 }

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

  // 比例尺
  const x = d3
    .scaleBand()
    .domain(props.data.map(d => d.range))
    .range([0, innerWidth])
    .padding(0.1)

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(props.data, d => d.count) || 0])
    .nice()
    .range([innerHeight, 0])

  // 绘制柱状图
  g.selectAll('.bar')
    .data(props.data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.range) || 0)
    .attr('width', x.bandwidth())
    .attr('y', innerHeight)
    .attr('height', 0)
    .attr('fill', props.barColor)
    .attr('rx', 4)
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
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .html(`分数段: ${d.range}<br/>人数: ${d.count}`)
    })
    .on('mouseout', function () {
      d3.select(this).transition().duration(200).style('opacity', 1)
      d3.select(chartRef.value).selectAll('.chart-tooltip').remove()
    })
    .transition()
    .duration(800)
    .attr('y', d => y(d.count))
    .attr('height', d => innerHeight - y(d.count))

  // 添加数值标签
  g.selectAll('.label')
    .data(props.data)
    .join('text')
    .attr('class', 'label')
    .attr('x', d => (x(d.range) || 0) + x.bandwidth() / 2)
    .attr('y', d => y(d.count) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('fill', '#606266')
    .style('opacity', 0)
    .text(d => d.count)
    .transition()
    .delay(500)
    .duration(500)
    .style('opacity', 1)

  // X轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .style('font-size', '12px')
    .style('color', '#606266')

  // Y轴
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .style('font-size', '12px')
    .style('color', '#606266')

  // 轴标签
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 20)
    .attr('x', -innerHeight / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#606266')
    .text('人数')

  g.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 45)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#606266')
    .text('分数段')
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


