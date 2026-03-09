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

export const useCourseStore = defineStore(
  'course',
  () => {
    // State
    const courses = ref<Course[]>([...mockCourses])
    const categories = ref<Category[]>([...mockCategories])
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
    }
  },
  {
    persist: {
      key: 'course-store',
      storage: localStorage,
      paths: ['progress', 'favorites'],
    },
  },
)
