<!-- 组件：印章盖印动画；旋转+缩放+透明度模拟盖印效果 -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { gsap } from '@/plugins/gsap'

const props = withDefaults(defineProps<{
  text?: string
  size?: number
  shape?: 'square' | 'round'
  delay?: number
  trigger?: boolean
}>(), {
  text: '学',
  size: 44,
  shape: 'square',
  delay: 0.5,
  trigger: true,
})

const sealRef = ref<HTMLElement | null>(null)
let ctx: ReturnType<typeof gsap.context> | null = null

function animate() {
  if (!sealRef.value) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    gsap.set(sealRef.value, { opacity: 0.85, scale: 1, rotation: 0 })
    return
  }

  ctx?.revert()
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ delay: props.delay })
    tl.fromTo(sealRef.value, {
      scale: 2,
      rotation: -20,
      opacity: 0,
    }, {
      scale: 0.95,
      rotation: 3,
      opacity: 0.9,
      duration: 0.25,
      ease: 'power4.in',
    })
    .to(sealRef.value, {
      scale: 1,
      rotation: 0,
      opacity: 0.85,
      duration: 0.35,
      ease: 'elastic.out(1, 0.5)',
    })
  }, sealRef.value)
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
  <div
    ref="sealRef"
    class="seal-stamp"
    :class="[`seal-stamp--${shape}`]"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${size * 0.4}px`,
    }"
  >
    <span class="seal-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.seal-stamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--seal-red, #C23B22);
  color: var(--seal-red, #C23B22);
  font-family: var(--font-title);
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0;
  will-change: transform, opacity;
  flex-shrink: 0;
}

.seal-stamp--square {
  border-radius: 0;
}

.seal-stamp--round {
  border-radius: 50%;
}

.seal-text {
  line-height: 1;
}
</style>
