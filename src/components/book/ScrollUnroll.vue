<!-- 组件：卷轴展开动画；用于 LoginView / HomeView 入场 -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from '@/plugins/gsap'

const props = withDefaults(defineProps<{
  direction?: 'horizontal' | 'vertical'
  duration?: number
  delay?: number
}>(), {
  direction: 'horizontal',
  duration: 1.2,
  delay: 0.2,
})

const emit = defineEmits<{
  (e: 'unrolled'): void
}>()

const wrapRef = ref<HTMLElement | null>(null)
const isUnrolled = ref(false)
let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (!wrapRef.value) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    isUnrolled.value = true
    emit('unrolled')
    return
  }

  ctx = gsap.context(() => {
    const tl = gsap.timeline({
      delay: props.delay,
      onComplete: () => {
        isUnrolled.value = true
        emit('unrolled')
      },
    })

    if (props.direction === 'horizontal') {
      /* 卷轴两端装饰杆 */
      tl.set('.scroll-rod-l, .scroll-rod-r', { opacity: 1 })
      /* 中间内容从中心向两边展开 */
      tl.fromTo('.scroll-body',
        { scaleX: 0, opacity: 0.6 },
        { scaleX: 1, opacity: 1, duration: props.duration, ease: 'power2.inOut' },
        0
      )
      /* 左右杆向外移动 */
      tl.fromTo('.scroll-rod-l',
        { x: '50%' },
        { x: '0%', duration: props.duration, ease: 'power2.inOut' },
        0
      )
      tl.fromTo('.scroll-rod-r',
        { x: '-50%' },
        { x: '0%', duration: props.duration, ease: 'power2.inOut' },
        0
      )
      /* 内容淡入 */
      tl.from('.scroll-content', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      }, `-=${props.duration * 0.25}`)
    } else {
      /* 垂直方向展开 */
      tl.fromTo('.scroll-body',
        { scaleY: 0, opacity: 0.6 },
        { scaleY: 1, opacity: 1, duration: props.duration, ease: 'power2.inOut' },
        0
      )
      tl.from('.scroll-content', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      }, `-=${props.duration * 0.25}`)
    }
  }, wrapRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div ref="wrapRef" class="scroll-unroll" :class="[`scroll-unroll--${direction}`]">
    <!-- 水平卷轴模式 -->
    <template v-if="direction === 'horizontal'">
      <div class="scroll-rod scroll-rod-l">
        <div class="rod-knob"></div>
        <div class="rod-shaft"></div>
        <div class="rod-knob"></div>
      </div>

      <div class="scroll-body">
        <div class="scroll-paper book-paper">
          <div class="scroll-content">
            <slot />
          </div>
        </div>
      </div>

      <div class="scroll-rod scroll-rod-r">
        <div class="rod-knob"></div>
        <div class="rod-shaft"></div>
        <div class="rod-knob"></div>
      </div>
    </template>

    <!-- 垂直卷轴模式 -->
    <template v-else>
      <div class="scroll-body scroll-body--vertical">
        <div class="scroll-paper book-paper">
          <div class="scroll-content">
            <slot />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.scroll-unroll {
  display: flex;
  align-items: stretch;
  justify-content: center;
  width: 100%;
}

.scroll-unroll--horizontal {
  flex-direction: row;
}

.scroll-unroll--vertical {
  flex-direction: column;
}

/* 卷轴杆 */
.scroll-rod {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 18px;
  flex-shrink: 0;
  opacity: 0;
  z-index: 2;
}

.rod-knob {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #8B6914, #C4A44A, #8B6914);
  border: 1px solid #6B5010;
}

.rod-shaft {
  flex: 1;
  width: 8px;
  background: linear-gradient(to right, #6B5010, #C4A44A, #A07C28, #C4A44A, #6B5010);
  min-height: 40px;
}

/* 卷轴主体 */
.scroll-body {
  flex: 1;
  transform-origin: center center;
  min-width: 0;
}

.scroll-body--vertical {
  transform-origin: center top;
}

.scroll-paper {
  min-height: 100%;
  border-top: 2px solid var(--bg-400);
  border-bottom: 2px solid var(--bg-400);
}

.scroll-content {
  padding: 32px 40px;
}

@media (max-width: 768px) {
  .scroll-content {
    padding: 20px 16px;
  }
  .scroll-rod {
    width: 12px;
  }
  .rod-knob {
    width: 12px;
    height: 12px;
  }
  .rod-shaft {
    width: 6px;
  }
}
</style>
