/* ══ 职业生涯发展报告 Mock 数据 ══ */

export type SevenDim = {
  专业技能: number
  证书资质: number
  创新能力: number
  学习能力: number
  抗压能力: number
  沟通能力: number
  实习经验: number
}

export type JobLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'expert'

export type JobPortrait = {
  id: string
  title: string
  level: JobLevel
  lineId: string
  sevenDim: SevenDim
  keySkills: string[]
  salaryRange: string
  desc: string
}

export type MetroLine = {
  id: string
  name: string
  color: string
  trackColor: string
  stationIds: string[]
}

export type TransferEdge = {
  fromId: string
  toId: string
  skills: string[]
  label: string
}

/* ══ 岗位画像（12个）══ */
export const JOB_PORTRAITS: JobPortrait[] = [
  /* ── 前端线 ── */
  {
    id: 'fe-intern',
    title: '前端实习生',
    level: 'intern',
    lineId: 'frontend',
    salaryRange: '6K–10K',
    desc: '参与页面开发与 Bug 修复，积累工程实践经验',
    keySkills: ['HTML/CSS', 'JavaScript', 'Vue 基础', 'Git'],
    sevenDim: { 专业技能: 40, 证书资质: 20, 创新能力: 35, 学习能力: 80, 抗压能力: 55, 沟通能力: 60, 实习经验: 30 },
  },
  {
    id: 'fe-junior',
    title: '初级前端工程师',
    level: 'junior',
    lineId: 'frontend',
    salaryRange: '12K–18K',
    desc: '独立负责中小模块，熟练使用 Vue3 + TypeScript',
    keySkills: ['Vue 3', 'TypeScript', 'Element Plus', 'Vite', 'REST API'],
    sevenDim: { 专业技能: 60, 证书资质: 30, 创新能力: 45, 学习能力: 78, 抗压能力: 60, 沟通能力: 65, 实习经验: 50 },
  },
  {
    id: 'fe-mid',
    title: '中级前端工程师',
    level: 'mid',
    lineId: 'frontend',
    salaryRange: '18K–28K',
    desc: '主导功能设计与组件体系搭建，具备性能优化能力',
    keySkills: ['Vue 3 / React', 'TypeScript', '性能优化', 'SSR', '微前端'],
    sevenDim: { 专业技能: 75, 证书资质: 40, 创新能力: 60, 学习能力: 75, 抗压能力: 68, 沟通能力: 72, 实习经验: 65 },
  },
  {
    id: 'fe-senior',
    title: '高级前端工程师',
    level: 'senior',
    lineId: 'frontend',
    salaryRange: '28K–40K',
    desc: '负责技术选型、架构设计与跨端方案落地',
    keySkills: ['架构设计', 'Node.js', '工程化体系', '团队 Code Review', '跨端'],
    sevenDim: { 专业技能: 88, 证书资质: 55, 创新能力: 75, 学习能力: 72, 抗压能力: 78, 沟通能力: 80, 实习经验: 80 },
  },
  {
    id: 'fe-lead',
    title: '前端技术负责人',
    level: 'lead',
    lineId: 'frontend',
    salaryRange: '40K–60K',
    desc: '统筹团队技术方向，推动研发效能与质量体系建设',
    keySkills: ['技术管理', '项目规划', '跨部门协作', '招聘面试', '架构治理'],
    sevenDim: { 专业技能: 90, 证书资质: 65, 创新能力: 85, 学习能力: 68, 抗压能力: 88, 沟通能力: 90, 实习经验: 90 },
  },

  /* ── 数据/AI 线 ── */
  {
    id: 'da-junior',
    title: '初级数据分析师',
    level: 'junior',
    lineId: 'data',
    salaryRange: '10K–16K',
    desc: '进行数据清洗与基础报表制作，辅助业务决策',
    keySkills: ['Python', 'SQL', 'Excel/BI', '统计基础'],
    sevenDim: { 专业技能: 58, 证书资质: 35, 创新能力: 40, 学习能力: 76, 抗压能力: 58, 沟通能力: 62, 实习经验: 40 },
  },
  {
    id: 'da-mid',
    title: '高级数据分析师',
    level: 'mid',
    lineId: 'data',
    salaryRange: '18K–28K',
    desc: '建立指标体系与分析模型，推动数据驱动决策落地',
    keySkills: ['Python', 'Pandas', 'A/B 测试', 'BI 可视化', '数仓基础'],
    sevenDim: { 专业技能: 74, 证书资质: 45, 创新能力: 62, 学习能力: 73, 抗压能力: 65, 沟通能力: 72, 实习经验: 60 },
  },
  {
    id: 'ml-engineer',
    title: 'ML 算法工程师',
    level: 'senior',
    lineId: 'data',
    salaryRange: '28K–45K',
    desc: '主导推荐/风控/NLP 算法研发，推动模型线上部署',
    keySkills: ['机器学习', '深度学习', 'PyTorch', '特征工程', 'MLOps'],
    sevenDim: { 专业技能: 86, 证书资质: 60, 创新能力: 80, 学习能力: 70, 抗压能力: 75, 沟通能力: 65, 实习经验: 72 },
  },

  /* ── 测试线 ── */
  {
    id: 'qa-junior',
    title: '测试工程师',
    level: 'junior',
    lineId: 'qa',
    salaryRange: '10K–16K',
    desc: '执行功能测试与接口测试，维护测试用例',
    keySkills: ['Postman', '用例设计', 'SQL', 'Linux 基础'],
    sevenDim: { 专业技能: 55, 证书资质: 25, 创新能力: 38, 学习能力: 74, 抗压能力: 60, 沟通能力: 65, 实习经验: 42 },
  },
  {
    id: 'qa-senior',
    title: '高级测试开发工程师',
    level: 'senior',
    lineId: 'qa',
    salaryRange: '20K–32K',
    desc: '搭建自动化测试框架，推动质量体系与 CI/CD 融合',
    keySkills: ['Playwright', 'Python/Java', 'CI/CD', '性能测试', '质量平台'],
    sevenDim: { 专业技能: 80, 证书资质: 50, 创新能力: 65, 学习能力: 70, 抗压能力: 72, 沟通能力: 70, 实习经验: 68 },
  },

  /* ── 全栈/跨线岗位 ── */
  {
    id: 'fullstack',
    title: '全栈工程师',
    level: 'mid',
    lineId: 'fullstack',
    salaryRange: '22K–35K',
    desc: '同时承担前端与后端开发，快速支撑产品从 0 到 1',
    keySkills: ['Vue 3', 'Node.js', 'MySQL', 'Docker', 'REST API'],
    sevenDim: { 专业技能: 78, 证书资质: 42, 创新能力: 68, 学习能力: 80, 抗压能力: 72, 沟通能力: 68, 实习经验: 62 },
  },
  {
    id: 'tech-pm',
    title: '技术产品经理',
    level: 'mid',
    lineId: 'fullstack',
    salaryRange: '20K–32K',
    desc: '连接业务与技术，主导产品功能规划与上线节奏',
    keySkills: ['产品设计', 'Axure/Figma', '数据分析', '跨团队协作', '技术沟通'],
    sevenDim: { 专业技能: 60, 证书资质: 45, 创新能力: 82, 学习能力: 76, 抗压能力: 80, 沟通能力: 92, 实习经验: 68 },
  },
]

/* ══ 地铁线路（3条主线 + 1条跨线）══ */
export const METRO_LINES: MetroLine[] = [
  {
    id: 'frontend',
    name: '前端工程线',
    color: '#C4622D',
    trackColor: 'rgba(196,98,45,0.7)',
    stationIds: ['fe-intern', 'fe-junior', 'fe-mid', 'fe-senior', 'fe-lead'],
  },
  {
    id: 'data',
    name: '数据/AI线',
    color: '#B8962E',
    trackColor: 'rgba(184,150,46,0.7)',
    stationIds: ['da-junior', 'da-mid', 'ml-engineer'],
  },
  {
    id: 'qa',
    name: '测试开发线',
    color: '#3A8A7A',
    trackColor: 'rgba(58,138,122,0.7)',
    stationIds: ['qa-junior', 'qa-senior'],
  },
  {
    id: 'fullstack',
    name: '跨界路线',
    color: '#6A5B8A',
    trackColor: 'rgba(106,91,138,0.7)',
    stationIds: ['fullstack', 'tech-pm'],
  },
]

/* ══ 换乘连接（转岗路径，至少 5 条）══ */
export const TRANSFER_EDGES: TransferEdge[] = [
  {
    fromId: 'fe-mid',
    toId: 'fullstack',
    skills: ['Node.js', 'MySQL', 'Docker'],
    label: '补齐后端基础',
  },
  {
    fromId: 'fe-mid',
    toId: 'tech-pm',
    skills: ['产品思维', '用户调研', 'Axure'],
    label: '转型产品方向',
  },
  {
    fromId: 'fullstack',
    toId: 'da-mid',
    skills: ['Python', 'SQL 进阶', '统计学'],
    label: '数据化转型',
  },
  {
    fromId: 'fe-senior',
    toId: 'ml-engineer',
    skills: ['Python', '机器学习基础', 'PyTorch'],
    label: '转 AI 方向',
  },
  {
    fromId: 'qa-senior',
    toId: 'fe-mid',
    skills: ['Vue 3', 'TypeScript', '性能优化'],
    label: '转开发方向',
  },
  {
    fromId: 'da-mid',
    toId: 'ml-engineer',
    skills: ['深度学习', 'PyTorch', '特征工程'],
    label: '进阶 ML 方向',
  },
  {
    fromId: 'fe-junior',
    toId: 'qa-junior',
    skills: ['测试框架', '用例设计', 'CI/CD'],
    label: '转测试开发',
  },
]

/* ══ 辅助：根据 resumeStore 匹配结果推算学生七维能力 ══ */
export function deriveStudentSevenDim(
  skillWeights: Array<{ name: string; weight: number; category: string }>,
  confidence: number,
): SevenDim {
  const techSkills = skillWeights.filter(s => ['前端', '后端', '测试', '数据', '机器学习'].includes(s.category))
  const avgTech = techSkills.length
    ? techSkills.reduce((s, i) => s + i.weight, 0) / techSkills.length
    : 0.4

  return {
    专业技能: Math.round(avgTech * 100),
    证书资质: Math.round(confidence * 45),
    创新能力: Math.round(40 + confidence * 30),
    学习能力: Math.round(55 + confidence * 25),
    抗压能力: Math.round(45 + confidence * 25),
    沟通能力: Math.round(50 + confidence * 20),
    实习经验: Math.round(avgTech * 70),
  }
}

/* ══ 成长计划 mock（按选定岗位生成）══ */
export type GrowthAction = {
  phase: 'short' | 'mid'
  phaseLabel: string
  goal: string
  tasks: string[]
  milestone: string
}

export function getGrowthPlan(jobId: string): GrowthAction[] {
  const job = JOB_PORTRAITS.find(j => j.id === jobId)
  if (!job) return []

  const skillList = job.keySkills.slice(0, 3).join('、')

  return [
    {
      phase: 'short',
      phaseLabel: '短期（0–6个月）',
      goal: `系统补齐 ${skillList} 等核心技能，达到岗位基础要求`,
      tasks: [
        `完成 ${job.keySkills[0] ?? '核心技能'} 系统性学习（慕课/文档/项目实践）`,
        `在 GitHub 产出 2 个以上相关 Demo 项目`,
        `参加本校或线上相关技术比赛/Hackathon`,
        job.sevenDim.证书资质 > 60 ? '备考并取得行业认可证书（如软考中级）' : '持续刷 LeetCode，强化算法基础',
      ],
      milestone: `3个月内完成学习，6个月内投递 ${job.title} 实习`,
    },
    {
      phase: 'mid',
      phaseLabel: '中期（6–18个月）',
      goal: `通过实战项目证明 ${job.title} 岗位能力，形成竞争力`,
      tasks: [
        `参与至少 1 段与 ${job.title} 强相关的实习（3个月以上）`,
        `输出 1 份技术分享/博客，展示对 ${job.keySkills[1] ?? '关键技术'} 的深度理解`,
        `积累 2–3 个可展示的完整业务项目经验`,
        '主动参与开源社区，积累 PR 贡献记录',
      ],
      milestone: `18个月内拿到 ${job.title} 正式 Offer，薪资达到 ${job.salaryRange}`,
    },
  ]
}
