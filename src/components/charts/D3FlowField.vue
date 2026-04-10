<!-- D3 Flow Field：Career Hero 背景粒子流场（桌面端） -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  minDesktopWidth?: number
  particleCount?: number
}>(), {
  minDesktopWidth: 1024,
  particleCount: 72,
})

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null
let resizeObs: ResizeObserver | null = null

interface Particle {
  x: number
  y: number
  px: number
  py: number
  vx: number
  vy: number
  depth: number
  radius: number
  drift: number
  phase: number
  tint: 'warm' | 'cool'
}

const particles: Particle[] = []
let mouseX = -9999
let mouseY = -9999

function isEnabled(): boolean {
  return window.innerWidth >= props.minDesktopWidth
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function resetParticles(width: number, height: number) {
  particles.length = 0
  for (let i = 0; i < props.particleCount; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const depth = Math.random() * 0.85 + 0.25
    particles.push({
      x,
      y,
      px: x,
      py: y,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.04,
      depth,
      radius: 0.45 + depth * 1.2,
      drift: (Math.random() - 0.5) * 0.03,
      phase: Math.random() * Math.PI * 2,
      tint: Math.random() > 0.56 ? 'cool' : 'warm',
    })
  }
}

function field(x: number, y: number, time: number, depth: number): { ax: number; ay: number } {
  const scale = 0.00165
  const wave = Math.sin(x * scale * 1.1 + time * 0.00018 + depth * 1.4)
  const curl = Math.cos(y * scale * 1.35 - x * scale * 0.22 - time * 0.00012)
  const angle = wave * 1.9 + curl * 1.4
  const strength = 0.028 + depth * 0.034
  return {
    ax: Math.cos(angle) * strength,
    ay: Math.sin(angle * 0.92) * strength * 0.72 + Math.cos(time * 0.0003 + y * scale) * 0.006,
  }
}

function stopAnimation() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function startAnimation() {
  const canvas = canvasRef.value
  const wrap = wrapRef.value
  if (!canvas || !wrap || !isEnabled()) {
    stopAnimation()
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
  const width = wrap.clientWidth
  const height = wrap.clientHeight

  canvas.width = Math.max(1, Math.floor(width * dpr))
  canvas.height = Math.max(1, Math.floor(height * dpr))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (!particles.length) resetParticles(width, height)

  const tick = () => {
    const now = performance.now()

    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    const backdrop = ctx.createLinearGradient(0, 0, 0, height)
    backdrop.addColorStop(0, 'rgba(7, 10, 16, 0.035)')
    backdrop.addColorStop(0.58, 'rgba(7, 10, 16, 0.082)')
    backdrop.addColorStop(1, 'rgba(4, 7, 12, 0.16)')
    ctx.fillStyle = backdrop
    ctx.fillRect(0, 0, width, height)

    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = 0.18
    const warmGlow = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, width * 0.42)
    warmGlow.addColorStop(0, 'rgba(199, 168, 107, 0.12)')
    warmGlow.addColorStop(0.4, 'rgba(199, 168, 107, 0.05)')
    warmGlow.addColorStop(1, 'rgba(199, 168, 107, 0)')
    ctx.fillStyle = warmGlow
    ctx.fillRect(0, 0, width, height)

    ctx.globalAlpha = 0.16 + Math.sin(now * 0.00022) * 0.03
    const coolGlow = ctx.createRadialGradient(width * 0.78, height * 0.14, 0, width * 0.78, height * 0.14, width * 0.48)
    coolGlow.addColorStop(0, 'rgba(121, 168, 255, 0.14)')
    coolGlow.addColorStop(0.42, 'rgba(121, 168, 255, 0.06)')
    coolGlow.addColorStop(1, 'rgba(121, 168, 255, 0)')
    ctx.fillStyle = coolGlow
    ctx.fillRect(0, 0, width, height)

    ctx.globalAlpha = 0.06 + Math.sin(now * 0.00014) * 0.02
    const beam = ctx.createLinearGradient(width * 0.86, height * 0.04, width * 0.46, height)
    beam.addColorStop(0, 'rgba(255, 255, 255, 0)')
    beam.addColorStop(0.44, 'rgba(255, 255, 255, 0.028)')
    beam.addColorStop(0.52, 'rgba(121, 168, 255, 0.05)')
    beam.addColorStop(0.64, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = beam
    ctx.fillRect(0, 0, width, height)

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    particles.forEach(p => {
      p.px = p.x
      p.py = p.y

      const { ax, ay } = field(p.x, p.y, now, p.depth)
      p.vx = p.vx * 0.962 + ax + p.drift * 0.05
      p.vy = p.vy * 0.962 + ay

      const dx = p.x - mouseX
      const dy = p.y - mouseY
      const dist = Math.hypot(dx, dy)
      if (dist < 140) {
        const force = ((140 - dist) / 140) ** 2
        p.vx += (dx / Math.max(1, dist)) * force * 0.16 * p.depth
        p.vy += (dy / Math.max(1, dist)) * force * 0.16 * p.depth
      }

      p.x += p.vx * (0.7 + p.depth * 0.45)
      p.y += p.vy * (0.68 + p.depth * 0.42)

      if (p.x < -12) {
        p.x = width + 12
        p.px = p.x
      }
      if (p.x > width + 12) {
        p.x = -12
        p.px = p.x
      }
      if (p.y < -12) {
        p.y = height + 12
        p.py = p.y
      }
      if (p.y > height + 12) {
        p.y = -12
        p.py = p.y
      }

      ctx.globalAlpha = 1
      const alpha = 0.06 + p.depth * 0.12 + (Math.sin(now * 0.0014 + p.phase) + 1) * 0.018
      const strokeColor = p.tint === 'cool'
        ? `rgba(121, 168, 255, ${alpha})`
        : `rgba(199, 168, 107, ${alpha * 0.92})`
      const fillColor = p.tint === 'cool'
        ? `rgba(179, 211, 255, ${alpha + 0.08})`
        : `rgba(231, 203, 142, ${alpha + 0.05})`
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = Math.max(0.65, p.radius)
      ctx.beginPath()
      ctx.moveTo(p.px, p.py)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()

      ctx.fillStyle = fillColor
      ctx.shadowBlur = p.depth > 0.8 ? 10 * p.depth : 0
      ctx.shadowColor = p.tint === 'cool' ? 'rgba(121, 168, 255, 0.26)' : 'rgba(199, 168, 107, 0.24)'
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.45, p.radius * 0.72), 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    ctx.globalCompositeOperation = 'source-over'
    rafId = requestAnimationFrame(tick)
  }

  stopAnimation()
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  startAnimation()

  resizeObs = new ResizeObserver(() => {
    particles.length = 0
    startAnimation()
  })
  if (wrapRef.value) resizeObs.observe(wrapRef.value)

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseleave', handleMouseLeave)
  window.addEventListener('resize', handleWindowResize)
})

function handleMouseMove(event: MouseEvent) {
  const wrap = wrapRef.value
  if (!wrap) return
  const rect = wrap.getBoundingClientRect()
  mouseX = event.clientX - rect.left
  mouseY = event.clientY - rect.top
}

function handleMouseLeave() {
  mouseX = -9999
  mouseY = -9999
}

function handleWindowResize() {
  particles.length = 0
  startAnimation()
}

onUnmounted(() => {
  stopAnimation()
  resizeObs?.disconnect()
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeave)
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <div ref="wrapRef" class="flow-wrap" aria-hidden="true">
    <canvas ref="canvasRef" class="flow-canvas" />
  </div>
</template>

<style scoped>
.flow-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.96;
}

.flow-wrap::before,
.flow-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.flow-wrap::before {
  background:
    radial-gradient(circle at 22% 30%, rgba(199, 168, 107, 0.16), transparent 22%),
    radial-gradient(circle at 80% 16%, rgba(121, 168, 255, 0.18), transparent 24%),
    linear-gradient(122deg, transparent 36%, rgba(255, 255, 255, 0.05) 48%, rgba(121, 168, 255, 0.04) 54%, transparent 68%);
  mix-blend-mode: screen;
  opacity: 0.72;
  filter: blur(16px);
  animation: flowAtmosphere 18s linear infinite;
}

.flow-wrap::after {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 18%),
    radial-gradient(circle at 50% 100%, rgba(7, 11, 18, 0.38), transparent 56%),
    linear-gradient(180deg, rgba(6, 9, 14, 0.05), rgba(6, 9, 14, 0.18));
  opacity: 0.78;
}

.flow-canvas {
  width: 100%;
  height: 100%;
  display: block;
  filter: blur(0.2px);
}

@keyframes flowAtmosphere {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-2%, 3%, 0) scale(1.03);
  }
}

@media (max-width: 1023px) {
  .flow-wrap {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-wrap::before {
    animation: none;
  }
}
</style>
