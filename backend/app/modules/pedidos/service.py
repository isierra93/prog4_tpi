from datetime import datetime

from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.schemas import UserPublic

# Máquina de estados (RN-02): estado actual -> estados a los que puede pasar.
TRANSICIONES: dict[EstadoPedido, set[EstadoPedido]] = {
    EstadoPedido.PENDIENTE: {EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO},
    EstadoPedido.EN_PREPARACION: {EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO},
    EstadoPedido.ENTREGADO: set(),
    EstadoPedido.CANCELADO: set(),
}


# ---------- Excepciones de dominio ----------
class PedidoNoEncontrado(Exception):
    """404"""


class ProductoNoEncontrado(Exception):
    """404: el producto no existe o está dado de baja."""


class PedidoAjeno(Exception):
    """403: el pedido pertenece a otro usuario."""


class StockInsuficiente(Exception):
    """400"""


class ProductoNoDisponible(Exception):
    """400"""


class ProductoRepetido(Exception):
    """400"""


class TransicionInvalida(Exception):
    """400"""


class PedidoNoCancelable(Exception):
    """400: el dueño solo puede cancelar en PENDIENTE."""


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # ---------- helpers ----------
    @staticmethod
    def _get_pedido(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado("Pedido no encontrado")
        return pedido

    @staticmethod
    def _restituir_stock(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
        """RN-03: devuelve al stock la cantidad de cada línea, en la misma transacción."""
        for item in pedido.items:
            producto = uow.productos.get_for_update(item.producto_id)
            if producto is not None:
                producto.stock += item.cantidad

    @staticmethod
    def _aplicar_estado(pedido: Pedido, nuevo: EstadoPedido) -> None:
        pedido.estado = nuevo.value
        pedido.updated_at = datetime.now()

    # ---------- casos de uso ----------
    def crear(self, data: PedidoCreate, usuario: UserPublic) -> PedidoRead:
        """RN-01: crea el pedido completo o no crea nada."""
        with self.uow as uow:
            ids = [item.producto_id for item in data.items]
            if len(ids) != len(set(ids)):
                raise ProductoRepetido("Hay productos repetidos en el pedido")

            pedido = Pedido(
                usuario_id=usuario.id,
                estado=EstadoPedido.PENDIENTE.value,
                forma_pago=data.forma_pago.value,
                direccion_entrega=data.direccion_entrega.strip(),
                notas=data.notas,
                total=0,
            )
            uow.pedidos.add(pedido)

            total = 0.0
            for item in data.items:
                producto = uow.productos.get_for_update(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(f"Producto {item.producto_id} no encontrado")
                if not producto.disponible:
                    raise ProductoNoDisponible(f"El producto '{producto.nombre}' no está disponible")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente para '{producto.nombre}' "
                        f"(disponible: {producto.stock}, pedido: {item.cantidad})"
                    )
                producto.stock -= item.cantidad
                subtotal = round(producto.precio_base * item.cantidad, 2)
                pedido.items.append(
                    DetallePedido(
                        producto_id=producto.id,  # type: ignore[arg-type]
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.flush()
            return PedidoRead.model_validate(pedido)

    def listar(
        self, usuario: UserPublic, estado: EstadoPedido | None, skip: int, limit: int
    ) -> PedidosPaginados:
        """El admin ve todos los pedidos; el cliente, solo los suyos (RN-04)."""
        with self.uow as uow:
            filtro = estado.value if estado else None
            if usuario.role == "admin":
                total, pedidos = uow.pedidos.list_all(filtro, skip, limit)
            else:
                total, pedidos = uow.pedidos.list_by_usuario(usuario.id, filtro, skip, limit)
            return PedidosPaginados(
                total=total, items=[PedidoRead.model_validate(p) for p in pedidos]
            )

    def obtener(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno("No tiene acceso a este pedido")
            return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, pedido_id: int, nuevo: EstadoPedido) -> PedidoRead:
        """RN-02 (admin): valida la transición antes de modificar; si cancela, RN-03."""
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            actual = EstadoPedido(pedido.estado)
            if nuevo not in TRANSICIONES[actual]:
                raise TransicionInvalida(
                    f"Transición inválida: {actual.value} -> {nuevo.value}"
                )
            if nuevo == EstadoPedido.CANCELADO:
                self._restituir_stock(uow, pedido)
            self._aplicar_estado(pedido, nuevo)
            uow.flush()
            return PedidoRead.model_validate(pedido)

    def cancelar(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        """RN-03 y RN-04: el dueño cancela su pedido solo si está en PENDIENTE."""
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("No puede cancelar un pedido de otro usuario")
            if pedido.estado != EstadoPedido.PENDIENTE.value:
                raise PedidoNoCancelable("Solo se pueden cancelar pedidos en estado PENDIENTE")
            self._restituir_stock(uow, pedido)
            self._aplicar_estado(pedido, EstadoPedido.CANCELADO)
            uow.flush()
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            conteos = uow.pedidos.count_by_estado()
            return ResumenPedidos(
                pendientes=conteos.get(EstadoPedido.PENDIENTE.value, 0),
                en_preparacion=conteos.get(EstadoPedido.EN_PREPARACION.value, 0),
                entregados=conteos.get(EstadoPedido.ENTREGADO.value, 0),
                cancelados=conteos.get(EstadoPedido.CANCELADO.value, 0),
                pedidos_hoy=uow.pedidos.count_hoy(),
                ingresos_entregados=round(
                    uow.pedidos.sum_total_por_estado(EstadoPedido.ENTREGADO.value), 2
                ),
            )


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())
