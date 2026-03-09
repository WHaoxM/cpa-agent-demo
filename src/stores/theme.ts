import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeName = 'crystal' | 'warm' | 'xuanZhi' | 'sunset' | 'classicWhite' | 'night'

export const useThemeStore = defineStore(
  'theme',
  () => {
  const theme = ref<ThemeName>('xuanZhi')

  const themeLabel = computed(() => {
    switch (theme.value) {
      case 'crystal':
        return '水晶'
      case 'warm':
        return '温暖'
      case 'sunset':
        return '落日'
      case 'classicWhite':
        return '经典白'
      case 'night':
        return '夜晚'
      default:
        return '宣纸'
    }
  })

  function setTheme(next: ThemeName) {
    theme.value = next
    document.documentElement.dataset.theme = next
  }

  function initTheme() {
    document.documentElement.dataset.theme = theme.value
  }

  return { theme, themeLabel, setTheme, initTheme }
  },
  { persist: true },
)
