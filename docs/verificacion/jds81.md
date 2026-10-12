# Trazabilidad — «Lo que cada tarea muestra de su responsable»

**Scenarios en el requisito: 4 · Cubiertos: 0**

| Scenario | Test que lo cubre | Estado | Qué te faltó |
|---|---|---|---|
| Una tarea cuyo responsable tiene nombre trae ese nombre y sus iniciales | — | No cubierto | — |
| Una tarea pedida suelta no incluye en su responsable ni el email ni otros datos de acceso | — | No cubierto | — |
| Una tarea dentro de la lista no incluye en su responsable ni el email ni otros datos de acceso | — | No cubierto | — |
| Una tarea cuyo responsable se registró sin nombre trae el nombre nulo y las iniciales igualmente | — | No cubierto | — |

## Parte B

1. Creía cubiertos: no tenía ni idea (no llegué a dar un número antes de mirar) · Cubiertos: 0.
2. Scenarios 2 y 3 («no filtra datos de cuenta»): la regla dice «ningún otro dato de esa cuenta», pero la tarea suelta devuelve el `id` del responsable y no sé si eso la incumple o la spec lo permite; mi test lo dio por bueno, y esa regla la puse yo.
3. En el responsable sin nombre, el scenario dice que las iniciales «siguen llegando» y yo solo comprobé que no vienen vacías, no qué letras son: unas iniciales como «??» pasarían el test.

## Notas

- La spec tiene 3 scenarios en este requisito; aquí son 4 porque «La tarea no filtra datos de cuenta» dice *"suelta o dentro de la lista"*, que no cabe en una línea y se partió en dos.
- No había ningún test de tareas (solo `tests/functional/auth/`). Los de iniciales de `auth` se parecen a los scenarios 1 y 4, pero miran al usuario en el login, no al responsable dentro de una tarea; por eso son *No cubierto* y no *No lo sé*.
- Tests escritos en `backend/tests/functional/tasks/assignee.spec.ts` (grupo `Tasks | responsable`), uno por scenario: 3 en verde y **1 en rojo**, el scenario 3. La lista devuelve el email del responsable; se entrega en rojo, sin tocar el código.
