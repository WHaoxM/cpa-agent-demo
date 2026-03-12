<!-- 页面：课程工作台；路由：student/course/:id（student-course-detail）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/stores'
import { useUserStore } from '@/stores'

type TabItem = { label: string; name: string }

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore()

const courseId = computed(() => String(route.params.id || ''))
const course = computed(() => courseStore.getCourseById(courseId.value))

const isMobile = ref(false)
const chapterDrawerOpen = ref(false)

function calcIsMobile() {
  isMobile.value = window.matchMedia('(max-width: 992px)').matches
  if (!isMobile.value) chapterDrawerOpen.value = false
}

onMounted(() => {
  calcIsMobile()
  window.addEventListener('resize', calcIsMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calcIsMobile)
})

const tabItems: TabItem[] = [
  { label: '学习内容', name: 'student-course-chapters' },
  { label: '任务', name: 'student-course-tasks' },
  { label: '讨论', name: 'student-course-discuss' },
  { label: '作业', name: 'student-course-homework' },
  { label: '考试', name: 'student-course-exam' },
  { label: '资料', name: 'student-course-resources' },
  { label: '错题集', name: 'student-course-wrongbook' },
  { label: '学习记录', name: 'student-course-records' },
  { label: '课程回顾', name: 'student-course-review' },
]

const activeTab = ref(tabItems[0]?.name || '')
watch(
  () => route.name,
  () => {
    const current = String(route.name || '')
    if (tabItems.some((t) => t.name === current)) activeTab.value = current
  },
  { immediate: true },
)

function onTabChange(name: any) {
  const n = String(name || '')
  if (!n) return
  router.push({ name: n, params: { id: courseId.value }, query: route.query })
}

const chapterKeyword = ref('')
const selectedChapterId = computed(() => String(route.query.chapterId || ''))

const chapters = computed(() => {
  const list = [...(course.value?.chapters || [])]
  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return list
})

const filteredChapters = computed(() => {
  const kw = chapterKeyword.value.trim().toLowerCase()
  if (!kw) return chapters.value
  return chapters.value.filter((ch) => String(ch.title || '').toLowerCase().includes(kw))
})

const chapterStats = computed(() => {
  const uid = userStore.currentUser?.id || ''
  const total = chapters.value.length
  let completed = 0
  for (const ch of chapters.value) {
    const p = uid ? courseStore.getChapterProgress(uid, ch.id) : undefined
    if (p?.completed) completed++
  }
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, rate }
})

function goToChapter(chapterId: string) {
  const q = { ...route.query, chapterId }
  router.push({ name: 'student-course-chapters', params: { id: courseId.value }, query: q })
  chapterDrawerOpen.value = false
}

function goBack() {
  router.push('/app/student/learning')
}
</script>



<template>
  <div class="course-workspace page">
    <div class="workspace-header">
      <button class="back-btn" type="button" @click="goBack">返回</button>
      <div class="course-meta">
        <div class="course-meta__title">{{ course?.title || '课程' }}</div>
        <div class="course-meta__sub">（2024-2025-1）</div>
      </div>

      <div class="workspace-header__right">
        <button v-if="isMobile" class="chapters-btn" type="button" @click="chapterDrawerOpen = true">章节目录</button>
      </div>
    </div>

    <div class="workspace-body">
      <aside class="chapter-panel" aria-label="章节目录" :class="{ 'chapter-panel--hidden': isMobile }">
        <div class="chapter-panel__head">
          <div class="chapter-panel__title">章节目录</div>
          <div class="chapter-panel__stats">
            <span class="stat-pill">完成 {{ chapterStats.completed }}/{{ chapterStats.total }}</span>
            <span class="stat-pill stat-pill--primary">{{ chapterStats.rate }}%</span>
          </div>
        </div>

        <div class="chapter-panel__search">
          <el-input v-model="chapterKeyword" size="small" placeholder="搜索章节" clearable />
        </div>

        <div class="chapter-panel__progress">
          <el-progress :percentage="chapterStats.rate" :stroke-width="10" :show-text="false" />
        </div>

        <div class="chapter-list" role="list">
          <button
            v-for="ch in filteredChapters"
            :key="ch.id"
            class="chapter-row"
            type="button"
            :class="{ active: selectedChapterId === ch.id }"
            @click="goToChapter(ch.id)"
          >
            <div class="chapter-row__main">
              <div class="chapter-row__title">{{ ch.title }}</div>
              <div class="chapter-row__meta">{{ ch.duration }} 分钟</div>
            </div>
            <div class="chapter-row__state">
              <span
                v-if="(userStore.currentUser?.id && courseStore.getChapterProgress(userStore.currentUser?.id, ch.id)?.completed)"
                class="state-pill state-pill--ok"
              >
                已完成
              </span>
              <span
                v-else-if="(userStore.currentUser?.id && (courseStore.getChapterProgress(userStore.currentUser?.id, ch.id)?.progress || 0) > 0)"
                class="state-pill state-pill--doing"
              >
                进行中
              </span>
              <span v-else class="state-pill">未开始</span>
            </div>
          </button>
        </div>
      </aside>

      <main class="workspace-content">
        <div class="workspace-tabs">
          <el-tabs v-model="activeTab" type="card" class="workspace-tabs__inner" @tab-change="onTabChange">
            <el-tab-pane v-for="t in tabItems" :key="t.name" :label="t.label" :name="t.name" />
          </el-tabs>
        </div>

        <div class="workspace-content__inner">
          <router-view />
        </div>
      </main>
    </div>

    <el-drawer v-model="chapterDrawerOpen" direction="ltr" size="84%" :with-header="false" class="chapters-drawer">
      <div class="drawer-body">
        <div class="drawer-head">
          <div class="drawer-title">章节目录</div>
          <button class="drawer-close" type="button" @click="chapterDrawerOpen = false">关闭</button>
        </div>
        <div class="drawer-search">
          <el-input v-model="chapterKeyword" size="small" placeholder="搜索章节" clearable />
        </div>
        <div class="drawer-progress">
          <el-progress :percentage="chapterStats.rate" :stroke-width="10" :show-text="false" />
        </div>
        <div class="drawer-list">
          <button
            v-for="ch in filteredChapters"
            :key="ch.id"
            class="chapter-row"
            type="button"
            :class="{ active: selectedChapterId === ch.id }"
            @click="goToChapter(ch.id)"
          >
            <div class="chapter-row__main">
              <div class="chapter-row__title">{{ ch.title }}</div>
              <div class="chapter-row__meta">{{ ch.duration }} 分钟</div>
            </div>
            <div class="chapter-row__state">
              <span
                v-if="(userStore.currentUser?.id && courseStore.getChapterProgress(userStore.currentUser?.id, ch.id)?.completed)"
                class="state-pill state-pill--ok"
              >
                已完成
              </span>
              <span
                v-else-if="(userStore.currentUser?.id && (courseStore.getChapterProgress(userStore.currentUser?.id, ch.id)?.progress || 0) > 0)"
                class="state-pill state-pill--doing"
              >
                进行中
              </span>
              <span v-else class="state-pill">未开始</span>
            </div>
          </button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.course-workspace {
  padding: 10px 12px;
}

.workspace-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.workspace-header__right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.back-btn {
  appearance: none;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  border-radius: 0;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;
  color: var(--text-100);
}

.back-btn:hover {
  border-color: color-mix(in srgb, var(--primary-100) 35%, var(--bg-300) 65%);
  box-shadow: 0 12px 24px rgba(16, 24, 40, 0.10);
}

.chapters-btn {
  appearance: none;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-100) 90%);
  border-radius: 0;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;
  color: var(--text-100);
}

.course-meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.course-meta__title {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-meta__sub {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-200);
}

.workspace-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
}


.chapter-panel {
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  min-height: 640px;
  overflow: hidden;
}

.chapter-panel--hidden {
  display: none;
}

.chapter-panel__head {
  padding: 14px 14px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
}

.chapter-panel__title {
  font-size: 13px;
  font-weight: 900;
  color: var(--text-100);
}

.chapter-panel__stats {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-pill {
  height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  color: var(--text-100);
  font-size: 12px;
  font-weight: 800;
}

.stat-pill--primary {
  border-color: color-mix(in srgb, var(--primary-100) 55%, transparent 45%);
  background: color-mix(in srgb, var(--primary-100) 10%, var(--bg-100) 90%);
}

.chapter-panel__search {
  padding: 10px 14px 0;
}

.chapter-panel__progress {
  padding: 10px 14px 12px;
}

.chapter-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 10px 12px;
}

.chapter-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 0;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.chapter-row:hover {
  background: color-mix(in srgb, var(--primary-100) 8%, var(--bg-100) 92%);
}

.chapter-row.active {
  border-color: color-mix(in srgb, var(--primary-100) 55%, transparent 45%);
  background: color-mix(in srgb, var(--primary-100) 12%, var(--bg-100) 88%);
}

.chapter-row__main {
  min-width: 0;
}

.chapter-row__title {
  font-size: 13px;
  font-weight: 900;
  color: var(--text-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-row__meta {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-200);
}

.state-pill {
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  color: var(--text-200);
  font-size: 12px;
  font-weight: 800;
}

.state-pill--doing {
  color: color-mix(in srgb, var(--primary-100) 70%, var(--text-100) 30%);
  border-color: color-mix(in srgb, var(--primary-100) 45%, transparent 55%);
}

.state-pill--ok {
  color: color-mix(in srgb, #22c55e 65%, var(--text-100) 35%);
  border-color: color-mix(in srgb, #22c55e 45%, transparent 55%);
}

.workspace-content {
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  border-radius: 0;
  padding: 0;
  min-height: 640px;
  box-shadow: none;
  display: flex;
  flex-direction: column;
}

.workspace-tabs {
  position: sticky;
  top: 0;
  z-index: 2;
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
  padding: 8px 10px 6px;
}

.workspace-tabs__inner :deep(.el-tabs__header) {
  margin: 0;
}

.workspace-content__inner {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px;
}

.chapters-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.drawer-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
}

.drawer-head {
  padding: 14px 14px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
}

.drawer-title {
  font-size: 14px;
  font-weight: 900;
  color: var(--text-100);
}

.drawer-close {
  appearance: none;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  border-radius: 0;
  padding: 8px 10px;
  cursor: pointer;
  font-weight: 800;
  color: var(--text-100);
}

.drawer-search {
  padding: 10px 14px 0;
}

.drawer-progress {
  padding: 10px 14px 12px;
}

.drawer-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 10px 12px;
}

@media (max-width: 992px) {
  .workspace-body {
    grid-template-columns: 1fr;
  }
}
</style>


