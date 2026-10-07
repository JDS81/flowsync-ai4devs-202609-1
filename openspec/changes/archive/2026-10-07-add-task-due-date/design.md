# Design

## Context

Parte del vertical de tareas ya existente (ver `openspec/specs/tasks/spec.md`):
- **Backend**: tabla `tasks` con `title`, `status` (enum con CHECK) y `assignee_id`; modelo `Task` con `TASK_STATUSES`; validadores VineJS; `TaskTransformer`; y `TasksController` con `index`, `store` y `update` en un grupo con `middleware.auth()`.
- **Frontend**: `lib/api.ts` es el único punto de contacto con la API; `pages/tasks-page.tsx` es la lista; las rutas protegidas cuelgan de `ProtectedRoute`; y `expireSession` cierra la sesión ante un 401.

Motivación y alcance: ver `proposal.md`. Comportamiento: ver `specs/tasks/spec.md`.

Comprobado en el código antes de diseñar:
- `vine.date()` devuelve un `Date` a medianoche de la zona del servidor (`"2026-10-07"` → `2026-10-06T22:00Z` en Madrid), así que convertir el día de calendario a instante lo desplaza.
- `requiredIfMissing` trata `null` como ausente, de modo que `{ "dueDate": null }` en solitario fallaría como «nada que actualizar».
- Luxon (ya instalado en el backend) marca como inválida una zona inexistente (`DateTime.now().setZone('Mars/Olympus').isValid === false`).

## Goals / Non-Goals

**Goals:**

- Una sola implementación de la regla de vencimiento, en el dominio del backend, calculada en cada respuesta.
- Que el día de calendario no se desplace nunca por zonas horarias, ni al guardar ni al comparar.
- Cambios mínimos en la lista: solo el enlace del título.

**Non-Goals:**

- Columna `is_overdue`, jobs o procesos programados.
- Selector de fecha propio o de terceros.
- La pantalla de detalle completa (estado, responsable o título editables en ella).
- Tests.

## Decisions

### La fecha es texto `YYYY-MM-DD` de punta a punta

- **Columna** `due_date` de tipo `date`, nullable, añadida con una migración nueva (`alterTable`). En SQLite se guarda como texto. En el modelo se declara como `string | null`, sin `@column.date`, para que Lucid no la convierta en `DateTime` ni le aplique zona. Si el esquema generado la tipa de otra forma, se ajusta con una regla en `database/schema_rules.ts`, que es el mecanismo del proyecto para eso, en vez de editar `schema.ts`.
- **Validación**: `vine.string().regex(/^\d{4}-\d{2}-\d{2}$/)` más una regla propia que comprueba con Luxon (`DateTime.fromISO(value, { zone: 'utc' }).isValid`) que el día existe, de modo que `2026-02-30` se rechaza. Se acompaña de `.nullable().optional()`: con el `convertEmptyStringsToNull` del bodyparser, `""` llega como `null`, que significa quitar la fecha, y la clave ausente significa no tocarla.
- **Comparación**: con formato fijo `YYYY-MM-DD`, la comparación lexicográfica de cadenas equivale a la cronológica: `dueDate < today`.
- *Alternativa descartada*: `vine.date()` con `@column.date()`. Requiere fijar `utc` en todas partes, y un descuido devuelve el día anterior, que es justo la trampa de «un día de más» que la historia señala como su mayor riesgo.

### La regla vive en el modelo; el día de referencia llega por la petición

- `Task#isOverdueOn(today: string): boolean` devuelve `dueDate !== null && dueDate < today && status !== 'done'`. Es la única implementación de la regla.
- **Día de referencia**: un helper del backend lee `X-Timezone` y lo valida con un validador VineJS (`vine.create({ timezone: vine.string().optional().use(ianaZone()) })`, sobre `{ timezone: request.header('x-timezone')?.trim() || undefined }`). La normalización es imprescindible: `.optional()` solo trata `undefined` como ausente, y una cabecera vacía (`''`) llegaría a la regla de zona y daría 422 en vez de usar UTC. Si falta o está vacía, se usa `'UTC'`. Devuelve `DateTime.now().setZone(zone).toISODate()`. Al pasar por VineJS, el 422 sale con el mismo formato `{ errors: [...] }` que el resto de la API, con `field: 'timezone'`.
- **Transformer**: `TaskTransformer` recibe el día como argumento extra del constructor (`TaskTransformer.transform(task, today)`; `BaseTransformer.transform` admite `...rest`), expone `dueDate` tal cual y `isOverdue: this.resource.isOverdueOn(this.today)`. No se persiste nada.
- **Las cuatro acciones** (`index`, `show`, `store` y `update`) calculan el día de referencia al principio. Así, una zona inválida da 422 antes de crear o modificar nada, y el 401 de auth sigue yendo primero, por el middleware.
- *Alternativa descartada*: que el cliente envíe su fecha local. Se descarta por decisión del usuario: depende del reloj del cliente, mientras que la zona IANA solo depende del reloj del servidor.
- *Alternativa descartada*: un middleware que fije el día en `ctx`. Haría falta aumentar el tipo de `HttpContext` y aplicarlo solo al grupo de tareas; un helper explícito por acción es más legible.

### API

- **`GET /api/v1/tasks/:id`** con matcher numérico y `show`, que sigue el mismo patrón que `update`: `Task.find` + 404 con `{ errors: [...] }` (no `findOrFail`, que en modo debug devuelve el stack trace) y precarga del responsable limitada a `id` y `full_name`. Con ella son cuatro operaciones. Es la superficie mínima para «al abrir la tarea» (PA-6, abierto).
- **Creación**: el validador acepta además `dueDate` opcional y nullable; el resto de campos se siguen descartando.
- **Actualización**: `status` deja de llevar `requiredIfMissing`. El controlador comprueba que el cuerpo validado trae al menos una de las claves `status`, `assigneeId` o `dueDate` (con `'dueDate' in payload`, que distingue un `null` enviado de una clave ausente). Si no trae ninguna, lanza un error de validación de VineJS (`errors.E_VALIDATION_ERROR`) con el mismo formato que el resto. *Antes de implementarlo*, se comprueba en los `.d.ts` de VineJS si la salida conserva la clave con `null` y cómo se construye ese error; si no la conserva, se mira la clave en `request.body()`.
- **`isOverdue` en el cuerpo**: no está declarado en ningún validador, así que VineJS lo descarta.

### Frontend

- **`lib/api.ts`**: `request()` añade `X-Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone` en todas las llamadas (las de auth lo ignoran). Nuevas funciones `getTask(token, id)` y `updateTaskDueDate(token, id, dueDate: string | null)`. `FIELD_LABELS.dueDate = 'la fecha de vencimiento'`, y `translate` responde «Introduce una fecha válida.» a cualquier error sobre `dueDate`.
- **`lib/types.ts`**: `Task` gana `dueDate: string | null` e `isOverdue: boolean`. La lista no los usa.
- **Lista**: el título de cada fila pasa a ser un `Link` a `/tasks/:id`. No se pinta nada más.
- **Página `pages/task-detail-page.tsx`**, en `/tasks/:id` bajo `ProtectedRoute`. La componen:
  - una cabecera con «Volver a la lista»;
  - el título como texto;
  - un `Label` y un `Input type="date"` nativo («Fecha de vencimiento»);
  - un `Button` «Quitar fecha», solo si hay fecha;
  - la señal de vencida;
  - avisos.
  
  Solo usa componentes existentes y ninguna dependencia nueva.
- **Guardado automático**: en `onChange`, si el valor es una fecha completa (cadena no vacía), se envía. Si el input queda vacío con `validity.badInput` (fecha a medio escribir o inexistente), no se envía y se muestra «Introduce una fecha válida.». Si queda vacío sin `badInput` (lo han borrado con el control nativo), equivale a quitar la fecha. Se pinta lo que devuelve el servidor (`dueDate` e `isOverdue`), así que la señal siempre es el veredicto del backend. Si falla, se restaura el valor anterior y se avisa; un 401 llama a `expireSession`. *Alternativa descartada*: un botón «Guardar», que CA-16 excluye.
- **Señal de vencida**: un `Alert` con icono (`AlertCircleIcon`) y el texto «Vencida», con `role="status"`. No depende solo del color. Si `isOverdue` es falso no se pinta nada, y tampoco hay ningún aviso por no tener fecha.
- **404**: `ApiError` con estado 404 → «Esta tarea no existe.». Requiere distinguir el 404 en `toApiError`, que hoy lo convierte en el mensaje genérico del servidor. El backend ya responde el 404 de tareas con `{ errors: [...] }`.

## Risks / Trade-offs

- [Desplazamiento de un día por zonas horarias] → La fecha nunca se convierte a instante: es texto validado y comparado como texto, y el «hoy» se calcula una sola vez por petición en la zona indicada.
- [Zona del navegador inexistente para Luxon (navegadores antiguos o zonas obsoletas)] → La lectura falla con 422 y la pantalla muestra el aviso. Se acepta: `Intl` y Luxon comparten la base IANA del sistema.
- [Petición que cruza la medianoche] → Se evalúa con el día calculado al empezar a atender la petición. Diferencias de milisegundos son aceptables.
- [Colisiones: dos personas cambiando la fecha] → Gana la última escritura (PA-8, abierto).
- [`<input type="date">` se muestra distinto en cada navegador, y Safari antiguo lo trata como texto] → Si el navegador no lo soporta, el servidor valida el formato y responde 422 con el aviso junto al campo.
- [El escenario de la spec «Solo se actualizan estado y responsable» conserva su nombre aunque ahora también cubre `dueDate`] → OpenSpec exige mantener los escenarios existentes de un requisito MODIFIED. El texto del escenario sí está actualizado.
- [Pantalla mínima frente a la de detalle completa] → Es provisional (PA-6). Cuando llegue la completa, esta página crecerá en lugar de duplicarse.

## Migration Plan

- Migración aditiva `add_due_date_to_tasks` (`alterTable` + `date('due_date').nullable()`). Las tareas existentes quedan con `due_date` a `null`, es decir, válidas y sin vencer. `node ace migration:run` la aplica y regenera `database/schema.ts`.
- **Rollback**: `node ace migration:rollback` elimina la columna, y con ella las fechas guardadas, que se pierden. Se revierte el commit del frontend. Al ser la BD SQLite local de desarrollo, no hay producción implicada.
- Se regenera `.adonisjs/` arrancando el dev server y se commitea el diff.

## Open Questions

- PA-6, PA-7 y PA-8 quedan abiertos (ver `proposal.md`). Ninguno cambia lo que se construye en este change.
