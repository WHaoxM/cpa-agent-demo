import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { UserRole } from '@/types'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/app',
    component: AppLayout,
    meta: { requiresAuth: true },
    redirect: '/app/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/HomeCenter.vue'),
        meta: { title: '首页', requiresAuth: true, immersive: true, keepTopNav: true },
      },
      {
        path: 'student/learning',
        name: 'student-learning',
        component: () => import('@/views/student/LearningCenter.vue'),
        meta: { title: '技能提升', requiresAuth: true, roles: [UserRole.STUDENT] },
      },
      {
        path: 'student/course/:id',
        name: 'student-course-detail',
        component: () => import('@/views/student/CourseWorkspace.vue'),
        meta: { title: '课程工作台', requiresAuth: true, roles: [UserRole.STUDENT] },
        redirect: { name: 'student-course-tasks' },
        children: [
          {
            path: 'tasks',
            name: 'student-course-tasks',
            component: () => import('@/views/student/CourseTasks.vue'),
            meta: { title: '课程任务', requiresAuth: true, roles: [UserRole.STUDENT] },
          },
          {
            path: 'chapters',
            name: 'student-course-chapters',
            component: () => import('@/views/student/CourseChapters.vue'),
            meta: { title: '课程章节', requiresAuth: true, roles: [UserRole.STUDENT] },
          },
          {
            path: 'homework',
            name: 'student-course-homework',
            component: () => import('@/views/student/CourseHomework.vue'),
            meta: { title: '课程作业', requiresAuth: true, roles: [UserRole.STUDENT] },
          },
          {
            path: 'exam',
            name: 'student-course-exam',
            component: () => import('@/views/student/CourseExam.vue'),
            meta: { title: '课程考试', requiresAuth: true, roles: [UserRole.STUDENT] },
          },
          {
            path: 'resources',
            name: 'student-course-resources',
            component: () => import('@/views/student/CourseResources.vue'),
            meta: { title: '课程资料', requiresAuth: true, roles: [UserRole.STUDENT] },
          },
          {
            path: 'wrongbook',
            name: 'student-course-wrongbook',
            component: () => import('@/views/student/CourseWrongbook.vue'),
            meta: { title: '课程错题集', requiresAuth: true, roles: [UserRole.STUDENT] },
          },
          {
            path: 'review',
            name: 'student-course-review',
            component: () => import('@/views/student/CourseReview.vue'),
            meta: { title: '课程回顾', requiresAuth: true, roles: [UserRole.STUDENT] },
          },
        ],
      },
      {
        path: 'student/ai-assistant',
        name: 'student-ai-assistant',
        component: () => import('@/views/student/AIAssistant.vue'),
        meta: { title: 'ai助手', requiresAuth: true, roles: [UserRole.STUDENT] },
      },
      {
        path: 'student/my-reports',
        name: 'student-my-reports',
        component: () => import('@/views/student/MyReports.vue'),
        meta: { title: '我的报告', requiresAuth: true, roles: [UserRole.STUDENT] },
      },
      {
        path: 'student/career',
        name: 'student-career',
        redirect: '/app/dashboard',
      },
      {
        path: 'student/career-analysis',
        name: 'student-career-analysis',
        component: () => import('@/views/student/CareerAnalysis.vue'),
        meta: { title: '职业分析', requiresAuth: true, roles: [UserRole.STUDENT], immersive: true },
      },
      {
        path: 'student/career-navigation',
        name: 'student-career-navigation',
        component: () => import('@/views/student/CareerNavigation.vue'),
        meta: { title: '职途导航', requiresAuth: true, roles: [UserRole.STUDENT], immersive: true },
      },
      {
        path: 'student/career-portrait',
        name: 'student-career-portrait',
        component: () => import('@/views/student/TalentPortrait.vue'),
        meta: { title: '个人能力画像', requiresAuth: true, roles: [UserRole.STUDENT], immersive: true },
      },
      {
        path: 'student/resume-builder',
        name: 'student-resume-builder',
        component: () => import('@/views/student/ResumeBuilder.vue'),
        meta: { title: '快速制作简历', requiresAuth: true, roles: [UserRole.STUDENT], immersive: true },
      },
      {
        path: 'student/career-report',
        name: 'student-career-report',
        component: () => import('@/views/student/CareerReport.vue'),
        meta: { title: '职业生涯发展报告', requiresAuth: true, roles: [UserRole.STUDENT], immersive: true },
      },
      {
        path: 'student/career-ability',
        name: 'career-ability',
        component: () => import('@/views/student/CareerAbilityShell.vue'),
        meta: { title: '职业能力图谱', requiresAuth: true, roles: [UserRole.STUDENT], immersive: true },
      },
      {
        path: 'student/course-system',
        name: 'course-system',
        component: () => import('@/views/student/CourseSystemGraph.vue'),
        meta: { title: '课程体系', requiresAuth: true, roles: [UserRole.STUDENT], immersive: true },
      },
      {
        path: 'student/career-ability/graph',
        name: 'career-ability-graph',
        redirect: to => ({ name: 'career-ability', query: to.query }),
      },
      {
        path: 'student/career-ability/dual',
        name: 'career-ability-dual',
        redirect: to => ({ name: 'career-ability', query: to.query }),
      },
      {
        path: 'student/career-ability/workspace',
        name: 'career-ability-workspace',
        redirect: to => ({ name: 'career-ability', query: to.query }),
      },
      {
        path: 'student/career-ability-graph',
        name: 'student-career-ability-graph',
        redirect: to => ({ name: 'career-ability', query: to.query }),
      },
      {
        path: 'student/favorites',
        name: 'student-favorites',
        component: () => import('@/views/student/Favorites.vue'),
        meta: { title: '心仪岗位', requiresAuth: true, roles: [UserRole.STUDENT], immersive: true },
      },
      {
        path: 'admin/job-dataset',
        name: 'admin-job-dataset',
        component: () => import('@/views/admin/JobDataset.vue'),
        meta: { title: '岗位数据集', requiresAuth: true, role: UserRole.ADMIN },
      },
      {
        path: 'admin/knowledge-base',
        name: 'admin-knowledge-base',
        component: () => import('@/views/admin/KnowledgeBase.vue'),
        meta: { title: '知识库维护', requiresAuth: true, role: UserRole.ADMIN },
      },
      {
        path: 'courses',
        name: 'courses',
        redirect: '/app/student/learning',
        meta: { title: '技能课程库', requiresAuth: true },
      },
      {
        path: 'exams',
        name: 'exams',
        component: () => import('@/views/course/ExamsView.vue'),
        meta: { title: '技能自评', requiresAuth: true },
      },
      {
        path: 'messages',
        name: 'messages',
        component: () => import('@/views/course/MessagesView.vue'),
        meta: { title: '消息', requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: '个人中心', requiresAuth: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到', public: true },
  },
]
