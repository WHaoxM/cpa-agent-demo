<!-- 组件：成绩折线图（用于展示成绩/分数趋势） -->
<template>
  <div ref="chartRef" class="d3-chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface DataPoint {
  date: string
  score: number
}

interface Props {
  data: DataPoint[]
  width?: number
  height?: number
  title?: string
  lineColor?: string
  showArea?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 350,
  title: '成绩趋势分析',
  lineColor: '#409EFF',
  showArea: true,
})

const chartRef = ref<HTMLDivElement>()
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

const margin = { top: 60, right: 30, bottom: 50, left: 60 }

function initChart() {
  if (!chartRef.value) return

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
    .scalePoint()
    .domain(props.data.map(d => d.date))
    .range([0, innerWidth])
    .padding(0.1)

  const y = d3.scaleLinear().domain([0, 100]).nice().range([innerHeight, 0])

  // 定义线条生成器
  const line = d3
    .line<DataPoint>()
    .x(d => x(d.date) || 0)
    .y(d => y(d.score))
    .curve(d3.curveMonotoneX)

  // 添加渐变定义
  if (props.showArea) {
    const defs = svg.append('defs')
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    gradient.append('stop').attr('offset', '0%').attr('stop-color', props.lineColor).attr('stop-opacity', 0.3)

    gradient.append('stop').attr('offset', '100%').attr('stop-color', props.lineColor).attr('stop-opacity', 0.05)

    // 区域生成器
    const area = d3
      .area<DataPoint>()
      .x(d => x(d.date) || 0)
      .y0(innerHeight)
      .y1(d => y(d.score))
      .curve(d3.curveMonotoneX)

    // 绘制区域
    g.append('path')
      .datum(props.data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1)
  }

  // 绘制网格线
  g.append('g')
    .attr('class', 'grid')
    .call(
      d3
        .axisLeft(y)
        .tickSize(-innerWidth)
        .tickFormat(() => ''),
    )
    .style('stroke-dasharray', '3,3')
    .style('stroke-opacity', 0.1)
    .selectAll('line')
    .style('stroke', '#909399')

  g.select('.grid').select('.domain').remove()

  // 绘制折线
  const path = g
    .append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', props.lineColor)
    .attr('stroke-width', 3)
    .attr('d', line)

  // 路径动画
  const totalLength = path.node()?.getTotalLength() || 0
  path
    .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(1500)
    .ease(d3.easeLinear)
    .attr('stroke-dashoffset', 0)

  // 添加数据点
  g.selectAll('.dot')
    .data(props.data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.date) || 0)
    .attr('cy', d => y(d.score))
    .attr('r', 0)
    .attr('fill', 'white')
    .attr('stroke', props.lineColor)
    .attr('stroke-width', 2)
    .on('mouseover', function (event, d) {
      d3.select(this).transition().duration(200).attr('r', 8).attr('stroke-width', 3)

      // Tooltip
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
        .html(`${d.date}<br/>成绩: ${d.score}分`)
    })
    .on('mouseout', function () {
      d3.select(this).transition().duration(200).attr('r', 5).attr('stroke-width', 2)
      d3.select(chartRef.value).selectAll('.chart-tooltip').remove()
    })
    .transition()
    .delay((d, i) => i * 100)
    .duration(500)
    .attr('r', 5)

  // X轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .style('font-size', '12px')
    .style('color', '#606266')

  // Y轴
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}分`))
    .style('font-size', '12px')
    .style('color', '#606266')

  // Y轴标签
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 20)
    .attr('x', -innerHeight / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#606266')
    .text('分数')
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


