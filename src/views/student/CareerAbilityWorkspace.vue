<!-- 组件：图谱构建工作台；由 CareerAbilityShell.vue 引入使用，非路由直接渲染；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { getRoleIntro } from '@/composables/useAbilityGraph'
import { useGraphGeneration, type LogEntry } from '@/composables/useGraphGeneration'

defineOptions({ name: 'CareerAbilityWorkspace' })

/* ═══ 从 Shell 注入共享图谱状态 ═══ */
const sg = inject<any>('shared-graph')
const allNodes = sg.allNodes
const allEdges = sg.allEdges
const visibleNodes = sg.visibleNodes
const visibleEdges = sg.visibleEdges
const roleName = sg.roleName

/* ═══ 岗位介绍 ═══ */
const roleIntro = computed(() => getRoleIntro(roleName.value))

/* ═══ 生成流程（驱动日志面板，图谱由Shell统一管理） ═══ */
const gen = useGraphGeneration(allNodes, allEdges)

/* ═══ 日志面板自动滚动 ═══ */
const logPanelEl = ref<HTMLElement>()
watch(() => gen.logs.value.length, () => {
  nextTick(() => { if (logPanelEl.value) logPanelEl.value.scrollTop = logPanelEl.value.scrollHeight })
})

/* ═══ 翻页控制 ═══ */
function prevPage() { if (gen.currentPage.value > 0) gen.currentPage.value-- }
function nextPage() { if (gen.currentPage.value < gen.stepPages.value.length - 1) gen.currentPage.value++ }

/* ═══ 完成按钮 ═══ */
const router = useRouter()
function onEnterCourseSystem() {
  router.push({ name: 'course-system', query: { role: roleName.value } })
}

/* ═══ 生命周期 ═══ */
onMounted(() => { gen.start() })
onBeforeUnmount(() => { gen.stop() })

/* ═══ 日志图标 ═══ */
function logIcon(level: LogEntry['level']) {
  return level === 'success' ? '✅' : level === 'warn' ? '⚠️' : 'ℹ️'
}
</script>

<template>
  <div class="ws-page">
    <div class="ws-content">
      <!-- 可滚动卡片区 -->
      <div class="ws-cards">
        <!-- 卡片 01：简历分析 -->
        <section class="ws-card">
          <h3 class="ws-card__title"><span class="ws-card__num">01</span> 简历分析</h3>
          <div class="ws-card__body">
            <p class="ws-intro-summary">{{ roleIntro.summary }}</p>
            <div class="ws-intro-section">
              <h4>岗位职责</h4>
              <ul><li v-for="(r, i) in roleIntro.responsibilities" :key="i">{{ r }}</li></ul>
            </div>
            <div class="ws-intro-section">
              <h4>任职要求</h4>
              <ul><li v-for="(r, i) in roleIntro.requirements" :key="i">{{ r }}</li></ul>
            </div>
            <div class="ws-intro-section">
              <h4>技能标签</h4>
              <div class="ws-tags">
                <span class="ws-tag" v-for="s in roleIntro.skills" :key="s">{{ s }}</span>
              </div>
            </div>
            <div class="ws-intro-section">
              <h4>需求热区</h4>
              <div class="ws-regions">
                <span class="ws-region" v-for="rg in roleIntro.topRegions" :key="rg.name">
                  {{ rg.name }} <em>{{ rg.demand }}</em>
                </span>
              </div>
            </div>
            <div class="ws-intro-section">
              <h4>发展前景</h4>
              <p>{{ roleIntro.outlook }}</p>
            </div>
          </div>
        </section>

        <!-- 卡片 02：图谱介绍 -->
        <section class="ws-card">
          <h3 class="ws-card__title">
            <span class="ws-card__num">02</span> 图谱介绍
            <span class="ws-card__stats">
              {{ visibleNodes.length }} 实体节点 · {{ visibleEdges.length }} 关系边
            </span>
          </h3>
          <div class="ws-card__body ws-card__body--gen">
            <!-- 状态徽标 -->
            <div class="ws-gen-status">
              <span class="ws-gen-phase">{{ gen.phase.value || '准备中' }}</span>
              <span class="ws-gen-badge" :class="{ 'ws-gen-badge--done': gen.isDone.value }">
                {{ gen.isDone.value ? '已完成' : '生成中…' }}
              </span>
            </div>
            <!-- 进度条 -->
            <div class="ws-gen-progress">
              <div class="ws-gen-progress__bar" :style="{ width: gen.progress.value + '%' }"></div>
            </div>
            <!-- 统计数字 -->
            <div class="ws-gen-stats">
              <div class="ws-gen-stat">
                <span class="ws-gen-stat__value">{{ visibleNodes.length }}</span>
                <span class="ws-gen-stat__label">实体节点</span>
              </div>
              <div class="ws-gen-stat">
                <span class="ws-gen-stat__value">{{ visibleEdges.length }}</span>
                <span class="ws-gen-stat__label">关系边</span>
              </div>
              <div class="ws-gen-stat">
                <span class="ws-gen-stat__value">{{ new Set([...visibleNodes.map((n: any) => n.group)]).size }}</span>
                <span class="ws-gen-stat__label">SCHEMA类型</span>
              </div>
            </div>
            <!-- 当前页内容 -->
            <div class="ws-gen-page" v-if="gen.stepPages.value.length > 0">
              <div class="ws-gen-page__title">
                {{ gen.stepPages.value[gen.currentPage.value]?.title }}
              </div>
              <div class="ws-gen-page__logs">
                <div
                  class="ws-gen-log"
                  v-for="(log, li) in gen.stepPages.value[gen.currentPage.value]?.logs || []"
                  :key="li"
                >
                  <span class="ws-gen-log__ts">{{ log.ts }}</span>
                  <span class="ws-gen-log__agent">{{ log.agent }}</span>
                  <span class="ws-gen-log__msg">{{ log.message }}</span>
                </div>
              </div>
            </div>
            <div v-else class="ws-gen-empty">等待启动…</div>
            <!-- 翻页 -->
            <div class="ws-gen-pager" v-if="gen.stepPages.value.length > 1">
              <button class="ws-gen-pager__btn" @click="prevPage" :disabled="gen.currentPage.value === 0">
                <Icon icon="lucide:chevron-up" :width="14" /> 上一页
              </button>
              <span class="ws-gen-pager__info">{{ gen.currentPage.value + 1 }} / {{ gen.stepPages.value.length }}</span>
              <button class="ws-gen-pager__btn" @click="nextPage" :disabled="gen.currentPage.value >= gen.stepPages.value.length - 1">
                下一页 <Icon icon="lucide:chevron-down" :width="14" />
              </button>
            </div>
          </div>
        </section>

        <!-- 卡片 03：状态 -->
        <section class="ws-card ws-card--action" v-if="gen.isDone.value">
          <h3 class="ws-card__title"><span class="ws-card__num">03</span> 状态</h3>
          <div class="ws-card__body">
            <p class="ws-done-text">图谱构建完成，课程体系搭建完成。</p>
            <button class="ws-action-btn" @click="onEnterCourseSystem">
              <Icon icon="lucide:arrow-right-circle" :width="18" />
              查看课程体系
            </button>
          </div>
        </section>

      </div>

      <!-- ═══ 底部仪表盘 ═══ -->
      <div class="ws-dashboard">
        <div class="ws-dashboard__head">
          <span class="ws-dashboard__title">系统仪表盘</span>
          <span class="ws-dashboard__controls">
            <button class="ws-dashboard__btn" title="最小化">—</button>
            <button class="ws-dashboard__btn" title="清空">🗑</button>
          </span>
        </div>
        <div class="ws-dashboard__logs" ref="logPanelEl">
          <div
            class="ws-log"
            v-for="(log, i) in gen.logs.value"
            :key="i"
          >
            <span class="ws-log__ts">[{{ log.ts }}]</span>
            <span class="ws-log__agent">{{ log.agent }}</span>
            <span class="ws-log__msg">{{ log.message }}</span>
            <span class="ws-log__icon">{{ logIcon(log.level) }}</span>
          </div>
          <div v-if="gen.logs.value.length === 0" class="ws-log--empty">等待日志输出…</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ 工作台根 ═══ */
.ws-page {
  height: 100%;
  background: var(--bg-100, #F7F2E8);
  font-family: var(--font-title), 'KaiTi', serif;
  color: var(--text-100, #1A1410);
  overflow: hidden;
}
.ws-content {
  height: 100%;
  display: flex; flex-direction: column;
}

/* ═══ 可滚动卡片区 ═══ */
.ws-cards {
  flex: 1; min-height: 0;
  overflow-y: auto; padding: 24px 32px;
  display: flex; flex-direction: column; gap: 18px;
}
.ws-cards::-webkit-scrollbar { width: 4px; }
.ws-cards::-webkit-scrollbar-thumb { background: var(--bg-300); border-radius: 2px; }

/* ═══ 卡片通用 ═══ */
.ws-card {
  background: var(--bg-200, #EDE5D6);
  border: 1px solid var(--bg-300, #D4C9B5);
  border-radius: var(--radius-md, 3px);
  overflow: hidden;
  flex-shrink: 0;
}
.ws-card--action { border-color: rgba(47,133,90,0.3); }

.ws-card__title {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; margin: 0;
  font-size: 16px; font-weight: 700; color: var(--primary-100, #8B2500);
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--bg-300);
}
.ws-card__num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--primary-100, #8B2500); color: #fff;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.ws-card__stats {
  margin-left: auto; font-size: 12px; font-weight: 400;
  color: var(--text-300, #9C8B78);
}

.ws-card__body {
  padding: 14px 18px;
}

/* 岗位介绍 */
.ws-intro-summary { font-size: 13px; color: var(--text-200); margin: 0 0 10px; line-height: 1.6; }
.ws-intro-section { margin-bottom: 10px; }
.ws-intro-section h4 {
  font-size: 12px; font-weight: 700; color: var(--text-100); margin: 0 0 4px;
  letter-spacing: 0.04em;
}
.ws-intro-section ul {
  margin: 0; padding-left: 16px; font-size: 12px; color: var(--text-200); line-height: 1.7;
}
.ws-intro-section p { font-size: 12px; color: var(--text-200); line-height: 1.7; margin: 0; }

.ws-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.ws-tag {
  padding: 2px 8px; font-size: 11px; border-radius: 2px;
  background: rgba(139,37,0,0.08); color: var(--primary-100, #8B2500);
  border: 1px solid rgba(139,37,0,0.15);
}

.ws-regions { display: flex; flex-wrap: wrap; gap: 6px; }
.ws-region { font-size: 12px; color: var(--text-200); }
.ws-region em {
  font-style: normal; font-size: 11px; font-weight: 600;
  color: var(--primary-100); margin-left: 2px;
}

/* 生成过程卡片 */
.ws-card__body--gen {
  padding: 14px 18px 10px;
}
.ws-gen-status {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.ws-gen-phase { font-size: 13px; font-weight: 600; color: var(--text-100); }
.ws-gen-badge {
  padding: 2px 8px; font-size: 10px; border-radius: 8px;
  background: rgba(139,37,0,0.1); color: var(--primary-100);
  animation: pulse-ws 1.5s ease-in-out infinite;
}
.ws-gen-badge--done {
  background: rgba(47,133,90,0.12); color: #2F855A;
  animation: none;
}
@keyframes pulse-ws {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ws-gen-progress {
  height: 4px; background: var(--bg-300, #D4C9B5); border-radius: 2px; margin-bottom: 10px; overflow: hidden;
}
.ws-gen-progress__bar {
  height: 100%; background: var(--primary-100, #8B2500); border-radius: 2px;
  transition: width 0.4s ease;
}

.ws-gen-stats {
  display: flex; gap: 24px; margin-bottom: 10px;
  padding: 12px 0; border-top: 1px solid var(--bg-300); border-bottom: 1px solid var(--bg-300);
}
.ws-gen-stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
.ws-gen-stat__value {
  font-size: 28px; font-weight: 800; color: var(--text-100);
  font-variant-numeric: tabular-nums; line-height: 1.2;
}
.ws-gen-stat__label { font-size: 12px; color: var(--text-300, #9C8B78); margin-top: 2px; letter-spacing: 0.04em; }

.ws-gen-page__title {
  font-size: 12px; font-weight: 700; color: var(--text-100); margin-bottom: 6px;
}
.ws-gen-page__logs { display: flex; flex-direction: column; gap: 4px; }
.ws-gen-log {
  display: flex; align-items: baseline; gap: 6px;
  font-size: 11px; line-height: 1.5;
}
.ws-gen-log__ts { color: var(--text-300); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.ws-gen-log__agent { color: var(--primary-100); font-weight: 600; flex-shrink: 0; }
.ws-gen-log__msg { color: var(--text-200); }

.ws-gen-empty { font-size: 12px; color: var(--text-300); padding: 8px 0; }

.ws-gen-pager {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--bg-300);
}
.ws-gen-pager__btn {
  display: inline-flex; align-items: center; gap: 3px;
  background: transparent; border: 1px solid var(--bg-300);
  color: var(--text-200); font-size: 11px; font-family: inherit;
  padding: 3px 8px; cursor: pointer; border-radius: 2px; transition: all 0.15s;
}
.ws-gen-pager__btn:hover:not(:disabled) { border-color: var(--primary-100); color: var(--primary-100); }
.ws-gen-pager__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ws-gen-pager__info { font-size: 11px; color: var(--text-300); font-variant-numeric: tabular-nums; }

/* 完成卡片 */
.ws-done-text { font-size: 13px; color: var(--text-200); margin: 0 0 12px; }
.ws-action-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 20px; font-size: 13px; font-weight: 700; font-family: inherit;
  background: var(--primary-100, #8B2500); color: #fff;
  border: none; border-radius: var(--radius-sm, 2px);
  cursor: pointer; transition: all 0.2s;
}
.ws-action-btn:hover { background: #A0472D; }


/* ═══ 仪表盘 ═══ */
.ws-dashboard {
  flex-shrink: 0; height: 180px;
  display: flex; flex-direction: column;
  border-top: 1px solid var(--bg-300, #D4C9B5);
  background: #1A1410; color: #D4C9B5;
  font-family: 'Consolas', 'Monaco', monospace;
}
.ws-dashboard__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 14px; background: #2A231C;
  border-bottom: 1px solid #3A332C;
}
.ws-dashboard__title { font-size: 12px; font-weight: 600; color: #D4C9B5; }
.ws-dashboard__controls { display: flex; gap: 6px; }
.ws-dashboard__btn {
  background: transparent; border: none; color: #9C8B78; font-size: 12px;
  cursor: pointer; padding: 0 4px;
}
.ws-dashboard__btn:hover { color: #D4C9B5; }

.ws-dashboard__logs {
  flex: 1; overflow-y: auto; padding: 6px 14px;
  font-size: 11px; line-height: 1.7;
}
.ws-dashboard__logs::-webkit-scrollbar { width: 3px; }
.ws-dashboard__logs::-webkit-scrollbar-thumb { background: #3A332C; border-radius: 2px; }

.ws-log { display: flex; gap: 8px; align-items: baseline; }
.ws-log__ts { color: #7A6F62; font-variant-numeric: tabular-nums; flex-shrink: 0; }
.ws-log__agent { color: #B7791F; font-weight: 600; flex-shrink: 0; }
.ws-log__msg { color: #D4C9B5; }
.ws-log__icon { flex-shrink: 0; }
.ws-log--empty { color: #7A6F62; font-size: 11px; }

/* ═══ 响应式 ═══ */
@media (max-width: 767px) {
  .ws-cards { padding: 14px 16px; }
  .ws-gen-stats { gap: 12px; }
  .ws-gen-stat__value { font-size: 22px; }
  .ws-dashboard { height: 140px; }
}
</style>
