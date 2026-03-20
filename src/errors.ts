import type { RutterErrorBody, RutterErrorMetadata } from './types'

export class RutterError extends Error {
  readonly status: number
  readonly errorType: string
  readonly errorCode: string
  readonly metadata?: RutterErrorMetadata

  constructor(body: RutterErrorBody, status: number) {
    super(body.error_message)
    this.name = 'RutterError'
    this.status = status
    this.errorType = body.error_type
    this.errorCode = body.error_code
    this.metadata = body.error_metadata
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.status === 452
  }

  get isUserActionable(): boolean {
    return (
      this.status === 400 ||
      this.status === 409 ||
      this.status === 410 ||
      this.status === 450
    )
  }

  get humanReadableMessage(): string {
    return this.metadata?.human_readable ?? this.message
  }
}

export class RutterSchemaMismatchError extends Error {
  readonly endpoint: string

  constructor(endpoint: string, issues: string) {
    super(
      `Rutter response from ${endpoint} failed schema validation: ${issues}`,
    )
    this.name = 'RutterSchemaMismatchError'
    this.endpoint = endpoint
  }
}
