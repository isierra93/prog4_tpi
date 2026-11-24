import { isAxiosError } from 'axios'

interface ValidationIssue {
  loc?: (string | number)[]
  msg?: string
}

/** Convierte el error de la API (campo detail) en un mensaje legible para la pantalla. */
export function handleApiError(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (isAxiosError<{ detail?: unknown }>(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor'
    const detail = error.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      // Errores 422 de validación de FastAPI
      return (detail as ValidationIssue[])
        .map((issue) => {
          const campo = issue.loc?.filter((parte) => parte !== 'body').join('.')
          return campo ? `${campo}: ${issue.msg ?? ''}` : (issue.msg ?? '')
        })
        .join(' · ')
    }
    return fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
