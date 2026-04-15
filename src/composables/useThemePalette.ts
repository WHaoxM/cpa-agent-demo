/**
 * 主题调色板 composable — 读取当前 CSS 变量生成调色板对象，供图表/组件使用
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

export type ThemePalette = {
  primary: string
  primarySoft: string
  accent: string
  accentSoft: string
  text: string
  textMuted: string
  bg1: string
  bg2: string
  bg3: string
}

function readVar(name: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return v.trim() || ''
}

export function useThemePalette() {
  const palette = ref<ThemePalette>({
    primary: '',
    primarySoft: '',
    accent: '',
    accentSoft: '',
    text: '',
    textMuted: '',
    bg1: '',
    bg2: '',
    bg3: '',
  })

  const refresh = () => {
    palette.value = {
      primary: readVar('--primary-100'),
      primarySoft: readVar('--primary-200'),
      accent: readVar('--accent-100'),
      accentSoft: readVar('--accent-200'),
      text: readVar('--text-100'),
      textMuted: readVar('--text-200'),
      bg1: readVar('--bg-100'),
      bg2: readVar('--bg-200'),
      bg3: readVar('--bg-300'),
    }
  }

  let observer: MutationObserver | null = null

  onMounted(() => {
    refresh()
    observer = new MutationObserver(() => refresh())
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { palette, refresh }
}
