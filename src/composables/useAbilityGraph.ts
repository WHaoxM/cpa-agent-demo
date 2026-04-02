/**
 * 职业能力图谱 — 数据提供者 & 同心圆布局
 * 本期：本地 mock 数据，返回 Promise 预留后续接口替换
 */

/* ═══ 类型定义 ═══ */

export type AbilityGroup = 'job' | 'professional' | 'position' | 'cognitive' | 'general'

export type EdgeRelationType = 'belong' | 'prerequisite' | 'synergy' | 'dependency'

export interface AbilityNode {
  id: string
  name: string
  level: number          // 0=岗位, 1=板块, 2+=子节点
  group: AbilityGroup
  parentId?: string
  heat?: number          // 节点权重/热度 0-100
}

export interface AbilityEdge {
  source: string
  target: string
  relation: EdgeRelationType
  label?: string         // 可选的关系描述文案
}

export interface AbilityGraphData {
  nodes: AbilityNode[]
  edges: AbilityEdge[]
}

/* ═══ 板块颜色 ═══ */
export const GROUP_COLORS: Record<AbilityGroup, string> = {
  job:          '#C03418',   // 朱砂 — 岗位中心
  professional: '#3478CC',   // 靛蓝 — 专业技能
  position:     '#D49428',   // 赭金 — 岗位技能
  cognitive:    '#2EA86C',   // 竹绿 — 认知技能
  general:      '#9266E8',   // 藤紫 — 通用技能
}

export const GROUP_LABELS: Record<AbilityGroup, string> = {
  job:          '岗位',
  professional: '专业技能',
  position:     '岗位技能',
  cognitive:    '认知技能',
  general:      '通用技能',
}

export const RELATION_STYLES: Record<EdgeRelationType, { label: string; dash: number[]; curveness: number; color: string }> = {
  belong:       { label: '归属',   dash: [],       curveness: 0.1,  color: 'rgba(192,52,24,0.5)' },
  prerequisite: { label: '前置',   dash: [6, 3],   curveness: 0.25, color: '#D45828' },
  synergy:      { label: '协同',   dash: [3, 3],   curveness: 0.3,  color: '#2EA86C' },
  dependency:   { label: '依赖',   dash: [10, 4],  curveness: 0.2,  color: '#3478CC' },
}

/* ═══ Mock 数据 ═══ */

function buildMockData(role: string): AbilityGraphData {
  const jobId = 'job-center'

  // 四大板块
  const boards: { id: string; group: AbilityGroup; name: string }[] = [
    { id: 'board-pro',  group: 'professional', name: '专业技能' },
    { id: 'board-pos',  group: 'position',     name: '岗位技能' },
    { id: 'board-cog',  group: 'cognitive',    name: '认知技能' },
    { id: 'board-gen',  group: 'general',      name: '通用技能' },
  ]

  // 各板块子节点 — 按岗位差异化
  const childrenMap: Record<string, { id: string; name: string; heat: number }[]> = getChildrenForRole(role)

  const nodes: AbilityNode[] = [
    { id: jobId, name: role || '前端开发', level: 0, group: 'job', heat: 100 },
  ]

  const edges: AbilityEdge[] = []

  boards.forEach(b => {
    nodes.push({ id: b.id, name: b.name, level: 1, group: b.group, parentId: jobId, heat: 85 })
    edges.push({ source: jobId, target: b.id, relation: 'belong' })

    const children = childrenMap[b.id] || []
    children.forEach(c => {
      nodes.push({ id: c.id, name: c.name, level: 2, group: b.group, parentId: b.id, heat: c.heat })
      edges.push({ source: b.id, target: c.id, relation: 'belong' })
    })
  })

  // 子节点间关系线
  const crossEdges = getCrossEdgesForRole(role)
  edges.push(...crossEdges)

  return { nodes, edges }
}

function getChildrenForRole(_role: string): Record<string, { id: string; name: string; heat: number }[]> {
  // 默认为"前端开发"的示例，后续可按 role 分支
  return {
    'board-pro': [
      { id: 'pro-vue',      name: 'Vue 3',           heat: 92 },
      { id: 'pro-react',    name: 'React',            heat: 80 },
      { id: 'pro-ts',       name: 'TypeScript',       heat: 88 },
      { id: 'pro-css',      name: 'CSS / 动效',       heat: 76 },
      { id: 'pro-echarts',  name: '数据可视化',       heat: 70 },
      { id: 'pro-node',     name: 'Node.js',          heat: 65 },
    ],
    'board-pos': [
      { id: 'pos-arch',     name: '前端架构',         heat: 82 },
      { id: 'pos-perf',     name: '性能优化',         heat: 78 },
      { id: 'pos-ssr',      name: 'SSR / 首屏',       heat: 64 },
      { id: 'pos-build',    name: '工程化 / 构建',    heat: 74 },
      { id: 'pos-test',     name: '前端测试',         heat: 62 },
    ],
    'board-cog': [
      { id: 'cog-algo',     name: '算法与数据结构',   heat: 72 },
      { id: 'cog-design',   name: '系统设计',         heat: 68 },
      { id: 'cog-network',  name: '网络协议',         heat: 66 },
      { id: 'cog-security', name: 'Web 安全',         heat: 58 },
    ],
    'board-gen': [
      { id: 'gen-git',      name: 'Git / 协作',       heat: 72 },
      { id: 'gen-ci',       name: 'CI/CD',            heat: 66 },
      { id: 'gen-linux',    name: 'Linux 基础',       heat: 60 },
      { id: 'gen-doc',      name: '技术文档',         heat: 54 },
      { id: 'gen-comm',     name: '跨团队沟通',       heat: 50 },
    ],
  }
}

function getCrossEdgesForRole(_role: string): AbilityEdge[] {
  return [
    // 前置关系
    { source: 'pro-ts',      target: 'pro-vue',      relation: 'prerequisite', label: 'TS 是 Vue3 的前置' },
    { source: 'pro-ts',      target: 'pro-react',    relation: 'prerequisite', label: 'TS 是 React 的前置' },
    { source: 'pro-css',     target: 'pro-echarts',  relation: 'prerequisite', label: 'CSS 是可视化基础' },
    { source: 'cog-network', target: 'pos-perf',     relation: 'prerequisite', label: '网络知识支撑性能优化' },
    { source: 'cog-algo',    target: 'cog-design',   relation: 'prerequisite', label: '算法支撑系统设计' },
    // 协同关系
    { source: 'pro-vue',     target: 'pos-arch',     relation: 'synergy',      label: 'Vue 与前端架构协同' },
    { source: 'pos-build',   target: 'gen-ci',       relation: 'synergy',      label: '构建与 CI/CD 协同' },
    { source: 'pro-node',    target: 'pos-ssr',      relation: 'synergy',      label: 'Node 与 SSR 协同' },
    { source: 'gen-git',     target: 'gen-ci',       relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
    { source: 'pos-test',    target: 'gen-ci',       relation: 'synergy',      label: '测试与 CI/CD 协同' },
    // 依赖关系
    { source: 'pos-perf',    target: 'pos-build',    relation: 'dependency',   label: '性能优化依赖工程化' },
    { source: 'cog-security', target: 'cog-network', relation: 'dependency',   label: '安全依赖网络知识' },
    { source: 'pro-echarts', target: 'pro-vue',      relation: 'dependency',   label: '可视化依赖框架' },
  ]
}

/* ═══ 同心圆布局计算 ═══ */

export interface LayoutNode {
  id: string
  x: number
  y: number
}

export function computeConcentricLayout(
  nodes: AbilityNode[],
  opts: { cx: number; cy: number; radii?: number[]; jitter?: number } = { cx: 300, cy: 300 },
): LayoutNode[] {
  const { cx, cy, jitter = 6 } = opts
  const radii = opts.radii || [0, 140, 280, 380]

  // 按层级分桶
  const buckets = new Map<number, AbilityNode[]>()
  for (const n of nodes) {
    const arr = buckets.get(n.level) || []
    arr.push(n)
    buckets.set(n.level, arr)
  }

  const result: LayoutNode[] = []

  for (const [level, bucket] of buckets) {
    const r = radii[Math.min(level, radii.length - 1)] ?? 0
    const count = bucket.length
    const angleStep = count > 0 ? (2 * Math.PI) / count : 0
    // 随机起始角度偏移
    const angleOffset = Math.random() * Math.PI * 2

    bucket.forEach((n, i) => {
      const angle = angleOffset + i * angleStep
      const j = jitter > 0 ? (Math.random() - 0.5) * jitter : 0
      result.push({
        id: n.id,
        x: cx + r * Math.cos(angle) + j,
        y: cy + r * Math.sin(angle) + j,
      })
    })
  }

  return result
}

/* ═══ 轨道布局（环形约束动画用） ═══ */

export interface OrbitalNode {
  id: string
  baseAngle: number   // 初始角度 (弧度)
  radius: number      // 所在圆半径
  layer: number       // 层级
}

export function computeOrbitalLayout(
  nodes: AbilityNode[],
  opts: { radii?: number[] } = {},
): OrbitalNode[] {
  const radii = opts.radii || [0, 160, 330, 450]
  const buckets = new Map<number, AbilityNode[]>()
  for (const n of nodes) {
    const arr = buckets.get(n.level) || []
    arr.push(n)
    buckets.set(n.level, arr)
  }
  const result: OrbitalNode[] = []
  for (const [level, bucket] of buckets) {
    const r = radii[Math.min(level, radii.length - 1)] ?? 0
    const count = bucket.length
    const angleStep = count > 0 ? (2 * Math.PI) / count : 0
    const angleOffset = Math.random() * Math.PI * 2
    bucket.forEach((n, i) => {
      result.push({
        id: n.id,
        baseAngle: angleOffset + i * angleStep,
        radius: r,
        layer: level,
      })
    })
  }
  return result
}

/* ═══ 岗位介绍 Mock ═══ */

export interface RoleIntro {
  title: string
  summary: string
  responsibilities: string[]
  requirements: string[]
  skills: string[]
  topRegions: { name: string; demand: string }[]
  outlook: string
}

export function getRoleIntro(role: string): RoleIntro {
  // TODO: 后续替换为 GET /api/career/role-intro?role=...
  const map: Record<string, RoleIntro> = {
    '前端开发': {
      title: '前端开发工程师',
      summary: '负责 Web 应用用户界面的设计与实现，关注性能、可访问性与用户体验。',
      responsibilities: [
        '根据产品需求完成页面开发与交互实现',
        '参与前端架构设计与技术选型',
        '优化页面性能与首屏加载速度',
        '与后端/设计团队协作联调接口',
        '维护组件库与工程化基础设施',
      ],
      requirements: [
        '本科及以上学历，计算机相关专业优先',
        '熟悉 Vue / React 至少一种主流框架',
        '掌握 TypeScript、ES6+ 语法',
        '了解前端工程化（Webpack / Vite / CI/CD）',
        '有数据可视化或跨端开发经验者加分',
      ],
      skills: ['Vue 3', 'React', 'TypeScript', 'CSS', 'Node.js', 'Webpack', 'Vite', 'ECharts', 'Git'],
      topRegions: [
        { name: '北京', demand: '极高' },
        { name: '上海', demand: '极高' },
        { name: '深圳', demand: '高' },
        { name: '杭州', demand: '高' },
        { name: '成都', demand: '中等' },
      ],
      outlook: '前端技术迭代快，全栈化与跨端趋势明显；掌握框架原理、性能优化和工程化能力的开发者持续紧缺，3-5 年可晋升高级/架构方向。',
    },
  }
  return map[role] ?? map['前端开发']!
}

/* ═══ 数据获取（预留接口替换） ═══ */

export async function getAbilityGraphData(role: string): Promise<AbilityGraphData> {
  // TODO: 后续替换为真实 API 调用
  // return fetch(`/api/ability-graph?role=${encodeURIComponent(role)}`).then(r => r.json())
  return buildMockData(role)
}
