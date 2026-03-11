<!-- 页面：学生管理；路由：teacher/students（teacher-students）；角色：TEACHER -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, TrendCharts, DocumentChecked } from '@element-plus/icons-vue'
import { useUserStore, useCourseStore, useLearningStore } from '@/stores'
import { mockUsers, mockClasses, getClassStudents } from '@/mock/data'
import type { User } from '@/types'
import IntegrationHint from '@/components/IntegrationHint.vue'

const router = useRouter()
const courseStore = useCourseStore()
const learningStore = useLearningStore()

const searchQuery = ref('')
const selectedClass = ref('class_001')

const students = computed(() => {
  let result = getClassStudents(selectedClass.value)
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.username.toLowerCase().includes(query)
    )
  }
  
  return result.map(student => {
    const progress = courseStore.getUserProgress(student.id)
    const records = learningStore.getUserQuizRecords(student.id)
    const avgScore = records.length > 0 
      ? Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length)
      : 0
    
    return {
      ...student,
      completedCourses: progress.filter(p => p.completed).length,
      avgScore,
      studyTime: Math.round(Math.random() * 50 + 10), // 模拟学习时长
    }
  })
})

const classOptions = computed(() => 
  mockClasses.map(c => ({ label: c.name, value: c.id }))
)

function viewStudentDetail(student: User) {
  ElMessage.info(`查看 ${student.name} 的详细信息`)
}

function getProgressColor(percentage: number): string {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 60) return '#E6A23C'
  return '#F56C6C'
}
</script>



<template>
  <div class="teacher-students-page page">
    <div class="page-header">
      <h2>学生管理</h2>
      <IntegrationHint />
      <div class="header-actions">
        <el-select v-model="selectedClass" placeholder="选择班级">
          <el-option
            v-for="opt in classOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409EFF15; color: #409EFF;">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ students.length }}</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67C23A15; color: #67C23A;">
              <el-icon :size="24"><DocumentChecked /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ Math.round(students.reduce((sum, s) => sum + s.avgScore, 0) / students.length) || 0 }}</div>
              <div class="stat-label">班级平均分</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #E6A23C15; color: #E6A23C;">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ Math.round(students.reduce((sum, s) => sum + s.studyTime, 0) / students.length) || 0 }}h</div>
              <div class="stat-label">平均学习时长</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="content-card">
      <div class="filter-bar toolbar-card">
        <el-input
          v-model="searchQuery"
          placeholder="搜索学生姓名或学号"
          :prefix-icon="Search"
          clearable
          style="width: 300px;"
        />
      </div>

      <el-table :data="students" stripe>
        <el-table-column label="学生信息" min-width="200">
          <template #default="{ row }">
            <div class="student-info">
              <el-avatar :size="40" :src="row.avatar" />
              <div class="student-detail">
                <div class="student-name">{{ row.name }}</div>
                <div class="student-id">{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="完成课程" width="120" align="center">
          <template #default="{ row }">
            {{ row.completedCourses }} 门
          </template>
        </el-table-column>

        <el-table-column label="平均成绩" width="120" align="center">
          <template #default="{ row }">
            <span :style="{ color: getProgressColor(row.avgScore), fontWeight: 600 }">
              {{ row.avgScore }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="学习时长" width="120" align="center">
          <template #default="{ row }">
            {{ row.studyTime }} 小时
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewStudentDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.teacher-students-page {
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-200);
  margin-top: 4px;
}

.filter-bar {
  margin-bottom: 20px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-detail {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 500;
}

.student-id {
  font-size: 12px;
  color: var(--text-200);
}
</style>


