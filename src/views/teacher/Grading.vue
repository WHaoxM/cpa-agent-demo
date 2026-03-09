<!-- 页面：作业批改；路由：teacher/grading（teacher-grading）；角色：TEACHER -->
<script setup lang="ts">
import { ref, computed } from 'vue'
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
  <div class="grading-page page">
    <div class="page-header">
      <h2>作业批改</h2>
      <IntegrationHint />
    </div>

    <el-card shadow="never" class="content-card">
      <!-- 工具栏 -->
      <div class="filter-bar toolbar-section">
        <div class="toolbar-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索学生姓名"
            :prefix-icon="Search"
            clearable
            style="width: 300px;"
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
              <el-avatar :size="40" :src="row.studentAvatar" />
              <span>{{ row.studentName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="score" label="得分" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.score >= 60 ? '#67C23A' : '#F56C6C', fontWeight: 600 }">
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
            <el-tag :type="row.status === 'graded' ? 'success' : 'warning'" size="small">
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
              {{ row.status === 'graded' ? '查看' : '批改' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 批改弹窗 -->
    <el-dialog v-model="showGradingDialog" title="作业批改" width="600px">
      <div v-if="currentGrading" class="grading-content">
        <div class="grading-info">
          <div class="info-item">
            <span class="label">学生：</span>
            <span>{{ currentGrading.studentName }}</span>
          </div>
          <div class="info-item">
            <span class="label">当前得分：</span>
            <span>{{ currentGrading.score }}</span>
          </div>
        </div>

        <el-divider />

        <el-form label-position="top">
          <el-form-item label="评分">
            <el-slider v-model="gradeScore" :max="currentGrading.totalScore" show-stops />
            <div class="score-display">{{ gradeScore }} / {{ currentGrading.totalScore }}</div>
          </el-form-item>

          <el-form-item label="评语">
            <el-input
              v-model="gradeComment"
              type="textarea"
              :rows="4"
              placeholder="输入评语..."
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showGradingDialog = false">取消</el-button>
        <el-button type="primary" @click="submitGrade">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.grading-page {
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grading-content {
  padding: 10px 0;
}

.grading-info {
  display: flex;
  gap: 32px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.label {
  color: var(--text-200);
}

.score-display {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
  margin-top: 10px;
}
</style>


