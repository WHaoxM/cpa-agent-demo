<!-- 组件：Visualization -->
<template>
  <div class="visualization-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>学习数据可视化</h1>
      <p>通过图表直观了解您的学习进度和成果</p>
    </div>

    <!-- 数据筛选 -->
    <DataFilter 
      @filter-change="handleFilterChange"
      ref="filterRef"
    />

    <!-- 统计面板 -->
    <StatisticsPanel />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 数据展示区域 -->
    <div v-else class="data-display">
      <!-- 图表视图 -->
      <div v-if="filters.viewMode === 'chart' || filters.viewMode === 'both'" class="chart-view">
        <el-row :gutter="20">
          <!-- 进度环形图 -->
          <el-col :xs="24" :lg="12">
            <el-card class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>课程完成进度</span>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="exportChart('progress')"
                  >
                    导出
                  </el-button>
                </div>
              </template>
              <ProgressChart :data="themedProgressData" />
            </el-card>
          </el-col>

          <!-- 学习时间分布 -->
          <el-col :xs="24" :lg="12">
            <el-card class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>学习时间分布</span>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="exportChart('time')"
                  >
                    导出
                  </el-button>
                </div>
              </template>
              <ProgressChart :data="themedTimeDistribution" title="学习时间段分布" />
            </el-card>
          </el-col>
        </el-row>

        <!-- 时间轴图表 -->
        <el-row class="timeline-row">
          <el-col :span="24">
            <el-card class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>学习历史时间轴</span>
                  <div class="chart-actions">
                    <el-button-group size="small">
                      <el-button 
                        :type="timelineView === 'week' ? 'primary' : ''"
                        @click="timelineView = 'week'"
                      >
                        周视图
                      </el-button>
                      <el-button 
                        :type="timelineView === 'month' ? 'primary' : ''"
                        @click="timelineView = 'month'"
                      >
                        月视图
                      </el-button>
                      <el-button 
                        :type="timelineView === 'year' ? 'primary' : ''"
                        @click="timelineView = 'year'"
                      >
                        年视图
                      </el-button>
                    </el-button-group>
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="exportChart('timeline')"
                    >
                      导出
                    </el-button>
                  </div>
                </div>
              </template>
              <TimelineChart :data="filteredTimelineData" />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 表格视图 -->
      <div v-if="filters.viewMode === 'table' || filters.viewMode === 'both'" class="table-view">
        <el-card class="table-card">
          <template #header>
            <div class="table-header">
              <span>学习记录详情</span>
              <div class="table-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="exportTable"
                >
                  导出表格
                </el-button>
                <el-button 
                  type="default" 
                  size="small" 
                  @click="loadSampleData"
                >
                  加载示例数据
                </el-button>
              </div>
            </div>
          </template>

          <el-table 
            :data="paginatedData" 
            stripe 
            style="width: 100%"
            v-loading="loading"
          >
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
                <el-progress 
                  :percentage="row.progress" 
                  :color="getProgressColor(row.progress)"
                  :show-text="true"
                />
              </template>
            </el-table-column>
            <el-table-column prop="score" label="测试分数" width="100">
              <template #default="{ row }">
                <span v-if="row.score" :class="getScoreClass(row.score)">
                  {{ row.score }}分
                </span>
                <span v-else class="no-score">未测试</span>
              </template>
            </el-table-column>
            <el-table-column prop="completedAt" label="完成时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.completedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="editRecord(row)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="text" 
                  size="small" 
                  style="color: #f56c6c"
                  @click="deleteRecord(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DataFilter from '@/components/charts/DataFilter.vue'
import StatisticsPanel from '@/components/charts/StatisticsPanel.vue'
import ProgressChart from '@/components/charts/ProgressChartSimple.vue'
import TimelineChart from '@/components/charts/TimelineChartSimple.vue'
import { useLearningStore, type LearningRecord, type DataFilters } from '@/stores/learning'
import { debounce, formatTime, formatDateTime } from '@/utils'
import { useThemePalette } from '@/composables/useThemePalette'

// 学习数据存储
const learningStore = useLearningStore()

const { palette } = useThemePalette()

// 响应式数据
const loading = ref(false)
const filterRef = ref()
const timelineView = ref<'week' | 'month' | 'year'>('month')
const currentPage = ref(1)
const pageSize = ref(20)

// 获取筛选后的数据
const filteredLearningHistory = computed(() => learningStore.filteredLearningHistory)
const progressData = computed(() => learningStore.progressData)
const timeDistribution = computed(() => learningStore.timeDistribution)
const filters = computed(() => learningStore.filters)

const chartColors = computed(() => {
  const p = palette.value
  return [p.primary, p.accent, p.primarySoft, p.accentSoft, p.textMuted].filter(Boolean)
})

const themedProgressData = computed(() => {
  const colors = chartColors.value
  return progressData.value.map((d: any, i: number) => ({
    ...d,
    color: colors[i % colors.length] || d.color,
  }))
})

const themedTimeDistribution = computed(() => {
  const colors = chartColors.value.slice().reverse()
  return timeDistribution.value.map((d: any, i: number) => ({
    ...d,
    color: colors[i % colors.length] || d.color,
  }))
})

// 分页数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLearningHistory.value.slice(start, end)
})

// 时间轴数据（根据视图模式过滤）
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

// 处理筛选条件变化
const handleFilterChange = debounce((newFilters: DataFilters) => {
  learningStore.updateFilters(newFilters)
  currentPage.value = 1 // 重置到第一页
}, 300)

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 加载示例数据
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

// 编辑记录
const editRecord = (record: LearningRecord) => {
  ElMessage.info(`编辑功能待实现: ${record.courseName}`)
}

// 删除记录
const deleteRecord = async (record: LearningRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学习记录"${record.courseName}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    learningStore.deleteLearningRecord(record.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

// 导出图表
const exportChart = (type: string) => {
  ElMessage.info(`${type}图表导出功能待实现`)
}

// 导出表格
const exportTable = () => {
  ElMessage.info('表格导出功能待实现')
}

// 工具函数
const getCourseTypeColor = (type: string) => {
  const colors = {
    programming: 'primary',
    design: 'success',
    math: 'warning',
    english: 'info',
    science: 'danger'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const getCourseTypeName = (type: string) => {
  const names = {
    programming: '编程',
    design: '设计',
    math: '数学',
    english: '英语',
    science: '科学'
  }
  return names[type as keyof typeof names] || type
}

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger',
    expert: 'info'
  }
  return colors[difficulty as keyof typeof colors] || 'info'
}

const getDifficultyName = (difficulty: string) => {
  const names = {
    beginner: '入门',
    intermediate: '初级',
    advanced: '高级',
    expert: '专家'
  }
  return names[difficulty as keyof typeof names] || difficulty
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

const formatLocalDate = (dateStr: string) => {
  return formatDateTime(dateStr)
}

// 监听时间轴视图变化
watch(timelineView, () => {
  // 可以在这里添加视图变化的逻辑
})

// 组件挂载时初始化数据
onMounted(() => {
  if (learningStore.learningHistory.length === 0) {
    learningStore.loadFromStorage()
  }
  
  // 如果仍然没有数据，加载示例数据
  if (learningStore.learningHistory.length === 0) {
    learningStore.loadSampleData()
  }
})
</script>

<style scoped>
.visualization-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 16px;
  color: #666;
  margin: 0;
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
@media (max-width: 768px) {
  .visualization-page {
    padding: 10px;
  }
  
  .page-header h1 {
    font-size: 24px;
  }
  
  .page-header p {
    font-size: 14px;
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

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 20px;
  }
  
  .chart-actions,
  .table-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>

