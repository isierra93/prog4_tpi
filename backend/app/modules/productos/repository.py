from typing import Sequence

from sqlalchemy import func
from sqlmodel import col, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    model = Producto

    def get_for_update(self, producto_id: int) -> Producto | None:
        """Lee el producto bloqueando su fila hasta el fin de la transacción (SELECT ... FOR UPDATE),
        para que dos pedidos simultáneos no descuenten el mismo stock."""
        stmt = select(Producto).where(col(Producto.id) == producto_id).with_for_update()
        return self.session.exec(stmt).first()

    def search(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> tuple[int, Sequence[Producto]]:
        """Productos activos filtrados por nombre (sin distinguir mayúsculas), categoría y disponibilidad.

        Devuelve (total, items) para paginar.
        """
        conditions = [col(Producto.activo).is_(True)]
        if search:
            conditions.append(col(Producto.nombre).ilike(f"%{search.strip()}%"))
        if categoria_id is not None:
            conditions.append(col(Producto.categoria_id) == categoria_id)
        if disponible is not None:
            conditions.append(col(Producto.disponible).is_(disponible))

        total = self.session.exec(select(func.count()).select_from(Producto).where(*conditions)).one()
        items = self.session.exec(
            select(Producto).where(*conditions).order_by(col(Producto.id)).offset(skip).limit(limit)
        ).all()
        return total, items
