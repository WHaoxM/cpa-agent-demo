<!-- 页面：工作台（图谱构建管线）；路由：student/career-ability；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useGraphGeneration, type LogEntry } from '@/composables/useGraphGeneration'

defineOptions({ name: 'CareerAbilityWorkspace' })

/* ═══ 从 Shell 注入共享图谱状态 ═══ */
const sg = inject<any>('shared-graph')
const allNodes = sg.allNodes
const allEdges = sg.allEdges
const visibleNodes = sg.visibleNodes
const visibleEdges = sg.visibleEdges

/* ═══ 生成流程 ═══ */
const gen = useGraphGeneration(allNodes, allEdges)

/* ═══ 日志面板自动滚动 ═══ */
const logPanelEl = ref<HTMLElement>()
watch(() => gen.logs.value.length, () => {
  nextTick(() => { if (logPanelEl.value) logPanelEl.value.scrollTop = logPanelEl.value.scrollHeight })
})

/* ═══ Mock 本体数据（模拟设计图中的实体/关系类型标签） ═══ */
const entityTypes = [
  'University', '大学', 'Student', '学生', '生', 'Alumni', '教师',
  'MediaOutlet', '媒体/媒体', 'GovernmentAgency', '政府机构',
  'NGO', '非政府组织', 'Person', '人物', 'Organization', '组织/结构',
]
const relationTypes = [
  'COMMENTS_ON', 'RESPONDS_TO', 'SUPPORTS', '支持',
  '反对/质', 'AFFILIATED_WITH', 'WORKS_FOR',
]

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
        <!-- 卡片 01：本体生成 -->
        <section class="ws-card">
          <h3 class="ws-card__title">
            <span class="ws-card__num">01</span> 本体生成
            <span class="ws-card__badge" :class="{ 'ws-card__badge--done': gen.progress.value >= 40 }">
              {{ gen.progress.value >= 40 ? '已完成' : '进行中' }}
            </span>
          </h3>
          <div class="ws-card__body">
            <p class="ws-card__api">POST /api/graph/ontology/generate</p>
            <p class="ws-card__desc">LLM分析文档内容与领域需求，萃取出最合适的本体架构</p>

            <div class="ws-card__section">
              <span class="ws-card__label">GENERATED ENTITY TYPES 生成实体类型</span>
              <div class="ws-tags">
                <span class="ws-tag" v-for="t in entityTypes" :key="t">{{ t }}</span>
              </div>
            </div>

            <div class="ws-card__section">
              <span class="ws-card__label">GENERATED RELATION TYPES 生成关系类型</span>
              <div class="ws-tags">
                <span class="ws-tag ws-tag--rel" v-for="t in relationTypes" :key="t">{{ t }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 卡片 02：GraphRAG 构建 -->
        <section class="ws-card">
          <h3 class="ws-card__title">
            <span class="ws-card__num">02</span> GraphRAG构建
            <span class="ws-card__sub">GraphRAG 构建</span>
            <span class="ws-card__badge" :class="{ 'ws-card__badge--done': gen.progress.value >= 92 }">
              {{ gen.progress.value >= 92 ? '已完成' : '进行中' }}
            </span>
          </h3>
          <div class="ws-card__body">
            <p class="ws-card__api">POST /api/graph/build &nbsp;发布 /api/graph/build</p>
            <p class="ws-card__desc">基于生成的本体，智文档自动分析抽取 2op 构建知识图谱，并将成果映射至学习记忆克召性层翼</p>

            <div class="ws-stats">
              <div class="ws-stat">
                <span class="ws-stat__value">{{ visibleNodes.length || 132 }}</span>
                <span class="ws-stat__label">实体节点</span>
              </div>
              <div class="ws-stat">
                <span class="ws-stat__value">{{ visibleEdges.length || 222 }}</span>
                <span class="ws-stat__label">关系边</span>
              </div>
              <div class="ws-stat">
                <span class="ws-stat__value">{{ entityTypes.length }}</span>
                <span class="ws-stat__label">SCHEMA类型</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 卡片 03：构建完成 -->
        <section class="ws-card" :class="{ 'ws-card--done': gen.isDone.value }">
          <h3 class="ws-card__title">
            <span class="ws-card__num">03</span> 构建完成
            <span class="ws-card__badge" :class="{ 'ws-card__badge--done': gen.isDone.value }">
              {{ gen.isDone.value ? '已完成' : '进行中' }}
            </span>
          </h3>
          <div class="ws-card__body" v-if="gen.isDone.value">
            <p class="ws-card__desc">图谱构建完成，知识图谱已就绪。</p>
          </div>
        </section>
      </div>

      <!-- ═══ 底部仪表盘 ═══ -->
      <div class="ws-dashboard">
        <div class="ws-dashboard__head">
          <span class="ws-dashboard__title">SYSTEM DASHBOARD 系统调度总盘</span>
          <span class="ws-dashboard__meta">proj_PR989063E529</span>
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
}
.ws-card--done { border-color: rgba(47,133,90,0.3); }

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
.ws-card__sub {
  font-size: 13px; font-weight: 400; color: var(--text-300, #9C8B78);
}
.ws-card__badge {
  margin-left: auto;
  padding: 3px 12px; font-size: 11px; font-weight: 600;
  border-radius: 10px;
  background: rgba(139,37,0,0.1); color: var(--primary-100);
  animation: pulse-ws 1.5s ease-in-out infinite;
}
.ws-card__badge--done {
  background: rgba(47,133,90,0.12); color: #2F855A;
  animation: none;
}
@keyframes pulse-ws {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ws-card__body { padding: 14px 18px; }

.ws-card__api {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px; color: var(--text-300, #9C8B78);
  margin: 0 0 6px; letter-spacing: 0.02em;
}
.ws-card__desc {
  font-size: 13px; color: var(--text-200, #6B5D4F);
  line-height: 1.6; margin: 0 0 14px;
}

/* 分区标签 */
.ws-card__section { margin-bottom: 14px; }
.ws-card__label {
  display: block; font-size: 11px; font-weight: 700;
  color: var(--text-300, #9C8B78); letter-spacing: 0.06em;
  margin-bottom: 8px; text-transform: uppercase;
}

/* 标签 */
.ws-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.ws-tag {
  padding: 4px 12px; font-size: 12px;
  border-radius: 2px; border: 1px solid var(--bg-300, #D4C9B5);
  background: var(--bg-100, #F7F2E8); color: var(--text-100, #1A1410);
  font-weight: 500;
}
.ws-tag--rel {
  background: rgba(139,37,0,0.06);
  border-color: rgba(139,37,0,0.2);
  color: var(--primary-100, #8B2500);
}

/* 统计数字 */
.ws-stats {
  display: flex; gap: 24px;
  padding: 16px 0 4px;
  border-top: 1px solid var(--bg-300);
}
.ws-stat {
  display: flex; flex-direction: column; align-items: center;
  flex: 1;
}
.ws-stat__value {
  font-size: 32px; font-weight: 800; color: var(--text-100);
  font-variant-numeric: tabular-nums; line-height: 1.2;
}
.ws-stat__label {
  font-size: 12px; color: var(--text-300, #9C8B78);
  margin-top: 2px; letter-spacing: 0.04em;
}

/* ═══ 仪表盘 ═══ */
.ws-dashboard {
  flex-shrink: 0; height: 160px;
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
.ws-dashboard__title { font-size: 12px; font-weight: 600; color: #D4C9B5; letter-spacing: 0.04em; }
.ws-dashboard__meta { font-size: 11px; color: #7A6F62; }

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
  .ws-stats { gap: 12px; }
  .ws-stat__value { font-size: 24px; }
  .ws-dashboard { height: 120px; }
}
</style>
