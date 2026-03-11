<!-- 页面：首页；路由：/app（dashboard） -->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useCourseStore } from '@/stores'
import CalendarChart from '@/components/charts/CalendarChart.vue'

const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()

const isStudent = computed(() => userStore.isStudent)
const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const favoriteCourses = computed(() => courseStore.userFavorites.slice(0, 4))

const studentCards = [
  { title: '学习中心', desc: '继续你的课程', path: '/app/student/learning' },
  { title: '学习报告', desc: '查看进度成绩', path: '/app/student/report' },
  { title: '笔记管理', desc: '管理学习笔记', path: '/app/student/notes' },
]

const teacherCards = [
  { title: '课程管理', desc: '管理你的课程', path: '/app/teacher/courses' },
  { title: '学生管理', desc: '查看学生情况', path: '/app/teacher/students' },
  { title: '班级报告', desc: '查看数据分析', path: '/app/teacher/class-report' },
]

const adminCards = [
  { title: '用户管理', desc: '管理系统用户', path: '/app/admin/users' },
  { title: '内容审核', desc: '审核课程内容', path: '/app/admin/content-review' },
  { title: '系统监控', desc: '查看统计数据', path: '/app/admin/system-stats' },
]

const currentCards = computed(() => {
  if (isStudent.value) return studentCards
  if (isTeacher.value) return teacherCards
  if (isAdmin.value) return adminCards
  return studentCards
})

const announcementsPath = '/app/messages'

const spotlightPath = computed(() => {
  if (isTeacher.value) return '/app/teacher/class-report'
  if (isAdmin.value) return '/app/admin/system-stats'
  return '/app/student/report'
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
  { id: 1, title: 'Vue3入门基础', type: 'course', time: '10分钟前', path: '/app/student/course/course_001' },
  { id: 2, title: 'JavaScript高级', type: 'course', time: '2小时前', path: '/app/student/course/course_002' },
  { id: 3, title: '学习笔记 #23', type: 'note', time: '昨天', path: '/app/student/notes' },
  { id: 4, title: '错题本复习', type: 'quiz', time: '2天前', path: '/app/student/wrong-questions' },
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

function toggleTodo(id: number) {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}
</script>







<template>
  <div class="dashboard">
    <!-- 顶部区域：欢迎 + 连续学习 -->
    <div class="terminal-grid">
      <div class="welcome-section">
        <div class="term-header">WELCOME</div>
        <div class="welcome-block">
          <div class="welcome-line">
            <span>欢迎回来, {{ userStore.currentUser?.username || '用户' }}</span>
          </div>
          <div class="welcome-text">
            {{ isStudent ? '今日状态: 保持节奏，别被进度吓到。' : isTeacher ? '今日状态: 有 12 份作业待批改。' : '系统运行正常，今日活跃用户 180。' }}
          </div>
        </div>
        
        <!-- 月历表 -->
        <div class="calendar-wrapper">
          <div class="calendar-header">
            <span>[CALENDAR]</span>
          </div>
          <div class="calendar-container">
            <CalendarChart />
          </div>
        </div>
      </div>

      <div class="streak-block" @click="navigateTo(spotlightPath)">
        <div class="streak-label">STREAK</div>
        <div class="streak-number">7</div>
        <div class="streak-unit">天</div>
        <div class="streak-progress">
          奖励进度:
          <span class="streak-bar">
            <span class="streak-fill">████</span><span class="streak-empty">░░░░░░</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="terminal-grid-3">
      <div v-for="card in currentCards" :key="card.title" class="term-link" @click="navigateTo(card.path)">
        <div>
          <div class="term-link-title">
            <span>[</span>
            <span>{{ card.title }}</span>
            <span>]</span>
          </div>
          <div class="term-link-desc">{{ card.desc }}</div>
        </div>
        <span class="term-arrow">></span>
      </div>
    </div>

    <!-- 公告 + 待办 -->
    <div class="terminal-row">
      <div class="announcement-section">
        <div class="term-header">ANNOUNCEMENTS</div>
        <div class="announcement-list">
          <div v-for="item in announcements" :key="item.id" class="announcement-item" @click="navigateTo(announcementsPath)">
            <span class="announcement-tag" :class="item.type">
              {{ item.type === 'warning' ? '[!]' : item.type === 'success' ? '[*]' : '[ ]' }}
            </span>
            <div class="announcement-content">
              <div class="announcement-title">{{ item.title }}</div>
              <div class="announcement-meta">{{ item.content }}</div>
            </div>
            <span class="announcement-time">{{ item.time }}</span>
          </div>
        </div>
      </div>

      <div class="todo-section">
        <div class="term-header">TODO</div>
        <div class="todo-list">
          <div v-for="todo in todos" :key="todo.id" class="todo-item" :class="{ completed: todo.completed }" @click="toggleTodo(todo.id)">
            <span class="todo-check">{{ todo.completed ? '[x]' : '[ ]' }}</span>
            <span class="todo-text">{{ todo.title }}</span>
            <span class="todo-time" :class="todo.priority">{{ todo.deadline }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近访问 -->
    <div class="recent-section">
      <div class="term-header">RECENT</div>
      <div class="visit-list">
        <div v-for="visit in recentVisits" :key="visit.id" class="visit-item" @click="navigateTo(visit.path)">
          <span class="visit-icon">></span>
          <div class="visit-text">
            <div class="visit-title">{{ visit.title }}</div>
            <div class="visit-time">{{ visit.time }}</div>
          </div>
          <span class="visit-arrow">-></span>
        </div>
      </div>
    </div>

    <!-- 学生端：学习日历 + 收藏课程 -->
    <div v-if="isStudent" class="terminal-row">
      <div class="calendar-section">
        <div class="calendar-header-row">
          <div class="term-header">WEEKLY_STATS</div>
          <div class="calendar-total">
            TOTAL: {{ calendarData.reduce((sum, d) => sum + d.hours, 0) }}h
          </div>
        </div>
        <div class="calendar-bar-v2">
          <div 
            v-for="day in calendarData" 
            :key="day.day" 
            class="day-bar-v2"
            :class="{ 'has-study': day.hours > 0 }"
          >
            <div class="bar-track">
              <div class="bar-fill-v2" :style="{ height: `${Math.min(day.hours / 5 * 100, 100)}%` }"></div>
            </div>
            <div class="day-label">{{ ['一', '二', '三', '四', '五', '六', '日'][day.day - 1] }}</div>
            <div class="day-value">{{ day.hours > 0 ? day.hours + 'h' : '-' }}</div>
          </div>
        </div>
      </div>

      <div class="favorites-section">
        <div class="term-header">FAVORITES</div>
        <div v-if="favoriteCourses.length > 0" class="course-grid">
          <div v-for="course in favoriteCourses" :key="course.id" class="course-item" @click="navigateTo(`/app/student/course/${course.id}`)">
            <div class="course-thumb">[IMG]</div>
            <div class="course-info">
              <div class="course-title">{{ course.title }}</div>
              <div class="course-teacher">{{ course.teacherName }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">暂无收藏课程</div>
      </div>
    </div>

    <!-- 教师端：待批改 + 班级概览 -->
    <div v-if="isTeacher" class="terminal-row">
      <div class="teacher-section">
        <div class="term-header">PENDING</div>
        <div class="teacher-todo">
          <div class="todo-row">
            <span class="todo-badge warning">[12]</span>
            <span class="todo-desc">作业待批改</span>
            <span class="term-arrow" @click="navigateTo('/app/teacher/grading')">></span>
          </div>
          <div class="todo-row">
            <span class="todo-badge info">[3]</span>
            <span class="todo-desc">课程待审核</span>
            <span class="term-arrow" @click="navigateTo('/app/teacher/courses')">></span>
          </div>
        </div>
      </div>

      <div class="class-section">
        <div class="term-header">OVERVIEW</div>
        <div class="stat-grid">
          <div class="stat-item">
            <div class="stat-num">3</div>
            <div class="stat-label">班级</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">128</div>
            <div class="stat-label">学生</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">5</div>
            <div class="stat-label">课程</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 管理员端：系统概览 + 快速操作 -->
    <div v-if="isAdmin" class="terminal-row">
      <div class="admin-stats-section">
        <div class="term-header">SYSTEM</div>
        <div class="stat-grid">
          <div class="stat-item">
            <div class="stat-num">353</div>
            <div class="stat-label">用户</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">51</div>
            <div class="stat-label">课程</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">3</div>
            <div class="stat-label">待审</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">180</div>
            <div class="stat-label">活跃</div>
          </div>
        </div>
      </div>

      <div class="admin-actions-section">
        <div class="term-header">ACTIONS</div>
        <div class="action-list">
          <button class="action-btn" @click="navigateTo('/app/admin/users')">
            <span>[USERS]</span>
            <span>></span>
          </button>
          <button class="action-btn" @click="navigateTo('/app/admin/content-review')">
            <span>[REVIEW]</span>
            <span>></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 终端风格变量（映射到主题系统） ===== */
.dashboard {
  /* 背景跟随主题 */
  --term-bg: var(--bg-100);
  --term-bg-alt: var(--bg-200);
  --term-border: var(--bg-300);

  /* 文字跟随主题 */
  --term-text: var(--text-100);
  --term-text-dim: var(--text-200);

  /* 强调色跟随主题 */
  --term-cyan: var(--primary-100);
  --term-pink: var(--accent-100);
  --term-yellow: color-mix(in srgb, var(--accent-100) 80%, #f59e0b 20%);
  --term-red: color-mix(in srgb, var(--accent-100) 60%, #ef4444 40%);

  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  background: var(--term-bg);
  color: var(--term-text);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
}

/* 文字选中效果 */
.dashboard ::selection {
  background: var(--term-cyan);
  color: var(--term-bg);
}

/* ===== 布局系统 ===== */
.terminal-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1px;
  background: var(--term-border);
  margin-bottom: 1px;
}

.terminal-grid > * {
  background: var(--term-bg);
  padding: 20px;
}

.terminal-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--term-border);
  margin-bottom: 1px;
}

.terminal-grid-3 > * {
  background: var(--term-bg);
  padding: 16px;
}

.terminal-row {
  display: flex;
  gap: 1px;
  background: var(--term-border);
  margin-bottom: 1px;
}

.terminal-row > * {
  background: var(--term-bg);
  padding: 20px;
  flex: 1;
}

/* ===== 区块标题 ===== */
.term-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--term-cyan);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.term-header::before {
  content: '[';
  color: var(--term-text-dim);
}

.term-header::after {
  content: ']';
  color: var(--term-text-dim);
}

/* ===== 链接/按钮基础 ===== */
.term-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  color: var(--term-text);
  cursor: pointer;
  border-bottom: 1px dashed var(--term-border);
  transition: none;
}

.term-link:last-child {
  border-bottom: none;
}

.term-link:hover {
  color: var(--term-cyan);
}

.term-link:hover .term-arrow {
  color: var(--term-cyan);
}

.term-link-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.term-link-desc {
  font-size: 12px;
  color: var(--term-text-dim);
  margin-top: 4px;
}

.term-arrow {
  color: var(--term-text-dim);
  font-family: monospace;
}

/* ===== 连续学习区块 ===== */
.streak-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--term-bg-alt);
}

.streak-label {
  font-size: 12px;
  color: var(--term-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.streak-number {
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
  color: var(--term-pink);
}

.streak-unit {
  font-size: 18px;
  color: var(--term-text-dim);
  margin-top: 8px;
}

.streak-progress {
  margin-top: 24px;
  font-size: 12px;
  color: var(--term-text-dim);
}

.streak-bar {
  display: inline-flex;
  gap: 2px;
  margin-left: 8px;
}

.streak-fill {
  color: var(--term-pink);
}

.streak-empty {
  color: var(--term-border);
}

/* ===== 公告列表 ===== */
.announcement-list {
  display: flex;
  flex-direction: column;
}

.announcement-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--term-border);
}

.announcement-item:last-child {
  border-bottom: none;
}

.announcement-tag {
  font-family: monospace;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.announcement-tag.warning {
  color: var(--term-yellow);
}

.announcement-tag.success {
  color: var(--term-cyan);
}

.announcement-tag.info {
  color: var(--term-text-dim);
}

.announcement-content {
  flex: 1;
}

.announcement-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--term-text);
}

.announcement-meta {
  font-size: 12px;
  color: var(--term-text-dim);
  margin-top: 4px;
}

.announcement-time {
  font-size: 11px;
  color: var(--term-border);
  flex-shrink: 0;
}

/* ===== 待办列表 ===== */
.todo-list {
  display: flex;
  flex-direction: column;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--term-border);
  cursor: pointer;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-check {
  font-family: monospace;
  font-size: 14px;
  color: var(--term-text-dim);
  flex-shrink: 0;
}

.todo-item.completed .todo-check {
  color: var(--term-text-dim);
}

.todo-item.completed .todo-text {
  color: var(--term-text-dim);
  text-decoration: line-through;
}

.todo-text {
  flex: 1;
  font-size: 14px;
}

.todo-time {
  font-size: 11px;
  color: var(--term-border);
}

.todo-time.high {
  color: var(--term-red);
}

.todo-time.medium {
  color: var(--term-yellow);
}

/* ===== 最近访问 ===== */
.visit-list {
  display: flex;
  flex-direction: column;
}

.visit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--term-border);
  cursor: pointer;
}

.visit-item:last-child {
  border-bottom: none;
}

.visit-icon {
  font-family: monospace;
  font-size: 14px;
  color: var(--term-cyan);
  flex-shrink: 0;
}

.visit-text {
  flex: 1;
}

.visit-title {
  font-size: 14px;
  font-weight: 600;
}

.visit-time {
  font-size: 11px;
  color: var(--term-text-dim);
  margin-top: 2px;
}

.visit-arrow {
  color: var(--term-text-dim);
  font-family: monospace;
}

.visit-item:hover .visit-arrow {
  color: var(--term-cyan);
}

/* ===== 月历表容器 ===== */
.calendar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 320px;
}

.calendar-header {
  font-size: 12px;
  font-weight: 700;
  color: var(--term-cyan);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-container {
  flex: 1;
  min-height: 280px;
  background: var(--term-bg-alt);
  border: 1px solid var(--term-border);
  padding: 12px;
}

.calendar-container :deep(.calendar-chart-container),
.calendar-container :deep(.calendar-chart) {
  width: 100% !important;
  height: 100% !important;
  min-height: 260px;
}
.calendar-section {
  background: var(--term-bg-alt);
}

.calendar-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-total {
  font-size: 12px;
  color: var(--term-text-dim);
}

.calendar-bar-v2 {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 160px;
  gap: 12px;
}

.day-bar-v2 {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar-track {
  position: relative;
  width: 100%;
  height: 120px;
  background: var(--term-bg);
  overflow: hidden;
}

.bar-fill-v2 {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--term-cyan);
  transition: height 0.2s ease;
}

.day-bar-v2.has-study .bar-fill-v2 {
  background: var(--term-cyan);
}

.day-label {
  font-size: 12px;
  color: var(--term-text-dim);
}

.day-value {
  font-size: 11px;
  color: var(--term-cyan);
  font-weight: 600;
}

/* ===== 收藏课程 ===== */
.course-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--term-border);
  background: var(--term-bg-alt);
  cursor: pointer;
}

.course-item:hover {
  border-color: var(--term-cyan);
}

.course-thumb {
  width: 80px;
  height: 60px;
  background: var(--term-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.course-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.course-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--term-text);
}

.course-teacher {
  font-size: 12px;
  color: var(--term-text-dim);
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--term-text-dim);
  font-size: 14px;
}

.empty-state::before {
  content: '[空]';
  display: block;
  margin-bottom: 8px;
  color: var(--term-border);
}

/* ===== 教师/管理员区块 ===== */
.teacher-todo {
  display: flex;
  flex-direction: column;
}

.todo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--term-border);
}

.todo-row:last-child {
  border-bottom: none;
}

.todo-badge {
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--term-yellow);
  flex-shrink: 0;
}

.todo-badge.info {
  color: var(--term-cyan);
}

.todo-desc {
  flex: 1;
  font-size: 14px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--term-border);
}

.stat-item {
  background: var(--term-bg);
  padding: 20px;
  text-align: center;
}

.stat-num {
  font-size: 32px;
  font-weight: 700;
  color: var(--term-pink);
}

.stat-label {
  font-size: 12px;
  color: var(--term-text-dim);
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--term-bg-alt);
  border: 1px solid var(--term-border);
  color: var(--term-text);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.action-btn:hover {
  border-color: var(--term-cyan);
  color: var(--term-cyan);
}

/* ===== 顶部欢迎区 ===== */
.welcome-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.welcome-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--term-text-dim);
}

.welcome-line::before {
  content: '>';
  color: var(--term-cyan);
}

.welcome-text {
  font-size: 16px;
  color: var(--term-text);
  margin-top: 8px;
}

/* ===== 区块容器 ===== */
.recent-section,
.announcement-section,
.todo-section,
.teacher-section,
.class-section,
.admin-stats-section,
.admin-actions-section,
.favorites-section {
  background: var(--term-bg);
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .terminal-grid {
    grid-template-columns: 1fr;
  }

  .terminal-grid-3 {
    grid-template-columns: 1fr;
  }

  .terminal-row {
    flex-direction: column;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .calendar-bar {
    height: 100px;
  }

  .day-blocks {
    font-size: 12px;
  }
}

@media (max-width: 600px) {
  .dashboard {
    padding: 16px 12px;
  }

  .terminal-grid > *,
  .terminal-grid-3 > *,
  .terminal-row > * {
    padding: 16px;
  }

  .streak-number {
    font-size: 48px;
  }

  .stat-num {
    font-size: 24px;
  }
}
</style>

