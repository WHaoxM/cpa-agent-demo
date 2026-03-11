<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const signalBands = [
  {
    label: '课堂密度',
    value: '18 条学习脉冲',
    note: '章节、作业、讨论和测验被压进同一条观测面。',
    tone: 'slate',
    width: '92%',
    shift: '0px',
    tilt: '-2deg',
    icon: 'solar:pulse-2-linear',
  },
  {
    label: '风险回波',
    value: '3 处待介入',
    note: '错题堆积、讨论沉默、观看断层会被单独抬升。',
    tone: 'steel',
    width: '82%',
    shift: '44px',
    tilt: '1.5deg',
    icon: 'solar:bell-bing-linear',
  },
  {
    label: '教师视窗',
    value: '09:30 实时刷新',
    note: '不等日报，首页本身就是正在变化的课堂截面。',
    tone: 'ice',
    width: '88%',
    shift: '12px',
    tilt: '-1deg',
    icon: 'solar:monitor-smartphone-linear',
  },
]

const metrics = [
  { value: '32,480', label: '周内学习事件', note: '从打开课程到提交作业持续记录' },
  { value: '87%', label: '章节推进连续度', note: '不再只看完成率，而是看推进节奏' },
  { value: '240ms', label: '状态反馈延迟', note: '交互回声需要足够直接' },
  { value: '3 端', label: '角色共视画面', note: '学生、教师、管理者共享同一张地形' },
]

const streamColumns = [
  {
    label: '01 / 入口层',
    panels: [
      {
        tone: 'slate',
        scale: 'tall',
        eyebrow: '学习流线',
        title: '首页先回答走向，再谈功能。',
        desc: '第一屏应该告诉用户现在发生了什么、接下来去哪、哪里需要介入，而不是把功能堆成宫格。',
        bullets: [
          '课程主线、作业节拍、讨论温度并到一条连续阅读面。',
          '重要动作压缩成纵向节奏，减少在模块之间来回切换。',
        ],
        footer: '导航退到边缘，信息成为主角。',
      },
      {
        tone: 'mist',
        scale: 'mid',
        eyebrow: '章节脉冲',
        title: '每段内容都能看到推进速度。',
        desc: '不是单点完成，而是连续推进的可读性。',
        bullets: [
          '已完成、临界、停滞三种状态直接分层。',
        ],
        footer: '速度比数量更重要。',
      },
    ],
  },
  {
    label: '02 / 观测层',
    panels: [
      {
        tone: 'ice',
        scale: 'mid',
        eyebrow: '状态翻译',
        title: '把学习状态翻译成可读信号。',
        desc: '冷静的界面不是少信息，而是让信息有秩序。',
        bullets: [
          '颜色只承担提醒，不承担装饰。',
          '重要数字放大，但仍保留留白和呼吸。',
        ],
        footer: '克制比热闹更高级。',
      },
      {
        tone: 'steel',
        scale: 'tall',
        eyebrow: '干预清单',
        title: '老师只需要看到该介入的地方。',
        desc: '首页不展示一切，只抬升最值得处理的段落，让系统像观察台而不是陈列柜。',
        bullets: [
          '拖延超过阈值的章节会顶到上层。',
          '同一学生的多个异常被合并成一条处理线索。',
          '讨论热度下降时，提示教学动作而不是只给红点。',
        ],
        footer: '从提醒，转向行动建议。',
      },
    ],
  },
  {
    label: '03 / 共视层',
    panels: [
      {
        tone: 'graph',
        scale: 'tall',
        eyebrow: '角色切面',
        title: '学生、教师、管理者共用同一张地形。',
        desc: '视角可以不同，但基础秩序必须一致。这样首页才不会随着角色切换而重新碎裂成模板页。',
        bullets: [
          '学生看自己的推进轨迹。',
          '教师看班级中需要被打断和扶正的节点。',
          '管理者看系统容量与内容健康度。',
        ],
        footer: '同构，而不是重复。',
      },
      {
        tone: 'mist',
        scale: 'short',
        eyebrow: '进入方式',
        title: '入口保持明确，不做按钮展览。',
        desc: '只保留登录和演示两个动作，避免首页失焦。',
        bullets: [
          '动作少，但路径清楚。',
        ],
        footer: '少即是秩序。',
      },
    ],
  },
]

const routeMoments = [
  {
    time: '08:10',
    title: '进入课程主线',
    text: '先看到今天的推进面，不先看到菜单。',
  },
  {
    time: '10:20',
    title: '识别风险断层',
    text: '异常会被抬到更靠前的位置，减少老师搜索成本。',
  },
  {
    time: '14:40',
    title: '回到一条连续记录',
    text: '课程、笔记、作业和讨论被编进同一条时间河道。',
  },
]

const flattenedPanels = computed(() => streamColumns.flatMap((column) => column.panels))
const mainPanels = computed(() => flattenedPanels.value.slice(0, 3))
const notePanels = computed(() => flattenedPanels.value.slice(3))

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="home-shell">
    <header class="masthead">
      <div class="brand">
        <div class="brand__mark">CM</div>
        <div class="brand__text">
          <p class="brand__eyebrow">COURSE TERRAIN</p>
          <h2 class="brand__name">课程地形图</h2>
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
          <p class="hero__kicker">冷静的大屏首页</p>
          <h1 class="hero__title">
            课程管理不该是
            <span>一堆模板化卡片。</span>
          </h1>
          <p class="hero__desc">
            首页应该像一张持续展开的学习地形图。
            先给出流向、密度和风险，再让用户进入动作。
          </p>

          <div class="hero__actions">
            <button class="btn-primary" @click="goToLogin">
              进入系统
              <Icon icon="solar:arrow-right-linear" />
            </button>
            <div class="hero__links">
              <button class="btn-text" @click="goToLogin">登录</button>
              <span class="link-separator">·</span>
              <button class="btn-text" @click="goToLogin">查看演示流</button>
            </div>
          </div>
        </div>

        <div class="signal-stage">
          <div class="signal-stage__frame">
            <article v-for="band in signalBands" :key="band.label" :class="['signal-strip', `signal-strip--${band.tone}`]">
              <div class="signal-strip__head">
                <span class="signal-strip__label">{{ band.label }}</span>
                <Icon :icon="band.icon" class="signal-strip__icon" />
              </div>
              <div class="signal-strip__value">{{ band.value }}</div>
              <p class="signal-strip__note">{{ band.note }}</p>
              <div class="signal-strip__meter" aria-hidden="true">
                <span v-for="item in 6" :key="item" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="metric-ledger" aria-label="首页数据概览">
        <div v-for="metric in metrics" :key="metric.label" class="metric-ledger__row">
          <div class="metric-ledger__value">{{ metric.value }}</div>
          <div class="metric-ledger__meta">
            <div class="metric-ledger__label">{{ metric.label }}</div>
            <div class="metric-ledger__note">{{ metric.note }}</div>
          </div>
        </div>
      </section>

      <section class="stream-manual" aria-label="首页叙事结构">
        <div class="stream-manual__main">
          <article
            v-for="panel in mainPanels"
            :key="panel.title"
            :class="['manual-chapter', `manual-chapter--${panel.tone}`]"
          >
            <p class="manual-chapter__eyebrow">{{ panel.eyebrow }}</p>
            <h3 class="manual-chapter__title">{{ panel.title }}</h3>
            <p class="manual-chapter__desc">{{ panel.desc }}</p>

            <ul class="manual-chapter__bullets">
              <li v-for="bullet in panel.bullets" :key="bullet">{{ bullet }}</li>
            </ul>

            <div class="manual-chapter__footer">{{ panel.footer }}</div>
          </article>
        </div>

        <aside class="stream-manual__notes" aria-label="旁注">
          <div class="stream-manual__note-label">旁注</div>
          <article v-for="panel in notePanels" :key="panel.title" :class="['manual-note', `manual-note--${panel.tone}`]">
            <div class="manual-note__head">
              <p class="manual-note__eyebrow">{{ panel.eyebrow }}</p>
              <div class="manual-note__scale">{{ panel.scale }}</div>
            </div>
            <h4 class="manual-note__title">{{ panel.title }}</h4>
            <p class="manual-note__desc">{{ panel.desc }}</p>
          </article>
        </aside>
      </section>

      <section class="command-slab">
        <div class="command-slab__intro">
          <p class="command-slab__eyebrow">首页节奏</p>
          <h2 class="command-slab__title">
            不再做功能橱窗，
            <span>而是做一条可进入的学习河道。</span>
          </h2>
          <p class="command-slab__desc">
            这部分保留宽幅、克制、连续的叙述方式。即使在移动端，也保持整段纵向流动，而不是退化成一排小卡片。
          </p>
        </div>

        <div class="route-stream">
          <article v-for="moment in routeMoments" :key="moment.time" class="route-stream__item">
            <p class="route-stream__time">{{ moment.time }}</p>
            <h3 class="route-stream__title">{{ moment.title }}</h3>
            <p class="route-stream__text">{{ moment.text }}</p>
          </article>
        </div>

        <div class="command-slab__cta">
          <button class="btn-primary" @click="goToLogin">
            打开首页原型
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

.signal-strip--slate {
  --band-accent: var(--primary-100);
}

.signal-strip--steel {
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

.signal-strip__value {
  margin-top: 10px;
  font-size: 22px;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-weight: 600;
}

.signal-strip__note {
  max-width: 30em;
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.85;
  color: var(--text-200);
}

.signal-strip__meter {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.signal-strip__meter span {
  height: 6px;
  border-radius: 999px;
  background: var(--band-accent, var(--primary-100));
  opacity: 0.7;
}

.signal-strip__meter span:nth-child(2),
.signal-strip__meter span:nth-child(6) {
  opacity: 0.45;
}

.signal-strip__meter span:nth-child(4) {
  opacity: 0.25;
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

.stream-manual {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 360px);
  gap: 28px;
  margin-top: 56px;
  align-items: start;
}

.stream-manual__main {
  display: grid;
  gap: 18px;
}

.manual-chapter {
  position: relative;
  padding: 26px 24px 22px;
  border-radius: 22px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
}

.manual-chapter::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 2px;
  background: color-mix(in srgb, var(--chapter-accent, var(--primary-100)) 18%, transparent);
  pointer-events: none;
}

.manual-chapter--slate {
  --chapter-accent: var(--primary-100);
}

.manual-chapter--steel {
  --chapter-accent: var(--accent-100);
}

.manual-chapter--ice {
  --chapter-accent: var(--primary-100);
}

.manual-chapter--mist {
  --chapter-accent: var(--card-divider);
}

.manual-chapter--graph {
  --chapter-accent: var(--card-divider);
}

.manual-chapter__eyebrow {
  margin: 0;
  color: var(--text-200);
  letter-spacing: 0.06em;
  font-size: 11px;
}

.manual-chapter__title {
  margin: 14px 0 0;
  max-width: 16em;
  font-size: clamp(26px, 2.6vw, 40px);
  line-height: 1.08;
  letter-spacing: -0.02em;
  font-weight: 600;
}

.manual-chapter__desc {
  margin: 14px 0 0;
  max-width: 44em;
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-200);
}

.manual-chapter__bullets {
  display: grid;
  gap: 10px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.manual-chapter__bullets li {
  position: relative;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.85;
  color: var(--text-100);
}

.manual-chapter__bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 11px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--accent-100);
  opacity: 0.7;
}

.manual-chapter__footer {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--card-divider);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--text-200);
}

.stream-manual__notes {
  position: sticky;
  top: 24px;
  align-self: start;
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--card-border);
  background: var(--card-data-bg);
}

.stream-manual__note-label {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-200);
}

.manual-note {
  padding: 14px 14px 12px;
  border-radius: 16px;
  border: 1px solid var(--card-border);
  background: color-mix(in srgb, var(--bg-200) 60%, var(--bg-100) 40%);
}

.manual-note__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.manual-note__eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-200);
}

.manual-note__scale {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text-200);
}

.manual-note__title {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: -0.01em;
  font-weight: 650;
}

.manual-note__desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.75;
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
