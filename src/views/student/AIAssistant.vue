<!-- 页面：AI助手；路由：student/ai-assistant（student-ai-assistant）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Promotion, ChatLineRound, User } from '@element-plus/icons-vue'
import { useUserStore, useLearningStore } from '@/stores'
import IntegrationHint from '@/components/IntegrationHint.vue'
import { usePageEntrance } from '@/composables/usePageEntrance'

const { pageRef } = usePageEntrance()
const userStore = useUserStore()
const learningStore = useLearningStore()

const messages = computed(() => learningStore.aiMessages)
const inputMessage = ref('')
const messagesContainer = ref<HTMLDivElement>()
const loading = ref(false)

const quickPrompts = [
  { icon: '💡', text: '课程答疑', desc: '询问课程相关问题' },
  { icon: '📝', text: '解题指导', desc: '获取解题思路' },
  { icon: '📊', text: '学习建议', desc: '获得个性化建议' },
  { icon: '⚠️', text: '薄弱点提醒', desc: '分析薄弱知识点' },
]

async function sendMessage() {
  console.log('发送消息开始')
  if (!inputMessage.value.trim() || loading.value) {
    console.log('消息为空或正在加载，退出')
    return
  }
  
  const userMsg = inputMessage.value.trim()
  console.log('用户消息:', userMsg)
  inputMessage.value = ''
  
  // 添加用户消息
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16)
  learningStore.addAIMessage({
    role: 'user',
    content: userMsg,
    timestamp: now,
  })
  console.log('已添加用户消息')
  
  loading.value = true
  console.log('设置加载状态')
  
  // 模拟AI回复延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('AI回复延迟结束')
  
  // 获取AI回复
  const aiResponse = learningStore.getAIResponse(userMsg)
  console.log('AI回复:', aiResponse)
  
  learningStore.addAIMessage({
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  })
  console.log('已添加AI回复')
  
  loading.value = false
  console.log('清除加载状态')
  
  // 滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function useQuickPrompt(prompt: string) {
  console.log('点击快捷提示:', prompt)
  inputMessage.value = prompt
  console.log('设置输入框内容:', inputMessage.value)
  sendMessage()
}

function clearChat() {
  learningStore.clearAIMessages()
}
</script>



<template>
  <div ref="pageRef" class="ai-assistant-page page page--compact">
    <div class="chat-container">
      <!-- 头部 -->
      <div class="chat-header">
        <div class="header-info">
          <div class="ai-avatar">
            <el-icon :size="28" color="#409EFF"><ChatLineRound /></el-icon>
          </div>
          <div class="header-text">
            <h3>AI 学习助手</h3>
            <p>随时为你解答学习问题</p>
            <IntegrationHint />
          </div>
        </div>
        <el-button text @click="clearChat">清空对话</el-button>
      </div>

      <!-- 消息区域 -->
      <div ref="messagesContainer" class="messages-area">
        <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.role">
          <div class="message-avatar">
            <el-avatar 
              v-if="msg.role === 'user'" 
              :size="40" 
              :src="userStore.currentUser?.avatar" 
            />
            <div v-else class="ai-icon">
              <el-icon :size="24" color="#fff"><ChatLineRound /></el-icon>
            </div>
          </div>
          <div class="message-content">
            <div class="message-bubble" v-html="msg.content.replace(/\n/g, '<br>')" />
            <span class="message-time">{{ msg.timestamp }}</span>
          </div>
        </div>
        
        <div v-if="loading" class="message assistant">
          <div class="message-avatar">
            <div class="ai-icon">
              <el-icon :size="24" color="#fff"><ChatLineRound /></el-icon>
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
      </div>

      <!-- 快捷提示 -->
      <div v-if="messages.length <= 1" class="quick-prompts">
        <div style="grid-column: 1/-1; text-align: center; color: #999; font-size: 12px; margin-bottom: 8px;">
          调试信息：当前消息数量 {{ messages.length }}
        </div>
        <div
          v-for="prompt in quickPrompts"
          :key="prompt.text"
          class="prompt-card"
          @click="useQuickPrompt(prompt.text)"
        >
          <span class="prompt-icon">{{ prompt.icon }}</span>
          <span class="prompt-text">{{ prompt.text }}</span>
          <span class="prompt-desc">{{ prompt.desc }}</span>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="输入你的问题，AI助手会为你解答..."
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

.ai-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  display: flex;
  align-items: center;
  justify-content: center;
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

.ai-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  display: flex;
  align-items: center;
  justify-content: center;
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
  border-radius: 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  line-height: 1.6;
}

.message.user .message-bubble {
  background: #409EFF;
  color: #fff;
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
  background: #409EFF;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 0 20px 16px;
}

.prompt-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  background: #fff;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.prompt-card:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.prompt-icon {
  font-size: 28px;
}

.prompt-text {
  font-weight: 600;
  font-size: 14px;
}

.prompt-desc {
  font-size: 12px;
  color: var(--text-200);
}

.input-area {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid var(--el-border-color-light);
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
  .quick-prompts {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .message {
    max-width: 90%;
  }
}
</style>


