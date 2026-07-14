# AGENTS.md

## 项目定位

- 这是一个纯前端多智能体职业规划决策平台演示项目，技术栈是 Vue 3 + TypeScript + Vite + Element Plus + Pinia。
- 当前数据全部来自本地 mock，不接真实后端。不要凭空引入 API 调用、接口层或服务端依赖，除非用户明确要求。
- 产品语言以中文为主。新增页面、提示文案、空状态、按钮文案优先使用自然中文。
- 系统核心是三角色体验：`student`、`teacher`、`admin`。任何新功能都要先考虑角色访问范围。

## 本地运行

- Node 版本遵循 `package.json`：`^20.19.0 || >=22.12.0`
- 安装依赖：`npm install`
- 启动开发环境：`npm run dev`
- 类型检查：`npm run type-check`
- 生产构建：`npm run build`

说明：

- 仓库当前没有 lint / 单元测试脚本。
- 只要改动影响运行行为、类型、路由、状态或构建，就至少执行 `npm run type-check`。
- 如果改动涉及打包、依赖、路径解析、资源引用，也执行 `npm run build`。

## 目录职责

- `src/views/`：页面入口，按角色拆分在 `student/`、`admin/` 下，公共课程页在 `course/` 下。
- `src/router/routes.ts`：全部路由定义。
- `src/router/index.ts`：路由守卫、标题设置、登录态与角色校验。
- `src/stores/`：Pinia store，项目使用 setup store 风格。统一由 `stores/index.ts` 导出。
- `src/mock/`：演示数据（5 个文件），包含核心数据（data.ts）、职业课程/线路/画像/报告数据。
- `src/types/`：领域类型定义，按领域拆分为 `user.ts`、`course.ts`、`career.ts`、`chart.ts`、`knowledge.ts`、`report.ts`、`ai.ts`，统一由 `index.ts` barrel re-export。新增实体时先在对应领域文件中定义，再改 mock/store/view。
- `src/components/charts/`：D3.js 图表组件（3 个：D3RadarChart、D3ChordDiagram、D3Treemap），优先复用，不要在页面里重复造轮子。
- `src/components/book/`：古籍风格 UI 组件（BookPage、CloudTabNav）。
- `src/components/career/`：职业模块子组件（CareerAgentDashboard、CareerNavigationIdlePreview、CareerStarMap）。
- `src/components/bookshelf/`：书架 3D 场景与展开浮层。
- `src/composables/`：Vue Composition API 可复用逻辑（9 个），包含图谱数据、Agent 流程、动画、会话管理等。
- `src/api/`：API 接口签名（当前为 mock 实现），预留后端替换。
- `src/plugins/gsap.ts`：GSAP 插件注册（ScrollTrigger / TextPlugin / MotionPath）。
- `src/constants/icons.ts`：Iconify 图标常量集合。
- `src/utils/index.ts`：工具函数（防抖、节流、格式化等）。
- `src/assets/styles/theme.css`：主题变量、Element Plus token 映射、全局动效与背景。
- `src/assets/styles/main.css`：页面容器、卡片、常用布局样式。
- `src/assets/images/`：图片资源。
- `src/assets/data/`：大型数据文件（地理 JSON 等）。
- `design-system/course-management/MASTER.md`：设计参考文档，不是运行时真相；如果和现有实现冲突，以项目现有代码和主题系统为准。

## 代码约定

- 默认使用 `<script setup lang="ts">`。
- 导入路径优先使用 `@/` 别名。
- 新增视图时，文件顶部沿用现有约定写注释，例如：`<!-- 页面：学习报告；路由：student/report；角色：STUDENT -->`
- 优先遵循 Composition API 和强类型，不要把复杂业务状态堆到组件局部变量里。
- 改动数据结构时，同步更新类型、mock 数据、store getter/action、相关页面。
- 不要为了小改动重写整页或统一大规模重构样式，除非用户明确要求。
- 不要引入新的状态管理方案、CSS 框架或图标体系。现有项目已使用 Element Plus、Iconify、Element Plus Icons。

## 路由与权限

- 公共页目前只有 `/login`。
- 新路由必须在 `meta` 中补齐至少 `title`，需要鉴权时补 `requiresAuth` 与 `role`/`roles`。
- 角色权限以 `src/router/index.ts` 的守卫逻辑为准；新增角色页时必须验证未登录、越权、已登录跳转这三种路径。
- 默认登录后入口是 `/app/dashboard`，越权访问也会回到这里。

## 状态与演示数据

- 登录、用户、学习记录等状态依赖 Pinia 持久化；不要绕开 store 直接操作 `localStorage`，除非该 store 已明确这么做。
- 演示账号来自 `src/mock/data.ts` 和 `README.md`。如果改了账号或密码，两边都要同步。
- 新增演示功能时，先判断是否应该落在现有 store 或 mock 数据里，不要只在单个页面里写一份孤立假数据。
- 如果页面展示的是课程、用户、学习记录、错题、笔记等已有领域对象，尽量复用 `src/types/index.ts` 已有类型。

## UI 与交互

- 优先复用 `assets/styles/theme.css` 和 `assets/styles/main.css` 中已有 token、卡片样式、页面容器和过渡效果。
- 当前项目已经有多主题系统，运行时主题来源是 `src/stores/theme.ts`。不要把设计稿里的单一配色硬编码成全局唯一标准。
- `design-system/course-management/MASTER.md` 可以作为视觉方向参考；如果它和当前页面实现冲突，优先保持被修改区域的一致性，不要顺手全站“纠偏”。
- 新页面和大改版要保证桌面端与移动端都可用，至少关注 `1024px`、`768px`、`640px` 附近断点。
- 图表页如果自己初始化 ECharts/D3 实例，记得处理 `resize` 和 `dispose`，不要留下泄漏。
- 这个仓库已经混用 Element Plus 组件和定制 CSS。修改某一页时先延续该页现有模式，不要把同一页改成另一套完全不同的 UI 语言。

## 提交前检查

- 变更的页面能从路由进入。
- 新增或修改的权限规则与角色体验一致。
- 类型定义、mock 数据、store 和页面没有脱节。
- 有副作用的监听、定时器、图表实例都做了清理。
- 至少完成 `npm run type-check`；必要时补 `npm run build`。

## 给后续 Agent 的工作方式

- 先看将要修改的页面、相关 store、相关类型，再动手。
- 优先做局部、可验证的改动，不要顺手清理无关代码。
- 如果用户只是要演示效果，可以继续基于 mock 数据实现；不要默认补一整套后端架构。
- 如果用户要求“重做 UI”或“统一视觉”，先看 `design-system/course-management/MASTER.md`，再结合当前页面实际实现做取舍。
