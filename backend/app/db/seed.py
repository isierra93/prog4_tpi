"""Carga inicial idempotente: usuario admin, categorías y productos.

Uso (desde backend/):  python -m app.db.seed
Se puede ejecutar varias veces: solo crea lo que todavía no existe.
"""

from sqlmodel import Session, select

from app.core.database import create_all_tables, engine
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {
    "username": "admin",
    "password": "Admin1234!",
    "full_name": "Administrador",
    "email": "admin@foodstore.com",
}

CATEGORIAS: list[dict[str, str]] = [
    {"nombre": "Pizzas", "descripcion": "Pizzas a la piedra"},
    {"nombre": "Hamburguesas", "descripcion": "Hamburguesas caseras con papas"},
    {"nombre": "Empanadas", "descripcion": "Empanadas al horno"},
    {"nombre": "Bebidas", "descripcion": "Gaseosas, aguas y cervezas"},
    {"nombre": "Postres", "descripcion": "Dulces para el final"},
]


def _img(photo_id: str) -> str:
    return f"https://images.unsplash.com/{photo_id}?w=600&q=80"


PRODUCTOS: list[dict[str, str | float | int]] = [
    {"categoria": "Pizzas", "nombre": "Pizza Muzzarella", "descripcion": "Salsa de tomate, muzzarella y aceitunas", "precio_base": 9500, "stock": 30, "imagen_url": _img("photo-1513104890138-7c749659a591")},
    {"categoria": "Pizzas", "nombre": "Pizza Napolitana", "descripcion": "Muzzarella, tomate en rodajas y ajo", "precio_base": 11000, "stock": 25, "imagen_url": _img("photo-1574071318508-1cdbab80d002")},
    {"categoria": "Pizzas", "nombre": "Pizza Fugazzeta", "descripcion": "Cebolla y abundante muzzarella", "precio_base": 10500, "stock": 20, "imagen_url": _img("photo-1565299624946-b28f40a0ae38")},
    {"categoria": "Hamburguesas", "nombre": "Hamburguesa Clásica", "descripcion": "Carne, lechuga, tomate y queso", "precio_base": 8500, "stock": 40, "imagen_url": _img("photo-1568901346375-23c9450c58cd")},
    {"categoria": "Hamburguesas", "nombre": "Hamburguesa Doble Cheddar", "descripcion": "Doble carne, doble cheddar y panceta", "precio_base": 11500, "stock": 30, "imagen_url": _img("photo-1553979459-d2229ba7433b")},
    {"categoria": "Hamburguesas", "nombre": "Hamburguesa Veggie", "descripcion": "Medallón de lentejas y vegetales grillados", "precio_base": 9000, "stock": 15, "imagen_url": _img("photo-1520072959219-c595dc870360")},
    {"categoria": "Empanadas", "nombre": "Empanada de Carne", "descripcion": "Carne cortada a cuchillo", "precio_base": 1500, "stock": 100, "imagen_url": _img("photo-1604467707321-70d5ac45adda")},
    {"categoria": "Empanadas", "nombre": "Empanada de Jamón y Queso", "descripcion": "Clásica de jamón y queso", "precio_base": 1400, "stock": 100, "imagen_url": _img("photo-1628191010210-a59de33e5941")},
    {"categoria": "Bebidas", "nombre": "Gaseosa Cola 1.5 L", "descripcion": "Botella de 1,5 litros", "precio_base": 3000, "stock": 60, "imagen_url": _img("photo-1622483767028-3f66f32aef97")},
    {"categoria": "Bebidas", "nombre": "Agua Mineral 500 ml", "descripcion": "Sin gas", "precio_base": 1500, "stock": 80, "imagen_url": _img("photo-1548839140-29a749e1cf4d")},
    {"categoria": "Postres", "nombre": "Flan Casero", "descripcion": "Con dulce de leche y crema", "precio_base": 4000, "stock": 20, "imagen_url": _img("photo-1528975604071-b4dc52a2d18c")},
    {"categoria": "Postres", "nombre": "Brownie", "descripcion": "Brownie de chocolate con nueces", "precio_base": 3500, "stock": 25, "imagen_url": _img("photo-1606313564200-e75d5e30476c")},
]


def seed() -> None:
    create_all_tables()
    creados = {"admin": 0, "categorias": 0, "productos": 0}

    with Session(engine) as session:
        # Usuario admin
        if session.exec(select(Usuario).where(Usuario.username == ADMIN["username"])).first() is None:
            session.add(
                Usuario(
                    username=ADMIN["username"],
                    full_name=ADMIN["full_name"],
                    email=ADMIN["email"],
                    hashed_password=hash_password(ADMIN["password"]),
                    role="admin",
                )
            )
            creados["admin"] = 1

        # Categorías
        categorias: dict[str, Categoria] = {}
        for data in CATEGORIAS:
            categoria = session.exec(select(Categoria).where(Categoria.nombre == data["nombre"])).first()
            if categoria is None:
                categoria = Categoria(**data)
                session.add(categoria)
                session.flush()
                creados["categorias"] += 1
            categorias[data["nombre"]] = categoria

        # Productos (se identifican por nombre)
        for data in PRODUCTOS:
            nombre = str(data["nombre"])
            if session.exec(select(Producto).where(Producto.nombre == nombre)).first() is not None:
                continue
            categoria = categorias[str(data["categoria"])]
            session.add(
                Producto(
                    categoria_id=categoria.id,  # type: ignore[arg-type]
                    nombre=nombre,
                    descripcion=str(data["descripcion"]),
                    precio_base=float(data["precio_base"]),
                    stock=int(data["stock"]),
                    imagen_url=str(data["imagen_url"]),
                )
            )
            creados["productos"] += 1

        session.commit()

    print(
        "Seed completo. Creados: "
        f"{creados['admin']} admin, {creados['categorias']} categorías, {creados['productos']} productos."
    )
    print(f"Usuario admin: {ADMIN['username']} / {ADMIN['password']}")


if __name__ == "__main__":
    seed()
