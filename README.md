# 课程管理系统 (Course Management System)

基于 Vue 3 + TypeScript + Vite + Element Plus + D3.js 的纯前端课程管理与职业发展演示项目。

## 技术栈

- **Vue 3** (v3.5) - 渐进式 JavaScript 框架，使用 Composition API + `<script setup>`
- **TypeScript** (v5.9) - 类型安全的 JavaScript 超集
- **Vite** (v7) - 下一代前端构建工具
- **Element Plus** - Vue 3 组件库
- **Vue Router** (v5) - 官方路由管理器
- **Pinia** (v3) + pinia-plugin-persistedstate - 状态管理与持久化
- **D3.js** (v7) - 数据可视化（雷达图、弦图、Treemap）
- **ECharts** (v5) + vue-echarts - 图表与地图
- **GSAP** (v3) - 高性能动画引擎（ScrollTrigger / TextPlugin / MotionPath）
- **Three.js** - 3D 场景渲染
- **Tiptap** - 富文本编辑器（简历描述字段）
- **Iconify** + Element Plus Icons - 图标体系

## 功能特性

### 三角色权限系统

- **学生端**：技能提升、职业分析、职途导航、职业能力图谱、课程体系图谱、心仪岗位、个人能力画像、职业生涯报告、快速制作简历、我的报告、AI 助手、技能自评
- **管理员端**：岗位数据集管理、知识库维护
- **公共页面**：首页（HomeCenter）、个人中心、消息中心

### 学生端核心模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 技能提升 | `student/learning` | 课程学习中心，视频播放、章节测验、笔记 |
| 职业分析 | `student/career-analysis` | 羊皮卷舆图风格的水墨散点气泡地图 + 职业洞察 |
| 职途导航 | `student/career-navigation` | 简历导入与人岗匹配 |
| 职业能力图谱 | `student/career-ability` | Shell 容器 + 图谱/双栏/工作台三视图切换 |
| 课程体系 | `student/course-system` | 5 大领域 × 15 细分职业的分层网络关系图 |
| 心仪岗位 | `student/favorites` | 收藏的目标岗位、薪资筛选与人岗匹配入口 |
| 个人能力画像 | `student/career-portrait` | Agent 驱动的多维能力雷达 + 分阶段报告 |
| 职业生涯报告 | `student/career-report` | D3 力导向气泡图 + 七维评估 + 成长计划 |
| 快速制作简历 | `student/resume-builder` | 仿 magicv.art 三栏简历编辑器 |
| 我的报告 | `student/my-reports` | 书架式报告管理与查看 |
| AI 助手 | `student/ai-assistant` | 学习问答台，预设回复 |
| 技能自评 | `exams` | 按职业方向/细分赛道的技能评估 |

### 管理员端模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 岗位数据集 | `admin/job-dataset` | 岗位数据的增删改查管理 |
| 知识库维护 | `admin/knowledge-base` | 本地知识库内容管理 |

### 数据可视化组件（D3.js）

| 组件 | 说明 |
|------|------|
| `D3RadarChart` | 多边形雷达图，双系列对比（个人能力 vs 岗位要求） |
| `D3ChordDiagram` | 技能亲和力弦图，渐变 Ribbon + 外弧刻度 |
| `D3Treemap` | 课程结构 Treemap 图 |

## 项目结构

```
src/
├── api/                  # API 接口层（当前为 mock 实现，预留后端替换）
│   └── report.ts
├── assets/               # 静态资源
│   ├── styles/           # CSS 样式文件
│   │   ├── base.css      # 基础重置与字体
│   │   ├── theme.css     # 主题 CSS 变量、Element Plus token 映射
│   │   └── main.css      # 页面容器、卡片、布局样式
│   ├── images/           # 图片资源
│   └── data/             # 大型数据文件（地理 JSON 等）
├── components/
│   ├── charts/           # D3.js 图表组件（3 个：RadarChart、ChordDiagram、Treemap）
│   ├── book/             # 古籍风格 UI 组件（BookPage、CloudTabNav）
│   ├── bookshelf/        # 书架 3D 场景与展开浮层（BookshelfScene、BookOpenOverlay）
│   ├── career/           # 职业模块子组件（CareerAgentDashboard、CareerNavigationIdlePreview、CareerStarMap）
│   ├── UserInfoBar.vue   # 右上角用户信息栏
│   └── TiptapEditor.vue  # Tiptap 富文本编辑器封装
├── composables/          # Vue Composition API 可复用逻辑（9 个）
│   ├── useAbilityGraph.ts      # 职业能力图谱数据 & 同心圆布局
│   ├── useAgentPortrait.ts     # 简历解析后的技能结构与 Agent 画像流程
│   ├── useCareerInsights.ts    # 5 大职业方向洞察数据
│   ├── useCourseSystem.ts      # 课程体系分层网络关系图数据
│   ├── useGraphGeneration.ts   # 模拟 SSE 图谱生成流程
│   ├── useOnboardingState.ts   # 新手引导状态判断
│   ├── usePageEntrance.ts      # 页面入场动画 composable
│   ├── usePortraitSession.ts   # 画像会话管理（Agent Dashboard 共享时钟）
│   └── useResizeObserver.ts    # 通用 ResizeObserver
├── constants/
│   └── icons.ts          # 图标常量集合
├── layouts/
│   └── AppLayout.vue     # 应用主框架（侧边栏 + 顶栏 + router-view）
├── mock/                 # 演示数据（5 个文件）
│   ├── data.ts           # 核心演示数据与查询辅助函数
│   ├── careerCourses.ts  # 职业方向课程体系数据
│   ├── careerLines.ts    # 职业发展地铁线路与路径图谱
│   ├── careerPortraits.ts# 岗位画像数据
│   └── careerReportData.ts # 职业报告数据（汇聚导出）
├── plugins/
│   └── gsap.ts           # GSAP 插件注册（ScrollTrigger / TextPlugin / MotionPath）
├── router/
│   ├── index.ts          # 路由守卫、标题设置、登录态与角色校验
│   └── routes.ts         # 全部路由定义
├── stores/               # Pinia setup store（6 个业务 store）
│   ├── index.ts          # 统一导出
│   ├── user.ts           # 用户状态与认证
│   ├── course.ts         # 课程状态
│   ├── learning.ts       # 学习记录与进度
│   ├── theme.ts          # 多主题系统
│   ├── report.ts         # 报告管理
│   ├── resume.ts         # 简历与技能解析
│   └── pinia.ts          # Pinia 实例 + 持久化插件
├── types/                # 领域类型定义（按领域拆分）
│   ├── index.ts          # barrel re-export（统一导出口）
│   ├── user.ts           # 用户、角色、班级、统计
│   ├── course.ts         # 课程、章节、题目、测验、笔记
│   ├── career.ts         # 职业发展、岗位画像、七维评估
│   ├── chart.ts          # D3 图表数据类型
│   ├── knowledge.ts      # 知识图谱、Agent 步骤
│   ├── report.ts         # 报告记录
│   └── ai.ts             # AI 消息
├── utils/
│   └── index.ts          # 工具函数（防抖等）
├── views/
│   ├── student/          # 学生端页面（14 个 .vue）
│   ├── admin/            # 管理员端页面（2 个 .vue）
│   ├── course/           # 公共课程页（ExamsView、MessagesView）
│   ├── HomeCenter.vue    # 首页
│   ├── LoginView.vue     # 登录页
│   ├── ProfileView.vue   # 个人中心
│   └── NotFoundView.vue  # 404
└── main.ts
```

## 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（自动打开浏览器）
npm run dev

# 类型检查
npm run type-check

# 生产构建（含类型检查）
npm run build

# 预览构建产物
npm run preview
```

**Node 版本要求**：`^20.19.0 || >=22.12.0`

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 学生 | student001 | 123456 |
| 学生 | student002 | 123456 |
| 学生 | student003 | 123456 |
| 教师 | teacher001 | 123456 |
| 管理员 | admin001 | 123456 |

## 角色权限说明

系统通过路由守卫实现角色权限控制：

- 未登录用户只能访问登录页 `/login`
- 登录后默认进入 `/app/dashboard`
- 学生可访问 `student/*` 及公共路由
- 管理员可访问 `admin/*` 及公共路由
- 越权访问自动重定向到首页

## D3.js 图表封装原则

1. **响应式**：通过 `useResizeObserver` 监听容器大小变化自动重绘
2. **数据驱动**：通过 props 传入数据，watch 监听变化自动更新
3. **交互性**：支持 hover 提示、过渡动画
4. **类型安全**：完整的 TypeScript 类型定义
5. **生命周期管理**：`onBeforeUnmount` 时自动 dispose，防止内存泄漏

## 数据存储

使用 Pinia + pinia-plugin-persistedstate 实现数据持久化：
- 用户登录状态存储在 localStorage
- 学习进度自动同步
- 简历与技能解析结果持久化
- 报告记录持久化

## 注意事项

本项目为纯前端演示项目，所有数据均为模拟数据：
- 视频播放为模拟实现
- AI 助手为预设回复
- 简历解析为本地 mock
- Agent 画像为模拟 SSE 流程
- 文件上传为前端模拟

`src/api/` 目录已预留接口签名，后续可替换为真实后端调用。

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 插件
- 浏览器扩展：
  - Chrome: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## 许可证

MIT License
