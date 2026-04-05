<!-- 页面：职业探讨；路由：student/discuss（student-discuss）；角色：STUDENT -->
<script setup lang="ts">
</script>



<template>
  <section class="course-section">
    <div class="section-title">职业探讨</div>
    <div class="section-body">
      <div class="empty-panel">
        <div class="empty-panel__title">职业探讨社区</div>
        <div class="empty-panel__desc">分享求职经验、讨论岗位选择、交流行业见解，AI 将参与推荐优质话题。功能即将开放。</div>
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
  color: var(--color-text);
}

.section-body {
  min-height: 480px;
}

.empty-panel {
  height: 480px;
  border-radius: 0;
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  display: grid;
  place-items: center;
  text-align: center;
  padding: 26px;
}

.empty-panel__title {
  font-size: 18px;
  font-weight: 900;
  color: var(--color-text);
}

.empty-panel__desc {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-muted);
  max-width: 46ch;
}
</style>


