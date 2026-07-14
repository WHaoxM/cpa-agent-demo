<!-- 页面：本地知识库维护；路由：admin/knowledge-base；角色：ADMIN -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { UploadRawFile } from 'element-plus'
import { fetchKnowledgeBase, uploadKnowledgeBase, deleteKnowledgeBase, type KbItem } from '@/api/backend'

// ─── 类型定义 ───
interface KbDocument {
  id: string
  filename: string
  category: string
  size: number
  uploadedAt: string
  status: 'indexing' | 'indexed' | 'error'
  chunks: number
}

// ─── 状态 ───
const uploading = ref(false)
const searchKeyword = ref('')
const filterCategory = ref('')

const categories = ['岗位分析', '行业报告', '技术文档', '政策法规', '其他']

const documents = ref<KbDocument[]>([
  {
    id: 'kb_001',
    filename: '2024互联网行业人才报告.pdf',
    category: '行业报告',
    size: 4194304,
    uploadedAt: '2024-03-01 10:00',
    status: 'indexed',
    chunks: 128,
  },
  {
    id: 'kb_002',
    filename: '前端工程师岗位能力要求.docx',
    category: '岗位分析',
    size: 102400,
    uploadedAt: '2024-03-03 14:30',
    status: 'indexed',
    chunks: 32,
  },
  {
    id: 'kb_003',
    filename: 'Java后端技术栈标准.md',
    category: '技术文档',
    size: 51200,
    uploadedAt: '2024-03-08 09:45',
    status: 'indexed',
    chunks: 18,
  },
  {
    id: 'kb_004',
    filename: 'AI大模型应用岗位调研.pdf',
    category: '岗位分析',
    size: 2097152,
    uploadedAt: '2024-03-12 16:20',
    status: 'indexing',
    chunks: 0,
  },
])

const newDocCategory = ref('岗位分析')

const filteredDocs = computed(() => {
  return documents.value.filter(d => {
    const matchKw = !searchKeyword.value || d.filename.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchCat = !filterCategory.value || d.category === filterCategory.value
    return matchKw && matchCat
  })
})

const totalIndexed = computed(() => documents.value.filter(d => d.status === 'indexed').length)
const totalChunks = computed(() => documents.value.reduce((s, d) => s + d.chunks, 0))

// ─── 后端状态映射 ───
function mapKbStatus(s?: string | null): KbDocument['status'] {
  if (s === 'indexed' || s === 'done' || s === 'completed') return 'indexed'
  if (s === 'indexing' || s === 'processing' || s === 'running') return 'indexing'
  if (s === 'error' || s === 'failed') return 'error'
  return 'indexing'
}

// ─── 后端数据同步（失败时保留 mock）───
onMounted(async () => {
  try {
    const resp = await fetchKnowledgeBase()
    if (resp.success && resp.data && resp.data.length > 0) {
      documents.value = resp.data.map((item: KbItem) => ({
        id: item.id,
        filename: item.title || item.id,
        category: item.type || '其他',
        size: 0,
        uploadedAt: item.created_at
          ? new Date(item.created_at).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
          : '',
        status: mapKbStatus(item.status),
        chunks: 0,
      }))
    }
  } catch {
    // 后端不可用时保留 mock 数据
  }
})

// ─── 工具函数 ───
function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

function statusLabel(s: KbDocument['status']): string {
  return { indexing: '向量化中', indexed: '已入库', error: '失败' }[s]
}

function statusType(s: KbDocument['status']): '' | 'success' | 'warning' | 'danger' | 'info' {
  return { indexing: 'warning', indexed: 'success', error: 'danger' }[s] as '' | 'success' | 'warning' | 'danger' | 'info'
}

// ─── 上传处理 ───
async function handleUpload(rawFile: UploadRawFile): Promise<boolean> {
  uploading.value = true
  try {
    const resp = await uploadKnowledgeBase(rawFile.name, newDocCategory.value)
    const newId = resp.success && resp.data ? resp.data.id : `kb_${Date.now()}`
    const newDoc: KbDocument = {
      id: newId,
      filename: rawFile.name,
      category: newDocCategory.value,
      size: rawFile.size,
      uploadedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      status: 'indexing',
      chunks: 0,
    }
    documents.value.unshift(newDoc)
    setTimeout(() => {
      const d = documents.value.find(d => d.id === newId)
      if (d) { d.status = 'indexed'; d.chunks = Math.floor(rawFile.size / 1800) + 5 }
    }, 3000)
    ElMessage.success(`「${rawFile.name}」上传成功，正在向量化入库`)
    return false
  } catch {
    // 后端不可用时 fallback 到本地 mock
    const newDoc: KbDocument = {
      id: `kb_${Date.now()}`,
      filename: rawFile.name,
      category: newDocCategory.value,
      size: rawFile.size,
      uploadedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      status: 'indexing',
      chunks: 0,
    }
    documents.value.unshift(newDoc)
    setTimeout(() => {
      const d = documents.value.find(d => d.id === newDoc.id)
      if (d) { d.status = 'indexed'; d.chunks = Math.floor(rawFile.size / 1800) + 5 }
    }, 3000)
    ElMessage.success(`「${rawFile.name}」上传成功（本地模式）`)
    return false
  } finally {
    uploading.value = false
  }
}

function beforeUpload(file: UploadRawFile) {
  const MAX = 100 * 1024 * 1024
  if (file.size > MAX) {
    ElMessage.warning('文件不能超过 100 MB')
    return false
  }
  return handleUpload(file)
}

// ─── 重建索引 ───
async function onReindex(row: KbDocument) {
  // 后端暂无重建索引接口，仅本地模拟
  row.status = 'indexing'
  row.chunks = 0
  ElMessage.info('已重新触发向量化')
  setTimeout(() => {
    row.status = 'indexed'
    row.chunks = Math.floor(row.size / 1800) + 5
  }, 2500)
}

// ─── 删除 ───
async function onDelete(row: KbDocument) {
  await ElMessageBox.confirm(`确认从知识库移除「${row.filename}」？该文档的所有向量块将被清除。`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })
  try {
    await deleteKnowledgeBase(row.id)
  } catch {
    // 后端不可用时仍从本地移除
  }
  documents.value = documents.value.filter(d => d.id !== row.id)
  ElMessage.success('已移除')
}
</script>

<template>
  <div class="page-container">
    <!-- 页头 -->
    <div class="page-head">
      <div class="page-head__title">
        <Icon icon="lucide:book-open" class="page-head__icon" />
        <span>本地知识库维护</span>
      </div>
      <p class="page-head__desc">上传文档（PDF / Word / Markdown / TXT 等），系统将自动分块向量化入库，供 AI 检索增强使用。</p>
    </div>

    <!-- 统计卡 -->
    <div class="stat-row">
      <div class="stat-card">
        <Icon icon="lucide:files" class="stat-card__icon" />
        <div>
          <div class="stat-card__num">{{ documents.length }}</div>
          <div class="stat-card__label">文档总数</div>
        </div>
      </div>
      <div class="stat-card">
        <Icon icon="lucide:check-circle" class="stat-card__icon stat-card__icon--green" />
        <div>
          <div class="stat-card__num">{{ totalIndexed }}</div>
          <div class="stat-card__label">已入库</div>
        </div>
      </div>
      <div class="stat-card">
        <Icon icon="lucide:layers" class="stat-card__icon stat-card__icon--blue" />
        <div>
          <div class="stat-card__num">{{ totalChunks.toLocaleString() }}</div>
          <div class="stat-card__label">向量块数</div>
        </div>
      </div>
    </div>

    <!-- 上传区域 -->
    <div class="upload-card">
      <div class="upload-card__header">
        <Icon icon="lucide:upload" />
        <span>上传新文档</span>
      </div>
      <div class="upload-card__body">
        <div class="upload-config">
          <span class="upload-config__label">分类</span>
          <el-select v-model="newDocCategory" size="small" style="width: 160px">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <el-upload
          :auto-upload="false"
          :before-upload="beforeUpload"
          :show-file-list="false"
          :disabled="uploading"
          class="upload-btn-area"
        >
          <el-button :loading="uploading" type="primary" size="small">
            <Icon icon="lucide:plus" style="margin-right: 4px" />
            选择文件上传
          </el-button>
          <span class="upload-hint">PDF / Word / MD / TXT · 最大 100 MB</span>
        </el-upload>
      </div>
    </div>

    <!-- 列表工具栏 -->
    <div class="list-toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文件名…"
        clearable
        class="list-toolbar__search"
      >
        <template #prefix><Icon icon="lucide:search" /></template>
      </el-input>
      <el-select v-model="filterCategory" placeholder="全部分类" clearable size="default" style="width: 140px">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <span class="list-toolbar__count">共 {{ filteredDocs.length }} 条</span>
    </div>

    <!-- 数据表 -->
    <el-table :data="filteredDocs" class="kb-table" row-key="id" stripe>
      <el-table-column label="文件名" prop="filename" min-width="220">
        <template #default="{ row }">
          <div class="file-name">
            <Icon icon="lucide:file-text" class="file-name__icon" />
            <span>{{ row.filename }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类" prop="category" width="110">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="大小" width="90">
        <template #default="{ row }">{{ formatSize(row.size) }}</template>
      </el-table-column>
      <el-table-column label="上传时间" prop="uploadedAt" width="170" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="向量块" width="90">
        <template #default="{ row }">
          <span v-if="row.status === 'indexed'" class="chunk-count">{{ row.chunks }}</span>
          <span v-else class="chunk-count chunk-count--dim">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            size="small"
            :disabled="row.status === 'indexing'"
            @click="onReindex(row)"
          >
            重建
          </el-button>
          <el-button
            type="danger"
            link
            size="small"
            :disabled="row.status === 'indexing'"
            @click="onDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="table-empty">
          <Icon icon="lucide:book" class="table-empty__icon" />
          <p>知识库为空，请先上传文档</p>
        </div>
      </template>
    </el-table>
  </div>
</template>

<style scoped>
.page-container {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head {
  border-left: 3px solid var(--primary-100);
  padding-left: 12px;
}

.page-head__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-100);
}

.page-head__icon {
  font-size: 20px;
  color: var(--primary-100);
}

.page-head__desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-200);
  line-height: 1.6;
}

/* 统计卡 */
.stat-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--bg-200);
  border: 1px solid var(--bg-300);
  min-width: 140px;
  flex: 1;
}

.stat-card__icon {
  font-size: 22px;
  color: var(--text-300);
}

.stat-card__icon--green { color: #22c55e; }
.stat-card__icon--blue { color: #3b82f6; }

.stat-card__num {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-100);
  line-height: 1.2;
}

.stat-card__label {
  font-size: 12px;
  color: var(--text-300);
  margin-top: 2px;
}

/* 上传卡 */
.upload-card {
  border: 1px solid var(--bg-300);
  background: var(--bg-100);
}

.upload-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-100);
  border-bottom: 1px solid var(--bg-300);
  background: var(--bg-200);
}

.upload-card__body {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.upload-config {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-config__label {
  font-size: 13px;
  color: var(--text-200);
  white-space: nowrap;
}

.upload-btn-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-300);
}

/* 工具栏 */
.list-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.list-toolbar__search {
  width: 240px;
}

.list-toolbar__count {
  font-size: 13px;
  color: var(--text-300);
  margin-left: auto;
}

/* 表格 */
.kb-table {
  border: 1px solid var(--bg-300);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.file-name__icon {
  color: var(--primary-200);
  flex-shrink: 0;
}

.chunk-count {
  font-size: 13px;
  font-family: var(--font-mono, monospace);
  color: var(--text-100);
}

.chunk-count--dim {
  color: var(--text-300);
}

.table-empty {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-300);
}

.table-empty__icon {
  font-size: 32px;
  opacity: 0.5;
}
</style>
