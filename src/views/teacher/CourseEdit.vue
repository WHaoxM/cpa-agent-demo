<!-- 页面：编辑课程；路由：teacher/course/edit/:id?（teacher-course-edit）；角色：TEACHER -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores'
import type { Chapter } from '@/types'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

const courseId = route.params.id as string | undefined
const isEdit = !!courseId

const courseForm = ref({
  title: '',
  description: '',
  cover: '',
  categoryId: '',
  chapters: [] as Chapter[],
})

// 如果是编辑模式，加载课程数据
if (isEdit) {
  const course = courseStore.getCourseById(courseId)
  if (course) {
    courseForm.value = {
      title: course.title,
      description: course.description,
      cover: course.cover,
      categoryId: course.categoryId,
      chapters: [...course.chapters],
    }
  }
}

const activeChapter = ref(0)

function addChapter() {
  const newChapter: Chapter = {
    id: `ch_${Date.now()}`,
    title: `新章节 ${courseForm.value.chapters.length + 1}`,
    duration: 0,
    order: courseForm.value.chapters.length + 1,
  }
  courseForm.value.chapters.push(newChapter)
  activeChapter.value = courseForm.value.chapters.length - 1
}

function removeChapter(index: number) {
  courseForm.value.chapters.splice(index, 1)
  if (activeChapter.value >= courseForm.value.chapters.length) {
    activeChapter.value = courseForm.value.chapters.length - 1
  }
}

function saveCourse() {
  if (!courseForm.value.title.trim()) {
    ElMessage.warning('请输入课程名称')
    return
  }

  if (isEdit) {
    courseStore.updateCourse(courseId!, {
      ...courseForm.value,
      totalDuration: courseForm.value.chapters.reduce((sum, ch) => sum + ch.duration, 0),
    })
    ElMessage.success('课程更新成功')
  } else {
    courseStore.addCourse({
      ...courseForm.value,
      teacherId: 'teacher_001',
      teacherName: '刘老师',
      status: 'draft',
      chapters: courseForm.value.chapters,
      totalDuration: courseForm.value.chapters.reduce((sum, ch) => sum + ch.duration, 0),
      studentCount: 0,
      rating: 0,
    })
    ElMessage.success('课程创建成功')
  }

  router.push('/app/teacher/courses')
}

function goBack() {
  router.back()
}
</script>



<template>
  <div class="course-edit-page page">
    <div class="page-header">
      <el-button text :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h2>{{ isEdit ? '编辑课程' : '创建课程' }}</h2>
      <el-button type="primary" @click="saveCourse">保存</el-button>
    </div>

    <el-row :gutter="24">
      <el-col :span="16">
        <el-card shadow="never">
          <el-form label-position="top">
            <el-form-item label="课程名称">
              <el-input v-model="courseForm.title" placeholder="请输入课程名称" />
            </el-form-item>

            <el-form-item label="课程封面">
              <el-input v-model="courseForm.cover" placeholder="请输入封面图片URL" />
            </el-form-item>

            <el-form-item label="课程分类">
              <el-select v-model="courseForm.categoryId" placeholder="选择分类">
                <el-option
                  v-for="cat in courseStore.categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="课程简介">
              <el-input
                v-model="courseForm.description"
                type="textarea"
                :rows="4"
                placeholder="请输入课程简介"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 章节管理 -->
        <el-card shadow="never" class="chapters-card">
          <template #header>
            <div class="card-header">
              <span>章节管理</span>
              <el-button type="primary" :icon="Plus" @click="addChapter">
                添加章节
              </el-button>
            </div>
          </template>

          <el-collapse v-model="activeChapter">
            <el-collapse-item
              v-for="(chapter, index) in courseForm.chapters"
              :key="chapter.id"
              :name="index"
            >
              <template #title>
                <div class="chapter-header">
                  <span>第 {{ index + 1 }} 章：{{ chapter.title }}</span>
                  <el-button
                    text
                    type="danger"
                    :icon="Delete"
                    @click.stop="removeChapter(index)"
                  />
                </div>
              </template>

              <el-form label-position="top">
                <el-form-item label="章节标题">
                  <el-input v-model="chapter.title" />
                </el-form-item>
                <el-form-item label="视频时长（分钟）">
                  <el-input-number v-model="chapter.duration" :min="0" />
                </el-form-item>
                <el-form-item label="视频URL">
                  <el-input v-model="chapter.videoUrl" placeholder="请输入视频链接" />
                </el-form-item>
              </el-form>
            </el-collapse-item>
          </el-collapse>

          <el-empty v-if="courseForm.chapters.length === 0" description="暂无章节，点击上方按钮添加" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span>课程预览</span>
          </template>
          <div class="preview-content">
            <el-image
              v-if="courseForm.cover"
              :src="courseForm.cover"
              class="preview-cover"
              fit="cover"
            />
            <div v-else class="preview-placeholder">暂无封面</div>
            <h4 class="preview-title">{{ courseForm.title || '未命名课程' }}</h4>
            <p class="preview-desc">{{ courseForm.description || '暂无简介' }}</p>
            <div class="preview-stats">
              <span>共 {{ courseForm.chapters.length }} 个章节</span>
              <span>总时长 {{ courseForm.chapters.reduce((sum, ch) => sum + ch.duration, 0) }} 分钟</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.course-edit-page {
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

.chapters-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 16px;
}

.preview-content {
  text-align: center;
}

.preview-cover {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview-placeholder {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  background: var(--bg-200);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-200);
  margin-bottom: 16px;
}

.preview-title {
  margin: 0 0 8px;
  font-size: 16px;
}

.preview-desc {
  font-size: 13px;
  color: var(--text-200);
  line-height: 1.5;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preview-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-200);
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}
</style>


