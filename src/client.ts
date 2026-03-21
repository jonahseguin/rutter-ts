import { RUTTER_API_VERSION } from './constants'
import { RutterError } from './errors'
import type {
  RutterErrorBody,
  RutterQueryParams,
  RutterRequestOptions,
} from './types'

export class RutterClient {
  readonly baseUrl: string
  readonly clientId: string
  readonly clientSecret: string

  constructor(baseUrl: string, clientId: string, clientSecret: string) {
    this.baseUrl = baseUrl
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  private get authHeader(): Record<string, string> {
    return {
      Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options?: RutterRequestOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      ...this.authHeader,
      'X-Rutter-Version': RUTTER_API_VERSION,
    }

    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey
    }

    let requestBody: string | undefined
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    })

    if (!response.ok) {
      let error: RutterErrorBody
      try {
        error = (await response.json()) as RutterErrorBody
      } catch {
        throw new RutterError(
          {
            error_type: 'HTTP_ERROR',
            error_code: 'non_json_response',
            error_message: `Rutter API returned ${response.status}`,
          },
          response.status,
        )
      }
      throw new RutterError(error, response.status)
    }

    return response.json() as Promise<T>
  }

  private buildPath(path: string, params?: RutterQueryParams): string {
    if (!params) return path
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) query.set(key, String(value))
    }
    const qs = query.toString()
    return qs ? `${path}?${qs}` : path
  }

  get<T>(path: string, params?: RutterQueryParams): Promise<T> {
    return this.request<T>('GET', this.buildPath(path, params))
  }

  post<T>(
    path: string,
    body?: unknown,
    options?: RutterRequestOptions,
  ): Promise<T> {
    return this.request<T>('POST', path, body, options)
  }

  patch<T>(
    path: string,
    body?: unknown,
    options?: RutterRequestOptions,
  ): Promise<T> {
    return this.request<T>('PATCH', path, body, options)
  }

  delete<T>(path: string, params?: RutterQueryParams): Promise<T> {
    return this.request<T>('DELETE', this.buildPath(path, params))
  }
}
