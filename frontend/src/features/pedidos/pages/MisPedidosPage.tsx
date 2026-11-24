import { useState } from 'react'
import { Link } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { FormError } from '../../../shared/components/FormError'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Modal } from '../../../shared/ui/Modal'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import { DetallePedido } from '../components/DetallePedido'
import { useCancelarPedido, usePedidos } from '../hooks/usePedidos'
import type { Pedido } from '../types/pedido'

const POR_PAGINA = 10

export function MisPedidosPage() {
  const [pagina, setPagina] = useState(0)
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pedidos = usePedidos({ skip: pagina * POR_PAGINA, limit: POR_PAGINA })
  const cancelar = useCancelarPedido()

  const confirmarCancelacion = async () => {
    if (!aCancelar) return
    setError(null)
    try {
      const actualizado = await cancelar.mutateAsync(aCancelar.id)
      if (seleccionado?.id === actualizado.id) setSeleccionado(actualizado)
      setACancelar(null)
    } catch (err) {
      setError(handleApiError(err, 'No se pudo cancelar el pedido'))
    }
  }

  const totalPaginas = Math.ceil((pedidos.data?.total ?? 0) / POR_PAGINA)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mis pedidos</h1>

      {pedidos.isPending ? (
        <SkeletonFilas filas={4} />
      ) : pedidos.isError ? (
        <EstadoError mensaje={handleApiError(pedidos.error)} onReintentar={() => void pedidos.refetch()} />
      ) : pedidos.data.items.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hiciste pedidos"
          accion={
            <Link to="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Ir al catálogo
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {pedidos.data.items.map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-32">
                  <p className="font-semibold">Pedido #{p.id}</p>
                  <p className="text-xs text-stone-500">{formatFecha(p.created_at)}</p>
                </div>
                <BadgeEstado estado={p.estado} />
                <p className="flex-1 text-sm text-stone-500">
                  {p.items.length} producto{p.items.length === 1 ? '' : 's'}
                </p>
                <p className="font-bold">{formatPrecio(p.total)}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSeleccionado(p)}>
                    Ver detalle
                  </Button>
                  {p.estado === 'PENDIENTE' && (
                    <Button variant="danger" size="sm" onClick={() => setACancelar(p)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}

      <Modal
        open={seleccionado !== null}
        title={seleccionado ? `Pedido #${seleccionado.id}` : ''}
        onClose={() => setSeleccionado(null)}
        size="lg"
      >
        {seleccionado && (
          <div className="flex flex-col gap-4">
            <DetallePedido pedido={seleccionado} />
            {seleccionado.estado === 'PENDIENTE' && (
              <Button variant="danger" onClick={() => setACancelar(seleccionado)}>
                Cancelar pedido
              </Button>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={aCancelar !== null}
        title="Cancelar pedido"
        onClose={() => {
          setACancelar(null)
          setError(null)
        }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            ¿Seguro que querés cancelar el pedido <strong>#{aCancelar?.id}</strong>? Esta acción no se puede deshacer.
          </p>
          <FormError mensaje={error} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setACancelar(null)}>
              Volver
            </Button>
            <Button variant="danger" loading={cancelar.isPending} onClick={() => void confirmarCancelacion()}>
              Sí, cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
