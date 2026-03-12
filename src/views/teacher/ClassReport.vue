<!-- 页面：班级报告；路由：teacher/class-report（teacher-class-report）；角色：TEACHER -->
<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { usePageEntrance } from '@/composables/usePageEntrance'
import PieChart from '@/components/charts/PieChart.vue'
import HistogramChart from '@/components/charts/HistogramChart.vue'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart.vue'
import { mockTeacherStats } from '@/mock/data'
import IntegrationHint from '@/components/IntegrationHint.vue'

const { pageRef } = usePageEntrance()
const chartColors = ['var(--primary-100)', 'var(--primary-200)', 'var(--accent-100)']

// 作业完成情况饼图数据
const completionData = [
  { name: '已完成', value: mockTeacherStats.classProgress.completed },
  { name: '未完成', value: mockTeacherStats.classProgress.notStarted },
  { name: '进行中', value: mockTeacherStats.classProgress.inProgress },
]

// 成绩分布直方图数据
const scoreDistributionData = mockTeacherStats.scoreDistribution.map(item => ({
  range: item.range,
  count: item.count,
}))

// 知识点错误率横向柱状图数据
const errorRateData = mockTeacherStats.knowledgeErrorRate.map(item => ({
  name: item.name,
  value: item.errorRate,
}))
</script>



<template>
  <div ref="pageRef" class="class-report-page page">
    <div class="page-header">
      <h2>班级报告</h2>
      <p class="subtitle">班级整体学习情况数据分析</p>
      <IntegrationHint />
    </div>

    <div class="charts-grid">
      <!-- 作业完成情况 -->
      <el-card class="chart-card card-base" shadow="never">
        <template #header>
          <div class="card-header">
            <span>作业完成情况</span>
            <el-tag size="small" type="info">饼图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper">
          <PieChart
            :data="completionData"
            :width="400"
            :height="350"
            title="作业完成占比"
            :colors="chartColors"
          />
        </div>
      </el-card>

      <!-- 成绩分布 -->
      <el-card class="chart-card card-base" shadow="never">
        <template #header>
          <div class="card-header">
            <span>成绩分布</span>
            <el-tag size="small" type="info">直方图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper">
          <HistogramChart
            :data="scoreDistributionData"
            :width="550"
            :height="350"
            title="分数段人数分布"
            bar-color="var(--primary-100)"
          />
        </div>
      </el-card>

      <!-- 知识点错误率 -->
      <el-card class="chart-card full-width card-base" shadow="never">
        <template #header>
          <div class="card-header">
            <span>知识点错误率排行</span>
            <el-tag size="small" type="info">横向柱状图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper">
          <HorizontalBarChart
            :data="errorRateData"
            :width="800"
            :height="350"
            title="各知识点错题率 (%)"
            bar-color="var(--accent-100)"
            value-label="错误率 (%)"
          />
        </div>
      </el-card>
    </div>

    <!-- 数据摘要 -->
    <el-card class="summary-card card-base" shadow="never">
      <template #header>
        <div class="card-header">
          <span>数据摘要</span>
        </div>
      </template>
      <div class="summary-content">
        <div class="summary-item card-data">
          <div class="summary-value">{{ mockTeacherStats.classProgress.completed }}%</div>
          <div class="summary-label">作业完成率</div>
        </div>
        <div class="summary-item card-data">
          <div class="summary-value">{{ mockTeacherStats.scoreDistribution[1].count + mockTeacherStats.scoreDistribution[2].count }}</div>
          <div class="summary-label">优良人数(80分以上)</div>
        </div>
        <div class="summary-item card-data">
          <div class="summary-value">{{ mockTeacherStats.knowledgeErrorRate[2].name }}</div>
          <div class="summary-label">最薄弱知识点</div>
        </div>
        <div class="summary-item card-data">
          <div class="summary-value">{{ Math.round(mockTeacherStats.knowledgeErrorRate.reduce((sum, k) => sum + k.errorRate, 0) / mockTeacherStats.knowledgeErrorRate.length) }}%</div>
          <div class="summary-label">平均错误率</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.class-report-page {
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.subtitle {
  color: var(--text-200);
  margin: 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  min-height: 400px;
  background-color: var(--card-bg);
  border: 1px solid var(--card-divider);
  border-radius: 4px;
  padding: 20px;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
}

.summary-card {
  margin-top: 20px;
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.summary-item {
  text-align: center;
  padding: 18px;
  border: 1px solid var(--card-divider);
}

.summary-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-100);
  margin-bottom: 8px;
}

.summary-label {
  font-size: 13px;
  color: var(--text-200);
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-content {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>


