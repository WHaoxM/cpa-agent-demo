<script setup lang="ts">
import { computed, ref } from 'vue'
import { gsap } from '@/plugins/gsap'
import type { ReportRecord } from '@/types'

const props = defineProps<{
  books: ReportRecord[]
  type: 'portrait' | 'career'
}>()

const emit = defineEmits<{
  (e: 'book-fly-out', payload: { record: ReportRecord; originX: number; originY: number; type: 'portrait' | 'career' }): void
}>()

const animatingId = ref<string | null>(null)
const bookRefs = new Map<string, HTMLButtonElement>()

type BookViewItem = {
  record: ReportRecord
  dateLabel: string
  titleLabel: string
  width: number
  height: number
}

function hashSeed(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) & 0xffff
  }
  return Math.abs(h)
}

function hashSeed2(text: string): number {
  let h = 0x9e3779b9
  for (let i = 0; i < text.length; i++) {
    h = ((h ^ text.charCodeAt(i)) * 0x6c62272e) & 0xffff
  }
  return Math.abs(h)
}

function formatSpineDate(dateStr: string): string {
  return dateStr.slice(0, 10).replace(/-/g, '.')
}

function createBookView(record: ReportRecord): BookViewItem {
  const seed = hashSeed(record.id)
  const seed2 = hashSeed2(record.id)
  return {
    record,
    dateLabel: formatSpineDate(record.createdAt),
    titleLabel: record.title.length > 8 ? `${record.title.slice(0, 8)}…` : record.title,
    width: 20 + (seed % 28),
    height: 72 + (seed2 % 72),
  }
}

const shelfRows = computed(() => {
  const list = props.books.slice(0, 24).map(createBookView)
  return [
    list.slice(0, 8),
    list.slice(8, 16),
    list.slice(16, 24),
  ]
})

function setBookRef(id: string, el: unknown) {
  if (!el) {
    bookRefs.delete(id)
  } else {
    bookRefs.set(id, el as HTMLButtonElement)
  }
}

function handleHover(id: string, enter: boolean) {
  if (animatingId.value === id) return
  const el = bookRefs.get(id)
  if (!el) return
  gsap.to(el, {
    y: enter ? -8 : 0,
    z: enter ? 4 : 0,
    duration: 0.2,
    ease: 'power2.out',
    overwrite: true,
  })
}

function handleBookClick(item: BookViewItem, evt: MouseEvent) {
  if (animatingId.value) return
  const el = bookRefs.get(item.record.id)
  if (!el) return

  animatingId.value = item.record.id

  gsap.timeline({
    onComplete: () => {
      gsap.set(el, { clearProps: 'all' })
      animatingId.value = null
      emit('book-fly-out', {
        record: item.record,
        originX: evt.clientX,
        originY: evt.clientY,
        type: props.type,
      })
    },
  })
    .to(el, {
      y: -14,
      rotateZ: -3,
      scale: 1.12,
      duration: 0.24,
      ease: 'power2.out',
    })
    .to(el, {
      y: -60,
      scale: 1.22,
      opacity: 0,
      duration: 0.22,
      ease: 'power2.in',
    })
}
</script>

<template>
  <div class="bookshelf-stage">
    <div class="shelf-cabinet">
      <div class="cabinet-frame">
        <div class="cabinet-top-deco"></div>

        <div class="shelf-row" v-for="(row, rowIndex) in shelfRows" :key="rowIndex">
          <button
            v-for="item in row"
            :key="item.record.id"
            :ref="(el) => setBookRef(item.record.id, el)"
            class="book-item"
            :class="[`book-item--${type}`, { 'book-item--animating': animatingId === item.record.id }]"
            :style="{ '--book-w': `${item.width}px`, '--book-h': `${item.height}px` }"
            :title="item.record.title"
            @mouseenter="handleHover(item.record.id, true)"
            @mouseleave="handleHover(item.record.id, false)"
            @click="handleBookClick(item, $event)"
          >
            <span class="book-depth book-depth--top"></span>
            <span class="book-depth book-depth--side"></span>

            <span class="book-face">
              <svg class="book-face-svg" viewBox="0 0 100 320" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient :id="`book-grad-${item.record.id}`" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" :stop-color="type === 'portrait' ? '#cf4a28' : '#4169bf'" />
                    <stop offset="0.6" :stop-color="type === 'portrait' ? '#b53516' : '#30559c'" />
                    <stop offset="1" :stop-color="type === 'portrait' ? '#8f230f' : '#223f7f'" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="100" height="320" :fill="`url(#book-grad-${item.record.id})`" />
                <rect x="0" y="0" width="12" height="320" fill="rgba(20,16,12,0.28)" />
                <rect x="8" y="24" width="84" height="2" fill="rgba(255,255,255,0.28)" />
                <rect x="8" y="44" width="84" height="1" fill="rgba(255,255,255,0.2)" />
                <rect x="8" y="62" width="84" height="1" fill="rgba(255,255,255,0.2)" />
              </svg>

              <span class="book-binding"></span>
              <span class="book-date">{{ item.dateLabel }}</span>
              <span class="book-title">{{ item.titleLabel }}</span>
            </span>
          </button>

          <div v-if="!row.length" class="shelf-empty">暂无报告</div>
        </div>

        <div class="shelf-shadow"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookshelf-stage {
  width: 100%;
  flex: 1;
  min-height: 360px;
  border: 3px solid #7A2010;
  background: linear-gradient(180deg, #6B1A08 0%, #551406 50%, #420E04 100%);
  overflow: hidden;
  box-shadow:
    0 8px 24px rgba(20, 6, 2, 0.50),
    inset 0 0 30px rgba(0, 0, 0, 0.25);
  position: relative;
}

/* 外框竖向木纹暗纹 */
.bookshelf-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    transparent 32px,
    rgba(255, 210, 140, 0.06) 32px,
    rgba(255, 210, 140, 0.06) 34px
  );
  z-index: 0;
}

.shelf-cabinet {
  height: 100%;
  padding: 10px 12px;
  transform-style: preserve-3d;
  position: relative;
  z-index: 1;
}

.cabinet-frame {
  height: 100%;
  border: 10px solid #7A2010;
  border-left-width: 13px;
  border-right-width: 13px;
  border-bottom-width: 16px;
  border-top-width: 8px;
  background: linear-gradient(175deg, #3D1A0A 0%, #2E1208 50%, #241006 100%);
  box-shadow:
    inset 0 0 0 1px rgba(201, 162, 39, 0.35),
    inset 0 0 0 2px rgba(122, 32, 16, 0.55),
    inset 5px 0 14px rgba(0, 0, 0, 0.22),
    inset -5px 0 14px rgba(0, 0, 0, 0.22),
    inset 0 4px 8px rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 6px 10px;
  transform-style: preserve-3d;
  position: relative;
}

/* 金线框内侧装饰 */
.cabinet-frame::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(201, 162, 39, 0.25);
  pointer-events: none;
  z-index: 0;
}

.cabinet-top-deco {
  height: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  padding: 0 4px;
  position: relative;
  z-index: 1;
}

.cabinet-top-deco::before,
.cabinet-top-deco::after {
  content: '';
  display: block;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(201, 162, 39, 0.7), transparent);
}

.shelf-row {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  flex: 1;
  min-height: 0;
  padding: 6px 8px 0;
  background: linear-gradient(180deg, #3C1E0C 0%, #2E1508 100%);
  border: 1px solid rgba(122, 32, 16, 0.50);
  box-shadow:
    inset 0 0 0 1px rgba(201, 162, 39, 0.10),
    inset 0 8px 16px rgba(0, 0, 0, 0.35),
    inset 0 -2px 6px rgba(200, 120, 50, 0.12);
  transform: translateZ(4px);
  z-index: 1;
  overflow: hidden;
}

.shelf-row::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 10px;
  background: linear-gradient(180deg, transparent, rgba(20, 8, 2, 0.60));
  border-top: 1px solid rgba(160, 70, 24, 0.35);
}

.book-item {
  position: relative;
  width: var(--book-w);
  height: var(--book-h);
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  transform-style: preserve-3d;
  transform-origin: center bottom;
}

.book-item--animating {
  pointer-events: none;
}

.book-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 1px solid rgba(34, 22, 16, 0.45);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.22),
    inset -4px 0 8px rgba(0, 0, 0, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.book-face-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.book-depth {
  position: absolute;
  display: block;
  pointer-events: none;
}

.book-depth--top {
  left: 0;
  top: -4px;
  width: 100%;
  height: 4px;
  transform-origin: bottom;
  transform: rotateX(90deg);
  background: rgba(233, 217, 193, 0.88);
}

.book-depth--side {
  top: 0;
  right: -5px;
  width: 5px;
  height: 100%;
  transform-origin: left;
  transform: rotateY(90deg);
  background: rgba(78, 56, 43, 0.55);
}

.book-binding {
  position: absolute;
  top: 6px;
  left: 5px;
  right: 5px;
  height: 3px;
  border-top: 1px solid rgba(245, 232, 200, 0.9);
  border-bottom: 1px solid rgba(245, 232, 200, 0.58);
}

.book-date {
  position: absolute;
  top: 14px;
  right: 3px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 10px;
  line-height: 1;
  color: rgba(255, 244, 226, 0.96);
  font-family: var(--font-latin, monospace);
  letter-spacing: 0.05em;
}

.book-title {
  position: absolute;
  left: 5px;
  right: 5px;
  bottom: 8px;
  text-align: center;
  font-size: 10px;
  color: rgba(251, 239, 214, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.42);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-item--career .book-depth--side {
  background: rgba(39, 59, 102, 0.68);
}

.book-item--career .book-depth--top {
  background: rgba(212, 224, 246, 0.9);
}

.shelf-empty {
  margin: auto;
  font-size: 12px;
  color: rgba(201, 162, 39, 0.5);
}

.shelf-shadow {
  flex-shrink: 0;
  height: 8px;
  background: radial-gradient(ellipse at center, rgba(107, 26, 10, 0.55), transparent);
  transform: translateZ(1px);
}

@media (max-width: 768px) {
  .bookshelf-stage {
    min-height: 300px;
  }

  .shelf-row {
    min-height: 100px;
    gap: 4px;
  }
}
</style>
