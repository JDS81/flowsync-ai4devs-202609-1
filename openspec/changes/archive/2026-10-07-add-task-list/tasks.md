# Tasks

## 1. Modelo de datos (backend)

- [x] 1.1 Crear con `node ace make:migration` la migración `create_tasks_table`: `id`, `title` string(255) no nulo, `status` enum `pending`/`in_progress`/`done` no nulo con valor por defecto `pending`, `assignee_id` entero no nulo con FK a `users.id` (sin cascade) y timestamps. Verificar que `node ace migration:run` termina sin errores y que `database/schema.ts` contiene `TaskSchema` con esas columnas (y ninguna de vencimiento).
- [x] 1.2 Crear el modelo `app/models/task.ts`, que extiende `TaskSchema`, exporta `TASK_STATUSES` y declara solo la relación `belongsTo` `assignee` con `User` mediante `assigneeId`. Verificar con `npm run typecheck`.

## 2. API de tareas (backend)

- [x] 2.1 Crear `app/validators/task.ts` con el validador de creación (`title` con trim, mínimo 1 y máximo 255) y el de actualización (`status` como enum de `TASK_STATUSES`, opcional y `requiredIfMissing('assigneeId')`; `assigneeId` como número entero que `exists` en `users.id`, opcional). Verificar con `npm run typecheck`.
- [x] 2.2 Comprobar en los `.d.ts` de `BaseTransformer` cómo se compone un objeto anidado y crear `app/transformers/task_transformer.ts` con `id`, `title`, `status`, `createdAt`, `updatedAt` y `assignee: { id, fullName }`, sin email ni iniciales. Verificar con `npm run typecheck`.
- [x] 2.3 Crear `TasksController` con `index` (todas las tareas precargando `assignee`, sin `orderBy`), `store` (responsable = usuario autenticado, estado por defecto, 201) y `update` (`findOrFail`, aplica solo `status`/`assigneeId`, recarga `assignee`). Todas las respuestas pasan por `serialize`. Verificar con `npm run typecheck`.
- [x] 2.4 Registrar en `start/routes.ts` un grupo `tasks` bajo `/api/v1` con `GET /tasks`, `POST /tasks` y `PATCH /tasks/:id` (matcher numérico), protegido con `middleware.auth()`. Arrancar `npm run dev` para regenerar `.adonisjs/` y verificar con `node ace list:routes` que aparecen exactamente esas tres rutas nuevas.
- [x] 2.5 Comprobar a mano con `curl` contra el dev server, con un token obtenido en `/auth/login`, los escenarios de la API de `specs/tasks/spec.md`: 401 sin token; listado vacío `{ data: [] }`; creación 201 con `pending` y el creador como responsable; título recortado; 422 con título vacío, solo espacios y de 256 caracteres (y creación correcta con 255); `status`/`assigneeId` ignorados al crear; PATCH a cada estado, incluido volver desde `done`; 422 con estado desconocido, con `assigneeId` inexistente o `null` y con el cuerpo vacío; 404 con id inexistente y no numérico; `assignee` sin email en todas las respuestas.
- [x] 2.6 Pasar `npm run lint` y `npm run typecheck` en `backend/` sin errores.

## 3. Cliente de API y tipos (frontend)

- [x] 3.1 Añadir a `lib/types.ts` `TaskStatus` y `Task` (con `assignee: { id: number; fullName: string | null }`), y crear en `lib/` el mapa de etiquetas `pending` → «Pendiente», `in_progress` → «En curso», `done` → «Hecho». Verificar con `npm run build`.
- [x] 3.2 Añadir a `lib/api.ts` `listTasks`, `createTask` y `updateTaskStatus` (ampliando `method` con `'PATCH'`), y la etiqueta `title: 'el título'` en `FIELD_LABELS`. Verificar con `npm run build`.
- [x] 3.3 Añadir `expireSession(message)` al contexto y a `AuthProvider` (cierra la sesión local y fija `sessionError`). Verificar con `npm run build`.

## 4. Pantalla de la lista (frontend)

- [x] 4.1 Crear `pages/tasks-page.tsx` con la cabecera «Tareas del equipo», el enlace «Mi perfil», el indicador de carga, el aviso de error de carga, el estado vacío (que explica la lista e invita a crear la primera tarea) y la lista, con título, responsable (`fullName ?? 'Sin nombre'`) y estado en castellano. Verificar en el navegador, con tareas y sin ellas, que no aparece ningún email, id, fecha ni señal de presencia.
- [x] 4.2 Añadir el formulario de creación, con un único campo de título sin `maxLength`, «Crear tarea» → «Creando…», `trim()` antes de enviar y errores junto al campo mediante `useAuthForm(['title'])`. Tras crear, la tarea se añade a la lista y el campo se vacía. Verificar en el navegador: que la tarea aparece sin recargar, en «Pendiente» y con el propio nombre; que con el título vacío o solo con espacios sale «Falta rellenar el título.»; y que un título de 256 caracteres muestra el aviso y conserva el texto completo.
- [x] 4.3 Añadir en cada fila el grupo de tres botones de estado, con el actual destacado (`aria-pressed`), cambio optimista y reversión con aviso si falla. Verificar en el navegador que el cambio es inmediato y sin diálogos, que persiste al recargar, que funciona sobre una tarea de otra cuenta, y que con el backend parado la fila vuelve al estado anterior y aparece el aviso.
- [x] 4.4 Llamar a `expireSession` ante un 401 en cualquier operación de tareas (en la creación, dentro de la acción que se pasa a `useAuthForm.submit`, que si no se tragaría el error). Verificar en el navegador que, tras invalidar el token (por ejemplo, haciendo logout por `curl` con el mismo token), cualquier acción lleva al login con «Tu sesión ha caducado. Vuelve a iniciar sesión.».

## 5. Rutas y navegación (frontend)

- [x] 5.1 Registrar `/tasks` bajo `ProtectedRoute` en `app-routes.tsx` y cambiar a `/tasks` el destino de la ruta comodín y de la redirección de `PublicOnlyRoute`. Verificar en el navegador: que el login y el registro llevan a la lista; que `/`, `/login` con sesión y cualquier dirección desconocida llevan a la lista; y que `/tasks` sin sesión lleva al login.
- [x] 5.2 Añadir en `profile-page.tsx` el enlace «Tareas del equipo». Verificar en el navegador la navegación de ida y vuelta entre la lista y el perfil.
- [x] 5.3 Pasar `npm run lint` y `npm run build` en `frontend/` sin errores.

## 6. Comprobación de integración

- [x] 6.1 Con dos cuentas en dos navegadores, una de ellas sin nombre, verificar los criterios de E3-1: que tras recargar las dos ven el mismo conjunto de tareas; que la tarea creada y asignada a la otra cuenta aparece en ambas; que la cuenta sin nombre se muestra como «Sin nombre»; y que no existe ninguna vista «mis tareas».
- [x] 6.2 Ejecutar `openspec validate add-task-list --strict` y verificar que el change es válido.
