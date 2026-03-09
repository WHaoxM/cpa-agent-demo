<!-- 页面：学习报告；路由：student/report（student-report）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import DataFilter from '@/components/charts/DataFilter.vue'
import TimelineChart from '@/components/charts/TimelineChartSimple.vue'
import { useRouter } from 'vue-router'
import { useLearningStore, type LearningRecord, type DataFilters } from '@/stores/learning'
import { debounce, formatTime, formatDateTime } from '@/utils'

echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const learningStore = useLearningStore()
const router = useRouter()

const loading = ref(false)
const filterRef = ref()
const timelineView = ref<'week' | 'month' | 'year'>('month')
const currentPage = ref(1)
const pageSize = ref(20)

const dashboardCourseRef = ref<HTMLElement | null>(null)
const dashboardProgressRef = ref<HTMLElement | null>(null)
const dashboardTrendRef = ref<HTMLElement | null>(null)
const dashboardDistRef = ref<HTMLElement | null>(null)

let courseChart: echarts.ECharts | null = null
let progressChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null
let distChart: echarts.ECharts | null = null

const trendDates = ref<string[]>([])
const trendHours = ref<number[]>([])

const filteredLearningHistory = computed(() => learningStore.filteredLearningHistory)
const filters = computed(() => learningStore.filters)
const statistics = computed(() => learningStore.statistics)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLearningHistory.value.slice(start, end)
})

const filteredTimelineData = computed(() => {
  const data = learningStore.timelineData
  const now = new Date()
  let startDate = new Date()

  switch (timelineView.value) {
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  const startDateStr = startDate.toISOString().split('T')[0] ?? ''
  return data.filter(item => item.date >= startDateStr)
})


function generateTrendData() {
  const dates: string[] = []
  const hours: number[] = []
  const pad2 = (n: number) => String(n).padStart(2, '0')

  for (let day = 1; day <= 28; day++) {
    const dateStr = `2026-02-${pad2(day)}`
    dates.push(dateStr)

    const raw = 2.5 + (Math.random() - 0.5) * 2.2
    const clamped = Math.max(0.6, Math.min(4.6, raw))
    hours.push(Number(clamped.toFixed(2)))
  }

  trendDates.value = dates
  trendHours.value = hours
}

function buildDashboardOptions() {
  const courseCompletionData = [
    { name: 'Vue3 基础', value: 92 },
    { name: 'TypeScript 实战', value: 78 },
    { name: '算法与数据结构', value: 64 },
    { name: '工程化与构建', value: 55 },
    { name: '项目实战', value: 38 },
  ]

  const courseNames = courseCompletionData.map(d => d.name)
  const courseValues = courseCompletionData.map(d => d.value)

  const optionCourse = {
    grid: {
      left: 12,
      right: 26,
      top: 10,
      bottom: 10,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params && params[0]
        if (!p) return ''
        return `${p.name}<br/>完成进度：<b>${p.value}%</b>`
      },
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#eef2f7' } },
    },
    yAxis: {
      type: 'category',
      data: courseNames,
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        name: '完成进度',
        type: 'bar',
        barWidth: 14,
        data: courseValues,
        itemStyle: {
          borderRadius: [7, 7, 7, 7],
          color: new (echarts as any).graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#34D399' },
            { offset: 1, color: '#10B981' },
          ]),
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#111827',
          fontWeight: 700,
        },
      },
    ],
  }

  const progressDistribution = [
    { name: '0% 未开始', value: 8 },
    { name: '1-30% 刚起步', value: 22 },
    { name: '31-60% 进行中', value: 35 },
    { name: '61-90% 冲刺段', value: 25 },
    { name: '100% 已完成', value: 10 },
  ]
  const donutColors = ['#9CA3AF', '#60A5FA', '#F59E0B', '#A78BFA', '#2ECC71']

  const optionProgress = {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.name}<br/>占比：<b>${p.percent}%</b>（${p.value}）`,
    },
    legend: {
      bottom: 0,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        name: '学习进度分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 800,
            formatter: (p: any) => `${p.percent}%`,
          },
        },
        labelLine: { show: false },
        data: progressDistribution.map((d, i) => ({
          ...d,
          itemStyle: { color: donutColors[i % donutColors.length] },
        })),
      },
    ],
  }

  const optionTrend = {
    grid: {
      left: 12,
      right: 18,
      top: 10,
      bottom: 35,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params && params[0]
        if (!p) return ''
        return `${p.axisValue}<br/>学习时长：<b>${p.data} 小时</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: trendDates.value,
      axisLabel: {
        rotate: 45,
        color: '#374151',
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '小时',
      axisLabel: { color: '#374151' },
      splitLine: { lineStyle: { color: '#eef2f7' } },
    },
    series: [
      {
        name: '学习时长',
        type: 'line',
        smooth: true,
        data: trendHours.value,
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#2ECC71',
        },
        itemStyle: {
          color: '#2ECC71',
        },
        areaStyle: {
          color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(46, 204, 113, 0.35)' },
            { offset: 1, color: 'rgba(46, 204, 113, 0.04)' },
          ]),
        },
      },
    ],
  }

  const timeBuckets = ['0-1', '1-2', '2-3', '3-4', '4+']
  const timeBucketCounts = [18, 45, 62, 28, 7]

  const optionDist = {
    grid: {
      left: 12,
      right: 18,
      top: 10,
      bottom: 10,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params && params[0]
        if (!p) return ''
        return `时长区间：${p.axisValue}<br/>频次：<b>${p.data}</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: timeBuckets,
      axisTick: { show: false },
      axisLabel: { color: '#374151' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#374151' },
      splitLine: { lineStyle: { color: '#eef2f7' } },
    },
    series: [
      {
        name: '频次',
        type: 'bar',
        data: timeBucketCounts,
        barWidth: 26,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#60A5FA' },
            { offset: 1, color: '#3B82F6' },
          ]),
        },
        label: {
          show: true,
          position: 'top',
          color: '#111827',
          fontWeight: 700,
        },
      },
    ],
  }

  return { optionCourse, optionProgress, optionTrend, optionDist }
}

function ensureInitDashboard() {
  if (!dashboardCourseRef.value || !dashboardProgressRef.value || !dashboardTrendRef.value || !dashboardDistRef.value) return

  if (!courseChart) courseChart = echarts.init(dashboardCourseRef.value)
  if (!progressChart) progressChart = echarts.init(dashboardProgressRef.value)
  if (!trendChart) trendChart = echarts.init(dashboardTrendRef.value)
  if (!distChart) distChart = echarts.init(dashboardDistRef.value)

  const { optionCourse, optionProgress, optionTrend, optionDist } = buildDashboardOptions()
  courseChart.setOption(optionCourse)
  progressChart.setOption(optionProgress)
  trendChart.setOption(optionTrend)
  distChart.setOption(optionDist)
}

function resizeDashboard() {
  courseChart?.resize()
  progressChart?.resize()
  trendChart?.resize()
  distChart?.resize()
}

const handleFilterChange = debounce((newFilters: DataFilters) => {
  learningStore.updateFilters(newFilters)
  currentPage.value = 1
}, 300)

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const loadSampleData = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    learningStore.loadSampleData()
    ElMessage.success('示例数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const editRecord = (record: LearningRecord) => {
  ElMessage.info(`编辑功能待实现: ${record.courseName}`)
}

const deleteRecord = async (record: LearningRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学习记录"${record.courseName}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    learningStore.deleteLearningRecord(record.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const exportChart = (type: string) => {
  ElMessage.info(`${type}图表导出功能待实现`)
}

const exportTable = () => {
  ElMessage.info('表格导出功能待实现')
}

const getCourseTypeColor = (type: string) => {
  const colors = {
    programming: 'primary',
    design: 'success',
    math: 'warning',
    english: 'info',
    science: 'danger',
  }
  return (colors as any)[type] || 'info'
}

const getCourseTypeName = (type: string) => {
  const names = {
    programming: '编程',
    design: '设计',
    math: '数学',
    english: '英语',
    science: '科学',
  }
  return (names as any)[type] || type
}

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger',
    expert: 'info',
  }
  return (colors as any)[difficulty] || 'info'
}

const getDifficultyName = (difficulty: string) => {
  const names = {
    beginner: '入门',
    intermediate: '初级',
    advanced: '高级',
    expert: '专家',
  }
  return (names as any)[difficulty] || difficulty
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'excellent-score'
  if (score >= 80) return 'good-score'
  if (score >= 60) return 'pass-score'
  return 'fail-score'
}

const formatDate = (dateStr: string) => {
  return formatDateTime(dateStr)
}

type SuggestionItem = { icon: string; title: string; desc: string }

type CourseRecommendation = {
  id: string
  title: string
  weakness: string
  reason: string
  level: '入门' | '进阶' | '挑战'
  eta: string
  outline: string[]
}

const weeklyStudyDays = computed(() => {
  const now = new Date()
  const start = new Date()
  start.setDate(now.getDate() - 6)
  const startStr = start.toISOString().split('T')[0] ?? ''
  const endStr = now.toISOString().split('T')[0] ?? ''

  const set = new Set(
    learningStore.learningHistory
      .map(r => (r.completedAt.split('T')[0] ?? ''))
      .filter(d => d && d >= startStr && d <= endStr),
  )

  return set.size
})

const safeAverageScore = computed(() => {
  const v = statistics.value.averageScore
  if (!Number.isFinite(v)) return 0
  return Math.round(v)
})

const suggestions = computed((): SuggestionItem[] => {
  const totalMins = statistics.value.totalStudyTime
  const totalHours = Math.round((totalMins / 60) * 10) / 10
  const completion = Math.round(statistics.value.completionRate)

  const list: SuggestionItem[] = []

  if (completion < 50) {
    list.push({
      icon: 'fluent-emoji:construction',
      title: '先做完一件事再开新坑',
      desc: `当前完成率约 ${completion}%。建议挑 1 门课打穿到 80%+，再去碰下一门。`,
    })
  } else if (completion < 80) {
    list.push({
      icon: 'fluent-emoji:spiral-calendar',
      title: '把节奏固定下来',
      desc: `完成率约 ${completion}%。别拼爆发，拼稳定：每天 30-60 分钟，连续 7 天更有效。`,
    })
  } else {
    list.push({
      icon: 'fluent-emoji:check-mark-button',
      title: '进度很好，开始做“回头看”',
      desc: `完成率约 ${completion}%。建议把最近学过的内容做一次复盘/错题整理，输出一页笔记。`,
    })
  }

  if (weeklyStudyDays.value <= 2) {
    list.push({
      icon: 'fluent-emoji:hourglass-not-done',
      title: '最近有点断档',
      desc: `近 7 天学习天数只有 ${weeklyStudyDays.value} 天。建议把目标缩小到“每天 20 分钟”，先把连续性捡回来。`,
    })
  } else {
    list.push({
      icon: 'fluent-emoji:runner',
      title: '连续性不错，别掉链子',
      desc: `近 7 天学习 ${weeklyStudyDays.value} 天，总学习约 ${totalHours} 小时。建议保留现在的学习窗口，不要轻易换。`,
    })
  }

  if (safeAverageScore.value > 0 && safeAverageScore.value < 80) {
    list.push({
      icon: 'fluent-emoji:target',
      title: '分数提醒：别只刷进度',
      desc: `当前平均分约 ${safeAverageScore.value}。建议每完成 1 章就做 1 次小测，把薄弱点抓出来。`,
    })
  } else if (safeAverageScore.value >= 90) {
    list.push({
      icon: 'fluent-emoji:trophy',
      title: '你这成绩有点猛',
      desc: `平均分约 ${safeAverageScore.value}。可以尝试做更难的题，或者去带同学：讲一遍最能检验掌握。`,
    })
  } else {
    list.push({
      icon: 'fluent-emoji:magnifying-glass-tilted-right',
      title: '把数据补齐会更准',
      desc: '部分记录没有分数。建议补做测验/练习，这样建议会更“对症下药”。',
    })
  }

  return list.slice(0, 3)
})

const weakPointRecommendations = computed((): CourseRecommendation[] => {
  return [
    {
      id: 'course_002',
      title: 'TypeScript 进阶开发',
      weakness: '泛型与类型约束',
      reason: '你的测验记录里，“泛型/高级类型”相关题目耗时偏长。先把类型系统补齐，后面写业务会更快。',
      level: '进阶',
      eta: '2h 30m',
      outline: ['泛型约束与默认类型', '条件类型与工具类型', '类型体操：从可读到可控'],
    },
    {
      id: 'course_001',
      title: 'Vue 3 前端开发实战',
      weakness: '生命周期与组合式心智模型',
      reason: '你在生命周期相关知识点上波动较大。用“组合式拆解”的方式复盘一遍，会更稳。',
      level: '入门',
      eta: '1h 40m',
      outline: ['setup 与生命周期映射', '副作用管理：watch/watchEffect', '组件抽象：可复用组合函数'],
    },
    {
      id: 'course_005',
      title: 'MySQL 数据库设计与优化',
      weakness: '索引与查询优化',
      reason: '学习曲线到了“卡住就卡很久”的阶段。把 SQL 性能优化打穿，会让你做项目时少走弯路。',
      level: '挑战',
      eta: '3h 10m',
      outline: ['索引的选择与代价', 'Explain 看懂执行计划', '慢查询治理：从现象到根因'],
    },
  ]
})

function openRecommendedCourse(courseId: string) {
  router.push({ name: 'student-course-tasks', params: { id: courseId } })
}

onMounted(() => {
  if (learningStore.learningHistory.length === 0) {
    learningStore.loadFromStorage()
  }

  if (learningStore.learningHistory.length === 0) {
    learningStore.loadSampleData()
  }

  generateTrendData()
  nextTick(() => {
    ensureInitDashboard()
  })
  window.addEventListener('resize', resizeDashboard)
})

watch(
  () => filters.value.viewMode,
  () => {
    nextTick(() => {
      ensureInitDashboard()
    })
  },
)

watch(
  () => [trendDates.value.length, trendHours.value.length],
  () => {
    ensureInitDashboard()
  },
)

// 清理 ECharts 实例
onUnmounted(() => {
  window.removeEventListener('resize', resizeDashboard)
  courseChart?.dispose()
  progressChart?.dispose()
  trendChart?.dispose()
  distChart?.dispose()
  courseChart = null
  progressChart = null
  trendChart = null
  distChart = null
})
</script>



<template>
  <div class="report-page page">
    <div class="page-header">
      <h2>学习报告</h2>
    </div>

    <DataFilter @filter-change="handleFilterChange" ref="filterRef" />

    <div class="kpi-strip">
      <div class="kpi-item">
        <div class="kpi-item__label">课程</div>
        <div class="kpi-item__value">{{ statistics.totalCourses }}</div>
        <div class="kpi-item__hint">已记录课程数</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-item__label">学习时长</div>
        <div class="kpi-item__value">{{ statistics.totalStudyTime }} 分</div>
        <div class="kpi-item__hint">总学习时间</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-item__label">完成率</div>
        <div class="kpi-item__value">{{ Math.round(statistics.completionRate) }}%</div>
        <div class="kpi-item__hint">平均课程进度</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-item__label">平均分</div>
        <div class="kpi-item__value">{{ Math.round(statistics.averageScore) }}</div>
        <div class="kpi-item__hint">有分数记录才统计</div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else class="data-display">
      <div v-if="filters.viewMode === 'chart' || filters.viewMode === 'both'" class="chart-view">
        <div class="dash-grid">
          <section class="dash-panel">
            <div class="dash-panel__title">
              <span>课程完成进度</span>
              <button class="dash-link" @click="exportChart('course')">导出</button>
            </div>
            <div ref="dashboardCourseRef" class="dash-chart" />
          </section>

          <section class="dash-panel">
            <div class="dash-panel__title">
              <span>学习进度分布</span>
              <button class="dash-link" @click="exportChart('progress')">导出</button>
            </div>
            <div ref="dashboardProgressRef" class="dash-chart" />
          </section>

          <section class="dash-panel">
            <div class="dash-panel__title">
              <span>学习时间趋势</span>
              <button class="dash-link" @click="exportChart('trend')">导出</button>
            </div>
            <div ref="dashboardTrendRef" class="dash-chart" />
          </section>

          <section class="dash-panel">
            <div class="dash-panel__title">
              <span>学习时间分布</span>
              <button class="dash-link" @click="exportChart('distribution')">导出</button>
            </div>
            <div ref="dashboardDistRef" class="dash-chart" />
          </section>
        </div>

        <section class="dash-panel dash-panel--wide">
          <div class="dash-panel__title">
            <span>学习历史时间轴</span>
            <div class="dash-panel__actions">
              <div class="dash-tabs">
                <button class="dash-tab" :class="{ active: timelineView === 'week' }" @click="timelineView = 'week'">周</button>
                <button class="dash-tab" :class="{ active: timelineView === 'month' }" @click="timelineView = 'month'">月</button>
                <button class="dash-tab" :class="{ active: timelineView === 'year' }" @click="timelineView = 'year'">年</button>
              </div>
              <button class="dash-link" @click="exportChart('timeline')">导出</button>
            </div>
          </div>
          <div class="dash-chart dash-chart--timeline">
            <TimelineChart :data="filteredTimelineData" />
          </div>
        </section>
      </div>

      <div v-if="filters.viewMode === 'table' || filters.viewMode === 'both'" class="table-view">
        <el-card class="table-card">
          <template #header>
            <div class="table-header">
              <span>学习记录详情</span>
              <div class="table-actions">
                <el-button type="primary" size="small" @click="exportTable">导出表格</el-button>
                <el-button type="default" size="small" @click="loadSampleData">加载示例数据</el-button>
              </div>
            </div>
          </template>

          <el-table :data="paginatedData" stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="courseName" label="课程名称" width="200" />
            <el-table-column prop="courseType" label="课程类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getCourseTypeColor(row.courseType)">
                  {{ getCourseTypeName(row.courseType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="difficulty" label="难度" width="100">
              <template #default="{ row }">
                <el-tag :type="getDifficultyColor(row.difficulty)" size="small">
                  {{ getDifficultyName(row.difficulty) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="studyTime" label="学习时长" width="100">
              <template #default="{ row }">
                {{ formatTime(row.studyTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="progress" label="进度" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" :show-text="true" />
              </template>
            </el-table-column>
            <el-table-column prop="score" label="测试分数" width="100">
              <template #default="{ row }">
                <span v-if="row.score" :class="getScoreClass(row.score)">{{ row.score }}分</span>
                <span v-else class="no-score">未测试</span>
              </template>
            </el-table-column>
            <el-table-column prop="completedAt" label="完成时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.completedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="text" size="small" @click="editRecord(row)">编辑</el-button>
                <el-button type="text" size="small" style="color: #f56c6c" @click="deleteRecord(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredLearningHistory.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>

    <el-card class="suggestions-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>学习建议</span>
          <el-tag size="small" type="info">基于当前筛选数据</el-tag>
        </div>
      </template>

      <div class="suggestions-content">
        <div v-for="item in suggestions" :key="item.title" class="suggestion-item">
          <div class="suggestion-icon">
            <Icon :icon="item.icon" />
          </div>
          <div class="suggestion-text">
            <h4>{{ item.title }}</h4>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="recommend-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>薄弱点课程推荐</span>
          <el-tag size="small" type="warning">先写死，后续智能体推理</el-tag>
        </div>
      </template>

      <div class="recommend-grid">
        <button
          v-for="rec in weakPointRecommendations"
          :key="rec.id"
          type="button"
          class="recommend-item"
          @click="openRecommendedCourse(rec.id)"
        >
          <div class="recommend-item__top">
            <div class="recommend-item__title">{{ rec.title }}</div>
            <div class="recommend-pill">{{ rec.weakness }}</div>
          </div>

          <div class="recommend-item__reason">{{ rec.reason }}</div>

          <div class="recommend-item__meta">
            <span class="meta-chip">难度：{{ rec.level }}</span>
            <span class="meta-chip">预计：{{ rec.eta }}</span>
          </div>

          <div class="recommend-item__outline">
            <div v-for="(t, idx) in rec.outline" :key="idx" class="outline-row">
              <span class="outline-dot" />
              <span class="outline-text">{{ t }}</span>
            </div>
          </div>

          <div class="recommend-item__cta">去学习</div>
        </button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.report-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin: 14px 0 18px;
}

.kpi-item {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(16, 24, 40, 0.06);
  padding: 14px 14px 12px;
  border: 1px solid #eef2f7;
}

.kpi-item__label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-200);
}

.kpi-item__value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 900;
  color: var(--text-100);
  line-height: 1.1;
}

.kpi-item__hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-200);
}

.dash-grid {
  height: 720px;
  min-height: 680px;
  display: grid;
  grid-template-columns: 60% 40%;
  grid-template-rows: 50% 50%;
  gap: 20px;
}

.dash-panel {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(16, 24, 40, 0.08);
  padding: 15px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.dash-panel__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  padding-bottom: 10px;
  margin: 0 0 12px;
  border-bottom: 1px solid #e5e7eb;
}

.dash-link {
  appearance: none;
  border: none;
  background: transparent;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-200);
}

.dash-link:hover {
  background: color-mix(in srgb, var(--primary-100) 10%, transparent);
  color: var(--text-100);
}

.dash-chart {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.dash-panel--wide {
  margin-top: 20px;
}

.dash-panel__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dash-tabs {
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.dash-tab {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  color: #374151;
}

.dash-tab.active {
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(16, 24, 40, 0.08);
}

.dash-chart--timeline {
  height: 340px;
}

.page-header {
  margin-bottom: 14px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.loading-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-display {
  margin-top: 20px;
}

.chart-view {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.timeline-row {
  margin-top: 20px;
}

.table-view {
  margin-top: 20px;
}

.table-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.suggestions-card {
  margin-top: 20px;
}

.recommend-card {
  margin-top: 20px;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.recommend-item {
  appearance: none;
  border: 1px solid color-mix(in srgb, var(--primary-100) 22%, #e5e7eb 78%);
  background: radial-gradient(700px 220px at 20% 0%, color-mix(in srgb, var(--primary-100) 14%, transparent) 0%, transparent 60%),
    #ffffff;
  border-radius: 14px;
  padding: 16px 16px 14px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  transition: box-shadow 220ms, transform 220ms, border-color 220ms;
}

.recommend-item:hover {
  border-color: color-mix(in srgb, var(--primary-100) 45%, #d1d5db 55%);
  box-shadow: 0 18px 34px rgba(16, 24, 40, 0.10);
  transform: translateY(-2px);
}

.recommend-item__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.recommend-item__title {
  font-size: 16px;
  font-weight: 950;
  color: var(--text-100);
  line-height: 1.2;
  min-width: 0;
}

.recommend-pill {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.recommend-item__reason {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-200);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommend-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chip {
  font-size: 12px;
  font-weight: 800;
  color: #111827;
  background: color-mix(in srgb, var(--primary-100) 10%, #ffffff 90%);
  border: 1px solid color-mix(in srgb, var(--primary-100) 18%, #e5e7eb 82%);
  padding: 6px 10px;
  border-radius: 10px;
}

.recommend-item__outline {
  padding-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.outline-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.outline-dot {
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--primary-100) 45%, #9ca3af 55%);
  flex-shrink: 0;
}

.outline-text {
  font-size: 12px;
  color: #374151;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommend-item__cta {
  margin-top: 4px;
  align-self: flex-start;
  font-size: 13px;
  font-weight: 950;
  color: #ffffff;
  background: #111827;
  padding: 8px 12px;
  border-radius: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.suggestions-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.suggestion-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: var(--bg-200);
  border-radius: 12px;
}

.suggestion-icon {
  font-size: 28px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--primary-100) 12%, var(--bg-100) 88%);
  border: 1px solid color-mix(in srgb, var(--primary-100) 22%, var(--bg-300) 78%);
}

.suggestion-text h4 {
  margin: 0 0 8px;
  font-size: 16px;
}

.suggestion-text p {
  margin: 0;
  font-size: 14px;
  color: var(--text-200);
  line-height: 1.6;
}

/* 分数样式 */
.excellent-score {
  color: #67c23a;
  font-weight: bold;
}

.good-score {
  color: #409eff;
  font-weight: bold;
}

.pass-score {
  color: #e6a23c;
  font-weight: bold;
}

.fail-score {
  color: #f56c6c;
  font-weight: bold;
}

.no-score {
  color: #909399;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .kpi-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .suggestions-content {
    grid-template-columns: 1fr;
  }

  .recommend-grid {
    grid-template-columns: 1fr;
  }

  .dash-grid {
    height: auto;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .dash-panel {
    height: 420px;
  }

  .dash-panel--wide {
    height: auto;
  }
}

@media (max-width: 768px) {
  .kpi-strip {
    grid-template-columns: 1fr;
  }

  .suggestions-content {
    grid-template-columns: 1fr;
  }
  
  .chart-header,
  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .chart-actions,
  .table-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>


