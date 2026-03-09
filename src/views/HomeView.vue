<!-- 组件：HomeView -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

const features = [
  {
    icon: 'fluent-emoji:books',
    title: '课程随心学',
    desc: '海量课程',
    stat: '50+',
  },
  {
    icon: 'fluent-emoji:chart-increasing',
    title: '数据看得懂',
    desc: '学习进度',
    stat: '实时',
  },
  {
    icon: 'fluent-emoji:robot',
    title: 'AI 帮你忙',
    desc: '智能答疑',
    stat: '24h',
  },
]

const stats = [
  { value: '10k+', label: '活跃学子' },
  { value: '500+', label: '精品课程' },
  { value: '98%', label: '好评率' },
]

function goToLogin() {
  router.push('/login')
}
</script>



<template>
  <div class="landing">
    <!-- 不对称导航 -->
    <nav class="nav">
      <div class="nav-brand">
        <Icon icon="fluent-emoji:graduation-cap" class="brand-icon" />
        <span class="brand-text">课管</span>
      </div>
      <div class="nav-actions">
        <button class="btn-ghost" @click="goToLogin">
          登入
        </button>
        <button class="btn-primary" @click="goToLogin">
          开始使用
        </button>
      </div>
    </nav>

    <!-- 主视觉区 - 左重右轻 -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <Icon icon="fluent-emoji:sparkles" />
          <span>全新改版</span>
        </div>
        <h1 class="hero-title">
          学习本该
          <br />
          <span class="title-highlight">这么爽</span>
        </h1>
        <p class="hero-desc">
          不用死记硬背。
          <br />
          让数据告诉你，哪里需要补。
        </p>
        <div class="hero-cta">
          <button class="btn-large btn-primary" @click="goToLogin">
            免费体验
            <Icon icon="fluent-emoji:rocket" class="btn-icon" />
          </button>
          <button class="btn-large btn-ghost" @click="goToLogin">
            先看演示
          </button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card visual-card-1">
          <Icon icon="fluent-emoji:bar-chart" class="card-icon" />
          <div class="card-text">本周学了 12h</div>
        </div>
        <div class="visual-card visual-card-2">
          <Icon icon="fluent-emoji:fire" class="card-icon" />
          <div class="card-text">连续 7 天</div>
        </div>
        <div class="visual-card visual-card-3">
          <Icon icon="fluent-emoji:star" class="card-icon" />
          <div class="card-text">评分 4.9</div>
        </div>
      </div>
    </section>

    <!-- 数据条 - 倾斜分割 -->
    <section class="stats-bar">
      <div class="stats-content">
        <div v-for="(stat, i) in stats" :key="i" class="stat-item">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- 功能展示 - 错落布局 -->
    <section class="features">
      <h2 class="section-title">
        三步上手
        <span class="title-dot">.</span>
      </h2>
      <div class="features-grid">
        <div 
          v-for="(feature, i) in features" 
          :key="i" 
          class="feature-card"
          :style="{ '--delay': i * 0.1 + 's' }"
        >
          <div class="feature-icon-wrap">
            <Icon :icon="feature.icon" class="feature-icon" />
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.desc }}</p>
          <div class="feature-stat">{{ feature.stat }}</div>
        </div>
      </div>
    </section>

    <!-- 底部 CTA - 偏移布局 -->
    <section class="bottom-cta">
      <div class="cta-content">
        <h2 class="cta-title">
          还在用 Excel
          <br />
          记学习进度？
        </h2>
        <p class="cta-desc">太麻烦了。试试这个。</p>
        <button class="btn-large btn-primary" @click="goToLogin">
          立即开启
          <Icon icon="fluent-emoji:door" class="btn-icon" />
        </button>
      </div>
      <div class="cta-decoration">
        <div class="deco-circle" />
        <div class="deco-line" />
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-brand">
        <Icon icon="fluent-emoji:graduation-cap" />
        <span>课管系统</span>
      </div>
      <p class="footer-copy">© 2024 课程管理系统</p>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  background: 
    radial-gradient(ellipse 80% 50% at 20% 40%, color-mix(in srgb, var(--primary-100) 15%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 60%, color-mix(in srgb, var(--accent-100) 12%, transparent) 0%, transparent 50%),
    var(--bg-100);
  position: relative;
  overflow-x: hidden;
}

.landing::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: var(--noise-opacity, 0.08);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
}

/* 导航 - 左对齐品牌 */
.nav {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-100);
}

.brand-icon {
  font-size: 28px;
}

.nav-actions {
  display: flex;
  gap: 12px;
}

/* 按钮系统 */
.btn-primary {
  background: var(--primary-100);
  color: var(--bg-100);
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--primary-100) 30%, transparent);
}

.btn-ghost {
  background: transparent;
  color: var(--text-100);
  border: 2px solid var(--bg-300);
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--bg-200);
  border-color: var(--primary-100);
}

.btn-large {
  padding: 14px 28px;
  font-size: 16px;
  border-radius: 12px;
}

.btn-icon {
  font-size: 20px;
}

/* 主视觉区 - 不对称 */
.hero {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 40px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 60px 32px 80px;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: color-mix(in srgb, var(--accent-100) 15%, transparent);
  color: var(--accent-100);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
  width: fit-content;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-100);
  margin: 0 0 20px;
  letter-spacing: -0.02em;
}

.title-highlight {
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--accent-100) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 18px;
  color: var(--text-200);
  line-height: 1.6;
  margin: 0 0 32px;
  max-width: 320px;
}

.hero-cta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

/* 视觉卡片 - 错落漂浮 */
.hero-visual {
  position: relative;
  height: 400px;
}

.visual-card {
  position: absolute;
  background: color-mix(in srgb, var(--bg-100) 85%, white 15%);
  backdrop-filter: blur(10px);
  border: 1px solid var(--bg-300);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-md);
  animation: float 6s ease-in-out infinite;
}

.visual-card-1 {
  top: 20px;
  right: 40px;
  animation-delay: 0s;
}

.visual-card-2 {
  top: 140px;
  right: 100px;
  animation-delay: -2s;
}

.visual-card-3 {
  top: 260px;
  right: 20px;
  animation-delay: -4s;
}

.card-icon {
  font-size: 32px;
}

.card-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-100);
  white-space: nowrap;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(2deg); }
}

/* 数据条 - 倾斜 */
.stats-bar {
  position: relative;
  z-index: 10;
  background: var(--primary-100);
  transform: skewY(-2deg);
  margin: 40px 0;
  padding: 40px 0;
}

.stats-content {
  transform: skewY(2deg);
  display: flex;
  justify-content: center;
  gap: 80px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
}

.stat-item {
  text-align: center;
  color: var(--bg-100);
}

.stat-value {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 8px;
}

/* 功能区 - 错落网格 */
.features {
  position: relative;
  z-index: 10;
  max-width: 1400px;
  margin: 0 auto;
  padding: 80px 32px;
}

.section-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--text-100);
  margin: 0 0 48px;
  text-align: left;
}

.title-dot {
  color: var(--primary-100);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  background: color-mix(in srgb, var(--bg-100) 90%, white 10%);
  border: 1px solid var(--bg-300);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.feature-card:nth-child(2) {
  transform: translateY(30px);
}

.feature-card:hover {
  transform: translateY(-8px) rotate(1deg);
  box-shadow: 0 20px 40px color-mix(in srgb, var(--primary-100) 15%, transparent);
  border-color: var(--primary-100);
}

.feature-icon-wrap {
  width: 64px;
  height: 64px;
  background: color-mix(in srgb, var(--primary-100) 10%, transparent);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.feature-icon {
  font-size: 36px;
}

.feature-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-100);
  margin: 0 0 8px;
}

.feature-desc {
  font-size: 14px;
  color: var(--text-200);
  margin: 0 0 16px;
}

.feature-stat {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary-100);
}

/* 底部 CTA - 偏移 */
.bottom-cta {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 60px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 80px 32px;
  align-items: center;
}

.cta-content {
  padding-left: 40px;
}

.cta-title {
  font-size: 42px;
  font-weight: 800;
  color: var(--text-100);
  line-height: 1.2;
  margin: 0 0 16px;
}

.cta-desc {
  font-size: 18px;
  color: var(--text-200);
  margin: 0 0 32px;
}

.cta-decoration {
  position: relative;
  height: 300px;
}

.deco-circle {
  position: absolute;
  width: 200px;
  height: 200px;
  border: 4px solid var(--primary-100);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.3;
}

.deco-line {
  position: absolute;
  width: 2px;
  height: 150px;
  background: linear-gradient(to bottom, var(--accent-100), transparent);
  top: 20%;
  left: 60%;
  transform: rotate(15deg);
}

/* 页脚 */
.footer {
  position: relative;
  z-index: 10;
  border-top: 1px solid var(--bg-300);
  padding: 40px 32px;
  text-align: center;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-100);
  margin-bottom: 12px;
}

.footer-copy {
  font-size: 13px;
  color: var(--text-200);
  margin: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 60px;
  }
  
  .hero-visual {
    order: -1;
    height: 300px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-card:nth-child(2) {
    transform: none;
  }
  
  .bottom-cta {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .cta-content {
    padding-left: 0;
  }
  
  .stats-content {
    gap: 40px;
  }
}

@media (max-width: 640px) {
  .nav {
    padding: 16px 20px;
  }
  
  .hero {
    padding: 40px 20px;
  }
  
  .hero-title {
    font-size: 40px;
  }
  
  .hero-desc {
    font-size: 16px;
  }
  
  .visual-card {
    padding: 14px;
    font-size: 12px;
  }
  
  .visual-card-1 { right: 10px; }
  .visual-card-2 { right: 60px; top: 120px; }
  .visual-card-3 { right: 0; top: 220px; }
  
  .stats-content {
    flex-direction: column;
    gap: 24px;
  }
  
  .features {
    padding: 60px 20px;
  }
  
  .section-title {
    font-size: 28px;
  }
}
</style>


