import type { ReportRecord } from '@/types'
import { getApiMode, DEMO_STUDENT_ID } from './config'
import { mockGet, mockMutate } from './adapters/mockAdapter'
import { httpGet, httpPost } from './adapters/httpAdapter'
import { mapReportRecord } from './mappers'

export async function getReportList(userId?: string): Promise<ReportRecord[]> {
  const studentId = userId || DEMO_STUDENT_ID
  if (getApiMode() === 'mock') {
    const env = await mockGet(`report/list.${studentId}.json`)
    return (env.data as unknown[] | undefined)?.map(mapReportRecord) ?? []
  }
  const env = await httpGet('/api/report/list', { student_id: studentId })
  return (env.data as unknown[] | undefined)?.map(mapReportRecord) ?? []
}

export async function getReportDetail(id: string): Promise<ReportRecord | null> {
  if (getApiMode() === 'mock') {
    try {
      const env = await mockGet(`report/detail.${id}.json`)
      return env.data ? mapReportRecord(env.data) : null
    } catch {
      return null
    }
  }
  const env = await httpGet(`/api/report/${encodeURIComponent(id)}`)
  return env.data ? mapReportRecord(env.data) : null
}

/**
 * Local/demo create: mock returns a synthetic id.
 * Real generate is heavy-excluded — do not call POST /api/report/generate here.
 */
export async function createReport(
  data: Omit<ReportRecord, 'id' | 'createdAt'>,
): Promise<ReportRecord> {
  if (getApiMode() === 'mock') {
    await mockMutate('report/list.student_001.json')
  }
  return {
    ...data,
    id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString().slice(0, 10),
  }
}

/** Backend has no delete route yet — local no-op / optimistic UI. */
export async function deleteReport(id: string): Promise<void> {
  void id
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

/** Explicit heavy path — callers must opt in; not used by default UI. */
export async function generateReportHeavy(body: {
  student_id: string
  job_portrait_id: string
  title?: string
  type?: string
}) {
  if (getApiMode() === 'mock') {
    return {
      success: true,
      data: { report_id: 'report_mock_new', status: 'pending' },
    }
  }
  return httpPost('/api/report/generate', body)
}
