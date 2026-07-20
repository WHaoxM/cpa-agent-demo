<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import lottie from 'lottie-web'
import type { AnimationItem } from 'lottie-web'
import type { AIAnalysisResult } from '@/types'
import RobotIdleData from '@/assets/animations/robot-idle.json'

const props = defineProps<{
  visible: boolean
  result: AIAnalysisResult | null
}>()

const emit = defineEmits<{
  close: []
}>()

const scoreCircle = computed(() => {
  if (!props.result) return { dash: '0 264', color: 'var(--color-border)' }
  const score = Math.max(0, Math.min(100, props.result.growthScore))
  const circumference = 2 * Math.PI * 42  // r=42
  const dash = `${(score / 100) * circumference} ${circumference}`
  const color = score >= 75 ? 'var(--chart-color-2)' : score >= 50 ? 'var(--color-primary)' : 'var(--color-gold)'
  return { dash, color }
})

// ─── header-mascot Lottie ─────────────────────────────────────────────────────
const mascotThumb = ref<HTMLDivElement | null>(null)
let thumbAnim: AnimationItem | null = null

// ─── 逐步揭示 ────────────────────────────────────────────────────────────────
const revealStep = ref(0)           // 0=loading 1=summary 2=score 3=career 4=timeline 5=nextsteps
const displayedSummary = ref('')
const summaryDone = ref(false)

const revealTimers: ReturnType<typeof setTimeout>[] = []
let typewriterTimer: ReturnType<typeof setInterval> | null = null

function clearAllTimers() {
  revealTimers.forEach(clearTimeout)
  revealTimers.length = 0
  if (typewriterTimer !== null) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
}

function startTypewriter(text: string, onDone: () => void) {
  displayedSummary.value = ''
  summaryDone.value = false
  let i = 0
  typewriterTimer = setInterval(() => {
    if (i < text.length) {
      displayedSummary.value += text[i]
      i++
    } else {
      clearInterval(typewriterTimer!)
      typewriterTimer = null
      summaryDone.value = true
      onDone()
    }
  }, 18)
}

function startReveal() {
  revealStep.value = 0
  displayedSummary.value = ''
  summaryDone.value = false
  clearAllTimers()

  const summary = props.result?.summary ?? ''

  revealTimers.push(setTimeout(() => {
    revealStep.value = 1
    startTypewriter(summary, () => {
      revealTimers.push(setTimeout(() => {
        revealStep.value = 2
        revealTimers.push(setTimeout(() => {
          revealStep.value = 3
          revealTimers.push(setTimeout(() => {
            revealStep.value = 4
            revealTimers.push(setTimeout(() => {
              revealStep.value = 5
            }, 400))
          }, 500))
        }, 500))
      }, 400))
    })
  }, 350))
}

function resetReveal() {
  clearAllTimers()
  revealStep.value = 0
  displayedSummary.value = ''
  summaryDone.value = false
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      setTimeout(() => {
        if (!mascotThumb.value || thumbAnim) return
        thumbAnim = lottie.loadAnimation({
          container: mascotThumb.value,
          animationData: RobotIdleData as object,
          renderer: 'svg',
          loop: true,
          autoplay: true,
        })
      }, 50)
      startReveal()
    } else {
      thumbAnim?.destroy()
      thumbAnim = null
      resetReveal()
    }
  },
)

onBeforeUnmount(() => {
  thumbAnim?.destroy()
  thumbAnim = null
  clearAllTimers()
})

// ─── Hover Tooltip ────────────────────────────────────────────────────────────────
const tip = ref<{ text: string; x: number; y: number } | null>(null)
const TIP_W = 220
const TIP_H = 80   // 预估最大高度，用于边界检测

function showTip(text: string, e: MouseEvent) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let x = e.clientX + 12
  let y = e.clientY - 8
  if (x + TIP_W > vw - 8) x = e.clientX - TIP_W - 12
  if (y + TIP_H > vh - 8) y = vh - TIP_H - 8
  tip.value = { text, x, y }
}

function hideTip() {
  tip.value = null
}
</script>

<template>
  <Transition name="card-overlay">
    <div v-if="visible && result" class="result-overlay" @click.self="emit('close')">
      <div class="result-card">
        <!-- 头部 -->
        <div class="card-header">
          <div class="header-mascot">
            <div ref="mascotThumb" class="mascot-thumb" aria-hidden="true" />
          </div>
          <div class="header-text">
            <h2 class="card-title">成长分析报告</h2>
            <span class="card-time">生成于 {{ result.generatedAt }}</span>
          </div>
          <button class="close-btn" @click="emit('close')" aria-label="关闭">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>

        <div class="card-body">
          <!-- Loading 状态 -->
          <Transition name="loading-fade">
            <div v-if="revealStep === 0" class="loading-state">
              <div class="loading-dots">
                <div class="loading-dot" />
                <div class="loading-dot" />
                <div class="loading-dot" />
              </div>
              <span class="loading-text">AI 正在整理分析结果…</span>
            </div>
          </Transition>

          <!-- 总体评价与鼓励 -->
          <Transition name="reveal">
            <div v-show="revealStep >= 1" class="section summary-section">
              <p class="summary-text" :class="{ 'is-done': summaryDone }">{{ displayedSummary }}</p>
            </div>
          </Transition>

          <!-- 综合成长指数 -->
          <Transition name="reveal">
            <div v-show="revealStep >= 2" class="section score-section">
              <div class="score-ring-wrap">
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" stroke-width="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    :stroke="scoreCircle.color"
                    stroke-width="8"
                    stroke-linecap="round"
                    :stroke-dasharray="scoreCircle.dash"
                    stroke-dashoffset="0"
                    transform="rotate(-90 50 50)"
                    class="score-arc"
                  />
                  <text x="50" y="54" text-anchor="middle" class="score-num">{{ result.growthScore }}</text>
                </svg>
                <span
                  class="score-label tip-trigger"
                  @mouseenter="showTip(result.scoreTooltip, $event)"
                  @mouseleave="hideTip"
                >综合竞争力 <span class="tip-icon">?</span></span>
              </div>

              <div class="ability-col">
                <div class="tag-group">
                  <span
                    class="tag-heading tip-trigger"
                    @mouseenter="showTip('技能权重来自简历关键词提取（NLP解析）与测评表现相结合，按控制项材相关度加权均分。hover 每个标签可查看具体权重。', $event)"
                    @mouseleave="hideTip"
                  >✦ 突出能力 <span class="tip-icon">?</span></span>
                  <div class="tag-list">
                    <span
                      v-for="d in result.topAbilityDetails"
                      :key="d.name"
                      class="tag tag--strong tip-trigger"
                      @mouseenter="showTip(d.detail, $event)"
                      @mouseleave="hideTip"
                    >{{ d.name }}</span>
                  </div>
                </div>
                <div class="tag-group">
                  <span
                    class="tag-heading tip-trigger"
                    @mouseenter="showTip('根据最新画像的 7 维能力得分，取各维度中得分最低的局部方向作为待提升项。hover 每个标签可查看具体得分。', $event)"
                    @mouseleave="hideTip"
                  >↑ 待提升方向 <span class="tip-icon">?</span></span>
                  <div class="tag-list">
                    <span
                      v-for="d in result.improvementDetails"
                      :key="d.name"
                      class="tag tag--improve tip-trigger"
                      @mouseenter="showTip(d.detail, $event)"
                      @mouseleave="hideTip"
                    >{{ d.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- 职业建议 -->
          <Transition name="reveal">
            <div v-show="revealStep >= 3" class="section">
              <h3 class="section-title">职业匹配建议</h3>
              <ul class="suggestion-list">
                <li v-for="(s, i) in result.careerSuggestions" :key="i" class="suggestion-item">
                  {{ s }}
                </li>
              </ul>
            </div>
          </Transition>

          <!-- 成长时间线 -->
          <Transition name="reveal">
            <div v-show="revealStep >= 4 && result.timeline.length > 0" class="section">
              <h3 class="section-title">成长时间线</h3>
              <div class="timeline">
                <div v-for="(item, i) in result.timeline" :key="i" class="timeline-item">
                  <div class="tl-dot" />
                  <div class="tl-content">
                    <span class="tl-date">{{ item.date }}</span>
                    <span class="tl-label">{{ item.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- 下一步建议 -->
          <Transition name="reveal">
            <div v-show="revealStep >= 5" class="section">
              <h3 class="section-title">下一步建议</h3>
              <ol class="next-steps">
                <li v-for="(step, i) in result.nextSteps" :key="i">{{ step }}</li>
              </ol>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 全局 Tooltip （fixed 定位，不居于卡片内） -->
  <Teleport to="body">
    <Transition name="tip-fade">
      <div
        v-if="tip"
        class="global-tip"
        :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
      >{{ tip.text }}</div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── 遮罩（absolute 相对 .bookcase-page，不覆盖导航栏）── */
.result-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* ── 卡片 ── */
.result-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

/* ── 头部 ── */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem 0.8rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.header-mascot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.mascot-thumb {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.card-time {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.close-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.close-btn:hover {
  background: var(--color-background);
  color: var(--color-text);
}

/* ── body ── */
.card-body {
  overflow-y: auto;
  flex: 1;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.section-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.02em;
}

/* ── 评分环 ── */
.score-section {
  flex-direction: row;
  align-items: flex-start;
  gap: 1.1rem;
}

.score-ring-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.score-arc {
  transition: stroke-dasharray 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.score-num {
  font-size: 22px;
  font-weight: 700;
  fill: var(--color-text);
  font-family: var(--font-latin, monospace);
}

.score-label {
  font-size: 0.68rem;
  color: var(--color-text-muted);
}

.ability-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  justify-content: center;
}

.tag-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.tag-heading {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.tag {
  font-size: 0.7rem;
  border-radius: var(--radius-sm);
  padding: 0.15rem 0.5rem;
  border: 1px solid;
}

.tag--strong {
  background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface) 94%);
  border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border) 75%);
  color: var(--color-primary-dark);
}

.tag--improve {
  background: color-mix(in srgb, var(--color-gold) 8%, var(--color-surface) 92%);
  border-color: color-mix(in srgb, var(--color-gold) 30%, var(--color-border) 70%);
  color: var(--color-gold-dark);
}

/* ── 职业建议 ── */
.suggestion-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.suggestion-item {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  padding: 0.35rem 0.6rem;
  background: var(--color-background);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  line-height: 1.5;
}

/* ── 时间线 ── */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 0.5rem;
  border-left: 2px solid var(--color-border);
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.3rem 0 0.3rem 0.75rem;
  position: relative;
}

.tl-dot {
  position: absolute;
  left: -5px;
  top: 0.55rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.tl-content {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.tl-date {
  font-size: 0.65rem;
  color: var(--color-text-subtle);
  font-family: var(--font-latin, monospace);
}

.tl-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ── Loading 状态 ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  padding: 3rem 1rem;
  flex: 1;
}

.loading-dots {
  display: flex;
  gap: 7px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: dot-bounce 1.3s ease-in-out infinite;
}

.loading-dot:nth-child(2) { animation-delay: 0.18s; }
.loading-dot:nth-child(3) { animation-delay: 0.36s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0) scale(0.75); opacity: 0.45; }
  40% { transform: translateY(-7px) scale(1.1); opacity: 1; }
}

.loading-text {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  letter-spacing: 0.01em;
}

.loading-fade-leave-active {
  transition: opacity 0.25s ease;
  position: absolute;
  width: 100%;
}

.loading-fade-leave-to {
  opacity: 0;
}

/* ── 板块淡入滑上 ── */
.reveal-enter-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.reveal-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

/* ── 总体评价 ── */
.summary-section {
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface) 95%);
  border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border) 82%);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.9rem;
}

.summary-text {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text);
  line-height: 1.7;
  font-style: italic;
  min-height: 1.4em;
}

.summary-text::after {
  content: '|';
  display: inline-block;
  color: var(--color-primary);
  animation: cursor-blink 0.7s step-end infinite;
  margin-left: 1px;
}

.summary-text.is-done::after {
  display: none;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ── 下一步 ── */
.next-steps {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.next-steps li {
  font-size: 0.78rem;
  color: var(--color-text);
  line-height: 1.55;
}

/* ── 过渡 ── */
.card-overlay-enter-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-overlay-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease-in;
}

.card-overlay-enter-from,
.card-overlay-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

/* ── Tooltip 触发元素 ── */
.tip-trigger {
  cursor: help;
  position: relative;
}

.score-label.tip-trigger {
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}

.tag-heading.tip-trigger {
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}

.tag.tip-trigger {
  cursor: help;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  font-style: normal;
  line-height: 1;
  margin-left: 3px;
  vertical-align: middle;
  opacity: 0.75;
}

.tip-trigger:hover .tip-icon {
  opacity: 1;
}

/* ── tip-fade 过渡 ── */
.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* ── 响应式 ── */
@media (max-width: 640px) {
  .result-card {
    max-height: 92vh;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }

  .result-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .score-section {
    flex-direction: column;
    align-items: center;
  }
}
</style>

<style>
/* global-tip 通过 Teleport 挂载到 body，需非 scoped 样式 */
.global-tip {
  position: fixed;
  z-index: 9999;
  max-width: 220px;
  padding: 0.5rem 0.7rem;
  background: rgba(20, 20, 30, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #f0f0f0;
  font-size: 0.72rem;
  line-height: 1.55;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  word-break: break-all;
}
</style>
