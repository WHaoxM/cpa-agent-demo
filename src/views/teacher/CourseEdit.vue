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
  <div class="course-edit-page page page--compact">
    <div class="page-head">
      <div class="page-head__left">
        <el-button text :icon="ArrowLeft" @click="goBack">返回</el-button>
        <div>
          <h2 class="page-head__title">{{ isEdit ? '编辑课程' : '创建新课程' }}</h2>
          <div class="page-head__desc">{{ isEdit ? '修改课程基本信息和章节结构' : '填写课程信息，配置章节内容' }}</div>
        </div>
      </div>
      <div class="page-head__right">
        <el-tag v-if="isEdit" effect="plain" size="small">编辑模式</el-tag>
        <el-tag v-else type="success" effect="plain" size="small">新建</el-tag>
        <el-button type="primary" @click="saveCourse">保存课程</el-button>
      </div>
    </div>

    <div class="edit-shell">
      <main class="edit-main">
        <div class="panel">
          <div class="form-section">
            <div class="form-section__head">
              <div class="form-section__title">基本信息</div>
              <div class="form-section__desc">课程名称和分类是必填项</div>
            </div>
            <el-form label-position="top">
              <div class="form-2col">
                <el-form-item label="课程名称">
                  <el-input v-model="courseForm.title" placeholder="请输入课程名称" />
                </el-form-item>
                <el-form-item label="课程分类">
                  <el-select v-model="courseForm.categoryId" placeholder="选择分类" style="width:100%;">
                    <el-option
                      v-for="cat in courseStore.categories"
                      :key="cat.id"
                      :label="cat.name"
                      :value="cat.id"
                    />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item label="课程封面 URL">
                <el-input v-model="courseForm.cover" placeholder="请输入封面图片 URL" />
              </el-form-item>
              <el-form-item label="课程简介">
                <el-input
                  v-model="courseForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入课程简介"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="form-section">
            <div class="form-section__head" style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div class="form-section__title">章节管理</div>
                <div class="form-section__desc">拖拽可调整章节顺序（当前为演示模式）</div>
              </div>
              <el-button type="primary" :icon="Plus" size="small" @click="addChapter">添加章节</el-button>
            </div>

            <el-collapse v-model="activeChapter">
              <el-collapse-item
                v-for="(chapter, index) in courseForm.chapters"
                :key="chapter.id"
                :name="index"
              >
                <template #title>
                  <div class="chapter-header">
                    <span class="chapter-order">{{ index + 1 }}</span>
                    <span class="chapter-name">{{ chapter.title }}</span>
                    <span class="chapter-dur" v-if="chapter.duration">{{ chapter.duration }} 分钟</span>
                    <el-button
                      text
                      type="danger"
                      :icon="Delete"
                      size="small"
                      @click.stop="removeChapter(index)"
                    />
                  </div>
                </template>

                <el-form label-position="top" class="chapter-form">
                  <div class="form-2col">
                    <el-form-item label="章节标题">
                      <el-input v-model="chapter.title" />
                    </el-form-item>
                    <el-form-item label="视频时长（分钟）">
                      <el-input-number v-model="chapter.duration" :min="0" style="width:100%;" />
                    </el-form-item>
                  </div>
                  <el-form-item label="视频 URL">
                    <el-input v-model="chapter.videoUrl" placeholder="请输入视频链接" />
                  </el-form-item>
                </el-form>
              </el-collapse-item>
            </el-collapse>

            <div v-if="courseForm.chapters.length === 0" class="empty-hint">
              暂无章节，点击"添加章节"开始配置课程内容
            </div>
          </div>
        </div>
      </main>

      <aside class="edit-rail">
        <div class="panel preview-panel">
          <div class="preview-label">课程预览</div>
          <el-image
            v-if="courseForm.cover"
            :src="courseForm.cover"
            class="preview-cover"
            fit="cover"
          />
          <div v-else class="preview-placeholder">暂无封面</div>
          <h4 class="preview-title">{{ courseForm.title || '未命名课程' }}</h4>
          <p class="preview-desc">{{ courseForm.description || '暂无简介' }}</p>
        </div>

        <div class="panel stats-panel">
          <div class="preview-label">课程数据</div>
          <div class="stat-kv">
            <span class="stat-kv__k">章节数</span>
            <span class="stat-kv__v">{{ courseForm.chapters.length }}</span>
          </div>
          <div class="stat-kv">
            <span class="stat-kv__k">总时长</span>
            <span class="stat-kv__v">{{ courseForm.chapters.reduce((sum, ch) => sum + ch.duration, 0) }} 分钟</span>
          </div>
          <div class="stat-kv">
            <span class="stat-kv__k">分类</span>
            <span class="stat-kv__v">{{ courseStore.categories.find(c => c.id === courseForm.categoryId)?.name || '未选择' }}</span>
          </div>
          <div class="stat-kv">
            <span class="stat-kv__k">状态</span>
            <span class="stat-kv__v">
              <el-tag v-if="isEdit" size="small" effect="plain" type="warning">编辑中</el-tag>
              <el-tag v-else size="small" effect="plain">草稿</el-tag>
            </span>
          </div>
        </div>

        <div class="panel tips-panel">
          <div class="preview-label">填写提示</div>
          <ul class="tips-list">
            <li>课程名称应简洁明确，便于学生检索</li>
            <li>封面推荐使用 16:9 比例图片</li>
            <li>建议每章时长控制在 15-45 分钟</li>
            <li>完善简介有助于提高课程曝光率</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.edit-shell {
  display: grid;
  gap: 12px;
}

.panel {
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  padding: 16px;
}

.edit-main {
  min-width: 0;
}

.edit-rail {
  display: grid;
  gap: 12px;
  align-content: start;
}

@media (min-width: 1024px) {
  .edit-shell {
    grid-template-columns: 1fr 300px;
    align-items: start;
  }

  .edit-rail {
    position: sticky;
    top: 90px;
  }
}

.form-section {
  padding: 16px 0;
}

.form-section + .form-section {
  border-top: 1px solid var(--card-divider);
}

.form-section__head {
  margin-bottom: 14px;
}

.form-section__title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-100);
}

.form-section__desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-200);
}

.form-2col {
  display: grid;
  gap: 0 20px;
}

@media (min-width: 768px) {
  .form-2col {
    grid-template-columns: 1fr 1fr;
  }
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding-right: 12px;
}

.chapter-order {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary-100);
  color: var(--bg-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.chapter-name {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
}

.chapter-dur {
  font-size: 11px;
  color: var(--text-200);
  flex-shrink: 0;
}

.chapter-form {
  padding: 8px 0 0 32px;
}

.empty-hint {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-200);
  border: 1px dashed var(--card-divider);
  border-radius: var(--radius-md);
  margin-top: 8px;
}

/* Preview sidebar */
.preview-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-200);
  letter-spacing: 0.06em;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--card-divider);
}

.preview-panel { background: var(--card-data-bg); }

.preview-cover {
  width: 100%;
  height: 140px;
  border-radius: 6px;
  margin-bottom: 12px;
  display: block;
}

.preview-placeholder {
  width: 100%;
  height: 100px;
  border-radius: 6px;
  background: var(--bg-200);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-200);
  font-size: 12px;
  margin-bottom: 12px;
}

.preview-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 800;
}

.preview-desc {
  font-size: 12px;
  color: var(--text-200);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stats-panel .stat-kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.stats-panel .stat-kv + .stat-kv {
  border-top: 1px dashed var(--card-divider);
}

.stat-kv__k {
  font-size: 12px;
  color: var(--text-200);
}

.stat-kv__v {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-100);
}

.tips-panel {
  background: var(--card-data-bg);
}

.tips-list {
  margin: 0;
  padding: 0 0 0 16px;
  list-style: disc;
}

.tips-list li {
  font-size: 12px;
  color: var(--text-200);
  line-height: 1.8;
}
</style>


