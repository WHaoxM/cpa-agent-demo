<!-- 页面：学习中心；路由：student/learning（student-learning）；角色：STUDENT/TEACHER -->


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

import { useUserStore, useCourseStore } from '@/stores'

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

    <section class="career">

      <div class="career-head card-base">
        <div class="career-head__left">

          <div class="career-title">职业推测与能力画像</div>

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

              <div class="panel__title">知识点 - 岗位匹配</div>

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
  </div>
</template>

<style scoped>
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







