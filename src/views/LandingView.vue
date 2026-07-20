<!-- 页面：着陆页；路由：/（landing）；角色：PUBLIC -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'
import CareerStarMap from '@/components/career/CareerStarMap.vue'

const router    = useRouter()
const pageRef   = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const glowRef   = ref<HTMLElement | null>(null)
const mapRef    = ref<HTMLElement | null>(null)
const bgRef     = ref<HTMLElement | null>(null)
const titleRef  = ref<HTMLElement | null>(null)
const ctaRef    = ref<HTMLButtonElement | null>(null)

let ctx:           ReturnType<typeof gsap.context> | null = null
let rafId:         number | null = null
let removeResize:  (() => void) | null = null

// ── Particle types ────────────────────────────────────────────────────────
interface Particle { x: number; y: number; r: number; vx: number; vy: number; a: number; ad: number; asp: number; color: number; brightness: number }

// ── Canvas: star dust + shooting stars ───────────────────────────────────
function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const c = canvas.getContext('2d')
  if (!c) return

  let mouseX = window.innerWidth / 2
  let mouseY = window.innerHeight / 2
  let mouseActive = false
  let mouseTimer: ReturnType<typeof setTimeout> | null = null

  const onMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX
    mouseY = e.clientY
    mouseActive = true
    if (mouseTimer) clearTimeout(mouseTimer)
    mouseTimer = setTimeout(() => { mouseActive = false }, 150)
  }
  window.addEventListener('mousemove', onMouseMove)

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
  resize()
  window.addEventListener('resize', resize)
  removeResize = () => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', onMouseMove)
    if (mouseTimer) clearTimeout(mouseTimer)
  }

  // Typed non-null aliases so closures (spawnMeteor, tick) don't lose narrowing
  const cv: HTMLCanvasElement = canvas
  const c2d: CanvasRenderingContext2D = c

  const BRAND_COLORS = [
    [255, 255, 255],   // white
    [201, 162, 39],    // imperial gold
  ]
  const ps: Particle[] = Array.from({ length: 140 }, () => {
    const isBrand = Math.random() < 0.08
    const cIdx = isBrand ? 1 : 0
    return {
      x:   Math.random() * canvas.width,
      y:   Math.random() * canvas.height,
      r:   isBrand ? (0.3 + Math.random() * 1.0) : (0.4 + Math.random() * 1.4),
      vx:  (Math.random() - 0.5) * 0.1,
      vy:  (Math.random() - 0.5) * 0.1,
      a:   Math.random(),
      ad:  Math.random() < 0.5 ? 1 : -1,
      asp: 0.002 + Math.random() * 0.005,
      color: cIdx,
      brightness: 0.5 + Math.random() * 0.5,
    }
  })


  function tick() {
    rafId = requestAnimationFrame(tick)
    const W = cv.width, H = cv.height
    c2d.clearRect(0, 0, W, H)

    for (const p of ps) {
      // Mouse influence: particles pushed away from cursor (DeepSeek style)
      const dx = p.x - mouseX
      const dy = p.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const mouseRange = 180

      if (dist < mouseRange && dist > 0) {
        // Particles push away from mouse with exponential force
        const force = (1 - dist / mouseRange) * 2.5
        const angle = Math.atan2(dy, dx)
        p.vx += Math.cos(angle) * force * 0.15
        p.vy += Math.sin(angle) * force * 0.15
        // Brightness increases when near mouse
        p.brightness = Math.min(1, p.brightness + force * 0.15)
      } else {
        // Slowly return to normal brightness
        p.brightness = Math.max(0.5, p.brightness - 0.015)
      }

      // Apply friction/damping
      p.vx *= 0.96
      p.vy *= 0.96

      // Update position
      p.x = (p.x + p.vx + W) % W
      p.y = (p.y + p.vy + H) % H
      p.a += p.ad * p.asp
      if (p.a > 1 || p.a < 0.05) p.ad *= -1

      c2d.beginPath()
      c2d.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      const c = BRAND_COLORS[p.color] ?? BRAND_COLORS[0]!
      const baseA = p.color === 0 ? 0.30 : 0.42
      const finalAlpha = (p.a * baseA * p.brightness).toFixed(3)
      c2d.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${finalAlpha})`
      c2d.fill()
    }

  }
  tick()
}

// ── Mouse parallax + glow ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QFn = (...args: any[]) => any
let glowX: QFn | null = null
let glowY: QFn | null = null
let mapX:  QFn | null = null
let mapY:  QFn | null = null
let bgX:   QFn | null = null
let bgY:   QFn | null = null

function onMouse(e: MouseEvent) {
  const nx = e.clientX / window.innerWidth  - 0.5
  const ny = e.clientY / window.innerHeight - 0.5
  glowX?.(e.clientX - 180); glowY?.(e.clientY - 180)
  mapX?.(nx * -28);          mapY?.(ny * -28)
  bgX?.(nx * -14);           bgY?.(ny * -14)
  // 更新 CSS 变量驱动鼠标散开层
  pageRef.value?.style.setProperty('--mouse-x', `${e.clientX}px`)
  pageRef.value?.style.setProperty('--mouse-y', `${e.clientY}px`)
}

function initParallax() {
  if (!glowRef.value || !mapRef.value || !bgRef.value) return
  gsap.set(glowRef.value, { x: -180, y: -180 })
  glowX = gsap.quickTo(glowRef.value, 'x', { duration: 0.5,  ease: 'power3.out' })
  glowY = gsap.quickTo(glowRef.value, 'y', { duration: 0.5,  ease: 'power3.out' })
  mapX  = gsap.quickTo(mapRef.value,  'x', { duration: 0.9,  ease: 'power2.out' })
  mapY  = gsap.quickTo(mapRef.value,  'y', { duration: 0.9,  ease: 'power2.out' })
  bgX   = gsap.quickTo(bgRef.value,   'x', { duration: 1.5,  ease: 'power1.out' })
  bgY   = gsap.quickTo(bgRef.value,   'y', { duration: 1.5,  ease: 'power1.out' })
  window.addEventListener('mousemove', onMouse)
}

// ── CTA magnetic button ───────────────────────────────────────────────────
function initCta() {
  const btn = ctaRef.value
  if (!btn) return
  const move = (e: MouseEvent) => {
    const r = btn.getBoundingClientRect()
    gsap.to(btn, {
      x: (e.clientX - r.left - r.width  / 2) * 0.28,
      y: (e.clientY - r.top  - r.height / 2) * 0.28,
      duration: 0.3, ease: 'power2.out', overwrite: 'auto',
    })
  }
  const leave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1,0.4)', overwrite: 'auto' })
  btn.addEventListener('mousemove', move)
  btn.addEventListener('mouseleave', leave)
}

// ── Entry timeline ────────────────────────────────────────────────────────
function initEntry() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (titleRef.value) titleRef.value.textContent = '职导星图'
    return
  }
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ delay: 0.08 })
    tl.from('.ld-nebula',   { opacity: 0, duration: 1.8, ease: 'power2.out'  }, 0)
      .from(canvasRef.value, { autoAlpha: 0, duration: 1.4, ease: 'power2.out' }, 0)
      .from(mapRef.value, {
        autoAlpha: 0, scale: 0.86, filter: 'blur(12px)',
        duration: 1.6, ease: 'power3.out', clearProps: 'filter',
      }, 0.2)
      .from('.ld-pulse-ring', { autoAlpha: 0, scale: 0.2, duration: 1.4, ease: 'power3.out' }, 0.5)
      .from('.ld-corner',     { autoAlpha: 0, stagger: 0.12, duration: 0.6, ease: 'power2.out' }, 1.4)
      .from('.ld-sep', { scaleX: 0, duration: 0.75, ease: 'power2.inOut', transformOrigin: 'left center' }, 1.65)
      .to(titleRef.value,    { duration: 0.9, text: { value: '职导星图', delimiter: '' }, ease: 'none' }, 1.85)
      .from('.ld-sub',       { autoAlpha: 0, y: 8, duration: 0.5, ease: 'power2.out' }, 2.5)
      .from(ctaRef.value,    { autoAlpha: 0, y: 10, duration: 0.5, ease: 'power3.out' }, 2.65)
  }, pageRef.value ?? undefined)
}

function goToLogin() { router.push('/login') }

onMounted(() => {
  initCanvas()
  initParallax()
  initCta()
  initEntry()
})

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  removeResize?.()
  window.removeEventListener('mousemove', onMouse)
  ctx?.revert()
})
</script>

<template>
  <div ref="pageRef" class="ld-page">

    <!-- 鼠标散开层（DeepSeek风格） -->
    <div class="ld-mouse-zone" aria-hidden="true" />

    <!-- 粒子画布 -->
    <canvas ref="canvasRef" class="ld-canvas" aria-hidden="true" />

    <!-- 视差背景层（星云渐变） -->
    <div ref="bgRef" class="ld-bg-layer">
      <div class="ld-nebula ld-nebula--a" />
      <div class="ld-nebula ld-nebula--b" />
      <div class="ld-nebula ld-nebula--c" />
    </div>

    <!-- 暗角遮罩 -->
    <div class="ld-vignette" aria-hidden="true" />

    <!-- 鼠标光晕 -->
    <div ref="glowRef" class="ld-glow" aria-hidden="true" />

    <!-- 角落标注 -->
    <span class="ld-corner ld-corner--tl">职业导航平台</span>
    <span class="ld-corner ld-corner--tr">2026</span>

    <!-- 星图主体（视差层） -->
    <div ref="mapRef" class="ld-map-wrap">
      <div class="ld-pulse-ring" aria-hidden="true" />
      <CareerStarMap theme="dark" class="ld-starmap" />
    </div>

    <!-- 分割线 -->
    <div class="ld-sep" aria-hidden="true"></div>

    <!-- 底部说明栏 -->
    <footer class="ld-footer">
      <div class="ld-footer-left">
        <h1 ref="titleRef" class="ld-title"></h1>
        <p class="ld-sub">找到你在职业星空中的坐标</p>
      </div>
      <div class="ld-footer-right">
        <button ref="ctaRef" class="ld-cta" @click="goToLogin">
          <span>进入</span>
          <Icon icon="lucide:arrow-right" class="ld-cta__arrow" />
        </button>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* ── 页面 ────────────────────────────────────────────────────────────────── */
.ld-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: #13131A;
  background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 30px 30px;
  overflow: hidden;
}

/* ── 粒子画布 ──────────────────────────────────────────────────────────────── */
.ld-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  will-change: opacity;
}

/* ── 视差背景层 ────────────────────────────────────────────────────────────── */
.ld-bg-layer {
  position: absolute;
  inset: -60px;
  z-index: 1;
  pointer-events: none;
}

/* ── 星云渐变 ──────────────────────────────────────────────────────────────── */
.ld-nebula {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ld-nebula--a {
  background: radial-gradient(ellipse 70% 60% at 50% 48%, rgba(201,162,39,0.042) 0%, transparent 65%);
  animation: ld-nebula-drift 28s ease-in-out infinite alternate;
}

.ld-nebula--b {
  background: radial-gradient(ellipse 90% 70% at 50% 50%, rgba(255,255,255,0.013) 0%, transparent 60%);
  animation: none;
}

.ld-nebula--c {
  background: none;
  animation: none;
}

@keyframes ld-nebula-drift {
  0%   { opacity: 0.75; transform: scale(1) translate(0, 0); }
  100% { opacity: 1;   transform: scale(1.03) translate(0.5%, 0.4%); }
}

/* ── 暗角遮罩 ──────────────────────────────────────────────────────────────── */
.ld-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: radial-gradient(ellipse 88% 88% at 50% 48%, transparent 40%, rgba(0,0,0,0.35) 100%);
  pointer-events: none;
}

/* ── 鼠标光晕（增强版 - DeepSeek风格） ─────────────────────────────────── */
.ld-glow {
  position: fixed;
  top: 0;
  left: 0;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(201, 162, 39, 0.04) 0%,
    rgba(255, 255, 255, 0.015) 35%,
    transparent 62%
  );
  pointer-events: none;
  z-index: 3;
  will-change: transform;
  opacity: 0.55;
}

/* ── 鼠标散开层（覆盖整个页面的粒子交互区） ────────────────────────────── */
.ld-mouse-zone {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    circle 160px at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.016) 0%,
    transparent 55%
  );
  transition: background 0.4s ease;
}

/* ── 角落标注 ──────────────────────────────────────────────────────────────── */
.ld-corner {
  position: absolute;
  z-index: 10;
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.22em;
  color: rgba(255, 255, 255, 0.55);
  pointer-events: none;
  user-select: none;
}

.ld-corner--tl { top: 20px; left: 28px; }
.ld-corner--tr { top: 20px; right: 28px; }

/* ── 星图主体 ──────────────────────────────────────────────────────────────── */
.ld-map-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  position: relative;
  z-index: 5;
  will-change: transform;
}

/* ── 激活脉冲环 ────────────────────────────────────────────────────────────── */
.ld-pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 240px;
  margin: -120px 0 0 -120px;
  border-radius: 50%;
  border: 1px solid rgba(190,42,0,0.13);
  box-shadow: 0 0 16px rgba(190,42,0,0.07), inset 0 0 10px rgba(190,42,0,0.03);
  pointer-events: none;
  z-index: 4;
  animation: ld-pulse 5s ease-in-out infinite;
}

@keyframes ld-pulse {
  0%, 100% { box-shadow: 0 0 16px rgba(190,42,0,0.07), inset 0 0 10px rgba(190,42,0,0.03); }
  50%       { box-shadow: 0 0 26px rgba(190,42,0,0.12), inset 0 0 16px rgba(190,42,0,0.05); }
}

.ld-starmap {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 5;
}

/* ── 分割线 ────────────────────────────────────────────────────────────────── */
.ld-sep {
  flex-shrink: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0;
  z-index: 6;
  animation: ld-breathe 4s ease-in-out infinite;
}

@keyframes ld-breathe {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
}

/* ── 底部说明栏 ────────────────────────────────────────────────────────────── */
.ld-footer {
  flex-shrink: 0;
  height: 88px;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(24px, 4vw, 56px);
  gap: 20px;
}

.ld-footer-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ld-footer-right {
  flex-shrink: 0;
}

/* ── 主标题 ────────────────────────────────────────────────────────────────── */
.ld-title {
  margin: 0;
  font-family: var(--font-title);
  font-size: clamp(22px, 2.8vw, 36px);
  font-weight: 100;
  letter-spacing: 0.45em;
  line-height: 1;
  color: rgba(255, 255, 255, 0.92);
  min-height: 1.2em;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.88) 0%,
    rgba(201,162,39,0.55) 46%,
    rgba(255,255,255,0.88) 54%,
    rgba(255,255,255,0.88) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ld-title-shimmer 10s ease-in-out infinite;
}

@keyframes ld-title-shimmer {
  0%, 100% { background-position: 100% 0; }
  50% { background-position: 0% 0; }
}

/* ── 副标题 ────────────────────────────────────────────────────────────────── */
.ld-sub {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.65);
  background: linear-gradient(90deg, rgba(255,255,255,0.58), rgba(201,162,39,0.38), rgba(255,255,255,0.58));
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ld-title-shimmer 12s ease-in-out infinite;
}

/* ── CTA 按钮 ──────────────────────────────────────────────────────────────── */
.ld-cta {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 22px;
  background: rgba(190, 42, 0, 0.12);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(201, 162, 39, 0.4);
  border-radius: 2px;
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 0.2em;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  will-change: transform;
  box-shadow: 0 0 12px rgba(190, 42, 0, 0.08);
}

.ld-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(190,42,0,0.0) 0%, rgba(201,162,39,0.2) 50%, rgba(190,42,0,0.0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ld-cta:hover::before {
  opacity: 1;
}

.ld-cta:hover {
  color: rgba(255, 255, 255, 0.98);
  border-color: rgba(201,162,39,0.7);
  background: rgba(190, 42, 0, 0.2);
  box-shadow: 0 0 18px rgba(190, 42, 0, 0.16), 0 0 36px rgba(201, 162, 39, 0.06);
}

.ld-cta__arrow {
  font-size: 13px;
  transition: transform 0.2s ease;
}

.ld-cta:hover .ld-cta__arrow {
  transform: translateX(4px);
  color: rgba(201,162,39,0.9);
}

/* ── 响应式 ────────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .ld-footer { height: 80px; padding: 0 20px; }
  .ld-title  { letter-spacing: 0.3em; }
}

@media (max-width: 480px) {
  .ld-footer {
    height: auto;
    padding: 16px 18px;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  .ld-title { font-size: clamp(18px, 5vw, 24px); letter-spacing: 0.25em; }
  .ld-cta   { width: 100%; justify-content: center; }
}

/* ── prefers-reduced-motion ────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ld-nebula,
  .ld-sep,
  .ld-pulse-ring { animation: none !important; }
  .ld-cta,
  .ld-cta__arrow { transition: none; }
}
</style>
