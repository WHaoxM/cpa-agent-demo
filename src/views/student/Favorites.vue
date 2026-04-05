<!-- 页面：心仪岗位；路由：student/favorites（student-favorites）；角色：STUDENT -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Delete, Sort } from '@element-plus/icons-vue'
import { useLearningStore } from '@/stores'
import type { SavedJob } from '@/types'

const router = useRouter()
const learningStore = useLearningStore()

// TODO: API — GET /api/saved-jobs?userId=xxx
const savedJobs = computed(() => learningStore.savedJobs)

const sortKey = ref<'matchScore' | 'savedAt'>('matchScore')
const sortedJobs = computed(() => {
  return [...savedJobs.value].sort((a, b) => {
    if (sortKey.value === 'matchScore') return b.matchScore - a.matchScore
    return b.savedAt.localeCompare(a.savedAt)
  })
})

function removeJob(jobId: string) {
  learningStore.removeSavedJob(jobId)
  ElMessage.success('已移出心仪岗位')
}

function goToMatch() {
  router.push('/app/student/career-analysis')
}

function scoreColor(score: number) {
  if (score >= 80) return 'var(--color-primary)'
  if (score >= 60) return 'var(--color-gold)'
  return 'var(--color-text-muted)'
}
</script>



<template>
  <div class="favorites-page page">
    <div class="page-header">
      <div>
        <h2>心仪岗位</h2>
        <p class="subtitle">收藏感兴趣的岗位，随时对比匹配度</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Sort" text @click="sortKey = sortKey === 'matchScore' ? 'savedAt' : 'matchScore'">
          {{ sortKey === 'matchScore' ? '按匹配度排序' : '按收藏时间排序' }}
        </el-button>
        <el-button type="primary" @click="goToMatch">进行人岗匹配</el-button>
      </div>
    </div>

    <div v-if="sortedJobs.length > 0" class="jobs-list">
      <div v-for="job in sortedJobs" :key="job.id" class="job-card content-card">
        <!-- 左侧主信息 -->
        <div class="job-main">
          <div class="job-top">
            <div>
              <h3 class="job-title">{{ job.jobTitle }}</h3>
              <div class="job-meta">
                <span class="job-company">{{ job.company }}</span>
                <span class="job-sep">·</span>
                <span class="job-industry">{{ job.industry }}</span>
                <span class="job-sep">·</span>
                <span class="job-location">{{ job.location }}</span>
              </div>
            </div>
            <div class="job-salary">{{ job.salary }}</div>
          </div>

          <div class="job-skills">
            <el-tag
              v-for="skill in job.requiredSkills"
              :key="skill"
              size="small"
              effect="plain"
              class="skill-tag"
            >{{ skill }}</el-tag>
          </div>

          <div v-if="job.notes" class="job-notes">
            <span class="notes-label">备注：</span>{{ job.notes }}
          </div>
        </div>

        <!-- 右侧匹配度 -->
        <div class="job-right">
          <div class="match-score" :style="{ color: scoreColor(job.matchScore) }">
            <span class="score-num">{{ job.matchScore }}</span>
            <span class="score-unit">%</span>
          </div>
          <div class="score-label">匹配度</div>
          <div class="score-bar">
            <div class="score-fill" :style="{ width: job.matchScore + '%', background: scoreColor(job.matchScore) }"></div>
          </div>
          <div class="job-saved-at">收藏于 {{ job.savedAt }}</div>
          <el-button
            text
            type="danger"
            :icon="Delete"
            size="small"
            @click="removeJob(job.id)"
          >移出</el-button>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无收藏的岗位">
      <template #default>
        <el-button type="primary" @click="router.push('/app/student/career-navigation')">
          去浏览岗位图谱
        </el-button>
      </template>
    </el-empty>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.page-header h2 { margin: 0 0 6px; font-size: 22px; }
.subtitle { color: var(--color-text-muted); margin: 0; font-size: 13px; }
.header-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

.jobs-list { display: flex; flex-direction: column; gap: 14px; }

.job-card {
  display: flex;
  gap: 20px;
  align-items: stretch;
  padding: 18px 20px;
}

.job-main { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }

.job-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.job-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px;
  color: var(--color-text);
  font-family: var(--font-title);
}

.job-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.job-sep { opacity: 0.4; }

.job-salary {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  font-family: var(--font-ui);
}

.job-skills { display: flex; flex-wrap: wrap; gap: 6px; }

.skill-tag { font-size: 11px; }

.job-notes {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 6px 10px;
  background: color-mix(in srgb, var(--color-gold) 8%, transparent);
  border-left: 2px solid var(--color-gold);
}

.notes-label { font-weight: 600; }

.job-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 84px;
  padding-left: 20px;
  border-left: 1px solid var(--color-border);
}

.match-score {
  line-height: 1;
  font-family: var(--font-ui);
}

.score-num { font-size: 28px; font-weight: 700; }
.score-unit { font-size: 13px; }
.score-label { font-size: 11px; color: var(--color-text-muted); }

.score-bar {
  width: 64px;
  height: 4px;
  background: var(--color-border);
  margin: 4px 0;
}

.score-fill { height: 100%; transition: width 0.4s ease; }

.job-saved-at { font-size: 10px; color: var(--color-text-subtle); margin-top: 2px; }
</style>


