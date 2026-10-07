# Proposal

## Why

Hoy una tarea no tiene forma de expresar un compromiso de plazo, y nadie descubre que algo se ha pasado de fecha hasta que es tarde. La historia FS-118 (RF-13, RF-14 y RF-15 del PRD) pide una fecha de vencimiento opcional y que, al abrir una tarea, se vea sin cálculo mental si está vencida, sin que la fecha invada la lista principal.

## What Changes

- **Fecha de vencimiento opcional** en la tarea: un día de calendario, sin hora (`YYYY-MM-DD`). Crear sin fecha sigue siendo el camino por defecto; la interfaz de creación no la ofrece ni la sugiere.
- **API**:
  - toda representación de una tarea incluye `dueDate` (`"YYYY-MM-DD"` o `null`) y `isOverdue` (booleano);
  - la creación acepta un `dueDate` opcional;
  - la actualización permite poner, cambiar o quitar la fecha (quitarla se hace enviando `dueDate` explícitamente vacío: `null` o `""`);
  - una fecha anterior a hoy se acepta, y la tarea nace o queda vencida;
  - una fecha inexistente o mal formada se rechaza con 422 y la tarea conserva la que tuviera.
- **Regla de vencimiento, decidida por el backend**: una tarea está vencida si y solo si tiene fecha, esa fecha es anterior a hoy y su estado no es `done`. `isOverdue` se calcula en cada lectura: no se persiste ni hay procesos nocturnos, y si el cliente lo envía, se ignora.
- **Día de referencia de quien mira**: el cliente envía su zona horaria IANA en la cabecera `X-Timezone` y el servidor calcula «hoy» en esa zona. Si no llega, usa UTC; si la zona no existe, responde 422.
- **Lectura individual nueva**: `GET /api/v1/tasks/:id`. Es la superficie mínima para «abrir la tarea» de la historia. Con ella, la API de tareas pasa de tres a cuatro operaciones.
- **Pantalla mínima de la tarea** (`/tasks/:id`, protegida): se llega pulsando el título en la lista y muestra el título, el campo de fecha, «Quitar fecha» y una señal explícita de «Vencida» que no depende solo del color. Los cambios se guardan solos, sin botón de guardar ni confirmación. No es la pantalla de detalle completa: ahí no se cambian el estado, el responsable ni el título.
- **La lista no cambia lo que muestra**: sigue con título, responsable y estado, sin fecha ni marca de vencida. Lo único nuevo es que el título enlaza a la tarea.

### Fuera de alcance

- Notificaciones, recordatorios, recurrencia, y ordenar o filtrar por fecha.
- La pantalla de detalle completa (editar el título, el estado o el responsable desde ella).
- Tests de cualquier tipo.

### Puntos abiertos

- **Vista de detalle (PA-6)**: la lectura individual y la pantalla mínima son una decisión provisional para cubrir «al abrir la tarea». La pantalla de detalle completa queda pendiente.
- **Volver de «Hecho» con la fecha pasada (PA-7)**: como las transiciones son libres, una tarea que vuelve de `done` con la fecha pasada vuelve a estar vencida, porque la regla se evalúa en cada lectura. Que esa vuelta deba permitirse sigue abierto.
- **Colisiones (PA-8)**: si dos personas cambian la fecha a la vez, gana la última en escribir; qué ve quien pierde sigue sin decidir.
- **Lista y vencimiento (PA-1)**: el vencimiento no se ve de un vistazo en la lista, por decisión del PRD.

## Capabilities

### New Capabilities

Ninguna: la fecha de vencimiento es parte de la capability de tareas.

### Modified Capabilities

- `tasks`: la representación de la tarea gana `dueDate` e `isOverdue`; la creación y la actualización aceptan la fecha; se añaden la lectura individual, el día de referencia por `X-Timezone`, la regla de vencimiento, la pantalla mínima de la tarea y el enlace desde la lista. La lista sigue sin mostrar fechas.

## Impact

- **Backend**:
  - migración aditiva con una columna `due_date` nullable en `tasks`, que mantiene válidas las tareas existentes, y regeneración del esquema;
  - la regla de vencimiento en el modelo;
  - un validador para la cabecera `X-Timezone`;
  - validadores de creación y actualización ampliados;
  - el transformer recibe el día de referencia;
  - un método `show` y una ruta nueva, con regeneración de `.adonisjs/`.
- **Frontend**:
  - en `lib/api.ts`, la cabecera `X-Timezone` en las llamadas de tareas, más `getTask` y `updateTaskDueDate`;
  - tipos ampliados y la nueva página `/tasks/:id`;
  - el título de la lista pasa a ser un enlace.
- **Dependencias**: ninguna nueva. Se usan `<input type="date">` nativo con el `Input` existente y Luxon, que ya está en el backend.
- **Datos**: la migración es reversible. El rollback elimina la columna, y con ella las fechas guardadas.
