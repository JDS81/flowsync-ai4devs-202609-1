import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { TASK_STATUSES } from '#models/task'

/**
 * A calendar day that exists (`2026-02-30` does not). The format itself is
 * checked by the regex before this rule runs.
 */
const calendarDay = vine.createRule((value, _options, field) => {
  if (typeof value !== 'string' || !DateTime.fromISO(value, { zone: 'utc' }).isValid) {
    // Own rule name: `date` would be overridden by VineJS' default
    // "must be a datetime value" message.
    field.report('The {{ field }} field must be a valid calendar day', 'calendarDay', field)
  }
})

/**
 * Due date: a calendar day as plain `YYYY-MM-DD` text, never converted to an
 * instant (that is how a date drifts by a day across time zones). A past day
 * is accepted on purpose. `null` means "no date"; the bodyparser already turns
 * an empty string into `null`, so `""` removes the date too.
 */
const dueDate = () =>
  vine
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .use(calendarDay())
    .nullable()
    .optional()

/**
 * Validator to use when creating a task. The title is required and the due
 * date optional; anything else in the body (status, assignee, isOverdue…) is
 * dropped by VineJS.
 *
 * `trim()` runs before the length rules, so a title made only of spaces fails
 * `minLength` instead of being stored blank, and the 255 limit is counted
 * without the surrounding spaces. Over the limit is rejected, never truncated.
 */
export const createTaskValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(255),
  dueDate: dueDate(),
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
 * Validator to use when updating a task. Only status, assignee and due date
 * can change. "At least one of them" is checked by the controller: VineJS'
 * `requiredIfMissing` treats `null` as missing, which would reject a body that
 * only removes the due date.
 */
export const updateTaskValidator = vine.create({
  status: vine.enum(TASK_STATUSES).optional(),
  assigneeId: vine
    .number()
    .withoutDecimals()
    .exists({ table: 'users', column: 'id' })
    .optional()
    .use(notNull()),
  dueDate: dueDate(),
})
