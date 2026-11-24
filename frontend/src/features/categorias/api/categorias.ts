import { api } from '../../../shared/api/axiosInstance'
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export async function getCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>('/categorias')
  return data
}

export async function createCategoria(payload: CategoriaCreate): Promise<Categoria> {
  const { data } = await api.post<Categoria>('/categorias', payload)
  return data
}

export async function updateCategoria(id: number, payload: CategoriaUpdate): Promise<Categoria> {
  const { data } = await api.put<Categoria>(`/categorias/${id}`, payload)
  return data
}

export async function deleteCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`)
}
