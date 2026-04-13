/* ══════════════════════════════════════════════
   简历解析后的技能结构（对应 resumeStore.parsedSkills）
══════════════════════════════════════════════ */
export interface ParsedSkill {
  name:     string
  weight:   number   // 0-1
  category: string
}

/* ══════════════════════════════════════════════
   个人信息结构
══════════════════════════════════════════════ */
export interface PersonInfo {
  name:       string
  school:     string
  major:      string
  grade:      string           // 大一 ~ 研三
  targetRole: string
  gpa?:       number
  selfSummary?: string
  honors:     { type: 'cert' | 'award' | 'intern'; label: string }[]
  projects:   { name: string; role: string; desc: string }[]
}

/* ══════════════════════════════════════════════
   七维能力
══════════════════════════════════════════════ */
export type AbilityKey =
  | 'professional'   // 专业技能   — 可计算
  | 'certificate'    // 证书资质   — 可计算
  | 'innovation'     // 创新能力   — 后端（论文算法）
  | 'learning'       // 学习能力   — 后端（论文算法）
  | 'stress'         // 抗压能力   — 后端（论文算法）
  | 'communication'  // 沟通能力   — 后端（论文算法）
  | 'internship'     // 实习能力   — 可计算

export interface AbilityDimension {
  key:    AbilityKey
  label:  string
  score:  number            // 0-100
  level:  '优秀' | '良好' | '待提升'
  desc:   string
  source: 'computed' | 'agent'  // 标记计算来源，联调时替换 agent 类型
}

/* ══════════════════════════════════════════════
   完整输入 / 输出
══════════════════════════════════════════════ */
export interface AgentPortraitInput {
  resumeText:      string
  parsedSkills:    ParsedSkill[]
  predictedRole:   string
  confidence:      number
  matchedCareers:  { role: string; score: number }[]
}

export interface AgentPortraitResult {
  completenessScore:    number          // 完整度 0-100
  competitivenessScore: number          // 竞争力 0-100
  personInfo:           PersonInfo
  dimensions:           AbilityDimension[]
  skillTags:            { name: string; weight: number; category: string }[]
  agentSummary:         string
}

/* ══════════════════════════════════════════════
   分阶段流式渲染：Phase 类型与回调
══════════════════════════════════════════════ */
export type AgentPhase = 'parsing' | 'evaluating' | 'analyzing' | 'summarizing'

export type SummarySource = string | ReadableStream<string>

export type PhaseData =
  | { phase: 'parsing';      personInfo: PersonInfo; completenessScore: number }
  | { phase: 'evaluating';   dimensions: AbilityDimension[]; competitivenessScore: number; skillTags: { name: string; weight: number; category: string }[] }
  | { phase: 'analyzing';    honors: PersonInfo['honors']; projects: PersonInfo['projects'] }
  | { phase: 'summarizing';  agentSummary: SummarySource }

export type PhaseCallback = (data: PhaseData) => void

export const PHASE_META: { key: AgentPhase; label: string }[] = [
  { key: 'parsing',      label: '简历解析' },
  { key: 'evaluating',   label: '能力评估' },
  { key: 'analyzing',    label: '经历分析' },
  { key: 'summarizing',  label: '生成综合评语' },
]

// 后端事件类型 → 前端 Phase 的映射（对接时按后端实际事件名补充）
export const PHASE_MAP: Record<string, AgentPhase> = {
  'resume_parsed':       'parsing',
  'ability_scored':      'evaluating',
  'experience_analyzed': 'analyzing',
  'summary_generated':   'summarizing',
}

/* ══════════════════════════════════════════════
   适配器接口：mock 与真实 API 共用签名
   联调时：实现 apiAdapter，将 activeAdapter 指向它
══════════════════════════════════════════════ */
export interface PortraitAdapter {
  run(input: AgentPortraitInput, onPhase: PhaseCallback): Promise<AgentPortraitResult>
}

async function mockStreamingImpl(
  input: AgentPortraitInput,
  onPhase: PhaseCallback,
): Promise<AgentPortraitResult> {
  const result = mockPortrait(input)

  // Phase ① 简历解析 ~600ms
  await delay(600)
  onPhase({
    phase: 'parsing',
    personInfo: result.personInfo,
    completenessScore: result.completenessScore,
  })

  // Phase ② 能力评估 ~800ms
  await delay(800)
  onPhase({
    phase: 'evaluating',
    dimensions: result.dimensions,
    competitivenessScore: result.competitivenessScore,
    skillTags: result.skillTags,
  })

  // Phase ③ 经历分析 ~500ms
  await delay(500)
  onPhase({
    phase: 'analyzing',
    honors: result.personInfo.honors,
    projects: result.personInfo.projects,
  })

  // Phase ④ AI 综评 ~700ms
  await delay(700)
  onPhase({
    phase: 'summarizing',
    agentSummary: result.agentSummary,
  })

  return result
}

const mockAdapter: PortraitAdapter = { run: mockStreamingImpl }

// 联调时：取消注释并实现 apiAdapter，将 activeAdapter 切换
// const apiAdapter: PortraitAdapter = { run: apiStreamingImpl }
const activeAdapter: PortraitAdapter = mockAdapter

/* ══════════════════════════════════════════════
   分阶段流式调用（TalentPortrait.vue 使用）
══════════════════════════════════════════════ */
export async function callAgentPortraitStreaming(
  input: AgentPortraitInput,
  onPhase: PhaseCallback,
): Promise<AgentPortraitResult> {
  return activeAdapter.run(input, onPhase)
}

/* ══════════════════════════════════════════════
   主调用函数（向后兼容，一次性返回完整结果）
   联调时：将 mockPortrait(input) 替换为
     const res = await fetch(endpoint, { method:'POST', body: JSON.stringify(input) })
     return res.json()
══════════════════════════════════════════════ */
export async function callAgentPortrait(
  input: AgentPortraitInput,
): Promise<AgentPortraitResult> {
  await delay(400)
  return mockPortrait(input)
}

/* ══════════════════════════════════════════════
   抽象能力单独接口（后端读论文计算）
   联调时：替换函数体为 fetch 调用
══════════════════════════════════════════════ */
export async function getAbstractAbilityScores(
  input: AgentPortraitInput,
): Promise<Pick<AbilityDimension, 'key' | 'score' | 'desc'>[]> {
  return mockAbstractScores(input)
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

/* ══════════════════════════════════════════════
   工具：确定性伪随机（基于字符串哈希）
══════════════════════════════════════════════ */
function strHash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}
function seededFloat(seed: number, lo: number, hi: number): number {
  const r = ((seed * 1664525 + 1013904223) >>> 0) / 4294967296
  return lo + r * (hi - lo)
}

/* ══════════════════════════════════════════════
   抽象维度 Mock（沟通/抗压/创新/学习）
══════════════════════════════════════════════ */
function mockAbstractScores(input: AgentPortraitInput) {
  const base = strHash(input.predictedRole + input.resumeText.slice(0, 20))
  const entries: { key: AbilityKey; labelCN: string; descs: [string, string, string] }[] = [
    {
      key: 'innovation',
      labelCN: '创新能力',
      descs: [
        '参与多个原创项目，具备较强的技术创新意识',
        '有一定项目经历，展现出良好的问题解决能力',
        '创新实践经验有待积累，建议参与更多开源项目',
      ],
    },
    {
      key: 'learning',
      labelCN: '学习能力',
      descs: [
        '技术栈更新迭代快，自主学习能力突出',
        '能够快速掌握新技术，学习路径清晰',
        '建议系统化学习规划，提升知识体系完整度',
      ],
    },
    {
      key: 'stress',
      labelCN: '抗压能力',
      descs: [
        '有高强度项目交付经验，抗压表现优秀',
        '能在一定压力下保持工作效率',
        '建议通过团队协作项目锻炼抗压能力',
      ],
    },
    {
      key: 'communication',
      labelCN: '沟通能力',
      descs: [
        '文档表达清晰，具备良好的跨团队协作能力',
        '能够有效传达技术方案，沟通能力良好',
        '建议增加技术分享和团队协作的实践经验',
      ],
    },
  ]
  return entries.map((e, i) => {
    const seed = (base + i * 997) >>> 0
    const score = Math.round(seededFloat(seed, 52, 90))
    const descIdx = score >= 80 ? 0 : score >= 65 ? 1 : 2
    return { key: e.key, score, desc: e.descs[descIdx]! }
  })
}

/* ══════════════════════════════════════════════
   个人信息从简历文本提取（Mock）
══════════════════════════════════════════════ */
function extractPersonInfo(input: AgentPortraitInput): PersonInfo {
  const text = input.resumeText.toLowerCase()

  const grades = ['大一', '大二', '大三', '大四', '研一', '研二', '研三']
  const grade = grades.find(g => input.resumeText.includes(g)) ?? '大三'

  const schools = ['北京大学', '清华大学', '复旦大学', '浙江大学', '同济大学', '电子科技大学', '成都理工大学']
  const school = schools.find(s => input.resumeText.includes(s)) ?? '某高等院校'

  const certCount = (text.match(/证书|cet|cpa|pmp|aws|oracle|hcia|hcip|软考|计算机二级/g) ?? []).length
  const internCount = (text.match(/实习|intern|internship/g) ?? []).length
  const awardCount = (text.match(/奖学金|一等奖|二等奖|三等奖|国家奖|校级奖|竞赛|比赛/g) ?? []).length

  const honors: PersonInfo['honors'] = []
  for (let i = 0; i < Math.min(certCount, 3); i++) honors.push({ type: 'cert', label: `相关证书 ${i + 1}` })
  for (let i = 0; i < Math.min(internCount, 2); i++) honors.push({ type: 'intern', label: `实习经历 ${i + 1}` })
  for (let i = 0; i < Math.min(awardCount, 2); i++) honors.push({ type: 'award', label: `获奖经历 ${i + 1}` })

  const projects: PersonInfo['projects'] = [
    { name: `${input.predictedRole}相关项目`, role: '核心开发', desc: '负责系统核心模块设计与实现，参与技术方案评审' },
    { name: '团队协作项目', role: '成员', desc: '参与需求分析、编码与测试，协助项目按时交付' },
  ]

  return {
    name: input.resumeText.match(/[\u4e00-\u9fa5]{2,4}(?=\s|$|，|。)/)?.[0] ?? '同学',
    school,
    major: input.predictedRole.includes('数据') ? '数据科学与大数据技术'
      : input.predictedRole.includes('机器学习') ? '人工智能'
      : input.predictedRole.includes('测试') ? '软件工程'
      : '计算机科学与技术',
    grade,
    targetRole: input.predictedRole,
    gpa: parseFloat(seededFloat(strHash(input.resumeText.slice(0, 10)), 3.0, 4.0).toFixed(2)),
    selfSummary: `热爱${input.predictedRole}方向，具备扎实的技术基础与项目实践经验，学习能力强，善于团队协作。`,
    honors: honors.length > 0 ? honors : [
      { type: 'cert' as const, label: '英语四六级证书' },
      { type: 'intern' as const, label: '软件开发实习' },
    ],
    projects,
  }
}

/* ══════════════════════════════════════════════
   完整 Mock 实现
══════════════════════════════════════════════ */
function mockPortrait(input: AgentPortraitInput): AgentPortraitResult {
  const personInfo = extractPersonInfo(input)

  const professionalScore = Math.round(Math.min((input.matchedCareers[0]?.score ?? 0.7) * 100, 98))
  const certCount = personInfo.honors.filter(h => h.type === 'cert').length
  const internCount = personInfo.honors.filter(h => h.type === 'intern').length
  const certificateScore = Math.min(certCount * 25 + 35, 100)
  const internshipScore = Math.min(internCount * 30 + 40, 100)

  const abstractRaw = mockAbstractScores(input)
  const abstractMap = Object.fromEntries(abstractRaw.map(a => [a.key, a]))

  function toLevel(s: number): '优秀' | '良好' | '待提升' {
    return s >= 80 ? '优秀' : s >= 60 ? '良好' : '待提升'
  }

  const dimensions: AbilityDimension[] = [
    {
      key: 'professional', label: '专业技能', score: professionalScore, source: 'computed',
      level: toLevel(professionalScore),
      desc: `${input.parsedSkills.slice(0, 3).map(s => s.name).join('、')} 等技术掌握扎实`,
    },
    {
      key: 'certificate', label: '证书资质', score: certificateScore, source: 'computed',
      level: toLevel(certificateScore),
      desc: certCount > 0 ? `持有 ${certCount} 项相关证书，资质背景良好` : '建议考取行业认可证书以提升竞争力',
    },
    {
      key: 'innovation', label: '创新能力', score: abstractMap['innovation']!.score, source: 'agent',
      level: toLevel(abstractMap['innovation']!.score),
      desc: abstractMap['innovation']!.desc,
    },
    {
      key: 'learning', label: '学习能力', score: abstractMap['learning']!.score, source: 'agent',
      level: toLevel(abstractMap['learning']!.score),
      desc: abstractMap['learning']!.desc,
    },
    {
      key: 'stress', label: '抗压能力', score: abstractMap['stress']!.score, source: 'agent',
      level: toLevel(abstractMap['stress']!.score),
      desc: abstractMap['stress']!.desc,
    },
    {
      key: 'communication', label: '沟通能力', score: abstractMap['communication']!.score, source: 'agent',
      level: toLevel(abstractMap['communication']!.score),
      desc: abstractMap['communication']!.desc,
    },
    {
      key: 'internship', label: '实习能力', score: internshipScore, source: 'computed',
      level: toLevel(internshipScore),
      desc: internCount > 0 ? `有 ${internCount} 段实习经历，具备职场实践基础` : '尚无实习经历，建议积累实战经验',
    },
  ]

  // 完整度：个人信息填写情况
  const fieldsFilled = [
    personInfo.name !== '同学',
    !!personInfo.school,
    !!personInfo.major,
    !!personInfo.grade,
    !!personInfo.targetRole,
    !!personInfo.gpa,
    personInfo.honors.length > 0,
    personInfo.projects.length > 0,
    input.parsedSkills.length > 0,
    !!personInfo.selfSummary,
  ]
  const completenessScore = Math.round((fieldsFilled.filter(Boolean).length / fieldsFilled.length) * 100)

  // 竞争力：七维加权
  const weights: Record<AbilityKey, number> = {
    professional: 0.30, certificate: 0.10, innovation: 0.10,
    learning: 0.10, stress: 0.10, communication: 0.10, internship: 0.20,
  }
  const competitivenessScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * weights[d.key], 0)
  )

  // 技能标签云
  const skillTags = input.parsedSkills.map(s => ({ name: s.name, weight: s.weight, category: s.category }))

  // Agent 综合评语
  const topDim = [...dimensions].sort((a, b) => b.score - a.score)[0]!
  const weakDim = [...dimensions].sort((a, b) => a.score - b.score)[0]!
  const agentSummary = `${personInfo.name}同学目前就读于${personInfo.school}${personInfo.major}专业，目标方向为「${input.predictedRole}」。` +
    `综合评估竞争力得分 ${competitivenessScore} 分，整体处于${competitivenessScore >= 75 ? '较强' : '中等'}竞争水平。` +
    `其中「${topDim.label}」维度表现突出（${topDim.score} 分），` +
    `「${weakDim.label}」（${weakDim.score} 分）有较大提升空间，建议重点加强。` +
    `建议持续丰富项目经历，考取行业认可证书，积极参与实习，全面提升就业竞争力。`

  return { completenessScore, competitivenessScore, personInfo, dimensions, skillTags, agentSummary }
}
