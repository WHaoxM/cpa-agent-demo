/* ══ 职业生涯发展报告 Mock 数据 — 聚合入口 ══ */
/* 类型、数据已拆至独立文件；此文件向后兼容，所有原有 import 无需修改 */

// 类型统一从 @/types 导出
export type { SevenDim, JobLevel, JobPortrait, CareerPathEdge, MetroLine, TransferEdge, GrowthAction } from '@/types'

// 数据从各分包导出
export { JOB_PORTRAITS } from './careerPortraits'
export { METRO_LINES, CAREER_PATH_EDGES, TRANSFER_EDGES } from './careerLines'

// 工具函数内部依赖
import type { SevenDim, GrowthAction } from '@/types'
import { JOB_PORTRAITS } from './careerPortraits'

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