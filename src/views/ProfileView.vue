<!-- 页面：个人中心；路由：profile（profile） -->
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores'
import jiImg from '@/assets/ji.png'

const auth = useAuthStore()
const userStore = useUserStore()

const profile = computed(() => {
  return (
    auth.user ?? {
      id: 'demo-001',
      nickname: '演示用户',
      account: 'demo@example.com',
      avatar: jiImg,
    }
  )
})

const roleName = computed(() => {
  if (userStore.isStudent) return '学生'
  if (userStore.isAdmin) return '管理员'
  return '未知'
})

const form = reactive({
  nickname: profile.value.nickname,
  phone: '13800000000',
  signature: '保持专注，持续迭代。',
  email: profile.value.account,
})

function onSave() {
  ElMessage.info('仅 UI 演示，无提交逻辑')
}
</script>



<template>
  <div class="page page--compact profile-page">
    <div class="profile-shell">
      <aside class="rail">
        <div class="panel rail__panel">
          <div class="user">
            <el-avatar :size="56" :src="profile.avatar" />
            <div class="user__meta">
              <div class="user__name">{{ profile.nickname }}</div>
              <div class="user__account">{{ profile.account }}</div>
              <div class="user__role">
                <el-tag size="small" effect="plain" round>{{ roleName }}</el-tag>
              </div>
            </div>
          </div>

          <div class="rail__actions">
            <el-button type="primary" :icon="EditPen" @click="onSave">保存修改</el-button>
          </div>
        </div>

        <div class="panel rail__panel rail__panel--muted">
          <div class="rail__section-label">账号信息</div>
          <div class="kv">
            <div class="kv__k">用户 ID</div>
            <div class="kv__v kv__v--mono">{{ profile.id }}</div>
          </div>
          <div class="kv">
            <div class="kv__k">账号状态</div>
            <div class="kv__v"><span class="kv__dot kv__dot--ok"></span>正常</div>
          </div>
          <div class="kv">
            <div class="kv__k">当前角色</div>
            <div class="kv__v">{{ roleName }}</div>
          </div>
          <div class="kv">
            <div class="kv__k">绑定方式</div>
            <div class="kv__v">邮箱</div>
          </div>
          <div class="kv">
            <div class="kv__k">注册时间</div>
            <div class="kv__v">2024-09-01</div>
          </div>
          <div class="kv">
            <div class="kv__k">最近登录</div>
            <div class="kv__v">今天</div>
          </div>
        </div>

        <div class="panel rail__panel rail__panel--muted">
          <div class="rail__section-label">学习概况</div>
          <div class="kv">
            <div class="kv__k">在学课程</div>
            <div class="kv__v">3 门</div>
          </div>
          <div class="kv">
            <div class="kv__k">已完成章节</div>
            <div class="kv__v">18 / 45</div>
          </div>
          <div class="kv">
            <div class="kv__k">累计学习</div>
            <div class="kv__v">42.5 小时</div>
          </div>
          <div class="kv">
            <div class="kv__k">本周活跃天</div>
            <div class="kv__v">5 天</div>
          </div>
        </div>
      </aside>

      <main class="main">
        <div class="panel">
          <div class="section-head">
            <div class="section-head__title">个人资料</div>
            <el-tag round effect="plain" size="small">仅 UI 演示</el-tag>
          </div>

          <div class="form-section">
            <div class="form-section__head">
              <div class="form-section__title">基本信息</div>
              <div class="form-section__desc">修改后请点击"保存修改"生效</div>
            </div>
            <el-form label-position="top" size="default" class="form">
              <div class="form-grid">
                <el-form-item label="昵称">
                  <el-input v-model="form.nickname" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="form.email" placeholder="请输入邮箱" />
                </el-form-item>
              </div>
              <div class="form-grid">
                <el-form-item label="手机号">
                  <el-input v-model="form.phone" placeholder="请输入手机号" />
                </el-form-item>
              </div>
              <el-form-item label="个性签名">
                <el-input v-model="form.signature" type="textarea" :rows="2" placeholder="一句话介绍自己" />
              </el-form-item>
            </el-form>
          </div>

          <div class="form-section">
            <div class="form-section__head">
              <div class="form-section__title">安全设置</div>
              <div class="form-section__desc">管理密码和登录安全相关配置</div>
            </div>
            <div class="pref-list">
              <button class="pref-row" type="button" @click="onSave">
                <div class="pref-row__left">
                  <div class="pref-row__title">修改密码</div>
                  <div class="pref-row__meta">上次修改：30 天前</div>
                </div>
                <span class="pref-row__arrow">›</span>
              </button>
              <button class="pref-row" type="button" @click="onSave">
                <div class="pref-row__left">
                  <div class="pref-row__title">两步验证</div>
                  <div class="pref-row__meta">未开启</div>
                </div>
                <el-tag size="small" type="info" effect="plain">建议开启</el-tag>
              </button>
              <button class="pref-row" type="button" @click="onSave">
                <div class="pref-row__left">
                  <div class="pref-row__title">登录设备管理</div>
                  <div class="pref-row__meta">当前设备：1 台</div>
                </div>
                <span class="pref-row__arrow">›</span>
              </button>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section__head">
              <div class="form-section__title">通知偏好</div>
              <div class="form-section__desc">选择你希望接收的通知类型</div>
            </div>
            <div class="pref-list">
              <button class="pref-row" type="button" @click="onSave">
                <div class="pref-row__left">
                  <div class="pref-row__title">邮件通知</div>
                  <div class="pref-row__meta">课程更新、作业提醒</div>
                </div>
                <el-tag size="small" type="success" effect="plain">已开启</el-tag>
              </button>
              <button class="pref-row" type="button" @click="onSave">
                <div class="pref-row__left">
                  <div class="pref-row__title">系统消息</div>
                  <div class="pref-row__meta">公告、活动、安全提醒</div>
                </div>
                <el-tag size="small" type="success" effect="plain">已开启</el-tag>
              </button>
              <button class="pref-row" type="button" @click="onSave">
                <div class="pref-row__left">
                  <div class="pref-row__title">短信通知</div>
                  <div class="pref-row__meta">重要事件推送</div>
                </div>
                <el-tag size="small" type="info" effect="plain">未开启</el-tag>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.profile-shell {
  display: grid;
  gap: 12px;
}

.panel {
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  padding: 16px;
}

.rail {
  display: grid;
  gap: 12px;
  align-content: start;
}

.rail__panel {
  padding: 14px;
}

.rail__panel--muted {
  background: var(--card-data-bg);
}

.rail__section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-200);
  letter-spacing: 0.06em;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--card-divider);
}

.rail__actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.rail__actions .el-button { width: 100%; }

.main {
  display: grid;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--card-divider);
  margin-bottom: 4px;
}

.section-head__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.form-section__head {
  margin-bottom: 14px;
}

.form-section__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-100);
}

.form-section__desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-200);
}

.form-section {
  padding: 16px 0;
}

.form-section + .form-section {
  border-top: 1px solid var(--card-divider);
}

.user {
  display: flex;
  gap: 14px;
  align-items: center;
}

.user__name {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.user__account {
  margin-top: 3px;
  color: var(--text-200);
  font-size: 12px;
}

.user__role {
  margin-top: 6px;
}

.form {
  margin-top: 4px;
}

.form-grid {
  display: grid;
  gap: 12px;
}

@media (min-width: 1024px) {
  .profile-shell {
    grid-template-columns: 280px 1fr;
    align-items: start;
  }

  .rail {
    position: sticky;
    top: 90px;
  }

  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}

.kv + .kv {
  border-top: 1px dashed var(--card-divider);
}

.kv__k {
  font-size: 12px;
  color: var(--text-200);
}

.kv__v {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-100);
  display: flex;
  align-items: center;
  gap: 6px;
}

.kv__v--mono {
  font-family: var(--font-latin, monospace);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.kv__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.kv__dot--ok { background: #67C23A; }
.kv__dot--warn { background: #E6A23C; }

.pref-list {
  display: flex;
  flex-direction: column;
}

.pref-row {
  width: 100%;
  text-align: left;
  border: none;
  border-bottom: 1px solid var(--card-divider);
  background: transparent;
  padding: 14px 4px;
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: background 0.15s ease;
}

.pref-row:last-child { border-bottom: none; }

.pref-row:hover {
  background: var(--card-data-bg);
}

.pref-row__left {
  min-width: 0;
}

.pref-row__title {
  font-weight: 600;
  font-size: 13px;
}

.pref-row__meta {
  font-size: 12px;
  color: var(--text-200);
  margin-top: 2px;
}

.pref-row__arrow {
  font-size: 16px;
  color: var(--text-200);
  flex-shrink: 0;
}
</style>


