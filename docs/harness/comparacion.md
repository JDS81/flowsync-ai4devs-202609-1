# Comparación: con harness vs. sin harness

> Nota de proceso: este ejercicio lo ejecutó el asistente de IA de principio a fin (montaje del harness, redacción del ticket —no había Jira disponible— y lanzamiento del mismo encargo en las dos copias), a petición explícita del usuario. Por eso "cuántas veces tuviste que intervenir" se responde desde la ejecución de la IA, no desde la experiencia manual de una persona guiando el agente en vivo. Se deja así de forma transparente en vez de simular una experiencia que no ocurrió.

**Encargo lanzado** (idéntico, palabra por palabra, en las dos copias — ver `prompts.md`, Prompts 8 y 9): ticket "Implementar login en el frontend", redactado en lenguaje de producto con huecos deliberados (sin especificar mecanismo de persistencia, cliente HTTP, ruteo, ni contenido del "área protegida").

## 1. Qué archivos propone tocar, contados

| | Con harness | Sin harness |
|---|---|---|
| Backend | 0 | 0 |
| Frontend nuevos | 4 | 9 |
| Frontend editados | 3 | 2 |
| **Total** | **7** | **11** |

Ambas copias coinciden en que el backend ya cubre el ticket (login/logout/profile ya existen) y no proponen tocarlo. La diferencia está toda en el frontend: la copia pelada separa en más archivos cosas que la copia con harness concentra (p. ej. añade `types/user.ts` y un `.env.example` propio; separa CSS por componente donde la copia con harness reutiliza variables ya definidas en `index.css`).

## 2. Qué convenciones respetó y cuáles no

**Con harness** — tenía convenciones nombradas en `CLAUDE.md` contra las que contrastar:
- Patrón transformer + `ctx.serialize`, guard `api` por token, prohibición de editar archivos generados: todas respetadas (no aplicaba tocarlas porque no tocó backend).
- Regla de proceso "flaggear en vez de resolver en silencio": cumplida — cada decisión abierta quedó nombrada con su justificación.
- **Una convención explícitamente NO seguida**: `CLAUDE.md` dice *"Prefer using tuyau over hand-written fetch wrappers once you add it"*. El plan eligió un wrapper de `fetch` a mano de todas formas. No lo ocultó — lo señaló como la mayor desviación de su propio plan en la autorevisión adversarial — pero la convención escrita no cambió la decisión final.

**Sin harness** — no había ninguna convención escrita en ninguna parte, esa es la respuesta y vale. El agente infirió patrones leyendo el código (guard por token, ausencia de router/estado) pero no tenía nada contra lo que declarar una desviación, porque no existía ningún documento con una preferencia explícita como la de tuyau.

## 3. Cuántas veces tuvo que intervenir

**0 en ambas copias**, en el sentido estricto de corrección/aclaración en vivo — las dos se lanzaron como una sola ejecución en segundo plano, sin ida y vuelta. (Ver nota de proceso arriba: esto mide el harness, no la paciencia de una persona interviniendo, porque aquí no hubo una persona interviniendo.)

## 4. Qué tocaría arreglar a mano antes de enseñárselo a alguien

**Con harness:**
- Decidir de verdad sobre tuyau: el plan lo dejó como tensión abierta y sin resolver contra una preferencia ya escrita — un revisor humano tendría que zanjarlo, no solo leerlo.
- Confirmar contra un servidor real el shape exacto de la respuesta de error de `verifyCredentials` (401/422 con qué forma de JSON) — el plan lo asumió sin verificar porque la tarea era solo de planificación.

**Sin harness:**
- El mismo punto de la respuesta de error, sin verificar.
- Un gap real que el propio agente encontró y no arregló: `frontend/.gitignore` no ignora `.env` plano (solo `*.local`), y el plan añade `.env.example` sin tocar esa regla — quedaría un archivo de configuración real potencialmente commiteable si alguien no se da cuenta.
- Más superficie para revisar por el mayor número de archivos (CSS separado por componente, tipos en archivo aparte) sin que ninguna de esas decisiones esté mal — solo hay más piezas sueltas que alguien tiene que mirar una por una.

---

# Las tres líneas

1. **Piezas montadas y la que más costó:** `CLAUDE.md` + `AGENTS.md` (con reglas de proceso al final), hook de Prettier "check después", subagente `adversarial-reviewer`, skills `/priority-ticket` y `/commit` — 7 de las 8 piezas de la lista del mentor. La que faltó: el MCP de Atlassian, por no tener credenciales de Jira disponibles en este entorno. La que más costó de lo esperado fue el hook de Prettier: el primer intento metía un parser de JSON inline dentro de un one-liner de bash (`node -e "..."` con comillas anidadas), y el escaping se rompía solo. Hubo que sacarlo a un script `.sh` aparte y apoyarse en `jq` para que quedara algo que no fuera frágil.

2. **Primera diferencia entre las dos salidas:** el número de archivos, mirando solo el encabezado "Archivos a tocar" de cada informe antes de leer nada del detalle — 7 contra 11. No hizo falta abrir ningún archivo del repo para verla, bastó comparar los dos resúmenes uno al lado del otro.

3. **Algo escrito en el harness que el agente no cumplió igual:** `CLAUDE.md` no sugiere tuyau, lo pide con lenguaje de preferencia explícito ("Prefer... once you add it"). El propio plan de la copia con harness reconoce esa frase, la cita, y aun así elige fetch a mano — justificando que instalar y conectar tuyau sería trabajo de setup no pedido por el ticket. Un archivo de instrucciones subió la probabilidad de que se nombrara y sopesara la convención, pero no garantizó que se siguiera.
