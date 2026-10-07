import type { TaskStatus } from '@/lib/types'

/** Orden en que se ofrecen los estados en cada fila. */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'pending',
  'in_progress',
  'done',
]

/** Cómo se pinta cada estado en pantalla. */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  done: 'Hecho',
}
