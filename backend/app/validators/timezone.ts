import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

/**
 * Accepts any time zone Luxon (and so the IANA database of the system) knows.
 */
const ianaZone = vine.createRule((value, _options, field) => {
  if (typeof value !== 'string' || !DateTime.now().setZone(value).isValid) {
    field.report('The {{ field }} field must be a valid IANA time zone', 'timezone', field)
  }
})

/**
 * Validator for the reference time zone sent by the client in `X-Timezone`.
 * Absent means "use UTC"; the caller turns an empty header into absent first.
 */
export const timezoneValidator = vine.create({
  timezone: vine.string().use(ianaZone()).optional(),
})
