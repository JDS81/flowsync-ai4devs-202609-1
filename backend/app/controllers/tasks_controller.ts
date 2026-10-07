import Task from '#models/task'
import { errors } from '@vinejs/vine'
import { referenceDay } from '#services/reference_day'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'
import { createTaskValidator, updateTaskValidator } from '#validators/task'

/**
 * Of the assignee only these columns are ever exposed, so nothing else (email,
 * password hash) is loaded into memory either.
 */
const ASSIGNEE_COLUMNS = ['id', 'full_name']

export default class TasksController {
  /**
   * Every task of the shared list, the same for everyone. No ordering on
   * purpose: the order rule is still an open product decision.
   */
  async index({ request, serialize }: HttpContext) {
    const today = await referenceDay(request)
    const tasks = await Task.query().preload('assignee', (q) => q.select(ASSIGNEE_COLUMNS))
    return serialize(TaskTransformer.transform(tasks, today))
  }

  /**
   * A single task, the minimum surface for "opening" it. Same 404 envelope as
   * `update`.
   */
  async show({ params, request, response, serialize }: HttpContext) {
    const today = await referenceDay(request)
    const task = await Task.query()
      .where('id', params.id)
      .preload('assignee', (q) => q.select(ASSIGNEE_COLUMNS))
      .first()
    if (!task) {
      return response.notFound({ errors: [{ message: 'Task not found' }] })
    }

    return serialize(TaskTransformer.transform(task, today))
  }

  /**
   * The title is required and the due date optional. The task is born
   * `pending` (column default) and assigned to whoever creates it.
   */
  async store({ auth, request, response, serialize }: HttpContext) {
    const today = await referenceDay(request)
    const { title, dueDate } = await request.validateUsing(createTaskValidator)

    const task = await Task.create({
      title,
      dueDate: dueDate ?? null,
      assigneeId: auth.getUserOrFail().id,
    })
    // Re-fetch so the column default (`status`) and the assignee are both loaded.
    const created = await Task.query()
      .where('id', task.id)
      .preload('assignee', (q) => q.select(ASSIGNEE_COLUMNS))
      .firstOrFail()

    response.status(201)
    return serialize(TaskTransformer.transform(created, today))
  }

  /**
   * Anyone signed in can change the status, the assignee and/or the due date
   * of any task.
   */
  async update({ params, request, response, serialize }: HttpContext) {
    const today = await referenceDay(request)

    // `findOrFail` would render the framework's E_ROW_NOT_FOUND (with stack
    // frames in debug mode); answer with the API's usual error envelope instead.
    const task = await Task.find(params.id)
    if (!task) {
      return response.notFound({ errors: [{ message: 'Task not found' }] })
    }

    const payload = await request.validateUsing(updateTaskValidator)
    // `'dueDate' in payload` tells an explicit `null` (remove the date) apart
    // from a missing key (leave it alone).
    const hasDueDate = 'dueDate' in payload
    if (payload.status === undefined && payload.assigneeId === undefined && !hasDueDate) {
      throw new errors.E_VALIDATION_ERROR([
        {
          message: 'Send at least one of status, assigneeId or dueDate',
          rule: 'required',
          field: 'status',
        },
      ])
    }

    if (payload.status !== undefined) task.status = payload.status
    if (payload.assigneeId !== undefined) task.assigneeId = payload.assigneeId
    if (hasDueDate) task.dueDate = payload.dueDate ?? null
    await task.save()

    await task.load('assignee', (q) => q.select(ASSIGNEE_COLUMNS))
    return serialize(TaskTransformer.transform(task, today))
  }
}
