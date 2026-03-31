<!-- 页面：职途导航 · 简历导入；路由：student/career-navigation；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'
import { useUserStore } from '@/stores'
import { useResumeStore } from '@/stores/resume'
import { getCareerInsightsMock, roleOptions } from '@/composables/useCareerInsights'
import type { CareerRole } from '@/composables/useCareerInsights'

const router = useRouter()
const userStore = useUserStore()
const resumeStore = useResumeStore()

/* ═══ 主题色（与 CareerAnalysis 统一） ═══ */
const C = {
  bg: '#F7F2E8',
  panel: '#EDE5D6',
  panelBorder: '#D4C9B5',
  zhusha: '#8B2500',
  gold: '#8B6914',
  textPrimary: '#1A1410',
  textSecondary: '#6B5D4F',
  textMuted: '#9C8B78',
}
void C

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

const ACCEPTED_EXTS = ['.doc', '.docx', '.ppt', '.pptx', '.pdf', '.txt']
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

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  gsap.fromTo('.rp-result-area', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
  gsap.fromTo('.rp-skill-chip', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, stagger: 0.04, duration: 0.25, ease: 'back.out(1.4)', delay: 0.1 })
  gsap.fromTo('.rp-career-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.3, ease: 'power2.out', delay: 0.2 })
}

function goToProfile() {
  const role = resumeStore.insights?.predictedRole ?? resumeStore.matchedCareers[0]?.role ?? '前端开发'
  router.push({ name: 'career-ability', query: { role } })
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
})

onBeforeUnmount(() => {
  gsapCtx?.revert()
})

/* ═══ 注释保留（Step 3 用）: roadmapMap 原有数据已移除，如需恢复请查看 Git 历史 ═══ */

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
            <span>开始匹配</span>
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

      <!-- RIGHT: Orbital visualization -->
      <div class="rp-right">

        <!-- Orbital scene -->
        <div class="rp-orbital-scene">
          <div class="rp-orbital-field">

          <!-- SVG animated rings + spokes -->
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
            <circle cx="260" cy="260" r="115" fill="url(#rpCG)"/>
            <circle cx="260" cy="260" r="200" fill="url(#rpMG)"/>
            <!-- orbital rings -->
            <circle class="rp-ring rp-ring--1" cx="260" cy="260" r="100" stroke="#8B2500" stroke-opacity="0.5" stroke-width="1.2" stroke-dasharray="8 12"/>
            <circle class="rp-ring rp-ring--2" cx="260" cy="260" r="165" stroke="#8B6914" stroke-opacity="0.32" stroke-width="1" stroke-dasharray="5 16"/>
            <circle class="rp-ring rp-ring--3" cx="260" cy="260" r="222" stroke="#C4B9A6" stroke-opacity="0.38" stroke-width="1.2" stroke-dasharray="4 14"/>
            <!-- spokes to inner nodes -->
            <line x1="260" y1="260" x2="260" y2="160" stroke="#8B2500" stroke-opacity="0.18" stroke-width="0.7" stroke-dasharray="2 4"/>
            <line x1="260" y1="260" x2="347" y2="310" stroke="#8B2500" stroke-opacity="0.18" stroke-width="0.7" stroke-dasharray="2 4"/>
            <line x1="260" y1="260" x2="173" y2="310" stroke="#8B2500" stroke-opacity="0.18" stroke-width="0.7" stroke-dasharray="2 4"/>
            <!-- spokes to mid nodes -->
            <line x1="260" y1="260" x2="403" y2="178" stroke="#8B6914" stroke-opacity="0.12" stroke-width="0.6" stroke-dasharray="2 4"/>
            <line x1="260" y1="260" x2="260" y2="425" stroke="#8B6914" stroke-opacity="0.12" stroke-width="0.6" stroke-dasharray="2 4"/>
            <line x1="260" y1="260" x2="117" y2="178" stroke="#8B6914" stroke-opacity="0.12" stroke-width="0.6" stroke-dasharray="2 4"/>
            <!-- spokes to outer nodes -->
            <line x1="260" y1="260" x2="416" y2="104" stroke="#C4B9A6" stroke-opacity="0.08" stroke-width="0.5" stroke-dasharray="2 5"/>
            <line x1="260" y1="260" x2="104" y2="416" stroke="#C4B9A6" stroke-opacity="0.08" stroke-width="0.5" stroke-dasharray="2 5"/>
          </svg>

          <!-- Center: user avatar -->
          <div class="rp-orbital-center">
            <div class="rp-orbital-avatar">{{ userStore.currentUser?.name?.charAt(0) || '你' }}</div>
            <span class="rp-oc-label">{{ (userStore.currentUser?.name || '你') + '的位置' }}</span>
          </div>

          <!-- Inner ring nodes (r=100, 3 nodes at 120° apart starting from top) -->
          <!-- 互联网: (260,160) → 50%, 30.8% -->
          <div class="rp-onode" style="left:50%;top:30.8%">
            <div class="rp-obubble" style="--nc:#8B2500;--nbg:rgba(139,37,0,0.22)"><Icon icon="lucide:globe" :width="13"/></div>
            <div class="rp-olabel rp-olabel--above"><span class="rp-oname">互联网</span><span class="rp-ocount">2,847</span></div>
          </div>
          <!-- 金融: (347,310) → 66.7%, 59.6% -->
          <div class="rp-onode" style="left:66.7%;top:59.6%">
            <div class="rp-obubble" style="--nc:#8B6914;--nbg:rgba(139,105,20,0.22)"><Icon icon="lucide:trending-up" :width="13"/></div>
            <div class="rp-olabel rp-olabel--right"><span class="rp-oname">金融</span><span class="rp-ocount">1,623</span></div>
          </div>
          <!-- 医疗: (173,310) → 33.3%, 59.6% -->
          <div class="rp-onode" style="left:33.3%;top:59.6%">
            <div class="rp-obubble" style="--nc:#4A8B6A;--nbg:rgba(74,139,106,0.22)"><Icon icon="lucide:heart-pulse" :width="13"/></div>
            <div class="rp-olabel rp-olabel--left"><span class="rp-oname">医疗</span><span class="rp-ocount">892</span></div>
          </div>

          <!-- Mid ring nodes (r=165, 3 nodes at 120° apart starting from upper-right) -->
          <!-- 制造: (403,178) → 77.5%, 34.2% -->
          <div class="rp-onode" style="left:77.5%;top:34.2%">
            <div class="rp-obubble" style="--nc:#9A7B4E;--nbg:rgba(154,123,78,0.22)"><Icon icon="lucide:factory" :width="13"/></div>
            <div class="rp-olabel rp-olabel--right"><span class="rp-oname">制造</span><span class="rp-ocount">1,204</span></div>
          </div>
          <!-- 教育: (260,425) → 50%, 81.7% -->
          <div class="rp-onode" style="left:50%;top:81.7%">
            <div class="rp-obubble" style="--nc:#4A6B8A;--nbg:rgba(74,107,138,0.22)"><Icon icon="lucide:graduation-cap" :width="13"/></div>
            <div class="rp-olabel rp-olabel--below"><span class="rp-oname">教育</span><span class="rp-ocount">734</span></div>
          </div>
          <!-- 零售: (117,178) → 22.5%, 34.2% -->
          <div class="rp-onode" style="left:22.5%;top:34.2%">
            <div class="rp-obubble" style="--nc:#8A5B4E;--nbg:rgba(138,91,78,0.22)"><Icon icon="lucide:shopping-bag" :width="13"/></div>
            <div class="rp-olabel rp-olabel--left"><span class="rp-oname">零售</span><span class="rp-ocount">612</span></div>
          </div>

          <!-- Outer ring nodes (r=220, diagonal ±45°) -->
          <!-- 物流: angle=-45° → (416,104) → 80%, 20% -->
          <div class="rp-onode rp-onode--sm" style="left:80%;top:20%">
            <div class="rp-obubble" style="--nc:#6A7A5B;--nbg:rgba(106,122,91,0.18)"><Icon icon="lucide:truck" :width="12"/></div>
            <div class="rp-olabel rp-olabel--right"><span class="rp-oname">物流</span><span class="rp-ocount">481</span></div>
          </div>
          <!-- 建筑: angle=135° → (104,416) → 20%, 80% -->
          <div class="rp-onode rp-onode--sm" style="left:20%;top:80%">
            <div class="rp-obubble" style="--nc:#8A7A5B;--nbg:rgba(138,122,91,0.18)"><Icon icon="lucide:building-2" :width="12"/></div>
            <div class="rp-olabel rp-olabel--left"><span class="rp-oname">建筑</span><span class="rp-ocount">376</span></div>
          </div>

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

        <!-- Done: results overlay (slides in over orbital) -->
        <Transition name="rp-fade">
          <div v-if="parsePhase === 'done'" class="rp-right-results">
            <div class="rp-result-card">
              <div class="rp-result-card__head">
                <Icon icon="lucide:circle-check-big" :width="13" class="rp-result-ok"/>
                <span class="rp-result-card__title">识别技能 · {{ resumeStore.parsedSkills.length }} 项</span>
              </div>
              <div class="rp-skill-chips">
                <span v-for="sk in resumeStore.parsedSkills" :key="sk.name" class="rp-skill-chip"
                  :class="`rp-skill-chip--${sk.category === '前端' ? 'fe' : sk.category === '后端' ? 'be' : sk.category === '测试' ? 'qa' : sk.category === '数据' ? 'da' : sk.category === '机器学习' ? 'ml' : 'gen'}`"
                >{{ sk.name }}</span>
              </div>
            </div>
            <div class="rp-result-card">
              <div class="rp-result-card__head">
                <Icon icon="lucide:circle-check-big" :width="13" class="rp-result-ok"/>
                <span class="rp-result-card__title">职业匹配度</span>
              </div>
              <div class="rp-career-cards">
                <div v-for="(c, i) in resumeStore.matchedCareers.slice(0, 5)" :key="c.role" class="rp-career-card">
                  <span class="rp-career-rank">{{ i + 1 }}</span>
                  <span class="rp-career-role">{{ c.role }}</span>
                  <div class="rp-career-bar-wrap"><div class="rp-career-bar" :style="{ width: Math.round(c.score * 100) + '%' }"></div></div>
                  <span class="rp-career-score">{{ Math.round(c.score * 100) }}%</span>
                </div>
              </div>
            </div>
            <div class="rp-cta-block">
              <button class="rp-next-btn" @click="goToProfile">
                <span>查看完整能力画像</span><Icon icon="lucide:arrow-right" :width="15"/>
              </button>
              <p class="rp-next-hint">Step 02 · 技能图谱 &amp; 优劣势分析</p>
            </div>
          </div>
        </Transition>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── CSS vars ── */
:root {
  --rp-bg: #F7F2E8;
  --rp-panel: #EDE5D6;
  --rp-border: #D4C9B5;
  --rp-muted: #C4B9A6;
  --rp-red: #8B2500;
  --rp-gold: #8B6914;
  --rp-text: #1A1410;
  --rp-sub: #6B5D4F;
  --rp-hint: #9C8B78;
  --rp-dark: #1A1008;
  --rp-dark2: #120D06;
}

/* ── Page container ── */
.rp-page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: var(--rp-bg);
  display: flex;
  flex-direction: column;
  font-family: var(--font-title, 'LXGW WenKai', serif);
  overflow: hidden;
}
.rp-page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(26,20,16,0.06) 1px, transparent 0);
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
  background: #EDE5D6;
  border-bottom: 1px solid #D4C9B5;
  flex-shrink: 0;
}
.rp-header__left { display: flex; align-items: center; gap: 14px; }
.rp-header__center { display: flex; justify-content: center; }
.rp-header__right { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }

.rp-back {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border: 1px solid #D4C9B5;
  background: transparent; color: #6B5D4F;
  font-size: 12px; font-family: inherit; cursor: pointer;
  transition: all 0.2s ease; letter-spacing: 0.04em;
}
.rp-back:hover { border-color: #8B2500; color: #8B2500; }

.rp-brand-name { font-size: 13px; font-weight: 700; color: #1A1410; letter-spacing: 0.14em; }

.rp-header-tag {
  font-size: 10px; letter-spacing: 0.18em;
  color: #9C8B78; border: 1px solid #D4C9B5;
  padding: 3px 12px; text-transform: uppercase;
}

.rp-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: color-mix(in srgb, #8B2500 12%, #EDE5D6 88%);
  border: 1.5px solid color-mix(in srgb, #8B2500 25%, #D4C9B5 75%);
  display: grid; place-items: center;
  font-size: 12px; font-weight: 700; color: #8B2500; flex-shrink: 0;
}
.rp-username { font-size: 12px; color: #6B5D4F; letter-spacing: 0.04em; }

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
  border-right: 1px solid #D4C9B5;
  background: #F7F2E8;
  position: relative;
  z-index: 1;
}

/* Editorial Headline */
.rp-editorial {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid #D4C9B5;
}
.rp-greeting {
  font-size: 11px; letter-spacing: 0.18em;
  color: #9C8B78; text-transform: uppercase; font-weight: 600;
}
.rp-display-title {
  display: flex; flex-direction: column; gap: 0; margin: 4px 0 0;
}
.rp-dt-a {
  display: block; font-size: 20px; font-weight: 400;
  color: #6B5D4F; letter-spacing: 0.08em; line-height: 1.3;
}
.rp-dt-b {
  display: block; font-size: 34px; font-weight: 900;
  color: #1A1410; letter-spacing: 0.01em; line-height: 1.1; margin: 1px 0;
}
.rp-dt-c {
  display: block; font-size: 24px; font-weight: 700;
  color: #8B2500; letter-spacing: 0.06em; line-height: 1.15;
}
.rp-data-proof {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: #9C8B78; margin: 4px 0 0; letter-spacing: 0.04em;
}
.rp-sep { font-style: normal; color: #C4B9A6; font-size: 10px; }

/* Step indicator (inline compact) */
.rp-steps-inline { display: flex; align-items: center; gap: 8px; }
.rp-si-step { display: flex; align-items: center; gap: 5px; opacity: 0.35; transition: opacity 0.2s ease; }
.rp-si-step--active { opacity: 1; }
.rp-si-dot { width: 6px; height: 6px; border-radius: 50%; background: #C4B9A6; flex-shrink: 0; transition: background 0.2s ease; }
.rp-si-step--active .rp-si-dot { background: #8B2500; }
.rp-si-num { font-size: 10px; font-weight: 700; color: #9C8B78; letter-spacing: 0.1em; }
.rp-si-step--active .rp-si-num { color: #8B2500; }
.rp-si-name { font-size: 11px; color: #6B5D4F; letter-spacing: 0.04em; white-space: nowrap; }
.rp-si-step--active .rp-si-name { font-weight: 700; color: #1A1410; }
.rp-si-line { flex: 1; max-width: 28px; height: 1px; background: #D4C9B5; }

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
  background: #F0EBE0;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease;
  user-select: none;
  border: 1px dashed #C4B9A6;
}
.rp-drop-zone:hover,
.rp-drop-zone--over {
  background: color-mix(in srgb, #8B2500 4%, #F0EBE0 96%);
  border-color: #8B2500;
}

.rp-drop-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  transition: width 0.25s ease, height 0.25s ease, border-color 0.25s ease;
}
.rp-drop-corner--tl { top: 0; left: 0; border-top: 2px solid #8B6914; border-left: 2px solid #8B6914; }
.rp-drop-corner--tr { top: 0; right: 0; border-top: 2px solid #8B6914; border-right: 2px solid #8B6914; }
.rp-drop-corner--bl { bottom: 0; left: 0; border-bottom: 2px solid #8B6914; border-left: 2px solid #8B6914; }
.rp-drop-corner--br { bottom: 0; right: 0; border-bottom: 2px solid #8B6914; border-right: 2px solid #8B6914; }
.rp-drop-zone:hover .rp-drop-corner,
.rp-drop-zone--over .rp-drop-corner { border-color: #8B2500; width: 20px; height: 20px; }

.rp-file-input {
  position: absolute; inset: 0; opacity: 0;
  width: 100%; height: 100%; cursor: pointer; z-index: -1;
}

.rp-drop-body { display: flex; flex-direction: column; align-items: center; gap: 5px; z-index: 1; }

.rp-drop-icon-wrap {
  width: 40px; height: 40px; border: 1.5px solid #C4B9A6;
  display: grid; place-items: center; background: #EDE5D6;
  margin-bottom: 2px; transition: all 0.25s ease;
}
.rp-drop-zone:hover .rp-drop-icon-wrap,
.rp-drop-zone--over .rp-drop-icon-wrap {
  border-color: #8B2500;
  background: color-mix(in srgb, #8B2500 6%, #EDE5D6 94%);
}
.rp-drop-icon { color: #8B6914; }

.rp-drop-title {
  font-size: 14px; font-weight: 700; color: #1A1410;
  letter-spacing: 0.04em; margin: 0;
  text-align: center; max-width: 240px; word-break: break-all;
}
.rp-drop-formats { font-size: 11px; color: #9C8B78; margin: 0; letter-spacing: 0.08em; }

/* Or divider */
.rp-or-row { display: flex; align-items: center; gap: 8px; }
.rp-or-line { flex: 1; height: 1px; background: #D4C9B5; }
.rp-or-text { font-size: 11px; color: #9C8B78; letter-spacing: 0.08em; white-space: nowrap; }

/* ── Textarea ── */
.rp-textarea {
  width: 100%; box-sizing: border-box;
  background: #F0EBE0; border: 1px solid #C4B9A6; border-left: 3px solid #C4B9A6;
  padding: 9px 12px; font-size: 12px; color: #1A1410;
  font-family: var(--font-body, 'Noto Sans SC', sans-serif);
  line-height: 1.65; resize: none; min-height: 72px; outline: none;
  transition: border-left-color 0.2s ease;
}
.rp-textarea:focus { border-left-color: #8B2500; }
.rp-textarea::placeholder { color: #B5A898; }

/* Direction tiles */
.rp-dir-section { display: flex; flex-direction: column; gap: 7px; }
.rp-dir-label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: #6B5D4F; text-transform: uppercase; margin: 0; }
.rp-dir-hint { font-weight: 400; color: #9C8B78; font-size: 9px; }
.rp-dir-tiles { display: flex; flex-wrap: wrap; gap: 5px; }
.rp-dir-tile {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 11px; border: 1px solid #D4C9B5;
  background: #EDE5D6; color: #6B5D4F;
  font-size: 11px; font-family: inherit;
  cursor: pointer; transition: all 0.2s ease; letter-spacing: 0.04em;
}
.rp-dir-tile:hover { border-color: #8B6914; color: #8B6914; background: color-mix(in srgb, #8B6914 5%, #EDE5D6 95%); }
.rp-dir-tile--active { border-color: #8B2500; background: #8B2500; color: #F7F2E8; }
.rp-dir-tile__icon { flex-shrink: 0; color: #9C8B78; transition: color 0.2s ease; }
.rp-dir-tile--active .rp-dir-tile__icon { color: #F7F2E8; }
.rp-dir-tile__name { white-space: nowrap; }

/* Parse button */
.rp-parse-btn {
  width: 100%; height: 46px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: #8B2500; border: none; color: #F7F2E8;
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
.rp-parse-btn:hover:not(:disabled) { background: #A0472D; }
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
  border: 2px solid color-mix(in srgb, #8B2500 25%, #D4C9B5 75%);
  display: grid; place-items: center;
  background: color-mix(in srgb, #8B2500 4%, #EDE5D6 96%);
}
.rp-loading-spin { color: #8B2500; animation: rp-spin 1.2s linear infinite; }
@keyframes rp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.rp-loading-msg { font-size: 13px; color: #6B5D4F; letter-spacing: 0.06em; margin: 0; }
.rp-progress-track { width: 220px; height: 3px; background: #D4C9B5; overflow: hidden; }
.rp-progress-fill { height: 100%; background: linear-gradient(90deg, #8B6914, #8B2500); transition: width 0.15s linear; }
.rp-progress-pct { font-size: 13px; font-weight: 700; color: #8B2500; margin: 0; letter-spacing: 0.08em; }

/* Done state (left) */
.rp-done-status {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: color-mix(in srgb, #5B7744 5%, #F0EBE0 95%);
  border: 1px solid color-mix(in srgb, #5B7744 20%, #D4C9B5 80%);
  font-size: 13px; font-weight: 600; color: #1A1410;
}
.rp-done-icon { color: #5B7744; flex-shrink: 0; }
.rp-done-status span { flex: 1; }

.rp-result-reset {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border: 1px solid #D4C9B5;
  background: transparent; color: #9C8B78;
  font-size: 11px; font-family: inherit; cursor: pointer;
  transition: all 0.2s ease; letter-spacing: 0.04em;
}
.rp-result-reset:hover { border-color: #8B2500; color: #8B2500; }

.rp-privacy {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 8px 10px;
  background: color-mix(in srgb, #5B7744 4%, #EDE5D6 96%);
  border: 1px solid color-mix(in srgb, #5B7744 15%, #D4C9B5 85%);
}
.rp-privacy__icon { color: #5B7744; flex-shrink: 0; margin-top: 1px; }
.rp-privacy__text { font-size: 11px; color: #6B5D4F; line-height: 1.6; margin: 0; }

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
  background: linear-gradient(135deg, #8B2500 0%, #4A1200 100%);
  border: 2px solid rgba(139,37,0,0.6);
  box-shadow: 0 0 24px rgba(139,37,0,0.4), 0 0 48px rgba(139,37,0,0.12);
  display: grid; place-items: center;
  font-size: 18px; font-weight: 900; color: #F7E8DC;
  font-family: var(--font-title, 'LXGW WenKai', serif);
}
.rp-oc-label {
  font-size: 9px; letter-spacing: 0.14em;
  color: rgba(197,180,160,0.65); white-space: nowrap;
}

/* Orbit nodes */
.rp-onode {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center;
  z-index: 3;
}
.rp-onode--sm { opacity: 0.8; }

.rp-obubble {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--nbg, rgba(139,37,0,0.15));
  border: 1.5px solid var(--nc, #8B2500);
  display: grid; place-items: center;
  color: var(--nc, #8B2500);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 0 10px var(--nbg, rgba(139,37,0,0.1));
}
.rp-onode--sm .rp-obubble { width: 28px; height: 28px; }
.rp-onode:hover .rp-obubble {
  transform: scale(1.15);
  box-shadow: 0 0 18px var(--nbg, rgba(139,37,0,0.25));
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
  color: rgba(220,205,185,0.9); letter-spacing: 0.08em; white-space: nowrap;
}
.rp-ocount {
  font-size: 9px; color: rgba(155,140,115,0.65);
  letter-spacing: 0.04em; white-space: nowrap;
}

/* Right footer data strip */
.rp-right-footer {
  flex-shrink: 0;
  height: 50px;
  background: #100D06;
  border-top: 1px solid rgba(139,37,0,0.22);
  display: flex; align-items: center; justify-content: center;
  gap: 14px; padding: 0 24px;
}
.rp-rf-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.rp-rf-val { font-size: 13px; font-weight: 700; color: rgba(215,190,155,0.9); letter-spacing: 0.04em; line-height: 1; }
.rp-rf-lbl { font-size: 9px; color: rgba(135,120,95,0.65); letter-spacing: 0.1em; white-space: nowrap; }
.rp-rf-sep { color: rgba(95,80,60,0.35); font-size: 12px; }

/* Done results overlay */
.rp-right-results {
  position: absolute;
  inset: 0; bottom: 50px;
  background: rgba(20,12,5,0.94);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  overflow-y: auto;
  padding: 22px;
  display: flex; flex-direction: column; gap: 12px;
  z-index: 10;
}

.rp-result-card {
  background: rgba(237,229,214,0.05);
  border: 1px solid rgba(212,201,181,0.18);
  padding: 13px;
  display: flex; flex-direction: column; gap: 10px;
}
.rp-result-card__head {
  display: flex; align-items: center; gap: 7px;
  padding-bottom: 8px; border-bottom: 1px solid rgba(212,201,181,0.12);
}
.rp-result-ok { color: #5B7744; flex-shrink: 0; }
.rp-result-card__title {
  font-size: 11px; font-weight: 700;
  color: rgba(220,205,185,0.8); letter-spacing: 0.12em; text-transform: uppercase;
}

.rp-skill-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.rp-skill-chip {
  font-size: 10px; padding: 3px 9px;
  background: rgba(240,235,224,0.05); border: 1px solid rgba(196,185,166,0.2);
  color: rgba(200,185,165,0.8); white-space: nowrap; letter-spacing: 0.04em;
}
.rp-skill-chip--fe { border-color: rgba(43,76,111,0.5); color: rgba(130,165,200,0.9); }
.rp-skill-chip--be { border-color: rgba(91,119,68,0.5); color: rgba(130,185,130,0.9); }
.rp-skill-chip--qa { border-color: rgba(139,105,20,0.5); color: rgba(200,165,80,0.9); }
.rp-skill-chip--da { border-color: rgba(107,63,140,0.5); color: rgba(180,140,210,0.9); }
.rp-skill-chip--ml { border-color: rgba(139,37,0,0.5); color: rgba(220,130,100,0.9); }

.rp-career-cards { display: flex; flex-direction: column; gap: 6px; }
.rp-career-card {
  display: grid; grid-template-columns: 16px 1fr 1fr 34px;
  align-items: center; gap: 8px;
  padding: 7px 10px;
  background: rgba(240,235,224,0.04);
  border: 1px solid rgba(212,201,181,0.1);
}
.rp-career-rank { font-size: 10px; font-weight: 700; color: rgba(139,105,20,0.8); text-align: center; }
.rp-career-card:first-child .rp-career-rank { color: rgba(139,37,0,0.9); }
.rp-career-role { font-size: 11px; font-weight: 600; color: rgba(220,205,185,0.85); white-space: nowrap; }
.rp-career-bar-wrap { height: 3px; background: rgba(212,201,181,0.12); overflow: hidden; }
.rp-career-bar { height: 100%; background: linear-gradient(90deg, #8B6914, #8B2500); transition: width 0.6s ease; }
.rp-career-score { font-size: 10px; font-weight: 700; color: rgba(139,37,0,0.9); text-align: right; }

.rp-cta-block { display: flex; flex-direction: column; gap: 7px; padding-top: 2px; }
.rp-next-btn {
  display: inline-flex; align-items: center; gap: 8px;
  align-self: flex-start; padding: 10px 24px;
  background: #8B2500; border: none; color: #F7F2E8;
  font-size: 13px; font-family: inherit; letter-spacing: 0.08em;
  cursor: pointer; transition: background 0.2s ease;
}
.rp-next-btn:hover { background: #A0472D; }
.rp-next-hint { font-size: 10px; color: rgba(140,125,100,0.65); margin: 0; }

/* Fade transition */
.rp-fade-enter-active { transition: opacity 0.4s ease, transform 0.35s ease; }
.rp-fade-leave-active { transition: opacity 0.25s ease; }
.rp-fade-enter-from { opacity: 0; transform: translateY(10px); }
.rp-fade-leave-to { opacity: 0; }

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
