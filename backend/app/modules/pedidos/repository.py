from datetime import date, datetime, time, timedelta
from typing import Sequence

from sqlalchemy import func
from sqlmodel import col, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    model = Pedido

    def _listar(
        self, usuario_id: int | None, estado: str | None, skip: int, limit: int
    ) -> tuple[int, Sequence[Pedido]]:
        conditions = []
        if usuario_id is not None:
            conditions.append(col(Pedido.usuario_id) == usuario_id)
        if estado is not None:
            conditions.append(col(Pedido.estado) == estado)
        total = self.session.exec(select(func.count()).select_from(Pedido).where(*conditions)).one()
        items = self.session.exec(
            select(Pedido).where(*conditions).order_by(col(Pedido.id).desc()).offset(skip).limit(limit)
        ).all()
        return total, items

    def list_by_usuario(
        self, usuario_id: int, estado: str | None = None, skip: int = 0, limit: int = 20
    ) -> tuple[int, Sequence[Pedido]]:
        return self._listar(usuario_id, estado, skip, limit)

    def list_all(
        self, estado: str | None = None, skip: int = 0, limit: int = 20
    ) -> tuple[int, Sequence[Pedido]]:
        return self._listar(None, estado, skip, limit)

    def count_by_estado(self) -> dict[str, int]:
        rows = self.session.exec(
            select(Pedido.estado, func.count(col(Pedido.id))).group_by(Pedido.estado)
        ).all()
        return {estado: cantidad for estado, cantidad in rows}

    def count_hoy(self) -> int:
        inicio = datetime.combine(date.today(), time.min)
        fin = inicio + timedelta(days=1)
        stmt = (
            select(func.count(col(Pedido.id)))
            .where(col(Pedido.created_at) >= inicio)
            .where(col(Pedido.created_at) < fin)
        )
        return self.session.exec(stmt).one()

    def sum_total_por_estado(self, estado: str) -> float:
        stmt = select(func.coalesce(func.sum(Pedido.total), 0)).where(col(Pedido.estado) == estado)
        return float(self.session.exec(stmt).one())
