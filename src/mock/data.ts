// @ts-nocheck
import type {
  User,
  Course,
  Chapter,
  Question,
  Note,
  WrongQuestion,
  QuizRecord,
  LearningProgress,
  Category,
  ClassData,
  AIMessage,
} from '@/types'
import { UserRole, QuestionType } from '@/types'

// 当前登录用户ID（模拟）
export const CURRENT_USER_ID = 'student_001'

// 用户数据
export const mockUsers: User[] = [
  {
    id: 'student_001',
    username: 'student001',
    name: '张同学',
    email: 'student001@example.com',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    role: UserRole.STUDENT,
    createdAt: '2024-01-15',
    status: 'active',
    classId: 'class_001',
    phone: '13800138001',
  },
  {
    id: 'student_002',
    username: 'student002',
    name: '李同学',
    email: 'student002@example.com',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    role: UserRole.STUDENT,
    createdAt: '2024-01-15',
    status: 'active',
    classId: 'class_001',
  },
  {
    id: 'student_003',
    username: 'student003',
    name: '王同学',
    email: 'student003@example.com',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    role: UserRole.STUDENT,
    createdAt: '2024-01-15',
    status: 'active',
    classId: 'class_001',
  },
  {
    id: 'teacher_001',
    username: 'teacher001',
    name: '刘老师',
    email: 'teacher001@example.com',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    role: UserRole.TEACHER,
    createdAt: '2023-09-01',
    status: 'active',
    phone: '13900139001',
  },
  {
    id: 'admin_001',
    username: 'admin001',
    name: '管理员',
    email: 'admin001@example.com',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    role: UserRole.ADMIN,
    createdAt: '2023-08-01',
    status: 'active',
    phone: '13700137001',
  },
]

// 分类数据
export const mockCategories: Category[] = [
  { id: 'cat_001', name: '前端开发', icon: 'Monitor' },
  { id: 'cat_002', name: '后端开发', icon: 'Server' },
  { id: 'cat_003', name: '人工智能', icon: 'Cpu' },
  { id: 'cat_004', name: '数据库', icon: 'Coin' },
  { id: 'cat_005', name: '云计算', icon: 'Cloud' },
]

// 章节数据
export const mockChapters: Chapter[] = [
  { id: 'ch_001', title: '课程介绍与环境搭建', duration: 15, videoUrl: 'https://example.com/video1.mp4', order: 1 },
  { id: 'ch_002', title: 'Vue 3 基础语法', duration: 45, videoUrl: 'https://example.com/video2.mp4', order: 2 },
  { id: 'ch_003', title: 'Composition API 详解', duration: 60, videoUrl: 'https://example.com/video3.mp4', order: 3 },
  { id: 'ch_004', title: '组件通信与状态管理', duration: 50, videoUrl: 'https://example.com/video4.mp4', order: 4 },
  { id: 'ch_005', title: '路由与导航', duration: 40, videoUrl: 'https://example.com/video5.mp4', order: 5 },
  { id: 'ch_006', title: '项目实战', duration: 90, videoUrl: 'https://example.com/video6.mp4', order: 6 },
]

// 课程数据
export const mockCourses: Course[] = [
  {
    id: 'course_001',
    title: 'Vue 3 前端开发实战',
    description: '从零开始学习 Vue 3，掌握现代前端开发技术栈，包括 Composition API、Pinia、Vue Router 等核心技术。',
    cover: 'https://picsum.photos/400/300?random=1',
    categoryId: 'cat_001',
    teacherId: 'teacher_001',
    teacherName: '刘老师',
    chapters: mockChapters,
    status: 'published',
    createdAt: '2024-01-10',
    updatedAt: '2024-02-01',
    totalDuration: 300,
    studentCount: 128,
    rating: 4.8,
  },
  {
    id: 'course_002',
    title: 'TypeScript 进阶开发',
    description: '深入学习 TypeScript 高级特性，掌握类型体操、泛型编程等进阶技术。',
    cover: 'https://picsum.photos/400/300?random=2',
    categoryId: 'cat_001',
    teacherId: 'teacher_001',
    teacherName: '刘老师',
    chapters: [
      { id: 'ch_101', title: 'TS 基础回顾', duration: 30, order: 1 },
      { id: 'ch_102', title: '高级类型', duration: 45, order: 2 },
      { id: 'ch_103', title: '泛型编程', duration: 60, order: 3 },
      { id: 'ch_104', title: '类型体操', duration: 50, order: 4 },
    ],
    status: 'published',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-05',
    totalDuration: 185,
    studentCount: 85,
    rating: 4.7,
  },
  {
    id: 'course_003',
    title: 'Node.js 后端开发',
    description: '学习 Node.js 服务端开发，掌握 Express、Koa 等主流框架。',
    cover: 'https://picsum.photos/400/300?random=3',
    categoryId: 'cat_002',
    teacherId: 'teacher_001',
    teacherName: '刘老师',
    chapters: [
      { id: 'ch_201', title: 'Node.js 基础', duration: 40, order: 1 },
      { id: 'ch_202', title: 'Express 框架', duration: 50, order: 2 },
      { id: 'ch_203', title: '数据库操作', duration: 60, order: 3 },
      { id: 'ch_204', title: 'API 设计', duration: 45, order: 4 },
    ],
    status: 'published',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-10',
    totalDuration: 195,
    studentCount: 96,
    rating: 4.6,
  },
  {
    id: 'course_004',
    title: 'Python 人工智能入门',
    description: '从零开始学习 Python 和人工智能基础，包括机器学习算法和深度学习框架。',
    cover: 'https://picsum.photos/400/300?random=4',
    categoryId: 'cat_003',
    teacherId: 'teacher_001',
    teacherName: '刘老师',
    chapters: [
      { id: 'ch_301', title: 'Python 基础', duration: 50, order: 1 },
      { id: 'ch_302', title: 'NumPy 与 Pandas', duration: 45, order: 2 },
      { id: 'ch_303', title: '机器学习算法', duration: 70, order: 3 },
      { id: 'ch_304', title: '深度学习入门', duration: 80, order: 4 },
    ],
    status: 'under_review',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-10',
    totalDuration: 245,
    studentCount: 0,
    rating: 0,
  },
  {
    id: 'course_005',
    title: 'MySQL 数据库设计与优化',
    description: '深入学习 MySQL 数据库设计、SQL 优化和高可用架构。',
    cover: 'https://picsum.photos/400/300?random=5',
    categoryId: 'cat_004',
    teacherId: 'teacher_001',
    teacherName: '刘老师',
    chapters: [
      { id: 'ch_401', title: 'SQL 基础', duration: 35, order: 1 },
      { id: 'ch_402', title: '数据库设计', duration: 45, order: 2 },
      { id: 'ch_403', title: '索引与优化', duration: 50, order: 3 },
      { id: 'ch_404', title: '事务与锁', duration: 40, order: 4 },
    ],
    status: 'published',
    createdAt: '2024-01-25',
    updatedAt: '2024-02-08',
    totalDuration: 170,
    studentCount: 72,
    rating: 4.5,
  },
]

// 题目数据
export const mockQuestions: Question[] = [
  {
    id: 'q_001',
    courseId: 'course_001',
    chapterId: 'ch_002',
    type: QuestionType.SINGLE_CHOICE,
    content: 'Vue 3 中引入的新的组合式 API 名称是什么？',
    options: ['Options API', 'Composition API', 'Class API', 'Functional API'],
    correctAnswer: 'Composition API',
    knowledgePoint: 'Vue3基础',
    difficulty: 'easy',
    score: 10,
  },
  {
    id: 'q_002',
    courseId: 'course_001',
    chapterId: 'ch_002',
    type: QuestionType.SINGLE_CHOICE,
    content: '以下哪个不是 Vue 3 的响应式 API？',
    options: ['ref()', 'reactive()', 'computed()', 'watchEffect()', 'setData()'],
    correctAnswer: 'setData()',
    knowledgePoint: 'Vue3基础',
    difficulty: 'easy',
    score: 10,
  },
  {
    id: 'q_003',
    courseId: 'course_001',
    chapterId: 'ch_003',
    type: QuestionType.FILL_BLANK,
    content: '在 Composition API 中，用于创建响应式引用对象的函数是 ____。',
    correctAnswer: 'ref',
    knowledgePoint: 'Composition API',
    difficulty: 'medium',
    score: 15,
  },
  {
    id: 'q_004',
    courseId: 'course_001',
    chapterId: 'ch_003',
    type: QuestionType.MULTIPLE_CHOICE,
    content: 'Vue 3 生命周期钩子有哪些？（多选）',
    options: ['onMounted', 'onUnmounted', 'onUpdated', 'beforeCreate', 'created'],
    correctAnswer: ['onMounted', 'onUnmounted', 'onUpdated'],
    knowledgePoint: '生命周期',
    difficulty: 'medium',
    score: 20,
  },
  {
    id: 'q_005',
    courseId: 'course_001',
    chapterId: 'ch_004',
    type: QuestionType.SINGLE_CHOICE,
    content: 'Pinia 中用于修改状态的推荐方式是什么？',
    options: ['直接修改', '通过 actions', '通过 mutations', '通过 computed'],
    correctAnswer: '通过 actions',
    knowledgePoint: 'Pinia状态管理',
    difficulty: 'medium',
    score: 15,
  },
  {
    id: 'q_006',
    courseId: 'course_001',
    chapterId: 'ch_005',
    type: QuestionType.SINGLE_CHOICE,
    content: 'Vue Router 4 中，路由守卫 beforeEnter 应该在哪个位置配置？',
    options: ['全局', '路由配置', '组件内', '以上都可以'],
    correctAnswer: '路由配置',
    knowledgePoint: 'Vue Router',
    difficulty: 'hard',
    score: 20,
  },
  {
    id: 'q_007',
    courseId: 'course_002',
    chapterId: 'ch_102',
    type: QuestionType.SINGLE_CHOICE,
    content: 'TypeScript 中，interface 和 type 的主要区别是什么？',
    options: ['interface 可以合并声明', 'type 可以合并声明', '没有区别', 'interface 性能更好'],
    correctAnswer: 'interface 可以合并声明',
    knowledgePoint: 'TS高级类型',
    difficulty: 'medium',
    score: 15,
  },
  {
    id: 'q_008',
    courseId: 'course_002',
    chapterId: 'ch_103',
    type: QuestionType.FILL_BLANK,
    content: 'TypeScript 中泛型使用 ____ 符号定义。',
    correctAnswer: '<>',
    knowledgePoint: '泛型',
    difficulty: 'easy',
    score: 10,
  },
]

// 学习进度数据
export const mockLearningProgress: LearningProgress[] = [
  { userId: 'student_001', courseId: 'course_001', chapterId: 'ch_001', progress: 100, lastPosition: 900, completed: true, updatedAt: '2024-02-10 10:00' },
  { userId: 'student_001', courseId: 'course_001', chapterId: 'ch_002', progress: 85, lastPosition: 2295, completed: false, updatedAt: '2024-02-10 14:30' },
  { userId: 'student_001', courseId: 'course_001', chapterId: 'ch_003', progress: 45, lastPosition: 1620, completed: false, updatedAt: '2024-02-09 16:00' },
  { userId: 'student_001', courseId: 'course_002', chapterId: 'ch_101', progress: 100, lastPosition: 1800, completed: true, updatedAt: '2024-02-08 09:00' },
  { userId: 'student_001', courseId: 'course_002', chapterId: 'ch_102', progress: 60, lastPosition: 1620, completed: false, updatedAt: '2024-02-10 11:00' },
  { userId: 'student_002', courseId: 'course_001', chapterId: 'ch_001', progress: 100, lastPosition: 900, completed: true, updatedAt: '2024-02-10 09:00' },
  { userId: 'student_002', courseId: 'course_001', chapterId: 'ch_002', progress: 100, lastPosition: 2700, completed: true, updatedAt: '2024-02-10 15:00' },
  { userId: 'student_002', courseId: 'course_001', chapterId: 'ch_003', progress: 30, lastPosition: 1080, completed: false, updatedAt: '2024-02-09 14:00' },
  { userId: 'student_003', courseId: 'course_001', chapterId: 'ch_001', progress: 100, lastPosition: 900, completed: true, updatedAt: '2024-02-10 08:00' },
  { userId: 'student_003', courseId: 'course_001', chapterId: 'ch_002', progress: 20, lastPosition: 540, completed: false, updatedAt: '2024-02-10 10:00' },
]

// 测验记录
export const mockQuizRecords: QuizRecord[] = [
  {
    id: 'quiz_001',
    userId: 'student_001',
    courseId: 'course_001',
    chapterId: 'ch_002',
    score: 75,
    totalScore: 100,
    answers: { q_001: 'Composition API', q_002: 'setData()' },
    correctAnswers: { q_001: true, q_002: true, q_003: false, q_004: false },
    duration: 15,
    completedAt: '2024-02-10 15:00',
  },
  {
    id: 'quiz_002',
    userId: 'student_001',
    courseId: 'course_002',
    chapterId: 'ch_101',
    score: 90,
    totalScore: 100,
    answers: { q_007: 'interface 可以合并声明', q_008: '<>' },
    correctAnswers: { q_007: true, q_008: true },
    duration: 12,
    completedAt: '2024-02-08 10:00',
  },
  {
    id: 'quiz_003',
    userId: 'student_002',
    courseId: 'course_001',
    chapterId: 'ch_002',
    score: 85,
    totalScore: 100,
    answers: { q_001: 'Composition API', q_002: 'setData()' },
    correctAnswers: { q_001: true, q_002: true, q_003: false, q_004: false },
    duration: 18,
    completedAt: '2024-02-10 16:00',
  },
  {
    id: 'quiz_004',
    userId: 'student_003',
    courseId: 'course_001',
    chapterId: 'ch_002',
    score: 60,
    totalScore: 100,
    answers: { q_001: 'Composition API', q_002: 'computed()' },
    correctAnswers: { q_001: true, q_002: false, q_003: false, q_004: false },
    duration: 20,
    completedAt: '2024-02-10 11:00',
  },
]

// 错题数据
export const mockWrongQuestions: WrongQuestion[] = [
  {
    id: 'wq_001',
    userId: 'student_001',
    questionId: 'q_003',
    question: mockQuestions.find(q => q.id === 'q_003')!,
    wrongAnswer: 'reactive',
    times: 2,
    lastWrongAt: '2024-02-10 15:00',
  },
  {
    id: 'wq_002',
    userId: 'student_001',
    questionId: 'q_004',
    question: mockQuestions.find(q => q.id === 'q_004')!,
    wrongAnswer: ['onMounted', 'onUnmounted'],
    times: 1,
    lastWrongAt: '2024-02-10 15:00',
  },
  {
    id: 'wq_003',
    userId: 'student_003',
    questionId: 'q_002',
    question: mockQuestions.find(q => q.id === 'q_002')!,
    wrongAnswer: 'computed()',
    times: 1,
    lastWrongAt: '2024-02-10 11:00',
  },
]

// 笔记数据
export const mockNotes: Note[] = [
  {
    id: 'note_001',
    userId: 'student_001',
    courseId: 'course_001',
    chapterId: 'ch_002',
    title: 'Composition API 要点',
    content: '<p>Composition API 是 Vue 3 引入的新特性，主要包括：</p><ul><li><strong>ref()</strong> - 创建响应式引用</li><li><strong>reactive()</strong> - 创建响应式对象</li><li><strong>computed()</strong> - 计算属性</li><li><strong>watch()</strong> - 监听器</li></ul><p>相比 Options API，Composition API 更适合大型项目，逻辑复用更方便。</p>',
    tags: ['Vue3', 'Composition API', '响应式'],
    isFavorite: true,
    createdAt: '2024-02-10 10:30',
    updatedAt: '2024-02-10 10:30',
  },
  {
    id: 'note_002',
    userId: 'student_001',
    courseId: 'course_001',
    chapterId: 'ch_003',
    title: '生命周期钩子',
    content: '<p>Vue 3 的生命周期钩子变化：</p><ul><li>beforeCreate / created -> setup()</li><li>beforeMount -> onBeforeMount</li><li>mounted -> onMounted</li><li>beforeUpdate -> onBeforeUpdate</li><li>updated -> onUpdated</li><li>beforeUnmount -> onBeforeUnmount</li><li>unmounted -> onUnmounted</li></ul>',
    tags: ['Vue3', '生命周期'],
    isFavorite: false,
    createdAt: '2024-02-09 16:30',
    updatedAt: '2024-02-09 16:30',
  },
  {
    id: 'note_003',
    userId: 'student_001',
    courseId: 'course_002',
    chapterId: 'ch_102',
    title: 'TypeScript 高级类型',
    content: '<p>TypeScript 高级类型包括：</p><ul><li><strong>泛型 (Generics)</strong> - 使类型具有可重用性</li><li><strong>映射类型 (Mapped Types)</strong> - 基于旧类型创建新类型</li><li><strong>条件类型 (Conditional Types)</strong> - 根据条件选择类型</li><li><strong>工具类型 (Utility Types)</strong> - Partial, Required, Pick, Record 等</li></ul>',
    tags: ['TypeScript', '高级类型'],
    isFavorite: true,
    createdAt: '2024-02-08 14:00',
    updatedAt: '2024-02-08 14:00',
  },
  {
    id: 'note_004',
    userId: 'student_002',
    courseId: 'course_001',
    chapterId: 'ch_002',
    title: 'Vue 3 响应式原理',
    content: '<p>Vue 3 使用 Proxy 替代 Object.defineProperty 实现响应式：</p><ul><li>更好的性能</li><li>支持数组索引和 length 监听</li><li>支持 Map、Set、WeakMap、WeakSet</li></ul>',
    tags: ['Vue3', '响应式', 'Proxy'],
    isFavorite: false,
    createdAt: '2024-02-10 09:30',
    updatedAt: '2024-02-10 09:30',
  },
]

// 班级数据
export const mockClasses: ClassData[] = [
  {
    id: 'class_001',
    name: '2024 前端开发班',
    teacherId: 'teacher_001',
    studentCount: 3,
    courseIds: ['course_001', 'course_002'],
  },
]

// AI 预设回复
export const mockAIResponses: Record<string, string[]> = {
  '课程答疑': [
    '关于 Vue 3 的响应式系统，它使用了 ES6 的 Proxy 对象来替代 Vue 2 中的 Object.defineProperty。这使得 Vue 3 能够更精确地追踪对象属性的变化，同时也支持 Map、Set 等数据结构。',
    'Composition API 是 Vue 3 引入的新特性，它允许我们将相关功能的代码组织在一起，而不是按照选项类型分散在不同的生命周期钩子中。这样可以提高代码的可维护性和复用性。',
    'TypeScript 的主要优势在于提供了静态类型检查，可以在编译时发现潜在的错误。它还提供了更好的 IDE 支持，包括自动补全、重构和类型提示。',
  ],
  '解题指导': [
    '这道题目考察的是 Vue 3 的基础知识。ref() 函数用于创建一个响应式的引用对象，而 reactive() 用于创建响应式对象。注意区分两者的使用场景。',
    '泛型是 TypeScript 中非常强大的特性。通过泛型，我们可以创建可重用的组件，这些组件可以支持多种类型的数据，同时保持类型安全。',
    '在 Vue Router 中，路由守卫用于控制导航行为。beforeEach 是全局前置守卫，beforeEnter 是路由独享守卫，beforeRouteEnter 是组件内守卫。',
  ],
  '学习建议': [
    '根据你的学习记录，建议你先巩固 Vue 3 的基础概念，特别是 Composition API 的使用。可以尝试完成一些小型项目来加深理解。',
    '你的 TypeScript 类型定义还有些薄弱，建议多练习接口和类型的定义，特别是泛型的使用。可以参考官方文档中的高级类型章节。',
    '你在算法题方面的练习还不够，建议每天保持至少一题的练习量。可以从简单的数组和字符串操作开始，逐步过渡到复杂的数据结构。',
  ],
  '薄弱点提醒': [
    '通过分析你的测验记录，发现你在「生命周期钩子」这个知识点上掌握不够牢固，错误率较高。建议重新复习相关章节。',
    '注意到你在「泛型编程」相关的题目上花费时间较长，这是你的薄弱点。建议多做相关练习，理解泛型的约束条件和默认类型。',
    '你的「状态管理」相关题目正确率只有 60%，建议深入学习 Pinia 的使用，特别是 actions 和 getters 的编写。',
  ],
}

// AI 消息历史
export const mockAIMessages: AIMessage[] = [
  {
    id: 'ai_msg_001',
    role: 'assistant',
    content: '你好！我是你的 AI 学习助手。我可以帮助你：\n1. 解答课程相关问题\n2. 提供解题思路指导\n3. 根据学习情况给出建议\n4. 提醒你学习薄弱点\n\n请告诉我你需要什么帮助？',
    timestamp: '2024-02-10 08:00',
  },
]

// 学习统计数据（用于图表）
export const mockStudyStats = {
  weeklyProgress: [
    { date: '周一', duration: 120, chapters: 2 },
    { date: '周二', duration: 90, chapters: 1 },
    { date: '周三', duration: 150, chapters: 3 },
    { date: '周四', duration: 60, chapters: 1 },
    { date: '周五', duration: 180, chapters: 4 },
    { date: '周六', duration: 240, chapters: 5 },
    { date: '周日', duration: 200, chapters: 4 },
  ],
  knowledgePoints: [
    { name: 'Vue3基础', score: 85 },
    { name: 'Composition API', score: 70 },
    { name: '生命周期', score: 60 },
    { name: 'Pinia状态管理', score: 75 },
    { name: 'Vue Router', score: 80 },
    { name: 'TypeScript', score: 90 },
  ],
  scoreHistory: [
    { date: '第1周', score: 75 },
    { date: '第2周', score: 82 },
    { date: '第3周', score: 78 },
    { date: '第4周', score: 88 },
    { date: '第5周', score: 92 },
  ],
  chapterProgress: [
    { name: '课程介绍', completed: 100, studying: 0, notStarted: 0 },
    { name: 'Vue3基础', completed: 85, studying: 15, notStarted: 0 },
    { name: 'Composition API', completed: 45, studying: 55, notStarted: 0 },
    { name: '状态管理', completed: 0, studying: 30, notStarted: 70 },
    { name: '路由导航', completed: 0, studying: 0, notStarted: 100 },
    { name: '项目实战', completed: 0, studying: 0, notStarted: 100 },
  ],
}

// 教师端统计数据
export const mockTeacherStats = {
  classProgress: {
    completed: 45,
    inProgress: 35,
    notStarted: 20,
  },
  scoreDistribution: [
    { range: '90-100', count: 12 },
    { range: '80-89', count: 25 },
    { range: '70-79', count: 30 },
    { range: '60-69', count: 20 },
    { range: '0-59', count: 13 },
  ],
  knowledgeErrorRate: [
    { name: 'Vue3基础', errorRate: 15 },
    { name: 'Composition API', errorRate: 35 },
    { name: '生命周期', errorRate: 45 },
    { name: 'Pinia', errorRate: 30 },
    { name: 'Vue Router', errorRate: 25 },
    { name: 'TypeScript', errorRate: 20 },
  ],
  studentRanking: [
    { name: '李同学', score: 95, avgScore: 92 },
    { name: '张同学', score: 88, avgScore: 85 },
    { name: '王同学', score: 82, avgScore: 78 },
  ],
  classKnowledgePoints: [
    { name: 'Vue3基础', score: 82 },
    { name: 'Composition API', score: 68 },
    { name: '生命周期', score: 62 },
    { name: 'Pinia', score: 72 },
    { name: 'Vue Router', score: 78 },
    { name: 'TypeScript', score: 85 },
  ],
  dailyStudyTime: [
    { date: '周一', hours: 2.5 },
    { date: '周二', hours: 2.2 },
    { date: '周三', hours: 3.0 },
    { date: '周四', hours: 1.8 },
    { date: '周五', hours: 2.8 },
    { date: '周六', hours: 3.5 },
    { date: '周日', hours: 3.2 },
  ],
}

// 管理员统计数据
export const mockAdminStats = {
  userDistribution: [
    { name: '学生', value: 320 },
    { name: '教师', value: 28 },
    { name: '管理员', value: 5 },
  ],
  activityStats: {
    daily: [120, 135, 142, 128, 155, 180, 175],
    weekly: [680, 720, 750, 780, 820, 850, 880],
    monthly: [2800, 2950, 3100, 3250, 3400, 3550, 3800],
  },
  courseStats: [
    { category: '前端开发', count: 15, learners: 450 },
    { category: '后端开发', count: 12, learners: 320 },
    { category: '人工智能', count: 8, learners: 280 },
    { category: '数据库', count: 10, learners: 350 },
    { category: '云计算', count: 6, learners: 180 },
  ],
  pendingCourses: [
    { id: 'course_004', title: 'Python 人工智能入门', teacher: '刘老师', submitDate: '2024-02-10', status: 'pending' },
    { id: 'course_006', title: 'Docker 容器化部署', teacher: '王老师', submitDate: '2024-02-09', status: 'pending' },
    { id: 'course_007', title: 'React 高级进阶', teacher: '李老师', submitDate: '2024-02-08', status: 'pending' },
  ],
}

// 获取当前用户
export function getCurrentUser(role?: UserRole): User {
  if (role) {
    return mockUsers.find(u => u.role === role) || mockUsers[0]
  }
  return mockUsers.find(u => u.id === CURRENT_USER_ID) || mockUsers[0]
}

// 根据ID获取课程
export function getCourseById(id: string): Course | undefined {
  return mockCourses.find(c => c.id === id)
}

// 获取用户学习进度
export function getUserProgress(userId: string): LearningProgress[] {
  return mockLearningProgress.filter(p => p.userId === userId)
}

// 获取用户笔记
export function getUserNotes(userId: string): Note[] {
  return mockNotes.filter(n => n.userId === userId)
}

// 获取用户错题
export function getUserWrongQuestions(userId: string): WrongQuestion[] {
  return mockWrongQuestions.filter(wq => wq.userId === userId)
}

// 获取班级学生
export function getClassStudents(classId: string): User[] {
  return mockUsers.filter(u => u.classId === classId && u.role === UserRole.STUDENT)
}

// 获取课程的测验题目
export function getQuestionsByChapter(chapterId: string): Question[] {
  return mockQuestions.filter(q => q.chapterId === chapterId)
}
