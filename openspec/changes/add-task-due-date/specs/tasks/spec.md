# Spec Delta

## ADDED Requirements

### Requirement: Lectura individual de una tarea por API

El sistema SHALL devolver en `GET /api/v1/tasks/:id` una tarea concreta, en el mismo formato que en el listado, a cualquier persona con sesión.

#### Scenario: Leer una tarea

- **WHEN** una persona con sesión pide una tarea existente
- **THEN** el servidor responde 200 con `{ "data": { "id", "title", "status", "dueDate", "isOverdue", "assignee": { "id", "fullName" }, "createdAt", "updatedAt" } }`

#### Scenario: Tarea inexistente

- **WHEN** se pide una tarea con un identificador que no existe o que no es un número
- **THEN** el servidor responde 404

#### Scenario: Leer no modifica nada

- **WHEN** se lee una tarea cualquier número de veces
- **THEN** la tarea no cambia de estado, de responsable, de fecha ni de ningún otro dato

### Requirement: Día de referencia de quien consulta

El sistema SHALL tomar como «hoy», para decidir el vencimiento, el día actual en la zona horaria IANA indicada en la cabecera `X-Timezone` de la petición, y SHALL usar UTC cuando la cabecera falta o está vacía.

#### Scenario: Zona indicada

- **WHEN** una petición sobre tareas lleva `X-Timezone: America/Bogota`
- **THEN** «hoy» es el día actual en Bogotá en el momento de atender la petición

#### Scenario: Sin zona

- **WHEN** una petición sobre tareas no lleva `X-Timezone` o la lleva vacía
- **THEN** «hoy» es el día actual en UTC, y la respuesta incluye igualmente `isOverdue`

#### Scenario: Zona desconocida

- **WHEN** una petición para listar, leer, crear o actualizar tareas lleva una zona que no existe, como `X-Timezone: Mars/Olympus`
- **THEN** el servidor responde 422 con un error que señala la zona horaria, sin crear ni modificar nada

### Requirement: Fecha de vencimiento de una tarea

El sistema SHALL permitir que una tarea tenga o no una fecha de vencimiento, expresada como día de calendario sin hora en formato `YYYY-MM-DD`, y SHALL permitir ponerla, cambiarla y quitarla al crear o actualizar.

#### Scenario: Poner o cambiar la fecha

- **WHEN** se actualiza una tarea con `{ "dueDate": "2026-12-15" }`
- **THEN** el servidor responde 200 y la tarea tiene `dueDate: "2026-12-15"`, también en lecturas posteriores

#### Scenario: Quitar la fecha

- **WHEN** se actualiza una tarea con fecha enviando `{ "dueDate": null }` o `{ "dueDate": "" }`
- **THEN** el servidor responde 200 y la tarea queda con `dueDate: null` y `isOverdue: false`

#### Scenario: Fecha anterior a hoy

- **WHEN** se crea o se actualiza una tarea no hecha con una fecha anterior al día de referencia
- **THEN** el servidor la acepta sin error y la tarea queda vencida

#### Scenario: Fecha inválida

- **WHEN** `dueDate` no es un día de calendario existente en formato `YYYY-MM-DD`, por ejemplo `"2026-02-30"`, `"2026-13-01"`, `"2026-10-0"`, `"2026-10-07T10:00"` o un número
- **THEN** el servidor responde 422 con un error sobre el campo `dueDate` y la tarea conserva la fecha que tuviera

#### Scenario: Cambiar el estado no toca la fecha

- **WHEN** se cambia el estado de una tarea con fecha, también a `done`
- **THEN** la fecha se mantiene sin ningún cambio

### Requirement: Regla de vencimiento

El sistema SHALL exponer en toda representación de una tarea un booleano `isOverdue` que es verdadero si y solo si la tarea tiene fecha de vencimiento, esa fecha es anterior al día de referencia y su estado no es `done`.

#### Scenario: Fecha de ayer, no hecha

- **WHEN** una tarea en `pending` o `in_progress` tiene como fecha el día anterior al de referencia
- **THEN** `isOverdue` es `true`

#### Scenario: Fecha de hoy

- **WHEN** una tarea no hecha tiene como fecha el propio día de referencia
- **THEN** `isOverdue` es `false`

#### Scenario: Fecha futura

- **WHEN** una tarea tiene una fecha posterior al día de referencia
- **THEN** `isOverdue` es `false`

#### Scenario: Sin fecha

- **WHEN** una tarea no tiene fecha, por antigua y pendiente que sea
- **THEN** `isOverdue` es `false`

#### Scenario: Una tarea hecha nunca está vencida

- **WHEN** una tarea en `done` tiene una fecha anterior al día de referencia
- **THEN** `isOverdue` es `false`

#### Scenario: Pasar a hecha

- **WHEN** una tarea vencida pasa a `done`
- **THEN** la respuesta trae `isOverdue: false` y la misma `dueDate` que antes

#### Scenario: Aplazar o quitar la fecha resuelve el vencimiento

- **WHEN** a una tarea vencida se le pone una fecha igual o posterior al día de referencia, o se le quita la fecha
- **THEN** la respuesta trae `isOverdue: false`

#### Scenario: Volver de hecha con la fecha pasada

- **WHEN** una tarea en `done` con fecha anterior al día de referencia vuelve a `pending` o a `in_progress`
- **THEN** la respuesta trae `isOverdue: true`

### Requirement: Vencimiento calculado en cada lectura

El sistema SHALL calcular `isOverdue` en el momento de responder cada petición, sin guardarlo, y SHALL ignorar cualquier `isOverdue` que envíe el cliente.

#### Scenario: Vence sola con el paso del día

- **WHEN** una tarea no hecha tiene como fecha el día de hoy y se vuelve a consultar después de la medianoche en la zona de referencia, sin que nadie la haya modificado
- **THEN** la respuesta trae `isOverdue: true`

#### Scenario: Dos zonas horarias a la vez

- **WHEN** una tarea no hecha tiene una fecha que ya pasó en una zona horaria pero que todavía es hoy en otra, y se consulta a la vez desde ambas
- **THEN** la consulta desde la primera zona recibe `isOverdue: true` y la de la segunda recibe `isOverdue: false`

#### Scenario: El cliente no puede fijar el vencimiento

- **WHEN** el cuerpo de una creación o actualización incluye `isOverdue`
- **THEN** el servidor lo ignora y la respuesta trae el valor calculado por la regla

### Requirement: Abrir una tarea desde la lista

La aplicación web SHALL permitir abrir cada tarea pulsando su título en la lista, sin que la lista muestre fechas ni marcas de vencimiento.

#### Scenario: Abrir una tarea

- **WHEN** una persona pulsa el título de una tarea en la lista
- **THEN** llega a la pantalla de esa tarea

#### Scenario: La lista no muestra fechas

- **WHEN** hay tareas con fecha, algunas vencidas, y una persona mira la lista
- **THEN** no ve ninguna fecha ni marca de vencimiento en ninguna fila, que siguen mostrando solo título, responsable y estado

### Requirement: Pantalla mínima de la tarea

La aplicación web SHALL ofrecer a la persona con sesión una pantalla de cada tarea con su título, su fecha de vencimiento y, si está vencida, la señal de vencimiento, más un enlace de vuelta a la lista; y SHALL no ofrecer en ella ninguna otra edición.

#### Scenario: Ver una tarea

- **WHEN** una persona abre una tarea
- **THEN** ve su título, el campo «Fecha de vencimiento» con la fecha que tenga (o vacío si no tiene) y un enlace «Volver a la lista»

#### Scenario: Solo se edita la fecha

- **WHEN** una persona recorre la pantalla de la tarea
- **THEN** no hay ninguna forma de cambiar ahí el título, el estado ni el responsable

#### Scenario: Cargando la tarea

- **WHEN** la tarea todavía se está pidiendo al servidor
- **THEN** se muestra un indicador de carga

#### Scenario: Tarea que no existe

- **WHEN** una persona abre la dirección de una tarea que no existe
- **THEN** ve el aviso «Esta tarea no existe.» y el enlace «Volver a la lista»

#### Scenario: Error al cargar la tarea

- **WHEN** el servidor no responde o responde con un error al pedir la tarea
- **THEN** se muestra un aviso con el motivo, como «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.»

#### Scenario: Sin sesión

- **WHEN** una persona sin sesión abre la dirección de una tarea
- **THEN** se le lleva al inicio de sesión sin mostrar la tarea

### Requirement: Poner, cambiar y quitar la fecha en pantalla

La aplicación web SHALL guardar la fecha de vencimiento en cuanto se elige o se quita, sin botón de guardar ni confirmación, y SHALL reflejar al instante la fecha y la condición de vencida devueltas por el servidor.

#### Scenario: Poner o cambiar la fecha

- **WHEN** una persona elige una fecha completa en el campo «Fecha de vencimiento»
- **THEN** el cambio se guarda sin pulsar nada más, y la pantalla refleja la nueva fecha y si la tarea queda vencida, sin recargar ni reabrir la tarea

#### Scenario: Quitar la fecha sin confirmación

- **WHEN** una persona pulsa «Quitar fecha» en una tarea con fecha
- **THEN** la tarea queda sin fecha y sin señal de vencida, sin ningún diálogo de confirmación

#### Scenario: Quitar solo aparece con fecha

- **WHEN** la tarea no tiene fecha
- **THEN** no se muestra «Quitar fecha» ni ningún aviso o indicación de que le falte una

#### Scenario: Fecha incompleta o inválida

- **WHEN** el campo contiene una fecha incompleta o inexistente, o el servidor la rechaza
- **THEN** junto al campo se muestra «Introduce una fecha válida.» y la tarea conserva en el servidor la fecha que tuviera

#### Scenario: El guardado falla

- **WHEN** el servidor no responde al guardar la fecha
- **THEN** se muestra un aviso con el motivo y la pantalla vuelve a mostrar la fecha anterior

#### Scenario: Cualquier tarea

- **WHEN** una persona cambia la fecha de una tarea cuyo responsable es otra persona
- **THEN** el cambio se aplica igual que en una tarea propia, sin advertencias

#### Scenario: Ninguna fecha al crear

- **WHEN** una persona crea una tarea desde la lista
- **THEN** el flujo de creación no ofrece ni sugiere ponerle fecha, y la tarea nace sin ella

### Requirement: Señal de tarea vencida

La aplicación web SHALL indicar explícitamente, en la pantalla de la tarea, que la tarea está vencida cuando el servidor la da por vencida, con un texto propio que no dependa solo del color.

#### Scenario: Tarea vencida

- **WHEN** una persona abre una tarea vencida, o la deja vencida al cambiar la fecha
- **THEN** junto a la fecha ve la indicación «Vencida», con texto e icono, sin tener que comparar la fecha con el día de hoy

#### Scenario: Tarea no vencida

- **WHEN** la tarea vence hoy, vence en el futuro, no tiene fecha o está hecha
- **THEN** no se muestra ninguna indicación de vencimiento

#### Scenario: Según el día de quien mira

- **WHEN** una persona abre una tarea cuya fecha es anterior a su propio día, según la zona horaria de su navegador
- **THEN** la ve vencida, aunque en otras zonas todavía sea ese día

## RENAMED Requirements

- FROM: `### Requirement: Creación de una tarea con solo el título`
- TO: `### Requirement: Creación de una tarea por API`
- FROM: `### Requirement: Actualización de estado y responsable por API`
- TO: `### Requirement: Actualización de una tarea por API`

## MODIFIED Requirements

### Requirement: Acceso a la API de tareas solo con sesión

El sistema SHALL exigir un token de sesión válido en `Authorization: Bearer <token>` para cualquier operación sobre tareas, y SHALL rechazar con 401 las peticiones que no lo lleven, sin devolver ninguna tarea.

#### Scenario: Petición sin sesión

- **WHEN** se lista, se lee, se crea o se actualiza una tarea sin token, con un token inexistente o con uno ya cerrado
- **THEN** el servidor responde 401 con `{ "errors": [ { "message": "Unauthorized access" } ] }`, no devuelve ninguna tarea y no crea ni modifica nada

#### Scenario: Cualquier cuenta tiene el mismo acceso

- **WHEN** cualquier persona registrada hace una operación sobre tareas con su token válido
- **THEN** el servidor la atiende igual que para cualquier otra cuenta, sin distinción de roles ni permisos especiales

### Requirement: Listado de todas las tareas por API

El sistema SHALL devolver en `GET /api/v1/tasks` todas las tareas del espacio, las mismas para cualquier cuenta que las pida, sin ordenarlas según ningún criterio garantizado.

#### Scenario: Listar tareas

- **WHEN** una persona con sesión pide la lista de tareas
- **THEN** el servidor responde 200 con `{ "data": [ ... ] }`, donde cada elemento es `{ "id", "title", "status", "dueDate", "isOverdue", "assignee": { "id", "fullName" }, "createdAt", "updatedAt" }`, con `dueDate` como `"YYYY-MM-DD"` o `null`

#### Scenario: El contenido no depende de quién lo pide

- **WHEN** dos cuentas distintas piden la lista sin que nadie haya cambiado nada entre medias
- **THEN** ambas reciben exactamente el mismo conjunto de tareas, con los mismos datos

#### Scenario: Tareas asignadas a otras personas

- **WHEN** otra persona ha creado una tarea y es su responsable
- **THEN** esa tarea aparece en la lista de cualquier otra cuenta

#### Scenario: No hay tareas privadas

- **WHEN** se crea una tarea por cualquier vía, con cualquier cuerpo de petición
- **THEN** la tarea aparece en el listado de todas las cuentas, porque no existe ningún dato ni opción que la oculte a otras

#### Scenario: Espacio sin tareas

- **WHEN** no se ha creado ninguna tarea
- **THEN** el servidor responde 200 con `{ "data": [] }`

#### Scenario: Listar no modifica nada

- **WHEN** se pide la lista cualquier número de veces
- **THEN** ninguna tarea cambia de estado, de responsable, de fecha de vencimiento ni de ningún otro dato

#### Scenario: El orden no forma parte del contrato

- **WHEN** se pide la lista
- **THEN** las tareas pueden llegar en cualquier orden, y quien consuma la API no debe depender de él

### Requirement: Datos mínimos del responsable

El sistema SHALL exponer de la persona responsable de cada tarea únicamente su identificador y su nombre, nunca su email ni otros datos de su cuenta.

#### Scenario: Responsable con nombre

- **WHEN** se lista, se lee, se crea o se actualiza una tarea cuyo responsable tiene nombre
- **THEN** `assignee` contiene solo `id` y `fullName`, con su nombre

#### Scenario: Responsable sin nombre

- **WHEN** el responsable de la tarea no tiene nombre
- **THEN** `assignee.fullName` es `null` y no se incluye su email en su lugar

### Requirement: Creación de una tarea por API

El sistema SHALL crear en `POST /api/v1/tasks` una tarea a partir de un `title` obligatorio y, opcionalmente, de un `dueDate`, y SHALL responder 201 con la tarea creada en el mismo formato que en el listado.

#### Scenario: Creación correcta

- **WHEN** una persona con sesión envía `{ "title": "Revisar la propuesta" }`
- **THEN** el servidor responde 201 con `{ "data": { "id", "title": "Revisar la propuesta", "status", "dueDate": null, "isOverdue": false, "assignee", "createdAt", "updatedAt" } }`
- **THEN** la tarea aparece a partir de ese momento en el listado de cualquier cuenta

#### Scenario: Se descartan los espacios de los extremos

- **WHEN** se envía un título con espacios al principio o al final, como `"  Revisar la propuesta  "`
- **THEN** la tarea se guarda y se devuelve con el título `"Revisar la propuesta"`

#### Scenario: No se pueden elegir otros datos al crear

- **WHEN** el cuerpo de la creación incluye además un estado, un responsable, `isOverdue` u otros campos distintos de `dueDate`
- **THEN** el servidor los ignora y la tarea se crea igual que si no se hubieran enviado

#### Scenario: Crear sin fecha es el camino por defecto

- **WHEN** se crea una tarea sin `dueDate`
- **THEN** la tarea queda sin fecha de vencimiento (`dueDate: null`) y no está vencida

#### Scenario: Crear con fecha

- **WHEN** se crea una tarea con `{ "title": "Entregar informe", "dueDate": "2026-12-15" }`
- **THEN** la tarea se crea con `dueDate: "2026-12-15"`

### Requirement: Actualización de una tarea por API

El sistema SHALL permitir en `PATCH /api/v1/tasks/:id` cambiar el `status`, el `assigneeId` y/o el `dueDate` de cualquier tarea a cualquier persona con sesión, sea o no su responsable, y SHALL responder 200 con la tarea actualizada.

#### Scenario: Cambiar el estado

- **WHEN** una persona con sesión envía `{ "status": "in_progress" }` sobre una tarea existente
- **THEN** el servidor responde 200 con `{ "data": { ... } }` y la tarea tiene `status: "in_progress"`, también en listados posteriores

#### Scenario: Transiciones libres

- **WHEN** se cambia una tarea desde cualquiera de los tres estados a cualquiera de los otros dos, incluido de `done` a `pending` o a `in_progress`
- **THEN** el cambio se aplica

#### Scenario: Tarea de otra persona

- **WHEN** una persona cambia el estado, el responsable o la fecha de vencimiento de una tarea cuyo responsable es otra cuenta
- **THEN** el cambio se aplica igual que sobre una tarea propia, sin error ni advertencia

#### Scenario: Cambiar el responsable

- **WHEN** se envía `{ "assigneeId": <id> }` con el identificador de una cuenta existente
- **THEN** el servidor responde 200 y la tarea tiene a esa cuenta como responsable

#### Scenario: Responsable inexistente o vacío

- **WHEN** `assigneeId` no corresponde a ninguna cuenta, no es un número entero o es `null`
- **THEN** el servidor responde 422 con un error sobre el campo `assigneeId` y la tarea no cambia

#### Scenario: Nada que actualizar

- **WHEN** el cuerpo no incluye ni `status`, ni `assigneeId`, ni `dueDate`
- **THEN** el servidor responde 422 y la tarea no cambia

#### Scenario: Solo se actualizan estado y responsable

- **WHEN** el cuerpo incluye además otros campos, como `title` o `isOverdue`
- **THEN** el servidor los ignora y solo aplica `status`, `assigneeId` y `dueDate`

#### Scenario: Tarea inexistente

- **WHEN** se intenta actualizar una tarea con un identificador que no existe o que no es un número
- **THEN** el servidor responde 404 y no modifica ninguna tarea

#### Scenario: Reasignar no toca la fecha

- **WHEN** se cambia el responsable de una tarea con fecha de vencimiento
- **THEN** la fecha y su condición de vencida se mantienen igual

### Requirement: Sesión perdida mientras se usa la lista

La aplicación web SHALL cerrar la sesión en el navegador y llevar al inicio de sesión cuando el servidor deja de reconocer la sesión durante una operación sobre tareas.

#### Scenario: El servidor rechaza la sesión

- **WHEN** al cargar la lista, crear una tarea, cambiar un estado, abrir una tarea o cambiar su fecha el servidor responde que la sesión no es válida
- **THEN** la sesión se olvida en el navegador y la persona llega al inicio de sesión con el aviso «Tu sesión ha caducado. Vuelve a iniciar sesión.»
