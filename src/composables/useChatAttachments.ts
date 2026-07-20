import { computed, ref } from 'vue'
import { getApiMode } from '@/api/config'
import { uploadAgentFile, type AgentFileMeta } from '@/api/agentMedia'

export type ChatAttachmentStatus = 'reading' | 'ready' | 'error'

export type ChatAttachment = {
  id: string
  name: string
  size: number
  mime: string
  status: ChatAttachmentStatus
  excerpt: string
  /** Claude/Qoder file_id — never ship fullText in chat message */
  fileId?: string
  error?: string
}

const TEXT_EXTS = new Set(['txt', 'md', 'markdown', 'json', 'csv', 'log', 'yml', 'yaml'])
const PARSE_EXTS = new Set(['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'bmp', 'webp', 'tiff'])
const EXCERPT_CHARS = 280

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

/**
 * Composer attachments: upload → file_id → mount on session.
 * Anti-pattern removed: dumping fullText into message string.
 */
export function useChatAttachments() {
  const attachments = ref<ChatAttachment[]>([])
  const busy = computed(() => attachments.value.some(a => a.status === 'reading'))

  async function addFiles(
    fileList: FileList | File[],
    opts?: { studentId?: string; sessionId?: string | null },
  ) {
    const files = Array.from(fileList)
    for (const file of files) {
      const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const row: ChatAttachment = {
        id,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        status: 'reading',
        excerpt: '',
      }
      attachments.value.push(row)
      try {
        const ext = extOf(file.name)
        if (!TEXT_EXTS.has(ext) && !PARSE_EXTS.has(ext) && !file.type.startsWith('text/')) {
          throw new Error(`不支持的文件类型：.${ext || 'unknown'}`)
        }

        if (getApiMode() === 'mock') {
          row.fileId = `mock_${id}`
          row.excerpt = `【演示】已接收「${file.name}」（${Math.round(file.size / 1024)} KB），http 模式将走 Files 入库。`
          row.status = 'ready'
          continue
        }

        const meta: AgentFileMeta = await uploadAgentFile(file, {
          studentId: opts?.studentId,
          sessionId: opts?.sessionId || undefined,
        })
        // Claude: file_id is assigned even if ingest fails — keep id for diagnostics
        row.fileId = meta.file_id
        if (meta.status === 'failed') {
          row.status = 'error'
          row.error = meta.error || '文件已入库但文本解析失败，请换 PDF/DOCX/TXT'
          row.excerpt = (meta.excerpt || '').slice(0, EXCERPT_CHARS)
          continue
        }
        if (meta.status === 'ingesting') {
          // uploadAgentFile should have polled to ready|failed; lingering = error
          row.status = 'error'
          row.error = '文本仍在解析中，请稍后重试上传'
          row.fileId = meta.file_id
          continue
        }
        if (meta.status !== 'ready') {
          row.status = 'error'
          row.error = `未知文件状态: ${meta.status || 'empty'}`
          continue
        }
        row.excerpt = (meta.excerpt || meta.filename || file.name).slice(0, EXCERPT_CHARS)
        row.status = 'ready'
      } catch (e) {
        row.status = 'error'
        row.error = e instanceof Error ? e.message : '附件上传失败'
      }
    }
  }

  function removeAttachment(id: string) {
    attachments.value = attachments.value.filter(a => a.id !== id)
  }

  function clearAttachments() {
    attachments.value = []
  }

  /** @deprecated full-text prefix — do not use; kept empty for safety */
  function buildContextBlock(): string {
    return ''
  }

  function readyFileIds(): string[] {
    return attachments.value
      .filter(a => a.status === 'ready' && a.fileId)
      .map(a => a.fileId!)
  }

  function readyCount(): number {
    return attachments.value.filter(a => a.status === 'ready').length
  }

  return {
    attachments,
    busy,
    addFiles,
    removeAttachment,
    clearAttachments,
    buildContextBlock,
    readyFileIds,
    readyCount,
  }
}
