<!-- 页面：职途导航 · 简历导入；路由：student/career-navigation；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'
import { useUserStore } from '@/stores'
import UserInfoBar from '@/components/UserInfoBar.vue'
import { useResumeStore } from '@/stores/resume'
import { useLearningStore } from '@/stores/learning'
import { getCareerInsightsMock, roleOptions, CAREER_DOMAINS } from '@/composables/useCareerInsights'
import type { CareerRole, BubbleDomain } from '@/composables/useCareerInsights'

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
    gsap.from('.rp-header', { opacity: 0, y: -18, duration: 0.45, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.rp-editorial', { opacity: 0, y: -12, duration: 0.5, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' })
    gsap.from('.rp-left', { opacity: 0, x: -20, duration: 0.45, ease: 'power2.out', delay: 0.05, clearProps: 'opacity,transform' })
    gsap.from('.rp-right', { opacity: 0, x: 20, duration: 0.5, ease: 'power2.out', delay: 0.15, clearProps: 'opacity,transform' })
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
  setupEntrance()
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
const JOB_DESCRIPTIONS: Record<string, string> = {
  'Vue 前端工程师':   '使用 Vue 生态构建交互丰富的 Web 应用，关注组件化与工程化实践。',
  'React 前端工程师': '基于 React 技术栈开发大型单页应用，掌握状态管理与性能优化。',
  '可视化工程师':     '运用 D3/ECharts/WebGL 将复杂数据转化为直观可交互的图表与大屏。',
  'Java 后端工程师':  '使用 Spring 生态构建高并发分布式服务，精通数据库与中间件。',
  'Go 后端工程师':    '以 Go 语言开发高性能微服务，擅长并发编程与云原生架构。',
  'Python 后端工程师':'使用 Django/FastAPI 快速构建 Web 服务与数据处理管道。',
  '自动化测试工程师': '设计与维护自动化测试框架，保障持续集成流水线的质量门禁。',
  '质量平台工程师':   '搭建测试平台与效能工具，提升团队研发质量与交付效率。',
  '性能测试工程师':   '通过压测与调优定位系统瓶颈，确保服务在高负载下稳定运行。',
  '商业数据分析师':   '结合业务场景进行数据建模与洞察，驱动产品与运营决策。',
  '数据开发工程师':   '构建数据仓库与 ETL 管道，为分析和算法提供高质量数据基座。',
  '增长分析师':       '通过 A/B 测试与漏斗分析挖掘用户增长机会，优化转化路径。',
  '算法工程师':       '研发推荐、搜索、风控等核心算法，将模型落地为线上服务。',
  '深度学习工程师':   '训练与部署 CV/NLP/多模态模型，优化推理性能与模型精度。',
  'AI 应用工程师':    '基于大模型 API 构建智能应用，设计 Prompt 工程与 Agent 流程。',
}

const JOB_SHORT: Record<string, string> = {
  'Vue 前端工程师': 'Vue', 'React 前端工程师': 'React', '可视化工程师': '可视化',
  'Java 后端工程师': 'Java', 'Go 后端工程师': 'Go', 'Python 后端工程师': 'Python',
  '自动化测试工程师': '自动化', '质量平台工程师': '质量', '性能测试工程师': '性能',
  '商业数据分析师': '商业', '数据开发工程师': '数仓', '增长分析师': '增长',
  '算法工程师': '算法', '深度学习工程师': '深度学习', 'AI 应用工程师': 'AI应用',
}

interface StarNode {
  key: string; jobName: string; shortName: string; description: string
  domainId: string; domainName: string; domainColor: string
  domainIdx: number; jobIdx: number
  cx: number; cy: number; lx: number; ly: number
  textAnchor: string; labelBaseline: string
}

interface StarLink {
  key: string; x1: number; y1: number; x2: number; y2: number
  color: string; domainId: string
}

const RING_RADII = [70, 110, 148, 186, 222]
const BASE_ANGLES_DEG = [0, 40, 80, 120, 160]

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const starNodes = computed<StarNode[]>(() => {
  const CX = 260, CY = 260
  return CAREER_DOMAINS.flatMap((domain, di) =>
    domain.jobs.map((jobName, ji) => {
      const r = RING_RADII[di]!
      const angleDeg = BASE_ANGLES_DEG[di]! + ji * 120
      const rad = (angleDeg * Math.PI) / 180
      const cx = CX + r * Math.cos(rad)
      const cy = CY + r * Math.sin(rad)
      const labelR = r + 22
      const lx = CX + labelR * Math.cos(rad)
      const ly = CY + labelR * Math.sin(rad)
      const cosA = Math.cos(rad)
      const sinA = Math.sin(rad)
      return {
        key: `${domain.id}-${ji}`,
        jobName,
        shortName: JOB_SHORT[jobName] ?? jobName.slice(0, 3),
        description: JOB_DESCRIPTIONS[jobName] ?? '',
        domainId: domain.id,
        domainName: domain.name,
        domainColor: domain.color,
        domainIdx: di,
        jobIdx: ji,
        cx, cy, lx, ly,
        textAnchor: cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle',
        labelBaseline: sinA > 0.3 ? 'hanging' : sinA < -0.3 ? 'auto' : 'middle',
      }
    })
  )
})

const starLinks = computed<StarLink[]>(() => {
  const links: StarLink[] = []
  CAREER_DOMAINS.forEach((domain) => {
    const nodes = starNodes.value.filter(n => n.domainId === domain.id)
    if (nodes.length === 3) {
      ;([[0, 1], [1, 2], [0, 2]] as [number, number][]).forEach(([a, b], idx) => {
        links.push({
          key: `${domain.id}-lk-${idx}`,
          x1: nodes[a]!.cx, y1: nodes[a]!.cy,
          x2: nodes[b]!.cx, y2: nodes[b]!.cy,
          color: domain.color,
          domainId: domain.id,
        })
      })
    }
  })
  return links
})

interface DomainGroup {
  domain: BubbleDomain
  domainIdx: number
  nodes: StarNode[]
  links: StarLink[]
}

const domainGroups = computed<DomainGroup[]>(() =>
  CAREER_DOMAINS.map((domain, di) => ({
    domain,
    domainIdx: di,
    nodes: starNodes.value.filter(n => n.domainId === domain.id),
    links: starLinks.value.filter(l => l.domainId === domain.id),
  }))
)

const hoveredNodeKey = ref<string | null>(null)
const clickedNodeKey = ref<string | null>(null)

const hoveredDomainId = computed(() =>
  starNodes.value.find(n => n.key === hoveredNodeKey.value)?.domainId ?? null
)

const clickedStarNode = computed(() =>
  starNodes.value.find(n => n.key === clickedNodeKey.value) ?? null
)

function handleStarClick(key: string) {
  clickedNodeKey.value = clickedNodeKey.value === key ? null : key
}
function closeStarPopup() {
  clickedNodeKey.value = null
}

const popupPosition = computed(() => {
  const node = clickedStarNode.value
  if (!node) return {}
  const xPct = (node.cx / 520) * 100
  const yPct = (node.cy / 520) * 100
  const onRight = xPct > 50
  const onBottom = yPct > 60
  const style: Record<string, string> = {}
  style[onRight ? 'right' : 'left'] = onRight ? `${(100 - xPct + 3).toFixed(1)}%` : `${(xPct + 3).toFixed(1)}%`
  style[onBottom ? 'bottom' : 'top'] = onBottom ? `${(100 - yPct + 2).toFixed(1)}%` : `${(yPct + 2).toFixed(1)}%`
  return style
})


const centerStatusText = computed(() => {
  if (parsePhase.value === 'parsing') return '解析中…'
  if (parsePhase.value === 'done') {
    const top1 = resumeStore.matchedCareers[0]?.role ?? '前端开发'
    return `已匹配 ${top1} 等 ${resumeStore.matchedCareers.length} 个方向`
  }
  return '探索 5 大领域 · 15 个职业方向'
})

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
        <UserInfoBar />
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

          <!-- 方向预选 tiles (5 领域折叠卡片) -->
          <div class="rp-dir-section">
            <p class="rp-dir-label">
              {{ selectedDirection ? '已选方向' : '偏好方向' }}
              <span v-if="!selectedDirection" class="rp-dir-hint">（可选，辅助分析）</span>
            </p>
            <div class="rp-dir-domains">
              <div
                v-for="(domain, di) in CAREER_DOMAINS"
                :key="domain.id"
                v-show="!selectedDirection || selectedDirection === domain.role"
                class="rp-dir-domain"
                :class="{ 'rp-dir-domain--active': selectedDirection === domain.role }"
                @click="selectedDirection = selectedDirection === domain.role ? '' : domain.role"
              >
                <div class="rp-dir-domain__head">
                  <span class="rp-dir-domain__dot" :style="{ background: domain.color }"></span>
                  <Icon :icon="(['lucide:monitor','lucide:server','lucide:bug','lucide:bar-chart-2','lucide:cpu'])[di] || 'lucide:briefcase'" :width="13" class="rp-dir-domain__icon" />
                  <span class="rp-dir-domain__name">{{ domain.name }}</span>
                  <Icon icon="lucide:chevron-down" :width="11" class="rp-dir-domain__chevron" />
                </div>
                <Transition name="rp-dir-expand">
                  <div v-if="selectedDirection === domain.role" class="rp-dir-domain__jobs">
                    <span v-for="job in domain.jobs" :key="job" class="rp-dir-job">{{ job }}</span>
                    <button class="rp-dir-change-btn" @click.stop="selectedDirection = ''">
                      <Icon icon="lucide:repeat-2" :width="10"/>
                      切换方向
                    </button>
                  </div>
                </Transition>
              </div>
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
            <div class="rp-progress-area">
              <div class="rp-progress-track">
                <div class="rp-progress-fill" :style="{ width: parseProgress + '%' }"></div>
              </div>
              <div class="rp-progress-meta">
                <span class="rp-progress-pct">{{ Math.round(parseProgress) }}%</span>
                <span class="rp-progress-steps">{{ Math.min(Math.ceil(parseProgress / (100 / 6)), 6) }} / 6 步</span>
              </div>
            </div>
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

      <!-- RIGHT: Star Map -->
      <div class="rp-right">

        <!-- ══ 星图 ══ -->
        <div class="rp-orbital-scene">
          <div class="rp-orbital-field" @click="closeStarPopup">

            <!-- SVG: rings + constellation links + nodes + labels -->
            <svg class="rp-orbital-svg" viewBox="0 0 520 520" fill="none" aria-hidden="true">
              <defs>
                <radialGradient id="rpCG2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#BE2A00" stop-opacity="0.07"/>
                  <stop offset="60%" stop-color="#BE2A00" stop-opacity="0.02"/>
                  <stop offset="100%" stop-color="#BE2A00" stop-opacity="0"/>
                </radialGradient>
                <pattern id="rpGrid" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="13" cy="13" r="0.7" fill="rgba(0,0,0,0.07)"/>
                </pattern>
                <filter id="rpNoise" x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" result="n"/>
                  <feColorMatrix type="saturate" values="0" in="n" result="g"/>
                  <feComponentTransfer in="g"><feFuncA type="linear" slope="0.025"/></feComponentTransfer>
                </filter>
              </defs>

              <!-- Background textures -->
              <rect width="520" height="520" fill="url(#rpGrid)" opacity="0.85"/>
              <rect width="520" height="520" filter="url(#rpNoise)"/>

              <!-- Background micro-dots -->
              <g class="rp-dots">
                <circle cx="42"  cy="88"  r="1.2"/><circle cx="480" cy="62"  r="1.5"/><circle cx="310" cy="30"  r="1.0"/>
                <circle cx="58"  cy="310" r="1.3"/><circle cx="490" cy="340" r="1.2"/><circle cx="130" cy="480" r="1.0"/>
                <circle cx="390" cy="490" r="1.4"/><circle cx="70"  cy="440" r="1.1"/><circle cx="460" cy="180" r="1.2"/>
                <circle cx="26"  cy="200" r="1.0"/><circle cx="500" cy="460" r="1.3"/><circle cx="200" cy="18"  r="1.1"/>
                <circle cx="448" cy="405" r="1.2"/><circle cx="88"  cy="150" r="1.0"/><circle cx="336" cy="500" r="1.3"/>
                <circle cx="170" cy="62"  r="1.1"/><circle cx="495" cy="260" r="1.0"/><circle cx="24"  cy="380" r="1.2"/>
                <circle cx="350" cy="48"  r="1.1"/><circle cx="408" cy="122" r="1.0"/><circle cx="112" cy="398" r="1.2"/>
                <circle cx="478" cy="510" r="1.0"/><circle cx="158" cy="496" r="1.1"/><circle cx="38"  cy="510" r="1.0"/>
                <circle cx="240" cy="50"  r="0.8"/><circle cx="415" cy="75"  r="0.9"/><circle cx="80"  cy="260" r="1.0"/>
                <circle cx="145" cy="120" r="0.7"/><circle cx="375" cy="165" r="0.8"/><circle cx="510" cy="140" r="0.9"/>
                <circle cx="30"  cy="470" r="0.8"/><circle cx="260" cy="505" r="0.9"/><circle cx="435" cy="460" r="0.7"/>
                <circle cx="185" cy="340" r="0.8"/><circle cx="340" cy="370" r="0.7"/><circle cx="470" cy="400" r="0.8"/>
              </g>
              <!-- Decorative cross marks -->
              <g stroke="rgba(0,0,0,0.05)" stroke-width="0.8">
                <line x1="46" y1="38" x2="52" y2="38"/><line x1="49" y1="35" x2="49" y2="41"/>
                <line x1="475" y1="478" x2="481" y2="478"/><line x1="478" y1="475" x2="478" y2="481"/>
                <line x1="472" y1="28" x2="478" y2="28"/><line x1="475" y1="25" x2="475" y2="31"/>
                <line x1="38" y1="485" x2="44" y2="485"/><line x1="41" y1="482" x2="41" y2="488"/>
              </g>

              <!-- Center glow -->
              <circle cx="260" cy="260" r="200" fill="url(#rpCG2)"/>

              <!-- 5 orbital rings (one per domain) -->
              <circle
                v-for="(domain, di) in CAREER_DOMAINS"
                :key="'ring-' + domain.id"
                cx="260" cy="260"
                :r="RING_RADII[di]"
                :stroke="domain.color"
                stroke-opacity="0.45"
                stroke-width="1.2"
                stroke-dasharray="5 12"
                :class="['rp-ring', `rp-ring--${di + 1}`]"
                fill="none"
              />

              <!-- Center ripples (3 staggered, using negative delay for immediate stagger) -->
              <circle class="rp-ripple rp-ripple--1" cx="260" cy="260"/>
              <circle class="rp-ripple rp-ripple--2" cx="260" cy="260"/>
              <circle class="rp-ripple rp-ripple--3" cx="260" cy="260"/>

              <!-- 5 domain groups: each orbits as a rigid triangle (Kepler: inner=fast, outer=slow) -->
              <g
                v-for="(group, gi) in domainGroups"
                :key="'dg-' + group.domain.id"
                :class="['rp-domain-group', `rp-domain-group--${gi}`, {
                  'rp-domain-group--dimmed': hoveredDomainId && hoveredDomainId !== group.domain.id,
                  'rp-domain-group--lit': hoveredDomainId === group.domain.id,
                }]"
              >
                <!-- Constellation links (triangle edges) -->
                <line
                  v-for="lk in group.links"
                  :key="lk.key"
                  :x1="lk.x1" :y1="lk.y1"
                  :x2="lk.x2" :y2="lk.y2"
                  :stroke="lk.color"
                  stroke-opacity="0.40"
                  stroke-width="1.5"
                  class="rp-star-link"
                />
                <!-- Node circles -->
                <circle
                  v-for="node in group.nodes"
                  :key="'nc-' + node.key"
                  :cx="node.cx" :cy="node.cy"
                  r="14"
                  :fill="hexToRgba(node.domainColor, clickedNodeKey === node.key ? 0.22 : 0.09)"
                  :stroke="node.domainColor"
                  :stroke-opacity="clickedNodeKey === node.key ? 0.95 : 0.5"
                  :stroke-width="clickedNodeKey === node.key ? 2.2 : 1.5"
                  class="rp-star-node"
                  :class="{ 'rp-star-node--active': clickedNodeKey === node.key }"
                  style="cursor: pointer;"
                  @mouseenter="hoveredNodeKey = node.key"
                  @mouseleave="hoveredNodeKey = null"
                  @click.stop="handleStarClick(node.key)"
                />
                <!-- Labels (counter-rotate to stay horizontal while group orbits) -->
                <text
                  v-for="node in group.nodes"
                  :key="'nt-' + node.key"
                  :x="node.lx" :y="node.ly"
                  :text-anchor="node.textAnchor"
                  :dominant-baseline="node.labelBaseline"
                  :class="['rp-star-label', `rp-star-label--${gi}`]"
                  :style="{ fill: clickedNodeKey === node.key ? node.domainColor : 'var(--ink-700, #3D3D3D)' }"
                >{{ node.shortName }}</text>
              </g>
            </svg>

            <!-- Center: user avatar + status -->
            <div class="rp-orbital-center">
              <div class="rp-orbital-avatar">{{ userStore.currentUser?.name?.charAt(0) || '你' }}</div>
              <span class="rp-oc-name">{{ userStore.currentUser?.name || '你' }}</span>
              <span class="rp-oc-status">{{ centerStatusText }}</span>
            </div>

            <!-- Click popup (white card) -->
            <Transition name="rp-pop">
              <div
                v-if="clickedStarNode"
                class="rp-star-popup"
                :style="popupPosition"
                @click.stop
              >
                <div class="rp-star-popup__head">
                  <span class="rp-star-popup__domain" :style="{ color: clickedStarNode.domainColor }">
                    {{ clickedStarNode.domainName }}
                  </span>
                  <button class="rp-star-popup__close" @click="closeStarPopup">
                    <Icon icon="lucide:x" :width="12"/>
                  </button>
                </div>
                <h4 class="rp-star-popup__title">{{ clickedStarNode.jobName }}</h4>
                <p class="rp-star-popup__desc">{{ clickedStarNode.description }}</p>
              </div>
            </Transition>

          </div><!-- /.rp-orbital-field -->
        </div><!-- /.rp-orbital-scene -->

        <!-- Footer data strip -->
        <div class="rp-right-footer">
          <div class="rp-rf-item"><span class="rp-rf-val">15</span><span class="rp-rf-lbl">职业方向</span></div>
          <span class="rp-rf-sep">|</span>
          <div class="rp-rf-item"><span class="rp-rf-val">5</span><span class="rp-rf-lbl">大领域</span></div>
          <span class="rp-rf-sep">|</span>
          <div class="rp-rf-item"><span class="rp-rf-val">全栈</span><span class="rp-rf-lbl">覆盖</span></div>
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
.rp-header__right {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  --uib-icon-color: var(--rp-sub);
  --uib-icon-hover: var(--rp-text);
  --uib-avatar-bg: color-mix(in srgb, var(--rp-red) 18%, var(--rp-panel) 82%);
  --uib-avatar-color: var(--rp-red);
  --uib-name-color: var(--rp-text);
  --uib-role-color: var(--rp-sub);
}

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
  overflow-y: auto;
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
.rp-steps-inline-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--rp-panel); border: 1.5px solid rgba(0,0,0,0.22);
  padding: 8px 14px; transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.rp-steps-inline-row:hover { box-shadow: 0 3px 10px rgba(0,0,0,0.08); }

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

/* Idle form wrapper (natural height, left panel scrolls) */
.rp-idle-form {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.10);
  border-radius: 4px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.rp-idle-form .rp-textarea {
  flex: none;
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
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  user-select: none;
  border: 2px dashed rgba(0,0,0,0.26);
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.rp-drop-zone:hover,
.rp-drop-zone--over {
  background: color-mix(in srgb, var(--rp-red) 4%, var(--rp-panel) 96%);
  border-color: var(--rp-red);
  box-shadow: 0 4px 16px rgba(139,26,0,0.12);
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
  background: var(--rp-panel); border: 1.5px solid rgba(0,0,0,0.20); border-left: 3px solid rgba(0,0,0,0.20);
  padding: 9px 12px; font-size: 12px; color: var(--rp-text);
  font-family: var(--font-body, 'Noto Sans SC', sans-serif);
  line-height: 1.65; resize: none; min-height: 72px; outline: none;
  transition: border-left-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.rp-textarea:focus { border-left-color: var(--rp-red); border-color: var(--rp-red); box-shadow: 0 2px 10px rgba(139,26,0,0.10); }
.rp-textarea::placeholder { color: var(--rp-muted); }

/* Direction section */
.rp-dir-section { display: flex; flex-direction: column; gap: 7px; }
.rp-dir-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; color: var(--rp-sub); text-transform: uppercase; margin: 0; }
.rp-dir-hint { font-weight: 400; color: var(--rp-hint); font-size: 9px; }
/* Domain cards */
.rp-dir-domains { display: flex; flex-direction: column; gap: 5px; }
.rp-dir-domain {
  border: 1.5px solid rgba(0,0,0,0.18); background: var(--rp-panel);
  cursor: pointer; transition: all 0.22s ease; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.rp-dir-domain:hover { border-color: var(--rp-gold); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.rp-dir-domain--active { border-width: 2px; border-color: var(--rp-red); background: color-mix(in srgb, var(--rp-red) 4%, var(--rp-panel) 96%); box-shadow: 0 3px 12px rgba(139,26,0,0.12); }
.rp-dir-domain__head { display: flex; align-items: center; gap: 7px; padding: 8px 11px; min-height: 34px; }
.rp-dir-domain__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.rp-dir-domain__icon { flex-shrink: 0; color: var(--rp-hint); transition: color 0.2s ease; }
.rp-dir-domain--active .rp-dir-domain__icon { color: var(--rp-red); }
.rp-dir-domain__name { flex: 1; font-size: 12px; font-weight: 500; color: var(--rp-sub); letter-spacing: 0.03em; white-space: nowrap; }
.rp-dir-domain--active .rp-dir-domain__name { color: var(--rp-text); font-weight: 600; }
.rp-dir-domain__chevron { flex-shrink: 0; color: var(--rp-hint); transition: transform 0.25s ease, color 0.2s ease; }
.rp-dir-domain--active .rp-dir-domain__chevron { transform: rotate(180deg); color: var(--rp-red); }
.rp-dir-domain__jobs { display: flex; flex-wrap: wrap; gap: 4px; padding: 0 11px 9px 25px; }
.rp-dir-job {
  font-size: 10px; color: var(--rp-sub); letter-spacing: 0.02em; padding: 3px 8px;
  background: color-mix(in srgb, var(--rp-red) 3%, var(--rp-bg) 97%);
  border: 1px solid color-mix(in srgb, var(--rp-red) 12%, var(--rp-border) 88%);
}
.rp-dir-change-btn {
  display: inline-flex; align-items: center; gap: 4px;
  margin-top: 3px; padding: 3px 9px;
  background: transparent; border: 1px solid var(--rp-muted);
  color: var(--rp-hint); font-size: 10px; font-family: inherit; letter-spacing: 0.04em;
  cursor: pointer; transition: all 0.2s ease;
}
.rp-dir-change-btn:hover { border-color: var(--rp-red); color: var(--rp-red); }
/* Direction expand transition */
.rp-dir-expand-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.rp-dir-expand-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.rp-dir-expand-enter-from { opacity: 0; transform: translateY(-4px); }
.rp-dir-expand-leave-to { opacity: 0; transform: translateY(-4px); }

/* Parse button */
.rp-parse-btn {
  width: 100%; height: 46px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: var(--rp-red); border: none; color: var(--rp-bg);
  font-size: 14px; font-family: var(--font-title, inherit);
  letter-spacing: 0.1em; cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease; position: relative; overflow: hidden;
  box-shadow: 0 2px 8px rgba(139,26,0,0.15);
}
.rp-parse-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  transform: translateX(-100%); transition: transform 0.45s ease;
}
.rp-parse-btn:hover:not(:disabled)::before { transform: translateX(100%); }
.rp-parse-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--rp-red) 80%, #fff 20%); box-shadow: 0 4px 14px rgba(139,26,0,0.22); }
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
.rp-progress-area { width: 300px; display: flex; flex-direction: column; gap: 8px; }
.rp-progress-track {
  width: 100%; height: 12px;
  background: rgba(0,0,0,0.14);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);
}
.rp-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #D4A017 0%, #C0392B 60%, #8B1A00 100%);
  border-radius: 999px;
  transition: width 0.2s ease;
  box-shadow: 0 2px 10px rgba(192,57,43,0.55);
  position: relative;
  overflow: hidden;
}
.rp-progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%);
  animation: rp-shimmer 1.8s ease-in-out infinite;
}
@keyframes rp-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.rp-progress-meta { display: flex; justify-content: space-between; align-items: center; }
.rp-progress-pct { font-size: 13px; font-weight: 800; color: var(--rp-red); letter-spacing: 0.04em; }
.rp-progress-steps { font-size: 11px; font-weight: 500; color: var(--rp-sub); letter-spacing: 0.02em; }

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

/* ═══ RIGHT PANEL (light) ═══ */
.rp-left::-webkit-scrollbar { width: 3px; }
.rp-left::-webkit-scrollbar-track { background: transparent; }
.rp-left::-webkit-scrollbar-thumb { background: rgba(139,37,0,0.2); border-radius: 2px; }

.rp-right {
  background-color: var(--parchment-100, #F5F5F3);
  background-image:
    radial-gradient(ellipse at 35% 35%, rgba(190,42,0,0.04) 0%, transparent 55%),
    radial-gradient(ellipse at 70% 65%, rgba(27,78,139,0.03) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Cpath d='M0 50 C40 20 80 80 120 50 S160 20 200 50' stroke='%23000' stroke-opacity='0.035' fill='none' stroke-width='0.9'/%3E%3Cpath d='M0 80 C40 50 80 110 120 80 S160 50 200 80' stroke='%23000' stroke-opacity='0.035' fill='none' stroke-width='0.9'/%3E%3Cpath d='M0 20 C40 -10 80 50 120 20 S160 -10 200 20' stroke='%23000' stroke-opacity='0.035' fill='none' stroke-width='0.9'/%3E%3Cpath d='M0 110 C40 80 80 140 120 110 S160 80 200 110' stroke='%23000' stroke-opacity='0.025' fill='none' stroke-width='0.9'/%3E%3Cpath d='M0 130 C40 100 80 160 120 130 S160 100 200 130' stroke='%23000' stroke-opacity='0.02' fill='none' stroke-width='0.9'/%3E%3C/svg%3E");
  background-size: auto, auto, 200px 150px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border-left: 1px solid var(--rp-border);
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

/* ── Orbital group animations (Kepler: inner ring = fast, outer = slow) ── */
.rp-domain-group {
  transform-box: view-box;
  transform-origin: 50% 50%;
  transition: opacity 0.35s ease, filter 0.35s ease;
}
.rp-domain-group--0 { animation: rp-orbit  50s linear infinite; }
.rp-domain-group--1 { animation: rp-orbit  65s linear infinite reverse; }
.rp-domain-group--2 { animation: rp-orbit  80s linear infinite; }
.rp-domain-group--3 { animation: rp-orbit  95s linear infinite reverse; }
.rp-domain-group--4 { animation: rp-orbit 120s linear infinite; }
@keyframes rp-orbit { to { transform: rotate(360deg); } }

/* hover: dim other groups, highlight active group */
.rp-domain-group--dimmed { opacity: 0.28; filter: grayscale(0.35); }
.rp-domain-group--lit { filter: brightness(1.06); }
.rp-domain-group--lit .rp-star-node { filter: drop-shadow(0 0 5px currentColor); }

/* ── Center ripple ── */
.rp-ripple {
  fill: none; stroke: var(--rp-red); stroke-width: 1.8;
  animation: rp-ripple 4s ease-out infinite;
  pointer-events: none;
}
.rp-ripple--2 { animation-delay: -2.67s; }
.rp-ripple--3 { animation-delay: -1.33s; }
@keyframes rp-ripple {
  0%   { r: 25; opacity: 0.18; stroke-width: 1.8; }
  100% { r: 120; opacity: 0;   stroke-width: 0.3; }
}

/* ── Energy flow on constellation links ── */
.rp-star-link {
  stroke-dasharray: 6 6;
  stroke-dashoffset: 0;
  animation: rp-energy-flow 3s linear infinite;
  transition: stroke-opacity 0.25s ease;
}
@keyframes rp-energy-flow { to { stroke-dashoffset: -24; } }

/* ── Node breathe pulse ── */
.rp-star-node {
  transform-box: fill-box;
  transform-origin: center;
  animation: rp-breathe 4s ease-in-out infinite;
  transition: stroke-opacity 0.22s ease, stroke-width 0.22s ease, fill 0.22s ease;
}
.rp-star-node:nth-child(3n+1) { animation-delay: 0s; }
.rp-star-node:nth-child(3n+2) { animation-delay: -1.33s; }
.rp-star-node:nth-child(3n)   { animation-delay: -2.67s; }
@keyframes rp-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.10); filter: drop-shadow(0 0 4px currentColor); }
}
.rp-star-node--active {
  filter: drop-shadow(0 0 5px currentColor);
}

/* ── Label counter-rotation (keeps text horizontal while group orbits) ── */
.rp-star-label {
  font-size: 8.5px;
  font-family: var(--font-body, 'Noto Sans SC', sans-serif);
  letter-spacing: 0.02em;
  pointer-events: none;
  user-select: none;
  transform-box: fill-box;
  transform-origin: center;
  transition: fill 0.22s ease;
}
/* Group 0 rotates CW → label counter-rotates CCW (reverse) */
.rp-star-label--0 { animation: rp-orbit  50s linear infinite reverse; }
.rp-star-label--1 { animation: rp-orbit  65s linear infinite; }
.rp-star-label--2 { animation: rp-orbit  80s linear infinite reverse; }
.rp-star-label--3 { animation: rp-orbit  95s linear infinite; }
.rp-star-label--4 { animation: rp-orbit 120s linear infinite reverse; }

/* Background dot cloud (slightly denser) */
.rp-dots circle { fill: rgba(0,0,0,0.07); }

/* Orbital center */
.rp-orbital-center {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  z-index: 2;
  pointer-events: none;
}
.rp-orbital-avatar {
  width: 50px; height: 50px; border-radius: 50%;
  background: linear-gradient(135deg, #C03418 0%, #7A1E08 100%);
  border: 2px solid rgba(192,52,24,0.45);
  box-shadow: 0 4px 18px rgba(192,52,24,0.22), 0 1px 4px rgba(0,0,0,0.08);
  display: grid; place-items: center;
  font-size: 18px; font-weight: 600; color: #F0EDE8;
  font-family: var(--font-title, 'LXGW WenKai', sans-serif);
}
.rp-oc-name {
  font-size: 10px; font-weight: 600;
  color: var(--ink-700, #3D3D3D); letter-spacing: 0.06em; white-space: nowrap;
}
.rp-oc-status {
  font-size: 9px; letter-spacing: 0.06em;
  color: var(--ink-300, #999999); white-space: nowrap; text-align: center;
  max-width: 130px; line-height: 1.4;
  transition: opacity 0.3s ease;
}


/* Click popup card */
.rp-star-popup {
  position: absolute;
  z-index: 20;
  width: 210px;
  background: #ffffff;
  border: 1px solid var(--rp-border);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
  padding: 13px 15px;
  display: flex; flex-direction: column; gap: 8px;
}
.rp-star-popup__head {
  display: flex; align-items: center; justify-content: space-between;
}
.rp-star-popup__domain {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase;
}
.rp-star-popup__close {
  width: 20px; height: 20px; border-radius: 50%;
  border: 1px solid var(--rp-border);
  background: transparent; color: var(--rp-hint);
  display: grid; place-items: center; cursor: pointer;
  transition: all 0.2s ease; flex-shrink: 0;
}
.rp-star-popup__close:hover { border-color: var(--rp-red); color: var(--rp-red); }
.rp-star-popup__title {
  margin: 0;
  font-size: 13px; font-weight: 600;
  color: var(--ink-900, #111111); letter-spacing: 0.02em; line-height: 1.35;
  font-family: var(--font-title, inherit);
}
.rp-star-popup__desc {
  margin: 0;
  font-size: 11px; color: var(--ink-500, #666666);
  line-height: 1.65; letter-spacing: 0.02em;
}

/* Popup enter/leave transition */
.rp-pop-enter-active { transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
.rp-pop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.rp-pop-enter-from  { opacity: 0; transform: scale(0.92) translateY(-4px); }
.rp-pop-leave-to    { opacity: 0; transform: scale(0.95); }

/* Right footer data strip */
.rp-right-footer {
  flex-shrink: 0;
  height: 50px;
  background: var(--parchment-200, #EDEDEB);
  border-top: 1px solid var(--rp-border);
  display: flex; align-items: center; justify-content: center;
  gap: 14px; padding: 0 24px;
}
.rp-rf-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.rp-rf-val { font-size: 13px; font-weight: 600; color: var(--ink-900, #111111); letter-spacing: 0.02em; line-height: 1; }
.rp-rf-lbl { font-size: 9px; color: var(--ink-500, #666666); letter-spacing: 0.06em; white-space: nowrap; }
.rp-rf-sep { color: var(--parchment-400, #CBCBC8); font-size: 12px; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .rp-domain-group,
  .rp-star-node,
  .rp-star-link,
  .rp-star-label,
  .rp-ripple { animation: none !important; }
  .rp-domain-group { transition: opacity 0.1s; }
  .rp-pop-enter-active, .rp-pop-leave-active { transition: opacity 0.1s ease; }
}

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
  .rp-right { min-height: 420px; }
  .rp-orbital-field { width: min(100%, 380px); }
  .rp-star-popup { width: 180px; }
}

</style>
