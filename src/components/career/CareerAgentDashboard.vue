<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { PHASE_META, type AgentPhase, type AgentTraceEvent } from '@/composables/useAgentPortrait'
import type { PortraitSessionStatus } from '@/composables/usePortraitSession'

const props = defineProps<{
  status: PortraitSessionStatus
  currentPhase: AgentPhase | 'idle' | 'done'
  traceEvents: AgentTraceEvent[]
  progress: number
  currentLabel: string
  currentStep: number
  totalSteps: number
}>()

const logPanelEl = ref<HTMLElement | null>(null)

const activeTrace = computed(() => {
  const runningItem = [...props.traceEvents].reverse().find(item => item.status === 'running')
  if (runningItem) return runningItem
  return [...props.traceEvents].reverse().find(item => item.status === 'done') ?? null
})

const currentPhaseLabel = computed(() => {
  if (props.currentPhase === 'done') return '综合结论已完成'
  return PHASE_META.find(item => item.key === props.currentPhase)?.label ?? '等待启动分析'
})

const statusLabel = computed(() => {
  if (props.status === 'running') return '运行中'
  if (props.status === 'completed') return '已完成'
  if (props.status === 'error') return '异常'
  return '待命'
})

const statusTone = computed(() => {
  if (props.status === 'running') return 'running'
  if (props.status === 'completed') return 'done'
  if (props.status === 'error') return 'error'
  return 'idle'
})

const dashboardLogs = computed(() => props.traceEvents
  .filter(item => item.timestamp > 0)
  .map(item => ({
    id: item.id,
    time: new Date(item.timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    level: item.status === 'done' ? 'success' : item.status === 'error' ? 'warn' : 'info',
    agent: agentNameForTrace(item),
    message: traceMessage(item),
  })))

watch(
  () => dashboardLogs.value.map(item => `${item.id}:${item.level}:${item.time}`).join('|'),
  () => {
    nextTick(() => {
      if (logPanelEl.value) {
        logPanelEl.value.scrollTop = logPanelEl.value.scrollHeight
      }
    })
  },
  { immediate: true },
)

function agentNameForTrace(trace: AgentTraceEvent) {
  if (trace.id === 'doc-structure') return 'DocumentAgent'
  if (trace.id === 'skill-extract') return 'ResumeParsingAgent'
  if (trace.id === 'role-match') return 'MatchingAgent'
  if (trace.id === 'dimension-score') return 'ScoringAgent'
  if (trace.id === 'experience-map') return 'ExperienceAgent'
  if (trace.id === 'summary-generate') return 'SummaryAgent'
  return 'System'
}

function traceMessage(trace: AgentTraceEvent) {
  if (trace.status === 'running') return `${trace.detail} · ${trace.progress}%`
  if (trace.status === 'done') return `${trace.detail} · 已完成`
  if (trace.status === 'error') return `${trace.detail} · 出现异常`
  return `${trace.detail} · 等待执行`
}
</script>

<template>
  <div class="cad-panel">
    <div class="cad-shell">
      <div class="cad-head">
        <div class="cad-head__left">
          <span class="cad-mark" aria-hidden="true">
            <Icon icon="lucide:bot" :width="13" />
          </span>
          <div>
            <div class="cad-title">Agent 工作台</div>
            <div class="cad-subtitle">画像解析流水线</div>
          </div>
        </div>
        <span class="cad-badge" :class="`cad-badge--${statusTone}`">{{ statusLabel }}</span>
      </div>

      <div class="cad-progress">
        <div class="cad-progress__meta">
          <span>{{ currentPhaseLabel }}</span>
          <span class="cad-progress__pct">{{ Math.round(progress) }}%</span>
        </div>
        <div class="cad-progress__track" aria-hidden="true">
          <div class="cad-progress__fill" :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }" />
        </div>
        <div class="cad-progress__steps">
          步骤 {{ currentStep }} / {{ totalSteps }}
        </div>
      </div>

      <div class="cad-hintline">
        <Icon icon="lucide:activity" :width="12" />
        <span class="cad-hintline__main">{{ activeTrace?.detail ?? '等待接收简历分析任务' }}</span>
        <span class="cad-hintline__sep" aria-hidden="true" />
        <span class="cad-hintline__sub">{{ currentLabel }}</span>
      </div>

      <div class="cad-logs" ref="logPanelEl">
        <div
          v-for="log in dashboardLogs"
          :key="log.id"
          class="cad-log"
        >
          <span class="cad-log__ts">{{ log.time }}</span>
          <span class="cad-log__dot" :class="'cad-log__dot--' + log.level" aria-hidden="true" />
          <span class="cad-log__agent">{{ log.agent }}</span>
          <span class="cad-log__msg">{{ log.message }}</span>
        </div>
        <div v-if="dashboardLogs.length === 0" class="cad-log--empty">
          <Icon icon="lucide:terminal" :width="14" />
          <span>等待日志输出…</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cad-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
}

.cad-shell {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(180deg, #24201c 0%, #1a1714 48%, #151311 100%);
  color: #d9d2c5;
  border: 1px solid rgba(201, 162, 39, 0.14);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  font-family: var(--font-ui, 'DM Sans', 'Noto Sans SC', sans-serif);
}

.cad-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.cad-head__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cad-mark {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(190, 42, 0, 0.18);
  color: #e87055;
  flex-shrink: 0;
}

.cad-title {
  font-size: 13px;
  font-weight: 600;
  color: #f2ebe0;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.cad-subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(217, 210, 197, 0.55);
}

.cad-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid transparent;
}

.cad-badge--idle {
  color: rgba(217, 210, 197, 0.7);
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.cad-badge--running {
  color: #f0c36a;
  background: rgba(201, 162, 39, 0.14);
  border-color: rgba(201, 162, 39, 0.28);
}

.cad-badge--done {
  color: #8fbf8a;
  background: rgba(74, 103, 65, 0.28);
  border-color: rgba(143, 191, 138, 0.28);
}

.cad-badge--error {
  color: #e87055;
  background: rgba(190, 42, 0, 0.16);
  border-color: rgba(232, 112, 85, 0.3);
}

.cad-progress {
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.cad-progress__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #ebe4d6;
  margin-bottom: 7px;
}

.cad-progress__pct {
  font-variant-numeric: tabular-nums;
  color: #c9a227;
  font-weight: 600;
}

.cad-progress__track {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.cad-progress__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #be2a00, #c9a227);
  transition: width 280ms ease;
}

.cad-progress__steps {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(217, 210, 197, 0.5);
  font-variant-numeric: tabular-nums;
}

.cad-hintline {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 7px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(217, 210, 197, 0.62);
  font-size: 11.5px;
  line-height: 1.55;
}

.cad-hintline__main {
  color: #ebe4d6;
}

.cad-hintline__sep {
  width: 1px;
  height: 11px;
  margin-top: 3px;
  background: rgba(255, 255, 255, 0.14);
}

.cad-hintline__sub {
  min-width: 0;
}

.cad-logs {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 10px 12px;
  font-size: 11.5px;
  line-height: 1.55;
  font-family: 'Cascadia Code', 'Menlo', 'Consolas', monospace;
}

.cad-logs::-webkit-scrollbar {
  width: 4px;
}

.cad-logs::-webkit-scrollbar-thumb {
  background: rgba(201, 162, 39, 0.28);
  border-radius: 2px;
}

.cad-log {
  display: grid;
  grid-template-columns: auto auto auto minmax(0, 1fr);
  gap: 7px;
  align-items: start;
  padding: 6px 6px;
  border-radius: 6px;
}

.cad-log:hover {
  background: rgba(255, 255, 255, 0.03);
}

.cad-log__ts {
  color: rgba(217, 210, 197, 0.42);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.cad-log__dot {
  width: 6px;
  height: 6px;
  margin-top: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cad-log__dot--success { background: #68d391; }
.cad-log__dot--warn { background: #f6ad55; }
.cad-log__dot--info { background: #63b3ed; }

.cad-log__agent {
  color: #d4a84b;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cad-log__msg {
  color: rgba(232, 226, 214, 0.82);
  min-width: 0;
  overflow-wrap: anywhere;
}

.cad-log--empty {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(217, 210, 197, 0.45);
  font-size: 12px;
  padding: 18px 8px;
  font-family: inherit;
}
</style>
