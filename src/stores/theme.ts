import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeName = 'modern'

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref<ThemeName>('modern')
    const themeLabel = ref('现代')

    function setTheme(_next?: string) {
      theme.value = 'modern'
      document.documentElement.dataset.theme = 'modern'
    }

    function initTheme() {
      document.documentElement.dataset.theme = 'modern'
    }

    return { theme, themeLabel, setTheme, initTheme }
  },
  { persist: true },
)
