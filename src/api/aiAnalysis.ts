import type { ReportRecord, AIAnalysisResult, TargetRole } from '@/types'
import { generateMockAnalysis, generateMockCareerSuggestions } from '@/mock/aiAnalysis'
import { getApiMode } from './config'
import { httpPost } from './adapters/httpAdapter'

export async function getCareerSuggestions(
  userId: string,
  targetRoles: TargetRole[],
): Promise<string[]> {
  if (getApiMode() === 'mock') {
    return generateMockCareerSuggestions(targetRoles)
  }

  const env = await httpPost<string[]>('/api/agent/career-suggestions', {
    userId,
    targetRoles,
  })
  return env.data ?? []
}

export async function analyzeReports(
  userId: string,
  records: ReportRecord[],
  targetRoles: TargetRole[] = [],
): Promise<AIAnalysisResult> {
  if (getApiMode() === 'mock') {
    const careerSuggestions = await getCareerSuggestions(userId, targetRoles)
    return generateMockAnalysis(userId, records, careerSuggestions, targetRoles)
  }

  const env = await httpPost<AIAnalysisResult>('/api/ai/growth-analysis', {
    userId,
    reportIds: records.map((r) => r.id),
    snapshots: records.map((r) => r.snapshot),
    targetRoles,
  })
  if (!env.data) {
    throw new Error(env.error || 'growth-analysis returned empty data')
  }
  return env.data
}
