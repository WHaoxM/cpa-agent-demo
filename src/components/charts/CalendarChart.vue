<template>
  <div class="calendar-chart-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="error">加载失败: {{ error }}</div>
    
    <!-- 图表容器 -->
    <div 
      ref="chartRef" 
      class="calendar-chart" 
    ></div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';

// 状态管理
const loading = ref(true);    // 加载状态
const error = ref('');        // 错误信息
const chartRef = ref(null);   // 图表容器引用
let chartInstance = null;     // 图表实例
let resizeObserver = null;
let currentRange = '2026-03';

const getThemeColors = () => {
  const rootStyle = getComputedStyle(document.documentElement);
  return {
    primary: rootStyle.getPropertyValue('--primary-100').trim() || '#3B82F6',
    primarySoft: rootStyle.getPropertyValue('--primary-200').trim() || '#93C5FD',
    accent: rootStyle.getPropertyValue('--accent-100').trim() || '#22C55E',
    text: rootStyle.getPropertyValue('--text-100').trim() || '#1E293B',
    textSubtle: rootStyle.getPropertyValue('--text-200').trim() || '#64748B'
  };
};

// 1. 接口请求函数 - 预留接口位置，暂时返回测试数据
const fetchStudyData = async () => {
  try {
    // ========== 预留接口位置（实际项目中替换为真实请求） ==========
    // const response = await fetch('/api/calendar/2026');
    // if (!response.ok) throw new Error(`请求失败: ${response.status}`);
    // const dateList = await response.json();
    
    // ========== 测试数据（学习时长，2026-03） ==========
    const dateList = [];
    for (let day = 1; day <= 31; day += 1) {
      const base = (day % 5) * 0.7 + (day % 3) * 0.4;
      const hours = Number((Math.min(base, 6) + 0.2).toFixed(1));
      dateList.push([`2026-3-${day}`, hours]);
    }

    return dateList;
  } catch (err) {
    error.value = err.message;
    console.error('获取日历数据失败:', err);
    return null;
  }
};

const pad2 = (value) => String(value).padStart(2, '0');

const normalizeStudyList = (dateList) => {
  if (!Array.isArray(dateList)) return [];

  const normalized = [];

  for (const item of dateList) {
    if (!Array.isArray(item) || item.length < 2) continue;

    const [rawDate, rawHours] = item;
    const parts = String(rawDate).split('-').map(Number);

    if (parts.length < 3 || parts.some(Number.isNaN)) {
      console.warn('[CalendarChart] 跳过无法解析的日期:', rawDate);
      continue;
    }

    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      console.warn('[CalendarChart] 跳过无效日期:', rawDate);
      continue;
    }

    const hours = Number(rawHours);
    normalized.push([
      `${year}-${pad2(month)}-${pad2(day)}`,
      Number.isFinite(hours) && hours > 0 ? hours : 0
    ]);
  }

  return normalized.sort((a, b) => a[0].localeCompare(b[0]));
};

const getCalendarRange = (dateList) => {
  if (!dateList.length) return '';
  return dateList[dateList.length - 1][0].slice(0, 7);
};

const getResponsiveCellSize = () => {
  if (!chartRef.value) return [70, 70];
  const width = chartRef.value.clientWidth || 0;
  const height = chartRef.value.clientHeight || 0;
  const padding = 24;
  const usableWidth = Math.max(width - padding * 2, 1);
  const usableHeight = Math.max(height - padding * 2, 1);
  const cellWidth = Math.max(1, Math.floor(usableWidth / 7));
  const cellHeight = Math.max(1, Math.floor(usableHeight / 6));
  const maxCell = 90;
  return [Math.min(cellWidth, maxCell), Math.min(cellHeight, maxCell)];
};

const updateCalendarLayout = () => {
  if (!chartInstance) return;
  const cellSize = getResponsiveCellSize();
  chartInstance.setOption({
    calendar: [{
      cellSize,
      range: currentRange
    }]
  });
  chartInstance.resize();
};

// 2. 初始化图表（使用测试数据）
const initChart = async () => {
  // 1. 获取数据（测试数据/接口数据）
  const rawDateList = await fetchStudyData();
  const dateList = normalizeStudyList(rawDateList);
  
  // 数据获取失败则终止
  if (!dateList.length) {
    error.value = error.value || '日历数据为空或格式不正确';
    loading.value = false;
    return;
  }

  // 2. 确保容器已挂载
  if (!chartRef.value) {
    loading.value = false;
    return;
  }

  await nextTick();

  // 3. 创建图表实例
  chartInstance = echarts.init(chartRef.value);

  const themeColors = getThemeColors();
  
  // 4. 处理数据
  const heatmapData = dateList.map(item => [item[0], item[1]]);
  const maxHours = Math.max(1, ...heatmapData.map(item => item[1]));
  
  const calendarRange = getCalendarRange(dateList);
  currentRange = calendarRange || '2026-03';
  const cellSize = getResponsiveCellSize();

  // 5. 图表配置（调整显示范围为数据最后一个月）
  const option = {
    tooltip: {
      formatter: function (params) {
        return `${params.value[0]}<br/>学习时长: ${params.value[1]} 小时`;
      }
    },
    visualMap: {
      show: false,
      min: 0,
      max: Math.ceil(maxHours),
      calculable: true,
      seriesIndex: [0],
      orient: 'horizontal',
      left: 'center',
      bottom: 20,
      inRange: {
        color: [themeColors.primarySoft, themeColors.primary],
        opacity: 0.38
      },
      controller: {
        inRange: {
          opacity: 0.4
        }
      }
    },
    calendar: [{
      left: 'center',
      top: 'middle',
      cellSize,
      yearLabel: { show: false },
      orient: 'vertical',
      dayLabel: {
        firstDay: 1,
        nameMap: 'cn'
      },
      monthLabel: {
        show: false
      },
      range: currentRange // 若无数据则回退
    }],
    series: [
      {
        name: '学习时长',
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: heatmapData
      },
      {
        type: 'scatter',
        coordinateSystem: 'calendar',
        symbolSize: 1,
        label: {
          show: true,
          formatter: function (params) {
            const hours = params.value[1];
            return hours > 0 ? `${hours}h` : '';
          },
          fontSize: 12,
          fontWeight: 700,
          color: themeColors.text
        },
        data: heatmapData
      }
    ]
  };
  
  // 6. 渲染图表
  chartInstance.setOption(option);
  
  // 7. 更新状态
  loading.value = false;
  updateCalendarLayout();
};

// 生命周期管理
onMounted(async () => {
  await initChart(); // 等待数据加载和图表初始化
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateCalendarLayout();
    });
    resizeObserver.observe(chartRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver && chartRef.value) {
    resizeObserver.unobserve(chartRef.value);
    resizeObserver.disconnect();
  }
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style scoped>
.calendar-chart-container {
  width: 100%;
  height: 100%;
  min-height: 240px;
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
  width: 100%;
  height: 100%;
}
</style>
