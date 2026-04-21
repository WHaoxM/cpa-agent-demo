# 简历制作器 — 后端接入接口预留文档

本文档记录 `ResumeBuilder.vue` 中已预留 UI 占位、待后端接入后激活的功能接口。

---

## API-1：AI 一键生成简历内容

**场景**：用户点击各分区右上角的「AI 生成」按钮（当前 `disabled`），后端根据上下文生成对应内容。

```
POST /api/resume/ai-generate
Authorization: Bearer <token>

Body:
{
  "section": "project" | "skill" | "summary",
  "context": string,        // 用户已填写的相关内容（作为上下文）
  "targetRole": string      // 目标岗位方向
}

Response:
{
  "content": string         // 生成的文案
}
```

**前端占位位置**：`ResumeBuilder.vue` 中每个可生成分区的 `<label>` 内有 `rb-ai-btn` 按钮。

**接入方式**：将 `disabled` 移除，绑定 `@click` 调用此接口，将 `response.content` 写入对应 `form.xxx`。

---

## API-2：简历 PDF 导出

**场景**：用户点击顶部「下载 PDF」按钮（当前 `disabled` + tooltip "即将开放"）。

```
POST /api/resume/export-pdf
Authorization: Bearer <token>

Body:
{
  "resumeData": ResumeForm,   // 完整表单数据（见下方类型定义）
  "template": "classic",      // 模板标识（当前仅 classic）
  "avatarBase64"?: string     // 可选，头像 base64
}

Response: Blob (Content-Type: application/pdf)
```

**前端接入方式**：
```typescript
const res = await fetch('/api/resume/export-pdf', { method: 'POST', body: JSON.stringify(payload) })
const blob = await res.blob()
const url = URL.createObjectURL(blob)
const a = document.createElement('a'); a.href = url; a.download = '简历.pdf'; a.click()
```

---

## API-3：云端保存简历

**场景**：当前仅有 localStorage 单份草稿（`resumeStore.draftText`），后端接入后支持多份管理。

```
POST /api/resume/save
Authorization: Bearer <token>
Body: { "resumeData": ResumeForm, "name"?: string }
Response: { "id": string, "createdAt": string }

GET /api/resume/list
Authorization: Bearer <token>
Response: ResumeRecord[]
  // ResumeRecord: { id, name, updatedAt, previewSnippet }

DELETE /api/resume/:id
Authorization: Bearer <token>
Response: { "ok": true }
```

---

## API-4：头像图片上传存储

**场景**：当前头像以 base64 存在 component ref（session 级别，刷新消失）。

```
POST /api/upload/avatar
Authorization: Bearer <token>
Body: FormData (key: "file", value: File)
Response: { "url": string }   // CDN / OSS 返回的图片 URL
```

**前端接入方式**：将 `avatarBase64` ref 替换为 `avatarUrl` ref，上传后存 URL，预览用 `<img :src="avatarUrl">`。

---

## 表单数据类型参考

```typescript
interface ResumeForm {
  name:       string
  phone:      string
  email:      string
  school:     string
  major:      string
  grade:      string
  targetRole: string
  gpa:        string
  summary:    string
  skills:     string[]
  projects:   { name: string; role: string; desc: string }[]
  honors:     { type: 'cert' | 'intern' | 'award'; label: string }[]
}
```

---

## 前端预留位置速查

| 功能 | 文件 | 查找关键词 |
|---|---|---|
| AI 生成按钮 | `ResumeBuilder.vue` | `rb-ai-btn` |
| 下载 PDF 按钮 | `ResumeBuilder.vue` | `rb-btn-ghost` |
| 头像上传 | `ResumeBuilder.vue` | `avatarBase64` |
| draftText 回传 | `stores/resume.ts` | `setDraftText` |

---

## API-5：简历文本解析（ResumeBuilder 表单生成）

**场景**：用户在 `ResumeBuilder.vue` 填写表单后生成纯文本简历，后端结构化解析为 L0 数据。

> ✅ **已实现**：`POST /api/pipeline/ext/parse/text`

**前端调用链路**

```
ResumeBuilder.vue
  ├── 用户填写表单
  ├── computed resumeText（纯文本格式）
  ├── 点击「下一步」/「解析」
  └── POST /api/pipeline/ext/parse/text
          ├── Body: { text: resumeText, student_id?, source: "resume_builder" }
          └── Response: { student_id, name, education[], skills[], raw_text }
```

**请求体**

```json
{
  "text": "张三\nXX大学 | 计算机科学 | 本科\n电话：13800138000 | 邮箱：zhangsan@example.com\n\n【专业技能】\nVue.js · React · TypeScript\n\n【项目经历】\n电商小程序 | 担任：前端负责人\n...",
  "student_id": "可选",
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
    "skills": ["Vue.js", "React", "TypeScript"],
    "raw_text": "...",
    "text_length": 256
  },
  "next_steps": [
    "调用 /api/pipeline/ext/nsle/resume 进行实体抽取",
    "调用 /api/pipeline/ext/portrait/student 生成画像"
  ]
}
```

**前端接入方式**

```typescript
// ResumeBuilder.vue
import { post } from '@/api/http'

async function parseResumeText() {
  const text = resumeText.value  // computed 属性
  const res = await post('/pipeline/ext/parse/text', {
    text,
    source: 'resume_builder'
  })
  if (res.success) {
    resumeStore.setResult(res.data)  // 存入 Pinia store
    // 继续下一步：L1 抽取、画像生成
  }
}
```

**与 PDF 上传解析的区别**

| 方式 | 接口 | 前置步骤 | 适用场景 |
|------|------|---------|---------|
| 表单生成文本 | `POST /pipeline/ext/parse/text` | 用户填写表单 | 无 PDF 简历的用户 |
| PDF 上传 | `POST /pipeline/ext/parse/upload/resume` | 选择文件 → MinerU OCR | 已有 PDF 简历的用户 |

**数据表**：`student_profile` (student_id, name, profile_json, source_type='text')
