<!-- 布局：应用主框架（左侧导航栏/顶部栏/面包屑标题/主内容区 router-view） -->
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Icon } from '@iconify/vue'
import { ICONS } from '@/constants/icons'
import { useUserStore, useThemeStore } from '@/stores'
import { UserRole } from '@/types'
import CloudTabNav from '@/components/book/CloudTabNav.vue'
import BookPage from '@/components/book/BookPage.vue'
import { gsap } from '@/plugins/gsap'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const isMobile = ref(false)
const drawerOpen = ref(false)

function calcIsMobile() {
  isMobile.value = window.matchMedia('(max-width: 767px)').matches
}

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

const userRole = computed(() => userStore.userRole)
const isStudent = computed(() => userStore.isStudent)
const isAdmin = computed(() => userStore.isAdmin)

const activeMenu = computed(() => {
  return route.path
})

const activeTabKey = computed({
  get: () => route.path,
  set: (val: string) => {
    if (val && val !== route.path) {
      router.push(val)
    }
  },
})

const isImmersiveRoute = computed(() => Boolean(route.meta.immersive))

const hiddenBookHeaderRoutes = new Set([
  '/app/dashboard',
  '/app/exams',
  '/app/student/favorites',
  '/app/student/learning',
  '/app/student/wrongquestions',
  '/app/student/my-reports',
  '/app/student/ai-assistant',
  '/app/student/settings',
])

const hideBookHeader = computed(() => hiddenBookHeaderRoutes.has(route.path))

const breadcrumbs = computed(() => {
  const items = route.matched
    .map(r => String(r.meta.title ?? ''))
  .filter(Boolean)
  if (items.length === 0) return ['AI职涯规划']
  if (route.path.startsWith('/app')) {
    return ['应用', ...items]
  }
  return items
})

// 学生菜单（按职业规划主路径顺序排列）
const studentMenus = [
  { index: '/app/dashboard', icon: ICONS.home, title: '首页' },
  // ── 职业探索 ──
  { index: '/app/student/career-analysis', icon: ICONS.target, title: '职业分析' },
  { index: '/app/exams', icon: ICONS.checkSquare, title: '技能自评' },
  { index: '/app/student/favorites', icon: ICONS.bookmark, title: '心仪岗位' },
  // ── 能力匹配 ──
  { index: '/app/student/career-navigation', icon: ICONS.route, title: '职途导航' },
  // ── 学习执行 ──
  { index: '/app/student/learning', icon: ICONS.trendingUp, title: '技能提升' },
  { index: '/app/student/wrongquestions', icon: ICONS.closeCircle, title: '薄弱点记录' },
  // ── 成果追踪 ──
  { index: '/app/student/my-reports', icon: ICONS.fileText, title: '我的报告' },
  // ── 工具 ──
  { index: '/app/student/ai-assistant', icon: ICONS.bot, title: 'AI助手' },
  { index: '/app/student/settings', icon: ICONS.settings, title: '个人设置' },
]

// 管理员菜单
const adminMenus = [
  { index: '/app/dashboard', icon: ICONS.home, title: '首页' },
  { index: '/app/admin/job-dataset', icon: ICONS.database, title: '岗位数据集' },
  { index: '/app/admin/knowledge-base', icon: ICONS.bookOpen, title: '知识库维护' },
]

// 通用菜单（兼容未登录或其他角色）
const commonMenus = [
  { index: '/app/messages', icon: ICONS.inbox, title: '消息' },
  { index: '/app/profile', icon: ICONS.user, title: '个人中心' },
]

// 当前角色菜单
const currentMenus = computed(() => {
  if (isStudent.value) return studentMenus
  if (isAdmin.value) return adminMenus
  return commonMenus
})

// 学习进度（学生）或待办统计（教师/管理员）
const quickStats = computed(() => {
  if (isStudent.value) {
    return { label: '本周学习', value: '12小时', sub: '3门课程进行中' }
  } else {
    return { label: '待审核内容', value: '5项', sub: '2门课程+3条评论' }
  }
})
void quickStats

void 0 /* theme switcher removed — single classical theme */

function toggleCollapse() {
  drawerOpen.value = true
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
    message: `已切换到${role === UserRole.STUDENT ? '学生' : '管理员'}角色`,
    type: 'success',
    duration: 1800,
  })
  router.push('/app/dashboard')
}

const cloudTabs = computed(() => {
  return currentMenus.value.map(m => ({
    key: m.index,
    label: m.title,
  }))
})

/* ===== 书页章节名 ===== */
const currentChapter = computed(() => {
  return String(route.meta.title ?? '课程管理')
})

/* ===== 页面入场动效（CSS Transition，去掉 GSAP JS 钉子避免 done() 时序问题）===== */
const prefersReduced = ref(false)

function onImmersiveEnter(_el: Element, done: () => void) {
  done()
}

function onImmersiveLeave(el: Element, done: () => void) {
  if (prefersReduced.value) { done(); return }
  const h = el as HTMLElement
  h.style.willChange = 'opacity'
  gsap.to(h, {
    opacity: 0,
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

  if (shellRef.value && !prefersReduced.value) {
    gsapCtx = gsap.context(() => {
      gsap.from('.book-main-area', {
        opacity: 0, y: 10,
        duration: 0.28, ease: 'power2.out', delay: 0.04,
        clearProps: 'opacity,transform',
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
    <div v-if="!isImmersiveRoute" class="top-row">
      <CloudTabNav
        class="top-row__nav"
        v-model="activeTabKey"
        :tabs="cloudTabs"
      />

      <div class="top-row__user">
        <button class="top-row__icon-btn" @click="router.push('/app/messages')" title="消息">
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
            <div class="top-row__user-card">
              <el-avatar :size="30" :src="userStore.currentUser?.avatar" class="top-row__avatar" />
              <div class="top-row__user-text">
                <div class="top-row__user-name">{{ userStore.currentUser?.name }}</div>
                <div class="top-row__user-role">{{ userRole === 'student' ? '学生' : '管理员' }}</div>
              </div>
            </div>
          </template>

          <div class="user-pop">
            <div class="user-pop__info">
              <el-avatar :size="50" :src="userStore.currentUser?.avatar" />
              <div class="user-pop__name">{{ userStore.currentUser?.name }}</div>
              <div class="user-pop__role">{{ userRole === 'student' ? '学生用户' : '系统管理员' }}</div>
            </div>
            <el-divider />
            <div class="user-pop__section">
              <div class="user-pop__section-title">切换角色</div>
              <div class="user-pop__role-list">
                <button class="user-pop__role-item" :class="{ active: userRole === UserRole.STUDENT }" @click="switchRole(UserRole.STUDENT)">
                  <Icon :icon="ICONS.graduationCap" /> 学生
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
    </div>

    <!-- ===== 书页主区域 ===== -->
    <div class="book-main-area" :class="{ 'book-main-area--immersive': isImmersiveRoute }">
      <!-- 页眉栏 -->
      <header v-if="!isImmersiveRoute && !hideBookHeader" class="book-header">
        <div class="book-header__left">
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
      </header>

      <!-- 书页内容区 -->
      <main v-if="!isImmersiveRoute" class="book-content">
        <BookPage :chapter-name="currentChapter" :show-corners="true" :show-footer="true">
          <div class="page-turn-perspective">
            <router-view v-slot="{ Component }">
              <Transition name="page-fade" mode="out-in">
                <component :is="Component" :key="route.fullPath" />
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
            @enter="onImmersiveEnter"
            @leave="onImmersiveLeave"
          >
            <component :is="Component" :key="route.fullPath" />
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
            <div class="drawer__user-role">{{ userRole === 'student' ? '学生' : '管理员' }}</div>
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
  flex-direction: column;
  height: 100vh;
  background: var(--bg-100);
  overflow: hidden;
  position: relative;
}

.top-row {
  height: 46px;
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 0;
  position: relative;
  z-index: 4;
  flex-shrink: 0;
  overflow: visible;
  background: #1a2f4a;
}

.top-row__nav {
  flex: 1 1 auto;
  min-width: 0;
  max-width: min(80vw, 1080px);
  margin-right: auto;
}

.top-row__user {
  height: 100%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-left: 1px solid rgba(201, 162, 39, 0.20);
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.top-row__icon-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: rgba(225, 215, 195, 0.85);
}

.top-row__icon-btn:hover {
  color: var(--gold-300, #e0c060);
}

.top-row__user-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.top-row__avatar :deep(.el-avatar) {
  border-radius: 0;
}

.top-row__user-text {
  display: none;
}

.top-row__user-name {
  font-family: var(--font-title);
  font-size: 12px;
  line-height: 1.2;
  color: rgba(235, 225, 200, 0.9);
}

.top-row__user-role {
  font-size: 11px;
  color: rgba(200, 188, 165, 0.75);
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
  min-height: 0;
  position: relative;
  z-index: 1;
}

.book-main-area--immersive {
  background: var(--bg-200);
}

/* ═══ 页眉栏 ═══ */
.book-header {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 60%, transparent 40%);
  background: color-mix(in srgb, var(--bg-100) 95%, var(--bg-200) 5%);
  flex-shrink: 0;
  position: relative;
  z-index: 3;
}

.book-header__left {
  display: flex;
  align-items: center;
  min-width: 0;
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
  height: 100%;
}

/* 路由切换过渡 */
.page-fade-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.page-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: none;
  }
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
  .top-row__user-text {
    display: block;
  }

  .book-content :deep(.book-page__body) {
    padding: 18px 24px;
  }
}

@media (max-width: 767px) {
  .top-row {
    min-height: 64px;
  }

  .top-row__user {
    margin-left: auto;
    height: 40px;
    padding: 0 6px;
    gap: 6px;
    margin-top: 20px;
  }

  .book-header {
    padding: 0 12px;
    height: 36px;
  }
  .book-content :deep(.book-page__body) {
    padding: 12px 14px;
  }
}

/* ═══ 打印覆盖：解除父容器高度/溢出裁剪，让子页面完整输出 ═══ */
@media print {
  .book-shell {
    display: block !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .book-shell::before { display: none !important; }
  .top-row,
  .book-header { display: none !important; }
  .book-main-area {
    display: block !important;
    height: auto !important;
    max-height: none !important;
    min-height: 0 !important;
    overflow: visible !important;
  }
  .book-content {
    display: block !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .book-content :deep(.book-page),
  .book-content :deep(.book-page__body),
  .book-content :deep(.book-page__spine),
  .book-content :deep(.book-page__footer) {
    display: block !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .page-turn-perspective {
    display: block !important;
    height: auto !important;
  }
  .immersive-stage {
    display: block !important;
    height: auto !important;
    max-height: none !important;
    min-height: 0 !important;
    overflow: visible !important;
  }
}
</style>


