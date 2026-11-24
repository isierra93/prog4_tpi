import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { activarUsuario, desactivarUsuario, getUsuarios } from '../api/usuarios'

export const usuariosKey = ['usuarios'] as const

export function useUsuarios() {
  return useQuery({ queryKey: usuariosKey, queryFn: getUsuarios })
}

export function useCambiarEstadoUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      activar ? activarUsuario(id) : desactivarUsuario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usuariosKey }),
  })
}
