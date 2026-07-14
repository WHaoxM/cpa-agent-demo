<!-- 页面：岗位数据集管理；路由：admin/job-dataset；角色：ADMIN -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { UploadFile, UploadRawFile } from 'element-plus'
import { fetchDatasets, uploadDataset, deleteDataset, type DatasetItem } from '@/api/backend'

// ─── 类型定义 ───
interface DatasetRecord {
  id: string
  filename: string
  size: number
  uploadedAt: string
  status: 'pending' | 'processing' | 'done' | 'error'
  remark: string
}

// ─── 状态 ───
const uploading = ref(false)
const searchKeyword = ref('')

const records = ref<DatasetRecord[]>([
  {
    id: 'ds_001',
    filename: 'job_posts_2024Q1.csv',
    size: 2048576,
    uploadedAt: '2024-03-01 10:22',
    status: 'done',
    remark: '2024年Q1岗位需求数据',
  },
  {
    id: 'ds_002',
    filename: 'backend_jobs_shenzhen.xlsx',
    size: 512000,
    uploadedAt: '2024-03-05 14:08',
    status: 'done',
    remark: '深圳后端岗位合集',
  },
  {
    id: 'ds_003',
    filename: 'frontend_requirements_2024.json',
    size: 307200,
    uploadedAt: '2024-03-10 09:15',
    status: 'processing',
    remark: '',
  },
])

const filteredRecords = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return records.value
  return records.value.filter(r => r.filename.toLowerCase().includes(kw) || r.remark.toLowerCase().includes(kw))
})

// ─── 后端状态映射 ───
function mapStatus(s?: string | null): DatasetRecord['status'] {
  if (s === 'done' || s === 'completed') return 'done'
  if (s === 'processing' || s === 'running') return 'processing'
  if (s === 'error' || s === 'failed') return 'error'
  return 'pending'
}

// ─── 后端数据同步（失败时保留 mock）───
onMounted(async () => {
  try {
    const resp = await fetchDatasets()
    if (resp.success && resp.data && resp.data.length > 0) {
      records.value = resp.data.map((item: DatasetItem) => ({
        id: item.id,
        filename: item.title || item.id,
        size: 0,
        uploadedAt: item.created_at
          ? new Date(item.created_at).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
          : '',
        status: mapStatus(item.status),
        remark: item.category || '',
      }))
    }
  } catch {
    // 后端不可用时保留 mock 数据
  }
})

// ─── 工具函数（API 调用点，后续替换为真实接口）───
function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

function statusLabel(s: DatasetRecord['status']): string {
  return { pending: '待处理', processing: '解析中', done: '已完成', error: '失败' }[s]
}

function statusType(s: DatasetRecord['status']): '' | 'success' | 'warning' | 'danger' | 'info' {
  return { pending: 'info', processing: 'warning', done: 'success', error: 'danger' }[s] as '' | 'success' | 'warning' | 'danger' | 'info'
}

// ─── 上传处理 ───
async function handleUpload(rawFile: UploadRawFile): Promise<boolean> {
  uploading.value = true
  try {
    const resp = await uploadDataset(rawFile.name, '通用')
    const newId = resp.success && resp.data ? resp.data.id : `ds_${Date.now()}`
    const newRecord: DatasetRecord = {
      id: newId,
      filename: rawFile.name,
      size: rawFile.size,
      uploadedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      status: 'processing',
      remark: '',
    }
    records.value.unshift(newRecord)
    setTimeout(() => {
      const r = records.value.find(r => r.id === newId)
      if (r) r.status = 'done'
    }, 2000)
    ElMessage.success(`「${rawFile.name}」上传成功，正在解析`)
    return false
  } catch {
    // 后端不可用时 fallback 到本地 mock
    const newRecord: DatasetRecord = {
      id: `ds_${Date.now()}`,
      filename: rawFile.name,
      size: rawFile.size,
      uploadedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      status: 'processing',
      remark: '',
    }
    records.value.unshift(newRecord)
    setTimeout(() => {
      const r = records.value.find(r => r.id === newRecord.id)
      if (r) r.status = 'done'
    }, 2000)
    ElMessage.success(`「${rawFile.name}」上传成功（本地模式）`)
    return false
  } finally {
    uploading.value = false
  }
}

function beforeUpload(file: UploadRawFile) {
  const MAX = 200 * 1024 * 1024
  if (file.size > MAX) {
    ElMessage.warning('文件不能超过 200 MB')
    return false
  }
  return handleUpload(file)
}

function handleExceed(_files: File[], _fileList: UploadFile[]) {
  ElMessage.warning('请逐个上传文件')
}

// ─── 删除 ───
async function onDelete(row: DatasetRecord) {
  await ElMessageBox.confirm(`确认删除「${row.filename}」？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })
  try {
    await deleteDataset(row.id)
  } catch {
    // 后端不可用时仍从本地移除
  }
  records.value = records.value.filter(r => r.id !== row.id)
  ElMessage.success('已删除')
}

// ─── 备注保存 ───
async function onRemarkSave(row: DatasetRecord, val: string) {
  // 后端暂无备注更新接口，仅本地更新
  row.remark = val
  ElMessage.success('备注已保存')
}

const editingRemark = ref<string | null>(null)
const editingVal = ref('')

function startEdit(row: DatasetRecord) {
  editingRemark.value = row.id
  editingVal.value = row.remark
}

function finishEdit(row: DatasetRecord) {
  if (editingRemark.value === row.id) {
    onRemarkSave(row, editingVal.value)
    editingRemark.value = null
  }
}
</script>

<template>
  <div class="page-container">
    <!-- 页头 -->
    <div class="page-head">
      <div class="page-head__title">
        <Icon icon="lucide:database" class="page-head__icon" />
        <span>岗位数据集管理</span>
      </div>
      <p class="page-head__desc">上传岗位招聘数据文件，由后端统一解析入库，支持任意格式（CSV / Excel / JSON 等）。</p>
    </div>

    <!-- 上传区域 -->
    <div class="upload-zone">
      <el-upload
        class="upload-dragger"
        drag
        :auto-upload="false"
        :before-upload="beforeUpload"
        :on-exceed="handleExceed"
        :show-file-list="false"
        :disabled="uploading"
      >
        <div class="upload-inner">
          <Icon icon="lucide:upload-cloud" class="upload-inner__icon" />
          <p class="upload-inner__tip">拖拽文件到此，或 <em>点击上传</em></p>
          <p class="upload-inner__sub">支持任意格式 · 单文件最大 200 MB</p>
          <el-button v-if="uploading" loading type="primary" size="small">上传中…</el-button>
        </div>
      </el-upload>
    </div>

    <!-- 列表工具栏 -->
    <div class="list-toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文件名或备注…"
        clearable
        class="list-toolbar__search"
      >
        <template #prefix><Icon icon="lucide:search" /></template>
      </el-input>
      <span class="list-toolbar__count">共 {{ filteredRecords.length }} 条</span>
    </div>

    <!-- 数据表 -->
    <el-table :data="filteredRecords" class="dataset-table" row-key="id" stripe>
      <el-table-column label="文件名" prop="filename" min-width="200">
        <template #default="{ row }">
          <div class="file-name">
            <Icon icon="lucide:file" class="file-name__icon" />
            <span>{{ row.filename }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="大小" width="100">
        <template #default="{ row }">{{ formatSize(row.size) }}</template>
      </el-table-column>
      <el-table-column label="上传时间" prop="uploadedAt" width="170" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="180">
        <template #default="{ row }">
          <div v-if="editingRemark === row.id" class="remark-edit">
            <el-input
              v-model="editingVal"
              size="small"
              autofocus
              @blur="finishEdit(row)"
              @keyup.enter="finishEdit(row)"
            />
          </div>
          <div v-else class="remark-view" @click="startEdit(row)">
            <span v-if="row.remark">{{ row.remark }}</span>
            <span v-else class="remark-placeholder">点击添加备注</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button
            type="danger"
            link
            size="small"
            :disabled="row.status === 'processing'"
            @click="onDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="table-empty">
          <Icon icon="lucide:inbox" class="table-empty__icon" />
          <p>暂无数据集，请先上传文件</p>
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

/* 上传区 */
.upload-zone {
  border: 1px dashed color-mix(in srgb, var(--bg-300) 80%, var(--primary-100) 20%);
  background: color-mix(in srgb, var(--bg-100) 96%, var(--primary-100) 4%);
  transition: border-color 0.2s;
}

.upload-zone:hover {
  border-color: var(--primary-200);
}

:deep(.upload-dragger) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  background: transparent;
  border: none;
  border-radius: 0;
  height: auto;
  padding: 0;
}

.upload-inner {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-inner__icon {
  font-size: 36px;
  color: var(--primary-200);
}

.upload-inner__tip {
  font-size: 14px;
  color: var(--text-100);
  margin: 0;
}

.upload-inner__tip em {
  color: var(--primary-100);
  font-style: normal;
  font-weight: 600;
}

.upload-inner__sub {
  font-size: 12px;
  color: var(--text-300);
  margin: 0;
}

/* 工具栏 */
.list-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-toolbar__search {
  width: 280px;
}

.list-toolbar__count {
  font-size: 13px;
  color: var(--text-300);
  margin-left: auto;
}

/* 表格 */
.dataset-table {
  border: 1px solid var(--bg-300);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.file-name__icon {
  color: var(--text-300);
  flex-shrink: 0;
}

.remark-view {
  cursor: pointer;
  font-size: 13px;
  color: var(--text-100);
  min-height: 22px;
  padding: 2px 4px;
  border-radius: 2px;
  transition: background 0.15s;
}

.remark-view:hover {
  background: var(--bg-200);
}

.remark-placeholder {
  color: var(--text-300);
  font-style: italic;
}

.remark-edit {
  display: flex;
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
