import { formatPrecio } from '../../../shared/utils/format'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'
import type { Producto } from '../types/producto'

export function ProductoCard({ producto }: { producto: Producto }) {
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0)

  const sinStock = producto.stock <= 0
  const agotadoEnCarrito = enCarrito >= producto.stock
  const vendible = producto.disponible && !sinStock

  let etiqueta = 'Agregar al carrito'
  if (!producto.disponible) etiqueta = 'No disponible'
  else if (sinStock) etiqueta = 'Sin stock'
  else if (agotadoEnCarrito) etiqueta = 'Máximo en el carrito'

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-5xl" aria-hidden>
            🍽️
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-stone-700">
          {producto.categoria.nombre}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-tight">{producto.nombre}</h3>
        {producto.descripcion && <p className="line-clamp-2 text-sm text-stone-500">{producto.descripcion}</p>}

        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-lg font-bold text-brand-700">{formatPrecio(producto.precio_base)}</span>
          <span className={`text-xs ${vendible ? 'text-stone-500' : 'text-red-600'}`}>
            {vendible ? `Stock: ${producto.stock}` : etiqueta}
          </span>
        </div>

        <Button
          disabled={!vendible || agotadoEnCarrito}
          onClick={() =>
            agregar({
              producto_id: producto.id,
              nombre: producto.nombre,
              precio_unitario: producto.precio_base,
              imagen_url: producto.imagen_url,
            })
          }
        >
          {etiqueta}
          {enCarrito > 0 && vendible && !agotadoEnCarrito && (
            <span className="rounded-full bg-white/25 px-1.5 text-xs">{enCarrito}</span>
          )}
        </Button>
      </div>
    </Card>
  )
}
