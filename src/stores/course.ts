// @ts-nocheck
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course, LearningProgress, Category } from '@/types'
import {
  mockCourses,
  mockCategories,
  mockLearningProgress,
  mockUsers,
  CURRENT_USER_ID,
} from '@/mock/data'
import { careerCourses, careerCategories } from '@/mock/careerCourses'
import { fetchCourses, fetchLearningProgress } from '@/api/backend'

export const useCourseStore = defineStore(
  'course',
  () => {
    // State
    const courses = ref<Course[]>([...mockCourses, ...careerCourses])
    const categories = ref<Category[]>([...mockCategories, ...careerCategories])
    const progress = ref<LearningProgress[]>([...mockLearningProgress])
    const favorites = ref<string[]>([])

    // Getters
    const publishedCourses = computed(() =>
      courses.value.filter(c => c.status === 'published'),
    )

    const coursesByCategory = computed(() => {
      const result: Record<string, Course[]> = {}
      categories.value.forEach(cat => {
        result[cat.id] = courses.value.filter(c => c.categoryId === cat.id)
      })
      return result
    })

    const getCourseById = computed(() => (id: string) => {
      return courses.value.find(c => c.id === id)
    })

    const getUserProgress = computed(() => (userId: string, courseId?: string) => {
      let result = progress.value.filter(p => p.userId === userId)
      if (courseId) {
        result = result.filter(p => p.courseId === courseId)
      }
      return result
    })

    const isCourseFavorite = computed(() => (courseId: string) => {
      return favorites.value.includes(courseId)
    })

    const userFavorites = computed(() => {
      return courses.value.filter(c => favorites.value.includes(c.id))
    })

    const getChapterProgress = computed(() => (userId: string, chapterId: string) => {
      return progress.value.find(p => p.userId === userId && p.chapterId === chapterId)
    })

    // Actions
    function addCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Course {
      const newCourse: Course = {
        ...course,
        id: `course_${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        status: 'under_review',
      }
      courses.value.push(newCourse)
      return newCourse
    }

    function updateCourse(id: string, data: Partial<Course>): boolean {
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        courses.value[index] = {
          ...courses.value[index],
          ...data,
          updatedAt: new Date().toISOString().split('T')[0],
        }
        return true
      }
      return false
    }

    function deleteCourse(id: string): boolean {
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        courses.value.splice(index, 1)
        return true
      }
      return false
    }

    function updateCourseStatus(id: string, status: Course['status']): boolean {
      return updateCourse(id, { status })
    }

    function toggleFavorite(courseId: string): void {
      const index = favorites.value.indexOf(courseId)
      if (index !== -1) {
        favorites.value.splice(index, 1)
      } else {
        favorites.value.push(courseId)
      }
    }

    function updateProgress(
      userId: string,
      courseId: string,
      chapterId: string,
      data: Partial<LearningProgress>,
    ): void {
      const index = progress.value.findIndex(
        p => p.userId === userId && p.chapterId === chapterId,
      )

      const now = new Date().toISOString().replace('T', ' ').substring(0, 16)

      if (index !== -1) {
        progress.value[index] = {
          ...progress.value[index],
          ...data,
          updatedAt: now,
        }
      } else {
        progress.value.push({
          userId,
          courseId,
          chapterId,
          progress: data.progress || 0,
          lastPosition: data.lastPosition || 0,
          completed: data.completed || false,
          updatedAt: now,
        })
      }
    }

    function getStudentsByCourse(courseId: string) {
      const studentIds = progress.value
        .filter(p => p.courseId === courseId)
        .map(p => p.userId)
      return mockUsers.filter(u => studentIds.includes(u.id) && u.role === 'student')
    }

    /* 从后端同步课程列表（合并到现有 mock，去重 by title）。失败时保留 mock。 */
    async function syncFromBackend(): Promise<void> {
      try {
        const resp = await fetchCourses(undefined, 50)
        if (resp.success && resp.data?.courses?.length) {
          const existingTitles = new Set(courses.value.map(c => c.title))
          const backendCourses: Course[] = resp.data.courses
            .filter(item => item.title && !existingTitles.has(item.title))
            .map(item => ({
              id: item.course_id || `backend_${item.id}`,
              title: item.title,
              description: item.description || '',
              cover: item.thumbnail_url || '',
              categoryId: item.category || 'foundation',
              teacherId: '',
              teacherName: item.instructor || '未知讲师',
              chapters: [],
              status: 'published' as const,
              createdAt: (item.created_at || '').slice(0, 10),
              updatedAt: (item.updated_at || '').slice(0, 10),
              totalDuration: Math.round((item.duration_hours || 0) * 60),
              studentCount: 0,
              rating: 0,
              skillTags: [],
            }))
          if (backendCourses.length > 0) {
            courses.value.push(...backendCourses)
          }
        }
      } catch {
        // 后端不可用时保留 mock 数据
      }
    }

    /* 从后端同步学习进度（合并到现有 mock，去重 By chapterId）。失败时保留本地。 */
    async function syncProgressFromBackend(userId: string): Promise<void> {
      try {
        const resp = await fetchLearningProgress(userId)
        if (resp.success && resp.data && resp.data.length > 0) {
          const existing = new Set(progress.value.map(p => p.chapterId))
          const backendProgress: LearningProgress[] = resp.data
            .filter(item => item.chapter_id && !existing.has(item.chapter_id))
            .map(item => ({
              userId: item.user_id,
              courseId: item.course_id,
              chapterId: item.chapter_id,
              progress: item.progress || 0,
              lastPosition: item.last_position || 0,
              completed: Boolean(item.completed),
              updatedAt: item.updated_at || '',
            }))
          if (backendProgress.length > 0) {
            progress.value.push(...backendProgress)
          }
        }
      } catch {
        // 后端不可用时保留本地进度
      }
    }

    return {
      courses,
      categories,
      progress,
      favorites,
      publishedCourses,
      coursesByCategory,
      getCourseById,
      getUserProgress,
      isCourseFavorite,
      userFavorites,
      getChapterProgress,
      addCourse,
      updateCourse,
      deleteCourse,
      updateCourseStatus,
      toggleFavorite,
      updateProgress,
      getStudentsByCourse,
      syncFromBackend,
      syncProgressFromBackend,
    }
  },
  {
    persist: {
      key: 'course-store',
      storage: localStorage,
      pick: ['progress', 'favorites'],
    },
  },
)
