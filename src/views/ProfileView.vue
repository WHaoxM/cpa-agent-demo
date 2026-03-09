<!-- 页面：个人中心；路由：profile（profile） -->
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import jiImg from '@/assets/ji.png'

const auth = useAuthStore()

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

const form = reactive({
  nickname: profile.value.nickname,
  phone: '13800000000',
  signature: '保持专注，持续迭代。',
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
              <div class="user__id">ID: {{ profile.id }}</div>
            </div>
          </div>

          <div class="rail__actions">
            <el-button type="primary" :icon="EditPen" @click="onSave">保存（演示）</el-button>
            <el-button @click="onSave">取消</el-button>
          </div>
        </div>

        <div class="panel rail__panel rail__panel--muted">
          <div class="kv">
            <div class="kv__k">账号状态</div>
            <div class="kv__v">正常</div>
          </div>
          <div class="kv">
            <div class="kv__k">角色</div>
            <div class="kv__v">学习者</div>
          </div>
          <div class="kv">
            <div class="kv__k">绑定</div>
            <div class="kv__v">邮箱</div>
          </div>
        </div>
      </aside>

      <main class="main">
        <div class="panel">
          <div class="section-head">
            <div class="section-head__title">个人资料</div>
            <el-tag round effect="plain">仅 UI</el-tag>
          </div>

          <el-form label-position="top" size="default" class="form">
            <div class="form-grid">
              <el-form-item label="昵称" class="form-item">
                <el-input v-model="form.nickname" placeholder="请输入昵称" />
              </el-form-item>

              <el-form-item label="手机号" class="form-item">
                <el-input v-model="form.phone" placeholder="请输入手机号" />
              </el-form-item>
            </div>

            <el-form-item label="个性签名">
              <el-input v-model="form.signature" type="textarea" :rows="3" placeholder="一句话介绍自己" />
            </el-form-item>
          </el-form>
        </div>

        <div class="panel">
          <div class="section-head">
            <div class="section-head__title">偏好</div>
            <div class="section-head__desc">这里可以放主题/通知等入口（当前仅布局示例）</div>
          </div>

          <div class="pref-list">
            <button class="pref-row" type="button" @click="onSave">
              <div class="pref-row__title">通知设置</div>
              <div class="pref-row__meta">邮件 / 系统消息</div>
            </button>
            <button class="pref-row" type="button" @click="onSave">
              <div class="pref-row__title">隐私与安全</div>
              <div class="pref-row__meta">密码 / 绑定</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
}

.profile-shell {
  display: grid;
  gap: 12px;
}

.panel {
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  box-shadow: var(--shadow-sm);
  padding: 14px;
}

.rail {
  display: grid;
  gap: 12px;
}

.rail__panel {
  padding: 12px;
}

.rail__panel--muted {
  padding: 12px;
}

.rail__actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
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
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 45%, transparent 55%);
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

.user {
  display: flex;
  gap: 14px;
  align-items: center;
}

.user__name {
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
}

.user__account {
  margin-top: 2px;
  color: var(--text-200);
  font-size: 12px;
}

.user__id {
  margin-top: 4px;
  color: color-mix(in srgb, var(--text-200) 75%, transparent 25%);
  font-size: 12px;
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
    grid-template-columns: 320px 1fr;
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
  padding: 10px 0;
}

.kv + .kv {
  border-top: 1px dashed color-mix(in srgb, var(--bg-300) 45%, transparent 55%);
}

.kv__k {
  font-size: 12px;
  color: var(--text-200);
}

.kv__v {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-100);
}

.pref-list {
  display: flex;
  flex-direction: column;
}

.pref-row {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.pref-row:hover {
  background: color-mix(in srgb, var(--bg-200) 80%, transparent 20%);
}

.pref-row + .pref-row {
  margin-top: 6px;
}

.pref-row__title {
  font-weight: 800;
  font-size: 13px;
}

.pref-row__meta {
  font-size: 12px;
  color: var(--text-200);
}
</style>


