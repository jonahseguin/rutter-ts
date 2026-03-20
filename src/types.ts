export interface RutterErrorMetadata {
  source: 'rutter' | 'platform'
  human_readable: string
  platform?: Record<string, unknown>
}

export interface RutterErrorBody {
  error_type: string
  error_code: string
  error_message: string
  error_metadata?: RutterErrorMetadata
}

export type RutterPaginationParams = {
  cursor?: string
}

export type RutterQueryParams = Record<
  string,
  string | number | boolean | undefined
>

export interface RutterRequestOptions {
  idempotencyKey?: string
}
