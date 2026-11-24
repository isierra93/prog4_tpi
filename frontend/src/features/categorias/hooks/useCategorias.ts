import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createCategoria, deleteCategoria, getCategorias, updateCategoria } from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export const categoriasKey = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: categoriasKey, queryFn: getCategorias })
}

export function useCrearCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoriaCreate) => createCategoria(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriasKey }),
  })
}

export function useActualizarCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoriaUpdate }) => updateCategoria(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: categoriasKey })
      // Los productos incluyen su categoría: también se refrescan.
      await qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useEliminarCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriasKey }),
  })
}
