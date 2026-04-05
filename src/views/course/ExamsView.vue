<!-- 页面：技能自测；路由：exams（exams）；角色：STUDENT -->
<script setup lang="ts">
import { computed, ref } from 'vue'

type ExamStatus = '未开始' | '进行中' | '已结束'

type Exam = {
  id: string
  name: string
  time: string
  status: ExamStatus
}

const statusFilter = ref<'全部' | ExamStatus>('全部')

// TODO: API — GET /api/skill-assessments?userId=xxx
const list = ref<Exam[]>([
  { id: 'e_01', name: '专业技能自测：前端开发基础', time: '2026-02-12 10:00', status: '未开始' },
  { id: 'e_02', name: '通用素质自测：岗位认知与职业规划', time: '2026-02-10 14:00', status: '进行中' },
  { id: 'e_03', name: '实践能力自测：项目经历与实习表达', time: '2026-01-28 20:00', status: '已结束' },
  { id: 'e_04', name: '学习能力自测：快速成长与自主学习', time: '2026-02-03 16:30', status: '已结束' },
  { id: 'e_05', name: '抖压能力自测：应聘场景模拟', time: '2026-02-15 09:00', status: '未开始' },
])

const filtered = computed(() => {
  return list.value.filter((x) => (statusFilter.value === '全部' ? true : x.status === statusFilter.value))
})

function statusType(s: ExamStatus) {
  if (s === '进行中') return 'success'
  if (s === '未开始') return 'warning'
  return 'info'
}
</script>



<template>
  <div class="page">
    <div class="head ui-card">
      <div class="head__left">
        <div class="head__title">技能自测</div>
      </div>
      <el-select v-model="statusFilter" size="large" class="head__select">
        <el-option label="全部" value="全部" />
        <el-option label="未开始" value="未开始" />
        <el-option label="进行中" value="进行中" />
        <el-option label="已结束" value="已结束" />
      </el-select>
    </div>

    <el-card class="table ui-card" shadow="never">
      <el-table :data="filtered" style="width: 100%" size="large">
        <el-table-column prop="name" label="自测题目" min-width="240" />
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column label="状态" width="140">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)" round effect="dark">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.head {
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.head__title {
  font-weight: 900;
  font-size: 16px;
  line-height: 1.2;
}

.head__sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-200);
}

.head__select {
  width: 160px;
}

.table {
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  overflow: hidden;
}
</style>


