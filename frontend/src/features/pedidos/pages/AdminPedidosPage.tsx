import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError } from '../../../shared/components/EstadoError'
import { FormError } from '../../../shared/components/FormError'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Select } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import { DetallePedido } from '../components/DetallePedido'
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos'
import { ESTADOS_PEDIDO, ETIQUETA_ESTADO, TRANSICIONES, type EstadoPedido, type Pedido } from '../types/pedido'

const POR_PAGINA = 10

const ACCION: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparar',
  ENTREGADO: 'Entregar',
  CANCELADO: 'Cancelar',
}

export function AdminPedidosPage() {
  const [pagina, setPagina] = useState(0)
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined)
  const [detalle, setDetalle] = useState<Pedido | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pedidos = usePedidos({ skip: pagina * POR_PAGINA, limit: POR_PAGINA, estado })
  const cambiarEstado = useCambiarEstadoPedido()

  const aplicar = async (pedido: Pedido, nuevo: EstadoPedido) => {
    setError(null)
    try {
      const actualizado = await cambiarEstado.mutateAsync({ id: pedido.id, estado: nuevo })
      if (detalle?.id === actualizado.id) setDetalle(actualizado)
      setACancelar(null)
    } catch (err) {
      setError(handleApiError(err, 'No se pudo cambiar el estado'))
    }
  }

  const columnas = useMemo<ColumnDef<Pedido>[]>(
    () => [
      { accessorKey: 'id', header: '#', cell: ({ row }) => <span className="font-semibold">#{row.original.id}</span> },
      { accessorKey: 'created_at', header: 'Fecha', cell: ({ row }) => formatFecha(row.original.created_at) },
      { accessorKey: 'usuario_id', header: 'Cliente (ID)' },
      { accessorKey: 'estado', header: 'Estado', cell: ({ row }) => <BadgeEstado estado={row.original.estado} /> },
      { accessorKey: 'forma_pago', header: 'Pago' },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => <span className="font-semibold">{formatPrecio(row.original.total)}</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDetalle(p)}>
                Ver
              </Button>
              {TRANSICIONES[p.estado].map((siguiente) =>
                siguiente === 'CANCELADO' ? (
                  <Button key={siguiente} size="sm" variant="danger" onClick={() => setACancelar(p)}>
                    {ACCION[siguiente]}
                  </Button>
                ) : (
                  <Button
                    key={siguiente}
                    size="sm"
                    loading={cambiarEstado.isPending && cambiarEstado.variables?.id === p.id}
                    onClick={() => void aplicar(p, siguiente)}
                  >
                    {ACCION[siguiente]}
                  </Button>
                ),
              )}
            </div>
          )
        },
      },
    ],
    // Se recalculan al cambiar el estado de la mutación (spinner por fila) o el detalle abierto.
    [cambiarEstado.isPending, cambiarEstado.variables, detalle],
  )

  const totalPaginas = Math.ceil((pedidos.data?.total ?? 0) / POR_PAGINA)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-56">
          <Select
            label="Filtrar por estado"
            value={estado ?? ''}
            onChange={(e) => {
              setEstado(e.target.value ? (e.target.value as EstadoPedido) : undefined)
              setPagina(0)
            }}
          >
            <option value="">Todos</option>
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO[e]}
              </option>
            ))}
          </Select>
        </div>
        {pedidos.data && <p className="pb-2 text-sm text-stone-500">{pedidos.data.total} pedidos</p>}
      </div>

      {!aCancelar && <FormError mensaje={error} />}

      {pedidos.isPending ? (
        <SkeletonFilas />
      ) : pedidos.isError ? (
        <EstadoError mensaje={handleApiError(pedidos.error)} onReintentar={() => void pedidos.refetch()} />
      ) : (
        <>
          <DataTable
            data={pedidos.data.items}
            columns={columnas}
            getRowId={(p) => String(p.id)}
            vacio="No hay pedidos con ese filtro"
          />
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}

      <Modal
        open={detalle !== null}
        title={detalle ? `Pedido #${detalle.id} · cliente ${detalle.usuario_id}` : ''}
        onClose={() => setDetalle(null)}
        size="lg"
      >
        {detalle && <DetallePedido pedido={detalle} />}
      </Modal>

      <ConfirmModal
        open={aCancelar !== null}
        titulo="Cancelar pedido"
        confirmarTexto="Sí, cancelar"
        cargando={cambiarEstado.isPending}
        error={error}
        onConfirmar={() => {
          if (aCancelar) void aplicar(aCancelar, 'CANCELADO')
        }}
        onCerrar={() => {
          setACancelar(null)
          setError(null)
        }}
      >
        ¿Cancelar el pedido <strong>#{aCancelar?.id}</strong>? Se restituirá el stock de sus productos.
      </ConfirmModal>
    </div>
  )
}
