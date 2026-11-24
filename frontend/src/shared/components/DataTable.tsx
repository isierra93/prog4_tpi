import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'

import { Paginacion } from './Paginacion'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  /** Si se indica, pagina del lado del cliente con ese tamaño de página. */
  pageSize?: number
  /** Texto de búsqueda aplicado a todas las columnas filtrables. */
  globalFilter?: string
  vacio?: string
  getRowId?: (row: T) => string
}

/** Tabla genérica del panel construida con TanStack Table (orden, filtro y paginación en el cliente). */
export function DataTable<T>({
  data,
  columns,
  pageSize,
  globalFilter = '',
  vacio = 'No hay registros',
  getRowId,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: pageSize ?? Number.MAX_SAFE_INTEGER })

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  })

  const filas = table.getRowModel().rows

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const ordenable = header.column.getCanSort()
                  const orden = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className="border-b border-stone-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500"
                    >
                      {header.isPlaceholder ? null : ordenable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase hover:text-stone-800"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span aria-hidden>{orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : ''}</span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-stone-500">
                  {vacio}
                </td>
              </tr>
            ) : (
              filas.map((row) => (
                <tr key={row.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pageSize !== undefined && (
        <Paginacion
          pagina={table.getState().pagination.pageIndex}
          totalPaginas={table.getPageCount()}
          onCambiar={(p) => table.setPageIndex(p)}
        />
      )}
    </div>
  )
}
