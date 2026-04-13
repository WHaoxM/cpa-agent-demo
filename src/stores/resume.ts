import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { CareerRole, CareerInsights } from '@/composables/useCareerInsights'

export type ParsedSkill = {
  name: string
  weight: number
  category: string
}

export type ResumeParseResult = {
  rawText: string
  fileName: string
  skills: ParsedSkill[]
  insights: CareerInsights | null
}

export const useResumeStore = defineStore('resume', () => {
  const rawText = ref('')
  const fileName = ref('')
  const parsedSkills = ref<ParsedSkill[]>([])
  const matchedCareers = ref<{ role: CareerRole; score: number }[]>([])
  const insights = ref<CareerInsights | null>(null)
  const isParsed = ref(false)
  const draftText = ref('')
  const evaluatingRole = ref('')

  function setResult(result: ResumeParseResult) {
    rawText.value = result.rawText
    fileName.value = result.fileName
    parsedSkills.value = result.skills
    insights.value = result.insights
    matchedCareers.value = result.insights?.candidates ?? []
    isParsed.value = true
  }

  function reset() {
    rawText.value = ''
    fileName.value = ''
    parsedSkills.value = []
    matchedCareers.value = []
    insights.value = null
    isParsed.value = false
  }

  function setDraftText(text: string) {
    draftText.value = text
  }

  function clearDraftText() {
    draftText.value = ''
  }

  function setEvaluatingRole(role: string) {
    evaluatingRole.value = role
  }

  function clearEvaluatingRole() {
    evaluatingRole.value = ''
  }

  return { rawText, fileName, parsedSkills, matchedCareers, insights, isParsed, draftText, evaluatingRole, setResult, reset, setDraftText, clearDraftText, setEvaluatingRole, clearEvaluatingRole }
},
{
  persist: {
    key: 'resume-store',
    storage: localStorage,
    pick: ['rawText', 'fileName', 'parsedSkills', 'matchedCareers', 'insights', 'isParsed', 'evaluatingRole'],
  },
})
