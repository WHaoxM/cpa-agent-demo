<!-- 组件：CourseDetail -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, PlayCircle, CheckCircle, QuestionCircle, Document } from '@element-plus/icons-vue'
import { useUserStore, useCourseStore, useLearningStore } from '@/stores'
import type { Chapter, Question } from '@/types'
import { mockQuestions } from '@/mock/data'
import IntegrationHint from '@/components/IntegrationHint.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()
const learningStore = useLearningStore()

const courseId = route.params.id as string
const course = computed(() => courseStore.getCourseById(courseId))

// 视频播放器相关
const currentChapter = ref<Chapter | null>(null)
const videoPlaying = ref(false)
const playbackRate = ref(1)
const videoProgress = ref(0)
const isFullscreen = ref(false)

// 测验相关
const showQuiz = ref(false)
const currentQuiz = ref<Question[]>([])
const quizAnswers = ref<Record<string, string | string[]>>({})
const quizSubmitted = ref(false)
const quizScore = ref(0)

// 笔记相关
const showNoteEditor = ref(false)
const noteContent = ref('')
const noteTags = ref<string[]>([])
const availableTags = ['重要', '疑问', '总结', '重点']

onMounted(() => {
  if (course.value && course.value.chapters.length > 0) {
    selectChapter(course.value.chapters[0])
  }
})

function selectChapter(chapter: Chapter) {
  currentChapter.value = chapter
  showQuiz.value = false
  videoPlaying.value = false
  videoProgress.value = 0
  
  // 加载该章节的测验题目
  currentQuiz.value = mockQuestions.filter(q => q.chapterId === chapter.id)
  quizAnswers.value = {}
  quizSubmitted.value = false
}

function togglePlay() {
  videoPlaying.value = !videoPlaying.value
}

function setPlaybackRate(rate: number) {
  playbackRate.value = rate
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function submitQuiz() {
  let correct = 0
  let totalScore = 0
  const correctAnswers: Record<string, boolean> = {}
  
  currentQuiz.value.forEach(q => {
    const answer = quizAnswers.value[q.id]
    const isCorrect = Array.isArray(q.correctAnswer) 
      ? Array.isArray(answer) && q.correctAnswer.every(a => answer.includes(a))
      : answer === q.correctAnswer
    
    if (isCorrect) {
      correct++
      totalScore += q.score
    }
    correctAnswers[q.id] = isCorrect
  })
  
  quizScore.value = totalScore
  quizSubmitted.value = true
  
  // 保存测验记录
  learningStore.addQuizRecord({
    userId: userStore.currentUser?.id || '',
    courseId: courseId,
    chapterId: currentChapter.value?.id || '',
    score: totalScore,
    totalScore: currentQuiz.value.reduce((sum, q) => sum + q.score, 0),
    answers: quizAnswers.value,
    correctAnswers,
    duration: 10,
    completedAt: new Date().toISOString(),
  })
  
  // 更新学习进度
  courseStore.updateProgress(
    userStore.currentUser?.id || '',
    courseId,
    currentChapter.value?.id || '',
    { progress: 100, completed: true }
  )
}

function saveNote() {
  if (!noteContent.value.trim()) {
    ElMessage.warning('请输入笔记内容')
    return
  }
  
  learningStore.addNote({
    userId: userStore.currentUser?.id || '',
    courseId: courseId,
    chapterId: currentChapter.value?.id,
    title: `${currentChapter.value?.title} - 笔记`,
    content: noteContent.value,
    tags: noteTags.value,
    isFavorite: false,
  })
  
  ElMessage.success('笔记保存成功')
  showNoteEditor.value = false
  noteContent.value = ''
  noteTags.value = []
}

function getChapterProgress(chapterId: string): number {
  const progress = courseStore.getChapterProgress(userStore.currentUser?.id || '', chapterId)
  return progress?.progress || 0
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function goBack() {
  router.push('/app/student/learning')
}
</script>



<template>
  <div class="course-detail page">
    <!-- 头部 -->
    <div class="page-header">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">{{ course?.title }}</h1>
    </div>

    <div class="content-wrapper">
      <!-- 左侧视频/测验区域 -->
      <div class="main-content">
        <!-- 视频播放器 -->
        <div v-if="!showQuiz" class="video-player-wrapper">
          <div class="video-player" :class="{ fullscreen: isFullscreen }">
            <div class="video-placeholder">
              <el-icon :size="60"><PlayCircle /></el-icon>
              <p>视频播放区域</p>
              <p class="video-hint">{{ currentChapter?.title }}</p>
              <IntegrationHint align="center" />
            </div>
            
            <!-- 视频控制栏 -->
            <div class="video-controls">
              <el-button text @click="togglePlay">
                <el-icon :size="24">
                  <component :is="videoPlaying ? 'VideoPause' : 'VideoPlay'" />
                </el-icon>
              </el-button>
              
              <el-slider v-model="videoProgress" :max="100" class="progress-slider" />
              
              <div class="control-right">
                <el-dropdown @command="setPlaybackRate">
                  <el-button text>{{ playbackRate }}x</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="0.5">0.5x</el-dropdown-item>
                      <el-dropdown-item command="1">1.0x</el-dropdown-item>
                      <el-dropdown-item command="1.25">1.25x</el-dropdown-item>
                      <el-dropdown-item command="1.5">1.5x</el-dropdown-item>
                      <el-dropdown-item command="2">2.0x</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                
                <el-button text @click="toggleFullscreen">
                  <el-icon :size="20">
                    <component :is="isFullscreen ? 'FullScreen' : 'FullScreen'" />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 章节操作 -->
          <div class="chapter-actions">
            <el-button type="primary" :icon="QuestionCircle" @click="showQuiz = true">
              章节测验
            </el-button>
            <el-button :icon="Document" @click="showNoteEditor = true">
              记笔记
            </el-button>
          </div>
        </div>

        <!-- 测验界面 -->
        <div v-else class="quiz-wrapper">
          <div class="quiz-header">
            <h2>章节测验：{{ currentChapter?.title }}</h2>
            <IntegrationHint align="right" />
            <el-button text @click="showQuiz = false">返回视频</el-button>
          </div>
          
          <div v-if="currentQuiz.length > 0" class="quiz-content">
            <div 
              v-for="(q, index) in currentQuiz" 
              :key="q.id"
              class="quiz-question"
              :class="{ submitted: quizSubmitted }"
            >
              <div class="question-header">
                <span class="question-number">{{ index + 1 }}</span>
                <span class="question-type">{{ q.type === 'single_choice' ? '单选题' : q.type === 'multiple_choice' ? '多选题' : '填空题' }}</span>
                <span class="question-score">{{ q.score }}分</span>
              </div>
              
              <p class="question-content">{{ q.content }}</p>
              
              <!-- 单选题 -->
              <el-radio-group 
                v-if="q.type === 'single_choice'" 
                v-model="quizAnswers[q.id]"
                :disabled="quizSubmitted"
              >
                <el-radio 
                  v-for="option in q.options" 
                  :key="option" 
                  :label="option"
                  :class="{ 
                    correct: quizSubmitted && option === q.correctAnswer,
                    wrong: quizSubmitted && quizAnswers[q.id] === option && option !== q.correctAnswer
                  }"
                >
                  {{ option }}
                </el-radio>
              </el-radio-group>
              
              <!-- 多选题 -->
              <el-checkbox-group 
                v-else-if="q.type === 'multiple_choice'" 
                v-model="quizAnswers[q.id]"
                :disabled="quizSubmitted"
              >
                <el-checkbox 
                  v-for="option in q.options" 
                  :key="option" 
                  :label="option"
                >
                  {{ option }}
                </el-checkbox>
              </el-checkbox-group>
              
              <!-- 填空题 -->
              <el-input 
                v-else
                v-model="quizAnswers[q.id]"
                placeholder="请输入答案"
                :disabled="quizSubmitted"
              />
              
              <div v-if="quizSubmitted" class="answer-feedback">
                <el-tag :type="quizAnswers[q.id] === q.correctAnswer ? 'success' : 'danger'">
                  {{ quizAnswers[q.id] === q.correctAnswer ? '回答正确' : '回答错误' }}
                </el-tag>
                <span v-if="quizAnswers[q.id] !== q.correctAnswer" class="correct-answer">
                  正确答案：{{ q.correctAnswer }}
                </span>
              </div>
            </div>
            
            <div class="quiz-actions">
              <el-button 
                v-if="!quizSubmitted" 
                type="primary" 
                size="large" 
                @click="submitQuiz"
              >
                提交答案
              </el-button>
              <div v-else class="quiz-result">
                <el-result
                  :icon="quizScore >= 60 ? 'success' : 'warning'"
                  :title="`得分：${quizScore}分`"
                  :sub-title="quizScore >= 60 ? '恭喜你通过了测验！' : '继续加油，重新学习后再试一次'"
                />
              </div>
            </div>
          </div>
          
          <el-empty v-else description="本章节暂无测验题目" />
        </div>
      </div>

      <!-- 右侧章节列表 -->
      <div class="sidebar">
        <h3 class="sidebar-title">课程章节</h3>
        <div class="chapter-list">
          <div
            v-for="chapter in course?.chapters"
            :key="chapter.id"
            class="chapter-item"
            :class="{ active: currentChapter?.id === chapter.id }"
            @click="selectChapter(chapter)"
          >
            <div class="chapter-info">
              <el-icon v-if="getChapterProgress(chapter.id) >= 100" class="completed-icon">
                <CheckCircle />
              </el-icon>
              <el-icon v-else><PlayCircle /></el-icon>
              <span class="chapter-title">{{ chapter.title }}</span>
            </div>
            <span class="chapter-duration">{{ formatDuration(chapter.duration * 60) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 笔记编辑器弹窗 -->
    <el-dialog
      v-model="showNoteEditor"
      title="学习笔记"
      width="600px"
    >
      <div class="note-editor">
        <el-input
          v-model="noteContent"
          type="textarea"
          :rows="8"
          placeholder="记录你的学习心得..."
        />
        <div class="note-tags">
          <span class="tags-label">标签：</span>
          <el-checkbox-group v-model="noteTags">
            <el-checkbox v-for="tag in availableTags" :key="tag" :label="tag" />
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="showNoteEditor = false">取消</el-button>
        <el-button type="primary" @click="saveNote">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.course-detail {
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

.video-player-wrapper {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.video-player {
  position: relative;
  aspect-ratio: 16/9;
}

.video-player.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.video-hint {
  opacity: 0.7;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.progress-slider {
  flex: 1;
}

.control-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapter-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--bg-100);
}

.quiz-wrapper {
  background: var(--bg-100);
  border-radius: 12px;
  padding: 24px;
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.quiz-header h2 {
  margin: 0;
  font-size: 18px;
}

.quiz-question {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-100);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.question-type {
  font-size: 12px;
  color: var(--text-200);
}

.question-score {
  font-size: 12px;
  color: var(--text-200);
  margin-left: auto;
}

.question-content {
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.6;
}

:deep(.el-radio-group),
:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:deep(.el-radio.correct),
:deep(.el-checkbox.correct) {
  color: #67C23A;
}

:deep(.el-radio.wrong),
:deep(.el-checkbox.wrong) {
  color: #F56C6C;
}

.answer-feedback {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.correct-answer {
  color: var(--text-200);
  font-size: 13px;
}

.quiz-actions {
  margin-top: 24px;
  text-align: center;
}

.sidebar {
  background: var(--bg-100);
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chapter-item:hover,
.chapter-item.active {
  background: var(--primary-100);
  color: #fff;
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.completed-icon {
  color: #67C23A;
}

.chapter-title {
  font-size: 14px;
}

.chapter-duration {
  font-size: 12px;
  opacity: 0.7;
}

.note-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-tags {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tags-label {
  font-size: 14px;
  color: var(--text-200);
}

@media (max-width: 992px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    order: -1;
  }
}
</style>


