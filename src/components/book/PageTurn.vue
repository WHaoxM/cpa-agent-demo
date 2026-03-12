<!-- 组件：翻页转场；用于 router-view 的 transition 钩子 -->
<script setup lang="ts">
import { gsap } from '@/plugins/gsap'

const props = withDefaults(defineProps<{
  duration?: number
}>(), {
  duration: 0.45,
})

const prefersReduced = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

function onBeforeEnter(el: Element) {
  if (prefersReduced) return
  const htmlEl = el as HTMLElement
  htmlEl.style.transformOrigin = 'left center'
  htmlEl.style.willChange = 'transform, opacity'
  gsap.set(htmlEl, { rotateY: 90, opacity: 0 })
}

function onEnter(el: Element, done: () => void) {
  if (prefersReduced) {
    done()
    return
  }
  const htmlEl = el as HTMLElement
  gsap.to(htmlEl, {
    rotateY: 0,
    opacity: 1,
    duration: props.duration,
    ease: 'power2.out',
    onComplete: () => {
      htmlEl.style.willChange = ''
      done()
    },
  })
}

function onLeave(el: Element, done: () => void) {
  if (prefersReduced) {
    done()
    return
  }
  const htmlEl = el as HTMLElement
  htmlEl.style.transformOrigin = 'right center'
  htmlEl.style.willChange = 'transform, opacity'
  gsap.to(htmlEl, {
    rotateY: -90,
    opacity: 0,
    duration: props.duration * 0.8,
    ease: 'power2.in',
    onComplete: () => {
      htmlEl.style.willChange = ''
      done()
    },
  })
}
</script>

<template>
  <div class="page-turn-perspective">
    <Transition
      :css="false"
      mode="out-in"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
    >
      <slot />
    </Transition>
  </div>
</template>

<style scoped>
.page-turn-perspective {
  perspective: 1600px;
  transform-style: preserve-3d;
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
