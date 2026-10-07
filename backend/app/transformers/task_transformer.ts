import type Task from '#models/task'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Expects `assignee` to be preloaded. Of the assignee only the id and the name
 * are exposed: the list never needs the email or any other account data, so
 * `UserTransformer` is deliberately not reused here.
 *
 * `today` is the reference day (`YYYY-MM-DD`) of whoever is asking: the
 * overdue verdict is computed for every response and never stored.
 */
export default class TaskTransformer extends BaseTransformer<Task> {
  constructor(
    resource: Task,
    protected today: string
  ) {
    super(resource)
  }

  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'status', 'dueDate', 'createdAt', 'updatedAt']),
      isOverdue: this.resource.isOverdueOn(this.today),
      assignee: this.pick(this.resource.assignee, ['id', 'fullName']),
    }
  }
}
