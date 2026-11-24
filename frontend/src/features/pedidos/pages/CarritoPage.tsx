import { Link, useNavigate } from 'react-router-dom'

import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { formatPrecio } from '../../../shared/utils/format'
import { useCartStore } from '../../../store/cartStore'

export function CarritoPage() {
  const items = useCartStore((s) => s.items)
  const quitar = useCartStore((s) => s.quitar)
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const vaciar = useCartStore((s) => s.vaciar)
  const total = useCartStore((s) => s.total())
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu carrito está vacío"
        mensaje="Agregá productos desde el catálogo para armar tu pedido."
        accion={
          <Link to="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Carrito</h1>
          <Button variant="ghost" size="sm" onClick={vaciar}>
            Vaciar carrito
          </Button>
        </div>

        {items.map((item) => (
          <Card key={item.producto_id} className="flex items-center gap-4 p-3">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
              {item.imagen_url ? (
                <img src={item.imagen_url} alt={item.nombre} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-2xl" aria-hidden>
                  🍽️
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.nombre}</p>
              <p className="text-sm text-stone-500">{formatPrecio(item.precio_unitario)} c/u</p>
            </div>

            <div className="flex items-center gap-1" aria-label={`Cantidad de ${item.nombre}`}>
              <Button
                variant="secondary"
                size="sm"
                aria-label="Restar uno"
                disabled={item.cantidad <= 1}
                onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
              >
                &minus;
              </Button>
              <span className="w-8 text-center font-medium">{item.cantidad}</span>
              <Button
                variant="secondary"
                size="sm"
                aria-label="Sumar uno"
                onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
              >
                +
              </Button>
            </div>

            <p className="w-28 text-right font-semibold">{formatPrecio(item.precio_unitario * item.cantidad)}</p>

            <Button variant="ghost" size="sm" aria-label={`Quitar ${item.nombre}`} onClick={() => quitar(item.producto_id)}>
              Quitar
            </Button>
          </Card>
        ))}
      </div>

      <Card className="h-fit p-5">
        <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
        <div className="flex justify-between text-sm text-stone-600">
          <span>Productos</span>
          <span>{items.reduce((acc, i) => acc + i.cantidad, 0)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrecio(total)}</span>
        </div>
        <Button className="mt-5 w-full" onClick={() => navigate('/checkout')}>
          Confirmar pedido
        </Button>
        <p className="mt-2 text-center text-xs text-stone-500">El stock se valida al confirmar.</p>
      </Card>
    </div>
  )
}
