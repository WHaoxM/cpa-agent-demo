import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ReportRecord } from '@/types'
import { createReport, deleteReport, getReportDetail, getReportList } from '@/api/report'

export const useReportStore = defineStore(
  'report',
  () => {
    const records = ref<ReportRecord[]>([])
    const mockInitialized = ref(false)

    const portraitRecords = computed(() =>
      records.value.filter(r => r.type === 'portrait').sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt)
      )
    )

    const careerRecords = computed(() =>
      records.value.filter(r => r.type === 'career').sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt)
      )
    )

    const latestPortrait = computed(() => portraitRecords.value[0] ?? null)
    const latestCareer = computed(() => careerRecords.value[0] ?? null)

    async function fetchReportList(userId?: string): Promise<void> {
      try {
        const list = await getReportList(userId)
        if (list.length > 0) {
          records.value = list
        }
      } catch {
      }
    }

    async function fetchReportDetailById(id: string): Promise<ReportRecord | null> {
      try {
        const detail = await getReportDetail(id)
        if (detail) return detail
      } catch {
      }
      return records.value.find(item => item.id === id) ?? null
    }

    function addRecord(r: Omit<ReportRecord, 'id' | 'createdAt'>): ReportRecord {
      const record: ReportRecord = {
        ...r,
        id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      records.value.unshift(record)

      createReport(r).then(serverRecord => {
        const idx = records.value.findIndex(item => item.id === record.id)
        if (idx !== -1) records.value[idx] = serverRecord
      }).catch(() => {
      })

      return record
    }

    function removeRecord(id: string): void {
      const idx = records.value.findIndex(r => r.id === id)
      if (idx === -1) return

      const snapshot = records.value[idx]
      if (!snapshot) return
      records.value.splice(idx, 1)
      deleteReport(id).catch(() => {
        records.value.splice(idx, 0, snapshot)
      })
    }

    return {
      records,
      mockInitialized,
      portraitRecords,
      careerRecords,
      latestPortrait,
      latestCareer,
      fetchReportList,
      fetchReportDetailById,
      addRecord,
      removeRecord,
    }
  },
  {
    persist: {
      key: 'report-store',
      storage: localStorage,
      pick: ['records', 'mockInitialized'],
    },
  },
)
