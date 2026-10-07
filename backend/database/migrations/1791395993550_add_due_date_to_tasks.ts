import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  /**
   * Optional due date: a calendar day without time. Nullable, so every task
   * that existed before this migration stays valid, simply without a date.
   */
  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('due_date').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('due_date')
    })
  }
}
