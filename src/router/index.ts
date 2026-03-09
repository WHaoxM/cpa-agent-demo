import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import pinia from '@/stores/pinia'
import { useUserStore } from '@/stores'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  // 延迟获取 store，确保 pinia 已初始化
  const userStore = useUserStore()

  // 更新页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 课程管理系统`
  }

  // 检查是否是公开路由
  if (to.meta.public) {
    if (userStore.isLoggedIn) {
      next('/app/dashboard')
    } else {
      next()
    }
    return
  }

  // 检查是否已登录
  if (!userStore.isLoggedIn) {
    next('/login')
    return
  }

  // 检查角色权限
  const required = (to.meta.roles ?? to.meta.role) as string | string[] | undefined
  const requiredRoles = Array.isArray(required) ? required : required ? [required] : []
  if (requiredRoles.length > 0 && !requiredRoles.includes(userStore.userRole)) {
    ElMessage.error('您没有权限访问该页面')
    next('/app/dashboard')
    return
  }

  next()
})

export default router
