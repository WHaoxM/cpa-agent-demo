<!-- 页面：课程学习记录；路由：records（student-course-records）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
</script>



<template>
  <section class="course-section">
    <div class="section-title">学习记录</div>
    <div class="section-body">
      <div class="empty-panel">
        <div class="empty-panel__title">暂无记录</div>
        <div class="empty-panel__desc">后续会展示学习轨迹、章节完成情况与学习时长明细。</div>
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
  background: #ffffff;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 26px;
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


