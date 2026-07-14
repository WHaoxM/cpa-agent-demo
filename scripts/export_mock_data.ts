/**
 * 导出前端 mock 数据为 JSON，供后端 Python 脚本读取并导入 MySQL
 * 用法: npx tsx scripts/export_mock_data.ts
 */
import { JOB_PORTRAITS } from '../src/mock/careerPortraits'
import { mockCourses } from '../src/mock/data'
import { careerCourses } from '../src/mock/careerCourses'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const outDir = resolve(__dirname, '..', '..', 'backend', 'scripts', 'mock_data')
mkdirSync(outDir, { recursive: true })

// 1. 导出岗位画像 (用于生成 job_posting + match_result)
const jobPortraits = JOB_PORTRAITS.map(j => ({
  id: j.id,
  title: j.title,
  level: j.level,
  lineId: j.lineId,
  stack: j.stack || '',
  salaryRange: j.salaryRange,
  desc: j.desc,
  keySkills: j.keySkills,
  sevenDim: j.sevenDim,
  matchScore: j.matchScore,
}))

writeFileSync(resolve(outDir, 'job_portraits.json'), JSON.stringify(jobPortraits, null, 2))
console.log(`✅ job_portraits.json: ${jobPortraits.length} 条`)

// 2. 导出课程数据 (用于扩展 course 表)
const allCourses = [...mockCourses, ...careerCourses].map(c => ({
  course_id: c.id,
  title: c.title,
  description: c.description,
  category: c.categoryId,
  difficulty: 'beginner',
  duration_hours: Math.round((c.totalDuration || 0) / 60 * 10) / 10,
  instructor: c.teacherName || '未知讲师',
  thumbnail_url: c.cover || '',
  skill_tags: c.skillTags || [],
  external_url: (c as { externalUrl?: string }).externalUrl || '',
}))

writeFileSync(resolve(outDir, 'courses.json'), JSON.stringify(allCourses, null, 2))
console.log(`✅ courses.json: ${allCourses.length} 条`)

console.log('\n导出完成！JSON 文件位于 backend/scripts/mock_data/')
