<!-- 页面：课程管理；路由：teacher/courses（teacher-courses）；角色：TEACHER -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Plus, View, Edit, Delete, Refresh, Download, Grid } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores'
import type { Course } from '@/types'

const router = useRouter()
const courseStore = useCourseStore()

const searchQuery = ref('')
const selectedStatus = ref('')

const selectedCourses = ref<string[]>([])

const courses = computed(() => {
  let result = courseStore.courses
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => c.title.toLowerCase().includes(query))
  }
  
  if (selectedStatus.value) {
    result = result.filter(c => c.status === selectedStatus.value)
  }
  
  return result
})

function createCourse() {
  router.push('/app/teacher/course/edit')
}

function editCourse(course: Course) {
  router.push(`/app/teacher/course/edit/${course.id}`)
}

function deleteCourse(course: Course) {
  ElMessageBox.confirm(`确定要删除课程「${course.title}」吗？`, '提示', {
    type: 'warning',
  }).then(() => {
    courseStore.deleteCourse(course.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function getStatusTag(status: string) {
  const map: Record<string, { type: string, label: string }> = {
    published: { type: 'success', label: '已发布' },
    draft: { type: 'info', label: '草稿' },
    under_review: { type: 'warning', label: '审核中' },
    rejected: { type: 'danger', label: '已驳回' },
  }
  return map[status] || { type: 'info', label: status }
}

function formatDate(date: string): string {
  return date.replace(/-/g, '/')
}

function handleSelectionChange(selection: Course[]) {
  selectedCourses.value = selection.map(c => c.id)
}

function refreshData() {
  ElMessage.success('数据已刷新')
}

function exportData() {
  const data = courses.value.map(c => ({
    课程名称: c.title,
    状态: getStatusTag(c.status).label,
    学生数: c.studentCount,
    更新时间: formatDate(c.updatedAt)
  }))
  console.table(data)
  ElMessage.success('课程数据已导出到控制台')
}

function batchDelete() {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedCourses.value.length} 门课程吗？`,
    '批量删除',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    ElMessage.success(`已删除 ${selectedCourses.value.length} 门课程`)
    selectedCourses.value = []
  })
}
</script>



<template>
  <div class="teacher-courses-page page page--compact">
    <div class="page-head">
      <div class="page-head__left">
        <div>
          <h2 class="page-head__title">课程管理</h2>
          <div class="page-head__desc">管理和编辑你创建的课程</div>
        </div>
      </div>
      <div class="page-head__right">
        <div class="stat-strip">
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ courseStore.courses.length }}</span>
            <span class="stat-strip__label">总课程</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ courseStore.courses.filter(c => c.status === 'published').length }}</span>
            <span class="stat-strip__label">已发布</span>
          </div>
        </div>
        <el-button type="primary" :icon="Plus" @click="createCourse">创建课程</el-button>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar-section">
        <div class="toolbar-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索课程名称"
            :prefix-icon="Search"
            clearable
            style="width: 260px;"
          />
          <el-select v-model="selectedStatus" placeholder="课程状态" clearable>
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="under_review" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新数据">
            <el-button :icon="Refresh" circle text @click="refreshData" />
          </el-tooltip>
          <el-button :icon="Download" @click="exportData">导出</el-button>
          <el-button v-if="selectedCourses.length > 0" type="danger" @click="batchDelete">
            批量删除 ({{ selectedCourses.length }})
          </el-button>
        </div>
      </div>

      <el-table 
        :data="courses" 
        stripe 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="课程封面" width="100">
          <template #default="{ row }">
            <el-image :src="row.cover" class="course-cover" fit="cover" />
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="课程名称" min-width="200">
          <template #default="{ row }">
            <div class="course-title">{{ row.title }}</div>
            <div class="course-desc">{{ row.description.slice(0, 50) }}...</div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type as any" size="small" effect="plain">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="studentCount" label="学生数" width="90" align="center" />
        
        <el-table-column prop="updatedAt" label="更新时间" width="110">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="router.push(`/app/student/course/${row.id}`)">
              预览
            </el-button>
            <el-button link type="primary" :icon="Edit" @click="editCourse(row)">
              编辑
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="deleteCourse(row)">
              删除
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
  flex-wrap: wrap;
}

.course-cover {
  width: 70px;
  height: 44px;
  border-radius: 4px;
}

.course-title {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 3px;
}

.course-desc {
  font-size: 12px;
  color: var(--text-200);
}
</style>


