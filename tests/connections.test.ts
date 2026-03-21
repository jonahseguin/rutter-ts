// @vitest-environment node
import { describe, test, expect, vi, afterEach } from 'vitest'
import { RutterClient } from '../src/client'
import { RutterConnectionsApi } from '../src/connections'

const clientId = process.env.RUTTER_CLIENT_ID
const clientSecret = process.env.RUTTER_CLIENT_SECRET
const hasCredentials = !!(clientId && clientSecret)

const mockClient = new RutterClient(
  'https://sandbox.rutterapi.com',
  'test-client-id',
  'test-client-secret',
)
const mockConnections = new RutterConnectionsApi(mockClient)

const sandboxClient = new RutterClient(
  'https://sandbox.rutterapi.com',
  clientId ?? '',
  clientSecret ?? '',
)
const sandboxConnections = new RutterConnectionsApi(sandboxClient)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('connections.create', () => {
  test('POSTs /connections and returns parsed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            connection: {
              id: 'conn_123',
              access_token: 'at_abc',
              link_url: 'https://link.rutterapi.com/abc',
              name: null,
            },
          }),
      }),
    )

    const result = await mockConnections.create({ platform: 'QUICKBOOKS' })

    expect(result.connection.id).toBe('conn_123')
    expect(result.connection.access_token).toBe('at_abc')
    expect(result.connection.link_url).toContain('rutterapi.com')
  })

  test('throws RutterError on API error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error_type: 'AUTHENTICATION_ERROR',
            error_code: 'invalid_credentials',
            error_message: 'Invalid client credentials.',
          }),
      }),
    )

    await expect(
      mockConnections.create({ platform: 'QUICKBOOKS' }),
    ).rejects.toThrow('Invalid client credentials.')
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ unexpected: 'shape' }),
      }),
    )

    await expect(
      mockConnections.create({ platform: 'QUICKBOOKS' }),
    ).rejects.toThrow(
      'Rutter response from /connections/create failed schema validation',
    )
  })
})

describe('connections.list', () => {
  describe.runIf(hasCredentials)('integration', () => {
    test('GETs /connections and returns a list', async () => {
      const result = await sandboxConnections.list()

      expect(result.connections).toBeDefined()
      expect(Array.isArray(result.connections)).toBe(true)
    })
  })

  test('GETs /connections and returns parsed list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            connections: [
              {
                id: 'conn_1',
                access_token: 'at_1',
                link_url: 'https://link.rutterapi.com/1',
                platform: 'QUICKBOOKS',
                status: 'active',
                name: 'My QB Connection',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
              },
            ],
          }),
      }),
    )

    const result = await mockConnections.list()

    expect(result.connections).toHaveLength(1)
    expect(result.connections[0]!.platform).toBe('QUICKBOOKS')
    expect(result.connections[0]!.status).toBe('active')
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ connections: 'not-an-array' }),
      }),
    )

    await expect(mockConnections.list()).rejects.toThrow(
      'Rutter response from /connections failed schema validation',
    )
  })
})

describe('connections.get', () => {
  test('GETs /connections with access_token and returns connection details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            connection: {
              id: 'conn_123',
              store_unique_id: 'store_abc',
              disabled: false,
              link_url: 'https://link.rutterapi.com/abc',
              needs_update: false,
              platform: 'QUICKBOOKS',
              store_domain: null,
              store_name: 'Test Store',
              unavailable_objects: null,
            },
          }),
      }),
    )

    const result = await mockConnections.get('at_abc')

    expect(result.connection.id).toBe('conn_123')
    expect(result.connection.platform).toBe('QUICKBOOKS')
    expect(result.connection.disabled).toBe(false)
  })

  test('passes access_token as query param', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          connection: {
            id: 'conn_123',
            store_unique_id: 'store_abc',
            disabled: false,
            link_url: 'https://link.rutterapi.com/abc',
            needs_update: false,
            platform: 'XERO',
            store_domain: null,
            store_name: null,
            unavailable_objects: null,
          },
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await mockConnections.get('at_my_token')

    const [calledUrl] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toContain('access_token=at_my_token')
  })

  test('handles null initial_orders_synced_count and disabled_reason from API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            connection: {
              id: 'conn_456',
              store_unique_id: 'store_xyz',
              disabled: false,
              disabled_reason: null,
              link_url: 'https://link.rutterapi.com/456',
              needs_update: false,
              platform: 'QUICKBOOKS',
              store_domain: '',
              store_name: '',
              unavailable_objects: null,
              initial_orders_synced_count: null,
              created_at: '2024-01-01T00:00:00Z',
              last_sync_completed_at: '2024-01-02T00:00:00Z',
              last_sync_started_at: '2024-01-02T00:00:00Z',
              oldest_order_date: null,
              newest_order_date: null,
              estimated_completed_at: null,
            },
          }),
      }),
    )

    const result = await mockConnections.get('at_456')

    expect(result.connection.id).toBe('conn_456')
    expect(result.connection.initial_orders_synced_count).toBeNull()
    expect(result.connection.disabled_reason).toBeNull()
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ unexpected: 'shape' }),
      }),
    )

    await expect(mockConnections.get('at_abc')).rejects.toThrow(
      'Rutter response from /connections/access_token failed schema validation',
    )
  })
})

describe('connections.exchangeToken', () => {
  test('POSTs /item/public_token/exchange and returns access token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            connection_id: 'conn_456',
            access_token: 'at_exchanged',
            is_ready: true,
            platform: 'XERO',
            name: null,
          }),
      }),
    )

    const result = await mockConnections.exchangeToken({
      public_token: 'pt_abc123',
    })

    expect(result.connection_id).toBe('conn_456')
    expect(result.access_token).toBe('at_exchanged')
    expect(result.is_ready).toBe(true)
    expect(result.platform).toBe('XERO')
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ missing: 'fields' }),
      }),
    )

    await expect(
      mockConnections.exchangeToken({ public_token: 'pt_abc' }),
    ).rejects.toThrow('Rutter response from /item/public_token/exchange')
  })
})

describe('connections.delete', () => {
  test('DELETEs /connections with access_token and returns success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    )

    const result = await mockConnections.delete('at_to_delete')

    expect(result.success).toBe(true)
  })

  test('passes access_token as query param', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await mockConnections.delete('at_del_token')

    const [calledUrl, calledOpts] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(calledUrl).toContain('access_token=at_del_token')
    expect(calledOpts.method).toBe('DELETE')
  })

  test('throws RutterError on API error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 452,
        json: () =>
          Promise.resolve({
            error_type: 'CONNECTION_ERROR',
            error_code: 'connection_not_found',
            error_message: 'Connection not found.',
          }),
      }),
    )

    await expect(mockConnections.delete('at_missing')).rejects.toThrow(
      'Connection not found.',
    )
  })
})
