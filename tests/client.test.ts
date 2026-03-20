// @vitest-environment node
import { describe, test, expect, vi, afterEach } from 'vitest'
import { RutterClient } from '../src/client'
import { RutterError } from '../src/errors'

const client = new RutterClient(
  'https://sandbox.rutterapi.com',
  'test-client-id',
  'test-client-secret',
)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RutterClient', () => {
  test('sends Basic auth header with base64-encoded clientId:clientSecret', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'ok' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.get('/test')

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    const expected = btoa('test-client-id:test-client-secret')
    expect(headers['Authorization']).toBe(`Basic ${expected}`)
  })

  test('sends X-Rutter-Version header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'ok' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.get('/test')

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    expect(headers['X-Rutter-Version']).toBe('2024-08-31')
  })

  test('GET builds query params from object', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.get('/test', {
      access_token: 'at_123',
      limit: 10,
    })

    const [calledUrl] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toBe(
      'https://sandbox.rutterapi.com/test?access_token=at_123&limit=10',
    )
  })

  test('GET omits undefined query params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.get('/test', {
      access_token: 'at_123',
      cursor: undefined,
    })

    const [calledUrl] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toBe(
      'https://sandbox.rutterapi.com/test?access_token=at_123',
    )
  })

  test('POST sends JSON body with Content-Type header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ created: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.post('/test', { platform: 'QUICKBOOKS' })

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(opts.body).toBe(JSON.stringify({ platform: 'QUICKBOOKS' }))
    expect(opts.method).toBe('POST')
  })

  test('DELETE sends correct method', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.delete('/connections', { access_token: 'at_del' })

    const [calledUrl, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(opts.method).toBe('DELETE')
    expect(calledUrl).toContain('access_token=at_del')
  })

  test('throws RutterError on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error_type: 'AUTHENTICATION_ERROR',
            error_code: 'invalid_credentials',
            error_message: 'Invalid credentials.',
          }),
      }),
    )

    try {
      await client.get('/test')
      expect.fail('Expected RutterError to be thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(RutterError)
      const err = e as RutterError
      expect(err.status).toBe(401)
      expect(err.errorType).toBe('AUTHENTICATION_ERROR')
      expect(err.errorCode).toBe('invalid_credentials')
      expect(err.message).toBe('Invalid credentials.')
    }
  })

  test('POST sends Idempotency-Key header when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ created: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.post(
      '/test',
      { data: 'value' },
      { idempotencyKey: 'idem_123' },
    )

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    expect(headers['Idempotency-Key']).toBe('idem_123')
  })

  test('POST omits Idempotency-Key header when not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ created: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.post('/test', { data: 'value' })

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    expect(headers['Idempotency-Key']).toBeUndefined()
  })

  test('preserves error_metadata on RutterError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 450,
        json: () =>
          Promise.resolve({
            error_type: 'PLATFORM_ERROR',
            error_code: 'platform_bad_request',
            error_message: 'Platform rejected request.',
            error_metadata: {
              source: 'platform',
              human_readable: 'Amount must be positive.',
              platform: { raw_error: 'negative amount' },
            },
          }),
      }),
    )

    try {
      await client.get('/test')
      expect.fail('Expected RutterError to be thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(RutterError)
      const err = e as RutterError
      expect(err.status).toBe(450)
      expect(err.metadata?.source).toBe('platform')
      expect(err.metadata?.human_readable).toBe('Amount must be positive.')
      expect(err.isUserActionable).toBe(true)
      expect(err.isRateLimited).toBe(false)
      expect(err.humanReadableMessage).toBe('Amount must be positive.')
    }
  })

  test('RutterError.isRateLimited for 429 and 452', async () => {
    const err429 = new RutterError(
      {
        error_type: 'RATE_LIMIT',
        error_code: 'rate_limit',
        error_message: 'Too many requests',
      },
      429,
    )
    const err452 = new RutterError(
      {
        error_type: 'PLATFORM_ERROR',
        error_code: 'rate_limit',
        error_message: 'Platform rate limit',
      },
      452,
    )
    const err400 = new RutterError(
      {
        error_type: 'INVALID_REQUEST',
        error_code: 'invalid',
        error_message: 'Bad request',
      },
      400,
    )

    expect(err429.isRateLimited).toBe(true)
    expect(err452.isRateLimited).toBe(true)
    expect(err400.isRateLimited).toBe(false)
  })

  test('PATCH sends correct method with body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ updated: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.patch('/test/123', { name: 'Updated' })

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(opts.method).toBe('PATCH')
    expect(opts.body).toBe(JSON.stringify({ name: 'Updated' }))
  })
})
