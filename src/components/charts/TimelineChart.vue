<!-- 组件：时间线图表（用于展示随时间变化的进度/记录） -->
<template>
  <div class="timeline-chart">
    <v-chart 
      :option="timelineOption" 
      :style="{ height: '400px' }"
      autoresize
      class="chart-container"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer
])

interface TimelineData {
  date: string
  studyTime: number
  completedCourses: number
  testScore: number
}

const props = defineProps<{
  data: TimelineData[]
  title?: string
}>()

// 图表实例
let chartInstance: echarts.ECharts | null = null

// 响应式图表配置
const timelineOption = computed(() => ({
  title: {
    text: props.title || '学习历史时间轴',
    left: 'center',
    top: 20,
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999'
      }
    }
  },
  toolbox: {
    feature: {
      dataView: { show: true, readOnly: false },
      magicType: { show: true, type: ['line', 'bar'] },
      restore: { show: true },
      saveAsImage: { show: true }
    }
  },
  legend: {
    data: ['学习时长(小时)', '完成课程数', '测试分数'],
    top: 50
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: props.data.map(item => item.date),
    axisPointer: {
      type: 'shadow'
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '学习时长',
      min: 0,
      axisLabel: {
        formatter: '{value} h'
      }
    },
    {
      type: 'value',
      name: '课程数/分数',
      min: 0,
      axisLabel: {
        formatter: '{value}'
      }
    }
  ],
  series: [
    {
      name: '学习时长(小时)',
      type: 'bar',
      data: props.data.map(item => item.studyTime),
      itemStyle: {
        color: '#5470c6'
      }
    },
    {
      name: '完成课程数',
      type: 'line',
      yAxisIndex: 1,
      data: props.data.map(item => item.completedCourses),
      itemStyle: {
        color: '#91cc75'
      },
      smooth: true
    },
    {
      name: '测试分数',
      type: 'line',
      yAxisIndex: 1,
      data: props.data.map(item => item.testScore),
      itemStyle: {
        color: '#fac858'
      },
      smooth: true
    }
  ],
  dataZoom: [
    {
      type: 'inside',
      start: 0,
      end: 100
    },
    {
      start: 0,
      end: 100,
      handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23.1h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
      handleSize: '80%',
      handleStyle: {
        color: '#fff',
        shadowBlur: 3,
        shadowColor: 'rgba(0, 0, 0, 0.6)',
        shadowOffsetX: 2,
        shadowOffsetY: 2
      }
    }
  ]
}))

// 处理窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
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
.timeline-chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.chart-container {
  width: 100%;
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .timeline-chart {
    min-height: 300px;
  }
  
  .chart-container {
    height: 300px !important;
  }
}

@media (max-width: 480px) {
  .timeline-chart {
    min-height: 250px;
  }
  
  .chart-container {
    height: 250px !important;
  }
}
</style>


