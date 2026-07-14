# 职导星图 · 前端演示

基于 Vue 3 + TypeScript + Vite + Element Plus + D3.js 的**大学生职业规划智能体前端演示**。  
内置 Mock 数据，开箱即用，无需后端依赖，已部署至 GitHub Pages。

> 本仓库是 [CPA-Agent](https://github.com/WHaoxM/cpa-agent-demo) 项目的**前端演示子仓库**，仅包含前端代码与 Mock 数据，用于在线展示系统能力。  
> 完整项目（含 Flask 后端、知识图谱、多智能体、L0–L4 管线）请访问主仓库。

## 在线演示

🌐 **https://whaoxm.github.io/cpa-agent-demo/**

## 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 学生 | 123456 | 123456 |
| 管理员 | 123456 | 123456 |

## 项目定位

本演示仓库展示 CPA-Agent 系统的**前端交互层**，覆盖学生端职业规划全链路与管理员端数据管理：

- 简历上传 → 能力画像 → 人岗匹配 → 职业报告 → 学习路径
- 三角色权限体系（学生 / 管理员 / 公共页面）
- D3.js + Three.js 数据可视化（雷达图、弦图、Treemap、3D 书架、力导向气泡图）

**数据说明**：所有页面默认使用 Mock 数据，可独立运行。  
本地联调时可通过 `VITE_API_BASE_URL` 连接 CPA-Agent 后端。

## 技术栈

- **Vue 3** (v3.5) - Composition API + `<script setup>`
- **TypeScript** (v5.9) - 类型安全
- **Vite** (v7) - 构建工具
- **Element Plus** - Vue 3 组件库
- **Vue Router** (v5) - 路由管理
- **Pinia** (v3) + pinia-plugin-persistedstate - 状态管理与持久化
- **D3.js** (v7) - 数据可视化（雷达图、弦图、Treemap）
- **ECharts** (v5) + vue-echarts - 图表与地图
- **GSAP** (v3) - 动画引擎（ScrollTrigger / TextPlugin / MotionPath）
- **Three.js** - 3D 场景渲染
- **Tiptap** - 富文本编辑器
- **Iconify** + Element Plus Icons - 图标体系

## 功能模块

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
├── api/                  # API 接口层（联调时接后端）
│   ├── backend.ts
│   └── report.ts
├── assets/               # 静态资源
│   ├── styles/           # CSS 样式 (base / theme / main)
│   ├── images/           # 图片资源
│   └── data/             # 大型数据文件（地理 JSON 等）
├── components/
│   ├── charts/           # D3.js 图表组件（RadarChart、ChordDiagram、Treemap）
│   ├── book/             # 古籍风格 UI 组件
│   ├── bookshelf/        # 书架 3D 场景与展开浮层
│   ├── career/           # 职业模块子组件
│   ├── UserInfoBar.vue
│   └── TiptapEditor.vue
├── composables/          # Vue Composition API 可复用逻辑（9 个）
├── constants/
│   └── icons.ts          # 图标常量集合
├── layouts/
│   └── AppLayout.vue     # 应用主框架
├── mock/                 # 演示数据（5 个文件，开箱即用）
│   ├── data.ts           # 核心演示数据
│   ├── careerCourses.ts  # 职业方向课程体系
│   ├── careerLines.ts    # 职业发展地铁线路
│   ├── careerPortraits.ts# 岗位画像数据
│   └── careerReportData.ts # 职业报告数据
├── plugins/
│   └── gsap.ts           # GSAP 插件注册
├── router/
│   ├── index.ts          # 路由守卫、登录态与角色校验
│   └── routes.ts         # 全部路由定义
├── stores/               # Pinia setup store（6 个业务 store）
├── types/                # 领域类型定义（按领域拆分）
├── utils/
│   └── index.ts          # 工具函数
├── views/
│   ├── student/          # 学生端页面（14 个 .vue）
│   ├── admin/            # 管理员端页面（2 个 .vue）
│   ├── course/           # 公共课程页
│   ├── HomeCenter.vue    # 首页
│   ├── LoginView.vue     # 登录页
│   ├── ProfileView.vue   # 个人中心
│   └── NotFoundView.vue  # 404
└── main.ts
```

## 快速开始

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（自动打开浏览器）
npm run dev

# 类型检查
npm run type-check

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

**Node 版本要求**：`^20.19.0 || >=22.12.0`

### 本地联调（可选）

如需连接 CPA-Agent 后端进行真实联调：

```bash
# 复制环境变量模板
cp .env.example .env.local
# Windows PowerShell:
# Copy-Item .env.example .env.local
```

`.env.local` 配置：

```env
VITE_API_BASE_URL=http://127.0.0.1:5001
```

已接入后端的联调点：

- `student/career-analysis`: `GET /api/career/landscape`
- `student/ai-assistant`: `POST /api/agent/chat`（`mode=demo`）
- `student/career-navigation`: `POST /api/pipeline/ext/parse/resume`、`POST /api/pipeline/trigger`、`GET /api/pipeline/status/{task_id}`
- `student/career-report`: `POST /api/report/generate`
- `student/my-reports`: `GET /api/report/list`、`GET /api/report/{report_id}`

未接入后端的页面保留 Mock 数据作为降级展示。

## 部署

本仓库通过 GitHub Actions 自动部署至 GitHub Pages，配置见 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)。

- **base 路径**：`/cpa-agent-demo/`（见 `vite.config.ts`）
- **SPA 路由**：`public/404.html` 处理 GitHub Pages 刷新重定向
- **触发条件**：推送至 `main` 分支自动部署

详细部署说明见 [DEPLOY.md](DEPLOY.md)。

## 角色权限说明

系统通过路由守卫实现角色权限控制：

- 未登录用户只能访问登录页 `/login`
- 登录后默认进入 `/app/dashboard`
- 学生可访问 `student/*` 及公共路由
- 管理员可访问 `admin/*` 及公共路由
- 越权访问自动重定向到首页

## 数据存储

使用 Pinia + pinia-plugin-persistedstate 实现数据持久化：

- 用户登录状态存储在 localStorage
- 学习进度自动同步
- 简历与技能解析结果持久化
- 报告记录持久化

## D3.js 图表封装原则

1. **响应式**：通过 `useResizeObserver` 监听容器大小变化自动重绘
2. **数据驱动**：通过 props 传入数据，watch 监听变化自动更新
3. **交互性**：支持 hover 提示、过渡动画
4. **类型安全**：完整的 TypeScript 类型定义
5. **生命周期管理**：`onBeforeUnmount` 时自动 dispose，防止内存泄漏

## 关于 CPA-Agent 主项目

本演示仓库是 CPA-Agent（职导星图）的前端展示层。完整项目包含：

- **Flask 后端** - API、服务层、Agent 引擎
- **L0–L4 管线** - 简历解析 → 图谱构建 → 四维画像 → 人岗匹配 → 报告生成
- **双引擎 Agent** - LangGraph（主） + ReAct（备）+ 12 工具
- **混合数据层** - MySQL · Neo4j · Redis · Milvus
- **知识图谱** - 技能/岗位/职业路径关系网络

主项目仓库与文档：[CPA-Agent 主仓库](https://github.com/WHaoxM/cpa-agent-demo)

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 插件
- 浏览器扩展：
  - Chrome: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## 许可证

MIT License
