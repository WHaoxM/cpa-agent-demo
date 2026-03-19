import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from '@/plugins/gsap'

/**
 * 古籍册页入场动画 composable
 * 为页面根元素内的 .page-section / .page-card 元素添加交错淡入效果
 */
export function usePageEntrance() {
  const pageRef = ref<HTMLElement | null>(null)
  let ctx: ReturnType<typeof gsap.context> | null = null

  onMounted(() => {
    if (!pageRef.value) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    ctx = gsap.context(() => {
      const sections = Array.from(pageRef.value?.querySelectorAll('.page-section') ?? [])
      if (sections.length) {
        gsap.from(sections as HTMLElement[], {
          opacity: 0, y: 10,
          stagger: 0.04, duration: 0.24, ease: 'power2.out',
          delay: 0.02,
          clearProps: 'transform,opacity',
        })
      }

      const cards = Array.from(pageRef.value?.querySelectorAll('.page-card') ?? [])
      if (cards.length) {
        gsap.from(cards as HTMLElement[], {
          opacity: 0, y: 8,
          stagger: 0.025, duration: 0.2, ease: 'power2.out',
          delay: 0.08,
          clearProps: 'transform,opacity',
        })
      }
    }, pageRef.value)
  })

  onBeforeUnmount(() => {
    ctx?.revert()
  })

  return { pageRef }
}
