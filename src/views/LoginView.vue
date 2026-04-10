<!-- 页面：登录；路由：/login（login） -->

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ICONS } from '@/constants/icons'
import { useUserStore } from '@/stores'
import { UserRole } from '@/types'
import { gsap } from '@/plugins/gsap'
import BrushText from '@/components/book/BrushText.vue'
import SealStamp from '@/components/book/SealStamp.vue'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const selectedRole = ref<UserRole>(UserRole.STUDENT)
const loading = ref(false)
const showPassword = ref(false)

const roleTabs = [
  { role: UserRole.STUDENT, icon: ICONS.graduationCap, label: '学生', color: '#10B981' },
]

const quickLogins = [
  { role: UserRole.STUDENT, account: 'student001', name: '学生体验' },
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

/* ===== 卷轴展开 + 入场动画 ===== */
const pageRef = ref<HTMLElement | null>(null)
const scrollReady = ref(false)
let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (!pageRef.value) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    scrollReady.value = true
    return
  }

  ctx = gsap.context(() => {
    const tl = gsap.timeline({ delay: 0.15 })

    /* 卷轴外框展开 */
    tl.fromTo('.login-scroll', {
      scaleY: 0, opacity: 0,
    }, {
      scaleY: 1, opacity: 1,
      duration: 0.8, ease: 'power2.inOut',
      onComplete: () => { scrollReady.value = true },
    })

    /* 左侧品牌区内容交错淡入 */
    tl.from('.brand-animate', {
      opacity: 0, y: 14,
      stagger: 0.08, duration: 0.4, ease: 'power2.out',
    }, '-=0.2')

    /* 右侧表单区 */
    tl.from('.form-animate', {
      opacity: 0, y: 10,
      stagger: 0.06, duration: 0.35, ease: 'power2.out',
    }, '-=0.3')
  }, pageRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>





<template>
  <div ref="pageRef" class="login-page">

    <!-- 卷轴式主容器 -->
    <div class="login-scroll">
      <div class="login-inner">
        <!-- ===== 左侧：品牌/诗文区 ===== -->
        <div class="login-brand-side">
          <div class="brand-content">
            <div class="brand-animate brand-badge">
              <SealStamp text="职" :size="36" shape="square" :delay="0.9" />
              <span>AI 职涯规划</span>
            </div>

            <BrushText text="识途" tag="h1" class="brand-animate brand-title" :delay="1.0" :stagger="0.14" :duration="0.6" />

            <p class="brand-animate brand-subtitle">大学生职业规划智能体</p>

            <div class="brand-animate entry-list">
              <div class="entry-item">
                <span class="entry-tag"></span>
                <div class="entry-body">
                  <span class="entry-name">能力图谱</span>
                  <span class="entry-desc">量化 6 维度职业能力，定位真实短板</span>
                </div>
              </div>
              <div class="entry-item">
                <span class="entry-tag"></span>
                <div class="entry-body">
                  <span class="entry-name">岗位匹配</span>
                  <span class="entry-desc">解析简历，精准推荐目标岗位</span>
                </div>
              </div>
              <div class="entry-item">
                <span class="entry-tag"></span>
                <div class="entry-body">
                  <span class="entry-name">路径规划</span>
                  <span class="entry-desc">课程 → 实践 → 求职的可执行时间线</span>
                </div>
              </div>
              <div class="entry-item">
                <span class="entry-tag"></span>
                <div class="entry-body">
                  <span class="entry-name">简历诊断</span>
                  <span class="entry-desc">对标具体岗位，给出差距与补足建议</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 竖排装饰 -->
          <div class="brand-vertical">知行</div>
        </div>

        <!-- 装订线 -->
        <div class="login-binding"></div>

        <!-- ===== 右侧：登录表单 ===== -->
        <div class="login-form-side">
          <div class="form-card">
            <!-- 四角花纹 -->
            <span class="form-corner form-corner--tl"></span>
            <span class="form-corner form-corner--br"></span>

            <h2 class="form-animate form-title">进入系统</h2>

            <!-- 角色切换 -->
            <div class="form-animate role-tabs">
              <button
                v-for="tab in roleTabs"
                :key="tab.role"
                class="role-tab"
                :class="{ active: selectedRole === tab.role }"
                @click="selectedRole = tab.role"
              >
                <Icon :icon="tab.icon" class="tab-icon" />
                <span>{{ tab.label }}</span>
              </button>
            </div>

            <!-- 输入框 -->
            <div class="form-animate input-group">
              <div class="input-wrap">
                <Icon :icon="ICONS.user" class="input-icon" />
                <input v-model="username" type="text" placeholder="账号" class="custom-input" @keydown.enter="handleLogin" />
              </div>
              <div class="input-wrap">
                <Icon :icon="ICONS.lock" class="input-icon" />
                <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="密码" class="custom-input" @keydown.enter="handleLogin" />
                <button class="password-toggle" @click="showPassword = !showPassword">
                  <Icon :icon="showPassword ? ICONS.eye : ICONS.eyeOff" />
                </button>
              </div>
            </div>

            <!-- 登录按钮 -->
            <button class="form-animate login-btn" :class="{ loading }" :disabled="loading" @click="handleLogin">
              <span v-if="!loading">立即登录 <Icon icon="lucide:arrow-right" class="btn-icon" /></span>
              <span v-else>登录中...</span>
            </button>

            <!-- 快速体验 -->
            <div class="form-animate quick-section">
              <div class="quick-divider"><span>或快速体验</span></div>
              <div class="quick-buttons">
                <button v-for="item in quickLogins" :key="item.role" class="quick-btn" @click="quickLogin(item.role, item.account)">
                  演示账号
                </button>
              </div>
            </div>

            <!-- 提示 -->
            <div class="form-animate login-hint">
              <Icon :icon="ICONS.lightbulb" class="hint-icon" />
              <span>演示账号密码均为 123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ 古籍卷轴登录页 ═══ */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  position: relative;
  overflow: hidden;
}

/* 卷轴式主容器 */
.login-scroll {
  width: min(1040px, 100%);
  border: 1px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  background: var(--color-surface-raised);
  position: relative;
  z-index: 1;
  transform-origin: center center;
  box-shadow: var(--shadow-lg);
}

/* 卷轴上下轴 */
.login-scroll::before,
.login-scroll::after {
  content: '';
  display: block;
  height: 8px;
  background: linear-gradient(to right,
    var(--vermilion-700),
    var(--vermilion-500) 30%,
    var(--gold-500) 50%,
    var(--vermilion-500) 70%,
    var(--vermilion-700)
  );
}

.login-inner {
  display: grid;
  grid-template-columns: 1fr 3px 1fr;
  min-height: 520px;
}

/* ===== 左侧品牌区 ===== */
.login-brand-side {
  position: relative;
  padding: 40px 36px;
  background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface) 96%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid var(--color-border);
}

.brand-content {
  position: relative;
  z-index: 2;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--primary-100);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-title);
  letter-spacing: 0.1em;
  margin-bottom: 24px;
}

.brand-title {
  font-size: clamp(36px, 5vw, 52px);
  line-height: 1.2;
  color: var(--text-100);
  margin: 0 0 20px;
  letter-spacing: 0.06em;
}

.brand-subtitle {
  font-size: 13px;
  font-family: var(--font-ui);
  color: var(--color-text-muted);
  letter-spacing: 0.12em;
  margin: 0 0 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.entry-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
}

.entry-item:last-child { border-bottom: none; }

.entry-tag {
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  flex-shrink: 0;
  margin-top: 6px;
}

.entry-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entry-name {
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-title);
  color: var(--color-text);
  letter-spacing: 0.04em;
}

.entry-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-ui);
  line-height: 1.5;
}

/* 竖排装饰文字 */
.brand-vertical {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  font-family: var(--font-brush);
  font-size: 20px;
  color: color-mix(in srgb, var(--primary-100) 15%, transparent 85%);
  letter-spacing: 0.6em;
  pointer-events: none;
  user-select: none;
}

/* 装订线 */
.login-binding {
  background: linear-gradient(to bottom,
    transparent 0%,
    var(--color-gold) 20%,
    var(--color-primary) 50%,
    var(--color-gold) 80%,
    transparent 100%
  );
  opacity: 0.5;
  width: 1px !important;
}

/* ===== 右侧表单区 ===== */
.login-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}

.form-card {
  width: 100%;
  max-width: 360px;
  position: relative;
}

/* 四角花纹 */
.form-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--color-gold);
  border-style: solid;
  pointer-events: none;
  opacity: 0.6;
}
.form-corner--tl { top: -8px; left: -8px; border-width: 2px 0 0 2px; }
.form-corner--br { bottom: -8px; right: -8px; border-width: 0 2px 2px 0; }

.form-title {
  font-size: 22px;
  font-weight: 600;
  font-family: var(--font-title);
  letter-spacing: 0.1em;
  color: var(--text-100);
  margin: 0 0 28px;
  text-align: center;
}

/* 角色标签 */
.role-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
}

.role-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  background: var(--bg-200);
  border: 1px solid var(--bg-300);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  color: var(--text-200);
}

.role-tab:hover { background: var(--bg-300); }

.role-tab.active {
  background: var(--bg-100);
  border-bottom-color: var(--primary-100);
  color: var(--primary-100);
  font-weight: 600;
}

.tab-icon { font-size: 20px; }

/* 输入框 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  font-size: 18px;
  color: var(--text-200);
  pointer-events: none;
}

.custom-input {
  width: 100%;
  padding: 11px 14px 11px 44px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: var(--font-ui);
  color: var(--color-text);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.custom-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-surface-raised);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 15%, transparent 85%);
}

.custom-input::placeholder { color: var(--text-300); }

.password-toggle {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.password-toggle:hover { opacity: 1; }

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 14px;
  background: var(--primary-100);
  color: var(--bg-100);
  border: 2px solid var(--primary-100);
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-title);
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover:not(:disabled) {
  background: transparent;
  color: var(--primary-100);
}

.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-icon { font-size: 16px; }

/* 快速体验 */
.quick-section { margin-top: 20px; }

.quick-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--text-300);
}

.quick-divider::before,
.quick-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--bg-300);
}

.quick-buttons { display: flex; gap: 8px; }

.quick-btn {
  flex: 1;
  padding: 9px 6px;
  background: var(--bg-200);
  border: 1px solid var(--bg-300);
  font-size: 12px;
  color: var(--text-200);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-200));
  color: var(--primary-100);
}

/* 提示 */
.login-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px;
  border-left: 3px solid var(--primary-100);
  font-size: 12px;
  color: var(--text-300);
}

.hint-icon { font-size: 14px; }

/* ═══ 响应式 ═══ */
@media (max-width: 768px) {
  .login-page { padding: 16px; }

  .login-inner {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }

  .login-binding { display: none; }

  .login-brand-side {
    padding: 28px 24px;
  }

  .brand-vertical { display: none; }

  .entry-list { gap: 0; }

  .login-form-side {
    padding: 28px 24px;
  }

  .form-card { max-width: 100%; }
}

@media (max-width: 480px) {
  .brand-title { font-size: 32px; }
  .entry-desc { font-size: 10px; }
}
</style>

