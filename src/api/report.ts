import type { ReportRecord } from '@/types'

export async function getReportList(userId?: string): Promise<ReportRecord[]> {
  // [API] GET /api/reports?userId={userId}
  // TODO: 接入后端后替换为 axios.get('/api/reports', { params: { userId } })
  void userId
  return []
}

export async function createReport(data: Omit<ReportRecord, 'id' | 'createdAt'>): Promise<ReportRecord> {
  // [API] POST /api/reports
  // TODO: 接入后端后替换为 axios.post('/api/reports', data)
  return {
    ...data,
    id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString().slice(0, 10),
  }
}

export async function deleteReport(id: string): Promise<void> {
  // [API] DELETE /api/reports/:id
  // TODO: 接入后端后替换为 axios.delete(`/api/reports/${id}`)
  void id
}

export async function getReportDetail(id: string): Promise<ReportRecord | null> {
  // [API] GET /api/reports/:id
  // TODO: 接入后端后替换为 axios.get(`/api/reports/${id}`)
  void id
  return null
}

export async function fetchPortraitReports(): Promise<ReportRecord[]> {
  const all = await getReportList()
  return all.filter(item => item.type === 'portrait')
}

export async function fetchCareerReports(): Promise<ReportRecord[]> {
  const all = await getReportList()
  return all.filter(item => item.type === 'career')
}

export async function fetchReportDetail(id: string): Promise<ReportRecord | null> {
  return getReportDetail(id)
}
