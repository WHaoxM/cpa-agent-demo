<!-- 页面：内容审核；路由：admin/content-review（admin-content-review）；角色：ADMIN -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Check, Close, View } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores'
import type { Course } from '@/types'

const courseStore = useCourseStore()

const searchQuery = ref('')
const selectedStatus = ref('')

const pendingCourses = computed(() => {
  let result = courseStore.courses.filter(c => c.status === 'under_review' || c.status === 'rejected')
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => c.title.toLowerCase().includes(query))
  }
  
  if (selectedStatus.value) {
    result = result.filter(c => c.status === selectedStatus.value)
  }
  
  return result
})

const currentCourse = ref<Course | null>(null)
const showDetailDialog = ref(false)
const rejectReason = ref('')
const showRejectDialog = ref(false)

function viewDetail(course: Course) {
  currentCourse.value = course
  showDetailDialog.value = true
}

function approveCourse(course: Course) {
  courseStore.updateCourseStatus(course.id, 'published')
  ElMessage.success(`已通过课程「${course.title}」`)
}

function openReject(course: Course) {
  currentCourse.value = course
  rejectReason.value = ''
  showRejectDialog.value = true
}

function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  if (currentCourse.value) {
    courseStore.updateCourseStatus(currentCourse.value.id, 'rejected')
    ElMessage.success(`已驳回课程「${currentCourse.value.title}」`)
    showRejectDialog.value = false
  }
}

function getStatusTag(status: string) {
  const map: Record<string, { type: string, label: string }> = {
    under_review: { type: 'warning', label: '待审核' },
    rejected: { type: 'danger', label: '已驳回' },
  }
  return map[status] || { type: 'info', label: status }
}
</script>



<template>
  <div class="content-review-page page">
    <div class="page-header">
      <h2>内容审核</h2>
      <el-tag size="large" type="warning">待审核：{{ courseStore.courses.filter(c => c.status === 'under_review').length }}</el-tag>
    </div>

    <el-card shadow="never" class="content-card">
      <div class="filter-bar toolbar-card">
        <el-input
          v-model="searchQuery"
          placeholder="搜索课程名称"
          :prefix-icon="Search"
          clearable
          style="width: 300px;"
        />
        <el-select v-model="selectedStatus" placeholder="审核状态" clearable>
          <el-option label="待审核" value="under_review" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
      </div>

      <el-table :data="pendingCourses" stripe>
        <el-table-column label="课程封面" width="120">
          <template #default="{ row }">
            <el-image :src="row.cover" class="course-cover" fit="cover" />
          </template>
        </el-table-column>

        <el-table-column label="课程信息" min-width="250">
          <template #default="{ row }">
            <div class="course-title">{{ row.title }}</div>
            <div class="course-teacher">讲师：{{ row.teacherName }}</div>
            <div class="course-desc">{{ row.description.slice(0, 60) }}...</div>
          </template>
        </el-table-column>

        <el-table-column label="章节数" width="100" align="center">
          <template #default="{ row }">
            {{ row.chapters.length }} 章
          </template>
        </el-table-column>

        <el-table-column label="总时长" width="100" align="center">
          <template #default="{ row }">
            {{ row.totalDuration }} 分钟
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type as any" size="small">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="updatedAt" label="提交时间" width="120" />

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="viewDetail(row)">
              预览
            </el-button>
            <el-button link type="success" :icon="Check" @click="approveCourse(row)">
              通过
            </el-button>
            <el-button link type="danger" :icon="Close" @click="openReject(row)">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="pendingCourses.length === 0" description="暂无待审核内容" />
    </el-card>

    <!-- 课程详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="课程详情" width="700px">
      <div v-if="currentCourse" class="course-detail">
        <el-image :src="currentCourse.cover" class="detail-cover" fit="cover" />
        <h3>{{ currentCourse.title }}</h3>
        <p class="detail-desc">{{ currentCourse.description }}</p>
        <div class="detail-meta">
          <span>讲师：{{ currentCourse.teacherName }}</span>
          <span>章节：{{ currentCourse.chapters.length }} 个</span>
          <span>总时长：{{ currentCourse.totalDuration }} 分钟</span>
        </div>
        <el-divider />
        <h4>章节列表</h4>
        <div class="chapter-list">
          <div
            v-for="chapter in currentCourse.chapters"
            :key="chapter.id"
            class="chapter-item"
          >
            <span class="chapter-order">{{ chapter.order }}</span>
            <span class="chapter-title">{{ chapter.title }}</span>
            <span class="chapter-duration">{{ chapter.duration }} 分钟</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="showRejectDialog" title="驳回课程" width="500px">
      <el-form label-position="top">
        <el-form-item label="驳回原因">
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因，将反馈给课程创建者"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.content-review-page {
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

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.course-cover {
  width: 80px;
  height: 50px;
  border-radius: 4px;
}

.course-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.course-teacher {
  font-size: 12px;
  color: var(--text-200);
  margin-bottom: 4px;
}

.course-desc {
  font-size: 12px;
  color: var(--text-200);
}

.course-detail {
  padding: 10px 0;
}

.detail-cover {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.detail-desc {
  line-height: 1.6;
  color: var(--text-200);
}

.detail-meta {
  display: flex;
  gap: 24px;
  margin: 16px 0;
  font-size: 14px;
  color: var(--text-200);
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-200);
  border-radius: 6px;
}

.chapter-order {
  width: 24px;
  height: 24px;
  background: var(--primary-100);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.chapter-title {
  flex: 1;
}

.chapter-duration {
  font-size: 12px;
  color: var(--text-200);
}
</style>


