from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# Registrar todos los modelos en SQLModel.metadata apenas se importa la base:
# así las relaciones entre módulos (por ejemplo Usuario.pedidos -> Pedido) se
# resuelven aunque el código que abre la sesión no importe todos los módulos.
from app.modules.categorias import models as _categorias  # noqa: F401, E402
from app.modules.pedidos import models as _pedidos  # noqa: F401, E402
from app.modules.productos import models as _productos  # noqa: F401, E402
from app.modules.usuarios import models as _usuarios  # noqa: F401, E402

_connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args)


def create_all_tables() -> None:
    """Crea las tablas de todos los modelos registrados."""
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    """Crea una nueva sesión. La usa el Unit of Work."""
    return Session(engine, expire_on_commit=False)
