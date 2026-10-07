# Proposal

## Why

FlowSync todavía no tiene tareas: solo permite crear una cuenta y entrar. Sin una lista compartida no se puede responder a la pregunta que justifica el producto, «quién está en qué», y la lista es la base de todo lo demás de la gestión de tareas (cambiar estado desde la fila, filtros, vencimientos). Este change la da de alta junto con lo mínimo para alimentarla: crear con solo el título y cambiar el estado.

Historias incluidas, con sus criterios de aceptación: E3-1 (lista compartida), E2-1 (crear tarea con solo el título), E2-2 (título obligatorio), E2-3 (nace mía y pendiente) y E2-4 (cambiar el estado desde la lista).

## What Changes

- **API de tareas** (nueva, autenticada), con exactamente tres operaciones:
  - listar todas las tareas del espacio, cada una con título, estado y responsable (del responsable solo se expone el identificador y el nombre);
  - crear una tarea a partir únicamente del título; nace en `pending` y con quien la crea como responsable;
  - actualizar el estado y/o el responsable de cualquier tarea.
  - No hay lectura individual, ni borrado, ni endpoints de equipo o de usuarios.
- **Estados**: conjunto cerrado `pending`, `in_progress`, `done`, que en pantalla se muestran como «Pendiente», «En curso» y «Hecho». Cualquier otro valor se rechaza con 422. Se puede pasar libremente de cualquier estado a cualquier otro, incluido volver desde «Hecho».
- **Título**: obligatorio; se descartan los espacios de los extremos; uno vacío o solo con espacios se rechaza; con más de 255 caracteres se rechaza con aviso, nunca se recorta.
- **Pantalla «Tareas del equipo»** (nueva, protegida): una sola lista, igual para todos, con título, nombre del responsable («Sin nombre» si no lo tiene, nunca su email ni su id) y estado; formulario de creación con un único campo; cambio de estado desde la propia fila con un solo gesto, sin diálogos; estado vacío que explica la pantalla e invita a crear la primera tarea.
- **Navegación**: la lista pasa a ser la pantalla de inicio de la aplicación. Registrarse, iniciar sesión o abrir una dirección desconocida lleva a la lista en lugar de al perfil, y lista y perfil se enlazan entre sí.
- El cambio de responsable solo está disponible por API: la interfaz no ofrece selector de responsable, porque no hay forma de listar a las personas del equipo sin un endpoint de equipo.

### Fuera de alcance (deliberadamente)

- Fecha de vencimiento: la tarea no la tiene y la lista no muestra fechas ni marcas de vencida.
- Refresco automático cuando otra persona cambia algo (E3-2): la lista es correcta en el momento en que se pide.
- Editar el título, borrar tareas, tareas privadas, vista «mis tareas», presencia de usuarios, roles o permisos.
- Tests: este change no monta base de pruebas ni añade tests.

### Puntos abiertos

- **Orden de la lista (PA-3)**: no hay regla decidida. La API no ordena explícitamente y la interfaz tampoco; el orden en que salen las tareas no forma parte del contrato. Hasta que se decida, CA-5 de E3-1 («enumerar el trabajo de cada persona») se cumple solo de forma débil.
- **Límite de «En curso» por persona (PA-4)**: sin decidir; no se limita.
- **Transiciones (PA-7)**: se adoptan transiciones libres entre los tres estados como decisión provisional; el riesgo de marcar algo como hecho por error queda abierto.
- **Umbral del título (PA-9)**: se fija provisionalmente en 255 caracteres para poder cumplir CA-3 de E2-2; la decisión de producto sigue pendiente.
- **Coste del gesto (PA-9)**: cambiar de estado es un clic sobre el estado de destino; no hay definición acordada de «interacción».

## Capabilities

### New Capabilities

- `tasks`: la lista compartida de tareas del equipo: alta con solo el título, valores por defecto de responsable y estado, conjunto cerrado de estados y actualización de estado y responsable, por API y en pantalla.

### Modified Capabilities

- `auth`: tras registrarse o iniciar sesión, y al abrir una dirección desconocida, se llega a la lista de tareas en lugar de al perfil; una persona con sesión que abre el inicio de sesión o el registro también va a la lista.

## Impact

- **Backend**: nueva tabla de tareas con referencia al usuario responsable (migración, con regeneración del esquema), modelo, validadores, transformer, controlador y tres rutas nuevas bajo `/api/v1/tasks` protegidas con el middleware de auth. También se regeneran los ficheros versionados de `backend/.adonisjs/`.
- **Frontend**: nuevas llamadas en el cliente de API, una página y sus componentes reutilizando solo los de `components/ui/` existentes, una ruta protegida nueva y cambios de redirección en las rutas existentes y en el perfil.
- **Dependencias**: ninguna nueva, ni en el backend ni en el frontend.
- **Datos**: migración aditiva; no toca las tablas existentes.
