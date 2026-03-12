<!-- 页面：技能管理；路由：student/skills（student-skills）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Edit, Star, Document, Refresh } from '@element-plus/icons-vue'
import { useUserStore, useCourseStore, useLearningStore } from '@/stores'
import { mockQuestions } from '@/mock/data'
import type { Note, WrongQuestion } from '@/types'
import IntegrationHint from '@/components/IntegrationHint.vue'

// 编辑器相关
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()
const learningStore = useLearningStore()

// ─── 状态 ───
const activeTab = ref<'notes' | 'wrongbook' | 'favorites'>('notes')
const searchQuery = ref('')
const agentProcessing = ref(false)
const agentLogs = ref<string[]>([
  '[SYS] NEURAL_ARCHIVE v2.4 — 初始化完成',
  '[SYS] 多Agent协作模块已就绪',
  '[AGENT:LOCATOR] 知识图谱索引已加载',
  '[AGENT:ANALYZER] 错因诊断引擎在线',
])

function addLog(msg: string) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  agentLogs.value.push(`[${time}] ${msg}`)
  if (agentLogs.value.length > 50) agentLogs.value.shift()
}

// ─── 笔记 Tab ───
const editorRef = ref<any>(null)
const showEditor = ref(false)
const editingNote = ref<Note | null>(null)
const noteCourseId = ref('')
const noteTitle = ref('')
const noteContent = ref('')
const noteTags = ref<string[]>([])
const selectedTags = ref<string[]>([])

const notes = computed(() => learningStore.getUserNotes(userStore.currentUser?.id || ''))
const availableTags = computed(() => learningStore.getKnowledgePoints(userStore.currentUser?.id || ''))

const filteredNotes = computed(() => {
  let result = notes.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  if (selectedTags.value.length > 0) {
    result = result.filter(n => selectedTags.value.some(tag => n.tags.includes(tag)))
  }
  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

const toolbarConfig = {
  toolbarKeys: [
    'bold', 'italic', 'underline', 'through', 'code',
    'color', 'bgColor', 'fontSize',
    'justifyLeft', 'justifyCenter', 'justifyRight',
    'bulletedList', 'numberedList',
    'insertLink', 'blockquote', 'headerSelect', 'codeBlock',
  ],
}
const editorConfig = { placeholder: '请输入笔记内容...', MENU_CONF: {} }

function handleCreated(editor: any) { editorRef.value = editor }

function createNote() {
  editingNote.value = null
  noteCourseId.value = ''
  noteTitle.value = ''
  noteContent.value = ''
  noteTags.value = []
  showEditor.value = true
}

function editNote(note: Note) {
  editingNote.value = note
  noteCourseId.value = note.courseId || ''
  noteTitle.value = note.title
  noteContent.value = note.content
  noteTags.value = [...note.tags]
  showEditor.value = true
}

function onEditorClosed() {
  editingNote.value = null
  noteTitle.value = ''
  noteContent.value = ''
  noteTags.value = []
  if (editorRef.value) { editorRef.value.destroy(); editorRef.value = null }
}

function saveNote() {
  if (!noteTitle.value.trim()) { ElMessage.warning('请输入笔记标题'); return }
  if (editingNote.value) {
    learningStore.updateNote(editingNote.value.id, {
      courseId: noteCourseId.value, title: noteTitle.value,
      content: noteContent.value, tags: noteTags.value,
    })
    addLog('[AGENT:SYNC] 笔记档案已更新 → ' + noteTitle.value)
    ElMessage.success('笔记更新成功')
  } else {
    learningStore.addNote({
      userId: userStore.currentUser?.id || '', courseId: noteCourseId.value,
      title: noteTitle.value, content: noteContent.value,
      tags: noteTags.value, isFavorite: false,
    })
    addLog('[AGENT:SYNC] 新建笔记档案 → ' + noteTitle.value)
    ElMessage.success('笔记创建成功')
  }
  showEditor.value = false
}

function deleteNote(note: Note) {
  ElMessageBox.confirm('确定要删除这条笔记吗？', '提示', { type: 'warning' }).then(() => {
    learningStore.deleteNote(note.id)
    addLog('[AGENT:SYNC] 笔记档案已移除 → ' + note.title)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function toggleNoteFav(note: Note) { learningStore.toggleNoteFavorite(note.id) }
function getCourseName(courseId: string) { return courseStore.getCourseById(courseId)?.title || '未分类' }

// ─── 错题 Tab ───
const wrongQuestions = computed(() => learningStore.getUserWrongQuestions(userStore.currentUser?.id || ''))

type AgentAnalysisResult = {
  diagnosis: { cause: string; evidence: string; confidence: number }[]
  remedy: { action: string; etaMin: number; priority: 'high' | 'medium' | 'low' }[]
}

const selectedWqId = ref('')
const wqAnalysis = ref<Record<string, AgentAnalysisResult>>({})
const wqAnalysisLoading = ref(false)

const filteredWrongQuestions = computed(() => {
  const kw = searchQuery.value.trim().toLowerCase()
  return [...wrongQuestions.value]
    .sort((a, b) => (b.lastWrongAt || '').localeCompare(a.lastWrongAt || '') || b.times - a.times)
    .filter(wq => {
      if (!kw) return true
      const content = String(wq.question?.content || '').toLowerCase()
      const kp = String((wq.question as any)?.knowledgePoint || '').toLowerCase()
      return content.includes(kw) || kp.includes(kw)
    })
})

function getWqStatus(wq: WrongQuestion) {
  if (wq.times >= 4) return { label: 'CRITICAL', cls: 'cyber-tag--critical' }
  if (wq.times >= 3) return { label: 'VOLATILE', cls: 'cyber-tag--warning' }
  return { label: 'STABLE', cls: 'cyber-tag--stable' }
}

function getWqDifficulty(wq: WrongQuestion) {
  const d = String((wq.question as any)?.difficulty || 'medium')
  if (d === 'hard') return '困难'
  if (d === 'easy') return '简单'
  return '中等'
}

async function selectWrongQuestion(wq: WrongQuestion) {
  selectedWqId.value = wq.id
  if (!wqAnalysis.value[wq.id]) {
    wqAnalysisLoading.value = true
    addLog(`[AGENT:DIAGNOSER] 正在分析错题 #${wq.id.slice(-4)}...`)
    await new Promise(r => setTimeout(r, 500))
    const kp = String((wq.question as any)?.knowledgePoint || '知识点')
    wqAnalysis.value[wq.id] = {
      diagnosis: [
        { cause: '概念边界不清', evidence: `「${kp}」的适用条件未正确识别`, confidence: 0.74 },
        { cause: '步骤跳跃', evidence: `中间推导缺失导致结果偏差`, confidence: 0.61 },
      ],
      remedy: [
        { action: '回看对应视频片段并手写标准推导', etaMin: 18, priority: 'high' },
        { action: '做5道同类题（从易到难）', etaMin: 25, priority: 'high' },
        { action: '将关键条件写入笔记顶部', etaMin: 6, priority: 'medium' },
      ],
    }
    addLog(`[AGENT:DIAGNOSER] 分析完成 — 发现 2 个根因`)
    wqAnalysisLoading.value = false
  }
}

function removeWrongQuestion(wq: WrongQuestion) {
  learningStore.removeWrongQuestion(userStore.currentUser?.id || '', wq.questionId)
  if (selectedWqId.value === wq.id) selectedWqId.value = ''
  addLog(`[AGENT:SYNC] 错题 #${wq.id.slice(-4)} 已从档案移除`)
  ElMessage.success('已移除')
}

function seedDemoWrongQuestions() {
  const uid = String(userStore.currentUser?.id || '')
  if (!uid) return
  mockQuestions.slice(0, 6).forEach((q, idx) => {
    const wrong = Array.isArray(q.correctAnswer)
      ? q.options?.filter(o => !q.correctAnswer.includes(o)).slice(0, 1) || []
      : (q.options?.find(o => o !== q.correctAnswer) || String(q.correctAnswer))
    learningStore.addWrongQuestion(uid, q, wrong)
    if (idx % 2 === 0) learningStore.addWrongQuestion(uid, q, wrong)
  })
  addLog('[SYS] 已填充示例错题数据')
  ElMessage.success('已填充示例错题')
}

// ─── 收藏 Tab ───
const favoriteCourses = computed(() => courseStore.userFavorites)
const favoriteNotes = computed(() => learningStore.getFavoriteNotes(userStore.currentUser?.id || ''))

function viewCourse(courseId: string) { router.push(`/app/student/course/${courseId}`) }
function removeFavorite(courseId: string) {
  courseStore.toggleFavorite(courseId)
  addLog('[AGENT:SYNC] 课程收藏已移除')
  ElMessage.success('已取消收藏')
}
function removeNoteFavorite(noteId: string) {
  learningStore.toggleNoteFavorite(noteId)
  addLog('[AGENT:SYNC] 笔记收藏已移除')
  ElMessage.success('已取消笔记收藏')
}

// ─── Agent处理模拟 ───
async function runAgentScan() {
  agentProcessing.value = true
  addLog('[AGENT:SCANNER] 启动全档案扫描...')
  await new Promise(r => setTimeout(r, 600))
  addLog('[AGENT:SCANNER] 扫描笔记档案 × ' + notes.value.length)
  await new Promise(r => setTimeout(r, 400))
  addLog('[AGENT:SCANNER] 扫描错题档案 × ' + wrongQuestions.value.length)
  await new Promise(r => setTimeout(r, 400))
  addLog('[AGENT:ANALYZER] 交叉引用检测 — 发现 3 组关联')
  await new Promise(r => setTimeout(r, 300))
  addLog('[AGENT:OPTIMIZER] 记忆优化建议已生成')
  agentProcessing.value = false
}

// ─── 统计 ───
const stats = computed(() => ({
  totalNotes: notes.value.length,
  totalWrong: wrongQuestions.value.length,
  totalFavCourses: favoriteCourses.value.length,
  totalFavNotes: favoriteNotes.value.length,
  criticalCount: wrongQuestions.value.filter(wq => wq.times >= 4).length,
}))

onMounted(() => {
  return () => { if (editorRef.value) editorRef.value.destroy() }
})
</script>

<template>
  <div class="skill-page">
    <!-- 顶部状态条 -->
    <div class="skill-header">
      <div class="skill-header__left">
        <div class="skill-header__title">
          <Icon icon="lucide:database" class="skill-header__icon" />
          <span>NEURAL_ARCHIVE</span>
          <span class="skill-header__version">v2.4</span>
        </div>
        <div class="skill-header__subtitle">技能管理 · 神经档案库</div>
      </div>
      <div class="skill-header__stats">
        <div class="stat-cell">
          <span class="stat-cell__value">{{ stats.totalNotes }}</span>
          <span class="stat-cell__label">笔记</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell__value">{{ stats.totalWrong }}</span>
          <span class="stat-cell__label">错题</span>
        </div>
        <div class="stat-cell" :class="{ 'stat-cell--alert': stats.criticalCount > 0 }">
          <span class="stat-cell__value">{{ stats.criticalCount }}</span>
          <span class="stat-cell__label">CRITICAL</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell__value">{{ stats.totalFavCourses + stats.totalFavNotes }}</span>
          <span class="stat-cell__label">收藏</span>
        </div>
      </div>
      <div class="skill-header__actions">
        <button class="cyber-btn" :disabled="agentProcessing" @click="runAgentScan">
          <Icon icon="lucide:scan" />
          <span>{{ agentProcessing ? 'SCANNING...' : 'AGENT SCAN' }}</span>
        </button>
      </div>
    </div>

    <!-- 主体 -->
    <div class="skill-body">
      <!-- 左侧数据列表 -->
      <div class="skill-list">
        <!-- 搜索 + Tab -->
        <div class="skill-list__toolbar">
          <el-input v-model="searchQuery" placeholder="搜索档案..." :prefix-icon="Search" clearable class="skill-search" />
          <div class="skill-tabs">
            <button class="skill-tab" :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">
              <span class="skill-tab__label">笔记档案</span>
              <span class="skill-tab__count">{{ stats.totalNotes }}</span>
            </button>
            <button class="skill-tab" :class="{ active: activeTab === 'wrongbook' }" @click="activeTab = 'wrongbook'">
              <span class="skill-tab__label">错题诊断</span>
              <span class="skill-tab__count">{{ stats.totalWrong }}</span>
            </button>
            <button class="skill-tab" :class="{ active: activeTab === 'favorites' }" @click="activeTab = 'favorites'">
              <span class="skill-tab__label">收藏索引</span>
              <span class="skill-tab__count">{{ stats.totalFavCourses + stats.totalFavNotes }}</span>
            </button>
          </div>
        </div>

        <!-- 笔记列表 -->
        <div v-if="activeTab === 'notes'" class="skill-list__content">
          <div class="skill-list__actions">
            <el-select v-model="selectedTags" placeholder="筛选标签" multiple collapse-tags clearable size="small" style="width: 160px">
              <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
            </el-select>
            <button class="cyber-btn cyber-btn--sm" @click="createNote">
              <Icon icon="lucide:plus" />
              <span>NEW</span>
            </button>
          </div>
          <div v-if="filteredNotes.length > 0" class="data-list">
            <button v-for="note in filteredNotes" :key="note.id" type="button" class="data-row" @click="editNote(note)">
              <div class="data-row__head">
                <span class="data-row__title">
                  <span v-if="learningStore.isNoteFavorite(note.id)" class="fav-indicator" />
                  {{ note.title }}
                </span>
                <span class="cyber-tag cyber-tag--stable">STABLE</span>
              </div>
              <div class="data-row__meta">
                <span>{{ note.courseId ? getCourseName(note.courseId) : '未分类' }}</span>
                <span>{{ note.updatedAt }}</span>
              </div>
              <div v-if="note.tags.length > 0" class="data-row__tags">
                <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="mini-tag">{{ tag }}</span>
                <span v-if="note.tags.length > 3" class="mini-tag mini-tag--more">+{{ note.tags.length - 3 }}</span>
              </div>
              <div class="data-row__bar">
                <div class="cyber-bar"><div class="cyber-bar__fill" style="width: 78%" /></div>
              </div>
              <div class="data-row__actions" @click.stop>
                <el-button text size="small" :icon="Star" @click="toggleNoteFav(note)" />
                <el-button text size="small" type="danger" :icon="Delete" @click="deleteNote(note)" />
              </div>
            </button>
          </div>
          <div v-else class="data-empty">
            <Icon icon="lucide:file-text" class="data-empty__icon" />
            <span>暂无笔记档案</span>
          </div>
        </div>

        <!-- 错题列表 -->
        <div v-if="activeTab === 'wrongbook'" class="skill-list__content">
          <div v-if="filteredWrongQuestions.length > 0" class="data-list">
            <button v-for="wq in filteredWrongQuestions" :key="wq.id" type="button"
              class="data-row" :class="{ 'data-row--active': wq.id === selectedWqId }"
              @click="selectWrongQuestion(wq)">
              <div class="data-row__head">
                <span class="data-row__title">{{ (wq.question as any)?.knowledgePoint || '未标注' }}</span>
                <span class="cyber-tag" :class="getWqStatus(wq).cls">{{ getWqStatus(wq).label }}</span>
              </div>
              <div class="data-row__meta">
                <span>错误 ×{{ wq.times }}</span>
                <span>{{ getWqDifficulty(wq) }}</span>
                <span>{{ wq.lastWrongAt?.split(' ')[0] }}</span>
              </div>
              <div class="data-row__preview">{{ String(wq.question?.content || '').slice(0, 60) }}{{ String(wq.question?.content || '').length > 60 ? '…' : '' }}</div>
              <div class="data-row__bar">
                <div class="cyber-bar"><div class="cyber-bar__fill" :style="{ width: Math.min(100, wq.times * 25) + '%' }" /></div>
              </div>
              <div class="data-row__actions" @click.stop>
                <el-button text size="small" type="danger" :icon="Delete" @click="removeWrongQuestion(wq)" />
              </div>
            </button>
          </div>
          <div v-else class="data-empty">
            <Icon icon="lucide:check-circle" class="data-empty__icon" />
            <span>暂无错题，继续保持！</span>
            <button class="cyber-btn cyber-btn--sm" style="margin-top: 12px" @click="seedDemoWrongQuestions">填充示例</button>
          </div>
        </div>

        <!-- 收藏列表 -->
        <div v-if="activeTab === 'favorites'" class="skill-list__content">
          <div class="data-list">
            <div v-if="favoriteCourses.length > 0" class="data-section-label">收藏课程</div>
            <button v-for="course in favoriteCourses" :key="course.id" type="button" class="data-row" @click="viewCourse(course.id)">
              <div class="data-row__head">
                <span class="data-row__title">{{ course.title }}</span>
                <span class="cyber-tag cyber-tag--active">COURSE</span>
              </div>
              <div class="data-row__meta">
                <span>{{ course.teacherName }}</span>
              </div>
              <div class="data-row__actions" @click.stop>
                <el-button text size="small" type="danger" :icon="Delete" @click="removeFavorite(course.id)" />
              </div>
            </button>

            <div v-if="favoriteNotes.length > 0" class="data-section-label" style="margin-top: 8px">收藏笔记</div>
            <button v-for="note in favoriteNotes" :key="note.id" type="button" class="data-row" @click="editNote(note)">
              <div class="data-row__head">
                <span class="data-row__title">{{ note.title }}</span>
                <span class="cyber-tag cyber-tag--active">NOTE</span>
              </div>
              <div class="data-row__meta">
                <span v-for="tag in note.tags.slice(0, 2)" :key="tag">{{ tag }}</span>
              </div>
              <div class="data-row__actions" @click.stop>
                <el-button text size="small" type="danger" :icon="Delete" @click="removeNoteFavorite(note.id)" />
              </div>
            </button>

            <div v-if="favoriteCourses.length === 0 && favoriteNotes.length === 0" class="data-empty">
              <Icon icon="lucide:star" class="data-empty__icon" />
              <span>暂无收藏</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧Agent面板 -->
      <div class="skill-agent">
        <div class="skill-agent__header">
          <div class="skill-agent__title">
            <Icon icon="lucide:cpu" class="skill-agent__icon" />
            <span>MULTI-AGENT PROCESSING</span>
          </div>
          <div class="skill-agent__status">
            <span class="cyber-dot" :class="{ 'cyber-dot--accent': agentProcessing }" />
            <span>{{ agentProcessing ? 'PROCESSING' : 'IDLE' }}</span>
          </div>
        </div>

        <!-- 错题分析结果 -->
        <div v-if="activeTab === 'wrongbook' && selectedWqId && wqAnalysis[selectedWqId]" class="agent-result">
          <div class="agent-section">
            <div class="agent-section__head">
              <Icon icon="lucide:search" />
              <span>ROOT_CAUSE_ANALYSIS</span>
            </div>
            <div v-for="(d, i) in wqAnalysis[selectedWqId].diagnosis" :key="i" class="agent-item">
              <div class="agent-item__head">
                <span class="agent-item__title">{{ d.cause }}</span>
                <span class="agent-item__score">{{ Math.round(d.confidence * 100) }}%</span>
              </div>
              <div class="agent-item__desc">{{ d.evidence }}</div>
            </div>
          </div>
          <div class="cyber-divider" />
          <div class="agent-section">
            <div class="agent-section__head">
              <Icon icon="lucide:zap" />
              <span>REMEDY_PROTOCOL</span>
            </div>
            <div v-for="(r, i) in wqAnalysis[selectedWqId].remedy" :key="i" class="agent-item">
              <div class="agent-item__head">
                <span class="agent-item__title">{{ r.action }}</span>
                <span class="cyber-tag" :class="r.priority === 'high' ? 'cyber-tag--critical' : 'cyber-tag--stable'">{{ r.priority.toUpperCase() }}</span>
              </div>
              <div class="agent-item__desc">预计 {{ r.etaMin }} 分钟</div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'wrongbook' && wqAnalysisLoading" class="agent-loading">
          <div class="agent-loading__spinner" />
          <span>Agent 分析中...</span>
        </div>

        <div v-else-if="activeTab === 'wrongbook'" class="agent-placeholder">
          <Icon icon="lucide:crosshair" class="agent-placeholder__icon" />
          <span>选择错题以启动Agent诊断</span>
        </div>

        <div v-else-if="activeTab === 'notes'" class="agent-placeholder">
          <Icon icon="lucide:file-text" class="agent-placeholder__icon" />
          <span>笔记档案管理模式</span>
          <span class="agent-placeholder__sub">点击笔记进行编辑，或新建笔记</span>
        </div>

        <div v-else class="agent-placeholder">
          <Icon icon="lucide:star" class="agent-placeholder__icon" />
          <span>收藏索引模式</span>
          <span class="agent-placeholder__sub">管理你的课程和笔记收藏</span>
        </div>

        <!-- Agent日志终端 -->
        <div class="agent-terminal">
          <div class="agent-terminal__head">
            <span>AGENT_LOG</span>
            <span class="agent-terminal__count">{{ agentLogs.length }}</span>
          </div>
          <div class="agent-terminal__body">
            <div v-for="(log, i) in agentLogs" :key="i" class="log-line"
              :class="{ 'log-sys': log.includes('[SYS]'), 'log-agent': log.includes('[AGENT'), 'log-warn': log.includes('CRITICAL') }">
              {{ log }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 笔记编辑器弹窗 -->
    <el-dialog v-model="showEditor" :title="editingNote ? '编辑笔记' : '新建笔记'"
      width="900px" destroy-on-close class="note-editor-dialog" @closed="onEditorClosed">
      <div class="editor-wrapper">
        <el-select v-model="noteCourseId" placeholder="选择课程（可选）" clearable class="course-select">
          <el-option v-for="c in courseStore.courses" :key="c.id" :label="c.title" :value="c.id" />
        </el-select>
        <el-input v-model="noteTitle" placeholder="笔记标题" class="title-input" />
        <div class="editor-container">
          <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="default" class="editor-toolbar" />
          <Editor v-model="noteContent" :default-config="editorConfig" mode="default" class="editor-content" @on-created="handleCreated" />
        </div>
        <div class="tags-selector">
          <span class="tags-label">标签：</span>
          <el-checkbox-group v-model="noteTags">
            <el-checkbox v-for="tag in availableTags" :key="tag" :label="tag">{{ tag }}</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="showEditor = false">取消</el-button>
        <el-button type="primary" @click="saveNote">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.skill-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-100);
  font-family: var(--cyber-font-mono, inherit);
}

/* ─── Header ─── */
.skill-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--card-border);
}
.skill-header__left { flex: 1; min-width: 0; }
.skill-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-100);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.skill-header__icon { font-size: 18px; color: var(--primary-100); }
.skill-header__version {
  font-size: 10px;
  color: var(--text-200);
  font-weight: 700;
  padding: 1px 6px;
  border: 1px solid var(--card-border);
  border-radius: 2px;
}
.skill-header__subtitle {
  font-size: 12px;
  color: var(--text-200);
  margin-top: 2px;
}
.skill-header__stats {
  display: flex;
  gap: 16px;
}
.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  border: 1px solid var(--card-border);
  border-radius: 2px;
  background: var(--card-data-bg);
}
.stat-cell__value {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-100);
  line-height: 1.2;
}
.stat-cell__label {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.stat-cell--alert .stat-cell__value { color: var(--accent-100, #ff2d6a); }
.stat-cell--alert { border-color: color-mix(in srgb, var(--accent-100, #ff2d6a) 30%, var(--card-border) 70%); }

.skill-header__actions { flex-shrink: 0; }

.cyber-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-200) 90%);
  border: 1px solid color-mix(in srgb, var(--primary-100) 30%, var(--card-border) 70%);
  border-radius: 2px;
  color: var(--primary-100);
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}
.cyber-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary-100) 18%, var(--bg-200) 82%);
  border-color: color-mix(in srgb, var(--primary-100) 50%, var(--card-border) 50%);
  box-shadow: 0 0 12px color-mix(in srgb, var(--primary-100) 20%, transparent 80%);
}
.cyber-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cyber-btn--sm { padding: 4px 10px; font-size: 10px; }

/* ─── Body layout ─── */
.skill-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 380px;
}

/* ─── Left list ─── */
.skill-list {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--card-border);
  min-width: 0;
}
.skill-list__toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--card-bg);
}
.skill-search { width: 100%; }
.skill-tabs {
  display: flex;
  gap: 0;
  border: 1px solid var(--card-border);
  border-radius: 2px;
  overflow: hidden;
}
.skill-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--card-border);
  color: var(--text-200);
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}
.skill-tab:last-child { border-right: none; }
.skill-tab:hover { background: color-mix(in srgb, var(--primary-100) 5%, transparent 95%); color: var(--text-100); }
.skill-tab.active {
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-200) 90%);
  color: var(--primary-100);
  box-shadow: inset 0 -2px 0 var(--primary-100);
}
.skill-tab__count {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--primary-100) 8%, transparent 92%);
}

.skill-list__content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.skill-list__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px 8px;
}

/* ─── Data rows ─── */
.data-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.data-section-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 8px 12px 4px;
}
.data-row {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 2px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  position: relative;
}
.data-row:hover {
  border-color: var(--card-hover-border);
  background: color-mix(in srgb, var(--primary-100) 3%, var(--card-bg) 97%);
}
.data-row--active {
  border-color: color-mix(in srgb, var(--primary-100) 40%, var(--card-border) 60%);
  background: color-mix(in srgb, var(--primary-100) 6%, var(--card-bg) 94%);
}
.data-row__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.data-row__title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fav-indicator {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent-100, #ff2d6a);
  flex-shrink: 0;
}
.data-row__meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-200);
}
.data-row__preview {
  font-size: 12px;
  color: var(--text-200);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-row__tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.mini-tag {
  font-size: 10px;
  padding: 1px 6px;
  border: 1px solid var(--card-border);
  border-radius: 1px;
  color: var(--text-200);
  background: var(--card-data-bg);
}
.mini-tag--more { color: var(--primary-100); }
.data-row__bar { padding-top: 2px; }
.data-row__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.data-row:hover .data-row__actions { opacity: 1; }

.data-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 20px;
  color: var(--text-200);
  font-size: 13px;
}
.data-empty__icon { font-size: 32px; opacity: 0.3; }

/* ─── Right Agent panel ─── */
.skill-agent {
  display: flex;
  flex-direction: column;
  background: var(--card-data-bg);
  min-width: 0;
}
.skill-agent__header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
}
.skill-agent__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  color: var(--text-100);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.skill-agent__icon { font-size: 16px; color: var(--primary-100); }
.skill-agent__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--text-200);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.agent-result {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
}
.agent-section { margin-bottom: 12px; }
.agent-section__head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 800;
  color: var(--primary-100);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 10px;
}
.agent-section__head :deep(svg) { font-size: 14px; }
.agent-item {
  padding: 8px 10px;
  border: 1px solid var(--card-border);
  border-radius: 2px;
  margin-bottom: 6px;
  background: var(--card-bg);
}
.agent-item__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.agent-item__title {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-100);
}
.agent-item__score {
  font-size: 11px;
  font-weight: 900;
  color: var(--primary-100);
}
.agent-item__desc {
  font-size: 11px;
  color: var(--text-200);
  margin-top: 4px;
  line-height: 1.5;
}

.agent-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-200);
  font-size: 12px;
}
.agent-loading__spinner {
  width: 24px; height: 24px;
  border: 2px solid var(--card-border);
  border-top-color: var(--primary-100);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.agent-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-200);
  font-size: 12px;
  letter-spacing: 0.04em;
}
.agent-placeholder__icon { font-size: 28px; opacity: 0.3; }
.agent-placeholder__sub { font-size: 11px; opacity: 0.6; }

/* ─── Agent terminal ─── */
.agent-terminal {
  border-top: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  min-height: 160px;
  max-height: 220px;
}
.agent-terminal__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--card-border);
  background: var(--card-bg);
}
.agent-terminal__count {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--primary-100) 8%, transparent 92%);
  color: var(--primary-100);
}
.agent-terminal__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  font-size: 10px;
  line-height: 1.7;
  color: var(--text-200);
}
.log-line { white-space: pre-wrap; word-break: break-all; }
.log-sys { color: var(--primary-100); }
.log-agent { color: #a78bfa; }
.log-warn { color: #ff2d6a; }

/* ─── Editor dialog ─── */
.editor-wrapper { display: flex; flex-direction: column; gap: 16px; }
.course-select { width: 260px; }
.title-input :deep(.el-input__inner) { font-size: 18px; font-weight: 600; }
.editor-container { border: 1px solid var(--card-border); border-radius: 2px; overflow: hidden; }
.editor-toolbar { border-bottom: 1px solid var(--card-border); }
.editor-content { height: 360px; overflow-y: auto; }
.tags-selector { display: flex; align-items: center; gap: 12px; }
.tags-label { font-size: 14px; color: var(--text-200); white-space: nowrap; }

/* ─── Responsive ─── */
@media (max-width: 1024px) {
  .skill-body { grid-template-columns: 1fr; }
  .skill-agent { display: none; }
}
@media (max-width: 768px) {
  .skill-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .skill-header__stats { flex-wrap: wrap; }
}
</style>

<style>
.note-editor-dialog .el-dialog__body {
  padding-top: 10px;
}
</style>
