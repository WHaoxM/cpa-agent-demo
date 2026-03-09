<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
    align?: 'left' | 'center' | 'right'
  }>(),
  {
    text: '此处需要接入后端接口/智能体',
    align: 'left',
  },
)
</script>

<template>
  <div class="integration-hint" :class="`integration-hint--${align}`">{{ text }}</div>
</template>

<style scoped>
.integration-hint {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--text-200);
  opacity: 0.85;
}

.integration-hint--center {
  text-align: center;
}

.integration-hint--right {
  text-align: right;
}
</style>
