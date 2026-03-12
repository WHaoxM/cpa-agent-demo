<!-- 组件：毛笔字入场动画；逐字显现 + 笔画渐现效果 -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { gsap } from '@/plugins/gsap'

const props = withDefaults(defineProps<{
  text: string
  tag?: string
  brush?: boolean
  stagger?: number
  duration?: number
  delay?: number
  trigger?: boolean
}>(), {
  tag: 'h2',
  brush: true,
  stagger: 0.08,
  duration: 0.5,
  delay: 0,
  trigger: true,
})

const containerRef = ref<HTMLElement | null>(null)
const chars = ref<string[]>([])
let ctx: ReturnType<typeof gsap.context> | null = null

function splitText() {
  chars.value = props.text.split('')
}

function animate() {
  if (!containerRef.value) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  ctx?.revert()
  ctx = gsap.context(() => {
    gsap.from('.brush-char', {
      opacity: 0,
      y: 8,
      scale: 0.85,
      filter: 'blur(4px)',
      stagger: props.stagger,
      duration: props.duration,
      delay: props.delay,
      ease: 'power3.out',
    })
  }, containerRef.value)
}

onMounted(() => {
  splitText()
  if (props.trigger) {
    /* nextTick to ensure chars are rendered */
    requestAnimationFrame(() => {
      animate()
    })
  }
})

watch(() => props.trigger, (val) => {
  if (val) {
    requestAnimationFrame(() => animate())
  }
})

watch(() => props.text, () => {
  splitText()
  if (props.trigger) {
    requestAnimationFrame(() => animate())
  }
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <component
    :is="tag"
    ref="containerRef"
    class="brush-text"
    :class="{ 'brush-text--brush': brush }"
  >
    <span
      v-for="(char, i) in chars"
      :key="`${char}-${i}`"
      class="brush-char"
      :class="{ 'is-space': char === ' ' }"
    >{{ char === ' ' ? '\u00A0' : char }}</span>
  </component>
</template>

<style scoped>
.brush-text {
  display: inline-block;
  margin: 0;
  line-height: 1.4;
}

.brush-text--brush {
  font-family: var(--font-brush);
}

.brush-char {
  display: inline-block;
  will-change: transform, opacity, filter;
}

.brush-char.is-space {
  width: 0.3em;
}
</style>
