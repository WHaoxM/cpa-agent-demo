import { getApiMode } from './config'
import { mockGet } from './adapters/mockAdapter'
import { httpGet } from './adapters/httpAdapter'
import type { CourseSystemData } from '@/composables/useCourseSystem'

/** `/api/learning/course-system-graph` — http 直连；mock 读 fixtures。 */
export async function fetchCourseSystemGraph(
  role: string,
  variant: 'course' | 'skill' = 'course',
): Promise<CourseSystemData | null> {
  if (getApiMode() === 'mock') {
    try {
      const env = await mockGet<CourseSystemData>('learning/course-system.graph.json')
      const data = env.data
      if (data?.nodes?.length) {
        return {
          nodes: data.nodes,
          edges: data.edges ?? [],
          courseNodes: data.courseNodes ?? [],
          skillCourseEdges: data.skillCourseEdges ?? [],
        }
      }
    } catch {
      return null
    }
    return null
  }

  try {
    const env = await httpGet<CourseSystemData>('/api/learning/course-system-graph', {
      role,
      variant,
    })
    if (env.data?.nodes) {
      return {
        nodes: env.data.nodes,
        edges: env.data.edges ?? [],
        courseNodes: env.data.courseNodes ?? [],
        skillCourseEdges: env.data.skillCourseEdges ?? [],
      }
    }
  } catch {
    /* backend-gap */
  }
  return null
}
