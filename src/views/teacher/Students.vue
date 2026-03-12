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
import { usePageEntrance } from '@/composables/usePageEntrance'

const router = useRouter()
const { pageRef } = usePageEntrance()
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
  <div ref="pageRef" class="teacher-students-page page page--compact">
    <div class="page-head">
      <div class="page-head__left">
        <div>
          <h2 class="page-head__title">学生管理</h2>
          <div class="page-head__desc">查看班级学生学习情况</div>
        </div>
        <IntegrationHint />
      </div>
      <div class="page-head__right">
        <el-select v-model="selectedClass" placeholder="选择班级" style="width: 160px;">
          <el-option
            v-for="opt in classOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <div class="stat-strip">
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ students.length }}</span>
            <span class="stat-strip__label">学生</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ Math.round(students.reduce((sum, s) => sum + s.avgScore, 0) / students.length) || 0 }}</span>
            <span class="stat-strip__label">平均分</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ Math.round(students.reduce((sum, s) => sum + s.studyTime, 0) / students.length) || 0 }}h</span>
            <span class="stat-strip__label">均时长</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar-section">
        <div class="toolbar-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索学生姓名或学号"
            :prefix-icon="Search"
            clearable
            style="width: 260px;"
          />
        </div>
      </div>

      <el-table :data="students" stripe>
        <el-table-column label="学生信息" min-width="200">
          <template #default="{ row }">
            <div class="student-info">
              <el-avatar :size="36" :src="row.avatar" />
              <div class="student-detail">
                <div class="student-name">{{ row.name }}</div>
                <div class="student-id">{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="完成课程" width="110" align="center">
          <template #default="{ row }">
            {{ row.completedCourses }} 门
          </template>
        </el-table-column>

        <el-table-column label="平均成绩" width="110" align="center">
          <template #default="{ row }">
            <span :style="{ color: getProgressColor(row.avgScore), fontWeight: 700 }">
              {{ row.avgScore }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="学习时长" width="110" align="center">
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

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--card-divider);
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-detail {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 700;
  font-size: 13px;
}

.student-id {
  font-size: 12px;
  color: var(--text-200);
}
</style>


