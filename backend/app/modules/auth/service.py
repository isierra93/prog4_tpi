from app.core.security import create_access_token, verify_password
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class CredencialesInvalidas(Exception):
    """Usuario o contraseña incorrectos (401)."""


class CuentaDesactivada(Exception):
    """La cuenta existe pero está desactivada (400)."""


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def login(self, username: str, password: str) -> str:
        """Valida las credenciales y devuelve el JWT firmado."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise CredencialesInvalidas("Usuario o contraseña incorrectos")
            if usuario.disabled:
                raise CuentaDesactivada("Cuenta de usuario desactivada")
            return create_access_token(usuario.username, {"role": usuario.role})


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())
