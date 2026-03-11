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

const announcements = [
  { id: 1, title: '系统维护通知', content: '本周日凌晨2点维护', time: '2024-01-15', type: 'warning' },
  { id: 2, title: '新课程上线', content: 'Vue3高级实战上线', time: '2024-01-14', type: 'success' },
  { id: 3, title: '考试安排', content: '期末考1月20日', time: '2024-01-13', type: 'info' },
]

const todos = ref([
  { id: 1, title: '完成数学作业', deadline: '今天', completed: false, priority: 'high' },
  { id: 2, title: '复习英语单词', deadline: '明天', completed: false, priority: 'medium' },
  { id: 3, title: '预习物理第3章', deadline: '后天', completed: true, priority: 'low' },
])

const recentVisits = [
  { id: 1, title: 'Vue3入门基础', type: 'course', time: '10分钟前', path: '/app/student/course/course_001' },
  { id: 2, title: 'JavaScript高级', type: 'course', time: '2小时前', path: '/app/student/course/course_002' },
  { id: 3, title: '学习笔记 #23', type: 'note', time: '昨天', path: '/app/student/notes' },
  { id: 4, title: '错题本复习', type: 'quiz', time: '2天前', path: '/app/student/wrong-questions' },
]

const calendarData = [
  { day: 1, hours: 2, hasTask: true },
  { day: 2, hours: 3, hasTask: true },
  { day: 3, hours: 0, hasTask: false },
  { day: 4, hours: 1.5, hasTask: true },
  { day: 5, hours: 4, hasTask: true },
  { day: 6, hours: 2.5, hasTask: true },
  { day: 7, hours: 0, hasTask: false },
]

// ===== 多模态融合能力面板数据 =====
const multimodalModules = [
  { name: 'VIDEO_PARSE', label: '视频理解', status: 'active', link: '/app/student/learning' },
  { name: 'TEXT_ANALYSIS', label: '文本分析', status: 'active', link: '/app/student/notes' },
  { name: 'VOICE_IO', label: '语音交互', status: 'standby', link: '/app/student/ai-assistant' },
  { name: 'IMAGE_RECOG', label: '图像识别', status: 'active', link: '' },
]

const fusionPipeline = [
  { from: '视频流', to: '文本提取', arrow: true },
  { from: '文本提取', to: '知识图谱', arrow: true },
  { from: '知识图谱', to: '个性推荐', arrow: false },
]

// ===== Agent 协作网络数据 =====
const agents = [
  { id: 'AI_TUTOR', label: 'AI 辅导员', status: 'online', tasks: 24, link: '/app/student/ai-assistant' },
  { id: 'EVAL_AGENT', label: '评估引擎', status: 'online', tasks: 12, link: '/app/student/wrong-questions' },
  { id: 'CAREER_AGENT', label: '职业规划师', status: 'online', tasks: 8, link: '/app/student/learning' },
]

const agentFlows = [
  { desc: '提问', from: 'USER', to: 'AI_TUTOR', result: '智能解答' },
  { desc: '错题', from: 'USER', to: 'EVAL_AGENT', result: '薄弱点分析' },
  { desc: '学情', from: 'EVAL_AGENT', to: 'CAREER_AGENT', result: '路径规划' },
]

const onlineAgentCount = computed(() => agents.filter(a => a.status === 'online').length)
const activeModuleCount = computed(() => multimodalModules.filter(m => m.status === 'active').length)

const weeklyTotal = computed(() => calendarData.reduce((sum, d) => sum + d.hours, 0))

const moduleStatusText = (status: string) => {
  if (status === 'active') return '运行中'
  if (status === 'standby') return '待命'
  if (status === 'offline') return '离线'
  return status
}

const agentStatusText = (status: string) => {
  if (status === 'online') return '在线'
  if (status === 'offline') return '离线'
  return status
}

const agentIdText = (id: string) => {
  if (id === 'AI_TUTOR') return '辅导员'
  if (id === 'EVAL_AGENT') return '评估引擎'
  if (id === 'CAREER_AGENT') return '规划师'
  return id
}

function navigateTo(path: string) {
  if (path) router.push(path)
}

function toggleTodo(id: number) {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}
</script>







<template>
  <div class="dash">
    <!-- ===== HEADER ===== -->
    <header class="dash-header">
      <div class="header-left">
        <div class="header-brand">
          <span class="brand-icon">◆</span>
          <span class="brand-name">课程系统</span>
          <span class="brand-sep">::</span>
          <span class="brand-live">
            <span class="live-dot"></span>
            <span>在线</span>
          </span>
        </div>
        <div class="header-sub">
          <span class="sub-item">多模态引擎：<em class="sub-active">{{ activeModuleCount }}/{{ multimodalModules.length }} 运行中</em></span>
          <span class="sub-sep">|</span>
          <span class="sub-item">智能体集群：<em class="sub-active">{{ onlineAgentCount }}/{{ agents.length }} 就绪</em></span>
        </div>
      </div>
      <div class="header-right">
        <div class="header-status">系统状态：<em class="sub-active">正常</em></div>
        <div class="header-user">
          <span>{{ userStore.currentUser?.username || '用户' }}</span>
          <span class="user-sep">|</span>
          <span>{{ isStudent ? '学生端' : isTeacher ? '教师端' : '管理员' }}</span>
        </div>
      </div>
    </header>

    <!-- ===== HERO BANNER ===== -->
    <section class="zone-hero" v-if="isStudent">
      <span class="zone-tag">概览</span>
      <div class="hero-content">
        <div class="hero-streak">
          <span class="hero-num">7</span>
          <span class="hero-unit">天</span>
          <span class="hero-label">连续</span>
        </div>
        <div class="hero-divider"></div>
        <div class="hero-progress">
          <span class="hero-progress-label">进度</span>
          <div class="hero-bar">
            <div class="hero-bar-fill" style="width: 40%"></div>
          </div>
          <span class="hero-progress-val">4 / 10</span>
        </div>
        <div class="hero-divider"></div>
        <div class="hero-weekly">
          <span class="hero-num">{{ weeklyTotal }}</span>
          <span class="hero-unit">小时</span>
          <span class="hero-label">本周</span>
        </div>
      </div>
    </section>

    <!-- ===== CAPABILITY PANEL ===== -->
    <section class="zone-cap">
      <span class="zone-tag">能力</span>
      <div class="cap-grid">
        <!-- 多模态融合面板 -->
        <div class="cap-card">
          <div class="cap-title">
            <span class="cap-icon">◎</span>
            <span>多模态融合</span>
          </div>
          <div class="mod-list">
            <div
              v-for="mod in multimodalModules"
              :key="mod.name"
              class="mod-item"
              :class="{ clickable: !!mod.link }"
              @click="navigateTo(mod.link)"
            >
              <span class="mod-dot" :class="mod.status"></span>
              <span class="mod-name">{{ mod.label }}</span>
              <span class="mod-label">{{ moduleStatusText(mod.status) }}</span>
              <span class="mod-status" :class="mod.status">{{ moduleStatusText(mod.status) }}</span>
            </div>
          </div>
          <div class="pipeline">
            <span class="pipeline-label">融合链路：</span>
            <div class="pipeline-flow">
              <template v-for="(step, i) in fusionPipeline" :key="i">
                <span class="pipe-node">[{{ step.from }}]</span>
                <span class="pipe-arrow" v-if="step.arrow">→</span>
              </template>
              <span class="pipe-node">[{{ fusionPipeline[fusionPipeline.length - 1]?.to }}]</span>
            </div>
          </div>
        </div>

        <!-- Agent 协作面板 -->
        <div class="cap-card">
          <div class="cap-title">
            <span class="cap-icon">⬡</span>
            <span>智能体协作</span>
          </div>
          <div class="agent-list">
            <div
              v-for="agent in agents"
              :key="agent.id"
              class="agent-item"
              :class="{ clickable: !!agent.link }"
              @click="navigateTo(agent.link)"
            >
              <span class="agent-dot" :class="agent.status"></span>
              <span class="agent-id">{{ agentIdText(agent.id) }}</span>
              <span class="agent-label">{{ agent.label }}</span>
              <span class="agent-tasks">{{ agent.tasks }} 次</span>
              <span class="agent-status" :class="agent.status">{{ agentStatusText(agent.status) }}</span>
            </div>
          </div>
          <div class="pipeline">
            <span class="pipeline-label">协作流：</span>
            <div class="flow-list">
              <div v-for="(flow, i) in agentFlows" :key="i" class="flow-item">
                <span class="flow-desc">{{ flow.desc }}</span>
                <span class="flow-chain">{{ flow.from === 'USER' ? '用户' : agentIdText(flow.from) }} → {{ agentIdText(flow.to) }}</span>
                <span class="flow-result">{{ flow.result }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== PRIMARY: 日历 + 本周统计 ===== -->
    <section class="zone-primary">
      <span class="zone-tag">核心</span>
      <div class="primary-grid">
        <div class="primary-calendar">
          <div class="sec-header">
            <span class="sec-icon">◈</span>
            <span>学习日历</span>
          </div>
          <div class="calendar-box">
            <CalendarChart />
          </div>
        </div>
        <div class="primary-week" v-if="isStudent">
          <div class="sec-header">
            <span class="sec-icon">▥</span>
            <span>本周统计</span>
          </div>
          <div class="week-total">
            <span class="week-num">{{ weeklyTotal }}</span>
            <span class="week-unit">小时</span>
          </div>
          <div class="week-bars">
            <div v-for="day in calendarData" :key="day.day" class="wbar">
              <div class="wbar-track">
                <div class="wbar-fill" :style="{ height: `${Math.min(day.hours / 5 * 100, 100)}%` }"></div>
              </div>
              <span class="wbar-label">{{ ['一', '二', '三', '四', '五', '六', '日'][day.day - 1] }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== INFO: 快捷入口 + 公告 + 待办 ===== -->
    <section class="zone-info">
      <span class="zone-tag">信息</span>
      <div class="info-grid">
        <!-- 快捷入口 -->
        <div class="info-card">
          <div class="sec-header">
            <span class="sec-icon">▦</span>
            <span>快捷入口</span>
          </div>
          <div class="qlist">
            <div v-for="card in currentCards" :key="card.title" class="qitem" @click="navigateTo(card.path)">
              <span class="qdot"></span>
              <div class="qinfo">
                <span class="qtitle">{{ card.title }}</span>
                <span class="qdesc">{{ card.desc }}</span>
              </div>
              <span class="qarrow">›</span>
            </div>
          </div>
        </div>

        <!-- 公告 -->
        <div class="info-card">
          <div class="sec-header">
            <span class="sec-icon">▤</span>
            <span>公告</span>
            <span class="sec-badge">{{ announcements.length }}</span>
          </div>
          <div class="nlist">
            <div v-for="item in announcements" :key="item.id" class="nitem" :class="item.type">
              <span class="ndot"></span>
              <div class="ncontent">
                <span class="ntitle">{{ item.title }}</span>
                <span class="ntime">{{ item.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 待办 -->
        <div class="info-card">
          <div class="sec-header">
            <span class="sec-icon">▧</span>
            <span>待办</span>
            <span class="sec-badge">{{ todos.filter(t => !t.completed).length }}</span>
          </div>
          <div class="tlist">
            <div v-for="todo in todos" :key="todo.id" class="titem" :class="{ done: todo.completed }" @click="toggleTodo(todo.id)">
              <span class="tcheck">{{ todo.completed ? '✓' : '○' }}</span>
              <span class="ttext">{{ todo.title }}</span>
              <span class="ttag" :class="todo.priority">{{ todo.deadline }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== SECONDARY: 最近访问 + 收藏/教师/管理员 ===== -->
    <section class="zone-secondary">
      <span class="zone-tag">辅助</span>
      <div class="secondary-grid">
        <!-- 最近访问 -->
        <div class="sec-card">
          <div class="sec-header">
            <span class="sec-icon">▨</span>
            <span>最近访问</span>
          </div>
          <div class="rlist">
            <div v-for="visit in recentVisits" :key="visit.id" class="ritem" @click="navigateTo(visit.path)">
              <span class="rtime">{{ visit.time }}</span>
              <span class="rtitle">{{ visit.title }}</span>
            </div>
          </div>
        </div>

        <!-- 学生：收藏课程 -->
        <div class="sec-card" v-if="isStudent">
          <div class="sec-header">
            <span class="sec-icon">★</span>
            <span>收藏课程</span>
            <span class="sec-badge">{{ favoriteCourses.length }}</span>
          </div>
          <div class="flist">
            <div v-for="course in favoriteCourses" :key="course.id" class="fitem" @click="navigateTo(`/app/student/course/${course.id}`)">
              <span class="fthumb">{{ course.title.charAt(0) }}</span>
              <div class="finfo">
                <span class="ftitle">{{ course.title }}</span>
                <span class="fteacher">{{ course.teacherName }}</span>
              </div>
            </div>
            <div v-if="favoriteCourses.length === 0" class="fempty">暂无收藏</div>
          </div>
        </div>

        <!-- 教师：待批改 + 班级 -->
        <div class="sec-card" v-if="isTeacher">
          <div class="sec-header">
            <span class="sec-icon">!</span>
            <span>待处理</span>
          </div>
          <div class="pend-row">
            <div class="pend-item" @click="navigateTo('/app/teacher/grading')">
              <span class="pend-num">12</span>
              <span class="pend-label">作业待批改</span>
            </div>
            <div class="pend-item" @click="navigateTo('/app/teacher/courses')">
              <span class="pend-num">3</span>
              <span class="pend-label">课程待审核</span>
            </div>
          </div>
        </div>

        <!-- 管理员：系统概览 -->
        <div class="sec-card" v-if="isAdmin">
          <div class="sec-header">
            <span class="sec-icon">◉</span>
            <span>系统概览</span>
          </div>
          <div class="sys-row">
            <div class="sys-cell">
              <span class="sys-num">353</span>
              <span class="sys-label">用户</span>
            </div>
            <div class="sys-cell">
              <span class="sys-num">51</span>
              <span class="sys-label">课程</span>
            </div>
            <div class="sys-cell">
              <span class="sys-num">3</span>
              <span class="sys-label">待审</span>
            </div>
            <div class="sys-cell">
              <span class="sys-num">180</span>
              <span class="sys-label">活跃</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ===== 全局容器 ===== */
.dash {
  width: calc(100% + 44px);
  margin: -22px;
  min-height: 100vh;
  background: var(--bg-100);
  color: var(--text-100);
  font-family: var(--font-body);
}

/* ===== HEADER ===== */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 24px;
  background: var(--bg-200);
  border-bottom: 1px solid var(--bg-300);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-100);
  letter-spacing: 0.04em;
}

.brand-icon { color: var(--primary-100); font-size: 22px; }
.brand-sep { color: var(--text-200); }

.brand-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: color-mix(in srgb, var(--primary-100) 10%, transparent);
  color: var(--primary-100);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary-100);
  animation: pulse-live 1.2s infinite;
}

.header-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-200);
  letter-spacing: 0.03em;
}

.sub-item em { font-style: normal; }
.sub-active { color: var(--primary-100); font-weight: 600; }
.sub-sep { color: var(--bg-300); }

.header-right {
  text-align: right;
  font-size: 12px;
  color: var(--text-200);
}

.header-status { margin-bottom: 4px; letter-spacing: 0.03em; }

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  font-size: 13px;
  color: var(--text-100);
}

.user-sep { color: var(--bg-300); }

@keyframes pulse-live {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

/* ===== ZONE TAG ===== */
.zone-tag {
  display: inline-block;
  position: absolute;
  top: 10px;
  left: 14px;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--text-200);
  opacity: 0.5;
  pointer-events: none;
}

/* ===== HERO BANNER ===== */
.zone-hero {
  position: relative;
  padding: 28px 24px 24px;
  background: var(--bg-200);
  border-bottom: 1px solid var(--bg-300);
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
}

.hero-streak,
.hero-weekly {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.hero-num {
  font-size: 52px;
  font-weight: 700;
  line-height: 1;
  color: var(--accent-100);
}

.hero-unit {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-200);
  letter-spacing: 0.06em;
}

.hero-label {
  font-size: 10px;
  color: var(--text-200);
  letter-spacing: 0.1em;
  margin-left: 4px;
}

.hero-divider {
  width: 1px;
  height: 40px;
  background: var(--bg-300);
}

.hero-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-progress-label {
  font-size: 10px;
  color: var(--text-200);
  letter-spacing: 0.08em;
}

.hero-bar {
  width: 160px;
  height: 8px;
  background: var(--bg-300);
}

.hero-bar-fill {
  height: 100%;
  background: var(--primary-100);
  transition: width 0.3s ease;
}

.hero-progress-val {
  font-size: 12px;
  color: var(--text-100);
  font-weight: 600;
}

/* ===== CAPABILITY PANEL ===== */
.zone-cap {
  position: relative;
  padding: 28px 24px 20px;
  border-bottom: 1px solid var(--bg-300);
}

.cap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.cap-card {
  padding: 20px;
  background: var(--bg-200);
}

.cap-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-100);
  margin-bottom: 16px;
}

.cap-icon { color: var(--primary-100); font-size: 16px; }

/* 多模态模块列表 */
.mod-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.mod-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-100);
  transition: background 0.15s;
}

.mod-item.clickable { cursor: pointer; }
.mod-item.clickable:hover { background: color-mix(in srgb, var(--primary-100) 5%, var(--bg-100)); }

.mod-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mod-dot.active { background: var(--primary-100); }
.mod-dot.standby { background: color-mix(in srgb, var(--accent-100) 80%, #f59e0b 20%); }
.mod-dot.offline { background: var(--text-200); }

.mod-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-100);
  letter-spacing: 0.04em;
  min-width: 100px;
}

.mod-label {
  flex: 1;
  font-size: 11px;
  color: var(--text-200);
}

.mod-status {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 2px 6px;
}

.mod-status.active { color: var(--primary-100); background: color-mix(in srgb, var(--primary-100) 10%, transparent); }
.mod-status.standby { color: var(--accent-100); background: color-mix(in srgb, var(--accent-100) 10%, transparent); }
.mod-status.offline { color: var(--text-200); background: var(--bg-300); }

/* Pipeline */
.pipeline {
  padding-top: 12px;
  border-top: 1px solid var(--bg-300);
}

.pipeline-label {
  font-size: 10px;
  color: var(--text-200);
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  display: block;
}

.pipeline-flow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pipe-node {
  font-size: 11px;
  color: var(--primary-100);
  font-weight: 600;
}

.pipe-arrow {
  font-size: 12px;
  color: var(--text-200);
}

/* Agent 列表 */
.agent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-100);
  transition: background 0.15s;
}

.agent-item.clickable { cursor: pointer; }
.agent-item.clickable:hover { background: color-mix(in srgb, var(--primary-100) 5%, var(--bg-100)); }

.agent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.agent-dot.online { background: var(--primary-100); animation: pulse-live 1.5s infinite; }
.agent-dot.offline { background: var(--text-200); }

.agent-id {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-100);
  letter-spacing: 0.04em;
  min-width: 100px;
}

.agent-label {
  flex: 1;
  font-size: 11px;
  color: var(--text-200);
}

.agent-tasks {
  font-size: 10px;
  color: var(--text-200);
  padding: 2px 6px;
  background: var(--bg-300);
}

.agent-status {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 2px 6px;
}

.agent-status.online { color: var(--primary-100); background: color-mix(in srgb, var(--primary-100) 10%, transparent); }
.agent-status.offline { color: var(--text-200); background: var(--bg-300); }

/* Flow list */
.flow-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flow-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.flow-desc {
  color: var(--text-200);
  min-width: 36px;
}

.flow-chain {
  color: var(--primary-100);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.flow-result {
  color: var(--text-100);
}

/* ===== PRIMARY ZONE ===== */
.zone-primary {
  position: relative;
  padding: 28px 24px 20px;
  border-bottom: 1px solid var(--bg-300);
}

.primary-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.primary-calendar,
.primary-week {
  background: var(--bg-200);
  padding: 20px;
}

.calendar-box {
  height: 280px;
}

.calendar-box :deep(.calendar-chart-container),
.calendar-box :deep(.calendar-chart) {
  width: 100% !important;
  height: 100% !important;
}

/* Section header (shared) */
.sec-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-100);
}

.sec-icon { color: var(--primary-100); font-size: 15px; }

.sec-badge {
  margin-left: auto;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 600;
  background: var(--bg-300);
  color: var(--text-200);
}

/* Weekly stats */
.week-total {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 16px;
}

.week-num {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-100);
}

.week-unit {
  font-size: 16px;
  color: var(--text-200);
}

.week-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100px;
  gap: 8px;
}

.wbar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.wbar-track {
  width: 100%;
  height: 80px;
  background: var(--bg-300);
  position: relative;
}

.wbar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--primary-100);
  transition: height 0.3s ease;
}

.wbar-label {
  font-size: 11px;
  color: var(--text-200);
}

/* ===== INFO ZONE ===== */
.zone-info {
  position: relative;
  padding: 28px 24px 20px;
  border-bottom: 1px solid var(--bg-300);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.info-card {
  background: var(--bg-200);
  padding: 20px;
}

/* Quick access */
.qlist { display: flex; flex-direction: column; gap: 8px; }

.qitem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-100);
  cursor: pointer;
  transition: background 0.15s;
}

.qitem:hover { background: color-mix(in srgb, var(--primary-100) 5%, var(--bg-100)); }

.qdot {
  width: 7px;
  height: 7px;
  background: var(--primary-100);
  border-radius: 50%;
  flex-shrink: 0;
}

.qinfo { flex: 1; }
.qtitle { font-size: 13px; font-weight: 600; color: var(--text-100); display: block; }
.qdesc { font-size: 11px; color: var(--text-200); display: block; margin-top: 2px; }

.qarrow { color: var(--text-200); font-size: 16px; }
.qitem:hover .qarrow { color: var(--primary-100); }

/* Notices */
.nlist { display: flex; flex-direction: column; gap: 8px; }

.nitem {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: var(--bg-100);
}

.ndot {
  width: 7px;
  height: 7px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--text-200);
  flex-shrink: 0;
}

.nitem.warning .ndot { background: var(--accent-100); }
.nitem.success .ndot { background: var(--primary-100); }

.ncontent { flex: 1; }
.ntitle { font-size: 13px; font-weight: 600; color: var(--text-100); display: block; }
.ntime { font-size: 11px; color: var(--text-200); display: block; margin-top: 3px; }

/* Todo */
.tlist { display: flex; flex-direction: column; gap: 6px; }

.titem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  background: var(--bg-100);
  cursor: pointer;
  transition: background 0.15s;
}

.titem:hover { background: color-mix(in srgb, var(--primary-100) 5%, var(--bg-100)); }

.tcheck { font-size: 14px; color: var(--text-200); }
.titem.done .tcheck { color: var(--primary-100); }

.ttext { flex: 1; font-size: 13px; color: var(--text-100); }
.titem.done .ttext { text-decoration: line-through; color: var(--text-200); }

.ttag {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--bg-300);
  color: var(--text-200);
}

.ttag.high {
  background: color-mix(in srgb, var(--accent-100) 15%, transparent);
  color: var(--accent-100);
}

.ttag.medium {
  background: color-mix(in srgb, var(--primary-100) 15%, transparent);
  color: var(--primary-100);
}

/* ===== SECONDARY ZONE ===== */
.zone-secondary {
  position: relative;
  padding: 28px 24px 20px;
}

.secondary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.sec-card {
  background: var(--bg-200);
  padding: 20px;
}

/* Recent */
.rlist { display: flex; flex-direction: column; gap: 6px; }

.ritem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  background: var(--bg-100);
  cursor: pointer;
  transition: background 0.15s;
}

.ritem:hover { background: color-mix(in srgb, var(--primary-100) 5%, var(--bg-100)); }

.rtime { font-size: 11px; color: var(--text-200); min-width: 56px; }
.rtitle { flex: 1; font-size: 13px; color: var(--text-100); }

/* Favorites */
.flist { display: flex; flex-direction: column; gap: 8px; }

.fitem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--bg-100);
  cursor: pointer;
  transition: background 0.15s;
}

.fitem:hover { background: color-mix(in srgb, var(--primary-100) 5%, var(--bg-100)); }

.fthumb {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-300);
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-100);
  flex-shrink: 0;
}

.finfo { flex: 1; }
.ftitle { font-size: 13px; font-weight: 600; color: var(--text-100); display: block; }
.fteacher { font-size: 11px; color: var(--text-200); display: block; margin-top: 2px; }

.fempty {
  text-align: center;
  padding: 28px;
  font-size: 12px;
  color: var(--text-200);
}

/* Pending (teacher) */
.pend-row {
  display: flex;
  gap: 12px;
}

.pend-item {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: var(--bg-100);
  cursor: pointer;
  transition: background 0.15s;
}

.pend-item:hover { background: color-mix(in srgb, var(--primary-100) 5%, var(--bg-100)); }

.pend-num {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: var(--accent-100);
  line-height: 1;
  margin-bottom: 8px;
}

.pend-label {
  font-size: 12px;
  color: var(--text-200);
}

/* System (admin) */
.sys-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.sys-cell {
  text-align: center;
  padding: 18px 10px;
  background: var(--bg-100);
}

.sys-num {
  display: block;
  font-size: 30px;
  font-weight: 700;
  color: var(--primary-100);
  line-height: 1;
  margin-bottom: 6px;
}

.sys-label {
  font-size: 11px;
  color: var(--text-200);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
  .cap-grid { grid-template-columns: 1fr; }
  .primary-grid { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .dash {
    width: calc(100% + 32px);
    margin: -16px;
  }

  .dash-header {
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px;
  }

  .header-right { text-align: left; }
  .header-user { justify-content: flex-start; }

  .hero-content {
    flex-direction: column;
    gap: 16px;
  }

  .hero-divider {
    width: 80px;
    height: 1px;
  }

  .hero-bar { width: 120px; }

  .info-grid { grid-template-columns: 1fr; }
  .secondary-grid { grid-template-columns: 1fr; }
  .sys-row { grid-template-columns: repeat(2, 1fr); }

  .zone-hero,
  .zone-cap,
  .zone-primary,
  .zone-info,
  .zone-secondary {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>

