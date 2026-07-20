import type { LandscapeCategory } from '@/api/career'
import { getLandscape, listInsights } from '@/api/career'
import { CAREER_DOMAINS, type BubbleDomain, type CareerRole } from '@/composables/useCareerInsights'

const CATEGORY_TO_ROLE: Array<{ match: RegExp; role: CareerRole }> = [
  { match: /前端|可视化|web/i, role: '前端开发' },
  { match: /后端|服务端|java|go/i, role: '后端开发' },
  { match: /测试|质量|qa/i, role: '测试开发' },
  { match: /数据|分析|bi/i, role: '数据分析' },
  { match: /AI|算法|机器|智能|大模型/i, role: '机器学习工程师' },
]

function resolveRole(category: string): CareerRole | null {
  for (const item of CATEGORY_TO_ROLE) {
    if (item.match.test(category)) return item.role
  }
  return null
}

/** Mutate CAREER_DOMAINS jobs from landscape API (same object refs used by bubble chart). */
export async function hydrateCareerDomainsFromApi(): Promise<{
  landscape: LandscapeCategory[]
  patched: number
}> {
  const landscape = await getLandscape()
  let patched = 0
  for (const cat of landscape) {
    const role = resolveRole(cat.category)
    if (!role) continue
    const domain = CAREER_DOMAINS.find(d => d.role === role)
    if (!domain) continue
    if (cat.roles?.length) {
      domain.jobs = cat.roles.slice(0, 6)
      patched += 1
    }
  }
  return { landscape, patched }
}

export async function fetchCareerInsightsPreview(limit = 8) {
  return listInsights({ limit })
}

export type { BubbleDomain }
