<!-- 页面：系统监控；路由：admin/system-stats（admin-system-stats）；角色：ADMIN -->
<script setup lang="ts">
import { computed } from 'vue'
import PieChart from '@/components/charts/PieChart.vue'
import ScoreLineChart from '@/components/charts/ScoreLineChart.vue'
import HistogramChart from '@/components/charts/HistogramChart.vue'
import { mockAdminStats } from '@/mock/data'
import IntegrationHint from '@/components/IntegrationHint.vue'

// 用户分布饼图数据
const userDistributionData = mockAdminStats.userDistribution

// 活跃度折线图数据
const activityData = [
  { date: '周一', score: mockAdminStats.activityStats.daily[0] / 2 },
  { date: '周二', score: mockAdminStats.activityStats.daily[1] / 2 },
  { date: '周三', score: mockAdminStats.activityStats.daily[2] / 2 },
  { date: '周四', score: mockAdminStats.activityStats.daily[3] / 2 },
  { date: '周五', score: mockAdminStats.activityStats.daily[4] / 2 },
  { date: '周六', score: mockAdminStats.activityStats.daily[5] / 2 },
  { date: '周日', score: mockAdminStats.activityStats.daily[6] / 2 },
]

// 课程数据柱状图
const courseData = mockAdminStats.courseStats.map(item => ({
  range: item.category.slice(0, 4),
  count: item.count,
}))
</script>



<template>
  <div class="system-stats-page page">
    <div class="page-header">
      <h2>系统监控</h2>
      <p class="subtitle">平台运营数据实时监控</p>
      <IntegrationHint />
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409EFF15; color: #409EFF;">
              <el-icon size="28"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">353</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67C23A15; color: #67C23A;">
              <el-icon size="28"><Reading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">51</div>
              <div class="stat-label">课程总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #E6A23C15; color: #E6A23C;">
              <el-icon size="28"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">180</div>
              <div class="stat-label">今日活跃</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #F56C6C15; color: #F56C6C;">
              <el-icon size="28"><DocumentChecked /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">3</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="charts-grid">
      <!-- 用户分布 -->
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>平台用户分布</span>
            <el-tag size="small" type="info">饼图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper">
          <PieChart
            :data="userDistributionData"
            :width="400"
            :height="350"
            title="用户角色占比"
          />
        </div>
      </el-card>

      <!-- 活跃度统计 -->
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>日活跃用户数</span>
            <el-tag size="small" type="info">折线图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper">
          <ScoreLineChart
            :data="activityData"
            :width="550"
            :height="320"
            title=""
            line-color="#409EFF"
          />
        </div>
      </el-card>

      <!-- 课程数据 -->
      <el-card class="chart-card full-width" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>各分类课程数量</span>
            <el-tag size="small" type="info">柱状图</el-tag>
          </div>
        </template>
        <div class="chart-wrapper">
          <HistogramChart
            :data="courseData"
            :width="800"
            :height="350"
            title="课程分类分布"
            bar-color="#67C23A"
          />
        </div>
      </el-card>
    </div>

    <!-- 平台公告 -->
    <el-card class="notice-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>平台公告</span>
          <el-button text type="primary">发布新公告</el-button>
        </div>
      </template>
      <div class="notice-list">
        <div class="notice-item">
          <div class="notice-title">系统维护通知</div>
          <div class="notice-time">2024-02-10 10:00</div>
          <div class="notice-content">平台将于本周日凌晨 2:00-4:00 进行系统维护，届时部分功能可能无法使用。</div>
        </div>
        <el-divider />
        <div class="notice-item">
          <div class="notice-title">新课程上线</div>
          <div class="notice-time">2024-02-09 15:30</div>
          <div class="notice-content">《Python 人工智能入门》课程已通过审核并正式上线，欢迎学习！</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.system-stats-page {
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

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--text-200);
  margin-top: 6px;
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

.notice-card {
  margin-top: 20px;
}

.notice-list {
  display: flex;
  flex-direction: column;
}

.notice-item {
  padding: 16px 0;
}

.notice-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
}

.notice-time {
  font-size: 12px;
  color: var(--text-200);
  margin-bottom: 8px;
}

.notice-content {
  font-size: 14px;
  color: var(--text-200);
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>


