<!-- 布局：应用主框架（左侧导航栏/顶部栏/面包屑标题/主内容区 router-view） -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useUserStore, useThemeStore, type ThemeName } from '@/stores'
import { UserRole } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const isMobile = ref(false)
const sidebarCollapsed = ref(false)
const drawerOpen = ref(false)

function calcIsMobile() {
  isMobile.value = window.matchMedia('(max-width: 767px)').matches
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

onMounted(() => {
  themeStore.initTheme?.() || themeStore.setTheme?.('xuanZhi')
  calcIsMobile()
  window.addEventListener('resize', calcIsMobile)
})

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

const userRole = computed(() => userStore.userRole)
const isStudent = computed(() => userStore.isStudent)
const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const activeMenu = computed(() => {
  return route.path
})

// 学生菜单
const studentMenus = [
  { index: '/app/student/learning', icon: 'fluent-emoji:books', title: '课程中心' },
  { index: '/app/student/notes', icon: 'fluent-emoji:memo', title: '笔记管理' },
  { index: '/app/student/wrong-questions', icon: 'fluent-emoji:check-mark-button', title: '错题本' },
  { index: '/app/student/ai-assistant', icon: 'fluent-emoji:robot', title: 'AI助手' },
  { index: '/app/student/report', icon: 'fluent-emoji:chart-increasing', title: '学习报告' },
  { index: '/app/student/favorites', icon: 'fluent-emoji:star', title: '我的收藏' },
  { index: '/app/student/settings', icon: 'fluent-emoji:gear', title: '个人设置' },
]

// 教师菜单
const teacherMenus = [
  ...studentMenus,
  { index: '/app/teacher/courses', icon: 'fluent-emoji:school', title: '课程管理' },
  { index: '/app/teacher/students', icon: 'fluent-emoji:busts-in-silhouette', title: '学生管理' },
  { index: '/app/teacher/grading', icon: 'fluent-emoji:pencil', title: '作业批改' },
  { index: '/app/teacher/class-report', icon: 'fluent-emoji:clipboard', title: '班级报告' },
  { index: '/app/teacher/monitoring', icon: 'fluent-emoji:desktop-computer', title: '学情监控' },
]

// 管理员菜单
const adminMenus = [
  { index: '/app/admin/users', icon: 'fluent-emoji:busts-in-silhouette', title: '用户管理' },
  { index: '/app/admin/content-review', icon: 'fluent-emoji:magnifying-glass-tilted-left', title: '内容审核' },
  { index: '/app/admin/system-stats', icon: 'fluent-emoji:gear', title: '系统监控' },
]

// 通用菜单（兼容原有路由）
const commonMenus = [
  { index: '/app/courses', icon: 'fluent-emoji:house', title: '课程列表' },
  { index: '/app/exams', icon: 'fluent-emoji:calendar', title: '考试' },
  { index: '/app/wrongbook', icon: 'fluent-emoji:check-mark-button', title: '错题本' },
  { index: '/app/notes', icon: 'fluent-emoji:memo', title: '笔记' },
  { index: '/app/messages', icon: 'fluent-emoji:bell', title: '消息' },
  { index: '/app/profile', icon: 'fluent-emoji:bust-in-silhouette', title: '个人中心' },
]

// 当前角色菜单
const currentMenus = computed(() => {
  if (isStudent.value) return studentMenus
  if (isTeacher.value) return teacherMenus
  if (isAdmin.value) return adminMenus
  return commonMenus
})

// 最近访问数据
const recentAccess = [
  { name: 'Vue3入门', path: '/app/student/course/1', icon: 'fluent-emoji:books' },
  { name: '我的笔记', path: '/app/student/notes', icon: 'fluent-emoji:memo' },
  { name: '错题复习', path: '/app/student/wrong-questions', icon: 'fluent-emoji:check-mark-button' },
]
void recentAccess

// 学习进度（学生）或待办统计（教师/管理员）
const quickStats = computed(() => {
  if (isStudent.value) {
    return { label: '本周学习', value: '12小时', sub: '3门课程进行中' }
  } else if (isTeacher.value) {
    return { label: '待批改作业', value: '8份', sub: '来自3个班级' }
  } else {
    return { label: '待审核内容', value: '5项', sub: '2门课程+3条评论' }
  }
})
void quickStats

const themeOptions: Array<{ label: string; value: ThemeName }> = [
  { label: '水晶', value: 'crystal' },
  { label: '温暖', value: 'warm' },
  { label: '宣纸', value: 'xuanZhi' },
  { label: '落日', value: 'sunset' },
  { label: '经典白', value: 'classicWhite' },
  { label: '夜晚', value: 'night' },
]

function onThemeChange(v: ThemeName) {
  themeStore.setTheme(v)
}

function getThemeGradient(theme: ThemeName): string {
  const gradients: Record<ThemeName, string> = {
    crystal: 'linear-gradient(118deg, #2DD4BF 0%, #052523 52%, #A3E635 100%)',
    warm: 'linear-gradient(122deg, #FF6B4A 0%, #F8E6D6 55%, #166534 110%)',
    xuanZhi: 'linear-gradient(126deg, #0B6B3A 0%, #F3EBDD 58%, #9A3412 120%)',
    sunset: 'linear-gradient(116deg, #F97316 0%, #FFF0D6 55%, #10B981 120%)',
    classicWhite: 'linear-gradient(120deg, #d4eaf7 0%, #fffefb 55%, #71c4ef 120%)',
    night: 'linear-gradient(120deg, #7C3AED 0%, #0B1220 55%, #22D3EE 120%)',
  }
  return gradients[theme]
}

function toggleCollapse() {
  if (isMobile.value) {
    drawerOpen.value = true
    return
  }
  sidebarCollapsed.value = !sidebarCollapsed.value
}

async function onLogout() {
  await ElMessageBox.confirm('确认退出登录？', '退出登录', {
    type: 'warning',
    confirmButtonText: '退出',
    cancelButtonText: '取消',
  })
  userStore.logout()
  ElNotification({
    title: '已退出',
    message: '登录状态已清空',
    type: 'success',
    duration: 1800,
  })
  router.replace('/login')
}

function switchRole(role: UserRole) {
  userStore.loginByRole(role)
  ElNotification({
    title: '切换成功',
    message: `已切换到${role === UserRole.STUDENT ? '学生' : role === UserRole.TEACHER ? '教师' : '管理员'}角色`,
    type: 'success',
    duration: 1800,
  })
  router.push('/app/dashboard')
}
</script>



<template>
  <el-container class="shell">
    <el-aside v-if="!isMobile" class="aside" :class="{ 'aside--collapsed': sidebarCollapsed }">
      <div class="nav-panel" :class="{ 'nav-panel--collapsed': sidebarCollapsed }">
        <div class="nav-card">
          <div class="nav-card__head">
            <div class="nav-user" :class="{ 'nav-user--collapsed': sidebarCollapsed }">
              <div class="nav-avatar-wrap">
                <el-avatar :size="72" :src="userStore.currentUser?.avatar" class="nav-avatar" />
              </div>
              <div v-if="!sidebarCollapsed" class="nav-user__text">
                <div class="nav-user__name">{{ userStore.currentUser?.name }}</div>
                <div class="nav-user__role">{{ userRole === 'student' ? '学生' : userRole === 'teacher' ? '教师' : '管理员' }}</div>
              </div>
            </div>
          </div>

          <div class="nav-card__body">
            <div class="nav-menu-scroll">
              <el-menu
                class="aside__menu aside__menu--compact"
                :default-active="activeMenu"
                :collapse="sidebarCollapsed"
                router
                :collapse-transition="false"
              >
                <el-menu-item v-for="menu in currentMenus" :key="menu.index" :index="menu.index">
                  <Icon :icon="menu.icon" class="menu-icon" />
                  <span>{{ menu.title }}</span>
                </el-menu-item>
              </el-menu>
            </div>

            <div class="nav-card__foot">
              <button class="nav-collapse-btn" @click="toggleCollapse" :aria-label="sidebarCollapsed ? '展开菜单' : '收起菜单'">
                <span>{{ sidebarCollapsed ? '展开' : '收起' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </el-aside>

    <el-container class="main">
      <el-header class="header">
        <div class="header__left">
          <div class="header__brand" @click="router.push('/app/dashboard')" role="button" tabindex="0">
            <div class="header__logo">CM</div>
            <div class="header__brand-text">
              <div class="header__brand-name">学习中心</div>
              <div class="header__brand-sub">Course Platform</div>
            </div>
          </div>

          <button class="header__icon-btn header__panel-btn" @click="toggleCollapse" :aria-label="sidebarCollapsed ? '展开功能面板' : '收起功能面板'">
            <Icon :icon="sidebarCollapsed ? 'fluent-emoji:open-book' : 'fluent-emoji:closed-book'" />
          </button>

          <div class="header__breadcrumb">
            <div class="header__title">{{ String(route.meta.title ?? '课管平台') }}</div>
          </div>
        </div>

        <div class="header__right">
          <el-popover placement="bottom" width="160" trigger="click" popper-class="theme-popover">
            <template #reference>
              <button class="header__icon-btn header__theme-btn">
                <Icon icon="fluent-emoji:artist-palette" />
              </button>
            </template>

            <div class="theme-pop-compact">
              <div
                v-for="opt in themeOptions"
                :key="opt.value"
                class="theme-swatch"
                :class="{ active: themeStore.theme === opt.value }"
                @click="onThemeChange(opt.value)"
                :title="opt.label"
              >
                <div class="swatch-color" :style="{ background: getThemeGradient(opt.value) }"></div>
                <span class="swatch-label">{{ opt.label }}</span>
              </div>
            </div>
          </el-popover>

          <el-divider direction="vertical" />

          <button class="header__icon-btn" @click="router.push('/app/messages')">
            <Icon icon="fluent-emoji:memo" />
          </button>

          <el-popover
            placement="bottom-end"
            width="280"
            :trigger="isMobile ? 'click' : 'hover'"
            :show-after="isMobile ? 0 : 120"
            :hide-after="isMobile ? 0 : 120"
            popper-class="user-popover"
          >
            <template #reference>
              <div class="header__user">
                <el-avatar :size="34" :src="userStore.currentUser?.avatar" />
                <div class="header__user-text">
                  <div class="header__user-name">{{ userStore.currentUser?.name }}</div>
                  <div class="header__user-account">{{ userRole === 'student' ? '学生' : userRole === 'teacher' ? '教师' : '管理员' }}</div>
                </div>
              </div>
            </template>

            <div class="user-pop">
              <div class="user-pop__info">
                <el-avatar :size="50" :src="userStore.currentUser?.avatar" />
                <div class="user-pop__name">{{ userStore.currentUser?.name }}</div>
                <div class="user-pop__role">{{ userRole === 'student' ? '学生用户' : userRole === 'teacher' ? '教师用户' : '系统管理员' }}</div>
              </div>
              <el-divider />
              <div class="user-pop__section">
                <div class="user-pop__section-title">切换角色</div>
                <div class="user-pop__role-list">
                  <button
                    class="user-pop__role-item"
                    :class="{ active: userRole === 'student' }"
                    @click="switchRole('student')"
                  >
                    <Icon icon="fluent-emoji:books" />
                    学生
                  </button>
                  <button
                    class="user-pop__role-item"
                    :class="{ active: userRole === 'teacher' }"
                    @click="switchRole('teacher')"
                  >
                    <Icon icon="fluent-emoji:school" />
                    教师
                  </button>
                  <button
                    class="user-pop__role-item"
                    :class="{ active: userRole === 'admin' }"
                    @click="switchRole('admin')"
                  >
                    <Icon icon="fluent-emoji:gear" />
                    管理员
                  </button>
                </div>
              </div>
              <el-divider />
              <div class="user-pop__actions">
                <button class="user-pop__btn" @click="router.push('/app/profile')">
                  <Icon icon="fluent-emoji:pencil" />
                  个人中心
                </button>
                <button class="user-pop__btn" @click="onLogout">
                  <Icon icon="fluent-emoji:door" />
                  退出登录
                </button>
              </div>
            </div>
          </el-popover>
        </div>
      </el-header>

      <el-main class="content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <el-drawer
      v-model="drawerOpen"
      direction="ltr"
      size="82%"
      :with-header="false"
      class="mobile-drawer"
    >
      <div class="drawer">
        <div class="drawer__brand" @click="router.push('/app/dashboard')" role="button" tabindex="0">
          <div class="drawer__logo">
            <Icon icon="fluent-emoji:graduation-cap" />
          </div>
          <div>
            <div class="drawer__name">课程中心</div>
            <div class="drawer__desc">Course Platform</div>
          </div>
        </div>

        <div class="drawer__user">
          <el-avatar :size="46" :src="userStore.currentUser?.avatar" />
          <div class="drawer__user-text">
            <div class="drawer__user-name">{{ userStore.currentUser?.name }}</div>
            <div class="drawer__user-role">{{ userRole === 'student' ? '学生' : userRole === 'teacher' ? '教师' : '管理员' }}</div>
          </div>
          <button class="drawer__close" @click="drawerOpen = false" aria-label="关闭菜单">
            <Icon icon="fluent-emoji:cross-mark" />
          </button>
        </div>

        <el-menu class="drawer__menu" :default-active="activeMenu" router>
          <el-menu-item v-for="menu in currentMenus" :key="menu.index" :index="menu.index">
            <Icon :icon="menu.icon" class="menu-icon" />
            <span>{{ menu.title }}</span>
          </el-menu-item>
        </el-menu>
        <div class="drawer__footer" />
      </div>
    </el-drawer>
  </el-container>
</template>

<style scoped>
.shell {
  height: 100vh;
  padding: 12px;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--bg-200) 86%, #ffffff 14%);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
}

.aside {
  width: 232px;
  background: transparent;
  border-right: 0;
  transition: width 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 24px);
  border-right: 2px solid color-mix(in srgb, var(--bg-300) 70%, transparent 30%);
}

.aside--collapsed {
  width: 104px;
}

.nav-panel {
  height: 100%;
  padding: 0;
  transition: padding 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-card {
  height: 100%;
  border-radius: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 220ms ease, background 220ms ease;
}

.nav-card {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--bg-100) 30%, transparent 70%),
    transparent
  );
}

.nav-card__head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 16px 12px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
}

.aside--collapsed .nav-card__head {
  padding: 16px 10px 14px;
}

.aside--collapsed .nav-user {
  width: 100%;
  justify-content: center;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.nav-avatar-wrap {
  width: 84px;
  height: 84px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--primary-100) 10%, transparent);
  flex-shrink: 0;
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.aside--collapsed .nav-avatar-wrap {
  transform: scale(1);
}

.nav-avatar :deep(img),
.nav-avatar :deep(.el-avatar) {
  object-fit: cover;
}

.nav-avatar {
  border-radius: 16px;
}

.nav-user__text {
  min-width: 0;
}

.nav-user__name {
  font-weight: 800;
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-user__role {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-200);
}

.nav-toggle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.nav-toggle:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
}

.nav-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.aside__menu--compact {
  padding: 0;
  background: transparent;
  border-right: 0;
  padding-right: 0;
}

.nav-menu-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 10px 12px;
}

.nav-menu-scroll::-webkit-scrollbar {
  width: 10px;
}

.nav-menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.nav-menu-scroll::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--bg-300) 72%, transparent 28%);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.nav-menu-scroll:hover::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--primary-100) 35%, var(--bg-300) 65%);
  border: 3px solid transparent;
  background-clip: content-box;
}

.aside__menu {
  border-right: 0;
  background: transparent;
  padding: 26px 10px 18px;
  flex: 1;
  transition: padding 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.aside__menu.aside__menu--compact {
  padding: 0;
}

.aside__menu :deep(.el-menu) {
  height: 100%;
}

.nav-card__foot {
  padding: 12px 10px 14px;
}

.nav-collapse-btn {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-100);
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.nav-collapse-btn:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
}


.aside--collapsed .aside__menu {
  padding-left: 0;
  padding-right: 0;
}

.aside--collapsed .aside__menu--compact :deep(.el-menu-item) {
  justify-content: center;
  gap: 0;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.aside--collapsed .aside__menu--compact :deep(.el-menu-item .menu-icon) {
  margin: 0;
}

.aside__menu--compact :deep(.el-menu-item) {
  height: 56px;
  line-height: 56px;
  margin-bottom: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.aside__menu--compact :deep(.el-menu-item .menu-icon) {
  font-size: 22px;
  flex-shrink: 0;
}

.aside__menu--compact :deep(.el-menu-item span) {
  font-size: 15px;
  font-weight: 500;
}

[data-theme='night'] .aside__menu--compact :deep(.el-menu-item) {
  color: color-mix(in srgb, var(--text-100) 92%, #ffffff 8%);
}

[data-theme='night'] .aside__menu--compact :deep(.el-menu-item .menu-icon) {
  color: color-mix(in srgb, var(--text-100) 88%, #ffffff 12%);
}

[data-theme='night'] .aside__menu--compact :deep(.el-menu-item:hover) {
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-200) 90%);
}

[data-theme='night'] .aside__menu--compact :deep(.el-menu-item.is-active) {
  color: #ffffff;
  background: color-mix(in srgb, var(--primary-100) 20%, var(--bg-200) 80%);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
}

[data-theme='night'] .aside__menu--compact :deep(.el-menu-item.is-active .menu-icon) {
  color: #ffffff;
}

/* 自定义按钮样式 */
.btn-text {
  background: none;
  border: none;
  color: var(--primary-100);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-text:hover {
  background: color-mix(in srgb, var(--primary-100) 10%, transparent);
}

.header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}

.header__brand:hover {
  background: color-mix(in srgb, var(--bg-200) 82%, #ffffff 18%);
}

.header__logo {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 14px;
  color: var(--text-100);
  background: linear-gradient(135deg, var(--primary-100), color-mix(in srgb, var(--accent-100) 68%, var(--primary-100) 32%));
  box-shadow: var(--shadow-sm);
}

.header__brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.header__brand-name {
  font-weight: 900;
  font-size: 14px;
}

.header__brand-sub {
  font-size: 12px;
  color: var(--text-200);
}

.header__panel-btn {
  margin-left: 6px;
}

.drawer__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 6px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
}

.drawer__user-text {
  flex: 1;
  min-width: 0;
}

.drawer__user-name {
  font-weight: 900;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drawer__user-role {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-200);
}

.drawer__close {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.user-pop__section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-200);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.user-pop__role-list {
  display: grid;
  gap: 8px;
}

.user-pop__role-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  color: var(--text-100);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.user-pop__role-item:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--primary-100) 45%, var(--bg-300) 55%);
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
}

.user-pop__role-item.active {
  border-color: color-mix(in srgb, var(--primary-100) 72%, var(--bg-300) 28%);
  background: color-mix(in srgb, var(--primary-100) 12%, var(--bg-100) 88%);
}

.user-pop__role-item :deep(svg),
.user-pop__role-item :deep(span) {
  flex-shrink: 0;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: var(--bg-200);
  border: 1px solid var(--bg-300);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-100);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action-btn:hover {
  background: var(--bg-300);
  transform: translateY(-1px);
}

.recent-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* 退出按钮 */
.aside__logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-200);
  border: none;
  border-radius: 12px;
  font-size: 15px;
  color: var(--text-100);
  cursor: pointer;
  transition: all 0.2s ease;
}

.aside__logout:hover {
  background: var(--bg-300);
  color: var(--primary-100);
}

.aside__logout--icon {
  justify-content: center;
  padding: 12px;
}

/* 头部按钮 */
.header__icon-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header__icon-btn:hover {
  background: var(--bg-200);
  transform: scale(1.05);
}

.header__icon-btn:active {
  transform: scale(0.95);
}

/* 用户弹窗按钮 */
.user-pop__btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-200);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-100);
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-pop__btn:hover {
  background: var(--bg-300);
}

:deep(.user-popover) {
  --el-popover-padding: 0px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  box-shadow: 0 22px 65px rgba(0, 0, 0, 0.20);
  backdrop-filter: blur(12px);
  transform-origin: top right;
  animation: userPopIn 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme='night'] :deep(.user-popover) {
  box-shadow: 0 28px 75px rgba(0, 0, 0, 0.42);
  border-color: color-mix(in srgb, var(--bg-300) 75%, transparent 25%);
}

@keyframes userPopIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* 移动端菜单图标 */
.drawer__menu :deep(.el-menu-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
}

.drawer__menu :deep(.el-menu-item .menu-icon) {
  font-size: 22px;
}

/* 移动端退出按钮 */
.drawer__logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: var(--primary-100);
  color: var(--bg-100);
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drawer__logout:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.aside__stats {
  padding: 8px 12px;
}

.stats-card {
  background: linear-gradient(135deg, var(--primary-100), color-mix(in srgb, var(--accent-100) 80%, var(--primary-100) 20%));
  border-radius: 14px;
  padding: 16px;
  color: white;
}

.stats-card__label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 6px;
}

.stats-card__value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.stats-card__sub {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 4px;
}

.aside__recent,
.aside__quick-actions {
  padding: 8px 12px;
}

.aside__section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-200);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-100);
  transition: background 0.2s;
}

.recent-item:hover {
  background: var(--bg-300);
}

.recent-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quick-actions-grid .el-button {
  justify-content: center;
  padding: 8px;
  font-size: 14px;
}

.quick-actions-grid .el-icon {
  margin-right: 4px;
}

.aside__footer {
  padding: 12px 16px 14px;
}

.aside__footer--collapsed {
  display: grid;
  place-items: center;
}

.aside__logout {
  width: 100%;
  justify-content: flex-start;
  border-radius: 12px;
  height: 44px;
  font-size: 15px;
}

.aside__section {
  padding: 12px 16px 0;
}

.aside__section-title {
  font-size: 13px;
  color: var(--text-200);
  margin-bottom: 10px;
}

.aside__role-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.aside__role-btns .el-button {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  padding: 6px 10px;
}

.main {
  min-width: 0;
  height: calc(100vh - 24px);
}

.header {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  margin: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  border-bottom: 2px solid color-mix(in srgb, var(--bg-300) 70%, transparent 30%);
}

.header__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header__icon-btn {
  border-radius: 12px;
  width: 38px;
  height: 38px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast), background-color var(--transition-fast);
}

.header__icon-btn:active {
  transform: scale(0.96);
}

.header__breadcrumb {
  min-width: 0;
}

.header__title {
  font-weight: 800;
  font-size: 14px;
  line-height: 1.2;
}

.header__sub {
  font-size: 12px;
  color: var(--text-200);
  margin-top: 2px;
}

.header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-pop-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 4px;
}

.theme-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.theme-swatch:hover {
  background: var(--bg-200);
}

.theme-swatch.active {
  border-color: var(--primary-100);
  background: color-mix(in srgb, var(--primary-100) 10%, transparent 90%);
}

.swatch-color {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}

.theme-swatch:hover .swatch-color {
  transform: scale(1.05);
}

.swatch-label {
  font-size: 11px;
  color: var(--text-100);
  font-weight: 500;
}

.theme-pop {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.theme-pop__title {
  font-size: 12px;
  color: var(--text-200);
}

.theme-pop__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.theme-pop__group :deep(.el-radio) {
  margin-right: 0;
}

.header__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.header__user:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.header__user-text {
  display: none;
}

.header__user-name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.header__user-account {
  font-size: 12px;
  color: var(--text-200);
  margin-top: 1px;
}

.content {
  padding: 16px;
}

.aside__section {
  padding: 10px 16px 0;
}

.aside__section-title {
  font-size: 12px;
  color: var(--text-200);
  margin-bottom: 10px;
}

.aside__role-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.user-pop__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.user-pop__name {
  font-size: 16px;
  font-weight: 700;
  margin-top: 10px;
}

.user-pop__role {
  font-size: 12px;
  color: var(--text-200);
  margin-top: 4px;
}

.user-pop__actions {
  display: grid;
  gap: 10px;
}

.user-pop__btn {
  width: 100%;
  justify-content: flex-start;
  border-radius: 12px;
}

.drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 12px;
}

.drawer__logo {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: var(--text-100);
  background: linear-gradient(135deg, var(--primary-100), color-mix(in srgb, var(--accent-100) 68%, var(--primary-100) 32%));
}

.drawer__name {
  font-weight: 800;
  font-size: 14px;
}

.drawer__desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-200);
}

.drawer__menu {
  border-right: 0;
  padding: 6px 6px;
  flex: 1;
}

.drawer__footer {
  padding: 12px;
}

.drawer__logout {
  width: 100%;
  border-radius: 14px;
}

@media (min-width: 1024px) {
  .content {
    padding: 18px 20px;
  }

  .header__user-text {
    display: block;
  }
}
</style>



