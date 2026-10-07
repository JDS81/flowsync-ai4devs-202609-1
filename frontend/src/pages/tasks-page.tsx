import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertCircleIcon, Loader2Icon } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import type { Task, TaskStatus } from '@/lib/types'
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/task-status'
import { useAuth } from '@/auth/use-auth'
import { useAuthForm } from '@/auth/use-auth-form'
import { FieldError } from '@/components/field-error'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FIELDS = ['title'] as const

export function TasksPage() {
  const { token, expireSession } = useAuth()
  // `null` mientras la lista no ha llegado: se distingue de la lista vacía.
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  // Última petición de estado lanzada por tarea: si se pulsa dos veces seguidas,
  // la respuesta más antigua no puede pisar a la más reciente al llegar tarde.
  const latestRequest = useRef(new Map<number, number>())

  /**
   * Un 401 en cualquier operación de tareas significa que el servidor ya no
   * reconoce la sesión: se cierra en local y el login explica por qué.
   * Devuelve `true` si el error era ese y ya está atendido.
   */
  const expireIfUnauthorized = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        expireSession(error.message)
        return true
      }
      return false
    },
    [expireSession],
  )

  // `ProtectedRoute` garantiza que aquí hay sesión, y por tanto token.
  useEffect(() => {
    if (!token) return

    let cancelled = false

    api
      .listTasks(token)
      .then((list) => {
        if (!cancelled) setTasks(list)
      })
      .catch((error: unknown) => {
        if (cancelled || expireIfUnauthorized(error)) return
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'No se pudo cargar la lista de tareas.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [token, expireIfUnauthorized])

  const handleCreated = (task: Task) =>
    // Sin regla de orden decidida: la nueva va al final, sin reordenar nada.
    setTasks((current) => [...(current ?? []), task])

  /**
   * Cambio optimista: la fila muestra el nuevo estado al instante y, si el
   * servidor lo rechaza, vuelve al anterior con un aviso.
   */
  const changeStatus = (task: Task, status: TaskStatus) => {
    if (!token || task.status === status) return

    const replace = (next: Task) =>
      setTasks((current) =>
        (current ?? []).map((item) => (item.id === next.id ? next : item)),
      )

    setActionError(null)
    replace({ ...task, status })

    const requestId = (latestRequest.current.get(task.id) ?? 0) + 1
    latestRequest.current.set(task.id, requestId)
    const isLatest = () => latestRequest.current.get(task.id) === requestId

    api
      .updateTaskStatus(token, task.id, status)
      .then((updated) => {
        if (isLatest()) replace(updated)
      })
      .catch((error: unknown) => {
        if (expireIfUnauthorized(error)) return
        if (!isLatest()) return
        replace(task)
        setActionError(
          error instanceof ApiError
            ? error.message
            : 'No se pudo cambiar el estado.',
        )
      })
  }

  return (
    <div className="bg-muted/40 flex min-h-svh justify-center p-6">
      <div className="grid w-full max-w-2xl content-start gap-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Tareas del equipo
          </h1>
          <Link
            to="/profile"
            className="text-foreground text-sm font-medium underline"
          >
            Mi perfil
          </Link>
        </header>

        <CreateTaskForm
          token={token}
          onCreated={handleCreated}
          onUnauthorized={expireIfUnauthorized}
        />

        {actionError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {loadError ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : tasks === null ? (
          <div
            className="flex justify-center py-12"
            role="status"
            aria-live="polite"
          >
            <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
            <span className="sr-only">Cargando tareas…</span>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-3">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onChangeStatus={changeStatus}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

type CreateTaskFormProps = {
  token: string | null
  onCreated: (task: Task) => void
  onUnauthorized: (error: unknown) => boolean
}

/** El título es lo único que se pide: ni responsable, ni estado, ni fecha. */
function CreateTaskForm({
  token,
  onCreated,
  onUnauthorized,
}: CreateTaskFormProps) {
  const { isSubmitting, formError, fieldErrors, submit } = useAuthForm(FIELDS)
  const [title, setTitle] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) return

    return submit(async () => {
      try {
        // Recortado aquí, «solo espacios» llega vacío y recibe el mismo aviso
        // que el campo en blanco.
        onCreated(await api.createTask(token, title.trim()))
        setTitle('')
      } catch (error) {
        // `submit` se traga los `ApiError` para pintarlos en el formulario;
        // la sesión caducada se atiende antes y no se pinta como error.
        if (onUnauthorized(error)) return
        throw error
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva tarea</CardTitle>
        <CardDescription>
          Basta con el título: nace a tu nombre y en «Pendiente».
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          {formError && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            {/* Sin `maxLength`: el navegador recortaría en silencio lo que el
                servidor tiene que poder rechazar con aviso. */}
            <Input
              id="title"
              name="title"
              autoComplete="off"
              placeholder="Revisar la propuesta del cliente"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? 'title-error' : undefined}
            />
            <FieldError id="title-error" message={fieldErrors.title} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creando…' : 'Crear tarea'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Todavía no hay tareas</CardTitle>
        <CardDescription>
          Aquí aparecerán todas las tareas del equipo, con quién lleva cada una
          y en qué estado está. Escribe arriba el título de la primera y pulsa
          «Crear tarea».
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

type TaskRowProps = {
  task: Task
  onChangeStatus: (task: Task, status: TaskStatus) => void
}

/** Título, responsable (por su nombre, nunca su email ni su id) y estado. */
function TaskRow({ task, onChangeStatus }: TaskRowProps) {
  return (
    <li>
      <Card className="gap-3 py-4">
        <CardContent className="grid gap-3 px-4">
          <div className="min-w-0">
            <p className="font-medium break-words">{task.title}</p>
            <p className="text-muted-foreground text-sm">
              Responsable: {task.assignee.fullName ?? 'Sin nombre'}
            </p>
          </div>

          <div
            role="group"
            aria-label={`Estado de «${task.title}»`}
            className="flex flex-wrap gap-2"
          >
            {TASK_STATUSES.map((status) => {
              const isCurrent = task.status === status
              return (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={isCurrent ? 'default' : 'outline'}
                  aria-pressed={isCurrent}
                  onClick={() => onChangeStatus(task, status)}
                >
                  {TASK_STATUS_LABELS[status]}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </li>
  )
}
