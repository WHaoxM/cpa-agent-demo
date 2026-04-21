// 报告记录（存入 reportStore）
export interface ReportRecord {
  id: string
  type: 'portrait' | 'career'
  createdAt: string
  title: string
  snapshot: Record<string, unknown>
}
