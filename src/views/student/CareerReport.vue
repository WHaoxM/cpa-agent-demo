<!-- 页面：职业生涯发展报告；路由：student/career-report；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores'
import {
  JOB_PORTRAITS, METRO_LINES, TRANSFER_EDGES,
  deriveStudentSevenDim, getGrowthPlan,
  type JobPortrait, type SevenDim,
} from '@/mock/careerReportData'
import * as echarts from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([RadarChart, TooltipComponent, LegendComponent, SVGRenderer])

const router = useRouter()
const resumeStore = useResumeStore()
const userStore = useUserStore()

/* ══ 选中状态 ══ */
const selectedJobId = ref<string>('')
const showGrowthPlan = ref(false)
const radarEl = ref<HTMLElement | null>(null)
let radarChart: echarts.ECharts | null = null

/* ══ 推荐岗位（来自 resumeStore 匹配结果，最多 5 个）══ */
const recommendedJobs = computed<JobPortrait[]>(() => {
  const matched = resumeStore.matchedCareers
  if (!matched.length) {
    return JOB_PORTRAITS.filter(j => ['fe-mid', 'fe-junior', 'da-junior', 'qa-junior', 'fullstack'].includes(j.id))
  }
  const roleToIds: Record<string, string[]> = {
    '前端开发':     ['fe-junior', 'fe-mid', 'fe-senior'],
    '后端开发':     ['fullstack', 'fe-mid'],
    '测试开发':     ['qa-junior', 'qa-senior'],
    '数据分析':     ['da-junior', 'da-mid'],
    '机器学习工程师': ['ml-engineer', 'da-mid'],
  }
  const ids = new Set<string>()
  for (const c of matched.slice(0, 3)) {
    const list = roleToIds[c.role] ?? []
    list.slice(0, 2).forEach(id => ids.add(id))
  }
  return JOB_PORTRAITS.filter(j => ids.has(j.id)).slice(0, 5)
})

const selectedJob = computed(() => JOB_PORTRAITS.find(j => j.id === selectedJobId.value) ?? null)

/* ══ 学生七维 ══ */
const studentDim = computed<SevenDim>(() => {
  const skills = resumeStore.parsedSkills
  const confidence = resumeStore.insights?.confidence ?? 0.5
  return deriveStudentSevenDim(skills, confidence)
})

/* ══ 成长计划 ══ */
const growthPlan = computed(() => selectedJobId.value ? getGrowthPlan(selectedJobId.value) : [])

/* ══ 地铁图坐标系 ══ */
const SVG_W = 560
const SVG_H = 480

const LEVEL_Y: Record<string, number> = {
  intern:  68,
  junior: 160,
  mid:    250,
  senior: 340,
  lead:   420,
  expert: 460,
}

const LINE_X: Record<string, number> = {
  qa:        90,
  frontend:  240,
  fullstack: 380,
  data:      510,
}

const LABEL_OFFSET: Record<string, { x: number; anchor: string }> = {
  qa:        { x: -16, anchor: 'end' },
  frontend:  { x: -16, anchor: 'end' },
  fullstack: { x: 16, anchor: 'start' },
  data:      { x: 16, anchor: 'start' },
}

/* 站点坐标 */
const stationPos = computed(() => {
  const map: Record<string, { x: number; y: number }> = {}
  for (const job of JOB_PORTRAITS) {
    const x = LINE_X[job.lineId] ?? 300
    const y = LEVEL_Y[job.level] ?? 250
    map[job.id] = { x, y }
  }
  return map
})

/* 线段路径：每条主线各站点连起来 */
const linePaths = computed(() => {
  return METRO_LINES.map(line => {
    const pts = line.stationIds
      .map(id => stationPos.value[id])
      .filter((p): p is { x: number; y: number } => !!p)
    if (pts.length < 2) return null
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    return { line, d }
  }).filter(Boolean)
})

/* 换乘路径：贝塞尔曲线 */
const transferPaths = computed(() => {
  return TRANSFER_EDGES.map(edge => {
    const s = stationPos.value[edge.fromId]
    const e = stationPos.value[edge.toId]
    if (!s || !e) return null
    const mx = (s.x + e.x) / 2
    const my = Math.min(s.y, e.y) - 30
    const d = `M ${s.x} ${s.y} Q ${mx} ${my} ${e.x} ${e.y}`
    const labelX = mx
    const labelY = my - 6
    return { edge, d, labelX, labelY }
  }).filter(Boolean)
})

/* ══ Radar 图 ══ */
const DIM_NAMES = ['专业技能', '证书资质', '创新能力', '学习能力', '抗压能力', '沟通能力', '实习经验'] as const

function buildRadarOption() {
  const job = selectedJob.value
  if (!job) return null
  const indicators = DIM_NAMES.map(name => ({ name, max: 100 }))
  const stu = DIM_NAMES.map(n => studentDim.value[n])
  const pos = DIM_NAMES.map(n => job.sevenDim[n])
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      textStyle: { color: 'rgba(212,201,181,0.7)', fontSize: 11 },
      data: ['我的能力', '岗位要求'],
    },
    radar: {
      indicator: indicators,
      radius: '62%',
      center: ['50%', '46%'],
      splitNumber: 4,
      axisName: { color: 'rgba(212,201,181,0.75)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(212,201,181,0.12)' } },
      splitArea: { areaStyle: { color: ['rgba(30,20,10,0.25)', 'rgba(30,20,10,0.1)'] } },
      axisLine: { lineStyle: { color: 'rgba(212,201,181,0.15)' } },
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: stu,
          name: '我的能力',
          lineStyle: { color: '#C4622D', width: 2 },
          areaStyle: { color: 'rgba(196,98,45,0.2)' },
          itemStyle: { color: '#C4622D' },
        },
        {
          value: pos,
          name: '岗位要求',
          lineStyle: { color: '#B8962E', width: 2, type: 'dashed' },
          areaStyle: { color: 'rgba(184,150,46,0.12)' },
          itemStyle: { color: '#B8962E' },
        },
      ],
    }],
  }
}

function initRadarChart() {
  if (!radarEl.value) return
  radarChart?.dispose()
  radarChart = echarts.init(radarEl.value, undefined, { renderer: 'svg' })
  const opt = buildRadarOption()
  if (opt) radarChart.setOption(opt)
}

function disposeRadar() {
  radarChart?.dispose()
  radarChart = null
}

watch(selectedJob, async () => {
  if (!selectedJob.value) return
  await nextTick()
  initRadarChart()
})

watch(radarEl, el => { if (el && selectedJob.value) initRadarChart() })

/* ══ 差距数值 ══ */
const dimGaps = computed(() => {
  if (!selectedJob.value) return []
  return DIM_NAMES.map(name => {
    const mine = studentDim.value[name]
    const need = selectedJob.value!.sevenDim[name]
    const gap = need - mine
    return { name, mine, need, gap }
  })
})

/* ══ 点击选中 ══ */
function selectJob(id: string) {
  selectedJobId.value = selectedJobId.value === id ? '' : id
  showGrowthPlan.value = false
}

/* ══ 导出（print）══ */
function exportReport() {
  window.print()
}

/* ══ 返回 ══ */
function goBack() {
  router.push({ name: 'student-career-navigation' })
}

/* ══ resize ══ */
function onResize() { radarChart?.resize() }

onMounted(() => {
  window.addEventListener('resize', onResize)
  if (recommendedJobs.value.length) {
    selectedJobId.value = recommendedJobs.value[0]?.id ?? ''
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  disposeRadar()
})
</script>

<template>
  <div class="cr-page">

    <!-- ══ HEADER ══ -->
    <header class="cr-header">
      <div class="cr-header__left">
        <button class="cr-back" @click="goBack">
          <Icon icon="lucide:arrow-left" :width="14"/><span>返回</span>
        </button>
        <span class="cr-title">职业生涯发展报告</span>
      </div>
      <div class="cr-header__center">
        <span class="cr-username">{{ userStore.currentUser?.name ?? '同学' }}</span>
        <span class="cr-sep">的</span>
        <span class="cr-tagline">岗位匹配 · 路径规划 · 成长行动</span>
      </div>
      <div class="cr-header__right">
        <button class="cr-export-btn" @click="exportReport">
          <Icon icon="lucide:download" :width="12"/><span>导出报告</span>
        </button>
      </div>
    </header>

    <!-- ══ 主体 ══ -->
    <div class="cr-body">

      <!-- ── 左侧：地铁图区 ── -->
      <div class="cr-map-panel">

        <!-- 推荐岗位 chips -->
        <div class="cr-recommend-bar">
          <span class="cr-rb-label"><Icon icon="lucide:sparkles" :width="12"/>推荐岗位</span>
          <div class="cr-rb-chips">
            <button
              v-for="job in recommendedJobs" :key="job.id"
              class="cr-chip"
              :class="{ 'cr-chip--active': selectedJobId === job.id }"
              @click="selectJob(job.id)"
            >
              {{ job.title }}
              <span class="cr-chip__salary">{{ job.salaryRange }}</span>
            </button>
          </div>
        </div>

        <!-- 地铁路线图 SVG -->
        <div class="cr-metro-wrap">
          <svg
            class="cr-metro-svg"
            :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
            fill="none"
            aria-label="职业路径地铁图"
          >
            <!-- 纵轴刻度标签 -->
            <g class="cr-axis-labels">
              <text v-for="(y, lvl) in LEVEL_Y" :key="lvl" x="8" :y="y + 4" class="cr-axis-text">
                {{ { intern:'实习', junior:'初级', mid:'中级', senior:'高级', lead:'负责人', expert:'专家' }[lvl] }}
              </text>
              <!-- 横轴分隔线 -->
              <line v-for="(y, lvl) in LEVEL_Y" :key="'line-'+lvl"
                x1="42" :y1="y" :x2="SVG_W - 10" :y2="y"
                stroke="rgba(212,201,181,0.06)" stroke-width="1" stroke-dasharray="4 8"
              />
            </g>

            <!-- 主线轨道 -->
            <path
              v-for="item in linePaths" :key="item!.line.id"
              :d="item!.d"
              :stroke="item!.line.trackColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- 换乘曲线 -->
            <path
              v-for="item in transferPaths" :key="item!.edge.fromId + item!.edge.toId"
              :d="item!.d"
              stroke="rgba(196,185,166,0.35)"
              stroke-width="1.5"
              stroke-dasharray="5 4"
              stroke-linecap="round"
              fill="none"
            />

            <!-- 换乘技能标签 -->
            <g v-for="item in transferPaths" :key="'lbl-'+item!.edge.fromId">
              <text
                :x="item!.labelX" :y="item!.labelY"
                text-anchor="middle"
                class="cr-transfer-lbl"
              >{{ item!.edge.skills[0] }}</text>
            </g>

            <!-- 站点 -->
            <g
              v-for="job in JOB_PORTRAITS" :key="job.id"
              class="cr-station"
              :class="{
                'cr-station--active': selectedJobId === job.id,
                'cr-station--recommended': recommendedJobs.some(r => r.id === job.id) && selectedJobId !== job.id,
              }"
              @click="selectJob(job.id)"
            >
              <!-- 外圆（选中光晕） -->
              <circle
                v-if="selectedJobId === job.id && stationPos[job.id]"
                :cx="stationPos[job.id]?.x"
                :cy="stationPos[job.id]?.y"
                r="15"
                :fill="METRO_LINES.find(l=>l.id===job.lineId)?.color ?? '#888'"
                fill-opacity="0.18"
              />
              <!-- 主圆点 -->
              <circle
                v-if="stationPos[job.id]"
                :cx="stationPos[job.id]?.x"
                :cy="stationPos[job.id]?.y"
                :r="selectedJobId === job.id ? 8 : 6"
                :fill="selectedJobId === job.id
                  ? (METRO_LINES.find(l=>l.id===job.lineId)?.color ?? '#888')
                  : 'rgba(237,229,214,0.15)'"
                :stroke="METRO_LINES.find(l=>l.id===job.lineId)?.color ?? '#888'"
                :stroke-width="selectedJobId === job.id ? 2 : 1.5"
              />
              <!-- 推荐星标 -->
              <circle
                v-if="recommendedJobs.some(r => r.id === job.id) && stationPos[job.id]"
                :cx="(stationPos[job.id]?.x ?? 0) + 9"
                :cy="(stationPos[job.id]?.y ?? 0) - 9"
                r="4"
                fill="#C4622D"
              />
              <!-- 岗位名称 -->
              <text
                v-if="stationPos[job.id]"
                :x="(stationPos[job.id]?.x ?? 0) + (LABEL_OFFSET[job.lineId]?.x ?? 16)"
                :y="(stationPos[job.id]?.y ?? 0) + 4"
                :text-anchor="LABEL_OFFSET[job.lineId]?.anchor ?? 'start'"
                class="cr-station-label"
                :class="{ 'cr-station-label--active': selectedJobId === job.id }"
              >{{ job.title }}</text>
            </g>

            <!-- 线路图例 -->
            <g class="cr-legend">
              <g v-for="(line, i) in METRO_LINES" :key="line.id" :transform="`translate(${60 + i * 130}, ${SVG_H - 18})`">
                <line x1="0" y1="0" x2="18" y2="0" :stroke="line.color" stroke-width="2.5" stroke-linecap="round"/>
                <text x="22" y="4" class="cr-legend-text">{{ line.name }}</text>
              </g>
            </g>
          </svg>
        </div>

        <!-- 地图说明 -->
        <div class="cr-map-hint">
          <Icon icon="lucide:info" :width="11"/>
          <span>点击站点查看岗位详情与能力差距 · <span class="cr-hint-dot"></span> 橙点为系统推荐岗位</span>
        </div>
      </div>

      <!-- ── 右侧：岗位详情 + 七维雷达 ── -->
      <div class="cr-detail-panel">

        <!-- 空态提示 -->
        <div v-if="!selectedJob" class="cr-detail-empty">
          <Icon icon="lucide:mouse-pointer-click" :width="28" class="cr-detail-empty__icon"/>
          <p>点击左侧路线图中的<br/>任意岗位站点查看详情</p>
        </div>

        <template v-else>
          <!-- 岗位卡头 -->
          <div class="cr-job-card-head">
            <div class="cr-jch-main">
              <span class="cr-jch-title">{{ selectedJob.title }}</span>
              <span class="cr-jch-salary">{{ selectedJob.salaryRange }}</span>
            </div>
            <p class="cr-jch-desc">{{ selectedJob.desc }}</p>
            <div class="cr-jch-skills">
              <span v-for="sk in selectedJob.keySkills" :key="sk" class="cr-skill-tag">{{ sk }}</span>
            </div>
          </div>

          <!-- 七维能力差距 -->
          <div class="cr-gap-section">
            <div class="cr-gap-title">
              <Icon icon="lucide:bar-chart-2" :width="13"/>
              <span>七维能力差距</span>
            </div>

            <!-- 雷达图 -->
            <div ref="radarEl" class="cr-radar"></div>

            <!-- 差距条形列表 -->
            <div class="cr-gap-bars">
              <div v-for="item in dimGaps" :key="item.name" class="cr-gap-row">
                <span class="cr-gap-dim">{{ item.name }}</span>
                <div class="cr-gap-track">
                  <div class="cr-gap-fill cr-gap-fill--mine" :style="{ width: item.mine + '%' }"></div>
                  <div
                    class="cr-gap-fill cr-gap-fill--need"
                    :style="{ width: Math.max(0, item.need - item.mine) + '%', left: item.mine + '%' }"
                  ></div>
                </div>
                <span class="cr-gap-val" :class="{ 'cr-gap-val--neg': item.gap > 0 }">
                  {{ item.gap > 0 ? '−' + item.gap : '+' + Math.abs(item.gap) }}
                </span>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>

    <!-- ══ 成长计划区 ══ -->
    <div class="cr-plan-section" :class="{ 'cr-plan-section--open': showGrowthPlan }">
      <div class="cr-plan-trigger">
        <button
          class="cr-plan-btn"
          :disabled="!selectedJob"
          @click="showGrowthPlan = !showGrowthPlan"
        >
          <Icon :icon="showGrowthPlan ? 'lucide:chevron-down' : 'lucide:sparkles'" :width="13"/>
          {{ showGrowthPlan ? '收起成长计划' : '✨ 生成个性化成长计划' }}
        </button>
        <button v-if="showGrowthPlan" class="cr-plan-export" @click="exportReport">
          <Icon icon="lucide:printer" :width="12"/><span>导出 PDF</span>
        </button>
      </div>

      <div v-if="showGrowthPlan && growthPlan.length" class="cr-plan-content">
        <div v-for="stage in growthPlan" :key="stage.phase" class="cr-plan-stage">
          <div class="cr-ps-head">
            <span class="cr-ps-phase" :class="`cr-ps-phase--${stage.phase}`">{{ stage.phaseLabel }}</span>
            <span class="cr-ps-goal">{{ stage.goal }}</span>
          </div>
          <ul class="cr-ps-tasks">
            <li v-for="t in stage.tasks" :key="t" class="cr-ps-task">
              <Icon icon="lucide:check-circle" :width="11" class="cr-ps-check"/>
              {{ t }}
            </li>
          </ul>
          <div class="cr-ps-milestone">
            <Icon icon="lucide:flag" :width="11"/>
            <span>{{ stage.milestone }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── CSS 变量 ── */
:root {
  --cr-bg: #F0EBE0;
  --cr-dark: #0E0804;
  --cr-text: #1A1410;
  --cr-sub: #6B5D4F;
  --cr-muted: #C4B9A6;
  --cr-red: #8B2500;
  --cr-gold: #8B6914;
  --cr-border: rgba(196,185,166,0.2);
}

/* ── 页面容器 ── */
.cr-page {
  position: relative;
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  background: #1A1008;
  display: flex;
  flex-direction: column;
  font-family: var(--font-title, 'LXGW WenKai', serif);
  overflow: hidden;
}

/* ── HEADER ── */
.cr-header {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 24px;
  height: 48px;
  min-height: 48px;
  border-bottom: 1px solid rgba(196,185,166,0.12);
  background: rgba(10,6,2,0.7);
  backdrop-filter: blur(10px);
  z-index: 10;
}
.cr-header__left { display: flex; align-items: center; gap: 10px; }
.cr-header__center { display: flex; align-items: center; gap: 5px; }
.cr-header__right { display: flex; justify-content: flex-end; }

.cr-back {
  display: flex; align-items: center; gap: 5px;
  background: none; border: 1px solid rgba(196,185,166,0.2);
  color: rgba(196,185,166,0.75); font-size: 11px; letter-spacing: 0.06em;
  padding: 4px 10px; border-radius: 4px; cursor: pointer;
  transition: all 0.2s;
}
.cr-back:hover { border-color: rgba(139,37,0,0.5); color: rgba(220,170,130,0.9); }
.cr-title { font-size: 13px; font-weight: 700; color: rgba(237,229,214,0.9); letter-spacing: 0.08em; }
.cr-username { font-size: 12px; font-weight: 700; color: rgba(220,170,130,0.9); }
.cr-sep { font-size: 11px; color: rgba(140,125,100,0.5); margin: 0 2px; }
.cr-tagline { font-size: 11px; color: rgba(180,165,140,0.55); letter-spacing: 0.06em; }
.cr-export-btn {
  display: flex; align-items: center; gap: 5px;
  background: rgba(139,37,0,0.15); border: 1px solid rgba(139,37,0,0.35);
  color: rgba(220,160,120,0.9); font-size: 11px; padding: 4px 12px; border-radius: 4px;
  cursor: pointer; transition: all 0.2s; letter-spacing: 0.04em;
}
.cr-export-btn:hover { background: rgba(139,37,0,0.28); border-color: rgba(139,37,0,0.6); }

/* ── 主体布局 ── */
.cr-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 0;
  overflow: hidden;
}

/* ── 左侧地铁图区 ── */
.cr-map-panel {
  display: flex;
  flex-direction: column;
  padding: 14px 16px 10px 20px;
  overflow: hidden;
  border-right: 1px solid rgba(196,185,166,0.1);
}

/* 推荐岗位 chips */
.cr-recommend-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.cr-rb-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; color: rgba(180,160,120,0.65); letter-spacing: 0.08em;
  white-space: nowrap; flex-shrink: 0;
}
.cr-rb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.cr-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  background: rgba(237,229,214,0.05);
  border: 1px solid rgba(196,185,166,0.2);
  color: rgba(200,185,165,0.75); font-size: 11px;
  cursor: pointer; transition: all 0.2s;
}
.cr-chip:hover { border-color: rgba(139,37,0,0.4); color: rgba(220,170,130,0.9); }
.cr-chip--active {
  background: rgba(139,37,0,0.18); border-color: rgba(139,37,0,0.5);
  color: rgba(230,180,140,0.95); font-weight: 600;
}
.cr-chip__salary { font-size: 9px; color: rgba(140,120,90,0.6); }

/* 地铁 SVG 容器 */
.cr-metro-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cr-metro-svg {
  width: 100%;
  height: 100%;
  max-height: 100%;
  cursor: default;
}

/* SVG 内元素样式（不可 scoped，用全局类但在此处定义） */
.cr-axis-text {
  font-size: 9px;
  fill: rgba(160,145,120,0.45);
  font-family: var(--font-title, serif);
  letter-spacing: 0.04em;
}
.cr-station { cursor: pointer; }
.cr-station-label {
  font-size: 10px;
  fill: rgba(190,175,155,0.65);
  font-family: var(--font-title, serif);
  pointer-events: none;
}
.cr-station-label--active {
  fill: rgba(230,180,140,0.95);
  font-weight: 700;
  font-size: 11px;
}
.cr-transfer-lbl {
  font-size: 9px;
  fill: rgba(160,145,120,0.5);
  font-family: var(--font-title, serif);
}
.cr-legend-text {
  font-size: 9.5px;
  fill: rgba(160,145,120,0.55);
  font-family: var(--font-title, serif);
}

/* 地图提示 */
.cr-map-hint {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: rgba(140,125,100,0.45);
  padding-top: 6px; letter-spacing: 0.03em;
}
.cr-hint-dot {
  display: inline-block; width: 6px; height: 6px;
  border-radius: 50%; background: #C4622D;
  vertical-align: middle; margin: 0 1px;
}

/* ── 右侧详情面板 ── */
.cr-detail-panel {
  display: flex;
  flex-direction: column;
  padding: 16px 16px 12px;
  overflow-y: auto;
  background: rgba(12,8,3,0.4);
  gap: 14px;
}
.cr-detail-panel::-webkit-scrollbar { width: 3px; }
.cr-detail-panel::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.3); }

/* 空态 */
.cr-detail-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px; color: rgba(140,125,100,0.4);
  text-align: center; font-size: 12px; line-height: 1.7;
}
.cr-detail-empty__icon { opacity: 0.3; }

/* 岗位卡头 */
.cr-job-card-head {
  background: rgba(237,229,214,0.04);
  border: 1px solid rgba(196,185,166,0.14);
  border-radius: 8px; padding: 12px 14px;
}
.cr-jch-main { display: flex; align-items: baseline; gap: 8px; margin-bottom: 5px; }
.cr-jch-title { font-size: 14px; font-weight: 700; color: rgba(237,229,214,0.92); }
.cr-jch-salary { font-size: 11px; color: rgba(180,150,90,0.8); }
.cr-jch-desc { font-size: 11px; color: rgba(170,155,135,0.7); line-height: 1.55; margin-bottom: 8px; }
.cr-jch-skills { display: flex; flex-wrap: wrap; gap: 5px; }
.cr-skill-tag {
  font-size: 9px; padding: 2px 8px; border-radius: 3px;
  background: rgba(139,37,0,0.1); border: 1px solid rgba(139,37,0,0.28);
  color: rgba(200,160,120,0.85); letter-spacing: 0.04em;
}

/* 七维差距 */
.cr-gap-section { display: flex; flex-direction: column; gap: 10px; }
.cr-gap-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; color: rgba(200,185,165,0.8);
  letter-spacing: 0.06em;
}
.cr-radar { width: 100%; height: 180px; }
.cr-gap-bars { display: flex; flex-direction: column; gap: 6px; }
.cr-gap-row { display: flex; align-items: center; gap: 7px; }
.cr-gap-dim { font-size: 10px; color: rgba(170,155,135,0.75); width: 52px; flex-shrink: 0; }
.cr-gap-track {
  flex: 1; height: 5px; background: rgba(237,229,214,0.08);
  border-radius: 3px; position: relative; overflow: visible;
}
.cr-gap-fill {
  position: absolute; top: 0; height: 100%; border-radius: 3px;
}
.cr-gap-fill--mine { background: rgba(196,98,45,0.65); left: 0; }
.cr-gap-fill--need { background: rgba(196,98,45,0.25); border: 1px dashed rgba(196,98,45,0.4); }
.cr-gap-val { font-size: 10px; width: 30px; text-align: right; color: rgba(140,125,100,0.6); }
.cr-gap-val--neg { color: rgba(200,100,80,0.85); }

/* ── 成长计划区 ── */
.cr-plan-section {
  flex-shrink: 0;
  border-top: 1px solid rgba(196,185,166,0.1);
  background: rgba(10,6,2,0.6);
  transition: max-height 0.35s ease;
  max-height: 48px;
  overflow: hidden;
}
.cr-plan-section--open { max-height: 320px; overflow-y: auto; }
.cr-plan-section--open::-webkit-scrollbar { height: 3px; width: 3px; }
.cr-plan-section--open::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.3); }

.cr-plan-trigger {
  display: flex; align-items: center; gap: 10px;
  padding: 0 24px; height: 48px; flex-shrink: 0;
}
.cr-plan-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(139,37,0,0.15); border: 1px solid rgba(139,37,0,0.35);
  color: rgba(220,160,120,0.9); font-size: 12px; padding: 6px 16px; border-radius: 20px;
  cursor: pointer; transition: all 0.2s; letter-spacing: 0.04em;
}
.cr-plan-btn:hover:not(:disabled) { background: rgba(139,37,0,0.28); }
.cr-plan-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.cr-plan-export {
  display: flex; align-items: center; gap: 5px;
  background: transparent; border: 1px solid rgba(196,185,166,0.2);
  color: rgba(180,165,140,0.7); font-size: 11px; padding: 5px 12px; border-radius: 4px;
  cursor: pointer; transition: all 0.2s;
}
.cr-plan-export:hover { border-color: rgba(196,185,166,0.4); color: rgba(210,195,170,0.9); }

/* 计划内容 */
.cr-plan-content {
  display: flex; gap: 16px;
  padding: 0 24px 16px;
  overflow-x: auto;
}
.cr-plan-stage {
  flex: 1; min-width: 280px;
  background: rgba(237,229,214,0.04);
  border: 1px solid rgba(196,185,166,0.12);
  border-radius: 8px; padding: 14px 16px;
}
.cr-ps-head { margin-bottom: 10px; }
.cr-ps-phase {
  display: inline-block;
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  padding: 2px 8px; border-radius: 3px; margin-bottom: 6px;
}
.cr-ps-phase--short { background: rgba(139,37,0,0.2); color: rgba(220,140,100,0.9); }
.cr-ps-phase--mid   { background: rgba(139,105,20,0.2); color: rgba(200,170,90,0.9); }
.cr-ps-goal { display: block; font-size: 11px; color: rgba(200,185,165,0.8); line-height: 1.55; }
.cr-ps-tasks { list-style: none; padding: 0; margin: 0 0 10px; display: flex; flex-direction: column; gap: 6px; }
.cr-ps-task { display: flex; align-items: flex-start; gap: 6px; font-size: 11px; color: rgba(170,155,135,0.75); line-height: 1.5; }
.cr-ps-check { flex-shrink: 0; color: rgba(139,37,0,0.7); margin-top: 2px; }
.cr-ps-milestone {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: rgba(180,150,90,0.7);
  padding-top: 8px; border-top: 1px solid rgba(196,185,166,0.1);
  letter-spacing: 0.04em;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .cr-body { grid-template-columns: 1fr; }
  .cr-detail-panel { max-height: 260px; border-top: 1px solid rgba(196,185,166,0.1); }
}

/* ── 打印样式 ── */
@media print {
  .cr-back, .cr-export-btn, .cr-plan-btn, .cr-plan-export { display: none !important; }
  .cr-page { height: auto; background: #fff; color: #000; }
  .cr-plan-section { max-height: none !important; }
}
</style>
