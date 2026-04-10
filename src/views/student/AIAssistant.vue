<!-- 页面：AI助手；路由：student/ai-assistant（student-ai-assistant）；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Promotion, ChatLineRound } from '@element-plus/icons-vue'
import { useUserStore, useLearningStore } from '@/stores'
import { useResumeStore } from '@/stores/resume'
import { usePageEntrance } from '@/composables/usePageEntrance'

const { pageRef } = usePageEntrance()
const userStore = useUserStore()
const learningStore = useLearningStore()
const resumeStore = useResumeStore()

const messages = computed(() => learningStore.aiMessages)
const inputMessage = ref('')
const messagesContainer = ref<HTMLDivElement>()
const loading = ref(false)
const isInitialState = computed(() => messages.value.length <= 1)

type QuickPrompt = {
  tag: string
  text: string
  desc: string
  reply: string
}

const quickPrompts: QuickPrompt[] = [
  {
    tag: '系统概览',
    text: '先带我了解这个系统的功能结构',
    desc: '快速知道各模块是做什么的',
    reply: '当然可以。这个系统可以按「职业探索 → 能力匹配 → 学习执行 → 成果沉淀」来使用：\n1. 职业分析：先看方向趋势、岗位画像与地域信息。\n2. 技能自评：快速定位你当前能力短板。\n3. 职途导航：结合方向与简历情况做匹配建议。\n4. 心仪岗位：管理你关注的方向和岗位信息。\n5. 技能提升 / 我的报告：把行动计划落地并追踪结果。\n\n你可以告诉我你现在最想解决哪一步，我帮你先从一个最小可执行动作开始。',
  },
  {
    tag: '能力入口',
    text: '结合我的情况，我现在可以先做哪些事？',
    desc: '给出立即可执行的下一步',
    reply: '你可以先按这 3 步开始：\n1. 明确目标：先选 1 个目标方向（例如前端、后端、测试、数据分析）。\n2. 快速诊断：去「技能自评」做一轮，先找到差距最大的 2~3 项能力。\n3. 制定计划：在「技能提升」里把这 2~3 项拆成每周任务并执行。\n\n如果你愿意，我可以继续帮你把“本周学习清单”直接列出来。',
  },
  {
    tag: '方向选择',
    text: '我适合先了解哪些岗位方向？',
    desc: '先看方向，再决定投入重点',
    reply: '建议你先从这几个方向做对比，再决定主攻：\n1. 前端开发：偏界面交互、工程化和项目表达。\n2. 后端开发：偏接口设计、数据处理和服务稳定性。\n3. 测试开发：偏质量保障、自动化与流程建设。\n4. 数据分析：偏业务理解、指标分析和数据表达。\n\n下一步建议：先去「职业分析」各看 3 分钟，再告诉我你最感兴趣的 1~2 个方向，我帮你做取舍。',
  },
  {
    tag: '起步建议',
    text: '如果我还没上传简历，第一步该怎么开始？',
    desc: '先起步，再逐步完善简历',
    reply: '没上传简历也可以先开始。建议按这个顺序：\n1. 先做「技能自评」：快速知道目前能力基线。\n2. 去「职业分析」选方向：先定目标，再定学习内容。\n3. 做 1 个小项目并记录：形成可写进简历的成果素材。\n4. 再上传或完善简历：让系统给你更精准的匹配建议。\n\n如果你愿意，我可以先给你一个“7 天起步计划”模板。',
  },
]

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

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
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const contextMsg = buildContextPrefix() + userMsg
  const aiResponse = learningStore.getAIResponse(contextMsg)
  
  learningStore.addAIMessage({
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  })
  
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
  await new Promise(resolve => setTimeout(resolve, 420))

  learningStore.addAIMessage({
    role: 'assistant',
    content: prompt.reply,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  })

  loading.value = false
  scrollToBottom()
}

function clearChat() {
  learningStore.clearAIMessages()
}
</script>



<template>
  <div ref="pageRef" class="ai-assistant-page page page--compact">
    <div class="chat-container" :class="{ 'chat-container--initial': isInitialState }">
      <!-- 头部 -->
      <div class="chat-header">
        <div class="header-info">
          <div class="guide-avatar">
            <el-icon :size="22"><ChatLineRound /></el-icon>
          </div>
          <div class="header-text">
            <h3>ai助手</h3>
            <p>围绕职业方向、技能差距与学习安排，给你可执行的下一步建议</p>
          </div>
        </div>
        <el-button text @click="clearChat">清空记录</el-button>
      </div>

      <!-- 消息区域 -->
      <div ref="messagesContainer" class="messages-area" :class="{ 'messages-area--initial': isInitialState }">
        <template v-if="isInitialState">
          <section class="hero-intro">
            <h2>你可以先从这里开始</h2>
            <p>先点一个问题，我会给你清晰的起步建议，再一起细化行动计划。</p>
          </section>

          <div class="quick-prompts">
            <div
              v-for="prompt in quickPrompts"
              :key="prompt.text"
              class="prompt-card"
              @click="useQuickPrompt(prompt)"
            >
              <span class="prompt-tag">{{ prompt.tag }}</span>
              <span class="prompt-text">{{ prompt.text }}</span>
              <span class="prompt-desc">{{ prompt.desc }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.role">
            <div class="message-avatar">
              <el-avatar
                v-if="msg.role === 'user'"
                :size="40"
                :src="userStore.currentUser?.avatar"
              />
              <div v-else class="guide-icon">
                <el-icon :size="20"><ChatLineRound /></el-icon>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble" v-html="msg.content.replace(/\n/g, '<br>')" />
              <span class="message-time">{{ msg.timestamp }}</span>
            </div>
          </div>

          <div v-if="loading" class="message assistant">
            <div class="message-avatar">
              <div class="guide-icon">
                <el-icon :size="20"><ChatLineRound /></el-icon>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble loading">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="继续提问，例如：帮我按目标方向列一个本周学习计划"
          resize="none"
          @keydown.enter.prevent="sendMessage"
        />
        <el-button
          type="primary"
          :icon="Promotion"
          :disabled="!inputMessage.trim() || loading"
          @click="sendMessage"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-assistant-page {
  height: calc(100vh - 120px);
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-100);
  border-radius: 0;
  overflow: hidden;
}

.chat-container--initial {
  background: color-mix(in srgb, var(--bg-100) 88%, var(--color-surface));
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.guide-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-surface) 68%, var(--color-primary-light));
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.header-text h3 {
  margin: 0;
  font-size: 18px;
}

.header-text p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-200);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.messages-area--initial {
  justify-content: center;
  gap: 22px;
  padding: 26px 20px 18px;
}

.hero-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.hero-intro h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  color: var(--color-text);
}

.hero-intro p {
  margin: 0;
  max-width: 620px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-200);
}

.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.guide-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-surface) 68%, var(--color-primary-light));
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.user .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  line-height: 1.6;
}

.message.user .message-bubble {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary-dark);
}

.message-bubble.loading {
  display: flex;
  gap: 4px;
  padding: 16px 20px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.message-time {
  font-size: 11px;
  color: var(--text-200);
}

.message.user .message-time {
  color: var(--text-200);
}

.quick-prompts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: min(760px, 100%);
  margin: 0 auto;
}

.prompt-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
  min-height: 120px;
  padding: 14px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.prompt-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.prompt-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 600;
}

.prompt-text {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.45;
}

.prompt-desc {
  font-size: 12px;
  color: var(--text-200);
  line-height: 1.5;
}

.input-area {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.input-area :deep(.el-textarea) {
  flex: 1;
}

.input-area :deep(.el-textarea__inner) {
  border-radius: 0;
  padding: 12px 16px;
}

.input-area .el-button {
  align-self: flex-end;
  border-radius: 0;
  padding: 12px 24px;
}

@media (max-width: 768px) {
  .hero-intro h2 {
    font-size: 20px;
  }

  .hero-intro p {
    font-size: 13px;
  }

  .quick-prompts {
    grid-template-columns: 1fr;
  }
  
  .message {
    max-width: 90%;
  }
}
</style>


