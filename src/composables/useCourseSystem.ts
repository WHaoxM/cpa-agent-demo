/**
 * 课程体系分层网络关系图 — 数据提供者 & 3D 坐标计算
 * 跨岗位计算机技能节点（前端/后端/数据/运维/安全），顶层为前端岗位
 */

/* ═══ 类型定义 ═══ */

export type SkillTier = 'foundation' | 'junior' | 'mid' | 'senior' | 'job'

export interface CourseNode {
  id: string
  name: string
  tier: SkillTier
  heat: number
  category?: string
}

export interface CourseEdge {
  source: string
  target: string
  relation: 'prerequisite' | 'support' | 'compose'
  /** 是否属于当前职业主成长路径 */
  isCareerPath?: boolean
}

/** 课程体系节点 */
export interface GraphCourseNode {
  id: string
  title: string
  group: CourseGroup
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  relatedSkillIds: string[]
  importance: 'core' | 'recommended' | 'optional'
}

export type CourseGroup = 'foundation-course' | 'framework-course' | 'engineering-course' | 'backend-course' | 'architecture-course'

export const COURSE_GROUP_LABELS: Record<CourseGroup, string> = {
  'foundation-course': '基础课程',
  'framework-course': '框架课程',
  'engineering-course': '工程化课程',
  'backend-course': '后端协同课程',
  'architecture-course': '架构进阶课程',
}

/** 技能-课程关联边 */
export interface SkillCourseEdge {
  skillId: string
  courseId: string
  relation: 'core' | 'recommended' | 'advanced'
}

export interface CourseSystemData {
  nodes: CourseNode[]
  edges: CourseEdge[]
  courseNodes: GraphCourseNode[]
  skillCourseEdges: SkillCourseEdge[]
}

/** 右侧面板条目（保留兼容） */
export interface SkillEntry {
  id: string
  name: string
  type: 'skill' | 'problem'
  icon: string
}

/** 3D 平台层几何 */
export interface Layer3DLayout {
  tier: SkillTier
  yLevel: number
  xHalf: number
  zHalf: number
}

/** 节点 3D 坐标 */
export interface Node3DPos {
  x: number
  y: number
  z: number
}

/* ═══ 层级配置 ═══ */

export const TIER_ORDER: SkillTier[] = ['foundation', 'junior', 'mid', 'senior', 'job']

export const TIER_LABELS: Record<SkillTier, string> = {
  foundation: '专业技能',
  junior: '初阶岗位技能',
  mid: '中阶岗位技能',
  senior: '高阶岗位技能',
  job: '岗位',
}

/** 古籍书卷配色 — 各层明显区分 */
export const TIER_COLORS: Record<SkillTier, string> = {
  foundation: '#8C7B6B',
  junior:     '#B8860B',
  mid:        '#6B8E6B',
  senior:     '#4A6B8A',
  job:        '#8B2500',
}

export const TIER_GLOW: Record<SkillTier, string> = {
  foundation: 'rgba(140,123,107,0.15)',
  junior:     'rgba(184,134,11,0.18)',
  mid:        'rgba(107,142,107,0.18)',
  senior:     'rgba(74,107,138,0.20)',
  job:        'rgba(139,37,0,0.22)',
}

export const COURSE_GROUP_COLORS: Record<CourseGroup, string> = {
  'foundation-course': '#A0937D',
  'framework-course':  '#C4956A',
  'engineering-course': '#7A9B76',
  'backend-course':    '#6B8FAD',
  'architecture-course': '#9B6B5A',
}

/* ═══ Mock 数据（跨岗位 CS 技能，顶层为前端岗位） ═══ */

function buildMockData(_role: string): CourseSystemData {
  // TODO: 后续通过接口获取目标职业名称，替换此处写死值
  const jobName = '前端开发工程师'

  const nodes: CourseNode[] = [
    // ── 顶层：岗位（唯一）──
    { id: 'job-1', name: jobName, tier: 'job', heat: 100 },

    // ── 高阶岗位技能（跨领域架构与决策能力）──
    { id: 'sr-1',  name: '前端系统架构',   tier: 'senior', heat: 95, category: '前端架构' },
    { id: 'sr-2',  name: '分布式系统设计', tier: 'senior', heat: 93, category: '后端架构' },
    { id: 'sr-3',  name: '高可用架构设计', tier: 'senior', heat: 91, category: '架构' },
    { id: 'sr-4',  name: '性能优化体系',   tier: 'senior', heat: 90, category: '工程' },
    { id: 'sr-5',  name: 'DevOps 体系设计', tier: 'senior', heat: 88, category: '运维' },
    { id: 'sr-6',  name: '数据平台架构',   tier: 'senior', heat: 87, category: '数据' },
    { id: 'sr-7',  name: '安全架构设计',   tier: 'senior', heat: 86, category: '安全' },
    { id: 'sr-8',  name: '技术方案评审',   tier: 'senior', heat: 85, category: '管理' },
    { id: 'sr-9',  name: '微前端架构',     tier: 'senior', heat: 84, category: '前端架构' },
    { id: 'sr-10', name: '团队技术管理',   tier: 'senior', heat: 83, category: '管理' },
    { id: 'sr-11', name: '跨端技术方案',   tier: 'senior', heat: 82, category: '前端架构' },
    { id: 'sr-12', name: '云原生架构',     tier: 'senior', heat: 81, category: '运维' },

    // ── 中阶岗位技能（模块级能力，多岗位通用）──
    { id: 'md-1',  name: '前端工程化',       tier: 'mid', heat: 82, category: '前端' },
    { id: 'md-2',  name: '组件库设计开发',   tier: 'mid', heat: 81, category: '前端' },
    { id: 'md-3',  name: 'SSR / SSG 方案',   tier: 'mid', heat: 80, category: '前端' },
    { id: 'md-4',  name: '状态管理方案设计', tier: 'mid', heat: 79, category: '前端' },
    { id: 'md-5',  name: '后端 API 设计',    tier: 'mid', heat: 82, category: '后端' },
    { id: 'md-6',  name: '数据库设计优化',   tier: 'mid', heat: 80, category: '后端' },
    { id: 'md-7',  name: '微服务拆分治理',   tier: 'mid', heat: 79, category: '后端' },
    { id: 'md-8',  name: '消息队列应用',     tier: 'mid', heat: 77, category: '后端' },
    { id: 'md-9',  name: 'CI/CD 流程搭建',   tier: 'mid', heat: 80, category: '运维' },
    { id: 'md-10', name: '容器化部署管理',   tier: 'mid', heat: 78, category: '运维' },
    { id: 'md-11', name: '监控告警体系',     tier: 'mid', heat: 77, category: '运维' },
    { id: 'md-12', name: '数据管道开发',     tier: 'mid', heat: 76, category: '数据' },
    { id: 'md-13', name: '前端安全防护',     tier: 'mid', heat: 78, category: '安全' },
    { id: 'md-14', name: '自动化测试体系',   tier: 'mid', heat: 76, category: '测试' },
    { id: 'md-15', name: '可视化方案设计',   tier: 'mid', heat: 75, category: '前端' },
    { id: 'md-16', name: '国际化 & 无障碍',  tier: 'mid', heat: 72, category: '前端' },

    // ── 初阶岗位技能（执行开发能力，写代码）──
    { id: 'jr-1',  name: 'Vue / React 开发',  tier: 'junior', heat: 80, category: '前端' },
    { id: 'jr-2',  name: 'TypeScript 应用',   tier: 'junior', heat: 79, category: '前端' },
    { id: 'jr-3',  name: 'CSS 布局与动画',    tier: 'junior', heat: 76, category: '前端' },
    { id: 'jr-4',  name: '响应式 & 移动端',   tier: 'junior', heat: 74, category: '前端' },
    { id: 'jr-5',  name: 'Webpack / Vite',    tier: 'junior', heat: 75, category: '前端' },
    { id: 'jr-6',  name: 'Node.js 开发',      tier: 'junior', heat: 77, category: '后端' },
    { id: 'jr-7',  name: 'REST & GraphQL',    tier: 'junior', heat: 76, category: '后端' },
    { id: 'jr-8',  name: 'SQL 查询优化',      tier: 'junior', heat: 74, category: '后端' },
    { id: 'jr-9',  name: 'Python 脚本开发',   tier: 'junior', heat: 72, category: '后端' },
    { id: 'jr-10', name: 'Git 版本管理',       tier: 'junior', heat: 80, category: '工具' },
    { id: 'jr-11', name: 'Linux 基础操作',     tier: 'junior', heat: 74, category: '运维' },
    { id: 'jr-12', name: 'Docker 基础',        tier: 'junior', heat: 73, category: '运维' },
    { id: 'jr-13', name: '单元测试编写',       tier: 'junior', heat: 72, category: '测试' },
    { id: 'jr-14', name: 'HTTP 调试 & 抓包',  tier: 'junior', heat: 71, category: '调试' },
    { id: 'jr-15', name: '浏览器开发者工具',  tier: 'junior', heat: 75, category: '调试' },
    { id: 'jr-16', name: '接口联调协作',       tier: 'junior', heat: 70, category: '协作' },
    { id: 'jr-17', name: '代码规范遵循',       tier: 'junior', heat: 72, category: '规范' },
    { id: 'jr-18', name: '日志分析排查',       tier: 'junior', heat: 68, category: '调试' },
    { id: 'jr-19', name: 'Shell 脚本基础',     tier: 'junior', heat: 66, category: '运维' },
    { id: 'jr-20', name: '基础性能优化',       tier: 'junior', heat: 70, category: '性能' },

    // ── 专业技能底层（基础知识与原理）──
    { id: 'fn-1',  name: 'HTML 语义化',       tier: 'foundation', heat: 72, category: 'Web基础' },
    { id: 'fn-2',  name: 'CSS 基础',          tier: 'foundation', heat: 71, category: 'Web基础' },
    { id: 'fn-3',  name: 'JavaScript 核心',   tier: 'foundation', heat: 85, category: '编程语言' },
    { id: 'fn-4',  name: 'ES6+ 语法特性',     tier: 'foundation', heat: 80, category: '编程语言' },
    { id: 'fn-5',  name: 'Python 基础',       tier: 'foundation', heat: 74, category: '编程语言' },
    { id: 'fn-6',  name: 'Java / Go 基础',    tier: 'foundation', heat: 68, category: '编程语言' },
    { id: 'fn-7',  name: '数据结构',          tier: 'foundation', heat: 88, category: 'CS核心' },
    { id: 'fn-8',  name: '算法与复杂度',      tier: 'foundation', heat: 87, category: 'CS核心' },
    { id: 'fn-9',  name: '计算机网络',        tier: 'foundation', heat: 82, category: 'CS核心' },
    { id: 'fn-10', name: '操作系统原理',      tier: 'foundation', heat: 80, category: 'CS核心' },
    { id: 'fn-11', name: '数据库原理',        tier: 'foundation', heat: 78, category: 'CS核心' },
    { id: 'fn-12', name: '计算机组成原理',    tier: 'foundation', heat: 70, category: 'CS核心' },
    { id: 'fn-13', name: '编译原理基础',      tier: 'foundation', heat: 65, category: 'CS核心' },
    { id: 'fn-14', name: '离散数学',          tier: 'foundation', heat: 63, category: '数学' },
    { id: 'fn-15', name: '线性代数',          tier: 'foundation', heat: 62, category: '数学' },
    { id: 'fn-16', name: '概率与统计',        tier: 'foundation', heat: 61, category: '数学' },
    { id: 'fn-17', name: 'TCP/IP 协议栈',     tier: 'foundation', heat: 76, category: '网络' },
    { id: 'fn-18', name: 'HTTP / HTTPS',      tier: 'foundation', heat: 78, category: '网络' },
    { id: 'fn-19', name: '浏览器工作原理',    tier: 'foundation', heat: 77, category: '浏览器' },
    { id: 'fn-20', name: '设计模式',          tier: 'foundation', heat: 75, category: '软件工程' },
    { id: 'fn-21', name: '面向对象编程',      tier: 'foundation', heat: 76, category: '编程范式' },
    { id: 'fn-22', name: '函数式编程',        tier: 'foundation', heat: 68, category: '编程范式' },
    { id: 'fn-23', name: '软件工程导论',      tier: 'foundation', heat: 66, category: '软件工程' },
    { id: 'fn-24', name: 'Web 安全基础',      tier: 'foundation', heat: 72, category: '安全' },
    { id: 'fn-25', name: '版本控制概念',      tier: 'foundation', heat: 70, category: '工具' },
  ]

  // ── 前端职业主成长链路节点 ID 集合 ──
  const careerPathNodes = new Set([
    'job-1',
    'sr-1', 'sr-4', 'sr-9',
    'md-1', 'md-2', 'md-3', 'md-4', 'md-15',
    'jr-1', 'jr-2', 'jr-3', 'jr-4', 'jr-5',
    'fn-1', 'fn-2', 'fn-3', 'fn-4', 'fn-7', 'fn-19', 'fn-21', 'fn-22',
  ])

  const rawEdges: Omit<CourseEdge, 'isCareerPath'>[] = [
    // job ← senior
    { source: 'sr-1',  target: 'job-1', relation: 'compose' },
    { source: 'sr-2',  target: 'job-1', relation: 'compose' },
    { source: 'sr-3',  target: 'job-1', relation: 'compose' },
    { source: 'sr-4',  target: 'job-1', relation: 'compose' },
    { source: 'sr-8',  target: 'job-1', relation: 'compose' },
    { source: 'sr-9',  target: 'job-1', relation: 'compose' },
    { source: 'sr-10', target: 'job-1', relation: 'compose' },

    // senior ← mid
    { source: 'md-1',  target: 'sr-1',  relation: 'support' },
    { source: 'md-2',  target: 'sr-1',  relation: 'support' },
    { source: 'md-3',  target: 'sr-1',  relation: 'support' },
    { source: 'md-4',  target: 'sr-1',  relation: 'support' },
    { source: 'md-5',  target: 'sr-2',  relation: 'support' },
    { source: 'md-6',  target: 'sr-2',  relation: 'support' },
    { source: 'md-7',  target: 'sr-2',  relation: 'support' },
    { source: 'md-8',  target: 'sr-2',  relation: 'support' },
    { source: 'md-3',  target: 'sr-3',  relation: 'support' },
    { source: 'md-5',  target: 'sr-3',  relation: 'support' },
    { source: 'md-7',  target: 'sr-3',  relation: 'support' },
    { source: 'md-1',  target: 'sr-4',  relation: 'support' },
    { source: 'md-6',  target: 'sr-4',  relation: 'support' },
    { source: 'md-9',  target: 'sr-5',  relation: 'support' },
    { source: 'md-10', target: 'sr-5',  relation: 'support' },
    { source: 'md-11', target: 'sr-5',  relation: 'support' },
    { source: 'md-12', target: 'sr-6',  relation: 'support' },
    { source: 'md-13', target: 'sr-7',  relation: 'support' },
    { source: 'md-14', target: 'sr-8',  relation: 'support' },
    { source: 'md-2',  target: 'sr-9',  relation: 'support' },
    { source: 'md-4',  target: 'sr-9',  relation: 'support' },
    { source: 'md-15', target: 'sr-9',  relation: 'support' },
    { source: 'md-10', target: 'sr-12', relation: 'support' },

    // mid ← junior
    { source: 'jr-1',  target: 'md-1',  relation: 'prerequisite' },
    { source: 'jr-2',  target: 'md-1',  relation: 'prerequisite' },
    { source: 'jr-5',  target: 'md-1',  relation: 'prerequisite' },
    { source: 'jr-1',  target: 'md-2',  relation: 'prerequisite' },
    { source: 'jr-2',  target: 'md-2',  relation: 'prerequisite' },
    { source: 'jr-1',  target: 'md-3',  relation: 'prerequisite' },
    { source: 'jr-6',  target: 'md-3',  relation: 'prerequisite' },
    { source: 'jr-1',  target: 'md-4',  relation: 'prerequisite' },
    { source: 'jr-2',  target: 'md-4',  relation: 'prerequisite' },
    { source: 'jr-6',  target: 'md-5',  relation: 'prerequisite' },
    { source: 'jr-7',  target: 'md-5',  relation: 'prerequisite' },
    { source: 'jr-8',  target: 'md-6',  relation: 'prerequisite' },
    { source: 'jr-6',  target: 'md-7',  relation: 'prerequisite' },
    { source: 'jr-7',  target: 'md-7',  relation: 'prerequisite' },
    { source: 'jr-6',  target: 'md-8',  relation: 'prerequisite' },
    { source: 'jr-10', target: 'md-9',  relation: 'prerequisite' },
    { source: 'jr-11', target: 'md-9',  relation: 'prerequisite' },
    { source: 'jr-12', target: 'md-10', relation: 'prerequisite' },
    { source: 'jr-11', target: 'md-10', relation: 'prerequisite' },
    { source: 'jr-14', target: 'md-11', relation: 'prerequisite' },
    { source: 'jr-9',  target: 'md-12', relation: 'prerequisite' },
    { source: 'jr-8',  target: 'md-12', relation: 'prerequisite' },
    { source: 'jr-14', target: 'md-13', relation: 'prerequisite' },
    { source: 'jr-13', target: 'md-14', relation: 'prerequisite' },
    { source: 'jr-1',  target: 'md-15', relation: 'prerequisite' },
    { source: 'jr-3',  target: 'md-15', relation: 'prerequisite' },
    { source: 'jr-3',  target: 'md-16', relation: 'prerequisite' },
    { source: 'jr-4',  target: 'md-16', relation: 'prerequisite' },

    // junior ← foundation
    { source: 'fn-1',  target: 'jr-1',  relation: 'prerequisite' },
    { source: 'fn-2',  target: 'jr-1',  relation: 'prerequisite' },
    { source: 'fn-3',  target: 'jr-1',  relation: 'prerequisite' },
    { source: 'fn-4',  target: 'jr-2',  relation: 'prerequisite' },
    { source: 'fn-3',  target: 'jr-2',  relation: 'prerequisite' },
    { source: 'fn-2',  target: 'jr-3',  relation: 'prerequisite' },
    { source: 'fn-1',  target: 'jr-4',  relation: 'prerequisite' },
    { source: 'fn-2',  target: 'jr-4',  relation: 'prerequisite' },
    { source: 'fn-7',  target: 'jr-5',  relation: 'prerequisite' },
    { source: 'fn-3',  target: 'jr-6',  relation: 'prerequisite' },
    { source: 'fn-5',  target: 'jr-6',  relation: 'prerequisite' },
    { source: 'fn-18', target: 'jr-7',  relation: 'prerequisite' },
    { source: 'fn-9',  target: 'jr-7',  relation: 'prerequisite' },
    { source: 'fn-11', target: 'jr-8',  relation: 'prerequisite' },
    { source: 'fn-5',  target: 'jr-9',  relation: 'prerequisite' },
    { source: 'fn-25', target: 'jr-10', relation: 'prerequisite' },
    { source: 'fn-10', target: 'jr-11', relation: 'prerequisite' },
    { source: 'fn-10', target: 'jr-12', relation: 'prerequisite' },
    { source: 'fn-23', target: 'jr-13', relation: 'prerequisite' },
    { source: 'fn-17', target: 'jr-14', relation: 'prerequisite' },
    { source: 'fn-18', target: 'jr-14', relation: 'prerequisite' },
    { source: 'fn-19', target: 'jr-15', relation: 'prerequisite' },
    { source: 'fn-20', target: 'jr-17', relation: 'prerequisite' },
    { source: 'fn-10', target: 'jr-19', relation: 'prerequisite' },
    { source: 'fn-7',  target: 'jr-20', relation: 'prerequisite' },
    { source: 'fn-8',  target: 'jr-20', relation: 'prerequisite' },
    { source: 'fn-24', target: 'jr-14', relation: 'prerequisite' },
    { source: 'fn-21', target: 'jr-1',  relation: 'prerequisite' },
    { source: 'fn-22', target: 'jr-2',  relation: 'prerequisite' },

    // 跨层连线（基础 → 中阶）
    { source: 'fn-7',  target: 'md-6',  relation: 'support' },
    { source: 'fn-8',  target: 'md-6',  relation: 'support' },
    { source: 'fn-9',  target: 'md-7',  relation: 'support' },
    { source: 'fn-17', target: 'md-13', relation: 'support' },
    { source: 'fn-24', target: 'md-13', relation: 'support' },
  ]

  // 自动标记职业成长链路
  const edges: CourseEdge[] = rawEdges.map(e => ({
    ...e,
    isCareerPath: careerPathNodes.has(e.source) && careerPathNodes.has(e.target),
  }))

  // ── 课程体系节点（双体系并置 — 右侧课程区） ──
  const courseNodes: GraphCourseNode[] = [
    // 基础课程
    { id: 'gc-1',  title: '计算机导论',          group: 'foundation-course', difficulty: 'beginner',     relatedSkillIds: ['fn-7','fn-8','fn-10','fn-12'],     importance: 'core' },
    { id: 'gc-2',  title: 'Web 开发基础',        group: 'foundation-course', difficulty: 'beginner',     relatedSkillIds: ['fn-1','fn-2','fn-3','fn-18'],       importance: 'core' },
    { id: 'gc-3',  title: '数据结构与算法',      group: 'foundation-course', difficulty: 'intermediate', relatedSkillIds: ['fn-7','fn-8','fn-14'],              importance: 'core' },
    { id: 'gc-4',  title: '计算机网络',          group: 'foundation-course', difficulty: 'intermediate', relatedSkillIds: ['fn-9','fn-17','fn-18'],             importance: 'core' },
    { id: 'gc-5',  title: '编程语言原理',        group: 'foundation-course', difficulty: 'intermediate', relatedSkillIds: ['fn-3','fn-5','fn-6','fn-21','fn-22'], importance: 'recommended' },
    // 框架课程
    { id: 'gc-6',  title: 'Vue 3 实战开发',      group: 'framework-course',  difficulty: 'intermediate', relatedSkillIds: ['jr-1','jr-2','jr-3'],               importance: 'core' },
    { id: 'gc-7',  title: 'React 生态开发',      group: 'framework-course',  difficulty: 'intermediate', relatedSkillIds: ['jr-1','jr-2'],                      importance: 'recommended' },
    { id: 'gc-8',  title: 'TypeScript 高级编程',  group: 'framework-course',  difficulty: 'advanced',     relatedSkillIds: ['jr-2','fn-4'],                      importance: 'core' },
    { id: 'gc-9',  title: 'Node.js 全栈开发',    group: 'framework-course',  difficulty: 'intermediate', relatedSkillIds: ['jr-6','jr-7'],                      importance: 'recommended' },
    // 工程化课程
    { id: 'gc-10', title: '前端工程化实践',      group: 'engineering-course', difficulty: 'intermediate', relatedSkillIds: ['md-1','jr-5','jr-10'],              importance: 'core' },
    { id: 'gc-11', title: '前端自动化测试',      group: 'engineering-course', difficulty: 'intermediate', relatedSkillIds: ['md-14','jr-13'],                    importance: 'recommended' },
    { id: 'gc-12', title: '性能优化实战',        group: 'engineering-course', difficulty: 'advanced',     relatedSkillIds: ['sr-4','md-1','jr-20'],              importance: 'core' },
    { id: 'gc-13', title: 'CI/CD 与 DevOps',     group: 'engineering-course', difficulty: 'intermediate', relatedSkillIds: ['md-9','md-10','jr-12'],             importance: 'recommended' },
    // 后端协同课程
    { id: 'gc-14', title: '数据库设计与优化',    group: 'backend-course',     difficulty: 'intermediate', relatedSkillIds: ['md-6','jr-8','fn-11'],              importance: 'recommended' },
    { id: 'gc-15', title: '微服务架构入门',      group: 'backend-course',     difficulty: 'advanced',     relatedSkillIds: ['md-7','md-8','jr-6'],               importance: 'optional' },
    { id: 'gc-16', title: 'Web 安全攻防',        group: 'backend-course',     difficulty: 'intermediate', relatedSkillIds: ['md-13','fn-24','jr-14'],            importance: 'recommended' },
    // 架构进阶课程
    { id: 'gc-17', title: '前端架构设计',        group: 'architecture-course', difficulty: 'advanced',    relatedSkillIds: ['sr-1','sr-9','md-2','md-4'],        importance: 'core' },
    { id: 'gc-18', title: '大规模前端应用',      group: 'architecture-course', difficulty: 'advanced',    relatedSkillIds: ['sr-1','sr-4','sr-11','md-3'],       importance: 'core' },
    { id: 'gc-19', title: '可视化与图形学',      group: 'architecture-course', difficulty: 'advanced',    relatedSkillIds: ['md-15','jr-3','fn-15'],             importance: 'optional' },
  ]

  // ── 技能-课程关联边 ──
  const skillCourseEdges: SkillCourseEdge[] = courseNodes.flatMap(cn =>
    cn.relatedSkillIds.map(sid => ({
      skillId: sid,
      courseId: cn.id,
      relation: cn.importance === 'core' ? 'core' as const
              : cn.importance === 'recommended' ? 'recommended' as const
              : 'advanced' as const,
    }))
  )

  return { nodes, edges, courseNodes, skillCourseEdges }
}

/* ═══ 右侧面板 mock（保留兼容） ═══ */
export function getSkillEntries(_role: string): SkillEntry[] { return [] }

/* ═══ 3D 布局计算（正金字塔：顶窄底宽，同参考图） ═══ */

/**
 * 计算五层 3D 平台几何参数
 * TIER_ORDER[0]=foundation(底,最大) … TIER_ORDER[4]=job(顶,最小)
 */
export function compute3DLayouts(): Layer3DLayout[] {
  const yLevels:  Record<SkillTier, number> = { foundation: 0, junior: 24, mid: 48, senior: 72, job: 92 }
  const xHalves:  Record<SkillTier, number> = { foundation: 140, junior: 112, mid: 84, senior: 58, job: 10 }
  const zHalves:  Record<SkillTier, number> = { foundation: 74, junior: 58, mid: 44, senior: 30, job:  6 }
 
  return TIER_ORDER.map(tier => ({
    tier,
    yLevel: yLevels[tier],
    xHalf:  xHalves[tier],
    zHalf:  zHalves[tier],
  }))
}

/** 确定性伪随机（sin hash） */
function seededRand(seed: number): number {
  const x = Math.sin(seed) * 43758.5453123
  return x - Math.floor(x) // 0..1
}

/**
 * 计算所有节点的 3D 坐标
 * Y 轴固定于层高，XZ 在平台范围内打散 + 微扰动，避免整齐格栅感
 */
export function computeNode3DPositions(
  nodes: CourseNode[],
  layouts: Layer3DLayout[],
): Map<string, Node3DPos> {
  const layoutMap = new Map<SkillTier, Layer3DLayout>()
  layouts.forEach(l => layoutMap.set(l.tier, l))

  const tierBuckets = new Map<SkillTier, CourseNode[]>()
  for (const n of nodes) {
    const arr = tierBuckets.get(n.tier) ?? []
    arr.push(n)
    tierBuckets.set(n.tier, arr)
  }

  const result = new Map<string, Node3DPos>()

  for (const [tier, bucket] of tierBuckets) {
    const lay = layoutMap.get(tier)
    if (!lay) continue
    const count = bucket.length
    const tierSeed = tier.split('').reduce((s, c) => s + c.charCodeAt(0), 0)

    if (count === 1) {
      result.set(bucket[0]!.id, { x: 0, y: lay.yLevel, z: 0 })
      continue
    }

    // 疏松网格底座（节点打散到整个平台面）
    const cols = Math.ceil(Math.sqrt(count * 1.8))
    const rows = Math.ceil(count / cols)
    const xSpan = lay.xHalf * 1.75
    const zSpan = lay.zHalf * 1.65
    const xStep = cols > 1 ? xSpan / (cols - 1) : 0
    const zStep = rows > 1 ? zSpan / (rows - 1) : 0

    bucket.forEach((n, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const xBase = -lay.xHalf * 0.875 + col * xStep
      const zBase = -lay.zHalf * 0.825 + row * zStep

      // 微扰动（约 ±10% 格距），使布局有机而不规则
      const jx = (seededRand(tierSeed + idx * 127.1) * 2 - 1) * xStep * 0.38
      const jz = (seededRand(tierSeed + idx * 311.7) * 2 - 1) * zStep * 0.38

      result.set(n.id, { x: xBase + jx, y: lay.yLevel, z: zBase + jz })
    })
  }

  return result
}

/* ═══ 兼容旧 2D 布局（保留类型，避免编译报错） ═══ */
export interface LayerLayout {
  tier: SkillTier
  centerY: number
  xRange: [number, number]
  trapezoid: { x: number; y: number }[]
}
export function computeLayerLayouts(_w: number, _h: number): LayerLayout[] { return [] }
export function computeNodePositions(_n: CourseNode[], _l: LayerLayout[]): Map<string, {x:number;y:number}> { return new Map() }

/* ═══ 数据获取（预留接口替换） ═══ */
export async function getCourseSystemData(role: string): Promise<CourseSystemData> {
  return buildMockData(role)
}
