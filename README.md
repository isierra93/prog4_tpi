# Food Store — Sistema de pedidos de comida

Trabajo Práctico Integrador · Programación 4 · Tecnicatura Universitaria en Programación a Distancia (UTN).

Aplicación web para un negocio de comidas: los clientes se registran, recorren el catálogo, arman un carrito y confirman pedidos indicando dirección y forma de pago; el administrador gestiona categorías, productos, stock, pedidos y usuarios desde un panel.

- **Repositorio:** `https://github.com/isierra93/prog4_tpi`
- **Video de demostración:** `https://youtu.be/Bl4TEhaYkRg`

---

## Stack

| Capa | Tecnologías |
|---|---|
| Backend | Python 3.12, FastAPI, SQLModel, PostgreSQL 16, JWT en cookie HttpOnly (python-jose), bcrypt (passlib) |
| Frontend | React 19 + TypeScript (strict), Vite 7, Tailwind CSS 4, TanStack Query / Form / Table, Zustand, Axios, React Router 7 |

Arquitectura del backend en capas por módulo: **Router → Service → Unit of Work → Repository → Model**. El commit/rollback ocurre únicamente en el `__exit__` del Unit of Work.
El frontend se organiza por features (`auth`, `categorias`, `productos`, `pedidos`, `usuarios`) más `shared/`, `store/` y `routes/`.

## Requisitos

- **Python 3.11, 3.12 o 3.13** (SQLModel 0.0.22 no funciona con Python 3.14).
- **Node.js 20.19 o superior** y **pnpm 9 o superior** (`npm install -g pnpm`).
- **PostgreSQL 15 o superior.** La forma más simple es con **Docker** usando el `docker-compose.yml` incluido; también sirve un PostgreSQL instalado localmente.

---

## 1. Base de datos

### Opción A — Docker (recomendada)

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Levanta PostgreSQL 16 en el puerto **5433** del host (para no chocar con otro PostgreSQL en el 5432), con usuario `foodstore`, contraseña `foodstore` y base `foodstore_db`. Coincide con el `DATABASE_URL` de `backend/.env.example`.

### Opción B — PostgreSQL local

Crear una base vacía (por ejemplo `foodstore_db`) y ajustar `DATABASE_URL` en `backend/.env`:

```
DATABASE_URL=postgresql://<usuario>:<contraseña>@localhost:5432/foodstore_db
```

> Para una prueba rápida sin PostgreSQL también se acepta SQLite: `DATABASE_URL=sqlite:///./foodstore.db`.

## 2. Backend

```bash
cd backend

# Crear y activar el entorno virtual (usar Python 3.11–3.13)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt

# Variables de entorno
cp .env.example .env        # Windows (cmd): copy .env.example .env

# Crea las tablas y carga datos iniciales (idempotente: se puede ejecutar varias veces)
python -m app.db.seed

# Levantar la API
uvicorn app.main:app --reload
```

- API: <http://localhost:8000/api/v1>
- Documentación: <http://localhost:8000/docs> (Swagger) y <http://localhost:8000/redoc>

> En Windows, si `python` apunta a Python 3.14, crear el venv con el lanzador: `py -3.12 -m venv venv`.

### Variables de entorno del backend (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://foodstore:foodstore@localhost:5433/foodstore_db` |
| `SECRET_KEY` | Clave de firma del JWT (mínimo 32 caracteres) | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS (con credenciales) | `http://localhost:5173` |

## 3. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env        # Windows (cmd): copy .env.example .env
pnpm install
pnpm build                  # verifica los tipos (TypeScript strict) y compila
pnpm dev
```

Abrir <http://localhost:5173>.

### Variables de entorno del frontend (`frontend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:8000/api/v1` |

> Usar `localhost` (y no `127.0.0.1`) tanto en el navegador como en `VITE_API_URL` y `FRONTEND_ORIGIN`, para que la cookie de sesión se comparta entre frontend y backend.

### Problemas comunes

- **`[WinError 10013] Intento de acceso a un socket no permitido`** (o *address already in use*) al levantar uvicorn: el puerto 8000 ya está ocupado por otro proceso (por ejemplo, otra instancia de uvicorn). Cerrala, o levantá en otro puerto con `uvicorn app.main:app --reload --port 8001` y ajustá `VITE_API_URL` en `frontend/.env`. Para ver qué proceso lo usa en Windows: `netstat -ano | findstr :8000`.
- **El login funciona pero la sesión no se mantiene:** revisar que el navegador use `localhost` y no `127.0.0.1` (ver nota de la sección Frontend).

---

## Usuario del seed

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | `admin` |

El seed también carga **5 categorías** y **12 productos** con stock e imagen. Los clientes (rol `user`) se crean desde la pantalla de registro.

## Funcionalidades

**Cliente**
- Registro e inicio de sesión (TanStack Form con validación).
- Catálogo paginado en el servidor, con búsqueda por nombre, filtro por categoría, skeleton de carga y estado vacío.
- Carrito persistido en el navegador (sobrevive a la recarga).
- Checkout con dirección de entrega, forma de pago (efectivo o transferencia) y notas.
- «Mis pedidos»: listado, detalle con sus líneas y cancelación mientras el pedido está `PENDIENTE`.

**Administrador** (`/admin`)
- Resumen con tarjetas: pedidos por estado, pedidos de hoy e ingresos de pedidos entregados.
- ABM de categorías y productos con TanStack Table y TanStack Form, incluido el cambio de stock y disponibilidad.
- Gestión de pedidos con filtro por estado y botones según la máquina de estados.
- Gestión de usuarios: activar y desactivar (el admin no puede desactivarse a sí mismo).

## Reglas de negocio implementadas

- **RN-01** El pedido se crea en una única transacción: valida que no haya productos repetidos, que cada producto exista, esté activo y disponible y tenga stock; descuenta el stock y copia nombre y precio en cada línea. Si algo falla, no se persiste nada.
- **RN-02** Máquina de estados: `PENDIENTE → EN_PREPARACION | CANCELADO`, `EN_PREPARACION → ENTREGADO | CANCELADO`; `ENTREGADO` y `CANCELADO` son terminales. Una transición inválida responde 400.
- **RN-03** Al cancelar se restituye el stock de cada línea en la misma transacción.
- **RN-04** El cliente solo ve y cancela sus pedidos (y solo en `PENDIENTE`); el admin ve todos y los avanza o cancela.
- **RN-05** Las líneas y el total no cambian después de creado el pedido; no hay endpoints de edición ni borrado de pedidos.
- **RN-06** `forma_pago` es `EFECTIVO` o `TRANSFERENCIA` y `direccion_entrega` tiene entre 5 y 200 caracteres.

## Seguridad

- El JWT viaja **solo** en la cookie HttpOnly `access_token`: el frontend nunca lo lee ni lo guarda. El `authStore` persiste únicamente los datos públicos del usuario.
- Contraseñas con hash bcrypt.
- Dependencias `get_current_user` (401), `get_current_active_user` (400 si la cuenta está desactivada) y `require_role` (403).
- `ProtectedRoute` en el frontend redirige a `/login` sin sesión y a `/unauthorized` sin el rol; la protección real está en el backend.

## Estructura

```
TPI_PROGRA/
├── docker-compose.yml        PostgreSQL para desarrollo
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py           FastAPI, CORS y routers bajo /api/v1
│       ├── core/             config, database, security, deps, unit_of_work, base_repository
│       ├── modules/          auth, usuarios, categorias, productos, pedidos
│       │                     (router, service, unit_of_work, repository, models, schemas)
│       └── db/seed.py
└── frontend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── shared/           api (axios, errores, queryClient), ui, components, layout
        ├── features/         auth, categorias, productos, usuarios, pedidos
        ├── store/            authStore, cartStore (Zustand + persist)
        └── routes/           AppRouter, ProtectedRoute
```
