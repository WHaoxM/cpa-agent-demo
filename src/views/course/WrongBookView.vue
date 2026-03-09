<!-- 页面：错题本；路由：wrongbook（wrongbook） -->
<script setup lang="ts">
import { computed, ref } from 'vue'

type WrongItem = {
  id: string
  question: string
  reason: string
  knowledge: string
  category: '语法' | '思路' | '细节'
}

const category = ref<'全部' | WrongItem['category']>('全部')

const list = ref<WrongItem[]>([
  {
    id: 'w_01',
    question: 'TypeScript 类型断言和类型声明的区别？',
    reason: '误用 as 断言绕过类型检查，而类型声明(: Type)会强制校验实际值。',
    knowledge: 'TS / 类型系统',
    category: '语法',
  },
  {
    id: 'w_02',
    question: 'CSS 垂直居中为什么推荐 flex 而不是绝对定位？',
    reason: '绝对定位脱离文档流，flex 保持元素在流中且自适应内容高度。',
    knowledge: 'CSS / 布局',
    category: '细节',
  },
  {
    id: 'w_03',
    question: 'Vue3 中 ref 和 reactive 选哪个？',
    reason: 'reactive 对解构/替换对象会丢失响应式，ref 更通用但需要 .value。',
    knowledge: 'Vue3 / 响应式',
    category: '思路',
  },
  {
    id: 'w_04',
    question: 'HTML 语义化标签的 benefit 是什么？',
    reason: '利于 SEO 爬虫解析、屏幕阅读器无障碍访问、代码可读性维护。',
    knowledge: 'HTML / 语义化',
    category: '细节',
  },
])

const filtered = computed(() => {
  return list.value.filter((x) => (category.value === '全部' ? true : x.category === category.value))
})
</script>



<template>
  <div class="page">
    <div class="toolbar ui-card">
      <div>
        <div class="toolbar__title">错题本</div>
      </div>

      <el-radio-group v-model="category" size="large" class="toolbar__radios">
        <el-radio-button label="全部" />
        <el-radio-button label="语法" />
        <el-radio-button label="思路" />
        <el-radio-button label="细节" />
      </el-radio-group>
    </div>

    <div class="grid">
      <el-card v-for="x in filtered" :key="x.id" class="item ui-card" shadow="never">
        <div class="item__top">
          <div class="item__q">{{ x.question }}</div>
          <el-tag round effect="plain">{{ x.category }}</el-tag>
        </div>

        <div class="item__row">
          <div class="item__label">错误原因</div>
          <div class="item__value">{{ x.reason }}</div>
        </div>

        <div class="item__row">
          <div class="item__label">知识点</div>
          <div class="item__value">
            <el-tag size="small" effect="dark" round>{{ x.knowledge }}</el-tag>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.toolbar {
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar__title {
  font-weight: 900;
  font-size: 16px;
  line-height: 1.2;
}

.toolbar__sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-200);
}

.toolbar__radios {
  flex-wrap: wrap;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.item {
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  background: color-mix(in srgb, var(--bg-100) 92%, #ffffff 8%);
}

.item__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.item__q {
  font-weight: 900;
  line-height: 1.35;
}

.item__row {
  margin-top: 10px;
  display: grid;
  gap: 4px;
}

.item__label {
  font-size: 12px;
  color: color-mix(in srgb, var(--text-200) 78%, transparent 22%);
}

.item__value {
  color: var(--text-200);
  line-height: 1.55;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>


