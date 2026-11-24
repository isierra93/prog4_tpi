import { Button } from '../ui/Button'

interface PaginacionProps {
  /** Página actual, empezando en 0. */
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
}

export function Paginacion({ pagina, totalPaginas, onCambiar }: PaginacionProps) {
  if (totalPaginas <= 1) return null
  return (
    <nav className="flex items-center justify-center gap-3 py-4" aria-label="Paginación">
      <Button variant="secondary" size="sm" disabled={pagina === 0} onClick={() => onCambiar(pagina - 1)}>
        &larr; Anterior
      </Button>
      <span className="text-sm text-stone-600">
        Página {pagina + 1} de {totalPaginas}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={pagina >= totalPaginas - 1}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente &rarr;
      </Button>
    </nav>
  )
}
