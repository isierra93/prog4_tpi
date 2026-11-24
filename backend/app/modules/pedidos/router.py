from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import AdminUser, CurrentUser
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoCancelable,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoDisponible,
    ProductoNoEncontrado,
    ProductoRepetido,
    StockInsuficiente,
    TransicionInvalida,
    get_pedido_service,
)

router = APIRouter(prefix="/pedidos", tags=["pedidos"])

Service = Annotated[PedidoService, Depends(get_pedido_service)]

# Traducción de excepciones de dominio a códigos HTTP.
_ERRORES: dict[type[Exception], int] = {
    PedidoNoEncontrado: status.HTTP_404_NOT_FOUND,
    ProductoNoEncontrado: status.HTTP_404_NOT_FOUND,
    PedidoAjeno: status.HTTP_403_FORBIDDEN,
    StockInsuficiente: status.HTTP_400_BAD_REQUEST,
    ProductoNoDisponible: status.HTTP_400_BAD_REQUEST,
    ProductoRepetido: status.HTTP_400_BAD_REQUEST,
    TransicionInvalida: status.HTTP_400_BAD_REQUEST,
    PedidoNoCancelable: status.HTTP_400_BAD_REQUEST,
}
_DOMINIO = tuple(_ERRORES)


def _http(e: Exception) -> HTTPException:
    return HTTPException(status_code=_ERRORES[type(e)], detail=str(e))


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(data: PedidoCreate, usuario: CurrentUser, service: Service) -> PedidoRead:
    try:
        return service.crear(data, usuario)
    except _DOMINIO as e:
        raise _http(e)


@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    usuario: CurrentUser,
    service: Service,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: EstadoPedido | None = None,
) -> PedidosPaginados:
    return service.listar(usuario, estado, skip, limit)


# Se declara antes de /{pedido_id} para que "resumen" no se tome como un id.
@router.get("/resumen", response_model=ResumenPedidos)
def resumen_pedidos(_: AdminUser, service: Service) -> ResumenPedidos:
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(pedido_id: int, usuario: CurrentUser, service: Service) -> PedidoRead:
    try:
        return service.obtener(pedido_id, usuario)
    except _DOMINIO as e:
        raise _http(e)


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar_estado_pedido(
    pedido_id: int, data: CambioEstado, _: AdminUser, service: Service
) -> PedidoRead:
    try:
        return service.cambiar_estado(pedido_id, data.estado)
    except _DOMINIO as e:
        raise _http(e)


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancelar_pedido(pedido_id: int, usuario: CurrentUser, service: Service) -> PedidoRead:
    try:
        return service.cancelar(pedido_id, usuario)
    except _DOMINIO as e:
        raise _http(e)
