import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    /**
     * An unknown route (including `/tasks/abc`, rejected by the numeric
     * matcher) answers with the API's usual `{ errors }` envelope. Left to the
     * default renderer, debug mode would dump stack frames and absolute paths.
     */
    if ((error as { code?: string } | null)?.code === 'E_ROUTE_NOT_FOUND') {
      return ctx.response.status(404).send({ errors: [{ message: 'Not found' }] })
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
