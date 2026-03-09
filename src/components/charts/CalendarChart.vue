<template>
  <div class="calendar-chart-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="error">加载失败: {{ error }}</div>
    
    <!-- 图表容器 -->
    <div 
      v-else
      ref="chartRef" 
      class="calendar-chart" 
      style="width: 100%; height: 800px;"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';

// 状态管理
const loading = ref(true);    // 加载状态
const error = ref('');        // 错误信息
const chartRef = ref(null);   // 图表容器引用
let chartInstance = null;     // 图表实例

// 1. 接口请求函数 - 预留接口位置，暂时返回测试数据
const fetchCalendarData = async () => {
  try {
    // ========== 预留接口位置（实际项目中替换为真实请求） ==========
    // const response = await fetch('/api/calendar/2026');
    // if (!response.ok) throw new Error(`请求失败: ${response.status}`);
    // const dateList = await response.json();
    
    // ========== 测试数据（截止2026.3.9） ==========
    const dateList = [
      ['2026-1-1', '十四'],
      ['2026-1-2', '十五'],
      ['2026-1-3', '十六'],
      ['2026-1-4', '十七'],
      ['2026-1-5', '十八', '小寒'],
      ['2026-1-6', '十九'],
      ['2026-1-7', '二十'],
      ['2026-1-8', '廿一'],
      ['2026-1-9', '廿二'],
      ['2026-1-10', '廿三'],
      ['2026-1-11', '廿四'],
      ['2026-1-12', '廿五'],
      ['2026-1-13', '廿六'],
      ['2026-1-14', '廿七'],
      ['2026-1-15', '廿八'],
      ['2026-1-16', '廿九'],
      ['2026-1-17', '三十'],
      ['2026-1-18', '正月'],
      ['2026-1-19', '初二'],
      ['2026-1-20', '初三', '大寒'],
      ['2026-1-21', '初四'],
      ['2026-1-22', '初五'],
      ['2026-1-23', '初六'],
      ['2026-1-24', '初七'],
      ['2026-1-25', '初八'],
      ['2026-1-26', '初九'],
      ['2026-1-27', '初十'],
      ['2026-1-28', '十一'],
      ['2026-1-29', '十二'],
      ['2026-1-30', '十三'],
      ['2026-1-31', '十四'],
      ['2026-2-1', '十五'],
      ['2026-2-2', '十六'],
      ['2026-2-3', '十七'],
      ['2026-2-4', '十八', '立春'],
      ['2026-2-5', '十九'],
      ['2026-2-6', '二十'],
      ['2026-2-7', '廿一'],
      ['2026-2-8', '廿二'],
      ['2026-2-9', '廿三'],
      ['2026-2-10', '廿四'],
      ['2026-2-11', '廿五'],
      ['2026-2-12', '廿六'],
      ['2026-2-13', '廿七'],
      ['2026-2-14', '廿八'],
      ['2026-2-15', '廿九'],
      ['2026-2-16', '二月'],
      ['2026-2-17', '初二'],
      ['2026-2-18', '初三', '雨水'],
      ['2026-2-19', '初四'],
      ['2026-2-20', '初五'],
      ['2026-2-21', '初六'],
      ['2026-2-22', '初七'],
      ['2026-2-23', '初八'],
      ['2026-2-24', '初九'],
      ['2026-2-25', '初十'],
      ['2026-2-26', '十一'],
      ['2026-2-27', '十二'],
      ['2026-2-28', '十三'],
      ['2026-2-29', '十四'],
      ['2026-3-1', '十五'],
      ['2026-3-2', '十六'],
      ['2026-3-3', '十七'],
      ['2026-3-4', '十八'],
      ['2026-3-5', '十九', '惊蛰'],
      ['2026-3-6', '二十'],
      ['2026-3-7', '廿一'],
      ['2026-3-8', '廿二'],
      ['2026-3-9', '廿三']
    ];

    return dateList;
  } catch (err) {
    error.value = err.message;
    console.error('获取日历数据失败:', err);
    return null;
  }
};

// 2. 初始化图表（使用测试数据）
const initChart = async () => {
  // 1. 获取数据（测试数据/接口数据）
  const dateList = await fetchCalendarData();
  
  // 数据获取失败则终止
  if (!dateList) {
    loading.value = false;
    return;
  }

  // 2. 确保容器已挂载
  if (!chartRef.value) {
    loading.value = false;
    return;
  }

  // 3. 创建图表实例
  chartInstance = echarts.init(chartRef.value);
  
  // 4. 处理数据
  const heatmapData = [];
  const lunarData = [];
  
  for (let i = 0; i < dateList.length; i++) {
    heatmapData.push([
      dateList[i][0],
      Math.random() * 300  // 随机降雨量（可替换为接口数据）
    ]);
    lunarData.push([
      dateList[i][0],
      1,
      dateList[i][1],
      dateList[i][2] || ''  // 兼容无节气的情况
    ]);
  }
  
  // 5. 图表配置（调整显示范围为2026年3月）
  const option = {
    tooltip: {
      formatter: function (params) {
        return '降雨量: ' + params.value[1].toFixed(2);
      }
    },
    visualMap: {
      show: false,
      min: 0,
      max: 300,
      calculable: true,
      seriesIndex: [2],
      orient: 'horizontal',
      left: 'center',
      bottom: 20,
      inRange: {
        color: ['#e0ffff', '#006edd'],
        opacity: 0.3
      },
      controller: {
        inRange: {
          opacity: 0.5
        }
      }
    },
    calendar: [{
      left: 'center',
      top: 'middle',
      cellSize: [70, 70],
      yearLabel: { show: false },
      orient: 'vertical',
      dayLabel: {
        firstDay: 1,
        nameMap: 'cn'
      },
      monthLabel: {
        show: false
      },
      range: '2026-03' // 显示2026年3月（可根据需求调整）
    }],
    series: [{
      type: 'scatter',
      coordinateSystem: 'calendar',
      symbolSize: 1,
      label: {
        show: true,
        formatter: function (params) {
          const d = echarts.number.parseDate(params.value[0]);
          return d.getDate() + '\n\n' + params.value[2] + '\n\n';
        },
        color: '#000'
      },
      data: lunarData
    }, {
      type: 'scatter',
      coordinateSystem: 'calendar',
      symbolSize: 1,
      label: {
        show: true,
        formatter: function (params) {
          return '\n\n\n' + (params.value[3] || '');
        },
        fontSize: 14,
        fontWeight: 700,
        color: '#a00'
      },
      data: lunarData
    }, {
      name: '降雨量',
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: heatmapData
    }]
  };
  
  // 6. 渲染图表
  chartInstance.setOption(option);
  
  // 7. 更新状态
  loading.value = false;
};

// 响应式调整图表大小
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 生命周期管理
onMounted(async () => {
  await initChart(); // 等待数据加载和图表初始化
  window.addEventListener('resize', resizeChart);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style scoped>
.calendar-chart-container {
  width: 100%;
  height: 800px;
  position: relative;
}

.loading, .error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
}

.error {
  color: #ff4d4f;
}

.calendar-chart {
  margin: 0 auto;
}
</style>