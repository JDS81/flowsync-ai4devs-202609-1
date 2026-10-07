import vine from '@vinejs/vine'
import { TASK_STATUSES } from '#models/task'

/**
 * Validator to use when creating a task. The title is the only input: anything
 * else in the body (status, assignee…) is dropped by VineJS.
 *
 * `trim()` runs before the length rules, so a title made only of spaces fails
 * `minLength` instead of being stored blank, and the 255 limit is counted
 * without the surrounding spaces. Over the limit is rejected, never truncated.
 */
export const createTaskValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(255),
})

/**
 * VineJS treats `null` as a missing value, so an optional field silently skips
 * it. An implicit rule runs even then, which lets `assigneeId: null` be
 * rejected instead of ignored (a task always has an assignee).
 */
const notNull = vine.createRule(
  (value, _options, field) => {
    if (value === null) {
      field.report('The {{ field }} field must not be null', 'notNull', field)
    }
  },
  { implicit: true }
)

/**
 * Validator to use when updating a task. Only status and assignee can change,
 * and at least one of them must be present: when both are missing, `status`
 * fails as required.
 */
export const updateTaskValidator = vine.create({
  status: vine.enum(TASK_STATUSES).optional().requiredIfMissing('assigneeId'),
  assigneeId: vine
    .number()
    .withoutDecimals()
    .exists({ table: 'users', column: 'id' })
    .optional()
    .use(notNull()),
})
