from sqlmodel import SQLModel

# El registro usa UserCreate y las respuestas UserPublic, definidos en el módulo usuarios.
from app.modules.usuarios.schemas import UserCreate, UserPublic

__all__ = ["UserCreate", "UserPublic", "MessageResponse"]


class MessageResponse(SQLModel):
    message: str
