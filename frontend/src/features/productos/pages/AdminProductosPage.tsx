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
import { formatPrecio } from '../../../shared/utils/format'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoForm } from '../components/ProductoForm'
import { StockForm } from '../components/StockForm'
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos'
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types/producto'

type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'editar'; producto: Producto }
  | { tipo: 'stock'; producto: Producto }
  | { tipo: 'eliminar'; producto: Producto }

export function AdminProductosPage() {
  // El panel pide el máximo permitido y pagina del lado del cliente con TanStack Table.
  const productos = useProductos({ skip: 0, limit: 100 })
  const categorias = useCategorias()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const actualizarStock = useActualizarStock()
  const eliminar = useEliminarProducto()

  const [filtro, setFiltro] = useState('')
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cerrar = () => {
    setDialogo(null)
    setError(null)
  }

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setError(null)
    try {
      await accion()
      cerrar()
    } catch (err) {
      setError(handleApiError(err))
    }
  }

  const guardar = (values: ProductoCreate) =>
    ejecutar(() =>
      dialogo?.tipo === 'editar'
        ? actualizar.mutateAsync({ id: dialogo.producto.id, payload: values })
        : crear.mutateAsync(values),
    )

  const guardarStock = (values: ProductoStockUpdate) =>
    ejecutar(() =>
      dialogo?.tipo === 'stock' ? actualizarStock.mutateAsync({ id: dialogo.producto.id, payload: values }) : Promise.resolve(),
    )

  const columnas = useMemo<ColumnDef<Producto>[]>(
    () => [
      {
        id: 'imagen',
        header: '',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.imagen_url ? (
            <img src={row.original.imagen_url} alt="" className="size-10 rounded-md object-cover" />
          ) : (
            <div className="size-10 rounded-md bg-stone-100" />
          ),
      },
      { accessorKey: 'nombre', header: 'Nombre' },
      { id: 'categoria', accessorFn: (p) => p.categoria.nombre, header: 'Categoría' },
      {
        accessorKey: 'precio_base',
        header: 'Precio',
        enableGlobalFilter: false,
        cell: ({ row }) => formatPrecio(row.original.precio_base),
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span className={row.original.stock === 0 ? 'font-semibold text-red-600' : ''}>{row.original.stock}</span>
        ),
      },
      {
        accessorKey: 'disponible',
        header: 'Disponible',
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.disponible ? (
            <span className="text-emerald-700">Sí</span>
          ) : (
            <span className="text-stone-500">No</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDialogo({ tipo: 'editar', producto: row.original })}>
              Editar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDialogo({ tipo: 'stock', producto: row.original })}>
              Stock
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDialogo({ tipo: 'eliminar', producto: row.original })}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const listaCategorias = categorias.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            label="Filtrar"
            placeholder="Nombre o categoría..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <Button onClick={() => setDialogo({ tipo: 'crear' })}>+ Nuevo producto</Button>
      </div>

      {productos.isPending ? (
        <SkeletonFilas />
      ) : productos.isError ? (
        <EstadoError mensaje={handleApiError(productos.error)} onReintentar={() => void productos.refetch()} />
      ) : (
        <DataTable
          data={productos.data.items}
          columns={columnas}
          pageSize={10}
          globalFilter={filtro}
          getRowId={(p) => String(p.id)}
          vacio="No hay productos"
        />
      )}

      <Modal
        open={dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar'}
        title={dialogo?.tipo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
        onClose={cerrar}
        size="lg"
      >
        {(dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar') && (
          <ProductoForm
            key={dialogo.tipo === 'editar' ? dialogo.producto.id : 'nuevo'}
            inicial={dialogo.tipo === 'editar' ? dialogo.producto : null}
            categorias={listaCategorias}
            error={error}
            onGuardar={guardar}
            onCancelar={cerrar}
          />
        )}
      </Modal>

      <Modal open={dialogo?.tipo === 'stock'} title="Stock y disponibilidad" onClose={cerrar}>
        {dialogo?.tipo === 'stock' && (
          <StockForm
            key={dialogo.producto.id}
            producto={dialogo.producto}
            error={error}
            onGuardar={guardarStock}
            onCancelar={cerrar}
          />
        )}
      </Modal>

      <ConfirmModal
        open={dialogo?.tipo === 'eliminar'}
        titulo="Eliminar producto"
        confirmarTexto="Eliminar"
        cargando={eliminar.isPending}
        error={error}
        onConfirmar={() => {
          if (dialogo?.tipo === 'eliminar') void ejecutar(() => eliminar.mutateAsync(dialogo.producto.id))
        }}
        onCerrar={cerrar}
      >
        ¿Dar de baja <strong>{dialogo?.tipo === 'eliminar' ? dialogo.producto.nombre : ''}</strong>? Dejará de
        mostrarse en el catálogo. Los pedidos existentes conservan su copia del nombre y del precio.
      </ConfirmModal>
    </div>
  )
}
