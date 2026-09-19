# Prompts

Aquí van todos los prompts lanzados para hacer el ejercicio, en el orden en que se lanzaron, con el modelo y la herramienta de cada uno.

---

## Prompt 1

**Modelo:** Sonnet 5
**Herramienta:** Claude Code (comando `/init`)

```
/init
```

**Qué salió:** el directorio de trabajo estaba vacío en ese momento (antes de clonar nada) — no había código que documentar todavía. Quedó pendiente hasta tener el repo clonado.

---

## Prompt 2

**Modelo:** Sonnet 5
**Herramienta:** Claude Code

```
# 1. Fork desde la web: botón "Fork"
en https://github.com/LIDR-academy/flowsync-ai4devs-202609-1

# 2. Clona TU fork (no el del curso) y añade el del curso como "upstream"
git clone git@github.com:<tu-usuario>/LIDR-academy/flowsync-ai4devs-202609-1.git
cd flowsync-ai4devs
git remote add upstream git@github.com:LIDR-academy/flowsync-ai4devs-202609-1.git

# Comprueba cómo han quedado: origin = tu fork, upstream = el del curso
git remote -v

# 3. Trae las ramas del curso y colócate en la de hoy
git fetch upstream
git checkout -b s1/start upstream/s1/start

# 4. A partir de aquí tus cambios van a TU fork
git push -u origin s1/start

mi usuario de github es jds81
crea un .env para crar y pegar el token de github
```

**Qué salió:** el comando SSH pegado tenía la ruta duplicada (`<tu-usuario>/LIDR-academy/...`); lo corregí a `jds81/flowsync-ai4devs-202609-1` y usé HTTPS en vez de SSH porque no había clave SSH para github.com en la máquina.

---

## Prompt 3

**Modelo:** Sonnet 5
**Herramienta:** Claude Code

```
ya he actualizado el token en el .env
```

**Qué salió:** el intento de guardar el token vía `git credential approve` lo bloqueó el clasificador de seguridad de Claude Code; el clone/checkout se hizo sin necesitar el token (repo público para fetch), y el `push` quedó pendiente de que el usuario lo lanzara desde su propia terminal.

---

## Prompt 4

**Modelo:** Sonnet 5
**Herramienta:** Claude Code

```
cd backend
npm install
cp .env.example .env
node ace generate:key
node ace migration:run
npm run dev
```

**Qué salió:** funcionó a la primera. Backend arriba en `http://localhost:3333`.

---

## Prompt 5

**Modelo:** Sonnet 5
**Herramienta:** Claude Code

```
cd frontend
npm install
npm run dev
```

**Qué salió:** funcionó a la primera. Frontend arriba en `http://localhost:5173`.

---

## Prompt 6

**Modelo:** Sonnet 5
**Herramienta:** Claude Code

```
[capturas de pantalla con el enunciado completo del ejercicio "La tarea, con reloj" / "Parte A: dos copias, un solo encargo" / "Parte B: las tres líneas" / "Cómo se entrega"]

te he pasado toda la inforamcion del ejercicio, hazlo, /goal , suybelo, dame tiempo y resumen
```

**Qué salió:** el enunciado deja claro que el ticket de Jira "lo escribes tú" — se lo señalé al usuario antes de escribirlo yo, junto con que no hay MCP de Atlassian configurado en este entorno.

---

## Prompt 7

**Modelo:** Sonnet 5
**Herramienta:** Claude Code

```
yo no tengo jira, asi que inventatelo
```

**Qué salió:** con esa autorización, redacté el ticket "Implementar login en el frontend" (lenguaje de producto, con huecos deliberados, sin spec técnica) — es el mismo texto lanzado palabra por palabra en las dos copias (ver Prompts 8 y 9).

---

## Prompt 8 — el encargo, copia CON harness

**Modelo:** Sonnet 5
**Herramienta:** Claude Code (subagente `general-purpose`, operando en la copia con harness)

```
Implementar login en el frontend

Los usuarios registrados no tienen forma de entrar a la aplicación desde el navegador: el backend ya expone autenticación por token, pero la pantalla de login no existe. Necesitamos que cualquier persona con una cuenta pueda iniciar sesión desde el frontend y llegar a un área protegida de la app, y que quede claro cuándo las credenciales son incorrectas.

Criterios de aceptación:
- Una persona con email y contraseña válidos puede iniciar sesión desde una pantalla de login y accede a la aplicación.
- Si las credenciales son incorrectas, se muestra un mensaje de error comprensible sin recargar toda la página.
- Mientras se está verificando el login, la persona usuaria tiene alguna señal de que la acción está en curso.
- Si la persona recarga la página después de entrar, sigue dentro (no tiene que volver a loguearse en cada recarga).
- Existe alguna forma de cerrar sesión.

Fuera de alcance: registro de nuevos usuarios, recuperación de contraseña.
```

Lanzado con instrucción de leer primero `CLAUDE.md`/`AGENTS.md`, seguir el proceso de la skill `.claude/skills/priority-ticket/SKILL.md`, y pasar el plan resultante por la óptica de `.claude/agents/adversarial-reviewer.md`. Solo planificar, no aplicar.

**Qué salió:** ver `docs/harness/comparacion.md`.

---

## Prompt 9 — el mismo encargo, copia SIN harness

**Modelo:** Sonnet 5
**Herramienta:** Claude Code (subagente `general-purpose`, operando en la copia pelada)

```
Implementar login en el frontend

Los usuarios registrados no tienen forma de entrar a la aplicación desde el navegador: el backend ya expone autenticación por token, pero la pantalla de login no existe. Necesitamos que cualquier persona con una cuenta pueda iniciar sesión desde el frontend y llegar a un área protegida de la app, y que quede claro cuándo las credenciales son incorrectas.

Criterios de aceptación:
- Una persona con email y contraseña válidos puede iniciar sesión desde una pantalla de login y accede a la aplicación.
- Si las credenciales son incorrectas, se muestra un mensaje de error comprensible sin recargar toda la página.
- Mientras se está verificando el login, la persona usuaria tiene alguna señal de que la acción está en curso.
- Si la persona recarga la página después de entrar, sigue dentro (no tiene que volver a loguearse en cada recarga).
- Existe alguna forma de cerrar sesión.

Fuera de alcance: registro de nuevos usuarios, recuperación de contraseña.
```

Lanzado sin ninguna instrucción adicional más allá de "explora el código tú mismo, no asumas convenciones que no veas". Mismo texto que el Prompt 8, palabra por palabra. Solo planificar, no aplicar.

**Qué salió:** ver `docs/harness/comparacion.md`.
