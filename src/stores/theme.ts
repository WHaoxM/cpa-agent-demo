import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeName = 'classical'

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref<ThemeName>('classical')
    const themeLabel = ref('古籍')

    function setTheme(_next?: string) {
      theme.value = 'classical'
      document.documentElement.dataset.theme = 'classical'
    }

    function initTheme() {
      document.documentElement.dataset.theme = 'classical'
    }

    return { theme, themeLabel, setTheme, initTheme }
  },
  { persist: true },
)
