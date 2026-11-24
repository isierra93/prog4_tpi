import { api } from '../../../shared/api/axiosInstance'
import type { UserCreate, UserPublic } from '../../usuarios/types/usuario'

export async function loginRequest(username: string, password: string): Promise<void> {
  // El login usa el formulario OAuth2 (application/x-www-form-urlencoded).
  const body = new URLSearchParams({ username, password })
  await api.post('/auth/token', body)
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>('/auth/me')
  return data
}

export async function registerRequest(payload: UserCreate): Promise<UserPublic> {
  const { data } = await api.post<UserPublic>('/auth/register', payload)
  return data
}
