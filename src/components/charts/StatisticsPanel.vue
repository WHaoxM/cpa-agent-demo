<!-- 组件：统计面板（用于汇总并展示关键指标） -->
<template>
  <div class="statistics-panel">
    <div class="kpi-panel">
      <div class="kpi-panel__left">
        <CompositeGlyph
          :primary="palette.primary"
          :accent="palette.accent"
          :stroke="palette.text"
        />

        <div class="kpi-panel__title">
          <div class="kpi-panel__name">学习概览</div>
          <div class="kpi-panel__desc">把关联指标组合成一个信息块，减少碎片化小卡片</div>
        </div>
      </div>

      <div class="kpi-panel__grid">
        <div class="kpi-chip">
          <div class="kpi-chip__label">课程</div>
          <div class="kpi-chip__value">{{ kpi.totalCourses }}</div>
          <div class="kpi-chip__hint">已记录课程数</div>
        </div>

        <div class="kpi-chip">
          <div class="kpi-chip__label">学习时长</div>
          <div class="kpi-chip__value">{{ kpi.totalStudyTime }} 分</div>
          <div class="kpi-chip__hint">总学习时间</div>
        </div>

        <div class="kpi-chip kpi-chip--wide">
          <div class="kpi-chip__label">完成率</div>
          <div class="kpi-chip__value">{{ kpi.completionRate }}%</div>
          <div class="kpi-chip__hint">已完成/总课程</div>
          <div class="kpi-chip__bar">
            <div class="kpi-chip__barFill" :style="{ width: `${kpi.completionRate}%` }" />
          </div>
        </div>

        <div class="kpi-chip">
          <div class="kpi-chip__label">平均分</div>
          <div class="kpi-chip__value">{{ kpi.averageScore }}</div>
          <div class="kpi-chip__hint">仅统计有分数记录</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>学习进度分布</span>
              <el-button 
                type="text" 
                size="small" 
                @click="refreshCharts"
                :loading="loading"
              >
                刷新
              </el-button>
            </div>
          </template>
          <ProgressChart :data="progressData" title="课程完成进度" />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>学习时间趋势</span>
              <el-button 
                type="text" 
                size="small" 
                @click="refreshCharts"
                :loading="loading"
              >
                刷新
              </el-button>
            </div>
          </template>
          <ProgressChart :data="timeData" title="学习时间分布" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 时间轴图表 -->
    <el-row class="timeline-section">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>学习历史时间轴</span>
              <div class="chart-actions">
                <el-button-group size="small">
                  <el-button 
                    :type="viewMode === 'week' ? 'primary' : ''"
                    @click="viewMode = 'week'"
                  >
                    周视图
                  </el-button>
                  <el-button 
                    :type="viewMode === 'month' ? 'primary' : ''"
                    @click="viewMode = 'month'"
                  >
                    月视图
                  </el-button>
                  <el-button 
                    :type="viewMode === 'year' ? 'primary' : ''"
                    @click="viewMode = 'year'"
                  >
                    年视图
                  </el-button>
                </el-button-group>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="refreshCharts"
                  :loading="loading"
                >
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          <TimelineChart :data="timelineData" :title="timelineTitle" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ProgressChart from './ProgressChartSimple.vue'
import TimelineChart from './TimelineChartSimple.vue'
import { useLearningStore, type LearningStatistics } from '@/stores/learning'
import { useThemePalette } from '@/composables/useThemePalette'
import CompositeGlyph from '@/components/visual/CompositeGlyph.vue'

// 学习数据存储
const learningStore = useLearningStore()

const { palette } = useThemePalette()

const kpi = computed(() => {
  const s = learningStore.statistics as LearningStatistics
  const totalCourses = Number(s.totalCourses ?? 0)
  const totalStudyTime = Number(s.totalStudyTime ?? 0)
  const averageScore = Number(s.averageScore ?? 0)
  const completionRate = Number(s.completionRate ?? 0)

  return {
    totalCourses,
    totalStudyTime,
    averageScore,
    completionRate: Math.max(0, Math.min(100, Math.round(completionRate))),
  }
})

// 响应式数据
const loading = ref(false)
const viewMode = ref<'week' | 'month' | 'year'>('month')

// 进度数据接口
interface ProgressItem {
  name: string
  value: number
  color: string
}

// 时间轴数据接口
interface TimelineItem {
  date: string
  studyTime: number
  completedCourses: number
  testScore: number
}

// 进度数据
const progressData = computed<ProgressItem[]>(() => {
  const p = palette.value
  const colors = [p.primary, p.accent, p.primarySoft, p.accentSoft].filter(Boolean)
  return [
    { name: '已完成', value: 35, color: colors[0] || '#67C23A' },
    { name: '学习中', value: 25, color: colors[1] || '#409EFF' },
    { name: '未开始', value: 20, color: colors[2] || '#E6A23C' },
    { name: '已暂停', value: 10, color: colors[3] || '#F56C6C' },
  ]
})

// 时间数据
const timeData = computed<ProgressItem[]>(() => {
  const p = palette.value
  const colors = [p.accent, p.primary, p.accentSoft].filter(Boolean)
  return [
    { name: '上午', value: 30, color: colors[0] || '#91CC75' },
    { name: '下午', value: 45, color: colors[1] || '#5470C6' },
    { name: '晚上', value: 25, color: colors[2] || '#FAC858' },
  ]
})

// 时间轴数据
const timelineData = computed<TimelineItem[]>(() => {
  const data = generateTimelineData(viewMode.value)
  return data
})

// 时间轴标题
const timelineTitle = computed(() => {
  const titles = {
    week: '最近一周学习情况',
    month: '最近一月学习情况',
    year: '最近一年学习情况'
  }
  return titles[viewMode.value]
})

// 生成时间轴数据
const generateTimelineData = (mode: 'week' | 'month' | 'year'): TimelineItem[] => {
  const data: TimelineItem[] = []
  const now = new Date()
  
  let days = 7
  if (mode === 'month') days = 30
  if (mode === 'year') days = 365
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      studyTime: Math.floor(Math.random() * 8) + 1,
      completedCourses: Math.floor(Math.random() * 3),
      testScore: Math.floor(Math.random() * 30) + 70
    })
  }
  
  return data
}

// 刷新图表数据
const refreshCharts = async () => {
  loading.value = true
  
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

// 监听视图模式变化
watch(viewMode, () => {
  // 可以在这里添加视图模式变化的逻辑
})

onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<style scoped>
.statistics-panel {
  padding: 0;
}

.kpi-panel {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background:
    radial-gradient(700px 240px at 10% 10%, color-mix(in srgb, var(--primary-100) 18%, transparent 82%), transparent),
    radial-gradient(520px 220px at 88% 8%, color-mix(in srgb, var(--accent-100) 14%, transparent 86%), transparent),
    color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
}

.kpi-panel__left {
  flex: 0 0 240px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  background: linear-gradient(
    132deg,
    color-mix(in srgb, var(--bg-200) 82%, #ffffff 18%),
    color-mix(in srgb, var(--bg-100) 92%, transparent 8%)
  );
  transform: translateY(6px);
}

.kpi-panel__name {
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 0.4px;
}

.kpi-panel__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-200);
  line-height: 1.3;
}

.kpi-panel__grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.kpi-chip {
  position: relative;
  padding: 12px 12px 10px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 45%, transparent 55%);
  background: color-mix(in srgb, var(--bg-100) 93%, #ffffff 7%);
}

.kpi-chip--wide {
  grid-column: span 2;
}

.kpi-chip__label {
  font-size: 12px;
  color: var(--text-200);
}

.kpi-chip__value {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
}

.kpi-chip__hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-200);
}

.kpi-chip__bar {
  margin-top: 10px;
  height: 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-300) 45%, transparent 55%);
  overflow: hidden;
}

.kpi-chip__barFill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(112deg, var(--primary-100), var(--accent-100));
}

/* 图表区域样式 */
.chart-section {
  margin-bottom: 20px;
}

.timeline-section {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 18px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--text-100);
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .statistics-panel {
    padding: 10px;
  }

  .kpi-panel {
    flex-direction: column;
  }

  .kpi-panel__left {
    flex: 1;
    transform: none;
  }

  .kpi-panel__grid {
    grid-template-columns: 1fr;
  }

  .kpi-chip--wide {
    grid-column: auto;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .chart-actions {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .chart-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>


