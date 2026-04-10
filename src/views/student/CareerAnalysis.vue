<!-- 页面：职业分析 · 羊皮卷舆图；路由：student/career-analysis；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores'
import { useLearningStore } from '@/stores/learning'
import { gsap } from '@/plugins/gsap'
import { useCareerInsights, roleOptions, type CareerRole } from '@/composables/useCareerInsights'
import VChart from 'vue-echarts'
import { use, registerMap, graphic } from 'echarts/core'
import { BarChart, LineChart, MapChart, BoxplotChart, GraphChart, CustomChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TooltipComponent, GridComponent, GeoComponent, VisualMapComponent, DataZoomComponent, MarkPointComponent, GraphicComponent } from 'echarts/components'
import chinaJson from '@/assets/china.json'
import worldJson from '@/assets/world.json'
import parchmentBaseUrl from '@/assets/textures/parchment-base.jpg'

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

const isCurrentRoleFollowed = computed(() => learningStore.isTargetRole(targetRole.value))

function toggleFollowRole() {
  learningStore.toggleTargetRole(targetRole.value)
}

function goToNavigation() {
  router.push('/app/student/career-navigation')
}
const pageRef = ref<HTMLElement | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const roleSearch = ref('前端开发')
const selectedProvince = ref('四川省')
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
  if (!normalizedRole) return
  const displayRole = typeof roleParam === 'string' && roleParam.trim() ? roleParam.trim() : normalizedRole
  roleSearch.value = displayRole
  _baseProvinceData.value = getProvinceData(displayRole)
  selectedProvince.value = '四川省'
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
      position: 'right' as const,
      fontSize: idx === 2 ? 11 : 10,
      fontFamily: 'KaiTi, serif',
      color: medColors[idx],
      fontWeight: idx === 2 ? ('bold' as const) : ('normal' as const),
      offset: [4, 0] as [number, number],
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

    grid: { top: 28, left: '10%', right: '14%', bottom: 32 },

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
        regions: chinaRegions,
      },
    ],
    series: [{
      name: '需求量', type: 'map', geoIndex: 1,
      data: data, selectedMode: 'single', animation: true, animationDurationUpdate: 300
    }],
  }
})

/* ═══ 事件处理 ═══ */
function handleMapClick(params: any) {
  if (!params.name) return
  selectedProvince.value = params.name
  aiCommentPage.value = 0
}

function selectRankedProvince(name: string) {
  selectedProvince.value = name
  aiCommentPage.value = 0
}

function doSearch() {
  _baseProvinceData.value = getProvinceData(roleSearch.value)
  const normalizedRole = normalizeRouteRole(roleSearch.value)
  if (roleOptions.includes(normalizedRole as CareerRole)) {
    targetRole.value = normalizedRole as CareerRole
  }
  selectedProvince.value = '四川省'
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
  }
  doSearch()
}

function prevAiPage() { if (aiCommentPage.value > 0) aiCommentPage.value-- }
function nextAiPage() { if (aiCommentPage.value < aiComments.value.length - 1) aiCommentPage.value++ }

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
  const rightPanel = pageRef.value.querySelector('.da-right-content')
  if (rightPanel) {
    gsap.fromTo(rightPanel, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', clearProps: 'transform,opacity' })
  }
})

/* ═══ 气泡图数据 ═══ */

// ── 类型定义 ─────────────────────────────────────────────────
interface BubbleDomain {
  id: string
  name: string
  color: string
  jobs: string[]        // 该领域包含的岗位名称列表
  // 预留 API 扩展字段（接入时在此处解构）：
  // demandIndex?: number   // 岗位需求指数
  // avgSalary?: number     // 平均薪资中位数（K）
  // trendYoy?: number      // 同比增速（%）
}

// ── 模拟数据 ─────────────────────────────────────────────────
// TODO: 接入接口时替换此处，示例：
// const { data: domainList } = await useFetch<BubbleDomain[]>('/api/v1/career/domains')
const BUBBLE_DOMAINS: BubbleDomain[] = [
  {
    id: 'internet', name: '互联网/软件', color: '#8B2500',
    jobs: ['前端工程师', '后端工程师', '全栈工程师', '移动端开发', '测试工程师', 'DevOps工程师', '架构师', '产品经理'],
  },
  {
    id: 'ai', name: 'AI / 大数据', color: '#1B4E8B',
    jobs: ['机器学习工程师', '数据分析师', '算法工程师', 'NLP工程师', '数据工程师', '大模型工程师', '计算机视觉'],
  },
  {
    id: 'cloud', name: '云计算/运维', color: '#1A5C5C',
    jobs: ['云架构师', '网络工程师', '安全工程师', '数据库管理员', '容器化工程师', '运维工程师'],
  },
  {
    id: 'enterprise', name: '企业服务', color: '#3A6B3A',
    jobs: ['Java后端', 'ERP实施', '解决方案架构师', 'SaaS开发', '信息安全顾问', 'BI开发'],
  },
  {
    id: 'fintech', name: '金融科技', color: '#8B6914',
    jobs: ['量化工程师', '风控研发', '支付系统开发', '区块链开发', '金融数据分析'],
  },
  {
    id: 'game', name: '游戏/内容', color: '#6B3A6E',
    jobs: ['游戏客户端', '游戏服务端', '音视频开发', '虚拟现实', '游戏策划'],
  },
  {
    id: 'hardware', name: '硬件/制造', color: '#7A4A2A',
    jobs: ['嵌入式工程师', '芯片设计', '工业软件', '机器人工程师'],
  },
]

/* ═══ 圆打包工具函数 ═══ */
const SMALL_R = 14    // 小岗位气泡半径 px
const DOMAIN_PAD = 10 // 大气泡与内部小气泡之间的留白

// 力模拟：将 n 个半径为 r 的小圆打包在一起，返回各自坐标及外接圆半径
function packInside(count: number, r: number): { pos: { x: number; y: number }[]; outerR: number } {
  if (count === 0) return { pos: [], outerR: r + DOMAIN_PAD }
  if (count === 1) return { pos: [{ x: 0, y: 0 }], outerR: r + DOMAIN_PAD }
  const pos = Array.from({ length: count }, (_, i) => ({
    x: Math.cos(2 * Math.PI * i / count) * r * 1.2,
    y: Math.sin(2 * Math.PI * i / count) * r * 1.2,
  }))
  const gap = 2 // px gap between small bubbles
  for (let iter = 0; iter < 300; iter++) {
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const pi = pos[i]!, pj = pos[j]!
        const dx = pj.x - pi.x
        const dy = pj.y - pi.y
        let d = Math.sqrt(dx * dx + dy * dy)
        if (d < 0.1) d = 0.1
        const minD = r * 2 + gap
        if (d < minD) {
          const f = (minD - d) / d * 0.5
          pi.x -= dx * f; pi.y -= dy * f
          pj.x += dx * f; pj.y += dy * f
        }
      }
    }
    for (let i = 0; i < count; i++) { pos[i]!.x *= 0.992; pos[i]!.y *= 0.992 }
  }
  let maxDist = 0
  for (const p of pos) { const d = Math.sqrt(p.x * p.x + p.y * p.y) + r; if (d > maxDist) maxDist = d }
  return { pos, outerR: maxDist + DOMAIN_PAD }
}

// 力模拟：将若干不同半径的大圆排布为边缘相靠但不重叠
function packDomains(radii: number[]): { x: number; y: number }[] {
  const n = radii.length
  if (n === 0) return []
  if (n === 1) return [{ x: 0, y: 0 }]
  const pos = radii.map((_, i) => ({
    x: Math.cos(2 * Math.PI * i / n) * 100,
    y: Math.sin(2 * Math.PI * i / n) * 100,
  }))
  const domainGap = 4 // px gap between domain edges
  for (let iter = 0; iter < 600; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const pi = pos[i]!, pj = pos[j]!
        const dx = pj.x - pi.x
        const dy = pj.y - pi.y
        let d = Math.sqrt(dx * dx + dy * dy)
        if (d < 0.1) d = 0.1
        const minD = radii[i]! + radii[j]! + domainGap
        if (d < minD) {
          const f = (minD - d) / d * 0.5
          pi.x -= dx * f; pi.y -= dy * f
          pj.x += dx * f; pj.y += dy * f
        }
      }
    }
    for (let i = 0; i < n; i++) { pos[i]!.x *= 0.997; pos[i]!.y *= 0.997 }
  }
  return pos
}

const selectedJob = ref<{ id: string; name: string; domainColor: string; jobName?: string } | null>(null)

/* ═══ 气泡图 ECharts custom series ═══ */
const bubbleUpdateOptions = { notMerge: false, replaceMerge: [] as string[] }

// 预计算布局（仅依赖 BUBBLE_DOMAINS，不变化则不重算）
const _innerLayouts = BUBBLE_DOMAINS.map(d => packInside(d.jobs.length, SMALL_R))
const _domainRadii = _innerLayouts.map(l => l.outerR)
const _domainPositions = packDomains(_domainRadii)

// 展平所有岗位为独立数据项，供 series[1] 逐个点击
interface FlatJob { domainIdx: number; jobIdx: number; domainId: string; domainName: string; domainColor: string; jobName: string; absX: number; absY: number }
const _flatJobs: FlatJob[] = []
BUBBLE_DOMAINS.forEach((domain, di) => {
  const inner = _innerLayouts[di]!
  const dPos = _domainPositions[di]!
  domain.jobs.forEach((jobName, ji) => {
    const p = inner.pos[ji]!
    _flatJobs.push({ domainIdx: di, jobIdx: ji, domainId: domain.id, domainName: domain.name, domainColor: domain.color, jobName, absX: dPos.x + p.x, absY: dPos.y + p.y })
  })
})

const bubbleChartOption = computed(() => {
  const sel = selectedJob.value
  const selJobName = sel?.jobName ?? ''
  const selDomainId = sel?.id ?? ''

  return {
    backgroundColor: 'transparent',
    animation: true,
    tooltip: {
      show: true,
      trigger: 'item',
      backgroundColor: 'rgba(240,230,210,0.96)',
      borderColor: 'rgba(139,105,20,0.28)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#3E3020', fontSize: 12 },
      extraCssText: 'box-shadow:0 4px 16px rgba(62,48,32,0.18);border-radius:8px;',
    },
    series: [
      // ── Series 0: 大气泡背景（领域边界 + 领域名标签）──
      {
        type: 'custom' as const,
        coordinateSystem: 'none' as const,
        silent: true,
        z: 0,
        data: BUBBLE_DOMAINS.map((_, i) => ({ value: [i] })),
        renderItem: (_params: any, api: any) => {
          const idx = _params.dataIndex as number
          const domain = BUBBLE_DOMAINS[idx]!
          const R = _domainRadii[idx]!
          const dPos = _domainPositions[idx]!
          const isSelected = selDomainId === domain.id
          const w: number = api.getWidth()
          const h: number = api.getHeight()
          const cx = w / 2 + dPos.x
          const cy = h / 2 + dPos.y
          return {
            type: 'group', x: cx, y: cy,
            children: [
              {
                type: 'circle',
                shape: { cx: 0, cy: 0, r: R },
                style: {
                  fill: new graphic.RadialGradient(0.4, 0.35, 0.9, [
                    { offset: 0,   color: `${domain.color}10` },
                    { offset: 0.7, color: `${domain.color}18` },
                    { offset: 1,   color: `${domain.color}28` },
                  ]),
                  stroke: isSelected ? 'rgba(255,255,255,0.75)' : `${domain.color}44`,
                  lineWidth: isSelected ? 2.5 : 1,
                },
              },
              {
                type: 'text',
                style: {
                  text: domain.name, x: 0, y: -R - 6,
                  textAlign: 'center', textVerticalAlign: 'bottom',
                  fontSize: 12, fontWeight: 'bold' as const,
                  fill: domain.color, fontFamily: 'KaiTi, serif',
                  textShadowColor: 'rgba(255,255,255,0.7)', textShadowBlur: 3,
                },
              },
            ],
          }
        },
      },
      // ── Series 1: 小气泡（可点击岗位）──
      {
        type: 'custom' as const,
        coordinateSystem: 'none' as const,
        z: 1,
        data: _flatJobs.map((j, i) => ({ value: [i] })),
        tooltip: {
          formatter: (params: any) => {
            const job = _flatJobs[params.dataIndex as number]
            if (!job) return ''
            const sal = getJobSalaryData(job.jobName)
            return `<div style="font-weight:700;font-size:13px;margin-bottom:4px;color:${job.domainColor};font-family:KaiTi,serif">${job.jobName}</div>`
              + `<span style="opacity:.7">${job.domainName}</span><br/>`
              + `<span>初级 ${sal.junior}K · 中级 ${sal.mid}K · 高级 ${sal.senior}K</span>`
          },
        },
        renderItem: (_params: any, api: any) => {
          const idx = _params.dataIndex as number
          const job = _flatJobs[idx]!
          const w: number = api.getWidth()
          const h: number = api.getHeight()
          const cx = w / 2 + job.absX
          const cy = h / 2 + job.absY
          const isJobSelected = selJobName === job.jobName && selDomainId === job.domainId
          const isDomainSelected = selDomainId === job.domainId && !selJobName
          const highlighted = isJobSelected || isDomainSelected
          return {
            type: 'group', x: cx, y: cy,
            children: [
              {
                type: 'circle',
                shape: { cx: 0, cy: 0, r: isJobSelected ? SMALL_R + 2 : SMALL_R },
                style: {
                  fill: new graphic.RadialGradient(0.35, 0.3, 0.75, [
                    { offset: 0,   color: `${job.domainColor}${highlighted ? 'DD' : 'BB'}` },
                    { offset: 0.6, color: `${job.domainColor}${highlighted ? 'EE' : 'DD'}` },
                    { offset: 1,   color: `${job.domainColor}FF` },
                  ]),
                  stroke: isJobSelected ? 'rgba(255,255,255,0.9)' : 'transparent',
                  lineWidth: isJobSelected ? 2 : 0,
                  shadowBlur: isJobSelected ? 12 : 5,
                  shadowColor: `${job.domainColor}${isJobSelected ? '90' : '50'}`,
                },
              },
              {
                type: 'text',
                style: {
                  text: job.jobName, x: 0, y: 0,
                  textAlign: 'center', textVerticalAlign: 'middle',
                  fontSize: isJobSelected ? 9 : 8,
                  fontWeight: isJobSelected ? 'bold' as const : 'normal' as const,
                  fill: 'rgba(255,255,255,0.92)',
                  fontFamily: 'KaiTi, serif',
                  truncate: { outerWidth: SMALL_R * 2 - 2, ellipsis: '..' },
                },
              },
            ],
          }
        },
      },
    ],
  }
})

function handleBubbleClick(params: any) {
  // series 1 = 小气泡岗位层
  if (params.seriesIndex === 1) {
    const idx = params.dataIndex as number
    const job = _flatJobs[idx]
    if (!job) return
    selectedJob.value = { id: job.domainId, name: job.domainName, domainColor: job.domainColor, jobName: job.jobName }
    roleSearch.value = job.jobName
    doSearch()
  }
}

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
})

watch(() => route.query.role, (val) => {
  applyRouteRole(val)
})

onBeforeUnmount(() => { gsapCtx?.revert() })
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
          <div class="da-section__title"><Icon icon="lucide:activity" :width="14" />全国概览 · {{ roleSearch }}</div>
          <div class="kpi-card" @mouseenter="showSalaryTip = true" @mouseleave="showSalaryTip = false">
            <div class="kpi-label">平均中位薪资 <Icon icon="lucide:info" :width="11" class="kpi-info-icon" /></div>
            <div class="kpi-val"><span class="kpi-num">{{ nationalKpi.avgSalary }}</span><span class="kpi-unit">K</span></div>
            <div class="kpi-tag kpi-tag--up">{{ nationalKpi.growthRate }}</div>
            <div class="kpi-tooltip kpi-tooltip--right" v-show="showSalaryTip">
              <div class="tooltip-header">数据来源与说明</div>
              <div class="tooltip-body">
                <p>• 提取自过去一年各大招聘平台的 <strong>12万+</strong> 真实岗位数据。</p>
                <p>• 算法去除了极值（前5%与后5%），取中位数以反映真实水平。</p>
                <p>• 样本包含：腾讯、阿里、字节等大厂及数千家中小型企业。</p>
              </div>
              <div class="tooltip-footer">数据截止：2026-03</div>
            </div>
          </div>
          <div class="kpi-card" @mouseenter="showDemandTip = true" @mouseleave="showDemandTip = false">
            <div class="kpi-label">岗位需求总量 <Icon icon="lucide:info" :width="11" class="kpi-info-icon" /></div>
            <div class="kpi-val"><span class="kpi-num">{{ nationalKpi.demandTotal.toLocaleString() }}</span></div>
            <div class="kpi-tooltip kpi-tooltip--right" v-show="showDemandTip">
              <div class="tooltip-header">需求指数说明</div>
              <div class="tooltip-body">
                <p>• 综合计算了在线岗位的发布频率、招聘周期及企业活跃度。</p>
                <p>• 涵盖全网 <strong>25个</strong> 主流招聘渠道去重后的岗位需求。</p>
              </div>
              <div class="tooltip-footer">数据截止：2026-03</div>
            </div>
          </div>
        </div>

        <!-- #9 省份排行 (需求/薪资双榜切换) -->
        <div class="da-section da-section--ranking">
          <div class="da-section__title">
            <Icon icon="lucide:trophy" :width="14" />
            <span>TOP 10</span>
            <span class="rank-mode-label">需求指数</span>
          </div>
          <div class="rank-list">
            <div
              v-for="p in provinceRanking" :key="p.name"
              class="rank-item"
              :class="{ 'rank-item--active': selectedProvince === p.name }"
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
          <div class="da-bubble-job-tag" v-if="selectedJob">
            <Icon icon="lucide:briefcase" :width="12" />
            <b :style="{ color: selectedJob.domainColor }">{{ selectedJob.jobName || selectedJob.name }}</b>
            <span class="da-bubble-job-tag__domain">{{ selectedJob.name }}</span>
          </div>
          <div class="da-bubble-job-tag da-bubble-job-tag--empty" v-else>
            <Icon icon="lucide:mouse-pointer-click" :width="12" />
            <span>点击气泡选择岗位</span>
          </div>
          <VChart
            class="da-bubble-vchart"
            :option="bubbleChartOption"
            :update-options="bubbleUpdateOptions"
            @click="handleBubbleClick"
            autoresize
          />
        </div>

        <!-- 下半：薪资柱状图 + 地图 -->
        <div class="da-bottom">
          <!-- 左：省份中位薪资排行（全岗位滑动） -->
          <div class="da-salary-chart">
            <div class="da-section__title da-section__title--sm">
              <Icon icon="lucide:list-ordered" :width="12" />{{ selectedProvince }} · 中位薪资排行（K/月）
            </div>
            <VChart class="da-salary-vchart" :option="salaryChartOption" autoresize />
          </div>

          <!-- 右：卷轴风格地图（卷边用伪元素实现，保持 ECharts 扁平 DOM） -->
          <div class="da-map-inner" ref="scrollRef">
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
            <div class="da-pin-legend da-pin-legend--sm">
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
            <div class="da-map__hint da-map__hint--sm">
              <span class="da-map__hint-dot"></span>
              <span><b>{{ roleSearch }}</b> · 点击省份</span>
            </div>
          </div>

        </div>
      </main>

      <!-- 右面板 -->
      <aside class="da-right">
        <div v-if="selectedProvince" class="da-right-content">
          <!-- 省份对标图 -->
          <div class="da-section da-section--chart">
            <div class="da-section__title">
              <Icon icon="lucide:git-compare" :width="14" />
              <span class="da-trend-province">{{ selectedProvince }}</span>
              <span class="da-trend-sep">·</span>
              薪资水平对标
            </div>
            <VChart class="da-trend-chart" :option="compareOption" autoresize />
          </div>

          <!-- #4 AI 评价模块（可翻页） -->
          <div class="da-section da-section--ai">
            <div class="da-section__title">
              <Icon icon="lucide:sparkles" :width="14" />AI 市场洞察
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
              <span>查看「{{ roleSearch }}」能力图谱</span>
              <Icon icon="lucide:arrow-right" :width="12" />
            </button>
            <p class="da-link-hint">基于当前搜索岗位，查看所需技能和学习路径</p>
          </div>

          <!-- 关注此方向 -->
          <div class="da-section">
            <button
              class="da-follow-btn"
              :class="{ 'da-follow-btn--active': isCurrentRoleFollowed }"
              @click="toggleFollowRole"
            >
              <Icon :icon="isCurrentRoleFollowed ? 'lucide:bookmark-check' : 'lucide:bookmark'" :width="14" />
              <span>{{ isCurrentRoleFollowed ? '已关注 · 取消' : '关注此方向' }}</span>
            </button>
            <p class="da-link-hint">关注后会出现在心仪岗位，也可继续前往职途导航做匹配分析</p>
          </div>
        </div>

        <!-- 未选中提示 -->
        <div v-else class="da-right-empty">
          <Icon icon="lucide:map" :width="36" />
          <p>点击地图上的省份</p>
          <p>查看岗位洞察与AI分析</p>
        </div>
      </aside>
    </div>

    <!-- 底部 CTA：已关注方向时出现 -->
    <Transition name="cta-slide">
      <div v-if="learningStore.targetRoles.length > 0" class="da-bottom-cta">
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
  font-family: var(--font-title), sans-serif;
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
.da-header__left { display: flex; align-items: center; gap: 14px; }
.da-header__center { flex: 1; display: flex; align-items: center; justify-content: center; }
.da-header__right { display: flex; align-items: center; gap: 16px; }

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
  position: absolute; top: 8px; left: 10px; z-index: 5;
  display: flex; align-items: center; gap: 6px;
  background: rgba(245,245,243,0.88); backdrop-filter: blur(6px);
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 16px; padding: 4px 12px 4px 10px;
  font-size: 12px; font-family: var(--font-title), sans-serif;
  color: var(--text-200); letter-spacing: 0.04em;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
  pointer-events: none;
}
.da-bubble-job-tag b { font-size: 13px; font-weight: 600; }
.da-bubble-job-tag__domain { font-size: 11px; color: var(--text-300); margin-left: 1px; }
.da-bubble-job-tag__domain::before { content: '('; }
.da-bubble-job-tag__domain::after { content: ')'; }
.da-bubble-job-tag--empty {
  color: var(--text-300); font-style: italic; font-size: 11px;
  opacity: 0.75;
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
  width: 280px; flex-shrink: 0;
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
  background: var(--bg-100);
  border-bottom: 1px solid var(--bg-300);
  padding: 4px 8px 0;
  overflow: hidden;
}
.da-bubble-vchart {
  width: 100%; height: 100%;
  display: block;
}

/* 下半：地图 + 薪资图 */
.da-bottom {
  flex: 0 0 50%; min-height: 0;
  display: flex; overflow: hidden;
}

/* 下半左：卷轴风格地图容器 */
.da-map-inner {
  flex: 1; min-width: 0; position: relative;
  border-left: 1px solid var(--bg-300);
  overflow: hidden;
}
/* 左右卷轴边（用伪元素模拟，不影响 ECharts DOM） */
.da-map-inner::before,
.da-map-inner::after {
  content: ''; position: absolute; top: 0; bottom: 0; width: 14px; z-index: 5; pointer-events: none;
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
  filter: saturate(0.5) brightness(1.12) contrast(0.95);
}
/* 四角暗角 */
.da-map-inner__vignette {
  position: absolute; inset: 0; z-index: 4; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 45%, rgba(62,48,32,0.15) 100%);
}
.da-map-inner .da-map__chart {
  position: absolute; inset: 0; z-index: 1; mix-blend-mode: multiply;
}

/* 下半右：薪资柱状图 */
.da-salary-chart {
  flex: 1; min-width: 0;
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
  display: flex; flex-direction: column; gap: 4px;
  background: var(--bg-200);
  border-left: 1px solid var(--bg-300);
  overflow-y: hidden; padding: 16px;
}
.da-right-content { display: flex; flex-direction: column; gap: 4px; height: 100%; }
.da-right-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  color: var(--text-300); text-align: center;
}
.da-right-empty p { margin: 0; font-size: 15px; }

/* #3 趋势图 — 固定高度，留空间给 AI 模块 */
.da-section--chart { flex: 0 0 auto; display: flex; flex-direction: column; }
.da-trend-chart { width: 100%; height: 220px; }

/* 趋势图标题内嵌省份样式 */
.da-trend-province { font-weight: 600; color: var(--primary-100); }
.da-trend-sep { color: var(--text-300); margin: 0 2px; font-weight: 400; }

/* #4 AI评价卡片 — flex:1 充分利用剩余空间 */
.da-section--ai { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; }
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
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 12px 0;
  background: var(--bg-200); border: 1.5px solid var(--bg-300);
  color: var(--text-200); font-family: inherit; font-size: 14px; font-weight: 600;
  letter-spacing: 0.02em; cursor: pointer; transition: all 0.3s;
  border-radius: var(--radius-sm);
}
.da-follow-btn:hover { border-color: var(--primary-100); color: var(--primary-100); }
.da-follow-btn--active {
  background: rgba(187,52,24,0.1);
  border-color: var(--primary-100);
  color: var(--primary-100);
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
  .da-left { width: 210px; padding: 10px; }
  .da-right { width: 260px; padding: 10px; }
  .da-brand__title { font-size: 12px; }
}

@media (max-width: 1023px) {
  .da-left { display: none; }
  .da-right { width: 280px; }
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
  .da-right {
    width: 100%; height: auto; max-height: 45vh;
    border-left: none; border-top: 1px solid var(--bg-300);
    flex-shrink: 0;
  }
  .da-right-empty { padding: 16px 0; }
  .da-trend-chart { height: 180px; }
}

/* ═══ 滚动条 ═══ */
.da-left::-webkit-scrollbar, .da-right::-webkit-scrollbar, .rank-list::-webkit-scrollbar { width: 3px; }
.da-left::-webkit-scrollbar-thumb, .da-right::-webkit-scrollbar-thumb, .rank-list::-webkit-scrollbar-thumb {
  background: rgba(139,37,0,0.12); border-radius: 2px;
}
.da-left::-webkit-scrollbar-track, .da-right::-webkit-scrollbar-track, .rank-list::-webkit-scrollbar-track { background: transparent; }
</style>
