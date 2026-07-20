import { onBeforeUnmount, ref } from 'vue'
import { finalizeVoiceTurn, startVoiceTurn } from '@/api/agentMedia'
import { getApiMode } from '@/api/config'

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error?: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal?: boolean
    0: { transcript: string; confidence?: number }
  }>
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

/**
 * Voice Turn adapter: browser Web Speech is one STT provider, not the architecture.
 * Creates / finalizes server VoiceTurn when http mode is on.
 */
export function useSpeechInput(opts?: {
  lang?: string
  onResult?: (text: string) => void
  onInterim?: (text: string) => void
  getSessionId?: () => string | null | undefined
  getStudentId?: () => string | undefined
}) {
  const supported = !!getRecognitionCtor()
  const listening = ref(false)
  const error = ref<string | null>(null)
  const turnId = ref<string | null>(null)
  const interim = ref('')
  let recognition: SpeechRecognitionLike | null = null

  function stop() {
    if (!recognition) return
    try { recognition.stop() } catch { /* ignore */ }
    listening.value = false
  }

  async function start() {
    error.value = null
    interim.value = ''
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      error.value = '当前浏览器不支持语音输入'
      return
    }
    if (listening.value) {
      stop()
      return
    }

    turnId.value = null
    if (getApiMode() === 'http') {
      try {
        const turn = await startVoiceTurn({
          sessionId: opts?.getSessionId?.() || null,
          studentId: opts?.getStudentId?.(),
          lang: opts?.lang || 'zh-CN',
        })
        turnId.value = turn.turn_id
      } catch {
        // still allow local STT; turn optional
      }
    }

    recognition = new Ctor()
    recognition.lang = opts?.lang || 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    let finalBuf = ''

    recognition.onresult = (ev) => {
      let interimText = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const row = ev.results[i]
        const t = row?.[0]?.transcript || ''
        if (row?.isFinal) {
          finalBuf = `${finalBuf}${t}`.trim()
        } else {
          interimText += t
        }
      }
      interim.value = interimText
      if (interimText) opts?.onInterim?.(interimText)
    }
    recognition.onerror = (ev) => {
      error.value = ev.error === 'not-allowed'
        ? '麦克风权限被拒绝'
        : (ev.error || '语音识别失败')
      listening.value = false
      if (turnId.value && getApiMode() === 'http') {
        finalizeVoiceTurn(turnId.value, {
          transcript: '',
          is_final: true,
        }).catch(() => {})
      }
    }
    recognition.onend = () => {
      listening.value = false
      const text = (finalBuf || interim.value).trim()
      interim.value = ''
      const tid = turnId.value
      if (!text) {
        if (tid && getApiMode() === 'http') {
          finalizeVoiceTurn(tid, { transcript: '', is_final: true }).catch(() => {})
        }
        return
      }
      if (tid && getApiMode() === 'http') {
        finalizeVoiceTurn(tid, {
          transcript: text,
          is_final: true,
        }).then(() => {
          opts?.onResult?.(text)
        }).catch(() => {
          opts?.onResult?.(text)
        })
      } else {
        opts?.onResult?.(text)
      }
    }

    try {
      recognition.start()
      listening.value = true
    } catch {
      error.value = '无法启动语音识别'
      listening.value = false
      if (turnId.value && getApiMode() === 'http') {
        finalizeVoiceTurn(turnId.value, { transcript: '', is_final: true }).catch(() => {})
      }
      turnId.value = null
    }
  }

  function toggle() {
    if (listening.value) stop()
    else void start()
  }

  onBeforeUnmount(() => {
    stop()
    recognition = null
  })

  return {
    supported,
    listening,
    error,
    interim,
    turnId,
    start,
    stop,
    toggle,
  }
}
