<!-- 页面：职途导航 · 简历导入；路由：student/career-navigation；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'
import { useUserStore } from '@/stores'
import { useResumeStore } from '@/stores/resume'
import { useLearningStore } from '@/stores/learning'
import { getCareerInsightsMock, roleOptions } from '@/composables/useCareerInsights'
import type { CareerRole } from '@/composables/useCareerInsights'

const router = useRouter()
const userStore = useUserStore()
const resumeStore = useResumeStore()
const learningStore = useLearningStore()

type ParsePhase = 'idle' | 'parsing' | 'done'

const pageRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const pasteText = ref('')
const uploadedFileName = ref('')
const parsePhase = ref<ParsePhase>('idle')
const parseProgress = ref(0)
const parseMsg = ref('')
const selectedDirection = ref<CareerRole | ''>('')

const ACCEPTED_MIME = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/pdf',
  'text/plain',
].join(',')

let gsapCtx: ReturnType<typeof gsap.context> | null = null

function setupEntrance() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  gsapCtx = gsap.context(() => {
    gsap.fromTo('.rp-header', { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' })
    gsap.fromTo('.rp-editorial', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 })
    gsap.fromTo('.rp-left', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out', delay: 0.05 })
    gsap.fromTo('.rp-right', { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 })
  }, pageRef.value!)
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function handleFile(file: File) {
  uploadedFileName.value = file.name
  pasteText.value = ''
}

function detectRoleFromText(text: string): CareerRole {
  const t = text.toLowerCase()
  if (/机器学习|深度学习|pytorch|tensorflow|ml|ai|算法/.test(t)) return '机器学习工程师'
  if (/python|数据分析|sql|bi|pandas|数据仓库|etl/.test(t)) return '数据分析'
  if (/测试|playwright|selenium|jest|自动化测试|qa/.test(t)) return '测试开发'
  if (/java|spring|mysql|redis|后端|backend|mybatis|golang|go/.test(t)) return '后端开发'
  if (selectedDirection.value) return selectedDirection.value
  return '前端开发'
}

const PARSE_MSGS = [
  '正在读取文档结构…',
  '提取技能关键词…',
  '分析工作经历…',
  '匹配职业方向…',
  '生成能力画像数据…',
  '解析完成',
]

async function startParse() {
  const input = pasteText.value.trim() || uploadedFileName.value
  if (!input) return

  parsePhase.value = 'parsing'
  parseProgress.value = 0
  resumeStore.reset()

  const step = 100 / PARSE_MSGS.length
  for (let i = 0; i < PARSE_MSGS.length; i++) {
    parseMsg.value = PARSE_MSGS[i]!
    await new Promise<void>(r => {
      gsap.to(parseProgress, {
        value: (i + 1) * step,
        duration: 0.35 + Math.random() * 0.3,
        ease: 'power1.inOut',
        onComplete: r,
      })
    })
    await new Promise(r => setTimeout(r, 280 + Math.random() * 220))
  }

  const text = pasteText.value || uploadedFileName.value
  const role = detectRoleFromText(text)
  const insights = getCareerInsightsMock(role)

  resumeStore.setResult({
    rawText: pasteText.value,
    fileName: uploadedFileName.value,
    insights,
    skills: insights.skillGraph.nodes.slice(0, 12).map(n => ({
      name: n.name,
      weight: n.heat / 100,
      category: n.category,
    })),
  })

  await nextTick()
  parsePhase.value = 'done'

  // 短暂停留后跳转画像页
  await new Promise(r => setTimeout(r, 600))
  router.push({ name: 'student-career-portrait' })
}

function goBack() {
  router.push({ name: 'student-career' })
}

function resetPage() {
  parsePhase.value = 'idle'
  pasteText.value = ''
  uploadedFileName.value = ''
  parseProgress.value = 0
  if (fileInputRef.value) fileInputRef.value.value = ''
}

/* ═══ 占位：roadmapMap 保留供 Step 3（career-path）使用 ═══
type Stage = { id: string; level: number; name: string; alias: string; years: string; salary: string; salaryNum: [number,number]; icon: string; skills: string[]; milestones: string[]; status: 'completed'|'current'|'locked' }
═══════════════════════════════════════════════════════════ */

onMounted(async () => {
  await nextTick()
  if (resumeStore.draftText) {
    pasteText.value = resumeStore.draftText
    resumeStore.clearDraftText()
  }
})

onBeforeUnmount(() => {
  gsapCtx?.revert()
})

/* ═══ 注释保留（Step 3 用）: roadmapMap 原有数据已移除，如需恢复请查看 Git 历史 ═══ */

/* ═══ 星图交互数据 ═══ */
interface SkillFreq  { name: string; pct: number }
interface CityDist   { city: string; pct: number }
interface EduBadge   { level: string; primary?: boolean }
interface JobItem    { title: string; company: string; city: string; edu: string; skills: string[]; date: string }

interface OrbitNode {
  key: string; label: string; icon: string; jobs: number
  latestDate: string; nc: string; nbg: string
  x: string; y: string
  popDir: 'above' | 'below' | 'left' | 'right'
  labelDir: 'above' | 'below' | 'left' | 'right'
  iconSize: number; sx2: number; sy2: number; sm?: boolean
  skillFreqs: SkillFreq[]
  cityDists:  CityDist[]
  eduDist:    EduBadge[]
  jobItems:   JobItem[]
}

const ORBIT_NODES: OrbitNode[] = [
  {
    key: 'internet', label: '互联网', icon: 'lucide:globe', jobs: 2847, latestDate: '03-28',
    nc: '#8B2500', nbg: 'rgba(139,37,0,0.22)', x: '50%', y: '30.8%',
    popDir: 'below', labelDir: 'above', iconSize: 13, sx2: 260, sy2: 160,
    skillFreqs: [{ name: 'Java', pct: 68 }, { name: 'Python', pct: 54 }, { name: 'Vue3', pct: 47 }, { name: 'SQL', pct: 42 }],
    cityDists:  [{ city: '北京', pct: 38 }, { city: '上海', pct: 31 }, { city: '深圳', pct: 18 }, { city: '其他', pct: 13 }],
    eduDist: [{ level: '本科', primary: true }, { level: '硕士' }, { level: '博士' }],
    jobItems: [
      { title: '高级Java后端工程师', company: '字节跳动', city: '北京', edu: '本科', skills: ['Java', 'Spring', 'Redis'], date: '03-28' },
      { title: '前端开发工程师', company: '阿里巴巴', city: '杭州', edu: '本科', skills: ['Vue3', 'TypeScript', 'Webpack'], date: '03-27' },
      { title: '算法工程师', company: '百度', city: '北京', edu: '硕士', skills: ['Python', 'PyTorch', 'NLP'], date: '03-26' },
      { title: '数据开发工程师', company: '腾讯', city: '深圳', edu: '本科', skills: ['Python', 'Spark', 'SQL'], date: '03-25' },
      { title: 'DevOps工程师', company: '美团', city: '北京', edu: '本科', skills: ['Docker', 'Kubernetes', 'CI/CD'], date: '03-24' },
      { title: '后端技术专家', company: '滴滴出行', city: '北京', edu: '本科', skills: ['Java', 'MySQL', '微服务'], date: '03-23' },
    ],
  },
  {
    key: 'finance', label: '金融', icon: 'lucide:trending-up', jobs: 1623, latestDate: '03-27',
    nc: '#8B6914', nbg: 'rgba(139,105,20,0.22)', x: '66.7%', y: '59.6%',
    popDir: 'left', labelDir: 'right', iconSize: 13, sx2: 347, sy2: 310,
    skillFreqs: [{ name: 'Java', pct: 72 }, { name: 'SQL', pct: 65 }, { name: 'Python', pct: 48 }, { name: 'C++', pct: 31 }],
    cityDists:  [{ city: '上海', pct: 52 }, { city: '北京', pct: 28 }, { city: '深圳', pct: 12 }, { city: '其他', pct: 8 }],
    eduDist: [{ level: '本科' }, { level: '硕士', primary: true }, { level: '博士' }],
    jobItems: [
      { title: '量化研究员', company: '华泰证券', city: '上海', edu: '硕士', skills: ['Python', '数学建模', '金融衍生品'], date: '03-27' },
      { title: '风控系统工程师', company: '蚂蚁集团', city: '上海', edu: '本科', skills: ['Java', '风控模型', 'SQL'], date: '03-26' },
      { title: 'Java开发工程师', company: '中国银行', city: '北京', edu: '本科', skills: ['Java', 'Spring', 'Oracle'], date: '03-25' },
      { title: '数据分析师', company: '平安科技', city: '深圳', edu: '本科', skills: ['Python', 'SQL', 'Tableau'], date: '03-24' },
      { title: '金融IT架构师', company: '招商银行', city: '上海', edu: '硕士', skills: ['Java', '微服务', '分布式'], date: '03-23' },
    ],
  },
  {
    key: 'medical', label: '医疗', icon: 'lucide:heart-pulse', jobs: 892, latestDate: '03-26',
    nc: '#4A8B6A', nbg: 'rgba(74,139,106,0.22)', x: '33.3%', y: '59.6%',
    popDir: 'right', labelDir: 'left', iconSize: 13, sx2: 173, sy2: 310,
    skillFreqs: [{ name: 'Python', pct: 61 }, { name: 'SQL', pct: 55 }, { name: 'Java', pct: 44 }, { name: '医学AI', pct: 28 }],
    cityDists:  [{ city: '北京', pct: 35 }, { city: '上海', pct: 32 }, { city: '成都', pct: 15 }, { city: '其他', pct: 18 }],
    eduDist: [{ level: '本科' }, { level: '硕士', primary: true }, { level: '博士' }],
    jobItems: [
      { title: '医学影像AI算法工程师', company: '联影医疗', city: '上海', edu: '硕士', skills: ['Python', '深度学习', '医学影像'], date: '03-26' },
      { title: '医疗信息系统开发', company: '阿里健康', city: '杭州', edu: '本科', skills: ['Java', 'HIS', 'SQL'], date: '03-25' },
      { title: '临床数据分析师', company: '药明康德', city: '上海', edu: '硕士', skills: ['Python', 'SAS', '统计分析'], date: '03-24' },
      { title: '数字疗法工程师', company: '丁香园', city: '北京', edu: '本科', skills: ['Python', 'Java', '健康数据'], date: '03-23' },
      { title: '医疗大数据开发', company: '卫宁健康', city: '上海', edu: '本科', skills: ['Java', 'Hadoop', 'MySQL'], date: '03-22' },
    ],
  },
  {
    key: 'manufacture', label: '制造', icon: 'lucide:factory', jobs: 1204, latestDate: '03-28',
    nc: '#9A7B4E', nbg: 'rgba(154,123,78,0.22)', x: '77.5%', y: '34.2%',
    popDir: 'left', labelDir: 'right', iconSize: 13, sx2: 403, sy2: 178,
    skillFreqs: [{ name: 'C/C++', pct: 74 }, { name: 'Java', pct: 52 }, { name: 'AUTOSAR', pct: 38 }, { name: 'Python', pct: 31 }],
    cityDists:  [{ city: '上海', pct: 34 }, { city: '苏州', pct: 22 }, { city: '武汉', pct: 18 }, { city: '其他', pct: 26 }],
    eduDist: [{ level: '本科', primary: true }, { level: '硕士' }, { level: '博士' }],
    jobItems: [
      { title: '嵌入式软件工程师(AUTOSAR)', company: '联合汽车电子(UAES)', city: '上海', edu: '硕士', skills: ['C/C++', 'AUTOSAR', 'CAN总线'], date: '03-28' },
      { title: '工业自动化软件开发', company: '华为工业', city: '深圳', edu: '本科', skills: ['C/C++', 'PLC', 'Modbus'], date: '03-25' },
      { title: '智能制造系统架构师', company: '西门子中国', city: '苏州', edu: '硕士', skills: ['Java', 'MES', '工业物联网'], date: '03-24' },
      { title: '机器视觉工程师', company: '海康威视', city: '杭州', edu: '本科', skills: ['C++', 'OpenCV', 'Python'], date: '03-23' },
      { title: '功能安全工程师', company: '博世中国', city: '上海', edu: '硕士', skills: ['C/C++', 'ISO26262', 'AUTOSAR'], date: '03-22' },
      { title: '数字孪生开发工程师', company: '三一重工', city: '长沙', edu: '本科', skills: ['Java', '数字孪生', 'Unity3D'], date: '03-20' },
    ],
  },
  {
    key: 'education', label: '教育', icon: 'lucide:graduation-cap', jobs: 734, latestDate: '03-27',
    nc: '#4A6B8A', nbg: 'rgba(74,107,138,0.22)', x: '50%', y: '81.7%',
    popDir: 'above', labelDir: 'below', iconSize: 13, sx2: 260, sy2: 425,
    skillFreqs: [{ name: 'Java', pct: 63 }, { name: 'Vue3', pct: 54 }, { name: 'MySQL', pct: 48 }, { name: 'Python', pct: 36 }],
    cityDists:  [{ city: '北京', pct: 45 }, { city: '上海', pct: 25 }, { city: '成都', pct: 15 }, { city: '其他', pct: 15 }],
    eduDist: [{ level: '本科', primary: true }, { level: '硕士' }, { level: '博士' }],
    jobItems: [
      { title: '在线教育平台后端工程师', company: '好未来', city: '北京', edu: '本科', skills: ['Java', 'Spring', 'MySQL'], date: '03-27' },
      { title: '前端开发工程师', company: '网易有道', city: '北京', edu: '本科', skills: ['Vue3', 'TypeScript', 'H5'], date: '03-26' },
      { title: 'AI自适应学习算法', company: '猿辅导', city: '北京', edu: '硕士', skills: ['Python', 'NLP', '知识图谱'], date: '03-25' },
      { title: '数据分析工程师', company: '跟谁学', city: '北京', edu: '本科', skills: ['Python', 'SQL', 'Tableau'], date: '03-24' },
      { title: '技术产品经理', company: '掌门教育', city: '上海', edu: '本科', skills: ['Java', '产品设计', '用户增长'], date: '03-22' },
    ],
  },
  {
    key: 'retail', label: '零售', icon: 'lucide:shopping-bag', jobs: 612, latestDate: '03-24',
    nc: '#8A5B4E', nbg: 'rgba(138,91,78,0.22)', x: '22.5%', y: '34.2%',
    popDir: 'right', labelDir: 'left', iconSize: 13, sx2: 117, sy2: 178,
    skillFreqs: [{ name: 'Java', pct: 69 }, { name: 'MySQL', pct: 55 }, { name: 'Python', pct: 46 }, { name: 'Golang', pct: 32 }],
    cityDists:  [{ city: '上海', pct: 44 }, { city: '深圳', pct: 28 }, { city: '杭州', pct: 16 }, { city: '其他', pct: 12 }],
    eduDist: [{ level: '本科', primary: true }, { level: '硕士' }, { level: '博士' }],
    jobItems: [
      { title: '电商平台Java工程师', company: '唯品会', city: '广州', edu: '本科', skills: ['Java', 'Spring Cloud', 'Redis'], date: '03-24' },
      { title: '大数据开发工程师', company: '盒马鲜生', city: '上海', edu: '本科', skills: ['Java', 'Flink', 'Hive'], date: '03-23' },
      { title: '推荐算法工程师', company: '京东零售', city: '北京', edu: '硕士', skills: ['Python', '机器学习', 'TensorFlow'], date: '03-22' },
      { title: '供应链系统架构师', company: '名创优品', city: '广州', edu: '本科', skills: ['Java', '微服务', '分布式'], date: '03-21' },
      { title: '全栈工程师', company: '叮咚买菜', city: '上海', edu: '本科', skills: ['Vue3', 'Java', 'MySQL'], date: '03-20' },
    ],
  },
  {
    key: 'logistics', label: '物流', icon: 'lucide:truck', jobs: 481, latestDate: '03-23',
    nc: '#6A7A5B', nbg: 'rgba(106,122,91,0.18)', x: '80%', y: '20%',
    popDir: 'left', labelDir: 'right', iconSize: 12, sx2: 416, sy2: 104, sm: true,
    skillFreqs: [{ name: 'Java', pct: 71 }, { name: 'Python', pct: 42 }, { name: 'GIS', pct: 38 }, { name: 'Golang', pct: 34 }],
    cityDists:  [{ city: '上海', pct: 36 }, { city: '北京', pct: 28 }, { city: '武汉', pct: 20 }, { city: '其他', pct: 16 }],
    eduDist: [{ level: '本科', primary: true }, { level: '硕士' }, { level: '博士' }],
    jobItems: [
      { title: '物流算法工程师', company: '菜鸟网络', city: '杭州', edu: '硕士', skills: ['Python', '运筹优化', 'GIS'], date: '03-23' },
      { title: '地图数据后端工程师', company: '顺丰科技', city: '深圳', edu: '本科', skills: ['Java', 'GIS', '空间计算'], date: '03-22' },
      { title: '智能配送系统开发', company: '京东物流', city: '北京', edu: '本科', skills: ['Java', 'Golang', 'Redis'], date: '03-21' },
      { title: '大数据运营平台开发', company: '申通快递', city: '上海', edu: '本科', skills: ['Java', 'Hadoop', 'Spark'], date: '03-20' },
      { title: '仓储自动化控制系统', company: '极智嘉', city: '北京', edu: '本科', skills: ['C/C++', 'ROS', 'Python'], date: '03-19' },
    ],
  },
  {
    key: 'construction', label: '建筑', icon: 'lucide:building-2', jobs: 376, latestDate: '03-22',
    nc: '#8A7A5B', nbg: 'rgba(138,122,91,0.18)', x: '20%', y: '80%',
    popDir: 'right', labelDir: 'left', iconSize: 12, sx2: 104, sy2: 416, sm: true,
    skillFreqs: [{ name: 'C#', pct: 58 }, { name: 'SQL', pct: 52 }, { name: 'BIM', pct: 46 }, { name: 'Python', pct: 28 }],
    cityDists:  [{ city: '北京', pct: 32 }, { city: '上海', pct: 28 }, { city: '广州', pct: 22 }, { city: '其他', pct: 18 }],
    eduDist: [{ level: '本科', primary: true }, { level: '硕士' }, { level: '博士' }],
    jobItems: [
      { title: 'BIM开发工程师', company: '广联达科技', city: '北京', edu: '本科', skills: ['C#', 'BIM', 'Revit SDK'], date: '03-22' },
      { title: '建筑信息化平台工程师', company: '碧桂园', city: '广州', edu: '本科', skills: ['Java', 'BIM', 'GIS'], date: '03-21' },
      { title: '建筑AI算法工程师', company: '品茗科技', city: '杭州', edu: '硕士', skills: ['Python', '计算机视觉', 'BIM'], date: '03-20' },
      { title: '智慧工地系统开发', company: '中建科技', city: '北京', edu: '本科', skills: ['Java', 'IoT', 'GIS'], date: '03-19' },
      { title: '工程数字化软件工程师', company: '鲁班软件', city: '上海', edu: '本科', skills: ['C#', '.NET', 'SQL Server'], date: '03-18' },
    ],
  },
]

const hoveredKey = ref<string | null>(null)
const clickedKey = ref<string | null>(null)

function handleNodeClick(key: string) {
  clickedKey.value = clickedKey.value === key ? null : key
}
function closeJobPanel() {
  clickedKey.value = null
}

const clickedNode = computed(() => ORBIT_NODES.find(n => n.key === clickedKey.value) ?? null)

const panelStyle = computed(() => {
  const node = clickedNode.value
  if (!node) return {}
  const xPct = parseFloat(node.x)   // e.g. 66.7
  const yPct = parseFloat(node.y)   // e.g. 59.6
  const panelH = 78                  // panel height as % of orbital-field
  const gap = 2                      // margin from edge (%)
  const topRaw = yPct - panelH / 2
  const topClamped = Math.max(gap, Math.min(topRaw, 100 - panelH - gap))
  const onLeft = xPct > 55           // node is on right → panel slides from left
  return {
    top: `${topClamped}%`,
    height: `${panelH}%`,
    bottom: 'auto',
    ...(onLeft
      ? { left: '8px',  right: 'auto' }
      : { right: '8px', left: 'auto'  }),
  }
})

const centerStatusText = computed(() => {
  if (parsePhase.value === 'parsing') return '解析中…'
  if (parsePhase.value === 'done') {
    const top1 = resumeStore.matchedCareers[0]?.role ?? '前端开发'
    return `已匹配 ${top1} 等 ${resumeStore.matchedCareers.length} 个方向`
  }
  return '探索 8 个行业 · 9,849 岗位'
})

function getMatchPct(key: string): number {
  if (parsePhase.value !== 'done' || !resumeStore.matchedCareers.length) return 0
  const map: Record<string, string[]> = {
    internet:     ['前端开发', '后端开发', '测试开发', '机器学习工程师'],
    finance:      ['数据分析', '后端开发'],
    medical:      ['数据分析', '机器学习工程师'],
    manufacture:  ['后端开发', '测试开发'],
    education:    ['前端开发', '后端开发'],
    retail:       ['后端开发', '数据分析'],
    logistics:    ['后端开发', '数据分析'],
    construction: ['后端开发'],
  }
  const relevant = map[key] ?? []
  const scores = resumeStore.matchedCareers.filter(c => relevant.includes(c.role)).map(c => c.score)
  if (!scores.length) return 18
  return Math.round(Math.max(...scores) * 100)
}

</script>

<template>
  <div class="rp-page" ref="pageRef">

    <!-- HEADER -->
    <header class="rp-header">
      <div class="rp-header__left">
        <button class="rp-back" @click="goBack"><Icon icon="lucide:arrow-left" :width="14"/><span>返回</span></button>
        <span class="rp-brand-name">职途导航</span>
      </div>
      <div class="rp-header__center"><div class="rp-header-tag">简历导入</div></div>
      <div class="rp-header__right">
        <div class="rp-avatar">{{ userStore.currentUser?.name?.substring(0, 1) || '学' }}</div>
        <span class="rp-username">{{ userStore.currentUser?.name || '同学' }}</span>
      </div>
    </header>

    <!-- WORKSPACE -->
    <div class="rp-workspace">

      <!-- LEFT: Editorial + Upload -->
      <div class="rp-left">

        <!-- Editorial headline -->
        <div class="rp-editorial">
          <span class="rp-greeting">
            {{ (() => { const h = new Date().getHours(); return h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好' })() }}，{{ userStore.currentUser?.name || '同学' }}
          </span>
          <h1 class="rp-display-title">
            <span class="rp-dt-a">找到你</span>
            <span class="rp-dt-b">在职场宇宙中</span>
            <span class="rp-dt-c">的坐标</span>
          </h1>
          <p class="rp-data-proof">
            <span>近万条真实岗位</span><em class="rp-sep">·</em>
            <span>全行业覆盖</span><em class="rp-sep">·</em>
            <span>全国各省市</span>
          </p>
        </div>

        <!-- Step indicator (compact inline) -->
        <div class="rp-steps-inline-row">
        <div class="rp-steps-inline">
          <div class="rp-si-step rp-si-step--active">
            <span class="rp-si-dot"></span>
            <span class="rp-si-num">01</span>
            <span class="rp-si-name">简历导入</span>
          </div>
          <span class="rp-si-line"></span>
          <div class="rp-si-step">
            <span class="rp-si-dot"></span>
            <span class="rp-si-num">02</span>
            <span class="rp-si-name">能力画像</span>
          </div>
          <span class="rp-si-line"></span>
          <div class="rp-si-step">
            <span class="rp-si-dot"></span>
            <span class="rp-si-num">03</span>
            <span class="rp-si-name">职业路径</span>
          </div>
        </div>
        <!-- 没有简历提示入口 -->
        <div class="rp-no-resume-hint" @click="router.push({ name: 'student-resume-builder' })">
          <Icon icon="lucide:help-circle" :width="13" class="rp-no-resume-hint__icon"/>
          <span>没有简历</span>
          <div class="rp-no-resume-hint__tip">没有简历？点击快速制作简历吧！</div>
        </div>
        </div><!-- /.rp-steps-inline-row -->

        <!-- IDLE 态 -->
        <div v-if="parsePhase === 'idle'" class="rp-idle-form">
          <div
            class="rp-drop-zone"
            :class="{ 'rp-drop-zone--over': isDragOver }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="onDrop"
            @click="triggerFileInput"
          >
            <input ref="fileInputRef" type="file" :accept="ACCEPTED_MIME" class="rp-file-input" @change="onFileChange" />
            <div class="rp-drop-corner rp-drop-corner--tl"></div>
            <div class="rp-drop-corner rp-drop-corner--tr"></div>
            <div class="rp-drop-corner rp-drop-corner--bl"></div>
            <div class="rp-drop-corner rp-drop-corner--br"></div>
            <div class="rp-drop-body">
              <div class="rp-drop-icon-wrap">
                <Icon icon="lucide:file-up" :width="20" class="rp-drop-icon" />
              </div>
              <p class="rp-drop-title">{{ uploadedFileName || '拖入简历文件' }}</p>
              <p class="rp-drop-formats">doc &nbsp;·&nbsp; pdf &nbsp;·&nbsp; ppt &nbsp;·&nbsp; txt</p>
            </div>
          </div>

          <div class="rp-or-row">
            <span class="rp-or-line"></span>
            <span class="rp-or-text">或粘贴文字</span>
            <span class="rp-or-line"></span>
          </div>

          <textarea
            class="rp-textarea"
            v-model="pasteText"
            placeholder="粘贴简历内容：工作经历、掌握技能、项目描述…"
            rows="3"
          />

          <!-- 方向预选 tiles -->
          <div class="rp-dir-section">
            <p class="rp-dir-label">偏好方向 <span class="rp-dir-hint">（可选，辅助分析）</span></p>
            <div class="rp-dir-tiles">
              <button
                v-for="(r, i) in roleOptions"
                :key="r"
                class="rp-dir-tile"
                :class="{ 'rp-dir-tile--active': selectedDirection === r }"
                @click="selectedDirection = selectedDirection === r ? '' : r"
              >
                <Icon :icon="(['lucide:monitor','lucide:server','lucide:bug','lucide:bar-chart-2','lucide:cpu'])[i] || 'lucide:briefcase'" :width="14" class="rp-dir-tile__icon" />
                <span class="rp-dir-tile__name">{{ r }}</span>
              </button>
            </div>
          </div>

          <button class="rp-parse-btn" :disabled="!pasteText.trim() && !uploadedFileName" @click="startParse">
            <span>查看个人能力画像</span>
            <Icon icon="lucide:arrow-right" :width="15" class="rp-parse-btn__arrow" />
          </button>
        </div>

        <!-- PARSING 态 -->
        <div v-else-if="parsePhase === 'parsing'" class="rp-loading-wrap">
            <div class="rp-loading-seal">
              <Icon icon="lucide:loader-circle" :width="34" class="rp-loading-spin" />
            </div>
            <p class="rp-loading-msg">{{ parseMsg }}</p>
            <div class="rp-progress-track">
              <div class="rp-progress-fill" :style="{ width: parseProgress + '%' }"></div>
            </div>
            <p class="rp-progress-pct">{{ Math.round(parseProgress) }}%</p>
        </div>

        <!-- DONE 态 -->
        <div v-else class="rp-done-wrap">
          <div class="rp-done-status">
            <Icon icon="lucide:circle-check-big" :width="16" class="rp-done-icon" />
            <span>解析完成，查看右侧结果</span>
            <button class="rp-result-reset" @click="resetPage">
              <Icon icon="lucide:rotate-ccw" :width="12" />重新上传
            </button>
          </div>
          <div class="rp-privacy">
            <Icon icon="lucide:shield-check" :width="12" class="rp-privacy__icon" />
            <p class="rp-privacy__text">内容仅本地处理，不上传至任何服务器</p>
          </div>
        </div>

      </div>

      <!-- RIGHT: Orbital / Portrait -->
      <div class="rp-right">

        <!-- ══ 星图 ══ -->
        <div class="rp-orbital-scene">
          <div class="rp-orbital-field">

          <!-- SVG: rings + spokes (data-driven) + background dots -->
          <svg class="rp-orbital-svg" viewBox="0 0 520 520" fill="none" aria-hidden="true">
            <defs>
              <radialGradient id="rpCG" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#8B2500" stop-opacity="0.45"/>
                <stop offset="55%" stop-color="#8B2500" stop-opacity="0.08"/>
                <stop offset="100%" stop-color="#8B2500" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="rpMG" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#8B6914" stop-opacity="0.12"/>
                <stop offset="100%" stop-color="#8B6914" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Background dot cloud (24 static micro-dots) -->
            <g class="rp-dots">
              <circle cx="42"  cy="88"  r="1.2"/><circle cx="480" cy="62"  r="1.5"/><circle cx="310" cy="30"  r="1.0"/>
              <circle cx="58"  cy="310" r="1.3"/><circle cx="490" cy="340" r="1.2"/><circle cx="130" cy="480" r="1.0"/>
              <circle cx="390" cy="490" r="1.4"/><circle cx="70"  cy="440" r="1.1"/><circle cx="460" cy="180" r="1.2"/>
              <circle cx="26"  cy="200" r="1.0"/><circle cx="500" cy="460" r="1.3"/><circle cx="200" cy="18"  r="1.1"/>
              <circle cx="448" cy="405" r="1.2"/><circle cx="88"  cy="150" r="1.0"/><circle cx="336" cy="500" r="1.3"/>
              <circle cx="170" cy="62"  r="1.1"/><circle cx="495" cy="260" r="1.0"/><circle cx="24"  cy="380" r="1.2"/>
              <circle cx="350" cy="48"  r="1.1"/><circle cx="408" cy="122" r="1.0"/><circle cx="112" cy="398" r="1.2"/>
              <circle cx="478" cy="510" r="1.0"/><circle cx="158" cy="496" r="1.1"/><circle cx="38"  cy="510" r="1.0"/>
            </g>

            <circle cx="260" cy="260" r="115" fill="url(#rpCG)"/>
            <circle cx="260" cy="260" r="200" fill="url(#rpMG)"/>

            <!-- Orbital rings -->
            <circle class="rp-ring rp-ring--1" cx="260" cy="260" r="100" stroke="#8B2500" stroke-opacity="0.5" stroke-width="1.2" stroke-dasharray="8 12"/>
            <circle class="rp-ring rp-ring--2" cx="260" cy="260" r="165" stroke="#8B6914" stroke-opacity="0.32" stroke-width="1" stroke-dasharray="5 16"/>
            <circle class="rp-ring rp-ring--3" cx="260" cy="260" r="222" stroke="#ABABAB" stroke-opacity="0.38" stroke-width="1.2" stroke-dasharray="4 14"/>

            <!-- Spokes (data-driven, hover-reactive) -->
            <line
              v-for="node in ORBIT_NODES" :key="'spoke-' + node.key"
              x1="260" y1="260" :x2="node.sx2" :y2="node.sy2"
              :stroke="node.nc"
              stroke-width="0.9" stroke-dasharray="2 5"
              :class="['rp-spoke', hoveredKey === node.key ? 'rp-spoke--active' : hoveredKey ? 'rp-spoke--dim' : '']"
            />
          </svg>

          <!-- Center: user avatar + dynamic status -->
          <div class="rp-orbital-center">
            <div class="rp-orbital-avatar">{{ userStore.currentUser?.name?.charAt(0) || '你' }}</div>
            <span class="rp-oc-name">{{ userStore.currentUser?.name || '你' }}</span>
            <span class="rp-oc-status">{{ centerStatusText }}</span>
          </div>

          <!-- Orbital nodes (data-driven) -->
          <div
            v-for="node in ORBIT_NODES" :key="node.key"
            class="rp-onode"
            :class="{ 'rp-onode--sm': node.sm, 'rp-onode--dim': (hoveredKey && hoveredKey !== node.key) || (clickedKey && clickedKey !== node.key), 'rp-onode--active': clickedKey === node.key }"
            :style="{ left: node.x, top: node.y }"
            @mouseenter="hoveredKey = node.key"
            @mouseleave="hoveredKey = null"
            @click.stop="handleNodeClick(node.key)"
          >
            <div class="rp-obubble" :style="{ '--nc': node.nc, '--nbg': node.nbg }">
              <Icon :icon="node.icon" :width="node.iconSize"/>
            </div>
            <div :class="`rp-olabel rp-olabel--${node.labelDir}`">
              <span class="rp-oname">{{ node.label }}</span>
              <span class="rp-ocount">{{ node.jobs.toLocaleString() }}</span>
            </div>

            <!-- Hover popup card (shown only when not clicked) -->
            <Transition name="rp-pop">
              <div v-if="hoveredKey === node.key && clickedKey !== node.key" :class="`rp-popup rp-popup--${node.popDir}`">
                <div class="rp-popup__head">
                  <Icon :icon="node.icon" :width="11" :style="{ color: node.nc }"/>
                  <span class="rp-popup__title">{{ node.label }}</span>
                  <span class="rp-popup__jobs">{{ node.jobs.toLocaleString() }} 岗</span>
                </div>
                <!-- Skill frequency bars -->
                <div class="rp-popup__section-lbl">热门技能</div>
                <div class="rp-popup__freq-list">
                  <div v-for="sf in node.skillFreqs" :key="sf.name" class="rp-popup__freq-row">
                    <span class="rp-popup__freq-name">{{ sf.name }}</span>
                    <div class="rp-popup__freq-track">
                      <div class="rp-popup__freq-fill" :style="{ width: sf.pct + '%', background: node.nc }"></div>
                    </div>
                    <span class="rp-popup__freq-pct">{{ sf.pct }}%</span>
                  </div>
                </div>
                <!-- City distribution -->
                <div class="rp-popup__section-lbl">城市分布</div>
                <div class="rp-popup__city-list">
                  <div v-for="cd in node.cityDists" :key="cd.city" class="rp-popup__city-row">
                    <span class="rp-popup__city-name">{{ cd.city }}</span>
                    <div class="rp-popup__city-track">
                      <div class="rp-popup__city-fill" :style="{ width: cd.pct + '%' }"></div>
                    </div>
                    <span class="rp-popup__city-pct">{{ cd.pct }}%</span>
                  </div>
                </div>
                <!-- Edu badges + latest date -->
                <div class="rp-popup__bottom">
                  <div class="rp-popup__edu-badges">
                    <span v-for="e in node.eduDist" :key="e.level" class="rp-popup__edu-badge" :class="{ 'rp-popup__edu-badge--primary': e.primary }">
                      {{ e.level }}{{ e.primary ? '↑主流' : '' }}
                    </span>
                  </div>
                  <span class="rp-popup__date">{{ node.latestDate }}</span>
                </div>
                <template v-if="parsePhase === 'done'">
                  <div class="rp-popup__divider"></div>
                  <div class="rp-popup__match">
                    <span class="rp-popup__lbl">简历匹配</span>
                    <div class="rp-popup__bar-wrap">
                      <div class="rp-popup__bar" :style="{ width: getMatchPct(node.key) + '%' }"></div>
                    </div>
                    <span class="rp-popup__pct">{{ getMatchPct(node.key) }}%</span>
                  </div>
                </template>
                <div class="rp-popup__hint">点击查看岗位列表 →</div>
              </div>
            </Transition>
          </div>

          <!-- Job listing panel (slides in from right) -->
          <Transition name="rp-panel">
            <div v-if="clickedNode" class="rp-job-panel" :style="panelStyle" @click.stop>
              <div class="rp-job-panel__head">
                <button class="rp-job-panel__close" @click="closeJobPanel">
                  <Icon icon="lucide:x" :width="14"/>
                </button>
                <Icon :icon="clickedNode.icon" :width="13" :style="{ color: clickedNode.nc }"/>
                <span class="rp-job-panel__title">{{ clickedNode.label }}行业岗位</span>
                <span class="rp-job-panel__total">共 {{ clickedNode.jobs.toLocaleString() }} 条</span>
              </div>
              <div class="rp-job-panel__list">
                <div v-for="(job, idx) in clickedNode.jobItems" :key="idx" class="rp-job-item">
                  <div class="rp-job-item__top">
                    <span class="rp-job-item__title">{{ job.title }}</span>
                    <span class="rp-job-item__date">{{ job.date }}</span>
                  </div>
                  <div class="rp-job-item__meta">
                    <Icon icon="lucide:building" :width="10" class="rp-job-item__icon"/>
                    <span class="rp-job-item__company">{{ job.company }}</span>
                    <span class="rp-job-item__sep">·</span>
                    <Icon icon="lucide:map-pin" :width="10" class="rp-job-item__icon"/>
                    <span class="rp-job-item__city">{{ job.city }}</span>
                    <span class="rp-job-item__sep">·</span>
                    <span class="rp-job-item__edu">{{ job.edu }}↑</span>
                  </div>
                  <div class="rp-job-item__skills">
                    <span v-for="sk in job.skills" :key="sk" class="rp-job-item__skill">{{ sk }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
          <!-- Click-away mask when panel open -->
          <div v-if="clickedNode" class="rp-job-mask" @click="closeJobPanel"></div>

          </div><!-- /.rp-orbital-field -->
        </div>

        <!-- Footer data strip -->
        <div class="rp-right-footer">
          <div class="rp-rf-item"><span class="rp-rf-val">9,849</span><span class="rp-rf-lbl">在线岗位</span></div>
          <span class="rp-rf-sep">|</span>
          <div class="rp-rf-item"><span class="rp-rf-val">8+</span><span class="rp-rf-lbl">覆盖行业</span></div>
          <span class="rp-rf-sep">|</span>
          <div class="rp-rf-item"><span class="rp-rf-val">34</span><span class="rp-rf-lbl">省市</span></div>
          <span class="rp-rf-sep">|</span>
          <div class="rp-rf-item">
            <span class="rp-rf-val">{{ new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }}</span>
            <span class="rp-rf-lbl">更新</span>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── CSS vars ── */
:root {
  --rp-bg: var(--parchment-100, #F5F5F3);
  --rp-panel: var(--parchment-200, #EDEDEB);
  --rp-border: var(--parchment-400, #CBCBC8);
  --rp-muted: var(--parchment-500, #ABABAB);
  --rp-red: var(--color-primary-dark, #8B1A00);
  --rp-gold: var(--color-gold-dark, #8B6A00);
  --rp-text: var(--color-text, #111);
  --rp-sub: var(--color-text-muted, #666);
  --rp-hint: var(--color-text-subtle, #999);
  --rp-dark: #111111;
  --rp-dark2: #0D0D0D;
}

/* ── Page container ── */
.rp-page {
  position: relative;
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  background: var(--rp-bg);
  display: flex;
  flex-direction: column;
  font-family: var(--font-title, 'LXGW WenKai', sans-serif);
  overflow: hidden;
}
.rp-page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0);
  background-size: 4px 4px;
}

/* ═══ HEADER ═══ */
.rp-header {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 28px;
  height: 48px;
  min-height: 48px;
  background: var(--rp-panel);
  border-bottom: 1px solid var(--rp-border);
  flex-shrink: 0;
}
.rp-header__left { display: flex; align-items: center; gap: 14px; }
.rp-header__center { display: flex; justify-content: center; }
.rp-header__right { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }

.rp-back {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border: 1px solid var(--rp-border);
  background: transparent; color: var(--rp-sub);
  font-size: 12px; font-family: inherit; cursor: pointer;
  transition: all 0.3s ease; letter-spacing: 0.02em;
}
.rp-back:hover { border-color: var(--rp-red); color: var(--rp-red); }

.rp-brand-name { font-size: 13px; font-weight: 600; color: var(--rp-text); letter-spacing: 0.06em; }

.rp-header-tag {
  font-size: 10px; letter-spacing: 0.18em;
  color: var(--rp-hint); border: 1px solid var(--rp-border);
  padding: 3px 12px; text-transform: uppercase;
}

.rp-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: color-mix(in srgb, var(--rp-red) 12%, var(--rp-panel) 88%);
  border: 1.5px solid color-mix(in srgb, var(--rp-red) 25%, var(--rp-border) 75%);
  display: grid; place-items: center;
  font-size: 12px; font-weight: 600; color: var(--rp-red); flex-shrink: 0;
}
.rp-username { font-size: 12px; color: var(--rp-sub); letter-spacing: 0.02em; }

/* ═══ WORKSPACE ═══ */
.rp-workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 480px 1fr;
  position: relative;
  z-index: 1;
  overflow: hidden;
}


/* ═══ LEFT PANEL ═══ */
.rp-left {
  padding: 24px 36px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  border-right: 1px solid var(--rp-border);
  background: var(--rp-bg);
  position: relative;
  z-index: 1;
}

/* Editorial Headline */
.rp-editorial {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rp-border);
}
.rp-greeting {
  font-size: 11px; letter-spacing: 0.10em;
  color: var(--rp-hint); text-transform: uppercase; font-weight: 600;
}
.rp-display-title {
  display: flex; flex-direction: column; gap: 0; margin: 4px 0 0;
}
.rp-dt-a {
  display: block; font-size: 20px; font-weight: 400;
  color: var(--rp-sub); letter-spacing: 0.04em; line-height: 1.3;
}
.rp-dt-b {
  display: block; font-size: 34px; font-weight: 600;
  color: var(--rp-text); letter-spacing: 0.01em; line-height: 1.1; margin: 1px 0;
}
.rp-dt-c {
  display: block; font-size: 24px; font-weight: 600;
  color: var(--rp-red); letter-spacing: 0.03em; line-height: 1.15;
}
.rp-data-proof {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--rp-hint); margin: 4px 0 0; letter-spacing: 0.02em;
}
.rp-sep { font-style: normal; color: var(--rp-muted); font-size: 10px; }

/* Step indicator row wrapper */
.rp-steps-inline-row { display: flex; align-items: center; gap: 12px; }

/* 没有简历提示 */
.rp-no-resume-hint {
  position: relative;
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: rgba(120,120,120,0.55);
  cursor: pointer; padding: 3px 6px; border-radius: 4px;
  transition: color 0.2s ease, background 0.2s ease;
  white-space: nowrap;
}
.rp-no-resume-hint:hover { color: rgba(160,140,120,0.85); background: color-mix(in srgb, var(--rp-red) 8%, transparent 92%); }
.rp-no-resume-hint__icon { flex-shrink: 0; }
.rp-no-resume-hint__tip {
  position: absolute; bottom: calc(100% + 7px); left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.94); color: rgba(220,220,215,0.9);
  font-size: 11px; white-space: nowrap; padding: 6px 10px;
  border-radius: 5px; border: 1px solid rgba(200,200,200,0.15);
  pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
  z-index: 10;
}
.rp-no-resume-hint__tip::after {
  content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: rgba(0,0,0,0.94);
}
.rp-no-resume-hint:hover .rp-no-resume-hint__tip { opacity: 1; }

/* Step indicator (inline compact) */
.rp-steps-inline { display: flex; align-items: center; gap: 8px; }
.rp-si-step { display: flex; align-items: center; gap: 5px; opacity: 0.35; transition: opacity 0.2s ease; }
.rp-si-step--active { opacity: 1; }
.rp-si-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--rp-muted); flex-shrink: 0; transition: background 0.3s ease; }
.rp-si-step--active .rp-si-dot { background: var(--rp-red); }
.rp-si-num { font-size: 10px; font-weight: 600; color: var(--rp-hint); letter-spacing: 0.06em; }
.rp-si-step--active .rp-si-num { color: var(--rp-red); }
.rp-si-name { font-size: 11px; color: var(--rp-sub); letter-spacing: 0.02em; white-space: nowrap; }
.rp-si-step--active .rp-si-name { font-weight: 600; color: var(--rp-text); }
.rp-si-line { flex: 1; max-width: 28px; height: 1px; background: var(--rp-border); }

/* Idle form wrapper (fills remaining height) */
.rp-idle-form {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rp-idle-form .rp-textarea {
  flex: 1;
  min-height: 72px;
  resize: none;
}

/* Done state wrapper */
.rp-done-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Drop Zone */
.rp-drop-zone {
  position: relative;
  background: var(--rp-panel);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease;
  user-select: none;
  border: 1px dashed var(--rp-muted);
}
.rp-drop-zone:hover,
.rp-drop-zone--over {
  background: color-mix(in srgb, var(--rp-red) 4%, var(--rp-panel) 96%);
  border-color: var(--rp-red);
}

.rp-drop-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  transition: width 0.25s ease, height 0.25s ease, border-color 0.25s ease;
}
.rp-drop-corner--tl { top: 0; left: 0; border-top: 2px solid var(--rp-gold); border-left: 2px solid var(--rp-gold); }
.rp-drop-corner--tr { top: 0; right: 0; border-top: 2px solid var(--rp-gold); border-right: 2px solid var(--rp-gold); }
.rp-drop-corner--bl { bottom: 0; left: 0; border-bottom: 2px solid var(--rp-gold); border-left: 2px solid var(--rp-gold); }
.rp-drop-corner--br { bottom: 0; right: 0; border-bottom: 2px solid var(--rp-gold); border-right: 2px solid var(--rp-gold); }
.rp-drop-zone:hover .rp-drop-corner,
.rp-drop-zone--over .rp-drop-corner { border-color: var(--rp-red); width: 20px; height: 20px; }

.rp-file-input {
  position: absolute; inset: 0; opacity: 0;
  width: 100%; height: 100%; cursor: pointer; z-index: -1;
}

.rp-drop-body { display: flex; flex-direction: column; align-items: center; gap: 5px; z-index: 1; }

.rp-drop-icon-wrap {
  width: 40px; height: 40px; border: 1.5px solid var(--rp-muted);
  display: grid; place-items: center; background: var(--rp-panel);
  margin-bottom: 2px; transition: all 0.25s ease;
}
.rp-drop-zone:hover .rp-drop-icon-wrap,
.rp-drop-zone--over .rp-drop-icon-wrap {
  border-color: var(--rp-red);
  background: color-mix(in srgb, var(--rp-red) 6%, var(--rp-panel) 94%);
}
.rp-drop-icon { color: var(--rp-gold); }

.rp-drop-title {
  font-size: 14px; font-weight: 600; color: var(--rp-text);
  letter-spacing: 0.04em; margin: 0;
  text-align: center; max-width: 240px; word-break: break-all;
}
.rp-drop-formats { font-size: 11px; color: var(--rp-hint); margin: 0; letter-spacing: 0.04em; }

/* Or divider */
.rp-or-row { display: flex; align-items: center; gap: 8px; }
.rp-or-line { flex: 1; height: 1px; background: var(--rp-border); }
.rp-or-text { font-size: 11px; color: var(--rp-hint); letter-spacing: 0.04em; white-space: nowrap; }

/* ── Textarea ── */
.rp-textarea {
  width: 100%; box-sizing: border-box;
  background: var(--rp-panel); border: 1px solid var(--rp-muted); border-left: 3px solid var(--rp-muted);
  padding: 9px 12px; font-size: 12px; color: var(--rp-text);
  font-family: var(--font-body, 'Noto Sans SC', sans-serif);
  line-height: 1.65; resize: none; min-height: 72px; outline: none;
  transition: border-left-color 0.2s ease;
}
.rp-textarea:focus { border-left-color: var(--rp-red); }
.rp-textarea::placeholder { color: var(--rp-muted); }

/* Direction tiles */
.rp-dir-section { display: flex; flex-direction: column; gap: 7px; }
.rp-dir-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; color: var(--rp-sub); text-transform: uppercase; margin: 0; }
.rp-dir-hint { font-weight: 400; color: var(--rp-hint); font-size: 9px; }
.rp-dir-tiles { display: flex; flex-wrap: wrap; gap: 5px; }
.rp-dir-tile {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 11px; border: 1px solid var(--rp-border);
  background: var(--rp-panel); color: var(--rp-sub);
  font-size: 11px; font-family: inherit;
  cursor: pointer; transition: all 0.2s ease; letter-spacing: 0.04em;
}
.rp-dir-tile:hover { border-color: var(--rp-gold); color: var(--rp-gold); background: color-mix(in srgb, var(--rp-gold) 5%, var(--rp-panel) 95%); }
.rp-dir-tile--active { border-color: var(--rp-red); background: var(--rp-red); color: var(--rp-bg); }
.rp-dir-tile__icon { flex-shrink: 0; color: var(--rp-hint); transition: color 0.3s ease; }
.rp-dir-tile--active .rp-dir-tile__icon { color: var(--rp-bg); }
.rp-dir-tile__name { white-space: nowrap; }

/* Parse button */
.rp-parse-btn {
  width: 100%; height: 46px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: var(--rp-red); border: none; color: var(--rp-bg);
  font-size: 14px; font-family: var(--font-title, inherit);
  letter-spacing: 0.1em; cursor: pointer;
  transition: background 0.2s ease; position: relative; overflow: hidden;
}
.rp-parse-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  transform: translateX(-100%); transition: transform 0.45s ease;
}
.rp-parse-btn:hover:not(:disabled)::before { transform: translateX(100%); }
.rp-parse-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--rp-red) 80%, #fff 20%); }
.rp-parse-btn:hover:not(:disabled) .rp-parse-btn__arrow { transform: translateX(4px); }
.rp-parse-btn__arrow { transition: transform 0.2s ease; }
.rp-parse-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Loading ── */
.rp-loading-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 20px 0;
}
.rp-loading-seal {
  width: 60px; height: 60px;
  border: 2px solid color-mix(in srgb, var(--rp-red) 25%, var(--rp-border) 75%);
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--rp-red) 4%, var(--rp-panel) 96%);
}
.rp-loading-spin { color: var(--rp-red); animation: rp-spin 1.2s linear infinite; }
@keyframes rp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.rp-loading-msg { font-size: 13px; color: var(--rp-sub); letter-spacing: 0.03em; margin: 0; }
.rp-progress-track { width: 220px; height: 3px; background: var(--rp-border); overflow: hidden; }
.rp-progress-fill { height: 100%; background: linear-gradient(90deg, var(--rp-gold), var(--rp-red)); transition: width 0.15s linear; }
.rp-progress-pct { font-size: 13px; font-weight: 600; color: var(--rp-red); margin: 0; letter-spacing: 0.04em; }

/* Done state (left) */
.rp-done-status {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: color-mix(in srgb, #5B7744 5%, var(--rp-panel) 95%);
  border: 1px solid color-mix(in srgb, #5B7744 20%, var(--rp-border) 80%);
  font-size: 13px; font-weight: 600; color: var(--rp-text);
}
.rp-done-icon { color: #5B7744; flex-shrink: 0; }
.rp-done-status span { flex: 1; }

.rp-result-reset {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border: 1px solid var(--rp-border);
  background: transparent; color: var(--rp-hint);
  font-size: 11px; font-family: inherit; cursor: pointer;
  transition: all 0.2s ease; letter-spacing: 0.04em;
}
.rp-result-reset:hover { border-color: var(--rp-red); color: var(--rp-red); }

.rp-privacy {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 8px 10px;
  background: color-mix(in srgb, #5B7744 4%, var(--rp-panel) 96%);
  border: 1px solid color-mix(in srgb, #5B7744 15%, var(--rp-border) 85%);
}
.rp-privacy__icon { color: #5B7744; flex-shrink: 0; margin-top: 1px; }
.rp-privacy__text { font-size: 11px; color: var(--rp-sub); line-height: 1.6; margin: 0; }

/* ═══ RIGHT PANEL (dark) ═══ */
.rp-right {
  background: var(--rp-dark);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.rp-orbital-scene {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.rp-orbital-field {
  position: relative;
  width: min(100%, calc(100vh - 200px));
  aspect-ratio: 1 / 1;
}

.rp-orbital-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Ring flow animations */
.rp-ring--1 { animation: ring-f1 22s linear infinite; }
.rp-ring--2 { animation: ring-f2 38s linear infinite; }
.rp-ring--3 { animation: ring-f3 55s linear infinite; }
@keyframes ring-f1 { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -628; } }
@keyframes ring-f2 { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 1037; } }
@keyframes ring-f3 { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -1395; } }

/* Orbital center */
.rp-orbital-center {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  z-index: 2;
}
.rp-orbital-avatar {
  width: 50px; height: 50px; border-radius: 50%;
  background: linear-gradient(135deg, #C03418 0%, #7A1E08 100%);
  border: 2px solid rgba(192,52,24,0.78);
  box-shadow: 0 0 28px rgba(192,52,24,0.58), 0 0 58px rgba(192,52,24,0.22);
  display: grid; place-items: center;
  font-size: 18px; font-weight: 600; color: #F0EDE8;
  font-family: var(--font-title, 'LXGW WenKai', sans-serif);
}
.rp-oc-name {
  font-size: 10px; font-weight: 600;
  color: rgba(240,238,232,0.97); letter-spacing: 0.06em; white-space: nowrap;
}
.rp-oc-status {
  font-size: 9px; letter-spacing: 0.08em;
  color: rgba(180,178,170,0.85); white-space: nowrap; text-align: center;
  max-width: 120px; line-height: 1.4;
  transition: opacity 0.3s ease;
}

/* Background dot cloud */
.rp-dots circle { fill: rgba(190,190,185,0.1); }

/* Spokes */
.rp-spoke {
  transition: stroke-opacity 0.25s ease, stroke-width 0.25s ease;
  stroke-opacity: 0.2;
}
.rp-spoke--active { stroke-opacity: 0.88; stroke-width: 1.4; }
.rp-spoke--dim   { stroke-opacity: 0.03; }

/* Orbit nodes */
.rp-onode {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center;
  z-index: 3;
  cursor: pointer;
}
.rp-onode--sm { opacity: 0.8; }
.rp-onode--dim { opacity: 0.3; transition: opacity 0.25s ease; }
.rp-onode { transition: opacity 0.25s ease; }

/* ── Hover popup card ── */
.rp-popup {
  position: absolute;
  z-index: 20;
  width: 210px;
  background: rgba(10, 10, 10, 0.96);
  border: 1px solid rgba(200,200,195,0.2);
  border-radius: var(--radius-md, 10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 11px 13px;
  display: flex; flex-direction: column; gap: 6px;
  pointer-events: none;
}
.rp-popup--right  { left: calc(100% + 14px); top: 50%; transform: translateY(-50%); }
.rp-popup--left   { right: calc(100% + 14px); top: 50%; transform: translateY(-50%); }
.rp-popup--above  { bottom: calc(100% + 14px); left: 50%; transform: translateX(-50%); }
.rp-popup--below  { top: calc(100% + 14px); left: 50%; transform: translateX(-50%); }

.rp-popup__head {
  display: flex; align-items: center; gap: 5px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(200,200,195,0.14);
}
.rp-popup__title {
  flex: 1; font-size: 12px; font-weight: 600;
  color: rgba(230,228,222,0.95); letter-spacing: 0.03em;
}
.rp-popup__jobs {
  font-size: 10px; color: rgba(160,160,155,0.75);
  white-space: nowrap; letter-spacing: 0.04em;
}
.rp-popup__row { display: flex; align-items: flex-start; gap: 5px; }
.rp-popup__lbl {
  flex-shrink: 0; min-width: 44px;
  font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
  color: rgba(140,140,135,0.65); padding-top: 1px;
}
.rp-popup__val {
  font-size: 10px; color: rgba(210,208,202,0.85);
  letter-spacing: 0.02em; line-height: 1.45;
}
.rp-popup__divider { height: 1px; background: rgba(200,200,195,0.1); }
.rp-popup__match { display: flex; align-items: center; gap: 5px; }
.rp-popup__bar-wrap { flex: 1; height: 3px; background: rgba(200,200,195,0.1); overflow: hidden; }
.rp-popup__bar { height: 100%; background: linear-gradient(90deg, #C4961E, #C03418); transition: width 0.5s ease 0.15s; }
.rp-popup__pct { font-size: 10px; font-weight: 600; color: rgba(218,78,52,0.99); white-space: nowrap; }

/* Popup enriched sections */
.rp-popup__section-lbl {
  font-size: 9px; font-weight: 600; letter-spacing: 0.12em;
  color: rgba(175,172,160,0.82); text-transform: uppercase; margin-top: 2px;
}
.rp-popup__freq-list,
.rp-popup__city-list { display: flex; flex-direction: column; gap: 3px; }
.rp-popup__freq-row,
.rp-popup__city-row  { display: grid; grid-template-columns: 52px 1fr 28px; align-items: center; gap: 4px; }
.rp-popup__freq-name,
.rp-popup__city-name { font-size: 9px; color: rgba(210,208,202,0.75); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rp-popup__freq-track,
.rp-popup__city-track { height: 3px; background: rgba(200,200,195,0.1); overflow: hidden; }
.rp-popup__freq-fill  { height: 100%; opacity: 0.75; transition: width 0.45s ease 0.08s; }
.rp-popup__city-fill  { height: 100%; background: rgba(195,195,188,0.4); transition: width 0.45s ease 0.12s; }
.rp-popup__freq-pct,
.rp-popup__city-pct  { font-size: 9px; color: rgba(155,155,148,0.6); text-align: right; }

.rp-popup__bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.rp-popup__edu-badges { display: flex; gap: 4px; flex-wrap: wrap; }
.rp-popup__edu-badge {
  font-size: 9px; padding: 1px 6px;
  border: 1px solid rgba(195,195,188,0.2); color: rgba(165,165,158,0.65);
  letter-spacing: 0.04em;
}
.rp-popup__edu-badge--primary {
  border-color: rgba(139,120,40,0.45); color: rgba(200,175,100,0.9);
}
.rp-popup__date { font-size: 9px; color: rgba(140,140,135,0.5); letter-spacing: 0.04em; }
.rp-popup__hint {
  font-size: 9px; color: rgba(190,70,40,0.55); letter-spacing: 0.04em;
  text-align: right; margin-top: 1px;
}

/* Active (clicked) node */
.rp-onode--active .rp-obubble {
  transform: scale(1.2);
  box-shadow: 0 0 28px var(--nbg, rgba(192,52,24,0.5));
}

/* ── Job listing panel ── */
.rp-job-panel {
  position: absolute;
  /* top / right|left / height injected via panelStyle binding */
  width: 70%;
  background: rgba(10, 10, 10, 0.97);
  border: 1px solid rgba(200,200,195,0.18);
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex; flex-direction: column;
  z-index: 30;
  overflow: hidden;
}
.rp-job-panel__head {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 7px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(200,200,195,0.12);
  background: rgba(15,15,15,0.6);
}
.rp-job-panel__close {
  width: 24px; height: 24px; border-radius: 50%;
  border: 1px solid rgba(195,195,188,0.2);
  background: transparent; color: rgba(165,165,158,0.7);
  display: grid; place-items: center; cursor: pointer;
  transition: all 0.2s ease; flex-shrink: 0;
}
.rp-job-panel__close:hover { border-color: rgba(190,70,40,0.6); color: rgba(190,70,40,0.9); }
.rp-job-panel__title { flex: 1; font-size: 12px; font-weight: 600; color: rgba(230,228,222,0.9); letter-spacing: 0.03em; }
.rp-job-panel__total { font-size: 10px; color: rgba(150,150,145,0.6); letter-spacing: 0.04em; white-space: nowrap; }
.rp-job-panel__list {
  flex: 1; overflow-y: auto; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.rp-job-panel__list::-webkit-scrollbar { width: 3px; }
.rp-job-panel__list::-webkit-scrollbar-track { background: transparent; }
.rp-job-panel__list::-webkit-scrollbar-thumb { background: rgba(190,70,40,0.3); }

.rp-job-item {
  padding: 10px 12px;
  background: rgba(235,235,230,0.04);
  border: 1px solid rgba(200,200,195,0.1);
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color 0.2s ease;
}
.rp-job-item:hover { border-color: rgba(190,70,40,0.3); }
.rp-job-item__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; }
.rp-job-item__title {
  font-size: 12px; font-weight: 600;
  color: rgba(230,228,222,0.92); letter-spacing: 0.02em; line-height: 1.3; flex: 1;
}
.rp-job-item__date { font-size: 10px; color: rgba(140,140,135,0.55); white-space: nowrap; flex-shrink: 0; }
.rp-job-item__meta { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.rp-job-item__icon { color: rgba(150,150,145,0.5); flex-shrink: 0; }
.rp-job-item__company { font-size: 10px; color: rgba(185,185,178,0.8); }
.rp-job-item__sep { font-size: 10px; color: rgba(110,110,105,0.4); }
.rp-job-item__city { font-size: 10px; color: rgba(165,165,158,0.7); }
.rp-job-item__edu { font-size: 10px; color: rgba(180,150,60,0.75); font-weight: 600; }
.rp-job-item__skills { display: flex; flex-wrap: wrap; gap: 4px; }
.rp-job-item__skill {
  font-size: 9px; padding: 2px 7px;
  background: rgba(235,235,230,0.04);
  border: 1px solid rgba(195,195,188,0.15);
  color: rgba(195,195,188,0.75); letter-spacing: 0.04em;
}

/* Job panel slide-in transition */
.rp-panel-enter-active { transition: transform 0.32s cubic-bezier(0.22,0.61,0.36,1), opacity 0.28s ease; }
.rp-panel-leave-active { transition: transform 0.22s cubic-bezier(0.55,0,1,0.45), opacity 0.2s ease; }
.rp-panel-enter-from  { transform: translateX(110%); opacity: 0; }
.rp-panel-leave-to    { transform: translateX(110%); opacity: 0; }

/* Click-away mask (transparent — only catches clicks) */
.rp-job-mask {
  position: absolute; inset: 0;
  z-index: 25;
  background: transparent;
  cursor: pointer;
}

/* Popup transition */
.rp-pop-enter-active { transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1); }
.rp-pop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.rp-pop-leave-to    { opacity: 0; transform: scale(0.94); }
.rp-popup--right.rp-pop-enter-from  { opacity: 0; transform: translateY(-50%) translateX(-10px) scale(0.94); }
.rp-popup--left.rp-pop-enter-from   { opacity: 0; transform: translateY(-50%) translateX(10px) scale(0.94); }
.rp-popup--above.rp-pop-enter-from  { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.94); }
.rp-popup--below.rp-pop-enter-from  { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.94); }

.rp-obubble {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--nbg, rgba(192,52,24,0.22));
  border: 1.5px solid var(--nc, #C03418);
  display: grid; place-items: center;
  color: var(--nc, #C03418);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 0 12px var(--nbg, rgba(192,52,24,0.18));
}
.rp-onode--sm .rp-obubble { width: 28px; height: 28px; }
.rp-onode:hover .rp-obubble {
  transform: scale(1.15);
  box-shadow: 0 0 22px var(--nbg, rgba(192,52,24,0.42));
}

/* Node labels (absolutely positioned relative to the node) */
.rp-olabel {
  position: absolute;
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  pointer-events: none;
}
.rp-olabel--above { bottom: calc(100% + 7px); left: 50%; transform: translateX(-50%); }
.rp-olabel--below { top: calc(100% + 7px); left: 50%; transform: translateX(-50%); }
.rp-olabel--right { left: calc(100% + 9px); top: 50%; transform: translateY(-50%); align-items: flex-start; }
.rp-olabel--left { right: calc(100% + 9px); top: 50%; transform: translateY(-50%); align-items: flex-end; }

.rp-oname {
  font-size: 11px; font-weight: 700;
  color: rgba(240,238,232,0.97); letter-spacing: 0.04em; white-space: nowrap;
}
.rp-ocount {
  font-size: 9px; color: rgba(185,185,178,0.88);
  letter-spacing: 0.04em; white-space: nowrap;
}

/* Right footer data strip */
.rp-right-footer {
  flex-shrink: 0;
  height: 50px;
  background: var(--rp-dark2);
  border-top: 1px solid rgba(139,37,0,0.22);
  display: flex; align-items: center; justify-content: center;
  gap: 14px; padding: 0 24px;
}
.rp-rf-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.rp-rf-val { font-size: 13px; font-weight: 600; color: rgba(240,232,218,0.98); letter-spacing: 0.02em; line-height: 1; }
.rp-rf-lbl { font-size: 9px; color: rgba(170,170,162,0.88); letter-spacing: 0.06em; white-space: nowrap; }
.rp-rf-sep { color: rgba(100,100,95,0.35); font-size: 12px; }

/* ══════════════════════════════════════════
   打印 / 导出报告样式
══════════════════════════════════════════ */
@media print {
  .rp-header, .rp-left, .rp-orbital-scene, .rp-right-footer { display: none !important; }
  .rp-page { display: block !important; height: auto !important; overflow: visible !important; }
}
/* Responsive */
@media (max-width: 1280px) { .rp-workspace { grid-template-columns: 420px 1fr; } }
@media (max-width: 1024px) {
  .rp-workspace { grid-template-columns: 340px 1fr; }
  .rp-left { padding: 18px 22px 16px; gap: 10px; }
  .rp-dt-b { font-size: 28px; }
  .rp-dt-c { font-size: 20px; }
}
@media (max-width: 768px) {
  .rp-workspace { grid-template-columns: 1fr; grid-template-rows: auto 1fr; overflow-y: auto; }
  .rp-right { min-height: 400px; }
  .rp-orbital-field { width: min(100%, 360px); }
}

</style>
