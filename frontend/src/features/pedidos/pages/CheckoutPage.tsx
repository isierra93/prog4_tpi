import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Card } from '../../../shared/ui/Card'
import { formatPrecio } from '../../../shared/utils/format'
import { useCartStore } from '../../../store/cartStore'
import { CheckoutForm, type CheckoutValues } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/usePedidos'

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const vaciar = useCartStore((s) => s.vaciar)
  const crearPedido = useCrearPedido()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay productos para confirmar"
        mensaje="Tu carrito está vacío."
        accion={
          <Link to="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  const confirmar = async (values: CheckoutValues) => {
    setError(null)
    try {
      await crearPedido.mutateAsync({
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        forma_pago: values.forma_pago,
        direccion_entrega: values.direccion_entrega.trim(),
        notas: values.notas.trim() || null,
      })
      vaciar()
      navigate('/mis-pedidos', { replace: true })
    } catch (err) {
      setError(handleApiError(err, 'No se pudo crear el pedido'))
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Confirmar pedido</h1>
        <p className="mb-6 text-sm text-stone-500">Completá los datos de entrega y pago.</p>
        <CheckoutForm error={error} onConfirmar={confirmar} />
      </Card>

      <Card className="h-fit p-5">
        <h2 className="mb-3 text-lg font-semibold">Tu pedido</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((i) => (
            <li key={i.producto_id} className="flex justify-between gap-2">
              <span>
                {i.cantidad} &times; {i.nombre}
              </span>
              <span className="font-medium">{formatPrecio(i.precio_unitario * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrecio(total)}</span>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          El total final lo calcula el sistema con los precios vigentes al confirmar.
        </p>
      </Card>
    </div>
  )
}
