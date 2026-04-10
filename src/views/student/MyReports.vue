<!-- 页面：我的报告；路由：student/my-reports；角色：STUDENT -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/report'
import type { ReportRecord } from '@/types'
import { mockReportRecords } from '@/mock/data'
import BookshelfScene from '@/components/bookshelf/BookshelfScene.vue'
import BookOpenOverlay from '@/components/bookshelf/BookOpenOverlay.vue'
import SealStamp from '@/components/book/SealStamp.vue'

const router = useRouter()

const reportStore = useReportStore()

const portraitList = computed(() => reportStore.portraitRecords)
const careerList = computed(() => reportStore.careerRecords)

const overlayVisible = ref(false)
const overlayRecord = ref<ReportRecord | null>(null)
const overlayType = ref<'portrait' | 'career' | null>(null)
const overlayOrigin = ref({ x: 0, y: 0 })

async function onBookFlyOut(payload: { record: ReportRecord; originX: number; originY: number; type: 'portrait' | 'career' }) {
  const detail = await reportStore.fetchReportDetailById(payload.record.id)
  overlayRecord.value = detail ?? payload.record
  overlayType.value = payload.type
  overlayOrigin.value = { x: payload.originX, y: payload.originY }
  overlayVisible.value = true
}

function closeOverlay() {
  overlayVisible.value = false
  overlayRecord.value = null
  overlayType.value = null
}

function removeAndCloseOverlay(id: string) {
  reportStore.removeRecord(id)
  closeOverlay()
}

onMounted(async () => {
  await reportStore.fetchReportList()
  if (reportStore.records.length === 0) {
    // [MOCK] 后端接口未接通时，回填本地演示报告数据。
    reportStore.records.push(...mockReportRecords.map(item => ({ ...item })))
  }
})
</script>

<template>
  <div class="bookcase-page page page--compact">
    <div class="bookcases-layout">
      <section class="bookcase-unit corner-ornament">
        <div class="bookcase-label">
          <SealStamp text="个人" :size="20" shape="square" :delay="0.1" />
          <Icon icon="lucide:user-circle" :width="15" />
          个人能力画像
          <span class="section-count">{{ portraitList.length }}</span>
          <button class="label-entry label-entry--portrait" @click="router.push({ name: 'student-career-navigation' })">
            <Icon icon="lucide:scan-face" :width="12" />
            开始测评
            <Icon icon="lucide:chevron-right" :width="11" />
          </button>
        </div>
        <BookshelfScene :books="portraitList" type="portrait" @book-fly-out="onBookFlyOut" />
      </section>

      <section class="bookcase-unit corner-ornament">
        <div class="bookcase-label">
          <SealStamp text="生涯" :size="20" shape="square" :delay="0.15" />
          <Icon icon="lucide:briefcase" :width="15" />
          职业生涯发展
          <span class="section-count">{{ careerList.length }}</span>
          <button class="label-entry label-entry--career" @click="router.push({ name: 'student-career-report' })">
            <Icon icon="lucide:compass" :width="12" />
            开始测评
            <Icon icon="lucide:chevron-right" :width="11" />
          </button>
        </div>
        <BookshelfScene :books="careerList" type="career" @book-fly-out="onBookFlyOut" />
      </section>
    </div>

    <BookOpenOverlay
      :visible="overlayVisible"
      :record="overlayRecord"
      :type="overlayType"
      :origin-x="overlayOrigin.x"
      :origin-y="overlayOrigin.y"
      @close="closeOverlay"
      @remove="removeAndCloseOverlay"
    />
  </div>
</template>

<style scoped>
.bookcase-page {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  height: 100%;
  overflow: hidden;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.bookcases-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  gap: 0.5rem;
  align-items: stretch;
  overflow: hidden;
}

.bookcase-unit {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.55rem 0.58rem 0.62rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--parchment-400);
  border-top: 2px solid var(--color-primary);
  background: var(--parchment-100);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 0 0 4px rgba(245, 235, 215, 0.55);
  position: relative;
}

.bookcase-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink-700);
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--gold-300);
  padding-bottom: 0.4rem;
}

.section-count {
  font-size: 0.68rem;
  background: transparent;
  border: 1px solid var(--parchment-400);
  border-radius: var(--radius-sm);
  padding: 0.08rem 0.4rem;
  color: var(--ink-300);
  font-family: var(--font-latin, monospace);
  letter-spacing: 0.04em;
}

.label-entry {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.72rem;
  font-family: var(--font-title);
  letter-spacing: 0.06em;
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  padding: 0.15rem 0.5rem;
  cursor: pointer;
  background: transparent;
  transition: opacity 0.15s, background 0.15s;
  white-space: nowrap;
}

.label-entry:hover {
  opacity: 0.82;
}

.label-entry--portrait {
  color: var(--vermilion-500);
}

.label-entry--portrait:hover {
  background: color-mix(in srgb, var(--vermilion-500) 8%, transparent);
}

.label-entry--career {
  color: var(--indigo-500);
}

.label-entry--career:hover {
  background: color-mix(in srgb, var(--indigo-500) 8%, transparent);
}

.empty-hint {
  margin-top: -0.1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0.38rem 0.5rem;
  border: 1px dashed var(--parchment-400);
  color: var(--ink-300);
  font-size: 0.75rem;
  font-family: var(--font-title);
  letter-spacing: 0.04em;
}

.hint-actions {
  display: inline-flex;
  gap: 0.45rem;
}

.hint-btn {
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--parchment-100);
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  font-family: var(--font-title);
  padding: 0.22rem 0.62rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.hint-btn:hover { opacity: 0.84; }

.hint-btn--ghost {
  background: transparent;
  color: var(--ink-500);
  border-color: var(--parchment-400);
}

@media (max-width: 1024px) {
  .bookcases-layout {
    gap: 0.8rem;
  }
}

@media (max-width: 768px) {
  .bookcases-layout {
    flex-direction: column;
    gap: 0.7rem;
  }

  .bookcase-unit {
    flex: 1 1 auto;
    padding: 0.48rem;
  }
}
</style>
