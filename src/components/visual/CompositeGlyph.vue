<!-- 组件：复合图形（用于可视化组合展示多个指标/维度） -->
<template>
  <svg
    class="composite-glyph"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`g_${uid}`" x1="6" y1="10" x2="58" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0" :stop-color="primary" />
        <stop offset="0.62" :stop-color="mix" />
        <stop offset="1" :stop-color="accent" />
      </linearGradient>
      <filter :id="`s_${uid}`" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.4" flood-color="rgba(0,0,0,.22)" />
      </filter>
    </defs>

    <path
      d="M10 22 C20 6, 44 6, 54 20 C62 32, 58 50, 44 56 C30 62, 14 56, 10 44 Z"
      :fill="`url(#g_${uid})`"
      opacity="0.92"
      :filter="`url(#s_${uid})`"
    />

    <path
      d="M16 41 C22 32, 32 29, 40 31 C48 33, 52 40, 48 46 C44 52, 30 54, 22 50 C18 48, 15 45, 16 41 Z"
      :stroke="stroke"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.9"
    />

    <circle cx="22" cy="28" r="3" :fill="stroke" opacity="0.9" />
    <circle cx="40" cy="24" r="2.4" :fill="stroke" opacity="0.75" />
    <circle cx="46" cy="36" r="2.8" :fill="stroke" opacity="0.85" />

    <path
      d="M18 36 L28 26 L36 33 L48 18"
      :stroke="stroke" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      opacity="0.85"
    />

    <path
      d="M48 18 L47 24 L53 23"
      :stroke="stroke"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.85"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  primary: string
  accent: string
  stroke?: string
}>()

const uid = Math.random().toString(36).slice(2)

const stroke = computed(() => props.stroke || 'rgba(255,255,255,.92)')

const mix = computed(() => {
  return props.primary
})
</script>

<style scoped>
.composite-glyph {
  width: 48px;
  height: 48px;
  display: block;
}
</style>


