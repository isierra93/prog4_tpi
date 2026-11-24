import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { Skeleton } from '../../../shared/components/Skeleton'
import { formatPrecio } from '../../../shared/utils/format'
import { TarjetaResumen } from '../components/TarjetaResumen'
import { useResumenPedidos } from '../hooks/usePedidos'

export function AdminResumenPage() {
  const resumen = useResumenPedidos()

  if (resumen.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  if (resumen.isError) {
    return <EstadoError mensaje={handleApiError(resumen.error)} onReintentar={() => void resumen.refetch()} />
  }

  const r = resumen.data
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TarjetaResumen
        titulo="Ingresos (entregados)"
        valor={formatPrecio(r.ingresos_entregados)}
        detalle="Suma del total de los pedidos entregados"
        acento="border-l-emerald-500"
      />
      <TarjetaResumen titulo="Pedidos de hoy" valor={r.pedidos_hoy} acento="border-l-brand-500" />
      <TarjetaResumen titulo="Pendientes" valor={r.pendientes} acento="border-l-amber-400" />
      <TarjetaResumen titulo="En preparación" valor={r.en_preparacion} acento="border-l-sky-500" />
      <TarjetaResumen titulo="Entregados" valor={r.entregados} acento="border-l-emerald-500" />
      <TarjetaResumen titulo="Cancelados" valor={r.cancelados} acento="border-l-stone-400" />
    </div>
  )
}
