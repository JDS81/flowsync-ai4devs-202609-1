# auth Specification

## Purpose

Permitir que una persona cree una cuenta en FlowSync con email y contraseña, inicie y cierre sesión, y consulte su perfil, tanto a través de la API HTTP como desde la aplicación web. La sesión se representa con un token opaco que el navegador conserva entre visitas mientras el servidor lo siga reconociendo.

## Requirements

### Requirement: Registro de cuenta por API

El sistema SHALL aceptar en `POST /api/v1/auth/signup` un cuerpo JSON con `fullName`, `email`, `password` y `passwordConfirmation`, crear la cuenta si los datos son válidos y devolver en la misma respuesta la cuenta creada y un token de sesión nuevo, de modo que no haga falta un inicio de sesión aparte.

#### Scenario: Registro correcto

- **WHEN** se envía un nombre, un email con formato válido de como máximo 254 caracteres que no corresponde a ninguna cuenta, una contraseña de 8 a 32 caracteres y la misma contraseña en `passwordConfirmation`
- **THEN** el servidor responde 200 con `{ "data": { "user": { "id", "fullName", "email", "createdAt", "updatedAt", "initials" }, "token": "<token>" } }`, la cuenta queda creada y el token sirve desde ese momento para las peticiones autenticadas

#### Scenario: La respuesta nunca incluye la contraseña

- **WHEN** el registro tiene éxito
- **THEN** el objeto `user` de la respuesta no contiene la contraseña ni ningún derivado de ella

#### Scenario: Registro sin nombre

- **WHEN** se envía `fullName` con valor `null` o como cadena vacía, y el resto de datos son válidos
- **THEN** la cuenta se crea con `fullName: null`

#### Scenario: Falta la clave del nombre

- **WHEN** el cuerpo de la petición no incluye la clave `fullName`
- **THEN** el servidor responde 422 con un error de regla `required` sobre el campo `fullName` y no crea la cuenta

#### Scenario: El servidor no recorta el nombre

- **WHEN** se envía por API un `fullName` con espacios al principio o al final
- **THEN** el nombre se guarda y se devuelve tal cual, con esos espacios

#### Scenario: Email ya registrado

- **WHEN** se envía un email idéntico, carácter a carácter, al de una cuenta existente
- **THEN** el servidor responde 422 con un error de regla `database.unique` sobre el campo `email` y no crea ninguna cuenta

#### Scenario: Email igual salvo mayúsculas

- **WHEN** existe una cuenta con `Ana@example.com` y se registra `ana@example.com`
- **THEN** el servidor acepta el registro y crea una segunda cuenta independiente

#### Scenario: Datos con formato inválido

- **WHEN** el email no tiene formato de email o supera 254 caracteres, la contraseña tiene menos de 8 o más de 32 caracteres, la confirmación no cumple esa misma longitud o no coincide con la contraseña, o falta alguno de esos tres campos
- **THEN** el servidor responde 422 con `{ "errors": [ { "message", "rule", "field", ... } ] }`, con como máximo un error por campo, y no crea la cuenta

### Requirement: Inicio de sesión por API

El sistema SHALL aceptar en `POST /api/v1/auth/login` un cuerpo JSON con `email` y `password` y, si corresponden a una cuenta existente, abrir una sesión nueva y devolver la cuenta y su token.

#### Scenario: Credenciales correctas

- **WHEN** se envían el email y la contraseña de una cuenta existente
- **THEN** el servidor responde 200 con `{ "data": { "user": { ... }, "token": "<token>" } }` y el token es distinto del de cualquier sesión anterior

#### Scenario: Credenciales incorrectas

- **WHEN** el email no corresponde a ninguna cuenta, o la contraseña no es la de esa cuenta
- **THEN** el servidor responde 400 con `{ "errors": [ { "message": "Invalid user credentials" } ] }`, idéntico en ambos casos y sin indicar qué campo falla

#### Scenario: El email distingue mayúsculas

- **WHEN** la cuenta se registró como `Ana@example.com` y se intenta entrar con `ana@example.com` y la contraseña correcta
- **THEN** el servidor responde 400 como credenciales incorrectas

#### Scenario: Petición mal formada

- **WHEN** el email falta, no tiene formato de email o supera 254 caracteres, o la contraseña falta o es una cadena vacía
- **THEN** el servidor responde 422 con los errores por campo y no comprueba las credenciales

#### Scenario: La longitud de la contraseña no se valida al entrar

- **WHEN** se intenta entrar con una contraseña de cualquier longitud distinta de cero, incluso fuera del rango de 8 a 32 caracteres
- **THEN** el servidor no responde 422 por la longitud, sino que comprueba las credenciales y responde 200 o 400 según correspondan

### Requirement: Consulta del perfil por API

El sistema SHALL devolver en `GET /api/v1/account/profile` los datos de la cuenta dueña del token enviado en la cabecera `Authorization: Bearer <token>`.

#### Scenario: Perfil con token válido

- **WHEN** se pide el perfil con un token válido
- **THEN** el servidor responde 200 con `{ "data": { "id", "fullName", "email", "createdAt", "updatedAt", "initials" } }`, sin la contraseña

#### Scenario: Iniciales con nombre de dos o más palabras

- **WHEN** el nombre de la cuenta tiene al menos dos palabras separadas por un único espacio, como `Ana Pérez Gil`
- **THEN** `initials` es la primera letra de las dos primeras palabras en mayúsculas (`AP`)

#### Scenario: Iniciales con nombre de una sola palabra

- **WHEN** el nombre es una sola palabra, como `Ana`
- **THEN** `initials` son sus dos primeras letras en mayúsculas (`AN`), o una sola si la palabra tiene una única letra

#### Scenario: Iniciales con palabras separadas por varios espacios

- **WHEN** las dos primeras palabras del nombre están separadas por más de un espacio, como `Ana  Pérez`
- **THEN** `initials` se calcula como si el nombre fuera una sola palabra (`AN`)

#### Scenario: Iniciales con nombre que empieza por espacio

- **WHEN** el nombre guardado empieza por un espacio o está formado solo por espacios
- **THEN** `initials` es una cadena vacía

#### Scenario: Iniciales con nombre que termina en espacio

- **WHEN** el nombre guardado es una sola palabra seguida de un espacio, como `Ana `
- **THEN** `initials` son las dos primeras letras de esa palabra en mayúsculas (`AN`)

#### Scenario: Iniciales sin nombre

- **WHEN** la cuenta no tiene nombre
- **THEN** `initials` son, en mayúsculas, la primera letra de lo que va antes de la arroba del email y la primera de lo que va después (`jdoe@example.com` → `JE`)

### Requirement: Cierre de sesión por API

El sistema SHALL invalidar en `POST /api/v1/account/logout` únicamente el token con el que se hace la petición.

#### Scenario: Cerrar la sesión actual

- **WHEN** se llama al cierre de sesión con un token válido
- **THEN** el servidor responde 200 con `{ "message": "Logged out successfully" }`, sin el envoltorio `data`
- **THEN** cualquier petición posterior con ese token recibe 401

#### Scenario: Las demás sesiones siguen abiertas

- **WHEN** la misma cuenta tiene varios tokens y se cierra la sesión con uno de ellos
- **THEN** los demás tokens siguen siendo válidos

### Requirement: Protección de los endpoints de cuenta

El sistema SHALL rechazar las peticiones al perfil y al cierre de sesión que no lleven un token válido, sin devolver ningún dato de cuenta.

#### Scenario: Petición sin token o con token no válido

- **WHEN** se pide el perfil o el cierre de sesión sin cabecera `Authorization`, con un esquema distinto de `Bearer`, o con un token inexistente o ya cerrado
- **THEN** el servidor responde 401 con `{ "errors": [ { "message": "Unauthorized access" } ] }`

#### Scenario: Registro e inicio de sesión no exigen token

- **WHEN** se llama al registro o al inicio de sesión sin token
- **THEN** el servidor procesa la petición con normalidad

#### Scenario: Respuestas siempre en JSON

- **WHEN** se hace cualquier petición a estos endpoints, aunque la cabecera `Accept` pida otro formato
- **THEN** el cuerpo de la respuesta, incluidas las de error, es JSON

### Requirement: Sesiones simultáneas y sin caducidad

El sistema SHALL tratar cada registro o inicio de sesión como una sesión independiente que permanece válida hasta que se cierra explícitamente.

#### Scenario: Varias sesiones a la vez

- **WHEN** una misma cuenta inicia sesión varias veces, por ejemplo desde navegadores distintos
- **THEN** cada inicio de sesión devuelve un token distinto y todos son válidos a la vez

#### Scenario: Un token no caduca por tiempo

- **WHEN** se usa un token que no se ha cerrado, sea cual sea el tiempo transcurrido desde que se emitió
- **THEN** el servidor lo sigue aceptando

### Requirement: Pantalla de registro

La aplicación web SHALL ofrecer una pantalla «Crea tu cuenta» con los campos «Nombre completo (opcional)», «Email», «Contraseña» y «Repite la contraseña», un botón «Crear cuenta» y un enlace «Inicia sesión» a la pantalla de inicio de sesión.

#### Scenario: Registro correcto

- **WHEN** una persona rellena el formulario con datos válidos y pulsa «Crear cuenta»
- **THEN** queda con la sesión iniciada y llega directamente a la lista de tareas del equipo

#### Scenario: Nombre vacío o solo con espacios

- **WHEN** la persona deja el nombre vacío o escribe solo espacios
- **THEN** la cuenta se crea sin nombre y el perfil muestra «Sin nombre»

#### Scenario: Nombre con espacios alrededor

- **WHEN** la persona escribe el nombre con espacios al principio o al final
- **THEN** el nombre se guarda sin esos espacios

#### Scenario: Las contraseñas no coinciden

- **WHEN** la contraseña y su repetición son distintas y la persona pulsa «Crear cuenta»
- **THEN** no se envía nada al servidor, aunque otros campos también tengan errores
- **THEN** solo se muestra, bajo «Repite la contraseña», el mensaje «Las contraseñas no coinciden.»

#### Scenario: Email ya registrado

- **WHEN** la persona intenta registrarse con un email que ya tiene cuenta, escrito exactamente igual
- **THEN** bajo el campo del email se muestra «Ese email ya está registrado. Inicia sesión en su lugar.»

#### Scenario: Errores de formato por campo

- **WHEN** el servidor rechaza uno o varios campos
- **THEN** cada campo afectado muestra su mensaje en castellano debajo, por ejemplo «Introduce una dirección de email válida.», «Falta rellenar el email.», «la contraseña debe tener al menos 8 caracteres.» o «la contraseña no puede superar los 32 caracteres.»
- **THEN** no se muestra aviso general en la parte superior

#### Scenario: Pista de longitud de la contraseña

- **WHEN** el campo «Contraseña» no tiene ningún error
- **THEN** debajo se muestra la pista «Entre 8 y 32 caracteres.», que se sustituye por el mensaje de error cuando lo hay

### Requirement: Pantalla de inicio de sesión

La aplicación web SHALL ofrecer una pantalla «Inicia sesión» con los campos «Email» y «Contraseña», un botón «Entrar» y un enlace «Crea una» a la pantalla de registro.

#### Scenario: Credenciales correctas

- **WHEN** una persona introduce el email y la contraseña de su cuenta y pulsa «Entrar»
- **THEN** queda con la sesión iniciada y llega a la lista de tareas del equipo

#### Scenario: Credenciales incorrectas

- **WHEN** el email no tiene cuenta o la contraseña no es la correcta
- **THEN** se muestra en la parte superior del formulario el aviso «El email o la contraseña no son correctos.», igual en ambos casos

#### Scenario: Campos vacíos o mal formados

- **WHEN** la persona pulsa «Entrar» con la contraseña vacía o con un email sin formato válido
- **THEN** cada campo afectado muestra su mensaje debajo, por ejemplo «Falta rellenar la contraseña.» o «Introduce una dirección de email válida.»

### Requirement: Progreso y errores generales de los formularios de acceso

La aplicación web SHALL indicar que un envío está en curso y mostrar como aviso general en la parte superior del formulario los errores que no se pueden asociar a un campo visible.

#### Scenario: Envío en curso

- **WHEN** una persona envía el formulario de registro o el de inicio de sesión
- **THEN** el botón de envío queda desactivado hasta que llega la respuesta y su texto cambia a «Creando cuenta…» o «Entrando…», respectivamente

#### Scenario: Nuevo envío

- **WHEN** una persona vuelve a enviar un formulario que mostraba errores
- **THEN** los errores anteriores desaparecen al empezar el nuevo envío

#### Scenario: Servidor no disponible

- **WHEN** el servidor no responde al enviar el formulario
- **THEN** se muestra el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.»

#### Scenario: Error interno del servidor

- **WHEN** el servidor responde con un error que no es de validación ni de credenciales
- **THEN** se muestra el aviso «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.»

### Requirement: Pantalla de perfil

La aplicación web SHALL mostrar a la persona con sesión iniciada sus iniciales, su nombre, su email, su fecha de alta y un botón para cerrar sesión.

#### Scenario: Ver el perfil

- **WHEN** una persona con sesión iniciada está en su perfil
- **THEN** ve sus iniciales en un círculo, su nombre completo (o «Sin nombre» si no tiene), su email y la línea «Miembro desde» con la fecha de alta en formato largo en castellano (por ejemplo, «4 de octubre de 2026»)
- **THEN** ve un botón «Cerrar sesión»

### Requirement: Acceso a las pantallas según la sesión

La aplicación web SHALL permitir ver el perfil y la lista de tareas solo con sesión iniciada, y las pantallas de inicio de sesión y registro solo sin ella. La lista de tareas es la pantalla de inicio de la aplicación.

#### Scenario: Perfil sin sesión

- **WHEN** una persona sin sesión abre el perfil
- **THEN** se le lleva a la pantalla de inicio de sesión

#### Scenario: Inicio de sesión o registro con sesión

- **WHEN** una persona con sesión iniciada abre la pantalla de inicio de sesión o la de registro
- **THEN** se le lleva a la lista de tareas del equipo

#### Scenario: Dirección desconocida

- **WHEN** se abre una dirección de la aplicación que no existe, incluida la raíz
- **THEN** se lleva a la lista de tareas del equipo, que a su vez lleva al inicio de sesión si no hay sesión

#### Scenario: Comprobación de la sesión en curso

- **WHEN** se abre cualquier pantalla mientras se está comprobando con el servidor una sesión guardada
- **THEN** se muestra un indicador de carga a pantalla completa y no se redirige a ninguna parte hasta tener la respuesta

### Requirement: Conservación de la sesión en el navegador

La aplicación web SHALL recordar la sesión en el navegador entre recargas y visitas, y comprobarla con el servidor al abrirse antes de darla por buena.

#### Scenario: Recargar o volver más tarde

- **WHEN** una persona con sesión iniciada recarga la página o vuelve a abrir la aplicación en el mismo navegador y el servidor reconoce la sesión
- **THEN** sigue dentro sin volver a iniciar sesión

#### Scenario: Sesión ya no válida

- **WHEN** al abrir la aplicación el servidor ya no reconoce la sesión guardada
- **THEN** la sesión se olvida en el navegador
- **THEN** la persona llega al inicio de sesión con el aviso «Tu sesión ha caducado. Vuelve a iniciar sesión.»

#### Scenario: Servidor caído o con error al volver

- **WHEN** al abrir la aplicación el servidor no responde o responde con un error interno
- **THEN** la persona llega al inicio de sesión con el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.» o «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.», según el caso
- **THEN** la sesión guardada no se olvida, de modo que al recargar con el servidor ya disponible la persona vuelve a estar dentro

#### Scenario: El aviso de sesión perdida solo está en el inicio de sesión

- **WHEN** hay un aviso de sesión perdida y la persona pasa a la pantalla de registro
- **THEN** el aviso no se muestra en el registro, pero vuelve a verse al regresar al inicio de sesión

#### Scenario: Un nuevo intento sustituye el aviso de sesión perdida

- **WHEN** la pantalla de inicio de sesión muestra el aviso de una sesión perdida y la persona intenta entrar
- **THEN** si el intento falla con un aviso general, ese aviso sustituye al de la sesión perdida mientras se muestre
- **THEN** si el intento sale bien, el aviso de la sesión perdida desaparece definitivamente

### Requirement: Cerrar sesión desde la aplicación

La aplicación web SHALL cerrar la sesión en el navegador en cuanto la persona lo pida, y solicitar al servidor que invalide esa sesión.

#### Scenario: Cerrar sesión

- **WHEN** una persona pulsa «Cerrar sesión» en su perfil
- **THEN** llega de inmediato a la pantalla de inicio de sesión, sin ningún aviso y sin esperar la respuesta del servidor
- **THEN** la sesión deja de ser válida en el servidor si este recibe la petición

#### Scenario: Cerrar sesión con el servidor caído

- **WHEN** una persona cierra sesión y el servidor no responde o ya no reconocía la sesión
- **THEN** la sesión se cierra igualmente en el navegador, sin mostrar ningún error
- **THEN** si el servidor no llegó a recibir la petición, esa sesión sigue siendo válida en el servidor
