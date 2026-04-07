/**
 * usePattern — 中国传统纹样工具 composable
 *
 * 用法一：直接拿 CSS 变量对象，绑到 style
 *   const { patternStyle } = usePattern('hui', { opacity: 0.07, size: '40px' })
 *   <div :style="patternStyle" />
 *
 * 用法二：拿 class 字符串组合，绑到 class
 *   const { patternClass } = usePattern('diamond', { level: 'mid' })
 *   <div :class="['my-card', patternClass]" />
 *
 * 用法三：响应式切换纹样
 *   const { current, setPattern } = usePattern()
 *   setPattern('cloud')
 */

import { ref, computed, type CSSProperties } from 'vue'

// ── 支持的纹样类型 ──
export type PatternName =
  | 'hui'         // 回纹
  | 'tortoise'    // 龟背纹
  | 'fish-scale'  // 鱼鳞纹
  | 'diamond'     // 菱格纹
  | 'wan-zi'      // 万字纹
  | 'cloud'       // 云纹
  | 'wave'        // 波纹
  | 'crack-ice'   // 冰裂纹
  | 'scale-css'   // CSS纯鱼鳞（无SVG依赖）
  | 'grid-css'    // CSS纯斜格（无SVG依赖）

export type OpacityLevel = 'low' | 'mid' | 'high'

// ── 纹样元数据表 ──
export const PATTERN_META: Record<PatternName, {
  label: string
  description: string
  cssClass: string
  size: string
}> = {
  'hui':        { label: '回纹',   description: '方折连续螺旋，庄重、边框感强',     cssClass: 'pattern-hui',        size: '40px 40px'  },
  'tortoise':   { label: '龟背纹', description: '六边形蜂巢，稳重、密集',           cssClass: 'pattern-tortoise',   size: '28px 49px'  },
  'fish-scale': { label: '鱼鳞纹', description: '叠弧纹，柔和、流动感',             cssClass: 'pattern-fish-scale', size: '80px 40px'  },
  'diamond':    { label: '菱格纹', description: '斜方格锦，简洁、几何感',           cssClass: 'pattern-diamond',    size: '30px 30px'  },
  'wan-zi':     { label: '万字纹', description: '卐不断头，连绵不绝，吉祥寓意',     cssClass: 'pattern-wan-zi',     size: '40px 40px'  },
  'cloud':      { label: '云纹',   description: '祥云连续，飘逸、仙气',             cssClass: 'pattern-cloud',      size: '80px 40px'  },
  'wave':       { label: '波纹',   description: '水波连续，清雅、水墨感',           cssClass: 'pattern-wave',       size: '60px 20px'  },
  'crack-ice':  { label: '冰裂纹', description: '随机裂纹，古朴、开片釉感',         cssClass: 'pattern-crack-ice',  size: '80px 80px'  },
  'scale-css':  { label: '鳞纹CSS版', description: '纯CSS鱼鳞，无SVG依赖',         cssClass: 'pattern-scale-css',  size: '80px 40px'  },
  'grid-css':   { label: '斜格CSS版', description: '纯CSS斜格，无SVG依赖',         cssClass: 'pattern-grid-css',   size: '20px 20px'  },
}

const OPACITY_MAP: Record<OpacityLevel, number> = {
  low:  0.05,
  mid:  0.10,
  high: 0.18,
}

// SVG 纹样的 import 映射（Vite 静态资源）
const SVG_URL_MAP: Partial<Record<PatternName, string>> = {
  'hui':        new URL('@/assets/textures/patterns/hui-fret.svg',    import.meta.url).href,
  'tortoise':   new URL('@/assets/textures/patterns/tortoise.svg',    import.meta.url).href,
  'fish-scale': new URL('@/assets/textures/patterns/fish-scale.svg',  import.meta.url).href,
  'diamond':    new URL('@/assets/textures/patterns/diamond.svg',      import.meta.url).href,
  'wan-zi':     new URL('@/assets/textures/patterns/wan-zi.svg',       import.meta.url).href,
  'cloud':      new URL('@/assets/textures/patterns/cloud.svg',        import.meta.url).href,
  'wave':       new URL('@/assets/textures/patterns/wave.svg',         import.meta.url).href,
  'crack-ice':  new URL('@/assets/textures/patterns/crack-ice.svg',    import.meta.url).href,
}

// ── composable ──
export function usePattern(
  initial?: PatternName,
  options?: { opacity?: number; level?: OpacityLevel }
) {
  const current = ref<PatternName | null>(initial ?? null)

  const opacity = computed(() => {
    if (options?.opacity !== undefined) return options.opacity
    return OPACITY_MAP[options?.level ?? 'low']
  })

  /** 适合直接绑到容器 style，作为背景图层（不走 ::before） */
  const patternStyle = computed((): CSSProperties => {
    const name = current.value
    if (!name) return {}
    const meta = PATTERN_META[name]
    const url = SVG_URL_MAP[name]

    if (url) {
      return {
        backgroundImage: `url("${url}")`,
        backgroundSize: meta.size,
        backgroundRepeat: 'repeat',
        opacity: opacity.value,
      }
    }
    // CSS 纯色纹样（scale-css / grid-css）走 class 方案
    return {}
  })

  /** 适合配合 patterns.css 工具类使用 */
  const patternClass = computed(() => {
    const name = current.value
    if (!name) return ''
    const meta = PATTERN_META[name]
    const level = options?.level ?? 'low'
    return `pattern-overlay ${meta.cssClass} pattern-overlay-${level}`
  })

  /** 切换纹样 */
  function setPattern(name: PatternName | null) {
    current.value = name
  }

  /** 获取所有可用纹样列表（用于选择器 UI） */
  function getPatternList() {
    return (Object.keys(PATTERN_META) as PatternName[]).map(key => ({
      name: key,
      ...PATTERN_META[key],
    }))
  }

  return {
    current,
    patternStyle,
    patternClass,
    setPattern,
    getPatternList,
    PATTERN_META,
  }
}
