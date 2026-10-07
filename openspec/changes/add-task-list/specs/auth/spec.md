# Spec Delta

## MODIFIED Requirements

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
