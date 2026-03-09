import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthUser } from '@/types'
import { UserRole } from '@/types'
import { mockUsers } from '@/mock/data'

export const useUserStore = defineStore(
  'user',
  () => {
    // State
    const currentUser = ref<User | null>(null)
    const token = ref<string>('')
    const isLoggedIn = computed(() => !!currentUser.value && !!token.value)

    // Getters
    const userRole = computed(() => currentUser.value?.role || null)
    const isStudent = computed(() => currentUser.value?.role === UserRole.STUDENT)
    const isTeacher = computed(() => currentUser.value?.role === UserRole.TEACHER)
    const isAdmin = computed(() => currentUser.value?.role === UserRole.ADMIN)

    // Actions
    function login(username: string, password: string, role?: UserRole): boolean {
      // 模拟登录验证
      const user = mockUsers.find(u => {
        if (role && u.role !== role) return false
        return u.username === username
      })

      if (user && password === '123456') {
        currentUser.value = user
        token.value = `mock_token_${user.id}_${Date.now()}`
        return true
      }
      return false
    }

    function loginByRole(role: UserRole): boolean {
      const user = mockUsers.find(u => u.role === role)
      if (user) {
        currentUser.value = user
        token.value = `mock_token_${user.id}_${Date.now()}`
        return true
      }
      return false
    }

    function logout(): void {
      currentUser.value = null
      token.value = ''
    }

    function updateUserInfo(info: Partial<User>): void {
      if (currentUser.value) {
        currentUser.value = { ...currentUser.value, ...info }
      }
    }

    function setUserStatus(status: 'active' | 'disabled'): void {
      if (currentUser.value) {
        currentUser.value.status = status
      }
    }

    return {
      currentUser,
      token,
      isLoggedIn,
      userRole,
      isStudent,
      isTeacher,
      isAdmin,
      login,
      loginByRole,
      logout,
      updateUserInfo,
      setUserStatus,
    }
  },
  {
    persist: {
      key: 'user-store',
      storage: localStorage,
      paths: ['currentUser', 'token'],
    },
  },
)
