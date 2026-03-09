# 课程管理系统 (Course Management System)

基于 Vue 3 + TypeScript + Element Plus + D3.js 的纯前端课程管理系统演示项目。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集  
- **Element Plus** - Vue 3 组件库
- **Vue Router** - 官方路由管理器
- **Pinia** - Vue 状态管理方案
- **D3.js** - 数据可视化库
- **WangEditor** - 富文本编辑器
- **Vite** - 下一代前端构建工具

## 功能特性

### 1. 三角色权限系统
- **学生端**：学习中心、笔记管理、错题本、AI 助手、学习报告
- **教师端**：课程管理、学生管理、作业批改、班级报告、学情监控
- **管理员端**：用户管理、内容审核、系统监控

### 2. 数据可视化（D3.js）
- **堆叠柱状图**：学习进度统计
- **折线图**：成绩趋势分析、活跃度统计
- **雷达图**：知识点掌握情况
- **饼图**：作业完成情况、用户分布
- **直方图**：成绩分布
- **横向柱状图**：知识点错误率排行、学生排名

### 3. 核心功能模块

#### 学生端
- 视频播放器（模拟进度、倍速、全屏）
- 章节测验（单选、多选、填空）
- 富文本笔记编辑器
- 错题自动记录与练习
- AI 对话助手

#### 教师端
- 课程创建与编辑
- 学生进度追踪
- 作业批改与评分
- 班级数据分析

#### 管理员端
- 用户权限管理
- 课程内容审核
- 系统数据统计

## 项目结构

```
src/
├── components/
│   └── charts/           # D3.js 图表组件
├── layouts/
│   └── AppLayout.vue     # 主布局
├── mock/
│   └── data.ts           # 模拟数据
├── router/
│   ├── index.ts          # 路由配置
│   └── routes.ts         # 路由定义
├── stores/
│   ├── pinia.ts          # Pinia 配置
│   ├── user.ts           # 用户状态
│   ├── course.ts         # 课程状态
│   └── learning.ts       # 学习状态
├── types/
│   └── index.ts          # TypeScript 类型定义
├── views/
│   ├── student/          # 学生端页面
│   ├── teacher/          # 教师端页面
│   ├── admin/            # 管理员端页面
│   ├── LoginView.vue
│   ├── DashboardView.vue
│   └── NotFoundView.vue
└── main.ts
```

## 安装与运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
```

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 学生 | student001 | 123456 |
| 学生 | student002 | 123456 |
| 学生 | student003 | 123456 |
| 教师 | teacher001 | 123456 |
| 管理员 | admin001 | 123456 |

## D3.js 图表使用说明

### 组件封装原则
所有图表组件均遵循以下设计原则：
1. **响应式**：监听容器大小变化自动重绘
2. **数据驱动**：通过 props 传入数据，监听变化自动更新
3. **交互性**：支持 hover 提示、过渡动画
4. **类型安全**：完整的 TypeScript 类型定义

### 使用示例
```vue
<ScoreLineChart
  :data="[
    { date: '第一周', score: 75 },
    { date: '第二周', score: 82 }
  ]"
  :width="600"
  :height="350"
  title="成绩趋势"
  :show-area="true"
/>
```

## 角色权限说明

系统通过路由守卫实现角色权限控制：
- 未登录用户只能访问登录页
- 学生只能访问 `/app/student/*` 路由
- 教师只能访问 `/app/teacher/*` 路由
- 管理员只能访问 `/app/admin/*` 路由

## 数据存储

使用 Pinia + pinia-plugin-persistedstate 实现数据持久化：
- 用户登录状态存储在 localStorage
- 学习进度自动同步
- 笔记内容实时保存

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 开发建议

1. 使用 VS Code 配合 Vue 官方插件获得最佳开发体验
2. 安装 Vue DevTools 浏览器扩展进行调试
3. 建议开启浏览器开发者工具的 Custom Object Formatter

## 注意事项

本项目为纯前端演示项目，所有数据均为模拟数据：
- 视频播放为模拟实现
- AI 助手为预设回复
- 文件上传为前端模拟

实际部署时需要对接后端 API。

## 推荐设置

[VS Code](https://code.visualstudio.com/) + Vue (Official)

## 浏览器需要装备的扩展

- 基于Chrome:
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- 基于Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## 许可证

MIT License
