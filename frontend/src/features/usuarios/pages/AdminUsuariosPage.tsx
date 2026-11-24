import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError } from '../../../shared/components/EstadoError'
import { FormError } from '../../../shared/components/FormError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { useAuthStore } from '../../../store/authStore'
import { useCambiarEstadoUsuario, useUsuarios } from '../hooks/useUsuarios'
import type { UserPublic } from '../types/usuario'

export function AdminUsuariosPage() {
  const usuarios = useUsuarios()
  const cambiarEstado = useCambiarEstadoUsuario()
  const sesionId = useAuthStore((s) => s.usuario?.id)
  const [filtro, setFiltro] = useState('')
  const [error, setError] = useState<string | null>(null)

  const columnas = useMemo<ColumnDef<UserPublic>[]>(() => {
    const cambiar = async (id: number, activar: boolean) => {
      setError(null)
      try {
        await cambiarEstado.mutateAsync({ id, activar })
      } catch (err) {
        setError(handleApiError(err))
      }
    }

    return [
      { accessorKey: 'username', header: 'Usuario' },
      { accessorKey: 'full_name', header: 'Nombre' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              row.original.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {row.original.role}
          </span>
        ),
      },
      {
        id: 'estado',
        accessorFn: (u) => (u.disabled ? 'Desactivado' : 'Activo'),
        header: 'Estado',
        cell: ({ row }) =>
          row.original.disabled ? (
            <span className="text-sm text-red-600">Desactivado</span>
          ) : (
            <span className="text-sm text-emerald-700">Activo</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original
          const cargando = cambiarEstado.isPending && cambiarEstado.variables?.id === u.id
          if (u.disabled) {
            return (
              <Button size="sm" loading={cargando} onClick={() => void cambiar(u.id, true)}>
                Activar
              </Button>
            )
          }
          // El admin no puede desactivarse a sí mismo: el botón no se muestra en su propia fila.
          if (u.id === sesionId) return <span className="text-xs text-stone-400">Tu cuenta</span>
          return (
            <Button size="sm" variant="danger" loading={cargando} onClick={() => void cambiar(u.id, false)}>
              Desactivar
            </Button>
          )
        },
      },
    ]
  }, [cambiarEstado.isPending, cambiarEstado.variables, sesionId])

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full sm:w-72">
        <Input
          label="Filtrar"
          placeholder="Usuario, nombre o email..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <FormError mensaje={error} />

      {usuarios.isPending ? (
        <SkeletonFilas />
      ) : usuarios.isError ? (
        <EstadoError mensaje={handleApiError(usuarios.error)} onReintentar={() => void usuarios.refetch()} />
      ) : (
        <DataTable
          data={usuarios.data}
          columns={columnas}
          pageSize={10}
          globalFilter={filtro}
          getRowId={(u) => String(u.id)}
          vacio="No hay usuarios"
        />
      )}
    </div>
  )
}
