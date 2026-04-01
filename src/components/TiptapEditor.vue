<!-- Tiptap 富文本编辑器封装组件；用于简历中的描述类字段 -->
<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Icon } from '@iconify/vue'

const props = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
  ],
  editorProps: {
    attributes: {
      class: 'tip-content',
      'data-placeholder': props.placeholder ?? '请输入内容…',
    },
  },
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  if (editor.value.getHTML() === val) return
  editor.value.commands.setContent(val)
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="tip-wrap">
    <!-- 工具栏 -->
    <div class="tip-toolbar">
      <button
        class="tip-tool"
        :class="{ 'tip-tool--on': editor?.isActive('bold') }"
        @click.prevent="editor?.chain().focus().toggleBold().run()"
        title="加粗"
      ><Icon icon="lucide:bold" :width="12"/></button>

      <button
        class="tip-tool"
        :class="{ 'tip-tool--on': editor?.isActive('italic') }"
        @click.prevent="editor?.chain().focus().toggleItalic().run()"
        title="斜体"
      ><Icon icon="lucide:italic" :width="12"/></button>

      <button
        class="tip-tool"
        :class="{ 'tip-tool--on': editor?.isActive('underline') }"
        @click.prevent="editor?.chain().focus().toggleUnderline().run()"
        title="下划线"
      ><Icon icon="lucide:underline" :width="12"/></button>

      <div class="tip-sep"/>

      <button
        class="tip-tool"
        :class="{ 'tip-tool--on': editor?.isActive('bulletList') }"
        @click.prevent="editor?.chain().focus().toggleBulletList().run()"
        title="无序列表"
      ><Icon icon="lucide:list" :width="12"/></button>

      <button
        class="tip-tool"
        :class="{ 'tip-tool--on': editor?.isActive('orderedList') }"
        @click.prevent="editor?.chain().focus().toggleOrderedList().run()"
        title="有序列表"
      ><Icon icon="lucide:list-ordered" :width="12"/></button>
    </div>

    <!-- 编辑区 -->
    <EditorContent :editor="editor" class="tip-editor-wrap"/>
  </div>
</template>

<style scoped>
.tip-wrap {
  border: 1px solid rgba(212,201,181,0.15);
  border-radius: 6px;
  overflow: hidden;
  background: rgba(240,230,210,0.04);
}

.tip-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(212,201,181,0.1);
  background: rgba(20,12,4,0.4);
}

.tip-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: none;
  cursor: pointer;
  color: rgba(175,160,135,0.6);
  transition: background 0.15s, color 0.15s;
}
.tip-tool:hover { background: rgba(139,37,0,0.15); color: rgba(210,150,110,0.9); }
.tip-tool--on  { background: rgba(139,37,0,0.25); color: rgba(225,170,130,0.95); }

.tip-sep {
  width: 1px;
  height: 14px;
  background: rgba(212,201,181,0.15);
  margin: 0 4px;
}

.tip-editor-wrap { cursor: text; }
</style>

<style>
/* 非 scoped — 让 Tiptap 生成的内容可以被样式访问 */
.tip-content {
  min-height: 80px;
  padding: 8px 10px;
  font-size: 12px;
  color: rgba(215,200,178,0.9);
  line-height: 1.6;
  outline: none;
}
.tip-content:empty::before {
  content: attr(data-placeholder);
  color: rgba(130,115,90,0.4);
  pointer-events: none;
}
.tip-content p { margin: 0 0 4px; }
.tip-content ul,
.tip-content ol { margin: 0 0 4px; padding-left: 18px; }
.tip-content li { margin-bottom: 2px; }
.tip-content strong { font-weight: 700; }
.tip-content em { font-style: italic; }
.tip-content u  { text-decoration: underline; }
</style>
