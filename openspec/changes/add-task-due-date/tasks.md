# Tasks

## 1. Persistencia de la fecha (backend)

- [ ] 1.1 Crear con `node ace make:migration` la migración `add_due_date_to_tasks` (`alterTable` con `date('due_date').nullable()`; en `down`, `dropColumn`). Verificar que `node ace migration:run` termina limpio sobre la base que ya tiene tareas; que las existentes quedan con `due_date` a `null`; que `node ace migration:rollback` y un nuevo `migration:run` vuelven a funcionar; y que `database/schema.ts` regenerado tiene `dueDate` en `TaskSchema` sin haberlo editado a mano.
- [ ] 1.2 Asegurar que `dueDate` se tipa como `string | null`, sin conversión a `DateTime`, ajustándolo con `database/schema_rules.ts` si el generador lo tipa de otra forma. Verificar con `npm run typecheck` y con una lectura que devuelva `"YYYY-MM-DD"` sin desplazamiento.

## 2. Regla de vencimiento y día de referencia (backend)

- [ ] 2.1 Añadir `Task#isOverdueOn(today)` (fecha, anterior a hoy y no `done`). Verificar con `npm run typecheck` y, en `node ace repl`, los bordes: ayer → `true`; hoy, mañana o sin fecha → `false`; `done` con fecha pasada → `false`.
- [ ] 2.2 Crear el helper del día de referencia: lee `X-Timezone`, lo valida con VineJS y una regla de zona IANA basada en Luxon, usa UTC si falta o está vacía y devuelve `DateTime.now().setZone(zone).toISODate()`. Verificar con `npm run typecheck`.
- [ ] 2.3 Pasar el día de referencia a `TaskTransformer` como argumento extra y exponer `dueDate` (texto o `null`) e `isOverdue`. Verificar con `npm run typecheck`.

## 3. API (backend)

- [ ] 3.1 Ampliar los validadores: `dueDate` como texto `YYYY-MM-DD` validado como día existente, nullable y opcional, en la creación y en la actualización; quitar `requiredIfMissing` de `status`. Comprobar antes en los `.d.ts` cómo conserva VineJS una clave con `null` y cómo se lanza un `E_VALIDATION_ERROR`. Verificar con `npm run typecheck`.
- [ ] 3.2 Actualizar `TasksController`: el día de referencia en `index`, `store` y `update`; `dueDate` en `store` y en `update`; el 422 de «nada que actualizar» cuando no llega ninguna de las tres claves; y la nueva acción `show` (`find` + 404 con `{ errors }`, precargando solo `id` y `full_name` del responsable). Registrar `GET /tasks/:id` con matcher numérico en el grupo protegido. Arrancar el dev server para regenerar `.adonisjs/` y verificar con `node ace list:routes` que hay exactamente cuatro rutas de tareas.
- [ ] 3.3 Comprobar con `curl` contra el dev server los escenarios de API de `specs/tasks/spec.md`:
  - lectura individual 200, 404 con id inexistente y 404 con id no numérico;
  - `dueDate` e `isOverdue` en listar, leer, crear y actualizar;
  - crear sin fecha (`null`/`false`), con fecha futura y con fecha pasada (nace vencida);
  - poner, cambiar y quitar la fecha con `null` y con `""`;
  - 422 con `2026-02-30`, `2026-13-01`, `2026-10-0`, `2026-10-07T10:00` y un número, conservando la fecha anterior;
  - la regla: ayer, hoy, mañana, sin fecha, `done` con fecha pasada, pasar a `done` conservando la fecha, volver de `done` (vencida), aplazar y quitar;
  - reasignar sin tocar la fecha;
  - `isOverdue` enviado e ignorado;
  - `X-Timezone` válida, ausente (UTC) y desconocida (422 sin modificar nada);
  - dos zonas a la vez con veredictos distintos (por ejemplo, `Pacific/Kiritimati` y `Pacific/Pago_Pago` con la fecha de ayer en una de ellas);
  - 401 sin token en la lectura individual.
- [ ] 3.4 Pasar `npm run lint` y `npm run typecheck` en `backend/` sin errores.

## 4. Cliente de API (frontend)

- [ ] 4.1 Ampliar `Task` en `lib/types.ts` con `dueDate` e `isOverdue`; enviar `X-Timezone` en `request()`; añadir `getTask` y `updateTaskDueDate`; añadir la etiqueta y la traducción «Introduce una fecha válida.» para `dueDate`; y distinguir el 404 en `toApiError` como «Esta tarea no existe.». Verificar con `npm run build`.

## 5. Pantalla de la tarea (frontend)

- [ ] 5.1 Convertir el título de cada fila de la lista en un enlace a `/tasks/:id`, sin pintar nada más. Verificar en el navegador que al pulsar el título se abre la tarea, y que la lista no muestra fechas ni marcas aunque haya tareas con fecha y vencidas.
- [ ] 5.2 Crear `pages/task-detail-page.tsx` y registrar `/tasks/:id` bajo `ProtectedRoute`. Debe tener el título, el campo «Fecha de vencimiento», «Volver a la lista», el indicador de carga, «Esta tarea no existe.» y el aviso de error de carga, sin edición de título, estado ni responsable. Verificar en el navegador cada estado (los de carga y error, simulando las respuestas) y que `/tasks/:id` sin sesión lleva al login.
- [ ] 5.3 Implementar el guardado automático de la fecha, «Quitar fecha» sin confirmación (solo visible con fecha), «Introduce una fecha válida.» ante una fecha incompleta o rechazada, y la restauración con aviso si el guardado falla. Verificar en el navegador:
  - que al elegir una fecha queda guardada sin pulsar nada (sigue ahí al recargar);
  - que quitarla no abre ningún diálogo;
  - que una fecha incompleta no se envía y muestra el aviso;
  - que con el backend caído vuelve la fecha anterior;
  - que funciona sobre una tarea de otra cuenta.
- [ ] 5.4 Pintar la señal «Vencida», con icono y texto, solo cuando `isOverdue` es verdadero, y actualizarla con cada respuesta del servidor. Verificar en el navegador:
  - que aparece con la fecha de ayer y al poner una fecha pasada;
  - que no aparece con la fecha de hoy, con una fecha futura, sin fecha o en una tarea hecha;
  - que desaparece al aplazar o quitar la fecha;
  - que no hay ningún aviso sobre la falta de fecha.
- [ ] 5.5 Llamar a `expireSession` ante un 401 al abrir la tarea o al cambiar su fecha. Verificar en el navegador que, con el token invalidado, se llega al login con «Tu sesión ha caducado. Vuelve a iniciar sesión.».
- [ ] 5.6 Pasar `npm run lint` y `npm run build` en `frontend/` sin errores.

## 6. Comprobación de integración

- [ ] 6.1 Verificar en dos contextos de navegador con zonas horarias distintas (por ejemplo, `Pacific/Kiritimati` y `Pacific/Pago_Pago`) que la misma tarea se ve «Vencida» en uno y no en el otro, y que el flujo de creación sigue sin ofrecer la fecha.
- [ ] 6.2 Ejecutar `openspec validate add-task-due-date --strict` y verificar que el change es válido.
