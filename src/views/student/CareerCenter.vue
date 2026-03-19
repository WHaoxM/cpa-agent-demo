<!-- 页面：职业发展中心；路由：student/career（student-career）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart, GraphChart, LineChart, SankeyChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
} from 'echarts/components'
import { useUserStore } from '@/stores'
import {
  useCareerInsights, roleOptions,
  type CareerRole, type CareerInsights,
} from '@/composables/useCareerInsights'

use([CanvasRenderer, RadarChart, GraphChart, LineChart, SankeyChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const userStore = useUserStore()
const { targetRole, insights } = useCareerInsights()

const agentLogs = ref<string[]>([
  '[SYS] CAREER_NEXUS v1.2 — 职业发展引擎初始化',
  '[AGENT:CAREER] 技能画像已加载',
  '[AGENT:RESOURCE] 资源索引已就绪',
  '[AGENT:INTERVIEW] 面试规划模块在线',
])

const activePanel = ref<'interview' | 'resource' | 'project'>('interview')
const interviewLoading = ref(false)

function addLog(msg: string) {
  const t = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  agentLogs.value.push(`[${t}] ${msg}`)
  if (agentLogs.value.length > 50) agentLogs.value.shift()
}

// ─── 面试规划 ───
type InterviewQ = { id: string; question: string; category: string; difficulty: string; answer: string }
const interviewQuestions = ref<InterviewQ[]>([])
const selectedIQ = ref<InterviewQ | null>(null)
const showAnswer = ref(false)

async function generateInterviewQuestions() {
  interviewLoading.value = true
  addLog('[AGENT:INTERVIEW] 生成面试题集...')
  await new Promise(r => setTimeout(r, 700))

  const roleQuestions: Record<string, InterviewQ[]> = {
    '前端开发': [
      { id: 'iq1', question: 'Vue3 的 Composition API 和 Options API 的区别及适用场景？', category: '框架', difficulty: '中等', answer: 'Composition API 通过 setup() 函数组织逻辑，更利于逻辑复用和 TypeScript 支持；Options API 以选项对象组织代码，入门更直观。大型项目推荐 Composition API，小型项目两者皆可。' },
      { id: 'iq2', question: '说说虚拟 DOM 的 Diff 算法原理？', category: '原理', difficulty: '困难', answer: '虚拟 DOM Diff 采用同层比较策略：1) 先比较根节点类型；2) 同类型节点复用并递归比较子节点；3) 子节点列表使用 key 做最小移动算法(LIS)优化。Vue3 还引入了静态提升和 PatchFlag 标记。' },
      { id: 'iq3', question: 'Webpack 和 Vite 的核心差异是什么？', category: '工程化', difficulty: '中等', answer: 'Webpack 基于 bundle 模式，启动时需构建完整依赖图；Vite 利用浏览器原生 ESM，开发模式下按需编译，启动极快。生产构建 Vite 使用 Rollup，Webpack 使用自身打包器。' },
      { id: 'iq4', question: '如何做前端性能优化？列举至少5个方向。', category: '性能', difficulty: '中等', answer: '1) 代码分割/懒加载；2) 图片优化(WebP/CDN/懒加载)；3) 资源压缩(Gzip/Brotli)；4) 缓存策略(HTTP Cache/Service Worker)；5) 减少重排重绘；6) Tree Shaking；7) 预渲染/SSR。' },
    ],
    '后端开发': [
      { id: 'iq1', question: 'Spring Boot 的自动配置原理是什么？', category: '框架', difficulty: '中等', answer: '基于 @EnableAutoConfiguration 注解，通过 SpringFactoriesLoader 加载 META-INF/spring.factories 中的配置类，结合 @Conditional 系列注解实现条件装配。' },
      { id: 'iq2', question: 'MySQL 索引的底层数据结构及 B+ 树的优势？', category: '数据库', difficulty: '困难', answer: 'InnoDB 使用 B+ 树索引。B+ 树优势：1) 所有数据在叶子节点，范围查询高效；2) 叶子节点双向链表串联；3) 非叶子节点只存 key，每页可存更多索引，树高更低，IO 更少。' },
      { id: 'iq3', question: 'Redis 为什么快？常见数据结构有哪些？', category: '缓存', difficulty: '中等', answer: '快的原因：1) 纯内存操作；2) 单线程避免锁竞争；3) IO 多路复用(epoll)；4) 高效数据结构。数据结构：String, Hash, List, Set, Sorted Set, Stream, HyperLogLog 等。' },
    ],
    '测试开发': [
      { id: 'iq1', question: '自动化测试分层策略是什么？', category: '策略', difficulty: '中等', answer: '测试金字塔：底层大量单元测试(快速/低成本)，中层适量集成测试，顶层少量 E2E 测试。还可以加入 API 测试层和性能测试层。' },
      { id: 'iq2', question: 'Playwright 和 Selenium 的差异？', category: '工具', difficulty: '中等', answer: 'Playwright：微软出品，支持多浏览器，自动等待，网络拦截，速度快。Selenium：社区成熟，语言支持广，但需要额外 Driver，等待机制较弱。' },
    ],
    '数据分析': [
      { id: 'iq1', question: 'A/B 测试的统计学基础和常见陷阱？', category: '统计', difficulty: '困难', answer: '基于假设检验(H0/H1)，需确定样本量(功效分析)、显著性水平(α=0.05)、最小可检测效应。陷阱：偷看数据(peeking)、多重比较问题、辛普森悖论、样本偏差。' },
      { id: 'iq2', question: 'SQL 窗口函数的使用场景？', category: 'SQL', difficulty: '中等', answer: 'ROW_NUMBER/RANK 排名、LAG/LEAD 同环比、SUM/AVG OVER 累积/移动聚合、NTILE 分桶。常用于留存分析、漏斗分析、路径分析等场景。' },
    ],
    '机器学习工程师': [
      { id: 'iq1', question: '过拟合的原因和解决方案？', category: '基础', difficulty: '中等', answer: '原因：模型复杂度过高、数据不足、噪声过多。方案：正则化(L1/L2)、Dropout、数据增强、Early Stopping、交叉验证、减少特征、集成学习。' },
      { id: 'iq2', question: '特征工程的常用方法？', category: '实战', difficulty: '中等', answer: '数值特征：标准化/归一化、分箱、多项式特征。类别特征：One-Hot、Label Encoding、Target Encoding。文本特征：TF-IDF、Word2Vec。时间特征：周期提取、滞后特征。' },
    ],
  }

  interviewQuestions.value = roleQuestions[targetRole.value] || roleQuestions['前端开发']
  addLog(`[AGENT:INTERVIEW] 已生成 ${interviewQuestions.value.length} 道 ${targetRole.value} 面试题`)
  interviewLoading.value = false
}

function selectIQ(q: InterviewQ) { selectedIQ.value = q; showAnswer.value = false }

// ─── 资源推荐 ───
type Resource = { id: string; title: string; type: string; url: string; relevance: number; description: string }
const resources = computed<Resource[]>(() => {
  const baseResources: Record<string, Resource[]> = {
    '前端开发': [
      { id: 'r1', title: 'Vue3 官方文档', type: 'DOC', url: '#', relevance: 0.95, description: 'Vue3 完整 API 参考和最佳实践指南' },
      { id: 'r2', title: 'TypeScript Handbook', type: 'DOC', url: '#', relevance: 0.88, description: 'TypeScript 官方手册，覆盖类型系统核心概念' },
      { id: 'r3', title: 'Vite 构建优化实战', type: 'VIDEO', url: '#', relevance: 0.82, description: '从零配置到生产环境优化的完整教程' },
      { id: 'r4', title: 'Web 性能优化权威指南', type: 'BOOK', url: '#', relevance: 0.76, description: '涵盖网络层、渲染层、交互层的全面优化方案' },
      { id: 'r5', title: 'CSS Tricks - Flexbox 完全指南', type: 'ARTICLE', url: '#', relevance: 0.71, description: 'Flexbox 布局从入门到精通' },
    ],
    '后端开发': [
      { id: 'r1', title: 'Spring Boot 实战', type: 'BOOK', url: '#', relevance: 0.92, description: 'Spring Boot 核心原理和企业级实战' },
      { id: 'r2', title: 'MySQL 45讲', type: 'VIDEO', url: '#', relevance: 0.88, description: '深入理解 MySQL 索引、事务、锁机制' },
      { id: 'r3', title: 'Redis 设计与实现', type: 'BOOK', url: '#', relevance: 0.84, description: 'Redis 内部原理和数据结构详解' },
    ],
  }
  return baseResources[targetRole.value] || baseResources['前端开发']
})

// ─── 项目建议 ───
type ProjectSuggestion = { id: string; title: string; difficulty: string; skills: string[]; description: string; coverage: number }
const projects = computed<ProjectSuggestion[]>(() => {
  const baseProjects: Record<string, ProjectSuggestion[]> = {
    '前端开发': [
      { id: 'p1', title: '全栈博客系统', difficulty: '中等', skills: ['Vue3', 'TypeScript', 'Vite', 'Pinia'], description: '搭建一个支持 Markdown 编辑、标签分类、全文搜索的个人博客系统', coverage: 0.72 },
      { id: 'p2', title: '实时协作白板', difficulty: '困难', skills: ['Canvas', 'WebSocket', 'Vue3', 'Node.js'], description: '支持多人实时绘图、光标同步、撤销重做的在线白板', coverage: 0.85 },
      { id: 'p3', title: '可视化仪表盘生成器', difficulty: '困难', skills: ['ECharts', 'D3.js', 'Vue3', '拖拽'], description: '通过拖拽配置生成数据看板，支持多种图表类型和数据源', coverage: 0.91 },
    ],
    '后端开发': [
      { id: 'p1', title: '微服务电商平台', difficulty: '困难', skills: ['Spring Cloud', 'MySQL', 'Redis', 'RabbitMQ'], description: '包含用户、商品、订单、支付等微服务的电商系统', coverage: 0.88 },
      { id: 'p2', title: 'API 网关系统', difficulty: '中等', skills: ['Spring Boot', 'Redis', '限流', '鉴权'], description: '支持路由、限流、鉴权、日志的 API 网关', coverage: 0.75 },
    ],
  }
  return baseProjects[targetRole.value] || baseProjects['前端开发']
})

// ─── 图表配色 ───
const chartTextColor = computed(() => {
  const t = document.documentElement.dataset.theme
  return t === 'cyberNexus' ? '#6b8a8e' : 'var(--text-200)'
})
const chartPrimary = computed(() => {
  const t = document.documentElement.dataset.theme
  return t === 'cyberNexus' ? '#00e5c6' : '#5B8C5A'
})
const chartAccent = computed(() => {
  const t = document.documentElement.dataset.theme
  return t === 'cyberNexus' ? '#ff2d6a' : '#C2895B'
})

// ─── 雷达图 ───
const radarOption = computed(() => {
  const ins = insights.value
  const indicators = ins.candidates.map(c => ({ name: c.role, max: 1 }))
  return {
    tooltip: {},
    radar: {
      indicator: indicators,
      axisName: { color: chartTextColor.value, fontSize: 10 },
      splitArea: { areaStyle: { color: 'transparent' } },
      splitLine: { lineStyle: { color: 'rgba(0,229,198,0.08)' } },
      axisLine: { lineStyle: { color: 'rgba(0,229,198,0.12)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: ins.candidates.map(c => c.score),
        name: '匹配度',
        areaStyle: { color: 'rgba(0,229,198,0.12)' },
        lineStyle: { color: chartPrimary.value },
        itemStyle: { color: chartPrimary.value },
      }],
    }],
  }
})

// ─── 技能力导向图 ───
const graphOption = computed(() => {
  const g = insights.value.skillGraph
  const catMap: Record<string, number> = {}
  let ci = 0
  g.nodes.forEach(n => { if (!(n.category in catMap)) catMap[n.category] = ci++ })
  const categories = Object.keys(catMap).map(c => ({ name: c }))
  return {
    tooltip: { formatter: (p: any) => p.data?.name || '' },
    legend: { data: categories.map(c => c.name), textStyle: { color: chartTextColor.value, fontSize: 10 }, bottom: 0 },
    series: [{
      type: 'graph',
      layout: 'force',
      categories,
      data: g.nodes.map(n => ({
        name: n.name,
        symbolSize: 6 + n.heat * 0.3,
        category: catMap[n.category],
        itemStyle: { color: n.heat > 80 ? chartPrimary.value : chartTextColor.value },
      })),
      edges: g.edges.map(e => ({
        source: g.nodes.findIndex(n => n.id === e.source),
        target: g.nodes.findIndex(n => n.id === e.target),
      })).filter(e => e.source >= 0 && e.target >= 0),
      force: { repulsion: 120, edgeLength: [40, 100] },
      lineStyle: { color: 'rgba(0,229,198,0.15)', curveness: 0.2 },
      roam: true,
      label: { show: true, fontSize: 9, color: chartTextColor.value },
    }],
  }
})

// ─── 薪资趋势 ───
const salaryOption = computed(() => {
  const s = insights.value.salary
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: [`${s.predicted.role}(预测)`, `${s.target.role}(目标)`], textStyle: { color: chartTextColor.value, fontSize: 10 }, bottom: 0 },
    grid: { top: 20, right: 20, bottom: 50, left: 50 },
    xAxis: { type: 'category', data: s.predicted.points.map(p => p.date), axisLabel: { color: chartTextColor.value, fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(0,229,198,0.12)' } } },
    yAxis: { type: 'value', name: '万/月', nameTextStyle: { color: chartTextColor.value, fontSize: 10 }, axisLabel: { color: chartTextColor.value, fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(0,229,198,0.06)' } } },
    series: [
      { name: `${s.predicted.role}(预测)`, type: 'line', data: s.predicted.points.map(p => p.p50), smooth: true, lineStyle: { color: chartPrimary.value }, itemStyle: { color: chartPrimary.value }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,229,198,0.15)' }, { offset: 1, color: 'transparent' }] } } },
      { name: `${s.target.role}(目标)`, type: 'line', data: s.target.points.map(p => p.p50), smooth: true, lineStyle: { color: chartAccent.value, type: 'dashed' }, itemStyle: { color: chartAccent.value } },
    ],
  }
})

// ─── 桑基图 ───
const sankeyOption = computed(() => {
  const sk = insights.value.sankey
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey',
      data: sk.nodes,
      links: sk.links,
      emphasis: { focus: 'adjacency' },
      lineStyle: { color: 'gradient', curveness: 0.5 },
      itemStyle: { borderWidth: 0 },
      label: { color: chartTextColor.value, fontSize: 10 },
      left: 20, right: 20, top: 10, bottom: 10,
    }],
  }
})

watch(targetRole, () => {
  addLog(`[AGENT:CAREER] 目标职业已切换 → ${targetRole.value}`)
  interviewQuestions.value = []
  selectedIQ.value = null
})

onMounted(() => {
  generateInterviewQuestions()
})
</script>

<template>
  <div class="career-page">
    <!-- 顶部 -->
    <div class="career-header">
      <div class="career-header__left">
        <div class="career-header__title">
          <Icon icon="lucide:compass" class="career-header__icon" />
          <span>CAREER_NEXUS</span>
          <span class="career-header__version">v1.2</span>
        </div>
        <div class="career-header__subtitle">职业发展中心 · Agent 辅助就业规划</div>
      </div>
      <div class="career-header__actions" style="margin-left: auto; margin-right: 20px;">
        <router-link to="/app/student/career-analysis" class="cyber-btn" style="text-decoration: none;">
          <Icon icon="lucide:map" />
          <span>职业分析</span>
        </router-link>
      </div>
      <div class="career-header__role">
        <span class="career-header__label">TARGET_ROLE:</span>
        <el-select v-model="targetRole" size="small" style="width: 150px">
          <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
        </el-select>
      </div>
      <div class="career-header__confidence">
        <div class="career-header__conf-label">MATCH</div>
        <div class="career-header__conf-value">{{ Math.round(insights.confidence * 100) }}%</div>
        <div class="cyber-bar" style="width: 80px">
          <div class="cyber-bar__fill" :style="{ width: insights.confidence * 100 + '%' }" />
        </div>
      </div>
    </div>

    <!-- 主体 -->
    <div class="career-body">
      <!-- 左侧：图表区 -->
      <div class="career-charts">
        <div class="chart-panel">
          <div class="chart-panel__head">
            <Icon icon="lucide:radar" />
            <span>职业匹配雷达</span>
          </div>
          <VChart :option="radarOption" autoresize style="height: 220px" />
        </div>

        <div class="chart-panel">
          <div class="chart-panel__head">
            <Icon icon="lucide:network" />
            <span>技能力导向图谱</span>
          </div>
          <VChart :option="graphOption" autoresize style="height: 260px" />
        </div>

        <div class="chart-panel">
          <div class="chart-panel__head">
            <Icon icon="lucide:trending-up" />
            <span>薪资趋势预测</span>
          </div>
          <VChart :option="salaryOption" autoresize style="height: 200px" />
        </div>

        <div class="chart-panel chart-panel--wide">
          <div class="chart-panel__head">
            <Icon icon="lucide:git-branch" />
            <span>职业路径桑基图</span>
          </div>
          <VChart :option="sankeyOption" autoresize style="height: 220px" />
        </div>
      </div>

      <!-- 右侧：Agent面板 -->
      <div class="career-agent">
        <div class="career-agent__tabs">
          <button class="agent-tab" :class="{ active: activePanel === 'interview' }" @click="activePanel = 'interview'">
            <Icon icon="lucide:message-square" />
            <span>面试规划</span>
          </button>
          <button class="agent-tab" :class="{ active: activePanel === 'resource' }" @click="activePanel = 'resource'">
            <Icon icon="lucide:book-open" />
            <span>资源推荐</span>
          </button>
          <button class="agent-tab" :class="{ active: activePanel === 'project' }" @click="activePanel = 'project'">
            <Icon icon="lucide:box" />
            <span>项目指导</span>
          </button>
        </div>

        <!-- 面试规划 -->
        <div v-if="activePanel === 'interview'" class="agent-content">
          <div class="agent-content__toolbar">
            <span class="agent-content__label">INTERVIEW_PREP // {{ targetRole }}</span>
            <button class="cyber-btn cyber-btn--sm" :disabled="interviewLoading" @click="generateInterviewQuestions">
              <Icon icon="lucide:refresh-cw" />
              <span>{{ interviewLoading ? '...' : 'REFRESH' }}</span>
            </button>
          </div>
          <div v-if="interviewQuestions.length > 0" class="interview-list">
            <button v-for="q in interviewQuestions" :key="q.id" type="button"
              class="interview-row" :class="{ active: selectedIQ?.id === q.id }" @click="selectIQ(q)">
              <div class="interview-row__head">
                <span class="interview-row__cat">{{ q.category }}</span>
                <span class="cyber-tag" :class="q.difficulty === '困难' ? 'cyber-tag--critical' : 'cyber-tag--stable'">{{ q.difficulty }}</span>
              </div>
              <div class="interview-row__q">{{ q.question }}</div>
            </button>
          </div>
          <div v-if="selectedIQ" class="interview-detail">
            <div class="interview-detail__head">
              <span>参考答案</span>
              <button class="cyber-btn cyber-btn--sm" @click="showAnswer = !showAnswer">
                <Icon :icon="showAnswer ? 'lucide:eye-off' : 'lucide:eye'" />
                <span>{{ showAnswer ? 'HIDE' : 'SHOW' }}</span>
              </button>
            </div>
            <div v-if="showAnswer" class="interview-detail__answer">{{ selectedIQ.answer }}</div>
            <div v-else class="interview-detail__hidden">点击 SHOW 查看参考答案</div>
          </div>
        </div>

        <!-- 资源推荐 -->
        <div v-if="activePanel === 'resource'" class="agent-content">
          <div class="agent-content__toolbar">
            <span class="agent-content__label">RESOURCE_INDEX // {{ targetRole }}</span>
          </div>
          <div class="resource-list">
            <div v-for="r in resources" :key="r.id" class="resource-row">
              <div class="resource-row__head">
                <span class="resource-row__title">{{ r.title }}</span>
                <span class="cyber-tag cyber-tag--active">{{ r.type }}</span>
              </div>
              <div class="resource-row__desc">{{ r.description }}</div>
              <div class="resource-row__foot">
                <div class="cyber-bar" style="flex: 1">
                  <div class="cyber-bar__fill" :style="{ width: r.relevance * 100 + '%' }" />
                </div>
                <span class="resource-row__score">{{ Math.round(r.relevance * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 项目指导 -->
        <div v-if="activePanel === 'project'" class="agent-content">
          <div class="agent-content__toolbar">
            <span class="agent-content__label">PROJECT_GUIDE // {{ targetRole }}</span>
          </div>
          <div class="project-list">
            <div v-for="p in projects" :key="p.id" class="project-row">
              <div class="project-row__head">
                <span class="project-row__title">{{ p.title }}</span>
                <span class="cyber-tag" :class="p.difficulty === '困难' ? 'cyber-tag--warning' : 'cyber-tag--stable'">{{ p.difficulty }}</span>
              </div>
              <div class="project-row__desc">{{ p.description }}</div>
              <div class="project-row__skills">
                <span v-for="s in p.skills" :key="s" class="mini-tag">{{ s }}</span>
              </div>
              <div class="project-row__foot">
                <span class="project-row__label">技能覆盖度</span>
                <div class="cyber-bar" style="flex: 1">
                  <div class="cyber-bar__fill" :style="{ width: p.coverage * 100 + '%' }" />
                </div>
                <span class="project-row__score">{{ Math.round(p.coverage * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Agent日志 -->
        <div class="career-terminal">
          <div class="career-terminal__head">
            <span>AGENT_LOG</span>
            <span class="career-terminal__count">{{ agentLogs.length }}</span>
          </div>
          <div class="career-terminal__body">
            <div v-for="(log, i) in agentLogs" :key="i" class="log-line"
              :class="{ 'log-sys': log.includes('[SYS]'), 'log-agent': log.includes('[AGENT') }">
              {{ log }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.career-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-100);
  font-family: var(--cyber-font-mono, inherit);
}

/* ─── Header ─── */
.career-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--card-border);
}
.career-header__left { flex: 1; min-width: 0; }
.career-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-100);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.career-header__icon { font-size: 18px; color: var(--primary-100); }
.career-header__version {
  font-size: 10px;
  color: var(--text-200);
  padding: 1px 6px;
  border: 1px solid var(--card-border);
  border-radius: 2px;
}
.career-header__subtitle { font-size: 12px; color: var(--text-200); margin-top: 2px; }
.career-header__role {
  display: flex;
  align-items: center;
  gap: 8px;
}
.career-header__label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-200);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.career-header__confidence {
  display: flex;
  align-items: center;
  gap: 8px;
}
.career-header__conf-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-200);
  letter-spacing: 0.1em;
}
.career-header__conf-value {
  font-size: 18px;
  font-weight: 900;
  color: var(--primary-100);
}

/* ─── Body ─── */
.career-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 420px;
  overflow: hidden;
}

/* ─── Charts ─── */
.career-charts {
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-content: start;
}
.chart-panel {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 2px;
  overflow: hidden;
}
.chart-panel--wide { grid-column: 1 / -1; }
.chart-panel__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 800;
  color: var(--primary-100);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--card-border);
}
.chart-panel__head :deep(svg) { font-size: 14px; }

/* ─── Agent panel ─── */
.career-agent {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--card-border);
  background: var(--card-data-bg);
}
.career-agent__tabs {
  display: flex;
  border-bottom: 1px solid var(--card-border);
  background: var(--card-bg);
}
.agent-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: none;
  border-right: 1px solid var(--card-border);
  background: transparent;
  color: var(--text-200);
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.15s;
}
.agent-tab:last-child { border-right: none; }
.agent-tab:hover { color: var(--text-100); background: color-mix(in srgb, var(--primary-100) 4%, transparent 96%); }
.agent-tab.active {
  color: var(--primary-100);
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-200) 92%);
  box-shadow: inset 0 -2px 0 var(--primary-100);
}
.agent-tab :deep(svg) { font-size: 14px; }

.agent-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.agent-content__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid var(--card-border);
  background: var(--card-bg);
}
.agent-content__label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-200);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ─── Interview ─── */
.interview-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.interview-row {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 2px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.interview-row:hover { border-color: var(--card-hover-border); }
.interview-row.active {
  border-color: color-mix(in srgb, var(--primary-100) 40%, var(--card-border) 60%);
  background: color-mix(in srgb, var(--primary-100) 5%, var(--card-bg) 95%);
}
.interview-row__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.interview-row__cat {
  font-size: 10px;
  font-weight: 700;
  color: var(--primary-100);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.interview-row__q {
  font-size: 12px;
  color: var(--text-100);
  line-height: 1.6;
}

.interview-detail {
  border-top: 1px solid var(--card-border);
  padding: 12px 14px;
  background: var(--card-bg);
}
.interview-detail__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.interview-detail__answer {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-100);
}
.interview-detail__hidden {
  font-size: 12px;
  color: var(--text-200);
  text-align: center;
  padding: 20px;
}

/* ─── Resources ─── */
.resource-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.resource-row {
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 2px;
}
.resource-row__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.resource-row__title {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-100);
}
.resource-row__desc {
  font-size: 11px;
  color: var(--text-200);
  line-height: 1.5;
  margin-bottom: 8px;
}
.resource-row__foot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.resource-row__score {
  font-size: 11px;
  font-weight: 900;
  color: var(--primary-100);
}

/* ─── Projects ─── */
.project-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.project-row {
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 2px;
}
.project-row__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.project-row__title {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-100);
}
.project-row__desc {
  font-size: 11px;
  color: var(--text-200);
  line-height: 1.5;
  margin-bottom: 8px;
}
.project-row__skills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.mini-tag {
  font-size: 10px;
  padding: 1px 6px;
  border: 1px solid var(--card-border);
  border-radius: 1px;
  color: var(--text-200);
  background: var(--card-data-bg);
}
.project-row__foot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.project-row__label {
  font-size: 10px;
  color: var(--text-200);
  white-space: nowrap;
}
.project-row__score {
  font-size: 11px;
  font-weight: 900;
  color: var(--primary-100);
}

/* ─── Terminal ─── */
.career-terminal {
  border-top: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  min-height: 120px;
  max-height: 180px;
}
.career-terminal__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--card-border);
  background: var(--card-bg);
}
.career-terminal__count {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--primary-100) 8%, transparent 92%);
  color: var(--primary-100);
}
.career-terminal__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  font-size: 10px;
  line-height: 1.7;
  color: var(--text-200);
}
.log-line { white-space: pre-wrap; word-break: break-all; }
.log-sys { color: var(--primary-100); }
.log-agent { color: #a78bfa; }

/* ─── Shared ─── */
.cyber-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-200) 90%);
  border: 1px solid color-mix(in srgb, var(--primary-100) 30%, var(--card-border) 70%);
  border-radius: 2px;
  color: var(--primary-100);
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}
.cyber-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary-100) 18%, var(--bg-200) 82%);
  border-color: color-mix(in srgb, var(--primary-100) 50%, var(--card-border) 50%);
}
.cyber-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cyber-btn--sm { padding: 4px 8px; font-size: 9px; }

/* ─── Responsive ─── */
@media (max-width: 1024px) {
  .career-body { grid-template-columns: 1fr; }
  .career-agent { max-height: 50vh; }
  .career-charts { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .career-header { flex-direction: column; align-items: flex-start; gap: 12px; }
}
</style>
