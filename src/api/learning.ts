import { getApiMode } from './config'
import { mockGet, mockMutate } from './adapters/mockAdapter'
import { httpGet, httpPost } from './adapters/httpAdapter'

export async function listCourses(params?: { category?: string; limit?: number; offset?: number }) {
  if (getApiMode() === 'mock') {
    return mockGet('learning/courses.list.json')
  }
  return httpGet('/api/learning/courses', params)
}

export async function getCourse(courseId: string) {
  if (getApiMode() === 'mock') {
    return mockGet(`learning/courses.${courseId}.json`)
  }
  return httpGet(`/api/learning/courses/${encodeURIComponent(courseId)}`)
}

export async function getProgress(userId: string) {
  if (getApiMode() === 'mock') {
    return mockGet('learning/progress.list.json')
  }
  return httpGet(`/api/learning/learning/progress/${encodeURIComponent(userId)}`)
}

export async function saveProgress(body: {
  user_id: string
  course_id: string
  chapter_id: string
  progress: number
  completed?: boolean
}) {
  if (getApiMode() === 'mock') {
    return mockMutate('learning/progress.write.ok.json')
  }
  return httpPost('/api/learning/learning/progress', body)
}
