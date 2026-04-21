# 收藏接口文档 — Favorites API

> **适用页面**
> - 职业分析 / 收藏目标方向
> - 岗位详情 / 收藏 JD
> - 个人中心 / 我的收藏
>
> **版本**：v1.0（2026-04-21）  
> **基础 URL**：`/api/favorites`
> **状态**：✅ 后端已实现，前端可直接调用

---

## 目录

- [收藏接口文档 — Favorites API](#收藏接口文档--favorites-api)
  - [目录](#目录)
  - [通用约定](#通用约定)
  - [一、目标职业方向收藏](#一目标职业方向收藏)
    - [1.1 添加目标职业](#11-添加目标职业)
    - [1.2 查询目标职业列表](#12-查询目标职业列表)
    - [1.3 删除目标职业](#13-删除目标职业)
  - [二、岗位收藏](#二岗位收藏)
    - [2.1 收藏岗位](#21-收藏岗位)
    - [2.2 查询收藏岗位列表](#22-查询收藏岗位列表)
    - [2.3 删除收藏岗位](#23-删除收藏岗位)
  - [附录：前端迁移指南](#附录前端迁移指南)

---

## 通用约定

**认证方式**：所有接口需在 Header 携带 JWT Token

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**响应格式**：统一返回 `{ success: boolean, data: any, error?: string, code?: number }`

---

## 一、目标职业方向收藏

### 1.1 添加目标职业

**接口**：`POST /api/favorites/target-roles`

**场景**：用户在职业分析页面点击「收藏方向」，将感兴趣的职业方向保存到后端。

> ⚠️ **前端现状**：当前使用 `localStorage` 临时存储，需迁移到此接口。

**请求体**

```json
{
  "user_id": "user_001",
  "role": "前端开发"
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | `string` | ✅ | 用户唯一标识 |
| `role` | `string` | ✅ | 职业方向名称，如 `前端开发` |

**响应示例**

```json
{
  "success": true,
  "data": {
    "message": "目标职业已添加"
  }
}
```

**数据表**：`target_role` (user_id, role, saved_at)

---

### 1.2 查询目标职业列表

**接口**：`GET /api/favorites/target-roles?user_id=:user_id`

**响应示例**

```json
{
  "success": true,
  "data": {
    "roles": [
      { "role": "前端开发", "saved_at": "2026-04-21T10:00:00" },
      { "role": "后端开发", "saved_at": "2026-04-21T10:05:00" }
    ],
    "total": 2
  }
}
```

---

### 1.3 删除目标职业

**接口**：`DELETE /api/favorites/target-roles/:role`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `role` | `string` | 职业方向名称（URL 编码） |

**Query 参数**：`user_id`

**响应示例**

```json
{
  "success": true,
  "data": {
    "message": "已取消收藏"
  }
}
```

---

## 二、岗位收藏

### 2.1 收藏岗位

**接口**：`POST /api/favorites/saved-jobs`

**场景**：用户在岗位详情页点击「收藏 JD」，保存感兴趣的岗位信息。

**请求体**

```json
{
  "user_id": "user_001",
  "job_title": "高级前端工程师",
  "company": "XX科技",
  "industry": "互联网",
  "salary": "25-40K",
  "location": "北京市",
  "match_score": 85,
  "required_skills": ["Vue 3", "React", "TypeScript", "Node.js"]
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | `string` | ✅ | 用户唯一标识 |
| `job_title` | `string` | ✅ | 岗位名称 |
| `company` | `string` | ✅ | 公司名称 |
| `industry` | `string` | 可选 | 行业 |
| `salary` | `string` | 可选 | 薪资范围 |
| `location` | `string` | 可选 | 工作地点 |
| `match_score` | `number` | 可选 | 匹配度分数 0-100 |
| `required_skills` | `string[]` | 可选 | 所需技能列表 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": "saved_a1b2c3d4",
    "message": "岗位已收藏"
  }
}
```

**数据表**：`saved_job` (id, user_id, job_title, company, industry, salary, location, match_score, required_skills, saved_at)

---

### 2.2 查询收藏岗位列表

**接口**：`GET /api/favorites/saved-jobs?user_id=:user_id`

**响应示例**

```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "saved_a1b2c3d4",
        "job_title": "高级前端工程师",
        "company": "XX科技",
        "industry": "互联网",
        "salary": "25-40K",
        "location": "北京市",
        "match_score": 85,
        "required_skills": ["Vue 3", "React", "TypeScript"],
        "saved_at": "2026-04-21T10:00:00"
      }
    ],
    "total": 1
  }
}
```

---

### 2.3 删除收藏岗位

**接口**：`DELETE /api/favorites/saved-jobs/:id`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 收藏记录 ID（即 `saved_xxx`） |

**响应示例**

```json
{
  "success": true,
  "data": {
    "message": "已取消收藏"
  }
}
```

---

## 附录：前端迁移指南

### 从 localStorage 迁移到后端收藏

**当前代码（localStorage）**

```typescript
// stores/learning.ts
const targetRoles = ref<TargetRole[]>([])
// 存储在 localStorage，页面刷新后可能丢失
```

**迁移后代码（后端持久化）**

```typescript
// stores/learning.ts
import { get, post, del } from '@/api/http'

// 加载收藏
targetRoles.value = await get(`/favorites/target-roles?user_id=${userId}`)
  .then(r => r.data.roles)

// 添加收藏
await post('/favorites/target-roles', {
  user_id: userId,
  role: selectedRole
})

// 删除收藏
await del(`/favorites/target-roles/${encodeURIComponent(role)}?user_id=${userId}`)
```

**注意事项**

1. `user_id` 应从登录状态获取，而非写死
2. 收藏操作失败时应有 Toast 提示
3. 网络异常时应保留本地状态，稍后同步
4. 建议添加防抖，避免快速点击导致重复收藏
