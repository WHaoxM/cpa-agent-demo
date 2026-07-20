import { getPublicBaseUrl } from '../config'
import { ApiError, type ApiEnvelope } from '../types'

/** Relative path under `public/fixtures/`, e.g. `favorites/saved-jobs.list.json` */
export async function mockGet<T = unknown>(fixturePath: string): Promise<ApiEnvelope<T>> {
  const base = getPublicBaseUrl()
  const url = `${base}fixtures/${fixturePath.replace(/^\//, '')}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new ApiError(`Fixture not found: ${fixturePath}`, res.status)
  }
  return (await res.json()) as ApiEnvelope<T>
}

/** Mock writes return a canned ok fixture (no mutation of static JSON). */
export async function mockMutate<T = unknown>(fixturePath: string): Promise<ApiEnvelope<T>> {
  return mockGet<T>(fixturePath)
}
