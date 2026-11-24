from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    """La categoría no existe o está dada de baja (404)."""


class NombreDuplicado(Exception):
    """Ya existe una categoría con ese nombre, aun dada de baja (409)."""


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _get_activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("Categoría no encontrada")
        return categoria

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._get_activa(uow, categoria_id))

    def crear(self, data: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            # La baja lógica no libera el nombre: se busca entre todas las categorías.
            if uow.categorias.get_by_nombre(data.nombre):
                raise NombreDuplicado("Ya existe una categoría con ese nombre")
            categoria = Categoria(nombre=data.nombre, descripcion=data.descripcion)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._get_activa(uow, categoria_id)
            cambios = data.model_dump(exclude_unset=True)
            if cambios.get("nombre") is None:
                cambios.pop("nombre", None)  # nombre es obligatorio: un null no lo borra
            nuevo_nombre = cambios.get("nombre")
            if nuevo_nombre and nuevo_nombre != categoria.nombre:
                existente = uow.categorias.get_by_nombre(nuevo_nombre)
                if existente and existente.id != categoria.id:
                    raise NombreDuplicado("Ya existe una categoría con ese nombre")
            categoria.sqlmodel_update(cambios)
            uow.flush()
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica: activo = False."""
        with self.uow as uow:
            categoria = self._get_activa(uow, categoria_id)
            categoria.activo = False


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())
