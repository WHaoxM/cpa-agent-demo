<!-- 页面：页面未找到；路由：/（not-found） -->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>



<template>
  <div class="not-found">
    <div class="error-content">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>
      <el-button type="primary" size="large" @click="router.push('/app/dashboard')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-100);
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: var(--primary-100);
  line-height: 1;
  margin-bottom: 20px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px;
}

.error-desc {
  color: var(--text-200);
  margin: 0 0 24px;
}
</style>


