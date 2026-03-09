<!-- 页面：学情监控；路由：teacher/monitoring（teacher-monitoring）；角色：TEACHER -->
<script setup lang="ts">
import { computed } from 'vue'
import ScoreLineChart from '@/components/charts/ScoreLineChart.vue'
import KnowledgeRadarChart from '@/components/charts/KnowledgeRadarChart.vue'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart.vue'
import { mockTeacherStats } from '@/mock/data'
import IntegrationHint from '@/components/IntegrationHint.vue'

// 学生排名数据
const rankingData = mockTeacherStats.studentRanking.map((item, index) => ({
  name: item.name,
  value: item.score,
}))

// 班级知识点掌握雷达图数据
const classKnowledgeData = mockTeacherStats.classKnowledgePoints.map(item => ({
  axis: item.name,
  value: item.score,
}))

// 日均学习时长折线图数据
const studyTimeData = mockTeacherStats.dailyStudyTime.map(item => ({
  date: item.date,
  score: item.hours * 10, // 转换为0-100范围用于显示
}))
</script>



<template>
  <div class="monitoring-page page">
    <div class="page-header">
      <h2>学情监控</h2>
      <p class="subtitle">实时监控班级学习动态</p>
      <IntegrationHint />
    </div>

    <div class="charts-grid">
      <!-- 学生排名 -->
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>学生成绩排名</span>
            <el-tag size="small" type="info">横向柱状图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper">
          <HorizontalBarChart
            :data="rankingData"
            :width="550"
            :height="320"
            title=""
            bar-color="#409EFF"
            value-label="分数"
          />
        </div>
      </el-card>

      <!-- 班级知识点掌握 -->
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>班级知识点掌握</span>
            <el-tag size="small" type="info">雷达图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper radar-wrapper">
          <KnowledgeRadarChart
            :data="classKnowledgeData"
            :width="450"
            :height="350"
            title=""
            :max-value="100"
            color="#67C23A"
          />
        </div>
      </el-card>

      <!-- 学习时长趋势 -->
      <el-card class="chart-card full-width" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>班级日均学习时长趋势</span>
            <el-tag size="small" type="info">折线图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper">
          <ScoreLineChart
            :data="studyTimeData"
            :width="900"
            :height="320"
            title=""
            line-color="#E6A23C"
            :show-area="false"
          />
        </div>
      </el-card>
    </div>

    <!-- 预警信息 -->
    <el-card class="alert-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>学习预警</span>
          <el-tag type="danger" size="small">需关注</el-tag>
        </div>
      </template>
      <div class="alert-list">
        <div class="alert-item warning">
          <el-icon size="20"><Warning /></el-icon>
          <div class="alert-content">
            <div class="alert-title">王同学连续3天未登录学习</div>
            <div class="alert-desc">建议及时联系了解情况</div>
          </div>
          <el-button type="primary" link>查看详情</el-button>
        </div>
        <div class="alert-item danger">
          <el-icon size="20"><CircleClose /></el-icon>
          <div class="alert-content">
            <div class="alert-title">Composition API 知识点错误率超过40%</div>
            <div class="alert-desc">建议增加相关课时讲解</div>
          </div>
          <el-button type="primary" link>查看详情</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.monitoring-page {
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
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
}

.radar-wrapper {
  min-height: 380px;
}

.alert-card {
  margin-top: 20px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: var(--bg-200);
}

.alert-item.warning {
  border-left: 4px solid #E6A23C;
}

.alert-item.warning :deep(.el-icon) {
  color: #E6A23C;
}

.alert-item.danger {
  border-left: 4px solid #F56C6C;
}

.alert-item.danger :deep(.el-icon) {
  color: #F56C6C;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 13px;
  color: var(--text-200);
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>


