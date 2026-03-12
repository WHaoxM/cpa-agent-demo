<!-- 组件：墨迹晕染 SVG 动画背景；用于页面转场和 section 背景装饰 -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { gsap } from '@/plugins/gsap'

const props = withDefaults(defineProps<{
  trigger?: boolean
  intensity?: number
  duration?: number
}>(), {
  trigger: true,
  intensity: 40,
  duration: 2.5,
})

const svgRef = ref<SVGSVGElement | null>(null)
const turbulenceRef = ref<SVGFETurbulenceElement | null>(null)
let ctx: ReturnType<typeof gsap.context> | null = null

function animate() {
  if (!svgRef.value || !turbulenceRef.value) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  ctx?.revert()
  ctx = gsap.context(() => {
    /* 墨迹晕染：turbulence baseFrequency 从高到低 → 墨水扩散效果 */
    const obj = { freq: 0.08, scale: props.intensity }
    gsap.to(obj, {
      freq: 0.015,
      scale: 0,
      duration: props.duration,
      ease: 'power2.out',
      onUpdate: () => {
        turbulenceRef.value?.setAttribute('baseFrequency', `${obj.freq}`)
        const disp = svgRef.value?.querySelector('feDisplacementMap')
        if (disp) disp.setAttribute('scale', `${obj.scale}`)
      },
    })

    /* 整体淡入 */
    gsap.fromTo(svgRef.value, {
      opacity: 0,
    }, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
    })
  })
}

onMounted(() => {
  if (props.trigger) animate()
})

watch(() => props.trigger, (val) => {
  if (val) animate()
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <svg
    ref="svgRef"
    class="ink-wash"
    viewBox="0 0 800 600"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <filter id="ink-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          ref="turbulenceRef"
          type="fractalNoise"
          baseFrequency="0.08"
          numOctaves="4"
          seed="3"
          stitchTiles="stitch"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          :scale="intensity"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      <radialGradient id="ink-grad" cx="50%" cy="50%" r="45%">
        <stop offset="0%" stop-color="rgba(26, 20, 16, 0.08)" />
        <stop offset="40%" stop-color="rgba(26, 20, 16, 0.04)" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>
    </defs>

    <rect
      width="800"
      height="600"
      fill="url(#ink-grad)"
      filter="url(#ink-filter)"
    />
  </svg>
</template>

<style scoped>
.ink-wash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
}
</style>
