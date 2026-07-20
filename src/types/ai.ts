// AI 分析结果
export interface AIAnalysisResult {
  generatedAt: string
  summary: string                                  // 总体评价与鼓励
  growthScore: number                              // 0~100
  scoreTooltip: string                             // 综合竞争力计算说明
  topAbilities: string[]
  topAbilityDetails: { name: string; detail: string }[]  // 每个突出能力的数据依据
  improvementAreas: string[]
  improvementDetails: { name: string; detail: string }[] // 每个待提升方向的数据依据
  careerSuggestions: string[]
  timeline: { date: string; label: string }[]
  nextSteps: string[]
}

/** Agent 工具调用卡片（对话内展示） */
export interface AIToolCall {
  name: string
  status?: 'running' | 'done' | 'error'
  summary?: string
  args?: Record<string, string>
  resultPreview?: string
  parameters?: Record<string, unknown>
  taskId?: string
  taskStatus?: string
}

/** 用户消息附带的文件芯片（仅展示名） */
export interface AIMessageAttachment {
  name: string
}

export type InteractionMode = 'ask' | 'agent' | 'experts'

export interface AgentUpgradeHint {
  to: InteractionMode | string
  reason?: string
}

// AI 消息
export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  thinking?: string
  thinkingDuration?: number
  status?: 'streaming' | 'thinking' | 'done'
  toolCalls?: AIToolCall[]
  attachments?: AIMessageAttachment[]
  interactionMode?: InteractionMode | string
  upgradeHint?: AgentUpgradeHint
}
