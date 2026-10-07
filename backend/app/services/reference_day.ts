import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import { timezoneValidator } from '#validators/timezone'

/**
 * The "today" against which the overdue rule is evaluated: the current
 * calendar day (`YYYY-MM-DD`) in the time zone of whoever makes the request,
 * sent in `X-Timezone`. Without the header, or with it empty, UTC is used. An
 * unknown zone fails validation (422) before anything is created or changed.
 */
export async function referenceDay(request: HttpContext['request']): Promise<string> {
  // `.optional()` only treats `undefined` as missing: an empty header has to
  // be normalised here or it would reach the zone rule and be rejected.
  const header = request.header('x-timezone')?.trim() || undefined
  const { timezone } = await timezoneValidator.validate({ timezone: header })

  return DateTime.now()
    .setZone(timezone ?? 'UTC')
    .toISODate()!
}
