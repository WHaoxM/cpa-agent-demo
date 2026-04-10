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
  ReportRecord,
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
    skillTags: ['专业技能', '学习能力'],
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
    skillTags: ['专业技能', '创新能力'],
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
    skillTags: ['专业技能', '实习能力'],
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
    skillTags: ['专业技能', '创新能力', '学习能力'],
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

// 笔记数据（职涯笔记：记录职业探索与规划思考）
export const mockNotes: Note[] = [
  {
    id: 'note_001',
    userId: 'student_001',
    courseId: 'career',
    chapterId: '',
    title: '前端行业调研笔记',
    content: '<p>调研了前端开发岗位现状：</p><ul><li>需求量大，但内卷严重，需要差异化竞争力</li><li>Vue/React 二选一，公司偏好差异明显</li><li>大厂更注重工程化能力和性能优化经验</li><li>中小厂更注重独立完成业务的能力</li></ul><p>结论：要在掌握框架基础的同时，补强工程化和系统设计能力。</p>',
    tags: ['行业调研'],
    isFavorite: true,
    createdAt: '2024-02-10 10:30',
    updatedAt: '2024-02-10 10:30',
  },
  {
    id: 'note_002',
    userId: 'student_001',
    courseId: 'career',
    chapterId: '',
    title: '我的职业兴趣自测',
    content: '<p>用 MBTI + 霍兰德模型做了自我测评：</p><ul><li>偏好有创造性、有技术含量的工作</li><li>不喜欢纯重复性操作，喜欢解决问题</li><li>沟通能力一般，但逻辑思维较强</li></ul><p>适合方向：后端开发、数据分析、算法工程师。不太适合纯销售、客服类岗位。</p>',
    tags: ['自我探索'],
    isFavorite: false,
    createdAt: '2024-02-09 16:30',
    updatedAt: '2024-02-09 16:30',
  },
  {
    id: 'note_003',
    userId: 'student_001',
    courseId: 'career',
    chapterId: '',
    title: 'Python 学习路径规划',
    content: '<p>为了进入数据分析岗位，制定了以下学习计划：</p><ol><li><strong>第1个月</strong>：Python 基础 + Pandas 操作</li><li><strong>第2个月</strong>：SQL 进阶 + 数据可视化</li><li><strong>第3个月</strong>：机器学习基础 + 实际项目</li></ol><p>目标：3个月内具备参加数据分析实习的能力。</p>',
    tags: ['能力提升'],
    isFavorite: true,
    createdAt: '2024-02-08 14:00',
    updatedAt: '2024-02-08 14:00',
  },
  {
    id: 'note_004',
    userId: 'student_001',
    courseId: 'career',
    chapterId: '',
    title: '收到 Offer 对比记录',
    content: '<p>目前收到两个意向：</p><ul><li><strong>A公司（互联网）</strong>：15k，技术氛围好，但加班多</li><li><strong>B公司（国企）</strong>：10k，稳定，发展较慢</li></ul><p>综合考量：优先选A，获得更多成长机会，2年后再看。</p>',
    tags: ['offer对比'],
    isFavorite: false,
    createdAt: '2024-02-10 09:30',
    updatedAt: '2024-02-10 09:30',
  },
  {
    id: 'note_005',
    userId: 'student_001',
    courseId: 'career',
    chapterId: '',
    title: '字节跳动实习面试复盘',
    content: '<p>一面挂了，主要问题：</p><ul><li>算法题没做出来（手撕快排）</li><li>项目经验描述不够具体，STAR法则用得不好</li><li>CSS 布局基础薄弱</li></ul><p>下次改进：每天刷1道算法，用 STAR 重写项目描述，补 CSS 网格布局。</p>',
    tags: ['求职心得'],
    isFavorite: true,
    createdAt: '2024-02-07 20:00',
    updatedAt: '2024-02-07 20:00',
  },
]

// 班级数据
export const mockClasses: ClassData[] = [
  {
    id: 'class_001',
    name: '2024 前端开发班',
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
  '能力补齐': [
    '从你当前的学习情况看，建议先补齐「状态管理」「路由权限」「接口联调」这三类高频能力，再进入更复杂的项目实践。',
    '如果你准备投递前端或测试开发方向，近期优先补项目复盘、接口调试和自动化测试，会比继续堆叠零散知识点更有效。',
    '你已经有一定基础，下一步更值得投入的是把核心技能串成完整项目案例，而不是只增加单点知识。',
  ],
}

// AI 消息历史
export const mockAIMessages: AIMessage[] = [
  {
    id: 'ai_msg_001',
    role: 'assistant',
    content: '你好，这里是ai助手。你可以直接提问课程重点、解题思路、技能补齐顺序，或者结合目标方向讨论下一步学习安排。',
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

export const mockReportRecords: ReportRecord[] = [
  {
    id: 'report_portrait_001',
    type: 'portrait',
    createdAt: '2026-03-30',
    title: '个人能力画像（前端进阶）',
    snapshot: {
      predictedRole: '前端开发工程师',
      competitivenessScore: 84,
      sevenDim: [
        { name: '基础知识', score: 86 },
        { name: '工程能力', score: 80 },
        { name: '框架掌握', score: 88 },
        { name: '算法思维', score: 72 },
        { name: '项目经验', score: 81 },
        { name: '沟通协作', score: 85 },
        { name: '学习效率', score: 90 },
      ],
    },
  },
  {
    id: 'report_portrait_002',
    type: 'portrait',
    createdAt: '2026-03-24',
    title: '个人能力画像（全栈探索）',
    snapshot: {
      predictedRole: '全栈开发工程师',
      competitivenessScore: 76,
      sevenDim: [
        { name: '基础知识', score: 78 },
        { name: '工程能力', score: 75 },
        { name: '框架掌握', score: 80 },
        { name: '算法思维', score: 66 },
        { name: '项目经验', score: 74 },
        { name: '沟通协作', score: 79 },
        { name: '学习效率', score: 82 },
      ],
    },
  },
  {
    id: 'report_portrait_003',
    type: 'portrait',
    createdAt: '2026-03-17',
    title: '个人能力画像（工程化方向）',
    snapshot: {
      predictedRole: '前端工程化开发',
      competitivenessScore: 69,
      sevenDim: [
        { name: '基础知识', score: 72 },
        { name: '工程能力', score: 77 },
        { name: '框架掌握', score: 68 },
        { name: '算法思维', score: 60 },
        { name: '项目经验', score: 64 },
        { name: '沟通协作', score: 71 },
        { name: '学习效率', score: 74 },
      ],
    },
  },
  {
    id: 'report_portrait_004',
    type: 'portrait',
    createdAt: '2026-03-10',
    title: '个人能力画像（数据可视化）',
    snapshot: {
      predictedRole: '数据可视化开发',
      competitivenessScore: 63,
      sevenDim: [
        { name: '基础知识', score: 64 },
        { name: '工程能力', score: 62 },
        { name: '框架掌握', score: 67 },
        { name: '算法思维', score: 58 },
        { name: '项目经验', score: 59 },
        { name: '沟通协作', score: 70 },
        { name: '学习效率', score: 68 },
      ],
    },
  },
  {
    id: 'report_portrait_005',
    type: 'portrait',
    createdAt: '2026-03-05',
    title: '个人能力画像（应届冲刺）',
    snapshot: {
      predictedRole: '初级前端开发',
      competitivenessScore: 58,
      sevenDim: [
        { name: '基础知识', score: 60 },
        { name: '工程能力', score: 54 },
        { name: '框架掌握', score: 62 },
        { name: '算法思维', score: 50 },
        { name: '项目经验', score: 52 },
        { name: '沟通协作', score: 64 },
        { name: '学习效率', score: 66 },
      ],
    },
  },
  {
    id: 'report_portrait_006',
    type: 'portrait',
    createdAt: '2026-02-27',
    title: '个人能力画像（基础回顾）',
    snapshot: {
      predictedRole: '前端实习生',
      competitivenessScore: 51,
      sevenDim: [
        { name: '基础知识', score: 55 },
        { name: '工程能力', score: 48 },
        { name: '框架掌握', score: 53 },
        { name: '算法思维', score: 44 },
        { name: '项目经验', score: 46 },
        { name: '沟通协作', score: 58 },
        { name: '学习效率', score: 60 },
      ],
    },
  },
  {
    id: 'report_career_001',
    type: 'career',
    createdAt: '2026-03-29',
    title: '职业发展规划（前端主线）',
    snapshot: {
      topMatchScore: 82,
      targetRoles: ['前端开发工程师', '前端工程化开发', '可视化开发工程师'],
    },
  },
  {
    id: 'report_career_002',
    type: 'career',
    createdAt: '2026-03-22',
    title: '职业发展规划（产品技术复合）',
    snapshot: {
      topMatchScore: 74,
      targetRoles: ['前端开发工程师', '产品技术经理', '增长分析师'],
    },
  },
  {
    id: 'report_career_003',
    type: 'career',
    createdAt: '2026-03-15',
    title: '职业发展规划（全栈试探）',
    snapshot: {
      topMatchScore: 67,
      targetRoles: ['全栈开发工程师', 'Node.js 开发工程师', '平台研发工程师'],
    },
  },
  {
    id: 'report_career_004',
    type: 'career',
    createdAt: '2026-03-08',
    title: '职业发展规划（实习投递）',
    snapshot: {
      topMatchScore: 61,
      targetRoles: ['前端开发实习生', '测试开发实习生', '低代码平台运营'],
    },
  },
  {
    id: 'report_career_005',
    type: 'career',
    createdAt: '2026-03-01',
    title: '职业发展规划（能力补齐）',
    snapshot: {
      topMatchScore: 56,
      targetRoles: ['前端开发实习生', '数据分析助理', '技术支持工程师'],
    },
  },
]

// 管理员统计数据
export const mockAdminStats = {
  userDistribution: [
    { name: '学生', value: 320 },
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

// 心仪岗位数据（学生收藏的目标岗位）
// TODO: API — GET /api/saved-jobs?userId=xxx
export const mockSavedJobs: import('@/types').SavedJob[] = [
  {
    id: 'sj_001',
    jobTitle: '前端开发工程师',
    company: '字节跳动',
    industry: '互联网',
    salary: '15k-25k',
    location: '北京',
    matchScore: 78,
    requiredSkills: ['Vue/React', 'TypeScript', '工程化', '性能优化'],
    savedAt: '2024-02-10',
    notes: '技术氛围好，面试难度高，需加强算法',
  },
  {
    id: 'sj_002',
    jobTitle: '后端开发工程师',
    company: '腾讯',
    industry: '互联网',
    salary: '15k-22k',
    location: '深圳',
    matchScore: 65,
    requiredSkills: ['Java/Go', '分布式系统', 'MySQL', 'Redis'],
    savedAt: '2024-02-09',
  },
  {
    id: 'sj_003',
    jobTitle: '数据分析师',
    company: '阿里巴巴',
    industry: '电子商务',
    salary: '12k-20k',
    location: '杭州',
    matchScore: 82,
    requiredSkills: ['Python', 'SQL', '数据可视化', '统计分析'],
    savedAt: '2024-02-08',
    notes: '匹配度较高，优先投递',
  },
  {
    id: 'sj_004',
    jobTitle: '产品经理（技术方向）',
    company: '美团',
    industry: '本地生活',
    salary: '15k-22k',
    location: '北京',
    matchScore: 54,
    requiredSkills: ['需求分析', '用户研究', '数据分析', '项目管理'],
    savedAt: '2024-02-07',
  },
  {
    id: 'sj_005',
    jobTitle: '测试开发工程师',
    company: '华为',
    industry: '硬件/通信',
    salary: '12k-18k',
    location: '深圳',
    matchScore: 71,
    requiredSkills: ['Python自动化', '测试框架', 'Linux', 'CI/CD'],
    savedAt: '2024-02-06',
  },
  {
    id: 'sj_006',
    jobTitle: 'AI算法工程师（应届）',
    company: '百度',
    industry: '人工智能',
    salary: '18k-28k',
    location: '北京',
    matchScore: 43,
    requiredSkills: ['深度学习', 'PyTorch', '机器学习', '数学基础'],
    savedAt: '2024-02-05',
    notes: '当前匹配度低，需要1年提升',
  },
]

export const mockTargetRoleMarkets: import('@/types').TargetRoleMarket[] = [
  {
    role: '前端开发',
    salaryRange: '12K-24K',
    medianSalary: 18,
    demandLevel: '需求稳定，校招与实习岗位充足',
    hotCities: ['上海', '杭州', '深圳', '北京'],
    industries: ['互联网', '企业服务', '新消费'],
    skillTags: ['Vue 3', 'React', 'TypeScript', '工程化', '性能优化', '组件库', '可视化'],
    sampleJobs: ['前端开发工程师', '前端工程化开发', '可视化开发工程师'],
    trendNote: '企业更看重组件抽象、工程规范和跨端协作能力。',
    referenceMatch: 78,
  },
  {
    role: '后端开发',
    salaryRange: '14K-26K',
    medianSalary: 20,
    demandLevel: '中大型团队需求持续，服务治理能力加分明显',
    hotCities: ['北京', '深圳', '杭州', '成都'],
    industries: ['互联网', '金融科技', '企业平台'],
    skillTags: ['Java', 'Spring Boot', 'MySQL', 'Redis', '消息队列', 'Docker', '服务治理'],
    sampleJobs: ['Java 后端工程师', 'Go 后端工程师', '平台研发工程师'],
    trendNote: '分布式、缓存与接口稳定性仍是校招和社招的高频考点。',
    referenceMatch: 69,
  },
  {
    role: '测试开发',
    salaryRange: '11K-20K',
    medianSalary: 16,
    demandLevel: '质量工程岗位增多，自动化与接口测试权重提升',
    hotCities: ['深圳', '上海', '苏州', '北京'],
    industries: ['互联网', '智能硬件', '游戏'],
    skillTags: ['Python 自动化', 'Playwright', '接口测试', '测试用例设计', 'CI/CD', '质量体系', '缺陷分析'],
    sampleJobs: ['测试开发工程师', '自动化测试工程师', '质量平台工程师'],
    trendNote: '从手工测试转向自动化与质量平台建设是明显趋势。',
    referenceMatch: 72,
  },
  {
    role: '数据分析',
    salaryRange: '12K-22K',
    medianSalary: 17,
    demandLevel: '数据驱动岗位稳定增长，业务理解能力很关键',
    hotCities: ['杭州', '上海', '北京', '广州'],
    industries: ['电商', '本地生活', '内容平台'],
    skillTags: ['Python', 'SQL', '统计分析', 'BI 工具', '指标体系', 'A/B 测试', '数据清洗'],
    sampleJobs: ['数据分析师', '增长分析师', '商业分析师'],
    trendNote: '能把分析结果转化为业务建议，比单纯会出图更有竞争力。',
    referenceMatch: 82,
  },
  {
    role: '机器学习工程师',
    salaryRange: '18K-32K',
    medianSalary: 24,
    demandLevel: '高薪但门槛较高，算法基础与工程落地能力并重',
    hotCities: ['北京', '上海', '深圳', '杭州'],
    industries: ['人工智能', '自动驾驶', '医疗科技'],
    skillTags: ['Python', '机器学习', 'PyTorch', '特征工程', '模型部署', '数据处理', 'MLOps'],
    sampleJobs: ['算法工程师', '机器学习工程师', 'AI 应用工程师'],
    trendNote: '企业越来越关注模型上线、评估与业务闭环，而不只看算法竞赛经历。',
    referenceMatch: 58,
  },
]

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
