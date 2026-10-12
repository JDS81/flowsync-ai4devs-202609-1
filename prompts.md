# Prompts

Todos los prompts que lancé para el ejercicio, en orden. Mi forma de trabajar: le pasé al agente
las capturas del enunciado, le pedí que me redactara los prompts de trabajo y yo los supervisé y
aprobé antes de ejecutarlos. Cuando un prompt mío aprobaba un borrador, el borrador va en el mismo
apartado, porque fue lo que se ejecutó de verdad.

---

## Prompt 1

**Modelo:** Opus 5.5
**Herramienta:** Claude Code (extensión de VS Code)

```
[5 capturas del enunciado: la tarea, dónde va cada cosa, Parte A, A.1 y formato de la tabla]
la tarea que vamos a hacer hoy te voy pasando capturas de pantalla para hacerlo
me vas preguntando para hacer los promts de test 

prepara el plan, todavia no escribas nada, revisa lo que necesito, ordena la informacion
```

**Qué salió:** me ordenó el plan sin tocar nada y me avisó de que la spec tiene 3 scenarios y la lección habla de 4.

## Prompt 2

**Modelo:** Opus 5.5
**Herramienta:** Claude Code (extensión de VS Code)

```
1. no tengo ni idea explicame lo con ams detalle y dame mas datos para entenderlo
2. vamos a trabajar con 4 aunque ponga 3 
4. queiro que lo redactes tu, peor que lo supervise yo si es loque quiero
```

**Qué salió:** me explicó la estimación a ojo, pero sin darme datos para no contaminarla. Al final no llegué a apuntar el número.

## Prompt 3

**Modelo:** Opus 5.5
**Herramienta:** Claude Code (extensión de VS Code)

```
cuantos escenarios me recomiendas
```

**Qué salió:** me recomendó 4, partiendo el scenario «suelta o dentro de la lista».

## Prompt 4

**Modelo:** Opus 5.5
**Herramienta:** Claude Code (extensión de VS Code)

```
pon 4 escenarios, deja explicado que la spec tiene 3 escenarios y la tarea 4
```

**Qué salió:** el esqueleto de la matriz, con la nota de 3 frente a 4.

## Prompt 5

**Modelo:** Opus 5.5
**Herramienta:** Claude Code (extensión de VS Code)

```
me vale el borrador, completa todas las columnas y dejalo explicado
```

Borrador que le pedí redactar y aprobé con ese mensaje:

```
Construye la matriz de trazabilidad del requisito «Lo que cada tarea muestra de su
responsable» de openspec/specs/tasks/spec.md. Trabajamos con 4 scenarios (el segundo
de la spec lo partimos en tarea suelta / tarea en la lista):
1. Tarea con responsable con nombre → trae nombre e iniciales.
2. Tarea suelta → su responsable no trae email ni datos de acceso.
3. Tarea dentro de la lista → su responsable no trae email ni datos de acceso.
4. Responsable registrado sin nombre → nombre nulo, iniciales presentes.

Para cada scenario busca en backend/tests qué test lo cubre. Abre el test y lee lo que
afirma de verdad; no te fíes del nombre. Clasifica cada uno en Cubierto / No cubierto /
No lo sé, y si es "no lo sé", di en media línea qué faltó para decidir.

Escribe la matriz en docs/verificacion/jds81.md: arriba "Scenarios en el requisito: 4 ·
Cubiertos: ___" y debajo una tabla de 4 columnas (Scenario · Test que lo cubre, con el
nombre exacto · Estado · Qué te faltó). Deja "Cubiertos" en blanco. No escribas tests
todavía, no toques nada fuera de docs/verificacion/ y no arregles código.
```

**Qué salió:** 0 de 4 cubiertos. No había ningún test de tareas, y los de iniciales de auth se descartaron tras leerlos. Al leer el código ya se vio que la lista podía exponer el email.

## Prompt 6

**Modelo:** Opus 5.5
**Herramienta:** Claude Code (extensión de VS Code)

```
continua con la A2
```

Borrador que le pedí redactar y que se ejecutó con ese mensaje:

```
Escribe los tests que faltan para los 4 scenarios "No cubierto" de docs/verificacion/jds81.md:
uno por scenario, en backend/tests/functional/tasks/, siguiendo el estilo de los de
backend/tests/functional/auth/ (grupo con testUtils.db().withGlobalTransaction(), client de
Japa, títulos en castellano). Para "no incluye email ni datos de acceso", comprueba que el
assignee no trae email y lista qué claves trae. No toques nada fuera de backend/tests/,
no arregles código ni aflojes un test para que pase. Ejecútalos y dime cuáles salen en rojo y por qué.
```

**Qué salió:** 4 tests. La primera vez fallaron 2 porque usó `assert.notAnyKeys`, que no existe en Japa; lo cambió por `assert.notProperty`. Resultado final: 3 en verde y 1 en rojo, porque la lista devuelve el email del responsable.

## Prompt 7

**Modelo:** Opus 5.5
**Herramienta:** Claude Code (extensión de VS Code)

```
[3 capturas del enunciado: Parte B, cómo saber que la has hecho bien, cómo se entrega]
vamos con la parte B
```

**Qué salió:** propuestas con opciones para cada una de las tres líneas, y la sugerencia de reordenar el archivo para que la matriz quepa en una pantalla.

## Prompt 8

**Modelo:** Opus 5.5
**Herramienta:** Claude Code (extensión de VS Code)

```
completalo con tus sugerencias
```

**Qué salió:** acepté las sugerencias del agente para las tres líneas sin cambiarlas.
