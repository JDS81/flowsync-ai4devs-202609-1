import Task from '#models/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'
import { createTaskValidator, updateTaskValidator } from '#validators/task'

export default class TasksController {
  /**
   * Every task of the shared list, the same for everyone. No ordering on
   * purpose: the order rule is still an open product decision.
   */
  async index({ serialize }: HttpContext) {
    const tasks = await Task.query().preload('assignee')
    return serialize(TaskTransformer.transform(tasks))
  }

  /**
   * The title is the only input. The task is born `pending` (column default)
   * and assigned to whoever creates it.
   */
  async store({ auth, request, response, serialize }: HttpContext) {
    const { title } = await request.validateUsing(createTaskValidator)

    const task = await Task.create({ title, assigneeId: auth.getUserOrFail().id })
    // Re-fetch so the column default (`status`) and the assignee are both loaded.
    const created = await Task.query().where('id', task.id).preload('assignee').firstOrFail()

    response.status(201)
    return serialize(TaskTransformer.transform(created))
  }

  /**
   * Anyone signed in can change the status and/or the assignee of any task.
   */
  async update({ params, request, serialize }: HttpContext) {
    const task = await Task.findOrFail(params.id)
    const { status, assigneeId } = await request.validateUsing(updateTaskValidator)

    if (status !== undefined) task.status = status
    if (assigneeId !== undefined) task.assigneeId = assigneeId
    await task.save()

    await task.load('assignee')
    return serialize(TaskTransformer.transform(task))
  }
}
