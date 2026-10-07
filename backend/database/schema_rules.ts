import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    tasks: {
      columns: {
        /**
         * A calendar day kept as plain `YYYY-MM-DD` text. The default rule for
         * `date` would turn it into a Luxon `DateTime`, i.e. an instant in some
         * zone, which is exactly how a due date drifts by one day.
         */
        due_date: { tsType: 'string', decorators: [{ name: '@column' }] },
      },
    },
  },
} satisfies SchemaRules
