<!-- 页面：笔记管理；路由：student/notes（student-notes）；角色：STUDENT/TEACHER -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Edit, Star, Document } from '@element-plus/icons-vue'
import { useUserStore, useCourseStore, useLearningStore } from '@/stores'
import type { Note } from '@/types'

const userStore = useUserStore()
const courseStore = useCourseStore()
const learningStore = useLearningStore()

// 编辑器相关
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

const editorRef = ref<any>(null)
const mode = 'default'

// 笔记数据
const notes = computed(() => learningStore.getUserNotes(userStore.currentUser?.id || ''))
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const showEditor = ref(false)
const editingNote = ref<Note | null>(null)
const noteCourseId = ref('')
const noteTitle = ref('')
const noteContent = ref('')
const noteTags = ref<string[]>([])

// 可用标签
const availableTags = computed(() => learningStore.getKnowledgePoints(userStore.currentUser?.id || ''))

const filteredNotes = computed(() => {
  let result = notes.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.content.toLowerCase().includes(query) ||
      n.tags.some(t => t.toLowerCase().includes(query))
    )
  }
  
  if (selectedTags.value.length > 0) {
    result = result.filter(n => 
      selectedTags.value.some(tag => n.tags.includes(tag))
    )
  }
  
  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

const toolbarConfig = {
  toolbarKeys: [
    'bold', 'italic', 'underline', 'through', 'code',
    'color', 'bgColor',
    'fontSize', 'fontFamily',
    'justifyLeft', 'justifyCenter', 'justifyRight',
    'bulletedList', 'numberedList',
    'insertLink', 'insertImage', 'insertVideo',
    'blockquote', 'headerSelect', 'codeBlock',
  ],
}

const editorConfig = {
  placeholder: '请输入笔记内容...',
  MENU_CONF: {},
}

function handleCreated(editor: any) {
  editorRef.value = editor
}

function createNote() {
  editingNote.value = null
  noteCourseId.value = ''
  noteTitle.value = ''
  noteContent.value = ''
  noteTags.value = []
  showEditor.value = true
}

function editNote(note: Note) {
  editingNote.value = note
  noteCourseId.value = note.courseId || ''
  noteTitle.value = note.title
  noteContent.value = note.content
  noteTags.value = [...note.tags]
  showEditor.value = true
}

function onEditorClosed() {
  editingNote.value = null
  noteCourseId.value = ''
  noteTitle.value = ''
  noteContent.value = ''
  noteTags.value = []
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = null
  }
}

function saveNote() {
  if (!noteTitle.value.trim()) {
    ElMessage.warning('请输入笔记标题')
    return
  }
  
  if (editingNote.value) {
    learningStore.updateNote(editingNote.value.id, {
      courseId: noteCourseId.value,
      title: noteTitle.value,
      content: noteContent.value,
      tags: noteTags.value,
    })
    ElMessage.success('笔记更新成功')
  } else {
    learningStore.addNote({
      userId: userStore.currentUser?.id || '',
      courseId: noteCourseId.value,
      title: noteTitle.value,
      content: noteContent.value,
      tags: noteTags.value,
      isFavorite: false,
    })
    ElMessage.success('笔记创建成功')
  }
  
  showEditor.value = false
}

function deleteNote(note: Note) {
  ElMessageBox.confirm('确定要删除这条笔记吗？', '提示', {
    type: 'warning',
  }).then(() => {
    learningStore.deleteNote(note.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function toggleFavorite(note: Note) {
  learningStore.toggleNoteFavorite(note.id)
}

function getCourseName(courseId: string): string {
  const course = courseStore.getCourseById(courseId)
  return course?.title || '未分类'
}

onMounted(() => {
  // 清理编辑器
  return () => {
    if (editorRef.value) {
      editorRef.value.destroy()
    }
  }
})
</script>



<template>
  <div class="notes-page page page--compact">
    <!-- 搜索和工具栏 -->
    <div class="toolbar toolbar-card">
      <div class="search-area">
        <el-input
          v-model="searchQuery"
          placeholder="搜索笔记标题、内容或标签..."
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select
          v-model="selectedTags"
          placeholder="筛选标签"
          multiple
          collapse-tags
          clearable
          class="tag-filter"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </div>
      <el-button type="primary" :icon="Plus" @click="createNote">
        新建笔记
      </el-button>
    </div>

    <!-- 笔记列表 -->
    <div class="notes-content content-card">
      <div v-if="filteredNotes.length > 0" class="notes-list">
        <button
          v-for="note in filteredNotes"
          :key="note.id"
          type="button"
          class="note-row"
          @click="editNote(note)"
        >
          <div class="note-row__main">
            <div class="note-row__title">
              <span v-if="learningStore.isNoteFavorite(note.id)" class="favorite-dot" aria-label="收藏" />
              <span class="note-title">{{ note.title }}</span>
            </div>

            <div class="note-row__meta">
              <span class="note-course">
                <el-icon><Document /></el-icon>
                {{ note.courseId ? getCourseName(note.courseId) : '未分类' }}
              </span>
              <span class="note-date">{{ note.updatedAt }}</span>
            </div>

            <div class="note-preview" v-html="note.content" />

            <div v-if="note.tags.length > 0" class="note-tags">
              <el-tag
                v-for="tag in note.tags.slice(0, 3)"
                :key="tag"
                size="small"
                class="note-tag"
              >
                {{ tag }}
              </el-tag>
              <el-tag v-if="note.tags.length > 3" size="small" class="note-tag note-tag--more">
                +{{ note.tags.length - 3 }}
              </el-tag>
            </div>
          </div>

          <div class="note-row__actions" @click.stop>
            <el-button text :icon="Edit" @click="editNote(note)" />
            <el-button text :icon="Star" @click="toggleFavorite(note)" />
            <el-button text type="danger" :icon="Delete" @click="deleteNote(note)" />
          </div>
        </button>
      </div>
      
      <el-empty v-else description="暂无笔记，点击右上角按钮创建" />
    </div>

    <!-- 笔记编辑器弹窗 -->
    <el-dialog
      v-model="showEditor"
      :title="editingNote ? '编辑笔记' : '新建笔记'"
      width="900px"
      destroy-on-close
      class="note-editor-dialog"
      @closed="onEditorClosed"
    >
      <div class="editor-wrapper">
        <el-select v-model="noteCourseId" placeholder="选择课程（可选）" clearable class="course-select">
          <el-option v-for="c in courseStore.courses" :key="c.id" :label="c.title" :value="c.id" />
        </el-select>

        <el-input
          v-model="noteTitle"
          placeholder="笔记标题"
          class="title-input"
        />
        
        <div class="editor-container">
          <Toolbar
            :editor="editorRef"
            :default-config="toolbarConfig"
            :mode="mode"
            class="editor-toolbar"
          />
          <Editor
            v-model="noteContent"
            :default-config="editorConfig"
            :mode="mode"
            class="editor-content"
            @on-created="handleCreated"
          />
        </div>
        
        <div class="tags-selector">
          <span class="tags-label">标签：</span>
          <el-checkbox-group v-model="noteTags">
            <el-checkbox
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
            >
              {{ tag }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showEditor = false">取消</el-button>
        <el-button type="primary" @click="saveNote">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.notes-page {
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.search-area {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 280px;
}

.tag-filter {
  width: 180px;
}

.notes-content {
  min-height: 400px;
  padding: 12px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.note-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 12px;
  border: none;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  border-top: 1px solid color-mix(in srgb, var(--bg-300) 40%, transparent 60%);
  transition: background var(--transition-fast);
}

.note-row:first-child {
  border-top: none;
}

.note-row:hover {
  background: color-mix(in srgb, var(--primary-100) 10%, #ffffff 90%);
}

.note-row__main {
  flex: 1;
  min-width: 0;
}

.note-row__actions {
  flex-shrink: 0;
  display: flex;
  gap: 2px;
}

.note-row__actions :deep(.el-button) {
  padding: 4px 8px;
}

.note-row__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.favorite-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--accent-200);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-100) 20%, transparent);
  flex-shrink: 0;
}

.note-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-row__meta {
  display: flex;
  justify-content: flex-start;
  gap: 14px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-200);
}

.note-course {
  display: flex;
  align-items: center;
  gap: 4px;
}

.note-preview {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-200);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 8px;
  min-height: 44px;
}

.note-preview :deep(img) {
  max-width: 100%;
  height: auto;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.note-tag {
  margin: 0;
}

.note-tag--more {
  color: var(--text-200);
  background: color-mix(in srgb, var(--bg-100) 88%, #ffffff 12%);
  border-color: color-mix(in srgb, var(--bg-300) 55%, transparent 45%);
}

.editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-select {
  width: 260px;
}

.title-input :deep(.el-input__inner) {
  font-size: 18px;
  font-weight: 600;
}

.editor-container {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  border-bottom: 1px solid var(--el-border-color);
}

.editor-content {
  height: 400px;
  overflow-y: auto;
}

.tags-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tags-label {
  font-size: 14px;
  color: var(--text-200);
  white-space: nowrap;
}
</style>

<style>
.note-editor-dialog .el-dialog__body {
  padding-top: 10px;
}
</style>


