from typing import Annotated, Callable

from fastapi import Cookie, Depends, HTTPException, status

from app.core.security import decode_access_token
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"


def get_current_user(access_token: Annotated[str | None, Cookie()] = None) -> UserPublic:
    """Lee el JWT de la cookie HttpOnly, valida firma y expiración y carga el usuario."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o sesión expirada",
    )
    if not access_token:
        raise credentials_error
    payload = decode_access_token(access_token)
    if payload is None or "sub" not in payload:
        raise credentials_error
    with UsuarioUnitOfWork() as uow:
        usuario = uow.usuarios.get_by_username(str(payload["sub"]))
        if usuario is None:
            raise credentials_error
        return UserPublic.model_validate(usuario)


def get_current_active_user(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    if current_user.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CUENTA_DESACTIVADA)
    return current_user


def require_role(roles: list[str]) -> Callable[[UserPublic], UserPublic]:
    """Dependencia que exige que el usuario activo tenga alguno de los roles indicados."""

    def checker(
        current_user: Annotated[UserPublic, Depends(get_current_active_user)],
    ) -> UserPublic:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para realizar esta acción",
            )
        return current_user

    return checker


CurrentUser = Annotated[UserPublic, Depends(get_current_active_user)]
AdminUser = Annotated[UserPublic, Depends(require_role(["admin"]))]
