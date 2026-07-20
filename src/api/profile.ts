import { getApiMode } from './config'
import { mockGet } from './adapters/mockAdapter'
import { httpGet } from './adapters/httpAdapter'

export async function getStudent4d(studentId: string, targetJobId?: string) {
  if (getApiMode() === 'mock') {
    return mockGet(`profile/student.4d.${studentId}.json`)
  }
  return httpGet(`/api/profile/student/${encodeURIComponent(studentId)}/4d`, {
    target_job_id: targetJobId,
  })
}

export async function getJobPortrait(portraitId: string) {
  if (getApiMode() === 'mock') {
    return mockGet(`profile/job.${portraitId}.json`)
  }
  return httpGet(`/api/profile/job/${encodeURIComponent(portraitId)}`)
}

export async function getStudentProfile(studentId: string) {
  if (getApiMode() === 'mock') {
    // Reuse 4d fixture envelope shape if dedicated detail missing
    return mockGet(`profile/student.4d.${studentId}.json`)
  }
  return httpGet(`/api/profile/student/${encodeURIComponent(studentId)}`)
}
