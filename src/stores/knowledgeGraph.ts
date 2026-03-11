import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AgentStep, KnowledgeNode } from '@/types'
import { buildAgentSteps, getNodeById } from '@/composables/useNetworkGraph'

export interface AnalysisRecord {
  id: string
  nodeId: string
  nodeName: string
  nodeLayer: string
  steps: AgentStep[]
  timestamp: string
}

export const useKnowledgeGraphStore = defineStore(
  'knowledgeGraph',
  () => {
    const history = ref<AnalysisRecord[]>([])
    const currentNodeId = ref('')

    const latestRecords = computed(() => history.value.slice(-20).reverse())
    const recordCount = computed(() => history.value.length)

    function addRecord(node: KnowledgeNode, steps: AgentStep[]) {
      const record: AnalysisRecord = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        nodeId: node.id,
        nodeName: node.name,
        nodeLayer: node.layer,
        steps: steps.map((s) => ({ ...s })),
        timestamp: new Date().toISOString(),
      }
      history.value.push(record)
      // 最多保留 50 条
      if (history.value.length > 50) {
        history.value = history.value.slice(-50)
      }
    }

    function getRecordsByNode(nodeId: string) {
      return history.value.filter((r) => r.nodeId === nodeId).reverse()
    }

    function getRecordById(id: string) {
      return history.value.find((r) => r.id === id) ?? null
    }

    function clearHistory() {
      history.value = []
    }

    return {
      history,
      currentNodeId,
      latestRecords,
      recordCount,
      addRecord,
      getRecordsByNode,
      getRecordById,
      clearHistory,
    }
  },
  {
    persist: {
      key: 'kg-analysis-history',
      storage: localStorage,
    },
  },
)
