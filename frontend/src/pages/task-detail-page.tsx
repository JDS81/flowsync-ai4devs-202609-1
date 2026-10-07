import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AlertCircleIcon, CalendarX2Icon, Loader2Icon } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import type { Task } from '@/lib/types'
import { useAuth } from '@/auth/use-auth'
import { FieldError } from '@/components/field-error'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const INVALID_DATE = 'Introduce una fecha válida.'

/**
 * Pantalla mínima de una tarea: su título y su fecha de vencimiento, que se
 * pone, cambia o quita aquí mismo. No es la vista de detalle completa: ni el
 * título, ni el estado, ni el responsable se editan desde aquí.
 */
export function TaskDetailPage() {
  const { id } = useParams()
  const taskId = Number(id)
  const { token, expireSession } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  // Lo que muestra el campo. Va aparte de `task.dueDate` para poder volver a
  // la fecha guardada si un cambio falla.
  const [dateValue, setDateValue] = useState('')
  const [isSaving, setSaving] = useState(false)
  // Último guardado lanzado: si se cambia la fecha dos veces seguidas, solo la
  // respuesta del último cuenta, aunque la de uno anterior llegue más tarde.
  const latestSave = useRef(0)
  // Última versión confirmada por el servidor, para revertir a ella si falla.
  const confirmed = useRef<Task | null>(null)

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

  useEffect(() => {
    if (!token) return
    let cancelled = false

    api
      .getTask(token, taskId)
      .then((loaded) => {
        if (cancelled) return
        confirmed.current = loaded
        setTask(loaded)
        setDateValue(loaded.dueDate ?? '')
      })
      .catch((error: unknown) => {
        if (cancelled || expireIfUnauthorized(error)) return
        setLoadError(
          error instanceof ApiError && error.status === 404
            ? 'Esta tarea no existe.'
            : error instanceof ApiError
              ? error.message
              : 'No se pudo cargar la tarea.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [token, taskId, expireIfUnauthorized])

  /**
   * Se guarda sin botón ni confirmación. Lo que se pinta después (fecha y
   * vencida) es siempre lo que devuelve el servidor.
   */
  const saveDueDate = (dueDate: string | null) => {
    if (!token || !task) return

    setFieldError(null)
    setSaveError(null)
    setSaving(true)
    const saveId = ++latestSave.current
    const isLatest = () => latestSave.current === saveId

    api
      .updateTaskDueDate(token, task.id, dueDate)
      .then((updated) => {
        confirmed.current = updated
        if (!isLatest()) return
        setTask(updated)
        setDateValue(updated.dueDate ?? '')
      })
      .catch((error: unknown) => {
        if (expireIfUnauthorized(error)) return
        if (!isLatest()) return
        // El servidor conserva la fecha anterior: se vuelve a la última
        // versión confirmada.
        const previous = confirmed.current ?? task
        setTask(previous)
        setDateValue(previous.dueDate ?? '')
        if (error instanceof ApiError && error.fieldErrors.dueDate) {
          setFieldError(error.fieldErrors.dueDate)
        } else {
          setSaveError(
            error instanceof ApiError
              ? error.message
              : 'No se pudo guardar la fecha.',
          )
        }
      })
      .finally(() => {
        if (isLatest()) setSaving(false)
      })
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, validity } = event.target
    setDateValue(value)

    // Un valor vacío con `badInput` es una fecha a medio escribir o que no
    // existe: no se envía nada y la tarea conserva la que tuviera.
    if (validity.badInput) {
      setFieldError(INVALID_DATE)
      return
    }

    // Vacío sin `badInput`: se ha borrado con el propio control → quitar.
    const next = value === '' ? null : value
    if (next === (task?.dueDate ?? null)) {
      setFieldError(null)
      return
    }
    saveDueDate(next)
  }

  return (
    <div className="bg-muted/40 flex min-h-svh justify-center p-6">
      <div className="grid w-full max-w-2xl content-start gap-6">
        <header>
          <Link
            to="/tasks"
            className="text-foreground text-sm font-medium underline"
          >
            Volver a la lista
          </Link>
        </header>

        {loadError ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : !task ? (
          <div
            className="flex justify-center py-12"
            role="status"
            aria-live="polite"
          >
            <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
            <span className="sr-only">Cargando tarea…</span>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="break-words">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {saveError && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Fecha de vencimiento</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    className="w-auto"
                    value={dateValue}
                    onChange={handleDateChange}
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? 'dueDate-error' : undefined}
                  />
                  {task.dueDate && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => saveDueDate(null)}
                      disabled={isSaving}
                    >
                      Quitar fecha
                    </Button>
                  )}
                </div>
                <FieldError
                  id="dueDate-error"
                  message={fieldError ?? undefined}
                />
              </div>

              {/* Señal propia: texto e icono, no solo color. Si no está
                  vencida no se pinta nada, tampoco por no tener fecha. */}
              {/* La región viva está siempre montada y su contenido cambia: así
                  los lectores de pantalla anuncian «Vencida» al aparecer. */}
              <div role="status" aria-live="polite">
                {task.isOverdue && (
                  <Alert variant="destructive" role="none">
                    <CalendarX2Icon />
                    <AlertTitle>Vencida</AlertTitle>
                    <AlertDescription>
                      La fecha de vencimiento ya ha pasado y la tarea no está
                      hecha.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
