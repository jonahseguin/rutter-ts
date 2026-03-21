import z from 'zod'
import type { RutterClient } from './client'
import type { RutterPaginationParams, RutterQueryParams } from './types'
import { RutterSchemaMismatchError } from './errors'
import {
  zCompanyInfo20240430ResponseWithConnection,
  zListAccountResponseWithConnection,
  zAccountResponseWithConnection,
  zListInvoiceResponseWithConnection,
  zInvoiceResponseWithConnection,
  zCreateInvoiceResponse,
  zCreateAccountingCustomerResponse,
} from './generated/zod.gen'
import type {
  CreateInvoice,
  CreateAccountingCustomer,
} from './generated/types.gen'

type TCompanyInfoResponse = z.infer<
  typeof zCompanyInfo20240430ResponseWithConnection
>
type TListAccountsResponse = z.infer<typeof zListAccountResponseWithConnection>
type TAccountResponse = z.infer<typeof zAccountResponseWithConnection>
type TListInvoicesResponse = z.infer<typeof zListInvoiceResponseWithConnection>
type TInvoiceResponse = z.infer<typeof zInvoiceResponseWithConnection>
type TCreateInvoiceResponse = z.infer<typeof zCreateInvoiceResponse>
type TCreateCustomerResponse = z.infer<typeof zCreateAccountingCustomerResponse>

export class RutterAccountingApi {
  constructor(private readonly client: RutterClient) {}

  async getCompanyInfo(accessToken: string): Promise<TCompanyInfoResponse> {
    const endpoint = '/accounting/company_info'
    const response = await this.client.get<unknown>(endpoint, {
      access_token: accessToken,
    })

    const result =
      zCompanyInfo20240430ResponseWithConnection.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async listAccounts(
    accessToken: string,
    params?: RutterPaginationParams & RutterQueryParams,
  ): Promise<TListAccountsResponse> {
    const endpoint = '/accounting/accounts'
    const response = await this.client.get<unknown>(endpoint, {
      access_token: accessToken,
      ...params,
    })

    const result = zListAccountResponseWithConnection.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async getAccount(accessToken: string, id: string): Promise<TAccountResponse> {
    const endpoint = `/accounting/accounts/${id}`
    const response = await this.client.get<unknown>(endpoint, {
      access_token: accessToken,
    })

    const result = zAccountResponseWithConnection.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async listInvoices(
    accessToken: string,
    params?: RutterPaginationParams & RutterQueryParams,
  ): Promise<TListInvoicesResponse> {
    const endpoint = '/accounting/invoices'
    const response = await this.client.get<unknown>(endpoint, {
      access_token: accessToken,
      ...params,
    })

    const result = zListInvoiceResponseWithConnection.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async getInvoice(accessToken: string, id: string): Promise<TInvoiceResponse> {
    const endpoint = `/accounting/invoices/${id}`
    const response = await this.client.get<unknown>(endpoint, {
      access_token: accessToken,
    })

    const result = zInvoiceResponseWithConnection.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async createInvoice(
    accessToken: string,
    params: CreateInvoice,
    idempotencyKey?: string,
  ): Promise<TCreateInvoiceResponse> {
    const endpoint = '/accounting/invoices'
    const response = await this.client.post<unknown>(
      `${endpoint}?access_token=${encodeURIComponent(accessToken)}`,
      params,
      idempotencyKey ? { idempotencyKey } : undefined,
    )

    const result = zCreateInvoiceResponse.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async createCustomer(
    accessToken: string,
    params: CreateAccountingCustomer,
  ): Promise<TCreateCustomerResponse> {
    const endpoint = '/accounting/customers'
    const response = await this.client.post<unknown>(
      `${endpoint}?access_token=${encodeURIComponent(accessToken)}`,
      { customer: params },
    )

    const result = zCreateAccountingCustomerResponse.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }
}
