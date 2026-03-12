import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const availableThemes = ['xuanZhi', 'classicWhite', 'crystal', 'night', 'cyberNexus'] as const
export type ThemeName = (typeof availableThemes)[number]
const allowedThemeSet = new Set<ThemeName>(availableThemes)
const fallbackTheme: ThemeName = 'xuanZhi'

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref<ThemeName>(fallbackTheme)

    const themeLabel = computed(() => {
      switch (theme.value) {
        case 'crystal':
          return '石墨蓝图'
        case 'classicWhite':
          return '米白晨读'
        case 'night':
          return '松烟夜读'
        case 'cyberNexus':
          return '赛博枢纽'
        default:
          return '宣纸理性'
      }
    })

    function normalizeTheme(value: string | undefined): ThemeName {
      if (value && allowedThemeSet.has(value as ThemeName)) {
        return value as ThemeName
      }
      return fallbackTheme
    }

    function setTheme(next: ThemeName) {
      const safeTheme = normalizeTheme(next)
      if (theme.value !== safeTheme) {
        theme.value = safeTheme
      }
      document.documentElement.dataset.theme = safeTheme
    }

    function initTheme() {
      const safeTheme = normalizeTheme(theme.value as string)
      if (safeTheme !== theme.value) {
        theme.value = safeTheme
      }
      document.documentElement.dataset.theme = safeTheme
    }

    return { theme, themeLabel, setTheme, initTheme }
  },
  { persist: true },
)
