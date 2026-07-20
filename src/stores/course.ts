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
import { getProgress, listCourses } from '@/api/learning'

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

    function mapApiCourse(row: Record<string, unknown>): Course {
      const id = String(row.course_id ?? row.id ?? `course_${Date.now()}`)
      const categoryName = String(row.category ?? row.category_id ?? '其他')
      let categoryId = categories.value.find(c => c.name === categoryName || c.id === categoryName)?.id
      if (!categoryId) {
        categoryId = `cat_api_${categoryName}`
        if (!categories.value.some(c => c.id === categoryId)) {
          categories.value.push({ id: categoryId, name: categoryName })
        }
      }
      const existing = courses.value.find(c => c.id === id)
      if (existing) {
        return {
          ...existing,
          title: String(row.title ?? existing.title),
          description: String(row.description ?? existing.description),
          categoryId,
        }
      }
      return {
        id,
        title: String(row.title ?? id),
        description: String(row.description ?? ''),
        cover: '',
        categoryId,
        teacherId: 'teacher_api',
        teacherName: '职导星图',
        chapters: [],
        status: 'published',
        createdAt: String(row.created_at ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        totalDuration: 0,
        studentCount: 0,
        rating: 4.5,
      }
    }

    /** Merge backend/fixture courses + progress into store (keeps local careerCourses). */
    async function loadFromApi(userId: string = CURRENT_USER_ID): Promise<void> {
      try {
        const env = await listCourses({ limit: 50 })
        const payload = env.data as { courses?: Record<string, unknown>[] } | Record<string, unknown>[] | undefined
        const rows = Array.isArray(payload)
          ? payload
          : (payload?.courses ?? [])
        const mapped = rows.map(mapApiCourse)
        for (const course of mapped) {
          const idx = courses.value.findIndex(c => c.id === course.id)
          if (idx === -1) courses.value.push(course)
          else courses.value[idx] = { ...courses.value[idx], ...course }
        }
      } catch (e) {
        console.warn('[course] listCourses failed', e)
      }

      try {
        const env = await getProgress(userId)
        const rows = (env.data as Record<string, unknown>[] | undefined) ?? []
        for (const row of rows) {
          const userIdRow = String(row.user_id ?? userId)
          const courseId = String(row.course_id ?? '')
          const chapterId = String(row.chapter_id ?? '1')
          if (!courseId) continue
          updateProgress(userIdRow, courseId, chapterId, {
            progress: Number(row.progress ?? 0),
            lastPosition: Number(row.last_position ?? 0),
            completed: Boolean(row.completed),
          })
        }
      } catch (e) {
        console.warn('[course] getProgress failed', e)
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
      loadFromApi,
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
