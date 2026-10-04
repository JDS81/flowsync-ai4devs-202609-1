# Especificación viva — Cuentas y acceso

## Purpose

Permitir que una persona cree una cuenta en FlowSync, inicie y cierre sesión, y consulte su perfil. La sesión se conserva entre visitas mientras el servidor siga reconociéndola.

## Requirements

### Requirement: El sistema SHALL permitir crear una cuenta con email y contraseña

El registro pide un nombre completo (opcional), un email, una contraseña y la repetición de la contraseña. Si el registro sale bien, la persona queda dentro sin tener que iniciar sesión aparte.

#### Scenario: Registro correcto con nombre

- WHEN una persona envía el formulario de registro con un nombre, un email válido que no está registrado, una contraseña de 8 a 32 caracteres y la misma contraseña repetida
- THEN el sistema crea la cuenta
- THEN la persona queda con la sesión iniciada y llega directamente a su perfil
- THEN el nombre se guarda sin los espacios del principio y del final

#### Scenario: Registro correcto sin nombre

- WHEN una persona deja vacío el nombre (o solo con espacios) y el resto de datos son válidos
- THEN el sistema crea la cuenta sin nombre
- THEN el perfil muestra «Sin nombre» en lugar del nombre

#### Scenario: Email ya registrado

- WHEN una persona intenta registrarse con un email que ya tiene una cuenta, escrito exactamente igual
- THEN el sistema rechaza el registro y no crea ninguna cuenta
- THEN junto al campo del email se muestra «Ese email ya está registrado. Inicia sesión en su lugar.»

#### Scenario: Mismo email con distintas mayúsculas

- WHEN ya existe una cuenta con «Ana@example.com» y alguien se registra con «ana@example.com»
- THEN el sistema lo acepta y crea una segunda cuenta independiente

#### Scenario: Las contraseñas no coinciden

- WHEN la contraseña y su repetición son distintas
- THEN se rechaza el registro antes de contactar con el servidor, aunque haya otros errores en el formulario
- THEN junto al campo de repetición se muestra solo «Las contraseñas no coinciden.»
- THEN el servidor también rechaza por su cuenta un registro cuyas contraseñas no coinciden

#### Scenario: Datos con formato inválido

- WHEN el email no tiene formato de email, supera los 254 caracteres, o la contraseña tiene menos de 8 o más de 32 caracteres
- THEN el sistema rechaza el registro y no crea ninguna cuenta
- THEN cada campo afectado muestra su propio mensaje en castellano (por ejemplo, «Introduce una dirección de email válida.» o «la contraseña debe tener al menos 8 caracteres.»)

#### Scenario: Pista de longitud de la contraseña

- WHEN una persona está en el formulario de registro y el campo de contraseña no tiene ningún error
- THEN bajo ese campo se muestra la pista «Entre 8 y 32 caracteres.»

### Requirement: El sistema SHALL permitir iniciar sesión con email y contraseña

#### Scenario: Credenciales correctas

- WHEN una persona envía el email y la contraseña de una cuenta existente
- THEN el sistema abre una sesión nueva
- THEN la persona llega a su perfil

#### Scenario: Credenciales incorrectas

- WHEN el email no corresponde a ninguna cuenta, o la contraseña no es la de esa cuenta
- THEN el sistema rechaza el acceso
- THEN se muestra el mismo aviso general en ambos casos: «El email o la contraseña no son correctos.»

#### Scenario: El email distingue mayúsculas de minúsculas

- WHEN una persona se registró con un email que contiene mayúsculas e intenta entrar con el mismo email en minúsculas
- THEN el sistema rechaza el acceso como credenciales incorrectas

#### Scenario: Formulario incompleto o mal formado

- WHEN se envía el inicio de sesión con un email sin formato válido o sin contraseña
- THEN el sistema rechaza el acceso sin comprobar las credenciales
- THEN cada campo afectado muestra su mensaje (por ejemplo, «Falta rellenar la contraseña.»)

### Requirement: El sistema SHALL informar del progreso y de los errores de los formularios de acceso

#### Scenario: Envío en curso

- WHEN una persona envía el formulario de registro o de inicio de sesión
- THEN el botón de envío se desactiva hasta que hay respuesta
- THEN su texto cambia a «Creando cuenta…» o «Entrando…», según el formulario

#### Scenario: Error que no corresponde a un campo visible

- WHEN el servidor rechaza el envío por un motivo que no se puede asociar a un campo visible del formulario
- THEN el mensaje se muestra como aviso general en la parte superior del formulario

#### Scenario: Servidor no disponible

- WHEN el servidor no responde al enviar un formulario
- THEN se muestra el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.»

#### Scenario: Error inesperado del servidor

- WHEN el servidor responde con un error interno
- THEN se muestra el aviso «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.»

### Requirement: El sistema SHALL mostrar el perfil de la persona con sesión iniciada

#### Scenario: Ver el perfil

- WHEN una persona con sesión iniciada abre su perfil
- THEN se muestran sus iniciales, su nombre completo (o «Sin nombre»), su email y la fecha de alta como «Miembro desde» en formato largo en castellano (por ejemplo, «4 de octubre de 2026»)

#### Scenario: Iniciales con nombre de dos o más palabras

- WHEN el nombre completo tiene al menos dos palabras separadas por un único espacio, como «Ana Pérez Gil»
- THEN las iniciales son la primera letra de las dos primeras palabras, en mayúsculas («AP»)

#### Scenario: Iniciales con nombre separado por varios espacios

- WHEN las dos primeras palabras del nombre están separadas por más de un espacio, como «Ana  Pérez»
- THEN las iniciales se calculan como si fuera una sola palabra: las dos primeras letras en mayúsculas («AN»)

#### Scenario: Iniciales con nombre de una sola palabra

- WHEN el nombre completo es una sola palabra, como «Ana»
- THEN las iniciales son sus dos primeras letras en mayúsculas («AN»), o solo una si la palabra tiene una única letra

#### Scenario: Iniciales sin nombre

- WHEN la cuenta no tiene nombre
- THEN las iniciales se forman con la primera letra de lo que va antes de la arroba del email y la primera letra de lo que va después, en mayúsculas (para «jdoe@example.com», «JE»)

### Requirement: El sistema SHALL restringir el acceso según haya o no sesión

#### Scenario: Acceso al perfil sin sesión

- WHEN una persona sin sesión intenta abrir el perfil
- THEN se le redirige a la pantalla de inicio de sesión

#### Scenario: Acceso a inicio de sesión o registro con sesión

- WHEN una persona con sesión iniciada intenta abrir la pantalla de inicio de sesión o la de registro
- THEN se le redirige a su perfil

#### Scenario: Dirección desconocida

- WHEN se abre cualquier dirección de la aplicación que no existe
- THEN se redirige al perfil, que a su vez lleva al inicio de sesión si no hay sesión

#### Scenario: Petición al servidor sin credenciales válidas

- WHEN alguien pide al servidor el perfil o el cierre de sesión sin una sesión válida
- THEN el servidor responde que el acceso no está autorizado y no devuelve ningún dato de cuenta

### Requirement: El sistema SHALL conservar la sesión entre visitas mientras el servidor la reconozca

Las sesiones no caducan por tiempo: duran hasta que se cierran.

#### Scenario: Recargar o volver más tarde

- WHEN una persona con sesión iniciada recarga la página o vuelve a abrir la aplicación en el mismo navegador
- THEN mientras se comprueba la sesión con el servidor se muestra un indicador de carga, sin redirigir a ninguna parte
- THEN si el servidor la reconoce, la persona sigue dentro sin volver a iniciar sesión

#### Scenario: Sesión ya no válida

- WHEN al volver a la aplicación el servidor ya no reconoce la sesión guardada
- THEN la sesión se descarta en el navegador
- THEN la persona llega al inicio de sesión con el aviso «Tu sesión ha caducado. Vuelve a iniciar sesión.»

#### Scenario: Servidor caído al volver

- WHEN al volver a la aplicación el servidor no responde
- THEN la persona llega al inicio de sesión con el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.»
- THEN la sesión guardada no se descarta, de modo que basta con recargar cuando el servidor vuelva para seguir dentro

#### Scenario: Error del servidor al volver

- WHEN al volver a la aplicación el servidor responde con un error interno
- THEN la persona llega al inicio de sesión con el aviso «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.»
- THEN la sesión guardada no se descarta, igual que con el servidor caído

#### Scenario: El aviso de sesión perdida se sustituye por el del nuevo intento

- WHEN la pantalla de inicio de sesión muestra el aviso de una sesión perdida y la persona intenta entrar de nuevo con un error
- THEN el aviso del nuevo intento sustituye al de la sesión perdida
- THEN si el nuevo intento sale bien, el aviso de la sesión perdida desaparece

#### Scenario: Varias sesiones simultáneas

- WHEN una misma persona inicia sesión varias veces, por ejemplo desde navegadores distintos
- THEN cada inicio de sesión abre una sesión independiente y todas siguen siendo válidas a la vez

### Requirement: El sistema SHALL permitir cerrar la sesión

#### Scenario: Cerrar sesión

- WHEN una persona pulsa «Cerrar sesión» en su perfil
- THEN la persona llega de inmediato a la pantalla de inicio de sesión, sin ningún aviso y sin esperar la respuesta del servidor
- THEN la sesión deja de ser válida en el servidor, siempre que el servidor reciba la petición

#### Scenario: Solo se cierra la sesión actual

- WHEN una persona con varias sesiones abiertas cierra una de ellas
- THEN las demás sesiones siguen siendo válidas

#### Scenario: Cierre de sesión con el servidor caído o la sesión ya inválida

- WHEN una persona cierra sesión y el servidor no responde o ya no reconocía la sesión
- THEN la sesión se cierra igualmente en el navegador y la persona llega al inicio de sesión, sin ningún error
- THEN si el servidor no llegó a recibir la petición, esa sesión sigue siendo válida en el servidor


## Parte B: Las tres listas

### 1. Conteo
- Escenarios escritos por el agente: [Cuenta cuántos #### Scenario hay en tu archivo y pon el número aquí]
- Escenarios comprobados en código por mí: 1

### 2. Incoherencias
- El frontend valida que las contraseñas coincidan antes de enviar el formulario, pero la API del backend acepta la petición de registro recibiendo únicamente un campo de contraseña sin comprobar la repetición.

### 3. Duda entre Bug o Contrato
- El servidor aplica un `trim()` al nombre para eliminar los espacios antes de guardarlo en la base de datos sin notificarlo en la respuesta: no se puede decidir leyendo el código si se trata de un contrato de sanitización intencionado o de una transformación arbitraria.