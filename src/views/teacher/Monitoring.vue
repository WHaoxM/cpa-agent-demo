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
  <div class="monitoring-page page page--compact">
    <div class="page-head">
      <div class="page-head__left">
        <div>
          <h2 class="page-head__title">学情监控</h2>
          <div class="page-head__desc">实时监控班级学习动态</div>
        </div>
        <IntegrationHint />
      </div>
      <div class="page-head__right">
        <div class="stat-strip">
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ rankingData.length }}</span>
            <span class="stat-strip__label">学生</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ classKnowledgeData.length }}</span>
            <span class="stat-strip__label">知识点</span>
          </div>
          <div class="stat-strip__item stat-strip__item--alert">
            <span class="stat-strip__value">2</span>
            <span class="stat-strip__label">预警</span>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <!-- 学生排名 -->
      <div class="panel chart-panel">
        <div class="panel-head">
          <span class="panel-head__title">学生成绩排名</span>
          <el-tag size="small" type="info" effect="plain">横向柱状图</el-tag>
        </div>
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
      </div>

      <!-- 班级知识点掌握 -->
      <div class="panel chart-panel">
        <div class="panel-head">
          <span class="panel-head__title">班级知识点掌握</span>
          <el-tag size="small" type="info" effect="plain">雷达图</el-tag>
        </div>
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
      </div>

      <!-- 学习时长趋势 -->
      <div class="panel chart-panel full-width">
        <div class="panel-head">
          <span class="panel-head__title">班级日均学习时长趋势</span>
          <el-tag size="small" type="info" effect="plain">折线图</el-tag>
        </div>
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
      </div>
    </div>

    <!-- 预警信息 -->
    <div class="panel alert-panel">
      <div class="panel-head">
        <span class="panel-head__title">学习预警</span>
        <el-tag type="danger" size="small" effect="plain">需关注</el-tag>
      </div>
      <div class="alert-list">
        <div class="alert-item alert-item--warning">
          <el-icon size="18"><Warning /></el-icon>
          <div class="alert-content">
            <div class="alert-title">王同学连续3天未登录学习</div>
            <div class="alert-desc">建议及时联系了解情况</div>
          </div>
          <el-button type="primary" link size="small">查看详情</el-button>
        </div>
        <div class="alert-item alert-item--danger">
          <el-icon size="18"><CircleClose /></el-icon>
          <div class="alert-content">
            <div class="alert-title">Composition API 知识点错误率超过40%</div>
            <div class="alert-desc">建议增加相关课时讲解</div>
          </div>
          <el-button type="primary" link size="small">查看详情</el-button>
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
  min-height: 320px;
}

.radar-wrapper {
  min-height: 360px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--card-data-bg);
  border: 1px solid var(--card-divider);
}

.alert-item--warning {
  border-left: 3px solid var(--el-color-warning);
}

.alert-item--warning :deep(.el-icon) {
  color: var(--el-color-warning);
}

.alert-item--danger {
  border-left: 3px solid var(--el-color-danger);
}

.alert-item--danger :deep(.el-icon) {
  color: var(--el-color-danger);
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 2px;
}

.alert-desc {
  font-size: 12px;
  color: var(--text-200);
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>


