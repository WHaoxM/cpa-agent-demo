<!-- 页面：职途导航；路由：student/career-navigation；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'
import { useCareerInsights, roleOptions } from '@/composables/useCareerInsights'
import type { CareerRole } from '@/composables/useCareerInsights'

const { targetRole } = useCareerInsights()

/* ═══ 主题色（与 CareerAnalysis 统一） ═══ */
const C = {
  bg: '#F7F2E8',
  panel: '#EDE5D6',
  panelBorder: '#D4C9B5',
  zhusha: '#8B2500',
  zhushaLight: '#A0472D',
  gold: '#8B6914',
  accent: '#2B4C6F',
  green: '#5B7744',
  textPrimary: '#1A1410',
  textSecondary: '#6B5D4F',
  textMuted: '#9C8B78',
}
void C

/* ═══ 职业路径数据 ═══ */
type Stage = {
  id: string
  level: number
  name: string
  alias: string
  years: string
  salary: string
  salaryNum: [number, number]
  icon: string
  skills: string[]
  milestones: string[]
  status: 'completed' | 'current' | 'locked'
}

type RoadmapData = {
  role: CareerRole
  color: string
  icon: string
  stages: Stage[]
}

const roadmapMap: Record<CareerRole, RoadmapData> = {
  前端开发: {
    role: '前端开发',
    color: '#2B4C6F',
    icon: 'lucide:monitor',
    stages: [
      {
        id: 'fe-1', level: 1, name: '初级前端工程师', alias: '初级', years: '0–1 年',
        salary: '8 – 15K', salaryNum: [8, 15], icon: 'lucide:seedling',
        skills: ['HTML / CSS', 'JavaScript 基础', 'Vue 3 基础', 'Git 基础'],
        milestones: ['独立完成简单页面还原', '能读懂他人代码并提 PR', '理解组件化思想'],
        status: 'completed',
      },
      {
        id: 'fe-2', level: 2, name: '中级前端工程师', alias: '中级', years: '1–3 年',
        salary: '15 – 25K', salaryNum: [15, 25], icon: 'lucide:code-2',
        skills: ['TypeScript', 'Vue 3 Composition API', '状态管理 Pinia', '工程化 Vite'],
        milestones: ['独立负责模块开发', '性能优化实践', '参与技术方案评审'],
        status: 'current',
      },
      {
        id: 'fe-3', level: 3, name: '高级前端工程师', alias: '高级', years: '3–6 年',
        salary: '25 – 40K', salaryNum: [25, 40], icon: 'lucide:layers',
        skills: ['架构设计', 'SSR / 微前端', '性能监控', '跨端开发'],
        milestones: ['主导复杂项目架构', '搭建团队工程体系', '制定技术规范'],
        status: 'locked',
      },
      {
        id: 'fe-4', level: 4, name: '技术专家', alias: '专家', years: '6–10 年',
        salary: '40 – 60K', salaryNum: [40, 60], icon: 'lucide:star',
        skills: ['技术决策', '前端基础设施', '团队技术培养', '业务架构'],
        milestones: ['影响跨团队技术方向', '构建前端基础设施', '主导大型项目落地'],
        status: 'locked',
      },
      {
        id: 'fe-5', level: 5, name: '架构师 / 技术负责人', alias: '架构师', years: '10 年+',
        salary: '60K+', salaryNum: [60, 100], icon: 'lucide:crown',
        skills: ['全链路架构', '组织技术战略', '技术选型决策', '跨部门协作'],
        milestones: ['制定公司级技术战略', '输出行业影响力', '打造技术品牌'],
        status: 'locked',
      },
    ],
  },
  后端开发: {
    role: '后端开发',
    color: '#5B7744',
    icon: 'lucide:server',
    stages: [
      {
        id: 'be-1', level: 1, name: '初级后端工程师', alias: '初级', years: '0–1 年',
        salary: '8 – 14K', salaryNum: [8, 14], icon: 'lucide:seedling',
        skills: ['Java / Spring Boot 基础', 'MySQL 基础', 'Git 操作', 'HTTP 协议'],
        milestones: ['能完成 CRUD 接口开发', '理解 MVC 分层架构', '参与联调测试'],
        status: 'completed',
      },
      {
        id: 'be-2', level: 2, name: '中级后端工程师', alias: '中级', years: '1–3 年',
        salary: '14 – 25K', salaryNum: [14, 25], icon: 'lucide:database',
        skills: ['Redis 缓存', 'MySQL 索引优化', 'JWT 鉴权', 'MQ 消息队列'],
        milestones: ['独立完成业务模块', '接口性能调优', '参与数据库设计'],
        status: 'current',
      },
      {
        id: 'be-3', level: 3, name: '高级后端工程师', alias: '高级', years: '3–6 年',
        salary: '25 – 45K', salaryNum: [25, 45], icon: 'lucide:cpu',
        skills: ['分布式架构', '微服务设计', 'RPC / gRPC', '性能压测与调优'],
        milestones: ['主导服务架构设计', '高并发场景落地', '推进技术方案落地'],
        status: 'locked',
      },
      {
        id: 'be-4', level: 4, name: '后端技术专家', alias: '专家', years: '6–10 年',
        salary: '45 – 65K', salaryNum: [45, 65], icon: 'lucide:star',
        skills: ['系统稳定性', '灾备设计', '技术沉淀与输出', '团队培养'],
        milestones: ['构建核心基础服务', '推进技术中台', '影响业务技术方向'],
        status: 'locked',
      },
      {
        id: 'be-5', level: 5, name: '架构师 / CTO', alias: '架构师', years: '10 年+',
        salary: '65K+', salaryNum: [65, 120], icon: 'lucide:crown',
        skills: ['企业级架构', '技术战略规划', '研发效能体系', '组织管理'],
        milestones: ['制定公司研发战略', '引领技术演进', '打造研发组织文化'],
        status: 'locked',
      },
    ],
  },
  测试开发: {
    role: '测试开发',
    color: '#7B5EA7',
    icon: 'lucide:flask-conical',
    stages: [
      {
        id: 'qe-1', level: 1, name: '初级测试工程师', alias: '初级', years: '0–1 年',
        salary: '7 – 12K', salaryNum: [7, 12], icon: 'lucide:seedling',
        skills: ['手动测试', 'Bug 报告', 'Postman 接口测试', 'Git 基础'],
        milestones: ['能编写测试用例', '完成功能冒烟测试', '参与回归测试'],
        status: 'completed',
      },
      {
        id: 'qe-2', level: 2, name: '中级测试开发工程师', alias: '中级', years: '1–3 年',
        salary: '12 – 20K', salaryNum: [12, 20], icon: 'lucide:terminal',
        skills: ['Playwright / Selenium', 'Python 脚本', '接口自动化', 'CI 集成'],
        milestones: ['搭建自动化测试框架', '接口测试覆盖 80%+', '与 CI/CD 集成'],
        status: 'current',
      },
      {
        id: 'qe-3', level: 3, name: '高级测试开发工程师', alias: '高级', years: '3–6 年',
        salary: '20 – 35K', salaryNum: [20, 35], icon: 'lucide:shield-check',
        skills: ['性能测试 / 压测', '安全测试', '质量体系建设', '测试平台开发'],
        milestones: ['建立质量保障体系', '主导测试平台建设', '推进分层测试策略'],
        status: 'locked',
      },
      {
        id: 'qe-4', level: 4, name: '测试架构师', alias: '架构师', years: '6 年+',
        salary: '35 – 55K', salaryNum: [35, 55], icon: 'lucide:crown',
        skills: ['测试基础设施', '智能化测试', 'DevOps', '工程效能'],
        milestones: ['驱动全公司质量文化', '智能化测试探索', '引领测试行业标准'],
        status: 'locked',
      },
      {
        id: 'qe-5', level: 5, name: '工程效能负责人', alias: '负责人', years: '8 年+',
        salary: '55K+', salaryNum: [55, 90], icon: 'lucide:trophy',
        skills: ['研发效能度量', '平台化建设', '组织能力建设', '战略决策'],
        milestones: ['制定效能提升战略', '建立工程师文化', '输出行业最佳实践'],
        status: 'locked',
      },
    ],
  },
  数据分析: {
    role: '数据分析',
    color: '#8B6914',
    icon: 'lucide:bar-chart-2',
    stages: [
      {
        id: 'da-1', level: 1, name: '初级数据分析师', alias: '初级', years: '0–1 年',
        salary: '8 – 13K', salaryNum: [8, 13], icon: 'lucide:seedling',
        skills: ['Excel / SQL 基础', '数据清洗', 'Python 基础', '基础统计学'],
        milestones: ['能完成数据报表制作', '基础 SQL 查询', '参与日常数据取数'],
        status: 'completed',
      },
      {
        id: 'da-2', level: 2, name: '中级数据分析师', alias: '中级', years: '1–3 年',
        salary: '13 – 22K', salaryNum: [13, 22], icon: 'lucide:trending-up',
        skills: ['Python Pandas', 'BI 工具', 'A/B 测试', '指标体系建立'],
        milestones: ['独立完成专题分析', '建立数据看板', '支撑业务决策'],
        status: 'current',
      },
      {
        id: 'da-3', level: 3, name: '高级数据分析师', alias: '高级', years: '3–6 年',
        salary: '22 – 38K', salaryNum: [22, 38], icon: 'lucide:brain-circuit',
        skills: ['机器学习应用', '大数据处理', '埋点体系设计', '增长分析方法论'],
        milestones: ['主导增长分析项目', '建立指标体系', '影响产品策略'],
        status: 'locked',
      },
      {
        id: 'da-4', level: 4, name: '数据科学家', alias: '科学家', years: '5 年+',
        salary: '38 – 60K', salaryNum: [38, 60], icon: 'lucide:star',
        skills: ['深度学习', '因果推断', '实验设计', '算法模型'],
        milestones: ['主导算法模型落地', '推进数据驱动文化', '输出方法论沉淀'],
        status: 'locked',
      },
      {
        id: 'da-5', level: 5, name: '数据负责人 / CDO', alias: '负责人', years: '8 年+',
        salary: '60K+', salaryNum: [60, 100], icon: 'lucide:crown',
        skills: ['数据战略规划', '数据中台', '组织数据文化', '商业决策支撑'],
        milestones: ['制定公司数据战略', '构建数据中台', '引领数字化转型'],
        status: 'locked',
      },
    ],
  },
  机器学习工程师: {
    role: '机器学习工程师',
    color: '#8B2500',
    icon: 'lucide:brain',
    stages: [
      {
        id: 'ml-1', level: 1, name: '初级机器学习工程师', alias: '初级', years: '0–1 年',
        salary: '10 – 18K', salaryNum: [10, 18], icon: 'lucide:seedling',
        skills: ['Python', '机器学习基础', 'Scikit-learn', '数据预处理'],
        milestones: ['能复现经典算法', '参与数据标注流程', '完成模型训练任务'],
        status: 'completed',
      },
      {
        id: 'ml-2', level: 2, name: '中级机器学习工程师', alias: '中级', years: '1–3 年',
        salary: '18 – 30K', salaryNum: [18, 30], icon: 'lucide:cpu',
        skills: ['深度学习 PyTorch', '特征工程', '模型评估调优', '数据管道'],
        milestones: ['独立完成模型迭代', '模型在线推理部署', '参与算法方案设计'],
        status: 'current',
      },
      {
        id: 'ml-3', level: 3, name: '高级机器学习工程师', alias: '高级', years: '3–6 年',
        salary: '30 – 50K', salaryNum: [30, 50], icon: 'lucide:zap',
        skills: ['大模型 / LLM', 'MLOps 工程化', '分布式训练', '系统优化'],
        milestones: ['主导模型系统设计', 'MLOps 平台建设', '算法创新产出'],
        status: 'locked',
      },
      {
        id: 'ml-4', level: 4, name: 'AI 科学家 / 算法专家', alias: '专家', years: '5 年+',
        salary: '50 – 80K', salaryNum: [50, 80], icon: 'lucide:star',
        skills: ['前沿算法研究', 'Prompt Engineering', '模型蒸馏压缩', '业务落地'],
        milestones: ['发表/参与顶会论文', '引领算法方向', '建立算法影响力'],
        status: 'locked',
      },
      {
        id: 'ml-5', level: 5, name: 'AI 技术负责人 / 首席科学家', alias: '首席', years: '8 年+',
        salary: '80K+', salaryNum: [80, 150], icon: 'lucide:crown',
        skills: ['AI 战略规划', '技术方向引领', '商业化落地', '团队建设'],
        milestones: ['制定公司 AI 战略', '推进 AI 产品化', '引领行业技术趋势'],
        status: 'locked',
      },
    ],
  },
}

const currentRoadmap = computed(() => roadmapMap[targetRole.value])

const selectedStageId = ref<string | null>(null)
const selectedStage = computed<Stage | null>(() => {
  if (!selectedStageId.value) return currentRoadmap.value.stages.find(s => s.status === 'current') ?? null
  return currentRoadmap.value.stages.find(s => s.id === selectedStageId.value) ?? null
})

function selectStage(id: string) {
  selectedStageId.value = id
}

function onRoleChange(role: CareerRole) {
  targetRole.value = role
  selectedStageId.value = null
}

/* ═══ 进度计算 ═══ */
const progressPercent = computed(() => {
  const stages = currentRoadmap.value.stages
  const currentIdx = stages.findIndex(s => s.status === 'current')
  if (currentIdx < 0) return 0
  return Math.round(((currentIdx + 0.5) / stages.length) * 100)
})

/* ═══ 薪资图宽度计算 ═══ */
function salaryBarWidth(stage: Stage): number {
  const maxSalary = 150
  return Math.min(100, (stage.salaryNum[1] / maxSalary) * 100)
}

/* ═══ GSAP 动画 ═══ */
const containerRef = ref<HTMLElement | null>(null)
let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (!containerRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    gsap.fromTo('.cn-hero', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    gsap.fromTo('.cn-stage-card', { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.06, duration: 0.3, ease: 'power2.out', delay: 0.1 })
    gsap.fromTo('.cn-detail-panel', { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', delay: 0.25 })
  }, containerRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})

/* ═══ 状态样式映射 ═══ */
const statusLabel: Record<Stage['status'], string> = {
  completed: '已完成',
  current: '当前阶段',
  locked: '待解锁',
}
</script>

<template>
  <div ref="containerRef" class="cn-root">
    <!-- 顶部标题栏 -->
    <div class="cn-hero">
      <div class="cn-hero-left">
        <div class="cn-hero-seal">
          <Icon icon="lucide:route" class="cn-hero-icon" />
        </div>
        <div class="cn-hero-text">
          <h1 class="cn-hero-title">职途导航</h1>
          <p class="cn-hero-sub">规划职业成长路径 · 明确当前阶段目标</p>
        </div>
      </div>
      <div class="cn-progress-bar-wrap">
        <span class="cn-progress-label">整体进度</span>
        <div class="cn-progress-track">
          <div class="cn-progress-fill" :style="{ width: progressPercent + '%' }" />
        </div>
        <span class="cn-progress-pct">{{ progressPercent }}%</span>
      </div>
    </div>

    <!-- 角色切换 -->
    <div class="cn-role-tabs">
      <button
        v-for="role in roleOptions"
        :key="role"
        class="cn-role-tab"
        :class="{ 'is-active': targetRole === role }"
        @click="onRoleChange(role)"
      >
        <Icon :icon="roadmapMap[role].icon" class="cn-role-tab-icon" />
        <span>{{ role }}</span>
      </button>
    </div>

    <!-- 主体 -->
    <div class="cn-body">
      <!-- 左：阶段路径 -->
      <div class="cn-stages">
        <div class="cn-stages-header">
          <span class="cn-stages-title">成长路径</span>
          <span class="cn-stages-role-badge">{{ targetRole }}</span>
        </div>

        <div class="cn-stage-list">
          <div
            v-for="(stage, idx) in currentRoadmap.stages"
            :key="stage.id"
            class="cn-stage-card"
            :class="[`is-${stage.status}`, { 'is-selected': selectedStage?.id === stage.id }]"
            @click="selectStage(stage.id)"
          >
            <!-- 连接线 -->
            <div v-if="idx < currentRoadmap.stages.length - 1" class="cn-connector" :class="`is-${stage.status}`" />

            <!-- 节点圆点 -->
            <div class="cn-node-dot" :class="`is-${stage.status}`">
              <Icon v-if="stage.status === 'completed'" icon="lucide:check" class="cn-node-icon" />
              <Icon v-else-if="stage.status === 'current'" icon="lucide:circle-dot" class="cn-node-icon" />
              <span v-else class="cn-node-num">{{ stage.level }}</span>
            </div>

            <!-- 卡片内容 -->
            <div class="cn-stage-content">
              <div class="cn-stage-head">
                <span class="cn-stage-name">{{ stage.name }}</span>
                <span class="cn-stage-status-tag" :class="`is-${stage.status}`">{{ statusLabel[stage.status] }}</span>
              </div>
              <div class="cn-stage-meta">
                <span class="cn-meta-item">
                  <Icon icon="lucide:clock" class="cn-meta-icon" />{{ stage.years }}
                </span>
                <span class="cn-meta-sep">·</span>
                <span class="cn-meta-item cn-meta-salary">
                  <Icon icon="lucide:banknote" class="cn-meta-icon" />{{ stage.salary }} / 月
                </span>
              </div>

              <!-- 技能标签（仅展开态） -->
              <div class="cn-stage-skills">
                <span v-for="sk in stage.skills.slice(0, 3)" :key="sk" class="cn-skill-tag">{{ sk }}</span>
                <span v-if="stage.skills.length > 3" class="cn-skill-tag cn-skill-more">+{{ stage.skills.length - 3 }}</span>
              </div>

              <!-- 薪资条 -->
              <div class="cn-salary-bar-wrap">
                <div class="cn-salary-bar-track">
                  <div
                    class="cn-salary-bar-fill"
                    :class="`is-${stage.status}`"
                    :style="{ width: salaryBarWidth(stage) + '%' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：阶段详情 -->
      <div class="cn-detail-panel" v-if="selectedStage">
        <div class="cn-detail-header">
          <div class="cn-detail-icon-wrap" :class="`is-${selectedStage.status}`">
            <Icon :icon="selectedStage.icon" class="cn-detail-icon" />
          </div>
          <div>
            <div class="cn-detail-title">{{ selectedStage.name }}</div>
            <div class="cn-detail-alias">{{ selectedStage.alias }} · {{ selectedStage.years }}</div>
          </div>
        </div>

        <!-- 薪资区间 -->
        <div class="cn-detail-section">
          <div class="cn-detail-section-label">薪资区间</div>
          <div class="cn-detail-salary">
            <span class="cn-detail-salary-num">{{ selectedStage.salary }}</span>
            <span class="cn-detail-salary-unit">/ 月 · 全国中位数参考</span>
          </div>
          <div class="cn-detail-salary-bar-track">
            <div
              class="cn-detail-salary-bar-fill"
              :class="`is-${selectedStage.status}`"
              :style="{ width: salaryBarWidth(selectedStage) + '%' }"
            />
          </div>
        </div>

        <!-- 核心技能 -->
        <div class="cn-detail-section">
          <div class="cn-detail-section-label">核心技能要求</div>
          <div class="cn-detail-skills-list">
            <div v-for="(sk, i) in selectedStage.skills" :key="sk" class="cn-detail-skill-item">
              <span class="cn-detail-skill-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <Icon icon="lucide:circle-dot" class="cn-detail-skill-dot" :class="`is-${selectedStage.status}`" />
              <span class="cn-detail-skill-name">{{ sk }}</span>
            </div>
          </div>
        </div>

        <!-- 里程碑目标 -->
        <div class="cn-detail-section">
          <div class="cn-detail-section-label">阶段里程碑</div>
          <div class="cn-detail-milestones">
            <div v-for="(m, i) in selectedStage.milestones" :key="i" class="cn-detail-milestone">
              <Icon
                :icon="selectedStage.status === 'completed' ? 'lucide:check-circle-2' : 'lucide:circle'"
                class="cn-milestone-icon"
                :class="`is-${selectedStage.status}`"
              />
              <span>{{ m }}</span>
            </div>
          </div>
        </div>

        <!-- 行动建议 -->
        <div class="cn-detail-section" v-if="selectedStage.status !== 'completed'">
          <div class="cn-detail-section-label">行动建议</div>
          <div class="cn-action-box" :class="`is-${selectedStage.status}`">
            <template v-if="selectedStage.status === 'current'">
              <p class="cn-action-text">你正处于此阶段，建议聚焦核心技能夯实，参与真实项目积累经验。</p>
              <div class="cn-action-btns">
                <button class="cn-action-btn cn-action-btn--primary" @click="$router.push('/app/student/skills')">
                  <Icon icon="lucide:layers" />查看技能管理
                </button>
                <button class="cn-action-btn" @click="$router.push('/app/student/ai-assistant')">
                  <Icon icon="lucide:bot" />AI 规划建议
                </button>
              </div>
            </template>
            <template v-else>
              <p class="cn-action-text">先完成当前阶段目标，积累相关工作经验后再挑战此阶段。</p>
              <button class="cn-action-btn" @click="$router.push('/app/student/career-analysis')">
                <Icon icon="lucide:target" />查看职业分析
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- 未选中时的占位 -->
      <div class="cn-detail-panel cn-detail-empty" v-else>
        <Icon icon="lucide:route" class="cn-empty-icon" />
        <p class="cn-empty-text">点击左侧阶段卡片查看详细规划</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cn-root {
  min-height: 100%;
  background: #F7F2E8;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: var(--font-title, 'LXGW WenKai', serif);
}

/* ── 顶部标题 ── */
.cn-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 24px;
  background: #EDE5D6;
  border: 1px solid #D4C9B5;
  border-radius: 2px;
}

.cn-hero-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cn-hero-seal {
  width: 48px;
  height: 48px;
  border: 2px solid #8B2500;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.cn-hero-icon {
  font-size: 22px;
  color: #8B2500;
}

.cn-hero-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A1410;
  letter-spacing: 0.06em;
  margin: 0 0 2px;
}

.cn-hero-sub {
  font-size: 12px;
  color: #6B5D4F;
  letter-spacing: 0.04em;
  margin: 0;
}

.cn-progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cn-progress-label {
  font-size: 12px;
  color: #6B5D4F;
  white-space: nowrap;
}

.cn-progress-track {
  width: 160px;
  height: 6px;
  background: #D4C9B5;
  border-radius: 3px;
  overflow: hidden;
}

.cn-progress-fill {
  height: 100%;
  background: #8B2500;
  border-radius: 3px;
  transition: width 0.8s ease;
}

.cn-progress-pct {
  font-size: 13px;
  font-weight: 700;
  color: #8B2500;
  min-width: 32px;
}

/* ── 角色标签 ── */
.cn-role-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cn-role-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1px solid #D4C9B5;
  background: #EDE5D6;
  color: #6B5D4F;
  font-family: var(--font-title, inherit);
  font-size: 13px;
  letter-spacing: 0.04em;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.cn-role-tab:hover {
  border-color: #8B2500;
  color: #8B2500;
}

.cn-role-tab.is-active {
  background: #8B2500;
  border-color: #8B2500;
  color: #F7F2E8;
}

.cn-role-tab-icon {
  font-size: 14px;
}

/* ── 主体布局 ── */
.cn-body {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}

/* ── 左侧路径 ── */
.cn-stages {
  background: #EDE5D6;
  border: 1px solid #D4C9B5;
  border-radius: 2px;
  overflow: hidden;
}

.cn-stages-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #D4C9B5;
}

.cn-stages-title {
  font-size: 14px;
  font-weight: 700;
  color: #1A1410;
  letter-spacing: 0.06em;
}

.cn-stages-role-badge {
  font-size: 12px;
  padding: 2px 10px;
  background: color-mix(in srgb, #8B2500 10%, #EDE5D6 90%);
  color: #8B2500;
  border: 1px solid color-mix(in srgb, #8B2500 25%, #D4C9B5 75%);
  border-radius: 1px;
}

.cn-stage-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── 阶段卡片 ── */
.cn-stage-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  margin-left: 0;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.cn-stage-card:hover {
  background: color-mix(in srgb, #8B2500 5%, #EDE5D6 95%);
  border-color: #D4C9B5;
}

.cn-stage-card.is-selected {
  background: color-mix(in srgb, #8B2500 8%, #F7F2E8 92%);
  border-color: color-mix(in srgb, #8B2500 30%, #D4C9B5 70%);
}

/* 连接线 */
.cn-connector {
  position: absolute;
  left: 31px;
  top: 100%;
  width: 2px;
  height: 16px;
  background: #D4C9B5;
  z-index: 1;
}

.cn-connector.is-completed {
  background: #5B7744;
}

.cn-connector.is-current {
  background: linear-gradient(to bottom, #8B2500, #D4C9B5);
}

/* 节点圆点 */
.cn-node-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #D4C9B5;
  background: #F7F2E8;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 2px;
  z-index: 2;
  position: relative;
}

.cn-node-dot.is-completed {
  border-color: #5B7744;
  background: #5B7744;
  color: #fff;
}

.cn-node-dot.is-current {
  border-color: #8B2500;
  background: #F7F2E8;
  color: #8B2500;
  box-shadow: 0 0 0 3px color-mix(in srgb, #8B2500 15%, transparent 85%);
}

.cn-node-dot.is-locked {
  border-color: #9C8B78;
  background: #F0E6D2;
  color: #9C8B78;
}

.cn-node-icon {
  font-size: 13px;
}

.cn-node-num {
  font-size: 11px;
  font-weight: 700;
}

/* 卡片内容 */
.cn-stage-content {
  flex: 1;
  min-width: 0;
}

.cn-stage-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 5px;
}

.cn-stage-name {
  font-size: 14px;
  font-weight: 700;
  color: #1A1410;
  letter-spacing: 0.03em;
}

.cn-stage-status-tag {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 1px;
}

.cn-stage-status-tag.is-completed {
  background: color-mix(in srgb, #5B7744 12%, #EDE5D6 88%);
  color: #5B7744;
  border: 1px solid color-mix(in srgb, #5B7744 30%, #D4C9B5 70%);
}

.cn-stage-status-tag.is-current {
  background: color-mix(in srgb, #8B2500 12%, #EDE5D6 88%);
  color: #8B2500;
  border: 1px solid color-mix(in srgb, #8B2500 30%, #D4C9B5 70%);
}

.cn-stage-status-tag.is-locked {
  background: color-mix(in srgb, #9C8B78 10%, #EDE5D6 90%);
  color: #9C8B78;
  border: 1px solid #D4C9B5;
}

.cn-stage-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6B5D4F;
}

.cn-meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.cn-meta-icon {
  font-size: 11px;
  opacity: 0.7;
}

.cn-meta-sep {
  opacity: 0.4;
}

.cn-meta-salary {
  color: #8B6914;
  font-weight: 600;
}

.cn-stage-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}

.cn-skill-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #F7F2E8;
  border: 1px solid #D4C9B5;
  color: #6B5D4F;
  border-radius: 1px;
}

.cn-skill-more {
  color: #9C8B78;
}

/* 薪资条 */
.cn-salary-bar-track {
  height: 3px;
  background: #D4C9B5;
  border-radius: 2px;
  overflow: hidden;
}

.cn-salary-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

.cn-salary-bar-fill.is-completed {
  background: #5B7744;
}

.cn-salary-bar-fill.is-current {
  background: #8B2500;
}

.cn-salary-bar-fill.is-locked {
  background: #9C8B78;
}

/* ── 右侧详情面板 ── */
.cn-detail-panel {
  background: #EDE5D6;
  border: 1px solid #D4C9B5;
  border-radius: 2px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 16px;
}

.cn-detail-empty {
  align-items: center;
  justify-content: center;
  min-height: 240px;
  opacity: 0.5;
}

.cn-empty-icon {
  font-size: 40px;
  color: #9C8B78;
  margin-bottom: 10px;
}

.cn-empty-text {
  font-size: 13px;
  color: #9C8B78;
}

.cn-detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid #D4C9B5;
}

.cn-detail-icon-wrap {
  width: 44px;
  height: 44px;
  border: 1.5px solid #D4C9B5;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 2px;
}

.cn-detail-icon-wrap.is-completed {
  border-color: #5B7744;
  background: color-mix(in srgb, #5B7744 10%, #EDE5D6 90%);
}

.cn-detail-icon-wrap.is-current {
  border-color: #8B2500;
  background: color-mix(in srgb, #8B2500 10%, #EDE5D6 90%);
}

.cn-detail-icon {
  font-size: 20px;
  color: #6B5D4F;
}

.cn-detail-icon-wrap.is-completed .cn-detail-icon { color: #5B7744; }
.cn-detail-icon-wrap.is-current .cn-detail-icon { color: #8B2500; }

.cn-detail-title {
  font-size: 15px;
  font-weight: 700;
  color: #1A1410;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}

.cn-detail-alias {
  font-size: 12px;
  color: #6B5D4F;
}

.cn-detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cn-detail-section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #9C8B78;
  text-transform: uppercase;
  border-left: 2px solid #8B2500;
  padding-left: 8px;
}

.cn-detail-salary {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.cn-detail-salary-num {
  font-size: 20px;
  font-weight: 700;
  color: #8B6914;
  letter-spacing: 0.02em;
}

.cn-detail-salary-unit {
  font-size: 11px;
  color: #9C8B78;
}

.cn-detail-salary-bar-track {
  height: 5px;
  background: #D4C9B5;
  border-radius: 3px;
  overflow: hidden;
}

.cn-detail-salary-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s ease;
}

.cn-detail-salary-bar-fill.is-completed { background: #5B7744; }
.cn-detail-salary-bar-fill.is-current { background: #8B2500; }
.cn-detail-salary-bar-fill.is-locked { background: #9C8B78; }

.cn-detail-skills-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cn-detail-skill-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1A1410;
}

.cn-detail-skill-num {
  font-size: 10px;
  color: #9C8B78;
  font-weight: 700;
  min-width: 18px;
}

.cn-detail-skill-dot {
  font-size: 10px;
  flex-shrink: 0;
}

.cn-detail-skill-dot.is-completed { color: #5B7744; }
.cn-detail-skill-dot.is-current { color: #8B2500; }
.cn-detail-skill-dot.is-locked { color: #9C8B78; }

.cn-detail-skill-name {
  color: #3D3228;
}

.cn-detail-milestones {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cn-detail-milestone {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #3D3228;
  line-height: 1.5;
}

.cn-milestone-icon {
  font-size: 15px;
  flex-shrink: 0;
  margin-top: 1px;
}

.cn-milestone-icon.is-completed { color: #5B7744; }
.cn-milestone-icon.is-current { color: #8B2500; }
.cn-milestone-icon.is-locked { color: #9C8B78; }

/* 行动建议 */
.cn-action-box {
  padding: 14px;
  border-radius: 2px;
  background: #F7F2E8;
  border: 1px solid #D4C9B5;
}

.cn-action-box.is-current {
  border-color: color-mix(in srgb, #8B2500 25%, #D4C9B5 75%);
  background: color-mix(in srgb, #8B2500 4%, #F7F2E8 96%);
}

.cn-action-text {
  font-size: 12px;
  color: #6B5D4F;
  line-height: 1.7;
  margin: 0 0 12px;
}

.cn-action-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cn-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  font-family: var(--font-title, inherit);
  letter-spacing: 0.04em;
  border: 1px solid #D4C9B5;
  background: transparent;
  color: #6B5D4F;
  cursor: pointer;
  border-radius: 1px;
  transition: all 0.2s ease;
}

.cn-action-btn:hover {
  border-color: #8B2500;
  color: #8B2500;
}

.cn-action-btn--primary {
  background: #8B2500;
  border-color: #8B2500;
  color: #F7F2E8;
}

.cn-action-btn--primary:hover {
  background: #A0472D;
  border-color: #A0472D;
  color: #F7F2E8;
}

/* ── 响应式 ── */
@media (max-width: 900px) {
  .cn-body {
    grid-template-columns: 1fr;
  }

  .cn-detail-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .cn-root {
    padding: 16px;
  }

  .cn-progress-track {
    width: 100px;
  }

  .cn-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
