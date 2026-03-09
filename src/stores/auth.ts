import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import jiImg from '@/assets/ji.png'

export type UserInfo = {
  id: string
  nickname: string
  account: string
  avatar: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)

  const isAuthed = computed(() => Boolean(user.value))

  function login(account: string, _password: string) {
    user.value = {
      id: 'u_001',
      nickname: '御名方守矢',
      account,
      avatar: jiImg,
    }
  }

  function logout() {
    user.value = null
  }

  return { user, isAuthed, login, logout }
})
