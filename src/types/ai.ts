// AI 消息
export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  thinking?: string
  thinkingDuration?: number
  status?: 'streaming' | 'thinking' | 'done'
}
