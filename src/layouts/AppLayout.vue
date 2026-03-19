<!-- 布局：应用主框架（左侧导航栏/顶部栏/面包屑标题/主内容区 router-view） -->
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Icon } from '@iconify/vue'
import { ICONS } from '@/constants/icons'
import { useUserStore, useThemeStore } from '@/stores'
import { UserRole } from '@/types'
import BookSpine from '@/components/book/BookSpine.vue'
import BookPage from '@/components/book/BookPage.vue'
import { gsap } from '@/plugins/gsap'

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

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
    if (isImmersiveRoute.value) {
      sidebarCollapsed.value = true
    }
  },
)

const userRole = computed(() => userStore.userRole)
const isStudent = computed(() => userStore.isStudent)
const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const activeMenu = computed(() => {
  return route.path
})

const isImmersiveRoute = computed(() => Boolean(route.meta.immersive))

const breadcrumbs = computed(() => {
  const items = route.matched
    .map(r => String(r.meta.title ?? ''))
  .filter(Boolean)
  if (items.length === 0) return ['课程管理系统']
  if (route.path.startsWith('/app')) {
    return ['应用', ...items]
  }
  return items
})

// 学生菜单
const studentMenus = [
  { index: '/app/student/learning', icon: ICONS.bookOpen, title: '学习中心' },
  { index: '/app/student/knowledge-graph', icon: ICONS.network, title: '知识图谱' },
  { index: '/app/student/skills', icon: ICONS.layers, title: '技能管理' },
  { index: '/app/student/ai-assistant', icon: ICONS.bot, title: 'AI助手' },
  { index: '/app/student/report', icon: ICONS.trendingUp, title: '学习报告' },
  { index: '/app/student/career', icon: ICONS.compass, title: '职业发展中心' },
  { index: '/app/student/career-analysis', icon: ICONS.target, title: '职业分析' },
  { index: '/app/student/settings', icon: ICONS.settings, title: '个人设置' },
]

// 教师菜单
const teacherMenus = [
  ...studentMenus,
  { index: '/app/teacher/courses', icon: ICONS.bookOpen, title: '课程管理' },
  { index: '/app/teacher/students', icon: ICONS.users, title: '学生管理' },
  { index: '/app/teacher/grading', icon: ICONS.checkSquare, title: '作业批改' },
  { index: '/app/teacher/class-report', icon: ICONS.trendingUp, title: '班级报告' },
  { index: '/app/teacher/monitoring', icon: ICONS.monitor, title: '学情监控' },
]

// 管理员菜单
const adminMenus = [
  { index: '/app/admin/users', icon: ICONS.users, title: '用户管理' },
  { index: '/app/admin/content-review', icon: ICONS.search, title: '内容审核' },
  { index: '/app/admin/system-stats', icon: ICONS.activity, title: '系统监控' },
]

// 通用菜单（兼容原有路由）
const commonMenus = [
  { index: '/app/courses', icon: ICONS.layoutGrid, title: '课程列表' },
  { index: '/app/exams', icon: ICONS.calendar, title: '考试' },
  { index: '/app/wrongbook', icon: ICONS.closeCircle, title: '错题本' },
  { index: '/app/notes', icon: ICONS.fileText, title: '笔记' },
  { index: '/app/messages', icon: ICONS.inbox, title: '消息' },
  { index: '/app/profile', icon: ICONS.user, title: '个人中心' },
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
  { name: 'Vue3入门', path: '/app/student/course/1', icon: ICONS.bookOpen },
  { name: '我的笔记', path: '/app/student/notes', icon: ICONS.fileText },
  { name: '错题复习', path: '/app/student/wrong-questions', icon: ICONS.closeCircle },
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

void 0 /* theme switcher removed — single classical theme */

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

/* ===== 书脊菜单数据 ===== */
const spineMenus = computed(() => {
  return currentMenus.value.map(m => ({
    index: m.index,
    icon: m.icon,
    title: m.title,
  }))
})

function onSpineSelect(index: string) {
  router.push(index)
}

/* ===== 书页章节名 ===== */
const currentChapter = computed(() => {
  return String(route.meta.title ?? '课程管理')
})

/* ===== GSAP 翻页转场 ===== */
const prefersReduced = ref(false)

function onBeforeEnter(el: Element) {
  if (prefersReduced.value) return
  const h = el as HTMLElement
  h.style.willChange = 'transform, opacity'
  gsap.set(h, { opacity: 0, y: 10 })
}

function onEnter(el: Element, done: () => void) {
  if (prefersReduced.value) { done(); return }
  const h = el as HTMLElement
  gsap.to(h, {
    opacity: 1, y: 0,
    duration: 0.24, ease: 'power2.out',
    onComplete: () => { h.style.willChange = ''; done() },
  })
}

function onLeave(el: Element, done: () => void) {
  if (prefersReduced.value) { done(); return }
  const h = el as HTMLElement
  h.style.willChange = 'transform, opacity'
  gsap.to(h, {
    opacity: 0, y: -6,
    duration: 0.18, ease: 'power1.out',
    onComplete: () => { h.style.willChange = ''; done() },
  })
}

/* ===== 生命周期 ===== */
const shellRef = ref<HTMLElement | null>(null)
let gsapCtx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  themeStore.initTheme()
  calcIsMobile()
  window.addEventListener('resize', calcIsMobile)
  prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (isImmersiveRoute.value) {
    sidebarCollapsed.value = true
  }

  if (shellRef.value && !prefersReduced.value) {
    gsapCtx = gsap.context(() => {
      gsap.from('.book-main-area', {
        opacity: 0, y: 10,
        duration: 0.28, ease: 'power2.out', delay: 0.04,
      })
    }, shellRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calcIsMobile)
  gsapCtx?.revert()
})
</script>

<template>
  <div ref="shellRef" class="book-shell" :class="{ 'book-shell--immersive': isImmersiveRoute }">
    <!-- ===== 桌面端：书脊 + 书页 ===== -->
    <BookSpine
      v-if="!isMobile && !isImmersiveRoute"
      :menus="spineMenus"
      :active-index="activeMenu"
      :collapsed="sidebarCollapsed"
      @toggle="toggleCollapse"
      @select="onSpineSelect"
    />

    <!-- ===== 书页主区域 ===== -->
    <div class="book-main-area" :class="{ 'book-main-area--full': isMobile || isImmersiveRoute, 'book-main-area--immersive': isImmersiveRoute }">
      <!-- 装订线阴影 -->
      <div v-if="!isMobile && !isImmersiveRoute" class="book-binding-line"></div>

      <!-- 页眉栏 -->
      <header v-if="!isImmersiveRoute" class="book-header">
        <div class="book-header__left">
          <button v-if="isMobile" class="book-header__menu-btn" @click="toggleCollapse">
            <Icon icon="lucide:menu" />
          </button>
          <div class="book-header__chapter">
            <span class="book-header__ornament">◆</span>
            <span class="book-header__breadcrumb">
              <template v-for="(item, index) in breadcrumbs" :key="`${item}-${index}`">
                <span :class="{ 'is-current': index === breadcrumbs.length - 1 }">{{ item }}</span>
                <span v-if="index < breadcrumbs.length - 1" class="book-header__sep">·</span>
              </template>
            </span>
            <span class="book-header__ornament">◆</span>
          </div>
        </div>

        <div class="book-header__right">
          <button class="book-header__icon-btn" @click="router.push('/app/messages')" title="消息">
            <Icon :icon="ICONS.inbox" />
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
              <div class="book-header__user">
                <el-avatar :size="30" :src="userStore.currentUser?.avatar" class="book-header__avatar" />
                <div class="book-header__user-text">
                  <div class="book-header__user-name">{{ userStore.currentUser?.name }}</div>
                  <div class="book-header__user-role">{{ userRole === 'student' ? '学生' : userRole === 'teacher' ? '教师' : '管理员' }}</div>
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
                  <button class="user-pop__role-item" :class="{ active: userRole === UserRole.STUDENT }" @click="switchRole(UserRole.STUDENT)">
                    <Icon :icon="ICONS.graduationCap" /> 学生
                  </button>
                  <button class="user-pop__role-item" :class="{ active: userRole === UserRole.TEACHER }" @click="switchRole(UserRole.TEACHER)">
                    <Icon :icon="ICONS.briefcase" /> 教师
                  </button>
                  <button class="user-pop__role-item" :class="{ active: userRole === UserRole.ADMIN }" @click="switchRole(UserRole.ADMIN)">
                    <Icon :icon="ICONS.shield" /> 管理员
                  </button>
                </div>
              </div>
              <el-divider />
              <div class="user-pop__actions">
                <button class="user-pop__btn" @click="router.push('/app/profile')">
                  <Icon :icon="ICONS.user" /> 个人中心
                </button>
                <button class="user-pop__btn" @click="onLogout">
                  <Icon :icon="ICONS.logOut" /> 退出登录
                </button>
              </div>
            </div>
          </el-popover>
        </div>
      </header>

      <!-- 书页内容区 -->
      <main v-if="!isImmersiveRoute" class="book-content">
        <BookPage :chapter-name="currentChapter" :show-corners="true" :show-footer="true">
          <div class="page-turn-perspective">
            <router-view v-slot="{ Component }">
              <Transition
                :css="false"
                mode="out-in"
                @before-enter="onBeforeEnter"
                @enter="onEnter"
                @leave="onLeave"
              >
                <component :is="Component" />
              </Transition>
            </router-view>
          </div>
        </BookPage>
      </main>

      <main v-else class="immersive-stage">
        <router-view v-slot="{ Component }">
          <Transition
            :css="false"
            mode="out-in"
            @before-enter="onBeforeEnter"
            @enter="onEnter"
            @leave="onLeave"
          >
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>

    <!-- ===== 移动端抽屉 ===== -->
    <el-drawer v-if="!isImmersiveRoute" v-model="drawerOpen" direction="ltr" size="82%" :with-header="false" class="mobile-drawer">
      <div class="drawer">
        <div class="drawer__brand" @click="router.push('/app/dashboard')" role="button" tabindex="0">
          <div class="drawer__logo">学</div>
          <div>
            <div class="drawer__name">课程系统</div>
            <div class="drawer__desc">知行合一</div>
          </div>
        </div>
        <div class="drawer__user">
          <el-avatar :size="46" :src="userStore.currentUser?.avatar" />
          <div class="drawer__user-text">
            <div class="drawer__user-name">{{ userStore.currentUser?.name }}</div>
            <div class="drawer__user-role">{{ userRole === 'student' ? '学生' : userRole === 'teacher' ? '教师' : '管理员' }}</div>
          </div>
          <button class="drawer__close" @click="drawerOpen = false" aria-label="关闭菜单">
            <Icon :icon="ICONS.close" />
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
  </div>
</template>

<style scoped>
/* ═══ 古籍册页布局 ═══ */
.book-shell {
  display: flex;
  height: 100vh;
  background: var(--bg-100);
  overflow: hidden;
  position: relative;
}

.book-shell--immersive {
  background: var(--bg-200);
}

/* 宣纸纹理叠加 */
.book-shell::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.04' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23p)' opacity='.5'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
}

/* ═══ 书页主区域 ═══ */
.book-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  position: relative;
  z-index: 1;
}

.book-main-area--full {
  width: 100%;
}

.book-main-area--immersive {
  background: var(--bg-200);
}

/* 装订线 */
.book-binding-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--book-binding-width, 3px);
  z-index: 5;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    color-mix(in srgb, var(--primary-100) 30%, transparent 70%) 5%,
    color-mix(in srgb, var(--primary-100) 50%, transparent 50%) 50%,
    color-mix(in srgb, var(--primary-100) 30%, transparent 70%) 95%,
    transparent 100%
  );
  pointer-events: none;
}

.book-binding-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: 3px;
  bottom: 0;
  width: 12px;
  background: linear-gradient(to right, rgba(26, 20, 16, 0.05), transparent);
  pointer-events: none;
}

/* ═══ 页眉栏 ═══ */
.book-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 24px;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 60%, transparent 40%);
  background: color-mix(in srgb, var(--bg-100) 95%, var(--bg-200) 5%);
  flex-shrink: 0;
  position: relative;
  z-index: 3;
}

.book-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.book-header__menu-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--bg-300);
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: var(--text-200);
}

.book-header__chapter {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--text-200);
  letter-spacing: 0.15em;
}

.book-header__ornament {
  font-size: 7px;
  opacity: 0.35;
  color: var(--primary-100);
}

.book-header__breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
}

.book-header__breadcrumb .is-current {
  color: var(--text-100);
  font-weight: 600;
}

.book-header__sep {
  opacity: 0.4;
  margin: 0 2px;
}

.book-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.book-header__icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 17px;
  color: var(--text-200);
  transition: color 0.2s ease;
}

.book-header__icon-btn:hover {
  color: var(--primary-100);
}

.book-header__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 60%, transparent 40%);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.book-header__user:hover {
  border-color: var(--primary-200);
}

.book-header__avatar :deep(.el-avatar) {
  border-radius: 0;
}

.book-header__user-text {
  display: none;
}

.book-header__user-name {
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.book-header__user-role {
  font-size: 11px;
  color: var(--text-300);
}

/* ═══ 书页内容区 ═══ */
.book-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.book-content :deep(.book-page) {
  height: 100%;
}

.book-content :deep(.book-page__body) {
  padding: 16px 20px;
}

.page-turn-perspective {
  width: 100%;
  min-height: 100%;
}

.immersive-stage {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ═══ 用户弹窗 ═══ */
:deep(.user-popover) {
  --el-popover-padding: 0px;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--bg-300) 70%, transparent 30%);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
  transform-origin: top right;
  animation: sealPopIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes sealPopIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.user-pop__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0;
}

.user-pop__name {
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 700;
  margin-top: 10px;
}

.user-pop__role {
  font-size: 12px;
  color: var(--text-200);
  margin-top: 4px;
}

.user-pop__section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-200);
  letter-spacing: 0.08em;
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
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  color: var(--text-100);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.user-pop__role-item:hover {
  border-color: color-mix(in srgb, var(--primary-100) 45%, var(--bg-300) 55%);
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
}

.user-pop__role-item.active {
  border-color: color-mix(in srgb, var(--primary-100) 72%, var(--bg-300) 28%);
  background: color-mix(in srgb, var(--primary-100) 12%, var(--bg-100) 88%);
}

.user-pop__actions {
  display: grid;
  gap: 8px;
}

.user-pop__btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-200);
  border: none;
  font-size: 14px;
  color: var(--text-100);
  cursor: pointer;
  transition: background 0.2s ease;
}

.user-pop__btn:hover {
  background: var(--bg-300);
}

/* ═══ 移动端抽屉 ═══ */
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
  border-bottom: 1px solid var(--bg-300);
}

.drawer__logo {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-family: var(--font-title);
  color: var(--primary-100);
  border: 2px solid var(--primary-100);
  font-size: 16px;
}

.drawer__name {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
}

.drawer__desc {
  font-size: 11px;
  color: var(--text-300);
  font-family: var(--font-accent);
  letter-spacing: 0.1em;
  margin-top: 2px;
}

.drawer__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-bottom: 1px solid var(--bg-300);
}

.drawer__user-text {
  flex: 1;
  min-width: 0;
}

.drawer__user-name {
  font-weight: 700;
  font-size: 14px;
}

.drawer__user-role {
  font-size: 12px;
  color: var(--text-200);
  margin-top: 2px;
}

.drawer__close {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--bg-300);
  background: transparent;
  cursor: pointer;
}

.drawer__menu {
  border-right: 0;
  padding: 6px;
  flex: 1;
}

.drawer__menu :deep(.el-menu-item) {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer__menu :deep(.el-menu-item .menu-icon) {
  font-size: 20px;
}

.drawer__footer {
  padding: 12px;
}

/* ═══ 响应式 ═══ */
@media (min-width: 1024px) {
  .book-content :deep(.book-page__body) {
    padding: 18px 24px;
  }
  .book-header__user-text {
    display: block;
  }
}

@media (max-width: 767px) {
  .book-header {
    padding: 0 12px;
    height: 46px;
  }
  .book-content :deep(.book-page__body) {
    padding: 12px 14px;
  }
}
</style>


