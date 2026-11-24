import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cambiarEstadoPedido,
  cancelarPedido,
  crearPedido,
  getPedidos,
  getResumenPedidos,
} from '../api/pedidos'
import type { EstadoPedido, PedidoCreate, PedidoFiltros } from '../types/pedido'

export const pedidosKey = ['pedidos'] as const
export const resumenPedidosKey = ['resumen-pedidos'] as const

export function usePedidos(filtros: PedidoFiltros) {
  return useQuery({
    queryKey: [...pedidosKey, filtros],
    queryFn: () => getPedidos(filtros),
    placeholderData: keepPreviousData,
  })
}

export function useResumenPedidos() {
  return useQuery({ queryKey: resumenPedidosKey, queryFn: getResumenPedidos })
}

/** Un cambio en un pedido afecta listados, resumen y stock de productos. */
function useInvalidarTrasPedido() {
  const qc = useQueryClient()
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: pedidosKey }),
      qc.invalidateQueries({ queryKey: resumenPedidosKey }),
      qc.invalidateQueries({ queryKey: ['productos'] }),
    ])
  }
}

export function useCrearPedido() {
  const invalidar = useInvalidarTrasPedido()
  return useMutation({
    mutationFn: (payload: PedidoCreate) => crearPedido(payload),
    onSuccess: invalidar,
  })
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarTrasPedido()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstadoPedido(id, estado),
    onSuccess: invalidar,
  })
}

export function useCancelarPedido() {
  const invalidar = useInvalidarTrasPedido()
  return useMutation({
    mutationFn: (id: number) => cancelarPedido(id),
    onSuccess: invalidar,
  })
}
