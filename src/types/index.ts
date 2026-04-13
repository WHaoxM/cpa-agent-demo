// 布局模式（职业能力图谱页面）
export type LayoutMode = 'single' | 'split' | 'workspace'

// 用户角色枚举
export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

// 用户接口
export interface User {
  id: string
  username: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  createdAt: string
  status: 'active' | 'disabled'
  classId?: string
  phone?: string
  signature?: string
}

// 登录用户信息
export interface AuthUser extends User {
  token: string
}

// 课程分类
export interface Category {
  id: string
  name: string
  icon?: string
}

// 课程章节
export interface Chapter {
  id: string
  title: string
  duration: number // 分钟
  videoUrl?: string
  order: number
}

// 课程
export interface Course {
  id: string
  title: string
  description: string
  skillTags?: string[]  // 对应岗位画像技能维度
  externalUrl?: string  // 外部课程链接（B站/慕课网等）
  cover: string
  categoryId: string
  teacherId: string
  teacherName: string
  chapters: Chapter[]
  status: 'draft' | 'published' | 'under_review' | 'rejected'
  createdAt: string
  updatedAt: string
  totalDuration: number
  studentCount: number
  rating: number
}

// 学习进度
export interface LearningProgress {
  userId: string
  courseId: string
  chapterId: string
  progress: number // 0-100
  lastPosition: number // 秒
  completed: boolean
  updatedAt: string
}

// 题目类型
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_BLANK = 'fill_blank'
}

// 题目
export interface Question {
  id: string
  courseId: string
  chapterId: string
  type: QuestionType
  content: string
  options?: string[]
  correctAnswer: string | string[]
  knowledgePoint: string
  difficulty: 'easy' | 'medium' | 'hard'
  score: number
}

// 测验记录
export interface QuizRecord {
  id: string
  userId: string
  courseId: string
  chapterId: string
  score: number
  totalScore: number
  answers: Record<string, string | string[]>
  correctAnswers: Record<string, boolean>
  duration: number // 分钟
  completedAt: string
}

// 错题
export interface WrongQuestion {
  id: string
  userId: string
  questionId: string
  question: Question
  wrongAnswer: string | string[]
  times: number
  lastWrongAt: string
}

// 笔记
export interface Note {
  id: string
  userId: string
  courseId: string
  chapterId?: string
  title: string
  content: string
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

// 学习报告数据
export interface LearningReport {
  userId: string
  totalStudyTime: number // 分钟
  completedChapters: number
  totalChapters: number
  averageScore: number
  quizCount: number
  weeklyProgress: Array<{
    date: string
    duration: number
    chapters: number
  }>
  knowledgePoints: Array<{
    name: string
    score: number
  }>
}

// 班级数据
export interface ClassData {
  id: string
  name: string
  studentCount: number
  courseIds: string[]
}

// 学生成绩
export interface StudentGrade {
  userId: string
  userName: string
  courseId: string
  totalScore: number
  quizScores: number[]
  completionRate: number
}

// 系统统计数据
export interface SystemStats {
  totalUsers: number
  students: number
  admins: number
  totalCourses: number
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  courseStats: Array<{
    category: string
    count: number
    learners: number
  }>
}

// D3图表数据类型
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface LineChartData {
  x: string | number
  y: number
  series?: string
}

export interface PieChartData {
  name: string
  value: number
}

export interface RadarChartData {
  axis: string
  value: number
}

// AI消息
export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  thinking?: string
  thinkingDuration?: number
  status?: 'streaming' | 'thinking' | 'done'
}

// ─── 知识图谱 & 多Agent ───

export type KnowledgeLayer = 'physical' | 'datalink' | 'network' | 'transport' | 'application' | 'security' | 'ops'
export type KnowledgeDifficulty = 'basic' | 'intermediate' | 'advanced'
export type KnowledgeKind = 'protocol' | 'device' | 'config' | 'security' | 'ops'
export type EdgeRelation = 'prerequisite' | 'dependency' | 'related'

export interface KnowledgeNode {
  id: string
  name: string
  layer: KnowledgeLayer
  difficulty: KnowledgeDifficulty
  kind: KnowledgeKind
  /** 节点权重 / 热度，影响 symbolSize */
  heat: number
  detail: KnowledgeNodeDetail
}

export interface KnowledgeEdge {
  source: string
  target: string
  relation: EdgeRelation
}

export interface KnowledgeNodeDetail {
  summary: string
  commands?: string[]
  topologySvg?: string
  captureHint?: string
  videoRef?: { label: string; timeSec: number }
  relatedExperiment?: string
  prerequisites?: string[]
}

export type AgentRole = 'knowledge-locator' | 'protocol-analyzer' | 'fault-diagnoser' | 'learning-advisor'

export type AgentStepStatus = 'waiting' | 'running' | 'done'

// 心仪岗位（收藏的岗位）
export interface SavedJob {
  id: string
  jobTitle: string
  company: string
  industry: string
  salary: string
  location: string
  matchScore: number       // 0-100，人岗匹配度
  requiredSkills: string[] // 岗位关键技能
  savedAt: string
  notes?: string           // 用户备注
  role?: string            // 对应的 CareerRole 方向
}

// 从职业分析收藏的职业方向（与 savedJobs 的具体职位严格区分）
export interface TargetRole {
  role: string   // CareerRole 值，如 '前端开发'
  savedAt: string
}

export interface TargetRoleMarket {
  role: string
  salaryRange: string
  medianSalary: number
  demandLevel: string
  hotCities: string[]
  industries: string[]
  skillTags: string[]
  sampleJobs: string[]
  trendNote: string
  referenceMatch: number
}

// 报告记录（存入 reportStore）
export interface ReportRecord {
  id: string
  type: 'portrait' | 'career'
  createdAt: string
  title: string
  snapshot: Record<string, unknown>
}

export interface AgentStep {
  role: AgentRole
  label: string
  status: AgentStepStatus
  input?: string
  reasoning?: string
  output?: string
  highlightNodeIds?: string[]
}

// ══ 职业生涯报告相关类型 ══

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
  stack?: string
  sevenDim: SevenDim
  keySkills: string[]
  salaryRange: string
  desc: string
  matchScore: number
}

export type CareerPathEdge = {
  fromId: string
  toId: string
  type: 'promote' | 'transfer'
  skills: string[]
}

/** 已废弃（保留兼容），新代码请用 CAREER_PATH_EDGES */
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

export type GrowthAction = {
  phase: 'short' | 'mid'
  phaseLabel: string
  goal: string
  tasks: string[]
  milestone: string
}
