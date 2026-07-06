export class HttpError extends Error {
  status: number
  payload: any
  constructor(status: number, payload: any) {
    super(typeof payload === 'string' ? payload : payload?.error ?? 'error')
    this.status = status
    this.payload = payload
  }
}
