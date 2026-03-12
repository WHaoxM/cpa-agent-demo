<!-- 组件：知识点多模态详情；用于 KnowledgeExplorer 右栏 -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { KnowledgeNode } from '@/types'
import { layerLabelMap, difficultyLabelMap, kindLabelMap } from '@/composables/useNetworkGraph'

const props = defineProps<{
  node: KnowledgeNode
}>()

type TabKey = 'summary' | 'commands' | 'topology' | 'evidence'
const activeTab = ref<TabKey>('summary')

const tabs = computed<{ key: TabKey; label: string; icon: string; show: boolean }[]>(() => [
  { key: 'summary', label: '概念', icon: 'lucide:book-open', show: true },
  { key: 'commands', label: '命令', icon: 'lucide:terminal', show: !!(props.node.detail.commands && props.node.detail.commands.length > 0) },
  { key: 'topology', label: '拓扑', icon: 'lucide:network', show: !!props.node.detail.topologySvg },
  { key: 'evidence', label: '证据', icon: 'lucide:search', show: !!(props.node.detail.captureHint || props.node.detail.videoRef) },
])

const visibleTabs = computed(() => tabs.value.filter((t) => t.show))

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="mm-detail">
    <!-- 节点头 -->
    <div class="mm-header">
      <div class="mm-title">{{ node.name }}</div>
      <div class="mm-tags">
        <span class="mm-tag mm-tag--layer">{{ layerLabelMap[node.layer] }}</span>
        <span class="mm-tag mm-tag--diff">{{ difficultyLabelMap[node.difficulty] }}</span>
        <span class="mm-tag mm-tag--kind">{{ kindLabelMap[node.kind] }}</span>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="mm-tabs">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        class="mm-tab"
        :class="{ 'mm-tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <Icon :icon="tab.icon" class="mm-tab-icon" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 内容区 -->
    <div class="mm-body">
      <!-- 概念 -->
      <div v-if="activeTab === 'summary'" class="mm-section">
        <p class="mm-summary">{{ node.detail.summary }}</p>

        <div v-if="node.detail.prerequisites && node.detail.prerequisites.length > 0" class="mm-prereq">
          <div class="mm-prereq-label">先修知识</div>
          <div class="mm-prereq-list">
            <span v-for="pid in node.detail.prerequisites" :key="pid" class="mm-prereq-item">{{ pid }}</span>
          </div>
        </div>

        <div v-if="node.detail.relatedExperiment" class="mm-experiment">
          <Icon icon="lucide:flask-conical" class="mm-exp-icon" />
          <span>{{ node.detail.relatedExperiment }}</span>
        </div>
      </div>

      <!-- 配置命令 -->
      <div v-if="activeTab === 'commands'" class="mm-section">
        <div v-for="(cmd, idx) in node.detail.commands" :key="idx" class="mm-code-block">
          <pre><code>{{ cmd }}</code></pre>
        </div>
      </div>

      <!-- 拓扑 -->
      <div v-if="activeTab === 'topology'" class="mm-section">
        <div class="mm-topo-wrap" v-html="node.detail.topologySvg" />
        <p v-if="node.detail.summary" class="mm-topo-caption">
          {{ node.name }} 典型拓扑示意
        </p>
      </div>

      <!-- 抓包 / 视频证据 -->
      <div v-if="activeTab === 'evidence'" class="mm-section">
        <div v-if="node.detail.captureHint" class="mm-evidence-card">
          <div class="mm-ev-head">
            <Icon icon="lucide:scan-search" class="mm-ev-icon" />
            <span class="mm-ev-title">抓包分析提示</span>
          </div>
          <p class="mm-ev-text">{{ node.detail.captureHint }}</p>
        </div>

        <div v-if="node.detail.videoRef" class="mm-evidence-card">
          <div class="mm-ev-head">
            <Icon icon="lucide:play-circle" class="mm-ev-icon" />
            <span class="mm-ev-title">视频资源</span>
          </div>
          <p class="mm-ev-text">
            {{ node.detail.videoRef.label }}
            <span class="mm-ev-time">{{ formatTime(node.detail.videoRef.timeSec) }}</span>
          </p>
          <div class="mm-video-placeholder">
            <Icon icon="lucide:monitor-play" class="mm-video-icon" />
            <span>视频播放区域（演示占位）</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mm-detail {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
}

.mm-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--card-divider);
}

.mm-title {
  font-weight: 900;
  font-size: 16px;
  line-height: 1.3;
  color: var(--text-100);
}

.mm-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.mm-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text-200);
}

.mm-tag--layer {
  border-color: color-mix(in srgb, var(--primary-100) 30%, var(--bg-300) 70%);
  color: var(--primary-100);
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
}

.mm-tag--diff {
  border-color: color-mix(in srgb, var(--accent-100) 30%, var(--bg-300) 70%);
  color: var(--accent-100);
  background: color-mix(in srgb, var(--accent-100) 8%, var(--bg-100) 92%);
}

.mm-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--card-divider);
  padding: 0 16px;
}

.mm-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--text-200);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color var(--transition-fast) ease, border-color var(--transition-fast) ease;
}

.mm-tab:hover {
  color: var(--text-100);
}

.mm-tab--active {
  color: var(--primary-100);
  border-bottom-color: var(--primary-100);
}

.mm-tab-icon {
  font-size: 14px;
}

.mm-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  min-height: 0;
}

.mm-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mm-summary {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-100);
  margin: 0;
}

.mm-prereq {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mm-prereq-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mm-prereq-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mm-prereq-item {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-100);
  background: var(--card-subtle);
  border: 1px solid var(--card-border);
}

.mm-experiment {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--card-emphasis-bg);
  border: 1px solid var(--card-emphasis-border);
  font-size: 12px;
  color: var(--text-100);
  line-height: 1.5;
}

.mm-exp-icon {
  font-size: 15px;
  color: var(--primary-100);
  flex-shrink: 0;
  margin-top: 1px;
}

.mm-code-block {
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-300) 40%, var(--bg-200) 60%);
  border: 1px solid var(--card-border);
  overflow-x: auto;
}

.mm-code-block pre {
  margin: 0;
  padding: 12px 14px;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-100);
  white-space: pre-wrap;
  word-break: break-all;
}

.mm-topo-wrap {
  padding: 16px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-200) 60%, #ffffff 40%);
  border: 1px solid var(--card-border);
  display: flex;
  justify-content: center;
}


.mm-topo-wrap :deep(svg) {
  width: 100%;
  max-width: 360px;
  height: auto;
}

.mm-topo-caption {
  font-size: 11px;
  color: var(--text-200);
  text-align: center;
  margin: 0;
}

.mm-evidence-card {
  border-radius: var(--radius-sm);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  overflow: hidden;
}

.mm-ev-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--card-divider);
  background: var(--card-emphasis-bg);
}

.mm-ev-icon {
  font-size: 15px;
  color: var(--primary-100);
}

.mm-ev-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-100);
}

.mm-ev-text {
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-100);
  margin: 0;
}

.mm-ev-time {
  display: inline-flex;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  background: var(--card-subtle);
  color: var(--primary-100);
  margin-left: 6px;
}

.mm-video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 14px;
  margin: 0 14px 14px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-300) 30%, var(--bg-200) 70%);
  border: 1px dashed var(--card-border);
  color: var(--text-200);
  font-size: 12px;
}

.mm-video-icon {
  font-size: 28px;
  opacity: 0.5;
}
</style>
