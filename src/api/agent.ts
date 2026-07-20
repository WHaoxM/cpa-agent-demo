import { getApiMode } from './config'
import { mockGet, mockMutate } from './adapters/mockAdapter'
import { httpDelete, httpGet, httpPost } from './adapters/httpAdapter'
import type { AIToolCall } from '@/types'

export type InteractionMode = 'ask' | 'agent' | 'experts'

export type AgentChatRequest = {
  message: string
  student_id?: string
  session_id?: string | null
  /** Engine: supervisor | langgraph_legacy | react | demo */
  mode?: 'demo' | 'langgraph' | 'react' | 'supervisor' | 'langgraph_legacy'
  /** Qoder-aligned interaction mode */
  interaction_mode?: InteractionMode
  plan_mode?: boolean
  /** Claude/Qoder: reference uploaded file_ids (do not paste file bodies) */
  attachment_ids?: string[]
  content_parts?: Array<Record<string, unknown>>
  voice_turn_id?: string
}

/** Backend tool_calls item (supervisor / langgraph) */
export type AgentToolCallRaw = {
  tool_name?: string
  name?: string
  tool?: string
  parameters?: Record<string, unknown>
  result_preview?: string
  summary?: string
  result?: string
  elapsed_seconds?: number
}

export type AgentUpgradeHint = {
  to: InteractionMode | string
  reason?: string
}

export type AgentPermissionDenial = {
  tool?: string
  reason?: string
}

export type AgentChatData = {
  reply: string
  tool_calls?: AgentToolCallRaw[] | unknown[]
  /** ReAct 等引擎返回的中间思考步骤 */
  thinking_steps?: string[]
  session_id?: string
  elapsed_seconds?: number
  engine?: string
  active_subagent?: string
  interaction_mode?: InteractionMode | string
  upgrade_hint?: AgentUpgradeHint
  fork_jobs_enqueued?: string[]
  permission_denials?: AgentPermissionDenial[]
  orchestration?: {
    active_subagent?: string
    strategy?: string
    interaction_mode?: string
    upgrade_hint?: AgentUpgradeHint
    permission_denials?: AgentPermissionDenial[]
    thinking_steps?: string[]
  }
}

export type AgentSessionCreateData = {
  session_id: string
  created_at?: string
}

export type AgentHistoryMessage = {
  role: string
  content: string
  timestamp?: string
  tool_calls?: AgentToolCallRaw[]
}

export type AgentSessionListItem = {
  session_id: string
  student_id?: string
  status?: string
  title?: string
  preview?: string
  created_at?: string
  updated_at?: string
  message_count?: number
}

function stringifyArgs(parameters?: Record<string, unknown>): Record<string, string> | undefined {
  if (!parameters || typeof parameters !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(parameters)) {
    if (v == null) continue
    out[k] = typeof v === 'string' ? v : JSON.stringify(v)
  }
  return Object.keys(out).length ? out : undefined
}

function extractTaskId(parameters?: Record<string, unknown>, preview?: string): string | undefined {
  if (parameters) {
    const raw = parameters.task_id ?? parameters.taskId
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  if (preview) {
    const m = preview.match(/task[_-]?id["']?\s*[:=]\s*["']?([a-zA-Z0-9_-]+)/i)
    if (m?.[1]) return m[1]
  }
  return undefined
}

const SENSITIVE_ARG_KEYS = new Set([
  'phone', 'email', 'mobile', 'tel', 'password', 'secret', 'token',
  'profile_json', 'posting_json', 'raw_text', 'resume_text',
])

function publicArgs(parameters?: Record<string, unknown>): Record<string, string> | undefined {
  if (!parameters || typeof parameters !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(parameters)) {
    if (v == null) continue
    const lk = k.toLowerCase()
    if (SENSITIVE_ARG_KEYS.has(lk) || lk.endsWith('_json') || lk.endsWith('_token')) {
      out[k] = '[redacted]'
      continue
    }
    const s = typeof v === 'string' ? v : JSON.stringify(v)
    out[k] = s.length > 80 ? `${s.slice(0, 77)}…` : s
  }
  return Object.keys(out).length ? out : undefined
}

/** Map backend tool_calls → UI cards (defense-in-depth; prefer backend egress). */
export function mapAgentToolCalls(raw: unknown): AIToolCall[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item, idx) => {
    const row = (item && typeof item === 'object') ? item as AgentToolCallRaw : {}
    const name = String(row.tool_name || row.name || row.tool || `tool_${idx + 1}`)
    // Prefer summary; never surface long raw dumps as primary text
    const summary = String(row.summary || row.result_preview || '已完成调用').slice(0, 160)
    const args = publicArgs(row.parameters) || stringifyArgs(row.parameters)
    const taskId = extractTaskId(row.parameters, summary)
    return {
      name,
      status: 'done' as const,
      summary,
      args,
      // Do not mirror raw DB bodies into expandable preview
      resultPreview: undefined,
      parameters: undefined,
      taskId,
    }
  })
}

let agentSessionId: string | null = null

export function getAgentSessionId(): string | null {
  return agentSessionId
}

export function setAgentSessionId(id: string | null) {
  agentSessionId = id
}

export function clearAgentSessionId() {
  agentSessionId = null
}

export async function chat(req: AgentChatRequest): Promise<AgentChatData> {
  // http 默认真引擎；仅 mock / 显式传 demo 才走演示回复
  const mode = req.mode ?? (getApiMode() === 'http' ? 'langgraph' : 'demo')
  const sessionId = req.session_id !== undefined ? req.session_id : agentSessionId

  if (getApiMode() === 'mock') {
    const env = await mockGet<AgentChatData>('agent/chat.demo.json')
    const data = (env.data ?? {}) as AgentChatData
    const sid = data.session_id || sessionId || `demo_${Date.now().toString(36)}`
    agentSessionId = sid
    return {
      ...data,
      reply: data.reply || '演示模式已接收你的问题。',
      session_id: sid,
    }
  }

  const env = await httpPost<AgentChatData>('/api/agent/chat', {
    message: req.message,
    student_id: req.student_id,
    session_id: sessionId ?? undefined,
    mode,
    interaction_mode: req.interaction_mode ?? 'ask',
    plan_mode: req.plan_mode,
    attachment_ids: req.attachment_ids,
    content_parts: req.content_parts,
    voice_turn_id: req.voice_turn_id,
  })
  const data = (env.data ?? { reply: '' }) as AgentChatData
  if (data.session_id) agentSessionId = data.session_id
  return data
}

export async function createSession(studentId?: string): Promise<AgentSessionCreateData> {
  if (getApiMode() === 'mock') {
    const env = await mockMutate<AgentSessionCreateData>('agent/session.create.json')
    const data = (env.data ?? { session_id: `demo_sess_${Date.now().toString(36)}` }) as AgentSessionCreateData
    agentSessionId = data.session_id
    return data
  }
  const env = await httpPost<AgentSessionCreateData>('/api/agent/session/create', {
    student_id: studentId,
  })
  const data = (env.data ?? { session_id: '' }) as AgentSessionCreateData
  if (data.session_id) agentSessionId = data.session_id
  return data
}

export async function getSessionHistory(
  sessionId: string,
  limit = 50,
): Promise<AgentHistoryMessage[]> {
  if (getApiMode() === 'mock') {
    const env = await mockGet<{ messages?: AgentHistoryMessage[] }>('agent/session.history.json')
    return (env.data as { messages?: AgentHistoryMessage[] } | undefined)?.messages ?? []
  }
  const env = await httpGet<{ messages?: AgentHistoryMessage[] }>(
    `/api/agent/session/${encodeURIComponent(sessionId)}/history`,
    { limit },
  )
  return (env.data as { messages?: AgentHistoryMessage[] } | undefined)?.messages ?? []
}

export async function ensureSession(studentId?: string): Promise<string> {
  if (agentSessionId) return agentSessionId
  const created = await createSession(studentId)
  return created.session_id
}

export async function listSessions(studentId?: string, limit = 40): Promise<AgentSessionListItem[]> {
  if (getApiMode() === 'mock') {
    return agentSessionId
      ? [{
          session_id: agentSessionId,
          title: '演示会话',
          status: 'active',
          updated_at: new Date().toISOString(),
          message_count: 0,
        }]
      : []
  }
  const env = await httpGet<{ sessions?: AgentSessionListItem[] }>('/api/agent/sessions', {
    student_id: studentId,
    limit,
  })
  return (env.data as { sessions?: AgentSessionListItem[] } | undefined)?.sessions ?? []
}

export async function archiveSession(sessionId: string): Promise<boolean> {
  if (getApiMode() === 'mock') return true
  const env = await httpPost<{ archived?: boolean }>(
    `/api/agent/session/${encodeURIComponent(sessionId)}/archive`,
    {},
  )
  return Boolean((env.data as { archived?: boolean } | undefined)?.archived)
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  if (getApiMode() === 'mock') {
    if (agentSessionId === sessionId) agentSessionId = null
    return true
  }
  await httpDelete(`/api/agent/session/${encodeURIComponent(sessionId)}`)
  if (agentSessionId === sessionId) agentSessionId = null
  return true
}
