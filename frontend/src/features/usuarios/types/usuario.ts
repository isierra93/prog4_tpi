export type Rol = 'user' | 'admin'

/** Espejo de UserPublic del backend. */
export interface UserPublic {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
  disabled: boolean
  created_at: string
}

/** Espejo de UserCreate del backend. */
export interface UserCreate {
  username: string
  full_name: string
  email: string
  password: string
}
