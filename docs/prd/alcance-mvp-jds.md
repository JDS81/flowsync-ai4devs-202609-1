# Alcance del MVP de FlowSync

## 1. El terreno que ya existe

Hoy FlowSync solo resuelve la **identidad**: crear una cuenta (nombre, email y contraseña), iniciar sesión, ver el propio perfil y cerrar sesión. Lo hace tanto en la API como en tres pantallas del frontend (registro, login y perfil).

En el modelo de datos solo existen el **usuario** y sus tokens de sesión. No hay tareas, equipos, estados ni nada de producto: todo el MVP está por construir sobre esa base de usuarios. Tampoco hay ningún mecanismo de actualización en vivo.

## 2. El interrogatorio

> Decisión de partida: en vez de la ficha de hechos del ejercicio, el producto se redefine a propósito como una herramienta de **alarmas y guardias**. Este alcance no es comparable con el del directo.

1. **¿Qué duele hoy?** Enterarse a tiempo de que ha saltado una alarma en un servicio concreto, y que la matriz de escalado funcione bien durante una guardia.
2. **¿Quién sale ganando?** Dos tipos de usuario: los compañeros del equipo (los que atienden la alarma) y los managers, que quieren saber qué ocurre, cuándo, con qué frecuencia, quién lo resuelve y en cuánto tiempo.
3. **¿Qué significa "tiempo real"?** Avisar a la persona de guardia por push y por llamada. Si no es capaz de resolverlo, se ejecuta la matriz de escalado y el aviso pasa al siguiente compañero. _Revisado después: se queda solo la llamada, porque cada compañero tiene un teléfono de guardia. El push pasa al NO-alcance._
4. **¿Sustituye o convive? ¿De dónde sale el estado?** Las alarmas se configuran en los servicios de monitorización, que son los que las disparan cuando se cruzan unos umbrales de aviso acordados con los clientes. FlowSync las recibe; no las crea.
5. **¿Qué es éxito a una semana? ¿Cuánto construir?** Que las alarmas se resuelvan en menos de 2 horas desde que saltan, y que escalen lo mínimo posible y pocos niveles. Si pasa eso, el conocimiento y los procedimientos definidos funcionan.

**Supuestos** (preguntas sin respuesta, decididas por el agente):

- El escalado se dispara solo si nadie confirma la alarma en X minutos, y además hay un botón para escalar a mano. Una alarma confirmada pero sin resolver no escala sola: se ve en la lista de abiertas con el tiempo que lleva, y ahí se decide escalarla a mano.
- FlowSync convive con la monitorización actual (es su fuente) y no la sustituye. Los umbrales se siguen definiendo allí, no en FlowSync.
- Se construye una sola pieza fina y terminada de punta a punta (la alarma entra, avisa, escala y se resuelve), no una base amplia.
- La parte ITSM de FlowSync **sustituye** a la herramienta ITSM actual para todo lo que nace de una alarma. Si conviviera con ella, el técnico apuntaría lo mismo en dos sitios.
- La llamada se hace a través de un proveedor de telefonía de terceros. Es la única integración externa del MVP, además de la entrada de alarmas.

## 3. El alcance

### Problema

Cuando salta una alarma de un servicio, nadie tiene la certeza de que la persona de guardia se haya enterado. Si esa persona no responde, el escalado al siguiente compañero depende de que alguien se dé cuenta y lo haga a mano. Las alarmas se quedan sin atender más tiempo del acordado con el cliente, y el manager no sabe cuánto tardan ni quién las resuelve sin preguntar.

### Usuarios

- **Principal:** la persona de guardia y los compañeros que están detrás de ella en la matriz de escalado. Hacen guardias de una semana, con un teléfono de guardia cada uno, y son quienes reciben el aviso y resuelven.
- **Secundario:** el manager, que sigue los avances de cada alarma y mide los tiempos de resolución y la tasa de escalado por técnico.

### Propuesta de valor

Cada alarma llega por llamada a una persona concreta, y si esa persona no la coge, pasa sola a la siguiente. Nadie tiene que vigilar si alguien la ha visto. El avance de la resolución se apunta en el mismo sitio donde entró la alarma, así que el manager lo ve casi en tiempo real y puede comprobar si se cumple el objetivo: menos de 2 horas y pocos escalados.

### Alcance (10)

1. **Recibir alarmas** desde una herramienta de monitorización, en un único formato genérico. FlowSync no evalúa umbrales: se fía de lo que le llega.
2. **Saber quién está de guardia ahora.** Las guardias duran una semana y la rotación se configura a mano.
3. **Una única matriz de escalado:** una lista ordenada de personas, la misma para todos los servicios.
4. **Avisar por llamada** al teléfono de guardia de la persona que toca en cuanto entra una alarma. Todos los compañeros tienen teléfono de guardia.
5. **Confirmar** una alarma ("la tengo") y **marcarla como resuelta**.
6. **Escalar solo** si nadie confirma en X minutos: se llama al teléfono de guardia del siguiente nivel de la matriz. También se puede escalar a mano.
7. **Ver la lista de alarmas abiertas**, visible para todo el equipo: estado, quién la tiene y cuánto tiempo lleva abierta.
8. **Historial de cada alarma:** cuándo saltó, quién la confirmó, cuántos niveles escaló y cuándo se resolvió.
9. **ITSM: seguimiento de avances.** El técnico va apuntando en la propia alarma cómo avanza la resolución, y el equipo y el manager lo ven casi en tiempo real.
10. **ITSM: panel de métricas para managers.** Tiempo de resolución, porcentaje de alarmas resueltas en menos de 2 horas, niveles escalados y resultados por técnico.

### NO-alcance (12)

- **Push, SMS, Slack, email y otros canales.** La llamada al teléfono de guardia ya cubre el aviso, incluido de noche. Cada canal más es otra integración que no valida nada nuevo.
- **ITSM completa:** incidencias que no nacen de una alarma, peticiones de servicio, gestión de cambios y problemas, catálogo o CMDB. La hipótesis es que las alarmas se atienden y se resuelven a tiempo. Todo lo demás es otro producto.
- **SLAs distintos por cliente en el panel.** El objetivo de 2 horas es uno solo. Medir cada contrato por separado no cambia si el aviso y el escalado funcionan.
- **Informes exportables o programados.** El panel ya responde a la pregunta del manager. Exportarlos no valida nada nuevo.
- **Integraciones propias con cada herramienta de monitorización** (Grafana, Datadog…). Con un formato genérico basta para comprobar el flujo; cada integración es trabajo que no valida nada nuevo.
- **Definir umbrales en FlowSync.** Ya se definen en la monitorización con el cliente. Duplicarlos crearía dos fuentes de verdad.
- **Una matriz distinta por servicio o por cliente.** Con una sola matriz ya se valida si el escalado funciona; varias matrices solo añaden configuración.
- **Calendario de guardias avanzado** (festivos, cambios de turno a mitad de semana, huecos). Con guardias semanales fijas ya se sabe quién está de guardia, que es lo único que necesita el flujo.
- **Procedimientos por alarma** (runbooks). El criterio de éxito dice que "los conocimientos y ejecuciones definidas funcionan", pero para medirlo no hace falta guardarlos en FlowSync. Pueden seguir donde estén hoy.
- **Agrupar alarmas repetidas, silenciarlas y ventanas de mantenimiento.** Reducen ruido, pero no ayudan a validar que el aviso llegue ni que escale.
- **Postmortems.** Pertenecen a lo que pasa después de resolver, y la hipótesis está en el aviso, el escalado y el tiempo de resolución.
- **Varios equipos, roles y permisos, y app móvil nativa.** Con un único equipo en el que todos ven lo mismo, y con el aviso por llamada, basta para validar el flujo.

---

## Parte B

> **Borrador del agente, basado en las decisiones de la conversación. Revísalo y reescríbelo con tus palabras: las líneas 2 y 3 tienen que ser tuyas.**

1. **Los dos números.** La IA propuso 8 cosas dentro. Tras mi recorte quedaron 10.

2. **Tres cosas que dejé fuera, y por qué:**
   - **Push y otros canales:** la hipótesis es que la alarma siempre llega a una persona, también de noche, y un push no lo garantiza. La llamada sí lo valida; el push no añade nada.
   - **ITSM completa (cambios, problemas, peticiones):** la hipótesis es que las alarmas se resuelven en menos de 2 horas con pocos escalados. Nada de eso la valida.
   - **Integraciones propias con cada herramienta de monitorización:** con un único formato genérico ya se comprueba que la alarma entra, avisa y escala. Integrar con Grafana o Datadog no valida nada que el formato genérico no valide ya.

3. **La exclusión de la que menos seguro estoy:** tener una matriz de escalado distinta por servicio o por cliente (el MVP usa una sola para todo). Se contradicen dos cosas: los umbrales se pactan con cada cliente y la alarma es de "un determinado servicio", pero el MVP escala igual para todo. Entraría si en la semana de prueba una alarma escala a alguien que no conoce ese servicio y por eso tarda más de 2 horas.

> **Nota:** la IA señaló dos incoherencias que obligaron a cambiar decisiones. Primera: un único teléfono de guardia no permite escalar al siguiente compañero; se resolvió con un teléfono por persona. Segunda: sin una ITSM integrada, el técnico apuntaría lo mismo en dos sitios; se resolvió metiendo la ITSM en el alcance. Además, la ITSM hizo crecer el alcance de 8 a 10 en vez de reducirlo.
