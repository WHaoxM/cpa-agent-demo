import { getApiMode } from './config'
import { mockGet, mockMutate } from './adapters/mockAdapter'
import { httpGet, httpPost, httpDelete } from './adapters/httpAdapter'

export type InboxMessage = {
  id: string
  title: string
  content: string
  time: string
  type: string
  read: boolean
}

type ApiMsg = {
  id: string
  title: string
  body?: string
  content?: string
  type?: string
  read?: boolean
  created_at?: string
  time?: string
}

function mapMsg(row: ApiMsg): InboxMessage {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    content: String(row.content ?? row.body ?? ''),
    time: String(row.time ?? row.created_at ?? ''),
    type: String(row.type ?? '系统消息'),
    read: Boolean(row.read),
  }
}

/** `/api/messages` — http 直连；mock 读 fixtures。 */
export async function listMessages(userId: string): Promise<InboxMessage[]> {
  if (getApiMode() === 'mock') {
    const env = await mockGet<ApiMsg[]>('home/messages.list.json')
    return (env.data ?? []).map(mapMsg)
  }
  try {
    const env = await httpGet<ApiMsg[]>('/api/messages', { user_id: userId })
    return (env.data ?? []).map(mapMsg)
  } catch (e) {
    // http 模式不再静默灌 fixture
    throw e
  }
}

export async function markMessageRead(id: string, userId?: string): Promise<void> {
  if (getApiMode() === 'mock') {
    await mockMutate('home/messages.list.json')
    return
  }
  try {
    await httpPost(`/api/messages/${encodeURIComponent(id)}/read`, {}, userId ? { user_id: userId } : undefined)
  } catch {
    /* local-only mark */
  }
}

export async function deleteMessage(id: string, userId?: string): Promise<void> {
  if (getApiMode() === 'mock') {
    await mockMutate('home/messages.list.json')
    return
  }
  try {
    await httpDelete(`/api/messages/${encodeURIComponent(id)}`, userId ? { user_id: userId } : undefined)
  } catch {
    /* local-only */
  }
}
