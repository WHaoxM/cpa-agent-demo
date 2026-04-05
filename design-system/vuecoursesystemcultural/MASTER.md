# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** VueCourseSystemCultural
**Style:** 故宫博物院 · Palace Museum Aesthetic
**Category:** Chinese Imperial Cultural Dashboard

---

## 色彩系统 · Color System

### 原始色板 Base Tokens

```
朱砂红  vermilion-900: #5C0E00   (最深)
        vermilion-700: #8B1A00
        vermilion-500: #BE2A00   ← 主色
        vermilion-300: #E87055
        vermilion-100: #F9DACE

御金    gold-700:      #8B6A00
        gold-500:      #C9A227   ← 点缀金
        gold-300:      #E8C96A
        gold-100:      #FBF3D5

靛青    indigo-700:    #0F3352
        indigo-500:    #1B4E79   ← 辅色
        indigo-300:    #4A7FA8
        indigo-100:    #C5D9EC

墨色    ink-900:       #1C1612   ← 正文
        ink-700:       #3D2E24
        ink-500:       #6B5040
        ink-300:       #9C8B78
        ink-100:       #C8B8A8

宣纸    parchment-100: #F5EFE0   ← 页面背景
        parchment-200: #EDE0CB   ← 卡片/纸层
        parchment-300: #E0CEB4   ← 悬浮/选中
        parchment-400: #C8B89A   ← 边框
        parchment-500: #B0A085   ← 强边框
```

### 语义 Token · Semantic Tokens

| 角色 | CSS Variable | 原始色 | Hex |
|------|-------------|--------|-----|
| 页面背景 | `--color-background` | parchment-100 | `#F5EFE0` |
| 卡片/面板 | `--color-surface` | parchment-200 | `#EDE0CB` |
| 悬浮面板 | `--color-surface-raised` | parchment-100 | `#F5EFE0` |
| 边框 | `--color-border` | parchment-400 | `#C8B89A` |
| 强边框 | `--color-border-strong` | parchment-500 | `#B0A085` |
| 主色（朱砂）| `--color-primary` | vermilion-500 | `#BE2A00` |
| 主色深 | `--color-primary-dark` | vermilion-700 | `#8B1A00` |
| 主色浅 | `--color-primary-light` | vermilion-100 | `#F9DACE` |
| 金色点缀 | `--color-gold` | gold-500 | `#C9A227` |
| 金色深 | `--color-gold-dark` | gold-700 | `#8B6A00` |
| 辅色（靛青）| `--color-secondary` | indigo-500 | `#1B4E79` |
| 正文墨色 | `--color-text` | ink-900 | `#1C1612` |
| 次要文字 | `--color-text-muted` | ink-500 | `#6B5040` |
| 占位/禁用 | `--color-text-subtle` | ink-300 | `#9C8B78` |

**配色原则：** 宣纸为底（70%），墨色为字（15%），朱砂点睛（10%），御金装饰（5%）。
**禁止：** 纯白 `#FFFFFF`、纯黑 `#000000`、冷蓝/紫色系、渐变背景。

---

## 字体系统 · Typography

| 用途 | 变量 | 字体栈 |
|------|------|--------|
| 标题/章节 | `--font-title` | Noto Serif SC, STSong, SimSun, serif |
| 正文/段落 | `--font-body` | Noto Serif SC, STSong, serif |
| 界面/标签 | `--font-ui` | Noto Sans SC, PingFang SC, sans-serif |
| 楷体/引用 | `--font-accent` | KaiTi, STKaiti, serif |
| 西文衬线 | `--font-latin` | Crimson Text, Georgia, serif |

**字号规则：** 页面基础 `font-size: 16px`（改小），正文 `1rem`，卡片标题 `1.125rem`，页面标题 `1.5rem`，大标题 `2rem`。
**行高：** 中文正文 `1.9`，标签/按钮 `1.4`。
**字重：** 标题 `600`，正文 `400`，强调 `500`。

---

## 间距 · Spacing

| Token | Value | 用途 |
|-------|-------|------|
| `--space-xs` | `4px` | 紧缩间隙 |
| `--space-sm` | `8px` | 图标间距、行内 |
| `--space-md` | `16px` | 标准内边距 |
| `--space-lg` | `24px` | 区块内边距 |
| `--space-xl` | `32px` | 区块间距 |
| `--space-2xl` | `48px` | 章节间距 |
| `--space-3xl` | `64px` | 大区块留白 |

---

## 圆角 · Radius

**核心原则：严控圆角，趋向方正，体现宫廷庄重感。**

| Token | Value | 用途 |
|-------|-------|------|
| `--radius-none` | `0px` | 分隔线、装饰线 |
| `--radius-sm` | `2px` | 按钮、输入框 |
| `--radius-md` | `4px` | 卡片 |
| `--radius-lg` | `6px` | 模态框、面板 |

---

## 阴影 · Shadows

| Token | Value | 用途 |
|-------|-------|------|
| `--shadow-sm` | `0 1px 3px rgba(28,22,18,0.08)` | 轻微浮起 |
| `--shadow-md` | `0 3px 10px rgba(28,22,18,0.10)` | 卡片 |
| `--shadow-lg` | `0 8px 20px rgba(28,22,18,0.12)` | 模态/下拉 |
| `--shadow-xl` | `0 20px 40px rgba(28,22,18,0.16)` | 焦点面板 |
| `--shadow-inset` | `inset 0 1px 3px rgba(28,22,18,0.06)` | 输入框内凹 |

---

## 组件规范 · Component Specs

### 按钮

```css
/* 主按钮：朱砂实色 */
.btn-primary {
  background: var(--color-primary);     /* #BE2A00 */
  color: #fff;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--color-primary-dark);
  transition: background 200ms, border-color 200ms;
  cursor: pointer;
}
.btn-primary:hover { background: var(--color-primary-dark); }

/* 描边按钮：朱砂边框 */
.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: background 200ms;
  cursor: pointer;
}
.btn-outline:hover { background: var(--color-primary-light); }

/* 金色次级按钮 */
.btn-gold {
  background: transparent;
  color: var(--color-gold-dark);
  border: 1px solid var(--color-gold);
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  cursor: pointer;
}
```

### 卡片

```css
.card {
  background: var(--color-surface);     /* #EDE0CB */
  border: 1px solid var(--color-border);/* #C8B89A */
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: border-color 200ms, box-shadow 200ms;
}
.card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

/* 强调卡片：朱砂顶边 */
.card-emphasis {
  border-top: 2px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 3%, var(--color-surface) 97%);
}

/* 数据卡片：纯宣纸 */
.card-data {
  background: var(--color-background);
  border: 1px solid var(--color-border);
}
```

### 输入框

```css
.input {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--color-text);
  font-family: var(--font-ui);
  transition: border-color 200ms, box-shadow 200ms;
}
.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent 80%);
}
```

### 模态框

```css
.modal-overlay {
  background: rgba(28, 22, 18, 0.55);
}
.modal {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-top: 2px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-xl);
}
```

### 侧边栏

```css
.sidebar {
  background: var(--color-primary-dark);  /* #8B1A00 深朱 */
  border-right: 1px solid var(--color-gold);
  color: #F9DACE;
}
.sidebar-item.active {
  background: color-mix(in srgb, #fff 12%, transparent 88%);
  border-left: 3px solid var(--color-gold);
  color: #fff;
}
```

---

## 风格准则 · Style Guidelines

**核心基调：** 故宫博物院 — 宣纸米白底、朱砂红主色、御金点缀、墨黑文字、庄重方正、克制有序。

**禁止使用（Anti-Patterns）：**
- ❌ 纯白 `#fff` 或冷白 `#f0f0f0` 背景 — 必须是宣纸暖白
- ❌ 圆角超过 `6px` — 破坏宫廷方正感
- ❌ 渐变背景、彩色渐变按钮
- ❌ 大量使用金色（金色≤5%，只用于线条/图标/点缀）
- ❌ 霓虹色、青紫色、粉红色系
- ❌ `border-radius: 50%` 圆形卡片
- ❌ 卡片 `transform: scale` 悬浮动画（改用 border-color + shadow）
- ❌ 字体使用非衬线细体作为标题
- ❌ Emoji 作为图标

**必须遵守：**
- ✅ 卡片悬浮 = `border-color` 变为朱砂 + `shadow-md`，禁止 translateY
- ✅ 页面顶部边框 = `2px solid var(--color-primary)`（朱砂）
- ✅ 章节分隔 = `1px solid var(--color-gold)` 金线
- ✅ 标题使用 `font-title`（Noto Serif SC），界面标签用 `font-ui`
- ✅ 所有可点击元素 `cursor: pointer`
- ✅ 状态过渡 `150–250ms ease`
- ✅ 响应式：1440px / 1024px / 768px / 640px

---

## 交付检查 · Pre-Delivery Checklist

- [ ] 背景色为宣纸暖白 `#F5EFE0`，非纯白
- [ ] 朱砂红 `#BE2A00` 作为主色，不超出40%面积
- [ ] 金色 `#C9A227` 只用于点缀，不超出5%面积
- [ ] 圆角全部 ≤ 6px
- [ ] 卡片悬浮无 `transform: translateY`
- [ ] 侧边栏背景为深朱 `#8B1A00`
- [ ] 文字对比度 ≥ 4.5:1
- [ ] 标题使用衬线字体
- [ ] 所有可点击元素有 `cursor: pointer`
- [ ] 响应式断点已验证
