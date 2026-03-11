<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { getNetworkGraphData, layerLabelMap, layerColors } from '@/composables/useNetworkGraph'

const router = useRouter()
const graphData = getNetworkGraphData()

const coreFeatures = [
  {
    icon: 'lucide:network',
    title: '知识图谱',
    desc: `${graphData.nodes.length} 个网络工程知识节点，按 OSI 层级组织，力导向图交互探索。`,
    tone: 'primary',
  },
  {
    icon: 'lucide:bot',
    title: '多Agent协同',
    desc: '知识定位 → 协议分析 → 故障诊断 → 学习建议，四步闭环可视化。',
    tone: 'accent',
  },
  {
    icon: 'lucide:layers',
    title: '多模态融合',
    desc: '概念文本 · 配置命令 · 拓扑示意 · 抓包分析，四模态并存展示。',
    tone: 'ice',
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
</script>

<template>
  <div class="home-shell">
    <header class="masthead">
      <div class="brand">
        <div class="brand__mark">KG</div>
        <div class="brand__text">
          <p class="brand__eyebrow">KNOWLEDGE GRAPH + MULTI-AGENT</p>
          <h2 class="brand__name">智能课程系统</h2>
        </div>
      </div>

      <div class="masthead__actions">
        <button class="btn btn--ghost" @click="goToLogin">登录</button>
        <button class="btn btn--solid" @click="goToLogin">
          进入系统
          <Icon icon="solar:arrow-right-up-linear" />
        </button>
      </div>
    </header>

    <main class="canvas">
      <section class="hero">
        <div class="hero__copy">
          <p class="hero__kicker">知识图谱 + 多智能体 + 多模态</p>
          <h1 class="hero__title">
            网络工程
            <span>智能学习平台</span>
          </h1>
          <p class="hero__desc">
            以知识图谱为骨架，多Agent协同为引擎，多模态内容为载体——构建网络工程领域的结构化、可交互、可溯源的智能学习体验。
          </p>

          <div class="hero__actions">
            <button class="btn-primary" @click="goToLogin">
              进入系统
              <Icon icon="solar:arrow-right-linear" />
            </button>
            <div class="hero__links">
              <button class="btn-text" @click="goToLogin">登录</button>
              <span class="link-separator">·</span>
              <button class="btn-text" @click="goToLogin">演示账号：student / 123456</button>
            </div>
          </div>
        </div>

        <div class="signal-stage">
          <div class="signal-stage__frame">
            <article v-for="feat in coreFeatures" :key="feat.title" :class="['signal-strip', `signal-strip--${feat.tone}`]">
              <div class="signal-strip__head">
                <span class="signal-strip__label">{{ feat.title }}</span>
                <Icon :icon="feat.icon" class="signal-strip__icon" />
              </div>
              <p class="signal-strip__note">{{ feat.desc }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="metric-ledger" aria-label="系统概览">
        <div class="metric-ledger__row">
          <div class="metric-ledger__value">{{ graphData.nodes.length }}</div>
          <div class="metric-ledger__meta">
            <div class="metric-ledger__label">知识节点</div>
            <div class="metric-ledger__note">覆盖物理层到应用层 + 安全与运维</div>
          </div>
        </div>
        <div class="metric-ledger__row">
          <div class="metric-ledger__value">{{ graphData.edges.length }}</div>
          <div class="metric-ledger__meta">
            <div class="metric-ledger__label">关系边</div>
            <div class="metric-ledger__note">先修 · 依赖 · 关联 三种关系</div>
          </div>
        </div>
        <div class="metric-ledger__row">
          <div class="metric-ledger__value">4</div>
          <div class="metric-ledger__meta">
            <div class="metric-ledger__label">协同Agent</div>
            <div class="metric-ledger__note">知识定位 · 协议分析 · 故障诊断 · 学习建议</div>
          </div>
        </div>
        <div class="metric-ledger__row">
          <div class="metric-ledger__value">4</div>
          <div class="metric-ledger__meta">
            <div class="metric-ledger__label">内容模态</div>
            <div class="metric-ledger__note">文本 · 命令 · 拓扑图 · 抓包证据</div>
          </div>
        </div>
      </section>

      <section class="command-slab">
        <div class="command-slab__intro">
          <p class="command-slab__eyebrow">图谱覆盖</p>
          <h2 class="command-slab__title">
            {{ layerStats.length }} 个知识类别，
            <span>完整映射网络工程技术栈。</span>
          </h2>
        </div>

        <div class="route-stream">
          <article v-for="item in layerStats" :key="item.layer" class="route-stream__item">
            <p class="route-stream__time" :style="{ color: item.color }">{{ item.count }} 个节点</p>
            <h3 class="route-stream__title">{{ item.label }}</h3>
          </article>
        </div>

        <div class="command-slab__cta">
          <button class="btn-primary" @click="goToLogin">
            立即体验
            <Icon icon="solar:arrow-right-linear" />
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-shell {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  color: var(--text-100);
  background: var(--bg-100);
}

.home-shell::before,
.home-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-shell::before {
  display: none;
}

.home-shell::after {
  display: none;
}

.masthead,
.canvas {
  position: relative;
  z-index: 1;
  width: min(1680px, calc(100vw - 64px));
  margin: 0 auto;
}

.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26px 0 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand__mark {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--card-divider) 45%, transparent);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.brand__eyebrow,
.hero__kicker,
.command-slab__eyebrow,
.signal-strip__label {
  margin: 0;
  color: var(--text-200);
  letter-spacing: 0.06em;
  font-size: 11px;
}

.brand__name {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.masthead__actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--primary-100);
  color: var(--bg-100);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.btn-primary:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--primary-100) 92%, var(--bg-100) 8%);
}

.btn-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--primary-100);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-text:hover {
  background: color-mix(in srgb, var(--primary-100) 10%, transparent);
}

.hero__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  margin-top: 34px;
}

.hero__links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-separator {
  color: var(--text-200);
  font-size: 13px;
}

.canvas {
  padding: 52px 0 44px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  align-items: start;
  gap: 48px;
  min-height: calc(100vh - 200px);
}

.hero__copy {
  max-width: 760px;
  padding: 36px 0 40px;
}

.hero__title {
  margin: 18px 0 0;
  max-width: 8.5em;
  font-size: clamp(56px, 7.4vw, 108px);
  line-height: 0.92;
  font-weight: 500;
  letter-spacing: -0.045em;
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', serif;
}

.hero__title span {
  display: block;
  color: var(--primary-100);
}

.hero__desc {
  max-width: 520px;
  margin: 28px 0 0;
  font-size: 18px;
  line-height: 1.9;
  color: var(--text-200);
}

.hero__cta {
  margin-top: 34px;
}

.signal-stage {
  display: flex;
  justify-content: flex-end;
}

.signal-stage__frame {
  width: min(100%, 720px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 14px;
  padding: 8px 0 0;
}

.signal-strip {
  position: relative;
  padding: 18px 18px 16px;
  border-radius: 18px;
  border: 1px solid var(--card-border);
  background: color-mix(in srgb, var(--bg-200) 60%, var(--bg-100) 40%);
}

.signal-strip::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: color-mix(in srgb, var(--band-accent, var(--primary-100)) 18%, transparent);
  pointer-events: none;
}

.signal-strip--slate,
.signal-strip--primary {
  --band-accent: var(--primary-100);
}

.signal-strip--steel,
.signal-strip--accent {
  --band-accent: var(--accent-100);
}

.signal-strip--ice {
  --band-accent: var(--primary-100);
}

.signal-strip__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.signal-strip__icon {
  font-size: 18px;
  color: var(--band-accent, var(--primary-100));
}

.signal-strip__note {
  max-width: 30em;
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.85;
  color: var(--text-200);
}

.metric-ledger {
  margin-top: 18px;
  padding: 18px 0 8px;
  border-top: 1px solid var(--card-divider);
  display: grid;
  gap: 12px;
}

.metric-ledger__row {
  display: grid;
  grid-template-columns: minmax(0, 180px) minmax(0, 1fr);
  gap: 18px;
  align-items: baseline;
  padding: 16px 18px;
  border: 1px solid var(--card-border);
  border-radius: 18px;
  background: var(--card-data-bg);
}

.metric-ledger__value {
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: -0.04em;
  font-weight: 700;
}

.metric-ledger__label {
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--text-200);
}

.metric-ledger__note {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-200);
}

.command-slab {
  margin-top: 64px;
  padding: 34px 0 8px;
  border-top: 1px solid var(--card-divider);
}

.command-slab__title {
  margin: 16px 0 0;
  max-width: 11em;
  font-size: clamp(38px, 4.4vw, 68px);
  line-height: 0.98;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.command-slab__title span {
  display: block;
  color: var(--primary-100);
}

.command-slab__desc {
  max-width: 44em;
  margin: 20px 0 0;
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-200);
}

.route-stream {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-top: 34px;
}

.route-stream__item {
  min-height: 220px;
  padding: 22px 22px 24px;
  border-top: 1px solid var(--card-divider);
  background: var(--card-data-bg);
}

.route-stream__time {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--text-200);
}

.route-stream__title {
  margin: 18px 0 0;
  max-width: 9em;
  font-size: 28px;
  line-height: 1.08;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.route-stream__text {
  margin: 14px 0 0;
  max-width: 22em;
  font-size: 14px;
  line-height: 1.85;
  color: var(--text-200);
}

.command-slab__cta {
  margin-top: 30px;
}

@media (max-width: 1320px) {
  .masthead,
  .canvas {
    width: min(1680px, calc(100vw - 40px));
  }

  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
    gap: 18px;
  }

  .hero__copy {
    padding-bottom: 0;
  }

  .signal-stage {
    justify-content: flex-start;
  }

  .signal-stage__frame {
    width: 100%;
  }

  .stream-manual {
    grid-template-columns: 1fr;
  }

  .stream-manual__notes {
    position: static;
  }

  .route-stream {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .masthead {
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }

  .metric-ledger__row {
    grid-template-columns: 1fr;
  }

  .command-slab__title {
    font-size: clamp(34px, 11vw, 52px);
  }
}

@media (max-width: 640px) {
  .masthead,
  .canvas {
    width: calc(100vw - 28px);
  }

  .canvas {
    padding-top: 40px;
  }

  .btn-primary {
    width: 100%;
  }

  .hero__actions {
    align-items: stretch;
  }

  .hero__links {
    justify-content: center;
  }

  .hero__desc,
  .command-slab__desc,
  .manual-chapter__desc,
  .route-stream__text,
  .metric-ledger__note,
  .manual-note__desc {
    max-width: none;
  }

  .signal-strip,
  .manual-chapter,
  .manual-note,
  .metric-ledger__row,
  .route-stream__item,
  .stream-manual__notes {
    border-radius: 24px;
  }

  .manual-chapter__footer {
    margin-top: 24px;
  }
}
</style>
