import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createProducto, deleteProducto, getProductos, updateProducto, updateStock } from '../api/productos'
import type { ProductoCreate, ProductoFiltros, ProductoStockUpdate, ProductoUpdate } from '../types/producto'

export const productosKey = ['productos'] as const

export function useProductos(filtros: ProductoFiltros) {
  return useQuery({
    queryKey: [...productosKey, filtros],
    queryFn: () => getProductos(filtros),
    // Mantiene la página anterior visible mientras llega la siguiente.
    placeholderData: keepPreviousData,
  })
}

function useInvalidarProductos() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: productosKey })
}

export function useCrearProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: (payload: ProductoCreate) => createProducto(payload),
    onSuccess: invalidar,
  })
}

export function useActualizarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductoUpdate }) => updateProducto(id, payload),
    onSuccess: invalidar,
  })
}

export function useActualizarStock() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductoStockUpdate }) => updateStock(id, payload),
    onSuccess: invalidar,
  })
}

export function useEliminarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: (id: number) => deleteProducto(id),
    onSuccess: invalidar,
  })
}
