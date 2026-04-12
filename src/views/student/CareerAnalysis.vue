<!-- 页面：职业分析 · 羊皮卷舆图；路由：student/career-analysis；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores'
import { useLearningStore } from '@/stores/learning'
import { gsap } from '@/plugins/gsap'
import { useCareerInsights, roleOptions, CAREER_DOMAINS, type CareerRole } from '@/composables/useCareerInsights'
import * as d3 from 'd3'
import VChart from 'vue-echarts'
import { use, registerMap, graphic } from 'echarts/core'
import { BarChart, LineChart, MapChart, BoxplotChart, GraphChart, CustomChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TooltipComponent, GridComponent, GeoComponent, VisualMapComponent, DataZoomComponent, MarkPointComponent, GraphicComponent } from 'echarts/components'
import chinaJson from '@/assets/china.json'
import worldJson from '@/assets/world.json'
import parchmentBaseUrl from '@/assets/textures/parchment-base.jpg'
const parchmentBgUrl = `url("${parchmentBaseUrl}")`

use([BarChart, LineChart, MapChart, BoxplotChart, GraphChart, CustomChart, CanvasRenderer,
  TooltipComponent, GridComponent, GeoComponent, VisualMapComponent, DataZoomComponent, MarkPointComponent, GraphicComponent])
registerMap('china', chinaJson as any)
registerMap('world', worldJson as any)

/* ═══ 现代冷中性配色 (与 theme.css 统一) ═══ */
const C = {
  bg: '#F5F5F3',
  panel: '#EDEDEB',
  panelBorder: '#E3E3E0',
  zhusha: '#BB3418',
  zhushaLight: '#C85A3A',
  gold: '#C4961E',
  accent: '#3A6EAE',
  green: '#4A9058',
  textPrimary: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  parchment: '#F5F5F3',
  parchmentDark: '#CBCBC8',
  mapBorder: 'rgba(192,52,24,0.22)',
}

/* ═══ 省份简称映射 ═══ */
function shortName(name: string): string {
  return name
    .replace(/壮族|回族|维吾尔/g, '')
    .replace(/(自治区|特别行政区|省|市)$/g, '')
}

/* ═══ 确定性随机工具 ═══ */
function strHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}
function seededRng(seed: number): () => number {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
}

/* ═══ 省份模拟数据（按岗位名确定性生成） ═══ */
const ALL_PROVINCES = [
  '北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省',
  '吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省',
  '福建省','江西省','山东省','河南省','湖北省','湖南省',
  '广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省',
  '云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区',
  '新疆维吾尔自治区','台湾省','香港特别行政区','澳门特别行政区',
]
// 主要科技城市的基准需求系数
const HUB_FACTOR: Record<string, number> = {
  '北京市': 1.0, '上海市': 0.95, '广东省': 0.98, '浙江省': 0.85,
  '江苏省': 0.80, '四川省': 0.68, '湖北省': 0.62, '重庆市': 0.55,
  '福建省': 0.56, '山东省': 0.58, '天津市': 0.50, '辽宁省': 0.46,
  '陕西省': 0.50, '香港特别行政区': 0.72, '台湾省': 0.42,
}

type ProvinceItem = { name: string; value: number; salary: number }
function getProvinceData(role: string): ProvinceItem[] {
  const rng = seededRng(strHash(role))
  return ALL_PROVINCES.map(name => {
    const hub = HUB_FACTOR[name] ?? (0.12 + rng() * 0.22)
    const value = Math.min(100, Math.max(5, Math.round((hub * 75 + rng() * 30) * (0.8 + rng() * 0.4))))
    const salary = Math.min(28, Math.max(5, +((hub * 14 + rng() * 8) * (0.7 + rng() * 0.6)).toFixed(1)))
    return { name, value, salary }
  })
}

/* 为省份对标图生成箱形数据 */
function getProvinceBox(provinceName: string, data: ProvinceItem[]): { box: number[]; demand: number } {
  const p = data.find(d => d.name === provinceName)
  const med = p?.salary ?? 12
  const demand = p?.value ?? 50
  const rng = seededRng(strHash('box_' + provinceName))
  const spread = 2.5 + rng() * 3
  return {
    box: [
      +(med - spread * 1.4 - rng() * 0.5).toFixed(1),
      +(med - spread * 0.5).toFixed(1),
      +med.toFixed(1),
      +(med + spread * 0.7).toFixed(1),
      +(med + spread * 1.6 + rng() * 0.5).toFixed(1),
    ],
    demand,
  }
}

// 为每个岗位生成确定性薪资数据
function getJobSalaryData(jobName: string) {
  const rng = seededRng(strHash('salary_' + jobName))
  const junior = Math.round(6 + rng() * 10)
  const mid = junior + Math.round(5 + rng() * 10)
  const senior = mid + Math.round(8 + rng() * 15)
  return { name: jobName, junior, mid, senior }
}

/* ═══ AI 评价模拟数据 ═══ */
function getAiComments(_province: string, _role: string) {
  return [
    { title: '整体趋势', content: `${_province}的${_role}岗位需求在近两年呈稳步上升趋势，薪资中位数高于全国平均水平。该地区互联网产业集群效应明显，头部企业集中，带动了整体薪资水平的提升。` },
    { title: '供需分析', content: `当前${_province}${_role}人才供给缺口约15%，尤其是3-5年经验的中高级岗位竞争激烈。建议关注新兴产业园区的招聘动态，这些区域通常提供更有竞争力的薪酬包。` },
    { title: '薪资建议', content: `基于当前市场数据，${_role}在${_province}的合理薪资预期为：初级 8-12K，中级 15-22K，高级 25-40K。核心技术栈熟练度和项目经验是薪资谈判的关键因素。` },
    { title: '发展前景', content: `${_province}已将数字经济列为重点发展方向，预计未来2-3年${_role}相关岗位将持续增长。建议提前布局云原生、AI辅助开发等新兴技能方向，以获得更大的职业发展空间。` },
  ]
}

/* ═══ KPI tooltip 详情数据 ═══ */
const kpiSalaryDetails = {
  method: '基于全国34省份主流招聘平台公开薪资数据，取中位数加权计算',
  updateDate: '2026-03-15',
  samples: [
    { company: '字节跳动', salary: '18-25K', city: '北京' },
    { company: '腾讯', salary: '16-22K', city: '深圳' },
    { company: '阿里巴巴', salary: '17-24K', city: '杭州' },
    { company: '美团', salary: '15-20K', city: '北京' },
  ],
}
const kpiDemandDetails = {
  method: '汇总主流招聘平台（Boss直聘、拉勾、猎聘）在线岗位数',
  updateDate: '2026-03-15',
  platforms: [
    { name: 'Boss直聘', count: 5230 },
    { name: '拉勾网', count: 3850 },
    { name: '猎聘', count: 3500 },
  ],
}

/* ═══ 核心状态 ═══ */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const learningStore = useLearningStore()

const followableRole = computed<CareerRole | null>(() => {
  const normalizedRole = normalizeRouteRole(currentAnalysisLabel.value)
  return roleOptions.includes(normalizedRole as CareerRole) ? normalizedRole as CareerRole : null
})
const isCurrentRoleFollowed = computed(() => followableRole.value ? learningStore.isTargetRole(followableRole.value) : false)

function toggleFollowRole() {
  if (!followableRole.value) return
  learningStore.toggleTargetRole(followableRole.value)
}

function goToNavigation() {
  router.push('/app/student/career-navigation')
}

/* ═══ CTA 自动隐藏（3 秒后收起） ═══ */
const ctaVisible = ref(true)
let _ctaTimer: ReturnType<typeof setTimeout> | null = null
function resetCtaTimer() {
  if (_ctaTimer) clearTimeout(_ctaTimer)
  ctaVisible.value = true
  _ctaTimer = setTimeout(() => { ctaVisible.value = false }, 3000)
}

const pageRef = ref<HTMLElement | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const roleSearch = ref('前端开发')
const selectedProvince = ref<string | null>(null)
const scrollRevealed = ref(false)
const showSalaryTip = ref(false)
const showDemandTip = ref(false)
let gsapCtx: ReturnType<typeof gsap.context> | null = null

const { targetRole } = useCareerInsights()

function normalizeRouteRole(roleParam: unknown): string {
  if (typeof roleParam !== 'string') return ''
  if (roleOptions.includes(roleParam as CareerRole)) return roleParam
  const text = roleParam.toLowerCase()
  if (/机器学习|深度学习|算法|pytorch|tensorflow|ml/.test(text)) return '机器学习工程师'
  if (/数据|分析|sql|bi|etl|python|增长/.test(text)) return '数据分析'
  if (/测试|qa|playwright|selenium|自动化/.test(text)) return '测试开发'
  if (/java|go|golang|c\+\+|后端|服务端|微服务|redis|mysql/.test(text)) return '后端开发'
  if (/前端|vue|react|web|可视化/.test(text)) return '前端开发'
  return roleParam
}

function applyRouteRole(roleParam: unknown) {
  const normalizedRole = normalizeRouteRole(roleParam)
  if (!normalizedRole) {
    roleSearch.value = '前端开发'
    _baseProvinceData.value = getProvinceData('前端开发')
    selectedJob.value = null
    selectedProvince.value = null
    aiCommentPage.value = 0
    targetRole.value = '前端开发' as CareerRole
    return
  }
  const displayRole = typeof roleParam === 'string' && roleParam.trim() ? roleParam.trim() : normalizedRole
  roleSearch.value = displayRole
  _baseProvinceData.value = getProvinceData(displayRole)
  selectedJob.value = null
  selectedProvince.value = null
  aiCommentPage.value = 0
  if (roleOptions.includes(normalizedRole as CareerRole)) {
    targetRole.value = normalizedRole as CareerRole
  }
}


/* ═══ #4 AI评价翻页 ═══ */
const aiCommentPage = ref(0)
const aiComments = computed(() => {
  if (!selectedProvince.value) return []
  return getAiComments(selectedProvince.value, roleSearch.value)
})
const currentAiComment = computed(() => aiComments.value[aiCommentPage.value] || null)

const _baseProvinceData = ref(getProvinceData(roleSearch.value))
const provinceData = computed(() => _baseProvinceData.value)

type CompareColumns = {
  role: string
  topProvince: ProvinceItem
  nationalAvg: number
  isTopSameAsCur: boolean
  boxes: number[][]
}

type CompareColumnsApiResponse = {
  topProvinceName: string
  nationalAvgSalary: number
  salaryBoxes: number[][]
}

function buildCompareColumnsFromMock(role: string, currentProvince: string, data: ProvinceItem[]): CompareColumns {
  const sorted = [...data].sort((a, b) => b.salary - a.salary)
  const topProvince = sorted[0]!
  const nationalAvg = +(data.reduce((s, d) => s + d.salary, 0) / data.length).toFixed(1)
  const avgData: ProvinceItem = {
    name: '全国均值',
    value: Math.round(data.reduce((s, d) => s + d.value, 0) / data.length),
    salary: nationalAvg,
  }

  const colTop = getProvinceBox(topProvince.name, data)
  const colAvg = getProvinceBox('全国均值', [...data, avgData])
  const isTopSameAsCur = topProvince.name === currentProvince
  const colCur = isTopSameAsCur ? colTop : getProvinceBox(currentProvince, data)

  return {
    role,
    topProvince,
    nationalAvg,
    isTopSameAsCur,
    boxes: [colTop.box, colAvg.box, colCur.box] as number[][],
  }
}

async function fetchCompareColumns(role: string, currentProvince: string, data: ProvinceItem[]): Promise<CompareColumns> {
  // 预留接口：接入后仅替换此函数
  // const resp = await api.get<CompareColumnsApiResponse>('/career/compare', { params: { role, province: currentProvince } })
  // return mapCompareColumnsResponse(role, currentProvince, data, resp.data)
  return Promise.resolve(buildCompareColumnsFromMock(role, currentProvince, data))
}

function mapCompareColumnsResponse(
  role: string,
  currentProvince: string,
  data: ProvinceItem[],
  payload: CompareColumnsApiResponse,
): CompareColumns {
  const fallback = buildCompareColumnsFromMock(role, currentProvince, data)
  const topProvince = data.find(p => p.name === payload.topProvinceName) ?? fallback.topProvince
  const isTopSameAsCur = topProvince.name === currentProvince
  return {
    role,
    topProvince,
    nationalAvg: payload.nationalAvgSalary ?? fallback.nationalAvg,
    isTopSameAsCur,
    boxes: payload.salaryBoxes?.length === 3 ? payload.salaryBoxes : fallback.boxes,
  }
}

const compareColumnsState = ref<CompareColumns | null>(null)

async function refreshCompareColumns() {
  const data = provinceData.value
  if (!data.length || !selectedProvince.value) {
    compareColumnsState.value = null
    return
  }
  compareColumnsState.value = await fetchCompareColumns(roleSearch.value, selectedProvince.value, data)
}

/* ═══ KPI 数据 ═══ */
const nationalKpi = computed(() => {
  const data = provinceData.value
  const avgSalary = data.length ? +(data.reduce((s, d) => s + d.salary, 0) / data.length).toFixed(1) : 0
  const demandTotal = data.reduce((s, d) => s + d.value, 0) * 100
  const rng = seededRng(strHash('growth_' + roleSearch.value))
  const growthPct = +(8 + rng() * 12).toFixed(1)
  return {
    avgSalary,
    demandTotal,
    growthRate: `+${growthPct}%`,
  }
})

/* ═══ #9 省份需求排行 Top10 ═══ */
const provinceRanking = computed(() => {
  const sorted = [...provinceData.value].sort((a, b) => b.value - a.value)
  return sorted.slice(0, 10).map((p, i) => ({
    ...p, rank: i + 1,
    shortName: p.name.replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔)/g, ''),
    displayValue: p.value,
    barPercent: p.value,
  }))
})

/* ═══ 地图配置 — 羊皮卷风格 ═══ */
const vchartRef = ref<any>(null)
const searchFocused = ref(false)
const mapInitOptions = { devicePixelRatio: Math.min(2, window.devicePixelRatio || 1) }
const mapUpdateOptions = { notMerge: true, lazyUpdate: false }
const hiddenRegions = [
  { name: '南海诸岛', itemStyle: { opacity: 0, borderWidth: 0, borderColor: 'transparent' }, label: { show: false } },
  { name: '香港特别行政区', itemStyle: { opacity: 0, borderWidth: 0, borderColor: 'transparent' }, label: { show: false } },
  { name: '澳门特别行政区', itemStyle: { opacity: 0, borderWidth: 0, borderColor: 'transparent' }, label: { show: false } }
]

const activeLevel = ref<number | null>(null)
function highlightMapLevel(level: number) {
  if (activeLevel.value === level) {
    activeLevel.value = null // toggle off
  } else {
    activeLevel.value = level
  }
}

/* ═══ 省份对标图（全国最高 / 全国均值 / 当前选中省） ═══ */
const compareOption = computed(() => {
  const compareColumns = compareColumnsState.value
  if (!compareColumns || !selectedProvince.value) return {}

  const topProvince = compareColumns.topProvince
  const curName = shortName(selectedProvince.value)
  const boxes = compareColumns.boxes
  const meds = boxes.map(box => box?.[2] ?? 0)

  const delta = +((meds[2] ?? 0) - (meds[1] ?? 0)).toFixed(1)
  const deltaSign = delta >= 0 ? '+' : ''
  const deltaColor = delta >= 0 ? C.green : C.zhusha
  const deltaArrow = delta >= 0 ? '▲' : '▼'

  const topShortName = shortName(topProvince.name)
  const labels = [topShortName, '全国均', curName]

  /* 中位值标注（markPoint 用 coord 坐标，category 字符串匹配） */
  const medColors = [C.gold, C.textMuted, C.zhusha] as const
  const markPointData = [0, 1, 2].map(idx => ({
    coord: [labels[idx], meds[idx] ?? 0] as [string, number],
    symbol: 'diamond',
    symbolSize: idx === 2 ? 13 : 9,
    itemStyle: {
      color: medColors[idx],
      borderColor: 'rgba(255,255,255,0.9)',
      borderWidth: 1.5,
      shadowBlur: idx === 2 ? 10 : 3,
      shadowColor: idx === 2 ? 'rgba(187,52,24,0.45)' : 'rgba(62,48,32,0.15)',
    },
    label: {
      show: true,
      formatter: `${meds[idx] ?? 0}K`,
      position: 'top' as const,
      fontSize: idx === 2 ? 11 : 10,
      fontFamily: 'KaiTi, serif',
      color: medColors[idx],
      fontWeight: idx === 2 ? ('bold' as const) : ('normal' as const),
      offset: [0, -6] as [number, number],
    },
  }))

  /* 箱形每列配置 */
  const boxColors = [
    { fill: 'rgba(196,150,30,0.13)', border: C.gold, width: 1.5 },
    { fill: 'rgba(107,93,79,0.07)', border: 'rgba(107,93,79,0.45)', width: 1.2 },
    { fill: 'rgba(187,52,24,0.17)', border: C.zhusha, width: 2.5 },
  ]
  const boxSeriesData = boxes.map((box, idx) => ({
    value: box,
    itemStyle: {
      color: boxColors[idx]?.fill ?? 'rgba(180,155,110,0.1)',
      borderColor: boxColors[idx]?.border ?? C.gold,
      borderWidth: boxColors[idx]?.width ?? 1.5,
    },
  }))

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDurationUpdate: 400,

    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.97)',
      borderColor: C.panelBorder,
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: C.textPrimary, fontSize: 11 },
      extraCssText: 'border-radius:6px; box-shadow: 0 4px 16px rgba(62,48,32,0.14);',
      formatter: (params: any) => {
        const idx = (params.dataIndex as number) ?? 0
        const roles = ['全国最高', '全国均值', '当前省']
        const names = [topShortName, '全国', curName]
        const boxArr = boxes[idx] ?? []
        const ac = medColors[idx] ?? C.textPrimary
        return `<div style="font-weight:700;color:${ac};font-size:13px;margin-bottom:5px;border-bottom:1px solid ${C.panelBorder};padding-bottom:4px">`
          + `${names[idx]} <span style="font-size:10px;font-weight:400;opacity:.7">${roles[idx]}</span></div>`
          + `<table style="border-collapse:collapse;line-height:1.7">`
          + `<tr><td style="color:${C.textMuted};padding-right:12px">最高薪资</td><td style="font-variant-numeric:tabular-nums;font-weight:600">${boxArr[4]}K</td></tr>`
          + `<tr><td style="color:${C.textMuted}">Q3 (75%)</td><td style="font-variant-numeric:tabular-nums">${boxArr[3]}K</td></tr>`
          + `<tr><td style="color:${ac};font-weight:700">中位薪资</td><td style="font-variant-numeric:tabular-nums;font-weight:700;color:${ac}">${boxArr[2]}K</td></tr>`
          + `<tr><td style="color:${C.textMuted}">Q1 (25%)</td><td style="font-variant-numeric:tabular-nums">${boxArr[1]}K</td></tr>`
          + `<tr><td style="color:${C.textMuted}">最低薪资</td><td style="font-variant-numeric:tabular-nums;font-weight:600">${boxArr[0]}K</td></tr>`
          + `</table>`
      },
    },

    graphic: [{
      type: 'text',
      top: 6, left: 8,
      z: 8,
      style: {
        text: `${deltaArrow} ${deltaSign}${delta}K vs 全国均`,
        fill: deltaColor,
        fontSize: 11,
        fontFamily: 'KaiTi, serif',
        fontWeight: 'bold',
      },
    }],

    legend: {
      data: ['薪资分布'],
      top: 4, right: 4,
      textStyle: { color: C.textSecondary, fontSize: 10 },
      icon: 'roundRect', itemWidth: 8, itemHeight: 5,
    },

    grid: { top: 28, left: '10%', right: '10%', bottom: 32 },

    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: C.panelBorder } },
      axisLabel: {
        fontSize: 11,
        formatter: (val: string) => val === curName ? `{cur|● ${val}}` : `{other|${val}}`,
        rich: {
          cur: { color: C.zhusha, fontWeight: 'bold' as const, fontSize: 12 },
          other: { color: C.textSecondary, fontSize: 11 },
        },
      },
    },

    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: C.textMuted, fontSize: 9, formatter: (v: number) => v + 'K' },
      splitLine: { lineStyle: { type: [4, 4] as any, color: 'rgba(139,37,0,0.07)' } },
    },

    series: [
      {
        name: '薪资分布',
        type: 'boxplot',
        data: boxSeriesData,
        boxWidth: ['38%', '62%'],
        markPoint: {
          symbolKeepAspect: true,
          data: markPointData,
          tooltip: { show: false },
        },
      },
    ],
  }
})

watch([provinceData, selectedProvince, roleSearch], () => {
  void refreshCompareColumns()
}, { immediate: true })

// Update mapOption to reflect highlighting — 内凹嵌入效果
const mapOption = computed<any>(() => {
  const provinceSelectable = hasSelectedJob.value
  /* activeLevel 筛选 regions — 同色系低调处理 */
  const chinaRegions = activeLevel.value === null
    ? hiddenRegions
    : [
      ...hiddenRegions,
      ...provinceData.value.map(p => {
        const level = p.value <= 20 ? 1 : p.value <= 40 ? 2 : p.value <= 60 ? 3 : 4
        const match = level === activeLevel.value
        return match
          ? {
            name: p.name,
            itemStyle: {
              areaColor: 'rgba(166,124,82,0.45)',
              borderColor: 'rgba(120,90,50,0.6)',
              borderWidth: 1.5,
            },
            label: { show: true, color: '#5A3E1B', fontWeight: 'bold', fontSize: 14,
              formatter: (p: any) => shortName(p.name || '') },
          }
          : {
            name: p.name,
            itemStyle: {
              areaColor: 'rgba(210,180,140,0.1)',
              borderColor: 'rgba(180,160,130,0.2)',
              borderWidth: 0.4,
            },
            label: { show: false },
          }
      }),
    ]

  const data = provinceData.value.map(p => ({ ...p }))
  const selectedProvinceRegion = selectedProvince.value
    ? {
        name: selectedProvince.value,
        itemStyle: {
          areaColor: 'rgba(155,100,50,0.85)',
          borderColor: 'rgba(90,45,5,0.95)',
          borderWidth: 2,
        },
        label: {
          show: true,
          color: '#2A1A08',
          fontWeight: 'bold' as const,
          fontSize: 16,
          formatter: (p: any) => shortName(p.name || ''),
        },
      }
    : null

  /* 世界底图中隐藏 China（由上层中国地图覆盖） */
  const worldLabelStyle = { show: true, color: 'rgba(120,100,70,0.55)', fontSize: 9, fontFamily: 'var(--font-title), serif', fontStyle: 'italic' as const }
  const worldHiddenRegions = [
    { name: 'China', itemStyle: { areaColor: 'transparent', borderWidth: 0, borderColor: 'transparent' }, label: { show: false } },
    { name: 'Russia', label: worldLabelStyle },
    { name: 'Mongolia', label: worldLabelStyle },
    { name: 'Japan', label: worldLabelStyle },
    { name: 'South Korea', label: worldLabelStyle },
    { name: 'North Korea', label: worldLabelStyle },
    { name: 'Vietnam', label: worldLabelStyle },
    { name: 'Laos', label: worldLabelStyle },
    { name: 'Myanmar', label: worldLabelStyle },
    { name: 'Thailand', label: worldLabelStyle },
    { name: 'Cambodia', label: worldLabelStyle },
    { name: 'Philippines', label: worldLabelStyle },
    { name: 'India', label: worldLabelStyle },
    { name: 'Nepal', label: worldLabelStyle },
    { name: 'Bangladesh', label: worldLabelStyle },
    { name: 'Pakistan', label: worldLabelStyle },
    { name: 'Afghanistan', label: worldLabelStyle },
    { name: 'Kazakhstan', label: worldLabelStyle },
    { name: 'Kyrgyzstan', label: worldLabelStyle },
    { name: 'Tajikistan', label: worldLabelStyle },
    { name: 'Indonesia', label: worldLabelStyle },
    { name: 'Malaysia', label: worldLabelStyle },
  ]

  // ✅ 公共定位配置：所有 geo 统一使用相同基线，避免错位
  const commonGeo = {
    boundingCoords: [[-180, 90], [180, -90]], // ✅ 强制4层geo使用全球范围作为zoom=1基线
    center: (vchartRef.value?.getOption?.()?.geo?.[0]?.center as number[]) ?? [104, 35],
    zoom: (vchartRef.value?.getOption?.()?.geo?.[0]?.zoom as number) ?? 4.5,
    roam: false,
    scaleLimit: { min: 1.0, max: 10 },
  }

  return {
    backgroundColor: 'transparent',
    animation: false,
    hoverLayerThreshold: Infinity,
    tooltip: {
      show: provinceSelectable,
      trigger: 'item', confine: true, transitionDuration: 0, showDelay: 60,
      backgroundColor: 'rgba(62,48,32,0.92)',
      borderColor: '#8B6914',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#F0E6D2', fontFamily: 'var(--font-title), KaiTi, serif', fontSize: 14 },
      extraCssText: 'border-radius:6px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);',
      formatter: (params: any) => {
        if (!params.name) return ''
        return `<div style="font-weight:700;margin-bottom:6px;color:#8B6914;font-size:15px;border-bottom:1px solid rgba(139,105,20,0.3);padding-bottom:4px">${params.name}</div><span style="color:#8B7A5E">岗位需求指数:</span> <b style="color:#6B4E14;font-size:16px">${params.value ?? '-'}</b>`
      }
    },
    visualMap: {
      left: 16, bottom: 48, min: 0, max: 100,
      text: ['高需求', '低需求'], calculable: true, show: true,
      inRange: { color: ['#e0d4be', '#d4b896', '#c49a6c', '#b07840', '#8B5E14', '#6B3A0A'] },
      textStyle: { color: '#3E3020', fontFamily: 'var(--font-title), KaiTi, serif', fontSize: 11, fontWeight: 'bold' },
      itemWidth: 12, itemHeight: 80,
      backgroundColor: 'rgba(245,245,243,0.85)',
      padding: [8, 10],
      borderColor: 'rgba(139,105,20,0.3)',
      borderWidth: 1,
      borderRadius: 8,
    },
    geo: [
      // geo[0]: 世界底图 — 静默，无 shadowBlur，仅填色+边框
      {
        ...commonGeo,
        map: 'world', zlevel: 0, silent: true,
        label: { show: false },
        itemStyle: {
          areaColor: 'rgba(212,201,181,0.18)',
          borderColor: 'rgba(120,100,70,0.3)', borderWidth: 0.6,
        },
        emphasis: { disabled: true },
        regions: worldHiddenRegions,
      },
      // geo[1]: 中国主交互层 — 无 shadowBlur，hover/select 用 areaColor+border 区分
      {
        ...commonGeo,
        map: 'china', zlevel: 1,
        silent: !provinceSelectable,
        itemStyle: {
          areaColor: 'rgba(210,185,145,0.6)',
          borderColor: 'rgba(139,105,20,0.55)', borderWidth: 1.2,
        },
        label: {
          show: true, color: 'rgba(62,48,32,0.75)', fontSize: 14,
          fontFamily: 'var(--font-title), KaiTi, serif', fontWeight: 500,
          formatter: (p: any) => shortName(p.name || ''),
        },
        emphasis: {
          itemStyle: {
            areaColor: 'rgba(176,120,64,0.8)',
            borderColor: 'rgba(107,58,10,0.9)', borderWidth: 2,
          },
          label: { show: true, color: '#2A1A08', fontSize: 16, fontWeight: 'bold',
            fontFamily: 'var(--font-title), KaiTi, serif',
            formatter: (p: any) => shortName(p.name || '') },
        },
        select: {
          itemStyle: {
            areaColor: 'rgba(155,100,50,0.85)',
            borderColor: 'rgba(90,45,5,0.95)', borderWidth: 2,
          },
          label: { show: true, color: '#2A1A08', fontWeight: 'bold', fontSize: 16,
            formatter: (p: any) => shortName(p.name || '') },
        },
        regions: selectedProvinceRegion ? [...chinaRegions, selectedProvinceRegion] : chinaRegions,
      },
    ],
    series: [{
      name: '需求量', type: 'map', geoIndex: 1,
      data: data, selectedMode: provinceSelectable ? 'single' : false, silent: !provinceSelectable, animation: true, animationDurationUpdate: 300
    }],
  }
})

/* ═══ 事件处理 ═══ */
function handleMapClick(params: any) {
  if (!params.name || !hasSelectedJob.value) return
  selectedProvince.value = params.name
  aiCommentPage.value = 0
}

function selectRankedProvince(name: string) {
  if (!hasSelectedJob.value) return
  selectedProvince.value = name
  aiCommentPage.value = 0
}

function doSearch() {
  const nextRole = roleSearch.value.trim() || '前端开发'
  roleSearch.value = nextRole
  _baseProvinceData.value = getProvinceData(nextRole)
  const normalizedRole = normalizeRouteRole(nextRole)
  if (roleOptions.includes(normalizedRole as CareerRole)) {
    targetRole.value = normalizedRole as CareerRole
  }
  selectedProvince.value = null
  aiCommentPage.value = 0
}

function handleSearchSubmit() {
  const q = roleSearch.value.trim()
  if (!q) return
  // 尝试精确 / 模糊匹配气泡内的岗位
  const exact = _flatJobs.find(j => j.jobName === q)
  const fuzzy = !exact ? _flatJobs.find(j => j.jobName.includes(q) || q.includes(j.jobName)) : null
  const matched = exact || fuzzy
  if (matched) {
    selectedJob.value = { id: matched.domainId, name: matched.domainName, domainColor: matched.domainColor, jobName: matched.jobName }
    roleSearch.value = matched.jobName
  } else {
    selectedJob.value = null
    roleSearch.value = q
  }
  doSearch()
}

function prevAiPage() { if (aiCommentPage.value > 0) aiCommentPage.value-- }
function nextAiPage() { if (aiCommentPage.value < aiComments.value.length - 1) aiCommentPage.value++ }

/* ═══ AI Drawer 对话 ═══ */
interface DrawerMsg { role: 'user' | 'assistant'; content: string; time: string }
const showAiDrawer = ref(false)
const aiDrawerInput = ref('')
const aiDrawerLoading = ref(false)
const aiDrawerMessages = ref<DrawerMsg[]>([])
const aiDrawerScrollRef = ref<HTMLDivElement>()

function _getDrawerTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16)
}
function _scrollDrawer() {
  nextTick(() => {
    if (aiDrawerScrollRef.value) aiDrawerScrollRef.value.scrollTop = aiDrawerScrollRef.value.scrollHeight
  })
}

function openAiDrawer() {
  if (aiDrawerMessages.value.length === 0) {
    const job = selectedJob.value?.jobName ?? roleSearch.value
    const prov = selectedProvince.value ?? '全国'
    aiDrawerMessages.value.push({
      role: 'assistant',
      content: `你好！当前分析岗位：${job}，目标省份：${prov}。\n你可以问我关于这个岗位的前景、薪资趋势、技能要求等问题，我会给你可执行的建议。`,
      time: _getDrawerTimestamp(),
    })
  }
  showAiDrawer.value = true
  _scrollDrawer()
}

const aiDrawerQuickPrompts = [
  '这个岗位未来两年前景如何？',
  '薪资还有多少上涨空间？',
  '我需要掌握哪些核心技能？',
]

async function sendAiDrawerMsg(text?: string) {
  const content = (text ?? aiDrawerInput.value).trim()
  if (!content || aiDrawerLoading.value) return
  aiDrawerInput.value = ''
  const job = selectedJob.value?.jobName ?? roleSearch.value
  const prov = selectedProvince.value ?? '全国'
  aiDrawerMessages.value.push({ role: 'user', content, time: _getDrawerTimestamp() })
  _scrollDrawer()
  aiDrawerLoading.value = true
  await new Promise(r => setTimeout(r, 800))
  const reply = learningStore.getAIResponse(`[岗位:${job}][省份:${prov}] ${content}`)
  aiDrawerMessages.value.push({ role: 'assistant', content: reply, time: _getDrawerTimestamp() })
  aiDrawerLoading.value = false
  _scrollDrawer()
}

function goToCareerCenter() {
  router.push({ name: 'career-ability', query: { role: roleSearch.value } })
}

const goBack = () => router.push({ name: 'student-career' })

/* ═══ GSAP 动画 ═══ */
function animateKpiNumbers() {
  if (!pageRef.value) return
  const nums = pageRef.value.querySelectorAll('.kpi-num')
  nums.forEach(el => {
    gsap.fromTo(el, { opacity: 0.3, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'transform,opacity' })
  })
}

function setupEntranceAnimation() {
  if (!pageRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    scrollRevealed.value = true
    return
  }

  gsapCtx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } })

    tl.fromTo('.da-header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3 })
      .fromTo('.da-left', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.35 }, '<0.1')
      .fromTo('.da-right', { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35 }, '<0.15')

    // Scroll unroll animation (left to right)
    const scrollEl = scrollRef.value
    if (scrollEl) {
      tl.fromTo(scrollEl,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power2.inOut',
          onComplete: () => { scrollRevealed.value = true } },
        '<0.2')
    } else {
      scrollRevealed.value = true
    }

    // KPI cards stagger
    gsap.from('.kpi-card', { opacity: 0, y: 10, stagger: 0.06, duration: 0.25, ease: 'power2.out', delay: 0.35, clearProps: 'transform,opacity' })

    // Ranking items stagger
    gsap.from('.rank-item', { opacity: 0, x: -10, stagger: 0.03, duration: 0.2, ease: 'power2.out', delay: 0.5, clearProps: 'transform,opacity' })

    setTimeout(() => animateKpiNumbers(), 600)
  }, pageRef.value)
}

watch(selectedProvince, (val) => {
  if (!val || !pageRef.value) return
  // 统一过渡节奏：对标图 → AI 洞察 → 操作区依次淡入
  const sections = pageRef.value.querySelectorAll('.da-right-content > .da-section')
  if (sections.length) {
    gsap.killTweensOf(sections)
    gsap.fromTo(sections,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.25, stagger: 0.06, ease: 'power2.out', clearProps: 'transform,opacity' }
    )
  }
  // 薪资图轻量淡入
  const salaryChart = pageRef.value.querySelector('.da-salary-chart')
  if (salaryChart) {
    gsap.killTweensOf(salaryChart)
    gsap.fromTo(salaryChart,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity' }
    )
  }
})

/* ═══ 气泡图数据（基于 CAREER_DOMAINS 5×3=15 岗位）═══ */

interface FlatJob { domainIdx: number; jobIdx: number; domainId: string; domainName: string; domainColor: string; jobName: string }
const _flatJobs: FlatJob[] = CAREER_DOMAINS.flatMap((domain, di) =>
  domain.jobs.map((jobName, ji) => ({ domainIdx: di, jobIdx: ji, domainId: domain.id, domainName: domain.name, domainColor: domain.color, jobName })),
)

const selectedJob = ref<{ id: string; name: string; domainColor: string; jobName?: string } | null>(null)
const hasSelectedJob = computed(() => Boolean(selectedJob.value?.jobName))
const hasSelectedProvince = computed(() => Boolean(selectedProvince.value))
const analysisStage = computed<'job-pending' | 'province-pending' | 'insight-ready'>(() => {
  if (!hasSelectedJob.value) return 'job-pending'
  if (!hasSelectedProvince.value) return 'province-pending'
  return 'insight-ready'
})
const currentAnalysisLabel = computed(() => selectedJob.value?.jobName ?? roleSearch.value ?? '前端开发')
const selectedJobLabel = computed(() => selectedJob.value?.jobName ?? '未选择岗位')
const selectedJobDomainLabel = computed(() => selectedJob.value?.name ?? '岗位方向')
const selectedProvinceLabel = computed(() => selectedProvince.value ?? '未选择省份')
const rankModeLabel = computed(() => hasSelectedJob.value ? '需求指数' : '待选岗位')

// CTA 自动隐藏：关注列表或阶段变化时重置计时
watch(
  [analysisStage, () => learningStore.targetRoles.length],
  ([stage, len]) => { if (stage === 'insight-ready' && len > 0) resetCtaTimer() },
  { immediate: true },
)

/* ═══ D3 气泡图（双层嵌套 simulation）═══ */
const bubbleSvgRef = ref<SVGSVGElement | null>(null)
let _outerSim: d3.Simulation<any, undefined> | null = null
let _innerSims: d3.Simulation<any, undefined>[] = []
let _bubbleRo: ResizeObserver | null = null

// ── 节点类型 ──
interface DomainNode extends d3.SimulationNodeDatum {
  id: string; name: string; color: string; r: number; domainIdx: number
  _phaseX?: number; _phaseY?: number
}
interface JobNode extends d3.SimulationNodeDatum {
  id: string; jobName: string; domainId: string; domainName: string
  domainColor: string; r: number; domainIdx: number; jobIdx: number
  _phaseX?: number; _phaseY?: number
}

function stopAllSimulations() {
  if (_outerSim) { _outerSim.stop(); _outerSim = null }
  _innerSims.forEach(s => s.stop()); _innerSims = []
}

function initBubbleChart() {
  const svg = bubbleSvgRef.value
  if (!svg) return
  stopAllSimulations()
  const el = d3.select(svg)
  el.selectAll('*').remove()

  const W = svg.clientWidth || 500
  const H = svg.clientHeight || 300
  const scale = Math.min(W, H)
  const JOB_R = Math.min(32, Math.max(20, scale / 13))
  const DOMAIN_R = JOB_R * 2.6 + 4
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

  // ── defs ──
  const defs = el.append('defs')

  // SVG filter — 墨点晕染边缘（feTurbulence 毛糙 + 模糊扩散）
  const fInk = defs.append('filter').attr('id', 'f-ink-bleed')
    .attr('x', '-18%').attr('y', '-18%').attr('width', '136%').attr('height', '136%')
  fInk.append('feTurbulence')
    .attr('type', 'fractalNoise').attr('baseFrequency', 0.045)
    .attr('numOctaves', 3).attr('seed', 7).attr('result', 'noise')
  fInk.append('feDisplacementMap')
    .attr('in', 'SourceGraphic').attr('in2', 'noise').attr('scale', 3).attr('result', 'displaced')
  fInk.append('feGaussianBlur')
    .attr('in', 'displaced').attr('stdDeviation', 0.6)

  // SVG filter — 选中态（域色外发光）
  const fSel = defs.append('filter').attr('id', 'f-ink-sel')
    .attr('x', '-35%').attr('y', '-35%').attr('width', '170%').attr('height', '170%')
  fSel.append('feGaussianBlur')
    .attr('in', 'SourceAlpha').attr('stdDeviation', 5).attr('result', 'blur')
  fSel.append('feFlood')
    .attr('flood-color', 'rgba(190,42,0,0.35)').attr('result', 'color')
  fSel.append('feComposite')
    .attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow')
  const fSelMerge = fSel.append('feMerge')
  fSelMerge.append('feMergeNode').attr('in', 'glow')
  fSelMerge.append('feMergeNode').attr('in', 'SourceGraphic')

  CAREER_DOMAINS.forEach(domain => {
    // ── 小气泡：墨点晕染渐变（中心浓→边缘淡散）──
    const g1 = defs.append('radialGradient').attr('id', `jb-${domain.id}`)
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%')
    g1.append('stop').attr('offset', '0%').attr('stop-color', domain.color).attr('stop-opacity', 0.92)
    g1.append('stop').attr('offset', '50%').attr('stop-color', domain.color).attr('stop-opacity', 0.8)
    g1.append('stop').attr('offset', '78%').attr('stop-color', domain.color).attr('stop-opacity', 0.38)
    g1.append('stop').attr('offset', '100%').attr('stop-color', domain.color).attr('stop-opacity', 0.06)

    // ── 大气泡：水渍圈（中心近透明、边缘微微显色）──
    const g2 = defs.append('radialGradient').attr('id', `db-${domain.id}`)
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%')
    g2.append('stop').attr('offset', '0%').attr('stop-color', domain.color).attr('stop-opacity', 0.02)
    g2.append('stop').attr('offset', '60%').attr('stop-color', domain.color).attr('stop-opacity', 0.04)
    g2.append('stop').attr('offset', '88%').attr('stop-color', domain.color).attr('stop-opacity', 0.14)
    g2.append('stop').attr('offset', '100%').attr('stop-color', domain.color).attr('stop-opacity', 0.2)
  })

  // ── 外层 domain 节点 ──
  const domainCount = CAREER_DOMAINS.length
  const angleStep = (2 * Math.PI) / domainCount
  const spread = Math.min(W, H) * 0.29

  const domainNodes: DomainNode[] = CAREER_DOMAINS.map((d, i) => ({
    id: d.id, name: d.name, color: d.color, r: DOMAIN_R, domainIdx: i,
    x: W / 2 + Math.cos(angleStep * i - Math.PI / 2) * spread,
    y: H / 2 + Math.sin(angleStep * i - Math.PI / 2) * spread,
  }))

  // ── 每个领域的内层 job 节点 ──
  const jobNodesByDomain: JobNode[][] = CAREER_DOMAINS.map((domain, di) =>
    domain.jobs.map((jobName, ji) => ({
      id: `${domain.id}-${ji}`, jobName, domainId: domain.id,
      domainName: domain.name, domainColor: domain.color,
      r: JOB_R, domainIdx: di, jobIdx: ji,
      x: (Math.random() - 0.5) * JOB_R * 0.6,
      y: (Math.random() - 0.5) * JOB_R * 0.6,
    })),
  )

  // ── 渲染 domain 组 ──
  const domainGroups = el.selectAll('g.domain-group')
    .data(domainNodes)
    .enter().append('g')
    .attr('class', 'domain-group')

  // 大气泡 — 水渍圈（极细描边，像水痕干燥后的残留）
  domainGroups.append('circle')
    .attr('class', 'domain-bg')
    .attr('r', DOMAIN_R)
    .attr('fill', d => `url(#db-${d.id})`)
    .attr('stroke', d => d.color)
    .attr('stroke-width', 0.8)
    .attr('stroke-opacity', 0.28)

  // 领域名标签（大气泡顶部外侧）
  domainGroups.append('text')
    .attr('class', 'domain-label')
    .attr('y', -DOMAIN_R - 7)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'auto')
    .attr('fill', d => d.color)
    .attr('font-size', 12).attr('font-weight', '700')
    .attr('font-family', 'KaiTi, STKaiti, serif')
    .attr('paint-order', 'stroke')
    .attr('stroke', 'rgba(245,245,243,0.9)').attr('stroke-width', 3)
    .text(d => d.name)

  // ── 渲染 job 节点 ──
  domainGroups.each(function (_domainD, di) {
    const domainG = d3.select(this)
    const jobs = jobNodesByDomain[di]!
    const nodeG = domainG.selectAll('g.job-node')
      .data(jobs)
      .enter().append('g')
      .attr('class', 'job-node')
      .style('cursor', 'pointer')
      .on('click', (_ev, d) => {
        selectedJob.value = { id: d.domainId, name: d.domainName, domainColor: d.domainColor, jobName: d.jobName }
        roleSearch.value = d.jobName
        doSearch()
        updateBubbleSelection()
      })

    // 墨点气泡
    nodeG.append('circle')
      .attr('class', 'job-circle')
      .attr('r', d => d.r)
      .attr('fill', d => `url(#jb-${d.domainId})`)
      .attr('stroke', 'none')
      .attr('filter', 'url(#f-ink-bleed)')

    // 岗位文字（深墨色，与水墨底色高对比）
    nodeG.append('text')
      .attr('class', 'job-text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'rgba(62,48,32,0.92)')
      .attr('font-size', Math.max(8, JOB_R * 0.36))
      .attr('font-family', FONT)
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.02em')
      .attr('pointer-events', 'none')
      .each(function (d) {
        const txt = d3.select(this)
        const name = d.jobName
        const maxW = d.r * 1.65
        const spaceIdx = name.indexOf(' ')
        let line1 = '', line2 = ''
        if (spaceIdx > 0 && spaceIdx < name.length - 1) {
          line1 = name.slice(0, spaceIdx)
          line2 = name.slice(spaceIdx + 1)
        } else {
          const boundary = name.search(/[a-zA-Z][^\x00-\x7F]|[^\x00-\x7F][a-zA-Z]/)
          const split = boundary > 0 ? boundary + 1 : Math.ceil(name.length / 2)
          line1 = name.slice(0, split)
          line2 = name.slice(split)
        }
        txt.text(name)
        const measured = (this as SVGTextElement).getComputedTextLength?.() ?? name.length * 7
        if (measured > maxW && line2.length > 0) {
          txt.text('')
          txt.append('tspan').attr('x', 0).attr('dy', '-0.45em').text(line1)
          txt.append('tspan').attr('x', 0).attr('dy', '1.15em').text(line2)
        }
      })

    // tooltip
    nodeG.append('title').text(d => {
      const sal = getJobSalaryData(d.jobName)
      return `${d.jobName}\n${d.domainName}\n初级 ${sal.junior}K · 中级 ${sal.mid}K · 高级 ${sal.senior}K`
    })
  })

  // ── 内层 simulations（永不停止 + 正弦波平滑 wander）──
  CAREER_DOMAINS.forEach((_, di) => {
    const jobs = jobNodesByDomain[di]!
    // 初始化各自独立随机相位
    jobs.forEach(j => {
      j._phaseX = Math.random() * Math.PI * 2
      j._phaseY = Math.random() * Math.PI * 2
    })
    const domainG = d3.select(el.selectAll<SVGGElement, DomainNode>('g.domain-group').nodes()[di]!)
    const innerNodeG = domainG.selectAll<SVGGElement, JobNode>('g.job-node')
    const innerBound = DOMAIN_R - JOB_R - 2

    const sim = d3.forceSimulation(jobs)
      .alphaDecay(0)
      .alphaTarget(0.15)
      .velocityDecay(0.55)
      .force('collide', d3.forceCollide<JobNode>(d => d.r + 2).strength(1))
      .force('center', d3.forceCenter(0, 0).strength(0.02))
      .force('wander', () => {
        jobs.forEach(j => {
          j._phaseX = (j._phaseX ?? 0) + 0.009 + Math.random() * 0.004
          j._phaseY = (j._phaseY ?? 0) + 0.009 + Math.random() * 0.004
          j.vx = (j.vx ?? 0) + Math.sin(j._phaseX) * 0.08
          j.vy = (j.vy ?? 0) + Math.cos(j._phaseY) * 0.08
        })
      })
      .on('tick', () => {
        jobs.forEach(j => {
          const dist = Math.sqrt((j.x ?? 0) ** 2 + (j.y ?? 0) ** 2)
          if (dist > innerBound) {
            const ratio = innerBound / dist
            j.x = (j.x ?? 0) * ratio
            j.y = (j.y ?? 0) * ratio
          }
        })
        innerNodeG.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })
    _innerSims.push(sim)
  })

  // ── 外层 simulation（弹性反射边界 + 正弦波平滑 wander）──
  // 初始化各大气泡独立相位
  domainNodes.forEach(d => {
    d._phaseX = Math.random() * Math.PI * 2
    d._phaseY = Math.random() * Math.PI * 2
  })
  _outerSim = d3.forceSimulation(domainNodes)
    .alphaDecay(0)
    .alphaTarget(0.12)
    .velocityDecay(0.35)
    .force('collide', d3.forceCollide<DomainNode>(d => d.r + 6).strength(0.85))
    .force('center', d3.forceCenter(W / 2, H / 2).strength(0.01))
    .force('charge', d3.forceManyBody().strength(-50))
    .force('wander', () => {
      domainNodes.forEach(d => {
        d._phaseX = (d._phaseX ?? 0) + 0.007 + Math.random() * 0.003
        d._phaseY = (d._phaseY ?? 0) + 0.007 + Math.random() * 0.003
        d.vx = (d.vx ?? 0) + Math.sin(d._phaseX) * 0.12
        d.vy = (d.vy ?? 0) + Math.cos(d._phaseY) * 0.12
      })
    })
    .force('bound', () => {
      // 弹性反射：碰壁稍减速（×0.85），避免来回弹
      domainNodes.forEach(d => {
        const pad = d.r + 14
        if ((d.x ?? 0) < pad)     { d.x = pad;     d.vx = Math.abs(d.vx ?? 0) * 0.85 }
        if ((d.x ?? 0) > W - pad) { d.x = W - pad; d.vx = -Math.abs(d.vx ?? 0) * 0.85 }
        if ((d.y ?? 0) < pad)     { d.y = pad;     d.vy = Math.abs(d.vy ?? 0) * 0.85 }
        if ((d.y ?? 0) > H - pad) { d.y = H - pad; d.vy = -Math.abs(d.vy ?? 0) * 0.85 }
      })
    })
    .on('tick', () => {
      domainGroups.attr('transform', d => `translate(${d.x ?? W / 2},${d.y ?? H / 2})`)
    })

  updateBubbleSelection()
}

function updateBubbleSelection() {
  const svg = bubbleSvgRef.value
  if (!svg) return
  const sel = selectedJob.value
  const selJobName = sel?.jobName ?? ''
  const selDomainId = sel?.id ?? ''

  d3.select(svg).selectAll<SVGGElement, JobNode>('g.job-node').each(function (d) {
    const g = d3.select(this)
    const isSelected = d.jobName === selJobName && d.domainId === selDomainId
    g.select('.job-circle')
      .classed('job-circle--selected', isSelected)
      .attr('r', isSelected ? d.r + 3 : d.r)
      .attr('filter', isSelected ? 'url(#f-ink-sel)' : 'url(#f-ink-bleed)')
    g.select('.job-text')
      .attr('font-weight', isSelected ? '700' : '600')
      .attr('fill', isSelected ? 'rgba(30,18,8,0.98)' : 'rgba(62,48,32,0.92)')
  })

  d3.select(svg).selectAll<SVGCircleElement, DomainNode>('.domain-bg').each(function (d) {
    const isActive = selDomainId === d.id
    d3.select(this)
      .attr('stroke-opacity', isActive ? 0.5 : 0.28)
      .attr('stroke-width', isActive ? 1.5 : 0.8)
  })
}

watch(selectedJob, () => updateBubbleSelection())

/* ═══ 省份中位薪资排行（全岗位滑动） ═══ */
function getJobMedianByProvince(jobName: string, provinceSalary: number, nationalAvgSalary: number): number {
  const base = getJobSalaryData(jobName)
  const factor = nationalAvgSalary > 0 ? provinceSalary / nationalAvgSalary : 1
  return +(base.mid * Math.max(0.5, Math.min(factor, 1.8))).toFixed(1)
}

const allJobMedians = computed(() => {
  const data = provinceData.value
  const prov = data.find(d => d.name === selectedProvince.value)
  const provinceSalary = prov?.salary ?? 12
  const nationalAvg = data.length ? data.reduce((s, d) => s + d.salary, 0) / data.length : 12
  return _flatJobs
    .map(j => ({ name: j.jobName, domain: j.domainName, color: j.domainColor, median: getJobMedianByProvince(j.jobName, provinceSalary, nationalAvg) }))
    .sort((a, b) => b.median - a.median)
    .filter((j, idx, arr) => arr.findIndex(x => x.name === j.name) === idx) // 去重
})

const salaryChartOption = computed(() => {
  const selName = selectedJob.value?.jobName ?? ''
  const jobs = allJobMedians.value
  const visibleCount = 12
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.96)', borderColor: C.panelBorder,
      textStyle: { color: C.textPrimary, fontSize: 11 },
      formatter: (params: any[]) => {
        const p = params[0]
        if (!p) return ''
        const job = jobs.find(j => j.name === p.name)
        return `<b style="color:${job?.color ?? C.textPrimary}">${p.name}</b><br/>中位薪资: <b>${p.value}K</b><br/><span style="opacity:.7">${job?.domain ?? ''}</span>`
      },
    },
    grid: { left: 90, right: 18, top: 8, bottom: 36 },
    dataZoom: [{
      type: 'slider', orient: 'vertical',
      right: 2, top: 8, bottom: 36,
      width: 12,
      startValue: 0, endValue: visibleCount - 1,
      brushSelect: false,
      handleStyle: { color: C.parchmentDark, borderColor: C.gold },
      fillerColor: 'rgba(139,105,20,0.1)',
      borderColor: 'rgba(139,105,20,0.2)',
      showDetail: false,
    }],
    xAxis: {
      type: 'value', name: 'K/月',
      nameTextStyle: { color: C.textMuted, fontSize: 9 },
      axisLabel: { color: C.textSecondary, fontSize: 9 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(139,37,0,0.06)' } },
    },
    yAxis: {
      type: 'category',
      data: jobs.map(j => j.name),
      axisLabel: { color: C.textSecondary, fontSize: 10, width: 80, overflow: 'truncate' as const },
      inverse: false,
    },
    series: [{
      name: '中位薪资', type: 'bar', barMaxWidth: 14,
      data: jobs.map(j => ({
        value: j.median,
        itemStyle: {
          color: j.name === selName
            ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: C.zhushaLight }, { offset: 1, color: C.zhusha }] }
            : { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: 'rgba(180,155,110,0.55)' }, { offset: 1, color: 'rgba(139,105,20,0.7)' }] },
          borderRadius: [0, 3, 3, 0],
        },
      })),
    }],
  }
})

onMounted(async () => {
  applyRouteRole(route.query.role)
  await nextTick()
  setupEntranceAnimation()
  // D3 气泡图初始化
  initBubbleChart()
  if (bubbleSvgRef.value) {
    _bubbleRo = new ResizeObserver(() => initBubbleChart())
    _bubbleRo.observe(bubbleSvgRef.value)
  }
})

watch(() => route.query.role, (val) => {
  applyRouteRole(val)
})

onBeforeUnmount(() => {
  gsapCtx?.revert()
  if (_ctaTimer) clearTimeout(_ctaTimer)
  stopAllSimulations()
  if (_bubbleRo) { _bubbleRo.disconnect(); _bubbleRo = null }
})
</script>
<template>
  <div class="da-page" ref="pageRef">
    <!-- ═══ 顶部标题栏 ═══ -->
    <header class="da-header">
      <div class="da-header__left">
        <button class="da-back" @click="goBack" title="返回职业发展中心">
          <Icon icon="lucide:arrow-left" :width="16" />
          <span>返回</span>
        </button>
        <div class="da-brand">
          <span class="da-brand__icon">舆</span>
          <span class="da-brand__title">职业分析 · 岗位舆图</span>
        </div>
      </div>
      <div class="da-header__center">
        <div class="da-header-search">
          <Icon icon="lucide:search" :width="14" class="da-header-search__icon" />
          <input
            class="da-header-search__input"
            v-model="roleSearch"
            placeholder="搜索岗位，如 前端工程师、算法…"
            @keydown.enter="handleSearchSubmit"
            @focus="searchFocused = true"
            @blur="searchFocused = false"
          />
          <button class="da-header-search__btn" @click="handleSearchSubmit">
            <Icon icon="lucide:arrow-right" :width="14" />
          </button>
        </div>
      </div>
      <!-- #6 右上角头像+姓名+身份 -->
      <div class="da-header__right">
        <div class="da-user-info">
          <div class="da-avatar">{{ userStore.currentUser?.name?.substring(0, 1) || '学' }}</div>
          <div class="da-user-text">
            <span class="da-user-name">{{ userStore.currentUser?.name || '张同学' }}</span>
            <span class="da-user-role">学生</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ═══ 主体三栏 ═══ -->
    <div class="da-body">
      <!-- 左面板 -->
      <aside class="da-left">
        <!-- #8 KPI 卡片 (带 tooltip 增强可信度) -->
        <div class="da-section">
          <div class="da-section__title"><Icon icon="lucide:activity" :width="14" />方向概览 · {{ currentAnalysisLabel }}</div>
          <div class="kpi-card" @mouseenter="showSalaryTip = true" @mouseleave="showSalaryTip = false">
            <div class="kpi-label">平均中位薪资 <Icon icon="lucide:info" :width="11" class="kpi-info-icon" /></div>
            <div class="kpi-val"><span class="kpi-num">{{ nationalKpi.avgSalary }}</span><span class="kpi-unit">K</span></div>
            <div class="kpi-tag kpi-tag--up">{{ nationalKpi.growthRate }}</div>
            <div class="kpi-tooltip kpi-tooltip--right" v-show="showSalaryTip">
              <div class="tooltip-header">演示样本说明</div>
              <div class="tooltip-body">
                <p>• 当前结果基于演示岗位样本的趋势估算，用于展示职业分析路径。</p>
                <p>• 数值会随岗位方向与后续省份选择联动变化。</p>
                <p>• 适合用来比较方向差异，不代表真实招聘数据库结论。</p>
              </div>
              <div class="tooltip-footer">演示模式 · 用于展示分析流程</div>
            </div>
          </div>
          <div class="kpi-card" @mouseenter="showDemandTip = true" @mouseleave="showDemandTip = false">
            <div class="kpi-label">岗位需求总量 <Icon icon="lucide:info" :width="11" class="kpi-info-icon" /></div>
            <div class="kpi-val"><span class="kpi-num">{{ nationalKpi.demandTotal.toLocaleString() }}</span></div>
            <div class="kpi-tooltip kpi-tooltip--right" v-show="showDemandTip">
              <div class="tooltip-header">需求趋势说明</div>
              <div class="tooltip-body">
                <p>• 当前指数基于演示岗位样本的热度、活跃度和地区分布综合估算。</p>
                <p>• 主要用于展示不同岗位和不同省份的相对差异。</p>
              </div>
              <div class="tooltip-footer">演示模式 · 非真实招聘平台统计</div>
            </div>
          </div>
        </div>

        <!-- #9 省份排行 (需求/薪资双榜切换) -->
        <div class="da-section da-section--ranking">
          <div class="da-section__title">
            <Icon icon="lucide:trophy" :width="14" />
            <span>TOP 10</span>
            <span class="rank-mode-label">{{ rankModeLabel }}</span>
          </div>
          <div class="rank-list">
            <div
              v-for="p in provinceRanking" :key="p.name"
              class="rank-item"
              :class="{ 'rank-item--active': hasSelectedProvince && selectedProvince === p.name, 'rank-item--disabled': !hasSelectedJob }"
              :aria-disabled="!hasSelectedJob"
              @click="selectRankedProvince(p.name)"
            >
              <span class="rank-badge" :class="{ 'rank-badge--top': p.rank <= 3 }">{{ p.rank }}</span>
              <span class="rank-name">{{ p.shortName }}</span>
              <span class="rank-bar-wrap">
                <span class="rank-bar" :style="{ width: p.barPercent + '%' }"></span>
              </span>
              <span class="rank-val">{{ p.displayValue }}</span>
            </div>
          </div>
        </div>

      </aside>

      <!-- 中央区域：气泡图（上50%）+ 地图&薪资图（下50%） -->
      <main class="da-map">
        <!-- 上半：行业气泡图（ECharts graph + force） -->
        <div class="da-bubble-wrap">
          <div class="da-bubble-job-tag" :class="{ 'da-bubble-job-tag--empty': !hasSelectedJob }">
            <Icon :icon="hasSelectedJob ? 'lucide:briefcase' : 'lucide:mouse-pointer-click'" :width="12" />
            <template v-if="hasSelectedJob">
              <span class="da-bubble-job-tag__step">已选岗位</span>
              <b :style="{ color: selectedJob?.domainColor }">{{ selectedJobLabel }}</b>
              <span class="da-bubble-job-tag__domain">{{ selectedJobDomainLabel }}</span>
            </template>
            <template v-else>
              <span>第 1 步：从气泡图选择岗位</span>
              <span class="da-bubble-job-tag__domain">当前方向：{{ currentAnalysisLabel }}</span>
            </template>
          </div>
          <svg ref="bubbleSvgRef" class="da-bubble-svg"></svg>
        </div>

        <!-- 下半：薪资柱状图 + 地图 -->
        <div class="da-bottom" :class="{ 'da-bottom--focus-map': !hasSelectedProvince }">
          <!-- 左：省份中位薪资排行（全岗位滑动） -->
          <div v-if="hasSelectedProvince" class="da-salary-chart">
            <div class="da-section__title da-section__title--sm">
              <Icon icon="lucide:list-ordered" :width="12" />{{ selectedProvinceLabel }} · 中位薪资排行（K/月）
            </div>
            <VChart class="da-salary-vchart" :option="salaryChartOption" autoresize />
          </div>

          <!-- 右：卷轴风格地图（卷边用伪元素实现，保持 ECharts 扁平 DOM） -->
          <div class="da-map-inner" ref="scrollRef" :class="{ 'da-map-inner--locked': !hasSelectedJob, 'da-map-inner--pending': hasSelectedJob && !hasSelectedProvince }">
            <img :src="parchmentBaseUrl" class="da-map-inner__base" alt="" draggable="false" />
            <VChart
              ref="vchartRef"
              class="da-map__chart"
              :option="mapOption"
              :init-options="mapInitOptions"
              :update-options="mapUpdateOptions"
              @click="handleMapClick"
              autoresize
            />
            <div class="da-map-inner__vignette"></div>
            <!-- 图钉图例（缩小版） -->
            <div class="da-pin-legend da-pin-legend--sm" :class="{ 'da-pin-legend--muted': !hasSelectedJob }">
              <div class="pin-legend__list">
                <div class="pin-item" :class="{ active: activeLevel === 4 }" @click="highlightMapLevel(4)">
                  <div class="pin pin--sm" style="--pin-color:#8B5E14"><div class="pin__head"></div><div class="pin__needle"></div></div>
                  <span class="pin-label">极高(&gt;60)</span>
                </div>
                <div class="pin-item" :class="{ active: activeLevel === 3 }" @click="highlightMapLevel(3)">
                  <div class="pin pin--sm" style="--pin-color:#a67c52"><div class="pin__head"></div><div class="pin__needle"></div></div>
                  <span class="pin-label">高(41-60)</span>
                </div>
                <div class="pin-item" :class="{ active: activeLevel === 2 }" @click="highlightMapLevel(2)">
                  <div class="pin pin--sm" style="--pin-color:#c4a878"><div class="pin__head"></div><div class="pin__needle"></div></div>
                  <span class="pin-label">中(21-40)</span>
                </div>
                <div class="pin-item" :class="{ active: activeLevel === 1 }" @click="highlightMapLevel(1)">
                  <div class="pin pin--sm" style="--pin-color:#ddd0b8"><div class="pin__head"></div><div class="pin__needle"></div></div>
                  <span class="pin-label">低(≤20)</span>
                </div>
              </div>
            </div>
            <div v-if="analysisStage === 'job-pending'" class="da-map-overlay">
              <span class="da-map-overlay__badge">待选择岗位</span>
              <strong class="da-map-overlay__title">先从上方气泡图中选择岗位</strong>
              <p class="da-map-overlay__desc">当前先展示 {{ currentAnalysisLabel }} 方向概览，选中岗位后再查看各省份差异。</p>
            </div>
            <div v-if="analysisStage === 'insight-ready'" class="da-map__hint da-map__hint--sm">
              <span class="da-map__hint-dot"></span>
              <span><b>{{ selectedProvinceLabel }}</b> · {{ selectedJobLabel }}</span>
            </div>
          </div>

        </div>
      </main>

      <!-- 右面板 -->
      <aside class="da-right">
        <div v-if="analysisStage === 'insight-ready'" class="da-right-content">
          <!-- 省份对标图 -->
          <div class="da-section da-section--chart">
            <div class="da-section__title">
              <Icon icon="lucide:git-compare" :width="14" />
              <span class="da-trend-province">{{ selectedProvinceLabel }}</span>
              <span class="da-trend-sep">·</span>
              薪资水平对标
            </div>
            <VChart class="da-trend-chart" :option="compareOption" autoresize />
          </div>

          <!-- #4 AI 评价模块（可翻页） -->
          <div class="da-section da-section--ai">
            <div class="da-section__title da-section__title--with-action">
              <span class="da-section__title-text"><Icon icon="lucide:sparkles" :width="14" />AI 市场洞察</span>
              <button class="da-ask-ai-btn" @click="openAiDrawer">
                <Icon icon="lucide:message-circle" :width="12" />问 AI
              </button>
            </div>
            <div class="ai-card" v-if="currentAiComment">
              <div class="ai-card__header">
                <span class="ai-card__tag"><Icon icon="lucide:bot" :width="12" />{{ currentAiComment.title }}</span>
                <span class="ai-card__page">{{ aiCommentPage + 1 }}/{{ aiComments.length }}</span>
              </div>
              <p class="ai-card__content">{{ currentAiComment.content }}</p>
              <div class="ai-card__nav">
                <button :disabled="aiCommentPage <= 0" @click="prevAiPage">
                  <Icon icon="lucide:chevron-left" :width="14" />
                </button>
                <button :disabled="aiCommentPage >= aiComments.length - 1" @click="nextAiPage">
                  <Icon icon="lucide:chevron-right" :width="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- #7 查看图谱 — 增强引导 -->
          <div class="da-section">
            <button class="da-link-btn" @click="goToCareerCenter">
              <Icon icon="lucide:cpu" :width="14" />
              <span>查看「{{ selectedJobLabel }}」能力图谱</span>
              <Icon icon="lucide:arrow-right" :width="12" />
            </button>
            <p class="da-link-hint">基于当前已选岗位，查看所需技能和学习路径</p>
          </div>

          <!-- 关注此方向 -->
          <div class="da-section">
            <button
              class="da-follow-btn"
              :class="{ 'da-follow-btn--active': isCurrentRoleFollowed, 'da-follow-btn--disabled': !followableRole }"
              :disabled="!followableRole"
              @click="toggleFollowRole"
            >
              <Icon :icon="followableRole && isCurrentRoleFollowed ? 'lucide:bookmark-check' : 'lucide:bookmark'" :width="12" />
              <span>{{ !followableRole ? '暂不支持关注' : isCurrentRoleFollowed ? '已关注 · 取消' : '关注此方向' }}</span>
            </button>
          </div>
        </div>

        <!-- 未选中提示 -->
        <div v-else class="da-right-empty" :class="{ 'da-right-empty--pending': analysisStage === 'province-pending' }">
          <Icon :icon="analysisStage === 'job-pending' ? 'lucide:mouse-pointer-click' : 'lucide:map-pinned'" :width="36" />
          <span class="da-right-empty__badge">{{ analysisStage === 'job-pending' ? '第 1 步' : '第 2 步' }}</span>
          <p class="da-right-empty__title">{{ analysisStage === 'job-pending' ? '先从气泡图选择岗位' : '继续选择目标省份' }}</p>
          <p class="da-right-empty__desc" v-if="analysisStage === 'job-pending'">当前先展示 {{ currentAnalysisLabel }} 方向概览，选中岗位后这里会展开省份分析。</p>
          <p class="da-right-empty__desc" v-else>已选岗位：{{ selectedJobLabel }}。点击地图或左侧 TOP 10 列表后，再查看完整洞察。</p>
        </div>
      </aside>
    </div>

    <!-- 底部 CTA：已关注方向时出现 -->
    <Transition name="cta-slide">
      <div v-if="analysisStage === 'insight-ready' && learningStore.targetRoles.length > 0 && ctaVisible" class="da-bottom-cta">
        <span class="da-bottom-cta__text">
          已关注
          <strong>{{ learningStore.targetRoles.map(r => r.role).join(' / ') }}</strong>
          ，去看看自己能否匹配
        </span>
        <button class="da-bottom-cta__btn" @click="goToNavigation">
          <Icon icon="lucide:route" :width="14" />
          前往职途导航
          <Icon icon="lucide:arrow-right" :width="14" />
        </button>
      </div>
    </Transition>

    <!-- AI 对话 Drawer -->
    <el-drawer
      v-model="showAiDrawer"
      title=""
      direction="rtl"
      size="380px"
      :with-header="false"
      class="ai-drawer"
    >
      <div class="ai-drawer__wrap">
        <!-- 头部 -->
        <div class="ai-drawer__header">
          <div class="ai-drawer__header-info">
            <span class="ai-drawer__avatar"><Icon icon="lucide:sparkles" :width="16" /></span>
            <div>
              <p class="ai-drawer__title">AI 市场洞察</p>
              <p class="ai-drawer__sub">{{ selectedJob?.jobName ?? roleSearch }} · {{ selectedProvince ?? '全国' }}</p>
            </div>
          </div>
          <button class="ai-drawer__close" @click="showAiDrawer = false">
            <Icon icon="lucide:x" :width="16" />
          </button>
        </div>

        <!-- 消息列表 -->
        <div class="ai-drawer__messages" ref="aiDrawerScrollRef">
          <div
            v-for="(msg, i) in aiDrawerMessages"
            :key="i"
            class="ai-drawer__msg"
            :class="msg.role === 'user' ? 'ai-drawer__msg--user' : 'ai-drawer__msg--ai'"
          >
            <div class="ai-drawer__bubble">{{ msg.content }}</div>
            <span class="ai-drawer__time">{{ msg.time }}</span>
          </div>
          <div v-if="aiDrawerLoading" class="ai-drawer__msg ai-drawer__msg--ai">
            <div class="ai-drawer__bubble ai-drawer__bubble--typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 快捷问题 -->
        <div class="ai-drawer__quick" v-if="aiDrawerMessages.length <= 1">
          <button
            v-for="q in aiDrawerQuickPrompts"
            :key="q"
            class="ai-drawer__quick-btn"
            @click="sendAiDrawerMsg(q)"
          >{{ q }}</button>
        </div>

        <!-- 输入框 -->
        <div class="ai-drawer__input-row">
          <input
            class="ai-drawer__input"
            v-model="aiDrawerInput"
            placeholder="输入你的问题…"
            @keydown.enter="sendAiDrawerMsg()"
            :disabled="aiDrawerLoading"
          />
          <button class="ai-drawer__send" @click="sendAiDrawerMsg()" :disabled="aiDrawerLoading || !aiDrawerInput.trim()">
            <Icon icon="lucide:send" :width="15" />
          </button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<style scoped>
/* ═══ 大屏根容器 ═══ */
.da-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-100);
  color: var(--text-100);
  font-family: var(--font-ui, sans-serif);
  overflow: hidden;
  position: relative;
}

/* ═══ 顶部标题栏 ═══ */
.da-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-200);
  border-bottom: 1px solid var(--bg-300);
  flex-shrink: 0;
}
.da-header__left { display: flex; align-items: center; gap: 14px; z-index: 1; }
.da-header__center {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  display: flex; align-items: center; justify-content: center;
}
.da-header__right { display: flex; align-items: center; gap: 16px; margin-left: auto; z-index: 1; }

.da-back {
  display: inline-flex; align-items: center; gap: 4px;
  background: transparent; border: 1px solid var(--bg-300);
  color: var(--primary-100, #8B2500); padding: 6px 12px; font-family: inherit; font-size: 14px;
  cursor: pointer; transition: all 0.3s ease; border-radius: var(--radius-sm);
}
.da-back:hover { border-color: var(--primary-100); background: rgba(139,37,0,0.06); }

.da-brand { display: flex; align-items: center; gap: 8px; }
.da-brand__icon {
  width: 32px; height: 32px; display: grid; place-items: center;
  border: 1.5px solid var(--primary-100); color: var(--primary-100); font-size: 16px; font-weight: 600;
  transform: rotate(-3deg);
}
.da-brand__title {
  font-size: 16px; font-weight: 600; letter-spacing: 0.04em; color: var(--text-100);
  white-space: nowrap;
}

/* 头部搜索栏 */
.da-header-search {
  display: flex; align-items: center; gap: 0;
  background: rgba(245,245,243,0.7); backdrop-filter: blur(8px);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 22px; padding: 2px 4px 2px 12px;
  min-width: 220px; max-width: 360px; width: 100%;
  transition: all 0.25s ease;
}
.da-header-search:focus-within {
  border-color: rgba(0,0,0,0.25);
  background: rgba(245,245,243,0.92);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.da-header-search__icon { color: rgba(0,0,0,0.35); flex-shrink: 0; }
.da-header-search:focus-within .da-header-search__icon { color: rgba(0,0,0,0.55); }
.da-header-search__input {
  flex: 1; background: transparent; border: none; padding: 6px 10px;
  font-family: inherit; font-size: 13px; color: var(--text-100); outline: none;
  min-width: 0; letter-spacing: 0.01em;
}
.da-header-search__input::placeholder { color: rgba(0,0,0,0.35); font-style: italic; }
.da-header-search__btn {
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.08); border: none; color: #666;
  width: 30px; height: 30px; cursor: pointer; border-radius: 50%;
  transition: all 0.3s;
}
.da-header-search__btn:hover { background: rgba(0,0,0,0.15); color: #333; }

/* 气泡图内岗位标签（左上角） */
.da-bubble-job-tag {
  position: absolute; top: 12px; left: 14px; z-index: 5;
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(10px);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 999px; padding: 6px 14px 6px 12px;
  font-size: 12px; font-family: var(--font-ui, sans-serif);
  color: var(--text-200); letter-spacing: 0.01em;
  box-shadow: 0 8px 24px rgba(17,24,39,0.08);
  pointer-events: none;
}
.da-bubble-job-tag__step {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 2px 8px; border-radius: 999px;
  background: rgba(17,17,17,0.06); color: var(--text-200);
  font-size: 11px; font-weight: 600;
}
.da-bubble-job-tag b { font-size: 13px; font-weight: 600; }
.da-bubble-job-tag__domain { font-size: 11px; color: var(--text-300); margin-left: 1px; }
.da-bubble-job-tag__domain::before { content: '('; }
.da-bubble-job-tag__domain::after { content: ')'; }
.da-bubble-job-tag--empty {
  color: var(--text-200); font-style: normal; font-size: 12px;
  opacity: 1;
}

.da-map-search-wrap {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center;
  width: min(440px, 50%);
  z-index: 1;
}
.da-map-search {
  display: flex; align-items: center; gap: 0; width: 100%;
  background: rgba(245,245,243,0.85); backdrop-filter: blur(10px) saturate(1.2);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 28px; padding: 4px 6px 4px 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4);
  transition: all 0.3s ease;
}
.da-map-search:focus-within {
  border-color: rgba(0,0,0,0.25);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.4);
  background: rgba(245,245,243,0.94);
}
.da-map-search__guide {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  margin: 0; font-size: 12px; color: rgba(0,0,0,0.45);
  font-family: var(--font-title), sans-serif; font-style: italic;
  letter-spacing: 0.04em; text-align: center;
  background: rgba(245,245,243,0.88); padding: 3px 14px; border-radius: 12px;
  backdrop-filter: blur(4px); white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  z-index: 20;
}
.da-map-search__icon { color: rgba(0,0,0,0.4); flex-shrink: 0; transition: color 0.3s; }
.da-map-search:focus-within .da-map-search__icon { color: rgba(0,0,0,0.65); }
.da-map-search__input {
  flex: 1; background: transparent; border: none; padding: 8px 12px;
  font-family: inherit; font-size: 14px; color: var(--text-100); outline: none;
  min-width: 0; letter-spacing: 0.01em;
}
.da-map-search__input::placeholder { color: rgba(0,0,0,0.35); font-style: italic; }
.da-map-search__btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(0,0,0,0.08); border: none; color: #666;
  padding: 7px 18px; font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.02em; transition: all 0.3s;
  border-radius: 22px;
}
.da-map-search__btn:hover { background: rgba(0,0,0,0.15); color: #333; }

/* #6 用户信息 */
.da-user-info { display: flex; align-items: center; gap: 10px; }
.da-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: grid; place-items: center; color: #fff;
  font-size: 15px; font-weight: 600;
  background: var(--primary-100);
}
.da-user-text { display: flex; flex-direction: column; line-height: 1.3; }
.da-user-name { font-size: 14px; font-weight: 600; color: var(--text-100); }
.da-user-role { font-size: 12px; color: var(--text-300); }

/* ═══ 主体三栏布局 ═══ */
.da-body {
  position: relative; z-index: 1;
  flex: 1; min-height: 0;
  display: flex; overflow-y: hidden; overflow-x: visible;
}

/* ═══ 左面板 ═══ */
.da-left {
  width: 240px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 4px;
  background: var(--bg-200);
  border-right: 1px solid var(--bg-300);
  padding: 16px;
  position: relative; z-index: 30;
}

.da-section { margin-bottom: 12px; position: relative; }
.da-section__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: var(--primary-100);
  letter-spacing: 0.02em; margin-bottom: 10px;
  padding-bottom: 6px; border-bottom: 1px solid var(--bg-300);
}

/* KPI */
.kpi-card {
  position: relative;
  background: var(--bg-100);
  border: 1px solid var(--bg-300);
  padding: 12px 16px; margin-bottom: 8px;
  border-radius: var(--radius-sm);
  z-index: 40;
}
.kpi-label { font-size: 13px; color: var(--text-200); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.kpi-info-icon { color: var(--text-300); cursor: help; width: 14px; height: 14px; }
.kpi-val {
  display: flex; align-items: baseline; gap: 4px;
  color: var(--primary-100); font-weight: 600;
}
.kpi-num { font-size: 32px; font-variant-numeric: tabular-nums; }
.kpi-unit { font-size: 15px; color: var(--text-200); }
.kpi-tag {
  display: inline-block; font-size: 13px; margin-top: 6px;
  padding: 2px 8px; border-radius: 2px;
}
.kpi-tag--up { color: #5B7744; background: rgba(91,119,68,0.1); }

/* KPI tooltip */
.kpi-tooltip {
  position: absolute; top: 100%; left: 0; margin-top: 8px;
  width: 280px; background: rgba(255,255,255,0.96); backdrop-filter: blur(4px);
  border: 1px solid var(--primary-100); border-radius: var(--radius-md);
  padding: 16px; z-index: 80; color: var(--text-200); font-size: 13px;
  box-shadow: 0 4px 12px rgba(139,37,0,0.1); text-align: left;
  line-height: 1.6; pointer-events: auto;
  animation: fadeIn 0.2s ease-out;
}
.kpi-tooltip--right {
  top: 50%; left: 100%; margin-top: 0; margin-left: 16px; transform: translateY(-50%);
}
.kpi-tip p { margin: 0 0 8px; }
.kpi-tip__title { font-weight: 600; color: var(--text-100); margin-bottom: 6px; margin-top: 8px; }
.kpi-tip__title:first-child { margin-top: 0; }
.kpi-tip__row { display: flex; justify-content: space-between; padding: 4px 0; }
.kpi-tip__date { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--bg-300); color: var(--text-300); font-size: 12px; }

/* 排行榜 */
.da-section--ranking { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.rank-mode-label {
  margin-left: auto; font-size: 11px; color: var(--text-300);
  padding: 3px 8px; border: 1px solid var(--bg-300); border-radius: var(--radius-sm);
  background: var(--bg-100);
}
.rank-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px; }
.rank-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; cursor: pointer; font-size: 14px;
  transition: background 0.15s; border-radius: var(--radius-sm);
}
.rank-item:hover { background: rgba(139,37,0,0.06); }
.rank-item--active { background: rgba(139,37,0,0.1); }
.rank-item--disabled { opacity: 0.56; cursor: default; }
.rank-item--disabled:hover { background: transparent; }
.rank-item--disabled .rank-bar { opacity: 0.52; }
.rank-badge {
  width: 22px; height: 22px; display: grid; place-items: center;
  font-size: 12px; font-weight: 600; color: var(--text-300);
  border: 1px solid var(--bg-300); flex-shrink: 0; border-radius: var(--radius-sm);
}
.rank-badge--top { color: var(--primary-100); border-color: var(--primary-100); background: rgba(139,37,0,0.06); }
.rank-name { width: 48px; flex-shrink: 0; color: var(--text-100); font-size: 13px; }
.rank-bar-wrap {
  flex: 1; height: 6px; background: var(--bg-300); overflow: hidden; border-radius: 3px;
}
.rank-bar {
  height: 100%; display: block;
  background: linear-gradient(90deg, var(--primary-100), #C97B5A);
  transition: width 0.3s ease; border-radius: 3px;
}
.rank-val { width: 36px; text-align: right; font-size: 13px; color: var(--text-200); font-variant-numeric: tabular-nums; }


/* ═══ 中央区域（气泡图 + 地图 + 薪资图） ═══ */
.da-map {
  flex: 1; min-width: 0; position: relative;
  display: flex; flex-direction: column;
  background: var(--bg-300);
  z-index: 1; overflow: hidden;
}

/* 上半：气泡图区域 */
.da-bubble-wrap {
  position: relative;
  flex: 0 0 50%; min-height: 0;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(180deg, #F7F5F0, #F0EDE6);
  border-bottom: 1px solid var(--bg-300);
  padding: 12px 14px 0;
  overflow: hidden;
}
/* 宣纸纹理层（feTurbulence + feDiffuseLighting 生成）*/
.da-bubble-wrap::before {
  content: '';
  position: absolute; inset: 0; z-index: 0;
  pointer-events: none;
  opacity: 0.38;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' seed='3'/%3E%3CfeDiffuseLighting lighting-color='%23fff' surfaceScale='1.5'%3E%3CfeDistantLight azimuth='45' elevation='55'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E");
  background-size: cover;
}
.da-bubble-svg {
  position: relative; z-index: 1;
  width: 100%; height: 100%;
  display: block;
}
/* D3 水墨气泡 — 墨点 */
.da-bubble-svg .job-circle {
  transition: r 0.25s ease;
}
.da-bubble-svg .job-circle--selected {
  animation: ink-pulse 2s ease-in-out infinite;
}
@keyframes ink-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.78; }
}
/* 水渍圈 */
.da-bubble-svg .domain-bg {
  transition: stroke-opacity 0.3s, stroke-width 0.3s;
}
.da-bubble-svg .domain-label {
  pointer-events: none;
  user-select: none;
}
.da-bubble-svg .job-text {
  user-select: none;
}

/* 下半：地图 + 薪资图 */
.da-bottom {
  flex: 0 0 50%; min-height: 0;
  display: flex; overflow: hidden;
}
.da-bottom--focus-map .da-map-inner {
  flex: 1;
  border-left: none;
}

/* 下半左：卷轴风格地图容器 */
.da-map-inner {
  flex: 1.18; min-width: 0; position: relative;
  border-left: 1px solid var(--bg-300);
  background: var(--bg-100);
  overflow: hidden;
}
/* 左右卷轴边（用伪元素模拟，不影响 ECharts DOM） */
.da-map-inner::before,
.da-map-inner::after {
  content: ''; position: absolute; top: 0; bottom: 0; width: 10px; z-index: 5; pointer-events: none;
}
.da-map-inner::before {
  left: 0;
  background: linear-gradient(90deg, #999 0%, #aaa 40%, #bbb 100%);
  border-radius: 4px 0 0 4px;
  box-shadow: inset -3px 0 8px rgba(62,48,32,0.15);
}
.da-map-inner::after {
  right: 0;
  background: linear-gradient(270deg, #999 0%, #aaa 40%, #bbb 100%);
  border-radius: 0 4px 4px 0;
  box-shadow: inset 3px 0 8px rgba(62,48,32,0.15);
}
/* 羊皮纸底图 */
.da-map-inner__base {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; z-index: 0; pointer-events: none;
  filter: saturate(0.42) brightness(1.08) contrast(0.96);
}
/* 四角暗角 */
.da-map-inner__vignette {
  position: absolute; inset: 0; z-index: 4; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 45%, rgba(62,48,32,0.15) 100%);
}
.da-map-inner .da-map__chart {
  position: absolute; inset: 0; z-index: 1; mix-blend-mode: multiply;
  transition: opacity 0.25s ease, filter 0.25s ease;
}
.da-map-inner--locked .da-map__chart {
  opacity: 0.38;
  filter: saturate(0.9);
}
.da-map-inner--locked .da-map-inner__base {
  filter: saturate(0.28) brightness(1.06) contrast(0.94);
}
.da-map-overlay {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(420px, calc(100% - 40px));
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 18px 20px; border-radius: 20px;
  background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 18px 40px rgba(17,24,39,0.12);
  text-align: center; z-index: 7; pointer-events: none;
}
.da-map-overlay__badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 4px 10px; border-radius: 999px;
  background: rgba(17,17,17,0.06); color: var(--text-200);
  font-size: 11px; font-weight: 600;
}
.da-map-overlay__title {
  font-size: 18px; line-height: 1.35; color: var(--text-100);
}
.da-map-overlay__desc {
  margin: 0; font-size: 13px; line-height: 1.6; color: var(--text-200);
}

/* 下半右：薪资柱状图 */
.da-salary-chart {
  flex: 0.82; min-width: 0;
  display: flex; flex-direction: column;
  background: var(--bg-100);
  padding: 8px 10px 6px;
  overflow: hidden;
}
.da-salary-vchart {
  flex: 1; min-height: 0; width: 100%;
}
.da-section__title--sm {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--primary-100);
  letter-spacing: 0.02em; margin-bottom: 6px; padding-bottom: 4px;
  border-bottom: 1px solid var(--bg-300); flex-shrink: 0;
}

/* 图钉式图例 */
.da-pin-legend {
  position: absolute; left: 14px; top: 38%; transform: translateY(-50%); z-index: 6;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  pointer-events: none;
}
.da-pin-legend--sm {
  left: 8px; top: 42%; gap: 3px;
}
.da-pin-legend--muted { opacity: 0.35; pointer-events: none; }
.pin-legend__title {
  font-size: 11px; font-weight: 600; color: var(--text-100); letter-spacing: 0.02em;
  background: rgba(245,245,243,0.88); padding: 3px 10px; border-radius: 10px;
  backdrop-filter: blur(4px); border: 1px solid rgba(0,0,0,0.1);
  text-align: center; pointer-events: auto; white-space: nowrap;
}
.pin-legend__list {
  display: flex; flex-direction: column; gap: 4px; align-items: center;
  pointer-events: auto;
}
.pin-item {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer; position: relative; padding: 3px 4px;
  border-radius: 6px; transition: background 0.3s;
}
.pin-item:hover { background: rgba(245,245,243,0.6); }
.pin-item.active { background: rgba(245,245,243,0.85); }

/* 图钉 */
.pin {
  display: flex; flex-direction: column; align-items: center; flex-shrink: 0;
  width: 16px;
}
.pin__head {
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--pin-color);
  border: 2px solid rgba(255,255,255,0.6);
  box-shadow: 0 1px 3px rgba(0,0,0,0.25), inset 0 -2px 3px rgba(0,0,0,0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}
.pin__needle {
  width: 2px; height: 8px; margin-top: -1px;
  background: linear-gradient(180deg, rgba(80,60,40,0.6), rgba(80,60,40,0.15));
  border-radius: 0 0 1px 1px;
}
.pin-item:hover .pin__head {
  transform: scale(1.2);
  box-shadow: 0 2px 6px rgba(0,0,0,0.35), inset 0 -2px 3px rgba(0,0,0,0.15);
}
.pin-item.active .pin__head {
  transform: scale(1.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 3px rgba(0,0,0,0.15);
  border-color: rgba(255,255,255,0.9);
}

.pin-label {
  font-size: 10px; color: rgba(0,0,0,0.5); white-space: nowrap;
  opacity: 0; transform: translateX(-3px);
  transition: opacity 0.2s, transform 0.2s;
  pointer-events: none;
}
.pin-item:hover .pin-label { opacity: 1; transform: translateX(0); color: #444; }
.pin-item.active .pin-label { opacity: 1; transform: translateX(0); color: var(--primary-100, #8B2500); font-weight: 600; }
.da-map__chart { width: 100%; height: 100%; position: relative; z-index: 1; mix-blend-mode: multiply; }
.da-map__hint {
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px; z-index: 6;
  font-size: 12px; color: var(--text-100); padding: 6px 14px;
  background: rgba(245,245,243,0.88); border: 1px solid rgba(0,0,0,0.12);
  border-radius: 20px; backdrop-filter: blur(4px); white-space: nowrap;
}
.da-map__hint--sm {
  font-size: 10px; padding: 4px 10px; bottom: 6px;
}
.da-map__hint--muted {
  background: rgba(255,255,255,0.92);
  color: var(--text-200);
}
.da-map__hint--muted .da-map__hint-dot {
  background: var(--text-300);
  animation: none;
}
.da-map__hint b { color: var(--primary-100, #8B2500); }
.da-map__hint-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: #8B5E14; animation: hintPulse 2s ease-in-out infinite;
}

/* 缩小版图钉 */
.pin--sm .pin__head {
  width: 10px; height: 10px;
}
.pin--sm .pin__needle {
  height: 6px;
}
@keyframes hintPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}


/* ═══ 右面板 ═══ */
.da-right {
  width: 320px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 8px;
  background: var(--bg-200);
  border-left: 1px solid var(--bg-300);
  overflow-y: auto; padding: 16px 14px;
  position: relative;
}
.da-right::before {
  content: '';
  position: absolute; inset: 0; z-index: 0;
  pointer-events: none;
  opacity: 0.18;
  background-image: v-bind(parchmentBgUrl);
  background-size: cover;
  background-position: center;
}
.da-right > * { position: relative; z-index: 1; }
.da-right-content { display: flex; flex-direction: column; gap: 12px; height: 100%; overflow-y: auto; }
.da-right-content > .da-section { margin-bottom: 0; }
.da-right-empty {
  flex: 0 0 auto; margin: auto 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  position: relative; overflow: hidden;
  color: var(--text-200); text-align: center;
  background: var(--bg-100); border: 1px solid var(--bg-300);
  border-radius: var(--radius-md); padding: 28px 20px;
}
.da-right-empty::before {
  content: '';
  position: absolute; inset: 0; z-index: 0;
  pointer-events: none;
  opacity: 0.25;
  background-image: v-bind(parchmentBgUrl);
  background-size: cover;
  background-position: center;
  border-radius: inherit;
}
.da-right-empty::after {
  content: '';
  position: absolute;
  right: -20px; bottom: -20px;
  width: 100px; height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, transparent 40%, rgba(190,42,0,0.06) 60%, rgba(190,42,0,0.03) 80%, transparent 100%);
  pointer-events: none; z-index: 0;
}
.da-right-empty > * { position: relative; z-index: 1; }
.da-right-empty :deep(svg) { color: var(--primary-100); opacity: 0.85; }
.da-right-empty--pending { border-color: color-mix(in srgb, var(--primary-100) 18%, var(--bg-300) 82%); }
.da-right-empty__badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 3px 10px; border-radius: 999px;
  background: rgba(17,17,17,0.06); color: var(--text-200);
  font-size: 11px; font-weight: 600;
}
.da-right-empty__title {
  margin: 0; font-size: 16px; font-weight: 600; color: var(--text-100);
}
.da-right-empty__desc {
  margin: 0; font-size: 13px; line-height: 1.7; color: var(--text-200);
}

/* #3 趋势图 — 固定高度，留空间给 AI 模块 */
.da-section--chart { flex: 0 0 auto; display: flex; flex-direction: column; }
.da-trend-chart { width: 100%; height: 200px; }

/* 趋势图标题内嵌省份样式 */
.da-trend-province { font-weight: 600; color: var(--primary-100); }
.da-trend-sep { color: var(--text-300); margin: 0 2px; font-weight: 400; }

/* #4 AI评价卡片 — flex:1 充分利用剩余空间 */
.da-section--ai { flex: 1 1 0; min-height: 100px; display: flex; flex-direction: column; }
.da-section--ai .ai-card { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.da-section--ai .ai-card__content { flex: 1; min-height: 0; max-height: none; overflow-y: auto; }
.ai-card {
  background: var(--bg-100);
  border: 1px solid var(--bg-300);
  border-radius: var(--radius-sm);
  padding: 12px 14px; display: flex; flex-direction: column;
}
.ai-card__header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
}
.ai-card__tag {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--accent-100, #2B4C6F);
  background: rgba(43,76,111,0.08); padding: 4px 10px; border-radius: var(--radius-sm);
}
.ai-card__page { font-size: 12px; color: var(--text-300); }
.ai-card__content {
  margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-200);
  max-height: 80px; overflow-y: auto;
}
.ai-card__nav {
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;
}
.ai-card__nav button {
  width: 32px; height: 32px; display: grid; place-items: center;
  background: var(--bg-200); border: 1px solid var(--bg-300);
  border-radius: var(--radius-sm); color: var(--text-200);
  cursor: pointer; transition: all 0.15s;
}
.ai-card__nav button:hover:not(:disabled) { border-color: var(--primary-100); color: var(--primary-100); }
.ai-card__nav button:disabled { opacity: 0.35; cursor: not-allowed; }

/* #7 查看图谱按钮 + 引导 */
.da-link-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 12px 0;
  background: var(--primary-100); border: none; color: #fff;
  font-family: inherit; font-size: 14px; font-weight: 600;
  letter-spacing: 0.02em; cursor: pointer; transition: all 0.3s;
  border-radius: var(--radius-sm);
}
.da-link-btn:hover { background: var(--primary-300, #5C1A00); }
.da-link-hint {
  margin: 6px 0 0; font-size: 12px; color: var(--text-300);
  text-align: center; line-height: 1.5;
}

.da-follow-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  width: auto; margin: 0 auto; padding: 6px 0;
  background: transparent; border: none; border-bottom: 1px dashed var(--bg-300);
  color: var(--text-300); font-family: inherit; font-size: 13px; font-weight: 500;
  letter-spacing: 0.01em; cursor: pointer; transition: all 0.2s;
}
.da-follow-btn:hover { border-bottom-color: var(--primary-100); color: var(--primary-100); }
.da-follow-btn--active {
  background: transparent;
  border-bottom-color: var(--primary-100);
  color: var(--primary-100);
}
.da-follow-btn--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  border-bottom-style: dotted;
}
.da-follow-btn--disabled:hover {
  color: var(--text-300);
  border-bottom-color: var(--bg-300);
}

/* 底部 CTA */
.da-bottom-cta {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(10px);
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  border: 1px solid rgba(196, 150, 30, 0.4);
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  z-index: 200;
  white-space: nowrap;
}
.da-bottom-cta__text { font-size: 13px; }
.da-bottom-cta__text strong { color: #C4961E; }
.da-bottom-cta__btn {
  display: flex; align-items: center; gap: 6px;
  background: var(--primary-100, #BB3418); color: #fff;
  border: none; border-radius: 999px;
  padding: 0.4rem 1rem; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
}
.da-bottom-cta__btn:hover { opacity: 0.88; }

.cta-slide-enter-active, .cta-slide-leave-active { transition: all 0.3s ease; }
.cta-slide-enter-from, .cta-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(1rem); }

/* ═══ 响应式 ═══ */
@media (max-width: 1199px) {
  .da-left { width: 208px; padding: 10px; }
  .da-right { width: 280px; padding: 10px; }
  .da-brand__title { font-size: 12px; }
}

@media (max-width: 1023px) {
  .da-left { display: none; }
  .da-right { width: 296px; }
}

@media (max-width: 767px) {
  .da-header { padding: 8px 12px; }
  .da-brand__title { font-size: 11px; letter-spacing: 0.06em; }
  .da-map-search-wrap { width: min(320px, 85%); top: 10px; }
  .da-map-search { padding: 3px 4px 3px 12px; }
  .da-map-search__input { font-size: 13px; padding: 6px 8px; }
  .da-map-search__btn { padding: 6px 12px; font-size: 12px; }
  .da-map-search__guide { display: none; }

  .da-body { flex-direction: column; }
  .da-map { flex: 1; }
  .da-bubble-wrap { flex-basis: 50%; padding: 8px 10px 0; }
  .da-bottom { flex-basis: 50%; flex-direction: column; }
  .da-salary-chart {
    flex: 0 0 180px;
    border-top: 1px solid var(--bg-300);
  }
  .da-map-inner {
    border-left: none;
    min-height: 220px;
  }
  .da-bottom--focus-map .da-map-inner {
    min-height: 260px;
  }
  .da-map-overlay {
    width: calc(100% - 24px);
    padding: 16px;
  }
  .da-bubble-job-tag {
    top: 10px; left: 10px; right: 10px; width: auto;
  }
  .da-right {
    width: 100%; height: auto; max-height: 45vh;
    border-left: none; border-top: 1px solid var(--bg-300);
    flex-shrink: 0;
  }
  .da-right-empty { padding: 20px 12px; margin: auto 0; }
  .da-trend-chart { height: 180px; }
}

/* ═══ AI 洞察标题行 ═══ */
.da-section__title--with-action {
  display: flex; align-items: center; justify-content: space-between;
}
.da-section__title-text {
  display: inline-flex; align-items: center; gap: 6px;
}
.da-ask-ai-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 999px;
  background: var(--primary-100); border: none;
  color: #fff; font-size: 11px; font-weight: 600;
  font-family: inherit; cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.da-ask-ai-btn:hover { background: var(--primary-300, #5C1A00); transform: scale(1.04); }

/* ═══ AI Drawer ═══ */
.ai-drawer :deep(.el-drawer) { background: var(--bg-100); }
.ai-drawer :deep(.el-drawer__body) { padding: 0; height: 100%; overflow: hidden; }
.ai-drawer__wrap {
  display: flex; flex-direction: column; height: 100%;
  background: var(--bg-100);
}
.ai-drawer__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--bg-300);
  flex-shrink: 0;
}
.ai-drawer__header-info { display: flex; align-items: center; gap: 10px; }
.ai-drawer__avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--primary-100); color: #fff;
  display: grid; place-items: center; flex-shrink: 0;
}
.ai-drawer__title { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-100); }
.ai-drawer__sub { margin: 2px 0 0; font-size: 11px; color: var(--text-300); }
.ai-drawer__close {
  background: none; border: none; cursor: pointer;
  color: var(--text-300); display: grid; place-items: center;
  padding: 4px; border-radius: var(--radius-sm);
  transition: color 0.15s, background 0.15s;
}
.ai-drawer__close:hover { color: var(--text-100); background: var(--bg-300); }

.ai-drawer__messages {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  display: flex; flex-direction: column; gap: 14px;
  scroll-behavior: smooth;
}
.ai-drawer__msg {
  display: flex; flex-direction: column; gap: 4px;
}
.ai-drawer__msg--user { align-items: flex-end; }
.ai-drawer__msg--ai  { align-items: flex-start; }
.ai-drawer__bubble {
  max-width: 82%;
  padding: 10px 14px; border-radius: 12px;
  font-size: 13px; line-height: 1.65; color: var(--text-100);
  white-space: pre-wrap; word-break: break-word;
}
.ai-drawer__msg--user .ai-drawer__bubble {
  background: var(--primary-100); color: #fff;
  border-bottom-right-radius: 4px;
}
.ai-drawer__msg--ai .ai-drawer__bubble {
  background: var(--bg-200); border: 1px solid var(--bg-300);
  border-bottom-left-radius: 4px;
}
.ai-drawer__bubble--typing {
  display: flex; align-items: center; gap: 5px; padding: 12px 16px;
}
.ai-drawer__bubble--typing span {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-300);
  animation: typing-dot 1.2s ease-in-out infinite;
}
.ai-drawer__bubble--typing span:nth-child(2) { animation-delay: 0.2s; }
.ai-drawer__bubble--typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-dot {
  0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
.ai-drawer__time {
  font-size: 10px; color: var(--text-300); margin-top: 2px;
}

.ai-drawer__quick {
  padding: 0 20px 12px;
  display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
}
.ai-drawer__quick-btn {
  text-align: left; background: var(--bg-200);
  border: 1px solid var(--bg-300); border-radius: var(--radius-sm);
  padding: 8px 12px; font-size: 12px; color: var(--text-200);
  font-family: inherit; cursor: pointer; transition: all 0.15s;
}
.ai-drawer__quick-btn:hover {
  border-color: var(--primary-100); color: var(--primary-100); background: rgba(139,37,0,0.04);
}

.ai-drawer__input-row {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--bg-300); flex-shrink: 0;
}
.ai-drawer__input {
  flex: 1; padding: 9px 14px;
  background: var(--bg-200); border: 1px solid var(--bg-300);
  border-radius: var(--radius-sm); font-family: inherit; font-size: 13px;
  color: var(--text-100); outline: none; transition: border-color 0.2s;
  min-width: 0;
}
.ai-drawer__input:focus { border-color: var(--primary-100); }
.ai-drawer__input::placeholder { color: var(--text-300); }
.ai-drawer__input:disabled { opacity: 0.6; cursor: not-allowed; }
.ai-drawer__send {
  width: 36px; height: 36px; border-radius: var(--radius-sm);
  background: var(--primary-100); border: none; color: #fff;
  display: grid; place-items: center; cursor: pointer;
  transition: background 0.2s, opacity 0.2s; flex-shrink: 0;
}
.ai-drawer__send:hover:not(:disabled) { background: var(--primary-300, #5C1A00); }
.ai-drawer__send:disabled { opacity: 0.4; cursor: not-allowed; }

/* ═══ 滚动条 ═══ */
.da-left::-webkit-scrollbar, .da-right::-webkit-scrollbar, .rank-list::-webkit-scrollbar { width: 3px; }
.da-left::-webkit-scrollbar-thumb, .da-right::-webkit-scrollbar-thumb, .rank-list::-webkit-scrollbar-thumb {
  background: rgba(139,37,0,0.12); border-radius: 2px;
}
.da-left::-webkit-scrollbar-track, .da-right::-webkit-scrollbar-track, .rank-list::-webkit-scrollbar-track { background: transparent; }
</style>
