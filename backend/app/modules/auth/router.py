from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import CurrentUser
from app.modules.auth.schemas import MessageResponse, UserCreate, UserPublic
from app.modules.auth.service import (
    AuthService,
    CredencialesInvalidas,
    CuentaDesactivada,
    get_auth_service,
)
from app.modules.usuarios.service import UsuarioDuplicado, UsuarioService, get_usuario_service

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    data: UserCreate,
    service: Annotated[UsuarioService, Depends(get_usuario_service)],
) -> UserPublic:
    """Registro público: siempre crea usuarios con rol `user`."""
    try:
        return service.crear(data, role="user")
    except UsuarioDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/token", response_model=MessageResponse)
def login(
    response: Response,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    """Login con formulario OAuth2. El JWT viaja solo en la cookie HttpOnly, nunca en el cuerpo."""
    try:
        token = service.login(form.username, form.password)
    except CredencialesInvalidas as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except CuentaDesactivada as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # en producción, detrás de HTTPS, debe ser True
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return MessageResponse(message="Login exitoso")


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response) -> MessageResponse:
    response.delete_cookie(key=COOKIE_NAME, path="/", httponly=True, samesite="lax")
    return MessageResponse(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic)
def me(current_user: CurrentUser) -> UserPublic:
    return current_user
