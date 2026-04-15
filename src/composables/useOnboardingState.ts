/**
 * 新手引导状态 — 判断各业务步骤是否已完成，用于首页引导卡片
 */
import { computed } from 'vue'
import { useLearningStore } from '@/stores/learning'
import { useResumeStore } from '@/stores/resume'
import { useUserStore } from '@/stores'

export function useOnboardingState() {
  const learningStore = useLearningStore()
  const resumeStore = useResumeStore()
  const userStore = useUserStore()

  const currentUserId = computed(() => userStore.currentUser?.id ?? '')

  const hasExplored = computed(() => learningStore.targetRoles.length > 0)

  const hasQuizRecords = computed(() => {
    if (!currentUserId.value) return false
    return learningStore.getUserQuizRecords(currentUserId.value).length > 0
  })

  const hasAssessed = computed(() => resumeStore.isParsed || hasQuizRecords.value)

  const hasStartedLearning = computed(() => {
    if (!currentUserId.value) return false
    return learningStore.learningHistory.some(item => item.userId === currentUserId.value)
  })

  const onboardingDone = computed(() => hasExplored.value && hasAssessed.value)

  return {
    hasExplored,
    hasQuizRecords,
    hasAssessed,
    hasStartedLearning,
    onboardingDone,
  }
}
