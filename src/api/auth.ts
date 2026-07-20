import { getApiMode } from './config'
import { mockGet } from './adapters/mockAdapter'
import type { User } from '@/types'
import { UserRole } from '@/types'

type AuthUserRow = {
  id: string
  username: string
  password?: string
  name: string
  email: string
  avatar?: string
  role: string
  createdAt: string
  status: 'active' | 'disabled'
  classId?: string
  phone?: string
}

function mapUser(row: AuthUserRow): User & { password?: string } {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    role: row.role === 'admin' ? UserRole.ADMIN : UserRole.STUDENT,
    createdAt: row.createdAt,
    status: row.status,
    classId: row.classId,
    phone: row.phone,
    password: row.password,
  }
}

/** Demo auth has no backend; always fixture-backed. */
export async function listAuthUsers(): Promise<Array<User & { password?: string }>> {
  void getApiMode()
  const env = await mockGet<AuthUserRow[]>('auth/users.json')
  return (env.data ?? []).map(mapUser)
}

export async function loginLocal(
  username: string,
  password: string,
): Promise<(User & { password?: string }) | null> {
  const users = await listAuthUsers()
  const user = users.find(u => u.username === username)
  if (!user) return null
  if ((user.password ?? '123456') !== password) return null
  const { password: _pw, ...safe } = user
  void _pw
  return safe
}
