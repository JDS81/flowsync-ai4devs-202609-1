# Spec Delta

## Purpose

Mantener una sola lista de tareas compartida por todo el equipo, en la que cada tarea muestra su título, su responsable y su estado, para saber de un vistazo quién está en qué; y permitir alimentarla creando tareas con solo un título y cambiando su estado sin salir de la lista.

## ADDED Requirements

### Requirement: Acceso a la API de tareas solo con sesión

El sistema SHALL exigir un token de sesión válido en `Authorization: Bearer <token>` para cualquier operación sobre tareas, y SHALL rechazar con 401 las peticiones que no lo lleven, sin devolver ninguna tarea.

#### Scenario: Petición sin sesión

- **WHEN** se lista, se crea o se actualiza una tarea sin token, con un token inexistente o con uno ya cerrado
- **THEN** el servidor responde 401 con `{ "errors": [ { "message": "Unauthorized access" } ] }`, no devuelve ninguna tarea y no crea ni modifica nada

#### Scenario: Cualquier cuenta tiene el mismo acceso

- **WHEN** cualquier persona registrada hace una operación sobre tareas con su token válido
- **THEN** el servidor la atiende igual que para cualquier otra cuenta, sin distinción de roles ni permisos especiales

### Requirement: Listado de todas las tareas por API

El sistema SHALL devolver en `GET /api/v1/tasks` todas las tareas del espacio, las mismas para cualquier cuenta que las pida, sin ordenarlas según ningún criterio garantizado.

#### Scenario: Listar tareas

- **WHEN** una persona con sesión pide la lista de tareas
- **THEN** el servidor responde 200 con `{ "data": [ ... ] }`, donde cada elemento es `{ "id", "title", "status", "assignee": { "id", "fullName" }, "createdAt", "updatedAt" }`

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
- **THEN** ninguna tarea cambia de estado, de responsable ni de ningún otro dato

#### Scenario: El orden no forma parte del contrato

- **WHEN** se pide la lista
- **THEN** las tareas pueden llegar en cualquier orden, y quien consuma la API no debe depender de él

### Requirement: Datos mínimos del responsable

El sistema SHALL exponer de la persona responsable de cada tarea únicamente su identificador y su nombre, nunca su email ni otros datos de su cuenta.

#### Scenario: Responsable con nombre

- **WHEN** se lista, se crea o se actualiza una tarea cuyo responsable tiene nombre
- **THEN** `assignee` contiene solo `id` y `fullName`, con su nombre

#### Scenario: Responsable sin nombre

- **WHEN** el responsable de la tarea no tiene nombre
- **THEN** `assignee.fullName` es `null` y no se incluye su email en su lugar

### Requirement: Creación de una tarea con solo el título

El sistema SHALL crear en `POST /api/v1/tasks` una tarea a partir únicamente de un `title`, y SHALL responder 201 con la tarea creada en el mismo formato que en el listado.

#### Scenario: Creación correcta

- **WHEN** una persona con sesión envía `{ "title": "Revisar la propuesta" }`
- **THEN** el servidor responde 201 con `{ "data": { "id", "title": "Revisar la propuesta", "status", "assignee", "createdAt", "updatedAt" } }`
- **THEN** la tarea aparece a partir de ese momento en el listado de cualquier cuenta

#### Scenario: Se descartan los espacios de los extremos

- **WHEN** se envía un título con espacios al principio o al final, como `"  Revisar la propuesta  "`
- **THEN** la tarea se guarda y se devuelve con el título `"Revisar la propuesta"`

#### Scenario: No se pueden elegir otros datos al crear

- **WHEN** el cuerpo de la creación incluye además un estado, un responsable u otros campos
- **THEN** el servidor los ignora y la tarea se crea igual que si solo se hubiera enviado el título

### Requirement: Responsable y estado por defecto al crear

El sistema SHALL crear toda tarea nueva con estado `pending` y con la cuenta que la crea como responsable.

#### Scenario: Nace pendiente

- **WHEN** se crea una tarea indicando solo el título
- **THEN** su `status` es `pending`

#### Scenario: Nace a nombre de quien la crea

- **WHEN** una persona crea una tarea indicando solo el título
- **THEN** su `assignee` es esa misma persona

### Requirement: Título obligatorio y con longitud máxima

El sistema SHALL rechazar con 422 la creación de una tarea sin título, con un título formado solo por espacios o con un título de más de 255 caracteres una vez descartados los espacios de los extremos, sin crear ninguna tarea y sin recortar el título.

#### Scenario: Sin título

- **WHEN** se intenta crear una tarea sin `title`, con `title` vacío o con `title` a `null`
- **THEN** el servidor responde 422 con un error sobre el campo `title` y no crea ninguna tarea

#### Scenario: Título solo con espacios

- **WHEN** se intenta crear una tarea con un título formado únicamente por espacios
- **THEN** el servidor responde 422 con un error sobre el campo `title` y no crea ninguna tarea

#### Scenario: Título de 255 caracteres

- **WHEN** se crea una tarea con un título de exactamente 255 caracteres
- **THEN** la tarea se crea con el título completo

#### Scenario: Título demasiado largo

- **WHEN** se intenta crear una tarea con un título de 256 caracteres o más, sin contar los espacios de los extremos
- **THEN** el servidor responde 422 con un error de regla `maxLength` sobre el campo `title`
- **THEN** no se crea ninguna tarea, tampoco una con el título recortado

### Requirement: Conjunto cerrado de estados

El sistema SHALL admitir para una tarea únicamente los estados `pending`, `in_progress` y `done`, y SHALL rechazar con 422 cualquier otro valor. No existe ninguna forma de añadir, renombrar ni eliminar estados.

#### Scenario: Estado desconocido

- **WHEN** se intenta actualizar una tarea con un estado que no es `pending`, `in_progress` ni `done`, como `"Hecho"`, `"blocked"` o `"DONE"`
- **THEN** el servidor responde 422 con un error sobre el campo `status` y la tarea no cambia

#### Scenario: Toda tarea está en exactamente un estado

- **WHEN** se lista cualquier tarea
- **THEN** su `status` es exactamente uno de `pending`, `in_progress` o `done`

### Requirement: Actualización de estado y responsable por API

El sistema SHALL permitir en `PATCH /api/v1/tasks/:id` cambiar el `status` y/o el `assigneeId` de cualquier tarea a cualquier persona con sesión, sea o no su responsable, y SHALL responder 200 con la tarea actualizada.

#### Scenario: Cambiar el estado

- **WHEN** una persona con sesión envía `{ "status": "in_progress" }` sobre una tarea existente
- **THEN** el servidor responde 200 con `{ "data": { ... } }` y la tarea tiene `status: "in_progress"`, también en listados posteriores

#### Scenario: Transiciones libres

- **WHEN** se cambia una tarea desde cualquiera de los tres estados a cualquiera de los otros dos, incluido de `done` a `pending` o a `in_progress`
- **THEN** el cambio se aplica

#### Scenario: Tarea de otra persona

- **WHEN** una persona cambia el estado o el responsable de una tarea cuyo responsable es otra cuenta
- **THEN** el cambio se aplica igual que sobre una tarea propia, sin error ni advertencia

#### Scenario: Cambiar el responsable

- **WHEN** se envía `{ "assigneeId": <id> }` con el identificador de una cuenta existente
- **THEN** el servidor responde 200 y la tarea tiene a esa cuenta como responsable

#### Scenario: Responsable inexistente o vacío

- **WHEN** `assigneeId` no corresponde a ninguna cuenta, no es un número entero o es `null`
- **THEN** el servidor responde 422 con un error sobre el campo `assigneeId` y la tarea no cambia

#### Scenario: Nada que actualizar

- **WHEN** el cuerpo no incluye ni `status` ni `assigneeId`
- **THEN** el servidor responde 422 y la tarea no cambia

#### Scenario: Solo se actualizan estado y responsable

- **WHEN** el cuerpo incluye además otros campos, como `title`
- **THEN** el servidor los ignora y solo aplica `status` y `assigneeId`

#### Scenario: Tarea inexistente

- **WHEN** se intenta actualizar una tarea con un identificador que no existe o que no es un número
- **THEN** el servidor responde 404 y no modifica ninguna tarea

### Requirement: Pantalla de la lista del equipo

La aplicación web SHALL ofrecer a la persona con sesión iniciada una pantalla «Tareas del equipo» con una sola lista, igual para todos, en la que cada fila muestra el título, el responsable y el estado de una tarea sin tener que abrirla.

#### Scenario: Ver la lista

- **WHEN** una persona con sesión abre la lista y hay tareas
- **THEN** ve todas las tareas del espacio, cada una con su título, el nombre de su responsable y su estado como «Pendiente», «En curso» o «Hecho»

#### Scenario: Una sola lista para todos

- **WHEN** una persona busca otras vistas de tareas en la aplicación
- **THEN** no existe ninguna vista «mis tareas» ni ninguna otra lista distinta de la del equipo

#### Scenario: Sin fechas ni presencia

- **WHEN** una persona recorre la lista
- **THEN** no ve fechas de vencimiento ni marcas de vencida, ni ninguna señal de quién está conectado o de actividad por persona

#### Scenario: Sin sesión no se ve ninguna tarea

- **WHEN** una persona sin sesión intenta abrir la lista
- **THEN** se le lleva a la pantalla de inicio de sesión sin mostrar ninguna tarea

#### Scenario: Cargando la lista

- **WHEN** la lista todavía se está pidiendo al servidor
- **THEN** se muestra un indicador de carga en lugar de la lista

#### Scenario: Error al cargar la lista

- **WHEN** el servidor no responde o responde con un error al pedir la lista
- **THEN** se muestra un aviso con el motivo, como «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.», en lugar de una lista vacía

### Requirement: Responsable identificado por su nombre en pantalla

La aplicación web SHALL identificar al responsable de cada tarea por su nombre, y SHALL mostrar «Sin nombre» cuando no lo tiene, sin mostrar nunca su email ni su identificador.

#### Scenario: Responsable con nombre

- **WHEN** el responsable de una tarea tiene nombre
- **THEN** la fila muestra ese nombre

#### Scenario: Responsable sin nombre

- **WHEN** el responsable de una tarea no tiene nombre
- **THEN** la fila muestra «Sin nombre», y en ningún lugar de la fila aparece su email ni su identificador

### Requirement: Lista vacía

La aplicación web SHALL explicar qué es la lista e invitar a crear la primera tarea cuando todavía no hay ninguna, en lugar de mostrar una lista vacía sin más.

#### Scenario: Todavía no hay tareas

- **WHEN** una persona abre la lista y no se ha creado ninguna tarea
- **THEN** ve un mensaje que explica que ahí aparecerán todas las tareas del equipo y la invita a crear la primera con el formulario de la propia pantalla

### Requirement: Crear una tarea desde la lista

La aplicación web SHALL permitir crear una tarea desde la propia pantalla de la lista con un formulario cuyo único campo es el título, sin pedir ni sugerir responsable, estado, fecha ni ningún otro dato.

#### Scenario: Crear con solo el título

- **WHEN** una persona escribe un título y pulsa «Crear tarea»
- **THEN** la tarea aparece en la lista, sin recargar ni navegar a otra parte, con su nombre como responsable y en estado «Pendiente»
- **THEN** el campo del título se vacía para poder apuntar otra

#### Scenario: El formulario solo pide el título

- **WHEN** una persona recorre el formulario de creación
- **THEN** el único campo es el título y no se ofrece ni se sugiere elegir responsable, estado, fecha ni ningún otro dato

#### Scenario: Envío en curso

- **WHEN** una persona envía el formulario de creación
- **THEN** el botón queda desactivado y su texto cambia a «Creando…» hasta que llega la respuesta

### Requirement: Avisos del título en pantalla

La aplicación web SHALL explicar en lenguaje corriente, junto al campo del título, por qué no se ha podido crear una tarea, sin añadir ninguna fila a la lista y sin recortar el texto escrito.

#### Scenario: Título vacío o solo con espacios

- **WHEN** una persona pulsa «Crear tarea» con el título vacío o formado solo por espacios
- **THEN** junto al campo se muestra «Falta rellenar el título.» y no aparece ninguna fila nueva en la lista

#### Scenario: Título demasiado largo

- **WHEN** una persona intenta crear una tarea con un título de más de 255 caracteres
- **THEN** junto al campo se muestra que el título no puede superar los 255 caracteres
- **THEN** el campo conserva el texto completo escrito, sin recortarlo, y no se crea ninguna tarea

#### Scenario: El campo no corta la escritura

- **WHEN** una persona escribe en el campo del título más de 255 caracteres
- **THEN** el campo admite todo lo escrito y el aviso llega al intentar crear la tarea

### Requirement: Cambiar el estado desde la fila

La aplicación web SHALL permitir cambiar el estado de cualquier tarea desde su propia fila con un solo gesto sobre el estado de destino, ofreciendo como únicos destinos «Pendiente», «En curso» y «Hecho», sin abrir la tarea, sin diálogos de confirmación y sin rellenar ningún campo.

#### Scenario: Cambio de estado

- **WHEN** una persona pulsa, en la fila de una tarea, un estado distinto del actual
- **THEN** la fila muestra el nuevo estado de inmediato, sin abrir la tarea ni pedir confirmación
- **THEN** el cambio queda guardado, de modo que al volver a abrir la lista la tarea sigue en ese estado

#### Scenario: El estado actual se distingue

- **WHEN** una persona mira los estados ofrecidos en una fila
- **THEN** ve exactamente «Pendiente», «En curso» y «Hecho», con el estado actual de la tarea destacado respecto a los otros dos

#### Scenario: Tarea de otra persona

- **WHEN** una persona cambia el estado de una tarea cuyo responsable es otra persona
- **THEN** el cambio se aplica igual que en una tarea propia, sin advertencias ni permisos especiales

#### Scenario: El cambio falla

- **WHEN** el servidor no responde o rechaza el cambio de estado
- **THEN** la fila vuelve a mostrar el estado anterior y se muestra un aviso con el motivo

#### Scenario: Sin cambio de responsable en pantalla

- **WHEN** una persona busca en la lista cómo cambiar el responsable de una tarea
- **THEN** la pantalla no ofrece ninguna forma de hacerlo

### Requirement: Navegación entre la lista y el perfil

La aplicación web SHALL enlazar la lista de tareas y el perfil entre sí.

#### Scenario: De la lista al perfil

- **WHEN** una persona está en la lista de tareas
- **THEN** tiene un enlace «Mi perfil» que la lleva a su perfil

#### Scenario: Del perfil a la lista

- **WHEN** una persona está en su perfil
- **THEN** tiene un enlace «Tareas del equipo» que la lleva a la lista

### Requirement: Sesión perdida mientras se usa la lista

La aplicación web SHALL cerrar la sesión en el navegador y llevar al inicio de sesión cuando el servidor deja de reconocer la sesión durante una operación sobre tareas.

#### Scenario: El servidor rechaza la sesión

- **WHEN** al cargar la lista, crear una tarea o cambiar un estado el servidor responde que la sesión no es válida
- **THEN** la sesión se olvida en el navegador y la persona llega al inicio de sesión con el aviso «Tu sesión ha caducado. Vuelve a iniciar sesión.»
