<!-- 页面：用户管理；路由：admin/users（admin-users）；角色：ADMIN -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Lock, Unlock, UserFilled, Refresh, Download, Grid } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { mockUsers } from '@/mock/data'
import type { User, UserRole } from '@/types'

const userStore = useUserStore()

const searchQuery = ref('')
const selectedRole = ref('')
const selectedStatus = ref('')

const users = computed(() => {
  let result = [...mockUsers]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  }
  
  if (selectedRole.value) {
    result = result.filter(u => u.role === selectedRole.value)
  }
  
  if (selectedStatus.value) {
    result = result.filter(u => u.status === selectedStatus.value)
  }
  
  return result
})

const currentEditUser = ref<User | null>(null)
const showEditDialog = ref(false)
const selectedUsers = ref<string[]>([])
const editForm = ref({
  name: '',
  email: '',
  role: '' as UserRole,
  status: 'active' as 'active' | 'disabled',
})

function handleSelectionChange(selection: User[]) {
  selectedUsers.value = selection.map(u => u.id)
}

function refreshData() {
  ElMessage.success('数据已刷新')
}

function exportData() {
  const data = users.value.map(u => ({
    姓名: u.name,
    用户名: u.username,
    邮箱: u.email,
    角色: getRoleTag(u.role).label,
    状态: u.status === 'active' ? '正常' : '禁用',
    注册时间: u.createdAt
  }))
  console.table(data)
  ElMessage.success('用户数据已导出到控制台')
}

function batchDisable() {
  ElMessageBox.confirm(
    `确定要禁用选中的 ${selectedUsers.value.length} 个用户吗？`,
    '批量禁用',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    ElMessage.success(`已禁用 ${selectedUsers.value.length} 个用户`)
    selectedUsers.value = []
  })
}

function openEdit(user: User) {
  currentEditUser.value = user
  editForm.value = {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
  showEditDialog.value = true
}

function saveUser() {
  ElMessage.success(`已更新用户 ${currentEditUser.value?.name} 的信息`)
  showEditDialog.value = false
}

function toggleUserStatus(user: User) {
  const newStatus = user.status === 'active' ? 'disabled' : 'active'
  user.status = newStatus
  ElMessage.success(`已${newStatus === 'active' ? '启用' : '禁用'}用户 ${user.name}`)
}

function getRoleTag(role: UserRole) {
  const map: Record<string, { type: string, label: string }> = {
    student: { type: '', label: '学生' },
    teacher: { type: 'success', label: '教师' },
    admin: { type: 'danger', label: '管理员' },
  }
  return map[role] || { type: 'info', label: role }
}
</script>



<template>
  <div class="admin-users-page page page--compact">
    <div class="page-head">
      <div class="page-head__left">
        <div>
          <h2 class="page-head__title">用户管理</h2>
          <div class="page-head__desc">管理系统中的所有用户账号</div>
        </div>
      </div>
      <div class="page-head__right">
        <div class="stat-strip">
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ mockUsers.length }}</span>
            <span class="stat-strip__label">总用户</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ mockUsers.filter(u => u.status === 'active').length }}</span>
            <span class="stat-strip__label">正常</span>
          </div>
          <div class="stat-strip__item">
            <span class="stat-strip__value">{{ mockUsers.filter(u => u.role === 'teacher').length }}</span>
            <span class="stat-strip__label">教师</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar-section">
        <div class="toolbar-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户名、姓名或邮箱"
            :prefix-icon="Search"
            clearable
            style="width: 260px;"
          />
          <el-select v-model="selectedRole" placeholder="角色筛选" clearable>
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <el-select v-model="selectedStatus" placeholder="状态筛选" clearable>
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新数据">
            <el-button :icon="Refresh" circle text @click="refreshData" />
          </el-tooltip>
          <el-button :icon="Download" @click="exportData">导出</el-button>
          <el-button v-if="selectedUsers.length > 0" type="danger" @click="batchDisable">
            批量禁用 ({{ selectedUsers.length }})
          </el-button>
        </div>
      </div>

      <el-table 
        :data="users" 
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="36" :src="row.avatar" />
              <div class="user-detail">
                <div class="user-name">{{ row.name }}</div>
                <div class="user-email">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="username" label="用户名" width="120" />

        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTag(row.role).type as any" size="small" effect="plain">
              {{ getRoleTag(row.role).label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small" effect="plain">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="注册时间" width="120" />

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="UserFilled" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button 
              link 
              :type="row.status === 'active' ? 'danger' : 'success'"
              :icon="row.status === 'active' ? Lock : Unlock"
              @click="toggleUserStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑用户" width="560px">
      <div v-if="currentEditUser" class="dialog-summary">
        <el-avatar :size="44" :src="currentEditUser.avatar" class="dialog-summary__avatar" />
        <div class="dialog-summary__info">
          <div class="dialog-summary__name">{{ currentEditUser.name }}</div>
          <div class="dialog-summary__meta">
            <span>@{{ currentEditUser.username }}</span>
            <span>{{ currentEditUser.email }}</span>
            <span>注册于 {{ currentEditUser.createdAt }}</span>
          </div>
        </div>
        <div class="dialog-summary__badge">
          <el-tag :type="currentEditUser.status === 'active' ? 'success' : 'info'" size="small" effect="plain">
            {{ currentEditUser.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </div>
      </div>

      <div class="dialog-section">
        <div class="dialog-section__title">基本信息</div>
        <el-form :model="editForm" label-position="top">
          <div class="form-2col">
            <el-form-item label="姓名">
              <el-input v-model="editForm.name" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="editForm.email" />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <div class="dialog-section">
        <div class="dialog-section__title">权限与状态</div>
        <el-form :model="editForm" label-position="top">
          <div class="form-2col">
            <el-form-item label="角色">
              <el-select v-model="editForm.role" style="width: 100%;">
                <el-option label="学生" value="student" />
                <el-option label="教师" value="teacher" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
            <el-form-item label="账号状态">
              <el-radio-group v-model="editForm.status">
                <el-radio label="active">正常</el-radio>
                <el-radio label="disabled">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <span class="dialog-footer__hint">修改仅为 UI 演示，不会持久化</span>
          <div class="dialog-footer__actions">
            <el-button @click="showEditDialog = false">取消</el-button>
            <el-button type="primary" @click="saveUser">保存修改</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.panel {
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  padding: 16px;
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--card-divider);
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 700;
  font-size: 13px;
}

.user-email {
  font-size: 12px;
  color: var(--text-200);
}

/* Dialog enrichment */
.form-2col {
  display: grid;
  gap: 0 20px;
}

@media (min-width: 480px) {
  .form-2col {
    grid-template-columns: 1fr 1fr;
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.dialog-footer__hint {
  font-size: 12px;
  color: var(--text-200);
}

.dialog-footer__actions {
  display: flex;
  gap: 8px;
}
</style>


