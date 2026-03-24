<!-- 页面：职业分析 · 羊皮卷舆图；路由：student/career-analysis；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores'
import { gsap } from '@/plugins/gsap'
import { useCareerInsights } from '@/composables/useCareerInsights'
import VChart from 'vue-echarts'
import { use, registerMap } from 'echarts/core'
import { BarChart, LineChart, MapChart, BoxplotChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TooltipComponent, GridComponent, GeoComponent, VisualMapComponent } from 'echarts/components'
import chinaJson from '@/assets/china.json'
import worldJson from '@/assets/world.json'
import parchmentBaseUrl from '@/assets/textures/parchment-base.jpg'

use([BarChart, LineChart, MapChart, BoxplotChart, CanvasRenderer,
  TooltipComponent, GridComponent, GeoComponent, VisualMapComponent])
registerMap('china', chinaJson as any)
registerMap('world', worldJson as any)

/* ═══ 古籍浅色配色 (与 theme.css 统一) ═══ */
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
  parchment: '#F0E6D2',
  parchmentDark: '#D4C4A8',
  mapBorder: 'rgba(139,37,0,0.18)',
}

/* ═══ 省份简称映射 ═══ */
function shortName(name: string): string {
  return name
    .replace(/壮族|回族|维吾尔/g, '')
    .replace(/(自治区|特别行政区|省|市)$/g, '')
}

/* ═══ 省份模拟数据（含薪资中位数） ═══ */
type ProvinceItem = { name: string; value: number; salary: number }
function getProvinceData(_role: string): ProvinceItem[] {
  return [
    { name: '北京市', value: 95, salary: 18.2 }, { name: '天津市', value: 62, salary: 11.5 },
    { name: '河北省', value: 45, salary: 9.8 }, { name: '山西省', value: 32, salary: 8.5 },
    { name: '内蒙古自治区', value: 28, salary: 8.0 }, { name: '辽宁省', value: 48, salary: 10.2 },
    { name: '吉林省', value: 30, salary: 8.3 }, { name: '黑龙江省', value: 33, salary: 8.6 },
    { name: '上海市', value: 92, salary: 19.5 }, { name: '江苏省', value: 78, salary: 14.8 },
    { name: '浙江省', value: 82, salary: 16.2 }, { name: '安徽省', value: 42, salary: 9.5 },
    { name: '福建省', value: 55, salary: 12.0 }, { name: '江西省', value: 35, salary: 8.8 },
    { name: '山东省', value: 58, salary: 11.0 }, { name: '河南省', value: 50, salary: 10.0 },
    { name: '湖北省', value: 60, salary: 12.5 }, { name: '湖南省', value: 48, salary: 10.3 },
    { name: '广东省', value: 98, salary: 17.8 }, { name: '广西壮族自治区', value: 35, salary: 8.8 },
    { name: '海南省', value: 25, salary: 9.2 }, { name: '重庆市', value: 52, salary: 11.8 },
    { name: '四川省', value: 65, salary: 13.5 }, { name: '贵州省', value: 38, salary: 8.5 },
    { name: '云南省', value: 30, salary: 8.2 }, { name: '西藏自治区', value: 8, salary: 7.5 },
    { name: '陕西省', value: 50, salary: 11.2 }, { name: '甘肃省', value: 22, salary: 7.8 },
    { name: '青海省', value: 12, salary: 7.2 }, { name: '宁夏回族自治区', value: 18, salary: 7.5 },
    { name: '新疆维吾尔自治区', value: 20, salary: 7.8 }, { name: '台湾省', value: 40, salary: 13.0 },
    { name: '香港特别行政区', value: 70, salary: 22.5 }, { name: '澳门特别行政区', value: 28, salary: 15.0 },
  ]
}

function getTrendData(_province: string, _role: string) {
  const quarters = ['Q1','Q2','Q3','Q4','Q1','Q2','Q3','Q4']
  const boxData = quarters.map((_, i) => {
    const base = 8 + Math.random() * 5 + i * 0.5
    const min = +(base - Math.random() * 2).toFixed(1)
    const q1 = +(base + Math.random() * 1.5).toFixed(1)
    const median = +(q1 + Math.random() * 2 + 1).toFixed(1)
    const q3 = +(median + Math.random() * 3 + 1).toFixed(1)
    const max = +(q3 + Math.random() * 4 + 2).toFixed(1)
    return [min, q1, median, q3, max]
  })
  const salaryData = boxData.map(v => v[2])
  const demandData = quarters.map(() => Math.round(80 + Math.random() * 150))
  return { quarters, boxData, salaryData, demandData }
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
const router = useRouter()
const userStore = useUserStore()
const pageRef = ref<HTMLElement | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const roleSearch = ref('前端开发')
const selectedProvince = ref('四川省')
const compareProvince = ref('')
const scrollRevealed = ref(false)
const showSalaryTip = ref(false)
const showDemandTip = ref(false)
let gsapCtx: ReturnType<typeof gsap.context> | null = null

const { targetRole, insights } = useCareerInsights()

const timelineYears = ['2020', '2021', '2022', '2023', '2024', '2025', '2026']
const currentYearIndex = ref(timelineYears.length - 1)
const currentYear = computed(() => timelineYears[currentYearIndex.value])
const totalScrolls = 3
const currentScroll = computed(() => {
  const len = timelineYears.length
  if (currentYearIndex.value < Math.ceil(len / 3)) return 1
  if (currentYearIndex.value < Math.ceil(len * 2 / 3)) return 2
  return 3
})
const scrollLabel = computed(() => `卷${currentScroll.value}/${totalScrolls}`)

/* ═══ #9 排行榜双模式 ═══ */
const rankMode = ref<'demand' | 'salary'>('demand')

/* ═══ #4 AI评价翻页 ═══ */
const aiCommentPage = ref(0)
const aiComments = computed(() => {
  if (!selectedProvince.value) return []
  return getAiComments(selectedProvince.value, roleSearch.value)
})
const currentAiComment = computed(() => aiComments.value[aiCommentPage.value] || null)

const _baseProvinceData = ref(getProvinceData(roleSearch.value))
const provinceData = computed(() => {
  const data = _baseProvinceData.value
  const factor = 1 - (timelineYears.length - 1 - currentYearIndex.value) * 0.1
  return data.map(d => ({ ...d, value: Math.floor(d.value * factor), salary: +(d.salary * factor).toFixed(1) }))
})

/* ═══ KPI 数据 ═══ */
const nationalKpi = computed(() => {
  const factor = 1 - (timelineYears.length - 1 - currentYearIndex.value) * 0.1
  return {
    avgSalary: +(14.5 * factor).toFixed(1),
    demandTotal: Math.floor(12580 * factor),
    growthRate: currentYearIndex.value === 0 ? '-' : '+12.5%',
  }
})

/* ═══ #9 省份排行 Top10 (需求/薪资双榜) ═══ */
const provinceRanking = computed(() => {
  const sorted = [...provinceData.value].sort((a, b) =>
    rankMode.value === 'salary' ? b.salary - a.salary : b.value - a.value
  )
  return sorted.slice(0, 10).map((p, i) => ({
    ...p, rank: i + 1,
    shortName: p.name.replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔)/g, ''),
    displayValue: rankMode.value === 'salary' ? p.salary : p.value,
    barPercent: rankMode.value === 'salary'
      ? Math.round((p.salary / 25) * 100)
      : p.value,
  }))
})

/* ═══ 地图配置 — 羊皮卷风格 ═══ */
const vchartRef = ref<any>(null)
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

const trendRaw = ref(getTrendData('四川省', roleSearch.value))
const trendCompareRaw = ref(getTrendData('', roleSearch.value))

const trendOption = computed(() => {
  const td = trendRaw.value
  const tc = trendCompareRaw.value
  const isCompare = !!compareProvince.value
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(247,242,232,0.96)', borderColor: C.panelBorder,
      textStyle: { color: C.textPrimary, fontSize: 11 },
      axisPointer: { type: 'cross', crossStyle: { color: C.textMuted } }
    },
    legend: {
      data: isCompare ? [selectedProvince.value, compareProvince.value] : ['薪资分布', '中位薪资', '需求量'],
      bottom: 6, textStyle: { color: C.textSecondary, fontSize: 10 },
      icon: 'roundRect', itemWidth: 10, itemHeight: 6,
    },
    grid: { top: 25, left: '12%', right: '12%', bottom: 56 },
    xAxis: {
      type: 'category', data: td.quarters,
      axisLabel: { color: C.textSecondary, fontSize: 10 },
      axisLine: { lineStyle: { color: C.panelBorder } },
    },
    yAxis: [
      { type: 'value', name: '薪资(K)', nameTextStyle: { color: C.zhusha, fontSize: 10 },
        axisLabel: { color: C.textSecondary, fontSize: 10 },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(139,37,0,0.08)' } } },
      { type: 'value', name: '需求', nameTextStyle: { color: C.green, fontSize: 10 },
        axisLabel: { color: C.textSecondary, fontSize: 10 }, splitLine: { show: false } },
    ],
    series: isCompare ? [
      { name: selectedProvince.value, type: 'boxplot', yAxisIndex: 0, data: td.boxData,
        itemStyle: { color: 'rgba(139,37,0,0.15)', borderColor: C.zhusha, borderWidth: 1.5 }, boxWidth: ['20%', '35%'] },
      { name: compareProvince.value, type: 'boxplot', yAxisIndex: 0, data: tc.boxData,
        itemStyle: { color: 'rgba(91,140,90,0.3)', borderColor: C.green, borderWidth: 1.5 }, boxWidth: ['20%', '35%'] },
    ] : [
      { name: '薪资分布', type: 'boxplot', yAxisIndex: 0, data: td.boxData,
        itemStyle: { color: 'rgba(139,37,0,0.12)', borderColor: C.zhusha, borderWidth: 1.2 }, boxWidth: ['30%', '50%'] },
      { name: '中位薪资', type: 'line', yAxisIndex: 0, z: 5, data: td.salaryData, smooth: true,
        itemStyle: { color: C.zhusha }, symbol: 'circle', symbolSize: 5,
        lineStyle: { width: 2, type: 'dashed', shadowColor: 'rgba(139,37,0,0.4)', shadowBlur: 6 } },
      { name: '需求量', type: 'bar', yAxisIndex: 1, data: td.demandData, barWidth: '35%',
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(91,140,90,0.6)' }, { offset: 1, color: 'rgba(91,140,90,0.08)' }] },
          borderRadius: [2, 2, 0, 0] } },
    ],
  }
})

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
      backgroundColor: 'rgba(240,230,210,0.85)',
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
  if (window.event && (window.event as MouseEvent).shiftKey && selectedProvince.value) {
    if (params.name !== selectedProvince.value) compareProvince.value = params.name
  } else {
    selectedProvince.value = params.name
    compareProvince.value = ''
  }
  aiCommentPage.value = 0
  trendRaw.value = getTrendData(selectedProvince.value, roleSearch.value)
  if (compareProvince.value) trendCompareRaw.value = getTrendData(compareProvince.value, roleSearch.value)
}

function selectRankedProvince(name: string) {
  selectedProvince.value = name
  compareProvince.value = ''
  aiCommentPage.value = 0
  trendRaw.value = getTrendData(name, roleSearch.value)
}

function doSearch() {
  _baseProvinceData.value = getProvinceData(roleSearch.value)
  targetRole.value = roleSearch.value as any
  selectedProvince.value = '四川省'
  compareProvince.value = ''
  aiCommentPage.value = 0
}

function switchYear(idx: number) {
  currentYearIndex.value = idx
  if (selectedProvince.value) trendRaw.value = getTrendData(selectedProvince.value, roleSearch.value)
  if (compareProvince.value) trendCompareRaw.value = getTrendData(compareProvince.value, roleSearch.value)
  animateKpiNumbers()
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

onMounted(async () => {
  await nextTick()
  setupEntranceAnimation()
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
      <div class="da-header__center"></div>
      <!-- #6 右上角头像+姓名+身份 -->
      <div class="da-header__right">
        <span class="da-year-label">{{ scrollLabel }}</span>
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
            <div class="rank-toggle">
              <button :class="{ active: rankMode === 'demand' }" @click="rankMode = 'demand'">需求</button>
              <button :class="{ active: rankMode === 'salary' }" @click="rankMode = 'salary'">薪资</button>
            </div>
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
              <span class="rank-val">{{ rankMode === 'salary' ? p.displayValue + 'K' : p.displayValue }}</span>
            </div>
          </div>
        </div>

        <!-- #10 年份选择器 — 滑块 -->
        <div class="da-section">
          <div class="da-section__title"><Icon icon="lucide:calendar" :width="14" />数据年份</div>
          <div class="year-slider">
            <input
              type="range" :min="0" :max="timelineYears.length - 1"
              :value="currentYearIndex"
              @input="switchYear(Number(($event.target as HTMLInputElement).value))"
              class="year-slider__input"
            />
            <div class="year-slider__labels">
              <span v-for="(y, i) in timelineYears" :key="y"
                :class="{ active: currentYearIndex === i }">{{ y }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中央地图 — #1 羊皮卷底图 + 污渍叠加 + ECharts 地图 -->
      <main class="da-map">
        <div class="da-scroll-wrap" ref="scrollRef">
          <div class="da-parchment">
            <div class="da-parchment__edge da-parchment__edge--left"></div>
            <div class="da-parchment__body">
              <!-- 底层：羊皮纸基底 -->
              <img :src="parchmentBaseUrl" class="da-parchment__base" alt="" draggable="false" />
              <!-- ECharts 地图层（半透明填充，让底图透出） -->
              <VChart
                ref="vchartRef"
                class="da-map__chart"
                :option="mapOption"
                :init-options="mapInitOptions"
                :update-options="mapUpdateOptions"
                @click="handleMapClick"
                autoresize
              />
              <!-- 四角暗角晕影 -->
              <div class="da-parchment__vignette"></div>
              <!-- 地图内搜索栏 -->
              <div class="da-map-search-wrap">
                <div class="da-map-search">
                  <Icon icon="lucide:compass" :width="16" class="da-map-search__icon" />
                  <input v-model="roleSearch" class="da-map-search__input" placeholder="输入你感兴趣的岗位，如: 前端开发、数据分析" @keyup.enter="doSearch" />
                  <button class="da-map-search__btn" @click="doSearch">
                    <Icon icon="lucide:search" :width="14" />
                    <span>探寻</span>
                  </button>
                </div>
                <p class="da-map-search__guide">↑ 输入职业后回车，地图将展示全国各省的薪资与需求分布</p>
              </div>
              <!-- #2 图钉式需求图例 -->
              <div class="da-pin-legend">
                <div class="pin-legend__list">
                  <div class="pin-item" :class="{ active: activeLevel === 4 }" @click="highlightMapLevel(4)">
                    <div class="pin" style="--pin-color: #8B5E14;"><div class="pin__head"></div><div class="pin__needle"></div></div>
                    <span class="pin-label">极高 (&gt;60)</span>
                  </div>
                  <div class="pin-item" :class="{ active: activeLevel === 3 }" @click="highlightMapLevel(3)">
                    <div class="pin" style="--pin-color: #a67c52;"><div class="pin__head"></div><div class="pin__needle"></div></div>
                    <span class="pin-label">高 (41-60)</span>
                  </div>
                  <div class="pin-item" :class="{ active: activeLevel === 2 }" @click="highlightMapLevel(2)">
                    <div class="pin" style="--pin-color: #c4a878;"><div class="pin__head"></div><div class="pin__needle"></div></div>
                    <span class="pin-label">中 (21-40)</span>
                  </div>
                  <div class="pin-item" :class="{ active: activeLevel === 1 }" @click="highlightMapLevel(1)">
                    <div class="pin" style="--pin-color: #ddd0b8;"><div class="pin__head"></div><div class="pin__needle"></div></div>
                    <span class="pin-label">低 (≤20)</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="da-parchment__edge da-parchment__edge--right"></div>
          </div>
        </div>
        <div class="da-map__hint">
          <span class="da-map__hint-dot"></span>
          <span>当前查看：<b>{{ roleSearch }}</b> · 点击省份查看薪资与需求详情 · Shift+点击对比</span>
        </div>
      </main>

      <!-- 右面板 -->
      <aside class="da-right">
        <div v-if="selectedProvince" class="da-right-content">
          <!-- 省份标题 -->
          <div class="da-section">
            <div class="da-section__title">
              <Icon icon="lucide:map-pin" :width="14" />
              {{ selectedProvince }}
              <span v-if="compareProvince" class="da-vs">vs {{ compareProvince }}</span>
            </div>
          </div>

          <!-- #3 趋势图 — 固定高度完全显示 -->
          <div class="da-section da-section--chart">
            <div class="da-section__title"><Icon icon="lucide:bar-chart-3" :width="14" />薪资与需求趋势</div>
            <VChart class="da-trend-chart" :option="trendOption" autoresize />
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
        </div>

        <!-- 未选中提示 -->
        <div v-else class="da-right-empty">
          <Icon icon="lucide:map" :width="36" />
          <p>点击地图上的省份</p>
          <p>查看岗位洞察与AI分析</p>
        </div>
      </aside>
    </div>
  </div>
</template>
<style scoped>
/* ═══ 大屏根容器 ═══ */
.da-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-100, #F7F2E8);
  color: var(--text-100, #1A1410);
  font-family: var(--font-title), 'KaiTi', serif;
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
  background: var(--bg-200, #EDE5D6);
  border-bottom: 1px solid var(--bg-300, #D4C9B5);
  flex-shrink: 0;
}
.da-header__left { display: flex; align-items: center; gap: 14px; }
.da-header__center { flex: 1; }
.da-header__right { display: flex; align-items: center; gap: 16px; }

.da-back {
  display: inline-flex; align-items: center; gap: 4px;
  background: transparent; border: 1px solid var(--bg-300);
  color: var(--primary-100, #8B2500); padding: 6px 12px; font-family: inherit; font-size: 14px;
  cursor: pointer; transition: all 0.2s ease; border-radius: var(--radius-sm, 2px);
}
.da-back:hover { border-color: var(--primary-100); background: rgba(139,37,0,0.06); }

.da-brand { display: flex; align-items: center; gap: 8px; }
.da-brand__icon {
  width: 32px; height: 32px; display: grid; place-items: center;
  border: 1.5px solid var(--primary-100); color: var(--primary-100); font-size: 16px; font-weight: 900;
  transform: rotate(-3deg);
}
.da-brand__title {
  font-size: 16px; font-weight: 700; letter-spacing: 0.15em; color: var(--text-100);
  white-space: nowrap;
}

/* 地图内浮动搜索栏 */
.da-map-search-wrap {
  position: absolute; top: 16px; left: 50%; transform: translateX(-50%); z-index: 10;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  width: min(440px, 62%);
}
.da-map-search {
  display: flex; align-items: center; gap: 0; width: 100%;
  background: rgba(240,230,210,0.85); backdrop-filter: blur(10px) saturate(1.2);
  border: 1px solid rgba(139,105,20,0.25);
  border-radius: 28px; padding: 4px 6px 4px 16px;
  box-shadow: 0 2px 12px rgba(62,48,32,0.12), inset 0 1px 0 rgba(255,255,255,0.4);
  transition: all 0.3s ease;
}
.da-map-search:focus-within {
  border-color: rgba(139,105,20,0.5);
  box-shadow: 0 4px 20px rgba(62,48,32,0.18), inset 0 1px 0 rgba(255,255,255,0.4);
  background: rgba(240,230,210,0.94);
}
.da-map-search__guide {
  margin: 0; font-size: 12px; color: rgba(62,48,32,0.55);
  font-family: var(--font-title), KaiTi, serif; font-style: italic;
  letter-spacing: 0.04em; text-align: center;
  background: rgba(240,230,210,0.7); padding: 3px 14px; border-radius: 12px;
  backdrop-filter: blur(4px); animation: guideFlicker 3s ease-in-out infinite;
}
@keyframes guideFlicker {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
.da-map-search__icon { color: rgba(139,105,20,0.5); flex-shrink: 0; transition: color 0.2s; }
.da-map-search:focus-within .da-map-search__icon { color: rgba(139,105,20,0.8); }
.da-map-search__input {
  flex: 1; background: transparent; border: none; padding: 8px 12px;
  font-family: inherit; font-size: 14px; color: #3E3020; outline: none;
  min-width: 0; letter-spacing: 0.03em;
}
.da-map-search__input::placeholder { color: rgba(107,90,66,0.5); font-style: italic; }
.da-map-search__btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(107,90,66,0.15); border: none; color: #5A4A36;
  padding: 7px 18px; font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.08em; transition: all 0.2s;
  border-radius: 22px;
}
.da-map-search__btn:hover { background: rgba(139,105,20,0.25); color: #3E3020; }

.da-year-label {
  font-size: 18px; font-weight: 700; color: var(--primary-100);
  letter-spacing: 0.08em; font-variant-numeric: tabular-nums;
}

/* #6 用户信息 */
.da-user-info { display: flex; align-items: center; gap: 10px; }
.da-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: grid; place-items: center; color: #fff;
  font-size: 15px; font-weight: 700;
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
  font-size: 14px; font-weight: 700; color: var(--primary-100);
  letter-spacing: 0.08em; margin-bottom: 10px;
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
  color: var(--primary-100); font-weight: 700;
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
  width: 280px; background: rgba(247,242,232,0.96); backdrop-filter: blur(4px);
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
.kpi-tip__title { font-weight: 700; color: var(--text-100); margin-bottom: 6px; margin-top: 8px; }
.kpi-tip__title:first-child { margin-top: 0; }
.kpi-tip__row { display: flex; justify-content: space-between; padding: 4px 0; }
.kpi-tip__date { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--bg-300); color: var(--text-300); font-size: 12px; }

/* 排行榜 */
.da-section--ranking { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.rank-toggle {
  margin-left: auto; display: flex; gap: 0; border: 1px solid var(--bg-300); border-radius: var(--radius-sm); overflow: hidden;
}
.rank-toggle button {
  padding: 4px 12px; font-size: 12px; font-family: inherit; border: none;
  background: var(--bg-100); color: var(--text-300); cursor: pointer; transition: all 0.15s;
}
.rank-toggle button.active {
  background: var(--primary-100); color: #fff;
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
  font-size: 12px; font-weight: 700; color: var(--text-300);
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

/* #10 年份滑块 */
.year-slider { padding: 8px 0; }
.year-slider__input {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 6px; border-radius: 3px;
  background: var(--bg-300); outline: none; cursor: pointer;
}
.year-slider__input::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--primary-100); border: 2px solid var(--bg-100);
  box-shadow: 0 1px 4px rgba(26,20,16,0.2); cursor: pointer;
}
.year-slider__labels {
  display: flex; justify-content: space-between; margin-top: 8px;
  font-size: 13px; color: var(--text-300);
}
.year-slider__labels span.active { color: var(--primary-100); font-weight: 700; }

/* ═══ 中央地图 — 羊皮卷 ═══ */
.da-map {
  flex: 1; min-width: 0; position: relative;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-300);
  z-index: 1;
}
.da-scroll-wrap {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  padding: 8px;
}
.da-parchment {
  display: flex; width: 100%; height: 100%;
  filter: drop-shadow(0 4px 20px rgba(62,48,32,0.25));
}
.da-parchment__edge {
  width: 20px; flex-shrink: 0; position: relative;
}
.da-parchment__edge--left {
  background: linear-gradient(90deg, #9C8B78 0%, #B8A990 40%, #C8BBAA 100%);
  border-radius: 6px 0 0 6px;
  box-shadow: inset -3px 0 8px rgba(62,48,32,0.15);
}
.da-parchment__edge--right {
  background: linear-gradient(270deg, #9C8B78 0%, #B8A990 40%, #C8BBAA 100%);
  border-radius: 0 6px 6px 0;
  box-shadow: inset 3px 0 8px rgba(62,48,32,0.15);
}
.da-parchment__body {
  flex: 1; position: relative; overflow: hidden;
  border-top: 1px solid rgba(139,105,20,0.25);
  border-bottom: 1px solid rgba(139,105,20,0.25);
}
.da-parchment__body::after {
  content: ''; position: absolute; inset: 0; z-index: 5; pointer-events: none;
  opacity: 0.04;
  filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E#n");
  background: rgba(120,100,70,0.5);
}
.da-parchment__base {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; z-index: 0; pointer-events: none;
  filter: saturate(0.5) brightness(1.12) contrast(0.95);
}
.da-parchment__vignette {
  position: absolute; inset: 0; z-index: 4; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 45%, rgba(62,48,32,0.15) 100%);
}

/* 图钉式图例 */
.da-pin-legend {
  position: absolute; left: 14px; top: 38%; transform: translateY(-50%); z-index: 6;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  pointer-events: none;
}
.pin-legend__title {
  font-size: 11px; font-weight: 700; color: #3E3020; letter-spacing: 0.1em;
  background: rgba(240,230,210,0.88); padding: 3px 10px; border-radius: 10px;
  backdrop-filter: blur(4px); border: 1px solid rgba(139,105,20,0.2);
  text-align: center; pointer-events: auto; white-space: nowrap;
}
.pin-legend__list {
  display: flex; flex-direction: column; gap: 4px; align-items: center;
  pointer-events: auto;
}
.pin-item {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer; position: relative; padding: 3px 4px;
  border-radius: 6px; transition: background 0.2s;
}
.pin-item:hover { background: rgba(240,230,210,0.6); }
.pin-item.active { background: rgba(240,230,210,0.85); }

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
  font-size: 10px; color: rgba(62,48,32,0.6); white-space: nowrap;
  opacity: 0; transform: translateX(-3px);
  transition: opacity 0.2s, transform 0.2s;
  pointer-events: none;
}
.pin-item:hover .pin-label { opacity: 1; transform: translateX(0); color: #5A3E1B; }
.pin-item.active .pin-label { opacity: 1; transform: translateX(0); color: var(--primary-100, #8B2500); font-weight: 600; }
.da-map__chart { width: 100%; height: 100%; position: relative; z-index: 1; mix-blend-mode: multiply; }
.da-map__hint {
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px; z-index: 6;
  font-size: 12px; color: #3E3020; padding: 6px 14px;
  background: rgba(240,230,210,0.88); border: 1px solid rgba(139,105,20,0.25);
  border-radius: 20px; backdrop-filter: blur(4px); white-space: nowrap;
}
.da-map__hint b { color: var(--primary-100, #8B2500); }
.da-map__hint-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: #8B5E14; animation: hintPulse 2s ease-in-out infinite;
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
  overflow-y: auto; padding: 16px;
}
.da-right-content { display: flex; flex-direction: column; gap: 4px; height: 100%; }
.da-right-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  color: var(--text-300); text-align: center;
}
.da-right-empty p { margin: 0; font-size: 15px; }
.da-vs { font-size: 13px; color: #5B7744; margin-left: 8px; }

/* #3 趋势图 — 调整高度使能完全显示，并增加占比 */
.da-section--chart { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.da-trend-chart { width: 100%; height: 100%; min-height: 280px; }

/* #4 AI评价卡片 — 降低高度 */
.da-section--ai { flex: 0 0 auto; display: flex; flex-direction: column; }
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
  font-size: 13px; font-weight: 700; color: var(--accent-100, #2B4C6F);
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
  font-family: inherit; font-size: 14px; font-weight: 700;
  letter-spacing: 0.08em; cursor: pointer; transition: all 0.2s;
  border-radius: var(--radius-sm);
}
.da-link-btn:hover { background: var(--primary-300, #5C1A00); }
.da-link-hint {
  margin: 6px 0 0; font-size: 12px; color: var(--text-300);
  text-align: center; line-height: 1.5;
}

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
