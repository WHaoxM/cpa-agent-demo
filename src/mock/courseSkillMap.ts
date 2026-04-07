// courseSkillMap.ts
// 课程 ID → skillGraph 节点 ID 列表的静态映射
// 供 LearningCenter 推荐排序 和 Report 覆盖率计算使用

export const courseSkillMap: Record<string, string[]> = {
  course_001: ['vue3', 'ts', 'pinia'],          // Vue 3 前端开发实战
  course_002: ['ts', 'node'],                    // TypeScript 进阶开发
  course_003: ['node', 'docker', 'mysql'],       // Node.js 后端开发
  course_004: ['python', 'ml-framework', 'dl'],  // Python 人工智能入门
  course_005: ['mysql', 'redis'],               // MySQL 数据库设计
}

// 反向映射：skillGraph 节点 ID → 关联课程 ID 列表
export const skillToCourseMap: Record<string, string[]> = {}
for (const [courseId, skillIds] of Object.entries(courseSkillMap)) {
  for (const skillId of skillIds) {
    if (!skillToCourseMap[skillId]) skillToCourseMap[skillId] = []
    skillToCourseMap[skillId].push(courseId)
  }
}
