<!-- 页面：网络工程知识图谱探索；路由：student/knowledge-graph（student-knowledge-graph）；角色：STUDENT -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import VChart from 'vue-echarts'
import { useNetworkGraph, layerLabelMap, layerColors, difficultyLabelMap, kindLabelMap } from '@/composables/useNetworkGraph'
import { useThemePalette } from '@/composables/useThemePalette'
import { useKnowledgeGraphStore } from '@/stores'
import MultimodalDetail from '@/components/MultimodalDetail.vue'
import AgentStepPanel from '@/components/AgentStepPanel.vue'
import type { KnowledgeLayer, KnowledgeDifficulty, KnowledgeKind } from '@/types'

const kgStore = useKnowledgeGraphStore()

const {
  filteredNodes,
  filteredEdges,
  selectedNodeId,
  selectedNode,
  filterLayer,
  filterDifficulty,
  filterKind,
  searchQuery,
  selectNode,
  agentSteps,
  agentRunning,
  runAgentAnalysis,
  resetAgent,
  highlightedNodeIds,
} = useNetworkGraph()

const { palette } = useThemePalette()

// ─── 右栏 Tab ───
type RightTab = 'detail' | 'agent'
const rightTab = ref<RightTab>('detail')

// ─── 图谱 ECharts option ───

const relationStyleMap: Record<string, { color: string; type: string }> = {
  prerequisite: { color: '#2E7D32', type: 'solid' },
  dependency: { color: '#1565C0', type: 'dashed' },
  related: { color: '#9E9E9E', type: 'dotted' },
}

const chartOption = computed(() => {
  const highlighted = highlightedNodeIds.value
  const hasHighlight = highlighted.size > 0

  const data = filteredNodes.value.map((n) => {
    const isSelected = n.id === selectedNodeId.value
    const isHighlighted = highlighted.has(n.id)
    const dimmed = hasHighlight && !isHighlighted && !isSelected

    return {
      id: n.id,
      name: n.name,
      symbol: isSelected ? 'diamond' : 'circle',
      symbolSize: Math.max(20, n.heat * 6) + (isSelected ? 10 : 0) + (isHighlighted ? 6 : 0),
      itemStyle: {
        color: layerColors[n.layer] || palette.value.primary,
        opacity: dimmed ? 0.2 : 1,
        borderColor: isSelected
          ? palette.value.text
          : isHighlighted
            ? layerColors[n.layer]
            : 'transparent',
        borderWidth: isSelected ? 3 : isHighlighted ? 2 : 0,
        shadowBlur: isSelected ? 12 : 0,
        shadowColor: isSelected ? layerColors[n.layer] + '66' : 'transparent',
      },
      label: {
        show: true,
        formatter: '{b}',
        fontSize: isSelected ? 13 : 11,
        fontWeight: isSelected ? 'bold' as const : 'normal' as const,
        color: dimmed
          ? palette.value.textMuted + '66'
          : palette.value.text,
      },
    }
  })

  const links = filteredEdges.value.map((e) => {
    const style = relationStyleMap[e.relation] ?? relationStyleMap.related!
    const dimmed = hasHighlight && !(highlighted.has(e.source) && highlighted.has(e.target))
    return {
      source: e.source,
      target: e.target,
      lineStyle: {
        color: dimmed ? palette.value.bg3 : style!.color,
        width: dimmed ? 0.5 : 1.5,
        type: style!.type as 'solid' | 'dashed' | 'dotted',
        opacity: dimmed ? 0.15 : 0.6,
      },
    }
  })

  return {
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const node = filteredNodes.value.find((n) => n.id === params.data.id)
          if (!node) return params.name
          return `<b>${node.name}</b><br/>
${layerLabelMap[node.layer]} · ${difficultyLabelMap[node.difficulty]}<br/>
<span style="font-size:11px;color:#888">${node.detail.summary.slice(0, 60)}…</span>`
        }
        if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}`
        }
        return ''
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        data,
        links,
        force: {
          repulsion: 260,
          gravity: 0.1,
          edgeLength: [80, 180],
          friction: 0.6,
        },
        emphasis: {
          focus: 'adjacency' as const,
          lineStyle: { width: 3 },
        },
        lineStyle: {
          curveness: 0.1,
        },
      },
    ],
    animationDuration: 800,
    animationEasingUpdate: 'cubicOut' as const,
  }
})

// ─── 图谱点击 ───

function onChartClick(params: any) {
  if (params.dataType === 'node' && params.data?.id) {
    selectNode(params.data.id)
    rightTab.value = 'detail'
  }
}

function onChartZrClick(params: any) {
  if (!params.target) {
    selectNode('')
  }
}

// ─── 发起 Agent 分析 ───

function startAgentAnalysis() {
  if (!selectedNode.value || agentRunning.value) return
  rightTab.value = 'agent'
  runAgentAnalysis(selectedNode.value, (node, steps) => {
    kgStore.addRecord(node, steps)
  })
}

// ─── 筛选选项 ───

const layerOptions: { value: KnowledgeLayer | ''; label: string }[] = [
  { value: '', label: '全部层级' },
  ...Object.entries(layerLabelMap).map(([k, v]) => ({ value: k as KnowledgeLayer, label: v })),
]

const diffOptions: { value: KnowledgeDifficulty | ''; label: string }[] = [
  { value: '', label: '全部难度' },
  ...Object.entries(difficultyLabelMap).map(([k, v]) => ({ value: k as KnowledgeDifficulty, label: v })),
]

const kindOptions: { value: KnowledgeKind | ''; label: string }[] = [
  { value: '', label: '全部类型' },
  ...Object.entries(kindLabelMap).map(([k, v]) => ({ value: k as KnowledgeKind, label: v })),
]

// ─── 统计 ───

const nodeCount = computed(() => filteredNodes.value.length)
const edgeCount = computed(() => filteredEdges.value.length)

// ─── 图例 ───

const legendItems = computed(() => {
  const layers = new Set(filteredNodes.value.map((n) => n.layer))
  return [...layers].map((l) => ({ layer: l, label: layerLabelMap[l], color: layerColors[l] }))
})

// ─── 选中节点变化时重置 Agent ───
watch(selectedNodeId, () => {
  resetAgent()
})
</script>

<template>
  <div class="kg-page page page--compact">
    <!-- 顶栏 -->
    <div class="kg-topbar card-base">
      <div class="kg-topbar__left">
        <div class="kg-title">网络工程知识图谱</div>
        <div class="kg-sub">
          <span class="kg-stat">{{ nodeCount }} 个知识点</span>
          <span class="kg-stat-sep">·</span>
          <span class="kg-stat">{{ edgeCount }} 条关系</span>
        </div>
      </div>
      <div class="kg-topbar__right">
        <div class="kg-search-box">
          <Icon icon="lucide:search" class="kg-search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索知识点…"
            class="kg-search-input"
          />
          <button v-if="searchQuery" class="kg-search-clear" @click="searchQuery = ''">
            <Icon icon="lucide:x" />
          </button>
        </div>
      </div>
    </div>

    <!-- 三栏 -->
    <div class="kg-workspace">
      <!-- 左栏 - 筛选 -->
      <aside class="kg-sidebar card-base">
        <div class="kg-sidebar__section">
          <div class="kg-sidebar__label">OSI 层级</div>
          <div class="kg-filter-list">
            <button
              v-for="opt in layerOptions"
              :key="opt.value"
              class="kg-filter-btn"
              :class="{ 'kg-filter-btn--active': filterLayer === opt.value }"
              @click="filterLayer = opt.value as any"
            >
              <span
                v-if="opt.value"
                class="kg-filter-dot"
                :style="{ background: layerColors[opt.value as KnowledgeLayer] }"
              />
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="kg-sidebar__section">
          <div class="kg-sidebar__label">难度</div>
          <div class="kg-filter-list">
            <button
              v-for="opt in diffOptions"
              :key="opt.value"
              class="kg-filter-btn"
              :class="{ 'kg-filter-btn--active': filterDifficulty === opt.value }"
              @click="filterDifficulty = opt.value as any"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="kg-sidebar__section">
          <div class="kg-sidebar__label">知识类型</div>
          <div class="kg-filter-list">
            <button
              v-for="opt in kindOptions"
              :key="opt.value"
              class="kg-filter-btn"
              :class="{ 'kg-filter-btn--active': filterKind === opt.value }"
              @click="filterKind = opt.value as any"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 图例 -->
        <div class="kg-sidebar__section">
          <div class="kg-sidebar__label">图例</div>
          <div class="kg-legend">
            <div v-for="item in legendItems" :key="item.layer" class="kg-legend-item">
              <span class="kg-legend-dot" :style="{ background: item.color }" />
              <span class="kg-legend-text">{{ item.label }}</span>
            </div>
          </div>
          <div class="kg-legend" style="margin-top: 8px;">
            <div class="kg-legend-item">
              <span class="kg-legend-line kg-legend-line--solid" />
              <span class="kg-legend-text">先修</span>
            </div>
            <div class="kg-legend-item">
              <span class="kg-legend-line kg-legend-line--dashed" />
              <span class="kg-legend-text">依赖</span>
            </div>
            <div class="kg-legend-item">
              <span class="kg-legend-line kg-legend-line--dotted" />
              <span class="kg-legend-text">关联</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中栏 - 图谱 -->
      <main class="kg-graph card-base">
        <v-chart
          :option="chartOption"
          autoresize
          class="kg-chart"
          @click="onChartClick"
          @zr:click="onChartZrClick"
        />
        <div v-if="filteredNodes.length === 0" class="kg-empty">
          <Icon icon="lucide:search-x" class="kg-empty-icon" />
          <p>当前筛选条件下无匹配知识点</p>
        </div>
      </main>

      <!-- 右栏 - 详情 / Agent -->
      <aside class="kg-detail card-base">
        <template v-if="selectedNode">
          <!-- 右栏 Tab 切换 -->
          <div class="kg-detail-tabs">
            <button
              class="kg-detail-tab"
              :class="{ 'kg-detail-tab--active': rightTab === 'detail' }"
              @click="rightTab = 'detail'"
            >
              <Icon icon="lucide:layers" />
              <span>多模态详情</span>
            </button>
            <button
              class="kg-detail-tab"
              :class="{ 'kg-detail-tab--active': rightTab === 'agent' }"
              @click="rightTab = 'agent'"
            >
              <Icon icon="lucide:bot" />
              <span>Agent 分析</span>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="kg-detail-body">
            <MultimodalDetail
              v-if="rightTab === 'detail'"
              :node="selectedNode"
            />
            <AgentStepPanel
              v-else
              :steps="agentSteps"
              :running="agentRunning"
              @start="startAgentAnalysis"
            />
          </div>

          <!-- 底部快捷操作 -->
          <div v-if="rightTab === 'detail'" class="kg-detail-foot">
            <button
              class="kg-agent-btn"
              :disabled="agentRunning"
              @click="startAgentAnalysis"
            >
              <Icon icon="lucide:sparkles" />
              <span>发起协同分析</span>
            </button>
          </div>
        </template>

        <!-- 未选中 -->
        <div v-else class="kg-detail-empty">
          <Icon icon="lucide:mouse-pointer-click" class="kg-detail-empty-icon" />
          <p class="kg-detail-empty-text">点击图谱中的节点查看详情</p>
          <p class="kg-detail-empty-sub">支持多模态内容浏览和 Agent 协同分析</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.kg-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 80px);
  min-height: 0;
}

.kg-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  flex-shrink: 0;
  gap: 16px;
}

.kg-title {
  font-weight: 900;
  font-size: 16px;
  color: var(--text-100);
}

.kg-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.kg-stat {
  font-size: 12px;
  color: var(--text-200);
  font-weight: 600;
}

.kg-stat-sep {
  color: var(--bg-300);
}

.kg-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kg-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.kg-search-icon {
  position: absolute;
  left: 10px;
  font-size: 14px;
  color: var(--text-200);
  pointer-events: none;
}

.kg-search-input {
  width: 220px;
  height: 36px;
  padding: 0 32px 0 32px;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  background: var(--bg-100);
  color: var(--text-100);
  font-size: 13px;
  outline: none;
  transition: border-color var(--transition-fast) ease;
}

.kg-search-input:focus {
  border-color: var(--primary-100);
}

.kg-search-clear {
  position: absolute;
  right: 6px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-200);
  cursor: pointer;
  display: grid;
  place-items: center;
  border-radius: 4px;
}

.kg-search-clear:hover {
  background: var(--card-subtle);
}

/* 三栏 */
.kg-workspace {
  display: grid;
  grid-template-columns: 180px 1fr 340px;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

/* 左栏 */
.kg-sidebar {
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kg-sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kg-sidebar__label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.kg-filter-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kg-filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-100);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast) ease;
  text-align: left;
}

.kg-filter-btn:hover {
  background: var(--card-subtle);
}

.kg-filter-btn--active {
  background: color-mix(in srgb, var(--primary-100) 12%, var(--bg-200) 88%);
  color: var(--primary-100);
  font-weight: 700;
}

.kg-filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 图例 */
.kg-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kg-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kg-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.kg-legend-text {
  font-size: 11px;
  color: var(--text-200);
}

.kg-legend-line {
  width: 20px;
  height: 0;
  border-top-width: 2px;
  border-top-style: solid;
  flex-shrink: 0;
}

.kg-legend-line--solid {
  border-top-color: #2E7D32;
}

.kg-legend-line--dashed {
  border-top-color: #1565C0;
  border-top-style: dashed;
}

.kg-legend-line--dotted {
  border-top-color: #9E9E9E;
  border-top-style: dotted;
}

/* 中栏 - 图谱 */
.kg-graph {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.kg-chart {
  width: 100%;
  height: 100%;
}

.kg-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-200);
}

.kg-empty-icon {
  font-size: 32px;
  opacity: 0.3;
}

.kg-empty p {
  margin: 0;
  font-size: 13px;
}

/* 右栏 */
.kg-detail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.kg-detail-tabs {
  display: flex;
  border-bottom: 1px solid var(--card-divider);
  flex-shrink: 0;
}

.kg-detail-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: var(--text-200);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color var(--transition-fast) ease, border-color var(--transition-fast) ease;
}

.kg-detail-tab:hover {
  color: var(--text-100);
}

.kg-detail-tab--active {
  color: var(--primary-100);
  border-bottom-color: var(--primary-100);
}

.kg-detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.kg-detail-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--card-divider);
  flex-shrink: 0;
}

.kg-agent-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--primary-100) 40%, var(--bg-300) 60%);
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-100) 90%);
  color: var(--primary-100);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition-fast) ease, border-color var(--transition-fast) ease;
}

.kg-agent-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary-100) 18%, var(--bg-100) 82%);
  border-color: var(--primary-100);
}

.kg-agent-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.kg-detail-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 32px;
}

.kg-detail-empty-icon {
  font-size: 32px;
  color: var(--text-200);
  opacity: 0.3;
}

.kg-detail-empty-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-200);
  margin: 0;
}

.kg-detail-empty-sub {
  font-size: 11px;
  color: var(--text-200);
  opacity: 0.7;
  margin: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .kg-workspace {
    grid-template-columns: 160px 1fr 300px;
  }
}

@media (max-width: 768px) {
  .kg-page {
    height: auto;
    min-height: calc(100vh - 80px);
  }

  .kg-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: auto 400px auto;
  }

  .kg-sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
    overflow-y: visible;
  }

  .kg-sidebar__section {
    min-width: 120px;
  }

  .kg-filter-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .kg-graph {
    min-height: 400px;
  }

  .kg-detail {
    min-height: 300px;
  }
}
</style>
