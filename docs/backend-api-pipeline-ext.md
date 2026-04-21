# 管线扩展接口文档 — Pipeline Ext API

> **适用页面**
> - 简历解析与画像（路由：`/app/student/resume-parse`）
> - AI 助手（路由：`/app/student/ai-assistant`）
> - 技能自评（路由：`/app/student/exams`）
> - 学习路径与课程推荐
>
> **版本**：v1.1（2026-04-21 更新）  
> **基础 URL**：`/api/pipeline/ext`

---

## 目录

- [管线扩展接口文档 — Pipeline Ext API](#管线扩展接口文档--pipeline-ext-api)
  - [目录](#目录)
  - [通用约定](#通用约定)
  - [一、L0 解析层](#一l0-解析层)
    - [1.1 简历文本解析（ResumeBuilder 生成）](#11-简历文本解析resumebuilder-生成)
    - [1.2 PDF 简历上传解析](#12-pdf-简历上传解析)
  - [二、L1 抽取层](#二l1-抽取层)
    - [2.1 简历 NS-LE 实体抽取](#21-简历-ns-le-实体抽取)
    - [2.2 批量归一化](#22-批量归一化)
  - [三、L2 画像层](#三l2-画像层)
    - [3.1 学生四维画像生成](#31-学生四维画像生成)
  - [四、L3 匹配层](#四l3-匹配层)
    - [4.1 人岗匹配](#41-人岗匹配)
    - [4.2 技能差距分析](#42-技能差距分析)
  - [五、冷启动层](#五冷启动层)
    - [5.1 技能自评提交](#51-技能自评提交)
    - [5.2 自评结果查询](#52-自评结果查询)
  - [六、L4 报告层](#六l4-报告层)
    - [6.1 完整职业报告生成](#61-完整职业报告生成)
  - [附录：状态码与错误处理](#附录状态码与错误处理)

---

## 通用约定

**认证方式**：所有接口需在 Header 携带 JWT Token

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**响应格式**：统一返回 `{ success: boolean, data: any, error?: string, code?: number }`

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | `boolean` | 请求是否成功 |
| `data` | `any` | 成功时的业务数据 |
| `error` | `string` | 失败时的错误信息 |
| `code` | `number` | 错误码（内部使用） |

---

## 一、L0 解析层

### 1.1 简历文本解析（ResumeBuilder 生成）

**场景**：用户在 `ResumeBuilder.vue` 表单填写后生成纯文本简历，提交后端进行结构化解析。

**接口**：`POST /api/pipeline/ext/parse/text`

**请求体**

```json
{
  "text": "张三\nXX大学 | 计算机科学 | 本科 | GPA 3.5\n电话：13800138000 | 邮箱：zhangsan@example.com | 目标方向：前端开发\n\n【个人总结】\n热爱前端开发...\n\n【专业技能】\nVue.js · React · TypeScript · CSS\n\n【项目经历】\n电商小程序 | 担任：前端负责人\n...",
  "student_id": "可选，无则后端生成",
  "source": "resume_builder"
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "student_id": "rb_a1b2c3d4",
    "name": "张三",
    "contact": {
      "phone": "13800138000",
      "email": "zhangsan@example.com"
    },
    "education": [
      {
        "school": "XX大学",
        "major": "计算机科学",
        "degree": "本科",
        "period": ""
      }
    ],
    "skills": ["Vue.js", "React", "TypeScript", "CSS"],
    "raw_text": "...",
    "text_length": 256,
    "line_count": 12
  },
  "next_steps": [
    "调用 /api/pipeline/ext/nsle/resume 进行实体抽取",
    "调用 /api/pipeline/ext/portrait/student 生成画像"
  ]
}
```

**前端调用点**：`ResumeBuilder.vue` 提交表单后 → 生成文本 → 调用此接口

**错误处理**：文本过短（<50字）返回 400

---

### 1.2 PDF 简历上传解析

**场景**：用户上传 PDF 简历文件，后端通过 MinerU 解析提取文本。

**接口**：`POST /api/pipeline/ext/parse/upload/resume`

**请求**：`multipart/form-data`，字段 `file`

**响应**：`{ success, data: { student_id, raw_text, parsed_skills[], ... } }`

> 详细文档见后端注释（约 891-1043 行）。前端通过 `<input type="file" accept=".pdf">` 上传。

---

## 二、L1 抽取层

### 2.1 简历 NS-LE 实体抽取

**场景**：L0 解析完成后，对简历文本进行命名实体识别和关系抽取。

**接口**：`POST /api/pipeline/ext/nsle/resume`

**请求体**

```json
{
  "student_id": "rb_a1b2c3d4",
  "raw_text": "...",
  "extract_options": {
    "entities": ["skill", "company", "project", "education"],
    "relations": true,
    "normalize": true
  }
}
```

**响应**：抽取结果含 19 种实体 + 24 种关系，详见冻结 Schema `hr_entity_extraction_prompt.json`。

---

### 2.2 批量归一化

**场景**：将抽取的原始实体归一化到标准技能库。

**接口**：`POST /api/pipeline/ext/normalizer/batch`

**请求体**：`{ "entities": [{"raw": "Vue", "type": "skill"}] }`

**响应**：归一化结果 + OOV（未识别实体）列表

---

## 三、L2 画像层

### 3.1 学生四维画像生成

**场景**：基于 L1 抽取结果，生成学生就业能力四维画像（D1-D4）。

**接口**：`POST /api/pipeline/ext/portrait/student`

**请求体**

```json
{
  "student_id": "rb_a1b2c3d4",
  "source": "resume_parsed",
  "profile_data": { ... }
}
```

**响应**：含 `d1_score`, `d2_score`, `d3_score`, `d4_score` 及 `competitiveness_score`

**画像维度**：
- **D1 基础要求（25%）**：学历、专业、证书
- **D2 职业技能（35%）**：技术技能、项目经验
- **D3 职业素养（20%）**：沟通、团队协作
- **D4 发展潜力（20%）**：学习能力、学术表现

---

## 四、L3 匹配层

### 4.1 人岗匹配

**场景**：基于学生画像与岗位画像进行四维匹配打分。

**接口**：`POST /api/pipeline/ext/match`

**请求体**

```json
{
  "student_id": "rb_a1b2c3d4",
  "target_job_id": "job_xxx",
  "match_options": {
    "semantic_threshold": 0.7,
    "coverage_threshold": 0.8
  }
}
```

**响应**：含 `total_score`, `match_result`, `D1-D4` 各维度得分、技能覆盖率等。

**竞赛要求**：R-03 技能知识点匹配率 ≥ 80%

---

### 4.2 技能差距分析

**接口**：`POST /api/pipeline/ext/gap`

---

## 五、冷启动层

### 5.1 技能自评提交

**场景**：冷启动用户无简历时，通过技能自评生成简易画像和推荐。

**接口**：`POST /api/pipeline/ext/exams`

**请求体**

```json
{
  "student_id": "可选，无则后端生成 guest_id",
  "answers": [
    { "question_id": "q1", "skill": "Python", "level": 3 },
    { "question_id": "q2", "skill": "JavaScript", "level": 2 },
    { "question_id": "q3", "skill": "Vue.js", "level": 4 }
  ],
  "target_role": "前端开发"
}
```

**level 说明**：0-5 分制，3 分以下为弱技能

**响应示例**

```json
{
  "success": true,
  "data": {
    "assessment_id": "exam_a1b2c3d4",
    "student_id": "guest_e5f6g7h8",
    "portrait": {
      "student_id": "guest_e5f6g7h8",
      "assessment_id": "exam_a1b2c3d4",
      "mode": "self_assessment",
      "d1_score": 60,
      "d2_score": 54,
      "d3_score": 60,
      "d4_score": 65,
      "weak_skills": ["JavaScript"],
      "recommended_roles": ["前端开发", "Java开发"]
    },
    "weak_skills_count": 1,
    "next_steps": [
      "查看推荐岗位",
      "浏览学习路径",
      "上传简历获取深度分析"
    ]
  }
}
```

**数据持久化**：结果存入 `student_self_assessment` 表

**前端调用点**：`ExamsView.vue` 完成自评后提交

---

### 5.2 自评结果查询

**接口**：`GET /api/pipeline/ext/exams/:assessment_id`

**响应**：返回自评详情（assessed_skills, weak_skills, recommended_roles）

---

## 六、L4 报告层

### 6.1 完整职业报告生成

**场景**：整合画像、匹配、路径、建议，生成完整职业报告。

**接口**：`POST /api/pipeline/ext/report/full`

**请求体**

```json
{
  "student_id": "rb_a1b2c3d4",
  "target_job_id": "job_xxx",
  "report_options": {
    "include_path": true,
    "include_learning_plan": true,
    "format": "json"
  }
}
```

**响应**：含 ch1-ch6 六章内容（基本信息、行业趋势、匹配分析、路径规划、学习建议、评估总结）

---

## 附录：状态码与错误处理

| HTTP 状态码 | 含义 | 处理建议 |
|------------|------|---------|
| 200 | 成功 | 正常处理 |
| 400 | 参数错误 | 检查请求体必填字段 |
| 401 | 未认证 | 检查 Token 是否过期 |
| 404 | 资源不存在 | 检查 student_id / job_id |
| 500 | 服务器内部错误 | 后端日志排查 |

**通用错误响应**

```json
{
  "success": false,
  "error": "操作失败，请稍后重试",
  "code": 500
}
```

---

> **数据流**：L0 文本/PDF 解析 → L1 NS-LE 抽取 → 归一化 → L2 画像 → L3 匹配/差距 → L4 报告  
> **冷启动流**：自评(exams) → 简易画像 → 课程推荐(learning/recommend) → 上传简历深度分析
