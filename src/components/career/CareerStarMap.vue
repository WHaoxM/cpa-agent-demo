<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { CAREER_DOMAINS } from '@/composables/useCareerInsights'
import type { BubbleDomain } from '@/composables/useCareerInsights'

const props = withDefaults(defineProps<{
  userName?: string
  statusText?: string
  theme?: 'light' | 'dark'
}>(), {
  userName: '',
  statusText: '探索 5 大领域 · 15 个职业方向',
  theme: 'light',
})

const isDark = computed(() => props.theme === 'dark')

const JOB_DESCRIPTIONS: Record<string, string> = {
  'Vue 前端工程师': '使用 Vue 生态构建交互丰富的 Web 应用，关注组件化与工程化实践。',
  'React 前端工程师': '基于 React 技术栈开发大型单页应用，掌握状态管理与性能优化。',
  '可视化工程师': '运用 D3/ECharts/WebGL 将复杂数据转化为直观可交互的图表与大屏。',
  'Java 后端工程师': '使用 Spring 生态构建高并发分布式服务，精通数据库与中间件。',
  'Go 后端工程师': '以 Go 语言开发高性能微服务，擅长并发编程与云原生架构。',
  'Python 后端工程师': '使用 Django/FastAPI 快速构建 Web 服务与数据处理管道。',
  '自动化测试工程师': '设计与维护自动化测试框架，保障持续集成流水线的质量门禁。',
  '质量平台工程师': '搭建测试平台与效能工具，提升团队研发质量与交付效率。',
  '性能测试工程师': '通过压测与调优定位系统瓶颈，确保服务在高负载下稳定运行。',
  '商业数据分析师': '结合业务场景进行数据建模与洞察，驱动产品与运营决策。',
  '数据开发工程师': '构建数据仓库与 ETL 管道，为分析和算法提供高质量数据基座。',
  '增长分析师': '通过 A/B 测试与漏斗分析挖掘用户增长机会，优化转化路径。',
  '算法工程师': '研发推荐、搜索、风控等核心算法，将模型落地为线上服务。',
  '深度学习工程师': '训练与部署 CV/NLP/多模态模型，优化推理性能与模型精度。',
  'AI 应用工程师': '基于大模型 API 构建智能应用，设计 Prompt 工程与 Agent 流程。',
}

const JOB_SHORT: Record<string, string> = {
  'Vue 前端工程师': 'Vue前端',
  'React 前端工程师': 'React前端',
  '可视化工程师': '数据可视化',
  'Java 后端工程师': 'Java后端',
  'Go 后端工程师': 'Go后端',
  'Python 后端工程师': 'Python后端',
  '自动化测试工程师': '自动化测试',
  '质量平台工程师': '测试平台',
  '性能测试工程师': '性能测试',
  '商业数据分析师': '商业数分',
  '数据开发工程师': '数据开发',
  '增长分析师': '增长数分',
  '算法工程师': '算法工程',
  '深度学习工程师': '深度学习',
  'AI 应用工程师': 'AI应用开发',
}

interface StarNode {
  key: string
  jobName: string
  shortName: string
  description: string
  domainId: string
  domainName: string
  domainColor: string
  domainIdx: number
  jobIdx: number
  cx: number
  cy: number
  lx: number
  ly: number
  textAnchor: string
  labelBaseline: string
}

interface StarLink {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  domainId: string
}

interface DomainGroup {
  domain: BubbleDomain
  domainIdx: number
  nodes: StarNode[]
  links: StarLink[]
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
  const centerX = 260
  const centerY = 260
  return CAREER_DOMAINS.flatMap((domain, domainIndex) =>
    domain.jobs.map((jobName, jobIndex) => {
      const radius = RING_RADII[domainIndex]!
      const angleDeg = BASE_ANGLES_DEG[domainIndex]! + jobIndex * 120
      const angle = (angleDeg * Math.PI) / 180
      const shortName = JOB_SHORT[jobName] ?? jobName.slice(0, 3)
      const cx = centerX + radius * Math.cos(angle)
      const cy = centerY + radius * Math.sin(angle)
      const labelRadius = radius + 24 + Math.max(shortName.length - 4, 0) * 4
      const lx = centerX + labelRadius * Math.cos(angle)
      const ly = centerY + labelRadius * Math.sin(angle)
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)

      return {
        key: `${domain.id}-${jobIndex}`,
        jobName,
        shortName,
        description: JOB_DESCRIPTIONS[jobName] ?? '',
        domainId: domain.id,
        domainName: domain.name,
        domainColor: domain.color,
        domainIdx: domainIndex,
        jobIdx: jobIndex,
        cx,
        cy,
        lx,
        ly,
        textAnchor: cosAngle > 0.3 ? 'start' : cosAngle < -0.3 ? 'end' : 'middle',
        labelBaseline: sinAngle > 0.3 ? 'hanging' : sinAngle < -0.3 ? 'auto' : 'middle',
      }
    }),
  )
})

const starLinks = computed<StarLink[]>(() => {
  const links: StarLink[] = []
  CAREER_DOMAINS.forEach(domain => {
    const nodes = starNodes.value.filter(node => node.domainId === domain.id)
    if (nodes.length === 3) {
      ;([[0, 1], [1, 2], [0, 2]] as [number, number][]).forEach(([a, b], index) => {
        links.push({
          key: `${domain.id}-lk-${index}`,
          x1: nodes[a]!.cx,
          y1: nodes[a]!.cy,
          x2: nodes[b]!.cx,
          y2: nodes[b]!.cy,
          color: domain.color,
          domainId: domain.id,
        })
      })
    }
  })
  return links
})

const domainGroups = computed<DomainGroup[]>(() =>
  CAREER_DOMAINS.map((domain, domainIndex) => ({
    domain,
    domainIdx: domainIndex,
    nodes: starNodes.value.filter(node => node.domainId === domain.id),
    links: starLinks.value.filter(link => link.domainId === domain.id),
  })),
)

const hoveredNodeKey = ref<string | null>(null)
const clickedNodeKey = ref<string | null>(null)

const hoveredDomainId = computed(() =>
  starNodes.value.find(node => node.key === hoveredNodeKey.value)?.domainId ?? null,
)

const clickedStarNode = computed(() =>
  starNodes.value.find(node => node.key === clickedNodeKey.value) ?? null,
)

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

const displayName = computed(() => props.userName || '你')
const userInitial = computed(() => displayName.value.charAt(0) || '你')

function handleStarClick(key: string) {
  clickedNodeKey.value = clickedNodeKey.value === key ? null : key
}

function closeStarPopup() {
  clickedNodeKey.value = null
}
</script>

<template>
  <div class="rp-right" :class="{ 'rp-right--dark': isDark }">
    <div class="rp-orbital-scene">
      <div class="rp-orbital-field" @click="closeStarPopup">
        <svg class="rp-orbital-svg" viewBox="0 0 520 520" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="rpCG2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#BE2A00" :stop-opacity="isDark ? 0.18 : 0.07"/>
              <stop offset="60%" stop-color="#BE2A00" :stop-opacity="isDark ? 0.06 : 0.02"/>
              <stop offset="100%" stop-color="#BE2A00" stop-opacity="0"/>
            </radialGradient>
            <pattern id="rpGrid" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="13" cy="13" r="0.7" :fill="isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.07)'"/>
            </pattern>
            <filter id="rpNoise" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" result="n"/>
              <feColorMatrix type="saturate" values="0" in="n" result="g"/>
              <feComponentTransfer in="g"><feFuncA type="linear" :slope="isDark ? 0.01 : 0.025"/></feComponentTransfer>
            </filter>
          </defs>

          <rect width="520" height="520" fill="url(#rpGrid)" :opacity="isDark ? 0.3 : 0.85"/>
          <rect v-if="!isDark" width="520" height="520" filter="url(#rpNoise)"/>

          <g class="rp-dots">
            <circle cx="42" cy="88" r="1.2"/><circle cx="480" cy="62" r="1.5"/><circle cx="310" cy="30" r="1.0"/>
            <circle cx="58" cy="310" r="1.3"/><circle cx="490" cy="340" r="1.2"/><circle cx="130" cy="480" r="1.0"/>
            <circle cx="390" cy="490" r="1.4"/><circle cx="70" cy="440" r="1.1"/><circle cx="460" cy="180" r="1.2"/>
            <circle cx="26" cy="200" r="1.0"/><circle cx="500" cy="460" r="1.3"/><circle cx="200" cy="18" r="1.1"/>
            <circle cx="448" cy="405" r="1.2"/><circle cx="88" cy="150" r="1.0"/><circle cx="336" cy="500" r="1.3"/>
            <circle cx="170" cy="62" r="1.1"/><circle cx="495" cy="260" r="1.0"/><circle cx="24" cy="380" r="1.2"/>
            <circle cx="350" cy="48" r="1.1"/><circle cx="408" cy="122" r="1.0"/><circle cx="112" cy="398" r="1.2"/>
            <circle cx="478" cy="510" r="1.0"/><circle cx="158" cy="496" r="1.1"/><circle cx="38" cy="510" r="1.0"/>
            <circle cx="240" cy="50" r="0.8"/><circle cx="415" cy="75" r="0.9"/><circle cx="80" cy="260" r="1.0"/>
            <circle cx="145" cy="120" r="0.7"/><circle cx="375" cy="165" r="0.8"/><circle cx="510" cy="140" r="0.9"/>
            <circle cx="30" cy="470" r="0.8"/><circle cx="260" cy="505" r="0.9"/><circle cx="435" cy="460" r="0.7"/>
            <circle cx="185" cy="340" r="0.8"/><circle cx="340" cy="370" r="0.7"/><circle cx="470" cy="400" r="0.8"/>
          </g>
          <g :stroke="isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'" stroke-width="0.8">
            <line x1="46" y1="38" x2="52" y2="38"/><line x1="49" y1="35" x2="49" y2="41"/>
            <line x1="475" y1="478" x2="481" y2="478"/><line x1="478" y1="475" x2="478" y2="481"/>
            <line x1="472" y1="28" x2="478" y2="28"/><line x1="475" y1="25" x2="475" y2="31"/>
            <line x1="38" y1="485" x2="44" y2="485"/><line x1="41" y1="482" x2="41" y2="488"/>
          </g>

          <circle cx="260" cy="260" r="200" fill="url(#rpCG2)"/>

          <circle
            v-for="(domain, index) in CAREER_DOMAINS"
            :key="`ring-${domain.id}`"
            cx="260"
            cy="260"
            :r="RING_RADII[index]"
            :stroke="domain.color"
            stroke-opacity="0.45"
            stroke-width="1.2"
            stroke-dasharray="5 12"
            :class="['rp-ring', `rp-ring--${index + 1}`]"
            fill="none"
          />

          <circle class="rp-ripple rp-ripple--1" cx="260" cy="260"/>
          <circle class="rp-ripple rp-ripple--2" cx="260" cy="260"/>
          <circle class="rp-ripple rp-ripple--3" cx="260" cy="260"/>

          <g
            v-for="(group, index) in domainGroups"
            :key="`dg-${group.domain.id}`"
            :class="['rp-domain-group', `rp-domain-group--${index}`, {
              'rp-domain-group--dimmed': hoveredDomainId && hoveredDomainId !== group.domain.id,
              'rp-domain-group--lit': hoveredDomainId === group.domain.id,
            }]"
          >
            <line
              v-for="link in group.links"
              :key="link.key"
              :x1="link.x1"
              :y1="link.y1"
              :x2="link.x2"
              :y2="link.y2"
              :stroke="link.color"
              stroke-opacity="0.40"
              stroke-width="1.5"
              class="rp-star-link"
            />
            <circle
              v-for="node in group.nodes"
              :key="`nc-${node.key}`"
              :cx="node.cx"
              :cy="node.cy"
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
            <text
              v-for="node in group.nodes"
              :key="`nt-${node.key}`"
              :x="node.lx"
              :y="node.ly"
              :text-anchor="node.textAnchor"
              :dominant-baseline="node.labelBaseline"
              :class="['rp-star-label', `rp-star-label--${index}`]"
              :style="{ fill: clickedNodeKey === node.key ? node.domainColor : (isDark ? 'rgba(255,255,255,0.78)' : 'var(--ink-700, #3D3D3D)') }"
            >{{ node.shortName }}</text>
          </g>
        </svg>

        <div v-if="!isDark" class="rp-orbital-center">
          <div class="rp-orbital-avatar">{{ userInitial }}</div>
          <span class="rp-oc-name">{{ displayName }}</span>
          <span class="rp-oc-status">{{ statusText }}</span>
        </div>

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
      </div>
    </div>

    <div v-if="!isDark" class="rp-right-footer">
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
</template>

<style scoped>
:root {
  --rp-border: var(--parchment-400, #CBCBC8);
  --rp-red: var(--color-primary-dark, #8B1A00);
  --rp-hint: var(--color-text-subtle, #999999);
}

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
}

.rp-right--dark {
  background-color: transparent;
  background-image: none;
}

.rp-right--dark .rp-dots circle {
  fill: rgba(255,255,255,0.15);
}

.rp-right--dark .rp-star-popup {
  background: #1a1525;
  border-color: rgba(255,255,255,0.12);
  box-shadow: 0 8px 28px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
}

.rp-right--dark .rp-star-popup__title {
  color: rgba(255,255,255,0.92);
}

.rp-right--dark .rp-star-popup__desc {
  color: rgba(255,255,255,0.58);
}

.rp-right--dark .rp-star-popup__close {
  border-color: rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.45);
}

.rp-right--dark .rp-orbital-scene {
  padding: 8px;
}

.rp-right--dark .rp-orbital-field {
  width: min(100%, calc(100vh - 100px));
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

.rp-domain-group {
  transform-box: view-box;
  transform-origin: 50% 50%;
  transition: opacity 0.35s ease, filter 0.35s ease;
}

.rp-domain-group--0 { animation: rp-orbit 50s linear infinite; }
.rp-domain-group--1 { animation: rp-orbit 65s linear infinite reverse; }
.rp-domain-group--2 { animation: rp-orbit 80s linear infinite; }
.rp-domain-group--3 { animation: rp-orbit 95s linear infinite reverse; }
.rp-domain-group--4 { animation: rp-orbit 120s linear infinite; }

@keyframes rp-orbit {
  to { transform: rotate(360deg); }
}

.rp-domain-group--dimmed { opacity: 0.28; filter: grayscale(0.35); }
.rp-domain-group--lit { filter: brightness(1.06); }
.rp-domain-group--lit .rp-star-node { filter: drop-shadow(0 0 5px currentColor); }

.rp-ripple {
  fill: none;
  stroke: var(--rp-red);
  stroke-width: 1.8;
  animation: rp-ripple 4s ease-out infinite;
  pointer-events: none;
}

.rp-ripple--2 { animation-delay: -2.67s; }
.rp-ripple--3 { animation-delay: -1.33s; }

@keyframes rp-ripple {
  0% { r: 25; opacity: 0.18; stroke-width: 1.8; }
  100% { r: 120; opacity: 0; stroke-width: 0.3; }
}

.rp-star-link {
  stroke-dasharray: 6 6;
  stroke-dashoffset: 0;
  animation: rp-energy-flow 3s linear infinite;
  transition: stroke-opacity 0.25s ease;
}

@keyframes rp-energy-flow {
  to { stroke-dashoffset: -24; }
}

.rp-star-node {
  transform-box: fill-box;
  transform-origin: center;
  animation: rp-breathe 4s ease-in-out infinite;
  transition: stroke-opacity 0.22s ease, stroke-width 0.22s ease, fill 0.22s ease;
}

.rp-star-node:nth-child(3n+1) { animation-delay: 0s; }
.rp-star-node:nth-child(3n+2) { animation-delay: -1.33s; }
.rp-star-node:nth-child(3n) { animation-delay: -2.67s; }

@keyframes rp-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.10); filter: drop-shadow(0 0 4px currentColor); }
}

.rp-star-node--active { filter: drop-shadow(0 0 5px currentColor); }

.rp-star-label {
  font-size: 9px;
  font-family: var(--font-body, 'Noto Sans SC', sans-serif);
  letter-spacing: 0.02em;
  pointer-events: none;
  user-select: none;
  transform-box: fill-box;
  transform-origin: center;
  transition: fill 0.22s ease;
}

.rp-star-label--0 { animation: rp-orbit 50s linear infinite reverse; }
.rp-star-label--1 { animation: rp-orbit 65s linear infinite; }
.rp-star-label--2 { animation: rp-orbit 80s linear infinite reverse; }
.rp-star-label--3 { animation: rp-orbit 95s linear infinite; }
.rp-star-label--4 { animation: rp-orbit 120s linear infinite reverse; }

.rp-dots circle { fill: rgba(0,0,0,0.07); }

.rp-orbital-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  z-index: 2;
  pointer-events: none;
}

.rp-orbital-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #C03418 0%, #7A1E08 100%);
  border: 2px solid rgba(192,52,24,0.45);
  box-shadow: 0 4px 18px rgba(192,52,24,0.22), 0 1px 4px rgba(0,0,0,0.08);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #F0EDE8;
  font-family: var(--font-title, 'LXGW WenKai', sans-serif);
}

.rp-oc-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-700, #3D3D3D);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.rp-oc-status {
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--ink-300, #999999);
  white-space: nowrap;
  text-align: center;
  max-width: 130px;
  line-height: 1.4;
  transition: opacity 0.3s ease;
}

.rp-star-popup {
  position: absolute;
  z-index: 20;
  width: 210px;
  background: #ffffff;
  border: 1px solid var(--rp-border);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
  padding: 13px 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rp-star-popup__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rp-star-popup__domain {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.rp-star-popup__close {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--rp-border);
  background: transparent;
  color: var(--rp-hint);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.rp-star-popup__close:hover {
  border-color: var(--rp-red);
  color: var(--rp-red);
}

.rp-star-popup__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-900, #111111);
  letter-spacing: 0.02em;
  line-height: 1.35;
  font-family: var(--font-title, inherit);
}

.rp-star-popup__desc {
  margin: 0;
  font-size: 11px;
  color: var(--ink-500, #666666);
  line-height: 1.65;
  letter-spacing: 0.02em;
}

.rp-pop-enter-active { transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
.rp-pop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.rp-pop-enter-from { opacity: 0; transform: scale(0.92) translateY(-4px); }
.rp-pop-leave-to { opacity: 0; transform: scale(0.95); }

.rp-right-footer {
  flex-shrink: 0;
  height: 50px;
  background: var(--parchment-200, #EDEDEB);
  border-top: 1px solid var(--rp-border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 0 24px;
}

.rp-rf-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.rp-rf-val { font-size: 13px; font-weight: 600; color: var(--ink-900, #111111); letter-spacing: 0.02em; line-height: 1; }
.rp-rf-lbl { font-size: 9px; color: var(--ink-500, #666666); letter-spacing: 0.06em; white-space: nowrap; }
.rp-rf-sep { color: var(--parchment-400, #CBCBC8); font-size: 12px; }

@media (prefers-reduced-motion: reduce) {
  .rp-domain-group,
  .rp-star-node,
  .rp-star-link,
  .rp-star-label,
  .rp-ripple { animation: none !important; }

  .rp-domain-group { transition: opacity 0.1s; }
  .rp-pop-enter-active,
  .rp-pop-leave-active { transition: opacity 0.1s ease; }
}

@media (max-width: 768px) {
  .rp-right { min-height: 420px; }
  .rp-orbital-field { width: min(100%, 380px); }
  .rp-star-popup { width: 180px; }
}
</style>
