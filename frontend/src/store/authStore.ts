import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { getMe, loginRequest, logoutRequest } from '../features/auth/api/auth'
import type { Rol, UserPublic } from '../features/usuarios/types/usuario'
import { registrarSesionInvalida } from '../shared/api/axiosInstance'
import { queryClient } from '../shared/api/queryClient'

/** Datos de la sesión que se guardan en el cliente. Nunca el token: viaja en la cookie HttpOnly. */
export interface UsuarioSesion {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
}

interface AuthState {
  usuario: UsuarioSesion | null
  cargando: boolean
  login: (username: string, password: string) => Promise<UsuarioSesion>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  limpiar: () => void
}

function aSesion(user: UserPublic): UsuarioSesion {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await loginRequest(username, password)
        const usuario = aSesion(await getMe())
        queryClient.clear()
        set({ usuario, cargando: false })
        return usuario
      },

      logout: async () => {
        try {
          await logoutRequest()
        } finally {
          queryClient.clear()
          set({ usuario: null, cargando: false })
        }
      },

      checkSession: async () => {
        set({ cargando: true })
        try {
          const usuario = aSesion(await getMe())
          set({ usuario, cargando: false })
        } catch {
          set({ usuario: null, cargando: false })
        }
      },

      limpiar: () => {
        queryClient.clear()
        set({ usuario: null, cargando: false })
      },
    }),
    {
      name: 'foodstore-auth',
      storage: createJSONStorage(() => localStorage),
      // Solo se persiste el usuario (nombre, email y rol); nunca el token.
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

// Si la API responde 401 o "cuenta desactivada", el interceptor limpia la sesión.
registrarSesionInvalida(() => useAuthStore.getState().limpiar())
