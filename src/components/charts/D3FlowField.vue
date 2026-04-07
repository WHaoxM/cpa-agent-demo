<!-- D3 Flow Field：Career Hero 背景粒子流场（桌面端） -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  minDesktopWidth?: number
  particleCount?: number
}>(), {
  minDesktopWidth: 1024,
  particleCount: 96,
})

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null
let resizeObs: ResizeObserver | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
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
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
    })
  }
}

function field(x: number, y: number): { ax: number; ay: number } {
  const scale = 0.0022
  const angle = Math.sin(x * scale * 1.9) + Math.cos(y * scale * 1.6)
  return {
    ax: Math.cos(angle) * 0.12,
    ay: Math.sin(angle) * 0.12,
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
    ctx.fillStyle = 'rgba(245,239,224,0.06)'
    ctx.fillRect(0, 0, width, height)

    particles.forEach(p => {
      const { ax, ay } = field(p.x, p.y)
      p.vx = p.vx * 0.92 + ax
      p.vy = p.vy * 0.92 + ay

      const dx = p.x - mouseX
      const dy = p.y - mouseY
      const dist = Math.hypot(dx, dy)
      if (dist < 100) {
        const force = (100 - dist) / 100
        p.vx += (dx / Math.max(1, dist)) * force * 0.24
        p.vy += (dy / Math.max(1, dist)) * force * 0.24
      }

      p.x += p.vx
      p.y += p.vy

      if (p.x < -8) p.x = width + 8
      if (p.x > width + 8) p.x = -8
      if (p.y < -8) p.y = height + 8
      if (p.y > height + 8) p.y = -8

      ctx.fillStyle = 'rgba(201,162,39,0.32)'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
      ctx.fill()
    })

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
}

.flow-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
