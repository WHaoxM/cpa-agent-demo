<!-- 页面：用户管理；路由：admin/users（admin-users）；角色：ADMIN -->
<script setup lang="ts">
import { ref, computed } from 'vue'
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
  <div class="admin-users-page page">
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-stats">
        <el-tag size="large">总用户数：{{ users.length }}</el-tag>
      </div>
    </div>

    <el-card shadow="never" class="content-card">
      <div class="filter-bar toolbar-section">
        <div class="toolbar-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户名、姓名或邮箱"
            :prefix-icon="Search"
            clearable
            style="width: 280px;"
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
              <el-avatar :size="40" :src="row.avatar" />
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
            <el-tag :type="getRoleTag(row.role).type as any" size="small">
              {{ getRoleTag(row.role).label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
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
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑用户" width="500px">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width: 100%;">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-users-page {
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
}

.user-email {
  font-size: 12px;
  color: var(--text-200);
}
</style>


