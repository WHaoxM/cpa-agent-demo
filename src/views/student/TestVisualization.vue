<!-- 页面：可视化测试；路由：student/visualization（student-visualization）；角色：STUDENT/TEACHER -->
<template>
  <div class="test-page">
    <h1>数据可视化测试页面</h1>
    
    <el-alert
      title="测试说明"
      type="info"
      description="此页面用于测试数据可视化组件的基本功能。如果图表正常显示，说明组件工作正常。"
      show-icon
      :closable="false"
      style="margin-bottom: 20px;"
    />
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>进度图表测试</span>
          </template>
          <ProgressChart :data="testData" />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>时间轴图表测试</span>
          </template>
          <TimelineChart :data="timelineData" />
        </el-card>
      </el-col>
    </el-row>
    
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>数据筛选测试</span>
          </template>
          <DataFilter @filter-change="handleFilterChange" />
        </el-card>
      </el-col>
    </el-row>
    
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>统计面板测试</span>
          </template>
          <StatisticsPanel />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProgressChart from '@/components/charts/ProgressChartSimple.vue'
import TimelineChart from '@/components/charts/TimelineChartSimple.vue'
import DataFilter from '@/components/charts/DataFilter.vue'
import StatisticsPanel from '@/components/charts/StatisticsPanel.vue'
import { ElMessage } from 'element-plus'

// 测试数据
const testData = ref([
  { name: '已完成', value: 35, color: '#67C23A' },
  { name: '学习中', value: 25, color: '#409EFF' },
  { name: '未开始', value: 20, color: '#E6A23C' },
  { name: '已暂停', value: 10, color: '#F56C6C' }
])

const timelineData = ref([
  { date: '2026-02-20', studyTime: 2.5, completedCourses: 1, testScore: 85 },
  { date: '2026-02-21', studyTime: 3.2, completedCourses: 2, testScore: 90 },
  { date: '2026-02-22', studyTime: 1.8, completedCourses: 0, testScore: 0 },
  { date: '2026-02-23', studyTime: 4.1, completedCourses: 1, testScore: 88 },
  { date: '2026-02-24', studyTime: 2.9, completedCourses: 1, testScore: 92 }
])

const handleFilterChange = (filters: any) => {
  ElMessage.success('筛选条件已更新')
  console.log('筛选条件:', filters)
}
</script>

<style scoped>
.test-page {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  text-align: center;
}
</style>

