# Findings & Decisions

## Requirements
- 用户认为当前项目前端观感较差。
- 需要给出相应的优化方案。
- 方案要避免 AI 模板化、同质化建议。
- 本轮不需要实现代码。
- 方案应基于当前项目现状，而不是泛化的“换配色/加阴影”式建议。

## Research Findings
- 当前任务更适合先审计项目已有的主题、布局、典型页面，再反推视觉问题来源。
- 项目是中文课程管理系统，且有 student、teacher、admin 三角色，因此方案需要兼顾角色差异化与整体统一。
- 全局主题已提供 `crystal`、`warm`、`xuanZhi`、`sunset`、`classicWhite`、`night` 六套配色，但核心组件仍大量直接写死局部色值，说明“多主题能力存在，但页面视觉并未真正被主题系统统领”。
- 全局背景、卡片、页面头部都叠加了 radial gradient、noise、阴影与半透明混色，装饰密度偏高，容易让界面显得“努力做设计”而不是“有秩序”。
- `DashboardView.vue` 存在明显的视觉语言混用：emoji 图标、彩色发光卡、数据概览卡、列表卡、自定义条形图并存，且很多模块都想成为视觉焦点，缺少唯一主叙事。
- `LoginView.vue` 同样使用大量 emoji 图标、渐变文字、动态 blob、旋转圆环、噪点和高饱和按钮，品牌面与表单面之间缺少一个更克制的视觉关系。
- 现有 `design-system/course-management/MASTER.md` 采用偏“儿童教育/活泼紫橙”的方向，甚至推荐 `Baloo 2` 和 `Comic Neue`，与当前课程管理后台的实际场景不匹配，不能直接当成重构目标。
- 项目自己的 UI 设计技能与参考设计系统都明确把“emoji 作为图标”列为反模式，而当前核心页面广泛使用 `fluent-emoji:*`，这是导致观感廉价化的直接原因之一。
- `HomeView.vue` 的营销落地页与登录页、后台页都延续了同一套“夸张标题 + 装饰漂浮 + 彩色 emoji + 偏移布局”的表达方式，但课程管理系统并不需要如此强的娱乐化语气。
- `student/Report.vue` 又切回另一套近似常规管理后台的浅灰底、白卡片、ECharts 统计页样式，说明系统内部同时存在“演示 landing 风”、“营销化登录风”和“传统数据后台风”三种风格。
- `admin/Users.vue` 更依赖 Element Plus 默认表格和表单，没有继承首页/登录页那套强装饰，也没有建立更成熟的企业后台秩序感，导致整体观感落差大。
- `src/stores/theme.ts` 默认主题是 `xuanZhi`，但页面语气和信息架构并没有围绕“宣纸/东方/课程管理”方向形成更深的视觉表达，这意味着当前的主题更像配色切换，而不是完整体验。
- 角色页之间缺少“共享骨架 + 角色差异层”的方法：学生端偏活泼，管理端偏默认，教师端大概率会继续居中于两者之间，最终表现为系统人格不稳定。
- `AppLayout.vue` 的全局导航与头部仍在使用 `fluent-emoji` 图标，并且包含调色板、书本等较强拟物图形，这会把原本应该稳定的产品骨架也拉回“演示页语气”。
- 设计技能的首轮 `--design-system` 推荐偏通用 SaaS 玻璃拟态，说明它能提供“克制、专业、轻装饰”的大方向，但不应原样套用到此项目。
- 从技能库标签看，最匹配当前场景的不是 `Kids/Education`，而是 `Swiss Modernism 2.0`、`Minimal & Direct`、`Minimal Swiss`、`Chinese Simplified`、`Corporate Trust`、`Financial Trust` 这些偏理性、可读、网格化的组合。
- 技能库里 `Kids/Education = Baloo 2 + Comic Neue`，恰好和现有参考设计系统一致，这进一步证明当前参考系统更适合儿童教育产品，不适合课程管理后台。
- 适合当前项目的字体方向应该优先考虑中文可读性和数据界面的秩序感，例如 `Noto Sans SC` 一类简中友好字形，必要时再配一个更有识别度的英文/数字标题字体，但不应走夸张 display 风格。
- UX 标签库对本项目最相关的提醒是：减少连续装饰动画、补足焦点态、统一字号层级、加载态明确、深层页面加 breadcrumb 或等价层级提示。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 使用 `ui-ux-pro-max` 技能的工作流来建立设计方向 | 保证方案具有明确的视觉策略而非随意罗列 |
| 使用文件化 planning 记录发现与推理 | 避免长链路调研后建议漂移 |
| 最终方案以“理性后台骨架 + 适度课程气质”作为目标 | 比当前演示感、儿童化或营销化方向更贴合产品 |
| 不直接沿用 `design-system/course-management/MASTER.md` | 其紫橙+童趣字体组合与项目定位失配 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 本地 shell 以 `cmd` 方式执行，和技能文档中的 PowerShell 示例不一致 | 改用 `type` 和 `python` 的直接路径调用 |
| 设计技能的自然语言补充搜索多次未命中 | 改为先读取库内标签，再按可识别风格归纳 |

## Resources
- `D:\\Desktop\\vue-kecheng\\.codex\\skills\\ui-ux-pro-max\\SKILL.md`
- `C:\\Users\\23364\\.agents\\skills\\pi-planning-with-files\\SKILL.md`
- `d:\\Desktop\\vue-kecheng\\task_plan.md`
- `d:\\Desktop\\vue-kecheng\\src\\assets\\theme.css`
- `d:\\Desktop\\vue-kecheng\\src\\assets\\main.css`
- `d:\\Desktop\\vue-kecheng\\src\\views\\DashboardView.vue`
- `d:\\Desktop\\vue-kecheng\\src\\views\\LoginView.vue`
- `d:\\Desktop\\vue-kecheng\\design-system\\course-management\\MASTER.md`
- `d:\\Desktop\\vue-kecheng\\src\\views\\HomeView.vue`
- `d:\\Desktop\\vue-kecheng\\src\\views\\student\\Report.vue`
- `d:\\Desktop\\vue-kecheng\\src\\views\\admin\\Users.vue`
- `d:\\Desktop\\vue-kecheng\\src\\stores\\theme.ts`
- `d:\\Desktop\\vue-kecheng\\src\\layouts\\AppLayout.vue`
- `.codex\\skills\\ui-ux-pro-max\\data\\styles.csv`
- `.codex\\skills\\ui-ux-pro-max\\data\\typography.csv`
- `.codex\\skills\\ui-ux-pro-max\\data\\ux-guidelines.csv`

## Visual/Browser Findings
- 当前视觉问题的主因不是“缺少效果”，而是效果太多、锚点太多、语言不统一。
- 多主题基础存在，但页面级实现没有被主题 token 完整约束。
- 首页和登录页都偏向“演示感强、产品感弱”，更像概念展示而非稳定的课程管理工具。
- 学习报告和用户管理页又退回接近默认后台样式，系统没有形成统一的视觉母语。
- 主骨架、登录页、首页、学生页、管理页目前都在说不同的话，导致用户无法快速建立“这是同一个系统”的认知。
