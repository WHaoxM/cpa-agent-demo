<!-- 页面：登录；路由：/login（login） -->

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ICONS } from '@/constants/icons'
import { useUserStore } from '@/stores'
import { UserRole } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const selectedRole = ref<UserRole>(UserRole.STUDENT)
const loading = ref(false)
const showPassword = ref(false)

const roleTabs = [
  { role: UserRole.STUDENT, icon: ICONS.graduationCap, label: '学生', color: '#10B981' },
  { role: UserRole.TEACHER, icon: ICONS.bookOpen, label: '教师', color: '#F59E0B' },
  { role: UserRole.ADMIN, icon: ICONS.shield, label: '管理', color: '#EF4444' },
]

const quickLogins = [
  { role: UserRole.STUDENT, account: 'student001', name: '学生体验' },
  { role: UserRole.TEACHER, account: 'teacher001', name: '教师体验' },
  { role: UserRole.ADMIN, account: 'admin001', name: '管理体验' },
]

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    ElMessage.warning('填个账号密码呗')
    return
  }

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  const success = userStore.login(username.value, password.value, selectedRole.value)

  if (success) {
    ElMessage.success('进来了！')
    router.push('/app/dashboard')
  } else {
    ElMessage.error('账号或密码不对（默认：123456）')
  }

  loading.value = false
}

function quickLogin(role: UserRole, account: string) {
  username.value = account
  password.value = '123456'
  selectedRole.value = role
  handleLogin()
}
</script>





<template>
  <div class="login-page">
    <!-- 左侧品牌区 - 占 60% -->
    <div class="login-brand-side">
      <div class="brand-content">
        <div class="brand-badge">
          <Icon :icon="ICONS.sparkles" />
          <span>课程管理系统</span>
        </div>
        <h1 class="brand-title">
          学习
          <br />
          <span class="title-emp">不费劲</span>
        </h1>
        <p class="brand-desc">
          数据可视化。
          <br />
          AI 辅助。
          <br />
          进度追踪。
        </p>
        
        <div class="feature-list">
          <div class="feature-item">
            <Icon :icon="ICONS.trendingUp" class="feature-icon" />
            <span>学习数据一目了然</span>
          </div>
          <div class="feature-item">
            <Icon :icon="ICONS.bot" class="feature-icon" />
            <span>AI 答疑随时在线</span>
          </div>
          <div class="feature-item">
            <Icon :icon="ICONS.smartphone" class="feature-icon" />
            <span>多端同步随时学</span>
          </div>
        </div>
      </div>
      
      <!-- 装饰元素 -->
      <div class="brand-deco">
        <div class="deco-blob" />
        <div class="deco-ring" />
        <div class="deco-dots" />
      </div>
    </div>

    <!-- 右侧登录区 - 占 40% -->
    <div class="login-form-side">
      <div class="form-card">
        <h2 class="form-title">欢迎回来</h2>
        
        <!-- 角色切换标签 -->
        <div class="role-tabs">
          <button
            v-for="tab in roleTabs"
            :key="tab.role"
            class="role-tab"
            :class="{ active: selectedRole === tab.role }"
            :style="selectedRole === tab.role ? { '--tab-color': tab.color } : {}"
            @click="selectedRole = tab.role"
          >
            <Icon :icon="tab.icon" class="tab-icon" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- 输入框 -->
        <div class="input-group">
          <div class="input-wrap">
            <Icon :icon="ICONS.user" class="input-icon" />
            <input
              v-model="username"
              type="text"
              placeholder="账号"
              class="custom-input"
              @keydown.enter="handleLogin"
            />
          </div>
          
          <div class="input-wrap">
            <Icon :icon="ICONS.lock" class="input-icon" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="密码"
              class="custom-input"
              @keydown.enter="handleLogin"
            />
            <button class="password-toggle" @click="showPassword = !showPassword">
              <Icon :icon="showPassword ? ICONS.eye : ICONS.eyeOff" />
            </button>
          </div>
        </div>

        <!-- 登录按钮 -->
        <button
          class="login-btn"
          :class="{ loading }"
          :disabled="loading"
          @click="handleLogin"
        >
          <span v-if="!loading">
            立即登录
            <Icon :icon="ICONS.rocket" class="btn-icon" />
          </span>
          <span v-else>登录中...</span>
        </button>

        <!-- 快速体验 -->
        <div class="quick-section">
          <div class="quick-divider">
            <span>或者快速体验</span>
          </div>
          
          <div class="quick-buttons">
            <button
              v-for="item in quickLogins"
              :key="item.role"
              class="quick-btn"
              @click="quickLogin(item.role, item.account)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>

        <!-- 提示 -->
        <div class="login-hint">
          <Icon :icon="ICONS.lightbulb" class="hint-icon" />
          <span>默认密码都是 123456</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  background: var(--bg-100);
  position: relative;
  overflow: hidden;
}

/* 噪点纹理 */
.login-page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: var(--noise-opacity, 0.08);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
}

/* 左侧品牌区 */
.login-brand-side {
  position: relative;
  z-index: 1;
  background: 
    radial-gradient(ellipse 100% 100% at 0% 0%, color-mix(in srgb, var(--primary-100) 20%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse 80% 80% at 100% 100%, color-mix(in srgb, var(--accent-100) 15%, transparent) 0%, transparent 40%);
  display: flex;
  align-items: center;
  padding: 60px 80px;
  overflow: hidden;
}

.brand-content {
  position: relative;
  z-index: 2;
  max-width: 480px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: color-mix(in srgb, var(--primary-100) 12%, transparent);
  color: var(--primary-100);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 32px;
}

.brand-title {
  font-size: 64px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-100);
  margin: 0 0 24px;
  letter-spacing: -0.03em;
}

.title-emp {
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--accent-100) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-desc {
  font-size: 20px;
  color: var(--text-200);
  line-height: 1.8;
  margin: 0 0 48px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: var(--text-200);
}

.feature-icon {
  font-size: 24px;
}

/* 装饰元素 */
.brand-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-blob {
  position: absolute;
  width: 400px;
  height: 400px;
  background: color-mix(in srgb, var(--primary-100) 8%, transparent);
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  top: -100px;
  right: -100px;
  animation: blob 20s ease-in-out infinite;
}

.deco-ring {
  position: absolute;
  width: 300px;
  height: 300px;
  border: 3px solid color-mix(in srgb, var(--accent-100) 30%, transparent);
  border-radius: 50%;
  bottom: 10%;
  right: 10%;
  animation: rotate 30s linear infinite;
}

.deco-dots {
  position: absolute;
  width: 200px;
  height: 200px;
  background-image: radial-gradient(circle, var(--text-200) 2px, transparent 2px);
  background-size: 24px 24px;
  opacity: 0.3;
  bottom: 20%;
  left: 10%;
}

@keyframes blob {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 右侧表单区 */
.login-form-side {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 60px 40px;
}

.form-card {
  width: 100%;
  max-width: 400px;
  background: color-mix(in srgb, var(--bg-100) 92%, white 8%);
  border: 1px solid var(--bg-300);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 
    0 20px 60px color-mix(in srgb, var(--primary-100) 10%, transparent),
    0 0 0 1px color-mix(in srgb, var(--bg-300) 50%, transparent);
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-100);
  margin: 0 0 32px;
  text-align: center;
}

/* 角色标签 */
.role-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.role-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--bg-200);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-size: 13px;
  color: var(--text-200);
}

.role-tab:hover {
  transform: translateY(-2px);
  background: var(--bg-300);
}

.role-tab.active {
  background: color-mix(in srgb, var(--tab-color) 10%, var(--bg-100));
  border-color: var(--tab-color);
  color: var(--tab-color);
  font-weight: 600;
}

.tab-icon {
  font-size: 24px;
}

/* 输入框 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 20px;
  color: var(--text-200);
  pointer-events: none;
}

.custom-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  background: var(--bg-200);
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 15px;
  color: var(--text-100);
  transition: all 0.2s ease;
}

.custom-input:focus {
  outline: none;
  border-color: var(--primary-100);
  background: var(--bg-100);
}

.custom-input::placeholder {
  color: var(--text-200);
}

.password-toggle {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.password-toggle:hover {
  opacity: 1;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 16px;
  background: var(--primary-100);
  color: var(--bg-100);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--primary-100) 40%, transparent);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
}

/* 快速体验区 */
.quick-section {
  margin-top: 24px;
}

.quick-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-200);
}

.quick-divider::before,
.quick-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--bg-300);
}

.quick-buttons {
  display: flex;
  gap: 8px;
}

.quick-btn {
  flex: 1;
  padding: 10px 8px;
  background: var(--bg-200);
  border: 1px solid var(--bg-300);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-200);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: var(--bg-300);
  color: var(--text-100);
  transform: translateY(-1px);
}

/* 提示 */
.login-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  padding: 12px;
  background: color-mix(in srgb, var(--accent-100) 8%, transparent);
  border-radius: 8px;
  font-size: 13px;
  color: var(--accent-100);
}

.hint-icon {
  font-size: 16px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .login-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .login-brand-side {
    padding: 40px 32px;
    min-height: auto;
  }
  
  .brand-title {
    font-size: 48px;
  }
  
  .brand-desc {
    font-size: 18px;
    margin-bottom: 32px;
  }
  
  .feature-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .login-form-side {
    padding: 32px;
    justify-content: center;
  }
  
  .form-card {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .login-brand-side {
    padding: 32px 24px;
  }
  
  .brand-title {
    font-size: 36px;
  }
  
  .brand-desc {
    font-size: 16px;
  }
  
  .feature-item span {
    font-size: 14px;
  }
  
  .login-form-side {
    padding: 24px;
  }
  
  .form-card {
    padding: 28px 24px;
    border-radius: 20px;
  }
  
  .form-title {
    font-size: 24px;
    margin-bottom: 24px;
  }
  
  .role-tab {
    padding: 10px 6px;
    font-size: 12px;
  }
  
  .tab-icon {
    font-size: 20px;
  }
}

/* ═══ CYBER NEXUS 主题覆盖 ═══ */
[data-theme='cyberNexus'] .login-page {
  background: #0a0e14;
}
[data-theme='cyberNexus'] .login-page::before {
  opacity: 0;
}
[data-theme='cyberNexus'] .login-brand-side {
  background:
    radial-gradient(ellipse 100% 100% at 0% 0%, rgba(0, 229, 198, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 80% 80% at 100% 100%, rgba(255, 45, 106, 0.06) 0%, transparent 40%);
}
[data-theme='cyberNexus'] .brand-badge {
  background: rgba(0, 229, 198, 0.08);
  color: #00e5c6;
  border: 1px solid rgba(0, 229, 198, 0.2);
  border-radius: 2px;
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
}
[data-theme='cyberNexus'] .brand-title {
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.02em;
}
[data-theme='cyberNexus'] .title-emp {
  background: linear-gradient(135deg, #00e5c6 0%, #ff2d6a 100%);
  -webkit-background-clip: text;
  background-clip: text;
}
[data-theme='cyberNexus'] .brand-desc {
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.04em;
}
[data-theme='cyberNexus'] .feature-item {
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.04em;
}
[data-theme='cyberNexus'] .feature-icon {
  color: #00e5c6;
}
[data-theme='cyberNexus'] .deco-blob {
  background: rgba(0, 229, 198, 0.04);
  border-radius: 0;
  animation: none;
  border: 1px solid rgba(0, 229, 198, 0.06);
}
[data-theme='cyberNexus'] .deco-ring {
  border: 1px solid rgba(0, 229, 198, 0.08);
  border-radius: 0;
  transform: rotate(45deg);
  animation: none;
}
[data-theme='cyberNexus'] .deco-dots {
  background-image: 
    linear-gradient(rgba(0, 229, 198, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 229, 198, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.6;
}
[data-theme='cyberNexus'] .form-card {
  background: rgba(17, 24, 32, 0.85);
  border: 1px solid rgba(0, 229, 198, 0.12);
  border-radius: 2px;
  box-shadow: 0 0 40px rgba(0, 229, 198, 0.06);
  backdrop-filter: blur(12px);
  position: relative;
}
[data-theme='cyberNexus'] .form-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 198, 0.3), transparent);
  pointer-events: none;
}
[data-theme='cyberNexus'] .form-title {
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 20px;
}
[data-theme='cyberNexus'] .role-tab {
  background: rgba(0, 229, 198, 0.03);
  border: 1px solid rgba(0, 229, 198, 0.08);
  border-radius: 2px;
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 11px;
  transition: all 0.15s;
}
[data-theme='cyberNexus'] .role-tab:hover {
  transform: none;
  background: rgba(0, 229, 198, 0.06);
  border-color: rgba(0, 229, 198, 0.15);
}
[data-theme='cyberNexus'] .role-tab.active {
  background: rgba(0, 229, 198, 0.08);
  border-color: #00e5c6;
  color: #00e5c6;
  box-shadow: 0 0 12px rgba(0, 229, 198, 0.1);
  --tab-color: #00e5c6 !important;
}
[data-theme='cyberNexus'] .custom-input {
  background: rgba(10, 14, 20, 0.8);
  border: 1px solid rgba(0, 229, 198, 0.1);
  border-radius: 2px;
  font-family: var(--cyber-font-mono);
  color: var(--text-100);
  letter-spacing: 0.04em;
}
[data-theme='cyberNexus'] .custom-input:focus {
  border-color: rgba(0, 229, 198, 0.4);
  background: rgba(10, 14, 20, 0.9);
  box-shadow: 0 0 8px rgba(0, 229, 198, 0.15);
}
[data-theme='cyberNexus'] .custom-input::placeholder {
  color: rgba(107, 138, 142, 0.5);
}
[data-theme='cyberNexus'] .input-icon { color: rgba(0, 229, 198, 0.4); }
[data-theme='cyberNexus'] .password-toggle { color: rgba(0, 229, 198, 0.4); }

[data-theme='cyberNexus'] .login-btn {
  background: rgba(0, 229, 198, 0.12);
  color: #00e5c6;
  border: 1px solid rgba(0, 229, 198, 0.35);
  border-radius: 2px;
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 13px;
  transition: all 0.15s;
}
[data-theme='cyberNexus'] .login-btn:hover:not(:disabled) {
  transform: none;
  background: rgba(0, 229, 198, 0.2);
  border-color: rgba(0, 229, 198, 0.5);
  box-shadow: 0 0 20px rgba(0, 229, 198, 0.2);
  color: #00ffcc;
}
[data-theme='cyberNexus'] .quick-divider {
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 10px;
}
[data-theme='cyberNexus'] .quick-divider::before,
[data-theme='cyberNexus'] .quick-divider::after {
  background: rgba(0, 229, 198, 0.1);
}
[data-theme='cyberNexus'] .quick-btn {
  background: rgba(0, 229, 198, 0.04);
  border: 1px solid rgba(0, 229, 198, 0.1);
  border-radius: 2px;
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 11px;
  transition: all 0.15s;
}
[data-theme='cyberNexus'] .quick-btn:hover {
  background: rgba(0, 229, 198, 0.08);
  border-color: rgba(0, 229, 198, 0.25);
  color: #00e5c6;
  transform: none;
}
[data-theme='cyberNexus'] .login-hint {
  background: rgba(255, 45, 106, 0.06);
  border: 1px solid rgba(255, 45, 106, 0.12);
  border-radius: 2px;
  color: #ff2d6a;
  font-family: var(--cyber-font-mono);
  letter-spacing: 0.04em;
  font-size: 11px;
}
</style>
