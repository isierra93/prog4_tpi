import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { CategoriaForm } from '../components/CategoriaForm'
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias'
import type { Categoria, CategoriaCreate } from '../types/categoria'

type Edicion = { modo: 'crear' } | { modo: 'editar'; categoria: Categoria }

export function AdminCategoriasPage() {
  const categorias = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const eliminar = useEliminarCategoria()

  const [filtro, setFiltro] = useState('')
  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cerrar = () => {
    setEdicion(null)
    setAEliminar(null)
    setError(null)
  }

  const guardar = async (values: CategoriaCreate) => {
    setError(null)
    try {
      if (edicion?.modo === 'editar') {
        await actualizar.mutateAsync({ id: edicion.categoria.id, payload: values })
      } else {
        await crear.mutateAsync(values)
      }
      cerrar()
    } catch (err) {
      setError(handleApiError(err))
    }
  }

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    try {
      await eliminar.mutateAsync(aEliminar.id)
      cerrar()
    } catch (err) {
      setError(handleApiError(err))
    }
  }

  const columnas = useMemo<ColumnDef<Categoria>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'nombre', header: 'Nombre' },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => <span className="text-stone-500">{row.original.descripcion ?? '—'}</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEdicion({ modo: 'editar', categoria: row.original })}>
              Editar
            </Button>
            <Button size="sm" variant="danger" onClick={() => setAEliminar(row.original)}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input label="Filtrar" placeholder="Buscar categoría..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
        <Button onClick={() => setEdicion({ modo: 'crear' })}>+ Nueva categoría</Button>
      </div>

      {categorias.isPending ? (
        <SkeletonFilas />
      ) : categorias.isError ? (
        <EstadoError mensaje={handleApiError(categorias.error)} onReintentar={() => void categorias.refetch()} />
      ) : (
        <DataTable
          data={categorias.data}
          columns={columnas}
          pageSize={10}
          globalFilter={filtro}
          getRowId={(c) => String(c.id)}
          vacio="No hay categorías"
        />
      )}

      <Modal
        open={edicion !== null}
        title={edicion?.modo === 'editar' ? 'Editar categoría' : 'Nueva categoría'}
        onClose={cerrar}
      >
        {edicion && (
          <CategoriaForm
            key={edicion.modo === 'editar' ? edicion.categoria.id : 'nueva'}
            inicial={edicion.modo === 'editar' ? edicion.categoria : null}
            error={error}
            onGuardar={guardar}
            onCancelar={cerrar}
          />
        )}
      </Modal>

      <ConfirmModal
        open={aEliminar !== null}
        titulo="Eliminar categoría"
        confirmarTexto="Eliminar"
        cargando={eliminar.isPending}
        error={error}
        onConfirmar={() => void confirmarEliminar()}
        onCerrar={cerrar}
      >
        <p>
          ¿Dar de baja la categoría <strong>{aEliminar?.nombre}</strong>?
        </p>
        <p className="mt-2 text-stone-500">
          Es una baja lógica: el nombre sigue reservado y sus productos no se ocultan. Para retirarlos del catálogo, dalos
          de baja también.
        </p>
      </ConfirmModal>
    </div>
  )
}
