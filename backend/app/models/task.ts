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
}
