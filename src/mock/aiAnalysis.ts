import type { ReportRecord, AIAnalysisResult, TargetRole, TargetRoleMarket } from '@/types'
import { mockTargetRoleMarkets } from '@/mock/data'

const ABILITY_LABELS: string[] = [
  '逻辑思维', '代码实现', '算法基础', '工程协作', '文档表达',
  '系统设计', '问题排查', '需求理解', '学习迁移', '跨模块整合',
]

function extractDimensions(snapshot: Record<string, unknown>): Record<string, number> {
  const dims: Record<string, number> = {}
  const sevenDim = snapshot.sevenDim
  if (!Array.isArray(sevenDim)) return dims
  for (const item of sevenDim) {
    if (!item || typeof (item as Record<string, unknown>).score !== 'number') continue
    const i = item as Record<string, unknown>
    const key = typeof i.name === 'string' ? i.name
      : typeof i.label === 'string' ? i.label
      : null
    if (key) dims[key] = i.score as number
  }
  return dims
}

// ─── 职业匹配建议 Mock（Agent 接入后由 getCareerSuggestions 替换） ────────────
function getRoleMarket(role: string): TargetRoleMarket | undefined {
  return mockTargetRoleMarkets.find(m => m.role === role)
}

export function generateMockCareerSuggestions(targetRoles: TargetRole[]): string[] {
  if (targetRoles.length === 0) {
    return ['前往心仪岗位页关注目标职业方向，获取个性化匹配建议']
  }
  const sorted = [...targetRoles]
    .map(r => ({ r, market: getRoleMarket(r.role) }))
    .filter((item): item is { r: TargetRole; market: TargetRoleMarket } => item.market !== undefined)
    .sort((a, b) => b.market.referenceMatch - a.market.referenceMatch)
    .slice(0, 3)
  if (sorted.length === 0) {
    return ['尚未找到匹配的职业方向数据，请先在职业分析页选择关注方向']
  }
  return sorted.map(({ market: m }) => {
    const skills = m.skillTags.slice(0, 2).join('、')
    const allSkills = m.skillTags.slice(0, 3).join('、')
    if (m.referenceMatch >= 75) {
      return `「${m.role}」方向与你的能力画像高度匹配（${m.referenceMatch}%），在 ${allSkills} 等核心方向上具备明显优势`
    } else if (m.referenceMatch >= 60) {
      return `「${m.role}」方向匹配度良好（${m.referenceMatch}%），进一步强化 ${skills} 将有效提升就业竞争力`
    } else if (m.referenceMatch >= 45) {
      return `「${m.role}」方向匹配度尚存差距（${m.referenceMatch}%），建议系统学习 ${skills}，逐步达到岗位要求`
    } else {
      return `「${m.role}」方向对 ${skills} 要求较高，当前匹配度 ${m.referenceMatch}%，建议先夯实相关基础`
    }
  })
}

// ─── 总体评价与鼓励 ───────────────────────────────────────────────────────────
function buildSummary(
  growthScore: number,
  topAbilities: string[],
  improvementAreas: string[],
  targetRoles: TargetRole[],
  records: ReportRecord[],
): string {
  const abilityStr = topAbilities.slice(0, 2).join('、')
  const improveStr = improvementAreas.slice(0, 1).join('、')
  const topRoleMarket = [...targetRoles]
    .map(r => getRoleMarket(r.role))
    .filter((m): m is TargetRoleMarket => m !== undefined)
    .sort((a, b) => b.referenceMatch - a.referenceMatch)[0] ?? null
  const reportCount = records.length

  if (growthScore >= 80) {
    const jobHint = topRoleMarket
      ? `在「${topRoleMarket.role}」等目标方向上已展现出较强竞争力，`
      : ''
    return `你的综合成长表现优秀，${jobHint}在 ${abilityStr} 方面积累深厚。继续保持这份专注与热情，你已经走在了大多数人前面，期待你迈向下一个更高的目标！`
  } else if (growthScore >= 60) {
    const improveHint = improveStr ? `重点突破 ${improveStr} 后，` : ''
    return `你目前的学习成果扎实，${abilityStr} 方向已具备良好基础。${improveHint}整体竞争力将显著提升。每一步积累都在为你未来的突破蓄力，加油！`
  } else if (growthScore >= 40) {
    const hint = reportCount < 2
      ? '报告数据尚在积累中，完成更多测评后分析将更精准。'
      : `${abilityStr} 是你当前的优势区域，`
    return `${hint}成长的过程从不是一蹴而就的，${improveStr ? `重点补强 ${improveStr}，` : ''}坚持下去你会看到明显的进步。相信自己，你比想象中更有潜力！`
  } else {
    return `你刚刚起步，每一条记录都是成长的见证。${reportCount < 1 ? '完成第一次能力测评，让我们更好地了解你的现状，' : ''}路虽长，但方向明确就不怕远。加油，最好的时候还没到来！`
  }
}

// ─── 下一步建议（个性化，基于真实数据） ──────────────────────────────────────
function buildNextSteps(
  growthScore: number,
  topAbilities: string[],
  improvementAreas: string[],
  targetRoles: TargetRole[],
  records: ReportRecord[],
): string[] {
  const steps: string[] = []

  // 1. 成长指数目标
  if (growthScore < 50) {
    steps.push(`当前综合成长指数 ${growthScore} 分，建议优先补强基础，目标提升至 60 分以上`)
  } else if (growthScore < 75) {
    steps.push(`综合成长指数 ${growthScore} 分，制定专项计划冲刺 80 分，持续积累报告数据`)
  } else {
    steps.push(`综合成长指数 ${growthScore} 分，保持优势，尝试挑战更高难度模块`)
  }

  // 2. 待提升方向点名
  if (improvementAreas.length > 0) {
    const areas = improvementAreas.slice(0, 2).join('、')
    steps.push(`重点攻克 ${areas}，每周安排 2~3 次专项练习，结合错题本巩固薄弱知识点`)
  }

  // 3. 发挥突出能力
  if (topAbilities.length > 0) {
    steps.push(`充分发挥 ${topAbilities[0]} 优势，积极参与相关实践项目以积累经历`)
  }

  // 4. 心仪岗位行动建议
  const topRoleEntry = [...targetRoles]
    .map(r => ({ r, market: getRoleMarket(r.role) }))
    .filter(item => item.market !== undefined)
    .sort((a, b) => b.market!.referenceMatch - a.market!.referenceMatch)[0]
  if (topRoleEntry) {
    const { market: m } = topRoleEntry
    if (m!.referenceMatch >= 70) {
      steps.push(`关注的「${m!.role}」方向匹配度达 ${m!.referenceMatch}%，建议尽快完善简历，积极准备相关岗位的面试`)
    } else {
      const skill = m!.skillTags[0] ?? '核心技能'
      steps.push(`优先补强 ${skill}，将「${m!.role}」方向匹配度从 ${m!.referenceMatch}% 提升至 70% 以上`)
    }
  } else {
    steps.push('前往心仪岗位页关注目标职业方向，系统将为你生成个性化学习路径')
  }

  // 5. 报告完整性提示
  const portraitCount = records.filter(r => r.type === 'portrait').length
  if (portraitCount === 0) {
    steps.push('先完成一次能力画像测评，获得精准的技能维度数据')
  } else {
    steps.push('持续记录学习过程，定期生成报告追踪成长轨迹')
  }

  return steps.slice(0, 5)
}

export function generateMockAnalysis(
  userId: string,
  records: ReportRecord[],
  careerSuggestions: string[],
  targetRoles: TargetRole[] = [],
): AIAnalysisResult {
  const portraitRecords = records.filter(r => r.type === 'portrait')

  // 能力维度（从最新画像报告 snapshot 提取）
  const latestPortrait = portraitRecords.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  // 综合竞争力：直接取最新画像的 competitivenessScore（7 维加权均分，有明确业务含义）
  const growthScore: number = latestPortrait
    ? (() => {
        const raw = latestPortrait.snapshot.competitivenessScore
        if (typeof raw === 'number') return raw
        const dims = extractDimensions(latestPortrait.snapshot)
        const vals = Object.values(dims)
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
      })()
    : 0
  const dims = latestPortrait ? extractDimensions(latestPortrait.snapshot) : {}
  const dimEntries = Object.entries(dims).sort((a, b) => b[1] - a[1])

  // 突出能力：取最新画像的 skillTags（weight 降序），没有时回退到 sevenDim 顶部
  const rawSkillTags = latestPortrait?.snapshot.skillTags
  const skillTagsSorted: { name: string; weight: number }[] = Array.isArray(rawSkillTags)
    ? [...rawSkillTags].sort((a: { weight: number }, b: { weight: number }) => b.weight - a.weight)
    : []
  const topAbilities = skillTagsSorted.length >= 2
    ? skillTagsSorted.slice(0, 3).map((t: { name: string }) => t.name)
    : dimEntries.length >= 2
      ? dimEntries.slice(0, 3).map(([k]) => k)
      : ABILITY_LABELS.slice(0, 3)

  // 待提升方向：取 sevenDim 最小的维度（有明确行动意义的技能域）
  const improvementAreas = dimEntries.length >= 4
    ? dimEntries.slice(-2).map(([k]) => k)
    : ABILITY_LABELS.slice(7, 9)

  // 时间线（所有报告按时间排序）
  const timeline = records
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(r => ({
      date: r.createdAt,
      label: `${r.type === 'portrait' ? '能力画像' : '职业报告'}：${r.title}`,
    }))

  // 总体评价与鼓励
  const summary = buildSummary(growthScore, topAbilities, improvementAreas, targetRoles, records)

  // 下一步建议（个性化）
  const nextSteps = buildNextSteps(growthScore, topAbilities, improvementAreas, targetRoles, records)

  // ─── Tooltip 内容生成 ───
  const scoreTooltip = latestPortrait
    ? `综合竞争力 = 最新画像的 7 维能力加权均分，其中专业展现占 30%、实习经验占 20%，其余各维度各占 10%。当前分数 ${growthScore} 来自「${latestPortrait.title}」。`
    : '暂无画像测评数据，完成能力画像后可获得精准竞争力评分。'

  const topAbilityDetails: { name: string; detail: string }[] = skillTagsSorted.length >= 2
    ? skillTagsSorted.slice(0, 3).map((t: { name: string; weight: number }) => ({
        name: t.name,
        detail: `在简历技能提取中权重达 ${Math.round(t.weight * 100)}%，${t.weight >= 0.8 ? '是你最突出的技术栈，建议主动展示在简历和项目中' : t.weight >= 0.65 ? '掌握程度良好，可作为核心竞争优势进一步深化' : '有一定基础，建议通过实战项目巩固'}`,
      }))
    : dimEntries.slice(0, 3).map(([k, v]) => ({
        name: k,
        detail: `第 ${dimEntries.findIndex(([dk]) => dk === k) + 1} 高分维度，画像得分 ${v}/100`,
      }))

  const worstDims = dimEntries.length >= 4 ? dimEntries.slice(-2) : []
  const improvementDetails: { name: string; detail: string }[] = worstDims.map(([k, v]) => {
    const avg = dimEntries.length
      ? Math.round(dimEntries.reduce((s, [, val]) => s + val, 0) / dimEntries.length)
      : 0
    return {
      name: k,
      detail: `画像得分 ${v}/100，低于本次均分 ${avg} 分，是当前能力模型中的主要短板，建议优先专项练习`,
    }
  })

  return {
    generatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    summary,
    growthScore,
    scoreTooltip,
    topAbilities,
    topAbilityDetails,
    improvementAreas,
    improvementDetails,
    careerSuggestions,
    timeline,
    nextSteps,
  }
}
