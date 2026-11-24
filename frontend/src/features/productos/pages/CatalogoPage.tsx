import { useState, type FormEvent } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { Skeleton } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { Input, Select } from '../../../shared/ui/Input'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoCard } from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'

const POR_PAGINA = 8

export function CatalogoPage() {
  const [pagina, setPagina] = useState(0)
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)

  const categorias = useCategorias()
  const productos = useProductos({
    skip: pagina * POR_PAGINA,
    limit: POR_PAGINA,
    search: busqueda || undefined,
    categoria_id: categoriaId,
  })

  const totalPaginas = Math.ceil((productos.data?.total ?? 0) / POR_PAGINA)
  const hayFiltros = Boolean(busqueda) || categoriaId !== undefined

  const buscar = (e: FormEvent) => {
    e.preventDefault()
    setBusqueda(texto.trim())
    setPagina(0)
  }

  const limpiar = () => {
    setTexto('')
    setBusqueda('')
    setCategoriaId(undefined)
    setPagina(0)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-sm text-stone-500">Elegí tus productos y armá tu pedido.</p>
      </div>

      <form onSubmit={buscar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Buscar"
            placeholder="Buscar por nombre..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <Select
            label="Categoría"
            value={categoriaId ?? ''}
            onChange={(e) => {
              setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
              setPagina(0)
            }}
          >
            <option value="">Todas</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit">Buscar</Button>
        {hayFiltros && (
          <Button variant="ghost" onClick={limpiar}>
            Limpiar
          </Button>
        )}
      </form>

      {productos.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Cargando productos">
          {Array.from({ length: POR_PAGINA }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : productos.isError ? (
        <EstadoError mensaje={handleApiError(productos.error)} onReintentar={() => void productos.refetch()} />
      ) : productos.data.items.length === 0 ? (
        <EstadoVacio
          titulo="No encontramos productos"
          mensaje={hayFiltros ? 'Probá con otra búsqueda o categoría.' : 'Todavía no hay productos cargados.'}
          accion={
            hayFiltros ? (
              <Button variant="secondary" onClick={limpiar}>
                Ver todos
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-stone-500">
            {productos.data.total} producto{productos.data.total === 1 ? '' : 's'}
          </p>
          <div
            className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${productos.isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {productos.data.items.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}
    </div>
  )
}
