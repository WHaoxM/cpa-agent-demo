import { computed, ref } from 'vue'
import {
  callAgentPortraitStreaming,
  PORTRAIT_TRACE_STEPS,
  type AgentPhase,
  type AgentPortraitInput,
  type AgentPortraitResult,
  type AgentTraceEvent,
  type PhaseData,
} from '@/composables/useAgentPortrait'

export type PortraitSessionStatus = 'idle' | 'running' | 'completed' | 'error'

export interface PortraitReplaySnapshot {
  phase: AgentPhase
  data: PhaseData
}

function createInitialTraceEvents(): AgentTraceEvent[] {
  return PORTRAIT_TRACE_STEPS.map(step => ({
    id: step.id,
    phase: step.phase,
    label: step.label,
    detail: step.detail,
    status: 'pending',
    progress: 0,
    timestamp: 0,
  }))
}

function clonePhaseData(data: PhaseData): PhaseData {
  switch (data.phase) {
    case 'parsing':
      return {
        phase: 'parsing',
        personInfo: {
          ...data.personInfo,
          honors: data.personInfo.honors.map(item => ({ ...item })),
          projects: data.personInfo.projects.map(item => ({ ...item })),
        },
        completenessScore: data.completenessScore,
      }
    case 'evaluating':
      return {
        phase: 'evaluating',
        dimensions: data.dimensions.map(item => ({ ...item })),
        competitivenessScore: data.competitivenessScore,
        skillTags: data.skillTags.map(item => ({ ...item })),
      }
    case 'analyzing':
      return {
        phase: 'analyzing',
        honors: data.honors.map(item => ({ ...item })),
        projects: data.projects.map(item => ({ ...item })),
      }
    case 'summarizing':
      return {
        phase: 'summarizing',
        agentSummary: typeof data.agentSummary === 'string' ? data.agentSummary : '',
      }
  }
}

export function usePortraitSession() {
  const status = ref<PortraitSessionStatus>('idle')
  const currentPhase = ref<AgentPhase | 'idle' | 'done'>('idle')
  const traceEvents = ref<AgentTraceEvent[]>(createInitialTraceEvents())
  const replaySnapshots = ref<PortraitReplaySnapshot[]>([])
  const result = ref<AgentPortraitResult | null>(null)
  const errorMessage = ref('')
  const activeRunId = ref(0)

  const progress = computed(() => traceEvents.value.reduce((max, item) => Math.max(max, item.progress), 0))
  const completedSteps = computed(() => traceEvents.value.filter(item => item.status === 'done').length)
  const runningStepIndex = computed(() => traceEvents.value.findIndex(item => item.status === 'running'))
  const currentStep = computed(() => {
    if (status.value === 'completed') return PORTRAIT_TRACE_STEPS.length
    if (runningStepIndex.value >= 0) return runningStepIndex.value + 1
    if (completedSteps.value > 0) return completedSteps.value
    return 0
  })
  const currentTrace = computed(() => {
    const runningItem = [...traceEvents.value].reverse().find(item => item.status === 'running')
    if (runningItem) return runningItem
    return [...traceEvents.value].reverse().find(item => item.status === 'done') ?? null
  })
  const currentLabel = computed(() => currentTrace.value?.label ?? '等待开始分析')
  const leftPanelMessage = computed(() => currentTrace.value?.detail ?? '等待上传简历并开始分析')
  const leftPanelProgress = computed(() => progress.value)
  const totalSteps = computed(() => PORTRAIT_TRACE_STEPS.length)
  const hasReplayData = computed(() => status.value === 'completed' && replaySnapshots.value.length > 0 && !!result.value)

  function clearState() {
    status.value = 'idle'
    currentPhase.value = 'idle'
    traceEvents.value = createInitialTraceEvents()
    replaySnapshots.value = []
    result.value = null
    errorMessage.value = ''
  }

  function upsertReplaySnapshot(snapshot: PortraitReplaySnapshot) {
    const existingIndex = replaySnapshots.value.findIndex(item => item.phase === snapshot.phase)
    if (existingIndex >= 0) {
      replaySnapshots.value.splice(existingIndex, 1, snapshot)
      return
    }
    replaySnapshots.value.push(snapshot)
  }

  function handleTrace(event: AgentTraceEvent) {
    const existingIndex = traceEvents.value.findIndex(item => item.id === event.id)
    if (existingIndex >= 0) {
      traceEvents.value.splice(existingIndex, 1, {
        ...traceEvents.value[existingIndex]!,
        ...event,
      })
      return
    }
    traceEvents.value.push(event)
  }

  function handlePhase(data: PhaseData) {
    currentPhase.value = data.phase
    upsertReplaySnapshot({
      phase: data.phase,
      data: clonePhaseData(data),
    })
  }

  function markError(message: string) {
    errorMessage.value = message
    status.value = 'error'
    const runningEventIndex = traceEvents.value.findIndex(item => item.status === 'running')
    if (runningEventIndex >= 0) {
      const currentEvent = traceEvents.value[runningEventIndex]!
      traceEvents.value.splice(runningEventIndex, 1, {
        ...currentEvent,
        status: 'error',
        timestamp: Date.now(),
      })
    }
  }

  async function run(input: AgentPortraitInput) {
    const runId = activeRunId.value + 1
    activeRunId.value = runId
    clearState()
    status.value = 'running'
    try {
      const finalResult = await callAgentPortraitStreaming(
        input,
        data => {
          if (activeRunId.value !== runId) return
          handlePhase(data)
        },
        event => {
          if (activeRunId.value !== runId) return
          handleTrace(event)
        },
      )
      if (activeRunId.value !== runId) return null
      result.value = finalResult
      upsertReplaySnapshot({
        phase: 'summarizing',
        data: {
          phase: 'summarizing',
          agentSummary: finalResult.agentSummary,
        },
      })
      currentPhase.value = 'done'
      status.value = 'completed'
      return finalResult
    } catch (error) {
      if (activeRunId.value !== runId) return null
      markError(error instanceof Error ? error.message : '画像分析失败')
      throw error
    }
  }

  function reset() {
    activeRunId.value += 1
    clearState()
  }

  return {
    status,
    currentPhase,
    traceEvents,
    replaySnapshots,
    result,
    errorMessage,
    progress,
    completedSteps,
    currentStep,
    currentLabel,
    leftPanelMessage,
    leftPanelProgress,
    totalSteps,
    hasReplayData,
    run,
    reset,
  }
}
