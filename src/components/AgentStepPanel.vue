<!-- 组件：Agent 协作过程可视化面板；用于 KnowledgeExplorer 右栏 -->
<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { AgentStep, AgentRole } from '@/types'

const props = defineProps<{
  steps: AgentStep[]
  running: boolean
}>()

const emit = defineEmits<{
  (e: 'start'): void
}>()

const agentMeta: Record<AgentRole, { icon: string; color: string }> = {
  'knowledge-locator': { icon: 'lucide:map-pin', color: '#2E7D32' },
  'protocol-analyzer': { icon: 'lucide:cpu', color: '#1565C0' },
  'fault-diagnoser': { icon: 'lucide:alert-triangle', color: '#E65100' },
  'learning-advisor': { icon: 'lucide:graduation-cap', color: '#6A1B9A' },
}

const hasStarted = computed(() => props.steps.length > 0)
const allDone = computed(() => props.steps.length > 0 && props.steps.every((s) => s.status === 'done'))

function getStatusIcon(status: AgentStep['status']) {
  if (status === 'done') return 'lucide:check-circle-2'
  if (status === 'running') return 'lucide:loader'
  return 'lucide:circle-dashed'
}

function getStatusClass(status: AgentStep['status']) {
  if (status === 'done') return 'step--done'
  if (status === 'running') return 'step--running'
  return 'step--waiting'
}
</script>

<template>
  <div class="agent-panel">
    <div class="agent-head">
      <div class="agent-head__left">
        <Icon icon="lucide:bot" class="agent-head-icon" />
        <span class="agent-head-title">多 Agent 协同分析</span>
      </div>
      <button
        v-if="!hasStarted"
        class="agent-start-btn"
        @click="emit('start')"
      >
        <Icon icon="lucide:play" />
        <span>发起分析</span>
      </button>
      <div v-else-if="running" class="agent-status agent-status--running">
        <Icon icon="lucide:loader" class="spin" />
        <span>分析中…</span>
      </div>
      <div v-else-if="allDone" class="agent-status agent-status--done">
        <Icon icon="lucide:check-circle-2" />
        <span>分析完成</span>
      </div>
    </div>

    <!-- 未开始 -->
    <div v-if="!hasStarted" class="agent-empty">
      <Icon icon="lucide:sparkles" class="agent-empty-icon" />
      <p>选择知识点后，点击「发起分析」启动多 Agent 协同诊断。</p>
      <p class="agent-empty-sub">四个 Agent 将依次进行知识定位、协议分析、故障诊断和学习建议。</p>
    </div>

    <!-- 步骤列表 -->
    <div v-else class="agent-steps">
      <div
        v-for="(step, idx) in steps"
        :key="step.role"
        class="step"
        :class="getStatusClass(step.status)"
      >
        <!-- 连接线 -->
        <div class="step-rail">
          <div class="step-dot" :style="{ borderColor: agentMeta[step.role]?.color }">
            <Icon
              :icon="getStatusIcon(step.status)"
              class="step-dot-icon"
              :class="{ spin: step.status === 'running' }"
              :style="{ color: step.status === 'done' ? agentMeta[step.role]?.color : undefined }"
            />
          </div>
          <div v-if="idx < steps.length - 1" class="step-line" />
        </div>

        <!-- 内容 -->
        <div class="step-content">
          <div class="step-header">
            <Icon :icon="agentMeta[step.role]?.icon || 'lucide:bot'" class="step-role-icon" :style="{ color: agentMeta[step.role]?.color }" />
            <span class="step-label">{{ step.label }}</span>
            <span class="step-badge" :class="`step-badge--${step.status}`">
              {{ step.status === 'done' ? '完成' : step.status === 'running' ? '运行中' : '等待' }}
            </span>
          </div>

          <!-- 输入 -->
          <div v-if="step.status !== 'waiting' && step.input" class="step-block step-block--input">
            <div class="step-block-label">输入</div>
            <div class="step-block-text">{{ step.input }}</div>
          </div>

          <!-- 推理 -->
          <div v-if="step.status === 'done' && step.reasoning" class="step-block step-block--reasoning">
            <div class="step-block-label">推理</div>
            <div class="step-block-text">{{ step.reasoning }}</div>
          </div>

          <!-- 输出 -->
          <div v-if="step.status === 'done' && step.output" class="step-block step-block--output">
            <div class="step-block-label">输出</div>
            <div class="step-block-text step-block-text--output">{{ step.output }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 汇总 -->
    <div v-if="allDone" class="agent-summary">
      <div class="agent-summary-head">
        <Icon icon="lucide:file-check-2" class="agent-summary-icon" />
        <span>协同分析汇总</span>
      </div>
      <p class="agent-summary-text">
        四个 Agent 已完成对当前知识点的全维度分析。图谱中已高亮关联节点，
        详情面板展示了多模态学习资源。建议按「学习建议 Agent」的输出路径进行系统学习。
      </p>
    </div>
  </div>
</template>

<style scoped>
.agent-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.agent-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--card-divider);
}

.agent-head__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-head-icon {
  font-size: 16px;
  color: var(--primary-100);
}

.agent-head-title {
  font-weight: 800;
  font-size: 13px;
  color: var(--text-100);
}

.agent-start-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--primary-100) 40%, var(--bg-300) 60%);
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-100) 90%);
  color: var(--primary-100);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition-fast) ease, border-color var(--transition-fast) ease;
}

.agent-start-btn:hover {
  background: color-mix(in srgb, var(--primary-100) 18%, var(--bg-100) 82%);
  border-color: var(--primary-100);
}

.agent-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.agent-status--running {
  color: var(--accent-100);
}

.agent-status--done {
  color: var(--primary-100);
}

.agent-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-200);
}

.agent-empty-icon {
  font-size: 28px;
  opacity: 0.4;
  margin-bottom: 10px;
}

.agent-empty p {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.6;
}

.agent-empty-sub {
  font-size: 11px !important;
  opacity: 0.7;
}

.agent-steps {
  padding: 14px 16px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step {
  display: flex;
  gap: 12px;
  min-height: 0;
}

.step-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 24px;
  flex-shrink: 0;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--bg-300);
  background: var(--bg-100);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: border-color var(--transition-base) ease;
}

.step--done .step-dot {
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-100) 90%);
}

.step-dot-icon {
  font-size: 13px;
  color: var(--text-200);
}

.step--waiting .step-dot-icon {
  opacity: 0.4;
}

.step-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: color-mix(in srgb, var(--bg-300) 70%, transparent 30%);
  margin: 4px 0;
}

.step--done + .step .step-line,
.step--done .step-line {
  background: color-mix(in srgb, var(--primary-100) 30%, var(--bg-300) 70%);
}

.step-content {
  flex: 1;
  min-width: 0;
  padding-bottom: 16px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.step-role-icon {
  font-size: 14px;
}

.step-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-100);
}

.step-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text-200);
}

.step-badge--running {
  border-color: color-mix(in srgb, var(--accent-100) 40%, var(--bg-300) 60%);
  color: var(--accent-100);
  background: color-mix(in srgb, var(--accent-100) 8%, var(--bg-100) 92%);
}

.step-badge--done {
  border-color: color-mix(in srgb, var(--primary-100) 40%, var(--bg-300) 60%);
  color: var(--primary-100);
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
}

.step-block {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
}

.step-block--input {
  background: color-mix(in srgb, var(--bg-200) 60%, var(--bg-100) 40%);
}

.step-block--reasoning {
  background: color-mix(in srgb, var(--accent-200) 15%, var(--bg-100) 85%);
  border-color: color-mix(in srgb, var(--accent-100) 20%, var(--bg-300) 80%);
}

.step-block--output {
  background: color-mix(in srgb, var(--primary-100) 5%, var(--bg-100) 95%);
  border-color: color-mix(in srgb, var(--primary-100) 20%, var(--bg-300) 80%);
}

.step-block-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.step-block-text {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-100);
  white-space: pre-line;
}

.step-block-text--output {
  font-weight: 500;
}

.agent-summary {
  margin: 4px 16px 16px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--card-emphasis-bg);
  border: 1px solid var(--card-emphasis-border);
}

.agent-summary-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.agent-summary-icon {
  font-size: 15px;
  color: var(--primary-100);
}

.agent-summary-head span {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-100);
}

.agent-summary-text {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-100);
  margin: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}
</style>
