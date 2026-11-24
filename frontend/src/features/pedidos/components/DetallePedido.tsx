import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import type { Pedido } from '../types/pedido'

const ETIQUETA_PAGO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' } as const

/** Detalle de un pedido con sus líneas (copias inmutables de nombre y precio). */
export function DetallePedido({ pedido }: { pedido: Pedido }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-stone-500">Estado</p>
          <BadgeEstado estado={pedido.estado} />
        </div>
        <div>
          <p className="text-xs text-stone-500">Fecha</p>
          <p>{formatFecha(pedido.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Forma de pago</p>
          <p>{ETIQUETA_PAGO[pedido.forma_pago]}</p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Última actualización</p>
          <p>{formatFecha(pedido.updated_at)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-stone-500">Dirección de entrega</p>
          <p>{pedido.direccion_entrega}</p>
        </div>
        {pedido.notas && (
          <div className="col-span-2">
            <p className="text-xs text-stone-500">Notas</p>
            <p>{pedido.notas}</p>
          </div>
        )}
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
            <th className="py-2 font-medium">Producto</th>
            <th className="py-2 text-right font-medium">Precio</th>
            <th className="py-2 text-right font-medium">Cant.</th>
            <th className="py-2 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {pedido.items.map((item) => (
            <tr key={item.producto_id} className="border-b border-stone-100">
              <td className="py-2">{item.nombre_producto}</td>
              <td className="py-2 text-right">{formatPrecio(item.precio_unitario)}</td>
              <td className="py-2 text-right">{item.cantidad}</td>
              <td className="py-2 text-right">{formatPrecio(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-3 text-right font-semibold">
              Total
            </td>
            <td className="pt-3 text-right text-base font-bold">{formatPrecio(pedido.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
