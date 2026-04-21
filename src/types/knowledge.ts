// ─── 知识图谱 & 多 Agent ───

export type KnowledgeLayer = 'physical' | 'datalink' | 'network' | 'transport' | 'application' | 'security' | 'ops'
export type KnowledgeDifficulty = 'basic' | 'intermediate' | 'advanced'
export type KnowledgeKind = 'protocol' | 'device' | 'config' | 'security' | 'ops'
export type EdgeRelation = 'prerequisite' | 'dependency' | 'related'

export interface KnowledgeNode {
  id: string
  name: string
  layer: KnowledgeLayer
  difficulty: KnowledgeDifficulty
  kind: KnowledgeKind
  /** 节点权重 / 热度，影响 symbolSize */
  heat: number
  detail: KnowledgeNodeDetail
}

export interface KnowledgeEdge {
  source: string
  target: string
  relation: EdgeRelation
}

export interface KnowledgeNodeDetail {
  summary: string
  commands?: string[]
  topologySvg?: string
  captureHint?: string
  videoRef?: { label: string; timeSec: number }
  relatedExperiment?: string
  prerequisites?: string[]
}

export type AgentRole = 'knowledge-locator' | 'protocol-analyzer' | 'fault-diagnoser' | 'learning-advisor'

export type AgentStepStatus = 'waiting' | 'running' | 'done'

export interface AgentStep {
  role: AgentRole
  label: string
  status: AgentStepStatus
  input?: string
  reasoning?: string
  output?: string
  highlightNodeIds?: string[]
}
