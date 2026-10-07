import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('title', 255).notNullable()

      /**
       * Conjunto cerrado de estados. Se escribe aquí literal (y no importado del
       * modelo) porque una migración es historia congelada: si el conjunto cambia,
       * lo hará otra migración. En SQLite `enu` se traduce a un CHECK.
       */
      table.enu('status', ['pending', 'in_progress', 'done']).notNullable().defaultTo('pending')

      /**
       * Sin ON DELETE CASCADE: hoy no se borran cuentas, y si algún día se puede,
       * arrastrar sus tareas en silencio sería destructivo.
       */
      table.integer('assignee_id').notNullable().unsigned().references('id').inTable('users')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
