from app.core.security import hash_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioNoEncontrado(Exception):
    """El usuario no existe (404)."""


class UsuarioDuplicado(Exception):
    """El username o el email ya están registrados (409)."""


class AutoDesactivacion(Exception):
    """El admin intenta desactivarse a sí mismo (400)."""


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def crear(self, data: UserCreate, role: str = "user") -> UserPublic:
        with self.uow as uow:
            if uow.usuarios.get_by_username(data.username):
                raise UsuarioDuplicado("El nombre de usuario ya está registrado")
            if uow.usuarios.get_by_email(str(data.email)):
                raise UsuarioDuplicado("El email ya está registrado")
            usuario = Usuario(
                username=data.username,
                full_name=data.full_name,
                email=str(data.email),
                hashed_password=hash_password(data.password),
                role=role,
            )
            uow.usuarios.add(usuario)
            return UserPublic.model_validate(usuario)

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.list_all()]

    def cambiar_estado(self, usuario_id: int, disabled: bool, actor_id: int) -> UserPublic:
        """Activa o desactiva un usuario. Idempotente: responde 200 aunque el estado no cambie."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado("Usuario no encontrado")
            if disabled and usuario.id == actor_id:
                raise AutoDesactivacion("No puede desactivar su propia cuenta")
            usuario.disabled = disabled
            uow.flush()
            return UserPublic.model_validate(usuario)


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())
