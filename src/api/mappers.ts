import type { ReportRecord, SavedJob, TargetRole, TargetRoleMarket } from '@/types'

type Dict = Record<string, unknown>

function asRecord(v: unknown): Dict {
  return v && typeof v === 'object' ? (v as Dict) : {}
}

function asString(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v)
}

function asNumber(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      /* ignore */
    }
    return v ? [v] : []
  }
  return []
}

/** Backend saved-jobs row → FE SavedJob */
export function mapSavedJob(row: unknown): SavedJob {
  const r = asRecord(row)
  return {
    id: asString(r.job_id ?? r.id),
    jobTitle: asString(r.job_title ?? r.jobTitle),
    company: asString(r.company),
    industry: asString(r.industry),
    salary: asString(r.salary),
    location: asString(r.location),
    matchScore: asNumber(r.match_score ?? r.matchScore),
    requiredSkills: asStringArray(r.required_skills ?? r.requiredSkills),
    savedAt: asString(r.saved_at ?? r.savedAt).slice(0, 10),
    notes: r.notes == null ? undefined : asString(r.notes),
    role: r.role == null ? undefined : asString(r.role),
  }
}

export function toSavedJobBody(job: SavedJob, userId: string): Record<string, unknown> {
  return {
    job_id: job.id,
    user_id: userId,
    job_title: job.jobTitle,
    company: job.company,
    industry: job.industry,
    salary: job.salary,
    location: job.location,
    match_score: job.matchScore,
    required_skills: job.requiredSkills,
    notes: job.notes,
  }
}

/** Backend target-roles row → FE TargetRole */
export function mapTargetRole(row: unknown): TargetRole {
  const r = asRecord(row)
  return {
    role: asString(r.role_name ?? r.role),
    savedAt: asString(r.created_at ?? r.savedAt).slice(0, 10) || new Date().toISOString().slice(0, 10),
  }
}

export function mapTargetRoleMarket(row: unknown, fallbackRole: string): TargetRoleMarket | null {
  if (row == null) return null
  const r = asRecord(row)
  return {
    role: asString(r.role ?? r.role_name, fallbackRole),
    salaryRange: asString(r.salaryRange ?? r.salary_range, '—'),
    medianSalary: asNumber(r.medianSalary ?? r.median_salary),
    demandLevel: asString(r.demandLevel ?? r.demand_level, '暂无数据'),
    hotCities: asStringArray(r.hotCities ?? r.hot_cities),
    industries: asStringArray(r.industries),
    skillTags: asStringArray(r.skillTags ?? r.skill_tags),
    sampleJobs: asStringArray(r.sampleJobs ?? r.sample_jobs),
    trendNote: asString(r.trendNote ?? r.trend_note),
    referenceMatch: asNumber(r.referenceMatch ?? r.reference_match ?? r.demandCount ?? r.demand_count),
  }
}

/** Merge sparse API market into a full FE card (fill empty arrays/notes from fallback). */
export function mergeTargetRoleMarket(
  primary: TargetRoleMarket | null,
  fallback: TargetRoleMarket,
): TargetRoleMarket {
  if (!primary) return fallback
  return {
    role: primary.role || fallback.role,
    salaryRange: primary.salaryRange && primary.salaryRange !== '—' ? primary.salaryRange : fallback.salaryRange,
    medianSalary: primary.medianSalary || fallback.medianSalary,
    demandLevel:
      primary.demandLevel && primary.demandLevel !== '暂无数据'
        ? primary.demandLevel
        : fallback.demandLevel,
    hotCities: primary.hotCities.length ? primary.hotCities : fallback.hotCities,
    industries: primary.industries.length ? primary.industries : fallback.industries,
    skillTags: primary.skillTags.length ? primary.skillTags : fallback.skillTags,
    sampleJobs: primary.sampleJobs.length ? primary.sampleJobs : fallback.sampleJobs,
    trendNote: primary.trendNote || fallback.trendNote,
    referenceMatch: primary.referenceMatch || fallback.referenceMatch,
  }
}

/** Backend report list/detail → FE ReportRecord */
export function mapReportRecord(row: unknown): ReportRecord {
  const r = asRecord(row)
  const id = asString(r.report_id ?? r.id)
  const created = asString(r.created_at ?? r.createdAt)
  const typeRaw = asString(r.type, 'career')
  const type: ReportRecord['type'] = typeRaw === 'portrait' ? 'portrait' : 'career'
  const snapshot =
    r.report_json && typeof r.report_json === 'object'
      ? (r.report_json as Record<string, unknown>)
      : r.snapshot && typeof r.snapshot === 'object'
        ? (r.snapshot as Record<string, unknown>)
        : {
            chapters: r.chapters ?? undefined,
            job_portrait_id: r.job_portrait_id,
            status: r.status,
            student_name: r.student_name,
          }
  return {
    id,
    type,
    createdAt: created.slice(0, 10) || created,
    title: asString(r.title, id),
    snapshot,
  }
}
