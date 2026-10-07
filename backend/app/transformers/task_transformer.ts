import type Task from '#models/task'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Expects `assignee` to be preloaded. Of the assignee only the id and the name
 * are exposed: the list never needs the email or any other account data, so
 * `UserTransformer` is deliberately not reused here.
 */
export default class TaskTransformer extends BaseTransformer<Task> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'status', 'createdAt', 'updatedAt']),
      assignee: this.pick(this.resource.assignee, ['id', 'fullName']),
    }
  }
}
