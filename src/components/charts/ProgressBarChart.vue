<!-- 组件：进度条图表（用于展示完成度/进度对比） -->
<template>
  <div ref="chartRef" class="d3-chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface Props {
  data: Array<{
    name: string
    completed: number
    studying: number
    notStarted: number
  }>
  width?: number
  height?: number
  title?: string
  colors?: {
    completed: string
    studying: string
    notStarted: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 400,
  title: '学习进度统计',
  colors: () => ({
    completed: '#67C23A',
    studying: '#E6A23C',
    notStarted: '#909399',
  }),
})

const chartRef = ref<HTMLDivElement>()
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

const margin = { top: 60, right: 30, bottom: 60, left: 60 }

function initChart() {
  if (!chartRef.value) return

  // 清除之前的图表
  d3.select(chartRef.value).selectAll('*').remove()

  const innerWidth = props.width - margin.left - margin.right
  const innerHeight = props.height - margin.top - margin.bottom

  // 创建SVG
  svg = d3
    .select(chartRef.value)
    .append('svg')
    .attr('width', props.width)
    .attr('height', props.height)
    .attr('viewBox', `0 0 ${props.width} ${props.height}`)

  // 添加标题
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

  // 数据处理
  const keys = ['completed', 'studying', 'notStarted']
  const stackedData = d3.stack().keys(keys)(
    props.data.map(d => ({
      name: d.name,
      completed: d.completed,
      studying: d.studying,
      notStarted: d.notStarted,
    })),
  )

  // 设置比例尺
  const x0 = d3
    .scaleBand()
    .domain(props.data.map(d => d.name))
    .rangeRound([0, innerWidth])
    .paddingInner(0.3)

  const maxValue = d3.max(props.data, d => d.completed + d.studying + d.notStarted) || 100

  const y = d3.scaleLinear().domain([0, maxValue]).nice().range([innerHeight, 0])

  // 颜色比例尺
  const color = d3
    .scaleOrdinal<string>()
    .domain(keys)
    .range([props.colors.completed, props.colors.studying, props.colors.notStarted])

  // 绘制柱状图
  g.append('g')
    .selectAll('g')
    .data(stackedData)
    .join('g')
    .attr('fill', d => color(d.key))
    .selectAll('rect')
    .data(d => d.map(item => ({ key: d.key, ...item })))
    .join('rect')
    .attr('x', d => x0(d.data.name) || 0)
    .attr('y', innerHeight)
    .attr('height', 0)
    .attr('width', x0.bandwidth())
    .on('mouseover', function (event, d) {
      const value = d[1] - d[0]
      const label = d.key === 'completed' ? '已完成' : d.key === 'studying' ? '学习中' : '未开始'

      d3.select(this).style('opacity', 0.8)

      // 显示tooltip
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
        .html(`${d.data.name}<br/>${label}: ${value.toFixed(1)}%`)
    })
    .on('mouseout', function () {
      d3.select(this).style('opacity', 1)
      d3.select(chartRef.value).selectAll('.chart-tooltip').remove()
    })
    .transition()
    .duration(750)
    .attr('y', d => y(d[1]))
    .attr('height', d => y(d[0]) - y(d[1]))

  // X轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0))
    .selectAll('text')
    .style('font-size', '12px')
    .style('fill', '#606266')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')

  // Y轴
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
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
    .text('进度 (%)')

  // 图例
  const legend = g
    .append('g')
    .attr('transform', `translate(${innerWidth - 100}, -30)`)

  const legendData = [
    { key: 'completed', label: '已完成', color: props.colors.completed },
    { key: 'studying', label: '学习中', color: props.colors.studying },
    { key: 'notStarted', label: '未开始', color: props.colors.notStarted },
  ]

  legend
    .selectAll('g')
    .data(legendData)
    .join('g')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`)
    .each(function (d) {
      const item = d3.select(this)
      item.append('rect').attr('width', 12).attr('height', 12).attr('fill', d.color)
      item.append('text').attr('x', 18).attr('y', 10).style('font-size', '11px').style('fill', '#606266').text(d.label)
    })
}

onMounted(() => {
  nextTick(() => {
    initChart()
    // 监听容器大小变化
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


