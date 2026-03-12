<!-- 页面：系统监控；路由：admin/system-stats（admin-system-stats）；角色：ADMIN -->
<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { usePageEntrance } from '@/composables/usePageEntrance'
import PieChart from '@/components/charts/PieChart.vue'
import ScoreLineChart from '@/components/charts/ScoreLineChart.vue'
import HistogramChart from '@/components/charts/HistogramChart.vue'
import { mockAdminStats } from '@/mock/data'
import IntegrationHint from '@/components/IntegrationHint.vue'

const { pageRef } = usePageEntrance()

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
  <div ref="pageRef" class="system-stats-page page page--compact">
    <div class="page-head">
      <div class="page-head__left">
        <div>
          <h2 class="page-head__title">系统监控</h2>
          <div class="page-head__desc">平台运营数据实时监控</div>
        </div>
        <IntegrationHint />
      </div>
      <div class="page-head__right">
        <div class="stat-strip">
          <div class="stat-strip__item">
            <span class="stat-strip__value">353</span>
            <span class="stat-strip__label">总用户</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">51</span>
            <span class="stat-strip__label">课程</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">180</span>
            <span class="stat-strip__label">今日活跃</span>
          </div>
          <div class="stat-strip__item stat-strip__item--alert">
            <span class="stat-strip__value">3</span>
            <span class="stat-strip__label">待审核</span>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <!-- 用户分布 -->
      <div class="panel chart-panel">
        <div class="panel-head">
          <span class="panel-head__title">平台用户分布</span>
          <el-tag size="small" type="info" effect="plain">饼图</el-tag>
        </div>
        <div class="chart-wrapper">
          <PieChart
            :data="userDistributionData"
            :width="400"
            :height="350"
            title="用户角色占比"
          />
        </div>
      </div>

      <!-- 活跃度统计 -->
      <div class="panel chart-panel">
        <div class="panel-head">
          <span class="panel-head__title">日活跃用户数</span>
          <el-tag size="small" type="info" effect="plain">折线图</el-tag>
        </div>
        <div class="chart-wrapper">
          <ScoreLineChart
            :data="activityData"
            :width="550"
            :height="320"
            title=""
            line-color="#409EFF"
          />
        </div>
      </div>

      <!-- 课程数据 -->
      <div class="panel chart-panel full-width">
        <div class="panel-head">
          <span class="panel-head__title">各分类课程数量</span>
          <el-tag size="small" type="info" effect="plain">柱状图</el-tag>
        </div>
        <div class="chart-wrapper">
          <HistogramChart
            :data="courseData"
            :width="800"
            :height="350"
            title="课程分类分布"
            bar-color="#67C23A"
          />
        </div>
      </div>
    </div>

    <!-- 平台公告 -->
    <div class="panel notice-panel">
      <div class="panel-head">
        <span class="panel-head__title">平台公告</span>
        <el-button text type="primary" size="small">发布新公告</el-button>
      </div>
      <div class="notice-list">
        <div class="notice-item">
          <div class="notice-row">
            <div class="notice-title">系统维护通知</div>
            <div class="notice-time">2024-02-10 10:00</div>
          </div>
          <div class="notice-content">平台将于本周日凌晨 2:00-4:00 进行系统维护，届时部分功能可能无法使用。</div>
        </div>
        <div class="notice-item">
          <div class="notice-row">
            <div class="notice-title">新课程上线</div>
            <div class="notice-time">2024-02-09 15:30</div>
          </div>
          <div class="notice-content">《Python 人工智能入门》课程已通过审核并正式上线，欢迎学习！</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  padding: 16px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--card-divider);
}

.panel-head__title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-100);
}

.stat-strip__item--alert .stat-strip__value {
  color: var(--el-color-danger);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.chart-panel {
  min-height: 380px;
}

.full-width {
  grid-column: 1 / -1;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
}

.notice-list {
  display: flex;
  flex-direction: column;
}

.notice-item {
  padding: 12px 0;
}

.notice-item + .notice-item {
  border-top: 1px solid var(--card-divider);
}

.notice-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.notice-title {
  font-weight: 700;
  font-size: 14px;
}

.notice-time {
  font-size: 12px;
  color: var(--text-200);
  flex-shrink: 0;
}

.notice-content {
  font-size: 13px;
  color: var(--text-200);
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>


