<!-- 组件：NotesView -->
<script setup lang="ts">
import { computed, ref } from 'vue'

type Note = {
  id: string
  title: string
  content: string
  course: string
  level: 1 | 2 | 3
}

const courseFilter = ref<'全部' | string>('全部')

const notes = ref<Note[]>([
  {
    id: 'n_01',
    title: '路由守卫：先白名单再鉴权',
    content: '守卫逻辑先处理 /login 等公开页面，再判断 token / user。避免死循环。',
    course: 'Vue3 + TypeScript 工程化实战',
    level: 3,
  },
  {
    id: 'n_02',
    title: '主题系统：先定义 token，再映射组件变量',
    content: '用 --primary/--bg/--text 等语义变量统一视觉，再覆盖 --el-color-primary 等。',
    course: '设计系统：Token 到组件库',
    level: 2,
  },
  {
    id: 'n_03',
    title: '卡片层级：阴影要克制',
    content: '基础卡片用轻阴影，hover 才增强。边框与背景有轻微对比以提升质感。',
    course: '交互设计与信息架构',
    level: 1,
  },
  {
    id: 'n_04',
    title: '移动端侧栏：抽屉比折叠更友好',
    content: '小屏优先触控体验：更大点击区域、更少层级、抽屉式导航更自然。',
    course: '前端性能与体验 Pro Max',
    level: 2,
  },
])

const courses = computed(() => {
  const s = new Set(notes.value.map((n) => n.course))
  return ['全部', ...Array.from(s)]
})

const filtered = computed(() => {
  return notes.value.filter((n) => (courseFilter.value === '全部' ? true : n.course === courseFilter.value))
})

function levelText(level: Note['level']) {
  if (level === 3) return '重点'
  if (level === 2) return '常用'
  return '备忘'
}

function levelType(level: Note['level']) {
  if (level === 3) return 'danger'
  if (level === 2) return 'warning'
  return 'info'
}
</script>



<template>
  <div class="page">
    <div class="toolbar ui-card">
      <div>
        <div class="toolbar__title">笔记</div>
      </div>

      <el-select v-model="courseFilter" size="large" class="toolbar__select">
        <el-option v-for="c in courses" :key="c" :label="c" :value="c" />
      </el-select>
    </div>

    <div class="grid">
      <el-card v-for="n in filtered" :key="n.id" class="note ui-card" shadow="never">
        <div class="note__head">
          <div class="note__title">{{ n.title }}</div>
          <el-tag :type="levelType(n.level)" round effect="dark">{{ levelText(n.level) }}</el-tag>
        </div>
        <div class="note__content">{{ n.content }}</div>
        <div class="note__foot">
          <el-tag size="small" effect="plain" round>{{ n.course }}</el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.toolbar {
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar__title {
  font-weight: 900;
  font-size: 16px;
  line-height: 1.2;
}

.toolbar__sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-200);
}

.toolbar__select {
  width: min(420px, 100%);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.note {
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
}

.note__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.note__title {
  font-weight: 900;
  line-height: 1.35;
}

.note__content {
  margin-top: 10px;
  color: var(--text-200);
  line-height: 1.55;
}

.note__foot {
  margin-top: 12px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>


