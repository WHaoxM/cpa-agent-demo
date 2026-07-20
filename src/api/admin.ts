import { getApiMode } from './config'
import { mockGet, mockMutate } from './adapters/mockAdapter'
import { httpDelete, httpGet, httpPost } from './adapters/httpAdapter'

export async function listDatasets() {
  if (getApiMode() === 'mock') {
    return mockGet('admin/dataset.list.json')
  }
  return httpGet('/api/admin/dataset')
}

export async function uploadDataset(meta: {
  title: string
  count?: number
  category?: string
  status?: string
}) {
  if (getApiMode() === 'mock') {
    return mockMutate('admin/dataset.upload.ok.json')
  }
  return httpPost('/api/admin/dataset/upload', meta)
}

export async function deleteDataset(id: string) {
  if (getApiMode() === 'mock') {
    return mockMutate('admin/dataset.delete.ok.json')
  }
  return httpDelete(`/api/admin/dataset/${encodeURIComponent(id)}`)
}

export async function listKnowledgeBase() {
  if (getApiMode() === 'mock') {
    return mockGet('admin/kb.list.json')
  }
  return httpGet('/api/admin/knowledge-base')
}

export async function uploadKnowledgeBase(meta: {
  title: string
  type?: string
  status?: string
}) {
  if (getApiMode() === 'mock') {
    return mockMutate('admin/kb.upload.ok.json')
  }
  return httpPost('/api/admin/knowledge-base/upload', meta)
}

export async function deleteKnowledgeBase(id: string) {
  if (getApiMode() === 'mock') {
    return mockMutate('admin/kb.delete.ok.json')
  }
  return httpDelete(`/api/admin/knowledge-base/${encodeURIComponent(id)}`)
}
