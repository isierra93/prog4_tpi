export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO'

export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA'

export const ESTADOS_PEDIDO: EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

export const FORMAS_PAGO: FormaPago[] = ['EFECTIVO', 'TRANSFERENCIA']

/** Mismo mapa de transiciones que el Service de pedidos del backend (RN-02). */
export const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
}

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

export interface DetallePedido {
  producto_id: number
  nombre_producto: string
  precio_unitario: number
  cantidad: number
  subtotal: number
}

export interface Pedido {
  id: number
  usuario_id: number
  estado: EstadoPedido
  forma_pago: FormaPago
  direccion_entrega: string
  notas: string | null
  total: number
  created_at: string
  updated_at: string
  items: DetallePedido[]
}

export interface ItemPedidoCreate {
  producto_id: number
  cantidad: number
}

export interface PedidoCreate {
  items: ItemPedidoCreate[]
  forma_pago: FormaPago
  direccion_entrega: string
  notas: string | null
}

export interface PedidosPaginados {
  total: number
  items: Pedido[]
}

export interface PedidoFiltros {
  skip: number
  limit: number
  estado?: EstadoPedido
}

export interface ResumenPedidos {
  pendientes: number
  en_preparacion: number
  entregados: number
  cancelados: number
  pedidos_hoy: number
  ingresos_entregados: number
}
