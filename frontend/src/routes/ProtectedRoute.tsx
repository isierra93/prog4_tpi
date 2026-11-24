import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { Rol } from '../features/usuarios/types/usuario'
import { Spinner } from '../shared/components/Spinner'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  /** Roles permitidos. Si se omite, alcanza con tener sesión. */
  roles?: Rol[]
}

/**
 * Sin sesión redirige a /login; sin el rol, a /unauthorized.
 * Es solo UX: la protección real está en el backend (require_role).
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const location = useLocation()

  if (cargando) return <Spinner texto="Verificando sesión..." />

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
