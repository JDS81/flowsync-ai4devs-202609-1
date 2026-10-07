import { TaskSchema } from '#database/schema'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * Conjunto cerrado de estados de una tarea. Fuente única para el validador y
 * los tipos; la migración lo repite literal a propósito (es historia congelada).
 */
export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export default class Task extends TaskSchema {
  /**
   * El esquema generado tipa la columna como `string`; aquí se estrecha al
   * conjunto cerrado (la BD lo garantiza con un CHECK).
   */
  declare status: TaskStatus

  @belongsTo(() => User, { foreignKey: 'assigneeId' })
  declare assignee: BelongsTo<typeof User>

  /**
   * The overdue rule, and its only implementation: a task is overdue if and
   * only if it has a due date, that date is before `today`, and it is not done.
   *
   * Both dates are `YYYY-MM-DD` calendar days, so comparing the strings is the
   * same as comparing the days, with no time zone involved. `today` is the
   * reference day of whoever is asking; the result is never stored.
   */
  isOverdueOn(today: string): boolean {
    return this.dueDate !== null && this.dueDate < today && this.status !== 'done'
  }
}
