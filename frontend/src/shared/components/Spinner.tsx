export function Spinner({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-stone-500" role="status">
      <span className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-hidden />
      <span className="text-sm">{texto}</span>
    </div>
  )
}
