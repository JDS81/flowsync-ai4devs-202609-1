# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

---

## Prompt 1

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
el alcance definitivo dejalo escrito en docs/prd/alcance-mvp-jds.md
```

**Qué salió:** no funcionó. Aún no había alcance, así que el agente no lo escribió y propuso hacer antes el recorrido del ejercicio.

---

## Prompt 2

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
la primera, pero ademas crea tu el documento de prompts.md y vete guardandolo
```

**Qué salió:** el agente creó la rama `alcance-jds`, resumió el terreno existente (tramo 1) y lanzó las cinco preguntas.

---

## Prompt 3

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
1. Flujo de alarmas, que te enteres cuando salta una alarma e un determiando servicio y que la matriz de escaldo funcione correctamente en una guadia
```

**Qué salió:** el agente señaló que la respuesta choca con la ficha de hechos del ejercicio (sin push, estado de la tarea y no de la persona, sin señales externas) y preguntó si seguir la ficha o cambiar de producto a propósito.

---

## Prompt 4

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
2. los compañeros del equipo, y los manager que tienen control de lo que ocurre, en que momento, con que frecuencia, y quien lo resuelve y en que tiempos
```

**Qué salió:** el usuario sigue con su propio producto (alarmas y guardias) en vez de la ficha. El agente registró la respuesta, señaló que la parte de managers ya es analítica e informes, y pidió las preguntas 3 a 5.

---

## Prompt 5

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
3. por push, llamada, si no es capaz de resolverlo, devera ejecutat la matriz de escalacion y que llegue al siguiente compañero
```

**Qué salió:** el agente registró la respuesta y pidió aclarar qué dispara el escalado (tiempo sin respuesta o petición manual) antes de las preguntas 4 y 5.

---

## Prompt 6

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
4. las alarmas estan configuradas en los servicios de monitorizacion y este servisio es el que dispara las alarmas o notificaciones en base a unos umbrales definidos de aviso definidos con los clientes.
```

**Qué salió:** el agente registró la respuesta, dejó como supuestos lo que no se contestó (qué dispara el escalado, sustituir o convivir) y pidió la pregunta 5.

---

## Prompt 7

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
que la resolucion de las alarmas, alertas se hagan dentro de las 2 horas siguientes al lanzamiento, que no lleguen a escalar, o lo mininimo posible, que no escale muchos nivelss, eso significa que los conocimientos  y ejecuciones definidas funcionan correctamente
```

**Qué salió:** el agente cerró el interrogatorio (dejó como supuesto construir una sola pieza terminada) y propuso el alcance en cinco bloques: 8 cosas dentro y 13 exclusiones, cada una con su porqué.

---

## Prompt 8

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
el 4 avisa por llamada, con un telefono de guardia para el usuarios solucionamos la casuistica, el usuario hara guardois de 1 semana y tendra esa disponibilidad, con esto resolvemos la friccion entre el punto 2 y 5
```

**Qué salió:** el agente aplicó el cambio (llamada al teléfono de guardia y guardias semanales) y señaló dos incoherencias: el escalado necesita llamar a alguien que no tiene el teléfono de guardia, y la llamada no resuelve la tensión entre managers e informes.

---

## Prompt 9

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
todos los compañetos disponen telefono de guardia; los manager, tendran un panel de seguimiento de tareas, una herramienta de ITSM donde podran ir anotando los avances de las tareas y coom esta en tiempo practicamente real, ademas este sistema ITSM tiene dashboard para sacar ls metricas referente a los tecnicos, a la tasa de resoluion tiempos etc
```

**Qué salió:** el agente dio por supuesto que la ITSM ya existe fuera de FlowSync, dejó fuera tanto el panel como la integración con la ITSM, y avisó del riesgo de actualizar el estado en dos sitios.

---

## Prompt 10

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
contruye la herramienta ITSM, deja las 8 cosas y empieza a construir la parte b
```

**Qué salió:** el agente preguntó si "construye" significaba programar o meterla en el alcance. El usuario eligió meterla en el alcance. El alcance pasó de 8 a 10 (avances y panel de métricas) y se añadieron exclusiones para acotar la ITSM. El agente escribió un borrador de la Parte B para revisar.

---

## Prompt 11

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
ok adelante haz el commit abre el PR
```

**Qué salió:** el agente hizo el commit con los dos ficheros y abrió el PR contra el repo del curso.
