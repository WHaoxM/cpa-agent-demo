import type { ReportRecord } from '@/types'
import {
  fetchCareerReport,
  fetchCareerReportList,
  generateCareerReport,
  type CareerReportDetailData,
  type CareerReportListItem,
} from '@/api/backend'

const DEFAULT_STUDENT_ID = 'student_demo_001'
const DEFAULT_JOB_PORTRAIT_ID = 'portrait_frontend_001'

function normalizeDate(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10)
  const direct = value.match(/\d{4}-\d{2}-\d{2}/)?.[0]
  if (direct) return direct
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function reportJsonSnapshot(reportJson: unknown): Record<string, unknown> {
  return asRecord(asRecord(reportJson).snapshot)
}

function mapListItem(item: CareerReportListItem): ReportRecord {
  return {
    id: item.report_id,
    type: 'career',
    createdAt: normalizeDate(item.created_at),
    title: item.title || 'Career development report',
    snapshot: {
      status: item.status,
      studentId: item.student_id,
      jobPortraitId: item.job_portrait_id,
      elapsedSeconds: item.elapsed_seconds,
    },
  }
}

function mapDetail(item: CareerReportDetailData): ReportRecord {
  const snapshot = reportJsonSnapshot(item.report_json)
  const chapters = asRecord(item.chapters)
  const reportTitle = asRecord(item.report_json).title
  return {
    id: item.report_id,
    type: 'career',
    createdAt: normalizeDate(item.created_at),
    title: item.title || (typeof reportTitle === 'string' ? reportTitle : '') || 'Career development report',
    snapshot: {
      ...snapshot,
      status: item.status,
      studentId: item.student_id,
      studentName: item.student_name,
      school: item.school,
      jobPortraitId: item.job_portrait_id,
      positionName: item.position_name,
      chapters,
    },
  }
}

export async function getReportList(userId?: string): Promise<ReportRecord[]> {
  const response = await fetchCareerReportList(userId)
  return (response.data || []).map(mapListItem)
}

export async function createReport(data: Omit<ReportRecord, 'id' | 'createdAt'>): Promise<ReportRecord> {
  const snapshot = asRecord(data.snapshot)
  const studentId = String(snapshot.studentId || snapshot.student_id || DEFAULT_STUDENT_ID)
  const jobPortraitId = String(
    snapshot.jobPortraitId
      || snapshot.job_portrait_id
      || snapshot.selectedJobId
      || DEFAULT_JOB_PORTRAIT_ID,
  )

  const response = await generateCareerReport({
    student_id: studentId,
    job_portrait_id: jobPortraitId,
    title: data.title,
    type: data.type,
    snapshot,
  })

  const report = asRecord(response.data?.report)
  return {
    ...data,
    id: response.data?.report_id || `report_${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
    snapshot: {
      ...snapshot,
      ...reportJsonSnapshot(report),
      status: response.data?.status,
      source: response.data?.source,
      jobPortraitId,
      studentId,
    },
  }
}

export async function deleteReport(id: string): Promise<void> {
  void id
}

export async function getReportDetail(id: string): Promise<ReportRecord | null> {
  const response = await fetchCareerReport(id)
  return response.data ? mapDetail(response.data) : null
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
