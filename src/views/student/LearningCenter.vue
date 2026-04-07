<!-- 页面：技能提升；路由：student/learning（student-learning）；角色：STUDENT -->


<script setup lang="ts">

import { ref, computed, watch } from 'vue'

import { useRouter } from 'vue-router'
import { usePageEntrance } from '@/composables/usePageEntrance'

import { Icon } from '@iconify/vue'
import { ICONS } from '@/constants/icons'
import { ElMessage } from 'element-plus'

import VChart from 'vue-echarts'

import * as echarts from 'echarts/core'

import { GraphChart, SankeyChart, LineChart } from 'echarts/charts'

import {

  TooltipComponent,

  LegendComponent,

  GridComponent,

  TitleComponent,

} from 'echarts/components'

import { CanvasRenderer } from 'echarts/renderers'

import { useUserStore, useCourseStore, useLearningStore } from '@/stores'
import { useResumeStore } from '@/stores/resume'
import { skillToCourseMap } from '@/mock/courseSkillMap'

import type { Course } from '@/types'

import { useThemePalette } from '@/composables/useThemePalette'

import { useCareerInsights, type SkillNode, getPrerequisiteGraphMock } from '@/composables/useCareerInsights'

import IntegrationHint from '@/components/IntegrationHint.vue'



echarts.use([

  GraphChart,

  SankeyChart,

  LineChart,

  TooltipComponent,

  LegendComponent,

  GridComponent,

  TitleComponent,

  CanvasRenderer,

])



const router = useRouter()
const { pageRef } = usePageEntrance()

const userStore = useUserStore()
const courseStore = useCourseStore()
const resumeStore = useResumeStore()
const learningStore = useLearningStore()

/* ═══ 三 Tab 导航 ═══ */
type LcTab = 'recommend' | 'all' | 'mine'
const activeTab = ref<LcTab>('recommend')

/* ═══ 全部课程 Tab 数据 ═══ */
const lcCategory = ref<string>('全部')
const lcKeyword = ref<string>('')
const lcPage = ref(1)
const lcPageSize = 12

const lcCourseCategories = ['全部', '专业技能', '通用素质', '实践能力']

const lcFilteredCourses = computed(() => {
  const k = lcKeyword.value.trim().toLowerCase()
  return courseStore.courses.filter(c => {
    const catOk = lcCategory.value === '全部' || (c.skillTags ?? []).join('').includes(lcCategory.value) || c.categoryId === lcCategory.value
    const kOk = !k || c.title.toLowerCase().includes(k) || c.description.toLowerCase().includes(k)
    return catOk && kOk
  })
})

const lcPagedCourses = computed(() => {
  const start = (lcPage.value - 1) * lcPageSize
  return lcFilteredCourses.value.slice(start, start + lcPageSize)
})

/* ═══ 我的课程 Tab 数据 ═══ */
const myCourses = computed(() => {
  const progressList = courseStore.progress as unknown as Array<{ courseId: string; progress: number }>
  const progressMap = new Map<string, number>()
  for (const p of progressList) {
    const cur = progressMap.get(p.courseId) ?? 0
    progressMap.set(p.courseId, Math.max(cur, p.progress ?? 0))
  }
  return courseStore.courses
    .filter(c => progressMap.has(c.id))
    .map(c => ({ ...c, maxProgress: progressMap.get(c.id) ?? 0 }))
    .sort((a, b) => (b.maxProgress === 100 ? -1 : 1) - (a.maxProgress === 100 ? -1 : 1))
})

/* 技能差距驱动的课程推荐 */
const gapBasedRecommendations = computed(() => {
  const courses = courseStore.courses
  const weakTags = learningStore.weakSkillTags
  const skillNodes = resumeStore.isParsed
    ? resumeStore.insights?.skillGraph?.nodes ?? []
    : []

  // 找出热度高且用户未掌握的技能节点
  const userSkillNames = new Set(resumeStore.parsedSkills.map(s => s.name.toLowerCase()))
  const gapNodes = skillNodes
    .filter(n => n.heat >= 70 && !userSkillNames.has(n.name.toLowerCase()))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 6)

  const result: { skillName: string; heat: number; courses: typeof courses; isWeak: boolean }[] = []

  for (const node of gapNodes) {
    const courseIds = skillToCourseMap[node.id] ?? []
    const matchedCourses = courses.filter(c => courseIds.includes(c.id))
    if (matchedCourses.length) {
      result.push({
        skillName: node.name,
        heat: node.heat,
        courses: matchedCourses,
        isWeak: weakTags.some(t => t.toLowerCase().includes(node.name.toLowerCase())),
      })
    }
  }

  // 如果没有第 - 返回全量课程
  if (!result.length) {
    return courses.slice(0, 3).map(c => ({ skillName: c.title, heat: 70, courses: [c], isWeak: false }))
  }
  return result
})

const overallCoverage = computed(() => {
  const skillNodes = resumeStore.insights?.skillGraph?.nodes ?? []
  if (!skillNodes.length) return 0
  const progressList = courseStore.progress as unknown as Array<{ courseId: string; progress: number }>
  const completedCourseIds = new Set(
    progressList.filter(p => p.progress >= 100).map(p => p.courseId)
  )
  const coveredNodeIds = new Set<string>()
  for (const [courseId, skillIds] of Object.entries(skillToCourseMap)) {
    if (completedCourseIds.has(courseId)) {
      skillIds.forEach(s => coveredNodeIds.add(s))
    }
  }
  const covered = skillNodes.filter((n: { id: string }) => coveredNodeIds.has(n.id)).length
  return Math.round((covered / skillNodes.length) * 100)
})

const { palette: themePalette } = useThemePalette()



const { targetRole, insights, roleOptions } = useCareerInsights()



const focusedSkillId = ref<string>('')

const isPrereqMode = ref(false)

const ignoreNextZrClick = ref(false)



const focusedSkillValid = computed(() => {

  const id = focusedSkillId.value

  if (!id) return false

  return insights.value.skillGraph.nodes.some((n) => n.id === id)

})



watch(

  () => insights.value.skillGraph.nodes,

  () => {

    if (!focusedSkillValid.value) {

      focusedSkillId.value = ''

      isPrereqMode.value = false

    }

  },

)



const focusedSet = computed(() => {

  const id = focusedSkillValid.value ? focusedSkillId.value : ''

  if (!id) return new Set<string>()



  const set = new Set<string>()

  set.add(id)

  for (const e of insights.value.skillGraph.edges) {

    if (e.source === id) set.add(e.target)

    if (e.target === id) set.add(e.source)

  }

  return set

})



function onForceClick(params: any) {

  if (params?.dataType !== 'node') {

    focusedSkillId.value = ''

    isPrereqMode.value = false

    return

  }



  const id = String(params?.data?.id || '')

  if (!id) return



  ignoreNextZrClick.value = true



  params?.event?.event?.stopPropagation?.()



  if (focusedSkillId.value === id) {

    isPrereqMode.value = !isPrereqMode.value

    return

  }



  focusedSkillId.value = id

  isPrereqMode.value = false

}



function onForceZrClick() {

  if (ignoreNextZrClick.value) {

    ignoreNextZrClick.value = false

    return

  }

  focusedSkillId.value = ''

  isPrereqMode.value = false

}



const prereqOption = computed(() => {

  if (!focusedSkillValid.value || !isPrereqMode.value) return null

  const g = getPrerequisiteGraphMock(focusedSkillId.value, insights.value.skillGraph.nodes)

  const softNodeFill = 'rgba(17,24,39,0.06)'

  const softNodeBorder = 'rgba(17,24,39,0.18)'

  return {

    backgroundColor: 'transparent',

    tooltip: {

      trigger: 'item',

      formatter: (p: any) => {

        const d = p?.data

        if (!d) return ''

        const heat = typeof d.heat === 'number' ? d.heat : d.value

        return `${d.name}<br/>建议优先级：<b>${heat}</b>`

      },

      borderWidth: 0,

      backgroundColor: 'rgba(255, 255, 255, 0.94)',

      textStyle: { color: palette.value.text },

      extraCssText: `border-radius: 2px; padding: 10px 12px;`,

    },

    series: [

      {

        type: 'graph',

        layout: 'force',

        roam: false,

        draggable: false,

        label: {

          show: true,

          color: palette.value.text,

          fontSize: 11,

          formatter: '{b}',

        },

        edgeSymbol: ['none', 'arrow'],

        edgeSymbolSize: 7,

        force: {

          repulsion: 110,

          edgeLength: [40, 95],

          gravity: 0.12,

        },

        data: g.nodes.map((n) => {

          const isCore = n.id === focusedSkillId.value

          return {

            id: n.id,

            name: n.name,

            heat: n.heat,

            value: n.heat,

            symbol: isCore ? 'diamond' : 'circle',

            symbolSize: isCore ? 22 : 14 + n.heat * 0.12,

            itemStyle: {

              color: isCore ? palette.value.brand : softNodeFill,

              borderColor: isCore ? palette.value.brand2 : softNodeBorder,

              borderWidth: isCore ? 2 : 1,

            },

          }

        }),

        links: g.edges.map((e) => {

          return {

            source: e.source,

            target: e.target,

            value: e.weight,

            lineStyle: {

              color: palette.value.grid,

              width: 1.1 + e.weight * 1.8,

              opacity: 0.75,

            },

          }

        }),

      },

    ],

  }

})



const searchQuery = ref('')

const selectedCategory = ref('')



const categories = computed(() => courseStore.categories)



const palette = computed(() => {

  const grid = 'rgba(17, 24, 39, 0.08)'

  const brand = themePalette.value.primary || '#8B2500'

  const brand2 = themePalette.value.accent || '#2B4C6F'

  return {

    text: themePalette.value.text || '#1A1410',

    muted: themePalette.value.textMuted || '#6B5D4F',

    grid,

    brand,

    brand2,

  }

})



const forceOption = computed(() => {

  const catColor: Record<SkillNode['category'], string> = {

    前端: '#60A5FA',

    后端: '#34D399',

    测试: '#F59E0B',

    数据: '#22D3EE',

    机器学习: '#A78BFA',

    通用: '#94A3B8',

  }



  const hasFocus = focusedSkillValid.value

  const set = focusedSet.value



  return {

    backgroundColor: 'transparent',

    tooltip: {

      trigger: 'item',

      formatter: (p: any) => {

        const d = p?.data

        if (!d) return ''

        const heat = typeof d.heat === 'number' ? d.heat : d.value

        return `${d.name}<br/>需求热度：<b>${heat}</b>`

      },

      borderWidth: 0,

      backgroundColor: 'rgba(255, 255, 255, 0.92)',

      textStyle: {

        color: palette.value.text,

      },

      extraCssText: `border-radius: 2px; padding: 10px 12px;`,

    },

    series: [

      {

        type: 'graph',

        layout: 'force',

        roam: true,

        draggable: true,

        label: {

          show: true,

          color: palette.value.text,

          fontSize: 12,

          formatter: '{b}',

        },

        force: {

          repulsion: 130,

          edgeLength: [45, 120],

          gravity: 0.08,

        },

        data: insights.value.skillGraph.nodes.map((n) => {

          const isCenter = focusedSkillId.value === n.id

          const isNear = set.has(n.id)

          const dimmed = hasFocus && !isNear

          const baseSize = 14 + n.heat * 0.35

          const focusedSize = isCenter

            ? baseSize * 1.22

            : isNear

              ? baseSize * 1.08

              : baseSize



          return {

            id: n.id,

            name: n.name,

            heat: n.heat,

            value: n.heat,

            symbol: isCenter ? 'diamond' : 'circle',

            symbolSize: focusedSize,

            label: {

              show: !hasFocus || isNear,

              fontSize: isCenter ? 13 : 12,

              fontWeight: isCenter ? 700 : 500,

            },

            itemStyle: {

              color: catColor[n.category],

              opacity: dimmed ? 0.16 : isCenter ? 1 : isNear ? 0.98 : 0.72,

              borderColor: isCenter ? palette.value.brand2 : 'rgba(255,255,255,0.65)',

              borderWidth: isCenter ? 3 : isNear ? 2 : 1,

              shadowBlur: isCenter ? 18 : 0,

              shadowColor: isCenter ? catColor[n.category] : 'transparent',

            },

          }

        }),

        links: insights.value.skillGraph.edges.map((e) => {

          const isNearLink = set.has(String(e.source)) && set.has(String(e.target))

          const dimmed = hasFocus && !isNearLink

          return {

            source: e.source,

            target: e.target,

            value: e.weight,

            lineStyle: {

              color: isNearLink ? palette.value.brand : palette.value.grid,

              width: (dimmed ? 0.7 : 1.3) + e.weight * (dimmed ? 1.0 : 2.2),

              opacity: dimmed ? 0.12 : isNearLink ? 0.95 : 0.62,

            },

          }

        }),

        emphasis: { focus: 'adjacency' },

      },

    ],

  }

})



const sankeyOption = computed(() => {

  return {

    backgroundColor: 'transparent',

    tooltip: {

      trigger: 'item',

      formatter: (p: any) => {

        const d = p?.data

        if (!d) return ''

        if (d.source && d.target) return `${d.source} → ${d.target}<br/>匹配贡献：<b>${d.value}</b>`

        return `${d.name}`

      },

      borderWidth: 0,

      extraCssText: `border-radius: 2px; padding: 10px 12px; color: ${palette.value.text};`,

    },

    series: [

      {

        type: 'sankey',

        nodeWidth: 12,

        nodeGap: 10,

        left: 10,

        right: 10,

        top: 10,

        bottom: 10,

        data: insights.value.sankey.nodes,

        links: insights.value.sankey.links,

        lineStyle: {

          color: 'source',

          opacity: 0.28,

          curveness: 0.5,

        },

        itemStyle: {

          borderWidth: 1,

          borderColor: 'rgba(17,24,39,0.10)',

        },

        label: {

          color: palette.value.text,

          fontWeight: 700,

          fontSize: 12,

        },

        emphasis: { focus: 'adjacency' },

      },

    ],

  }

})



const salaryOption = computed(() => {

  const x = insights.value.salary.predicted.points.map((p) => p.date)



  const mkSeries = (label: string, points: any[], colorA: string, colorB: string) => {

    return {

      name: label,

      type: 'line',

      smooth: true,

      symbol: 'circle',

      symbolSize: 6,

      showSymbol: false,

      data: points.map((p) => ({ value: p.p50, p25: p.p25, p50: p.p50, p75: p.p75 })),

      lineStyle: {

        width: 3,

        color: colorA,

      },

      itemStyle: {

        color: colorA,

      },

      areaStyle: {

        opacity: 0.22,

        color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [

          { offset: 0, color: colorA },

          { offset: 1, color: colorB },

        ]),

      },

    }

  }



  return {

    backgroundColor: 'transparent',

    grid: {

      left: 10,

      right: 10,

      top: 28,

      bottom: 18,

      containLabel: true,

    },

    tooltip: {

      trigger: 'axis',

      axisPointer: { type: 'line' },

      formatter: (params: any) => {

        const rows: string[] = []

        const date = params?.[0]?.axisValue

        if (date) rows.push(`<div style="margin-bottom:6px; font-weight:800;">${date}</div>`)

        ;(params || []).forEach((p: any) => {

          const d = p?.data

          if (!d) return

          rows.push(

            `<div style="display:flex; justify-content:space-between; gap:12px;">

              <span>${p.marker}${p.seriesName}</span>

              <span><b>${d.p50}</b> 万</span>

            </div>

            <div style="opacity:.78; margin-left:16px;">p25/p75：${d.p25} / ${d.p75} 万</div>`,

          )

        })

        return rows.join('')

      },

      borderWidth: 0,

      extraCssText: `border-radius: 2px; padding: 10px 12px; color: ${palette.value.text};`,

    },

    legend: {

      top: 0,

      left: 0,

      textStyle: { color: palette.value.muted, fontWeight: 700 },

    },

    xAxis: {

      type: 'category',

      data: x,

      axisTick: { show: false },

      axisLine: { lineStyle: { color: palette.value.grid } },

      axisLabel: { color: palette.value.muted },

    },

    yAxis: {

      type: 'value',

      axisLabel: { color: palette.value.muted, formatter: '{value} 万' },

      splitLine: { lineStyle: { color: palette.value.grid } },

    },

    series: [

      mkSeries(

        `当前推测：${insights.value.salary.predicted.role}`,

        insights.value.salary.predicted.points,

        palette.value.brand,

        'rgba(0,0,0,0)',

      ),

      mkSeries(

        `目标岗位：${insights.value.salary.target.role}`,

        insights.value.salary.target.points,

        palette.value.brand2,

        'rgba(0,0,0,0)',

      ),

    ],

  }

})



const filteredCourses = computed(() => {

  let courses = courseStore.publishedCourses

  

  if (searchQuery.value) {

    const query = searchQuery.value.toLowerCase()

    courses = courses.filter(c => 

      c.title.toLowerCase().includes(query) || 

      c.description.toLowerCase().includes(query)

    )

  }

  

  if (selectedCategory.value) {

    courses = courses.filter(c => c.categoryId === selectedCategory.value)

  }

  

  return courses

})



function getCourseProgress(courseId: string): number {

  const progress = courseStore.getUserProgress(userStore.currentUser?.id || '', courseId)

  if (progress.length === 0) return 0

  const totalProgress = progress.reduce((sum, p) => sum + p.progress, 0)

  return Math.round(totalProgress / progress.length)

}



function viewCourse(course: Course) {

  router.push(`/app/student/course/${course.id}`)

}



function toggleFavorite(courseId: string, event: Event) {

  event.stopPropagation()

  courseStore.toggleFavorite(courseId)

  ElMessage.success(courseStore.isCourseFavorite(courseId) ? '已收藏' : '已取消')

}



function refreshData() {

  ElMessage.success('数据已刷新')

}



function reAnalyzeCareer() {

  ElMessage.success('已重新分析（演示数据）')

}



function exportData() {

  const data = filteredCourses.value.map(c => ({

    课程名称: c.title,

    讲师: c.teacherName,

    分类: categories.value.find(cat => cat.id === c.categoryId)?.name || '',

    时长: formatDuration(c.totalDuration),

    章节数: c.chapters.length

  }))

  console.table(data)

  ElMessage.success('课程数据已导出到控制台')

}



function createCourse() {

  router.push('/app/teacher/course/edit')

}



function formatDuration(minutes: number): string {

  const hours = Math.floor(minutes / 60)

  const mins = minutes % 60

  if (hours > 0) {

    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`

  }

  return `${mins}分钟`

}

</script>









<template>

  <div ref="pageRef" class="learning-center page page--compact">

    <!-- ── Tab 导航栏 ── -->
    <nav class="lc-tabs">
      <button
        v-for="tab in ([
          { key: 'recommend', label: '推荐路径', icon: 'lucide:trending-up' },
          { key: 'all',       label: '全部课程', icon: 'lucide:layout-grid' },
          { key: 'mine',      label: '我的课程', icon: 'lucide:book-open' },
        ] as const)"
        :key="tab.key"
        class="lc-tabs__item"
        :class="{ 'lc-tabs__item--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <Icon :icon="tab.icon" :width="13" />
        {{ tab.label }}
      </button>
    </nav>

    <!-- ── Tab 1：推荐路径 ── -->
    <div v-show="activeTab === 'recommend'">

    <!-- 技能差距推荐课程区块 -->
    <section class="lc-rec-section">
      <div class="lc-rec-header">
        <div class="lc-rec-title">
          <Icon icon="lucide:trending-up" :width="14" />
          推荐学习路径
        </div>
        <div class="lc-rec-meta" v-if="resumeStore.isParsed">
          目标方向：{{ resumeStore.insights?.predictedRole ?? '未知' }}
          &nbsp;·&nbsp;
          技能覆盖率：{{ overallCoverage }}%
          &nbsp;
          <button class="lc-link" @click="router.push('/app/student/career-analysis')">进入职业分析 →</button>
        </div>
        <div class="lc-rec-meta" v-else>
          <span class="lc-muted">上传简历后获取个性化推荐</span>
          &nbsp;
          <button class="lc-link" @click="router.push('/app/student/career-navigation')">路径一：自评技能</button>
        </div>
      </div>

      <div class="lc-rec-list">
        <div v-for="rec in gapBasedRecommendations" :key="rec.skillName" class="lc-rec-card">
          <div class="lc-rec-card__head">
            <span class="lc-rec-skill">{{ rec.skillName }}</span>
            <span v-if="rec.isWeak" class="lc-rec-weak-tag">⚠️ 薄弱点</span>
            <span class="lc-rec-heat">热度 {{ rec.heat }}</span>
          </div>
          <div class="lc-rec-courses">
            <button
              v-for="c in rec.courses.slice(0,2)"
              :key="c.id"
              class="lc-rec-course-btn"
              @click="router.push(`/app/student/course/${c.id}`)"
            >
              {{ c.title }}
            </button>
          </div>
        </div>
      </div>

      <div class="lc-rec-footer">
        <button class="lc-footer-link" @click="router.push({ name: 'career-ability', query: { role: targetRole } })">
          <Icon icon="lucide:cpu" :width="12" />
          查看完整职业能力图谱
        </button>
        <button class="lc-footer-link" @click="router.push({ name: 'course-system' })">
          <Icon icon="lucide:network" :width="12" />
          查看课程体系图谱
        </button>
      </div>
    </section>

    <section class="career">

      <div class="career-head card-base">
        <div class="career-head__left">

          <div class="career-title">技能匹配与能力画像</div>

          <div class="career-sub">

            推测岗位：

            <b>{{ insights.predictedRole }}</b>

            <span class="career-pill">置信度 {{ Math.round(insights.confidence * 100) }}%</span>

            <IntegrationHint />

          </div>

        </div>



        <div class="career-head__right">

          <el-select v-model="targetRole" class="role-select" placeholder="选择目标岗位">

            <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />

          </el-select>

          <button class="btn-secondary" @click="reAnalyzeCareer">重新分析</button>

        </div>

      </div>



      <div class="career-grid">

        <div class="panel panel--chart panel--force card-base">
          <div class="panel__head">

            <div class="panel__title">技能需求图谱</div>

            <div class="panel__meta">力导向图：节点代表技能，大小/颜色代表需求热度与类型</div>

            <IntegrationHint />

          </div>

          <div class="force-wrap">

            <v-chart

              :option="forceOption"

              autoresize

              class="chart chart--force"

              @click="onForceClick"

              @zr:click="onForceZrClick"

            />



          <div v-if="prereqOption" class="prereq-float card-base">
              <div class="prereq-float__head">

                <div class="prereq-float__title">学习前置技能</div>

                <button class="prereq-float__close" @click="isPrereqMode = false">×</button>

              </div>

              <v-chart :option="prereqOption" autoresize class="prereq-float__chart" />

            </div>

          </div>

        </div>



        <div class="side">

          <div class="panel panel--chart card-base">
            <div class="panel__head">

              <div class="panel__title">技能点 - 岗位匹配</div>

              <div class="panel__meta">桑基图：展示知识点到岗位的匹配流向</div>

            </div>

            <v-chart :option="sankeyOption" autoresize class="chart chart--sankey" />

          </div>



          <div class="panel panel--chart card-base">
            <div class="panel__head">

              <div class="panel__title">薪资趋势</div>

              <div class="panel__meta">平滑曲线面积图（p25 / p50 / p75）</div>

            </div>

            <v-chart :option="salaryOption" autoresize class="chart chart--salary" />

          </div>

        </div>

      </div>

    </section>



    <section class="course-block card-base">
      <div class="course-block__toolbar">

        <div class="topbar">

          <div class="topbar__left">

            <div class="search-box">

              <Icon icon="lucide:search" class="search-icon" />

              <input

                v-model="searchQuery"

                type="text"

                placeholder="搜索课程..."

                class="search-input"

              />

              <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">

                <Icon icon="lucide:x" />

              </button>

            </div>

          </div>

          <div class="topbar__right">

            <button class="btn-icon" @click="refreshData" title="刷新">

              <Icon icon="lucide:rotate-ccw" />

            </button>

            <button class="btn-secondary" @click="createCourse">添加课程</button>

            <button class="btn-primary" @click="exportData">导出</button>

          </div>

        </div>



        <div class="filter-tags">

          <button

            class="filter-tag"

            :class="{ active: !selectedCategory }"

            @click="selectedCategory = ''"

          >

            全部

          </button>

          <button

            v-for="cat in categories"

            :key="cat.id"

            class="filter-tag"

            :class="{ active: selectedCategory === cat.id }"

            @click="selectedCategory = cat.id"

          >

            {{ cat.name }}

          </button>

        </div>

      </div>



      <!-- 课程列表 - 错落网格 -->

      <div v-if="filteredCourses.length > 0" class="courses-grid-v2">

        <div

          v-for="(course, i) in filteredCourses"

          :key="course.id"

          class="course-card-v2 card-base"
          @click="viewCourse(course)"
        >
          <div class="card-image-wrap">
            <div class="card-ribbon" />
            <img :src="course.cover" class="card-image" />
            <div class="card-overlay">
              <button class="start-btn-v2">
                {{ getCourseProgress(course.id) > 0 ? '继续' : '开始' }}
              </button>
            </div>
            <button
              class="favorite-btn-v2"
              :class="{ active: courseStore.isCourseFavorite(course.id) }"
              @click="toggleFavorite(course.id, $event)"
            >
              <Icon
                :icon="courseStore.isCourseFavorite(course.id) ? 'lucide:star' : 'lucide:star'"
              />
            </button>
            <div v-if="getCourseProgress(course.id) > 0" class="progress-badge">
              {{ getCourseProgress(course.id) }}%
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-title-v2">{{ course.title }}</h3>
            <p class="card-desc-v2">{{ course.description }}</p>

            <div class="card-meta">
              <span class="meta-item">
                <Icon icon="lucide:book-open" />
                {{ course.teacherName }}
              </span>
              <span class="meta-item">
                <Icon icon="lucide:stopwatch" />
                {{ formatDuration(course.totalDuration) }}
              </span>
            </div>

            <div v-if="getCourseProgress(course.id) > 0" class="progress-bar">
              <div class="progress-fill" :style="{ width: getCourseProgress(course.id) + '%' }" />
            </div>
            <div v-else class="progress-bar progress-bar--empty" />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state-v2">
        <Icon icon="lucide:inbox" class="empty-icon-v2" />
        <p>暂无相关课程</p>
        <button class="btn-text" @click="searchQuery = ''; selectedCategory = ''">清除筛选</button>
      </div>
    </section>

    </div><!-- /Tab1 推荐路径 end -->

    <!-- ── Tab 2：全部课程 ── -->
    <div v-show="activeTab === 'all'" class="lc-all-courses">
      <div class="lc-all-toolbar">
        <div class="lc-all-cats">
          <button
            v-for="cat in lcCourseCategories" :key="cat"
            class="lc-cat-btn"
            :class="{ 'lc-cat-btn--active': lcCategory === cat }"
            @click="lcCategory = cat; lcPage = 1"
          >{{ cat }}</button>
        </div>
        <el-input
          v-model="lcKeyword"
          placeholder="搜索课程名称"
          clearable
          size="small"
          style="width: 200px"
          @input="lcPage = 1"
        />
        <span class="lc-all-count">共 {{ lcFilteredCourses.length }} 门</span>
      </div>

      <div class="lc-all-grid">
        <div
          v-for="c in lcPagedCourses" :key="c.id"
          class="lc-course-card card-base is-interactive"
          @click="router.push(`/app/student/course/${c.id}`)"
        >
          <div class="lc-course-card__top">
            <span class="lc-course-card__title">{{ c.title }}</span>
            <el-tag size="small" effect="plain" style="flex-shrink:0">{{ c.categoryId }}</el-tag>
          </div>
          <p class="lc-course-card__desc">{{ c.description }}</p>
          <div class="lc-course-card__meta">
            <span>{{ c.teacherName }}</span>
            <span class="lc-dot">·</span>
            <span>{{ c.chapters?.length ?? 0 }} 章</span>
          </div>
        </div>
      </div>

      <div v-if="lcFilteredCourses.length === 0" class="lc-empty">
        <Icon icon="lucide:inbox" :width="28" />
        <p>暂无课程，换个关键词试试</p>
      </div>

      <el-pagination
        v-if="lcFilteredCourses.length > lcPageSize"
        v-model:current-page="lcPage"
        :page-size="lcPageSize"
        :total="lcFilteredCourses.length"
        layout="prev, pager, next"
        background
        style="margin-top: 12px; justify-content: flex-end; display: flex"
      />
    </div>

    <!-- ── Tab 3：我的课程 ── -->
    <div v-show="activeTab === 'mine'" class="lc-mine-courses">
      <div v-if="myCourses.length === 0" class="lc-empty">
        <Icon icon="lucide:book-open" :width="28" />
        <p>还没有报名课程，去<button class="lc-link" @click="activeTab = 'all'">全部课程</button>开始学习</p>
      </div>
      <div v-else class="lc-mine-list">
        <div
          v-for="c in myCourses" :key="c.id"
          class="lc-mine-item card-base"
          @click="router.push(`/app/student/course/${c.id}`)"
        >
          <div class="lc-mine-item__info">
            <span class="lc-mine-item__title">{{ c.title }}</span>
            <span class="lc-mine-item__teacher">{{ c.teacherName }}</span>
          </div>
          <div class="lc-mine-item__progress">
            <div class="lc-mine-progress-bar">
              <div
                class="lc-mine-progress-fill"
                :style="{ width: c.maxProgress + '%', background: c.maxProgress >= 100 ? 'var(--bamboo-green, #4A6741)' : 'var(--color-primary)' }"
              />
            </div>
            <span class="lc-mine-pct" :style="{ color: c.maxProgress >= 100 ? 'var(--bamboo-green, #4A6741)' : 'var(--color-text-muted)' }">
              {{ c.maxProgress >= 100 ? '已完成' : c.maxProgress + '%' }}
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Tab 导航栏 ── */
.lc-tabs {
  display: flex; gap: 2px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 14px;
  background: var(--color-surface);
  padding: 0;
}
.lc-tabs__item {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px; transition: all var(--transition-fast);
}
.lc-tabs__item:hover { color: var(--color-text); }
.lc-tabs__item--active {
  color: var(--color-primary); font-weight: 600;
  border-bottom-color: var(--color-primary);
}

/* ── 全部课程 Tab ── */
.lc-all-toolbar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.lc-all-cats { display: flex; gap: 6px; flex-wrap: wrap; }
.lc-cat-btn {
  padding: 4px 10px; border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: none; cursor: pointer; font-size: 12px;
  color: var(--color-text-muted); transition: all var(--transition-fast);
}
.lc-cat-btn:hover, .lc-cat-btn--active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}
.lc-all-count { font-size: 12px; color: var(--color-text-subtle); margin-left: auto; }

.lc-all-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.lc-course-card {
  padding: 14px; cursor: pointer;
  display: flex; flex-direction: column; gap: 8px;
}
.lc-course-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.lc-course-card__title { font-size: 13px; font-weight: 600; color: var(--color-text); line-height: 1.3; }
.lc-course-card__desc { font-size: 11px; color: var(--color-text-muted); line-height: 1.5; margin: 0; }
.lc-course-card__meta { font-size: 11px; color: var(--color-text-subtle); display: flex; gap: 4px; }
.lc-dot { opacity: 0.5; }

/* ── 我的课程 Tab ── */
.lc-mine-list { display: flex; flex-direction: column; gap: 8px; }
.lc-mine-item {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 14px; cursor: pointer;
}
.lc-mine-item__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.lc-mine-item__title { font-size: 13px; font-weight: 500; color: var(--color-text); }
.lc-mine-item__teacher { font-size: 11px; color: var(--color-text-subtle); }
.lc-mine-item__progress { display: flex; align-items: center; gap: 8px; width: 180px; flex-shrink: 0; }
.lc-mine-progress-bar { flex: 1; height: 4px; background: var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
.lc-mine-progress-fill { height: 100%; border-radius: var(--radius-sm); transition: width 0.4s ease; }
.lc-mine-pct { font-size: 11px; font-weight: 500; width: 44px; text-align: right; white-space: nowrap; }

/* ── 共用空状态 ── */
.lc-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 40px 20px;
  color: var(--color-text-subtle); font-size: 13px; text-align: center;
}
.lc-empty .lc-link { background: none; border: none; color: var(--color-secondary); cursor: pointer; text-decoration: underline; }

/* ── 推荐学习路径区块 ── */
.lc-rec-section {
  margin-bottom: 16px;
  border-radius: 10px;
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border, #e2e8f0);
  padding: 14px 16px;
}
.lc-rec-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 12px; flex-wrap: wrap;
}
.lc-rec-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700;
  color: var(--text-primary, #1a202c);
}
.lc-rec-meta {
  font-size: 11px; color: var(--text-secondary, #718096);
  margin-left: auto;
}
.lc-muted { color: var(--text-muted, #a0aec0); }
.lc-link {
  background: none; border: none; cursor: pointer;
  color: var(--color-primary, #4f46e5); font-size: 11px;
  text-decoration: underline; padding: 0;
}
.lc-rec-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.lc-rec-card {
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: 8px; padding: 10px 12px;
  background: var(--bg-secondary, #f7fafc);
}
.lc-rec-card__head {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 8px; flex-wrap: wrap;
}
.lc-rec-skill {
  font-size: 12px; font-weight: 600;
  color: var(--text-primary, #1a202c);
}
.lc-rec-weak-tag {
  font-size: 10px; background: rgba(245,158,11,0.15);
  color: #d97706; border-radius: 4px; padding: 1px 5px;
}
.lc-rec-heat {
  margin-left: auto; font-size: 10px;
  color: var(--text-muted, #a0aec0);
}
.lc-rec-courses { display: flex; flex-direction: column; gap: 5px; }
.lc-rec-course-btn {
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: 5px; padding: 4px 8px;
  font-size: 11px; cursor: pointer; text-align: left;
  color: var(--text-primary, #1a202c); transition: background 0.15s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.lc-rec-course-btn:hover { background: var(--color-primary-light, #ede9fe); }
.lc-rec-footer {
  display: flex; gap: 12px; flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--card-border, #e2e8f0);
}
.lc-footer-link {
  display: flex; align-items: center; gap: 5px;
  background: none; border: none; cursor: pointer;
  font-size: 11px; color: var(--text-secondary, #718096);
  padding: 0;
}
.lc-footer-link:hover { color: var(--color-primary, #4f46e5); }

.learning-center {
  padding-bottom: 40px;
}

.course-block {
  margin-top: 14px;
  padding: 14px;
}

.course-block__toolbar {
  padding-bottom: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
  margin-bottom: 14px;
}

.career {
  margin: 6px 0 22px;
}

.career-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
}

.career-title {
  font-weight: 900;
  font-size: 15px;
  line-height: 1.2;
}

.career-sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-200);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.career-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
  background: color-mix(in srgb, var(--bg-100) 86%, #ffffff 14%);
  color: var(--text-100);
  font-weight: 800;
}

.career-head__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.role-select {
  width: 200px;
}

.career-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.panel {
  min-width: 0;
}

.panel--chart {
  padding: 12px;
}

.panel__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.panel__title {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.2;
  color: var(--text-100);
}

.panel__meta {
  font-size: 12px;
  color: var(--text-200);
}

.chart {
  width: 100%;
}

.chart--force {
  height: 520px;
}

.chart--sankey {
  height: 320px;
}

.chart--salary {
  height: 320px;
}

.side {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.panel--force {
  display: flex;
  flex-direction: column;
}

.force-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.prereq-float {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: min(360px, 46%);
  height: 260px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg-200) 78%, #000000 22%);
}

.prereq-float__head {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
}


.prereq-float__title {
  font-weight: 900;
  font-size: 13px;
  color: var(--text-100);
}

.prereq-float__close {
  width: 28px;
  height: 28px;
  border-radius: 0;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent);
  background: transparent;
  color: var(--text-100);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.prereq-float__close:hover {
  background: color-mix(in srgb, var(--primary-100) 10%, transparent);
}

.prereq-float__chart {
  height: calc(260px - 38px);
  width: 100%;
}

.panel--force .chart--force {
  flex: 1;
  height: auto;
  min-height: 560px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.topbar__left {
  flex: 1;
  min-width: 0;
}

.topbar__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-200);
  border: none;
  border-radius: 0;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--bg-300);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--primary-100);
  color: var(--bg-100);
  border: none;
  border-radius: 0;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-300);
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary-100);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 0;
  transition: background 0.2s;
}

.btn-text:hover {
  background: color-mix(in srgb, var(--primary-100) 10%, transparent);
}

.search-box {
  position: relative;
  width: min(520px, 100%);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
}

.search-input {
  width: 100%;
  padding: 14px 48px;
  background: var(--bg-200);
  border: 2px solid transparent;
  border-radius: 0;
  font-size: 16px;
  color: var(--text-100);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-100);
  background: var(--bg-100);
}

.search-clear {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.search-clear:hover {
  opacity: 1;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0;
}

.btn-secondary {
  height: 44px;
  padding: 0 16px;
  border-radius: 0;
  border: 1px solid var(--bg-300);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  color: var(--text-100);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.btn-secondary:hover {
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
  border-color: color-mix(in srgb, var(--primary-100) 35%, var(--bg-300) 65%);
}

.filter-tag {
  padding: 10px 18px;

  background: var(--bg-200);

  border: none;

  border-radius: 0;

  font-size: 14px;

  color: var(--text-200);

  cursor: pointer;

  transition: all 0.2s ease;

}



.filter-tag:hover {

  background: var(--bg-300);

  color: var(--text-100);

}



.filter-tag.active {
  background: color-mix(in srgb, var(--primary-100) 12%, var(--bg-100) 88%);
  color: var(--primary-100);
  font-weight: 600;
}


/* 课程网格 - 错落布局 */

.courses-grid-v2 {

  display: grid;

  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));

  gap: 24px;

}



.course-card-v2 {
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 420px;
  min-width: 0;
}

.course-card-v2:hover {
  border-color: var(--card-hover-border);
}


.card-image-wrap {

  position: relative;

  height: 160px;

  overflow: hidden;

}



.card-ribbon {
  display: none;
}


.card-image {

  width: 100%;

  height: 100%;

  object-fit: cover;

  transition: transform 0.3s ease;

}



.course-card-v2:hover .card-image {
  transform: none;
}


.card-overlay {
  display: none;
}

.course-card-v2:hover .card-overlay {
  opacity: 0;
}


.start-btn-v2 {
  padding: 10px 24px;
  background: var(--primary-100);
  color: var(--bg-100);
  border: none;
  border-radius: 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.start-btn-v2:hover {
  background: var(--primary-300);
}


.favorite-btn-v2 {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-100);
  border: 1px solid var(--card-border);
  border-radius: 0;
  font-size: 18px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.favorite-btn-v2:hover {
  border-color: var(--card-hover-border);
}

.favorite-btn-v2.active {
  color: var(--primary-100);
  border-color: var(--primary-100);
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-100) 90%);
}


.progress-badge {

  position: absolute;

  bottom: 12px;

  left: 12px;

  padding: 6px 12px;

  background: var(--primary-100);

  color: var(--bg-100);

  border-radius: 0;

  font-size: 13px;

  font-weight: 700;

}



.card-body {

  padding: 18px;

  flex: 1;

  display: flex;

  flex-direction: column;

}



.card-title-v2 {

  font-size: 17px;

  font-weight: 700;

  color: var(--text-100);

  margin: 0 0 8px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

}



.card-desc-v2 {

  font-size: 13px;

  color: var(--text-200);

  margin: 0 0 14px;

  display: -webkit-box;

  -webkit-line-clamp: 2;

  line-clamp: 2;

  -webkit-box-orient: vertical;

  overflow: hidden;

  line-height: 1.5;

}



.card-meta {

  display: flex;

  gap: 16px;

  margin-bottom: 14px;

}



.card-meta {

  margin-top: auto;

}



.meta-item {

  display: flex;

  align-items: center;

  gap: 6px;

  font-size: 13px;

  color: var(--text-200);

}



.progress-bar {

  height: 6px;

  background: var(--bg-200);

  border-radius: 3px;

  overflow: hidden;

}



.progress-bar--empty {

  opacity: 0.35;

}



.progress-fill {

  height: 100%;

  background: linear-gradient(90deg, var(--primary-100), color-mix(in srgb, var(--primary-100) 50%, var(--accent-100)));

  border-radius: 3px;

  transition: width 0.5s ease;

}



/* 空状态 */

.empty-state-v2 {

  text-align: center;

  padding: 80px 20px;

  color: var(--text-200);

}



.empty-icon-v2 {

  font-size: 64px;

  margin-bottom: 16px;

}



/* 响应式 */

@media (max-width: 768px) {

  .topbar {

    flex-direction: column;

    align-items: stretch;

  }



  .topbar__right {

    justify-content: flex-start;

    flex-wrap: wrap;

  }



  .search-box {

    width: 100%;

  }

  

  .courses-grid-v2 {

    grid-template-columns: 1fr;

  }



  .chart--force {

    height: 420px;

  }

}



@media (min-width: 1280px) {

  .career-grid {

    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);

    align-items: start;

  }



  .side {

    grid-template-rows: auto auto;

  }



  .panel--force .chart--force {

    min-height: 720px;

  }

}

</style>







