<!-- 页面：课程列表；路由：courses（courses） -->
<script setup lang="ts">
import { computed, ref } from 'vue'

type Course = {
  id: string
  name: string
  cover: string
  desc: string
  progress: number
  category: string
  duration: string
}

const category = ref<'全部' | '前端' | '产品' | 'AI'>('全部')
const keyword = ref('')
const page = ref(1)
const pageSize = ref(8)

const allCourses = ref<Course[]>([
  {
    id: 'c_01',
    name: 'Vue3 + TypeScript 工程化实战',
    cover: '',
    desc: '从组件设计到性能优化，打造可维护的中大型前端项目。',
    progress: 100,
    category: '前端',
    duration: '0',
  },
  {
    id: 'c_02',
    name: '交互设计与信息架构',
    cover: '',
    desc: '建立一致的视觉层级与动线，让产品更易用更克制。',
    progress: 100,
    category: '产品',
    duration: '0',
  },
  {
    id: 'c_03',
    name: 'AI 辅助学习：提示词与工作流',
    cover: '',
    desc: '用可复用的 prompt 模版提升学习效率与输出质量。',
    progress: 100,
    category: 'AI',
    duration: '0',
  },
  {
    id: 'c_04',
    name: '前端性能与体验 Pro Max',
    cover: '',
    desc: 'LCP/CLS/INP 全链路优化，兼顾可访问性与体验。',
    progress: 100,
    category: '前端',
    duration: '0',
  },
  {
    id: 'c_05',
    name: '设计系统：Token 到组件库',
    cover: '',
    desc: '基于 8px 网格与主题 token，构建一致的 UI 语言。',
    progress: 100,
    category: '产品',
    duration: '0',
  },
  {
    id: 'c_06',
    name: 'AI 数据可视化与叙事',
    cover: '',
    desc: '用图表讲故事：指标、结构、洞察与表达。',
    progress: 100,
    category: 'AI',
    duration: '0',
  },
  {
    id: 'c_07',
    name: '组件设计：从 API 到交互细节',
    cover: '',
    desc: '在一致性与灵活性之间找到平衡点。',
    progress: 100,
    category: '前端',
    duration: '0',
  },
  {
    id: 'c_08',
    name: '产品增长：指标体系与实验设计',
    cover: '',
    desc: '用数据驱动决策，用实验驱动迭代。',
    progress: 100,
    category: '产品',
    duration: '0',
  },
  {
    id: 'c_09',
    name: 'AI 学习路径：从 0 到 1',
    cover: '',
    desc: '学习目标拆解 + 复盘机制，建立可持续的成长飞轮。',
    progress: 100,
    category: 'AI',
    duration: '0',
  },
])

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return allCourses.value.filter((c) => {
    const okCategory = category.value === '全部' ? true : c.category === category.value
    const okKeyword = k ? c.name.toLowerCase().includes(k) || c.desc.toLowerCase().includes(k) : true
    return okCategory && okKeyword
  })
})

const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
</script>



<template>
  <div class="page">
    <div class="toolbar ui-card">
      <div class="toolbar__left">
        <el-select v-model="category" size="large" class="toolbar__select">
          <el-option label="全部" value="全部" />
          <el-option label="前端" value="前端" />
          <el-option label="产品" value="产品" />
          <el-option label="AI" value="AI" />
        </el-select>
        <el-input v-model="keyword" size="large" placeholder="搜索课程 / 简介" clearable class="toolbar__input" />
      </div>

      <div class="toolbar__right">
        <el-tag round effect="plain">共 {{ filtered.length }} 门</el-tag>
      </div>
    </div>

    <div class="grid">
      <el-card v-for="c in paged" :key="c.id" class="course ui-card" shadow="never">
        <div class="course__body">
          <div class="course__top">
            <div class="course__name">{{ c.name }}</div>
            <el-tag size="small" round effect="plain">{{ c.category }}</el-tag>
          </div>
          <div class="course__desc">{{ c.desc }}</div>

          <div class="course__meta">
            <span class="course__meta-item">时长 {{ c.duration }}</span>
            <span class="course__meta-dot">·</span>
            <span class="course__meta-item">进度 {{ c.progress }}%</span>
          </div>

          <el-progress :percentage="c.progress" :stroke-width="10" status="success" />
        </div>
      </el-card>
    </div>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[8, 12, 16]"
        layout="total, sizes, prev, pager, next"
        :total="filtered.length"
        background
      />
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.toolbar {
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar__left {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.toolbar__select {
  width: 132px;
}

.toolbar__input {
  flex: 1;
  min-width: 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.course {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
}

.course:hover {
  border-color: var(--card-hover-border);
  background: color-mix(in srgb, var(--bg-200) 20%, var(--card-bg) 80%);
  transform: translateY(-1px);
}

.course__cover {
  height: 146px;
  background-size: cover;
  background-position: center;
  filter: saturate(1.05);
}

.course__body {
  padding: 14px;
}

.course__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.course__name {
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
}

.course__desc {
  margin-top: 8px;
  color: var(--text-200);
  font-size: 13px;
  line-height: 1.5;
}

.course__meta {
  margin-top: 10px;
  color: color-mix(in srgb, var(--text-200) 75%, transparent 25%);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.course__meta-dot {
  opacity: 0.55;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding: 4px 2px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .course__cover {
    height: 150px;
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .course__cover {
    height: 156px;
  }
}
</style>


