import { Request, Response, NextFunction } from 'express'
import { translateError } from '../lib/translateError'
import { HttpError } from '../lib/httpError'

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[ERROR]', err)

  if (err instanceof HttpError) {
    return res.status(err.status).json(
      typeof err.payload === 'string' ? { error: err.payload } : err.payload
    )
  }

  const status = err.status ?? 400

  let rawMsg: string = err.message ?? ''
  if (Array.isArray(err.issues) && err.issues.length > 0) {
    const first = err.issues[0]
    rawMsg = first?.message ?? rawMsg
    if (first?.path?.length) {
      rawMsg = `${first.path.join('.')}: ${rawMsg}`
    }
  }

  const friendly = translateError(rawMsg)

  res.status(status).json({
    error: friendly,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, raw: rawMsg }),
  })
}
