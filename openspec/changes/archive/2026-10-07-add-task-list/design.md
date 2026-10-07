# Design

## Context

Hoy el sistema solo tiene el vertical de cuentas y acceso (ver `openspec/specs/auth/spec.md`). El backend sigue las convenciones descritas en `CLAUDE.md`: esquema generado desde migraciones, modelos que extienden la clase generada, controladores registrados en `#generated/controllers`, respuestas a través de `serialize()` con un transformer, validación con `vine.create` y auth por token opaco con el guard `api`. En el frontend, `lib/api.ts` es el único punto de contacto con el backend, el estado de sesión vive en `auth/` y las pantallas protegidas cuelgan de `ProtectedRoute`. Solo existen los componentes de `components/ui/` `alert`, `button`, `card`, `input` y `label`, y no se añaden ni dependencias ni componentes de shadcn nuevos.

Motivación y alcance: ver `proposal.md`. Comportamiento exigido: ver `specs/tasks/spec.md` y `specs/auth/spec.md`.

## Goals / Non-Goals

**Goals:**

- Seguir exactamente los patrones existentes del backend y del frontend, de modo que el vertical de tareas se lea igual que el de auth.
- Exponer del responsable solo `id` y `fullName`, sin que se filtre el resto de la cuenta.
- Que una tarea no pueda existir con un estado fuera del conjunto cerrado, ni siquiera escribiendo directamente en la base de datos.

**Non-Goals:**

- Ordenar la lista (PA-3 abierto): ni `orderBy` en la consulta ni ordenación en el cliente.
- Columna de vencimiento, ni siquiera nullable.
- Selector de responsable en la interfaz, endpoint de usuarios, lectura individual o borrado.
- Refresco en tiempo real, paginación o actualización optimista de la creación.
- Tests y base de pruebas.

## Decisions

### Modelo de datos

Tabla `tasks` con `id`, `title` (string de 255, no nulo), `status` (enum `pending`/`in_progress`/`done`, no nulo, por defecto `pending`), `assignee_id` (entero no nulo, FK a `users.id`) y `created_at`/`updated_at`.

- **Enum en la columna.** Knex traduce `enu` a un `CHECK` en SQLite, así que el conjunto cerrado se garantiza también en la base de datos y no solo en el validador. *Alternativa:* string libre validado solo en la API. Se descarta porque deja la puerta a estados inválidos.
- **No se guarda quién creó la tarea.** Ningún requisito lo usa: el creador solo determina el responsable inicial. *Alternativa:* columna `created_by`. Se descarta porque añadiría un dato sin consumidor.
- **FK sin `ON DELETE CASCADE`.** Hoy no se pueden borrar cuentas; si algún día se puede, borrar las tareas de alguien en cascada sería destructivo y silencioso. Se deja la restricción por defecto y la decisión para entonces.
- Flujo habitual: crear la migración, ejecutar `node ace migration:run` (que regenera `database/schema.ts`) y escribir un modelo `Task` que extiende `TaskSchema` y declara solo la relación `belongsTo` `assignee` con `User` mediante `assigneeId`.

### API

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/v1/tasks` | 200 `{ data: Task[] }` |
| POST | `/api/v1/tasks` | 201 `{ data: Task }` |
| PATCH | `/api/v1/tasks/:id` | 200 `{ data: Task }` |

- Las tres rutas van en un grupo nuevo bajo `/api/v1` con `.use(middleware.auth())`, como el grupo `account`. `:id` lleva el matcher numérico del router, de modo que un id no numérico da 404 sin llegar al controlador. Un id numérico inexistente se resuelve con `findOrFail`, que también da 404.
- **PATCH, no PUT**: la actualización es parcial (estado y/o responsable).
- **201 al crear**, a diferencia del registro, que responde 200. Es lo correcto para una creación y no afecta a ningún cliente existente.
- **El listado precarga `assignee`**, con una sola consulta adicional en lugar de N, y no ordena.
- **Validadores** en un fichero nuevo de `app/validators/`:
  - creación: `title: vine.string().trim().minLength(1).maxLength(255)`. Con `convertEmptyStringsToNull` del bodyparser, `""` llega como `null` y falla por `required`; `"   "` se recorta a `""` y falla por `minLength`. Ambos dan 422 sobre `title`, que es lo único que fija la spec de la API.
  - actualización: `status: vine.enum(TASK_STATUSES).optional().requiredIfMissing('assigneeId')` y `assigneeId: vine.number().withoutDecimals().exists({ table: 'users', column: 'id' }).optional()`. Si faltan los dos campos, falla `status` por `required`, lo que da el 422 de «nada que actualizar».
  - VineJS trata `null` como valor ausente, así que `assigneeId` opcional ignoraría en silencio un `null` (y `{ status, assigneeId: null }` respondería 200). Para rechazarlo, se añade una regla implícita `notNull` (las reglas implícitas se ejecutan aunque el valor falte), que da 422 sobre `assigneeId`.
  - VineJS descarta las claves no declaradas, de modo que `status` y `assigneeId` en la creación, o `title` en la actualización, se ignoran sin código adicional.
- **`TASK_STATUSES`** se declara una sola vez en el backend (junto al modelo) y lo usan el validador y los tipos. La migración repite la lista literal a propósito, porque una migración es historia congelada y no debe importar código vivo. El esquema generado tipa `status` como `string`, así que el modelo lo estrecha con `declare status: TaskStatus`.
- **Transformer de tarea**: `id`, `title`, `status`, `createdAt`, `updatedAt` y `assignee: { id, fullName }` construido a mano a partir de la relación, nunca reutilizando `UserTransformer`, que expone `email` e `initials`. Antes de escribirlo, se comprueba en los `.d.ts` de `BaseTransformer` cómo se compone un objeto anidado (ver `CLAUDE.md`, «Versiones por delante de la documentación conocida»).
- En el `create`, `assigneeId` se toma de `auth.getUserOrFail().id` y `status` no se asigna (lo pone el valor por defecto de la columna). Después se recarga la relación para devolver `assignee`.

### Frontend

- **`lib/types.ts`**: `TaskStatus = 'pending' | 'in_progress' | 'done'` y `Task` como espejo del transformer.
- **`lib/api.ts`**: `listTasks(token)`, `createTask(token, title)` y `updateTaskStatus(token, id, status)`. El tipo `method` de `request()` se amplía con `'PATCH'`. Se añade `title: 'el título'` a `FIELD_LABELS`, con lo que `required` produce «Falta rellenar el título.» y `maxLength` produce «el título no puede superar los 255 caracteres.». Se mantiene la minúscula inicial que ya tienen hoy los mensajes de auth, por coherencia y para no tocar la spec de `auth`.
- **Etiquetas de estado**: un mapa `TaskStatus → 'Pendiente' | 'En curso' | 'Hecho'` en un módulo pequeño de `lib/`. Los identificadores en inglés nunca se pintan.
- **Página `pages/tasks-page.tsx`**, en la ruta `/tasks` bajo `ProtectedRoute`: cabecera «Tareas del equipo» con un `Link` «Mi perfil», el formulario de creación, la lista, el estado vacío y los avisos. Reutiliza `Card`, `Input`, `Label`, `Button`, `Alert`, `FieldError` y `FullScreenLoader`, o un indicador equivalente.
- **Formulario de creación**: un `Input` y un `Button` «Crear tarea» que pasa a «Creando…». Reutiliza `useAuthForm(['title'])` para repartir errores entre campo y aviso general: el hook no tiene nada específico de auth salvo el nombre, así que se reutiliza tal cual y no se renombra para no tocar más ficheros. El título se envía con `trim()`, de modo que «solo espacios» llega como `""`, el bodyparser lo convierte en `null` y la respuesta es el mismo «Falta rellenar el título.» que con el campo vacío. **El `Input` no lleva atributo `maxLength`**, porque el navegador recortaría el texto en silencio, justo lo que E2-2 CA-3 prohíbe. Tras crear, la tarea devuelta se añade al final del estado local y el campo se vacía.
- **Cambio de estado**: en cada fila, un grupo de tres `Button` («Pendiente», «En curso», «Hecho»). El actual se muestra con la variante `default` y `aria-pressed="true"`, y los otros con `outline`. Un clic en otro estado actualiza la fila en el estado local de forma optimista y lanza el PATCH; si falla, se revierte y se muestra un `Alert`. *Alternativas:* un `<select>` nativo (dos interacciones, y un componente que no está en `ui/`) o un dropdown de Radix (añadiría un componente shadcn). El grupo de botones cumple «un gesto» y reutiliza `Button`.
- **Responsable**: `task.assignee.fullName ?? 'Sin nombre'`. El tipo `Task` ni siquiera contiene el email.
- **Sesión perdida (401)**: `AuthProvider` expone una función nueva, `expireSession(message)`, que hace `clearSession()` y fija `sessionError`. La página la llama cuando una operación de tareas devuelve un `ApiError` con estado 401, y `ProtectedRoute` redirige al login, que ya pinta `sessionError`. Como `useAuthForm.submit` atrapa todos los `ApiError` y no los relanza, en la creación el 401 se intercepta dentro de la acción que se le pasa a `submit`: esa acción llama a `expireSession` y vuelve sin relanzar el error, para que no se pinte como error del formulario.
- **Redirecciones**: en `app-routes.tsx`, la ruta comodín pasa a `/tasks`; en `public-only-route.tsx`, la redirección con sesión pasa a `/tasks`. El login y el registro no navegan a mano, sino que dependen de `PublicOnlyRoute`, así que ese cambio basta. En `profile-page.tsx` se añade un `Link` «Tareas del equipo».

## Risks / Trade-offs

- [Sin orden garantizado, SQLite devuelve normalmente las filas por orden de inserción, y la gente puede empezar a depender de él] → La spec dice explícitamente que el orden no forma parte del contrato, y PA-3 queda abierto en el proposal.
- [Orden local distinto del del servidor: la tarea creada se añade al final en el cliente, y al recargar podría salir en otra posición] → Aceptable mientras no haya regla de orden; se resolverá con PA-3.
- [Estados desincronizados entre personas, porque no hay refresco automático] → Fuera de alcance (E3-2). Un PATCH siempre fija el valor enviado (último en escribir gana) y no hay conflicto que detectar con transiciones libres.
- [El clic optimista puede mostrar durante un instante un estado que el servidor rechaza] → Se revierte y se avisa (escenario «El cambio falla»).
- [Mensaje con minúscula inicial («el título no puede superar…»)] → Se mantiene por coherencia con los mensajes de auth existentes. Corregir la capitalización es un cambio aparte, que modificaría la spec de `auth`.
- [Cambiar de responsable solo por API deja la capacidad sin uso en la interfaz] → Decisión explícita del usuario: no hay endpoint de equipo con el que construir un selector.
- [Delta MODIFIED de `auth` copiado de una spec cuyo PR (#2) aún está en revisión] → Si la revisión cambia esos tres requisitos, hay que rehacer el delta antes del archive (`openspec validate` detectará los encabezados que ya no casen).

## Migration Plan

- Migración aditiva (`create_tasks_table`), sin cambios en las tablas existentes. `node ace migration:run` la aplica y regenera `database/schema.ts`.
- **Rollback**: `node ace migration:rollback` elimina la tabla `tasks`, con pérdida de las tareas creadas. En el frontend basta con revertir el commit. Al ser una base SQLite local de desarrollo, no hay despliegue de producción implicado.
- Tras tocar rutas y controladores, se arranca el dev server para regenerar `backend/.adonisjs/` y se commitea el diff, como pide `CLAUDE.md`.
