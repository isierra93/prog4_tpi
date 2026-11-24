import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 text-center">
      <span className="text-5xl" aria-hidden>
        🔒
      </span>
      <h1 className="text-2xl font-bold">Sin permiso</h1>
      <p className="text-stone-500">No tenés permisos para acceder a esta sección.</p>
      <Link to="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        Volver al inicio
      </Link>
    </div>
  )
}
