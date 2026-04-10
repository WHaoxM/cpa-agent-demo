<!-- 页面：技能提升；路由：student/learning（student-learning）；角色：STUDENT -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { useUserStore, useCourseStore } from '@/stores'
import { getCourseSystemData, COURSE_GROUP_LABELS } from '@/composables/useCourseSystem'
import type { CourseSystemData } from '@/composables/useCourseSystem'
import type { Course } from '@/types'
import D3Treemap from '@/components/charts/D3Treemap.vue'
import type { TreemapCategory, TreemapCourse } from '@/components/charts/D3Treemap.vue'
import D3ChordDiagram from '@/components/charts/D3ChordDiagram.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()

/* ═══ 来源岗位（从 CourseSystemGraph 跳转时携带 ?role=xxx） ═══ */
const fromRole = computed<string>(() => (route.query.role as string) || '')

/* ═══ 课程体系数据（用于弦图） ═══ */
const graphData = ref<CourseSystemData | null>(null)
onMounted(() => loadGraphData())
watch(fromRole, () => loadGraphData())
async function loadGraphData() {
  const role = fromRole.value || '前端开发工程师'
  graphData.value = await getCourseSystemData(role)
}

/* ═══ 搜索 & 筛选 ═══ */
const keyword = ref('')
const selectedCategory = ref<string>('all')
const page = ref(1)
const PAGE_SIZE = 12

function clearRole() {
  router.replace({ query: {} })
}

function goBackToGraph() {
  router.push({ name: 'course-system', query: { role: fromRole.value } })
}

function selectCategory(catId: string) {
  selectedCategory.value = catId
  page.value = 1
}

/* ═══ 岗位相关课程 ID 集合（高亮用） ═══ */
const roleCourseIds = computed<Set<string>>(() => {
  if (!graphData.value || !fromRole.value) return new Set()
  const courseIds = new Set<string>()
  const skillEdges = graphData.value.skillCourseEdges
  const gcNodes = graphData.value.courseNodes
  for (const edge of skillEdges) {
    const gcNode = gcNodes.find(n => n.id === edge.courseId)
    if (!gcNode) continue
    // Map GraphCourseNode title to real course by substring match
    const match = courseStore.courses.find(c =>
      c.title.includes(gcNode.title.substring(0, 4)) ||
      gcNode.title.includes(c.title.substring(0, 4))
    )
    if (match) courseIds.add(match.id)
  }
  // Also directly map course_001~course_005 via courseSkillMap
  const ROLE_COURSE_IDS = ['course_001', 'course_002', 'course_003', 'course_004', 'course_005']
  ROLE_COURSE_IDS.forEach(id => courseIds.add(id))
  return courseIds
})

/* ═══ 课程过滤 ═══ */
const filteredCourses = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  const catId = selectedCategory.value
  return courseStore.courses.filter(c => {
    const catOk = catId === 'all' || c.categoryId === catId
    const kOk = !k || c.title.toLowerCase().includes(k) || c.description.toLowerCase().includes(k)
    return catOk && kOk
  }).sort((a, b) => {
    // 有 role 时：岗位相关课程前置
    const aH = roleCourseIds.value.has(a.id) ? 1 : 0
    const bH = roleCourseIds.value.has(b.id) ? 1 : 0
    return bH - aH
  })
})

const pagedCourses = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredCourses.value.slice(start, start + PAGE_SIZE)
})

/* ═══ 分类列表 ═══ */
const categories = computed<TreemapCategory[]>(() =>
  courseStore.categories.map(c => ({ id: c.id, name: c.name }))
)

/* ═══ 学习进度 ═══ */
function getCourseProgress(courseId: string): number {
  const userId = userStore.currentUser?.id ?? ''
  if (!userId) return 0
  const records = courseStore.getUserProgress(userId, courseId)
  if (!records.length) return 0
  return Math.max(...records.map(r => r.progress ?? 0))
}

function toggleFavorite(courseId: string, e: Event) {
  e.stopPropagation()
  const isFav = courseStore.isCourseFavorite(courseId)
  courseStore.toggleFavorite(courseId)
  ElMessage({ message: isFav ? '已取消收藏' : '已添加收藏', type: 'success', duration: 1500 })
}

function viewCourse(course: Course) {
  router.push(`/app/student/course/${course.id}`)
}

function viewCourseById(id: string) {
  router.push(`/app/student/course/${id}`)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

/* ═══ D3 Treemap 数据 ═══ */
const treemapCategories = computed<TreemapCategory[]>(() => categories.value)

const treemapCourses = computed<TreemapCourse[]>(() =>
  courseStore.courses.map(c => ({
    id: c.id,
    title: c.title,
    categoryId: c.categoryId,
    totalDuration: c.totalDuration || 1,
    isHighlighted: roleCourseIds.value.has(c.id),
  }))
)

/* ═══ D3 弦图数据 ═══ */
interface ChordLink { source: string; target: string; value: number }

const chordData = computed<ChordLink[]>(() => {
  if (!graphData.value) return []
  const { courseNodes, edges } = graphData.value

  // 建立 skillId → CourseGroup 映射
  const skillToGroup = new Map<string, string>()
  for (const cn of courseNodes) {
    for (const sid of cn.relatedSkillIds) {
      skillToGroup.set(sid, COURSE_GROUP_LABELS[cn.group])
    }
  }

  // 统计每条边连接的课程组对
  const linkCounts = new Map<string, number>()
  for (const edge of edges) {
    const sg = skillToGroup.get(edge.source)
    const tg = skillToGroup.get(edge.target)
    if (sg && tg && sg !== tg) {
      const key = [sg, tg].sort().join('||')
      linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1)
    }
  }

  return [...linkCounts.entries()]
    .filter(([, v]) => v > 0)
    .map(([key, value]) => {
      const parts = key.split('||')
      return { source: parts[0]!, target: parts[1]!, value }
    })
})
</script>
<template>
  <div class="lc-page">
    <!-- ═══ 页头 ═══ -->
    <header class="lc-header">
      <div class="lc-header__left">
        <span class="lc-badge">学</span>
        <div class="lc-header__titles">
          <h1 class="lc-title">学习中心</h1>
          <p class="lc-subtitle">课程发现 · 技能成长</p>
        </div>
        <div v-if="fromRole" class="lc-role-chip">
          <Icon icon="lucide:briefcase" :width="12" />
          <span>{{ fromRole }}</span>
          <button class="lc-role-chip__close" @click="clearRole" title="清除方向">
            <Icon icon="lucide:x" :width="10" />
          </button>
        </div>
      </div>
      <div class="lc-header__right">
        <span class="lc-count">共 {{ filteredCourses.length }} 门课程</span>
        <div class="lc-search-wrap">
          <Icon icon="lucide:search" :width="13" class="lc-search-icon" />
          <input
            v-model="keyword"
            class="lc-search"
            placeholder="搜索课程名称..."
            @input="page = 1"
          />
        </div>
        <button v-if="fromRole" class="lc-back-btn" @click="goBackToGraph">
          <Icon icon="lucide:map" :width="13" />
          <span>返回图谱</span>
        </button>
        <button class="lc-back-btn lc-back-btn--secondary" @click="router.push({ name: 'course-system' })">
          <Icon icon="lucide:layers" :width="13" />
          <span>课程体系图谱</span>
        </button>
      </div>
    </header>

    <!-- ═══ 分类筛选栏 ═══ -->
    <nav class="lc-filters">
      <button
        class="lc-filter-btn"
        :class="{ 'lc-filter-btn--active': selectedCategory === 'all' }"
        @click="selectCategory('all')"
      >全部</button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="lc-filter-btn"
        :class="{ 'lc-filter-btn--active': selectedCategory === cat.id }"
        @click="selectCategory(cat.id)"
      >{{ cat.name }}</button>
    </nav>

    <!-- ═══ D3 可视化区 ═══ -->
    <section class="lc-viz card-base">
      <div class="lc-viz__treemap">
        <div class="lc-viz__panel-head">
          <span class="lc-viz__panel-title">课程结构分布</span>
          <span class="lc-viz__panel-desc">面积 = 课程总时长，点击分类可筛选</span>
        </div>
        <div class="lc-viz__chart-wrap lc-viz__chart-wrap--treemap">
          <D3Treemap
            :categories="treemapCategories"
            :courses="treemapCourses"
            @select-category="selectCategory"
            @select-course="viewCourseById($event)"
          />
        </div>
      </div>
      <div class="lc-viz__chord">
        <div class="lc-viz__panel-head">
          <span class="lc-viz__panel-title">课程体系关联</span>
          <span class="lc-viz__panel-desc">
            {{ fromRole ? fromRole + ' 岗位课程体系关联结构' : '技能层级课程关联结构' }}
          </span>
        </div>
        <div class="lc-viz__chart-wrap lc-viz__chart-wrap--chord">
          <D3ChordDiagram :data="chordData" />
        </div>
      </div>
    </section>

    <!-- ═══ 课程 Grid ═══ -->
    <section class="lc-courses">
      <div v-if="fromRole" class="lc-role-banner">
        <Icon icon="lucide:zap" :width="14" />
        <span>已为岗位「{{ fromRole }}」推荐相关课程，金色边框为推荐课程</span>
      </div>

      <div v-if="filteredCourses.length === 0" class="lc-empty">
        <Icon icon="lucide:inbox" :width="32" />
        <p>暂无课程</p>
        <button class="lc-link-btn" @click="keyword = ''; selectCategory('all')">清除筛选</button>
      </div>

      <div v-else class="lc-grid">
        <div
          v-for="course in pagedCourses"
          :key="course.id"
          class="lc-card card-base is-interactive"
          :class="{ 'lc-card--highlighted': roleCourseIds.has(course.id) }"
          @click="viewCourse(course)"
        >
          <div class="lc-card__img-wrap">
            <img :src="course.cover" :alt="course.title" class="lc-card__img" loading="lazy" />
            <div class="lc-card__overlay">
              <span class="lc-card__start-btn">
                {{ getCourseProgress(course.id) > 0 ? '继续学习' : '开始学习' }}
              </span>
            </div>
            <button
              class="lc-card__fav"
              :class="{ 'lc-card__fav--active': courseStore.isCourseFavorite(course.id) }"
              @click="toggleFavorite(course.id, $event)"
            >
              <Icon icon="lucide:star" :width="13" />
            </button>
            <span v-if="getCourseProgress(course.id) > 0" class="lc-card__progress-badge">
              {{ getCourseProgress(course.id) }}%
            </span>
            <span v-if="roleCourseIds.has(course.id)" class="lc-card__rec-badge">推荐</span>
          </div>

          <div class="lc-card__body">
            <div class="lc-card__cat-row">
              <span class="lc-card__cat">{{ courseStore.categories.find(c => c.id === course.categoryId)?.name ?? course.categoryId }}</span>
              <span class="lc-card__rating" v-if="course.rating > 0">★ {{ course.rating.toFixed(1) }}</span>
            </div>
            <h3 class="lc-card__title">{{ course.title }}</h3>
            <p class="lc-card__desc">{{ course.description }}</p>
            <div class="lc-card__meta">
              <span class="lc-card__meta-item">
                <Icon icon="lucide:user" :width="11" />
                {{ course.teacherName }}
              </span>
              <span class="lc-card__meta-item">
                <Icon icon="lucide:clock" :width="11" />
                {{ formatDuration(course.totalDuration) }}
              </span>
              <span class="lc-card__meta-item">
                <Icon icon="lucide:book-open" :width="11" />
                {{ course.chapters?.length ?? 0 }} 章
              </span>
            </div>
            <div v-if="getCourseProgress(course.id) > 0" class="lc-card__progress-bar">
              <div
                class="lc-card__progress-fill"
                :style="{
                  width: getCourseProgress(course.id) + '%',
                  background: getCourseProgress(course.id) >= 100 ? 'var(--bamboo-green, #4A6741)' : 'var(--color-primary)'
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="filteredCourses.length > PAGE_SIZE"
        v-model:current-page="page"
        :page-size="PAGE_SIZE"
        :total="filteredCourses.length"
        layout="prev, pager, next"
        background
        class="lc-pagination"
      />
    </section>
  </div>
</template>

<style scoped>
/* ═══ 根容器 ═══ */
.lc-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  min-height: 100%;
  background: var(--color-background);
}

/* ═══ 页头 ═══ */
.lc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 18px;
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: var(--radius-md, 10px);
}

.lc-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.lc-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.lc-badge {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-gold));
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-sm, 6px);
  flex-shrink: 0;
}

.lc-header__titles { display: flex; flex-direction: column; gap: 1px; }
.lc-title { font-size: 16px; font-weight: 600; color: var(--color-text, #1a1a1a); margin: 0; }
.lc-subtitle { font-size: 11px; color: var(--color-text-muted, #718096); margin: 0; }

.lc-role-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px 4px 10px;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent 92%);
  border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent 75%);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary-dark);
}

.lc-role-chip__close {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 15%, transparent 85%);
  border: none;
  cursor: pointer;
  color: var(--color-primary-dark);
  padding: 0;
}

.lc-count {
  font-size: 12px;
  color: var(--color-text-muted, #718096);
  white-space: nowrap;
}

.lc-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.lc-search-icon {
  position: absolute;
  left: 8px;
  color: var(--color-text-subtle, #a0aec0);
  pointer-events: none;
}

.lc-search {
  padding: 6px 10px 6px 28px;
  font-size: 12px;
  width: 180px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  background: var(--color-surface, #f8fafc);
  color: var(--color-text, #1a1a1a);
  outline: none;
  transition: border-color 0.3s;
}

.lc-search:focus {
  border-color: var(--color-primary, #4f46e5);
}

.lc-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: all 0.3s;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent 92%);
  border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent 75%);
  color: var(--color-primary-dark);
  font-weight: 500;
}

.lc-back-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent 85%);
}

.lc-back-btn--secondary {
  background: var(--color-surface, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text-muted, #718096);
}

.lc-back-btn--secondary:hover {
  border-color: var(--color-primary, #4f46e5);
  color: var(--color-primary, #4f46e5);
  background: var(--color-primary-light, #ede9fe);
}

/* ═══ 分类筛选栏 ═══ */
.lc-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: var(--radius-md, 10px);
}

.lc-filter-btn {
  padding: 5px 12px;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--color-border, #e2e8f0);
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-muted, #718096);
  transition: all 0.3s;
}

.lc-filter-btn:hover {
  border-color: var(--color-primary-dark);
  color: var(--color-primary-dark);
}

.lc-filter-btn--active {
  border-color: var(--color-primary-dark);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent 92%);
  color: var(--color-primary-dark);
  font-weight: 600;
}

/* ═══ D3 可视化区 ═══ */
.lc-viz {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 0;
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
}

.lc-viz__treemap {
  padding: 14px 16px;
  border-right: 1px solid var(--card-border, #e2e8f0);
}

.lc-viz__chord {
  padding: 14px 16px;
}

.lc-viz__panel-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
}

.lc-viz__panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #1a1a1a);
}

.lc-viz__panel-desc {
  font-size: 11px;
  color: var(--color-text-subtle, #a0aec0);
}

.lc-viz__chart-wrap {
  width: 100%;
}

.lc-viz__chart-wrap--treemap {
  height: 280px;
}

.lc-viz__chart-wrap--chord {
  height: 280px;
}

/* ═══ 课程网格 ═══ */
.lc-courses {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lc-role-banner {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  background: rgba(184,134,11,0.08);
  border: 1px solid rgba(184,134,11,0.25);
  border-radius: var(--radius-sm, 6px);
  font-size: 12px;
  color: #7A5C0A;
}

.lc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 20px;
  color: var(--color-text-subtle, #a0aec0);
  font-size: 13px;
}

.lc-link-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-primary, #4f46e5);
  font-size: 12px;
  text-decoration: underline;
}

.lc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

/* ═══ 课程卡片 ═══ */
.lc-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);
  transition: transform 0.3s, box-shadow 0.3s;
}

.lc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.10);
}

.lc-card--highlighted {
  border: 2px solid var(--color-gold) !important;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-gold) 30%, transparent 70%);
}

.lc-card__img-wrap {
  position: relative;
  overflow: hidden;
  height: 140px;
  flex-shrink: 0;
}

.lc-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}

.lc-card:hover .lc-card__img {
  transform: scale(1.04);
}

.lc-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.lc-card:hover .lc-card__overlay {
  opacity: 1;
}

.lc-card__start-btn {
  padding: 7px 18px;
  background: rgba(255,255,255,0.95);
  color: var(--color-primary-dark);
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
}

.lc-card__fav {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: var(--color-text-subtle, #a0aec0);
  transition: color 0.3s, background 0.3s;
}

.lc-card__fav--active {
  color: var(--color-gold);
  background: color-mix(in srgb, var(--color-gold) 15%, transparent 85%);
}

.lc-card__progress-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 2px 7px;
  background: rgba(0,0,0,0.72);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
}

.lc-card__rec-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 7px;
  background: var(--color-gold);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
}

.lc-card__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.lc-card__cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lc-card__cat {
  font-size: 10px;
  color: var(--color-primary, #4f46e5);
  font-weight: 600;
  background: var(--color-primary-light, #ede9fe);
  padding: 2px 7px;
  border-radius: 999px;
}

.lc-card__rating {
  font-size: 11px;
  color: var(--color-gold);
  font-weight: 600;
}

.lc-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #1a1a1a);
  margin: 0;
  line-height: 1.3;
}

.lc-card__desc {
  font-size: 11px;
  color: var(--color-text-muted, #718096);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lc-card__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.lc-card__meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--color-text-subtle, #a0aec0);
}

.lc-card__progress-bar {
  height: 3px;
  background: var(--color-border, #e2e8f0);
  border-radius: 999px;
  overflow: hidden;
  margin-top: auto;
}

.lc-card__progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* ═══ 分页 ═══ */
.lc-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

/* ═══ 响应式 ═══ */
@media (max-width: 768px) {
  .lc-viz {
    grid-template-columns: 1fr;
  }
  .lc-viz__treemap {
    border-right: none;
    border-bottom: 1px solid var(--card-border, #e2e8f0);
  }
  .lc-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  .lc-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .lc-header__right {
    width: 100%;
  }
  .lc-search {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .lc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
