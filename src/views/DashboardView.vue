<!-- 页面：首页；路由：/app（dashboard） -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUserStore, useCourseStore } from '@/stores'
import { UserRole } from '@/types'
import CalendarChart from '@/components/charts/CalendarChart.vue'

const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()

const userRole = computed(() => userStore.userRole)
const isStudent = computed(() => userStore.isStudent)
const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const favoriteCourses = computed(() => courseStore.userFavorites.slice(0, 4))

const studentCards = [
  {
    title: '学习中心',
    desc: '继续你的课程',
    icon: 'fluent-emoji:books',
    path: '/app/student/learning',
    color: 'var(--primary-100)',
  },
  {
    title: '学习报告',
    desc: '查看进度成绩',
    icon: 'fluent-emoji:chart-increasing',
    path: '/app/student/report',
    color: 'var(--accent-100)',
  },
  {
    title: '笔记管理',
    desc: '管理学习笔记',
    icon: 'fluent-emoji:memo',
    path: '/app/student/notes',
    color: '#F59E0B',
  },
]

const teacherCards = [
  {
    title: '课程管理',
    desc: '管理你的课程',
    icon: 'fluent-emoji:school',
    path: '/app/teacher/courses',
    color: 'var(--primary-100)',
  },
  {
    title: '学生管理',
    desc: '查看学生情况',
    icon: 'fluent-emoji:busts-in-silhouette',
    path: '/app/teacher/students',
    color: 'var(--accent-100)',
  },
  {
    title: '班级报告',
    desc: '查看数据分析',
    icon: 'fluent-emoji:clipboard',
    path: '/app/teacher/class-report',
    color: '#F59E0B',
  },
]

const adminCards = [
  {
    title: '用户管理',
    desc: '管理系统用户',
    icon: 'fluent-emoji:busts-in-silhouette',
    path: '/app/admin/users',
    color: 'var(--primary-100)',
  },
  {
    title: '内容审核',
    desc: '审核课程内容',
    icon: 'fluent-emoji:magnifying-glass-tilted-left',
    path: '/app/admin/content-review',
    color: 'var(--accent-100)',
  },
  {
    title: '系统监控',
    desc: '查看统计数据',
    icon: 'fluent-emoji:gear',
    path: '/app/admin/system-stats',
    color: '#F59E0B',
  },
]

const currentCards = computed(() => {
  if (isStudent.value) return studentCards
  if (isTeacher.value) return teacherCards
  if (isAdmin.value) return adminCards
  return studentCards
})

// 模拟公告数据
const announcements = [
  { id: 1, title: '系统维护通知', content: '本周日凌晨2点维护', time: '2024-01-15', type: 'warning' },
  { id: 2, title: '新课程上线', content: 'Vue3高级实战上线', time: '2024-01-14', type: 'success' },
  { id: 3, title: '考试安排', content: '期末考1月20日', time: '2024-01-13', type: 'info' },
]

// 模拟待办数据
const todos = ref([
  { id: 1, title: '完成数学作业', deadline: '今天', completed: false, priority: 'high' },
  { id: 2, title: '复习英语单词', deadline: '明天', completed: false, priority: 'medium' },
  { id: 3, title: '预习物理第3章', deadline: '后天', completed: true, priority: 'low' },
])

// 模拟最近访问
const recentVisits = [
  { id: 1, title: 'Vue3入门基础', type: 'course', time: '10分钟前', icon: 'fluent-emoji:books', path: '/app/student/course/course_001' },
  { id: 2, title: 'JavaScript高级', type: 'course', time: '2小时前', icon: 'fluent-emoji:memo', path: '/app/student/course/course_002' },
  { id: 3, title: '学习笔记 #23', type: 'note', time: '昨天', icon: 'fluent-emoji:spiral-notepad', path: '/app/student/notes' },
  { id: 4, title: '错题本复习', type: 'quiz', time: '2天前', icon: 'fluent-emoji:check-mark-button', path: '/app/student/wrong-questions' },
]

// 模拟学习日历数据
const calendarData = [
  { day: 1, hours: 2, hasTask: true },
  { day: 2, hours: 3, hasTask: true },
  { day: 3, hours: 0, hasTask: false },
  { day: 4, hours: 1.5, hasTask: true },
  { day: 5, hours: 4, hasTask: true },
  { day: 6, hours: 2.5, hasTask: true },
  { day: 7, hours: 0, hasTask: false },
]

function navigateTo(path: string) {
  router.push(path)
}

function toggleTodo(_id: number) {
  // 预留：后续接入持久化 / API
}
</script>



<template>
  <div class="dashboard">
    <div class="home-grid">
      <!-- 顶部：状态条（左） + 连续学习强调卡（右，高卡） -->
      <div class="hero-left">
        <!-- 欢迎信息区域 -->
        <div class="welcome-section">
          <div class="welcome-badge">
            <Icon icon="fluent-emoji:waving-hand" />
            <span>欢迎回来</span>
          </div>
          <div class="hero-sub">
            <span class="hero-sub__label">今日状态</span>
            <span class="hero-sub__value">保持节奏，别被进度吓到。</span>
          </div>
        </div>
        
        <!-- 学习日历区域 -->
        <div class="calendar-section">
          <div class="calendar-header">
            <Icon icon="fluent-emoji:calendar" />
            <span>学习日历</span>
          </div>
          <div class="calendar-container">
            <CalendarChart />
          </div>
        </div>
      </div>

      <button class="streak-card" type="button" @click="navigateTo('/app/student/report')">
        <div class="streak-card__glow" />
        <div class="streak-card__title">
          <Icon icon="fluent-emoji:fire" class="streak-card__icon" />
          <span>连续学习</span>
        </div>
        <div class="streak-card__days">7</div>
        <div class="streak-card__unit">天</div>
        <div class="streak-card__hint">继续保持，下一次奖励在第 14 天。</div>
      </button>

      <!-- 快捷入口：整齐网格（保留不同卡片颜色作为差异化） -->
      <div class="quick-cards-aligned">
        <button
          v-for="card in currentCards"
          :key="card.title"
          type="button"
          class="quick-card-v2 quick-card--aligned"
          :style="{ '--card-color': card.color }"
          @click="navigateTo(card.path)"
        >
          <div class="card-glow" />
          <div class="card-content">
            <div class="card-icon-wrap">
              <Icon :icon="card.icon" class="card-icon" />
            </div>
            <div class="card-text">
              <div class="card-title">{{ card.title }}</div>
              <div class="card-desc">{{ card.desc }}</div>
            </div>
          </div>
          <div class="card-arrow">
            <Icon icon="fluent-emoji:arrow-pointing-rightwards-then-curving-upwards" />
          </div>
        </button>
      </div>

      <!-- 通用功能区：统一卡片规格（放到左侧主栏） -->
      <div class="content-grid aligned">
        <!-- 公告栏 -->
        <div class="grid-card">
          <div class="card-header">
            <div class="header-title">
              <Icon icon="fluent-emoji:megaphone" />
              <span>公告</span>
            </div>
            <button class="btn-text" @click="navigateTo('/app/announcements')">更多</button>
          </div>
          <div class="announcement-list">
            <div v-for="item in announcements" :key="item.id" class="announcement-item">
              <div class="announcement-tag" :class="item.type">{{ item.type === 'warning' ? '重要' : item.type === 'success' ? '新功能' : '通知' }}</div>
              <div class="announcement-content">
                <div class="announcement-title">{{ item.title }}</div>
                <div class="announcement-meta">{{ item.content }} · {{ item.time }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 待办事项 -->
        <div class="grid-card">
          <div class="card-header">
            <div class="header-title">
              <Icon icon="fluent-emoji:clipboard" />
              <span>待办</span>
            </div>
            <button class="btn-text" @click="navigateTo('/app/todos')">查看</button>
          </div>
          <div class="todo-list-v2">
            <div v-for="todo in todos" :key="todo.id" class="todo-item-v2" :class="{ completed: todo.completed }">
              <label class="todo-check">
                <input type="checkbox" v-model="todo.completed" @change="toggleTodo(todo.id)">
                <span class="check-custom" />
              </label>
              <span class="todo-text-v2" :class="{ 'todo-done': todo.completed }">{{ todo.title }}</span>
              <span class="todo-time" :class="todo.priority">{{ todo.deadline }}</span>
            </div>
          </div>
        </div>

        <!-- 最近访问 -->
        <div class="grid-card grid-card-wide">
          <div class="card-header">
            <div class="header-title">
              <Icon icon="fluent-emoji:clock" />
              <span>最近访问</span>
            </div>
          </div>
          <div class="visit-list-v2">
            <div v-for="visit in recentVisits" :key="visit.id" class="visit-item-v2" @click="navigateTo(visit.path)">
              <Icon :icon="visit.icon" class="visit-icon" />
              <div class="visit-text">
                <div class="visit-title-v2">{{ visit.title }}</div>
                <div class="visit-time-v2">{{ visit.time }}</div>
              </div>
              <Icon icon="fluent-emoji:arrow-pointing-rightwards-then-curving-upwards" class="visit-arrow" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学生端：并入统一栅格 -->
    <div v-if="isStudent" class="unified-grid">
      <div class="grid-card grid-span-8">
        <div class="card-header">
          <div class="header-title">
            <Icon icon="fluent-emoji:calendar" />
            <span>本周学习</span>
          </div>
          <div class="calendar-total">
            <Icon icon="fluent-emoji:stopwatch" />
            <span>共 {{ calendarData.reduce((sum, d) => sum + d.hours, 0) }} 小时</span>
          </div>
        </div>
        <div class="calendar-bar">
          <div 
            v-for="day in calendarData" 
            :key="day.day" 
            class="day-bar"
            :class="{ 'has-study': day.hours > 0, 'has-task': day.hasTask }"
            :style="{ '--bar-height': `${Math.min(day.hours / 5 * 100, 100)}%` }"
          >
            <div class="bar-fill" />
            <div class="day-label">{{ ['一', '二', '三', '四', '五', '六', '日'][day.day - 1] }}</div>
            <div class="day-value">{{ day.hours > 0 ? day.hours + 'h' : '-' }}</div>
          </div>
        </div>
      </div>

      <div class="grid-card grid-span-4">
        <div class="card-header">
          <div class="header-title">
            <Icon icon="fluent-emoji:star" />
            <span>收藏课程</span>
          </div>
          <button class="btn-text" @click="navigateTo('/app/student/favorites')">查看全部</button>
        </div>

        <div v-if="favoriteCourses.length > 0" class="course-grid">
          <div
            v-for="course in favoriteCourses"
            :key="course.id"
            class="course-card"
            @click="navigateTo(`/app/student/course/${course.id}`)"
          >
            <img :src="course.cover" class="course-image" />
            <div class="course-info-v2">
              <div class="course-title-v2">{{ course.title }}</div>
              <div class="course-teacher-v2">{{ course.teacherName }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <Icon icon="fluent-emoji:empty-nest" class="empty-icon" />
          <p>暂无收藏课程</p>
        </div>
      </div>
    </div>

    <!-- 教师特有区域 -->
    <div v-if="isTeacher" class="unified-grid">
      <div class="grid-card grid-span-6">
        <div class="card-header">
          <div class="header-title">
            <Icon icon="fluent-emoji:clipboard" />
            <span>待批改</span>
          </div>
        </div>
        <div class="teacher-todo">
          <div class="todo-row">
            <div class="todo-badge warning">12 份</div>
            <span class="todo-desc">作业待批改</span>
            <button class="btn-text" @click="navigateTo('/app/teacher/grading')">去批改</button>
          </div>
          <div class="todo-row">
            <div class="todo-badge info">3 门</div>
            <span class="todo-desc">课程待审核</span>
            <button class="btn-text" @click="navigateTo('/app/teacher/courses')">查看</button>
          </div>
        </div>
      </div>

      <div class="grid-card grid-span-6">
        <div class="card-header">
          <div class="header-title">
            <Icon icon="fluent-emoji:busts-in-silhouette" />
            <span>班级概览</span>
          </div>
        </div>
        <div class="class-grid">
          <div class="class-item">
            <div class="class-num">3</div>
            <div class="class-label">授课班级</div>
          </div>
          <div class="class-item">
            <div class="class-num">128</div>
            <div class="class-label">学生人数</div>
          </div>
          <div class="class-item">
            <div class="class-num">5</div>
            <div class="class-label">进行课程</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 管理员特有区域 -->
    <div v-if="isAdmin" class="unified-grid">
      <div class="grid-card grid-span-8">
        <div class="card-header">
          <div class="header-title">
            <Icon icon="fluent-emoji:gear" />
            <span>系统概览</span>
          </div>
        </div>
        <div class="system-grid">
          <div class="system-item">
            <div class="system-num">353</div>
            <div class="system-label">总用户数</div>
          </div>
          <div class="system-item">
            <div class="system-num">51</div>
            <div class="system-label">课程数量</div>
          </div>
          <div class="system-item">
            <div class="system-num">3</div>
            <div class="system-label">待审核</div>
          </div>
          <div class="system-item">
            <div class="system-num">180</div>
            <div class="system-label">今日活跃</div>
          </div>
        </div>
      </div>

      <div class="grid-card grid-span-4">
        <div class="card-header">
          <div class="header-title">
            <Icon icon="fluent-emoji:rocket" />
            <span>快速操作</span>
          </div>
        </div>
        <div class="action-list">
          <button class="action-btn" @click="navigateTo('/app/admin/users')">
            <Icon icon="fluent-emoji:busts-in-silhouette" />
            用户管理
          </button>
          <button class="action-btn" @click="navigateTo('/app/admin/content-review')">
            <Icon icon="fluent-emoji:magnifying-glass-tilted-left" />
            内容审核
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器：让内容更整齐（桌面端优先） */
.dashboard {
  max-width: 1240px;
  margin: 0 auto;
  padding: 12px 6px 24px;
}

/* 方案2：统一 12 栅格，右侧高卡做差异化锚点 */
.home-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  align-items: stretch;
  margin-bottom: 32px;
}

.hero-left {
  grid-column: span 8;
  background: color-mix(in srgb, var(--bg-100) 95%, white 5%);
  border: 1px solid var(--bg-300);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 450px;
  gap: 20px;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.calendar-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--primary-100) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-100) 20%, transparent);
  border-radius: 16px;
  padding: 16px;
  min-height: 280px;
}

.calendar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--primary-100);
  font-size: 14px;
  font-weight: 600;
}

.calendar-header .iconify {
  font-size: 16px;
}

.calendar-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg-200) 50%, transparent);
}

.calendar-container :deep(.calendar-chart-container) {
  width: 100% !important;
  height: 100% !important;
  min-height: 240px;
  max-height: 240px;
}

.calendar-container :deep(div[style*="height"]) {
  height: 240px !important;
}

.welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: color-mix(in srgb, var(--primary-100) 12%, transparent);
  color: var(--primary-100);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.hero-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
}

.hero-sub__label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-200);
}

.hero-sub__value {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-100);
}

.streak-card {
  grid-column: span 4;
  grid-row: span 2;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, #FF6B4A 35%, var(--bg-300) 65%);
  background:
    radial-gradient(900px 300px at 20% 0%, rgba(255, 107, 74, 0.22), transparent 60%),
    radial-gradient(600px 260px at 90% 100%, rgba(255, 160, 122, 0.18), transparent 55%),
    color-mix(in srgb, var(--bg-100) 92%, white 8%);
  padding: 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 340px;
  transition: transform 220ms, box-shadow 220ms;
}

.streak-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 50px rgba(255, 107, 74, 0.18);
}

.streak-card__glow {
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle, rgba(255, 107, 74, 0.18), transparent 60%);
  opacity: 0.7;
  pointer-events: none;
}

.streak-card__title {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  font-size: 16px;
  color: #7c2d12;
}

.streak-card__icon {
  font-size: 20px;
}

.streak-card__days {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  font-size: 72px;
  font-weight: 1000;
  line-height: 0.95;
  color: #111827;
  letter-spacing: -0.05em;
}

.streak-card__unit {
  position: relative;
  z-index: 1;
  margin-top: 2px;
  font-size: 14px;
  font-weight: 900;
  color: #6b7280;
}

.streak-card__hint {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.6;
  font-weight: 700;
  color: #6b7280;
  max-width: 36ch;
}

/* 快捷卡片 - 错落布局 */
.quick-cards-aligned {
  grid-column: span 8;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.quick-card-v2 {
  position: relative;
  background: color-mix(in srgb, var(--bg-100) 95%, white 5%);
  border: 1px solid var(--bg-300);
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

.quick-card-v2:hover {
  transform: translateY(-6px);
  border-color: var(--card-color);
  box-shadow: 0 20px 40px color-mix(in srgb, var(--card-color) 15%, transparent);
}

.card-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, color-mix(in srgb, var(--card-color) 10%, transparent) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quick-card-v2:hover .card-glow {
  opacity: 1;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon-wrap {
  width: 56px;
  height: 56px;
  background: color-mix(in srgb, var(--card-color) 12%, transparent);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon {
  font-size: 32px;
}

.card-text {
  flex: 1;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-100);
  margin-bottom: 4px;
}

.card-desc {
  font-size: 13px;
  color: var(--text-200);
}

.card-arrow {
  position: relative;
  z-index: 1;
  font-size: 24px;
  color: var(--text-200);
  transition: all 0.3s ease;
}

.quick-card-v2:hover .card-arrow {
  color: var(--card-color);
  transform: translateX(4px);
}

/* 内容网格 - 不对称布局 */
.content-grid.aligned {
  grid-column: span 8;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 20px;
}

.unified-grid {
  max-width: 1240px;
  margin: 0 auto 32px;
  padding: 0 6px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.grid-span-8 {
  grid-column: span 8;
}

.grid-span-6 {
  grid-column: span 6;
}

.grid-span-4 {
  grid-column: span 4;
}

.grid-card {
  background: color-mix(in srgb, var(--bg-100) 95%, white 5%);
  border: 1px solid var(--bg-300);
  border-radius: 20px;
  padding: 20px;
}

.grid-card-tall {
  grid-row: span 2;
}

.grid-card-wide {
  grid-column: span 2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-100);
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary-100);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-text:hover {
  background: color-mix(in srgb, var(--primary-100) 10%, transparent);
}

/* 公告列表 */
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-item {
  padding: 14px;
  background: var(--bg-200);
  border-radius: 12px;
  transition: background 0.2s;
}

.announcement-item:hover {
  background: var(--bg-300);
}

.announcement-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.announcement-tag.warning {
  background: #FF6B4A20;
  color: #FF6B4A;
}

.announcement-tag.success {
  background: #10B98120;
  color: #10B981;
}

.announcement-tag.info {
  background: #3B82F620;
  color: #3B82F6;
}

.announcement-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-100);
  margin-bottom: 6px;
}

.announcement-meta {
  font-size: 13px;
  color: var(--text-200);
}

/* 待办列表 */
.todo-list-v2 {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item-v2 {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-200);
  border-radius: 12px;
  transition: background 0.2s;
}

.todo-item-v2:hover {
  background: var(--bg-300);
}

.todo-check {
  position: relative;
  width: 22px;
  height: 22px;
  cursor: pointer;
}

.todo-check input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
}

.check-custom {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--bg-300);
  border-radius: 6px;
  transition: all 0.2s;
}

.todo-check input:checked + .check-custom {
  background: var(--primary-100);
}

.todo-check input:checked + .check-custom::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 3px;
  width: 6px;
  height: 11px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.todo-text-v2 {
  flex: 1;
  font-size: 14px;
  color: var(--text-100);
}

.todo-text-v2.todo-done {
  text-decoration: line-through;
  color: var(--text-200);
}

.todo-time {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.todo-time.high {
  background: #FF6B4A20;
  color: #FF6B4A;
}

.todo-time.medium {
  background: #F59E0B20;
  color: #F59E0B;
}

.todo-time.low {
  background: #6B728020;
  color: #6B7280;
}

/* 最近访问 */
.visit-list-v2 {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.visit-item-v2 {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-200);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.visit-item-v2:hover {
  background: var(--bg-300);
  transform: translateX(4px);
}

.visit-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.visit-text {
  flex: 1;
}

.visit-title-v2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-100);
  margin-bottom: 4px;
}

.visit-time-v2 {
  font-size: 13px;
  color: var(--text-200);
}

.visit-arrow {
  font-size: 18px;
  color: var(--text-200);
  transition: all 0.2s;
}

.visit-item-v2:hover .visit-arrow {
  color: var(--primary-100);
  transform: translateX(4px);
}

/* 日历条形图 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-total {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-200);
}

.calendar-bar {
  display: flex;
  gap: 12px;
  height: 160px;
}

.day-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar-fill {
  flex: 1;
  width: 100%;
  background: var(--bg-200);
  border-radius: 12px 12px 4px 4px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.bar-fill::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bar-height, 0%);
  background: linear-gradient(to top, var(--primary-100), color-mix(in srgb, var(--primary-100) 50%, var(--accent-100)));
  border-radius: 12px 12px 4px 4px;
  transition: height 0.5s ease;
}

.day-bar.has-study .bar-fill {
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-200));
}

.day-bar.has-task .bar-fill::before {
  content: '';
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: var(--accent-100);
  border-radius: 50%;
  z-index: 1;
}

.day-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-200);
}

.day-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-100);
}

/* 收藏课程 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.course-card {
  background: var(--bg-200);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.course-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px color-mix(in srgb, var(--primary-100) 10%, transparent);
}

.course-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.course-info-v2 {
  padding: 14px;
}

.course-title-v2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-100);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-teacher-v2 {
  font-size: 13px;
  color: var(--text-200);
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-200);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* 统一网格 */
.unified-grid-legacy {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

.unified-grid-legacy-item {
  background: var(--bg-200);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s;
}

.unified-grid-legacy-item:hover {
  background: var(--bg-300);
  transform: translateY(-2px);
}

/* 学生日历 */
.student-calendar-legacy {
  grid-column: span 6;
}

.student-calendar-legacy .calendar-header {
  margin-bottom: 16px;
}

.student-calendar-legacy .calendar-bar {
  height: 120px;
}

/* 收藏课程 */
.student-favorites-legacy {
  grid-column: span 6;
}

.student-favorites-legacy .course-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* 教师/管理员网格 */
.teacher-section-legacy,
.admin-section-legacy {
  grid-column: span 6;
}

.teacher-todo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.todo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-200);
  border-radius: 12px;
}

.todo-badge {
  font-size: 14px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 8px;
}

.todo-badge.warning {
  background: #FF6B4A20;
  color: #FF6B4A;
}

.todo-badge.info {
  background: #3B82F620;
  color: #3B82F6;
}

.todo-desc {
  flex: 1;
  font-size: 14px;
  color: var(--text-100);
}

.class-grid,
.system-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.class-item,
.system-item {
  text-align: center;
  padding: 20px;
  background: var(--bg-200);
  border-radius: 16px;
  transition: all 0.2s;
}

.class-item:hover,
.system-item:hover {
  background: var(--bg-300);
  transform: translateY(-2px);
}

.class-num,
.system-num {
  font-size: 32px;
  font-weight: 800;
  color: var(--primary-100);
  margin-bottom: 6px;
}

.class-label,
.system-label {
  font-size: 13px;
  color: var(--text-200);
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-200);
  border: none;
  border-radius: 12px;
  font-size: 15px;
  color: var(--text-100);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-300);
  color: var(--primary-100);
  transform: translateX(4px);
}

/* 响应式 */
@media (max-width: 1200px) {
  .home-grid {
    grid-template-columns: 1fr;
  }

  .hero-left,
  .streak-card,
  .quick-cards-aligned,
  .content-grid.aligned {
    grid-column: auto;
    grid-row: auto;
  }

  .streak-card {
    min-height: 220px;
  }

  .quick-cards-aligned {
    grid-template-columns: 1fr;
  }

  .content-grid.aligned {
    grid-template-columns: 1fr;
  }

  .unified-grid {
    grid-template-columns: 1fr;
  }

  .grid-span-8,
  .grid-span-6,
  .grid-span-4 {
    grid-column: auto;
  }
  
  .grid-card-tall,
  .grid-card-wide {
    grid-row: span 1;
    grid-column: span 1;
  }
  
  .course-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 8px 2px 18px;
  }
  
  .calendar-bar {
    height: 120px;
  }
  
  .course-grid {
    grid-template-columns: 1fr;
  }
  
  .class-grid,
  .system-grid {
    grid-template-columns: 1fr;
  }
}
</style>


