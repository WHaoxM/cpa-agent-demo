# 管理后台接口文档 — Admin API

> **适用页面**
> - 管理后台 / 知识库管理
> - 管理后台 / OOV 审核
> - 管理后台 / 管线任务监控
> - 管理后台 / 图谱状态监控
>
> **版本**：v1.0（2026-04-21）  
> **基础 URL**：`/api/admin`

---

## 目录

- [管理后台接口文档 — Admin API](#管理后台接口文档--admin-api)
  - [目录](#目录)
  - [通用约定](#通用约定)
  - [一、管线任务管理](#一管线任务管理)
    - [1.1 触发 L1 构建](#11-触发-l1-构建)
    - [1.2 查询管线任务状态](#12-查询管线任务状态)
  - [二、OOV 实体审核](#二oov-实体审核)
    - [2.1 获取待审核 OOV 列表](#21-获取待审核-oov-列表)
    - [2.2 审核通过 OOV](#22-审核通过-oov)
    - [2.3 拒绝 OOV](#23-拒绝-oov)
  - [三、知识库管理](#三知识库管理)
    - [3.1 智能上传知识](#31-智能上传知识)
    - [3.2 批量更新知识](#32-批量更新知识)
  - [四、技能图谱状态](#四技能图谱状态)
    - [4.1 获取图谱整体状态](#41-获取图谱整体状态)
  - [附录：OOV 审核流程](#附录oov-审核流程)

---

## 通用约定

**认证方式**：所有接口需在 Header 携带管理员 JWT Token

```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

> ⚠️ 管理员接口要求用户角色为 `ADMIN`，学生/教师访问返回 `403`。

**响应格式**：统一返回 `{ success: boolean, data: any, error?: string, code?: number }`

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | `boolean` | 请求是否成功 |
| `data` | `any` | 成功时的业务数据 |
| `error` | `string` | 失败时的错误信息 |
| `code` | `number` | 错误码（`ErrorCode.INTERNAL_ERROR.value`） |

---

## 一、管线任务管理

### 1.1 触发 L1 构建

**场景**：管理员上传数据集或知识库后，触发 L1 抽取和入图流程。

**接口**：`POST /api/admin/pipeline/build`

**请求体**

```json
{
  "source": "dataset",
  "source_id": "ds_xxx",
  "pipeline_type": "full",
  "triggered_by": "admin_001"
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `source` | `string` | ✅ | 数据源类型：`dataset` / `knowledge_base` / `upload` |
| `source_id` | `string` | ✅ | 数据源唯一标识 |
| `pipeline_type` | `string` | 可选 | 构建类型：`full` / `skills_only` / `jobs_only`，默认 `full` |
| `triggered_by` | `string` | 可选 | 触发者 ID |

**响应示例**

```json
{
  "success": true,
  "data": {
    "task_id": "task_a1b2c3d4",
    "status": "pending",
    "message": "L1构建任务已创建",
    "next_steps": [
      "GET /api/admin/pipeline/status/task_a1b2c3d4 查询进度"
    ]
  }
}
```

**流程说明**

```
触发构建 → 创建 pipeline_task 记录（status=pending）
    ↓
（TODO：接入异步任务队列 Celery/Redis Queue）
    ↓
L1 抽取（实体识别） → 归一化 → 入图（Neo4j） + 入向量（Milvus）
    ↓
更新 pipeline_task status=completed + result_json
```

---

### 1.2 查询管线任务状态

**接口**：`GET /api/admin/pipeline/status/:task_id`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `task_id` | `string` | 管线任务 ID |

**响应示例**

```json
{
  "success": true,
  "data": {
    "task_id": "task_a1b2c3d4",
    "pipeline": "l1_build_full",
    "status": "completed",
    "params": {
      "source": "dataset",
      "source_id": "ds_xxx"
    },
    "result": {
      "entities_extracted": 1523,
      "normalized": 1480,
      "oov_count": 43,
      "neo4j_nodes_added": 1523,
      "milvus_vectors_added": 1480
    },
    "triggered_by": "admin_001",
    "created_at": "2026-04-21T10:00:00",
    "updated_at": "2026-04-21T10:05:30"
  }
}
```

**状态枚举**

| 状态 | 含义 |
|------|------|
| `pending` | 待处理 |
| `running` | 运行中 |
| `completed` | 已完成 |
| `failed` | 失败 |
| `cancelled` | 已取消 |

---

## 二、OOV 实体审核

> OOV（Out-Of-Vocabulary）：归一化系统未能识别的实体，需管理员人工审核后入库。

### 2.1 获取待审核 OOV 列表

**接口**：`GET /api/admin/oov/pending`

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `entity_type` | `string` | 可选 | 实体类型过滤：`skill` / `position` / `major` / `certificate` |
| `limit` | `number` | 可选 | 返回数量，默认 `50` |
| `offset` | `number` | 可选 | 偏移量，默认 `0` |

**响应示例**

```json
{
  "success": true,
  "data": {
    "oov_list": [
      {
        "oov_id": "oov_001",
        "raw_entity": "SpringBoot",
        "entity_type": "skill",
        "context": {
          "source_jd_id": "jd_123",
          "frequency": 5
        },
        "source": "jd_parser",
        "frequency": 5,
        "created_at": "2026-04-21T09:00:00"
      }
    ],
    "total": 43,
    "pending_count": 43
  }
}
```

**OOV 来源**

| source | 说明 |
|--------|------|
| `jd_parser` | JD 解析器发现的新实体 |
| `resume_parser` | 简历解析器发现的新实体 |
| `user_input` | 用户输入（搜索、表单） |
| `kb_upload` | 知识库上传 |

---

### 2.2 审核通过 OOV

**场景**：管理员确认 OOV 是有效实体，指定规范名称和分类，归入 canonical_entity 库。

**接口**：`POST /api/admin/oov/:oov_id/approve`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `oov_id` | `string` | 待审核 OOV ID |

**请求体**

```json
{
  "canonical_name": "Spring Boot",
  "category": "Java 框架",
  "aliases": ["SpringBoot", "spring-boot"],
  "reviewed_by": "admin_001"
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `canonical_name` | `string` | ✅ | 规范名称（标准化后的名称） |
| `category` | `string` | 可选 | 分类（如 `Java 框架`、`前端框架`） |
| `aliases` | `string[]` | 可选 | 别名列表 |
| `reviewed_by` | `string` | 可选 | 审核者 ID |

**响应示例**

```json
{
  "success": true,
  "data": {
    "oov_id": "oov_001",
    "entity_id": "ent_a1b2c3d4",
    "canonical_name": "Spring Boot",
    "message": "OOV已审核通过并入规范库"
  }
}
```

**审核后数据流**

```
OOV 审核通过
    ↓
写入 canonical_entity 表
    ↓
触发 embedding 生成（BGE-M3）→ 写入 Milvus
    ↓
（可选）更新 skill_taxonomy / normalization_rule
```

---

### 2.3 拒绝 OOV

**接口**：`POST /api/admin/oov/:oov_id/reject`

**请求体**

```json
{
  "reason": "拼写错误或无效词汇",
  "reviewed_by": "admin_001"
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "oov_id": "oov_002",
    "message": "已拒绝"
  }
}
```

---

## 三、知识库管理

### 3.1 智能上传知识

**接口**：`POST /api/admin/knowledge-base/smart-upload`

**说明**：支持文本/JSON/文件上传，自动进行实体解析和意图识别，触发知识库更新。详见 `admin_kb.py`。

**降级策略**：LLM 失败 → 关键词匹配。

---

### 3.2 批量更新知识

**接口**：`POST /api/admin/knowledge-base/batch-update`

**说明**：直接传入结构化数据更新 `skill_taxonomy` 和 `career_insights`。

---

## 四、技能图谱状态

### 4.1 获取图谱整体状态

**场景**：管理员查看知识库整体健康度、各数据源统计。

**接口**：`GET /api/admin/graph/status`

**响应示例**

```json
{
  "success": true,
  "data": {
    "neo4j": {
      "nodes": {
        "Skill": 500,
        "SkillCategory": 30,
        "JobPortrait": 12,
        "CareerNode": 40
      },
      "total_nodes": 582,
      "edges": {
        "BELONGS_TO": 500,
        "REQUIRES_SKILL": 156,
        "PROMOTION": 12,
        "TRANSFER": 26,
        "PREREQUISITE": 48
      },
      "total_edges": 742
    },
    "mysql": {
      "skill_taxonomy": 530,
      "canonical_entity": 1240,
      "normalization_rule": 3200,
      "job_portrait_4d": 15,
      "student_portrait_4d": 0,
      "match_result": 0
    },
    "milvus": {
      "collections": [
        "skill_vectors",
        "jd_vectors",
        "resume_vectors",
        "conversation_vectors"
      ],
      "note": "使用 Milvus Lite，统计需通过 collection 查询"
    },
    "overall_status": "healthy"
  }
}
```

**状态判定**

| 条件 | 状态 |
|------|------|
| Neo4j total_nodes > 0 | `healthy` |
| Neo4j total_nodes = 0 | `warning`（图谱未初始化） |
| MySQL 核心表为空 | `warning` |

---

## 附录：OOV 审核流程

```
┌─────────────┐
│ 数据解析/上传 │
└──────┬──────┘
       ↓
┌─────────────┐
│ 实体归一化   │ ← canonical_entity / normalization_rule
└──────┬──────┘
       ↓
  ┌────────┐
  │ 识别成功？│
  └────┬───┘
   是 /  \ 否
    ↓     ↓
┌──────┐ ┌────────┐
│ 正常入库│ │ OOV 记录 │ → oov_entity 表（status=pending）
└──────┘ └────┬───┘
              ↓
       ┌──────────┐
       │ 管理员审核 │ ← /api/admin/oov/pending
       └────┬─────┘
            ↓
    ┌───────┴───────┐
  通过              拒绝
    ↓               ↓
┌────────┐    ┌────────┐
│ canonical│    │ status=│
│ _entity  │    │ rejected│
└────────┘    └────────┘
    ↓
  embedding
    ↓
  Milvus
```

---

> **四库统计对应关系**：
> - Neo4j：图谱节点/边数量
> - MySQL：业务表记录数
> - Milvus：向量集合列表
> - Redis：session / cache / task（运行时数据，非持久化）
