// @ts-nocheck
/**
 * 职业方向课程 mock 数据
 * 基于 CAREER_DOMAINS（5 领域 × 3 细分 = 15 方向）与 JOB_PORTRAITS 的 keySkills 生成
 * 后续接 API 时只需替换 getCareerCourses / getCareerCategories 的实现
 */
import type { Course, Category, Chapter } from '@/types'

/* ═══ 辅助 ═══ */
let _idx = 100
function ch(base: string, titles: string[]): Chapter[] {
  return titles.map((t, i) => ({ id: `${base}_ch${i + 1}`, title: t, duration: 25 + i * 8, order: i + 1 }))
}
function c(
  title: string, desc: string, tags: string[], catId: string,
  teacher: string, dur: number, stu: number, rating: number,
  chTitles: string[],
): Course {
  const id = `course_${_idx++}`
  return {
    id, title, description: desc, skillTags: tags,
    cover: `https://picsum.photos/400/300?random=${_idx}`,
    categoryId: catId, teacherId: 'teacher_001', teacherName: teacher,
    chapters: ch(id, chTitles), status: 'published',
    createdAt: '2024-03-01', updatedAt: '2024-03-15',
    totalDuration: dur, studentCount: stu, rating,
  }
}

/* ═══ 新增分类（与 data.ts 原有 cat_001~005 互补） ═══ */
export const careerCategories: Category[] = [
  { id: 'cat_006', name: '测试开发' },
  { id: 'cat_007', name: '数据分析与大数据' },
  { id: 'cat_008', name: '跨端与移动开发' },
]

/* ═══ 课程列表 ═══ */

// ── 跨方向共享课程 ──
const shared = [
  c('Git 版本控制与团队协作', '掌握 Git 分支管理、冲突解决、Gitflow 工作流与团队协作最佳实践',
    ['Git'], 'cat_001', '刘老师', 92, 320, 4.7,
    ['Git 基础操作', '分支与合并策略', 'Gitflow 工作流', '团队协作实战']),
  c('Linux 系统基础与运维', '从零掌握 Linux 常用命令、Shell 脚本编写与服务管理',
    ['Linux 基础', 'Linux', 'Linux 系统编程', 'Shell 脚本', 'Linux/Shell'], 'cat_002', '张老师', 900, 280, 4.6,
    ['Linux 基础命令', 'Shell 脚本入门', '权限与进程管理', '网络与服务配置']),
  c('Docker 容器化与 Kubernetes 入门', '学习 Docker 容器化部署与 Kubernetes 集群基础管理',
    ['Docker', 'Docker 基础', 'Docker 容器化', 'Docker/K8s 部署', 'Docker 容器化（Dockerfile/Compose）'], 'cat_005', '陈老师', 1080, 210, 4.7,
    ['Docker 基础与 Dockerfile', 'Docker Compose 实战', 'Kubernetes 核心概念', 'K8s 部署与服务发现']),
  c('Python 编程基础与进阶', '从基础语法到面向对象、异常处理、文件操作与第三方库使用',
    ['Python', 'Python 3'], 'cat_003', '吴老师', 1200, 350, 4.8,
    ['Python 基础语法', '数据结构与函数', '面向对象编程', '常用标准库与第三方库']),
  c('SQL 数据库查询与优化', '掌握 SQL 语法、索引原理、查询优化与实际业务场景应用',
    ['SQL', 'MySQL', 'SQL 数据校验', 'SQL 数据查询'], 'cat_004', '李老师', 1500, 290, 4.7,
    ['SQL 基础查询', '多表连接与子查询', '索引原理与优化', '事务与锁机制']),
  c('Redis 缓存实战', '学习 Redis 数据结构、持久化、分布式锁与高可用方案',
    ['Redis 基础', 'Redis 缓存', 'Redis', 'Redis 状态管理', 'MySQL/Redis'], 'cat_004', '李老师', 150, 190, 4.6,
    ['Redis 数据结构', '持久化与主从复制', '分布式锁实战', '集群与高可用']),
  c('TypeScript 全栈类型编程', '深入学习 TypeScript 类型系统、泛型、装饰器与工程化实践',
    ['TypeScript', 'TypeScript 强类型', 'TypeScript 高级泛型'], 'cat_001', '刘老师', 480, 240, 4.8,
    ['类型系统基础', '接口与泛型', '装饰器与元编程', '工程化配置与最佳实践']),
  c('CI/CD 持续集成与部署', '搭建 Jenkins/GitLab CI 流水线，实现自动化构建、测试与部署',
    ['CI/CD', 'CI 集成触发'], 'cat_005', '陈老师', 600, 170, 4.5,
    ['CI/CD 概念与流水线', 'Jenkins 实战', 'GitLab CI 配置', '自动化部署策略']),
]

// ── 前端开发 · Vue 方向 ──
const feVue = [
  c('HTML 与 CSS 网页开发基础', '系统学习 HTML5 语义化标签、CSS3 布局与响应式设计',
    ['HTML/CSS'], 'cat_001', '刘老师', 2400, 380, 4.7,
    ['HTML5 语义化', 'CSS3 选择器与盒模型', 'Flexbox 与 Grid 布局', '响应式设计实战']),
  c('JavaScript 核心与 ES6+ 特性', '从基础语法到闭包、原型链、Promise、async/await 等进阶特性',
    ['JavaScript'], 'cat_001', '刘老师', 1800, 340, 4.8,
    ['基础语法与数据类型', '闭包与原型链', 'ES6+ 新特性', '异步编程与事件循环']),
  c('Vue 3 Composition API 实战', '系统学习 Vue 3 响应式原理、组件设计模式与 Pinia 状态管理',
    ['Vue 3', 'Vue 基础', 'Vue 3 / React'], 'cat_001', '周老师', 1200, 260, 4.9,
    ['Vue 3 响应式原理', 'Composition API 核心', '组件通信与复用', 'Pinia 状态管理']),
  c('Element Plus 企业级 UI 实战', '基于 Element Plus 构建企业级中后台界面，掌握表单、表格、弹窗等高频组件',
    ['Element Plus'], 'cat_001', '周老师', 300, 180, 4.6,
    ['Element Plus 快速上手', '表单与校验', '表格与分页', '主题定制与国际化']),
  c('Vite 现代前端工程化', '掌握 Vite 构建原理、插件开发、多环境配置与工程化最佳实践',
    ['Vite', '工程化体系', 'Vite/CRA', 'Webpack/Vite 深度配置'], 'cat_001', '刘老师', 360, 160, 4.7,
    ['Vite 原理与配置', '插件开发实战', '多环境与代理', 'Monorepo 集成']),
  c('前端性能优化实战', '从加载优化到渲染优化，系统提升 Web 应用性能',
    ['性能优化'], 'cat_001', '周老师', 480, 190, 4.8,
    ['性能指标与分析工具', '资源加载优化', '渲染与交互优化', 'Performance API 实战']),
  c('SSR 服务端渲染与 Nuxt 实战', '掌握 Vue SSR 原理与 Nuxt 3 框架开发全栈应用',
    ['SSR'], 'cat_001', '刘老师', 300, 130, 4.6,
    ['SSR 原理与架构', 'Nuxt 3 快速上手', '数据获取与 SEO', '部署与缓存策略']),
  c('微前端架构设计与落地', '学习 qiankun/Module Federation 等方案，实现大型前端应用拆分',
    ['微前端', '微前端（Module Federation）'], 'cat_001', '周老师', 240, 110, 4.5,
    ['微前端概念与方案对比', 'qiankun 实战', 'Module Federation', '沙箱与通信机制']),
  c('RESTful API 设计与前后端联调', '学习 RESTful 规范、Axios 封装、Mock 数据与接口联调技巧',
    ['REST API'], 'cat_001', '刘老师', 360, 200, 4.6,
    ['RESTful 设计规范', 'Axios 封装与拦截器', 'Mock 数据方案', '联调与错误处理']),
]

// ── 前端开发 · React 方向 ──
const feReact = [
  c('React 18 Hooks 深度实战', '系统掌握 React 18 Hooks、Concurrent 特性与组件设计模式',
    ['React 18 Hooks', 'Vue 3 / React', 'React 基础（JSX/函数组件）', 'useState/useEffect Hooks', 'React Router 基础'], 'cat_001', '周老师', 600, 220, 4.8,
    ['React 基础与 JSX', 'Hooks 核心 API', 'Concurrent 特性', '组件设计模式']),
  c('Redux Toolkit 与 Zustand 状态管理', '对比学习 Redux Toolkit 与 Zustand，掌握 React 状态管理最佳实践',
    ['Redux Toolkit/Zustand'], 'cat_001', '周老师', 240, 170, 4.7,
    ['Redux Toolkit 核心', 'RTK Query 数据请求', 'Zustand 轻量方案', '状态管理选型']),
  c('React Router 6 路由实战', '掌握 React Router 6 嵌套路由、数据加载与权限控制',
    ['React Router 6'], 'cat_001', '刘老师', 180, 160, 4.6,
    ['路由配置与嵌套', 'Loader 与 Action', '权限路由守卫', '路由动画与懒加载']),
  c('Ant Design 企业级组件开发', '基于 Ant Design 构建企业级 React 应用，掌握主题定制与高级用法',
    ['Ant Design'], 'cat_001', '周老师', 240, 150, 4.6,
    ['Ant Design 快速上手', 'ProComponents 实战', '主题与 Token 定制', '复杂表单与表格']),
  c('Next.js SSR/ISR 全栈开发', '使用 Next.js 构建 SEO 友好的全栈 React 应用',
    ['Next.js SSR/ISR', 'SSR（Next.js BFF）'], 'cat_001', '刘老师', 420, 140, 4.7,
    ['Next.js 路由与布局', 'SSR/SSG/ISR 策略', 'API Routes 与全栈', 'Vercel 部署与优化']),
  c('GraphQL 与 tRPC 现代接口设计', '对比学习 GraphQL 与 tRPC，构建类型安全的前后端接口',
    ['GraphQL/tRPC', 'GraphQL/Apollo'], 'cat_001', '周老师', 240, 100, 4.5,
    ['GraphQL 查询与变更', 'Apollo Client 集成', 'tRPC 类型安全 RPC', '接口方案选型']),
  c('前端测试体系（Jest + Playwright）', '搭建单元测试与 E2E 测试体系，提升代码质量与发布信心',
    ['Jest 单元测试', 'Playwright E2E', 'Playwright'], 'cat_001', '周老师', 600, 120, 4.6,
    ['Jest 单测基础', '组件测试实战', 'Playwright E2E 测试', '测试驱动开发']),
]

// ── 前端开发 · 可视化方向 ──
const feViz = [
  c('D3.js 数据可视化开发', '从零掌握 D3.js 数据绑定、比例尺、坐标轴与交互式图表开发',
    ['D3.js', '数据可视化', 'D3.js 基础（scale/axis/shape）', 'D3.js 高级布局（力导向/层级/地理）'], 'cat_001', '周老师', 720, 130, 4.7,
    ['D3.js 核心概念', '比例尺与坐标轴', '常见图表实现', '交互与动画']),
  c('ECharts 图表与大屏实战', '使用 ECharts 构建业务图表与数据大屏，掌握主题定制与性能优化',
    ['ECharts', 'BI 可视化', 'ECharts 5 配置与事件', 'ECharts 自定义系列与渲染器', 'Apache ECharts 源码级定制'], 'cat_001', '刘老师', 720, 200, 4.8,
    ['ECharts 基础配置', '常见图表类型', '数据大屏布局', '主题与性能优化']),
  c('Three.js 3D 可视化入门', '学习 Three.js 场景搭建、几何体、材质、光照与相机控制',
    ['Three.js', '3D 视觉', 'WebGL/Three.js 三维可视化'], 'cat_001', '周老师', 1200, 90, 4.6,
    ['Three.js 场景与渲染器', '几何体与材质', '光照与阴影', '相机控制与交互']),
  c('Canvas 与 SVG 图形编程', '深入 Canvas 2D 绑制与 SVG 矢量图形，实现自定义可视化组件',
    ['Canvas/SVG', 'SVG 与 Canvas 绘图原理'], 'cat_001', '刘老师', 360, 110, 4.5,
    ['Canvas 2D 绑制基础', 'SVG 矢量图形', '动画与性能', '自定义图表组件']),
  c('WebGL 高性能渲染实战', '深入 WebGL 渲染管线、着色器编程与 GPU 加速技术',
    ['WebGL'], 'cat_001', '周老师', 480, 60, 4.4,
    ['WebGL 渲染管线', 'GLSL 着色器入门', '纹理与光照', 'GPU 加速实战']),
  c('可视化低代码平台开发', '从架构到实现，构建拖拽式数据可视化搭建平台',
    ['可视化低代码'], 'cat_001', '刘老师', 300, 80, 4.5,
    ['低代码架构设计', '拖拽引擎实现', '组件市场与配置', '数据源与实时刷新']),
]

// ── 后端开发 · Java 方向 ──
const beJava = [
  c('Java SE 核心编程', '系统学习 Java 语法、面向对象、集合框架、IO 与多线程基础',
    ['Java SE 核心'], 'cat_002', '张老师', 6000, 300, 4.7,
    ['Java 基础语法', '面向对象与设计模式', '集合框架与泛型', '多线程与并发基础']),
  c('Spring Boot 实战开发', '基于 Spring Boot 快速构建企业级 RESTful 服务',
    ['Spring Boot 2/3', 'Spring Boot'], 'cat_002', '张老师', 1800, 280, 4.8,
    ['Spring Boot 自动配置', 'RESTful API 开发', '数据访问与事务', '安全与监控']),
  c('MyBatis-Plus 数据持久层', '掌握 MyBatis-Plus CRUD、条件构造器、分页插件与代码生成',
    ['MyBatis-Plus', 'MyBatis/JPA'], 'cat_002', '张老师', 360, 220, 4.6,
    ['MyBatis-Plus 快速上手', '条件构造器', '分页与性能优化', '代码生成与扩展']),
  c('Spring Cloud 微服务架构', '基于 Spring Cloud Alibaba 构建完整的微服务体系',
    ['Spring Cloud Alibaba', 'Spring Cloud 微服务', 'Spring Cloud 微服务基础'], 'cat_002', '陈老师', 1200, 170, 4.7,
    ['微服务架构概述', 'Nacos 注册与配置', 'Sentinel 限流熔断', 'Gateway 网关与链路追踪']),
  c('Kafka 与 RocketMQ 消息中间件', '学习消息队列核心原理，掌握 Kafka 与 RocketMQ 实战应用',
    ['Kafka/RocketMQ', 'Kafka 消息队列（aiokafka）'], 'cat_002', '陈老师', 720, 150, 4.6,
    ['消息队列原理', 'Kafka 生产与消费', 'RocketMQ 事务消息', '消息可靠性与幂等']),
  c('JVM 性能调优实战', '深入 JVM 内存模型、垃圾回收算法与线上问题诊断',
    ['JVM 调优', 'JVM 调优（GC/内存分析）'], 'cat_002', '张老师', 600, 140, 4.7,
    ['JVM 内存模型', 'GC 算法与调优', 'Arthas 诊断工具', '线上 OOM 排查']),
  c('分布式事务与高并发设计', '掌握 Seata 分布式事务、限流、降级与高并发场景设计',
    ['分布式事务（Seata）', '高并发设计', 'Sentinel 限流熔断', '分布式系统', 'MySQL 分库分表（ShardingSphere）'], 'cat_002', '陈老师', 360, 130, 4.6,
    ['分布式事务方案对比', 'Seata AT/TCC 模式', '限流与降级策略', '高并发架构实战']),
  c('DDD 领域驱动设计', '学习 DDD 战略与战术设计，构建可演进的业务系统架构',
    ['DDD 领域驱动设计', 'DDD 设计'], 'cat_002', '张老师', 300, 100, 4.5,
    ['DDD 核心概念', '限界上下文划分', '聚合与领域事件', '六边形架构实战']),
  c('Maven 与 Gradle 构建工具', '掌握 Java 项目构建、依赖管理与多模块工程实践',
    ['Maven', 'Maven/Gradle'], 'cat_002', '张老师', 300, 200, 4.5,
    ['Maven 基础与 POM', '依赖管理与仓库', 'Gradle 入门', '多模块项目实战']),
  c('JWT 鉴权与安全认证', '实现基于 JWT 的用户认证与权限管理体系',
    ['JWT 鉴权'], 'cat_002', '陈老师', 240, 180, 4.6,
    ['认证与授权原理', 'JWT 令牌机制', 'Spring Security 集成', 'OAuth2 社会化登录']),
]

// ── 后端开发 · Go 方向 ──
const beGo = [
  c('Go 语言基础与并发编程', '系统学习 Go 语法、goroutine、channel 与并发模式',
    ['Go 语言基础', 'Go 语言特性（goroutine/channel）', 'Go 语言基础（goroutine/channel 入门）'], 'cat_002', '陈老师', 480, 190, 4.7,
    ['Go 基础语法', '数据结构与接口', 'goroutine 与 channel', '并发模式实战']),
  c('Gin/Fiber Web 框架实战', '基于 Gin/Fiber 快速开发高性能 Go Web 服务',
    ['Gin/Echo 框架', 'Gin/Fiber 框架', 'Gin 框架路由与中间件'], 'cat_002', '陈老师', 240, 170, 4.7,
    ['Gin 路由与中间件', 'GORM 数据访问', 'Fiber 高性能框架', 'API 文档与测试']),
  c('Go 微服务框架（Kratos/Go-Zero）', '掌握 Go 微服务框架，构建生产级分布式服务',
    ['Kratos/Go-Zero 微服务框架'], 'cat_002', '陈老师', 180, 100, 4.6,
    ['微服务框架对比', 'Kratos 项目结构', 'Go-Zero 快速开发', '服务治理与监控']),
  c('gRPC 微服务通信实战', '学习 gRPC 协议、Protobuf 序列化与服务间高效通信',
    ['gRPC 入门', 'gRPC 基础', 'gRPC 微服务'], 'cat_002', '陈老师', 150, 140, 4.6,
    ['Protobuf 定义与编译', 'gRPC 四种调用模式', '拦截器与中间件', '服务发现与负载均衡']),
  c('Go 性能调优与运行时深入', '深入 Go 运行时调度器（GMP）、pprof 分析与火焰图诊断',
    ['Go runtime 调优（pprof）', 'Go 高并发原理（GMP）'], 'cat_002', '陈老师', 90, 80, 4.5,
    ['GMP 调度器原理', 'pprof 性能分析', '内存逃逸分析', '火焰图与 trace']),
  c('ETCD 与服务发现', '学习 ETCD 分布式键值存储与服务注册发现实战',
    ['ETCD/Consul', 'ETCD 服务发现'], 'cat_002', '陈老师', 60, 90, 4.5,
    ['ETCD 核心概念', 'KV 操作与 Watch', '服务注册与发现', 'Raft 共识算法']),
  c('GORM 数据库操作', '掌握 Go 语言 GORM ORM 框架的增删改查与高级查询',
    ['Gorm', 'GORM', 'GORM 基础查询'], 'cat_002', '陈老师', 120, 160, 4.6,
    ['GORM 模型定义', 'CRUD 与关联', '事务与钩子', '迁移与性能优化']),
]

// ── 后端开发 · Python 方向 ──
const bePython = [
  c('Django/Flask Web 开发实战', '对比学习 Django 与 Flask，快速构建 Python Web 服务',
    ['Django/Flask', 'Django/Flask/FastAPI', 'Flask/FastAPI 路由'], 'cat_002', '张老师', 900, 200, 4.7,
    ['Django 全栈开发', 'Flask 轻量级 API', 'ORM 与数据库', '认证与部署']),
  c('FastAPI 异步高并发开发', '使用 FastAPI 构建高性能异步 API 服务',
    ['FastAPI/异步框架', 'FastAPI 异步高并发', 'FastAPI 异步编程（async/await）', 'Pydantic V2 数据校验', 'Pydantic 数据校验'], 'cat_002', '张老师', 480, 150, 4.7,
    ['FastAPI 核心概念', 'Pydantic 数据校验', '异步与依赖注入', '性能优化与部署']),
  c('Celery 异步任务队列', '掌握 Celery 分布式任务调度、定时任务与结果存储',
    ['Celery 任务队列', 'Celery 异步任务'], 'cat_002', '张老师', 180, 120, 4.5,
    ['Celery 架构与配置', '任务定义与调度', '定时任务与 Beat', '监控与故障排查']),
  c('SQLAlchemy 与 ORM 实战', '学习 SQLAlchemy 核心映射、查询构造与数据库迁移',
    ['SQLAlchemy', 'SQLAlchemy/Django ORM', 'SQLAlchemy 基础'], 'cat_002', '张老师', 180, 130, 4.6,
    ['SQLAlchemy 核心与 ORM', '查询构造器', '关系映射与懒加载', 'Alembic 迁移']),
  c('NestJS 模块化微服务开发', '使用 NestJS 构建模块化、类型安全的 Node.js 后端服务',
    ['NestJS 模块化微服务', 'Express/Koa/NestJS', 'Node.js 核心模块', 'Node.js'], 'cat_002', '陈老师', 360, 110, 4.6,
    ['NestJS 模块与 DI', 'Controller 与 Service', '数据库与 TypeORM', '微服务与消息队列']),
]

// ── 后续追加：QA、数据、AI 方向课程 ──
// placeholder — will be populated below
const qaCourses: Course[] = [
  // ── 测试开发 · 自动化测试方向 ──
  c('Postman 接口测试实战', '掌握 Postman 接口测试、环境变量、自动化脚本与 Newman CI 集成',
    ['Postman', 'Postman 接口测试', 'Postman 接口测试'], 'cat_006', '王老师', 180, 210, 4.6,
    ['Postman 基础操作', '环境与变量管理', '自动化测试脚本', 'Newman CI 集成']),
  c('测试用例设计方法论', '系统学习等价类、边界值、场景法等测试设计方法与缺陷管理',
    ['用例设计', '测试用例设计'], 'cat_006', '王老师', 120, 230, 4.7,
    ['测试基础理论', '等价类与边界值', '场景法与判定表', '缺陷管理流程']),
  c('Selenium/Playwright 自动化测试', '从 Selenium 到 Playwright，掌握 Web UI 自动化测试框架',
    ['Playwright', 'Python/Java', 'Selenium 自动化'], 'cat_006', '王老师', 600, 160, 4.7,
    ['Selenium WebDriver 基础', 'POM 页面对象模式', 'Playwright 现代方案', '测试报告与持续集成']),
  c('黑盒测试方法实战', '掌握功能测试核心方法论，提升测试覆盖率与缺陷发现能力',
    ['黑盒测试方法（等价类/边界值）', '黑盒测试基础'], 'cat_006', '王老师', 120, 190, 4.5,
    ['等价类划分实战', '边界值分析', '因果图与决策表', '探索式测试']),
  c('测试计划与风险评估', '学习制定测试计划、评估测试风险与构建质量报告体系',
    ['测试计划与风险评估'], 'cat_006', '王老师', 90, 140, 4.5,
    ['测试计划编写', '风险评估方法', '测试进度管理', '质量报告输出']),
  // ── 测试开发 · 质量平台方向 ──
  c('API 测试实战（REST/GraphQL）', '掌握 REST 与 GraphQL 接口测试方法、断言与契约测试',
    ['API 测试（REST/GraphQL）'], 'cat_006', '王老师', 180, 150, 4.6,
    ['REST API 测试基础', 'GraphQL 查询测试', '契约测试（Pact）', '性能基准测试']),
  c('移动端专项测试', '学习 Android/iOS 应用稳定性、兼容性与专项测试方法',
    ['移动端专项测试（稳定性/兼容性）'], 'cat_006', '王老师', 150, 90, 4.5,
    ['移动端测试基础', 'Appium 自动化', '兼容性测试矩阵', '稳定性与性能专项']),
  c('质量度量与测试管理平台', '搭建测试管理平台，建立质量度量体系与测试报告自动化',
    ['质量平台', '测试管理平台', '测试报告与质量度量', '质量度量体系（缺陷密度/用例覆盖率）'], 'cat_006', '王老师', 120, 80, 4.5,
    ['质量度量指标', '测试管理工具（JIRA/TestRail）', '测试报告自动化', '质量门禁集成']),
  c('安全测试入门', '学习 Web 安全测试基础，掌握 XSS、CSRF、SQL 注入等常见漏洞检测',
    ['安全测试基础（OWASP Top10）', 'CI 安全卡点', 'OWASP Top 10（SQL注入/XSS/CSRF）'], 'cat_006', '王老师', 120, 100, 4.6,
    ['OWASP Top10 概述', 'XSS 与 CSRF 检测', 'SQL 注入防御', '安全测试工具实战']),
  // ── 测试开发 · 性能测试方向 ──
  c('JMeter 压测脚本实战', '使用 JMeter 编写性能测试脚本，模拟高并发场景',
    ['JMeter 压测脚本', 'JMeter 基础操作', 'JMeter 分布式压测集群'], 'cat_006', '王老师', 600, 160, 4.6,
    ['JMeter 基础操作', '线程组与采样器', '参数化与关联', '分布式压测']),
  c('Linux 资源监控与性能分析', '掌握 top、iostat、vmstat 等工具监控服务器性能瓶颈',
    ['Linux 资源监控（top/iostat）'], 'cat_006', '王老师', 180, 130, 4.5,
    ['CPU/内存监控', '磁盘与网络 IO', '进程分析工具', '性能瓶颈定位']),
  c('Prometheus + Grafana 监控体系', '搭建 Prometheus 采集 + Grafana 可视化的全栈监控体系',
    ['Prometheus/Grafana 基础', 'Prometheus + Grafana 监控体系', 'Grafana 性能监控大屏', 'Prometheus 监控集成', 'Prometheus 监控'], 'cat_006', '王老师', 480, 120, 4.7,
    ['Prometheus 架构与配置', '指标采集与 PromQL', 'Grafana 仪表盘', '告警规则与通知']),
  c('全链路压测体系建设', '学习影子库、流量染色与全链路压测方案设计',
    ['全链路压测（影子库/流量染色）'], 'cat_006', '王老师', 120, 70, 4.5,
    ['全链路压测概念', '影子库方案', '流量染色与隔离', '压测报告与优化']),
  c('性能基线与 SLA 制定', '建立性能基线指标，制定服务级别协议（SLA）与性能达标标准',
    ['SLA 性能基线制定', '性能测试'], 'cat_006', '王老师', 90, 90, 4.4,
    ['性能指标定义', 'SLA 制定方法', '基线建立流程', '持续性能回归']),
]
const dataCourses: Course[] = [
  // ── 数据分析 · 商业数据分析方向 ──
  c('SQL 进阶：窗口函数与复杂查询', '深入学习窗口函数、CTE、子查询优化与执行计划分析',
    ['SQL 进阶（窗口函数/子查询）', '复杂 SQL 优化（执行计划分析）', 'SQL（窗口函数/多表联查）'], 'cat_007', '李老师', 360, 200, 4.7,
    ['窗口函数实战', 'CTE 递归查询', '执行计划分析', '查询优化技巧']),
  c('Excel 与 BI 可视化入门', '掌握 Excel 高级函数、Tableau/PowerBI 报表制作与数据大屏',
    ['Excel/BI', 'Excel/Google Sheets', 'Tableau/PowerBI 基础', 'Excel 高级函数', 'Tableau/PowerBI 可视化', 'Excel 高级函数（VLOOKUP/数据透视表）', 'Tableau/PowerBI'], 'cat_007', '李老师', 900, 260, 4.6,
    ['Excel 数据透视表', '高级函数实战', 'Tableau 图表设计', 'PowerBI 入门']),
  c('统计学基础与数据分析', '学习描述统计、假设检验、回归分析等数据分析必备统计方法',
    ['统计基础', '统计基础（均值/方差/相关性）', 'Python SciPy/Statsmodels'], 'cat_007', '李老师', 300, 210, 4.7,
    ['描述统计与概率', '假设检验', '回归分析', '贝叶斯与抽样方法']),
  c('业务指标体系设计', '学习 OSM/MECE 方法论，建立企业级指标体系与数据看板',
    ['业务指标理解', '指标体系（OSM/MECE）', '企业级指标体系设计', '业务指标体系理解（DAU/MAU/GMV）'], 'cat_007', '李老师', 180, 140, 4.6,
    ['指标体系方法论', 'OSM 模型实战', '指标分层设计', '数据看板搭建']),
  c('Pandas 数据处理与分析', '使用 Pandas/NumPy 进行数据清洗、变换、聚合与分析',
    ['Pandas', 'Python Pandas/NumPy', 'Python Pandas 基础', 'Python 数据处理基础'], 'cat_007', '赵老师', 720, 230, 4.8,
    ['Pandas 数据结构', '数据清洗与变换', '分组聚合分析', 'NumPy 数值计算']),
  c('A/B 测试与实验设计', '掌握 A/B 测试假设检验、样本量计算、实验平台设计',
    ['A/B 测试', 'A/B 测试（假设检验）', 'A/B 实验', 'A/B 测试基础（流量分组/显著性）', 'A/B 实验设计（假设检验/样本量估算）'], 'cat_007', '赵老师', 180, 150, 4.6,
    ['A/B 测试原理', '假设检验与 P 值', '样本量计算', '实验平台设计']),
  c('数据清洗与 ETL 基础', '学习数据清洗方法、ETL 流程设计与数据质量管理',
    ['数据清洗', 'ETL 基础'], 'cat_007', '李老师', 240, 170, 4.5,
    ['数据质量评估', '清洗规则与方法', 'ETL 流程设计', '数据校验与监控']),
  // ── 数据分析 · 数据开发方向 ──
  c('Spark 大数据处理实战', '掌握 Spark Core/SQL/DataFrame 编程与大规模数据处理',
    ['Spark Core/SQL/DataFrame', 'Spark MLlib 基础', 'Spark 离线计算调优'], 'cat_007', '赵老师', 1800, 140, 4.7,
    ['Spark 架构与 RDD', 'Spark SQL 与 DataFrame', 'Spark Streaming', 'Spark MLlib 入门']),
  c('Flink 实时流处理', '学习 Flink DataStream/Table API 与实时数据管道构建',
    ['Flink DataStream API', 'Flink SQL/Table API', '实时特征（Flink）', 'Flink CDC 实时数据同步', 'Flink CDC（MySQL/Oracle binlog）'], 'cat_007', '赵老师', 1200, 110, 4.6,
    ['Flink 架构与部署', 'DataStream API 实战', 'Flink SQL', '实时数仓与特征']),
  c('Hive SQL 与数仓分层建模', '掌握 Hive SQL、数仓分层设计（ODS/DWD/ADS）与数据治理',
    ['Hive SQL', '数仓分层（ODS/DWD/ADS）', 'Hive/Presto/Spark SQL', 'DWD/ADS 分层建模', '数仓基础', 'Hive SQL / Spark SQL'], 'cat_007', '赵老师', 1080, 130, 4.7,
    ['Hive 基础与数据类型', '分区与分桶优化', '数仓分层设计', '数据质量与治理']),
  c('数据采集与同步（DataX/Sqoop）', '学习异构数据源采集与同步工具的原理与实战',
    ['DataX/Sqoop 数据同步', 'Sqoop/DataX 数据采集', 'DataX/Sqoop 数据同步'], 'cat_007', '赵老师', 240, 100, 4.5,
    ['DataX 架构与配置', 'Sqoop 数据导入导出', '增量同步策略', '数据一致性保障']),
  c('Airflow 数据编排与调度', '使用 Airflow 构建数据 ETL 工作流与自动化调度',
    ['Airflow 编排', 'Airflow ETL', 'DataOps', 'Airflow DAG 编排'], 'cat_007', '赵老师', 240, 90, 4.5,
    ['Airflow 核心概念', 'DAG 定义与编排', '任务依赖与重试', '监控与告警']),
  c('Kafka 消息队列实战', '学习 Kafka 消息生产消费、分区策略与数据管道集成',
    ['Kafka 消费与生产', 'Kafka/RabbitMQ', 'Kafka 消息驱动', 'Kafka 消息队列入门'], 'cat_007', '赵老师', 720, 120, 4.6,
    ['Kafka 架构与概念', '生产者与消费者', '分区与副本策略', '数据管道集成']),
  // ── 数据分析 · 增长分析方向 ──
  c('用户行为分析（漏斗/留存）', '掌握漏斗分析、留存分析、路径分析等用户行为分析方法',
    ['用户行为分析（漏斗/留存）', '用户漏斗与留存分析', 'AARRR 漏斗精细化分析'], 'cat_007', '李老师', 240, 160, 4.7,
    ['漏斗分析方法', '留存与生命周期', '路径分析实战', '用户分群策略']),
  c('BI 平台搭建与运营', '使用 Superset/Metabase 搭建企业 BI 平台与自助分析体系',
    ['BI 平台搭建', 'Superset/Metabase 二次开发', 'FineReport/帆软', '业务数据看板搭建（Metabase/Superset）'], 'cat_007', '李老师', 360, 100, 4.5,
    ['BI 平台选型', 'Superset 部署与配置', '自助查询体系', '权限与运营推广']),
  c('数仓建模方法论', '系统学习星型/雪花模型、维度建模与数仓架构设计',
    ['数仓建模（星型/雪花）', '数仓建模', '维度建模方法论（Kimball）', '维度建模（星型/雪花）'], 'cat_007', '赵老师', 360, 110, 4.6,
    ['维度建模基础', '星型与雪花模型', '缓慢变化维', '数仓架构演进']),
  c('时序预测与 Prophet 实战', '使用 Facebook Prophet 进行时间序列预测与趋势分析',
    ['Prophet/时序预测', 'Python 商业统计（Prophet 时序预测）'], 'cat_007', '赵老师', 180, 80, 4.5,
    ['时序数据特征', 'Prophet 快速上手', '趋势与季节性', '异常检测与预测']),
  c('Matplotlib 与 Seaborn 数据可视化', '使用 Python 可视化库制作专业数据图表',
    ['Matplotlib/Seaborn', 'Matplotlib/Seaborn 数据可视化'], 'cat_007', '李老师', 240, 170, 4.6,
    ['Matplotlib 基础绑制', 'Seaborn 统计图表', '多子图与布局', '可视化最佳实践']),
  c('Jupyter Notebook 数据分析环境', '搭建高效的 Jupyter 数据分析工作环境与协作流程',
    ['Jupyter Notebook'], 'cat_007', '李老师', 120, 200, 4.5,
    ['Jupyter 环境配置', '魔法命令与插件', '数据分析工作流', '团队协作方案']),
]
const mlCourses: Course[] = [
  // ── 机器学习 · 算法工程师方向 ──
  c('机器学习算法基础', '系统学习回归、分类、聚类、降维等经典机器学习算法',
    ['机器学习', 'Sklearn 机器学习'], 'cat_003', '吴老师', 1500, 200, 4.8,
    ['监督学习算法', '无监督学习', '模型评估与调参', 'Sklearn 实战项目']),
  c('推荐系统与协同过滤', '从协同过滤到深度推荐，构建完整推荐系统',
    ['协同过滤（CF）', '矩阵分解（MF/ALS）'], 'cat_003', '吴老师', 900, 120, 4.7,
    ['推荐系统概述', '协同过滤算法', '矩阵分解方法', '深度推荐模型']),
  c('特征工程实战', '掌握特征选择、特征构造、特征变换与自动化特征工程',
    ['特征工程'], 'cat_003', '吴老师', 360, 150, 4.7,
    ['特征类型与编码', '特征选择方法', '特征构造技巧', '自动化特征工程']),
  c('搜索引擎技术（Elasticsearch）', '学习 Elasticsearch 倒排索引、BM25 排序与语义搜索',
    ['Elasticsearch/OpenSearch', '倒排索引原理', 'BM25/TF-IDF'], 'cat_003', '吴老师', 720, 110, 4.6,
    ['ES 架构与安装', '倒排索引原理', '查询与聚合', '语义搜索入门']),
  c('深度排序模型实战（DIN/DIEN）', '学习 CTR 预估主流模型，从 Wide&Deep 到 DIN/DIEN',
    ['深度排序模型（DIN/DIEN）', '多目标优化'], 'cat_003', '郑老师', 300, 80, 4.6,
    ['CTR 预估基础', 'Wide&Deep 模型', 'DIN/DIEN 注意力', '多目标优化']),
  c('MLOps 模型运维体系', '构建模型训练、部署、监控与迭代的全链路 MLOps 体系',
    ['MLOps', '模型生产化 MLOps', 'MLOps 全链路（训练→评估→部署→监控）', 'MLflow 实验管理'], 'cat_003', '吴老师', 240, 90, 4.5,
    ['MLOps 概念与工具链', '模型训练管线', '模型服务化部署', '监控与 A/B 实验']),
  c('向量检索与语义搜索', '学习 FAISS、Milvus 等向量数据库与语义检索技术',
    ['语义向量检索（FAISS/Milvus）', '学习排序（LTR）', '知识图谱融合'], 'cat_003', '郑老师', 240, 70, 4.5,
    ['向量检索原理', 'FAISS 实战', '语义搜索落地', '知识图谱融合']),
  // ── 机器学习 · 深度学习方向 ──
  c('PyTorch 深度学习实战', '从张量运算到模型训练，系统掌握 PyTorch 深度学习框架',
    ['深度学习', 'PyTorch', 'Python/PyTorch', 'TensorFlow/PyTorch', 'PyTorch 神经网络构建与训练'], 'cat_003', '郑老师', 600, 180, 4.9,
    ['PyTorch 张量与自动微分', '神经网络基础', 'CNN 与 RNN', '模型训练与调优']),
  c('计算机视觉入门（OpenCV + YOLO）', '学习 OpenCV 图像处理与 YOLO 目标检测算法',
    ['OpenCV', 'YOLO/ResNet/VGG', 'YOLO v8/ResNet', '数据标注与增广', '数据增强与标注（LabelImg）', '模型训练调参', '数据增强与 DataLoader'], 'cat_003', '郑老师', 360, 140, 4.7,
    ['OpenCV 图像处理', '图像分类模型', 'YOLO 目标检测', '数据标注与增广']),
  c('NLP 与 Transformer 入门', '从 Word2Vec 到 BERT，掌握 NLP 核心技术与 Transformer 架构',
    ['Transformers/BERT', 'Hugging Face', 'Hugging Face Transformers', 'BERT/RoBERTa 微调', '分词与 NER', '文本分类', '预训练模型微调', '文本相似度'], 'cat_003', '吴老师', 900, 130, 4.8,
    ['词向量与 Word2Vec', 'Transformer 架构', 'BERT 微调实战', 'NER 与文本分类']),
  c('CUDA 与 GPU 加速编程', '学习 CUDA 编程模型、GPU 内存管理与深度学习加速',
    ['CUDA 基础', 'CUDA/cuDNN 基础', 'GPU 环境配置（CUDA/cuDNN）'], 'cat_003', '郑老师', 180, 70, 4.5,
    ['GPU 架构与 CUDA 模型', '线程与内存层次', 'cuDNN 加速', 'GPU 性能优化']),
  c('模型部署与推理加速', '掌握 TensorRT、ONNX 模型转换与边缘端高效推理',
    ['边缘端部署（TensorRT/ONNX）', 'TensorRT/ONNX 边缘部署', 'TensorRT 多模态推理加速'], 'cat_003', '郑老师', 240, 80, 4.6,
    ['ONNX 模型导出', 'TensorRT 优化', '量化与剪枝', '边缘设备部署']),
  c('模型蒸馏与量化技术', '学习知识蒸馏、模型量化与压缩技术，减少推理资源消耗',
    ['模型蒸馏', '模型蒸馏与量化', '推理加速（量化/蒸馏）', '模型蒸馏与量化（PTQ/QAT）'], 'cat_003', '郑老师', 180, 60, 4.5,
    ['知识蒸馏原理', '量化方法对比', '混合精度训练', '压缩效果评估']),
  // ── 机器学习 · AI 应用方向 ──
  c('LLM 大模型应用开发', '基于 OpenAI/通义/智谱 API 与 LangChain 构建 AI 应用',
    ['OpenAI/通义/智谱 API 调用', 'LangChain/LlamaIndex'], 'cat_003', '吴老师', 720, 160, 4.8,
    ['LLM API 调用', 'LangChain 核心链', 'LlamaIndex 数据索引', '应用开发实战']),
  c('Prompt 工程实战', '系统学习 Prompt 设计方法、思维链推理与 Few-shot 技巧',
    ['Prompt 工程'], 'cat_003', '吴老师', 180, 200, 4.7,
    ['Prompt 设计原则', 'Few-shot 与 CoT', 'Prompt 模板与变量', '评估与迭代']),
  c('RAG 检索增强生成系统', '构建基于向量检索的 RAG 系统，实现知识库问答',
    ['RAG 系统架构', '向量检索（Chroma/Pinecone）', '向量数据库（Milvus/Weaviate）', '向量数据库（Milvus）', '知识库系统架构'], 'cat_003', '吴老师', 240, 120, 4.7,
    ['RAG 架构概述', '文档分块与嵌入', '向量数据库集成', '检索优化与评估']),
  c('LLM 私有化部署实战', '学习 vLLM、Ollama 等框架进行大模型本地部署与服务化',
    ['LLM 私有化部署（vLLM/Ollama）', 'vLLM 部署', 'vLLM/TGI 服务化'], 'cat_003', '郑老师', 180, 90, 4.6,
    ['LLM 部署方案选型', 'vLLM 推理服务', 'Ollama 本地部署', '性能优化与监控']),
  c('Agent 框架与 Function Calling', '掌握 AI Agent 框架（AutoGen/CrewAI）与 Function Calling 机制',
    ['Agent 框架（AutoGen/CrewAI）', 'Function Calling & Tool Use'], 'cat_003', '吴老师', 180, 100, 4.6,
    ['Agent 架构设计', 'AutoGen 多代理', 'Function Calling 实战', '工具链编排']),
  c('多模态 AI 入门', '学习 CLIP、Stable Diffusion 等多模态模型基础与应用',
    ['CLIP/BLIP 多模态预训练', '扩散模型基础（Stable Diffusion）', '多模态 LLM（GPT-4V/Gemini）', '多模态 LLM（LLaVA/InternVL）', '音频特征提取（Whisper）', '混合精度训练（AMP）'], 'cat_003', '郑老师', 300, 80, 4.6,
    ['多模态基础概念', 'CLIP 图文对齐', 'Stable Diffusion 文生图', 'Whisper 语音识别']),
  c('LLM 评测体系设计', '构建大模型评测基准、自动化评测流程与指标体系',
    ['LLM 评测体系', '评测体系设计'], 'cat_003', '吴老师', 120, 60, 4.4,
    ['评测指标设计', '基准数据集', '自动化评测', '人工评测方法']),
]

// ── 前端开发 · React 进阶方向 ──
const feReactExtra = [
  c('React 18 并发模式与 Suspense 实战', '深入掌握 React 18 Concurrent Mode、useTransition、useDeferredValue 与 Suspense 数据加载',
    ['React 18 Concurrent Mode', 'React 性能优化（Concurrent/Suspense）'], 'cat_001', '周老师', 300, 130, 4.7,
    ['Concurrent Mode 概念', 'useTransition 实战', 'useDeferredValue 优化', 'Suspense 数据边界']),
  c('React Query / SWR 服务端状态管理', '对比学习 React Query 与 SWR，构建高效的服务端状态缓存与同步体系',
    ['React Query / SWR 数据层'], 'cat_001', '周老师', 240, 110, 4.6,
    ['服务端状态 vs 客户端状态', 'React Query 核心 API', 'SWR 轻量方案', '缓存策略与无效化']),
  c('Webpack 5 深度工程化配置', '系统掌握 Webpack 5 核心概念、Loader/Plugin 开发与构建性能优化',
    ['Webpack/Vite 深度配置', 'Webpack 5 构建优化'], 'cat_001', '刘老师', 480, 150, 4.6,
    ['Webpack 5 核心概念', 'Loader 与 Plugin 开发', 'Code Splitting 策略', '构建性能优化']),
  c('Monorepo 工程实践（Nx/Turborepo）', '使用 Nx 与 Turborepo 构建大型前端 Monorepo 项目，实现代码共享与增量构建',
    ['Monorepo（Nx/Turborepo）'], 'cat_001', '刘老师', 240, 80, 4.5,
    ['Monorepo 概念与方案对比', 'Nx 项目配置', 'Turborepo 增量构建', '包共享与版本管理']),
]

// ── 前端开发 · Angular 方向 ──
const feAngular = [
  c('Angular 15+ 核心组件与模块化开发', '系统学习 Angular 组件、模板、依赖注入与模块化架构',
    ['Angular 15+ 组件', 'Angular CLI', 'Jasmine 单测'], 'cat_001', '李老师', 720, 100, 4.6,
    ['Angular 基础架构', '组件与模板', '依赖注入与服务', '模块化与路由']),
  c('RxJS 响应式编程实战', '从观察者模式到高阶操作符，系统掌握 RxJS 在 Angular 中的最佳实践',
    ['RxJS 响应式编程', 'RxJS 高级操作符'], 'cat_001', '李老师', 480, 85, 4.7,
    ['Observable 与 Subject', '常用操作符', '高阶 Observable', 'RxJS 与 HTTP/表单']),
  c('NgRx 状态管理实战', '使用 NgRx Store/Effects/Selectors 构建大型 Angular 应用状态管理体系',
    ['NgRx 状态管理'], 'cat_001', '李老师', 300, 70, 4.5,
    ['NgRx 核心概念', 'Store 与 Reducer', 'Effects 异步处理', 'Selectors 性能优化']),
  c('Angular Material 企业级 UI 组件', '基于 Angular Material 构建企业级界面，掌握主题定制与 CDK 高级用法',
    ['Angular Material'], 'cat_001', '李老师', 240, 75, 4.5,
    ['Material 组件库', '表单与验证组件', 'CDK 高级用法', '主题与 Token 定制']),
  c('Angular Universal 服务端渲染与 PWA', '掌握 Angular SSR 与 Progressive Web App 离线能力建设',
    ['Angular Universal SSR', 'PWA 离线能力'], 'cat_001', '李老师', 240, 60, 4.4,
    ['Angular Universal 配置', 'State Transfer', 'Service Worker', 'PWA 缓存策略']),
  c('Angular 性能优化与 E2E 测试', 'OnPush 变更检测、懒加载、Cypress E2E 测试与可访问性实践',
    ['Angular 性能优化（OnPush/懒加载）', '设计模式（SOLID）'], 'cat_001', '李老师', 240, 55, 4.5,
    ['OnPush 变更检测', '懒加载策略', 'Cypress E2E 测试', 'SOLID 设计原则']),
]

// ── 前端开发 · 小程序/跨端方向 ──
const feMiniApp = [
  c('微信小程序原生开发实战', '系统学习微信小程序框架、API、组件开发与微信生态集成',
    ['微信小程序原生开发', '微信 API（支付/授权）', 'Webview 通信'], 'cat_008', '赵老师', 720, 180, 4.7,
    ['小程序基础架构', '页面与组件开发', '微信支付与授权', 'WebView 混合开发']),
  c('uni-app 跨平台开发实战', '使用 uni-app 一套代码同时发布微信/支付宝小程序、App 与 H5',
    ['uni-app/Taro', 'uni-app 插件开发'], 'cat_008', '赵老师', 600, 150, 4.7,
    ['uni-app 工程配置', '条件编译策略', '原生插件开发', '多端发布与调试']),
  c('小程序性能优化与分包实战', '掌握小程序分包加载、预加载、骨架屏与渲染性能优化技巧',
    ['小程序性能优化（分包/预加载）'], 'cat_008', '赵老师', 180, 110, 4.6,
    ['分包配置与策略', '预下载与预渲染', '骨架屏实现', '渲染性能优化']),
  c('Flutter 移动开发入门', '使用 Flutter 构建跨 iOS/Android 的高性能原生应用',
    ['Flutter/React Native'], 'cat_008', '赵老师', 900, 130, 4.7,
    ['Dart 语言基础', 'Widget 体系', '状态管理', '原生 API 集成与发布']),
  c('跨端 CI/CD 多端发布工程化', '搭建 uni-app/Taro 项目的自动化构建、测试与多端发布流水线',
    ['CI/CD 多端发布', 'Hybrid App 架构'], 'cat_008', '赵老师', 180, 80, 4.4,
    ['多端构建配置', 'GitHub Actions 发布', '自动化测试', '小程序版本管理']),
]

// ── 后端开发 · Node.js 方向 ──
const beNode = [
  c('Node.js 核心模块与后端开发', '深入 Node.js 事件循环、流、文件系统与 Express/Koa 框架开发',
    ['Node.js 核心模块', 'Node.js', 'Express/Koa/NestJS', 'Socket.io'], 'cat_002', '陈老师', 720, 160, 4.7,
    ['Node.js 核心模块', 'Express 中间件体系', 'Koa 洋葱模型', 'Socket.io 实时通信']),
  c('Node.js 性能调优与集群', '深入 libuv 事件循环、cluster 多进程与内存泄漏诊断',
    ['Node.js 性能调优（libuv/cluster）', 'npm/pnpm'], 'cat_002', '陈老师', 300, 90, 4.5,
    ['libuv 事件循环', 'cluster 模式', '内存泄漏排查', 'pnpm 工程管理']),
  c('GraphQL 与 Apollo Server 接口设计', '构建类型安全的 GraphQL API，掌握 Schema、Resolver 与订阅',
    ['GraphQL/Apollo', 'OpenAPI 规范'], 'cat_002', '陈老师', 240, 80, 4.6,
    ['GraphQL 基础', 'Apollo Server 配置', 'Resolver 与 DataLoader', 'Subscriptions 实时']),
  c('MongoDB 与 Mongoose 数据操作', '掌握 MongoDB 文档模型、聚合管道与 Mongoose ODM 高级用法',
    ['MongoDB/MySQL', 'JWT 鉴权'], 'cat_002', '陈老师', 300, 110, 4.6,
    ['MongoDB 核心概念', 'Mongoose 模型定义', '聚合管道', 'JWT 认证集成']),
]

// ── 前端开发 · 可视化进阶方向 ──
const vizExtra = [
  c('GeoJSON 地图可视化开发', '系统学习 GeoJSON/TopoJSON 地图数据处理与交互式地图可视化',
    ['GeoJSON/TopoJSON 地图处理', '数据驱动动画（GSAP/Transition）', 'Canvas 性能优化'], 'cat_001', '刘老师', 360, 130, 4.6,
    ['GeoJSON 数据解析', '地图投影与缩放', 'D3-geo 地图可视化', '交互式地图与动画']),
  c('AntV G2/G6 图分析实战', '掌握 AntV G2 统计图表与 G6 关系图分析引擎',
    ['AntV G2/G6 高级图分析', '可视化组件库设计规范', 'Apache ECharts 源码级定制'], 'cat_001', '刘老师', 480, 110, 4.7,
    ['G2 图表语法基础', 'G6 关系图引擎', '大规模图渲染', '可视化组件库设计']),
  c('大数据可视化与实时数据流', '构建大规模数据虚拟化渲染与 WebSocket 实时数据流可视化',
    ['大数据可视化（虚拟化/LOD 策略）', '实时数据流可视化（WebSocket + requestAnimationFrame）', '可视化叙事（Scrollytelling）', '性能分析（Frame Budget/GPU 火焰图）'], 'cat_001', '刘老师', 300, 90, 4.7,
    ['虚拟化与 LOD 策略', 'WebSocket 实时推送', 'requestAnimationFrame 动画', '可视化叙事设计']),
]

// ── 数据分析 · 增长分析进阶 ──
const growthExtra = [
  c('增长实验与渠道归因分析', '掌握增长实验全流程设计与多渠道归因分析方法',
    ['渠道归因分析（Last Click/Multi-touch）', '增长实验全流程（假设→设计→上线→评估）', 'Google Analytics / Mixpanel 基础', '增长实验文档撰写'], 'cat_007', '李老师', 300, 130, 4.6,
    ['增长实验设计', '归因分析模型', 'Google Analytics 实战', 'Mixpanel 事件追踪']),
  c('用户生命周期与 LTV 模型', '构建用户生命周期模型，掌握 CLV/Churn 预测与 RFM 分群',
    ['用户生命周期模型（CLV/Churn）', 'LTV 与 Cohort 留存模型', '用户分群与 RFM 模型', 'Segment/Amplitude 用户行为平台'], 'cat_007', '李老师', 360, 140, 4.7,
    ['用户生命周期理论', 'CLV 与 Churn 预测', 'RFM 分群实战', 'Cohort 留存分析']),
  c('因果推断与增长建模', '深入因果推断方法论与增长黑客数据驱动策略',
    ['因果推断（DID/IV/RCT 设计）', '因果推断与增量价值评估（Uplift Modeling）', 'Python 增长统计建模', '增长黑客方法论（Sean Ellis）', '跨渠道归因模型（MMM）'], 'cat_007', '李老师', 240, 100, 4.6,
    ['DID 双重差分法', 'Uplift Modeling', '增长黑客框架', '归因模型实战']),
]

// ── 机器学习 · 深度学习进阶 ──
const dlExtra = [
  c('深度学习理论基础', '系统学习反向传播、优化器原理与主流网络架构',
    ['反向传播与优化器（Adam/SGD）', 'CNN/RNN/Transformer 基础架构'], 'cat_003', '郑老师', 480, 160, 4.8,
    ['反向传播算法详解', '优化器对比（SGD/Adam/AdamW）', 'CNN 架构演进', 'RNN 与 Transformer']),
  c('分布式训练实战（DDP/DeepSpeed）', '掌握 PyTorch DDP、DeepSpeed/Megatron 大规模分布式训练',
    ['分布式训练（DDP/DeepSpeed）', '大规模分布式训练（Megatron/FSDP）'], 'cat_003', '郑老师', 360, 100, 4.7,
    ['PyTorch DDP 原理', 'DeepSpeed ZeRO 优化', 'Megatron 模型并行', '多机多卡实战']),
  c('实验追踪与模型管理', '使用 W&B/MLflow/DVC 建立完整的实验追踪与模型版本管理',
    ['Weights & Biases 实验追踪', 'Git/DVC 版本管理'], 'cat_003', '郑老师', 180, 80, 4.5,
    ['W&B 实验追踪配置', 'MLflow 模型注册', 'DVC 数据版本管理', '实验对比与可视化']),
]

// ── 数据分析 · 数据开发进阶 ──
const bigdataExtra = [
  c('湖仓一体架构实战', '深入 Delta Lake/Iceberg/Hudi 湖仓一体架构设计与实践',
    ['Delta Lake/Iceberg 湖仓格式', '湖仓一体架构（Delta Lake/Hudi）', '湖仓一体（Iceberg + Flink）', '湖仓一体（Hudi + Trino 联邦查询）'], 'cat_007', '赵老师', 480, 120, 4.7,
    ['湖仓一体架构概述', 'Delta Lake 核心特性', 'Apache Iceberg 实战', 'Hudi 与 Flink 集成']),
  c('数据质量与元数据管理', '构建数据质量监控体系与 Apache Atlas 元数据治理平台',
    ['数据质量监控（Great Expectations）', '元数据管理（Apache Atlas）', '数据血缘追踪', '数据血缘与影响分析', '数据质量监控体系'], 'cat_007', '赵老师', 300, 100, 4.6,
    ['Great Expectations 规则', 'Apache Atlas 部署', '数据血缘追踪', '数据质量看板']),
  c('数据调度与编排进阶', '深入 Azkaban/DolphinScheduler 调度与 DataOps 工程实践',
    ['Azkaban/DolphinScheduler 调度', 'DataOps 与 CI/CD for Data', 'Shell 脚本自动化', '数据中台架构设计（OneData 方法论）'], 'cat_007', '赵老师', 240, 90, 4.5,
    ['DolphinScheduler 部署', '复杂 DAG 调度', 'DataOps 工程实践', '数据中台架构']),
]

// ── 测试开发 · 性能测试进阶 ──
const perfTestExtra = [
  c('APM 全链路监控与火焰图', '掌握 SkyWalking/Pinpoint APM 监控与火焰图性能分析',
    ['APM 工具（SkyWalking/Pinpoint）', '火焰图与堆栈分析', 'JVM 性能分析（Arthas/async-profiler）'], 'cat_006', '王老师', 360, 110, 4.6,
    ['SkyWalking 链路追踪', 'Pinpoint 部署实战', 'Arthas 在线诊断', '火焰图分析方法']),
  c('Gatling 与 k6 分布式压测', '使用 Gatling/k6 构建高并发分布式压测方案',
    ['Gatling 基础', 'Gatling Scala 脚本', 'k6/Locust 分布式压测', 'Nginx 性能调优', 'MySQL 慢查询与执行计划'], 'cat_006', '王老师', 300, 90, 4.5,
    ['Gatling Scala 脚本', 'k6 JavaScript 压测', 'Locust 分布式', 'Nginx 调优与慢查询分析']),
]

// ── 后端开发 · Go 进阶 ──
const goExtra = [
  c('分布式链路追踪与服务网格', '深入 Jaeger 链路追踪与 Istio 服务网格实战',
    ['分布式链路追踪（Jaeger）', '分布式链路追踪', '服务网格（Istio）', '服务网格'], 'cat_002', '陈老师', 360, 120, 4.6,
    ['Jaeger 链路追踪原理', 'OpenTelemetry 集成', 'Istio 流量管理', '服务网格可观测性']),
  c('Go 并发进阶与中间件设计', '深入 Go 并发模型（sync/atomic/context）与中间件架构',
    ['Go 并发模型深度（sync/atomic/context）', '中间件设计', '性能火焰图分析'], 'cat_002', '陈老师', 240, 100, 4.7,
    ['sync 包深入', 'atomic 与 context', '中间件设计模式', '性能分析与火焰图']),
]

// ── 后端开发 · Python 进阶 ──
const pyExtra = [
  c('Python 微服务与性能调优', '掌握 Python gRPC 微服务与性能调优方法',
    ['Python 性能调优', '微服务拆分', 'gRPC 微服务', 'AI 模型 API 集成（OpenAI/HF）', 'AI 模型服务化（Triton/vLLM）'], 'cat_002', '张老师', 300, 110, 4.6,
    ['gRPC Python 服务', 'asyncio 性能优化', '内存与 CPU 调优', 'AI 模型 API 封装']),
  c('PostgreSQL 进阶与数据建模', '深入 PostgreSQL 高级特性、索引优化与数据建模',
    ['PostgreSQL 进阶', 'MySQL/PostgreSQL'], 'cat_002', '张老师', 240, 90, 4.5,
    ['PostgreSQL 高级 SQL', '索引策略与执行计划', 'JSONB 与全文搜索', '数据建模最佳实践']),
]

// ── 后端开发 · Java 进阶 ──
const javaExtra = [
  c('Java 单元测试实战（JUnit/Mockito）', '掌握 JUnit 5 与 Mockito 单元测试、集成测试方法',
    ['JUnit/Mockito 单元测试', 'JUnit/Mockito', '系统设计'], 'cat_002', '张老师', 240, 120, 4.6,
    ['JUnit 5 基础', 'Mockito 模拟与验证', '集成测试策略', '测试驱动开发 TDD']),
  c('Java 系统设计与架构实战', '学习 Java 大型系统设计模式、Code Review 与架构实战',
    ['系统设计', 'Code Review', '架构设计', '设计模式（SOLID）'], 'cat_002', '张老师', 360, 100, 4.7,
    ['系统设计方法论', 'Code Review 最佳实践', '高可用架构设计', 'SOLID 原则与模式']),
]

// ── 测试开发 · 自动化测试进阶 ──
const qaAutoExtra = [
  c('Python pytest 自动化框架实战', '从零搭建 pytest 自动化测试框架与 Allure 报告体系',
    ['Python pytest 自动化框架', 'Allure 测试报告', 'Python/Java'], 'cat_006', '王老师', 480, 140, 4.7,
    ['pytest 核心功能', 'Fixture 与参数化', 'Allure 报告集成', '框架架构设计']),
  c('抓包工具与网络调试实战', '掌握 Charles/Fiddler 抓包与 HTTP/TCP 协议调试',
    ['Charles/Fiddler 抓包', 'TCP/HTTP 基础', 'HTTP 协议基础'], 'cat_006', '王老师', 180, 100, 4.5,
    ['Charles 抓包配置', 'Fiddler 请求调试', 'HTTP 协议深入', 'HTTPS 解密与 Mock']),
]

/* ═══ 外部学习链接映射（B站为主，课程 ID 按 _idx 顺序，从 course_100 起） ═══ */
const EXTERNAL_URL_MAP: Record<string, string> = {
  // ── 共享课程 (course_100 ~ course_107) ──
  'course_100': 'https://www.bilibili.com/video/BV1HM411377j/', // Git版本控制（GeekHour）
  'course_101': 'https://www.bilibili.com/video/BV1n84y1i7td/', // Linux基础与运维（黑马）
  'course_102': 'https://www.bilibili.com/video/BV1gr4y1U7CY/', // Docker+K8s（尚硅谷）
  'course_103': 'https://www.bilibili.com/video/BV1tDsgzxECr/', // Python编程（尚硅谷）
  'course_104': 'https://www.bilibili.com/video/BV1iF411z7Pu/', // SQL/MySQL（黑马）
  'course_105': 'https://www.bilibili.com/video/BV1Jj411D7oG/', // Redis缓存（GeekHour）
  'course_106': 'https://www.bilibili.com/video/BV1Xy4y1v7S2/', // TypeScript（尚硅谷）
  'course_107': 'https://www.bilibili.com/video/BV16z4y1378W/', // CI/CD Jenkins+Docker
  // ── 前端 Vue (course_108 ~ course_116) ──
  'course_108': 'https://www.bilibili.com/video/BV14J4114768/', // HTML/CSS（黑马pink）
  'course_109': 'https://www.bilibili.com/video/BV1Y84y1L7Nn/', // JavaScript（黑马）
  'course_110': 'https://www.bilibili.com/video/BV1Zy4y1K7SH/', // Vue3 Composition API（尚硅谷）
  'course_111': 'https://www.bilibili.com/video/BV1ra4y1H7ih/', // Element Plus（尚硅谷Vue+EP）
  'course_112': 'https://www.bilibili.com/video/BV1GK4y1S7Zy/', // Vite工程化（近似）
  'course_113': 'https://www.bilibili.com/video/BV1Bp4y1C7Rx/', // 前端性能优化（近似）
  'course_114': 'https://www.bilibili.com/video/BV1ra4y1H7ih/', // SSR/Nuxt（Vue全家桶近似）
  'course_115': 'https://www.bilibili.com/video/BV1Zy4y1K7SH/', // 微前端（近似Vue架构）
  'course_116': 'https://www.bilibili.com/video/BV1Y84y1L7Nn/', // RESTful API前后端联调（近似）
  // ── 前端 React (course_117 ~ course_123) ──
  'course_117': 'https://www.bilibili.com/video/BV1wy4y1D7JT/', // React Hooks（尚硅谷React）
  'course_118': 'https://www.bilibili.com/video/BV1wy4y1D7JT/', // Redux/Zustand（React全家桶含）
  'course_119': 'https://www.bilibili.com/video/BV1wy4y1D7JT/', // React Router（React全家桶含）
  'course_120': 'https://www.bilibili.com/video/BV1wy4y1D7JT/', // Ant Design（近似React课）
  'course_121': 'https://www.bilibili.com/video/BV1wy4y1D7JT/', // Next.js SSR（近似React课）
  'course_122': 'https://www.bilibili.com/video/BV1Y84y1L7Nn/', // GraphQL/tRPC（近似前端课）
  'course_123': 'https://www.bilibili.com/video/BV1Gw411N73T/', // Jest+Playwright前端测试
  // ── 可视化 (course_124 ~ course_129) ──
  'course_124': 'https://www.bilibili.com/video/BV1Tp4y1y7vv/', // D3.js可视化（近似ECharts大屏）
  'course_125': 'https://www.bilibili.com/video/BV1Da4y1N7kM/', // ECharts图表与大屏
  'course_126': 'https://www.bilibili.com/video/BV1Gg411X7FY/', // Three.js 3D可视化（老陈2024）
  'course_127': 'https://www.bilibili.com/video/BV1Da4y1N7kM/', // Canvas/SVG（近似ECharts）
  'course_128': 'https://www.bilibili.com/video/BV1Gg411X7FY/', // WebGL（近似Three.js）
  'course_129': 'https://www.bilibili.com/video/BV1Bp4y1C7Rx/', // 低代码可视化平台（近似大屏）
  // ── 后端 Java (course_130 ~ course_139) ──
  'course_130': 'https://www.bilibili.com/video/BV1PY411e7J6/', // Java SE核心（尚硅谷宋红康）
  'course_131': 'https://www.bilibili.com/video/BV19K4y1L7MT/', // Spring Boot（尚硅谷）
  'course_132': 'https://www.bilibili.com/video/BV19K4y1L7MT/', // MyBatis-Plus（SpringBoot含）
  'course_133': 'https://www.bilibili.com/video/BV18E411x7eT/', // Spring Cloud Alibaba（尚硅谷）
  'course_134': 'https://www.bilibili.com/video/BV1vr4y1677k/', // Kafka+RocketMQ（尚硅谷Kafka3）
  'course_135': 'https://www.bilibili.com/video/BV1PY411e7J6/', // JVM调优（近似Java核心）
  'course_136': 'https://www.bilibili.com/video/BV18E411x7eT/', // 分布式事务（SpringCloud含）
  'course_137': 'https://www.bilibili.com/video/BV18E411x7eT/', // DDD（近似微服务架构课）
  'course_138': 'https://www.bilibili.com/video/BV1PY411e7J6/', // Maven/Gradle（近似Java课）
  'course_139': 'https://www.bilibili.com/video/BV19K4y1L7MT/', // JWT鉴权（SpringBoot安全含）
  // ── 后端 Go (course_140 ~ course_146) ──
  'course_140': 'https://www.bilibili.com/video/BV1ME411Y71o/', // Go语言基础+并发（尚硅谷）
  'course_141': 'https://www.bilibili.com/video/BV1ME411Y71o/', // Gin/Fiber（Go课含）
  'course_142': 'https://www.bilibili.com/video/BV1ME411Y71o/', // Go微服务（Go课含）
  'course_143': 'https://www.bilibili.com/video/BV1ME411Y71o/', // gRPC（Go课近似）
  'course_144': 'https://www.bilibili.com/video/BV1ME411Y71o/', // Go性能调优（Go课含）
  'course_145': 'https://www.bilibili.com/video/BV1ME411Y71o/', // ETCD（近似Go微服务）
  'course_146': 'https://www.bilibili.com/video/BV1ME411Y71o/', // GORM（Go课含）
  // ── 后端 Python (course_147 ~ course_151) ──
  'course_147': 'https://www.bilibili.com/video/BV14Z421z78C/', // Django/Flask（Django5）
  'course_148': 'https://www.bilibili.com/video/BV1xE41177Lh/', // FastAPI
  'course_149': 'https://www.bilibili.com/video/BV14Z421z78C/', // Celery（近似Django）
  'course_150': 'https://www.bilibili.com/video/BV14Z421z78C/', // SQLAlchemy（近似Django ORM）
  'course_151': 'https://www.bilibili.com/video/BV19K4y1L7MT/', // NestJS（近似SpringBoot）
  // ── QA测试开发 (course_152 ~ course_165) ──
  'course_152': 'https://www.bilibili.com/video/BV1Gw411N73T/', // Postman接口测试（近似Playwright）
  'course_153': 'https://www.bilibili.com/video/BV1fY41177kW/', // 测试用例设计（JMeter实战含）
  'course_154': 'https://www.bilibili.com/video/BV1Gw411N73T/', // Selenium/Playwright自动化
  'course_155': 'https://www.bilibili.com/video/BV1fY41177kW/', // 黑盒测试（近似性能测试）
  'course_156': 'https://www.bilibili.com/video/BV1fY41177kW/', // 测试计划与风险评估
  'course_157': 'https://www.bilibili.com/video/BV1Gw411N73T/', // API测试（Playwright含）
  'course_158': 'https://www.bilibili.com/video/BV1Gw411N73T/', // 移动端专项测试（近似）
  'course_159': 'https://www.bilibili.com/video/BV1fY41177kW/', // 质量度量平台（近似）
  'course_160': 'https://www.bilibili.com/video/BV1fY41177kW/', // 安全测试（近似测试课）
  'course_161': 'https://www.bilibili.com/video/BV1fY41177kW/', // JMeter压测
  'course_162': 'https://www.bilibili.com/video/BV1n84y1i7td/', // Linux资源监控（Linux课含）
  'course_163': 'https://www.bilibili.com/video/BV1cN4y1u7CW/', // Prometheus+Grafana
  'course_164': 'https://www.bilibili.com/video/BV1fY41177kW/', // 全链路压测（近似性能测试）
  'course_165': 'https://www.bilibili.com/video/BV1fY41177kW/', // 性能基线SLA（近似）
  // ── 数据分析 (course_166 ~ course_184) ──
  'course_166': 'https://www.bilibili.com/video/BV1iF411z7Pu/', // SQL进阶窗口函数（MySQL含）
  'course_167': 'https://www.bilibili.com/video/BV1D9GLzyEL6/', // Excel/BI（尚硅谷数据分析）
  'course_168': 'https://www.bilibili.com/video/BV1D9GLzyEL6/', // 统计学基础（近似数据分析）
  'course_169': 'https://www.bilibili.com/video/BV1D9GLzyEL6/', // 业务指标体系（近似数据分析）
  'course_170': 'https://www.bilibili.com/video/BV1wPiKBkEzU/', // Pandas数据处理
  'course_171': 'https://www.bilibili.com/video/BV1D9GLzyEL6/', // A/B测试（近似数据分析）
  'course_172': 'https://www.bilibili.com/video/BV1wPiKBkEzU/', // 数据清洗ETL（近似Pandas）
  'course_173': 'https://www.bilibili.com/video/BV11A411L7CK/', // Spark大数据（尚硅谷）
  'course_174': 'https://www.bilibili.com/video/BV1qy4y1q728/', // Flink实时流处理（尚硅谷）
  'course_175': 'https://www.bilibili.com/video/BV1EZ4y1G7iL/', // Hive SQL+数仓分层（尚硅谷）
  'course_176': 'https://www.bilibili.com/video/BV11A411L7CK/', // DataX/Sqoop（Spark课近似）
  'course_177': 'https://www.bilibili.com/video/BV1qy4y1q728/', // Airflow编排（近似Flink课）
  'course_178': 'https://www.bilibili.com/video/BV1vr4y1677k/', // Kafka消息队列（尚硅谷Kafka3）
  'course_179': 'https://www.bilibili.com/video/BV1D9GLzyEL6/', // 用户行为分析（近似数据分析）
  'course_180': 'https://www.bilibili.com/video/BV1Da4y1N7kM/', // BI平台（近似ECharts）
  'course_181': 'https://www.bilibili.com/video/BV1EZ4y1G7iL/', // 数仓建模（Hive课含）
  'course_182': 'https://www.bilibili.com/video/BV1wPiKBkEzU/', // 时序预测Prophet（近似Pandas）
  'course_183': 'https://www.bilibili.com/video/BV1wPiKBkEzU/', // Matplotlib/Seaborn
  'course_184': 'https://www.bilibili.com/video/BV1wPiKBkEzU/', // Jupyter Notebook（含）
  // ── 机器学习/AI (course_185 ~ course_204) ──
  'course_185': 'https://www.bilibili.com/video/BV1Fzszz4Ek7/', // 机器学习算法基础（黑马）
  'course_186': 'https://www.bilibili.com/video/BV1BYe4z5E9z/', // 推荐系统（尚硅谷ML）
  'course_187': 'https://www.bilibili.com/video/BV1Fzszz4Ek7/', // 特征工程（近似ML课）
  'course_188': 'https://www.bilibili.com/video/BV1hh411D7sb/', // Elasticsearch搜索引擎（尚硅谷）
  'course_189': 'https://www.bilibili.com/video/BV1MRJmzSEaa/', // 深度排序模型（尚硅谷深度学习）
  'course_190': 'https://www.bilibili.com/video/BV1Fzszz4Ek7/', // MLOps（近似ML课）
  'course_191': 'https://www.bilibili.com/video/BV1hh411D7sb/', // 向量检索FAISS（近似ES）
  'course_192': 'https://www.bilibili.com/video/BV1Y7411d7Ys/', // PyTorch深度学习实践
  'course_193': 'https://www.bilibili.com/video/BV1MRJmzSEaa/', // 计算机视觉OpenCV+YOLO（深度学习含）
  'course_194': 'https://www.bilibili.com/video/BV1k44LzPEhU/', // NLP+Transformer+BERT（尚硅谷）
  'course_195': 'https://www.bilibili.com/video/BV1Y7411d7Ys/', // CUDA GPU编程（近似PyTorch）
  'course_196': 'https://www.bilibili.com/video/BV1MRJmzSEaa/', // 模型部署TensorRT（深度学习含）
  'course_197': 'https://www.bilibili.com/video/BV1MRJmzSEaa/', // 模型蒸馏与量化（近似深度学习）
  'course_198': 'https://www.bilibili.com/video/BV1ZppNzHEY4/', // LLM大模型应用（尚硅谷LangChain）
  'course_199': 'https://www.bilibili.com/video/BV1ZppNzHEY4/', // Prompt工程（LangChain含）
  'course_200': 'https://www.bilibili.com/video/BV1ZppNzHEY4/', // RAG检索增强（LangChain含）
  'course_201': 'https://www.bilibili.com/video/BV1ZppNzHEY4/', // LLM私有化部署vLLM（近似LangChain）
  'course_202': 'https://www.bilibili.com/video/BV1ZppNzHEY4/', // Agent框架（LangChain含）
  'course_203': 'https://www.bilibili.com/video/BV1k44LzPEhU/', // 多模态AI（NLP课含）
  'course_204': 'https://www.bilibili.com/video/BV1ZppNzHEY4/', // LLM评测体系（近似LangChain）
  // ── React 进阶 (course_205 ~ course_208) ──
  'course_205': 'https://www.bilibili.com/video/BV1wy4y1D7JT/', // React 18 Concurrent Mode（尚硅谷React全家桶）
  'course_206': 'https://www.bilibili.com/video/BV1wy4y1D7JT/', // React Query/SWR（尚硅谷React全家桶近似）
  'course_207': 'https://www.bilibili.com/video/BV1e7411E7D4/', // Webpack 5深度配置（尚硅谷Webpack5）
  'course_208': 'https://www.bilibili.com/video/BV1wy4y1D7JT/', // Monorepo工程实践（近似前端工程化）
  // ── Angular (course_209 ~ course_214) ──
  'course_209': 'https://www.bilibili.com/video/BV1tS4y1V7RK/', // Angular 15+核心（尚硅谷Angular，近似）
  'course_210': 'https://www.bilibili.com/video/BV1tS4y1V7RK/', // RxJS响应式编程（Angular课含）
  'course_211': 'https://www.bilibili.com/video/BV1tS4y1V7RK/', // NgRx状态管理（近似Angular）
  'course_212': 'https://www.bilibili.com/video/BV1tS4y1V7RK/', // Angular Material（近似Angular）
  'course_213': 'https://www.bilibili.com/video/BV1tS4y1V7RK/', // Angular Universal SSR
  'course_214': 'https://www.bilibili.com/video/BV1tS4y1V7RK/', // Angular性能优化与测试
  // ── 小程序/跨端 (course_215 ~ course_219) ──
  'course_215': 'https://www.bilibili.com/video/BV1nM411475W/', // 微信小程序（黑马程序员）
  'course_216': 'https://www.bilibili.com/video/BV1ZT4y1R7bN/', // uni-app跨平台开发（黑马）
  'course_217': 'https://www.bilibili.com/video/BV1nM411475W/', // 小程序性能优化（近似小程序）
  'course_218': 'https://www.bilibili.com/video/BV1dT4y1N7xj/', // Flutter入门（尚硅谷Flutter）
  'course_219': 'https://www.bilibili.com/video/BV1ZT4y1R7bN/', // 跨端CI/CD（近似uni-app）
  // ── Node.js 后端 (course_220 ~ course_223) ──
  'course_220': 'https://www.bilibili.com/video/BV1a34y167AZ/', // Node.js核心（黑马Node.js）
  'course_221': 'https://www.bilibili.com/video/BV1a34y167AZ/', // Node.js性能调优（近似Node.js）
  'course_222': 'https://www.bilibili.com/video/BV1a34y167AZ/', // GraphQL/Apollo（近似Node.js）
  'course_223': 'https://www.bilibili.com/video/BV1a34y167AZ/', // MongoDB与TypeORM（近似Node.js）
  // ── 可视化进阶 (course_224 ~ course_226) ──
  'course_224': 'https://www.bilibili.com/video/BV1Da4y1N7kM/', // GeoJSON地图可视化（近似ECharts大屏）
  'course_225': 'https://www.bilibili.com/video/BV1Tp4y1y7vv/', // AntV G2/G6（近似D3.js可视化）
  'course_226': 'https://www.bilibili.com/video/BV1Da4y1N7kM/', // 大数据可视化实时数据流（近似ECharts）
  // ── 增长分析进阶 (course_227 ~ course_229) ──
  'course_227': 'https://www.bilibili.com/video/BV1D9GLzyEL6/', // 增长实验与渠道归因（近似数据分析）
  'course_228': 'https://www.bilibili.com/video/BV1D9GLzyEL6/', // 用户生命周期与LTV（近似数据分析）
  'course_229': 'https://www.bilibili.com/video/BV1D9GLzyEL6/', // 因果推断与增长建模（近似数据分析）
  // ── 深度学习进阶 (course_230 ~ course_232) ──
  'course_230': 'https://www.bilibili.com/video/BV1Y7411d7Ys/', // 深度学习理论基础（PyTorch实践近似）
  'course_231': 'https://www.bilibili.com/video/BV1Y7411d7Ys/', // 分布式训练DDP/DeepSpeed（近似PyTorch）
  'course_232': 'https://www.bilibili.com/video/BV1Y7411d7Ys/', // 实验追踪与模型管理（近似PyTorch）
  // ── 数据开发进阶 (course_233 ~ course_235) ──
  'course_233': 'https://www.bilibili.com/video/BV1qy4y1q728/', // 湖仓一体架构（近似Flink课）
  'course_234': 'https://www.bilibili.com/video/BV1EZ4y1G7iL/', // 数据质量与元数据管理（近似Hive课）
  'course_235': 'https://www.bilibili.com/video/BV11A411L7CK/', // 数据调度与编排进阶（近似Spark课）
  // ── 性能测试进阶 (course_236 ~ course_237) ──
  'course_236': 'https://www.bilibili.com/video/BV1cN4y1u7CW/', // APM全链路监控（近似Prometheus）
  'course_237': 'https://www.bilibili.com/video/BV1fY41177kW/', // Gatling与k6分布式压测（近似性能测试）
  // ── Go 进阶 (course_238 ~ course_239) ──
  'course_238': 'https://www.bilibili.com/video/BV1ME411Y71o/', // 分布式链路追踪与服务网格（近似Go课）
  'course_239': 'https://www.bilibili.com/video/BV1ME411Y71o/', // Go并发进阶与中间件设计（近似Go课）
  // ── Python 进阶 (course_240 ~ course_241) ──
  'course_240': 'https://www.bilibili.com/video/BV1xE41177Lh/', // Python微服务与性能调优（近似FastAPI）
  'course_241': 'https://www.bilibili.com/video/BV14Z421z78C/', // PostgreSQL进阶（近似Django课）
  // ── Java 进阶 (course_242 ~ course_243) ──
  'course_242': 'https://www.bilibili.com/video/BV19K4y1L7MT/', // Java单元测试JUnit/Mockito（近似SpringBoot）
  'course_243': 'https://www.bilibili.com/video/BV18E411x7eT/', // Java系统设计与架构（近似SpringCloud）
  // ── 自动化测试进阶 (course_244 ~ course_245) ──
  'course_244': 'https://www.bilibili.com/video/BV1Gw411N73T/', // Python pytest框架（近似Playwright）
  'course_245': 'https://www.bilibili.com/video/BV1Gw411N73T/', // 抓包工具与网络调试（近似Playwright）
}

/* ═══ 导出 ═══ */
export const careerCourses: Course[] = [
  ...shared, ...feVue, ...feReact, ...feViz,
  ...beJava, ...beGo, ...bePython,
  ...qaCourses, ...dataCourses, ...mlCourses,
  ...feReactExtra, ...feAngular, ...feMiniApp, ...beNode,
  ...vizExtra, ...growthExtra, ...dlExtra, ...bigdataExtra,
  ...perfTestExtra, ...goExtra, ...pyExtra, ...javaExtra, ...qaAutoExtra,
].map(course => ({
  ...course,
  externalUrl: EXTERNAL_URL_MAP[course.id],
}))

/** 获取全部职业方向课程（后续可替换为 API 调用） */
export function getCareerCourses(): Course[] {
  return careerCourses
}

/** 获取新增分类（后续可替换为 API 调用） */
export function getCareerCategories(): Category[] {
  return careerCategories
}
