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
