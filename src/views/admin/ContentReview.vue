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
  <div class="content-review-page page page--compact">
    <div class="page-head">
      <div class="page-head__left">
        <div>
          <h2 class="page-head__title">内容审核</h2>
          <div class="page-head__desc">审核教师提交的课程内容</div>
        </div>
      </div>
      <div class="page-head__right">
        <div class="stat-strip">
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ courseStore.courses.filter(c => c.status === 'under_review').length }}</span>
            <span class="stat-strip__label">待审核</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ courseStore.courses.filter(c => c.status === 'rejected').length }}</span>
            <span class="stat-strip__label">已驳回</span>
          </div>
        </div>
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
          <el-select v-model="selectedStatus" placeholder="审核状态" clearable>
            <el-option label="待审核" value="under_review" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </div>
      </div>

      <el-table :data="pendingCourses" stripe>
        <el-table-column label="课程封面" width="100">
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

        <el-table-column label="章节数" width="90" align="center">
          <template #default="{ row }">
            {{ row.chapters.length }} 章
          </template>
        </el-table-column>

        <el-table-column label="总时长" width="90" align="center">
          <template #default="{ row }">
            {{ row.totalDuration }} 分钟
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type as any" size="small" effect="plain">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="updatedAt" label="提交时间" width="110" />

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

      <div v-if="pendingCourses.length === 0" class="empty-hint">
        暂无待审核内容
      </div>
    </div>

    <!-- 课程详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="课程详情" width="700px">
      <div v-if="currentCourse">
        <div class="dialog-summary">
          <el-image :src="currentCourse.cover" class="detail-cover-thumb dialog-summary__avatar" fit="cover" />
          <div class="dialog-summary__info">
            <div class="dialog-summary__name">{{ currentCourse.title }}</div>
            <div class="dialog-summary__meta">
              <span>讲师：{{ currentCourse.teacherName }}</span>
              <span>{{ currentCourse.chapters.length }} 章节</span>
              <span>{{ currentCourse.totalDuration }} 分钟</span>
              <span>提交于 {{ currentCourse.updatedAt }}</span>
            </div>
          </div>
          <div class="dialog-summary__badge">
            <el-tag :type="getStatusTag(currentCourse.status).type as any" size="small" effect="plain">
              {{ getStatusTag(currentCourse.status).label }}
            </el-tag>
          </div>
        </div>

        <div class="dialog-section">
          <div class="dialog-section__title">课程简介</div>
          <p class="detail-desc">{{ currentCourse.description }}</p>
        </div>

        <div class="dialog-section">
          <div class="dialog-section__title">章节列表（{{ currentCourse.chapters.length }}）</div>
          <div class="chapter-list">
            <div
              v-for="chapter in currentCourse.chapters"
              :key="chapter.id"
              class="chapter-item"
            >
              <span class="chapter-order">{{ chapter.order }}</span>
              <span class="chapter-name">{{ chapter.title }}</span>
              <span class="chapter-duration">{{ chapter.duration }} 分钟</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <div class="dialog-footer__actions">
            <el-button type="success" :icon="Check" @click="currentCourse && approveCourse(currentCourse); showDetailDialog = false">通过</el-button>
            <el-button type="danger" :icon="Close" @click="currentCourse && openReject(currentCourse); showDetailDialog = false">驳回</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="showRejectDialog" title="驳回课程" width="540px">
      <div v-if="currentCourse" class="dialog-summary">
        <div class="dialog-summary__info">
          <div class="dialog-summary__name">{{ currentCourse.title }}</div>
          <div class="dialog-summary__meta">
            <span>讲师：{{ currentCourse.teacherName }}</span>
            <span>{{ currentCourse.chapters.length }} 章节</span>
          </div>
        </div>
        <div class="dialog-summary__badge">
          <el-tag type="danger" size="small" effect="plain">即将驳回</el-tag>
        </div>
      </div>

      <div class="dialog-section">
        <div class="dialog-section__title">驳回原因</div>
        <el-input
          v-model="rejectReason"
          type="textarea"
          :rows="4"
          placeholder="请输入驳回原因，将反馈给课程创建者"
        />
        <div class="reject-hint">驳回后课程将返回教师进行修改</div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <span class="dialog-footer__hint">此操作会通知课程创建者</span>
          <div class="dialog-footer__actions">
            <el-button @click="showRejectDialog = false">取消</el-button>
            <el-button type="danger" @click="confirmReject">确认驳回</el-button>
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

.course-teacher {
  font-size: 12px;
  color: var(--text-200);
  margin-bottom: 2px;
}

.course-desc {
  font-size: 12px;
  color: var(--text-200);
}

.empty-hint {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-200);
  border: 1px dashed var(--card-divider);
  border-radius: var(--radius-md);
}

/* Detail dialog */
.detail-cover-thumb {
  width: 64px;
  height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
}

.detail-desc {
  line-height: 1.7;
  color: var(--text-200);
  font-size: 13px;
  margin: 0;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--card-data-bg);
  border: 1px solid var(--card-divider);
  border-radius: var(--radius-md);
}

.chapter-order {
  width: 22px;
  height: 22px;
  background: var(--primary-100);
  color: var(--bg-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.chapter-name {
  flex: 1;
  font-size: 13px;
}

.chapter-duration {
  font-size: 12px;
  color: var(--text-200);
  flex-shrink: 0;
}

.reject-hint {
  margin-top: 8px;
  font-size: 12px;
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


