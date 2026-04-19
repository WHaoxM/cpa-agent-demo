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
  if (props.status === 'running') return 'LOCAL_SIMULATION'
  if (props.status === 'completed') return 'COMPLETED'
  if (props.status === 'error') return 'ERROR'
  return 'IDLE'
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
    icon: item.status === 'done' ? '√' : item.status === 'error' ? '!' : '-',
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
        <span class="cad-title">系统仪表盘</span>
        <span class="cad-controls">
          <button class="cad-btn" title="最小化">—</button>
          <button class="cad-btn" title="清空">🗑</button>
        </span>
      </div>

      <div class="cad-statusbar">
        <div class="cad-statusline">
          <span class="cad-statusline__label">PHASE</span>
          <span class="cad-statusline__value">{{ currentPhaseLabel }}</span>
        </div>
        <div class="cad-statusline">
          <span class="cad-statusline__label">STATUS</span>
          <span class="cad-statusline__value">{{ statusLabel }}</span>
        </div>
        <div class="cad-statusline">
          <span class="cad-statusline__label">STEP</span>
          <span class="cad-statusline__value">{{ currentStep }} / {{ totalSteps }}</span>
        </div>
        <div class="cad-statusline">
          <span class="cad-statusline__label">PROGRESS</span>
          <span class="cad-statusline__value">{{ Math.round(progress) }}%</span>
        </div>
      </div>

      <div class="cad-hintline">
        <Icon icon="lucide:bot" :width="12" />
        <span>{{ activeTrace?.detail ?? '等待接收简历分析任务' }}</span>
        <span class="cad-hintline__sep">|</span>
        <span>{{ currentLabel }}</span>
      </div>

      <div class="cad-logs" ref="logPanelEl">
        <div
          v-for="log in dashboardLogs"
          :key="log.id"
          class="cad-log"
        >
          <span class="cad-log__ts">[{{ log.time }}]</span>
          <span class="cad-log__icon" :class="'cad-log__icon--' + log.level">{{ log.icon }}</span>
          <span class="cad-log__agent">{{ log.agent }}</span>
          <span class="cad-log__msg">{{ log.message }}</span>
        </div>
        <div v-if="dashboardLogs.length === 0" class="cad-log--empty">等待日志输出…</div>
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
  background: #111;
  color: #bbb;
  font-family: 'Consolas', 'Monaco', monospace;
}

.cad-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}

.cad-title {
  font-size: 12px;
  font-weight: 600;
  color: #bbb;
}

.cad-controls {
  display: flex;
  gap: 6px;
}

.cad-btn {
  background: transparent;
  border: none;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  padding: 0 4px;
}

.cad-btn:hover {
  color: #bbb;
}

.cad-statusbar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 5px;
  padding: 8px 10px 6px;
  border-bottom: 1px solid #242424;
  background: #141414;
  font-size: 11px;
}

.cad-statusline {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cad-statusline__label {
  color: #777;
  flex-shrink: 0;
}

.cad-statusline__value {
  color: #d0d0d0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cad-hintline {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 6px;
  padding: 7px 10px;
  border-bottom: 1px solid #1f1f1f;
  color: #8d8d8d;
  font-size: 11px;
  line-height: 1.6;
}

.cad-hintline__sep {
  color: #555;
}

.cad-logs {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 10px;
  font-size: 11px;
  line-height: 1.7;
}

.cad-logs::-webkit-scrollbar {
  width: 3px;
}

.cad-logs::-webkit-scrollbar-thumb {
  background: #3a332c;
  border-radius: 2px;
}

.cad-log {
  display: grid;
  grid-template-columns: auto auto auto minmax(0, 1fr);
  gap: 5px;
  align-items: start;
}

.cad-log__ts {
  color: #777;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.cad-log__icon {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 12px;
}

.cad-log__icon--success {
  color: #68D391;
}

.cad-log__icon--warn {
  color: #F6AD55;
}

.cad-log__icon--info {
  color: #63B3ED;
}

.cad-log__agent {
  color: #B7791F;
  font-weight: 600;
  flex-shrink: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cad-log__msg {
  color: #bbb;
  min-width: 0;
  overflow-wrap: anywhere;
}

.cad-log--empty {
  color: #777;
  font-size: 11px;
}

@media (max-width: 1180px) {
  .cad-statusbar {
    grid-template-columns: 1fr;
  }
}
</style>
