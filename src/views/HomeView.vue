<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { getNetworkGraphData, layerLabelMap, layerColors } from '@/composables/useNetworkGraph'
import { gsap } from '@/plugins/gsap'
import BrushText from '@/components/book/BrushText.vue'
import SealStamp from '@/components/book/SealStamp.vue'
import InkWash from '@/components/book/InkWash.vue'

const router = useRouter()
const graphData = getNetworkGraphData()

const coreFeatures = [
  {
    icon: 'lucide:network',
    title: '知识图谱',
    desc: `${graphData.nodes.length} 个网络工程知识节点，按 OSI 层级组织，力导向图交互探索。`,
  },
  {
    icon: 'lucide:bot',
    title: '多Agent协同',
    desc: '知识定位 → 协议分析 → 故障诊断 → 学习建议，四步闭环可视化。',
  },
  {
    icon: 'lucide:layers',
    title: '多模态融合',
    desc: '概念文本 · 配置命令 · 拓扑示意 · 抓包分析，四模态并存展示。',
  },
]

const layerStats = Object.entries(
  graphData.nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.layer] = (acc[n.layer] || 0) + 1
    return acc
  }, {}),
).map(([k, v]) => ({
  layer: k,
  label: layerLabelMap[k as keyof typeof layerLabelMap] || k,
  count: v,
  color: layerColors[k as keyof typeof layerColors] || '#666',
})).sort((a, b) => b.count - a.count)

function goToLogin() {
  router.push('/login')
}

/* ===== GSAP 动画 ===== */
const shellRef = ref<HTMLElement | null>(null)
const showContent = ref(false)
let ctx: ReturnType<typeof gsap.context> | null = null

onMounted(() => {
  if (!shellRef.value) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    showContent.value = true
    return
  }

  ctx = gsap.context(() => {
    const tl = gsap.timeline({
      onComplete: () => { showContent.value = true },
    })

    /* 封面整体淡入 */
    tl.from('.cover-frame', {
      opacity: 0, scale: 0.96,
      duration: 0.7, ease: 'power2.out',
    })

    /* 四角花纹绘制 */
    tl.from('.cover-corner', {
      scaleX: 0, scaleY: 0, opacity: 0,
      stagger: 0.08, duration: 0.5, ease: 'power3.out',
    }, '-=0.3')

    /* 标题与副标题淡入（BrushText 自己也有动画） */
    tl.from('.cover-subtitle', {
      opacity: 0, y: 8,
      duration: 0.5, ease: 'power2.out',
    }, '-=0.2')

    /* 特色卡片交错入场 */
    tl.from('.feature-scroll', {
      opacity: 0, y: 16,
      stagger: 0.1, duration: 0.4, ease: 'power2.out',
    }, '-=0.1')

    /* 底部行动按钮 */
    tl.from('.cover-actions', {
      opacity: 0, y: 10,
      duration: 0.4, ease: 'power2.out',
    }, '-=0.15')

    /* 统计数据行交错 */
    tl.from('.ledger-row', {
      opacity: 0, x: -12,
      stagger: 0.06, duration: 0.35, ease: 'power2.out',
    }, '-=0.2')
  }, shellRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div ref="shellRef" class="home-shell book-paper">
    <!-- 墨迹晕染背景 -->
    <InkWash :trigger="true" :intensity="30" :duration="3" />

    <!-- ===== 书封面 ===== -->
    <div class="cover-frame">
      <!-- 四角花纹 -->
      <span class="cover-corner cover-corner--tl"></span>
      <span class="cover-corner cover-corner--tr"></span>
      <span class="cover-corner cover-corner--bl"></span>
      <span class="cover-corner cover-corner--br"></span>

      <!-- 封面主体 -->
      <header class="cover-head">
        <p class="cover-subtitle">知识图谱 · 多智能体 · 多模态</p>
        <BrushText text="网络工程" tag="h1" class="cover-title" :delay="0.3" :stagger="0.12" :duration="0.6" />
        <BrushText text="智能学习平台" tag="h2" class="cover-title-sub" :delay="0.8" :stagger="0.1" :duration="0.5" />

        <div class="cover-seal-row">
          <SealStamp text="学" :size="52" shape="square" :delay="1.2" />
          <div class="cover-divider"></div>
          <SealStamp text="智" :size="42" shape="round" :delay="1.5" />
        </div>
      </header>

      <!-- 描述 -->
      <p class="cover-desc">
        以知识图谱为骨架，多Agent协同为引擎，多模态内容为载体——构建网络工程领域的结构化、可交互、可溯源的智能学习体验。
      </p>

      <!-- 三特色卷轴条 -->
      <div class="feature-scrolls">
        <article v-for="feat in coreFeatures" :key="feat.title" class="feature-scroll">
          <div class="feature-scroll__bar"></div>
          <div class="feature-scroll__body">
            <div class="feature-scroll__head">
              <Icon :icon="feat.icon" class="feature-scroll__icon" />
              <span class="feature-scroll__title">{{ feat.title }}</span>
            </div>
            <p class="feature-scroll__desc">{{ feat.desc }}</p>
          </div>
        </article>
      </div>

      <!-- 行动按钮 -->
      <div class="cover-actions">
        <button class="cover-btn cover-btn--primary" @click="goToLogin">
          翻开此书
          <Icon icon="lucide:book-open" />
        </button>
        <button class="cover-btn cover-btn--ghost" @click="goToLogin">
          登录
        </button>
        <span class="cover-hint">演示账号：student / 123456</span>
      </div>
    </div>

    <!-- ===== 数据概览（目录页风格） ===== -->
    <section class="ledger-section">
      <h3 class="ledger-title">目 · 录</h3>
      <div class="ledger-grid">
        <div class="ledger-row">
          <span class="ledger-value">{{ graphData.nodes.length }}</span>
          <span class="ledger-label">知识节点</span>
          <span class="ledger-note">覆盖物理层到应用层</span>
        </div>
        <div class="ledger-row">
          <span class="ledger-value">{{ graphData.edges.length }}</span>
          <span class="ledger-label">关系边</span>
          <span class="ledger-note">先修 · 依赖 · 关联</span>
        </div>
        <div class="ledger-row">
          <span class="ledger-value">4</span>
          <span class="ledger-label">协同Agent</span>
          <span class="ledger-note">四步闭环</span>
        </div>
        <div class="ledger-row">
          <span class="ledger-value">4</span>
          <span class="ledger-label">内容模态</span>
          <span class="ledger-note">文 · 令 · 图 · 据</span>
        </div>
      </div>

      <!-- 知识层级 -->
      <div class="layer-chips">
        <span v-for="item in layerStats" :key="item.layer" class="layer-chip" :style="{ borderColor: item.color }">
          <span class="layer-chip__count" :style="{ color: item.color }">{{ item.count }}</span>
          {{ item.label }}
        </span>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ═══ 古籍封面 ═══ */
.home-shell {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  color: var(--text-100);
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
}

/* 封面外框 */
.cover-frame {
  position: relative;
  width: min(680px, 100%);
  padding: 48px 40px;
  border: 2px solid color-mix(in srgb, var(--primary-100) 40%, var(--bg-300) 60%);
  background:
    radial-gradient(ellipse at 35% 25%, rgba(218, 200, 168, 0.25) 0%, transparent 55%),
    var(--bg-100);
  z-index: 1;
}

/* 四角花纹 */
.cover-corner {
  position: absolute;
  width: 32px;
  height: 32px;
  border-color: var(--primary-100);
  border-style: solid;
  opacity: 0.5;
  pointer-events: none;
}
.cover-corner--tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; transform-origin: top left; }
.cover-corner--tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; transform-origin: top right; }
.cover-corner--bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; transform-origin: bottom left; }
.cover-corner--br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; transform-origin: bottom right; }

/* 封面头部 */
.cover-head {
  text-align: center;
  margin-bottom: 28px;
}

.cover-subtitle {
  margin: 0 0 12px;
  font-family: var(--font-accent);
  font-size: 13px;
  letter-spacing: 0.2em;
  color: var(--text-200);
}

.cover-title {
  font-size: clamp(40px, 8vw, 72px);
  line-height: 1.1;
  color: var(--text-100);
  letter-spacing: 0.08em;
  margin: 0;
}

.cover-title-sub {
  font-size: clamp(24px, 5vw, 40px);
  line-height: 1.2;
  color: var(--primary-100);
  letter-spacing: 0.06em;
  margin: 8px 0 0;
}

/* 印章行 */
.cover-seal-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 24px;
}

.cover-divider {
  width: 48px;
  height: 1px;
  background: var(--bg-300);
}

/* 封面描述 */
.cover-desc {
  max-width: 500px;
  margin: 0 auto 28px;
  font-size: 15px;
  line-height: 2;
  color: var(--text-200);
  text-align: center;
  font-family: var(--font-body);
}

/* 三特色卷轴条 */
.feature-scrolls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.feature-scroll {
  display: flex;
  border: 1px solid var(--bg-300);
  background: color-mix(in srgb, var(--bg-200) 60%, var(--bg-100) 40%);
  overflow: hidden;
}

.feature-scroll__bar {
  width: 3px;
  background: var(--primary-100);
  flex-shrink: 0;
}

.feature-scroll__body {
  padding: 12px 14px;
  flex: 1;
}

.feature-scroll__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-scroll__icon {
  font-size: 16px;
  color: var(--primary-100);
}

.feature-scroll__title {
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.feature-scroll__desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-200);
}

/* 行动按钮 */
.cover-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.cover-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-title);
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.25s ease;
}

.cover-btn--primary {
  background: var(--primary-100);
  color: var(--bg-100);
  border: 2px solid var(--primary-100);
}

.cover-btn--primary:hover {
  background: transparent;
  color: var(--primary-100);
}

.cover-btn--ghost {
  background: transparent;
  color: var(--text-100);
  border: 1px solid var(--bg-300);
}

.cover-btn--ghost:hover {
  border-color: var(--primary-100);
  color: var(--primary-100);
}

.cover-hint {
  font-size: 12px;
  color: var(--text-300);
  font-family: var(--font-accent);
  letter-spacing: 0.05em;
}

/* ═══ 数据概览（目录页风格） ═══ */
.ledger-section {
  width: min(680px, 100%);
  padding: 32px 40px;
  border: 1px solid var(--bg-300);
  background: var(--bg-100);
  position: relative;
  z-index: 1;
}

.ledger-title {
  text-align: center;
  font-family: var(--font-brush);
  font-size: 24px;
  font-weight: 400;
  color: var(--primary-100);
  letter-spacing: 0.4em;
  margin: 0 0 24px;
}

.ledger-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ledger-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 70%, transparent 30%);
  background: color-mix(in srgb, var(--bg-200) 40%, var(--bg-100) 60%);
}

.ledger-value {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-title);
  color: var(--primary-100);
  line-height: 1.2;
}

.ledger-label {
  font-size: 13px;
  font-family: var(--font-title);
  font-weight: 600;
  letter-spacing: 0.08em;
  margin-top: 4px;
}

.ledger-note {
  font-size: 11px;
  color: var(--text-300);
  margin-top: 4px;
  letter-spacing: 0.05em;
}

/* 知识层级标签 */
.layer-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
}

.layer-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid;
  font-size: 12px;
  font-family: var(--font-title);
  letter-spacing: 0.04em;
  color: var(--text-200);
}

.layer-chip__count {
  font-weight: 700;
  font-size: 14px;
}

/* ═══ 响应式 ═══ */
@media (max-width: 768px) {
  .home-shell {
    padding: 24px 16px;
    gap: 32px;
  }
  .cover-frame {
    padding: 32px 20px;
  }
  .ledger-section {
    padding: 24px 20px;
  }
  .ledger-grid {
    grid-template-columns: 1fr;
  }
  .cover-actions {
    flex-direction: column;
  }
  .cover-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

