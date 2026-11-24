from typing import Sequence

from sqlmodel import select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    model = Categoria

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        return self.session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()

    def list_activas(self) -> Sequence[Categoria]:
        stmt = select(Categoria).where(Categoria.activo == True).order_by(Categoria.nombre)  # noqa: E712
        return self.session.exec(stmt).all()
