const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001').replace(/\/$/, '')

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  count?: number
  source?: string
  warning?: string
}

export interface CareerLandscapeItem {
  category: string
  role_count: number
  avg_salary_range: string
  roles: string[]
}

export interface AgentChatData {
  reply: string
  session_id: string
  engine: string
  source: string
  active_subagent?: string
  elapsed_seconds?: number
  tool_calls?: unknown[]
}

export interface PipelineTriggerData {
  task_id: string
  pipeline: string
  status: string
}

export interface PipelineStatusData {
  task_id: string
  pipeline: string
  status: string
  progress: number
  result?: unknown
  error?: string | null
  created_at?: string | null
}

export interface ResumeParseData {
  text: string
  block_count: number
  blocks: Array<{ block_type: string; text: string; length: number }>
  metadata?: Record<string, unknown>
}

export interface CareerReportGenerateData {
  report_id: string
  status: string
  message?: string
  source?: string
  report?: Record<string, unknown>
}

export interface CareerReportListItem {
  report_id: string
  student_id: string
  job_portrait_id: string
  title?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  elapsed_seconds?: number | null
  html_path?: string | null
  pdf_path?: string | null
}

export interface CareerReportDetailData extends CareerReportListItem {
  student_name?: string | null
  school?: string | null
  position_name?: string | null
  chapters?: Record<string, unknown>
  report_json?: Record<string, unknown> | null
  download_urls?: {
    html?: string | null
    pdf?: string | null
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload?.error || payload?.message || `HTTP ${response.status}`
    throw new Error(message)
  }
  return payload as T
}

export async function fetchCareerLandscape(): Promise<ApiResponse<CareerLandscapeItem[]>> {
  return requestJson<ApiResponse<CareerLandscapeItem[]>>('/api/career/landscape')
}

export async function chatWithAgent(message: string): Promise<ApiResponse<AgentChatData>> {
  return requestJson<ApiResponse<AgentChatData>>('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ message, mode: 'demo' }),
  })
}

export async function triggerPipeline(payload: Record<string, unknown>): Promise<ApiResponse<PipelineTriggerData>> {
  return requestJson<ApiResponse<PipelineTriggerData>>('/api/pipeline/trigger', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchPipelineStatus(taskId: string): Promise<ApiResponse<PipelineStatusData>> {
  return requestJson<ApiResponse<PipelineStatusData>>(`/api/pipeline/status/${encodeURIComponent(taskId)}`)
}

export async function parseResumeText(text: string, studentId: string): Promise<ApiResponse<ResumeParseData>> {
  return requestJson<ApiResponse<ResumeParseData>>('/api/pipeline/ext/parse/resume', {
    method: 'POST',
    body: JSON.stringify({ text, student_id: studentId }),
  })
}

export async function generateCareerReport(payload: {
  student_id: string
  job_portrait_id: string
  title?: string
  type?: string
  snapshot?: Record<string, unknown>
}): Promise<ApiResponse<CareerReportGenerateData>> {
  return requestJson<ApiResponse<CareerReportGenerateData>>('/api/report/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchCareerReportList(studentId?: string): Promise<ApiResponse<CareerReportListItem[]>> {
  const params = new URLSearchParams()
  if (studentId) params.set('student_id', studentId)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return requestJson<ApiResponse<CareerReportListItem[]>>(`/api/report/list${suffix}`)
}

export async function fetchCareerReport(reportId: string): Promise<ApiResponse<CareerReportDetailData>> {
  return requestJson<ApiResponse<CareerReportDetailData>>(`/api/report/${encodeURIComponent(reportId)}`)
}

// ── 收藏岗位 API ──

export interface SavedJobItem {
  id?: number
  job_id: string
  user_id: string
  job_title?: string | null
  company?: string | null
  industry?: string | null
  salary?: string | null
  location?: string | null
  match_score?: number | null
  required_skills?: string | null
  saved_at?: string | null
}

export interface SaveJobPayload {
  job_id: string
  user_id: string
  job_title?: string
  company?: string
  industry?: string
  salary?: string
  location?: string
  match_score?: number
  required_skills?: string[]
}

export async function fetchSavedJobs(userId?: string): Promise<ApiResponse<SavedJobItem[]>> {
  const suffix = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
  return requestJson<ApiResponse<SavedJobItem[]>>(`/api/saved-jobs${suffix}`)
}

export async function saveJob(payload: SaveJobPayload): Promise<ApiResponse<{ job_id: string; message: string }>> {
  return requestJson<ApiResponse<{ job_id: string; message: string }>>('/api/saved-jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function unsaveJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
  return requestJson<ApiResponse<{ message: string }>>(`/api/saved-jobs/${encodeURIComponent(jobId)}`, {
    method: 'DELETE',
  })
}

// ── 目标岗位 API ──

export interface TargetRoleItem {
  id?: number
  user_id: string
  role_name: string
  priority?: number
  salary_expectation?: string | null
  location_preference?: string | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export async function fetchTargetRoles(userId?: string): Promise<ApiResponse<TargetRoleItem[]>> {
  const suffix = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
  return requestJson<ApiResponse<TargetRoleItem[]>>(`/api/target-roles${suffix}`)
}

export async function addTargetRole(role: string, userId: string, priority = 1): Promise<ApiResponse<{ message: string }>> {
  return requestJson<ApiResponse<{ message: string }>>('/api/target-roles', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role, priority }),
  })
}

export async function removeTargetRole(role: string, userId: string): Promise<ApiResponse<{ message: string }>> {
  return requestJson<ApiResponse<{ message: string }>>(`/api/target-roles/${encodeURIComponent(role)}?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

// ── 职业市场信息 API ──

export interface RoleMarketData {
  role: string
  salaryRange: string
  medianSalary: number
  demandLevel: string
  demandCount: number
}

export async function fetchRoleMarket(role: string): Promise<ApiResponse<RoleMarketData>> {
  return requestJson<ApiResponse<RoleMarketData>>(`/api/target-role-market/${encodeURIComponent(role)}`)
}

// ── 课程学习 API ──

export interface CourseItem {
  id?: number
  course_id: string
  title: string
  category?: string | null
  description?: string | null
  difficulty?: string | null
  duration_hours?: number | null
  instructor?: string | null
  thumbnail_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface LearningProgressItem {
  id?: number
  user_id: string
  course_id: string
  chapter_id: string
  progress: number
  completed: number
  last_position?: number
  updated_at?: string
  completed_at?: string | null
}

export async function fetchCourses(category?: string, limit = 50): Promise<ApiResponse<{ courses: CourseItem[]; count: number }>> {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  params.set('limit', String(limit))
  return requestJson<ApiResponse<{ courses: CourseItem[]; count: number }>>(`/api/learning/courses?${params.toString()}`)
}

export async function fetchCourse(courseId: string): Promise<ApiResponse<CourseItem>> {
  return requestJson<ApiResponse<CourseItem>>(`/api/learning/courses/${encodeURIComponent(courseId)}`)
}

export async function fetchLearningProgress(userId: string): Promise<ApiResponse<LearningProgressItem[]>> {
  return requestJson<ApiResponse<LearningProgressItem[]>>(`/api/learning/learning/progress/${encodeURIComponent(userId)}`)
}

export async function updateLearningProgress(payload: {
  user_id: string
  course_id: string
  chapter_id: string
  progress: number
  completed?: boolean
}): Promise<ApiResponse<{ message: string }>> {
  return requestJson<ApiResponse<{ message: string }>>('/api/learning/learning/progress', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── 学生/岗位画像 API (七维) ──

export interface StudentPortraitData {
  student_id: string
  target_job_id?: string | null
  dimensions: Record<string, { name: string; score: number; description?: string }>
  sub_dimensions?: Record<string, { name: string; score: number }>
  total_score: number
  level?: string | null
  completeness?: number
  skill_coverage?: number | null
  skill_count?: number
  generated_at?: string | null
}

export interface JobPortraitData {
  portrait_id: string
  position_name: string
  jd_count: number
  required_degree?: string | null
  required_skill_cnt?: number
  d1_weight: number
  d2_weight: number
  d3_weight: number
  d4_weight: number
  d5_weight?: number
  d6_weight?: number
  d7_weight?: number
  d8_weight?: number
  d9_weight?: number
  d10_weight?: number
  portrait_json?: Record<string, unknown>
  created_at?: string | null
}

export async function fetchStudentPortrait(studentId: string, targetJobId?: string): Promise<ApiResponse<StudentPortraitData>> {
  const suffix = targetJobId ? `?target_job_id=${encodeURIComponent(targetJobId)}` : ''
  return requestJson<ApiResponse<StudentPortraitData>>(`/api/profile/student/${encodeURIComponent(studentId)}/4d${suffix}`)
}

export async function fetchJobPortrait(portraitId: string): Promise<ApiResponse<JobPortraitData>> {
  return requestJson<ApiResponse<JobPortraitData>>(`/api/profile/job/${encodeURIComponent(portraitId)}`)
}

// ── 管理员数据集 API ──

export interface DatasetItem {
  id: string
  title?: string | null
  count?: number | null
  category?: string | null
  status?: string | null
  created_at?: string | null
}

export async function fetchDatasets(): Promise<ApiResponse<DatasetItem[]>> {
  return requestJson<ApiResponse<DatasetItem[]>>('/api/admin/dataset')
}

export async function uploadDataset(title: string, category: string): Promise<ApiResponse<{ id: string; message: string }>> {
  return requestJson<ApiResponse<{ id: string; message: string }>>('/api/admin/dataset/upload', {
    method: 'POST',
    body: JSON.stringify({ title, category }),
  })
}

export async function deleteDataset(dsId: string): Promise<ApiResponse<{ message: string }>> {
  return requestJson<ApiResponse<{ message: string }>>(`/api/admin/dataset/${encodeURIComponent(dsId)}`, {
    method: 'DELETE',
  })
}

// ── 管理员知识库 API ──

export interface KbItem {
  id: string
  title?: string | null
  type?: string | null
  status?: string | null
  created_at?: string | null
}

export async function fetchKnowledgeBase(): Promise<ApiResponse<KbItem[]>> {
  return requestJson<ApiResponse<KbItem[]>>('/api/admin/knowledge-base')
}

export async function uploadKnowledgeBase(title: string, type: string): Promise<ApiResponse<{ id: string; message: string }>> {
  return requestJson<ApiResponse<{ id: string; message: string }>>('/api/admin/knowledge-base/upload', {
    method: 'POST',
    body: JSON.stringify({ title, type }),
  })
}

export async function deleteKnowledgeBase(kbId: string): Promise<ApiResponse<{ message: string }>> {
  return requestJson<ApiResponse<{ message: string }>>(`/api/admin/knowledge-base/${encodeURIComponent(kbId)}`, {
    method: 'DELETE',
  })
}

