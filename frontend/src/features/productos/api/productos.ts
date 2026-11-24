import { api } from '../../../shared/api/axiosInstance'
import type {
  Producto,
  ProductoCreate,
  ProductoFiltros,
  ProductosPaginados,
  ProductoStockUpdate,
  ProductoUpdate,
} from '../types/producto'

export async function getProductos(filtros: ProductoFiltros): Promise<ProductosPaginados> {
  const { data } = await api.get<ProductosPaginados>('/productos', { params: filtros })
  return data
}

export async function createProducto(payload: ProductoCreate): Promise<Producto> {
  const { data } = await api.post<Producto>('/productos', payload)
  return data
}

export async function updateProducto(id: number, payload: ProductoUpdate): Promise<Producto> {
  const { data } = await api.put<Producto>(`/productos/${id}`, payload)
  return data
}

export async function updateStock(id: number, payload: ProductoStockUpdate): Promise<Producto> {
  const { data } = await api.patch<Producto>(`/productos/${id}/stock`, payload)
  return data
}

export async function deleteProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`)
}
