<!-- 页面：AI助手；路由：student/ai-assistant（student-ai-assistant）；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { Promotion } from '@element-plus/icons-vue'
import { useLearningStore } from '@/stores'
import { useResumeStore } from '@/stores/resume'
import { usePageEntrance } from '@/composables/usePageEntrance'
import { useRouter } from 'vue-router'
import type { AIMessage } from '@/types'
import { chatWithAgent } from '@/api/backend'

const { pageRef } = usePageEntrance()
const learningStore = useLearningStore()
const resumeStore = useResumeStore()
const router = useRouter()

const messages = computed(() => learningStore.aiMessages)
const inputMessage = ref('')
const messagesContainer = ref<HTMLDivElement>()
const loading = ref(false)
const isInitialState = computed(() => messages.value.length <= 1)

/* ── 流式输出状态 ── */
const streamingMsgId = ref<string | null>(null)
const streamingContent = ref('')
const thinkingSteps = ref<string[]>([])
const currentThinkingStep = ref(0)
const isThinking = ref(false)
const thinkingStartTime = ref(0)
const thinkingElapsed = ref(0)
const expandedThinkingIds = ref<Set<string>>(new Set())
let streamTimer: ReturnType<typeof setInterval> | null = null
let thinkTimer: ReturnType<typeof setInterval> | null = null
let elapsedTimer: ReturnType<typeof setInterval> | null = null

onBeforeUnmount(() => {
  clearAllTimers()
})

function clearAllTimers() {
  if (streamTimer) { clearInterval(streamTimer); streamTimer = null }
  if (thinkTimer) { clearInterval(thinkTimer); thinkTimer = null }
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null }
}

type QuickPrompt = {
  label: string
  text: string
  route?: string
  reply: string
  thinkingSteps: string[]
}

const quickPrompts: QuickPrompt[] = [
  {
    label: '方向',
    text: '帮我分析适合的职业方向',
    route: 'student-career-analysis',
    reply: '职业方向分析可以帮你理清市场趋势和个人匹配度。\n\n建议按这个步骤来：\n1. 先去「职业分析」页面查看各方向的市场数据和趋势\n2. 对比 2~3 个你感兴趣的方向\n3. 回来告诉我你的倾向，我帮你做更细致的对比\n\n你也可以直接告诉我你目前的专业背景，我先帮你缩小范围。',
    thinkingSteps: ['理解用户的职业分析需求...', '检索系统可用的职业方向数据...', '整理引导方案...'],
  },
  {
    label: '画像',
    text: '查看我的能力画像',
    route: 'student-career-portrait',
    reply: '能力画像可以直观展示你当前的技能分布和强弱项。\n\n你可以在「个人能力画像」页面查看：\n- 各维度的技能雷达图\n- 与目标岗位的能力匹配度\n- 需要重点提升的能力项\n\n建议先做一次「技能自评」，这样画像数据会更准确。',
    thinkingSteps: ['加载用户能力数据...', '分析技能分布情况...', '生成引导建议...'],
  },
  {
    label: '计划',
    text: '制定本周学习计划',
    route: 'student-learning',
    reply: '制定学习计划之前，我需要了解一些信息：\n\n1. **你的目标方向**：前端、后端、测试、数据分析？\n2. **可用时间**：每天 / 每周能投入多少学习时间？\n3. **当前水平**：是否做过技能自评？\n\n如果你还不确定，可以先去「技能提升」页面浏览课程体系，找到感兴趣的方向再来一起规划。',
    thinkingSteps: ['分析用户学习情况...', '参考最优学习路径数据...', '构建计划建议框架...'],
  },
  {
    label: '自评',
    text: '做一次技能自评',
    route: 'exams',
    reply: '技能自评是了解自己当前水平的最快方式。\n\n在「技能自评」页面你可以：\n- 选择一个目标方向进行评估\n- 系统会根据你的回答分析薄弱环节\n- 评估结果会同步到你的能力画像\n\n建议每个月做一次自评，追踪进步情况。完成后回来找我，我帮你解读结果。',
    thinkingSteps: ['检索可用的自评方案...', '匹配用户当前阶段...', '整理引导信息...'],
  },
  {
    label: '导航',
    text: '各模块功能介绍',
    reply: '当然可以。这个系统可以按「职业探索 → 能力匹配 → 学习执行 → 成果沉淀」来使用：\n\n1. **职业分析**：先看方向趋势、岗位画像与地域信息\n2. **技能自评**：快速定位你当前能力短板\n3. **职途导航**：结合方向与简历情况做匹配建议\n4. **心仪岗位**：管理你关注的方向和岗位信息\n5. **技能提升 / 我的报告**：把行动计划落地并追踪结果\n\n你可以告诉我你现在最想解决哪一步，我帮你先从一个最小可执行动作开始。',
    thinkingSteps: ['梳理系统功能模块...', '组织各模块的定位说明...', '生成功能地图...'],
  },
  {
    label: '匹配',
    text: '我和目标岗位差距有多大？',
    route: 'student-career-portrait',
    reply: '要判断你和目标岗位的差距，需要两步信息：\n\n1. **你的技能基线**：通过「技能自评」或「能力画像」获取\n2. **目标岗位要求**：在「职业分析」中选择具体方向查看\n\n系统会自动对比两者并计算匹配度。如果你已经做过自评，可以直接去「能力画像」查看差距分析。\n\n如果还没做过自评，建议先花 10 分钟完成一次快速评估。',
    thinkingSteps: ['检索用户能力数据...', '对比目标岗位模型...', '计算差距维度...'],
  },
  {
    label: '建议',
    text: '现阶段我应该重点学什么？',
    reply: '根据你的学习记录，建议先巩固 Vue 3 的基础概念，特别是 Composition API 的使用。\n\n推荐学习路径：\n1. **第 1 周**：掌握 ref、reactive、computed、watch\n2. **第 2 周**：学习组件通信（props、emits、provide/inject）\n3. **第 3 周**：实践 composable 抽取和 Pinia 状态管理\n4. **第 4 周**：完成一个包含路由、状态、API 调用的小项目\n\n你想从哪一步开始？',
    thinkingSteps: ['读取学习进度记录...', '评估当前技能水平...', '匹配最优学习路径...'],
  },
  {
    label: '简历',
    text: '简历还需要补充什么？',
    reply: '要给出具体的简历建议，我需要先了解你的简历内容。\n\n你可以：\n1. 在「职途导航」页面上传简历，系统会自动解析技能点\n2. 解析完成后回来找我，我帮你对照目标岗位分析简历的强弱项\n\n一般来说，校招简历最需要关注的是：\n- **项目经历**：是否有完整的项目描述（背景、职责、成果）\n- **技术栈匹配**：是否覆盖目标岗位的核心要求\n- **量化成果**：是否有可衡量的数据支撑',
    thinkingSteps: ['检查用户简历状态...', '参考岗位 JD 要求...', '整理补充建议...'],
  },
  {
    label: '课程',
    text: '有哪些课程适合我？',
    route: 'student-learning',
    reply: '课程推荐取决于你当前的方向和水平：\n\n如果你是 **前端方向**：\n- 基础：HTML/CSS → JavaScript 核心 → Vue 3 入门\n- 进阶：TypeScript → 工程化 → 性能优化\n\n如果你是 **后端方向**：\n- 基础：数据结构 → Java/Python 基础 → 数据库\n- 进阶：框架实战 → 微服务 → 系统设计\n\n去「技能提升」页面可以看到完整的课程体系和学习路径。告诉我你的方向，我帮你筛选优先级最高的课程。',
    thinkingSteps: ['分析用户当前方向...', '检索课程体系数据...', '按优先级排序推荐...'],
  },
]

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: 'smooth',
      })
    }
  })
}

watch([streamingContent, currentThinkingStep], () => {
  scrollToBottom()
})

/* 将职业上下文注入到用户消息前缀 */
function buildContextPrefix(): string {
  if (!resumeStore.isParsed) return ''
  const role = resumeStore.insights?.predictedRole ?? ''
  const topSkills = resumeStore.parsedSkills.slice(0, 5).map(s => s.name).join('、')
  const targets = learningStore.targetRoles.map(r => r.role).join('、')
  const parts: string[] = []
  if (role) parts.push(`预测方向：${role}`)
  if (topSkills) parts.push(`已掌握技能：${topSkills}`)
  if (targets) parts.push(`关注方向：${targets}`)
  if (!parts.length) return ''
  return `[用户概况] ${parts.join('；')} | 询问：`
}

/* 模拟思考过程 */
function simulateThinking(steps: string[]): Promise<number> {
  return new Promise(resolve => {
    thinkingSteps.value = steps
    currentThinkingStep.value = 0
    isThinking.value = true
    thinkingStartTime.value = Date.now()
    thinkingElapsed.value = 0

    elapsedTimer = setInterval(() => {
      thinkingElapsed.value = Math.floor((Date.now() - thinkingStartTime.value) / 1000)
    }, 1000)

    let step = 0
    const advanceStep = () => {
      if (step < steps.length) {
        currentThinkingStep.value = step
        step++
        const delay = 600 + Math.random() * 800
        thinkTimer = setTimeout(advanceStep, delay) as unknown as ReturnType<typeof setInterval>
      } else {
        if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null }
        const duration = Math.round((Date.now() - thinkingStartTime.value) / 1000)
        isThinking.value = false
        resolve(duration)
      }
    }
    advanceStep()
  })
}

/* 模拟逐字输出 */
function simulateStreaming(msgId: string, fullContent: string): Promise<void> {
  return new Promise(resolve => {
    streamingMsgId.value = msgId
    streamingContent.value = ''
    let idx = 0
    const speed = 25 + Math.random() * 20

    streamTimer = setInterval(() => {
      if (idx < fullContent.length) {
        const chunkSize = Math.random() > 0.9 ? 3 : (Math.random() > 0.7 ? 2 : 1)
        streamingContent.value += fullContent.slice(idx, idx + chunkSize)
        idx += chunkSize
      } else {
        if (streamTimer) { clearInterval(streamTimer); streamTimer = null }
        streamingMsgId.value = null
        streamingContent.value = ''
        resolve()
      }
    }, speed)
  })
}

/* 渲染消息内容：支持简单 markdown */
function renderContent(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

/* 获取消息的显示内容（流式输出时显示部分内容） */
function getDisplayContent(msg: AIMessage): string {
  if (msg.id === streamingMsgId.value) {
    return renderContent(streamingContent.value)
  }
  return renderContent(msg.content)
}

function toggleThinking(msgId: string) {
  if (expandedThinkingIds.value.has(msgId)) {
    expandedThinkingIds.value.delete(msgId)
  } else {
    expandedThinkingIds.value.add(msgId)
  }
}

async function resolveBackendReply(
  message: string,
  fallback: { content: string; thinking: string[] },
): Promise<{ content: string; thinking: string[] }> {
  try {
    const response = await chatWithAgent(message)
    const reply = response.data?.reply
    if (!response.success || !reply) throw new Error(response.error || 'empty agent reply')
    return {
      content: reply,
      thinking: [
        '请求后端 /api/agent/chat',
        `Agent 引擎：${response.data?.engine ?? 'unknown'}`,
        `数据来源：${response.data?.source ?? 'runtime'}`,
      ],
    }
  } catch {
    return fallback
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || loading.value) return

  const userMsg = inputMessage.value.trim()
  inputMessage.value = ''

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16)
  learningStore.addAIMessage({
    role: 'user',
    content: userMsg,
    timestamp: now,
  })

  loading.value = true
  scrollToBottom()

  const contextMsg = buildContextPrefix() + userMsg
  const fallback = learningStore.getAIResponse(contextMsg)
  const { content, thinking } = await resolveBackendReply(contextMsg, fallback)

  // 1. 思考阶段
  const duration = await simulateThinking(thinking)

  // 2. 创建空消息并开始流式输出
  const aiMsg = learningStore.addAIMessage({
    role: 'assistant',
    content: content,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    thinking: thinking.join(' → '),
    thinkingDuration: duration,
    status: 'streaming',
  })

  await simulateStreaming(aiMsg.id, content)

  // 3. 标记完成
  const msgIdx = learningStore.aiMessages.findIndex(m => m.id === aiMsg.id)
  if (msgIdx !== -1) {
    const target = learningStore.aiMessages[msgIdx]
    if (target) target.status = 'done'
  }

  loading.value = false
  scrollToBottom()
}

async function useQuickPrompt(prompt: QuickPrompt) {
  if (loading.value) return

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16)
  learningStore.addAIMessage({
    role: 'user',
    content: prompt.text,
    timestamp: now,
  })

  loading.value = true
  scrollToBottom()

  const { content, thinking } = await resolveBackendReply(prompt.text, {
    content: prompt.reply,
    thinking: prompt.thinkingSteps,
  })

  // 1. 思考
  const duration = await simulateThinking(thinking)

  // 2. 流式输出
  const aiMsg = learningStore.addAIMessage({
    role: 'assistant',
    content,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    thinking: thinking.join(' → '),
    thinkingDuration: duration,
    status: 'streaming',
  })

  await simulateStreaming(aiMsg.id, content)

  const promptIdx = learningStore.aiMessages.findIndex(m => m.id === aiMsg.id)
  if (promptIdx !== -1) {
    const target = learningStore.aiMessages[promptIdx]
    if (target) target.status = 'done'
  }

  loading.value = false
  scrollToBottom()
}

function clearChat() {
  clearAllTimers()
  loading.value = false
  streamingMsgId.value = null
  isThinking.value = false
  learningStore.clearAIMessages()
}
</script>


<template>
  <div ref="pageRef" class="ai-page page page--compact">
    <div class="ai-container">
      <!-- 消息区域 -->
      <div ref="messagesContainer" class="ai-messages" :class="{ 'ai-messages--empty': isInitialState }">
        <!-- 初始状态 -->
        <template v-if="isInitialState">
          <div class="welcome">
            <div class="welcome__badge">助手</div>
            <h2 class="welcome__title">从一个问题开始</h2>
            <p class="welcome__sub">职业方向 / 能力诊断 / 学习规划 / 技能评估</p>
            <div class="welcome__pills">
              <button
                v-for="p in quickPrompts"
                :key="p.text"
                class="prompt-pill"
                @click="useQuickPrompt(p)"
              >{{ p.text }}</button>
            </div>
          </div>
        </template>

        <!-- 对话状态 -->
        <template v-else>
          <div class="msg-list">
            <div class="msg-list__header">
              <button class="reset-btn" @click="clearChat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>重新开始</span>
              </button>
            </div>

            <template v-for="msg in messages" :key="msg.id">
              <!-- 用户消息 -->
              <div v-if="msg.role === 'user'" class="msg msg--user">
                <div class="msg__bubble msg__bubble--user">{{ msg.content }}</div>
              </div>

              <!-- 助手消息 -->
              <div v-else class="msg msg--assistant">
                <!-- 推理过程折叠 -->
                <div
                  v-if="msg.thinking"
                  class="reasoning"
                  :class="{ 'reasoning--open': expandedThinkingIds.has(msg.id) }"
                >
                  <button class="reasoning__toggle" @click="toggleThinking(msg.id)">
                    <svg class="reasoning__arrow" width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>推理过程{{ msg.thinkingDuration ? ` / ${msg.thinkingDuration}s` : '' }}</span>
                  </button>
                  <div v-if="expandedThinkingIds.has(msg.id)" class="reasoning__body">
                    {{ msg.thinking }}
                  </div>
                </div>

                <div class="msg__body" v-html="getDisplayContent(msg)" />
                <span v-if="msg.id === streamingMsgId" class="cursor" />
              </div>
            </template>

            <!-- 推理中 -->
            <div v-if="isThinking" class="msg msg--assistant">
              <div class="reasoning-live">
                <div class="reasoning-live__head">
                  <span class="reasoning-live__indicator" />
                  <span>正在推理</span>
                  <span class="reasoning-live__time">{{ thinkingElapsed }}s</span>
                </div>
                <div class="reasoning-live__steps">
                  <div
                    v-for="(step, i) in thinkingSteps"
                    :key="i"
                    class="reasoning-live__step"
                    :class="{ 'is-current': i === currentThinkingStep, 'is-past': i < currentThinkingStep }"
                  >{{ step }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入 -->
      <div class="ai-input">
        <div class="ai-input__wrap">
          <el-input
            v-model="inputMessage"
            :placeholder="loading ? '正在整理回复...' : '描述你的问题'"
            :disabled="loading"
            size="large"
            @keydown.enter.prevent="sendMessage"
          >
            <template #suffix>
              <button
                class="send-btn"
                :disabled="!inputMessage.trim() || loading"
                @click="sendMessage"
              >
                <el-icon :size="16"><Promotion /></el-icon>
              </button>
            </template>
          </el-input>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── 页面 ── */
.ai-page {
  height: calc(100vh - 80px);
  padding: 0 !important;
}

.ai-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
}

/* ── 消息区 ── */
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 32px 20px 16px;
}

.ai-messages--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── 欢迎 ── */
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.welcome__badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 4px;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.welcome__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.welcome__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-200);
  letter-spacing: 0.02em;
}

.welcome__pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 32px;
  max-width: 600px;
}

.prompt-pill {
  padding: 8px 18px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 180ms, color 180ms;
}

.prompt-pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* ── 消息列表 ── */
.msg-list {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.msg-list__header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: -8px;
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-200);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 180ms;
}

.reset-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border);
  background: var(--color-surface);
}

/* ── 消息 ── */
.msg {
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: fadein 280ms ease-out;
}

@keyframes fadein {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── 用户 ── */
.msg--user {
  align-items: flex-end;
}

.msg__bubble--user {
  max-width: 72%;
  padding: 10px 16px;
  border-radius: 16px 16px 4px 16px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

/* ── 助手 ── */
.msg--assistant {
  align-items: flex-start;
}

.msg__body {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text);
  word-break: break-word;
}

.msg__body :deep(strong) {
  font-weight: 600;
}

.msg__body :deep(code) {
  padding: 1px 5px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--color-surface) 80%, var(--color-border));
  font-size: 12.5px;
  font-family: 'Menlo', 'Consolas', monospace;
}

/* ── 光标 ── */
.cursor {
  display: inline-block;
  width: 2px;
  height: 15px;
  background: var(--color-text);
  margin-left: 1px;
  vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* ── 推理折叠 ── */
.reasoning {
  margin-bottom: 4px;
}

.reasoning__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-200);
  font-size: 11.5px;
  cursor: pointer;
  transition: color 180ms;
}

.reasoning__toggle:hover {
  color: var(--color-text);
}

.reasoning__arrow {
  transition: transform 180ms;
  opacity: 0.5;
}

.reasoning--open .reasoning__arrow {
  transform: rotate(90deg);
}

.reasoning__body {
  margin-top: 4px;
  padding: 8px 10px;
  border-left: 2px solid var(--color-border);
  font-size: 12px;
  color: var(--text-200);
  line-height: 1.6;
  animation: fadein 180ms ease-out;
}

/* ── 推理动画 ── */
.reasoning-live {
  padding: 10px 12px;
  border-left: 2px solid var(--color-primary);
  animation: fadein 280ms ease-out;
}

.reasoning-live__head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-200);
  margin-bottom: 6px;
}

.reasoning-live__indicator {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse 1.4s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

.reasoning-live__time {
  margin-left: auto;
  font-weight: 400;
  font-size: 11px;
  color: var(--text-200);
  font-variant-numeric: tabular-nums;
}

.reasoning-live__steps {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reasoning-live__step {
  font-size: 12px;
  color: var(--text-200);
  line-height: 1.5;
  padding-left: 11px;
  position: relative;
  opacity: 0.4;
  transition: color 250ms, opacity 250ms;
}

.reasoning-live__step::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  transition: background 250ms;
}

.reasoning-live__step.is-current {
  color: var(--color-text);
  opacity: 1;
}

.reasoning-live__step.is-past {
  opacity: 0.6;
}

/* ── 输入 ── */
.ai-input {
  padding: 10px 20px 18px;
  background: var(--color-background);
}

.ai-input__wrap {
  max-width: 680px;
  margin: 0 auto;
}

.ai-input__wrap :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 6px 4px 14px;
  box-shadow: none;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: border-color 180ms;
}

.ai-input__wrap :deep(.el-input__wrapper:hover),
.ai-input__wrap :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary);
}

.ai-input__wrap :deep(.el-input__inner) {
  font-size: 14px;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  transition: opacity 180ms;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.send-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .welcome__pills {
    max-width: 100%;
  }

  .msg__bubble--user {
    max-width: 85%;
  }

  .msg-list {
    padding: 0 4px;
  }
}

@media (max-width: 480px) {
  .welcome__title {
    font-size: 18px;
  }
}
</style>


