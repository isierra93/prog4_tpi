import axios, { AxiosError } from 'axios'

export const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

/** Instancia única de Axios. La cookie HttpOnly viaja sola gracias a withCredentials. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

// El authStore registra aquí qué hacer cuando la sesión deja de ser válida.
// Se usa un registro en vez de importar el store para evitar una dependencia circular.
let onSesionInvalida: (() => void) | null = null

export function registrarSesionInvalida(handler: () => void): void {
  onSesionInvalida = handler
}

const RUTAS_SIN_INTERCEPTAR = ['/auth/token', '/auth/me']

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const detail = error.response?.data?.detail

    const sesionVencida = status === 401 && !RUTAS_SIN_INTERCEPTAR.some((ruta) => url.includes(ruta))
    const cuentaDesactivada = status === 400 && detail === CUENTA_DESACTIVADA

    if (sesionVencida || cuentaDesactivada) {
      // Limpia el authStore; ProtectedRoute redirige a /login al quedar sin usuario.
      onSesionInvalida?.()
    }
    return Promise.reject(error)
  },
)
