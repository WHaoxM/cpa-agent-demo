<!-- 页面：着陆页；路由：/（landing）；角色：PUBLIC -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { gsap } from '@/plugins/gsap'
import CareerStarMap from '@/components/career/CareerStarMap.vue'

const router = useRouter()
const pageRef = ref<HTMLElement | null>(null)
let ctx: ReturnType<typeof gsap.context> | null = null

function goToLogin() {
  router.push('/login')
}

onMounted(() => {
  if (!pageRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  ctx = gsap.context(() => {
    const tl = gsap.timeline({ delay: 0.15 })

    tl.from('.ld-map-wrap', {
      opacity: 0,
      duration: 1.2, ease: 'power2.out',
    })

    tl.from('.ld-corner', {
      opacity: 0,
      stagger: 0.1, duration: 0.6, ease: 'power2.out',
    }, '-=0.6')

    tl.from('.ld-sep', {
      scaleX: 0,
      duration: 0.7, ease: 'power2.inOut', transformOrigin: 'left center',
    }, '-=0.3')

    tl.from('.ld-footer', {
      opacity: 0, y: 10,
      duration: 0.6, ease: 'power2.out',
    }, '-=0.4')
  }, pageRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div ref="pageRef" class="ld-page">

    <!-- 角落标注（海报风格） -->
    <span class="ld-corner ld-corner--tl">职业导航平台</span>
    <span class="ld-corner ld-corner--tr">2025</span>

    <!-- 星图主体 -->
    <div class="ld-map-wrap">
      <CareerStarMap theme="dark" class="ld-starmap" />
    </div>

    <!-- 分割线 -->
    <div class="ld-sep" aria-hidden="true"></div>

    <!-- 底部说明栏 -->
    <footer class="ld-footer">
      <div class="ld-footer-left">
        <h1 class="ld-title">职导星图</h1>
        <p class="ld-sub">找到你在职业星空中的坐标</p>
      </div>
      <div class="ld-footer-right">
        <button class="ld-cta" @click="goToLogin">
          <span>进入</span>
          <Icon icon="lucide:arrow-right" class="ld-cta__arrow" />
        </button>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* ── 页面：全屏竖向排布 ── */
.ld-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: #06060F;
  overflow: hidden;
  position: relative;
}

/* ── 角落标注（海报版画风格） ── */
.ld-corner {
  position: absolute;
  z-index: 10;
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.22em;
  color: rgba(255, 255, 255, 0.18);
  pointer-events: none;
  user-select: none;
}

.ld-corner--tl {
  top: 20px;
  left: 28px;
}

.ld-corner--tr {
  top: 20px;
  right: 28px;
}

/* ── 星图主体区域 ── */
.ld-map-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
}

.ld-starmap {
  flex: 1;
  min-height: 0;
}

/* ── 分割线 ── */
.ld-sep {
  flex-shrink: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 0;
}

/* ── 底部说明栏 ── */
.ld-footer {
  flex-shrink: 0;
  height: 88px;
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

/* ── 主标题：ultra-thin，无特效 ── */
.ld-title {
  margin: 0;
  font-family: var(--font-title);
  font-size: clamp(22px, 2.8vw, 36px);
  font-weight: 100;
  letter-spacing: 0.45em;
  line-height: 1;
  color: rgba(240, 237, 232, 0.92);
}

/* ── 副标题 ── */
.ld-sub {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.28);
}

/* ── CTA：细线边框，克制 ── */
.ld-cta {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 22px;
  background: transparent;
  color: rgba(240, 237, 232, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 0.2em;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.ld-cta:hover {
  color: rgba(240, 237, 232, 0.95);
  border-color: rgba(255, 255, 255, 0.55);
}

.ld-cta__arrow {
  font-size: 13px;
  transition: transform 0.2s ease;
}

.ld-cta:hover .ld-cta__arrow {
  transform: translateX(3px);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .ld-footer {
    height: 80px;
    padding: 0 20px;
  }

  .ld-title {
    letter-spacing: 0.3em;
  }
}

@media (max-width: 480px) {
  .ld-footer {
    height: auto;
    padding: 16px 18px;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .ld-title {
    font-size: clamp(18px, 5vw, 24px);
    letter-spacing: 0.25em;
  }

  .ld-cta {
    width: 100%;
    justify-content: center;
  }
}

/* ── prefers-reduced-motion ── */
@media (prefers-reduced-motion: reduce) {
  .ld-cta {
    transition: none;
  }
  .ld-cta__arrow {
    transition: none;
  }
}
</style>
