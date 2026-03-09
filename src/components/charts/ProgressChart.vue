<!-- 组件：学习/任务进度图表（用于展示完成进度） -->
<template>
  <div class="progress-chart">
    <v-chart 
      :option="progressOption" 
      :style="{ height: '300px' }"
      autoresize
      class="chart-container"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
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

// 图表实例
let chartInstance: echarts.ECharts | null = null

// 响应式图表配置
const progressOption = computed(() => ({
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
.progress-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart-container {
  width: 100%;
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-chart {
    min-height: 250px;
  }
  
  .chart-container {
    height: 250px !important;
  }
}

@media (max-width: 480px) {
  .progress-chart {
    min-height: 200px;
  }
  
  .chart-container {
    height: 200px !important;
  }
}
</style>


