<!-- 组件：简化进度图表（用于快速展示完成进度） -->
<template>
  <div class="progress-chart">
    <div ref="chartRef" :style="{ height: '300px', width: '100%' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

interface ProgressData {
  name: string
  value: number
  color: string
}

const props = defineProps<{
  data: ProgressData[]
  title?: string
}>()

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return
  
  const option = {
    title: {
      text: props.title || '学习进度',
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [{
      name: '学习进度',
      type: 'pie',
      radius: ['60%', '80%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      labelLine: {
        show: false
      },
      data: props.data.map(item => ({
        ...item,
        itemStyle: {
          color: item.color
        }
      }))
    }]
  }
  
  chartInstance.setOption(option)
}

// 处理窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听数据变化
watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// 暴露图表实例给父组件
defineExpose({
  getChartInstance: () => chartInstance
})
</script>

<style scoped>
.progress-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-chart {
    min-height: 250px;
  }
}

@media (max-width: 480px) {
  .progress-chart {
    min-height: 200px;
  }
}
</style>


