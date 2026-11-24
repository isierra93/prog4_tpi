from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    """Unit of Work base.

    Abre la sesión en __enter__; en __exit__ hace commit si el bloque terminó sin
    excepción o rollback si hubo una, y siempre cierra la sesión. Las subclases
    crean sus repositorios en `_init_repositories` sobre la misma sesión.
    """

    session: Session

    def __enter__(self) -> Self:
        self.session = session_factory()
        self._init_repositories()
        return self

    def _init_repositories(self) -> None:
        """Las subclases crean aquí sus repositorios."""

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()

    def flush(self) -> None:
        """Envía los cambios pendientes a la base sin confirmar la transacción."""
        self.session.flush()

    def refresh(self, obj: object) -> None:
        self.session.refresh(obj)
