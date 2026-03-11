<!-- 页面：作业批改；路由：teacher/grading（teacher-grading）；角色：TEACHER -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Check, Refresh, Download } from '@element-plus/icons-vue'
import { useLearningStore } from '@/stores'
import { mockQuizRecords, mockUsers } from '@/mock/data'
import IntegrationHint from '@/components/IntegrationHint.vue'

const learningStore = useLearningStore()

const searchQuery = ref('')
const selectedStatus = ref('')

// 模拟待批改作业数据
const pendingGrading = computed(() => {
  return mockQuizRecords.map(record => {
    const student = mockUsers.find(u => u.id === record.userId)
    return {
      ...record,
      studentName: student?.name || '未知学生',
      studentAvatar: student?.avatar || '',
      status: record.score >= 0 ? 'graded' : 'pending',
    }
  }).filter(item => {
    if (selectedStatus.value && item.status !== selectedStatus.value) return false
    if (searchQuery.value) {
      return item.studentName.toLowerCase().includes(searchQuery.value.toLowerCase())
    }
    return true
  })
})

const currentGrading = ref<any>(null)
const showGradingDialog = ref(false)
const gradeScore = ref(0)
const gradeComment = ref('')

function openGrading(item: any) {
  currentGrading.value = item
  gradeScore.value = item.score || 0
  gradeComment.value = ''
  showGradingDialog.value = true
}

function submitGrade() {
  ElMessage.success(`已批改 ${currentGrading.value?.studentName} 的作业，得分：${gradeScore.value}`)
  showGradingDialog.value = false
}

function refreshData() {
  ElMessage.success('数据已刷新')
}

function exportData() {
  const data = pendingGrading.value.map(g => ({
    学生: g.studentName,
    得分: g.score,
    总分: g.totalScore,
    用时: g.duration + '分钟',
    状态: g.status === 'graded' ? '已批改' : '待批改'
  }))
  console.table(data)
  ElMessage.success('作业数据已导出到控制台')
}
</script>



<template>
  <div class="grading-page page page--compact">
    <div class="page-head">
      <div class="page-head__left">
        <div>
          <h2 class="page-head__title">作业批改</h2>
          <div class="page-head__desc">查看和评分学生提交的作业</div>
        </div>
        <IntegrationHint />
      </div>
      <div class="page-head__right">
        <div class="stat-strip">
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ pendingGrading.length }}</span>
            <span class="stat-strip__label">总记录</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ pendingGrading.filter(g => g.status === 'pending').length }}</span>
            <span class="stat-strip__label">待批改</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ pendingGrading.filter(g => g.status === 'graded').length }}</span>
            <span class="stat-strip__label">已批改</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar-section">
        <div class="toolbar-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索学生姓名"
            :prefix-icon="Search"
            clearable
            style="width: 260px;"
          />
          <el-select v-model="selectedStatus" placeholder="批改状态" clearable>
            <el-option label="待批改" value="pending" />
            <el-option label="已批改" value="graded" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新数据">
            <el-button :icon="Refresh" circle text @click="refreshData" />
          </el-tooltip>
          <el-button :icon="Download" @click="exportData">导出</el-button>
        </div>
      </div>

      <el-table :data="pendingGrading" stripe>
        <el-table-column label="学生" min-width="180">
          <template #default="{ row }">
            <div class="student-info">
              <el-avatar :size="36" :src="row.studentAvatar" />
              <span class="student-name">{{ row.studentName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="score" label="得分" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.score >= 60 ? 'var(--el-color-success)' : 'var(--el-color-danger)', fontWeight: 700 }">
              {{ row.score }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="totalScore" label="总分" width="100" align="center" />

        <el-table-column prop="duration" label="用时" width="100" align="center">
          <template #default="{ row }">
            {{ row.duration }} 分钟
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'graded' ? 'success' : 'warning'" size="small" effect="plain">
              {{ row.status === 'graded' ? '已批改' : '待批改' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              :type="row.status === 'graded' ? 'default' : 'primary'" 
              link
              @click="openGrading(row)"
            >
              {{ row.status === 'graded' ? '查看详情' : '开始批改' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 批改弹窗 -->
    <el-dialog v-model="showGradingDialog" title="作业批改" width="640px">
      <div v-if="currentGrading">
        <div class="dialog-summary">
          <el-avatar :size="44" :src="currentGrading.studentAvatar" class="dialog-summary__avatar" />
          <div class="dialog-summary__info">
            <div class="dialog-summary__name">{{ currentGrading.studentName }}</div>
            <div class="dialog-summary__meta">
              <span>用时 {{ currentGrading.duration }} 分钟</span>
              <span>满分 {{ currentGrading.totalScore }}</span>
              <span>当前得分 {{ currentGrading.score }}</span>
            </div>
          </div>
          <div class="dialog-summary__badge">
            <el-tag :type="currentGrading.status === 'graded' ? 'success' : 'warning'" size="small" effect="plain">
              {{ currentGrading.status === 'graded' ? '已批改' : '待批改' }}
            </el-tag>
          </div>
        </div>

        <div class="dialog-section">
          <div class="dialog-section__title">作答概况</div>
          <div class="answer-overview">
            <div class="answer-stat">
              <span class="answer-stat__v" :style="{ color: 'var(--el-color-success)' }">{{ Math.round(currentGrading.score / currentGrading.totalScore * 100) }}%</span>
              <span class="answer-stat__k">正确率</span>
            </div>
            <div class="answer-stat">
              <span class="answer-stat__v">{{ currentGrading.duration }} 分钟</span>
              <span class="answer-stat__k">答题用时</span>
            </div>
            <div class="answer-stat">
              <span class="answer-stat__v">{{ currentGrading.score }} / {{ currentGrading.totalScore }}</span>
              <span class="answer-stat__k">得分</span>
            </div>
          </div>
        </div>

        <div class="dialog-section">
          <div class="dialog-section__title">评分与评语</div>
          <el-form label-position="top">
            <el-form-item label="评分">
              <div class="score-row">
                <el-slider v-model="gradeScore" :max="currentGrading.totalScore" class="score-slider" />
                <span class="score-display">{{ gradeScore }} <span class="score-total">/ {{ currentGrading.totalScore }}</span></span>
              </div>
            </el-form-item>

            <el-form-item label="教师评语">
              <el-input
                v-model="gradeComment"
                type="textarea"
                :rows="3"
                placeholder="输入对本次作业的反馈和建议..."
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <span class="dialog-footer__hint">评分与评语仅为 UI 演示</span>
          <div class="dialog-footer__actions">
            <el-button @click="showGradingDialog = false">取消</el-button>
            <el-button type="primary" @click="submitGrade">提交评分</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
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

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--card-divider);
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-name {
  font-weight: 600;
  font-size: 13px;
}

/* Dialog enrichment */
.answer-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.answer-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1px solid var(--card-divider);
  border-radius: var(--radius-md);
  background: var(--card-data-bg);
}

.answer-stat__v {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-100);
}

.answer-stat__k {
  font-size: 11px;
  color: var(--text-200);
}

.score-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.score-slider {
  flex: 1;
}

.score-display {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary-100);
  flex-shrink: 0;
  min-width: 80px;
  text-align: right;
}

.score-total {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-200);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.dialog-footer__hint {
  font-size: 12px;
  color: var(--text-200);
}

.dialog-footer__actions {
  display: flex;
  gap: 8px;
}
</style>


