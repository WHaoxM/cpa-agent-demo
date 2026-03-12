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
      /* 区块级交错入场 */
      const sections = gsap.utils.toArray('.page-section')
      if (sections.length) {
        gsap.from(sections as HTMLElement[], {
          opacity: 0, y: 16,
          stagger: 0.08, duration: 0.4, ease: 'power2.out',
          delay: 0.05,
        })
      }

      /* 卡片级交错入场 */
      const cards = gsap.utils.toArray('.page-card')
      if (cards.length) {
        gsap.from(cards as HTMLElement[], {
          opacity: 0, y: 10,
          stagger: 0.05, duration: 0.35, ease: 'power2.out',
          delay: 0.2,
        })
      }
    }, pageRef.value)
  })

  onBeforeUnmount(() => {
    ctx?.revert()
  })

  return { pageRef }
}
