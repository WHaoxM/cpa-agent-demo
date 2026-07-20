export type ApiMode = 'mock' | 'http'

export function getApiMode(): ApiMode {
  // 开发默认 http（见 .env.development）；生产构建未设时仍可 mock（Pages）
  const raw = (import.meta.env.VITE_API_MODE ?? 'http').toLowerCase()
  return raw === 'mock' ? 'mock' : 'http'
}

/**
 * Backend origin without trailing slash.
 * - Empty / unset in http mode → same-origin relative `/api/...`（经 Vite proxy，端口由 VITE_API_PROXY_TARGET 决定）
 * - Absolute URL → 直连该 origin（可任意 host:port）
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw === undefined || raw === null) {
    // http 默认走代理；mock 不使用此值
    return getApiMode() === 'http' ? '' : 'http://127.0.0.1:5001'
  }
  const trimmed = String(raw).trim()
  if (trimmed === '' || trimmed === '/' || trimmed === '.') {
    return ''
  }
  return trimmed.replace(/\/$/, '')
}

/** Vite BASE_URL always ends with `/`. */
export function getPublicBaseUrl(): string {
  return import.meta.env.BASE_URL || '/'
}

export const DEMO_STUDENT_ID = 'student_001'
