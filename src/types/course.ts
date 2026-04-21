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
