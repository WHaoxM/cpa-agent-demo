<!-- 组件：数据筛选器（用于图表/统计面板的条件筛选） -->
<template>
  <div class="data-filter">
    <el-card class="filter-card">
      <template #header>
        <div class="filter-header">
          <span class="filter-title">数据筛选</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="resetFilters"
            :icon="Refresh"
          >
            重置
          </el-button>
        </div>
      </template>
      
      <div class="filter-content">
        <!-- 时间范围选择 -->
        <div class="filter-item">
          <label class="filter-label">时间范围:</label>
          <el-select 
            v-model="filters.timeRange" 
            @change="handleTimeRangeChange"
            placeholder="选择时间范围"
            style="width: 150px"
          >
            <el-option label="今日" value="today" />
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="本年" value="year" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </div>

        <!-- 自定义日期范围 -->
        <div v-if="filters.timeRange === 'custom'" class="filter-item">
          <label class="filter-label">自定义日期:</label>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleFilterChange"
          />
        </div>

        <!-- 课程类型过滤 -->
        <div class="filter-item">
          <label class="filter-label">课程类型:</label>
          <el-select 
            v-model="filters.courseType" 
            @change="handleFilterChange"
            placeholder="选择课程类型"
            style="width: 150px"
          >
            <el-option label="全部" value="all" />
            <el-option label="编程" value="programming" />
            <el-option label="设计" value="design" />
            <el-option label="数学" value="math" />
            <el-option label="英语" value="english" />
            <el-option label="科学" value="science" />
          </el-select>
        </div>

        <!-- 难度等级筛选 -->
        <div class="filter-item">
          <label class="filter-label">难度等级:</label>
          <el-select 
            v-model="filters.difficulty" 
            @change="handleFilterChange"
            placeholder="选择难度"
            style="width: 150px"
          >
            <el-option label="全部" value="all" />
            <el-option label="入门" value="beginner" />
            <el-option label="初级" value="intermediate" />
            <el-option label="高级" value="advanced" />
            <el-option label="专家" value="expert" />
          </el-select>
        </div>

        <!-- 数据视图切换 -->
        <div class="filter-item">
          <label class="filter-label">数据视图:</label>
          <el-radio-group 
            v-model="filters.viewMode" 
            @change="handleFilterChange"
          >
            <el-radio-button value="chart">图表</el-radio-button>
            <el-radio-button value="table">表格</el-radio-button>
            <el-radio-button value="both">组合</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

// 筛选条件接口
interface DataFilters {
  timeRange: string
  dateRange: [string, string] | null
  courseType: string
  difficulty: string
  viewMode: 'chart' | 'table' | 'both'
}

// 事件定义
const emit = defineEmits<{
  filterChange: [filters: DataFilters]
}>()

// 筛选条件
const filters = reactive<DataFilters>({
  timeRange: 'month',
  dateRange: null,
  courseType: 'all',
  difficulty: 'all',
  viewMode: 'chart'
})

// 处理时间范围变化
const handleTimeRangeChange = (value: string) => {
  if (value !== 'custom') {
    filters.dateRange = null
    // 根据选择的时间范围计算日期
    const endDate = new Date()
    let startDate = new Date()
    
    switch (value) {
      case 'today':
        startDate = new Date()
        break
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }
    
    filters.dateRange = [
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ]
  }
  
  handleFilterChange()
}

// 处理筛选条件变化
const handleFilterChange = () => {
  emit('filterChange', { ...filters })
}

// 重置筛选条件
const resetFilters = () => {
  filters.timeRange = 'month'
  filters.dateRange = null
  filters.courseType = 'all'
  filters.difficulty = 'all'
  filters.viewMode = 'chart'
  
  ElMessage.success('筛选条件已重置')
  handleFilterChange()
}

// 暴露筛选条件给父组件
defineExpose({
  filters,
  resetFilters
})
</script>

<style scoped>
.data-filter {
  margin-bottom: 20px;
}

.filter-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.filter-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  min-width: 80px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-content {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .filter-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .filter-label {
    min-width: auto;
  }
  
  .el-select,
  .el-date-picker {
    width: 100% !important;
  }
}

@media (max-width: 480px) {
  .filter-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .filter-content {
    gap: 10px;
  }
}
</style>


