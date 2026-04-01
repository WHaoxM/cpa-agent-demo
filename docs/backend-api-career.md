# 后端接口文档 — 职业发展模块

> **适用页面**
> - 职业分析 · 岗位舆图（路由：`/app/student/career-analysis`）
> - 职业发展中心 / 职业能力复合图谱（路由：`/app/student/career-ability?role=...`）
> - 职业发展中心 / 课程体系（路由：`/app/student/course-system?role=...`）
>
> **版本**：v1  
> **对应前端数据源**：`CareerAnalysis.vue`（内联 mock）、`useAbilityGraph.ts`、`useCourseSystem.ts`、`useGraphGeneration.ts`

---

## 目录

- [后端接口文档 — 职业发展模块](#后端接口文档--职业发展模块)
  - [目录](#目录)
  - [通用约定](#通用约定)
    - [基础 URL](#基础-url)
    - [请求规范](#请求规范)
    - [认证（Token 鉴权）](#认证token-鉴权)
    - [公共响应格式（重要）](#公共响应格式重要)
      - [成功 · data 是对象](#成功--data-是对象)
      - [成功 · data 是数组](#成功--data-是数组)
      - [成功 · 无数据时（data 是空数组）](#成功--无数据时data-是空数组)
      - [失败 · 参数错误](#失败--参数错误)
      - [失败 · 未登录](#失败--未登录)
      - [失败 · 服务器内部错误](#失败--服务器内部错误)
    - [错误码一览](#错误码一览)
    - [返回字段约定](#返回字段约定)
    - [快速测试接口（curl）](#快速测试接口curl)
  - [一、职业分析 · 岗位舆图](#一职业分析--岗位舆图)
    - [1.1 行业领域与岗位列表](#11-行业领域与岗位列表)
    - [1.2 各省份需求指数与薪资](#12-各省份需求指数与薪资)
    - [1.3 省份薪资 / 需求历史趋势](#13-省份薪资--需求历史趋势)
    - [1.4 岗位薪资区间对比](#14-岗位薪资区间对比)
    - [1.5 全国概览 KPI](#15-全国概览-kpi)
    - [1.6 AI 市场洞察](#16-ai-市场洞察)
  - [二、职业发展中心 / 职业能力复合图谱](#二职业发展中心--职业能力复合图谱)
    - [2.1 能力图谱节点与边](#21-能力图谱节点与边)
    - [2.2 岗位介绍](#22-岗位介绍)
    - [2.3 图谱生成日志流（SSE）](#23-图谱生成日志流sse)
  - [三、职业发展中心 / 课程体系](#三职业发展中心--课程体系)
    - [3.1 课程体系完整数据](#31-课程体系完整数据)
      - [CourseNode — 技能节点](#coursenode--技能节点)
      - [CourseEdge — 技能关系边](#courseedge--技能关系边)
      - [GraphCourseNode — 课程节点](#graphcoursenode--课程节点)
      - [SkillCourseEdge — 技能与课程关联边](#skillcourseedge--技能与课程关联边)
  - [附录：类型枚举汇总](#附录类型枚举汇总)
    - [A. AbilityGroup（能力图谱节点分组）](#a-abilitygroup能力图谱节点分组)
    - [B. EdgeRelationType（能力图谱边类型）](#b-edgerelationtype能力图谱边类型)
    - [C. SkillTier（技能层级）](#c-skilltier技能层级)
    - [D. CourseGroup（课程类别）](#d-coursegroup课程类别)
    - [E. 课程难度 / 重要程度](#e-课程难度--重要程度)

---

## 通用约定

> 本节面向后端开发者。所有接口都遵守以下规范，请先读完这一节再看具体接口。

---

### 基础 URL

所有接口路径均以下面的前缀开头，拼接后面各节给出的路径：

```
https://<host>/api/v1
```

**完整示例**：`https://api.example.com/api/v1/career/domains`

开发环境和生产环境的 `host` 不同，建议通过环境变量控制，代码里不要写死。

---

### 请求规范

**本文档所有业务接口均为 `GET` 请求**（2.3 节的流式日志接口除外）。参数全部放在 URL 后面的查询字符串（Query String）里，**不需要 Request Body**。

```
GET /api/v1/career/province-stats?role=前端工程师&year=2026
```

> **关于中文参数**：前端发请求时会自动把中文进行 URL 编码（如 `前端工程师` → `%E5%89%8D%E7%AB%AF%E5%B7%A5%E7%A8%8B%E5%B8%88`）。主流后端框架（Spring MVC、Go Gin、Express、FastAPI）会在收到请求后自动解码，直接拿到中文字符串，**无需手动处理编解码**。

---

### 认证（Token 鉴权）

**每个接口请求都必须在 Header 里带上登录 Token，否则返回 401。**

前端登录成功后会拿到一个 JWT Token，每次请求都会在 Header 里附上：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiU1RVREVOVCIsImV4cCI6MTc0MzAwMDAwMH0.xxxxx
```

**后端需要做的事情**（以中间件/拦截器方式统一处理）：

1. 从请求 Header 中读取 `Authorization` 字段
2. 检查格式是否为 `Bearer <token>`，截取 `Bearer ` 后面的字符串得到 Token
3. 用服务端密钥验证 Token 签名是否合法、是否已过期
4. 从 Token 的 Payload 中解析出 `userId`（用户 ID）和 `role`（角色：`STUDENT` / `TEACHER` / `ADMIN`）
5. 将用户信息存入请求上下文，供业务代码使用

**Token 异常时的返回**：

| 异常情况 | 返回 code | message |
|---------|----------|---------|
| 请求头里没有 `Authorization` 字段 | `401` | `"未登录，请先登录"` |
| Token 格式错误（不是 `Bearer xxx`） | `401` | `"Token 格式错误"` |
| Token 签名非法（被篡改） | `401` | `"Token 非法"` |
| Token 已过期 | `401` | `"登录已过期，请重新登录"` |
| 用户角色无权访问该接口 | `403` | `"无权访问"` |

> 本文档中的接口要求登录角色为 **STUDENT 或 TEACHER**，ADMIN 也可访问。  
> 获取 Token 的登录接口（`POST /api/v1/auth/login`）由认证模块单独维护，不在本文档范围内。

---

### 公共响应格式（重要）

**所有接口——无论成功还是失败——HTTP 状态码始终返回 `200`。** 前端通过响应体 JSON 里的 `code` 字段判断是否成功，不依赖 HTTP 状态码。

响应体格式固定为以下三字段 JSON 对象：

```json
{
  "code": 0,
  "message": "ok",
  "data": ...
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | `number` | ✅ | `0` = 成功；非 0 = 失败，具体含义见错误码表 |
| `message` | `string` | ✅ | 成功时固定为 `"ok"`；失败时写**中文描述**，这段文字可能直接展示给用户 |
| `data` | `any` | ✅ | 成功时为业务数据（对象或数组）；失败时固定为 `null` |

#### 成功 · data 是对象

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "avgSalary": 16.8,
    "demandTotal": 1258000,
    "growthRate": "+8.5%",
    "dataDate": "2026-03"
  }
}
```

#### 成功 · data 是数组

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    { "name": "北京市", "value": 98, "salary": 22.4 },
    { "name": "上海市", "value": 95, "salary": 21.8 }
  ]
}
```

#### 成功 · 无数据时（data 是空数组）

查询有结果但没有匹配项时，**不要返回 `null`，返回空数组 `[]`**：

```json
{
  "code": 0,
  "message": "ok",
  "data": []
}
```

#### 失败 · 参数错误

```json
{
  "code": 400,
  "message": "参数 role 不能为空",
  "data": null
}
```

#### 失败 · 未登录

```json
{
  "code": 401,
  "message": "未登录，请先登录",
  "data": null
}
```

#### 失败 · 服务器内部错误

```json
{
  "code": 500,
  "message": "服务器内部错误，请联系管理员",
  "data": null
}
```

---

### 错误码一览

| code | 含义 | 典型触发场景 |
|------|------|------------|
| `0` | 成功 | 请求正常处理，返回业务数据 |
| `400` | 请求参数有误 | 必填参数为空、类型不对、值超出范围 |
| `401` | 未登录 / Token 失效 | 未携带 Token、Token 过期或被篡改 |
| `403` | 无权限 | 学生访问了管理员接口 |
| `404` | 资源不存在 | 请求的岗位/省份不在数据库中 |
| `500` | 服务器内部错误 | 代码抛出异常、数据库连接失败等 |

---

### 返回字段约定

为防止前端出现空指针、类型错误等问题，后端返回数据时请遵守：

| 规则 | 说明 |
|------|------|
| 字符串字段不返回 `null` | 无值时返回空字符串 `""` |
| 数组字段不返回 `null` | 无元素时返回空数组 `[]` |
| 布尔字段不省略 | 缺省值为 `false`，显式返回 |
| 薪资单位 | 统一为 **K/月**（即千元每月），如 `18.5` 代表 18500 元/月 |
| 热度 / 指数 | 整数，范围 **0–100** |
| 小数位 | 薪资保留 **1 位小数**；百分比保留 **1 位小数**；其余整数 |

---

### 快速测试接口（curl）

以下命令可直接在终端测试，把 `<host>` 和 `<token>` 替换为实际值：

```bash
curl -X GET "https://<host>/api/v1/career/domains" \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

---

## 一、职业分析 · 岗位舆图

> **前端页面**：`CareerAnalysis.vue`  
> **路由**：`/app/student/career-analysis`  
> **角色**：STUDENT / TEACHER

本页主要展示：气泡图（行业领域 + 岗位分布）、羊皮卷地图（省份需求热力）、薪资对比柱状图、全国 KPI、省份趋势图、AI 市场洞察。

---

### 1.1 行业领域与岗位列表

用于渲染中央气泡图，每个「领域」对应一组「岗位」子气泡。

**请求**

```

GET /api/v1/career/domains
```

**请求示例（curl）**

```bash
curl -X GET "https://<host>/api/v1/career/domains" \
  -H "Authorization: Bearer <token>"
```

**请求参数**：无

**响应 `data`**：`Domain[]`

```typescript
interface Domain {
  id: string           // 领域唯一标识，如 "internet"、"ai"
  name: string         // 领域显示名，如 "互联网/软件"
  color: string        // 16 进制颜色，如 "#8B2500"（前端用于气泡配色）
  jobs: string[]       // 该领域包含的岗位名称列表
  demandIndex?: number // 领域整体需求指数 0–100（可选，供后续扩展）
  avgSalary?: number   // 平均薪资中位数 K/月（可选）
  trendYoy?: number    // 同比增速 %（可选，正数表示增长）
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "internet",
      "name": "互联网/软件",
      "color": "#8B2500",
      "jobs": [
        "前端工程师", "后端工程师", "全栈工程师",
        "移动端开发", "测试工程师", "DevOps工程师", "架构师", "产品经理"
      ],
      "demandIndex": 92,
      "avgSalary": 18.5,
      "trendYoy": 8.2
    },
    {
      "id": "ai",
      "name": "AI / 大数据",
      "color": "#1B4E8B",
      "jobs": [
        "机器学习工程师", "数据分析师", "算法工程师",
        "NLP工程师", "数据工程师", "大模型工程师", "计算机视觉"
      ],
      "demandIndex": 88,
      "avgSalary": 22.0,
      "trendYoy": 14.5
    },
    {
      "id": "cloud",
      "name": "云计算/运维",
      "color": "#1A5C5C",
      "jobs": ["云架构师", "网络工程师", "安全工程师", "数据库管理员", "容器化工程师", "运维工程师"]
    },
    {
      "id": "enterprise",
      "name": "企业服务",
      "color": "#3A6B3A",
      "jobs": ["Java后端", "ERP实施", "解决方案架构师", "SaaS开发", "信息安全顾问", "BI开发"]
    },
    {
      "id": "fintech",
      "name": "金融科技",
      "color": "#8B6914",
      "jobs": ["量化工程师", "风控研发", "支付系统开发", "区块链开发", "金融数据分析"]
    },
    {
      "id": "game",
      "name": "游戏/内容",
      "color": "#6B3A6E",
      "jobs": ["游戏客户端", "游戏服务端", "音视频开发", "虚拟现实", "游戏策划"]
    },
    {
      "id": "hardware",
      "name": "硬件/制造",
      "color": "#7A4A2A",
      "jobs": ["嵌入式工程师", "芯片设计", "工业软件", "机器人工程师"]
    }
  ]
}
```

---

### 1.2 各省份需求指数与薪资

用于渲染地图热力图、省份 TOP10 排行榜，以及全国 KPI 汇总。前端支持按「数据年份」（2020–2026）切换。

**请求**

```
GET /api/v1/career/province-stats
```

**请求示例（curl）**

```bash
# 查询 2026 年「前端工程师」的全国省份数据
curl -G "https://<host>/api/v1/career/province-stats" \
  --data-urlencode "role=前端工程师" \
  --data-urlencode "year=2026" \
  -H "Authorization: Bearer <token>"
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | `string` | ✅ | 岗位/职业名称，如 `前端工程师` |
| `year` | `number` | ✅ | 数据年份，范围 2020–2026 |

**响应 `data`**：`ProvinceItem[]`（含全部 34 省份/直辖市）

```typescript
interface ProvinceItem {
  name: string   // 省份全名，如 "北京市"、"广东省"
  value: number  // 岗位需求指数，范围 0–100（整数）
  salary: number // 薪资中位数，单位 K/月，保留 1 位小数
}
```

> **备注**：前端会根据 `value` 将省份分为四个需求等级用于地图分层高亮：≤20（低）、21–40（中）、41–60（高）、>60（极高）。

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    { "name": "北京市",         "value": 98, "salary": 22.4 },
    { "name": "上海市",         "value": 95, "salary": 21.8 },
    { "name": "广东省",         "value": 91, "salary": 20.1 },
    { "name": "浙江省",         "value": 82, "salary": 18.6 },
    { "name": "江苏省",         "value": 78, "salary": 17.2 },
    { "name": "四川省",         "value": 58, "salary": 14.3 },
    { "name": "湖北省",         "value": 52, "salary": 13.8 },
    { "name": "陕西省",         "value": 44, "salary": 12.5 },
    { "name": "黑龙江省",       "value": 22, "salary": 9.6  },
    { "name": "西藏自治区",     "value": 6,  "salary": 7.2  }
  ]
}
```

---

### 1.3 省份薪资 / 需求历史趋势

用于渲染右侧面板「薪资与需求趋势」折线 + 箱线图。支持单省份查看，或通过 Shift+点击触发两省份对比（此时前端会发起两次请求）。

**请求**

```
GET /api/v1/career/province-trend
```

**请求示例（curl）**

```bash
# 查询四川省 · 前端工程师最近两年的趋势数据
curl -G "https://<host>/api/v1/career/province-trend" \
  --data-urlencode "province=四川省" \
  --data-urlencode "role=前端工程师" \
  -H "Authorization: Bearer <token>"
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `province` | `string` | ✅ | 省份全名，如 `四川省` |
| `role` | `string` | ✅ | 岗位名称 |
| `year` | `number` | 可选 | 指定年份，默认返回最近两年（8 个季度）数据 |

**响应 `data`**

```typescript
interface ProvinceTrend {
  // 季度标签，长度固定 8，格式如 ["Q1","Q2","Q3","Q4","Q1","Q2","Q3","Q4"]
  quarters: string[]
  // 箱线图数据：每项为 [min, Q1, median, Q3, max]，单位 K/月，保留 1 位小数
  boxData: number[][]
  // 各季度薪资中位数，与 quarters 等长，单位 K/月，保留 1 位小数
  salaryData: number[]
  // 各季度岗位需求量（绝对数，整数），与 quarters 等长
  demandData: number[]
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "quarters": ["Q1","Q2","Q3","Q4","Q1","Q2","Q3","Q4"],
    "boxData": [
      [8.1,  9.5,  12.3, 15.8, 20.1],
      [8.5,  9.8,  12.8, 16.2, 20.9],
      [9.0,  10.2, 13.4, 17.0, 21.5],
      [9.3,  10.6, 13.9, 17.5, 22.0],
      [9.7,  11.0, 14.5, 18.1, 22.8],
      [10.0, 11.4, 15.0, 18.6, 23.4],
      [10.4, 11.8, 15.5, 19.2, 24.1],
      [10.8, 12.2, 16.0, 19.8, 24.8]
    ],
    "salaryData": [12.3, 12.8, 13.4, 13.9, 14.5, 15.0, 15.5, 16.0],
    "demandData": [120, 145, 138, 162, 155, 180, 172, 198]
  }
}
```

---

### 1.4 岗位薪资区间对比

用于渲染右下角「薪资区间对比」堆积水平柱状图。按当前选中领域（`domainId`）返回该领域所有岗位的初 / 中 / 高级薪资区间。

**请求**

```
GET /api/v1/career/job-salary
```

**请求示例（curl）**

```bash
# 按领域查询（返回该领域所有岗位的薪资区间）
curl -G "https://<host>/api/v1/career/job-salary" \
  --data-urlencode "domainId=internet" \
  -H "Authorization: Bearer <token>"

# 按单个岗位查询
curl -G "https://<host>/api/v1/career/job-salary" \
  --data-urlencode "role=前端工程师" \
  -H "Authorization: Bearer <token>"
```

**查询参数**（`domainId` 与 `role` 二选一）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `domainId` | `string` | 二选一 | 领域 ID，返回该领域下全部岗位数据 |
| `role` | `string` | 二选一 | 单个岗位名称，返回单条数据 |

**响应 `data`**：`JobSalaryItem[]`

```typescript
interface JobSalaryItem {
  name: string   // 岗位名称
  junior: number // 初级薪资上限，单位 K/月（整数）
  mid: number    // 中级薪资上限，单位 K/月（整数）
  senior: number // 高级薪资上限，单位 K/月（整数）
}
```

> **前端渲染规则**：初级段宽度 = `junior`；中级段宽度 = `mid - junior`；高级段宽度 = `senior - mid`。

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    { "name": "前端工程师",  "junior": 10, "mid": 20, "senior": 35 },
    { "name": "后端工程师",  "junior": 11, "mid": 22, "senior": 38 },
    { "name": "全栈工程师",  "junior": 12, "mid": 24, "senior": 40 },
    { "name": "移动端开发",  "junior": 10, "mid": 20, "senior": 34 },
    { "name": "测试工程师",  "junior": 8,  "mid": 16, "senior": 28 },
    { "name": "DevOps工程师","junior": 9,  "mid": 18, "senior": 30 },
    { "name": "架构师",      "junior": 18, "mid": 32, "senior": 55 },
    { "name": "产品经理",    "junior": 9,  "mid": 18, "senior": 32 }
  ]
}
```

---

### 1.5 全国概览 KPI

用于渲染左侧面板「平均中位薪资」和「岗位需求总量」两张 KPI 卡片，以及年份切换时显示的同比增速。

**请求**

```
GET /api/v1/career/national-kpi
```

**请求示例（curl）**

```bash
curl -G "https://<host>/api/v1/career/national-kpi" \
  --data-urlencode "role=前端工程师" \
  --data-urlencode "year=2026" \
  -H "Authorization: Bearer <token>"
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | `string` | ✅ | 岗位名称 |
| `year` | `number` | ✅ | 数据年份，范围 2020–2026 |

**响应 `data`**

```typescript
interface NationalKpi {
  avgSalary: number   // 全国薪资中位数均值，单位 K/月，保留 1 位小数
  demandTotal: number // 全国岗位需求总量（整数）
  growthRate: string  // 同比增速，如 "+8.5%"；若为最早年份（无同比数据）则返回 "-"
  dataDate: string    // 数据截止日期，格式 "YYYY-MM"，如 "2026-03"
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "avgSalary": 16.8,
    "demandTotal": 1258000,
    "growthRate": "+8.5%",
    "dataDate": "2026-03"
  }
}
```

---

### 1.6 AI 市场洞察

用于渲染右侧面板「AI 市场洞察」卡片，可翻页浏览 4 条分析评论。在选中省份或搜索岗位变化时重新请求。

**请求**

```
GET /api/v1/career/ai-insights
```

**请求示例（curl）**

```bash
curl -G "https://<host>/api/v1/career/ai-insights" \
  --data-urlencode "province=四川省" \
  --data-urlencode "role=前端工程师" \
  -H "Authorization: Bearer <token>"
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `province` | `string` | ✅ | 省份全名，如 `四川省` |
| `role` | `string` | ✅ | 岗位名称 |

**响应 `data`**：`AiInsightItem[]`（固定 4 条，顺序固定）

```typescript
interface AiInsightItem {
  title: string   // 评论标题，依次为："整体趋势"、"供需分析"、"薪资建议"、"发展前景"
  content: string // 评论正文（中文段落，100–200 字）
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "title": "整体趋势",
      "content": "四川省的前端工程师岗位需求在近两年呈稳步上升趋势，薪资中位数高于全国平均水平。该地区互联网产业集群效应明显，头部企业集中，带动了整体薪资水平的提升。"
    },
    {
      "title": "供需分析",
      "content": "当前四川省前端工程师人才供给缺口约15%，尤其是3-5年经验的中高级岗位竞争激烈。建议关注新兴产业园区的招聘动态，这些区域通常提供更有竞争力的薪酬包。"
    },
    {
      "title": "薪资建议",
      "content": "基于当前市场数据，前端工程师在四川省的合理薪资预期为：初级 8-12K，中级 15-22K，高级 25-40K。核心技术栈熟练度和项目经验是薪资谈判的关键因素。"
    },
    {
      "title": "发展前景",
      "content": "四川省已将数字经济列为重点发展方向，预计未来2-3年前端工程师相关岗位将持续增长。建议提前布局云原生、AI辅助开发等新兴技能方向，以获得更大的职业发展空间。"
    }
  ]
}
```

---

## 二、职业发展中心 / 职业能力复合图谱

> **前端页面**：`CareerAbilityShell.vue`（含 `CareerAbilityGraph.vue`、`CareerAbilityDual.vue`、`CareerAbilityWorkspace.vue` 三个子视图）  
> **路由**：`/app/student/career-ability?role=<岗位名>`  
> **角色**：STUDENT / TEACHER

本页通过 `role` 查询参数确定目标岗位，展示该岗位的能力关系图（同心圆轨道动画）。三种布局模式（图谱 / 双栏 / 工作台）共享同一份图谱数据；「双栏」和「工作台」子视图额外展示岗位介绍和图谱生成日志流。

---

### 2.1 能力图谱节点与边

核心数据，用于渲染 ECharts `graph` 图（同心圆轨道布局）。Shell 统一加载，三个子视图共享。

**请求**

```
GET /api/v1/career/ability-graph
```

**请求示例（curl）**

```bash
curl -G "https://<host>/api/v1/career/ability-graph" \
  --data-urlencode "role=前端开发" \
  -H "Authorization: Bearer <token>"
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | `string` | ✅ | 岗位名称，如 `前端开发` |

**响应 `data`**

```typescript
interface AbilityGraphData {
  nodes: AbilityNode[]
  edges: AbilityEdge[]
}

interface AbilityNode {
  id: string          // 节点唯一 ID，如 "job-center"、"board-pro"、"pro-vue"
  name: string        // 显示名称
  level: number       // 层级：0=岗位中心节点，1=能力板块，2+=子技能节点
  group: AbilityGroup // 节点分组，决定颜色和类别
  parentId?: string   // 父节点 ID（level >= 1 时必填）
  heat?: number       // 热度权重 0–100，影响节点大小
}

type AbilityGroup = 'job' | 'professional' | 'position' | 'cognitive' | 'general'

interface AbilityEdge {
  source: string             // 源节点 ID
  target: string             // 目标节点 ID
  relation: EdgeRelationType // 关系类型
  label?: string             // 关系描述文案（可选，鼠标悬停时展示）
}

type EdgeRelationType = 'belong' | 'prerequisite' | 'synergy' | 'dependency'
```

**节点分组（group）说明**

| group | 含义 | 前端配色 |
|-------|------|---------|
| `job` | 岗位中心节点（每个图谱唯一） | 朱砂 `#8B2500` |
| `professional` | 专业技能板块 | 靛蓝 `#2B6CB0` |
| `position` | 岗位技能板块 | 赭金 `#B7791F` |
| `cognitive` | 认知技能板块 | 竹绿 `#2F855A` |
| `general` | 通用技能板块 | 藤紫 `#805AD5` |

**边关系（relation）说明**

| relation | 中文 | 前端渲染样式 |
|----------|------|-------------|
| `belong` | 归属 | 实线，低透明度 |
| `prerequisite` | 前置依赖 | 长虚线 `[6,3]` |
| `synergy` | 协同互补 | 短虚线 `[3,3]` |
| `dependency` | 强依赖 | 稀疏虚线 `[10,4]` |

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "nodes": [
      { "id": "job-center", "name": "前端开发", "level": 0, "group": "job",          "heat": 100 },
      { "id": "board-pro",  "name": "专业技能", "level": 1, "group": "professional", "parentId": "job-center", "heat": 85 },
      { "id": "board-pos",  "name": "岗位技能", "level": 1, "group": "position",     "parentId": "job-center", "heat": 85 },
      { "id": "board-cog",  "name": "认知技能", "level": 1, "group": "cognitive",    "parentId": "job-center", "heat": 85 },
      { "id": "board-gen",  "name": "通用技能", "level": 1, "group": "general",      "parentId": "job-center", "heat": 85 },
      { "id": "pro-vue",    "name": "Vue 3",       "level": 2, "group": "professional", "parentId": "board-pro", "heat": 92 },
      { "id": "pro-react",  "name": "React",       "level": 2, "group": "professional", "parentId": "board-pro", "heat": 80 },
      { "id": "pro-ts",     "name": "TypeScript",  "level": 2, "group": "professional", "parentId": "board-pro", "heat": 88 },
      { "id": "pro-css",    "name": "CSS / 动效",  "level": 2, "group": "professional", "parentId": "board-pro", "heat": 76 },
      { "id": "pos-arch",   "name": "前端架构",    "level": 2, "group": "position",     "parentId": "board-pos", "heat": 82 },
      { "id": "pos-perf",   "name": "性能优化",    "level": 2, "group": "position",     "parentId": "board-pos", "heat": 78 },
      { "id": "cog-algo",   "name": "算法与数据结构","level": 2,"group": "cognitive",    "parentId": "board-cog", "heat": 72 },
      { "id": "gen-git",    "name": "Git / 协作",  "level": 2, "group": "general",      "parentId": "board-gen", "heat": 72 }
    ],
    "edges": [
      { "source": "job-center", "target": "board-pro", "relation": "belong" },
      { "source": "job-center", "target": "board-pos", "relation": "belong" },
      { "source": "job-center", "target": "board-cog", "relation": "belong" },
      { "source": "job-center", "target": "board-gen", "relation": "belong" },
      { "source": "board-pro",  "target": "pro-vue",   "relation": "belong" },
      { "source": "board-pro",  "target": "pro-ts",    "relation": "belong" },
      { "source": "pro-ts",     "target": "pro-vue",   "relation": "prerequisite", "label": "TS 是 Vue3 的前置" },
      { "source": "pro-ts",     "target": "pro-react", "relation": "prerequisite", "label": "TS 是 React 的前置" },
      { "source": "pro-vue",    "target": "pos-arch",  "relation": "synergy",      "label": "Vue 与前端架构协同" },
      { "source": "pos-perf",   "target": "pos-arch",  "relation": "dependency",   "label": "性能优化依赖工程化" }
    ]
  }
}
```

---

### 2.2 岗位介绍

用于「双栏」和「工作台」子视图中的「简历分析」卡片，展示岗位概况、职责、要求、技能标签、需求热区、发展前景。

**请求**

```
GET /api/v1/career/role-intro
```

**请求示例（curl）**

```bash
curl -G "https://<host>/api/v1/career/role-intro" \
  --data-urlencode "role=前端开发" \
  -H "Authorization: Bearer <token>"
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | `string` | ✅ | 岗位名称，如 `前端开发` |

**响应 `data`**

```typescript
interface RoleIntro {
  title: string           // 完整岗位名，如 "前端开发工程师"
  summary: string         // 岗位一句话简介
  responsibilities: string[] // 岗位职责列表，建议 4–6 条
  requirements: string[]  // 任职要求列表，建议 4–6 条
  skills: string[]        // 技能标签列表，如 ["Vue 3", "TypeScript", "Git"]
  topRegions: RegionItem[] // 需求最旺盛的城市/地区，建议 4–6 个
  outlook: string         // 职业发展前景描述（中文段落，100 字左右）
}

interface RegionItem {
  name: string   // 城市/省份名，如 "北京"
  demand: string // 需求程度描述，如 "极高"、"高"、"中等"
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "title": "前端开发工程师",
    "summary": "负责 Web 应用用户界面的设计与实现，关注性能、可访问性与用户体验。",
    "responsibilities": [
      "根据产品需求完成页面开发与交互实现",
      "参与前端架构设计与技术选型",
      "优化页面性能与首屏加载速度",
      "与后端/设计团队协作联调接口",
      "维护组件库与工程化基础设施"
    ],
    "requirements": [
      "本科及以上学历，计算机相关专业优先",
      "熟悉 Vue / React 至少一种主流框架",
      "掌握 TypeScript、ES6+ 语法",
      "了解前端工程化（Webpack / Vite / CI/CD）",
      "有数据可视化或跨端开发经验者加分"
    ],
    "skills": ["Vue 3", "React", "TypeScript", "CSS", "Node.js", "Webpack", "Vite", "ECharts", "Git"],
    "topRegions": [
      { "name": "北京", "demand": "极高" },
      { "name": "上海", "demand": "极高" },
      { "name": "深圳", "demand": "高" },
      { "name": "杭州", "demand": "高" },
      { "name": "成都", "demand": "中等" }
    ],
    "outlook": "前端技术迭代快，全栈化与跨端趋势明显；掌握框架原理、性能优化和工程化能力的开发者持续紧缺，3-5 年可晋升高级/架构方向。"
  }
}
```

---

### 2.3 图谱生成日志流（SSE）

用于「双栏」和「工作台」子视图的「图谱介绍」卡片，模拟 AI Agent 多步骤构建图谱的过程日志，同时驱动图谱节点/边在前端图层中的逐步显现动画。

**传输协议**：Server-Sent Events（SSE）

**请求**

```
GET /api/v1/career/graph-generation-stream
```

**请求头**

```http
Accept: text/event-stream
Cache-Control: no-cache
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | `string` | ✅ | 岗位名称 |
| `sessionId` | `string` | 可选 | 客户端生成的唯一会话 ID，用于断线续传 |

**SSE Event 格式**

每条事件的 `data` 均为 JSON 字符串，共 **5 种 `type`**，所有业务数据均包裹在 `payload` 字段中：

```typescript
// 阶段推进事件（event: "phase"）
// 前端收到后创建新的 StepPage，后续 log 归入该页
interface PhaseEvent {
  type: 'phase'
  payload: {
    name: string     // 阶段名称，依次为 "简历解析"、"技能识别"、"子技能展开"、"关系推理"、"渲染完成"
    progress: number // 阶段起始进度，整数 0–100
  }
}

// 节点增量添加事件（event: "node:add"）
// 前端收到后将节点加入可见集合，形成节点逐步出现动画
interface NodeAddEvent {
  type: 'node:add'
  payload: {
    nodeIds: string[] // 本次新增可见的节点 ID 列表
  }
}

// 边增量添加事件（event: "edge:add"）
// 前端收到后将边加入可见集合
interface EdgeAddEvent {
  type: 'edge:add'
  payload: {
    edgeIds: string[] // 边 ID，格式为 "sourceId→targetId"，如 "job-center→board-pro"
  }
}

// 日志条目事件（event: "log"）
interface LogEvent {
  type: 'log'
  payload: {
    level: 'info' | 'success' | 'warn'
    agent: string    // 执行主体，如 "JobParsingAgent"、"SkillExpandAgent"
    message: string  // 日志描述（中文）
    ts: string       // 时间戳，格式 "HH:mm:ss.mmm"，如 "10:24:31.042"
  }
}

// 完成事件（event: "done"）
interface DoneEvent {
  type: 'done'
  payload: {
    summary: string  // 完成描述，如 "图谱构建完成：21 节点 / 13 边"
  }
}
```

**生成流程说明**

后端应按以下 5 个阶段顺序推送事件，总耗时建议 8–12 秒：

| # | 阶段名 | 主要 Agent | 动作 |
|---|--------|-----------|------|
| 1 | 简历解析 | `JobParsingAgent`、`ResumeParsingAgent` | 推送中心节点（level 0）的 `node:add` |
| 2 | 技能识别 | `MatchingAgent` | 推送板块节点（level 1）及 belong 边 |
| 3 | 子技能展开 | `SkillExpandAgent` | 逐板块推送子技能节点（level 2）及所属 belong 边 |
| 4 | 关系推理 | `RelationAgent` | 推送跨板块关系边（prerequisite/synergy/dependency） |
| 5 | 渲染完成 | `System` | 推送 `done` 事件结束流 |

**SSE 流示例**

```
event: phase
data: {"type":"phase","payload":{"name":"简历解析","progress":10}}

event: log
data: {"type":"log","payload":{"level":"info","agent":"JobParsingAgent","message":"职位解析完成","ts":"10:24:31.042"}}

event: log
data: {"type":"log","payload":{"level":"info","agent":"ResumeParsingAgent","message":"简历解析中…","ts":"10:24:31.642"}}

event: log
data: {"type":"log","payload":{"level":"success","agent":"ResumeParsingAgent","message":"关键信息提取成功 ✅","ts":"10:24:32.142"}}

event: node:add
data: {"type":"node:add","payload":{"nodeIds":["job-center"]}}

event: phase
data: {"type":"phase","payload":{"name":"技能识别","progress":30}}

event: log
data: {"type":"log","payload":{"level":"info","agent":"MatchingAgent","message":"开始匹配分析…","ts":"10:24:32.542"}}

event: log
data: {"type":"log","payload":{"level":"success","agent":"MatchingAgent","message":"识别 4 大技能板块 ✅","ts":"10:24:33.342"}}

event: node:add
data: {"type":"node:add","payload":{"nodeIds":["board-pro","board-pos","board-cog","board-gen"]}}

event: edge:add
data: {"type":"edge:add","payload":{"edgeIds":["job-center→board-pro","job-center→board-pos","job-center→board-cog","job-center→board-gen"]}}

event: phase
data: {"type":"phase","payload":{"name":"子技能展开","progress":50}}

event: log
data: {"type":"log","payload":{"level":"success","agent":"SkillExpandAgent","message":"专业技能：展开 6 个子技能 ✅","ts":"10:24:34.042"}}

event: node:add
data: {"type":"node:add","payload":{"nodeIds":["pro-vue","pro-react","pro-ts","pro-css","pro-echarts","pro-node"]}}

event: log
data: {"type":"log","payload":{"level":"success","agent":"SkillExpandAgent","message":"通用技能：展开 5 个子技能 ✅","ts":"10:24:36.642"}}

event: phase
data: {"type":"phase","payload":{"name":"关系推理","progress":80}}

event: log
data: {"type":"log","payload":{"level":"info","agent":"RelationAgent","message":"推理跨板块关系线…","ts":"10:24:37.242"}}

event: log
data: {"type":"log","payload":{"level":"success","agent":"RelationAgent","message":"发现 13 条跨板块关系 ✅","ts":"10:24:38.142"}}

event: edge:add
data: {"type":"edge:add","payload":{"edgeIds":["pro-ts→pro-vue","pro-ts→pro-react","pro-vue→pos-arch","pos-build→gen-ci"]}}

event: phase
data: {"type":"phase","payload":{"name":"渲染完成","progress":100}}

event: log
data: {"type":"log","payload":{"level":"success","agent":"System","message":"图谱构建完成：21 节点 / 13 边","ts":"10:24:38.742"}}

event: done
data: {"type":"done","payload":{"summary":"图谱构建完成：21 节点 / 13 边"}}
```

> **前端分页规则**：每收到一条 `phase` 事件，前端创建新的 `StepPage`（用 `payload.name` 作标题，`payload.progress` 作进度阈值），后续 `log` 条目自动归入当前页。`done` 事件触发 `isDone = true`，停止流接收。

**后端实现指引（SSE）**

SSE（Server-Sent Events）是一种服务端主动向客户端推送数据的技术，客户端用普通 HTTP GET 请求连接，服务端持续写入数据直到结束。

**第一步：设置响应头**

后端接口必须返回以下响应头，否则浏览器不会识别为 SSE：

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

> `X-Accel-Buffering: no` 是为了防止 Nginx 等反向代理对响应做缓存，必须加。

**第二步：按格式写入事件**

每条事件的格式固定为：

```
event: <事件名>\n
data: <JSON字符串>\n
\n
```

注意：每条事件结尾必须有**两个换行**（`\n\n`）来表示该事件结束，下一条事件才会被客户端接收到。

**第三步：按顺序推送，最后关闭连接**

推送完 `done` 事件后，**主动关闭响应流**。

---

**各语言参考示例**

**Java（Spring MVC，返回 `SseEmitter`）**

```java
@GetMapping("/career/graph-generation-stream")
public SseEmitter stream(@RequestParam String role) {
    SseEmitter emitter = new SseEmitter(120_000L); // 超时 120s

    executorService.execute(() -> {
        try {
            // 推送 phase 事件
            emitter.send(SseEmitter.event()
                .name("phase")
                .data("{\"type\":\"phase\",\"payload\":{\"name\":\"简历解析\",\"progress\":10}}"));

            // 推送 log 事件
            emitter.send(SseEmitter.event()
                .name("log")
                .data("{\"type\":\"log\",\"payload\":{\"level\":\"info\",\"agent\":\"JobParsingAgent\",\"message\":\"职位解析完成\",\"ts\":\"10:24:31.042\"}}"));

            // ... 按顺序推送其余事件 ...

            // 推送 done 事件
            emitter.send(SseEmitter.event()
                .name("done")
                .data("{\"type\":\"done\",\"payload\":{\"summary\":\"图谱构建完成：21 节点 / 13 边\"}}"));

            emitter.complete(); // 关闭连接
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
    });

    return emitter;
}
```

**Go（Gin 框架）**

```go
r.GET("/api/v1/career/graph-generation-stream", func(c *gin.Context) {
    role := c.Query("role")
    _ = role // 根据 role 生成对应数据

    c.Header("Content-Type", "text/event-stream")
    c.Header("Cache-Control", "no-cache")
    c.Header("Connection", "keep-alive")
    c.Header("X-Accel-Buffering", "no")

    c.Stream(func(w io.Writer) bool {
        // 推送 phase 事件
        fmt.Fprintf(w, "event: phase\ndata: {\"type\":\"phase\",\"payload\":{\"name\":\"简历解析\",\"progress\":10}}\n\n")
        // ... 推送其余事件 ...
        fmt.Fprintf(w, "event: done\ndata: {\"type\":\"done\",\"payload\":{\"summary\":\"图谱构建完成：21 节点 / 13 边\"}}\n\n")
        return false // 返回 false 表示结束流
    })
})
```

**Node.js（Express）**

```javascript
app.get('/api/v1/career/graph-generation-stream', (req, res) => {
  const role = req.query.role;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 工具函数：发送一条事件
  const send = (eventName, payload) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send('phase', { type: 'phase', payload: { name: '简历解析', progress: 10 } });
  send('log',   { type: 'log',   payload: { level: 'info', agent: 'JobParsingAgent', message: '职位解析完成', ts: '10:24:31.042' } });
  // ... 推送其余事件 ...
  send('done',  { type: 'done',  payload: { summary: '图谱构建完成：21 节点 / 13 边' } });

  res.end(); // 关闭连接
});
```

---

## 三、职业发展中心 / 课程体系

> **前端页面**：`CourseSystemGraph.vue`  
> **路由**：`/app/student/course-system?role=<岗位名>`  
> **角色**：STUDENT / TEACHER

本页通过 ECharts GL 渲染 3D 分层技能图谱，技能节点按层级（专业技能 → 初阶 → 中阶 → 高阶 → 岗位）分布在五层立体平台上。点击节点后，右侧面板展示该技能的「成长路径」和「推荐课程」。

---

### 3.1 课程体系完整数据

单接口返回本页全部所需数据：技能节点、技能边、课程节点、技能-课程关联边。

**请求**

```
GET /api/v1/career/course-system
```

**请求示例（curl）**

```bash
curl -G "https://<host>/api/v1/career/course-system" \
  --data-urlencode "role=前端开发工程师" \
  -H "Authorization: Bearer <token>"
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | `string` | ✅ | 目标职业名称，如 `前端开发工程师` |

**响应 `data`**

```typescript
interface CourseSystemData {
  nodes: CourseNode[]
  edges: CourseEdge[]
  courseNodes: GraphCourseNode[]
  skillCourseEdges: SkillCourseEdge[]
}
```

---

#### CourseNode — 技能节点

渲染到 3D 图谱各层平台上的散点节点，按 `tier` 分层。

```typescript
interface CourseNode {
  id: string        // 节点唯一 ID，如 "fn-3"、"jr-1"、"sr-1"
  name: string      // 技能/知识点名称，如 "JavaScript 核心"
  tier: SkillTier   // 所属层级（见下表）
  heat: number      // 热度/重要性，整数 0–100
  category?: string // 可选分类标签，如 "CS核心"、"前端"、"后端"
}

type SkillTier = 'foundation' | 'junior' | 'mid' | 'senior' | 'job'
```

**技能层级（tier）说明**

| tier | 中文名 | 前端配色 | 说明 |
|------|--------|---------|------|
| `foundation` | 专业技能 | `#8C7B6B` | 底层基础知识（CS 原理、编程语言、数学） |
| `junior` | 初阶岗位技能 | `#B8860B` | 可执行独立开发任务的能力 |
| `mid` | 中阶岗位技能 | `#6B8E6B` | 模块级能力，多岗位通用 |
| `senior` | 高阶岗位技能 | `#4A6B8A` | 跨领域架构与决策能力 |
| `job` | 岗位 | `#8B2500` | 目标职业节点（唯一，置顶） |

---

#### CourseEdge — 技能关系边

描述技能节点间的依赖 / 支撑 / 组成关系。前端根据 `isCareerPath` 标记决定高亮哪条成长路径。

```typescript
interface CourseEdge {
  source: string                                    // 源节点 ID
  target: string                                    // 目标节点 ID
  relation: 'prerequisite' | 'support' | 'compose'  // 关系类型
  isCareerPath?: boolean                             // 是否属于当前职业主成长路径（默认 false）
}
```

**边关系（relation）说明**

| relation | 含义 |
|----------|------|
| `prerequisite` | 前置依赖：`source` 是 `target` 的前置技能 |
| `support` | 支撑关系：`source` 支撑 `target` 的能力提升 |
| `compose` | 组成关系：`source` 是 `target`（职业）能力的构成要素 |

> **成长路径逻辑**：前端从用户选中的技能节点出发，沿 `isCareerPath === true` 的边向上（target 方向）和向下（source 方向）递归遍历，得到完整成长路径链。后端应确保职业主链上的所有节点间边均标记 `isCareerPath: true`。

---

#### GraphCourseNode — 课程节点

选中技能节点后，在右侧面板「推荐课程」区展示与该技能关联的课程，按 `group` 分组渲染。

```typescript
interface GraphCourseNode {
  id: string                                          // 课程唯一 ID，如 "gc-6"
  title: string                                       // 课程名称
  group: CourseGroup                                  // 课程类别
  difficulty: 'beginner' | 'intermediate' | 'advanced' // 难度
  relatedSkillIds: string[]                           // 关联的技能节点 ID 列表
  importance: 'core' | 'recommended' | 'optional'     // 重要程度
}

type CourseGroup =
  | 'foundation-course'   // 基础课程
  | 'framework-course'    // 框架课程
  | 'engineering-course'  // 工程化课程
  | 'backend-course'      // 后端协同课程
  | 'architecture-course' // 架构进阶课程
```

**课程类别（CourseGroup）展示名**

| 枚举值 | 中文 |
|--------|------|
| `foundation-course` | 基础课程 |
| `framework-course` | 框架课程 |
| `engineering-course` | 工程化课程 |
| `backend-course` | 后端协同课程 |
| `architecture-course` | 架构进阶课程 |

---

#### SkillCourseEdge — 技能与课程关联边

用于查询「选中某技能节点后，右侧面板应展示哪些课程」。前端通过 `skillId` 过滤 `skillCourseEdges`，再从 `courseNodes` 中取出对应课程详情。

```typescript
interface SkillCourseEdge {
  skillId: string                               // 技能节点 ID
  courseId: string                              // 课程节点 ID
  relation: 'core' | 'recommended' | 'advanced' // 关联程度
}
```

---

**完整响应示例**（精简版，仅展示典型数据）

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "nodes": [
      { "id": "job-1", "name": "前端开发工程师",  "tier": "job",        "heat": 100 },
      { "id": "sr-1",  "name": "前端系统架构",    "tier": "senior",     "heat": 95, "category": "前端架构" },
      { "id": "sr-4",  "name": "性能优化体系",    "tier": "senior",     "heat": 90, "category": "工程" },
      { "id": "sr-9",  "name": "微前端架构",      "tier": "senior",     "heat": 84, "category": "前端架构" },
      { "id": "md-1",  "name": "前端工程化",      "tier": "mid",        "heat": 82, "category": "前端" },
      { "id": "md-2",  "name": "组件库设计开发",  "tier": "mid",        "heat": 81, "category": "前端" },
      { "id": "jr-1",  "name": "Vue / React 开发","tier": "junior",     "heat": 80, "category": "前端" },
      { "id": "jr-2",  "name": "TypeScript 应用", "tier": "junior",     "heat": 79, "category": "前端" },
      { "id": "fn-3",  "name": "JavaScript 核心", "tier": "foundation", "heat": 85, "category": "编程语言" },
      { "id": "fn-7",  "name": "数据结构",        "tier": "foundation", "heat": 88, "category": "CS核心" }
    ],
    "edges": [
      { "source": "sr-1", "target": "job-1", "relation": "compose",      "isCareerPath": true },
      { "source": "sr-4", "target": "job-1", "relation": "compose",      "isCareerPath": true },
      { "source": "md-1", "target": "sr-1",  "relation": "support",      "isCareerPath": true },
      { "source": "md-2", "target": "sr-1",  "relation": "support",      "isCareerPath": true },
      { "source": "md-1", "target": "sr-4",  "relation": "support",      "isCareerPath": true },
      { "source": "jr-1", "target": "md-1",  "relation": "prerequisite", "isCareerPath": true },
      { "source": "jr-2", "target": "md-1",  "relation": "prerequisite", "isCareerPath": true },
      { "source": "fn-3", "target": "jr-1",  "relation": "prerequisite", "isCareerPath": true },
      { "source": "fn-11", "target": "jr-8", "relation": "prerequisite", "isCareerPath": false }
    ],
    "courseNodes": [
      {
        "id": "gc-6",
        "title": "Vue 3 实战开发",
        "group": "framework-course",
        "difficulty": "intermediate",
        "relatedSkillIds": ["jr-1", "jr-2", "jr-3"],
        "importance": "core"
      },
      {
        "id": "gc-8",
        "title": "TypeScript 高级编程",
        "group": "framework-course",
        "difficulty": "advanced",
        "relatedSkillIds": ["jr-2", "fn-4"],
        "importance": "core"
      },
      {
        "id": "gc-10",
        "title": "前端工程化实践",
        "group": "engineering-course",
        "difficulty": "intermediate",
        "relatedSkillIds": ["md-1", "jr-5", "jr-10"],
        "importance": "core"
      },
      {
        "id": "gc-12",
        "title": "性能优化实战",
        "group": "engineering-course",
        "difficulty": "advanced",
        "relatedSkillIds": ["sr-4", "md-1", "jr-20"],
        "importance": "core"
      },
      {
        "id": "gc-17",
        "title": "前端架构设计",
        "group": "architecture-course",
        "difficulty": "advanced",
        "relatedSkillIds": ["sr-1", "sr-9", "md-2", "md-4"],
        "importance": "core"
      }
    ],
    "skillCourseEdges": [
      { "skillId": "jr-1", "courseId": "gc-6",  "relation": "core" },
      { "skillId": "jr-2", "courseId": "gc-6",  "relation": "core" },
      { "skillId": "jr-2", "courseId": "gc-8",  "relation": "core" },
      { "skillId": "md-1", "courseId": "gc-10", "relation": "core" },
      { "skillId": "sr-4", "courseId": "gc-12", "relation": "core" },
      { "skillId": "sr-1", "courseId": "gc-17", "relation": "core" }
    ]
  }
}
```

> **右侧详情面板逻辑**：
> 1. 用户点击 3D 图谱上的技能节点，前端取 `selectedSkillId`。
> 2. 过滤 `skillCourseEdges`，找出 `skillId === selectedSkillId` 的所有条目，提取 `courseId` 集合。
> 3. 从 `courseNodes` 中筛选出对应课程，按 `group` 分组展示「推荐课程」列表。
> 4. 沿 `isCareerPath === true` 的边递归追溯，生成「成长路径」步骤列表。

---

## 附录：类型枚举汇总

### A. AbilityGroup（能力图谱节点分组）

| 枚举值 | 中文 |
|--------|------|
| `job` | 岗位 |
| `professional` | 专业技能 |
| `position` | 岗位技能 |
| `cognitive` | 认知技能 |
| `general` | 通用技能 |

### B. EdgeRelationType（能力图谱边类型）

| 枚举值 | 中文 |
|--------|------|
| `belong` | 归属 |
| `prerequisite` | 前置 |
| `synergy` | 协同 |
| `dependency` | 依赖 |

### C. SkillTier（技能层级）

| 枚举值 | 中文 | 3D Y 轴高度（参考） |
|--------|------|-------------------|
| `foundation` | 专业技能（底层） | 0 |
| `junior` | 初阶岗位技能 | 24 |
| `mid` | 中阶岗位技能 | 48 |
| `senior` | 高阶岗位技能 | 72 |
| `job` | 岗位（顶层） | 92 |

### D. CourseGroup（课程类别）

| 枚举值 | 中文 |
|--------|------|
| `foundation-course` | 基础课程 |
| `framework-course` | 框架课程 |
| `engineering-course` | 工程化课程 |
| `backend-course` | 后端协同课程 |
| `architecture-course` | 架构进阶课程 |

### E. 课程难度 / 重要程度

**difficulty（难度）**

| 枚举值 | 中文 |
|--------|------|
| `beginner` | 入门 |
| `intermediate` | 进阶 |
| `advanced` | 高阶 |

**importance（重要程度）**

| 枚举值 | 中文 |
|--------|------|
| `core` | 核心 |
| `recommended` | 推荐 |
| `optional` | 选修 |
