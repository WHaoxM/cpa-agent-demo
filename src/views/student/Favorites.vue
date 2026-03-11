<!-- 页面：我的收藏；路由：student/favorites（student-favorites）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Star, Notebook, ArrowRight, Delete, Refresh } from '@element-plus/icons-vue'
import { useUserStore, useCourseStore, useLearningStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()
const learningStore = useLearningStore()

const favoriteCourses = computed(() => courseStore.userFavorites)
const favoriteNotes = computed(() => 
  learningStore.getFavoriteNotes(userStore.currentUser?.id || '')
)

function viewCourse(courseId: string) {
  router.push(`/app/student/course/${courseId}`)
}

function viewNote(noteId: string) {
  router.push('/app/student/notes')
}

function removeFavorite(courseId: string) {
  courseStore.toggleFavorite(courseId)
  ElMessage.success('已取消收藏')
}

function removeNoteFavorite(noteId: string) {
  learningStore.toggleNoteFavorite(noteId)
  ElMessage.success('已取消笔记收藏')
}

function refreshData() {
  ElMessage.success('收藏数据已刷新')
}
</script>



<template>
  <div class="favorites-page page">
    <div class="page-header">
      <h2>我的收藏</h2>
      <p class="subtitle">管理你收藏的课程和笔记</p>
    </div>

    <div class="favorites-content grid-gap-md">
      <!-- 课程收藏 -->
      <div class="section content-card">
        <div class="section-header">
          <div class="section-title">
            <el-icon :size="20"><Star /></el-icon>
            <span>收藏的课程</span>
            <el-tag size="small" type="info">{{ favoriteCourses.length }}</el-tag>
          </div>
          <el-tooltip content="刷新数据">
            <el-button :icon="Refresh" circle text @click="refreshData" />
          </el-tooltip>
        </div>

        <div v-if="favoriteCourses.length > 0" class="courses-grid">
          <el-card
            v-for="course in favoriteCourses"
            :key="course.id"
            class="course-card card-base"
            shadow="never"
          >
            <div class="course-cover-wrapper" @click="viewCourse(course.id)">
              <el-image :src="course.cover" class="course-cover" fit="cover" />
              <div class="course-overlay">
                <el-button type="primary">查看课程</el-button>
              </div>
            </div>
            <div class="course-info">
              <h4 class="course-title">{{ course.title }}</h4>
              <p class="course-teacher">{{ course.teacherName }}</p>
              <div class="course-actions">
                <el-button
                  text
                  type="danger"
                  :icon="Delete"
                  @click="removeFavorite(course.id)"
                >
                  取消收藏
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无收藏课程">
          <template #default>
            <el-button type="primary" @click="router.push('/app/student/learning')">
              去发现课程
            </el-button>
          </template>
        </el-empty>
      </div>

      <!-- 笔记收藏 -->
      <div class="section content-card">
        <div class="section-header">
          <div class="section-title">
            <el-icon :size="20"><Notebook /></el-icon>
            <span>收藏的笔记</span>
            <el-tag size="small" type="info">{{ favoriteNotes.length }}</el-tag>
          </div>
        </div>

        <div v-if="favoriteNotes.length > 0" class="notes-list">
          <el-card
            v-for="note in favoriteNotes"
            :key="note.id"
            class="note-card card-base"
            shadow="never"
          >
            <div class="note-content" @click="viewNote(note.id)">
              <h4 class="note-title">
                <el-icon color="#E6A23C"><Star /></el-icon>
                {{ note.title }}
              </h4>
              <p class="note-preview" v-html="note.content.slice(0, 100) + '...'" />
              <div class="note-tags">
                <el-tag
                  v-for="tag in note.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <div class="note-actions">
              <el-button
                text
                :icon="ArrowRight"
                @click="viewNote(note.id)"
              >
                查看
              </el-button>
              <el-button
                text
                type="danger"
                :icon="Delete"
                @click="removeNoteFavorite(note.id)"
              >
                取消收藏
              </el-button>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无收藏笔记">
          <template #default>
            <el-button type="primary" @click="router.push('/app/student/notes')">
              去记笔记
            </el-button>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-page {
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.subtitle {
  color: var(--text-200);
  margin: 0;
}

.section {
  margin-bottom: 32px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.course-card :deep(.el-card__body) {
  padding: 0;
}

.course-cover-wrapper {
  position: relative;
  height: 140px;
  overflow: hidden;
  cursor: pointer;
}

.course-cover {
  width: 100%;
  height: 100%;
}

.course-overlay {
  display: none;
}

.course-cover-wrapper:hover .course-overlay {
  opacity: 0;
}

.course-info {
  padding: 16px;
}

.course-title {
  margin: 0 0 8px;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-teacher {
  font-size: 13px;
  color: var(--text-200);
  margin: 0 0 12px;
}

.course-actions {
  display: flex;
  justify-content: flex-end;
}

.notes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.note-card :deep(.el-card__body) {
  padding: 16px;
}

.note-content {
  cursor: pointer;
}

.note-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 15px;
}

.note-preview {
  font-size: 13px;
  color: var(--text-200);
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-light);
}
</style>


