<!-- 页面：消息；路由：messages（messages） -->
<script setup lang="ts">
import { computed, ref } from 'vue'

type MsgType = '系统消息' | '课程通知'

type Msg = {
  id: string
  title: string
  content: string
  time: string
  type: MsgType
  read: boolean
}

const tab = ref<MsgType | '全部'>('全部')

const list = ref<Msg[]>([
  {
    id: 'm_01',
    title: '学习中心新主题上线',
    content: '现在支持“宝石蓝 / 温暖 / 宣纸 / 落日”四种主题，切换更丝滑。',
    time: '2026-02-07 14:12',
    type: '系统消息',
    read: false,
  },
  {
    id: 'm_02',
    title: '《Vue3 + TypeScript 工程化实战》新增章节',
    content: '已更新：路由守卫与鉴权最佳实践。建议优先学习。',
    time: '2026-02-06 20:30',
    type: '课程通知',
    read: false,
  },
  {
    id: 'm_03',
    title: '本周学习提醒',
    content: '保持节奏：每次 45 分钟深度学习 + 10 分钟复盘。',
    time: '2026-02-03 09:00',
    type: '系统消息',
    read: true,
  },
])

const filtered = computed(() => {
  return list.value.filter((x) => (tab.value === '全部' ? true : x.type === tab.value))
})

const unreadCount = computed(() => list.value.filter((x) => !x.read).length)

function markRead(id: string) {
  const m = list.value.find((x) => x.id === id)
  if (m) m.read = true
}
</script>



<template>
  <div class="page page--compact messages-page">
    <div class="toolbar">
      <div class="toolbar__title">
        消息
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="toolbar__badge" />
      </div>

      <el-segmented
        class="toolbar__seg"
        v-model="tab"
        :options="[
          { label: '全部', value: '全部' },
          { label: '系统消息', value: '系统消息' },
          { label: '课程通知', value: '课程通知' },
        ]"
      />
    </div>

    <div class="msg-list" role="list">
      <button
        v-for="m in filtered"
        :key="m.id"
        class="msg-row"
        type="button"
        role="listitem"
        @click="markRead(m.id)"
      >
        <div class="msg-row__main">
          <div class="msg-row__title">
            <span v-if="!m.read" class="msg-row__dot" />
            <span class="msg-row__title-text">{{ m.title }}</span>
            <el-tag size="small" round effect="plain" class="msg-row__type">{{ m.type }}</el-tag>
          </div>
          <div class="msg-row__meta">{{ m.time }}</div>
          <div class="msg-row__content">{{ m.content }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.messages-page {
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px;
  border-radius: 0;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  box-shadow: var(--shadow-sm);
}

.toolbar__title {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.toolbar__seg {
  border-radius: 0;
}

.msg-list {
  margin-top: 10px;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.msg-row {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 12px;
  cursor: pointer;
  transition: background 0.18s ease;
}

.msg-row:hover {
  background: color-mix(in srgb, var(--bg-200) 78%, transparent 22%);
}

.msg-row + .msg-row {
  border-top: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
}

.msg-row__main {
  min-width: 0;
}

.msg-row__title {
  font-weight: 600;
  line-height: 1.35;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.msg-row__title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-row__type {
  margin-left: auto;
}

.msg-row__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--accent-100);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent-100) 14%, transparent 86%);
}

.msg-row__meta {
  margin-top: 6px;
  font-size: 12px;
  color: color-mix(in srgb, var(--text-200) 70%, transparent 30%);
}

.msg-row__content {
  margin-top: 6px;
  color: var(--text-200);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>


