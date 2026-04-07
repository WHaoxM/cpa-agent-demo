<!-- 页面：个人设置；路由：student/settings（student-settings）；角色：STUDENT -->
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Bell, Message } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { usePageEntrance } from '@/composables/usePageEntrance'

const { pageRef } = usePageEntrance()
const userStore = useUserStore()

const activeTab = ref('profile')

// 个人信息表单
const profileForm = ref({
  name: userStore.currentUser?.name || '',
  email: userStore.currentUser?.email || '',
  phone: userStore.currentUser?.phone || '',
  avatar: userStore.currentUser?.avatar || '',
})

// 密码表单
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 通知设置
const notificationSettings = ref({
  emailNotification: true,
  smsNotification: false,
  courseUpdate: true,
  homeworkReminder: true,
  examReminder: true,
  systemNotice: true,
})

function saveProfile() {
  userStore.updateUserInfo({
    name: profileForm.value.name,
    email: profileForm.value.email,
    phone: profileForm.value.phone,
  })
  ElMessage.success('个人信息保存成功')
}

function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.error('密码长度至少为6位')
    return
  }
  ElMessage.success('密码修改成功')
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
}

function saveNotifications() {
  ElMessage.success('通知设置保存成功')
}

function beforeAvatarUpload(file: File) {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('只支持 JPG/PNG 格式图片')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
  }
  return isJPG && isLt2M
}
</script>



<template>
  <div ref="pageRef" class="settings-page page page--compact">
    <div class="settings-shell">
      <aside class="rail">
        <div class="panel rail__panel">
          <div class="rail__top">
            <el-avatar :size="56" :src="profileForm.avatar" />
            <div class="rail__meta">
              <div class="rail__name">{{ profileForm.name || '未设置姓名' }}</div>
              <div class="rail__desc">{{ userStore.currentUser?.username }}</div>
            </div>
          </div>

          <div class="rail__actions">
            <el-upload
              class="avatar-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
            >
              <el-button type="primary" plain>更换头像</el-button>
            </el-upload>
          </div>
        </div>

        <div class="panel rail__panel rail__panel--muted">
          <div class="rail-kv">
            <div class="rail-kv__k">快捷入口</div>
            <div class="rail-kv__v">账号 / 通知</div>
          </div>
          <div class="rail-kv">
            <div class="rail-kv__k">建议</div>
            <div class="rail-kv__v">定期更新密码</div>
          </div>
        </div>
      </aside>

      <main class="main">
        <div class="panel">
          <div class="section-head">
            <div class="section-head__title">个人设置</div>
            <div class="section-head__desc">管理你的个人信息与偏好（紧凑模式）</div>
          </div>

          <el-tabs v-model="activeTab" class="tabs">
            <el-tab-pane label="个人信息" name="profile">
              <el-form :model="profileForm" label-position="top" class="form">
                <div class="form-grid">
                  <el-form-item label="姓名">
                    <el-input v-model="profileForm.name" :prefix-icon="User" />
                  </el-form-item>

                  <el-form-item label="邮箱">
                    <el-input v-model="profileForm.email" :prefix-icon="Message" />
                  </el-form-item>
                </div>

                <el-form-item label="手机号">
                  <el-input v-model="profileForm.phone" :prefix-icon="Message" />
                </el-form-item>

                <div class="actions">
                  <el-button type="primary" @click="saveProfile">保存修改</el-button>
                </div>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="账号安全" name="security">
              <div class="subhead">修改密码</div>
              <el-form :model="passwordForm" label-position="top" class="form form--narrow">
                <el-form-item label="当前密码">
                  <el-input v-model="passwordForm.oldPassword" type="password" show-password :prefix-icon="Lock" />
                </el-form-item>

                <el-form-item label="新密码">
                  <el-input v-model="passwordForm.newPassword" type="password" show-password :prefix-icon="Lock" />
                </el-form-item>

                <el-form-item label="确认新密码">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    show-password
                    :prefix-icon="Lock"
                  />
                </el-form-item>

                <div class="actions">
                  <el-button type="primary" @click="changePassword">修改密码</el-button>
                </div>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="通知设置" name="notifications">
              <div class="subhead">消息通知</div>
              <div class="switch-list">
                <div class="switch-row">
                  <div class="switch-row__info">
                    <div class="switch-row__title">邮件通知</div>
                    <div class="switch-row__desc">接收课程更新、作业提醒等邮件通知</div>
                  </div>
                  <el-switch v-model="notificationSettings.emailNotification" />
                </div>

                <div class="switch-row">
                  <div class="switch-row__info">
                    <div class="switch-row__title">短信通知</div>
                    <div class="switch-row__desc">接收重要事件的短信提醒</div>
                  </div>
                  <el-switch v-model="notificationSettings.smsNotification" />
                </div>

                <div class="switch-row switch-row--divider" />

                <div class="switch-row">
                  <div class="switch-row__info">
                    <div class="switch-row__title">课程更新</div>
                    <div class="switch-row__desc">当课程内容更新时通知我</div>
                  </div>
                  <el-switch v-model="notificationSettings.courseUpdate" />
                </div>

                <div class="switch-row">
                  <div class="switch-row__info">
                    <div class="switch-row__title">作业提醒</div>
                    <div class="switch-row__desc">作业截止日期前提醒我</div>
                  </div>
                  <el-switch v-model="notificationSettings.homeworkReminder" />
                </div>

                <div class="switch-row">
                  <div class="switch-row__info">
                    <div class="switch-row__title">考试提醒</div>
                    <div class="switch-row__desc">考试开始前提醒我</div>
                  </div>
                  <el-switch v-model="notificationSettings.examReminder" />
                </div>

                <div class="switch-row">
                  <div class="switch-row__info">
                    <div class="switch-row__title">系统公告</div>
                    <div class="switch-row__desc">接收平台重要公告和更新信息</div>
                  </div>
                  <el-switch v-model="notificationSettings.systemNotice" />
                </div>
              </div>

              <div class="actions actions--topline">
                <el-button type="primary" @click="saveNotifications">保存设置</el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
}

.settings-shell {
  display: grid;
  gap: 12px;
  align-items: start;
}

.panel {
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  padding: 14px;
}

.rail {
  display: grid;
  gap: 12px;
}

.rail__panel {
  padding: 12px;
}

.rail__top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rail__meta {
  min-width: 0;
}

.rail__name {
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
}

.rail__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-200);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail__actions {
  margin-top: 12px;
  display: flex;
}

.rail-kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
}

.rail-kv + .rail-kv {
  border-top: 1px dashed var(--card-divider);
}

.rail-kv__k {
  font-size: 12px;
  color: var(--text-200);
}

.rail-kv__v {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-100);
}

.main {
  display: grid;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--card-divider);
  margin-bottom: 12px;
}

.section-head__title {
  font-size: 14px;
  font-weight: 900;
  line-height: 1.2;
}

.section-head__desc {
  font-size: 12px;
  color: var(--text-200);
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tabs :deep(.el-tabs__content) {
  padding-top: 12px;
}

.subhead {
  font-weight: 900;
  font-size: 13px;
  margin: 4px 0 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

.form {
  max-width: 860px;
}

.form--narrow {
  max-width: 420px;
}

.form-grid {
  display: grid;
  gap: 12px;
}

.actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-start;
}

.actions--topline {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--card-divider);
}

.switch-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border-radius: 0;
  background: var(--card-data-bg);
  border: 1px solid var(--card-divider);
}

.switch-row--divider {
  padding: 0;
  height: 1px;
  border: none;
  background: var(--card-divider);
  border-radius: 0;
}

.switch-row__info {
  flex: 1;
  min-width: 0;
}

.switch-row__title {
  font-weight: 800;
  font-size: 13px;
}

.switch-row__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-200);
}

@media (max-width: 992px) {
  .settings-shell {
    grid-template-columns: 1fr;
  }

  .form,
  .form--narrow {
    max-width: 100%;
  }
}

@media (min-width: 1024px) {
  .settings-shell {
    grid-template-columns: 320px 1fr;
  }

  .rail {
    position: sticky;
    top: 90px;
  }

  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>


