<!-- 页面：技能课程库；路由：courses（courses）；角色：全部 -->
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

// TODO: API — GET /api/skill-courses
const category = ref<'全部' | '专业技能' | '通用素质' | '实践能力'>('全部')
const keyword = ref('')
const page = ref(1)
const pageSize = ref(8)

const allCourses = ref<Course[]>([
  {
    id: 'c_01',
    name: 'Vue3 + TypeScript 工程化实战',
    cover: '',
    desc: '从组件设计到性能优化，打造可维护的中大型前端项目。对应岗位技能：前端工程师、全栈开发。',
    progress: 72,
    category: '专业技能',
    duration: '38小时',
  },
  {
    id: 'c_02',
    name: 'Python 数据分析与可视化',
    cover: '',
    desc: 'Pandas + ECharts，掌握从数据清洗到可视化表达的全流程。对应岗位：数据分析师、业务分析。',
    progress: 45,
    category: '专业技能',
    duration: '24小时',
  },
  {
    id: 'c_03',
    name: 'AI 大模型应用与 Prompt 工程',
    cover: '',
    desc: '用可复用的 Prompt 模式提升工作效率与输出质量。对应岗位：AI 应用开发、算法工程师。',
    progress: 20,
    category: '专业技能',
    duration: '16小时',
  },
  {
    id: 'c_04',
    name: 'STAR 法调研与面试表达',
    cover: '',
    desc: '学会用结构化语言表达历经与想法，提升面试通过率。对应岗位：所有求职岗位。',
    progress: 88,
    category: '通用素质',
    duration: '8小时',
  },
  {
    id: 'c_05',
    name: '差异化简历撰写与优化',
    cover: '',
    desc: '采用成果导向的表达方式，让简历与岗位需求高度匹配。对应岗位：全岗位。',
    progress: 60,
    category: '通用素质',
    duration: '6小时',
  },
  {
    id: 'c_06',
    name: '数据库与 SQL 进阶实战',
    cover: '',
    desc: '深入掌握复杂查询、索引优化与事务处理。对应岗位：后端开发、数据工程师。',
    progress: 30,
    category: '专业技能',
    duration: '20小时',
  },
  {
    id: 'c_07',
    name: '开源项目贡献实战',
    cover: '',
    desc: '从 Issue 到 PR，在真实项目中积累实想经验。对应岗位：开发工程师。',
    progress: 0,
    category: '实践能力',
    duration: '自主',
  },
  {
    id: 'c_08',
    name: '计算机网络与分布式系统',
    cover: '',
    desc: 'TCP/IP、分布式对象存储与 CAP，面试常考背景知识。对应岗位：后端开发。',
    progress: 15,
    category: '专业技能',
    duration: '18小时',
  },
  {
    id: 'c_09',
    name: '实习申请与求职节奏管理',
    cover: '',
    desc: '制定求职时间表，掌握实习平台筛选技巧与快速响应策略。对应岗位：应届生。',
    progress: 0,
    category: '实践能力',
    duration: '5小时',
  },
])

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return allCourses.value.filter((c) => {
    const okCategory = category.value === '全部' ? true : c.category === category.value
    // TODO: API — GET /api/skill-courses?category=xxx
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
          <el-option label="专业技能" value="专业技能" />
          <el-option label="通用素质" value="通用素质" />
          <el-option label="实践能力" value="实践能力" />
        </el-select>
        <el-input v-model="keyword" size="large" placeholder="搜索技能课程名称或岗位" clearable class="toolbar__input" />
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


