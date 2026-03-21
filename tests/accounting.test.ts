// @vitest-environment node
import { describe, test, expect, vi, afterEach } from 'vitest'
import { RutterClient } from '../src/client'
import { RutterAccountingApi } from '../src/accounting'

const client = new RutterClient(
  'https://sandbox.rutterapi.com',
  'test-client-id',
  'test-client-secret',
)
const accounting = new RutterAccountingApi(client)

const mockConnection = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  orgId: '660e8400-e29b-41d4-a716-446655440001',
  platform: 'QUICKBOOKS',
}

const mockAccount = {
  id: '770e8400-e29b-41d4-a716-446655440002',
  platform_id: 'plat_acc_1',
  account_type: 'bank',
  category: 'asset',
  status: 'active',
  balance: 50000,
  currency_code: 'USD',
  name: 'Operating Account',
  nominal_code: '1000',
  subsidiaries: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
  last_synced_at: '2024-06-01T00:00:00Z',
  platform_url: null,
}

const mockInvoice = {
  id: 'inv_1',
  platform_id: 'plat_inv_1',
  account_id: '880e8400-e29b-41d4-a716-446655440003',
  customer_id: 'cust_1',
  subsidiary_id: null,
  due_date: '2024-07-01',
  issue_date: '2024-06-01',
  status: 'open',
  amount_due: 5000,
  currency_code: 'USD',
  discount_amount: 0,
  document_number: 'INV-001',
  memo: null,
  sub_total: 5000,
  tax_amount: 0,
  total_amount: 5000,
  linked_payments: [],
  line_items: [],
  created_at: '2024-06-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
  last_synced_at: '2024-06-01T00:00:00Z',
  platform_url: null,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('accounting.getCompanyInfo', () => {
  const mockCompanyInfo = {
    id: 'ci_1',
    platform_id: 'plat_1',
    currency_code: 'USD',
    name: 'Acme Corp',
    legal_name: 'Acme Corporation Inc.',
    addresses: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    last_synced_at: '2024-06-01T00:00:00Z',
  }

  test('GETs /accounting/company_info and returns parsed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            company_info: mockCompanyInfo,
            connection: mockConnection,
          }),
      }),
    )

    const result = await accounting.getCompanyInfo('at_abc')

    expect(result.company_info.name).toBe('Acme Corp')
    expect(result.connection.id).toBe(mockConnection.id)
  })

  test('passes access_token as query param', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          company_info: mockCompanyInfo,
          connection: mockConnection,
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await accounting.getCompanyInfo('at_my_token')

    const [calledUrl] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toContain('access_token=at_my_token')
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ unexpected: 'shape' }),
      }),
    )

    await expect(accounting.getCompanyInfo('at_abc')).rejects.toThrow(
      'Rutter response from /accounting/company_info failed schema validation',
    )
  })
})

describe('accounting.listAccounts', () => {
  test('GETs /accounting/accounts and returns parsed list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            accounts: [mockAccount],
            next_cursor: null,
            connection: mockConnection,
          }),
      }),
    )

    const result = await accounting.listAccounts('at_abc')

    expect(result.accounts).toHaveLength(1)
    expect(result.accounts[0]!.name).toBe('Operating Account')
    expect(result.accounts[0]!.account_type).toBe('bank')
  })

  test('passes pagination and filter params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          accounts: [],
          next_cursor: null,
          connection: mockConnection,
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await accounting.listAccounts('at_abc', { cursor: 'cur_abc' })

    const [calledUrl] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toContain('cursor=cur_abc')
    expect(calledUrl).toContain('access_token=at_abc')
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accounts: 'not-an-array' }),
      }),
    )

    await expect(accounting.listAccounts('at_abc')).rejects.toThrow(
      'Rutter response from /accounting/accounts failed schema validation',
    )
  })
})

describe('accounting.getAccount', () => {
  test('GETs /accounting/accounts/:id and returns parsed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            account: {
              ...mockAccount,
              account_type: 'income',
              name: 'Revenue',
            },
            connection: mockConnection,
          }),
      }),
    )

    const result = await accounting.getAccount('at_abc', mockAccount.id)

    expect(result.account.id).toBe(mockAccount.id)
    expect(result.account.account_type).toBe('income')
  })

  test('throws RutterError on API error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            error_type: 'NOT_FOUND',
            error_code: 'account_not_found',
            error_message: 'Account not found.',
          }),
      }),
    )

    await expect(
      accounting.getAccount('at_abc', 'acc_missing'),
    ).rejects.toThrow('Account not found.')
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ unexpected: 'shape' }),
      }),
    )

    await expect(accounting.getAccount('at_abc', 'acc_1')).rejects.toThrow(
      'Rutter response from /accounting/accounts/acc_1 failed schema validation',
    )
  })
})

describe('accounting.listInvoices', () => {
  test('GETs /accounting/invoices and returns parsed list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            invoices: [mockInvoice],
            next_cursor: null,
            connection: mockConnection,
          }),
      }),
    )

    const result = await accounting.listInvoices('at_abc')

    expect(result.invoices).toHaveLength(1)
    expect(result.invoices[0]!.document_number).toBe('INV-001')
    expect(result.invoices[0]!.status).toBe('open')
  })

  test('passes pagination params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          invoices: [],
          next_cursor: null,
          connection: mockConnection,
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await accounting.listInvoices('at_abc', { cursor: 'cur_inv' })

    const [calledUrl] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toContain('cursor=cur_inv')
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invoices: 'not-an-array' }),
      }),
    )

    await expect(accounting.listInvoices('at_abc')).rejects.toThrow(
      'Rutter response from /accounting/invoices failed schema validation',
    )
  })
})

describe('accounting.getInvoice', () => {
  test('GETs /accounting/invoices/:id and returns parsed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            invoice: { ...mockInvoice, status: 'paid' },
            connection: mockConnection,
          }),
      }),
    )

    const result = await accounting.getInvoice('at_abc', 'inv_1')

    expect(result.invoice.id).toBe('inv_1')
    expect(result.invoice.status).toBe('paid')
  })

  test('throws on response schema mismatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ unexpected: 'shape' }),
      }),
    )

    await expect(accounting.getInvoice('at_abc', 'inv_1')).rejects.toThrow(
      'Rutter response from /accounting/invoices/inv_1 failed schema validation',
    )
  })
})

describe('accounting.createInvoice', () => {
  test('POSTs /accounting/invoices and returns parsed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            invoice: mockInvoice,
          }),
      }),
    )

    const result = await accounting.createInvoice('at_abc', {
      customer_id: 'cust_1',
      due_date: '2024-08-01',
      issue_date: '2024-07-01',
      currency_code: 'USD',
      line_items: [],
    })

    expect(result).toBeDefined()
  })

  test('passes access_token as query param in URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invoice: mockInvoice }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await accounting.createInvoice('at_create_token', {
      customer_id: 'cust_1',
      issue_date: '2024-07-01',
      currency_code: 'USD',
      line_items: [],
    })

    const [calledUrl] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toContain('access_token=at_create_token')
  })

  test('wraps params in { invoice: ... } in request body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invoice: mockInvoice }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await accounting.createInvoice('at_abc', {
      customer_id: 'cust_1',
      issue_date: '2024-07-01',
      currency_code: 'USD',
      line_items: [{ total_amount: 100, description: 'Test' }],
    })

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    expect(body).toHaveProperty('invoice')
    expect(body.invoice).toMatchObject({
      customer_id: 'cust_1',
      line_items: [{ total_amount: 100, description: 'Test' }],
    })
  })

  test('sends Idempotency-Key header when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invoice: mockInvoice }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await accounting.createInvoice(
      'at_abc',
      {
        customer_id: 'cust_1',
        issue_date: '2024-07-01',
        currency_code: 'USD',
        line_items: [],
      },
      { idempotencyKey: 'idem_inv_123' },
    )

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    expect(headers['Idempotency-Key']).toBe('idem_inv_123')
  })

  test('throws RutterError on API error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error_type: 'INVALID_REQUEST_ERROR',
            error_code: 'invalid_field',
            error_message: 'customer_id is required.',
          }),
      }),
    )

    await expect(
      accounting.createInvoice('at_abc', {
        line_items: [],
        customer_id: 'x',
        issue_date: '2024-01-01',
        currency_code: 'USD',
      }),
    ).rejects.toThrow('customer_id is required.')
  })
})
