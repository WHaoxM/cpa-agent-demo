<!-- 页面：错题本；路由：student/wrong-questions（student-wrong-questions）；角色：STUDENT/TEACHER -->

<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import {
  Delete,
  Document,
  Refresh,
  Search,
  Setting,
} from '@element-plus/icons-vue'
import { useUserStore, useLearningStore, useCourseStore } from '@/stores'
import { mockQuestions } from '@/mock/data'
import type { WrongQuestion } from '@/types'
import IntegrationHint from '@/components/IntegrationHint.vue'

type DifficultyKey = 'easy' | 'medium' | 'hard'
type MasteryStatusKey = 'todo' | 'weak' | 'ok' | 'mastered' | 'archived'

type AgentNoteRef = {
  noteId: string
  noteTitle: string
  snippet: string
  confidence: number
  path?: string
}

type AgentKnowledgeLocation = {
  courseId: string
  courseTitle: string
  chapterTitle: string
  videoTimeSec: number
  videoLabel: string
  videoPath?: string
}

type AgentDiagnosis = {
  cause: string
  evidence: string
  confidence: number
}

type AgentRemedy = {
  action: string
  etaMin: number
  priority: 'high' | 'medium' | 'low'
}

type AgentAnalysisResult = {
  knowledge: AgentKnowledgeLocation
  noteRefs: AgentNoteRef[]
  diagnosis: AgentDiagnosis[]
  remedy: AgentRemedy[]
  similar: { id: string; stemPreview: string; reason: string; similarity: number }[]
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  meta?: { stage?: string; hintLevel?: number }
}

const router = useRouter()
const userStore = useUserStore()
const learningStore = useLearningStore()
const courseStore = useCourseStore()

const wrongQuestions = computed(() =>
  learningStore.getUserWrongQuestions(userStore.currentUser?.id || ''),
)

const selectedId = ref<string>('')
const activeRightTab = ref<'locate' | 'analysis' | 'chat' | 'path'>('locate')

const keyword = ref('')
const courseFilter = ref<string>('')
const chapterFilter = ref<string>('')
const difficultyFilter = ref<DifficultyKey | ''>('')
const statusFilter = ref<MasteryStatusKey | ''>('')

const analysisLoading = ref(false)
const analysisByWrongId = ref<Record<string, AgentAnalysisResult | undefined>>({})

const chatThreadId = ref('thread_mock_001')
const chatInput = ref('')
const chatMessages = ref<ChatMessage[]>([])

const difficultyLabelMap: Record<DifficultyKey, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const statusLabelMap: Record<MasteryStatusKey, string> = {
  todo: '待分析',
  weak: '需复习',
  ok: '进行中',
  mastered: '已掌握',
  archived: '已归档',
}

const courseOptions = computed(() => {
  return [...courseStore.courses].map(c => ({ id: c.id, title: c.title }))
})

const chapterOptions = computed(() => {
  if (!courseFilter.value) return []
  const course = courseStore.getCourseById(courseFilter.value)
  const chapters = course?.chapters || []
  return chapters.map(ch => ({ id: ch.id, title: ch.title }))
})

const filteredQuestions = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return [...wrongQuestions.value]
    .sort((a, b) => {
      const ta = a.lastWrongAt || ''
      const tb = b.lastWrongAt || ''
      if (tb !== ta) return tb.localeCompare(ta)
      return b.times - a.times
    })
    .filter(wq => {
      if (courseFilter.value) {
        const cid = String((wq.question as any)?.courseId || '')
        if (cid !== courseFilter.value) return false
      }

      if (chapterFilter.value) {
        const chid = String((wq.question as any)?.chapterId || '')
        if (chid !== chapterFilter.value) return false
      }

      const d = String((wq.question as any)?.difficulty || '') as DifficultyKey | ''
      if (difficultyFilter.value && d && d !== difficultyFilter.value) return false

      if (statusFilter.value) {
        const status = getMockStatus(wq)
        if (status !== statusFilter.value) return false
      }

      if (!kw) return true
      const content = String(wq.question?.content || '').toLowerCase()
      const kp = String((wq.question as any)?.knowledgePoint || '').toLowerCase()
      return content.includes(kw) || kp.includes(kw)
    })
})

const selectedQuestion = computed(() => {
  return filteredQuestions.value.find(q => q.id === selectedId.value) || null
})

const selectedAnalysis = computed(() => {
  const id = selectedQuestion.value?.id
  if (!id) return null
  return analysisByWrongId.value[id] || null
})

function formatDate(dateStr: string): string {
  const part = dateStr.split(' ')[0]
  return part || dateStr
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0))
  const m = Math.floor(s / 60)
  return `${pad2(m)}:${pad2(s % 60)}`
}

function getDifficultyKey(wq: WrongQuestion): DifficultyKey {
  const d = String((wq.question as any)?.difficulty || 'medium')
  if (d === 'easy' || d === 'hard') return d
  return 'medium'
}

function getMockStatus(wq: WrongQuestion): MasteryStatusKey {
  const t = wq.times || 0
  if (t >= 4) return 'weak'
  if (t === 3) return 'todo'
  if (t === 2) return 'ok'
  return 'todo'
}

function statusTagType(status: MasteryStatusKey) {
  if (status === 'weak') return 'danger'
  if (status === 'todo') return 'warning'
  if (status === 'ok') return 'info'
  if (status === 'mastered') return 'success'
  return ''
}

function diffTagType(diff: DifficultyKey) {
  if (diff === 'easy') return 'success'
  if (diff === 'hard') return 'danger'
  return 'warning'
}

async function selectRow(row: WrongQuestion) {
  selectedId.value = row.id
  if (!analysisByWrongId.value[row.id]) {
    await runMockAnalysis(row)
  }
}

async function runMockAnalysis(wq: WrongQuestion) {
  analysisLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 420))
    analysisByWrongId.value[wq.id] = buildMockAnalysis(wq)
  } finally {
    analysisLoading.value = false
  }
}

function buildMockAnalysis(wq: WrongQuestion): AgentAnalysisResult {
  const kp = String((wq.question as any)?.knowledgePoint || '知识点')
  const difficulty = getDifficultyKey(wq)

  const courseId = difficulty === 'hard' ? 'course_003' : difficulty === 'easy' ? 'course_001' : 'course_002'
  const course = courseStore.getCourseById(courseId)

  const base = {
    knowledge: {
      courseId,
      courseTitle: course?.title || (difficulty === 'hard' ? '高等数学·进阶' : difficulty === 'easy' ? 'Vue3 入门' : 'JavaScript 高级'),
      chapterTitle: difficulty === 'hard' ? '第 2 章 极限与连续' : difficulty === 'easy' ? '第 3 章 组件基础' : '第 4 章 异步与并发',
      videoTimeSec: difficulty === 'hard' ? 1325 : difficulty === 'easy' ? 845 : 1560,
      videoLabel: `${kp} - 关键讲解片段`,
      videoPath: `/app/student/course/${courseId}`,
    },
  } satisfies Pick<AgentAnalysisResult, 'knowledge'>

  return {
    ...base,
    noteRefs: [
      {
        noteId: 'note_001',
        noteTitle: '复习笔记：易错点整理',
        snippet: `你在笔记中记录过「${kp}」的一个常见陷阱：先确认定义域/边界条件，再代入。`,
        confidence: 0.82,
        path: '/app/student/notes',
      },
      {
        noteId: 'note_002',
        noteTitle: '课堂速记',
        snippet: `老师强调：遇到「${kp}」要先写出步骤框架，再填数字，避免直接跳步。`,
        confidence: 0.64,
        path: '/app/student/notes',
      },
    ],
    diagnosis: [
      {
        cause: '概念边界不清（定义/适用条件）',
        evidence: `该题在「${kp}」上容易把“条件”当成“结论”。`,
        confidence: 0.74,
      },
      {
        cause: '步骤跳跃导致中间推导缺失',
        evidence: `你的错误答案更像是把中间两步合并后直接得到的结果。`,
        confidence: 0.61,
      },
    ],
    remedy: [
      { action: '回看对应视频片段并手写 3 次标准推导', etaMin: 18, priority: 'high' },
      { action: '做 5 道同类题（从易到难）并标注错因', etaMin: 25, priority: 'high' },
      { action: '把本题的“关键条件”写成 1 句话贴到笔记顶部', etaMin: 6, priority: 'medium' },
    ],
    similar: [
      { id: 'sim_01', stemPreview: `同类题：围绕「${kp}」的等价变形判断`, reason: '考察同一概念边界', similarity: 0.86 },
      { id: 'sim_02', stemPreview: `同类题：${kp} 的典型陷阱（条件缺失）`, reason: '错误模式相同', similarity: 0.81 },
      { id: 'sim_03', stemPreview: `同类题：${kp} 的综合应用`, reason: '覆盖扩展场景', similarity: 0.73 },
    ],
  }
}

function removeWrongQuestion(question: WrongQuestion) {
  learningStore.removeWrongQuestion(userStore.currentUser?.id || '', question.questionId)
  if (selectedId.value === question.id) {
    selectedId.value = ''
  }
  ElMessage.success('已从错题本移除')
}

function goToCourse(analysis: AgentAnalysisResult) {
  const cid = analysis.knowledge.courseId
  router.push(`/app/student/course/${cid}`)
}

function goToNotes(refItem: AgentNoteRef) {
  router.push(refItem.path || '/app/student/notes')
}

function pushChat(role: ChatMessage['role'], content: string, meta?: ChatMessage['meta']) {
  chatMessages.value.push({
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    meta,
  })
}

async function sendChat() {
  const text = chatInput.value.trim()
  if (!text) return
  chatInput.value = ''
  pushChat('user', text)
  await new Promise(resolve => setTimeout(resolve, 320))

  const kp = String((selectedQuestion.value?.question as any)?.knowledgePoint || '该知识点')
  pushChat(
    'assistant',
    `我先帮你把「${kp}」的边界条件说清楚：

1) 先写出标准步骤框架（不要跳步）
2) 再核对题目给定条件（是否缺省/是否隐含）
3) 最后代入求解并做一次反向验证

如果你愿意，我可以按“渐进式提示”方式只给下一步提示。`,
    { stage: 'scaffold', hintLevel: 1 },
  )
}

function resetFilters() {
  keyword.value = ''
  courseFilter.value = ''
  chapterFilter.value = ''
  difficultyFilter.value = ''
  statusFilter.value = ''
}

function seedDemoWrongQuestions() {
  const uid = String(userStore.currentUser?.id || '')
  if (!uid) return

  const candidates = mockQuestions.slice(0, 6)
  candidates.forEach((q, idx) => {
    const wrong = Array.isArray(q.correctAnswer)
      ? q.options?.filter(o => !q.correctAnswer.includes(o)).slice(0, 1) || []
      : (q.options?.find(o => o !== q.correctAnswer) || String(q.correctAnswer))

    learningStore.addWrongQuestion(uid, q, wrong)

    if (idx % 2 === 0) {
      learningStore.addWrongQuestion(uid, q, wrong)
    }
  })

  ElMessage.success('已填充示例错题')
}

watch(
  () => courseFilter.value,
  () => {
    chapterFilter.value = ''
  },
)

watch(
  () => filteredQuestions.value.map(q => q.id).join(','),
  ids => {
    const current = selectedId.value
    if (current && filteredQuestions.value.some(q => q.id === current)) return
    const first = filteredQuestions.value[0]
    selectedId.value = first?.id || ''
    if (first && !analysisByWrongId.value[first.id]) {
      void runMockAnalysis(first)
    }
    if (!ids) {
      selectedId.value = ''
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (chatMessages.value.length === 0) {
    pushChat('assistant', '选择左侧任意一道错题，我会在右侧给出知识点定位，并可进入“智能教学对话”。')
  }
})
</script>





<template>
  <div class="wrongbook page page--compact">
    <div v-if="filteredQuestions.length > 0" class="wb-topbar" aria-label="错题本工具条">
      <div class="wb-toolbar">
        <div class="toolbar__left">
          <el-input v-model="keyword" placeholder="搜索题干/知识点" clearable :prefix-icon="Search" class="toolbar__search" />
        </div>
        <div class="toolbar__filters">
          <el-select v-model="courseFilter" placeholder="课程" clearable filterable>
            <el-option v-for="c in courseOptions" :key="c.id" :label="c.title" :value="c.id" />
          </el-select>
          <el-select v-model="chapterFilter" placeholder="章节" clearable filterable :disabled="!courseFilter">
            <el-option v-for="ch in chapterOptions" :key="ch.id" :label="ch.title" :value="ch.id" />
          </el-select>
          <el-select v-model="difficultyFilter" placeholder="难度" clearable>
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
          <el-select v-model="statusFilter" placeholder="状态" clearable>
            <el-option label="待分析" value="todo" />
            <el-option label="需复习" value="weak" />
            <el-option label="进行中" value="ok" />
            <el-option label="已掌握" value="mastered" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </div>
        <div class="toolbar__right">
          <el-button :icon="Refresh" :disabled="!selectedQuestion" @click="selectedQuestion && runMockAnalysis(selectedQuestion)">重新分析</el-button>
          <el-button :icon="Setting" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </div>

    <div v-if="filteredQuestions.length > 0" class="wb-workspace card-base" aria-label="错题本工作台">
      <div class="wb-body">
        <aside class="wb-list" aria-label="错题列表">
          <div class="wb-list__head">
            <div class="list-title">错题列表</div>
            <div class="list-sub">{{ filteredQuestions.length }} 条</div>
          </div>
          <div class="wb-list__table">
            <el-table
              :data="filteredQuestions"
              height="100%"
              stripe
              highlight-current-row
              :row-class-name="({ row }) => (row.id === selectedId ? 'row--active' : '')"
              @row-click="selectRow"
            >
              <el-table-column label="错题" width="86">
                <template #default="{ row }">
                  <el-tag type="danger" size="small" effect="plain">×{{ row.times }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="知识点" min-width="140">
                <template #default="{ row }">
                  <div class="cell-main">
                    <div class="cell-title">{{ (row.question as any)?.knowledgePoint || '未标注' }}</div>
                    <div class="cell-sub">{{ String(row.question?.content || '').slice(0, 26) }}{{ String(row.question?.content || '').length > 26 ? '…' : '' }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="难度" width="90">
                <template #default="{ row }">
                  <el-tag :type="diffTagType(getDifficultyKey(row))" size="small" effect="plain">{{ difficultyLabelMap[getDifficultyKey(row)] }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="92">
                <template #default="{ row }">
                  <el-tag :type="statusTagType(getMockStatus(row))" size="small" effect="plain">{{ statusLabelMap[getMockStatus(row)] }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="最近" width="112">
                <template #default="{ row }">
                  <span class="cell-date">{{ formatDate(row.lastWrongAt) }}</span>
                </template>
              </el-table-column>
              <el-table-column width="66" align="right">
                <template #default="{ row }">
                  <el-button text type="danger" :icon="Delete" @click.stop="removeWrongQuestion(row)" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </aside>

        <main class="wb-main" aria-label="错题内容区">
          <div class="wb-main__head">
            <div class="main-title">
              <Icon icon="lucide:bot" class="main-title__icon" />
              <span>学习工作台</span>
            </div>
            <div class="main-actions">
              <el-button type="primary" :disabled="!selectedAnalysis" @click="selectedAnalysis && goToCourse(selectedAnalysis)">去课程定位</el-button>
            </div>
          </div>

          <IntegrationHint />

          <el-tabs v-model="activeRightTab" class="main-tabs">
            <el-tab-pane label="知识点定位" name="locate">
              <div class="tab-pad">
                <el-skeleton v-if="analysisLoading" :rows="6" animated />
                <div v-else-if="!selectedAnalysis" class="tab-empty">
                  <el-empty description="选择一道错题后即可生成定位信息" />
                </div>
                <div v-else class="locate">
                  <section class="wb-section">
                    <div class="wb-section__head">
                      <div class="wb-section__title">课程与章节</div>
                      <el-button type="primary" text @click="goToCourse(selectedAnalysis)">打开课程</el-button>
                    </div>
                    <div class="wb-kv">
                      <div class="wb-kv__row">
                        <div class="wb-kv__k">课程</div>
                        <div class="wb-kv__v">{{ selectedAnalysis.knowledge.courseTitle }}</div>
                      </div>
                      <div class="wb-kv__row">
                        <div class="wb-kv__k">章节</div>
                        <div class="wb-kv__v">{{ selectedAnalysis.knowledge.chapterTitle }}</div>
                      </div>
                    </div>
                  </section>

                  <el-divider />

                  <section class="wb-section">
                    <div class="wb-section__head">
                      <div class="wb-section__title">视频时间点</div>
                      <el-tag type="warning" size="small" effect="plain">mock</el-tag>
                    </div>
                    <div class="video-anchor">
                      <div class="video-time">{{ formatTime(selectedAnalysis.knowledge.videoTimeSec) }}</div>
                      <div class="video-desc">
                        <div class="video-label">{{ selectedAnalysis.knowledge.videoLabel }}</div>
                        <div class="video-hint">后续接入播放器后，可一键跳转到对应时间节点</div>
                      </div>
                    </div>
                  </section>

                  <el-divider />

                  <section class="wb-section">
                    <div class="wb-section__head">
                      <div class="wb-section__title">笔记命中</div>
                      <div class="wb-section__meta">{{ selectedAnalysis.noteRefs.length }} 条</div>
                    </div>
                    <div class="note-list">
                      <button
                        v-for="n in selectedAnalysis.noteRefs"
                        :key="n.noteId"
                        type="button"
                        class="note-row"
                        @click="goToNotes(n)"
                      >
                        <div class="note-row__main">
                          <div class="note-title">{{ n.noteTitle }}</div>
                          <div class="note-snippet">{{ n.snippet }}</div>
                        </div>
                        <div class="note-score">{{ Math.round(n.confidence * 100) }}%</div>
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="错因诊断" name="analysis">
              <div class="tab-pad">
                <el-skeleton v-if="analysisLoading" :rows="7" animated />
                <div v-else-if="!selectedAnalysis" class="tab-empty">
                  <el-empty description="先选择一道错题" />
                </div>
                <div v-else class="analysis">
                  <section class="wb-section">
                    <div class="wb-section__head">
                      <div class="wb-section__title">根因诊断</div>
                    </div>
                    <div class="flat-list">
                      <div v-for="(d, idx) in selectedAnalysis.diagnosis" :key="idx" class="flat-row">
                        <div class="flat-row__main">
                          <div class="flat-row__title">{{ d.cause }}</div>
                          <div class="flat-row__desc">{{ d.evidence }}</div>
                        </div>
                        <div class="flat-row__meta">{{ Math.round(d.confidence * 100) }}%</div>
                      </div>
                    </div>
                  </section>

                  <el-divider />

                  <section class="wb-section">
                    <div class="wb-section__head">
                      <div class="wb-section__title">补救方案</div>
                    </div>
                    <div class="flat-list">
                      <div v-for="(r, idx) in selectedAnalysis.remedy" :key="idx" class="flat-row">
                        <div class="flat-row__main">
                          <div class="flat-row__title">{{ r.action }}</div>
                          <div class="flat-row__desc">预计 {{ r.etaMin }} 分钟 · 优先级 {{ r.priority }}</div>
                        </div>
                        <el-button type="primary" text>加入计划</el-button>
                      </div>
                    </div>
                  </section>

                  <el-divider />

                  <section class="wb-section">
                    <div class="wb-section__head">
                      <div class="wb-section__title">同类题推荐</div>
                    </div>
                    <div class="flat-list">
                      <div v-for="s in selectedAnalysis.similar" :key="s.id" class="flat-row">
                        <div class="flat-row__main">
                          <div class="flat-row__title">{{ s.stemPreview }}</div>
                          <div class="flat-row__desc">{{ s.reason }}</div>
                        </div>
                        <div class="flat-row__meta">{{ Math.round(s.similarity * 100) }}%</div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="教学对话" name="chat">
              <div class="tab-pad tab-pad--chat">
                <div class="chat-head">
                  <div class="chat-meta">
                    <el-tag type="info" size="small" effect="plain">LangGraph thread</el-tag>
                    <span class="chat-thread">{{ chatThreadId }}</span>
                  </div>
                  <IntegrationHint align="right" />
                </div>

                <div class="chat-body">
                  <div v-for="m in chatMessages" :key="m.id" class="msg" :class="m.role">
                    <div class="msg__bubble">
                      <div class="msg__content">{{ m.content }}</div>
                      <div v-if="m.meta?.stage" class="msg__meta">{{ m.meta.stage }} · hint {{ m.meta.hintLevel ?? '-' }}</div>
                    </div>
                  </div>
                </div>

                <div class="chat-input">
                  <el-input
                    v-model="chatInput"
                    type="textarea"
                    :rows="2"
                    placeholder="输入你的问题：例如‘为什么我的思路错了？给我下一步提示就好’"
                  />
                  <div class="chat-actions">
                    <el-button @click="chatInput = '给我一个提示（不要直接给答案）'">给我提示</el-button>
                    <el-button type="primary" :disabled="!chatInput.trim()" @click="sendChat">发送</el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="学习路径" name="path">
              <div class="tab-pad">
                <div class="tab-empty">
                  <el-empty description="后续接入：个性化学习路径 / 智能期末复习计划" />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </main>
      </div>
    </div>

    <el-empty v-else description="暂无错题，继续保持！">
      <template #image>
        <el-icon :size="60" color="#67C23A"><Document /></el-icon>
      </template>
      <el-button type="primary" style="margin-top: 12px" @click="seedDemoWrongQuestions">填充示例错题</el-button>
    </el-empty>
  </div>
</template>

<style scoped>
.wrongbook {
  max-width: none;
  margin: 0;
  padding: 0;
}

.wb-topbar {
  margin-bottom: 12px;
}

.wb-toolbar {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 0;
  padding: 12px;
  display: grid;
  grid-template-columns: 320px 1fr auto;
  gap: 12px;
  align-items: center;
}

.toolbar__left {
  min-width: 0;
}

.toolbar__search {
  width: 100%;
}

.toolbar__filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.toolbar__filters :deep(.el-select) {
  width: 100%;
}

.toolbar__right {
  display: inline-flex;
  gap: 10px;
}

.wb-workspace {
  overflow: hidden;
  min-height: 740px;
}

.wb-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 420px 1fr;
}

.wb-list {
  min-width: 0;
  border-right: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
}

.wb-list__head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.list-title {
  font-size: 13px;
  font-weight: 950;
  color: var(--text-100);
}

.list-sub {
  font-size: 12px;
  color: var(--text-200);
  font-weight: 800;
}

.wb-list__table {
  flex: 1;
  min-height: 0;
}

.wb-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.wb-main__head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.main-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 950;
  color: var(--text-100);
}

.main-title__icon {
  font-size: 18px;
}

.main-tabs {
  flex: 1;
  min-height: 0;
}

.main-tabs :deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow: auto;
}

.tab-pad {
  padding: 14px;
}

.wb-section {
  padding: 0;
}

.wb-section__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}

.wb-section__title {
  font-size: 13px;
  font-weight: 950;
  color: var(--text-100);
}

.wb-section__meta {
  font-size: 12px;
  color: var(--text-200);
  font-weight: 800;
}

.wb-kv {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wb-kv__row {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  align-items: baseline;
}

.wb-kv__k {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-200);
}

.wb-kv__v {
  font-size: 13px;
  font-weight: 900;
  color: var(--text-100);
}

.panel-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 900;
  color: var(--text-100);
}

.panel-title__icon {
  font-size: 18px;
}

.panel-actions {
  display: inline-flex;
  gap: 10px;
}

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cell-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-sub {
  font-size: 12px;
  color: var(--text-200);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-date {
  font-size: 12px;
  color: var(--text-200);
}

.wb-list__table :deep(.el-table) {
  height: 100%;
}

.wb-list__table :deep(.el-table__inner-wrapper) {
  height: 100%;
}

.wb-list__table :deep(.el-table__body-wrapper) {
  height: calc(100% - 40px);
  overflow: auto;
}

.wb-list__table :deep(.el-table__row) {
  cursor: pointer;
}

.wb-list__table :deep(.el-table__row:hover) {
  background: var(--card-subtle);
}

.center-body {
  overflow: auto;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.meta-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-200);
}

.detail__block {
  padding: 12px 12px;
  border-radius: 0;
  border: 1px solid var(--card-border);
  background: var(--card-data-bg);
}

.block-title {
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-200);
}

.block-content {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-100);
}

.block-content--muted {
  color: var(--text-200);
}

.block-content--answer {
  font-weight: 900;
}

.tab-pad--chat {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.locate {
  display: flex;
  flex-direction: column;
}

.video-anchor {
  display: flex;
  gap: 12px;
  align-items: center;
}

.video-time {
  width: 72px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 0;
  font-weight: 1000;
  background: var(--card-data-bg);
  border: 1px solid var(--card-border);
  color: var(--text-100);
}

.video-label {
  font-size: 13px;
  font-weight: 900;
  color: var(--text-100);
}

.video-hint {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-200);
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #eef2f7;
  border-radius: 0;
  overflow: hidden;
}

.note-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: #ffffff;
  cursor: pointer;
  border-top: 1px solid #eef2f7;
}

.note-row:first-child {
  border-top: none;
}

.note-row:hover {
  background: #f9fafb;
}

.note-row__main {
  flex: 1;
  min-width: 0;
}

.note-title {
  font-size: 13px;
  font-weight: 900;
  color: var(--text-100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-score {
  font-size: 12px;
  color: var(--text-200);
  font-weight: 900;
  flex-shrink: 0;
}

.note-snippet {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-200);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.flat-list {
  border: 1px solid #eef2f7;
  border-radius: 0;
  overflow: hidden;
}

.flat-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid #eef2f7;
  background: #ffffff;
}

.flat-row:first-child {
  border-top: none;
}

.flat-row__main {
  flex: 1;
  min-width: 0;
}

.flat-row__title {
  font-size: 13px;
  font-weight: 950;
  color: var(--text-100);
}

.flat-row__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-200);
  line-height: 1.6;
}

.flat-row__meta {
  font-size: 12px;
  font-weight: 900;
  color: var(--text-200);
  flex-shrink: 0;
}

.chat-head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--bg-300);
}

.chat-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-thread {
  font-size: 12px;
  color: var(--text-200);
  font-weight: 800;
}

.chat-body {
  padding: 14px;
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msg {
  display: flex;
}

.msg.assistant {
  justify-content: flex-start;
}

.msg.user {
  justify-content: flex-end;
}

.msg__bubble {
  max-width: 86%;
  border-radius: 0;
  padding: 10px 12px;
  border: 1px solid var(--bg-300);
  background: #ffffff;
}

.msg.user .msg__bubble {
  background: color-mix(in srgb, var(--primary-100) 10%, #ffffff 90%);
}

.msg__content {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-100);
}

.msg__meta {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-200);
  font-weight: 700;
}

.chat-input {
  padding: 12px 14px;
  border-top: 1px solid var(--bg-300);
}

.chat-actions {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

@media (max-width: 1280px) {
  .wb-toolbar {
    grid-template-columns: 280px 1fr auto;
  }

  .wb-body {
    grid-template-columns: 380px 1fr;
  }
}

@media (max-width: 1100px) {
  .wb-toolbar {
    grid-template-columns: 1fr;
  }

  .toolbar__filters {
    grid-template-columns: 1fr 1fr;
  }

  .wb-body {
    grid-template-columns: 1fr;
  }

  .wb-list {
    border-right: none;
    border-bottom: 1px solid #eef2f7;
  }
}
</style>




