<!-- 页面：课程任务；路由：tasks（student-course-tasks）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>



<template>
  <section class="course-section">
    <div class="section-title">任务</div>
    <div class="section-body">
      <div class="empty-panel">
        <div class="empty-panel__meta">（{{ route.params.id }}）</div>
        <div class="empty-panel__title">暂无任务</div>
        <div class="empty-panel__desc">后续这里会展示由智能体推理出的个性化任务与学习路径。</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.course-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 14px;
  font-weight: 900;
  color: #111827;
}

.section-body {
  min-height: 480px;
}

.empty-panel {
  height: 480px;
  border-radius: 14px;
  border: 1px solid #eef2f7;
  background: radial-gradient(1200px 400px at 20% 0%, rgba(59, 130, 246, 0.09), transparent 55%),
    radial-gradient(900px 320px at 90% 100%, rgba(16, 185, 129, 0.10), transparent 60%),
    #ffffff;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 26px;
}

.empty-panel__meta {
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
  margin-bottom: 10px;
}

.empty-panel__title {
  font-size: 18px;
  font-weight: 950;
  color: #111827;
}

.empty-panel__desc {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
  max-width: 46ch;
}
</style>


