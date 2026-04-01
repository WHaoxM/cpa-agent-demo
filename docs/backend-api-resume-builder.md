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
