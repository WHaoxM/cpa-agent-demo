# ui-ux-pro-max

Web 和移动应用程序的综合设计指南。包含 67 种样式、96 个调色板、57 种字体配对、99 条 UX 指南和 25 种图表类型，涵盖 13 个技术栈。具有基于优先级推荐的可搜索数据库。

## 前置条件

检查是否已安装 Python：

```bash
python3 --version || python --version
```

如果未安装 Python，请根据用户的操作系统进行安装：

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install python3
```

**Windows:**
```powershell
winget install Python.Python.3.12
```

---

## 如何使用此技能

当用户请求 UI/UX 工作时（设计、构建、创建、实现、审查、修复、改进），请遵循以下工作流程：

### 步骤 1：分析用户需求

从用户请求中提取关键信息：
- **产品类型**：SaaS、电子商务、作品集、仪表板、落地页等
- **样式关键词**：极简、活泼、专业、优雅、深色模式等
- **行业**：医疗保健、金融科技、游戏、教育等
- **技术栈**：React、Vue、Next.js，或默认使用 `html-tailwind`

### 步骤 2：生成设计系统（必需）

**始终以 `--design-system` 开始** 以获得带有推理的全面推荐：

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<产品类型> <行业> <关键词>" --design-system [-p "项目名称"]
```

此命令：
1. 并行搜索 5 个域（产品、样式、颜色、落地页、字体）
2. 应用 `ui-reasoning.csv` 中的推理规则选择最佳匹配
3. 返回完整的设计系统：模式、样式、颜色、字体、效果
4. 包含要避免的反模式

**示例：**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "美容院 健康服务" --design-system -p "宁静水疗"
```

### 步骤 2b：持久化设计系统（主控 + 覆盖模式）

要保存设计系统以实现跨会话的分层检索，请添加 `--persist`：

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<查询>" --design-system --persist -p "项目名称"
```

这将创建：
- `design-system/MASTER.md` — 包含所有设计规则的全局真实源
- `design-system/pages/` — 页面特定覆盖的文件夹

**使用页面特定覆盖：**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<查询>" --design-system --persist -p "项目名称" --page "仪表板"
```

这还会创建：
- `design-system/pages/dashboard.md` — 页面特定的偏离主控文件的规则

**分层检索如何工作：**
1. 构建特定页面时（例如："结账"），首先检查 `design-system/pages/checkout.md`
2. 如果页面文件存在，其规则**覆盖**主控文件
3. 如果不存在，则仅使用 `design-system/MASTER.md`

### 步骤 3：补充详细搜索（根据需要）

获得设计系统后，使用域搜索获取更多详细信息：

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --domain <域> [-n <最大结果数>]
```

**何时使用详细搜索：**

| 需求 | 域 | 示例 |
|------|--------|---------|
| 更多样式选项 | `style` | `--domain style "玻璃拟态 深色"` |
| 图表推荐 | `chart` | `--domain chart "实时仪表板"` |
| UX 最佳实践 | `ux` | `--domain ux "动画 可访问性"` |
| 替代字体 | `typography` | `--domain typography "优雅 奢华"` |
| 落地页结构 | `landing` | `--domain landing "英雄 社会证明"` |

### 步骤 4：技术栈指南（默认：html-tailwind）

获取特定实现的最佳实践。如果用户未指定技术栈，**默认使用 `html-tailwind`**。

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --stack html-tailwind
```

可用技术栈：`html-tailwind`、`react`、`nextjs`、`vue`、`svelte`、`swiftui`、`react-native`、`flutter`、`shadcn`、`jetpack-compose`

---

## 搜索参考

### 可用域

| 域 | 用于 | 示例关键词 |
|--------|---------|------------------|
| `product` | 产品类型推荐 | SaaS、电子商务、作品集、医疗保健、美容、服务 |
| `style` | UI 样式、颜色、效果 | 玻璃拟态、极简主义、深色模式、野兽派 |
| `typography` | 字体配对、Google Fonts | 优雅、活泼、专业、现代 |
| `color` | 按产品类型的调色板 | saas、电子商务、医疗保健、美容、金融科技、服务 |
| `landing` | 页面结构、CTA 策略 | 英雄、以英雄为中心、推荐信、定价、社会证明 |
| `chart` | 图表类型、库推荐 | 趋势、比较、时间线、漏斗、饼图 |
| `ux` | 最佳实践、反模式 | 动画、可访问性、z-index、加载 |
| `react` | React/Next.js 性能 | 瀑布流、打包、Suspense、Memo、重新渲染、缓存 |
| `web` | Web 界面指南 | aria、焦点、键盘、语义、虚拟化 |
| `prompt` | AI 提示、CSS 关键词 | (样式名称) |

### 可用技术栈

| 技术栈 | 专注点 |
|-------|-------|
| `html-tailwind` | Tailwind 工具类、响应式、a11y（默认） |
| `react` | 状态、钩子、性能、模式 |
| `nextjs` | SSR、路由、图像、API 路由 |
| `vue` | 组合式 API、Pinia、Vue Router |
| `svelte` | Runes、存储、SvelteKit |
| `swiftui` | 视图、状态、导航、动画 |
| `react-native` | 组件、导航、列表 |
| `flutter` | 小部件、状态、布局、主题 |
| `shadcn` | shadcn/ui 组件、主题、表单、模式 |
| `jetpack-compose` | 可组合项、修饰符、状态提升、重组 |

---

## 示例工作流程

**用户请求：** "为专业皮肤护理服务制作落地页"

### 步骤 1：分析需求
- 产品类型：美容/水疗服务
- 样式关键词：优雅、专业、柔和
- 行业：美容/健康
- 技术栈：html-tailwind（默认）

### 步骤 2：生成设计系统（必需）

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "美容院 健康服务 优雅" --design-system -p "宁静水疗"
```

**输出：** 包含模式、样式、颜色、字体、效果和反模式的完整设计系统。

### 步骤 3：补充详细搜索（根据需要）

```bash
# 获取动画和可访问性的 UX 指南
python3 skills/ui-ux-pro-max/scripts/search.py "动画 可访问性" --domain ux

# 如需要，获取替代字体选项
python3 skills/ui-ux-pro-max/scripts/search.py "优雅 奢华 衬线" --domain typography
```

### 步骤 4：技术栈指南

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "布局 响应式 表单" --stack html-tailwind
```

**然后：** 综合设计系统 + 详细搜索并实现设计。

---

## 输出格式

`--design-system` 标志支持两种输出格式：

```bash
# ASCII 框（默认）- 最适合终端显示
python3 skills/ui-ux-pro-max/scripts/search.py "金融科技 加密货币" --design-system

# Markdown - 最适合文档
python3 skills/ui-ux-pro-max/scripts/search.py "金融科技 加密货币" --design-system -f markdown
```

---

## 获得更好结果的技巧

1. **关键词要具体** - "医疗保健 SaaS 仪表板" > "应用程序"
2. **多次搜索** - 不同的关键词揭示不同的见解
3. **组合域** - 样式 + 字体 + 颜色 = 完整设计系统
4. **始终检查 UX** - 搜索 "动画"、"z-index"、"可访问性" 以发现常见问题
5. **使用技术栈标志** - 获取特定实现的最佳实践
6. **迭代** - 如果第一次搜索不匹配，尝试不同的关键词

---

## 专业 UI 的通用规则

这些是经常被忽视的问题，会使 UI 看起来不专业：

### 图标和视觉元素

| 规则 | 要做 | 不要做 |
|------|----|----- |
| **不使用表情符号图标** | 使用 SVG 图标（Heroicons、Lucide、Simple Icons） | 使用 🎨 🚀 ⚙️ 等表情符号作为 UI 图标 |
| **稳定的悬停状态** | 在悬停时使用颜色/不透明度过渡 | 使用会导致布局偏移的缩放变换 |
| **正确的品牌徽标** | 从 Simple Icons 研究官方 SVG | 猜测或使用错误的徽标路径 |
| **一致的图标大小** | 使用固定 viewBox（24x24）配合 w-6 h-6 | 随机混合不同的图标大小 |

### 交互和光标

| 规则 | 要做 | 不要做 |
|------|----|----- |
| **光标指针** | 为所有可点击/可悬停的卡片添加 `cursor-pointer` | 在交互元素上保留默认光标 |
| **悬停反馈** | 提供视觉反馈（颜色、阴影、边框） | 没有指示元素是交互式的 |
| **平滑过渡** | 使用 `transition-colors duration-200` | 瞬间状态变化或太慢（>500ms） |

### 明暗模式对比度

| 规则 | 要做 | 不要做 |
|------|----|----- |
| **玻璃卡片明模式** | 使用 `bg-white/80` 或更高不透明度 | 使用 `bg-white/10`（太透明） |
| **明模式文本对比** | 使用 `#0F172A`（slate-900）作为文本 | 使用 `#94A3B8`（slate-400）作为正文文本 |
| **柔和文本明模式** | 最低使用 `#475569`（slate-600） | 使用 gray-400 或更浅 |
| **边框可见性** | 在明模式中使用 `border-gray-200` | 使用 `border-white/10`（不可见） |

### 布局和间距

| 规则 | 要做 | 不要做 |
|------|----|----- |
| **浮动导航栏** | 添加 `top-4 left-4 right-4` 间距 | 将导航栏固定到 `top-0 left-0 right-0` |
| **内容内边距** | 考虑固定导航栏高度 | 让内容隐藏在固定元素后面 |
| **一致的最大宽度** | 使用相同的 `max-w-6xl` 或 `max-w-7xl` | 混合不同的容器宽度 |

---

## 交付前检查清单

在交付 UI 代码之前，验证这些项目：

### 视觉质量
- [ ] 不使用表情符号作为图标（改用 SVG）
- [ ] 所有图标来自一致的图标集（Heroicons/Lucide）
- [ ] 品牌徽标正确（从 Simple Icons 验证）
- [ ] 悬停状态不会导致布局偏移
- [ ] 直接使用主题颜色（bg-primary）而不是 var() 包装器

### 交互
- [ ] 所有可点击元素都有 `cursor-pointer`
- [ ] 悬停状态提供清晰的视觉反馈
- [ ] 过渡平滑（150-300ms）
- [ ] 焦点状态对键盘导航可见

### 明暗模式
- [ ] 明模式文本具有足够对比度（最低 4.5:1）
- [ ] 玻璃/透明元素在明模式中可见
- [ ] 边框在两种模式下都可见
- [ ] 交付前测试两种模式

### 布局
- [ ] 浮动元素与边缘有适当间距
- [ ] 没有内容隐藏在固定导航栏后面
- [ ] 在 375px、768px、1024px、1440px 处响应式
- [ ] 移动端没有水平滚动

### 可访问性
- [ ] 所有图像都有 alt 文本
- [ ] 表单输入有标签
- [ ] 颜色不是唯一的指示器
- [ ] 尊重 `prefers-reduced-motion`
